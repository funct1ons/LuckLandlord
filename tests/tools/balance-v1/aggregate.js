'use strict';
/**
 * tests/tools/balance-v1/aggregate.js
 *
 * 从逐局记录聚合。所有派生量都必须能由 records 重算——不引入只有聚合阶段才知道的输入。
 * 严格区分：
 *   - 累计存活率   = 通过本期 / 全部开局
 *   - 条件失败率   = 本期失败 / 进入本期
 *   - 后期（7–10期）统计只针对到达者条件样本，并附人数
 */
const { wilson, summarize, bootstrapPairedCI } = require('./stats');

const STAGES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const LATE_STAGES = [7, 8, 9, 10];
const BOOTSTRAP_ITERATIONS = 10000;

const ACTION_KEYS = ['decisions', 'choose', 'skip', 'remove', 'reroll', 'item', 'skipItem', 'eventAccept', 'eventReject'];

function sumInto(target, source) {
  for (const [k, v] of Object.entries(source || {})) {
    if (typeof v === 'number') target[k] = (target[k] || 0) + v;
  }
}

function aggregatePolicy(records, policyKind) {
  const games = records.filter(r => r.policy === policyKind);
  const total = games.length;
  const errors = games.filter(g => g.outcome === 'ERROR');
  const won = games.filter(g => g.outcome === 'WON');
  const lost = games.filter(g => g.outcome === 'LOST');

  // 各期：进入 / 通过 / 失败
  const stageEnter = {};
  const stagePass = {};
  const stageFail = {};
  for (const s of STAGES) { stageEnter[s] = 0; stagePass[s] = 0; stageFail[s] = 0; }
  for (const g of games) {
    for (const st of g.stages) {
      stageEnter[st.stage]++;
      if (st.passed) stagePass[st.stage]++;
      if (st.failedHere) stageFail[st.stage]++;
    }
    // ERROR 局未走完，但已进入的期仍按 stages 记录；这不算通过也不算失败
  }

  const survival = {};
  let accountingError = null;
  for (const s of STAGES) {
    const cum = total ? stagePass[s] / total : null;
    // 健全性：累计存活率不可能 >1；每期进入人数不可能超过上一期通过人数。
    if (cum !== null && cum > 1 + 1e-9) {
      accountingError = '第' + s + '期累计存活率 ' + cum + ' > 1，逐期归属有误';
    }
    if (s > 1 && stageEnter[s] > stagePass[s - 1]) {
      accountingError = accountingError || ('第' + s + '期进入人数 ' + stageEnter[s] + ' 超过第' + (s - 1) + '期通过人数 ' + stagePass[s - 1]);
    }
    survival[s] = {
      entered: stageEnter[s],
      passed: stagePass[s],
      failedHere: stageFail[s],
      cumulativeSurvival: cum,
      conditionalFailure: stageEnter[s] ? stageFail[s] / stageEnter[s] : null
    };
  }

  const actions = {};
  for (const g of games) sumInto(actions, g.actions);

  // 收益与余量分布
  const spinIncome = [];
  for (const g of games) for (const v of g.incomePerSpin) spinIncome.push(v);
  const margins = [];
  const lateMargins = [];
  for (const g of games) {
    for (const st of g.stages) {
      if (typeof st.paymentBeforeMargin === 'number') {
        margins.push(st.paymentBeforeMargin);
        if (LATE_STAGES.includes(st.stage)) lateMargins.push(st.paymentBeforeMargin);
      }
    }
  }
  const stageIncome = {};
  for (const s of STAGES) stageIncome[s] = [];
  for (const g of games) for (const st of g.stages) if (stageIncome[st.stage]) stageIncome[st.stage].push(st.income);
  const stageIncomeStats = {};
  for (const s of STAGES) stageIncomeStats[s] = summarize(stageIncome[s]);

  // 后期（7–10期）单轮收益：只看到达者的条件样本
  const lateSpinIncome = [];
  for (const g of games) {
    for (const st of g.stages) {
      if (!LATE_STAGES.includes(st.stage)) continue;
      for (const v of st.spinIncomes || []) lateSpinIncome.push(v);
    }
  }

  // 成型：第4期开始前至少两轮配合
  const coopOk = games.filter(g => g.coop.achievedBeforeStage4).length;

  // 终局路线构成
  const routeTotals = {};
  const mainRouteCounts = {};
  let pooledWithRoute = 0;
  for (const g of games) {
    const totalRoutes = Object.values(g.routes).reduce((a, b) => a + b, 0);
    if (totalRoutes > 0) pooledWithRoute++;
    for (const [r, n] of Object.entries(g.routes)) routeTotals[r] = (routeTotals[r] || 0) + n;
    if (g.mainRoute) mainRouteCounts[g.mainRoute] = (mainRouteCounts[g.mainRoute] || 0) + 1;
  }
  const wonRouteTotals = {};
  const mixedWins = won.filter(g => !g.mainRoute).length;
  for (const g of won) for (const [r, n] of Object.entries(g.routes)) wonRouteTotals[r] = (wonRouteTotals[r] || 0) + n;

  // 池规模与物品
  const poolSizes = games.filter(g => typeof g.poolTypes.length === 'number').map(g => g.poolTypes.length);
  const itemCounts = games.map(g => g.items.length);

  // 逐类型收益归因（总）
  const byType = {};
  const contribByType = {};
  for (const g of games) {
    sumInto(byType, g.byType);
    sumInto(contribByType, g.contribByType);
  }

  const endStage = {};
  for (const g of games) endStage[g.finalStage] = (endStage[g.finalStage] || 0) + 1;
  const endStageWon = {};
  for (const g of won) endStageWon[g.finalStage] = (endStageWon[g.finalStage] || 0) + 1;

  return {
    policy: policyKind,
    games: total,
    won: won.length,
    lost: lost.length,
    error: errors.length,
    winRate: total ? won.length / total : null,
    winRateCI: wilson(won.length, total),
    // 只在无 ERROR 时胜率才有意义；有 ERROR 时报告仍给出但标注不可用
    winRateUsable: errors.length === 0,
    winRateExcludingError: (total - errors.length) ? won.length / (total - errors.length) : null,
    errors: errors.map(e => ({ seed: e.seed, reason: e.errorReason, phase: e.finalPhase, stage: e.finalStage })),
    accountingError,
    survival,
    endStage,
    endStageWon,
    actions,
    coop: {
      gamesWithCoop: coopOk,
      rate: total ? coopOk / total : null,
      ci: wilson(coopOk, total),
      qualifyingSpinsBeforeStage4: games.reduce((a, g) => a + g.coop.beforeStage4, 0),
      coopSpinsTotal: games.reduce((a, g) => a + g.coop.spins, 0)
    },
    income: {
      perSpin: summarize(spinIncome),
      perStage: stageIncomeStats,
      lateStagePerSpin: summarize(lateSpinIncome),
      lateSpinsCounted: lateSpinIncome.length
    },
    margin: {
      all: summarize(margins),
      late: summarize(lateMargins),
      lateGamesReaching: games.filter(g => g.stages.some(s => LATE_STAGES.includes(s.stage))).length,
      nonPositiveShare: margins.length ? margins.filter(m => m <= 0).length / margins.length : null
    },
    routes: {
      terminalIdCounts: routeTotals,
      mainRouteWinCounts: mainRouteCounts,
      wonTerminalCounts: wonRouteTotals,
      mixedWins,
      mixedWinShare: won.length ? mixedWins / won.length : null,
      gamesWithAnyRoute: pooledWithRoute
    },
    poolSize: summarize(poolSizes),
    itemCount: summarize(itemCounts),
    byType, contribByType,
    lookahead: {
      decisions: games.reduce((a, g) => a + ((g.actions && g.actions.lookaheadDecisions) || 0), 0),
      candidates: games.reduce((a, g) => a + ((g.actions && g.actions.lookaheadCandidates) || 0), 0),
      runs: games.reduce((a, g) => a + ((g.actions && g.actions.lookaheadRuns) || 0), 0),
      failures: games.reduce((a, g) => a + ((g.actions && g.actions.lookaheadFailures) || 0), 0)
    }
  };
}

