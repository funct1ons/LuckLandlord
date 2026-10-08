'use strict';
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const E = require('./full-sim-engine');
const V5 = require('./full-sim-engine-policy-v5-oracle');
const { F, copy } = V5;
const hash = x => crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const ACTION_GUARD = 2000;
function play(bot, split, index) {
  if (bot === 'Random') throw Error('policy-v5-oracle does not re-run Random; use v1/v2 control');
  const seed = `F4-FULL-v1/${bot}/${split}/${String(index).padStart(4, '0')}`;
  const policySeed = `decision-full-v5-oracle/${bot}/${split}/${index}`;
  const rng = V5.policyRngV5(policySeed);
  const start = performance.now();
  let s = F.fullNewRun(seed), modelCommands = 0, error = null;
  if (s.profile !== 'full-v1') throw Error('profile');
  if (s.pool.length !== 12) throw Error('start size');
  if (s.payment !== 70) throw Error('payment');
  const actions = [], spins = [], payments = [], exposures = [], acquisitions = [], firstFormation = {}, uidHistory = {}, contributions = {}, recent = [];
  const remember = (state, origin) => {
    for (const x of state.pool) {
      if (!uidHistory[x.uid]) uidHistory[x.uid] = { initialType: x.type, acquiredStage: state.stageId, origin };
      uidHistory[x.uid].type = x.type;
    }
  };
  remember(s, 'initial');
  const expose = () => {
    if (['SYMBOL_CHOICE', 'ITEM_CHOICE'].includes(s.phase)) {
      exposures.push({ kind: s.offer.kind, stage: s.stageId, spin: s.spin, window: s.offer.windowId, refresh: s.offer.choiceRefreshesUsed, guarantee: s.offer.guarantees.applied, ids: copy(s.offer.choices) });
    } else if (s.phase === 'EVENT_CHOICE') {
      exposures.push({ kind: 'event', stage: s.stageId, spin: s.spin, ids: [s.events.choice.id], targets: copy(s.events.choice.targetUids) });
    }
  };
  while (!['WON', 'LOST'].includes(s.phase) && actions.length < ACTION_GUARD) {
    const v = V5.publicView(s), decision = V5.decideV5(bot, s), a = decision.action;
    modelCommands += decision.modelCommands || 0;
    const before = s, stamp = { revision: s.revision, stage: s.stageId, spin: s.spin, phase: s.phase, command: copy(a), candidates: decision.candidates || 0 };
    const t = performance.now();
    const result = F.fullCommand(s, { ...a, revision: s.revision });
    stamp.ms = performance.now() - t;
    stamp.ok = result.ok;
    if (!result.ok) { stamp.error = result.error; actions.push(stamp); error = result.error; break; }
    s = result.state;
    stamp.after = { phase: s.phase, cash: s.cash, pending: s.pendingSettlement, pool: s.pool.length, remove: s.removeTokens, reroll: s.rerollTokens };
    actions.push(stamp);
    if (a.op === 'choose' || a.op === 'item' || (a.op === 'event' && a.option === 'A')) {
      acquisitions.push({
        id: a.id, stage: before.stageId, spin: before.spin, kind: a.op,
        uid: a.op === 'choose' ? 'u' + before.nextUid : a.uid || null,
        prePool: before.pool.length, preFormations: V5.formation(v, recent), preTypes: copy(before.pool.map(x => x.type))
      });
    }
    if (a.op === 'spin') {
      const types = {};
      for (const c of before.pool) types[c.uid] = c.type;
      for (const c of s.last.board.filter(Boolean)) types[c.uid] = c.type;
      for (const row of s.last.log) {
        if (row.action === 'transform') types[row.target] = row.facts.afterType;
        if (row.action === 'spawn') types[row.facts.createdUid] = row.facts.afterType;
      }
      const bySource = {};
      const add = (source, amount) => {
        const id = (typeof source === 'string' && (source.startsWith('item_') || source.startsWith('event_'))) ? source : types[source] || uidHistory[source] && uidHistory[source].type;
        if (!id) throw Error('Unknown contribution source ' + source + ' seed ' + seed);
        bySource[id] = (bySource[id] || 0) + amount;
        contributions[id] = (contributions[id] || 0) + amount;
      };
      for (const cell of s.last.ledger) for (const part of cell.contributions) add(part.source, part.amount);
      for (const log of s.last.log) if (log.action === 'reward') add(log.source, log.amount || 0);
      if (Object.values(bySource).reduce((x, y) => x + y, 0) !== s.last.total) throw Error('Simulation contribution mismatch ' + seed);
      const d = F.defs(s).symbols;
      const stat = {
        stage: s.stageId, spin: s.spin, stageSpin: s.stageSpin, income: s.last.total, pool: s.pool.length, logActions: s.last.log.length, bySource,
        plantTransforms: s.last.log.filter(x => x.action === 'transform' && x.facts && x.facts.beforeTags && x.facts.beforeTags.includes('plant')).length,
        plantProductIncome: s.last.ledger.filter(x => d[x.type] && d[x.type].tags.includes('plant') && d[x.type].tags.includes('product')).reduce((x, y) => x + y.amount, 0),
        scrapProcessed: s.last.log.filter(x => ['consume', 'transform'].includes(x.action) && x.facts && x.facts.beforeTags && x.facts.beforeTags.includes('scrap')).length
      };
      spins.push(stat);
      recent.push(stat);
      if (recent.length > 3) recent.shift();
      for (const route of V5.formation(V5.publicView(s), recent)) if (!firstFormation[route]) firstFormation[route] = { stage: s.stageId, spin: s.spin };
    }
    if (['choose', 'skip'].includes(a.op) && before.spinsRemaining === 0) {
      payments.push({
        stage: before.stageId, spin: before.spin, payment: before.payment,
        available: Math.max(0, before.cash + before.pendingSettlement),
        margin: Math.max(0, before.cash + before.pendingSettlement) - before.payment,
        paid: s.phase !== 'LOST', pool: s.pool.length,
        income: spins.filter(x => x.stage === before.stageId).reduce((n, x) => n + x.income, 0)
      });
    }
    remember(s, a.op === 'choose' ? 'choice' : a.op === 'event' ? 'event' : 'generated');
    if (['spin', 'reroll'].includes(a.op) || (['choose', 'skip'].includes(a.op) && s.phase === 'ITEM_CHOICE') || (['item', 'skipItem'].includes(a.op) && s.phase === 'EVENT_CHOICE') || s.phase === 'EVENT_CHOICE') expose();
  }
  if (actions.length >= ACTION_GUARD && !['WON', 'LOST'].includes(s.phase)) error = 'Simulator action guard exceeded';
  return {
    version: 'full-sim-oracle-diag-v5', bot, split, index, seed, policySeed, oracle: true, warning: V5.WARNING,
    outcome: error ? 'ERROR' : s.phase, won: !error && s.phase === 'WON', error,
    ms: performance.now() - start, modelCommands, actions, spins, payments, exposures, acquisitions,
    firstFormation, uidHistory, contributions, policyRng: rng.snapshot(), finalState: copy(s), finalHash: hash(s),
    lookahead: V5.LOOKAHEAD,
    horizon: V5.HORIZON_SPINS, commandCap: V5.COMMAND_CAP, removeBeam: V5.REMOVE_BEAM,
    startPool: 12, paymentsTable: F.NORMAL_PAYMENTS
  };
}
function main() {
  const mode = process.argv[2] || 'probe';
  const bot = process.argv[3] || 'Value';
  const split = process.argv[4] || 'holdout';
  const n = Number(process.argv[5] || 10);
  const startIndex = Number(process.argv[6] || 0);
  if (!['Value', 'Synergy', 'Greedy'].includes(bot) || !['probe', 'train', 'holdout'].includes(split) || !Number.isInteger(n) || n < 1) throw Error('Arguments');
  if (!['probe', 'batch'].includes(mode)) throw Error('mode probe|batch');
  const target = __dirname + `/full-sim-oracle-diag-v5-${mode}-${bot.toLowerCase()}-${split}-${startIndex}.jsonl`;
  if (fs.existsSync(target)) throw Error('Do not overwrite evidence: ' + target);
  const fd = fs.openSync(target, 'wx');
  const index = [], start = performance.now();
  let wins = 0, errors = 0;
  try {
    for (let i = 0; i < n; i++) {
      const g = play(bot, split, i + startIndex);
      const bytes = Buffer.from(JSON.stringify(g) + '\n');
      const offset = index.reduce((a, b) => a + b.bytes, 0);
      fs.writeSync(fd, bytes);
      index.push({ seed: g.seed, policySeed: g.policySeed, line: i + 1, offset, bytes: bytes.length, sha256: crypto.createHash('sha256').update(bytes).digest('hex'), outcome: g.outcome, won: g.won, finalHash: g.finalHash, ms: g.ms, modelCommands: g.modelCommands, failStage: g.finalState && g.finalState.stageId });
      wins += g.won ? 1 : 0;
      errors += g.error ? 1 : 0;
      if ((i + 1) % 2 === 0 || i === 0 || i === n - 1) {
        const line = JSON.stringify({ bot, split, startIndex, done: i + 1, n, wins, errors, seconds: Number(((performance.now() - start) / 1000).toFixed(1)), lastMs: Number(g.ms.toFixed(0)) }) + '\n';
        fs.writeFileSync(target.replace('.jsonl', '-progress.json'), line);
        fs.writeSync(1, line);
      }
    }
  } finally { fs.closeSync(fd); }
  const summary = { bot, split, n, startIndex, wins, errors, ms: performance.now() - start, node: process.version, platform: process.platform, cpu: os.cpus()[0].model, policy: 'full-sim-oracle-diag-v5', oracle: true, warning: V5.WARNING, lookahead: V5.LOOKAHEAD, horizon: V5.HORIZON_SPINS, commandCap: V5.COMMAND_CAP, removeBeam: V5.REMOVE_BEAM, index };
  const idxPath = target.replace('.jsonl', '-index.json');
  if (fs.existsSync(idxPath)) throw Error('Do not overwrite evidence: ' + idxPath);
  fs.writeFileSync(idxPath, JSON.stringify(summary, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ ...summary, index: undefined, lookahead: V5.LOOKAHEAD, warning: V5.WARNING }));
  if (errors) process.exitCode = 1;
}
module.exports = { play, hash };
if (require.main === module) main();
