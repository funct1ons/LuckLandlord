'use strict';
/**
 * tests/tools/balance-v1/runner.js
 *
 * 用真实 fullNewRun / fullCommand 跑一局，并产生可复算的逐局记录。
 *
 * 与旧 balance-lab.js 的关键差异：
 *   - 命令失败（{ok:false}）不再被当成「这局结束」。它是一条 ERROR：立即停止，
 *     单独分类，并且使整批明确失败（绝不能混进 LOST 当成难度证据）。
 *   - 所有命令都带 revision / windowId。
 *   - 策略不使用游戏 RNG；决策随机来自独立决策 RNG。
 *   - 逐期记录进入/通过、期初现金、期内净收益、实际应付、付款前余量、付款后现金、期末牌库量。
 */
const { makePolicy } = require('./policies');
const { makeRng } = require('./rand');

const MAX_COMMANDS = 20000;      // 单局命令上限；超出即 ERROR，不静默截断
const POLICY_VERSION = 'balance-v1-policies/1';

function newStageRecord(stage, state) {
  return {
    stage,
    entered: true,
    passed: false,
    failedHere: false,
    spins: 0,
    spinIncomes: [],
    openingCash: state.cash,
    income: 0,
    actualPayment: state.payment,
    paymentBeforeMargin: null,
    cashAfter: null,
    poolSizeAtEntry: state.pool.length,
    poolSizeAtExit: null
  };
}

/**
 * 匹配方案 §5 的「小循环」定义：至少两种不同 ID 发生日志可证的
 * 「供料 → 消耗/转换」或「条件加值/倍率」配合。
 *
 * 因此只承认以下动作：
 *   - consume（供料被消耗）      - transform（供料被转换）
 *   - add（条件加值，且确实产生了增量）
 *   - multiply（条件倍率，且确实产生了增量）
 *   - reward / pressure / release / grow（来源归因明确的独立收益）
 *
 * 明确排除 destroy / copy / spawn / cycle：
 *   - destroy 包含清除 junk 与自身终结，不是「两种 ID 的配合」；
 *     早期版本把它计入，导致「往池里灌垃圾」的随机策略反而得分最高，属测量错误。
 * 只读 log 的 action/facts/uid，不推测未记录的效果。
 */
const COOPERATIVE_ACTIONS = new Set(['consume', 'transform', 'add', 'multiply', 'reward', 'pressure', 'release', 'grow']);

function cooperationPairs(F, state, spinLog) {
  const uidType = new Map();
  for (const cell of state.last.board) if (cell) uidType.set(cell.uid, cell.type);
  for (const inst of state.pool) uidType.set(inst.uid, inst.type);
  const pairs = [];
  for (const e of spinLog) {
    if (!COOPERATIVE_ACTIONS.has(e.action)) continue;
    if (!e.source || !e.target) continue;
    if (!/^u[1-9]\d*$/.test(e.source)) continue; // 只看实例来源
    const st = uidType.get(e.source);
    const tt = uidType.get(e.target);
    if (!st || !tt || st === tt) continue; // 必须是两种不同 ID
    const facts = e.facts || {};
    // add/multiply 必须有真实增量；consume/transform 等结构性动作本身即为生效
    const structural = e.action === 'consume' || e.action === 'transform';
    const showedGain = typeof facts.actualIncrease === 'number' && facts.actualIncrease > 0;
    if (!structural && !showedGain && !(typeof e.amount === 'number' && e.amount > 0)) continue;
    pairs.push({ action: e.action, sourceType: st, targetType: tt, amount: e.amount });
  }
  return pairs;
}

/**
 * 跑一局。
 * @param {object} args {F, seed, policyKind, configId, maxCommands}
 */
