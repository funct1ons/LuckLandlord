'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');
const dest = path.join(__dirname, 'f4-grok-node-gates-v1.json');
if (fs.existsSync(dest)) throw Error('Refuse existing output ' + dest);

const root = path.join(__dirname, '../..');
const ctx = { console };
ctx.globalThis = ctx;
vm.createContext(ctx);
for (const f of ['contract', 'rng', 'schema', 'save', 'full-save', 'content', 'full-content', 'full-effects', 'offers', 'resolver', 'controller', 'full-controller']) {
  vm.runInContext(fs.readFileSync(path.join(root, 'js/gdd1', f + '.js'), 'utf8'), ctx);
}
const F = ctx.GDD1;
const cases = [];

function t(name, fn) {
  try {
    fn();
    cases.push({ name, ok: true });
  } catch (e) {
    cases.push({ name, ok: false, error: e.message });
  }
}

t('save-keys-isolation-previous-import-faults', () => {
  const data = new Map();
  const writes = [];
  const storage = { getItem: k => data.has(k) ? data.get(k) : null, setItem(k, v) { writes.push(k); data.set(k, v); } };
  const slice = F.sliceNewRun('SLICE-KEEP');
  const full = F.fullNewRun('FULL-KEEP');
  assert(F.store(storage, slice).ok);
  const old = data.get(F.SAVE_KEY);
  assert(F.store(storage, full).ok);
  assert.strictEqual(data.get(F.SAVE_KEY), old);
  assert.deepStrictEqual(F.load(storage, 'slice-abd-v1').state, slice);
  assert.deepStrictEqual(F.load(storage, 'full-v1').state, full);
  assert.deepStrictEqual(writes, [F.SAVE_KEY, F.FULL_SAVE_KEY]);
  let r = F.fullCommand(full, { op: 'spin', revision: full.revision });
  assert(r.ok, r.error);
  assert(F.store(storage, r.state).ok);
  assert.strictEqual(data.get(F.SAVE_KEY), old);
  assert.deepStrictEqual(F.load(storage, 'full-v1').state, r.state);
  const record = JSON.parse(data.get(F.FULL_SAVE_KEY));
  assert.deepStrictEqual(record.previous, full);
  const snapshot = JSON.stringify([...data]);
  const count = writes.length;
  const fail = F.commitImport(storage, '{"schema":999}', () => { throw Error('must not preview'); }, 'full-v1');
  assert(!fail.ok);
  assert.strictEqual(JSON.stringify([...data]), snapshot);
  assert.strictEqual(writes.length, count);
  r = F.commitImport(storage, F.encode(full), () => { throw Error('preview failure'); }, 'full-v1');
  assert(!r.ok);
  assert.strictEqual(JSON.stringify([...data]), snapshot);
  r = F.commitImport(storage, F.encode(full), () => undefined, 'full-v1');
  assert(r.ok, r.error);
  assert.strictEqual(data.get(F.SAVE_KEY), old);
  const failedStorage = { getItem: k => storage.getItem(k), setItem() { throw Error('quota'); } };
  const before = JSON.stringify([...data]);
  r = F.store(failedStorage, full);
  assert(!r.ok);
  assert.strictEqual(JSON.stringify([...data]), before);
});

t('wrong-profile-import-legacy-keys', () => {
  const bytes = new Map(F.LEGACY_KEYS.map((k, i) => [k, 'legacy-bytes-' + i]));
  const writes = [];
  const storage = { getItem: k => bytes.has(k) ? bytes.get(k) : null, setItem(k, v) { writes.push(k); bytes.set(k, v); } };
  const full = F.fullNewRun('BOUNDARY-FULL');
  const slice = F.sliceNewRun('BOUNDARY-SLICE');
  assert(F.store(storage, full).ok);
  assert(F.store(storage, slice).ok);
  const initial = JSON.stringify([...bytes]);
  let previews = 0;
  for (const [state, expected] of [[slice, 'full-v1'], [full, 'slice-abd-v1']]) {
    const count = writes.length;
    const r = F.commitImport(storage, F.encode(state), () => { previews++; }, expected);
    assert(!r.ok);
    assert(r.error.includes('profile mismatch'));
    assert.strictEqual(previews, 0);
    assert.strictEqual(writes.length, count);
    assert.strictEqual(JSON.stringify([...bytes]), initial);
  }
});

