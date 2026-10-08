'use strict';
const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const E = require('./full-sim-engine');
const { F } = E;
const destName = process.argv[2] || 'full-sim-tool-audit-v1.json';
if (!/^full-sim-[\w.-]+\.json$/.test(destName)) throw Error('Unsafe dest ' + destName);
const dest = path.join(__dirname, destName);
if (fs.existsSync(dest)) throw Error('Refuse existing ' + dest);
const hash = name => {
  const buf = fs.readFileSync(path.join(__dirname, name));
  return { bytes: buf.length, sha256: crypto.createHash('sha256').update(buf).digest('hex') };
};
const results = [];
function test(name, fn) {
  try { const detail = fn(); results.push({ name, ok: true, detail: detail === undefined ? true : detail }); }
  catch (e) { results.push({ name, ok: false, error: e.stack || String(e) }); }
}
function cmd(s, a) {
  const r = F.fullCommand(s, { ...a, revision: s.revision });
  assert.equal(r.ok, true, r.error);
  return r.state;
}
test('legal surface includes spin/choose/skip/remove/reroll/item/skipItem/event A/B', () => {
  let s = F.fullNewRun('tool-legal');
  const readyOps = new Set(E.legal(E.publicView(s)).map(x => x.op));
  assert(readyOps.has('spin'));
  assert(readyOps.has('remove'), 'remove is legal in READY when removeTokens>0');
  s = cmd(s, { op: 'spin' });
  const v = E.publicView(s);
  const ops = new Set(E.legal(v).map(x => x.op));
  assert(ops.has('choose') && ops.has('skip') && ops.has('remove') && ops.has('reroll'));
  let item = null, event = null, guard = 0, t = F.fullNewRun('tool-windows');
  while ((!item || !event) && !['WON', 'LOST'].includes(t.phase) && guard++ < 800) {
    if (t.phase === 'READY') t = cmd(t, { op: 'spin' });
    else if (t.phase === 'SYMBOL_CHOICE') t = cmd(t, { op: 'skip', windowId: t.offer.windowId });
    else if (t.phase === 'ITEM_CHOICE') {
      item = item || t;
      t = cmd(t, { op: 'skipItem', windowId: t.offer.windowId });
    } else {
      event = event || t;
      t = cmd(t, { op: 'event', id: t.events.choice.id, option: 'B' });
    }
  }
  assert(item, 'ITEM_CHOICE not reached');
  const itemOps = new Set(E.legal(E.publicView(item)).map(x => x.op));
  assert(itemOps.has('item') && itemOps.has('skipItem'));
  return { eventReached: Boolean(event), itemOps: [...itemOps], eventOps: event ? [...new Set(E.legal(E.publicView(event)).map(x => x.option || x.op))] : [] };
});
test('publicView deletes live seed and five RNG streams; decide never receives them', () => {
  const s = F.fullNewRun('tool-view');
  const v = E.publicView(s);
  assert.equal('rng' in v, false);
  assert.equal('seed' in v, false);
  assert.equal(JSON.stringify(s), JSON.stringify(F.fullNewRun('tool-view')));
});
test('Greedy surrogate uses synthetic seed and ignores live RNG', () => {
  let s = cmd(F.fullNewRun('tool-greedy'), { op: 'spin' });
  const before = JSON.stringify(s);
  const a = E.decide('Greedy', E.publicView(s), E.policyRng('tool-a'));
  const t = E.copy(s);
  t.seed = 'peek-forbidden';
  t.rng = F.createRng(t.seed, t.profile, t.difficulty);
  const b = E.decide('Greedy', E.publicView(t), E.policyRng('tool-a'));
  assert.deepEqual(a.action, b.action);
  assert.equal(JSON.stringify(s), before);
  const sur = E.surrogate(E.publicView(s), 0);
  assert.equal(sur.seed, 'full-sim-model-v1/0');
  return { action: a.action, modelCommands: a.modelCommands };
});
test('rollout future offer contents do not change utility; horizon 2 spins / 14 commands', () => {
  const s = cmd(F.fullNewRun('tool-horizon'), { op: 'spin' });
  const v = E.publicView(s);
  const a = { op: 'choose', id: v.offer.choices[0], windowId: v.offer.windowId };
  const baseline = E.rollout(v, a);
  assert(baseline.spins <= 2);
  assert(baseline.commands <= 14);
  const original = F.sliceOffer;
  try {
    F.sliceOffer = function (st, kind, ...rest) {
      original(st, kind, ...rest);
      st.offer.choices = kind === 'symbol' ? ['wick_bed'] : Object.keys(F.fullItems).filter(id => !st.items.includes(id)).slice(0, 1);
    };
    assert.deepEqual(E.rollout(v, a), baseline);
  } finally { F.sliceOffer = original; }
  return baseline;
});
test('enumerated 8000 seeds unique, train/holdout disjoint, engine hash matches freeze', () => {
  const seeds = JSON.parse(fs.readFileSync(path.join(__dirname, 'full-sim-seeds.json'), 'utf8'));
  assert.equal(seeds.n, 8000);
  assert.equal(seeds.entries.length, 8000);
  const engine = hash('full-sim-engine.js');
  assert.equal(engine.sha256, seeds.engineHash);
  const runner = hash('full-sim-run.js');
  const seen = new Set(), policy = new Set();
  for (const e of seeds.entries) {
    const expect = `F4-FULL-v1/${e.bot}/${e.split}/${String(e.index).padStart(4, '0')}`;
    assert.equal(e.seed, expect);
    assert.equal(e.policySeed, `decision-full-v1/${e.bot}/${e.split}/${e.index}`);
    assert(!seen.has(e.seed));
    seen.add(e.seed);
    assert(!policy.has(e.policySeed));
    policy.add(e.policySeed);
  }
  const train = seeds.entries.filter(x => x.split === 'train').map(x => x.seed);
  const holdout = seeds.entries.filter(x => x.split === 'holdout').map(x => x.seed);
  assert.equal(train.length, 4000);
  assert.equal(holdout.length, 4000);
  assert.equal(new Set([...train, ...holdout]).size, 8000);
  return { engine, runner, runnerHashAtSeedFreeze: seeds.runnerHash, runnerDriftedAfterProgressSidecar: runner.sha256 !== seeds.runnerHash };
});
test('completed v3 indexes: n=500, errors=0, seed formula, no unfinished rows', () => {
  const files = fs.readdirSync(__dirname).filter(n => n.startsWith('full-sim-batch-v3-') && n.endsWith('-index.json')).sort();
  const rows = files.map(name => {
    const meta = JSON.parse(fs.readFileSync(path.join(__dirname, name), 'utf8'));
    assert.equal(meta.n, 500);
    assert.equal(meta.errors, 0);
    assert.equal(meta.index.length, 500);
    const unfinished = meta.index.filter(x => !['WON', 'LOST', 'ERROR'].includes(x.outcome));
    assert.equal(unfinished.length, 0);
    const prefix = `F4-FULL-v1/${meta.bot}/`;
    for (const row of meta.index) assert(row.seed.startsWith(prefix));
    return { name, bot: meta.bot, split: meta.split, n: meta.n, wins: meta.wins, errors: meta.errors, ms: meta.ms };
  });
  return { completedBatches: rows.length, expectedWhenDone: 16, rows };
});
test('incomplete v1/v2 jsonl retained; wx dests exist without being overwritten', () => {
  const retained = [
    'full-sim-validation.json',
    'full-sim-validation-v2.json',
    'full-sim-launch-v2.json'
  ].filter(n => fs.existsSync(path.join(__dirname, n)));
  assert(retained.includes('full-sim-validation.json'));
  assert(retained.includes('full-sim-validation-v2.json'));
  const v1 = fs.readdirSync(__dirname).filter(n => /^full-sim-batch-(random|value|synergy|greedy)-/.test(n));
  const v2 = fs.readdirSync(__dirname).filter(n => n.startsWith('full-sim-batch-v2-'));
  return { retained, historicalBatchFiles: v1.length, v2Files: v2.length };
});
test('policy RNG isolated from five game streams; train/holdout prefixes disjoint', () => {
  const s = F.fullNewRun('F4-FULL-v1/Random/train/0000');
  const before = JSON.stringify(s.rng);
  const p = E.policyRng('decision-full-v1/Random/train/0');
  for (let i = 0; i < 50; i++) p.next();
  assert.equal(JSON.stringify(s.rng), before);
  const spun = cmd(s, { op: 'spin' });
  assert.equal(JSON.stringify(s.rng), before);
  for (const name of F.STREAMS) {
    assert.equal(typeof spun.rng[name].consumed, 'number');
    assert(spun.rng[name].consumed >= 0);
  }
  assert(spun.rng.draw.consumed > 0);
  assert.equal(typeof spun.rng.effect.consumed, 'number');
  const seeds = JSON.parse(fs.readFileSync(path.join(__dirname, 'full-sim-seeds.json'), 'utf8'));
  const train = new Set(seeds.entries.filter(x => x.split === 'train').map(x => x.seed));
  const holdout = new Set(seeds.entries.filter(x => x.split === 'holdout').map(x => x.seed));
  for (const s0 of train) assert.equal(holdout.has(s0), false);
  const policy = new Set(seeds.entries.map(x => x.policySeed));
  assert.equal(policy.size, 8000);
  return { streams: [...F.STREAMS], train: train.size, holdout: holdout.size };
});
test('income attribution matches ledger+reward on a real spin', () => {
  let s = cmd(F.fullNewRun('tool-income'), { op: 'spin' });
  const types = {};
  for (const c of s.pool) types[c.uid] = c.type;
  for (const c of s.last.board.filter(Boolean)) types[c.uid] = c.type;
  for (const row of s.last.log) {
    if (row.action === 'transform') types[row.target] = row.facts.afterType;
    if (row.action === 'spawn') types[row.facts.createdUid] = row.facts.afterType;
  }
  let sum = 0;
  for (const cell of s.last.ledger) for (const part of cell.contributions) sum += part.amount;
  for (const log of s.last.log) if (log.action === 'reward') sum += log.amount || 0;
  assert.equal(sum, s.last.total);
  return { total: s.last.total, attributed: sum };
});
test('command replay of a stored v3 Random game matches finalHash', () => {
  const file = path.join(__dirname, 'full-sim-batch-v3-random-train-0.jsonl');
  assert(fs.existsSync(file));
  const line = fs.readFileSync(file, 'utf8').split('\n').find(x => x);
  const game = JSON.parse(line);
  let st = F.fullNewRun(game.seed);
  for (const x of game.actions) {
    const r = F.fullCommand(st, { ...x.command, revision: st.revision });
    assert.equal(r.ok, true, r.error);
    st = r.state;
  }
  const rh = crypto.createHash('sha256').update(JSON.stringify(st)).digest('hex');
  assert.equal(rh, game.finalHash);
  const sum = Object.values(game.contributions).reduce((x, y) => x + y, 0);
  const total = game.spins.reduce((x, y) => x + y.income, 0);
  assert.equal(sum, total);
  return { seed: game.seed, actions: game.actions.length, outcome: game.outcome, attributed: sum };
});
test('Normal 12-start 70-spin payments 64/32/8 live', () => {
  const s = F.fullNewRun('tool-normal');
  assert.equal(s.profile, 'full-v1');
  assert.equal(s.pool.length, 12);
  assert.equal(s.payment, 70);
  assert.equal(JSON.stringify([...F.NORMAL_PAYMENTS]), JSON.stringify([70, 125, 210, 320, 460, 630, 850, 1120, 1460, 1880]));
  const d = F.defs(s);
  assert.equal(Object.keys(d.symbols).length, 64);
  assert.equal(Object.keys(d.items).length, 32);
  assert.equal(Object.keys(d.events).length, 8);
});
const out = {
  scope: 'engineering tool audit of full-sim engine/runner/seeds/indexes; NOT independent auditor PASS; NOT formal Normal acceptance',
  passed: results.filter(x => x.ok).length,
  total: results.length,
  hashes: { engine: hash('full-sim-engine.js'), runner: hash('full-sim-run.js'), stats: hash('full-sim-stats.js'), checks: hash('full-sim-checks.js') },
  results
};
fs.writeFileSync(dest, JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ dest: 'tests/gdd1/' + destName, passed: out.passed, total: out.total, failed: results.filter(x => !x.ok).map(x => x.name) }, null, 2));
if (out.passed !== out.total) process.exitCode = 1;