function playGame(args) {
  const { F, seed, policyKind, configId } = args;
  const maxCommands = args.maxCommands || MAX_COMMANDS;
  const rngFactory = purpose => makeRng('balance-v1|' + policyKind + '|' + seed + '|' + purpose);
  const policy = makePolicy(policyKind, F, rngFactory);

  const record = {
    seed, policy: policyKind, configId, policyVersion: POLICY_VERSION,
    outcome: null, errorReason: null, finalPhase: null, finalStage: 1,
    stages: [], spins: 0, incomePerSpin: [],
    actions: policy.actions, lookahead: {
      decisions: policy.actions.lookaheadDecisions,
      candidates: policy.actions.lookaheadCandidates,
      runs: policy.actions.lookaheadRuns,
      failures: policy.actions.lookaheadFailures,
      samplesPerCandidate: null, depth: null
    },
    items: [], poolTypes: [], routes: {},
    byType: {}, contribByType: {},
    coop: { spins: 0, pairs: [], beforeStage4: 0, achievedBeforeStage4: false },
    finalCash: null, softWarnings: []
  };

  let state;
  try {
    state = F.fullNewRun(seed);
  } catch (e) {
    record.outcome = 'ERROR';
    record.errorReason = 'fullNewRun 抛错: ' + e.message;
    return record;
  }

  // 期记录按 state.stageId 归属，而不是在结算瞬间推测下一期编号。
  // 原因：final-controller 的 stageId 在 ITEM_CHOICE 解析时的 setup() 里才 +1，
  // 因此在「本期最后一次 choose」那一刻 stageId 仍是旧值。用完成集合防止重复建记录。
  let current = null;
  const completedStageIds = new Set();
  const completed = [];
  let commands = 0;

  while (true) {
    if (state.phase === 'WON' || state.phase === 'LOST') break;

    if (commands >= maxCommands) {
      record.outcome = 'ERROR';
      record.errorReason = '命令数超过上限 ' + maxCommands + '（未在预算内终止）';
      break;
    }

    if (!completedStageIds.has(state.stageId) && (!current || current.stage !== state.stageId)) {
      current = newStageRecord(state.stageId, state);
    }

    record.finalStage = state.stageId;

    let decision;
    try {
      decision = policy.decide(state);
    } catch (e) {
      record.outcome = 'ERROR';
      record.errorReason = '策略决策抛错: ' + (e && e.message ? e.message : String(e));
      break;
    }
    if (!decision || !decision.command) {
      record.outcome = 'ERROR';
      record.errorReason = '策略在 phase=' + state.phase + ' 无法给出合法命令';
      break;
    }

    const cmd = decision.command;
    const commit = cmd.op === 'choose' || cmd.op === 'skip';
    const preCash = state.cash;
    const prePending = state.pendingSettlement;
    const prePayment = state.payment;
    const preStage = state.stageId;
    const preSpin = state.spin;

    let res;
    try {
      res = F.fullCommand(state, Object.assign({ revision: state.revision, windowId: state.offer.windowId }, cmd));
    } catch (e) {
      record.outcome = 'ERROR';
      record.errorReason = 'fullCommand 抛错 op=' + cmd.op + ': ' + (e && e.message ? e.message : String(e));
      break;
    }
    commands++;

    if (!res || !res.ok) {
      record.outcome = 'ERROR';
      record.errorReason = '命令被拒绝 op=' + cmd.op + ' phase=' + state.phase + ': ' + ((res && res.error) || 'unknown');
      break;
    }

    // 记录本次 spin 的收益与配合（在提交那一刻读取上一轮结算）
    if (commit && prePending !== null) {
      current.income += prePending;
      current.spinIncomes.push(prePending);
      record.incomePerSpin.push(prePending);
      current.spins++;
      record.spins++;
      const pairs = cooperationPairs(F, state, state.last ? state.last.log : []);
      if (pairs.length) {
        record.coop.spins++;
        if (preStage <= 3) record.coop.beforeStage4++;
        if (record.coop.pairs.length < 40) {
          for (const p of pairs) record.coop.pairs.push(Object.assign({ stage: preStage, spin: preSpin + 1 }, p));
        }
      }
      // 收益归因：按类型累计ledger金额，并按贡献来源类型拆分
      const board = new Map();
      for (const cell of state.last.board) if (cell) board.set(cell.uid, cell.type);
      for (const e of state.last.ledger) {
        record.byType[e.type] = (record.byType[e.type] || 0) + e.amount;
        if (e.contributions) {
          for (const c of e.contributions) {
            const key = board.get(c.source) || c.source;
            record.contribByType[key] = (record.contribByType[key] || 0) + c.amount;
          }
        }
      }
    }

    const next = res.state;

    // 期结算：spinsRemaining 归零即进入结算或失败。
    // 归属期用 preStage（本期实际编号），因为 next.stageId 可能已经 +1。
    const stageFinished = commit && next.spinsRemaining === 0;
    if (stageFinished && current && current.stage === preStage && !completedStageIds.has(preStage)) {
      // 实际应付以结算那一刻为准：事件可能在期内加减 payment（boiler +12 / quota +10）
      current.actualPayment = prePayment;
      current.paymentBeforeMargin = preCash + prePending - prePayment;
      current.poolSizeAtExit = next.pool.length;
      current.cashAfter = next.cash;
      if (next.phase === 'LOST') current.failedHere = true;
      else current.passed = true;
      completedStageIds.add(preStage);
      completed.push(current);
      if (next.phase === 'LOST') {
        state = next;
        record.finalStage = preStage;
        break;
      }
      if (next.phase === 'WON') { state = next; break; }
      current = null; // 下一轮按新的 state.stageId 重建
    }

    state = next;
  }

  record.stages = completed;
  record.finalPhase = state ? state.phase : null;
  record.finalStage = state ? state.stageId : record.finalStage;
  record.finalCash = state ? state.cash : null;
  record.items = state ? state.items.slice() : [];

  if (record.outcome === null) {
    record.outcome = state.phase === 'WON' ? 'WON' : 'LOST';
  }

  // 终局路线构成：非垃圾生产牌的原始路线 ID 集合，不按重叠 tag 重复计票
  if (state && Array.isArray(state.pool)) {
    const defs = F.defs(state).symbols;
    const routeMap = policy.routeMap;
    const counts = {};
    for (const x of state.pool) {
      const d = defs[x.type];
      const junk = (d.mechanics && d.mechanics.candidate === false) ||
        (typeof d.base === 'number' && d.base <= 0 && (!d.effects || !d.effects.length));
      if (junk) continue;
      const r = routeMap.get(x.type) || 'unknown';
      counts[r] = (counts[r] || 0) + 1;
    }
    record.routes = counts;
    record.poolTypes = state.pool.map(x => x.type);
  }

  record.coop.achievedBeforeStage4 = record.coop.beforeStage4 >= 2;

  // 小循环的"主路线"判定（软警报用）：某路线占终局非垃圾牌 ≥50%
  const routeTotal = Object.values(record.routes).reduce((a, b) => a + b, 0);
  let mainRoute = null;
  for (const [r, n] of Object.entries(record.routes)) if (n / Math.max(1, routeTotal) >= 0.5) mainRoute = r;
  record.mainRoute = mainRoute;

  return record;
}

module.exports = { playGame, POLICY_VERSION, MAX_COMMANDS, COOPERATIVE_ACTIONS };
