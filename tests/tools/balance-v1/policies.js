'use strict';
/**
 * tests/tools/balance-v1/policies.js
 *
 * 四种策略。设计约束（对应方案 §3.2，以及 §2 列出的旧工具缺陷）：
 *   1. 不使用游戏 RNG，也不偷看游戏随机流的未来；决策随机性全部来自独立决策 RNG。
 *   2. 不硬编码「强卡名单」，也不固定偏爱 resonance。任何加分都必须由
 *      「池内已有供料／消费者、可触发概率、标签与效果」推导；五个路线组对称评分。
 *   3. 非法／不可用的动作不发送；策略只从当前可见信息里挑合法项。
 *   4. Greedy 的副本前瞻固定预算：每候选 GREEDY_SAMPLES 次、最多 GREEDY_DEPTH 轮，
 *      在 clone 上推演，不提交状态、不推进正式 RNG。
 */

/** 路线分组：与 contract.js 的 SYMBOL_IDS 8 个一组一致，由 F.SYMBOL_IDS 推导，不手工维护名单。 */
const ROUTE_GROUPS = ['resonance', 'cargo', 'pressure', 'magic', 'contract'];

const ACTION_PROB_RANDOM = 0.10; // 随机刷新／移除概率固定 10%（有资源时，每窗口最多一次）
const SKIP_PROB_RANDOM = 0.10;   // 随机跳过概率 10%
const GREEDY_SAMPLES = 8;
const GREEDY_DEPTH = 2;
const OUTCOME_BIAS_REROLL_MARGIN = 0.5; // 前瞻样本权重（记录在报告里）

/**
 * 池稀释的边际判据。
 *
 * 依据 js/gdd1/offers.js 的 sliceDraw：棋盘固定 20 格，
 *   - 池 n <= 20 时，每张牌每轮必然上盘 → 加牌永远增加收入，无稀释；
 *   - 池 n > 20 时，每张牌上盘概率约 20/n → 加一张价值 v 的牌，期望变化
 *       Δ = 20·[ n·v − S ] / ( n·(n+1) )，其中 S 为池内总价值。
 *     因此只有 v > S/n（高于当前池均值）才真正提升期望收入。
 * 已用真实 sliceDraw 数值验证（池 6→7、加入低于/高于均值牌的方向一致）。
 *
 * 这是"继续加牌是否值得"的判据，避免策略在池已过阈值后仍无差别加牌。
 */
const BOARD_SLOTS = 20;

function marginalPoolGain(view, value) {
  const n = view.size;
  if (n < BOARD_SLOTS) return value; // 未满盘：必然上盘，直接计入
  const S = view.sumBase;
  return (BOARD_SLOTS * (n * value - S)) / (n * (n + 1));
}

/**
 * 决策阈值口径（记录在报告中，避免"改评分讨好结果"）：
 *   - 前期（池小）以建立产能为主，跳过与刷新都应克制；
 *   - 池已超过稀释阈值后，才允许为排除劣质候选而跳过/刷新。
 * 这修正的是「无可建树就空过」的实现缺陷，不是为了让某个策略赢。
 */
const REROLL_MIN_TOKENS = 2;
const REROLL_MIN_SPINS_LEFT = 2;

function buildRouteMap(F) {
  const map = new Map();
  const ids = Array.from(F.SYMBOL_IDS);
  for (let g = 0; g < ROUTE_GROUPS.length; g++) {
    for (let i = 0; i < 8; i++) {
      const id = ids[g * 8 + i];
      if (id) map.set(id, ROUTE_GROUPS[g]);
    }
  }
  return map;
}

function tagsOf(d) { return d.tags || []; }

/** 垃圾判定：候选被禁，或 base<=0 且完全没有任何效果。 */
function isJunkDef(d) {
  if (d.mechanics && d.mechanics.candidate === false) return true;
  if (typeof d.base === 'number' && d.base <= 0 && (!d.effects || !d.effects.length)) return true;
  return false;
}