/** 配对比较：同一 seed 名单下 A 与 B 的胜负差。 */
function pairedComparison(records, policyA, policyB) {
  const bySeed = new Map();
  for (const r of records) {
    if (!bySeed.has(r.seed)) bySeed.set(r.seed, {});
    bySeed.get(r.seed)[r.policy] = r;
  }
  const seeds = [];
  const diffs = [];
  let aWinsOnly = 0, bWinsOnly = 0, bothWin = 0, bothLose = 0, disagreements = 0, usable = 0;
  // 有 ERROR 的配对整体剔除，并计数说明
  for (const [seed, m] of bySeed.entries()) {
    const A = m[policyA], B = m[policyB];
    if (!A || !B) continue;
    seeds.push(seed);
    if (A.outcome === 'ERROR' || B.outcome === 'ERROR') continue;
    usable++;
    const a = A.outcome === 'WON' ? 1 : 0;
    const b = B.outcome === 'WON' ? 1 : 0;
    diffs.push(a - b);
    if (a && !b) { aWinsOnly++; disagreements++; }
    else if (!a && b) { bWinsOnly++; disagreements++; }
    else if (a && b) bothWin++;
    else bothLose++;
  }
  const pairKey = policyA + '-vs-' + policyB;
  const ci = bootstrapPairedCI(diffs, BOOTSTRAP_ITERATIONS, 'balance-v1|bootstrap|' + pairKey, 0.05);
  return {
    policyA, policyB,
    seedsOnList: seeds.length,
    pairedUsableGames: usable,
    excludedForError: seeds.length - usable,
    aWinsOnly, bWinsOnly, bothWin, bothLose, disagreements,
    meanDiff: diffs.length ? diffs.reduce((x, y) => x + y, 0) / diffs.length : null,
    bootstrap: ci
  };
}

module.exports = { aggregatePolicy, pairedComparison, STAGES, LATE_STAGES, ACTION_KEYS, BOOTSTRAP_ITERATIONS };
