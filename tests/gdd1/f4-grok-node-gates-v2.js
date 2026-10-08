'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const dest = path.join(__dirname, 'f4-grok-node-gates-v2.json');
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
const eq = (a, b, msg) => {
  const left = JSON.stringify(a);
  const right = JSON.stringify(b);
  if (left !== right) throw Error((msg || 'not equal') + ' ' + left + ' vs ' + right);
};

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
  if (!F.store(storage, slice).ok) throw Error('store slice');
  const old = data.get(F.SAVE_KEY);
  if (!F.store(storage, full).ok) throw Error('store full');
  if (data.get(F.SAVE_KEY) !== old) throw Error('slice key mutated');
  eq(F.load(storage, 'slice-abd-v1').state, slice, 'load slice');
  eq(F.load(storage, 'full-v1').state, full, 'load full');
  eq(writes, [F.SAVE_KEY, F.FULL_SAVE_KEY], 'writes');
  let r = F.fullCommand(full, { op: 'spin', revision: full.revision });
  if (!r.ok) throw Error(r.error);
  if (!F.store(storage, r.state).ok) throw Error('store spun');
  if (data.get(F.SAVE_KEY) !== old) throw Error('slice key mutated after spin');
  eq(F.load(storage, 'full-v1').state, r.state, 'load spun');
  const record = JSON.parse(data.get(F.FULL_SAVE_KEY));
  eq(record.previous, full, 'previous');
  const snapshot = JSON.stringify([...data]);
  const count = writes.length;
  const fail = F.commitImport(storage, '{"schema":999}', () => { throw Error('must not preview'); }, 'full-v1');
  if (fail.ok) throw Error('invalid import accepted');
  if (JSON.stringify([...data]) !== snapshot) throw Error('invalid import wrote');
  if (writes.length !== count) throw Error('invalid import extra write');
  r = F.commitImport(storage, F.encode(full), () => { throw Error('preview failure'); }, 'full-v1');
  if (r.ok) throw Error('preview throw accepted');
  if (JSON.stringify([...data]) !== snapshot) throw Error('preview throw wrote');
  r = F.commitImport(storage, F.encode(full), () => undefined, 'full-v1');
  if (!r.ok) throw Error(r.error);
  if (data.get(F.SAVE_KEY) !== old) throw Error('slice key mutated after import');
  const failedStorage = { getItem: k => storage.getItem(k), setItem() { throw Error('quota'); } };
  const before = JSON.stringify([...data]);
  r = F.store(failedStorage, full);
  if (r.ok) throw Error('quota store accepted');
  if (JSON.stringify([...data]) !== before) throw Error('quota store wrote');
});

t('wrong-profile-import-legacy-keys', () => {
  const bytes = new Map(F.LEGACY_KEYS.map((k, i) => [k, 'legacy-bytes-' + i]));
  const writes = [];
  const storage = { getItem: k => bytes.has(k) ? bytes.get(k) : null, setItem(k, v) { writes.push(k); bytes.set(k, v); } };
  const full = F.fullNewRun('BOUNDARY-FULL');
  const slice = F.sliceNewRun('BOUNDARY-SLICE');
  if (!F.store(storage, full).ok) throw Error('store full');
  if (!F.store(storage, slice).ok) throw Error('store slice');
  const initial = JSON.stringify([...bytes]);
  let previews = 0;
  for (const [state, expected] of [[slice, 'full-v1'], [full, 'slice-abd-v1']]) {
    const count = writes.length;
    const r = F.commitImport(storage, F.encode(state), () => { previews++; }, expected);
    if (r.ok) throw Error('wrong profile accepted');
    if (!String(r.error).includes('profile mismatch')) throw Error(r.error);
    if (previews !== 0) throw Error('preview ran');
    if (writes.length !== count) throw Error('wrong profile wrote');
    if (JSON.stringify([...bytes]) !== initial) throw Error('wrong profile mutated');
  }
});

