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

const ctx = { console };
ctx.globalThis = ctx;
vm.createContext(ctx);
for (const f of ['contract', 'rng', 'schema', 'save', 'content', 'full-content', 'full-effects', 'offers', 'resolver', 'full-controller']) {
  vm.runInContext(fs.readFileSync(path.join(root, 'js/gdd1', f + '.js'), 'utf8'), ctx);
}
vm.runInContext(fs.readFileSync(path.join(__dirname, 'f4-audit-semantic-v3.js'), 'utf8'), ctx);
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
  assert(resolver.includes("deferredAdds"), 'deferred add commit path must remain generic');
});

extraCase('cloth-data-locks-first-tagAdded-neighbor', () => {
  const fx = F.fullSymbols.alignment_cloth.effects[0];
  assert.strictEqual(fx.op, 'add');
  assert.strictEqual(fx.phase, 'step2');
  assert.strictEqual(fx.amount, 5);
  assert.strictEqual(fx.lockFirst, true);
  assert.strictEqual(fx.selector.receivedTag, true);
  assert.strictEqual(fx.selector.order, 'tagAdded');
  assert.strictEqual(fx.selector.scope, 'adjacent');
});

extraCase('book-data-defers-commit-to-end-summary', () => {
  const fx = F.fullItems.item_spectrum_book.effects[0];
  assert.strictEqual(fx.op, 'add');
  assert.strictEqual(fx.phase, 'listen');
  assert.strictEqual(fx.event, 'tagAdded');
  assert.strictEqual(fx.eventTarget, true);
  assert.strictEqual(fx.defer, true);
  assert.strictEqual(fx.amount, 3);
  assert.strictEqual(fx.limit, 1);
});

extraCase('cloth-record-order-not-board-pos', () => {
  const fail = independent.cases.find(c => c.name === 'cloth-tag-log-order');
  assert(fail && fail.ok, fail && fail.error || 'missing cloth case');
  const r = fail.actual.last;
  assert.deepStrictEqual(r.log.filter(e => e.action === 'tagAdded').map(e => e.target), ['u4', 'u4', 'u2']);
  const clothAdd = r.log.filter(e => e.action === 'add' && e.source === 'u3');
  assert.strictEqual(clothAdd.length, 1);
  assert.strictEqual(clothAdd[0].target, 'u4');
  assert.strictEqual(clothAdd[0].amount, 5);
  assert.strictEqual(clothAdd[0].phase, 'step2/tagAdded');
  assert.deepStrictEqual(r.ledger.map(x => x.amount), [2, 2, 1, 10]);
  assert.strictEqual(r.total, 15);
});

extraCase('book-commits-step8-same-total', () => {
  const c = independent.cases.find(x => x.name === 'spectrum-book-deferred-phase');
  assert(c && c.ok, c && c.error || 'missing book phase case');
  const r = c.actual.last;
  assert.strictEqual(r.total, 8);
  const adds = r.log.filter(e => e.source === 'item_spectrum_book' && e.action === 'add');
  assert.strictEqual(adds.length, 1);
  assert.strictEqual(adds[0].phase, 'step8/end-summary');
  assert.strictEqual(adds[0].amount, 3);
  assert.strictEqual(adds[0].target, 'u1');
  assert(adds[0].id > r.log.find(e => e.action === 'tagAdded').id);
});

extraCase('book-dead-target-no-retarget', () => {
  const c = independent.cases.find(x => x.name === 'spectrum-book-dead-target');
  assert(c && c.ok, c && c.error || 'missing book death case');
  const r = c.actual.last;
  const adds = r.log.filter(e => e.source === 'item_spectrum_book' && e.action === 'add');
  assert.strictEqual(adds.length, 0);
  assert(r.log.some(e => e.action === 'consume' && e.target === 'u2'));
  assert.strictEqual(c.actual.state.itemState.quotas.item_spectrum_book.spin, 1);
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
    assert.strictEqual(r.total, total, types.join('+') + ' expected ' + total + ' got ' + r.total);
    if (items.includes('item_spectrum_book')) {
      const adds = r.log.filter(e => e.source === 'item_spectrum_book' && e.action === 'add');
      assert.strictEqual(adds.length, 1);
      assert.strictEqual(adds[0].phase, 'step8/end-summary');
    }
  }
});

const failedIndependent = independent.cases.filter(c => !c.ok).map(c => ({ name: c.name, error: c.error }));
const failedExtra = extra.filter(c => !c.ok);
const result = {
  scope: 'f4-grok-rootcause-v1: generic tagAdded-order select + deferred listen add; does not overwrite f4-audit-semantic-v4-results.json',
  independent: { total: independent.total, passed: independent.passed, failed: failedIndependent },
  extra: { total: extra.length, passed: extra.filter(c => c.ok).length, failed: failedExtra },
  protected: {
    v4results: hashFile('tests/gdd1/f4-audit-semantic-v4-results.json'),
    v3source: hashFile('tests/gdd1/f4-audit-semantic-v3.js'),
    gdd: hashFile('docs/GAME_DESIGN_V1.md')
  },
  productionAfter: {
    resolver: hashFile('js/gdd1/resolver.js'),
    fullEffects: hashFile('js/gdd1/full-effects.js')
  },
  ok: independent.passed === independent.total && failedExtra.length === 0
};

const dest = path.join(__dirname, 'f4-grok-rootcause-v1-results.json');
fs.writeFileSync(dest, JSON.stringify(result, null, 2), { flag: 'wx' });
console.log(JSON.stringify({ dest: 'tests/gdd1/f4-grok-rootcause-v1-results.json', independent: result.independent, extra: result.extra, ok: result.ok, productionAfter: result.productionAfter }, null, 2));
if (!result.ok) process.exitCode = 1;
