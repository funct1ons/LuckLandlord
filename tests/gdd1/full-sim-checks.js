'use strict';
const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const E = require('./full-sim-engine');
const { F, copy } = E;
const destName = process.argv[2] || 'full-sim-validation-v2.json';
if (!/^full-sim-[\w.-]+\.json$/.test(destName)) throw Error('Unsafe dest ' + destName);
const dest = path.join(__dirname, destName);
if (fs.existsSync(dest)) throw Error('Refuse existing ' + dest);
const results = [];
function test(name, fn) {
  try { fn(); results.push({ name, ok: true }); }
  catch (e) { results.push({ name, ok: false, error: e.stack || String(e) }); }
}
function cmd(s, a) {
  const r = F.fullCommand(s, { ...a, revision: s.revision });
  assert.equal(r.ok, true, r.error);
  return r.state;
}
test('full new run is 12-start Normal payments and five RNG streams', () => {
  const s = F.fullNewRun('probe');
  assert.equal(s.profile, 'full-v1');
  assert.equal(s.pool.length, 12);
  assert.deepEqual(s.pool.map(x => x.type), F.FULL_INITIAL);
  assert.equal(s.payment, 70);
  assert.equal(JSON.stringify([...F.NORMAL_PAYMENTS]), JSON.stringify([70, 125, 210, 320, 460, 630, 850, 1120, 1460, 1880]));
  assert.equal(JSON.stringify([...F.STREAMS]), JSON.stringify(['draw', 'effect', 'symbolOffer', 'itemOffer', 'event']));
  for (const name of F.STREAMS) assert.equal(s.rng[name].consumed, 0);
});
test('public view hides live seed and five RNG states', () => {
  const s = F.fullNewRun('probe');
  const v = E.publicView(s);
  assert.equal('rng' in v, false);
  assert.equal('seed' in v, false);
  assert.equal(JSON.stringify(s), JSON.stringify(F.fullNewRun('probe')));
});
test('Greedy decision invariant to hidden seed and RNG; clone does not mutate live', () => {
  let s = cmd(F.fullNewRun('probe'), { op: 'spin' }), before = JSON.stringify(s);
  const a = E.decide('Greedy', E.publicView(s), E.policyRng('x'));
  const t = copy(s);
  t.seed = 'different';
  t.rng = F.createRng(t.seed, t.profile, t.difficulty);
  const b = E.decide('Greedy', E.publicView(t), E.policyRng('x'));
  assert.deepEqual(a.action, b.action);
  assert.equal(JSON.stringify(s), before);
  assert(a.modelCommands > 0);
});
test('rollout future offer contents do not affect candidate utility', () => {
  const s = cmd(F.fullNewRun('future-offer'), { op: 'spin' }), v = E.publicView(s), a = { op: 'choose', id: v.offer.choices[0], windowId: v.offer.windowId };
  const baseline = E.rollout(v, a);
  const original = F.sliceOffer;
  try {
    F.sliceOffer = function (st, kind, ...rest) {
      original(st, kind, ...rest);
      st.offer.choices = kind === 'symbol' ? ['wick_bed'] : Object.keys(F.fullItems).filter(id => !st.items.includes(id)).slice(0, 1);
    };
    assert.deepEqual(E.rollout(v, a), baseline);
  } finally { F.sliceOffer = original; }
});
test('policy RNG independent, replayable and strategy separated', () => {
  const a = E.policyRng('Random/train/0'), b = E.policyRng('Random/train/0'), c = E.policyRng('Value/train/0');
  const seq = Array.from({ length: 20 }, () => a.next());
  assert.deepEqual(seq, Array.from({ length: 20 }, () => b.next()));
  assert.notDeepEqual(seq, Array.from({ length: 20 }, () => c.next()));
  const s = F.fullNewRun('rng');
  const before = JSON.stringify(s.rng);
  a.next();
  assert.equal(JSON.stringify(s.rng), before);
});
test('reroll consumes one token only symbolOffer, preserves pending and window', () => {
  let s = cmd(F.fullNewRun('reroll'), { op: 'spin' }), old = copy(s);
  s = cmd(s, { op: 'reroll', windowId: s.offer.windowId });
  assert.equal(s.rerollTokens, old.rerollTokens - 1);
  assert.equal(s.pendingSettlement, old.pendingSettlement);
  assert.equal(s.offer.windowId, old.offer.windowId);
  assert.equal(s.offer.choiceRefreshesUsed, 1);
  for (const k of ['draw', 'effect', 'event', 'itemOffer']) assert.equal(JSON.stringify(s.rng[k]), JSON.stringify(old.rng[k]));
  assert(s.rng.symbolOffer.consumed > old.rng.symbolOffer.consumed);
});
test('remove in pending consumes one token without altering earned ledger or RNG', () => {
  let s = cmd(F.fullNewRun('remove'), { op: 'spin' }), old = copy(s);
  s = cmd(s, { op: 'remove', uid: s.pool[0].uid });
  assert.equal(s.removeTokens, old.removeTokens - 1);
  assert.equal(s.pool.length, old.pool.length - 1);
  assert.equal(s.pendingSettlement, old.pendingSettlement);
  assert.equal(JSON.stringify(s.last), JSON.stringify(old.last));
  assert.equal(JSON.stringify(s.rng), JSON.stringify(old.rng));
});
test('skip settles actual pending; choose cannot rescue short payment; no false success', () => {
  let s = F.fullNewRun('payment');
  for (let i = 0; i < 5; i++) { s = cmd(s, { op: 'spin' }); s = cmd(s, { op: 'skip', windowId: s.offer.windowId }); }
  s = cmd(s, { op: 'spin' });
  s.cash = 0;
  s.payment = s.basePayment = F.NORMAL_PAYMENTS[0];
  assert(s.pendingSettlement < s.payment);
  const pending = s.pendingSettlement;
  const r = cmd(s, { op: 'choose', id: s.offer.choices[0], windowId: s.offer.windowId });
  assert.equal(r.phase, 'LOST');
  assert.equal(r.pendingSettlement, null);
  assert.equal(r.cash, pending);
  assert.deepEqual(r.rng.itemOffer, s.rng.itemOffer);
});
test('exact payment item skip grants next-stage resources; no repeated payment', () => {
  let s = F.fullNewRun('payment2');
  for (let i = 0; i < 6; i++) {
    s = cmd(s, { op: 'spin' });
    if (i === 5) s.cash = s.payment - s.pendingSettlement;
    s = cmd(s, { op: 'skip', windowId: s.offer.windowId });
  }
  assert.equal(s.phase, 'ITEM_CHOICE');
  assert.equal(s.cash, 0);
  const tokens = s.rerollTokens;
  s = cmd(s, { op: 'skipItem', windowId: s.offer.windowId });
  assert.equal(s.stageId, 2);
  assert.equal(s.payment, 125);
  assert.equal(s.rerollTokens, Math.min(9, tokens + 1));
  assert.equal(s.cash, 0);
});
test('actual event A/B and invalid target rollback on reachable event', () => {
  let found = null;
  for (let i = 0; i < 400 && !found; i++) {
    let s = F.fullNewRun('event-probe/' + i);
    let guard = 0;
    while (s.stageId < 9 && s.phase !== 'EVENT_CHOICE' && !['WON', 'LOST'].includes(s.phase) && guard++ < 400) {
      if (s.phase === 'READY') s = cmd(s, { op: 'spin' });
      else if (s.phase === 'SYMBOL_CHOICE') s = cmd(s, { op: 'skip', windowId: s.offer.windowId });
      else if (s.phase === 'ITEM_CHOICE') s = cmd(s, { op: 'skipItem', windowId: s.offer.windowId });
      else s = cmd(s, { op: 'event', id: s.events.choice.id, option: 'B' });
    }
    if (s.phase === 'EVENT_CHOICE') found = s;
  }
  assert(found, 'no event reached');
  const s = found, before = JSON.stringify(s);
  const fail = F.fullCommand(s, { op: 'event', id: s.events.choice.id, option: 'A', uid: 'u999999', revision: s.revision });
  assert.equal(fail.ok, false);
  assert.equal(JSON.stringify(s), before);
  const b = cmd(s, { op: 'event', id: s.events.choice.id, option: 'B' });
  assert.equal(b.cash, s.cash);
  assert.deepEqual(b.pool, s.pool);
  assert.deepEqual(b.rng, s.rng);
  assert.equal(b.events.count, s.events.count);
  if (s.events.choice.targetUids && s.events.choice.targetUids.length) {
    const a = F.fullCommand(s, { op: 'event', id: s.events.choice.id, option: 'A', uid: s.events.choice.targetUids[0], revision: s.revision });
    if (a.ok) {
      assert.equal(a.state.phase, 'READY');
      assert.equal(typeof a.state.cash, 'number');
      const e = F.defs(s).events[s.events.choice.id];
      if (e && e.op === 'modifier') assert.equal(a.state.cash, s.cash - s.events.choice.cost);
    }
  }
});
test('64/32/8 defs live on full profile', () => {
  const s = F.fullNewRun('defs');
  const d = F.defs(s);
  assert.equal(Object.keys(d.symbols).length, 64);
  assert.equal(Object.keys(d.items).length, 32);
  assert.equal(Object.keys(d.events).length, 8);
});
const out = { passed: results.filter(x => x.ok).length, total: results.length, results };
fs.writeFileSync(dest, JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ dest: 'tests/gdd1/' + destName, passed: out.passed, total: out.total, failed: results.filter(x => !x.ok).map(x => x.name) }, null, 2));
if (out.passed !== out.total) process.exitCode = 1;