t('rng-atomic-failed-command', () => {
  const s = F.fullNewRun('RNG-ATOMIC');
  const before = JSON.stringify(s);
  const rng = JSON.stringify(s.rng);
  const bad = F.fullCommand(s, { op: 'spin', revision: s.revision - 1 });
  if (bad.ok) throw Error('stale revision accepted');
  if (JSON.stringify(s) !== before) throw Error('input mutated');
  if (JSON.stringify(s.rng) !== rng) throw Error('rng mutated');
  const ok = F.fullCommand(s, { op: 'spin', revision: s.revision });
  if (!ok.ok) throw Error(ok.error);
  if (JSON.stringify(s) !== before) throw Error('success mutated input');
  if (JSON.stringify(ok.state.rng.draw) === JSON.stringify(s.rng.draw)) throw Error('draw rng not consumed');
  if (ok.state.pendingSettlement !== ok.state.last.total) throw Error('pending');
});

t('payment-skip-double-click', () => {
  const s = F.fullNewRun('PAY-DBL');
  const spun = F.fullCommand(s, { op: 'spin', revision: s.revision });
  if (!spun.ok) throw Error(spun.error);
  const skip = F.fullCommand(spun.state, { op: 'skip', windowId: spun.state.offer.windowId, revision: spun.state.revision });
  if (!skip.ok) throw Error(skip.error);
  const again = F.fullCommand(skip.state, { op: 'skip', windowId: spun.state.offer.windowId, revision: spun.state.revision });
  if (again.ok) throw Error('double skip accepted');
  const stale = F.fullCommand(spun.state, { op: 'skip', windowId: spun.state.offer.windowId, revision: spun.state.revision });
  if (!stale.ok) throw Error(stale.error);
  eq(stale.state, skip.state, 'replay');
});

t('pending-remove-retains-settlement', () => {
  const s = F.fullNewRun('PENDING-RM');
  const spun = F.fullCommand(s, { op: 'spin', revision: s.revision });
  if (!spun.ok) throw Error(spun.error);
  const pending = spun.state.pendingSettlement;
  if (pending !== spun.state.last.total) throw Error('pending != total');
  const uid = spun.state.pool[0].uid;
  const removed = F.fullCommand(spun.state, { op: 'remove', uid, confirmEmpty: true, revision: spun.state.revision });
  if (!removed.ok) throw Error(removed.error);
  if (removed.state.pendingSettlement !== pending) throw Error('pending lost');
  eq(removed.state.rng.draw, spun.state.rng.draw, 'draw');
  eq(removed.state.rng.effect, spun.state.rng.effect, 'effect');
  eq(removed.state.rng.event, spun.state.rng.event, 'event');
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
    if (!r.ok) throw Error(r.error);
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
  if (!a.ok) throw Error(a.error);
  const again = F.fullCommand(a.state, { op: 'event', id: 'event_fog_shift', option: 'A', revision: a.state.revision });
  if (again.ok) throw Error('event double-click accepted');
});

t('payments-table-matches-gdd', () => {
  eq(F.PROFILES['full-v1'].payments, [70, 125, 210, 320, 460, 630, 850, 1120, 1460, 1880], 'payments');
});

const result = {
  scope: 'Independent Node save/RNG/payment/pending/event-double-click gates; not Edge UI and not auditor signature',
  supersedes: {
    retained: 'tests/gdd1/f4-grok-node-gates-v1.json',
    basis: 'v1 used assert.deepStrictEqual across vm realms; v2 uses JSON.stringify equality'
  },
  total: cases.length,
  passed: cases.filter(x => x.ok).length,
  cases,
  ok: cases.every(x => x.ok)
};
fs.writeFileSync(dest, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ dest: 'tests/gdd1/f4-grok-node-gates-v2.json', total: result.total, passed: result.passed, ok: result.ok, failed: cases.filter(x => !x.ok) }, null, 2));
if (!result.ok) process.exitCode = 1;
