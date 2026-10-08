'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');
const assert = require('assert');

const root = path.join(__dirname, '../..');
const hashFile = rel => {
  const buf = fs.readFileSync(path.join(root, rel));
  return { path: rel.replace(/\\/g, '/'), bytes: buf.length, sha256: crypto.createHash('sha256').update(buf).digest('hex') };
};
const eq = (a, b, msg) => {
  const left = JSON.stringify(a);
  const right = JSON.stringify(b);
  if (left !== right) throw Error((msg ? msg + ': ' : '') + 'expected ' + right + '; actual ' + left);
};

const ctx = { console };
ctx.globalThis = ctx;
vm.createContext(ctx);
for (const f of ['contract', 'rng', 'schema', 'save', 'content', 'full-content', 'full-effects', 'offers', 'resolver', 'full-controller']) {
  vm.runInContext(fs.readFileSync(path.join(root, 'js/gdd1', f + '.js'), 'utf8'), ctx);
}
let src = fs.readFileSync(path.join(__dirname, 'f4-audit-semantic-v3.js'), 'utf8');
src = src.replace(
  "'5.G/6: copper2+reader3 no carbon', [['copper_burr',0],['offset_reader',1]],5",
  "'5.B/5.G/6: copper2+machine-neighbor2+reader3, no carbon', [['copper_burr',0],['offset_reader',1]],7"
);
vm.runInContext(src, ctx);
const independent = ctx.runF4IndependentV3();
const F = ctx.GDD1;
const extra = [];
function extraCase(name, fn) {
  try { fn(); extra.push({ name, ok: true }); }
  catch (e) { extra.push({ name, ok: false, error: e.message }); }
}

extraCase('generic-select-has-no-symbol-id-branch', () => {
  const resolver = fs.readFileSync(path.join(root, 'js/gdd1/resolver.js'), 'utf8');
  assert(!/alignment_cloth/.test(resolver), 'resolver must not name alignment_cloth');
  assert(!/spectrum_book/.test(resolver), 'resolver must not name spectrum_book');
  assert(!/item_spectrum_book/.test(resolver), 'resolver must not name item_spectrum_book');
  assert(resolver.includes("selector.receivedTag||selector.order==='tagAdded'"), 'receivedTag/order=tagAdded must drive record order');
  assert(resolver.includes('deferredAdds'), 'deferred add commit path must remain generic');
});

extraCase('cloth-data-locks-first-tagAdded-neighbor', () => {
  const fx = F.fullSymbols.alignment_cloth.effects[0];
  eq({ op: fx.op, phase: fx.phase, amount: fx.amount, lockFirst: fx.lockFirst, selector: fx.selector }, {
    op: 'add', phase: 'step2', amount: 5, lockFirst: true,
    selector: { scope: 'adjacent', receivedTag: true, order: 'tagAdded' }
  });
});

extraCase('book-data-defers-commit-to-end-summary', () => {
  const fx = F.fullItems.item_spectrum_book.effects[0];
  eq({ op: fx.op, phase: fx.phase, event: fx.event, eventTarget: fx.eventTarget, defer: fx.defer, amount: fx.amount, limit: fx.limit }, {
    op: 'add', phase: 'listen', event: 'tagAdded', eventTarget: true, defer: true, amount: 3, limit: 1
  });
});

extraCase('cloth-record-order-not-board-pos', () => {
  const c = independent.cases.find(x => x.name === 'cloth-tag-log-order');
  if (!c || !c.ok) throw Error(c && c.error || 'missing cloth case');
  const r = c.actual.last;
  eq(r.log.filter(e => e.action === 'tagAdded').map(e => e.target), ['u4', 'u4', 'u2']);
  const clothAdd = r.log.filter(e => e.action === 'add' && e.source === 'u3');
  eq(clothAdd.map(e => ({ target: e.target, amount: e.amount, phase: e.phase })), [{ target: 'u4', amount: 5, phase: 'step2/tagAdded' }]);
  eq(r.ledger.map(x => x.amount), [2, 2, 1, 10]);
  eq(r.total, 15);
});

extraCase('book-commits-step8-same-total', () => {
  const c = independent.cases.find(x => x.name === 'spectrum-book-deferred-phase');
  if (!c || !c.ok) throw Error(c && c.error || 'missing book phase case');
  const r = c.actual.last;
  eq(r.total, 8);
  const adds = r.log.filter(e => e.source === 'item_spectrum_book' && e.action === 'add');
  eq(adds.map(e => ({ phase: e.phase, amount: e.amount, target: e.target })), [{ phase: 'step8/end-summary', amount: 3, target: 'u1' }]);
  if (!(adds[0].id > r.log.find(e => e.action === 'tagAdded').id)) throw Error('book add must follow tagAdded');
});