/**
 * 逐类型解析「需求标签」「供给标签」与「倍率信息」。
 *
 * 关键设计（修正旧工具的共鸣偏置）：
 *   - wants（需求）只来自【效果真正作用/依赖的标签】。
 *   - offers（供给）来自【自身标签 + 效果产出的类型标签】。
 *   - 因此「两张同标签牌并存」本身不产生任何加分：A 只有在确实需要 T、
 *     而 B 确实提供 T 时，才形成一次配合（方案 §5 的供料→消耗定义）。
 *
 * 另外记录每个倍率的【标签】与【倍率增量】，用于按「被放大者的基础值」估值，
 * 而不是数连接条数——后者会让低基础值的支援牌看起来比产出牌更值钱。
 */
const profileCache = new WeakMap();

function typeProfiles(symbols) {
  const cached = profileCache.get(symbols);
  if (cached) return cached;
  const out = new Map();
  for (const [id, d] of Object.entries(symbols)) {
    const wants = new Set();
    const offers = new Set(tagsOf(d));
    const offerTypes = new Set();
    const multiplies = [];
    const consumeRewards = [];
    // 自身固定加值（selector=self 的 add）：条件满足时给自己 +amount
    const selfAdds = [];
    // 授予他人的固定加值（selector=adjacent/all/row…的 add）：给别人 +amount
    const grants = [];
    let reward = 0;
    let multiplyCount = 0;
    out.set(id, {
      wants, offers, offerTypes, multiplies, consumeRewards,
      selfAdds, grants, reward, multiplyCount
    });

    const addWant = t => { if (typeof t === 'string' && t) wants.add(t); };

    for (const e of d.effects || []) {
      const sel = e.selector || {};
      const m = e.match || {};
      if (typeof e.reward === 'number') reward += e.reward;

      if (sel.tag) addWant(sel.tag);
      if (m.beforeTag) addWant(m.beforeTag);
      if (m.actorTag) addWant(m.actorTag);
      if (m.notBeforeTag) addWant(m.notBeforeTag);
      if (e.predicate) {
        const c = e.predicate.count;
        if (c && c.scope && c.scope.tag) addWant(c.scope.tag);
        if (Array.isArray(e.predicate.all)) {
          for (const sub of e.predicate.all) {
            if (sub.count && sub.count.scope && sub.count.scope.tag) addWant(sub.count.scope.tag);
          }
        }
      }
      if (e.countAmount && e.countAmount.selector && e.countAmount.selector.tag) {
        addWant(e.countAmount.selector.tag);
      }
      if (e.op === 'consume' && typeof e.reward === 'number') {
        consumeRewards.push({
          tag: sel.tag || m.beforeTag || null, reward: e.reward, scope: sel.scope || 'adjacent'
        });
      }

      if (m.afterTag) offers.add(m.afterTag);
      if (e.op === 'transform' && e.type) {
        offerTypes.add(e.type);
        const td = symbols[e.type];
        if (td) for (const t of tagsOf(td)) offers.add(t);
      }
      if (e.spawn && e.spawn !== true) {
        offerTypes.add(e.spawn);
        const sd = symbols[e.spawn];
        if (sd) for (const t of tagsOf(sd)) offers.add(t);
      }

      // 固定加值：这是收入主体（实测 ratio>1 的条目只占总收入约 8.5%），
      // 必须按作用域区分「加给自己」与「加给别人」，否则会严重误估支援牌。
      if (e.op === 'add' && typeof e.amount === 'number' && e.amount !== 0) {
        const scope = sel.scope || 'self';
        const need = (e.predicate && e.predicate.count && e.predicate.count.min) || 0;
        const minCount = need || (e.predicate && e.predicate.count ? (e.predicate.count.min || 1) : 0);
        const condTag = (e.predicate && e.predicate.count && e.predicate.count.scope
          && e.predicate.count.scope.tag) || null;
        const isSelf = scope === 'self';
        const entry = { amount: e.amount, scope, condTag, minCount, each: !!e.each };
        if (isSelf) selfAdds.push(entry); else grants.push(entry);
      }

      if (e.op === 'multiply') {
        multiplyCount++;
        const gain = Array.isArray(e.ratio) && e.ratio[1]
          ? Math.max(0, (e.ratio[0] / e.ratio[1]) - 1) : 0;
        const need = (e.predicate && e.predicate.count && e.predicate.count.min) || 1;
        out.get(id).multiplies.push({
          tag: sel.tag || (e.predicate && e.predicate.count && e.predicate.count.scope
            ? e.predicate.count.scope.tag : null) || null,
          gain, scope: sel.scope || 'self', need: Math.max(1, need)
        });
      }
    }
  }
  profileCache.set(symbols, out);
  return out;
}

