'use strict';
const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const E = require('./full-sim-engine');
const V3 = require('./full-sim-engine-policy-v3');
const destName = process.argv[2] || 'full-sim-policy-v3-checks.json';
if (!/^full-sim-policy-v3-[\w.-]+\.json$/.test(destName)) throw Error('Unsafe dest');
const dest = path.join(__dirname, destName);
if (fs.existsSync(dest)) throw Error('Refuse existing ' + dest);
const results = [];
function test(name, fn) {
  try { const detail = fn(); results.push({ name, ok: true, detail: detail === undefined ? true : detail }); }
  catch (e) { results.push({ name, ok: false, error: e.stack || String(e) }); }
}
function cmd(s, a) {
  const r = V3.F.fullCommand(s, { ...a, revision: s.revision });
  assert.equal(r.ok, true, r.error);
  return r.state;
}
test('production resolver/full-effects/GDD bytes unchanged', () => {
  const hash = rel => crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname, '../..', rel))).digest('hex');
  assert.equal(hash('js/gdd1/resolver.js'), 'e86d51fb4c20d235312b263146f18d2c4cd69c13453846fe0daf9b07a0aaf88b');
  assert.equal(hash('js/gdd1/full-effects.js'), 'f65bc06b4c38fb35db14cc21f6ed4c63a42efbb06956f71078974990c5d8de55');
  assert.equal(hash('docs/GAME_DESIGN_V1.md'), 'e33e1699aed464cd656abc2344d9e68be92a7238da482f9861e5e67dedc8df07');
});
test('v1 and v2 evidence still present', () => {
  for (const p of [
    'full-sim-statistics.json',
    'full-sim-policy-v2-statistics.json',
    'full-sim-policy-v2-batch-value-holdout-0.jsonl',
    'full-sim-batch-v3-value-holdout-0.jsonl',
    'f4-grok-freeze-v4.json',
    'f4-grok-freeze-policy-v2.json'
  ]) assert(fs.existsSync(path.join(__dirname, p)), p);
});
test('constants horizon 8 / cap 64 / remove beam 8 / model seed v3', () => {
  assert.equal(V3.HORIZON_SPINS, 8);
  assert.equal(V3.COMMAND_CAP, 64);
  assert.equal(V3.REMOVE_BEAM, 8);
  assert.equal(V3.MODEL_SEED, 'full-sim-model-v3/0');
  assert(V3.LOOKAHEAD.includes('HORIZON') || V3.LOOKAHEAD.includes('8'));
  assert(V3.LOOKAHEAD.includes(V3.MODEL_SEED));
});
test('publicView and decideV3 ignore live seed/RNG', () => {
  let s = cmd(V3.F.fullNewRun('probe-v3'), { op: 'spin' });
  const before = JSON.stringify(s);
  const a = V3.decideV3('Greedy', V3.publicView(s));
  const t = E.copy(s);
  t.seed = 'peek-forbidden';
  t.rng = V3.F.createRng(t.seed, t.profile, t.difficulty);
  const b = V3.decideV3('Greedy', V3.publicView(t));
  assert.deepEqual(a.action, b.action);
  assert.equal(JSON.stringify(s), before);
  const sur = V3.surrogateV3(V3.publicView(s));
  assert.equal(sur.seed, V3.MODEL_SEED);
  assert.equal('rng' in V3.publicView(s), false);
  assert.equal('seed' in V3.publicView(s), false);
  return { action: a.action, modelCommands: a.modelCommands, candidates: a.candidates };
});
test('root candidates include skipItem, reroll, and remove when legal; remove beam wider than 3', () => {
  let s = cmd(V3.F.fullNewRun('cand-v3'), { op: 'spin' });
  const v = V3.publicView(s);
  const c = V3.rootCandidates(v);
  const ops = new Set(c.map(x => x.op));
  assert(ops.has('choose') && ops.has('skip') && ops.has('reroll') && ops.has('remove'));
  const removes = c.filter(x => x.op === 'remove');
  const legalRemoves = V3.legal(v).filter(x => x.op === 'remove');
  assert(removes.length === Math.min(V3.REMOVE_BEAM, legalRemoves.length));
  assert(removes.length > 3 || legalRemoves.length <= 3);
  let item = null, guard = 0, t = V3.F.fullNewRun('item-v3');
  while (!item && !['WON', 'LOST'].includes(t.phase) && guard++ < 400) {
    if (t.phase === 'READY') t = cmd(t, { op: 'spin' });
    else if (t.phase === 'SYMBOL_CHOICE') t = cmd(t, { op: 'skip', windowId: t.offer.windowId });
    else if (t.phase === 'ITEM_CHOICE') item = t;
    else t = cmd(t, { op: 'event', id: t.events.choice.id, option: 'B' });
  }
  assert(item, 'ITEM_CHOICE not reached');
  const itemOps = new Set(V3.rootCandidates(V3.publicView(item)).map(x => x.op));
  assert(itemOps.has('item') && itemOps.has('skipItem'));
  return { symbolOps: [...ops], itemOps: [...itemOps], removeCandidates: removes.length, legalRemoves: legalRemoves.length };
});
test('horizon 8 spins / 64 commands; model offers do not read live streams; Random throws', () => {
  const s = cmd(V3.F.fullNewRun('horizon-v3'), { op: 'spin' });
  const v = V3.publicView(s);
  const a = { op: 'choose', id: v.offer.choices[0], windowId: v.offer.windowId };
  const r = V3.rolloutV3(v, a, true);
  assert(r.spins <= V3.HORIZON_SPINS);
  assert(r.commands <= V3.COMMAND_CAP);
  const live = JSON.stringify(s.rng);
  V3.rolloutV3(v, a, true);
  assert.equal(JSON.stringify(s.rng), live);
  assert.throws(() => V3.decideV3('Random', v), /does not re-run Random/);
  return r;
});
const pass = results.every(x => x.ok);
fs.writeFileSync(dest, JSON.stringify({ dest: destName, pass, passed: results.filter(x => x.ok).length, total: results.length, results }, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ dest: destName, pass, passed: results.filter(x => x.ok).length, total: results.length }));
if (!pass) process.exitCode = 1;
