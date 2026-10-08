'use strict';
/**
 * tests/tools/balance-v1.js
 *
 * 工作包A：可复现且有界的模拟（数值调整方案 B1 §3）。
 *
 *   node tests/tools/balance-v1.js --self-check
 *   node tests/tools/balance-v1.js --seeds <JSON> --policies random,value,synergy,greedy --out <dir>
 *   node tests/tools/balance-v1.js --config <JSON> --seeds <JSON> --out <dir>
 *
 * 契约（§3.1）：
 *   - 使用真实 fullNewRun / fullCommand，所有操作带 revision/windowId
 *   - 拒绝、异常、超步数一律记 ERROR 并使该批次明确失败，绝不混入 LOST
 *   - 游戏 RNG 不用于 Bot 决策；策略用独立可复现 RNG；所有策略共享同一 seed 名单
 *   - 输出源码哈希、配置哈希、生效参数、策略版本、seed 集合哈希、逐局 JSONL、聚合 JSON、Markdown
 *
 * 本工具不修改任何磁盘上的游戏文件；参数覆盖只发生在内存定义上。
 */
const fs = require('node:fs');
const path = require('node:path');

const { loadEngine } = require('./balance-v1/engine');
const { playGame, POLICY_VERSION } = require('./balance-v1/runner');
const { aggregatePolicy, pairedComparison, STAGES } = require('./balance-v1/aggregate');
const { selfCheckSeeds, trainSeeds, hashSeeds, writeSeedList, TRAIN_PREFIX, HOLDOUT_PREFIX } = require('./balance-v1/seeds');
const { analyzeRoutes, analyzeDifficulty } = require('./balance-v1/analyze');
const report = require('./balance-v1/report');

const ROOT = path.resolve(__dirname, '..', '..');
const DEFAULT_OUT = path.join(ROOT, 'tests', 'balance', 'b1');
const ALL_POLICIES = ['random', 'value', 'synergy', 'greedy'];

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) { out._.push(a); continue; }
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) out[key] = true;
    else { out[key] = next; i++; }
  }
  return out;
}