/**
 * 倍率可达份额：不同作用域在一轮里最多能影响多少张牌。
 * 这里只做保守的规模折算，不假装精确模拟结算顺序。
 */
/**
 * 倍率/条件效果的可触发概率折扣。
 *
 * 依据（来自 js/gdd1/offers.js 的 sliceDraw）：每轮会重新洗牌并重新抽取棋盘，
 * 位置条件（邻接/同排）并不能稳定满足。因此「我有配合项」不等于「它每轮都会生效」。
 * 方案 §3.2 要求 Synergy 计入「可触发概率」，此处按作用域与所需匹配数估算上界概率，
 * 避免给位置型支援牌过高估值（这是本轮实测中 synergy 反而弱于 value 的直接原因）。
 *
 * @param scope 作用域
 * @param need  需要同时存在的匹配张数（predicate.min，默认1）
 * @param have  池内匹配标签的实例数
 * @param total 池规模
 */
function triggerProbability(scope, need, have, total) {
  if (!total || !have) return 0;
  const n = Math.max(1, total);
  const pOne = Math.min(1, have / n);
  switch (scope) {
    case 'all': {
      // 全背包始终纳入抽取范围，但棋盘只有 20 格，池越大越抽不全
      const expected = Math.min(have, Math.min(20, n) * pOne);
      return need <= 1 ? Math.min(1, expected) : Math.min(1, expected / need);
    }
    case 'row': {
      const slots = 4; // 同一横排最多再放 4 张
      const p = 1 - Math.pow(1 - pOne, slots);
      return need <= 1 ? p : Math.pow(p, need);
    }
    case 'adjacent': {
      const slots = 4; // 上下左右 4 邻
      const p = 1 - Math.pow(1 - pOne, slots);
      return need <= 1 ? p : Math.pow(p, need);
    }
    case 'column': {
      const p = 1 - Math.pow(1 - pOne, 6);
      return need <= 1 ? p : Math.pow(p, need);
    }
    case 'self':
      return need <= 1 ? pOne : Math.pow(pOne, need);
    default: {
      const p = 1 - Math.pow(1 - pOne, 4);
      return need <= 1 ? p : Math.pow(p, need);
    }
  }
}