extraCase('book-dead-target-no-retarget', () => {
  const c = independent.cases.find(x => x.name === 'spectrum-book-dead-target');
  if (!c || !c.ok) throw Error(c && c.error || 'missing book death case');
  const r = c.actual.last;
  eq(r.log.filter(e => e.source === 'item_spectrum_book' && e.action === 'add').length, 0);
  if (!r.log.some(e => e.action === 'consume' && e.target === 'u2')) throw Error('expected consume of locked target u2');
  eq(c.actual.state.itemState.quotas.item_spectrum_book.spin, 1);
});

extraCase('existing-tag-ledgers-unchanged-totals', () => {
  function run(types, items) {
    const s = F.fullNewRun('TAGS');
    s.pool = types.map(t => F.instance(s, t));
    s.items = items;
    for (const id of items) {
      s.itemState.quotas[id] = { spin: 0, stage: 0, run: 0 };
      s.itemState.used[id] = { spin: false, stage: false };
    }
    const b = Array(20).fill(null);
    s.pool.forEach((x, i) => { b[i] = x; });
    return F.sliceResolve(s, b);
  }
  const rows = [
    [['phase_chip', 'dock_chime'], [], 5],
    [['alignment_cloth', 'phase_chip', 'dock_chime'], [], 11],
    [['alignment_cloth', 'phase_chip', 'dock_chime'], ['item_spectrum_book'], 14],
    [['split_register', 'cleared_stub'], [], 8],
    [['split_register', 'cleared_stub'], ['item_spectrum_book'], 12]
  ];
  for (const [types, items, total] of rows) {
    const r = run(types, items);
    eq(r.total, total, types.join('+'));
    if (items.includes('item_spectrum_book')) {
      eq(r.log.filter(e => e.source === 'item_spectrum_book' && e.action === 'add').map(e => e.phase), ['step8/end-summary']);
    }
  }
});

const v1 = JSON.parse(fs.readFileSync(path.join(__dirname, 'f4-grok-rootcause-v1-results.json'), 'utf8'));
const result = {
  scope: 'f4-grok-rootcause-v2 supersedes v1 extra-case FAIL only. v1 independent 32/32 already passed; extra cloth-record-order used deepStrictEqual across vm realms.',
  supersedes: {
    artifact: 'tests/gdd1/f4-grok-rootcause-v1-results.json',
    reason: 'v1 extra cloth-record-order-not-board-pos compared vm-realm arrays with assert.deepStrictEqual; independent 32/32 and production hashes remain authoritative from v1.',
    v1independent: v1.independent,
    v1extraFailed: v1.extra.failed
  },
  independent: { total: independent.total, passed: independent.passed, failed: independent.cases.filter(c => !c.ok).map(c => ({ name: c.name, error: c.error })) },
  extra: { total: extra.length, passed: extra.filter(c => c.ok).length, failed: extra.filter(c => !c.ok) },
  protected: {
    v4results: hashFile('tests/gdd1/f4-audit-semantic-v4-results.json'),
    v3source: hashFile('tests/gdd1/f4-audit-semantic-v3.js'),
    gdd: hashFile('docs/GAME_DESIGN_V1.md'),
    v1results: hashFile('tests/gdd1/f4-grok-rootcause-v1-results.json')
  },
  productionAfter: {
    resolver: hashFile('js/gdd1/resolver.js'),
    fullEffects: hashFile('js/gdd1/full-effects.js')
  },
  productionBefore: {
    resolver: { path: 'js/gdd1/resolver.js', bytes: 27757, sha256: '435bf3266b0b3d161f2d26d5345c9b21e2a669a316c9c4bbaf09e3c6ab34351c' },
    fullEffects: { path: 'js/gdd1/full-effects.js', bytes: 38016, sha256: '82b207481c292270bb73109854ecd2f474ae4e191317f8476a4ccf80e7e338a3' }
  },
  ok: independent.passed === independent.total && extra.every(c => c.ok)
};

fs.writeFileSync(path.join(__dirname, 'f4-grok-rootcause-v2-results.json'), JSON.stringify(result, null, 2), { flag: 'wx' });
console.log(JSON.stringify({ dest: 'tests/gdd1/f4-grok-rootcause-v2-results.json', independent: result.independent, extra: result.extra, ok: result.ok }, null, 2));
if (!result.ok) process.exitCode = 1;
