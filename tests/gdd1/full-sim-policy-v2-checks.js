'use strict';
const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const E = require('./full-sim-engine');
const V2 = require('./full-sim-engine-policy-v2');
const R2 = require('./full-sim-run-policy-v2');
const destName = process.argv[2] || 'full-sim-policy-v2-checks.json';
if (!/^full-sim-policy-v2-[\w.-]+\.json$/.test(destName)) throw Error('Unsafe dest');
const dest = path.join(__dirname, destName);
if (fs.existsSync(dest)) throw Error('Refuse existing ' + dest);
const results = [];
function test(name, fn) {
  try { const detail = fn(); results.push({ name, ok: true, detail: detail === undefined ? true : detail }); }
  catch (e) { results.push({ name, ok: false, error: e.stack || String(e) }); }
}
function cmd(s, a) {
  const r = V2.F.fullCommand(s, { ...a, revision: s.revision });
  assert.equal(r.ok, true, r.error);
  return r.state;
}
test('production resolver/full-effects bytes unchanged', () => {
  const hash = rel => crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname, '../..', rel))).digest('hex');
  assert.equal(hash('js/gdd1/resolver.js'), 'e86d51fb4c20d235312b263146f18d2c4cd69c13453846fe0daf9b07a0aaf88b');
  assert.equal(hash('js/gdd1/full-effects.js'), 'f65bc06b4c38fb35db14cc21f6ed4c63a42efbb06956f71078974990c5d8de55');
  assert.equal(hash('docs/GAME_DESIGN_V1.md'), 'e33e1699aed464cd656abc2344d9e68be92a7238da482f9861e5e67dedc8df07');
});
test('publicView and decideV2 ignore live seed/RNG', () => {
  let s = cmd(V2.F.fullNewRun('probe-v2'), { op: 'spin' });
  const before = JSON.stringify(s);
  const a = V2.decideV2('Greedy', V2.publicView(s), V2.policyRngV2('x'));
  const t = E.copy(s);
  t.seed = 'peek-forbidden';
  t.rng = V2.F.createRng(t.seed, t.profile, t.difficulty);
  const b = V2.decideV2('Greedy', V2.publicView(t), V2.policyRngV2('x'));
  assert.deepEqual(a.action, b.action);
  assert.equal(JSON.stringify(s), before);
  const sur = V2.surrogateV2(V2.publicView(s));
  assert.equal(sur.seed, V2.MODEL_SEED);
  assert.equal('rng' in V2.publicView(s), false);
  assert.equal('seed' in V2.publicView(s), false);
  return { action: a.action, modelCommands: a.modelCommands, candidates: a.candidates };
});
test('root candidates include skipItem, reroll, and remove when legal', () => {
  let s = cmd(V2.F.fullNewRun('cand-v2'), { op: 'spin' });
  const v = V2.publicView(s);
  const c = V2.rootCandidates(v, true);
  const ops = new Set(c.map(x => x.op));
  assert(ops.has('choose') && ops.has('skip') && ops.has('reroll') && ops.has('remove'));
  let item = null, guard = 0, t = V2.F.fullNewRun('item-v2');
  while (!item && !['WON', 'LOST'].includes(t.phase) && guard++ < 400) {
    if (t.phase === 'READY') t = cmd(t, { op: 'spin' });
    else if (t.phase === 'SYMBOL_CHOICE') t = cmd(t, { op: 'skip', windowId: t.offer.windowId });
    else if (t.phase === 'ITEM_CHOICE') item = t;
    else t = cmd(t, { op: 'event', id: t.events.choice.id, option: 'B' });
  }
  assert(item, 'ITEM_CHOICE not reached');
  const itemOps = new Set(V2.rootCandidates(V2.publicView(item), true).map(x => x.op));
  assert(itemOps.has('item') && itemOps.has('skipItem'));
  return { symbolOps: [...ops], itemOps: [...itemOps] };
});
test('horizon 5 spins / 36 commands; model offers do not read live streams', () => {
  const s = cmd(V2.F.fullNewRun('horizon-v2'), { op: 'spin' });
  const v = V2.publicView(s);
  const a = { op: 'choose', id: v.offer.choices[0], windowId: v.offer.windowId };
  const r = V2.rolloutV2(v, a, true);
  assert(r.spins <= V2.HORIZON_SPINS);
  assert(r.commands <= V2.COMMAND_CAP);
  const live = JSON.stringify(s.rng);
  V2.rolloutV2(v, a, true);
  assert.equal(JSON.stringify(s.rng), live);
  return r;
});
test('Random policy-v2 matches v1 recorded train/0000 finalHash', () => {
  const g = R2.play('Random', 'train', 0);
  assert.equal(g.seed, 'F4-FULL-v1/Random/train/0000');
  assert.equal(g.policySeed, 'decision-full-v1/Random/train/0');
  assert.equal(g.finalHash, '7842310233ff52db850bb5e7599bcbb87f5e3fce4b913dd75b2fa4441b9c7c9e');
  assert.equal(g.won, false);
  return { seed: g.seed, ms: g.ms, outcome: g.outcome };
});
test('v1 batch dests still exist and are not the v2 prefix', () => {
  assert(fs.existsSync(path.join(__dirname, 'full-sim-batch-v3-random-train-0.jsonl')));
  assert.equal(fs.existsSync(path.join(__dirname, 'full-sim-policy-v2-probe-random-train-0.jsonl')), false);
});
const out = { passed: results.filter(x => x.ok).length, total: results.length, lookahead: V2.LOOKAHEAD, results };
fs.writeFileSync(dest, JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ dest: 'tests/gdd1/' + destName, passed: out.passed, total: out.total, failed: results.filter(x => !x.ok).map(x => x.name) }, null, 2));
if (out.passed !== out.total) process.exitCode = 1;