/** 建「当前可见局面」视图。只用 pool + 定义，不含游戏 RNG 状态、不含未来候选。 */
function buildView(F, state, routeMap) {
  const symbols = F.defs(state).symbols;
  const profiles = typeProfiles(symbols);
  const pool = state.pool;
  const tagPool = new Map();
  const routePool = new Map();
  const typeCount = new Map();
  const typeSet = new Set();
  let junkCount = 0;
  let sumBase = 0;
  const info = [];
  // 按标签累计「基础值」，用于给放大/供料估值（收入与基础值成正比，与连接条数无关）
  const baseByTag = new Map();
  for (const x of pool) {
    const d = symbols[x.type];
    const tags = tagsOf(d);
    const route = routeMap.get(x.type) || null;
    const b = typeof d.base === 'number' ? d.base : 0;
    for (const t of tags) {
      tagPool.set(t, (tagPool.get(t) || 0) + 1);
      baseByTag.set(t, (baseByTag.get(t) || 0) + b);
    }
    if (route) routePool.set(route, (routePool.get(route) || 0) + 1);
    typeCount.set(x.type, (typeCount.get(x.type) || 0) + 1);
    typeSet.add(x.type);
    if (isJunkDef(d)) junkCount++;
    sumBase += b;
    info.push({ uid: x.uid, type: x.type, d, route, junk: isJunkDef(d), base: b, tags, profile: profiles.get(x.type) });
  }
  const wantCount = new Map();
  const offerCount = new Map();
  // 每个标签上「消费者愿意支付的奖励」，用于给我提供的供给估值
  const rewardDemandByTag = new Map();
  for (const e of info) {
    if (!e.profile) continue;
    for (const t of e.profile.wants) wantCount.set(t, (wantCount.get(t) || 0) + 1);
    for (const t of e.profile.offers) offerCount.set(t, (offerCount.get(t) || 0) + 1);
    for (const cr of e.profile.consumeRewards) {
      if (cr.tag) rewardDemandByTag.set(cr.tag, (rewardDemandByTag.get(cr.tag) || 0) + cr.reward);
    }
  }
  return {
    symbols, profiles, tagPool, routePool, typeCount, typeSet, baseByTag,
    wantCount, offerCount, rewardDemandByTag, junkCount, sumBase, info, size: pool.length
  };
}

/**
 * 候选估值：直接估算「加入该牌后，每轮期望收入的变化」。
 *
 * 依据（已实测的引擎事实，不是调参得到的手感权重）：
 *   1. 单轮收入 = Σ(每张上盘牌的 base 与其加值) × 该牌的倍率；
 *      实测 ratio>1 的条目只占总收入的约 8.5%，base 是收入主体。
 *   2. sliceDraw 每轮从池中取 min(20, n) 张，故一张牌每轮上盘概率 ≈ min(1, 20/n)。
 *   3. 位置型条件（邻接/同排）因每轮重洗而无法稳定满足，需按概率折算。
 *
 * 因此：ownIncome = base × 上盘概率；配合项 = 触发概率 × 可兑现收益。
 * 两个策略共用同一估值函数，区别只在是否计入配合项：
 *   value   → 只看 ownIncome（"独立产出"基线）
 *   synergy → ownIncome + 配合项
 */
function appearProbability(poolSize) {
  if (poolSize <= BOARD_SLOTS) return 1;
  return BOARD_SLOTS / poolSize;
}

/**
 * @param includeCoop 是否计入供料/消费/放大等配合项
 * @returns raw      = 该牌「上盘时」的每轮价值（未按上盘概率折算，供稀释判据使用）
 *          expected = raw × 上盘概率，用于跨候选比较
 */
