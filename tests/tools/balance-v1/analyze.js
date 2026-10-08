'use strict';
/**
 * tests/tools/balance-v1/analyze.js
 *
 * 核查旧结论是否被本轮证据支持。只读逐局 JSONL 与聚合，不跑新对局、不改参数。
 *
 * 重要方法学边界（必须随结论一起报告）：
 *   - 这里得到的是【观察性】证据：Bot 并非按路线均匀取样，路线构成是策略选择的结果。
 *   - 因此路线间胜率差异混合了「路线强度」与「策略偏好」两个来源。
 *   - 方案 §6.2 要求的路线强弱判定需要【配对消融探针】（同策略同 seed 只换指定数值）
 *     与 8 个路线偏向策略；那属于工作包B，本轮不据此下"共鸣过强"的结论。
 */

const ROUTE_GROUPS = ['resonance', 'cargo', 'pressure', 'magic', 'contract'];

function routeOfType(F, type) {
  const idx = Array.from(F.SYMBOL_IDS).indexOf(type);
  if (idx < 0 || idx >= 40) return null;
  return ROUTE_GROUPS[Math.floor(idx / 8)];
}

/** 加权平均辅助 */
function mean(xs) { return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null; }

/**
 * @param {object[]} records 逐局记录
 * @param {object} F 引擎（用于 SYMBOL_IDS → 路线映射）
 */
function analyzeRoutes(records, F) {
  const usable = records.filter(r => r.outcome !== 'ERROR');
  const out = {
    methodNote: '观察性证据：路线构成由策略选择决定，非随机分配；不能单独作为路线强度结论。',
    gamesUsable: usable.length,
    gamesWithError: records.length - usable.length,
    byRoute: {},
    mainRouteWinRate: {},
    resonanceConcentration: null,
    confound: []
  };

  // 1) 按路线：出现该路线作为主路线（≥50%，方案 §5 定义）的局数与该条件下的胜率
  const mainCount = {};
  const mainWins = {};
  // 另给「占比最高路线」（plurality）视角：多数局没有单一路线过半，≥50% 口径会几乎全空。
  const domCount = {};
  const domWins = {};
  for (const r of usable) {
    if (r.mainRoute) {
      mainCount[r.mainRoute] = (mainCount[r.mainRoute] || 0) + 1;
      if (r.outcome === 'WON') mainWins[r.mainRoute] = (mainWins[r.mainRoute] || 0) + 1;
    }
    // plurality：终局非垃圾牌里占比最高的路线（并列时取数量多者，仍不按 tag 重复计票）
    let dom = null, domN = 0;
    for (const [rt, n] of Object.entries(r.routes || {})) {
      if (n > domN) { dom = rt; domN = n; }
    }
    if (dom) {
      domCount[dom] = (domCount[dom] || 0) + 1;
      if (r.outcome === 'WON') domWins[dom] = (domWins[dom] || 0) + 1;
    }
  }
  for (const g of ROUTE_GROUPS) {
    const n = mainCount[g] || 0;
    const w = mainWins[g] || 0;
    out.mainRouteWinRate[g] = { games: n, wins: w, winRate: n ? w / n : null };
    const dn = domCount[g] || 0;
    const dw = domWins[g] || 0;
    out.dominantRouteWinRate = out.dominantRouteWinRate || {};
    out.dominantRouteWinRate[g] = { games: dn, wins: dw, winRate: dn ? dw / dn : null };
  }

  // 2) 逐类型收益归因按路线汇总（每实例平均贡献）
  const routeContrib = {};
  const routeInstances = {};
  for (const r of usable) {
    // 终局每个类型的实例数
    const counts = {};
    for (const t of r.poolTypes) counts[t] = (counts[t] || 0) + 1;
    for (const [t, c] of Object.entries(counts)) {
      const rt = routeOfType(F, t);
      if (!rt) continue;
      routeInstances[rt] = (routeInstances[rt] || 0) + c;
    }
    for (const [t, amount] of Object.entries(r.contribByType || {})) {
      const rt = routeOfType(F, t);
      if (!rt) continue;
      routeContrib[rt] = (routeContrib[rt] || 0) + amount;
    }
  }
  for (const g of ROUTE_GROUPS) {
    const inst = routeInstances[g] || 0;
    const contrib = routeContrib[g] || 0;
    out.byRoute[g] = {
      terminalInstances: inst,
      totalAttributedIncome: contrib,
      incomePerInstance: inst ? contrib / inst : null
    };
  }

  // 3) 共鸣集中度：终局池中共鸣路线占比的分布
  const shares = [];
  for (const r of usable) {
    const total = Object.values(r.routes).reduce((a, b) => a + b, 0);
    if (!total) continue;
    shares.push((r.routes.resonance || 0) / total);
  }
  shares.sort((a, b) => a - b);
  const q = p => (shares.length ? shares[Math.min(shares.length - 1, Math.floor(p * (shares.length - 1)))] : null);
  out.resonanceConcentration = {
    games: shares.length,
    meanShare: mean(shares),
    p10: q(0.10), p50: q(0.50), p90: q(0.90),
    shareOfGamesAbove50pct: shares.length ? shares.filter(s => s >= 0.5).length / shares.length : null
  };

  // 4) 混淆来源枚举：策略层面的路线构成差异
  const byPolicy = {};
  const shareSum = {};
  for (const r of usable) {
    if (!byPolicy[r.policy]) byPolicy[r.policy] = { games: 0, resonanceMain: 0, resonanceDominant: 0 };
    byPolicy[r.policy].games++;
    if (r.mainRoute === 'resonance') byPolicy[r.policy].resonanceMain++;
    let dom = null, domN = 0;
    for (const [rt, n] of Object.entries(r.routes || {})) if (n > domN) { dom = rt; domN = n; }
    if (dom === 'resonance') byPolicy[r.policy].resonanceDominant++;
    const totalRoutes = Object.values(r.routes || {}).reduce((a, b) => a + b, 0);
    if (totalRoutes) {
      shareSum[r.policy] = (shareSum[r.policy] || 0) + ((r.routes.resonance || 0) / totalRoutes);
    }
  }
  for (const [k, v] of Object.entries(byPolicy)) {
    out.confound.push({
      policy: k, games: v.games,
      resonanceMainRouteGames: v.resonanceMain,
      resonanceDominantGames: v.resonanceDominant,
      meanResonanceShare: (shareSum[k] || 0) / Math.max(1, v.games)
    });
  }

  return out;
}