t('rng-atomic-failed-command', () => {
  const s = F.fullNewRun('RNG-ATOMIC');
  const before = JSON.stringify(s);
  const rng = JSON.stringify(s.rng);
  const bad = F.fullCommand(s, { op: 'spin', revision: s.revision - 1 });
  assert(!bad.ok);
  assert.strictEqual(JSON.stringify(s), before);
  assert.strictEqual(JSON.stringify(s.rng), rng);
  const ok = F.fullCommand(s, { op: 'spin', revision: s.revision });
  assert(ok.ok, ok.error);
  assert.strictEqual(JSON.stringify(s), before);
  assert.notStrictEqual(JSON.stringify(ok.state.rng.draw), JSON.stringify(s.rng.draw));
  assert.strictEqual(ok.state.pendingSettlement, ok.state.last.total);
});

t('payment-skip-double-click', () => {
  const s = F.fullNewRun('PAY-DBL');
  const spun = F.fullCommand(s, { op: 'spin', revision: s.revision });
  assert(spun.ok, spun.error);
  const skip = F.fullCommand(spun.state, { op: 'skip', windowId: spun.state.offer.windowId, revision: spun.state.revision });
  assert(skip.ok, skip.error);
  const again = F.fullCommand(skip.state, { op: 'skip', windowId: spun.state.offer.windowId, revision: spun.state.revision });
  assert(!again.ok);
  const stale = F.fullCommand(spun.state, { op: 'skip', windowId: spun.state.offer.windowId, revision: spun.state.revision });
  assert(stale.ok, stale.error);
  assert.deepStrictEqual(stale.state, skip.state);
});

t('pending-remove-retains-settlement', () => {
  const s = F.fullNewRun('PENDING-RM');
  const spun = F.fullCommand(s, { op: 'spin', revision: s.revision });
  assert(spun.ok, spun.error);
  const pending = spun.state.pendingSettlement;
  assert.strictEqual(pending, spun.state.last.total);
  const uid = spun.state.pool[0].uid;
  const removed = F.fullCommand(spun.state, { op: 'remove', uid, confirmEmpty: true, revision: spun.state.revision });
  assert(removed.ok, removed.error);
  assert.strictEqual(removed.state.pendingSettlement, pending);
  assert.strictEqual(JSON.stringify(spun.state.rng.draw), JSON.stringify(removed.state.rng.draw));
  assert.strictEqual(JSON.stringify(spun.state.rng.effect), JSON.stringify(removed.state.rng.effect));
  assert.strictEqual(JSON.stringify(spun.state.rng.event), JSON.stringify(removed.state.rng.event));
});

t('event-double-click', () => {
  let base = F.fullNewRun('EVT-DBL');
  base.cash = 100000;
  let guard = 0;
  while ((base.stageId < 3 || base.phase !== 'READY') && guard++ < 400) {
    const c = base.phase === 'READY' ? { op: 'spin' }
      : base.phase === 'SYMBOL_CHOICE' ? { op: 'skip', windowId: base.offer.windowId }
        : base.phase === 'ITEM_CHOICE' ? { op: 'skipItem', windowId: base.offer.windowId }
          : { op: 'event', id: base.events.choice.id, option: 'B' };
    const r = F.fullCommand(base, Object.assign(c, { revision: base.revision }));
    assert(r.ok, r.error);
    base = r.state;
  }
  const s = F.clone(base);
  s.pool = [F.instance(s, 'mist_pouch')];
  s.events = {
    seenIds: ['event_fog_shift'], count: 1, cooldownPayments: 1, activeModifiers: [],
    choice: { id: 'event_fog_shift', options: ['A', 'B'], targetUids: F.fullEventTargets(s, 'event_fog_shift'), cost: F.fullEvents.event_fog_shift.cost, stageId: s.stageId }
  };
  s.phase = 'EVENT_CHOICE';
  F.validateState(s);
  const a = F.fullCommand(s, { op: 'event', id: 'event_fog_shift', option: 'A', revision: s.revision });
  assert(a.ok, a.error);
  const again = F.fullCommand(a.state, { op: 'event', id: 'event_fog_shift', option: 'A', revision: a.state.revision });
  assert(!again.ok);
});

t('payments-table-matches-gdd', () => {
  assert.deepStrictEqual(F.PROFILES['full-v1'].payments, [70, 125, 210, 320, 460, 630, 850, 1120, 1460, 1880]);
});

const result = {
  scope: 'Independent Node save/RNG/payment/pending/event-double-click gates; not Edge UI and not auditor signature',
  total: cases.length,
  passed: cases.filter(x => x.ok).length,
  cases,
  ok: cases.every(x => x.ok)
};
fs.writeFileSync(dest, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ dest: 'tests/gdd1/f4-grok-node-gates-v1.json', total: result.total, passed: result.passed, ok: result.ok, failed: cases.filter(x => !x.ok) }, null, 2));
if (!result.ok) process.exitCode = 1;