function expectedIncome(F, state, view, id, routeMap, includeCoop) {
  const symbols = F.defs(state).symbols;
  const d = symbols[id];
  const p = view.profiles.get(id);
  const tags = tagsOf(d);
  const route = routeMap.get(id) || null;
  const baseValue = typeof d.base === 'number' ? d.base : 0;
  const junk = isJunkDef(d);
  const rarityBonus = d.rarity === 'epic' ? 2 : d.rarity === 'rare' ? 1.5 : d.rarity === 'uncommon' ? 0.5 : 0;

  const nAfter = view.size + 1;
  const pSelf = appearProbability(nAfter);
  // 自身产出：base 是收入主体（实测倍率只占约 8.5%）
  const own = baseValue + rarityBonus * 0.5;

  let amplify = 0;
  let consume = 0;
  let supply = 0;
  let enable = 0;
  let selfBonus = 0;
  let grantBonus = 0;

  if (includeCoop && p) {
    // ── 自身固定加值：条件（通常是某标签邻接/同排 N 张）满足时给自己 +amount。
    //    这是收入主体，必须计入，否则支援型牌会被系统性低估。
    for (const sa of p.selfAdds) {
      let prob = 1;
      if (sa.condTag) {
        const have = view.tagPool.get(sa.condTag) || 0;
        const scope = sa.scope === 'row' ? 'row'
          : sa.scope === 'all' ? 'all'
            : sa.scope === 'column' ? 'column' : 'adjacent';
        prob = triggerProbability(scope, sa.minCount || 1, have, nAfter);
      }
      selfBonus += sa.amount * prob;
    }
    // ── 授予他人的固定加值：给别人 +amount。
    //    只有"接收者仍然上盘"时才算得进来，按接收者上盘概率折算。
    for (const g of p.grants) {
      let targetCount;
      if (g.condTag) targetCount = view.tagPool.get(g.condTag) || 0;
      else targetCount = view.size;
      if (!targetCount) continue;
      const scope = g.scope;
      const prob = triggerProbability(scope === 'all' ? 'all' : scope, g.minCount || 1, targetCount, nAfter);
      // 接收者上盘概率
      const pTarget = appearProbability(nAfter);
      const covered = scope === 'all' ? targetCount : Math.min(targetCount, 4);
      grantBonus += covered * g.amount * prob * pTarget;
    }
    // ── 放大：我的倍率作用于现有牌（条件于我已上盘）
    for (const mul of p.multiplies) {
      const baseSum = mul.tag ? (view.baseByTag.get(mul.tag) || 0) : view.sumBase;
      const have = mul.tag ? (view.tagPool.get(mul.tag) || 0) : view.size;
      const prob = triggerProbability(mul.scope, mul.need, have, nAfter);
      const coverable = mul.scope === 'all' ? baseSum : baseSum * Math.min(1, 4 / Math.max(1, have));
      amplify += coverable * mul.gain * prob * 0.5;
    }
    // ── 消费：我需要的供料存在时能拿到的固定奖励 × 触发概率
    for (const cr of p.consumeRewards) {
      const have = cr.tag ? (view.tagPool.get(cr.tag) || 0) : view.size;
      const prob = triggerProbability(cr.scope, 1, have, nAfter);
      consume += cr.reward * prob;
    }
    // ── 供料：我提供的标签正是现有消费者所需，按它们兑现时的奖励折算
    for (const t of p.offers) {
      const demand = view.rewardDemandByTag.get(t) || 0;
      if (demand > 0) supply += Math.min(demand, 20) * 0.25;
    }
    for (const ty of p.offerTypes) {
      if (view.typeCount.get(ty)) supply += 1.5;
    }
    // ── 使能：我让现有条件效果从"不满足"变为"满足"
    for (const t of p.wants) {
      const offerers = view.offerCount.get(t) || 0;
      const selfOffers = p.offers.has(t) ? 1 : 0;
      if (Math.max(0, offerers - selfOffers) > 0) enable += 0.5;
    }
  }

  const coop = selfBonus + grantBonus + amplify + consume + supply + enable;
  const raw = junk ? -1000 : (own + coop);
  return {
    id, route, tags, baseValue, junk, rarityBonus, pSelf,
    own, selfBonus, grantBonus, amplify, consume, supply, enable, coop,
    raw,
    total: raw * (junk ? 1 : pSelf),
    expected: junk ? -1000 : raw * pSelf
  };
}

/** 优先删除：垃圾 > 期望收入最低 > 与当前路线无关。全路线对称。 */
function removalPriority(F, state, view, entry, routeMap) {
  if (entry.junk) return 1000;
  const ev = expectedIncome(F, state, view, entry.type, routeMap, true);
  const routeDepth = entry.route ? (view.routePool.get(entry.route) || 0) : 0;
  return -ev.total + Math.max(0, 3 - routeDepth) * 0.5;
}