/**
 * 检查「整体偏易」类结论：把强策略胜率与 GDD 目标带比较。
 * 只在无 ERROR 时给出可用判断。
 */
function analyzeDifficulty(policiesAgg) {
  const TARGET_LO = 0.40, TARGET_HI = 0.70, MIN_GAP = 0.15;
  const strong = policiesAgg.filter(p => p.policy === 'synergy' || p.policy === 'greedy');
  const randomAgg = policiesAgg.find(p => p.policy === 'random');
  const anyError = policiesAgg.some(p => p.error > 0);
  return {
    targetBand: [TARGET_LO, TARGET_HI],
    minSkillGap: MIN_GAP,
    usable: !anyError,
    note: anyError ? '存在 ERROR，本批胜率不可用于难度判断。' : '无 ERROR，胜率可用于初步判断。',
    strongPolicies: strong.map(p => ({
      policy: p.policy, winRate: p.winRate,
      inBand: p.winRate !== null && p.winRate >= TARGET_LO && p.winRate <= TARGET_HI,
      aboveBand: p.winRate !== null && p.winRate > TARGET_HI,
      belowBand: p.winRate !== null && p.winRate < TARGET_LO
    })),
    skillGapVsRandom: strong.map(p => ({
      policy: p.policy,
      gap: (p.winRate !== null && randomAgg && randomAgg.winRate !== null) ? p.winRate - randomAgg.winRate : null,
      meetsMinimum: (p.winRate !== null && randomAgg && randomAgg.winRate !== null)
        ? (p.winRate - randomAgg.winRate) >= MIN_GAP : null
    }))
  };
}

module.exports = { analyzeRoutes, analyzeDifficulty, routeOfType, ROUTE_GROUPS };