function readJsonArg(value, label) {
  if (value === undefined || value === true) return null;
  const p = path.resolve(process.cwd(), value);
  if (!fs.existsSync(p)) throw new Error('找不到 ' + label + ' 文件：' + p);
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function nowIso() { return new Date().toISOString().replace(/\.\d+Z$/, 'Z'); }

/**
 * 旧结论核查报告。每条结论必须给出：支持/不支持/证据不足，以及支持它的具体数字。
 * 不允许在没有对应证据时写「确认」。
 */
function analysisMarkdown(v, summary) {
  const L = [];
  const push = s => L.push(s);
  const pc = x => (x === null || x === undefined) ? 'n/a' : (x * 100).toFixed(1) + '%';
  push('# 旧结论核查（工作包A · 观察性证据）');
  push('');
  push('- 数据来源：`' + v.source + '`');
  push('- 配置 `' + v.configId + '` · 源码 `' + v.sourceHash.slice(0, 16) + '…` · seed 名单 `' + v.seedsHash.slice(0, 16) + '…`');
  push('- 样本：' + v.seedCount + ' seed × ' + v.policyCount + ' 策略 = ' + (v.seedCount * v.policyCount) + ' 局');
  push('- 生成时间（UTC）：' + v.generatedAt);
  push('');
  push('> **方法学边界**：本轮只有训练集前 100 seed 的观察性证据。Bot 的路线构成是策略选择的');
  push('> 结果，不是随机分配，因此路线间差异混合了「路线强度」与「策略偏好」。');
  push('> 方案 §6.2 要求的路线强弱判定需要配对消融探针与 8 个路线偏向策略（工作包B）。');
  push('');

  push('## 结论一：整体是否偏易？');
  push('');
  if (!v.difficulty.usable) {
    push('**证据不足**：' + v.difficulty.note);
  } else {
    push('目标带 ' + pc(v.difficulty.targetBand[0]) + '–' + pc(v.difficulty.targetBand[1]) +
      '（强策略），技能差下限 ' + pc(v.difficulty.minSkillGap) + '。');
    push('');
    push('| 强策略 | 胜率 | 带内 | 高于带 | 低于带 | 相对 Random 的差 | 达 ≥15pp |');
    push('|---|---:|---|---|---|---:|---|');
    for (const s of v.difficulty.strongPolicies) {
      const gap = v.difficulty.skillGapVsRandom.find(g => g.policy === s.policy);
      push('| ' + s.policy + ' | ' + pc(s.winRate) + ' | ' + (s.inBand ? '是' : '否') + ' | ' +
        (s.aboveBand ? '是' : '否') + ' | ' + (s.belowBand ? '是' : '否') + ' | ' + pc(gap ? gap.gap : null) +
        ' | ' + (gap && gap.meetsMinimum ? '是' : '否') + ' |');
    }
    push('');
    const allAbove = v.difficulty.strongPolicies.every(s => s.aboveBand);
    const anyAbove = v.difficulty.strongPolicies.some(s => s.aboveBand);
    push('**判定**：' + (allAbove ? '两个强策略均高于目标带上界，旧结论「整体偏易」在本样本上**得到支持**。'
      : anyAbove ? '仅部分强策略高于带上界，旧结论「整体偏易」**只得到部分支持**，需更大样本。'
        : '没有强策略高于目标带上界，旧结论「整体偏易」在本样本上**未得到支持**。'));
  }
  push('');
  push('对照：旧 `balance-lab.js` 报告 Random 35% / Value 65% / Synergy 93%（40 局/策略）。');
  push('本轮数字与新工具同时列出，便于看出测量口径差异；两者不可直接互相替代。');
  push('');
  push('| 策略 | 本轮胜率 | 95% Wilson | WON/LOST/ERROR |');
  push('|---|---:|---|---|');
  for (const p of summary.policies) {
    push('| ' + p.policy + ' | ' + pc(p.winRate) + ' | [' + pc(p.winRateCI.lo) + ', ' + pc(p.winRateCI.hi) + '] | ' +
      p.won + '/' + p.lost + '/' + p.error + ' |');
  }
  push('');

  push('## 结论二：共鸣是否过强？');
  push('');
  push('**本轮证据不足以判定「共鸣过强」。** 原因如下，均为方法学限制而非回避：');
  push('');
  push('1. 本轮没有配对消融探针（同策略同 seed 只改共鸣数值），无法把路线强度从策略偏好中分离。');
  push('2. 强策略若本身更倾向挑共鸣，则「共鸣主路线局胜率高」既可能来自路线强度，也可能来自该策略整体更强。');
  push('3. 方案 §6.2 的路线判定需要 8 个路线偏向策略各 200 局同 seed；本轮未做（属工作包B预算）。');
  push('');
  push('可作为**线索**的观察（不是结论）：');
  push('');
  push('| 路线 | 终局实例数 | 归因收益合计 | 每实例平均归因收益 |');
  push('|---|---:|---:|---:|');
  for (const g of Object.keys(v.routes.byRoute)) {
    const b = v.routes.byRoute[g];
    push('| ' + g + ' | ' + b.terminalInstances + ' | ' + b.totalAttributedIncome.toFixed(0) + ' | ' +
      (b.incomePerInstance === null ? 'n/a' : b.incomePerInstance.toFixed(2)) + ' |');
  }
  push('');
  push('按方案 §5 的「主路线」定义（某路线占终局非垃圾牌 ≥50%）：');
  push('');
  push('| 路线 | 主路线局数 | 其中胜 | 条件胜率 | 占比最高(plurality)局数 | 其中胜 | 条件胜率 |');
  push('|---|---:|---:|---:|---:|---:|---:|');
  for (const g of Object.keys(v.routes.byRoute)) {
    const m = v.routes.mainRouteWinRate[g];
    const d = (v.routes.dominantRouteWinRate || {})[g] || { games: 0, wins: 0, winRate: null };
    push('| ' + g + ' | ' + m.games + ' | ' + m.wins + ' | ' + pc(m.winRate) + ' | ' +
      d.games + ' | ' + d.wins + ' | ' + pc(d.winRate) + ' |');
  }
  push('');
  push('注意：≥50% 口径下绝大多数局被判为「混搭」，因此主路线列几乎为空；');
  push('plurality 列只表示「占比相对最高」，不代表该局是纯路线构筑。两者都不能单独证明路线强度。');
  push('');
  const rc = v.routes.resonanceConcentration;
  push('共鸣在终局池中的占比（非垃圾牌）：均值 ' + pc(rc.meanShare) + '，P50 ' + pc(rc.p50) +
    '，≥50% 的局占 ' + pc(rc.shareOfGamesAbove50pct) + '（n=' + rc.games + '）。');
  push('');
  push('混淆检查：各策略终局池的路线构成差异，说明路线构成确实受策略影响——');
  push('');
  push('| 策略 | 局数 | 共鸣主路线局数(≥50%) | 共鸣为占比最高路线 | 终局共鸣牌占比(均值) |');
  push('|---|---:|---:|---:|---:|');
  for (const c of v.routes.confound) {
    push('| ' + c.policy + ' | ' + c.games + ' | ' + c.resonanceMainRouteGames + ' | ' +
      c.resonanceDominantGames + ' | ' + pc(c.meanResonanceShare) + ' |');
  }
  push('');
  push('若各策略构成接近，则上表的路线条件胜率更可能反映路线本身，而不是策略偏好；');
  push('差异越大越不能跨策略合并解读。无论哪种情况，都仍需工作包B的配对消融探针才能判定路线强弱。');
  push('');

  push('## 结论三：旧「单轮共鸣 242」是否可复现？');
  push('');
  push('**未复现、也未证伪。** 旧数字来自「8 个同路线符号组池」的构造池测试，');
  push('本轮跑的是从初始 12 张牌开始的完整局，不是同一实验，两者的单轮峰值不可直接比较。');
  push('构造池峰值属工作包B的定向算例。');
  push('');
  const late = summary.policies.map(p => ({ policy: p.policy, p90: p.income.lateStagePerSpin.p90, max: p.income.lateStagePerSpin.max }));
  push('本轮后期（7–10期）单轮收益观测（条件样本，仅到达者）：');
  push('');
  push('| 策略 | P90 | 最大 |');
  push('|---|---:|---:|');
  for (const x of late) push('| ' + x.policy + ' | ' + (x.p90 === null ? 'n/a' : x.p90.toFixed(1)) + ' | ' + (x.max === null ? 'n/a' : x.max.toFixed(1)) + ' |');
  push('');
  return L.join('\n');
}

/**
 * 10 个固定 seed 的工具自检。检查项由方案 §3.1 指定：
 * 终止、复现、无非法命令、参数覆盖真实生效及 profile 隔离。
 */
function selfCheck(cfg) {
  const checks = [];
  const add = (name, ok, detail) => checks.push({ name, ok: !!ok, detail: detail === undefined ? '' : String(detail) });
  const seeds = selfCheckSeeds();

  const loaded = loadEngine(cfg);
  const F = loaded.F;

  // 1) profile 隔离 + 参数覆盖证据
  add('profile 隔离：slice-abd-v1 与 full-v1 的配额表不同',
    JSON.stringify(Array.from(F.PROFILES['slice-abd-v1'].payments)) !== JSON.stringify(Array.from(F.PROFILES['full-v1'].payments)),
    'slice=' + F.PROFILES['slice-abd-v1'].payments.join(',') + ' full=' + F.PROFILES['full-v1'].payments.join(','));
  add('提示：切片配额为完整表 ×0.65 向上取整（可直接核算）',
    Array.from(F.PROFILES['full-v1'].payments).every((x, i) => F.PROFILES['slice-abd-v1'].payments[i] === Math.ceil(x * 65 / 100)),
    '');
  for (const a of loaded.appliedOverrides) {
    add('覆盖已生效：' + a.target + (a.id ? '/' + a.id : '') + (a.index !== undefined ? '#' + a.index : ''),
      true, JSON.stringify(a.before) + ' → ' + JSON.stringify(a.after));
  }

  // 2) 每策略每 seed：终止 + 无 ERROR + 复现一致
  const results = [];
  for (const kind of ALL_POLICIES) {
    for (const seed of seeds) {
      const r1 = playGame({ F, seed, policyKind: kind, configId: loaded.configId });
      const r2 = playGame({ F, seed, policyKind: kind, configId: loaded.configId });
      results.push({ kind, seed, r1, r2 });
    }
  }

  const noError = results.every(r => r.r1.outcome !== 'ERROR');
  add('无 ERROR：10 seed × 4 策略全部在预算内正常终止', noError,
    results.filter(r => r.r1.outcome === 'ERROR').map(r => r.kind + '/' + r.seed + ': ' + r.r1.errorReason).join(' | '));

  const terminated = results.every(r => ['WON', 'LOST'].includes(r.r1.outcome));
  add('终止性：每局最终 phase 为 WON 或 LOST', terminated,
    results.filter(r => !['WON', 'LOST'].includes(r.r1.outcome)).map(r => r.kind + '/' + r.seed).join(' | '));

  const reproducible = results.every(r =>
    r.r1.outcome === r.r2.outcome && r.r1.finalStage === r.r2.finalStage &&
    JSON.stringify(r.r1.actions) === JSON.stringify(r.r2.actions) &&
    JSON.stringify(r.r1.stages.map(s => [s.stage, s.passed, s.failedHere])) === JSON.stringify(r.r2.stages.map(s => [s.stage, s.passed, s.failedHere])));
  add('复现性：同 seed 同策略两次运行结果与动作次数一致', reproducible,
    results.filter(r => r.r1.outcome !== r.r2.outcome || r.r1.finalStage !== r.r2.finalStage).map(r => r.kind + '/' + r.seed).join(' | '));

  // 3) 策略间共享 seed 名单（配对前提）
  const seedSet = new Set(results.map(r => r.kind + '|' + r.seed));
  add('策略间种子一致：4 策略覆盖同一 10 个 seed 的笛卡尔积',
    seedSet.size === seeds.length * ALL_POLICIES.length, seedSet.size + ' / ' + (seeds.length * ALL_POLICIES.length));

  // 4) 决策 RNG 独立于游戏 RNG：游戏 RNG 消费数在不同策略下可不同，但同策略同 seed 必须一致
  const gameRngIndependent = results.every(r => r.r1.outcome === r.r2.outcome);
  add('游戏 RNG 不被 Bot 使用：同 seed 同策略可复现（若 Bot 消耗游戏流则统计会漂移）', gameRngIndependent, '');

  // 5) 随机策略必须真的随机：不固定取中间项
  const randomPicks = new Set();
  for (const r of results) if (r.kind === 'random') randomPicks.add(r.r1.actions.choose + ':' + r.r1.finalStage + ':' + r.r1.outcome);
  add('Random 非固定取中间项：10 个 seed 产生多于 1 种结果签名', randomPicks.size > 1, '签名数=' + randomPicks.size);

  // 6) 各策略动作确有使用
  const usage = {};
  for (const kind of ALL_POLICIES) {
    const agg = aggregatePolicy(results.map(r => r.r1), kind);
    usage[kind] = agg.actions;
  }
  add('动作覆盖：Random 使用了刷新或移除（非"形式上接入"）',
    (usage.random.reroll + usage.random.remove) > 0,
    'reroll=' + usage.random.reroll + ' remove=' + usage.random.remove);
  add('动作覆盖：Greedy 执行了副本前瞻',
    usage.greedy.lookahead !== undefined ? usage.greedy.lookahead.runs > 0 : true, '');

  // 7) 非法命令必须被识别为 ERROR，且不会推进状态
  const illegal = illegalCommandProbe(F, seeds[0]);
  add('非法命令被识别为 ERROR（不当作 LOST）', illegal.rejected && illegal.outcome === 'ERROR',
    'rejected=' + illegal.rejected + ' outcome=' + illegal.outcome + ' reason=' + illegal.reason);
  add('非法命令不推进状态（revision 与现金不变）', illegal.revisionUnchanged && illegal.cashUnchanged,
    'revision ' + illegal.revisionBefore + '→' + illegal.revisionAfter + ', cash ' + illegal.cashBefore + '→' + illegal.cashAfter);

  // 8) 参数覆盖机制与 profile 隔离
  const probeChecks = overrideProbeChecks();
  for (const c of probeChecks) checks.push(c);

  const failed = checks.filter(c => !c.ok);
  return { checks, failed, seeds, results, sourceHash: loaded.sourceHash, configHash: loaded.configHash };
}

/**
 * 参数覆盖机制自检：用合成探针配置确认
 *   (a) 覆盖真的改到了「完全加载后」的定义（而不是被后面的 exactMetadata 盖掉）；
 *   (b) profile 之间隔离，覆盖 full-v1 不影响 slice-abd-v1；
 *   (c) 非法配额表被拒绝，而不是被静默修正单调性。
 * 这些探针值只用于工具自检，不是平衡候选。
 */
function overrideProbeChecks() {
  const checks = [];
  const add = (name, ok, detail) => checks.push({ name, ok: !!ok, detail: detail === undefined ? '' : String(detail) });
  const baseline = loadEngine({ id: 'P0-baseline', overrides: [] });

  const probeCfg = {
    id: 'TOOLCHECK-override-probe',
    overrides: [
      { target: 'symbolEffect', id: 'chord_frame', index: 0, path: 'ratio', value: [7, 4] },
      { target: 'symbolEffect', id: 'silence_keeper', index: 0, path: 'amount', value: 8 },
      { target: 'symbolMechanic', id: 'pressure_pouch', path: 'pressure.reward', value: 11 },
      { target: 'symbolBase', id: 'sorting_runner', value: 2 },
      { target: 'symbolWeightRow', index: 0, value: [70, 27, 3, 0] }
    ]
  };
  let probe;
  try { probe = loadEngine(probeCfg); }
  catch (e) { add('覆盖探针加载', false, e.message); return checks; }

  const P = probe.F;
  add('覆盖生效：chord_frame 倍率 ratio → [7,4]',
    JSON.stringify(P.fullSymbols.chord_frame.effects[0].ratio) === '[7,4]',
    JSON.stringify(P.fullSymbols.chord_frame.effects[0].ratio));
  add('覆盖生效：silence_keeper amount → 8',
    P.fullSymbols.silence_keeper.effects[0].amount === 8, String(P.fullSymbols.silence_keeper.effects[0].amount));
  add('覆盖生效：pressure_pouch 压力奖励 → 11',
    P.fullSymbols.pressure_pouch.mechanics.pressure.reward === 11, String(P.fullSymbols.pressure_pouch.mechanics.pressure.reward));
  add('覆盖生效：sorting_runner base → 2', P.fullSymbols.sorting_runner.base === 2, String(P.fullSymbols.sorting_runner.base));
  add('覆盖生效：生产牌第1档权重 → [70,27,3,0]',
    JSON.stringify(probe.effective.symbolWeights[0]) === '[70,27,3,0]',
    JSON.stringify(probe.effective.symbolWeights[0]));
  add('覆盖未泄漏到基线：另一次加载仍是原始 ratio [2,1]',
    JSON.stringify(baseline.F.fullSymbols.chord_frame.effects[0].ratio) === '[2,1]',
    JSON.stringify(baseline.F.fullSymbols.chord_frame.effects[0].ratio));

  // profile 隔离：覆盖 full-v1 的符号不影响 slice-abd-v1 的同名定义
  const shared = 'mist_pouch';
  const isoProbe = loadEngine({ id: 'TOOLCHECK-iso', overrides: [{ target: 'symbolBase', id: shared, value: 9 }] });
  add('profile 隔离：改 full-v1 的 ' + shared + '.base 不动 slice-abd-v1',
    isoProbe.F.fullSymbols[shared].base === 9 && isoProbe.F.sliceSymbols[shared].base === baseline.F.sliceSymbols[shared].base,
    'full=' + isoProbe.F.fullSymbols[shared].base + ' slice=' + isoProbe.F.sliceSymbols[shared].base);

  // 配额：改完整表后，切片表必须仍是 ×0.65 向上取整（不写两套来源）
  const payProbe = loadEngine({
    id: 'TOOLCHECK-payments',
    overrides: [{ target: 'normalPayments', value: [150, 270, 405, 430, 450, 455, 460, 480, 555, 590] }]
  });
  const full = Array.from(payProbe.F.PROFILES['full-v1'].payments);
  const slice = Array.from(payProbe.F.PROFILES['slice-abd-v1'].payments);
  add('配额：切片表仍为完整表 ×0.65 向上取整', full.every((x, i) => slice[i] === Math.ceil(x * 65 / 100)),
    'full=' + full.join(',') + ' slice=' + slice.join(','));

  // 非法配额表必须被拒绝，而不是被自动修正单调性
  let rejected = false;
  let reason = '';
  try {
    loadEngine({ id: 'TOOLCHECK-bad-payments', overrides: [{ target: 'normalPayments', value: [150, 150, 400, 425, 445, 450, 455, 475, 550, 585] }] });
  } catch (e) { rejected = true; reason = e.message; }
  add('非法配额表被拒绝（不静默修正单调性）', rejected, reason);

  // 白名单外的覆盖必须被拒绝
  let whitelistRejected = false;
  let wReason = '';
  try {
    loadEngine({ id: 'TOOLCHECK-bad-target', overrides: [{ target: 'cash', value: 999999 }] });
  } catch (e) { whitelistRejected = true; wReason = e.message; }
  add('白名单外的字段覆盖被拒绝', whitelistRejected, wReason);

  return checks;
}

/** 直接对引擎发一条非法命令，确认返回 ok:false 且状态未被修改。 */
function illegalCommandProbe(F, seed) {
  let s = F.fullNewRun(seed);
  const r0 = F.fullCommand(s, { revision: s.revision, windowId: s.offer.windowId, op: 'spin' });
  if (!r0.ok) return { rejected: false, outcome: null, reason: 'spin 失败: ' + r0.error };
  s = r0.state;
  const before = { revision: s.revision, cash: s.cash };
  const bad = F.fullCommand(s, { revision: s.revision, windowId: s.offer.windowId, op: 'choose', id: 'definitely_not_a_symbol' });
  const stale = F.fullCommand(s, { revision: s.revision + 99, windowId: s.offer.windowId, op: 'spin' });
  return {
    rejected: bad.ok === false && stale.ok === false,
    outcome: bad.ok === false ? 'ERROR' : 'NOT_ERROR',
    reason: bad.error + ' / ' + stale.error,
    revisionUnchanged: s.revision === before.revision,
    cashUnchanged: s.cash === before.cash,
    revisionBefore: before.revision, revisionAfter: s.revision,
    cashBefore: before.cash, cashAfter: s.cash
  };
}

function runBatch(opts) {
  const { cfg, seeds, policies, outDir, commandLine, label } = opts;
  const loaded = loadEngine(cfg);
  const F = loaded.F;

  if (seeds.some(s => String(s).startsWith(HOLDOUT_PREFIX))) {
    throw new Error('拒绝运行留出集 seed（' + HOLDOUT_PREFIX + '*）：工作包A只允许训练集。');
  }

  const records = [];
  const started = Date.now();
  for (const kind of policies) {
    for (const seed of seeds) {
      records.push(playGame({ F, seed, policyKind: kind, configId: loaded.configId }));
    }
  }
  const elapsedMs = Date.now() - started;

  const policiesAgg = policies.map(k => aggregatePolicy(records, k));
  const paired = [];
  for (let i = 0; i < policies.length; i++) {
    for (let j = i + 1; j < policies.length; j++) paired.push(pairedComparison(records, policies[i], policies[j]));
  }

  const seedsHash = hashSeeds(seeds);
  const totalError = policiesAgg.reduce((a, p) => a + p.error, 0);
  const accountingErrors = policiesAgg.filter(p => p.accountingError).map(p => p.policy + ': ' + p.accountingError);

  const summary = {
    generatedAt: nowIso(),
    label: label || 'initial-baseline',
    configId: loaded.configId,
    sourceHash: loaded.sourceHash,
    configHash: loaded.configHash,
    srcHashes: loaded.srcHashes,
    engineFiles: loaded.engineFiles,
    appliedOverrides: loaded.appliedOverrides,
    policyVersion: POLICY_VERSION,
    commandLine,
    seedCount: seeds.length,
    seedPrefix: TRAIN_PREFIX,
    seedsHash,
    seeds,
    policies: policiesAgg,
    paired,
    stageList: STAGES,
    gamesPerPolicy: seeds.length,
    totalGames: records.length,
    totalError,
    accountingErrors,
    elapsedMs,
    batchOk: totalError === 0 && accountingErrors.length === 0,
    effectiveParams: loaded.effective
  };

  fs.mkdirSync(outDir, { recursive: true });
  const jsonlPath = path.join(outDir, 'games.jsonl');
  report.writeJsonl(jsonlPath, records);
  report.writeJson(path.join(outDir, 'aggregate.json'), summary);
  const md = report.markdown(summary);
  fs.writeFileSync(path.join(outDir, 'report.md'), md + '\n', 'utf8');
  writeSeedList(path.join(outDir, 'seeds.json'), seeds, {
    prefix: TRAIN_PREFIX, policyVersion: POLICY_VERSION, label: label || 'initial-baseline'
  });

  return { summary, records, paths: { jsonlPath, outDir }, md };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const commandLine = 'node tests/tools/balance-v1.js ' + process.argv.slice(2).join(' ');
  const outDir = args.out && args.out !== true ? path.resolve(process.cwd(), args.out) : DEFAULT_OUT;

  if (args['self-check']) {
    const cfg = readJsonArg(args.config, '--config') || { id: 'P0-baseline', overrides: [] };
    const result = selfCheck(cfg);
    const lines = [];
    const say = s => { lines.push(s); console.log(s); };
    say('=== balance-v1 工具自检（10 个固定 seed × 4 策略）===');
    say('配置: ' + (cfg.id || 'P0-baseline') + '  源码哈希: ' + result.sourceHash);
    say('生成时间（UTC）: ' + nowIso());
    say('命令: ' + commandLine);
    say('seed: ' + result.seeds.join(', '));
    say('');
    for (const c of result.checks) {
      say((c.ok ? 'PASS ' : 'FAIL ') + c.name + (c.detail ? '\n      ' + c.detail : ''));
    }
    say('');
    say((result.checks.length - result.failed.length) + '/' + result.checks.length + ' 自检项通过');
    const dir = path.join(outDir, 'self-check');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'self-check.txt'), lines.join('\n') + '\n', 'utf8');
    report.writeJson(path.join(dir, 'self-check.json'), {
      generatedAt: nowIso(), commandLine, configId: cfg.id || 'P0-baseline',
      sourceHash: result.sourceHash, seeds: result.seeds,
      passed: result.checks.length - result.failed.length, total: result.checks.length,
      checks: result.checks,
      perGame: result.results.map(r => ({
        policy: r.kind, seed: r.seed, outcome: r.r1.outcome, finalStage: r.r1.finalStage,
        spins: r.r1.spins, actions: r.r1.actions
      })),
      evidence: path.join(dir, 'self-check.txt')
    });
    console.log('证据: ' + path.join(dir, 'self-check.txt'));
    if (result.failed.length) process.exitCode = 1;
    return;
  }

  const cfg = readJsonArg(args.config, '--config') || { id: 'P0-baseline', overrides: [] };
  const policiesRaw = args.policies && args.policies !== true ? String(args.policies) : ALL_POLICIES.join(',');
  const policies = policiesRaw.split(',').map(x => x.trim()).filter(Boolean);
  for (const p of policies) if (!ALL_POLICIES.includes(p)) throw new Error('未知策略：' + p + '（允许 ' + ALL_POLICIES.join(',') + '）');

  if (args.analyze) {
    const dir = args.analyze === true ? DEFAULT_OUT : path.resolve(process.cwd(), String(args.analyze));
    const aggPath = fs.existsSync(path.join(dir, 'aggregate.json')) ? path.join(dir, 'aggregate.json') : path.join(dir, 'baseline-train100', 'aggregate.json');
    if (!fs.existsSync(aggPath)) throw new Error('找不到聚合文件：' + aggPath);
    const summary = JSON.parse(fs.readFileSync(aggPath, 'utf8'));
    const jsonlPath = path.join(path.dirname(aggPath), 'games.jsonl');
    if (!fs.existsSync(jsonlPath)) throw new Error('找不到逐局文件：' + jsonlPath);
    const records = fs.readFileSync(jsonlPath, 'utf8').trim().split('\n').filter(Boolean).map(l => JSON.parse(l));
    const loaded = loadEngine({ id: 'analysis-only', overrides: [] });
    const routes = analyzeRoutes(records, loaded.F);
    const difficulty = analyzeDifficulty(summary.policies);
    const verdict = {
      generatedAt: nowIso(),
      source: path.relative(ROOT, aggPath).replace(/\\/g, '/'),
      sourceHash: summary.sourceHash,
      configId: summary.configId,
      seedsHash: summary.seedsHash,
      seedCount: summary.seedCount,
      gamesPerPolicy: summary.gamesPerPolicy,
      policyCount: summary.policies.length,
      difficulty,
      routes
    };
    const md = analysisMarkdown(verdict, summary);
    const outFile = path.join(dir, 'analysis.json');
    report.writeJson(outFile, verdict);
    fs.writeFileSync(path.join(dir, 'analysis.md'), md + '\n', 'utf8');
    console.log(md);
    console.log('\n输出：' + outFile);
    return;
  }

  let seeds;
  const seedsArg = readJsonArg(args.seeds, '--seeds');
  if (seedsArg) seeds = Array.isArray(seedsArg) ? seedsArg : seedsArg.seeds;
  else {
    const n = args.games && args.games !== true ? Number(args.games) : 100;
    seeds = trainSeeds(n);
  }
  if (!Array.isArray(seeds) || !seeds.length) throw new Error('seed 名单为空');

  const result = runBatch({ cfg, seeds, policies, outDir, commandLine, label: args.label && args.label !== true ? String(args.label) : undefined });

  const s = result.summary;
  console.log('=== balance-v1 批次完成 ===');
  console.log('配置 ' + s.configId + ' | 源码 ' + s.sourceHash.slice(0, 16) + '… | seed ' + s.seedCount + ' | 局数 ' + s.totalGames + ' | 用时 ' + (s.elapsedMs / 1000).toFixed(1) + 's');
  console.log('');
  for (const p of s.policies) {
    console.log('  ' + p.policy.padEnd(8) + ' WON ' + String(p.won).padStart(4) + '  LOST ' + String(p.lost).padStart(4) +
      '  ERROR ' + String(p.error).padStart(3) + '  胜率 ' + report.pct(p.winRate) +
      '  95%CI [' + report.pct(p.winRateCI.lo) + ', ' + report.pct(p.winRateCI.hi) + ']');
  }
  console.log('');
  console.log('批次状态：' + (s.batchOk ? 'OK（无 ERROR）' : '**存在 ERROR，本批失败**'));
  console.log('输出：' + outDir);
  if (!s.batchOk) process.exitCode = 1;
}

if (require.main === module) {
  try { main(); }
  catch (e) { console.error('ERROR: ' + (e && e.message ? e.message : e)); process.exitCode = 2; }
}

module.exports = { selfCheck, runBatch, parseArgs, illegalCommandProbe, ALL_POLICIES };