function makePolicy(kind, F, rngFactory) {
  const routeMap = buildRouteMap(F);
  const dec = rngFactory('decision');
  const actions = {
    decisions: 0, choose: 0, skip: 0, remove: 0, reroll: 0,
    item: 0, skipItem: 0, eventAccept: 0, eventReject: 0,
    lookaheadDecisions: 0, lookaheadCandidates: 0, lookaheadRuns: 0, lookaheadFailures: 0
  };
  let windowRefreshed = false;
  let lastWindowId = -1;

  function noteWindow(state) {
    if (state.offer && state.offer.windowId !== lastWindowId) {
      lastWindowId = state.offer.windowId;
      windowRefreshed = false;
    }
  }

  function scoreState(state) {
    const view = buildView(F, state, routeMap);
    return state.cash + (state.stageId * 100 + state.stageSpin * 5) + view.sumBase * 0.5 - view.junkCount * 3;
  }

  /**
   * 两种评分口径，共用 expectedIncome 估值函数：
   *   value   = 只看自身期望产出（不含任何配合项），代表"独立产出"基线
   *   synergy = 自身产出 + 配合项（且配合项按触发概率折算）
   * 两者都不含手工强卡名单，且对五个路线组对称。
   */
  function valueScore(state, view, id) {
    return expectedIncome(F, state, view, id, routeMap, false).total;
  }
  function synergyScore(state, view, id) {
    return expectedIncome(F, state, view, id, routeMap, true).total;
  }
  function staticScore(state, view, id) {
    return kind === 'value' ? valueScore(state, view, id) : synergyScore(state, view, id);
  }

  /** 前瞻内部延续用：80% 取静态最优，20% 在其余候选里均匀抽（用独立采样 RNG）。 */
  function sampledPick(state, view, choices, rng) {
    const scored = choices.map(id => ({ id, s: staticScore(state, view, id) }));
    scored.sort((a, b) => b.s - a.s);
    if (scored.length === 1 || rng.float() < 0.8) return scored[0].id;
    return rng.pick(scored.slice(1)).id;
  }

  /** 在副本上提交一次选择并延续至多 GREEDY_DEPTH 轮；不触碰正式 state。 */
  function simulateCommit(state, id, windowId, sampleIndex) {
    const simRng = rngFactory('lookahead|' + windowId + '|' + state.spin + '|' + sampleIndex);
    let sim;
    try {
      const r = F.fullCommand(state, { revision: state.revision, windowId, op: 'choose', id });
      if (!r || !r.ok) { actions.lookaheadFailures++; return null; }
      sim = r.state;
    } catch (e) { actions.lookaheadFailures++; return null; }

    let depth = 0;
    let guard = 0;
    while (sim.phase !== 'WON' && sim.phase !== 'LOST' && depth < GREEDY_DEPTH && guard++ < 40) {
      let c = null;
      if (sim.phase === 'READY') c = { op: 'spin' };
      else if (sim.phase === 'SYMBOL_CHOICE') {
        const v = buildView(F, sim, routeMap);
        c = { op: 'choose', id: sampledPick(sim, v, sim.offer.choices, simRng) };
      } else if (sim.phase === 'ITEM_CHOICE') c = { op: 'item', id: sim.offer.choices[0] };
      else if (sim.phase === 'EVENT_CHOICE') c = { op: 'event', option: 'B', id: sim.events.choice.id };
      else break;
      let r2;
      try { r2 = F.fullCommand(sim, Object.assign({ revision: sim.revision, windowId: sim.offer.windowId }, c)); }
      catch (e) { actions.lookaheadFailures++; return null; }
      if (!r2 || !r2.ok) { actions.lookaheadFailures++; return null; }
      sim = r2.state;
      if (c.op === 'choose' || c.op === 'skip') depth++;
    }
    return scoreState(sim);
  }

  function chooseGreedy(state, view, choices, windowId, fallback) {
    const baseline = scoreState(state);
    let best = fallback === undefined ? choices[0] : fallback;
    let bestScore = -Infinity;
    for (const id of choices) {
      const base = staticScore(state, view, id);
      let sum = 0;
      let ok = 0;
      for (let i = 0; i < GREEDY_SAMPLES; i++) {
        const sim = simulateCommit(state, id, windowId, i);
        actions.lookaheadRuns++;
        if (sim === null) continue;
        ok++;
        sum += sim - baseline;
      }
      actions.lookaheadCandidates++;
      const total = ok > 0 ? base + (sum / ok) * OUTCOME_BIAS_REROLL_MARGIN : base;
      if (total > bestScore) { bestScore = total; best = id; }
    }
    actions.lookaheadDecisions++;
    return best;
  }

  function decideSymbol(state) {
    noteWindow(state);
    const view = buildView(F, state, routeMap);
    const choices = state.offer.choices.slice();
    if (!choices.length) return null;

    const fullBoard = view.size >= BOARD_SLOTS;

    // 刷新条件（有意收紧，避免"候选不够好就空过"）：
    //   仅当仍有产出空间、且候选全部无建树时才刷新；保留至少 REROLL_MIN_TOKENS 张券。
    if (state.rerollTokens > REROLL_MIN_TOKENS && !windowRefreshed && state.offer.choiceRefreshesUsed < 3) {
      let want = false;
      if (kind === 'random') want = dec.chance(ACTION_PROB_RANDOM);
      else if ((kind === 'synergy' || kind === 'greedy') && !fullBoard) {
        const scores = choices.map(id => staticScore(state, view, id));
        const best = Math.max.apply(null, scores);
        want = best <= 0 && choiceStillValuable(state, view);
      }
      if (want) {
        windowRefreshed = true;
        actions.reroll++; actions.decisions++;
        return { command: { op: 'reroll', windowId: state.offer.windowId }, tag: 'reroll' };
      }
    }

    let pick;
    if (kind === 'random') pick = dec.pick(choices);
    else {
      pick = choices[0];
      let best = -Infinity;
      for (const id of choices) {
        const s = staticScore(state, view, id);
        if (s > best) { best = s; pick = id; }
      }
      // greedy 与 synergy 共用同一候选评分口径，区别只在 greedy 额外做有界副本前瞻
      if (kind === 'greedy') pick = chooseGreedy(state, view, choices, state.offer.windowId, pick);
    }

    const ev = expectedIncome(F, state, view, pick, routeMap, kind !== 'value');

    // 跳过只在三种情况下发生：
    //   1) random：固定 10% 概率
    //   2) 候选是垃圾（candidate===false / base<=0 且无效果）
    //   3) 满盘之后，该候选的边际增量 <= 0（会稀释期望收入，判据见 marginalPoolGain）
    // 注意：marginalPoolGain 需要的是「上盘时的价值」raw，不能再用上盘概率折算一次。
    let shouldSkip = false;
    if (kind === 'random') shouldSkip = dec.chance(SKIP_PROB_RANDOM);
    else if (ev.junk) shouldSkip = true;
    else if (fullBoard && marginalPoolGain(view, ev.raw) <= 0) shouldSkip = true;
    if (shouldSkip) {
      actions.skip++; actions.decisions++;
      return { command: { op: 'skip', windowId: state.offer.windowId }, tag: 'skip' };
    }
    actions.choose++; actions.decisions++;
    return { command: { op: 'choose', id: pick, windowId: state.offer.windowId }, tag: 'choose' };
  }

  /** 本窗口之后还有没有值得投入的轮次（用于刷新判断，避免末期空刷）。 */
  function choiceStillValuable(state, view) {
    return state.spinsRemaining >= REROLL_MIN_SPINS_LEFT && view.size < BOARD_SLOTS;
  }

  function decideReady(state) {
    if (state.removeTokens > 0 && state.pool.length > 1) {
      const view = buildView(F, state, routeMap);
      const ranked = view.info
        .map(e => ({ e, s: removalPriority(F, state, view, e, routeMap) }))
        .sort((a, b) => b.s - a.s);
      const top = ranked[0];
      if (top) {
        // random 固定 10% 概率移除；其余策略只在有实际该删的目标时移除
        const want = kind === 'random' ? dec.chance(ACTION_PROB_RANDOM) : (top.e.junk || top.s > 0);
        if (want) {
          actions.remove++; actions.decisions++;
          return { command: { op: 'remove', uid: top.e.uid, confirmEmpty: false }, tag: 'remove' };
        }
      }
    }
    actions.decisions++;
    return { command: { op: 'spin' }, tag: 'spin' };
  }

  function decideItem(state) {
    const view = buildView(F, state, routeMap);
    const choices = state.offer.choices.slice();
    if (!choices.length) return { command: { op: 'skipItem', windowId: state.offer.windowId }, tag: 'skipItem' };
    let pick = choices[0];
    if (kind !== 'random') {
      let best = -Infinity;
      for (const id of choices) {
        const d = F.defs(state).items[id];
        let s = (d.effects || []).length * 2;
        s += d.rarity === 'epic' ? 3 : d.rarity === 'rare' ? 2 : d.rarity === 'uncommon' ? 1 : 0;
        // 与池内标签的配合（全路线对称）
        for (const e of d.effects || []) {
          const t = (e.selector && e.selector.tag) || (e.match && (e.match.beforeTag || e.match.afterTag));
          if (t && (view.tagPool.get(t) || 0) > 0) s += 2;
        }
        if (d.mechanics) {
          if (d.mechanics.pressure) s += 2;
          if (d.mechanics.paymentResource) s += 1;
          if (d.mechanics.skipOrdinals) s += 1.5;
        }
        if (s > best) { best = s; pick = id; }
      }
    } else if (dec.chance(ACTION_PROB_RANDOM)) {
      actions.skipItem++; actions.decisions++;
      return { command: { op: 'skipItem', windowId: state.offer.windowId }, tag: 'skipItem' };
    }
    actions.item++; actions.decisions++;
    return { command: { op: 'item', id: pick, windowId: state.offer.windowId }, tag: 'item' };
  }

  /**
   * EVENT_CHOICE：按「实际代价 vs 收益」权衡，不再一律拒绝。
   * 判定只用事件定义（cost/op/tag）、当前现金与池内标签，不看结果。
   */
  function decideEvent(state) {
    const choice = state.events.choice;
    const e = F.defs(state).events[choice.id];
    const view = buildView(F, state, routeMap);
    const cost = e.cost || 0;
    const affordable = state.cash - cost >= 0;
    const hasTarget = choice.targetUids.length > 0 || e.allowEmptyTarget === true;
    const relevant = (e.tag && (view.tagPool.get(e.tag) || 0) > 0) || choice.targetUids.length > 0;

    let accept;
    if (kind === 'random') accept = affordable && hasTarget && dec.chance(0.5);
    else {
      accept = affordable && hasTarget && relevant;
      // 压力类事件在池内没有压力标签时收益有限
      if (e.op === 'boiler' && (view.tagPool.get('pressure') || 0) === 0 && choice.targetUids.length === 0) accept = false;
      if (kind === 'value' && cost > 0 && state.cash - cost < state.payment * 0.5) accept = false;
    }

    if (accept) {
      actions.eventAccept++; actions.decisions++;
      const command = { op: 'event', option: 'A', id: choice.id };
      if (choice.targetUids.length) command.uid = choice.targetUids[0];
      return { command, tag: 'eventAccept' };
    }
    actions.eventReject++; actions.decisions++;
    return { command: { op: 'event', option: 'B', id: choice.id }, tag: 'eventReject' };
  }

  return {
    kind,
    routeMap,
    actions,
    decide(state) {
      switch (state.phase) {
        case 'READY': return decideReady(state);
        case 'SYMBOL_CHOICE': return decideSymbol(state);
        case 'ITEM_CHOICE': return decideItem(state);
        case 'EVENT_CHOICE': return decideEvent(state);
        default: return null;
      }
    }
  };
}

module.exports = {
  makePolicy, buildRouteMap, expectedIncome, buildView, isJunkDef, typeProfiles,
  triggerProbability, marginalPoolGain, appearProbability,
  ROUTE_GROUPS, ACTION_PROB_RANDOM, SKIP_PROB_RANDOM, GREEDY_SAMPLES, GREEDY_DEPTH,
  OUTCOME_BIAS_REROLL_MARGIN, BOARD_SLOTS
};
