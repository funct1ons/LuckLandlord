'use strict';
const fs = require('node:fs'), vm = require('node:vm'), path = require('node:path');
const ctx = {window: {}, console};
vm.createContext(ctx);
const files = [
  // 旧线（M0–M2 原型）已移入 legacy/，保留全部测试以继续守护其行为。
  'legacy/js/core/rng.js', 'legacy/js/data/content.js', 'legacy/js/engine/resolver.js',
  'legacy/js/core/game.js', 'legacy/js/core/validation.js', 'legacy/js/core/save.js',
  'tests/fixtures/combos.js', 'tests/suite.js',
  'tests/formal-symbols.js', 'tests/cultivation-behavior.js', 'tests/recycling-behavior.js',
  'tests/distillation-behavior.js', 'tests/resonance-behavior.js', 'tests/cargo-behavior.js',
  'tests/pressure-suite.js', 'tests/pressure-transaction.js', 'tests/route-g-behavior.js',
  'tests/mechanics-contract.js', 'tests/route-h-behavior.js', 'tests/simulator.js'
];
for (const f of files) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', f), 'utf8'), ctx, {filename: f});
}
const G = ctx.window.Game;
if (process.argv[2] === 'simulate') {
  console.log(JSON.stringify(G.simulate(Number(process.argv[3]) || 1000), null, 2));
} else {
  const suites = {
    core: G.runTests(),
    formal: G.formalSymbolTests(),
    cultivation: G.cultivationBehaviorTests(),
    recycling: G.recyclingBehaviorTests(),
    distillation: G.distillationBehaviorTests(),
    resonance: G.resonanceBehaviorTests(),
    cargo: G.cargoBehaviorTests(),
    pressure: G.pressureBehaviorTests(),
    pressureTransaction: G.pressureTransactionTests(),
    routeG: G.routeGBehaviorTests(),
    mechanicsContract: G.mechanicsContractTests(),
    routeH: G.routeHBehaviorTests()
  };
  const results = Object.values(suites).flat();
  const original = JSON.parse(fs.readFileSync(path.join(__dirname, 'baseline-357-manifest.json'), 'utf8'));
  const oldCases = results.filter(x => !x.name.startsWith('route-g/') && !x.name.startsWith('mechanics-contract/') && !x.name.startsWith('route-h/'));
  const expectedNames = original.cases.map(x => x.name);
  const namesPreserved = original.total === 357 && oldCases.length === 357 &&
    JSON.stringify(oldCases.map(x => x.name)) === JSON.stringify(expectedNames);
  const baseline = {expected: 357, total: oldCases.length,
    passed: oldCases.filter(x => x.ok).length, namesPreserved};
  const old521=JSON.parse(fs.readFileSync(path.join(__dirname,'mechanics-v1-suite-manifest.json'),'utf8'));
  const old521NamesPreserved=JSON.stringify(old521.cases.map(x=>x.name))===JSON.stringify(results.slice(0,521).map(x=>x.name));
  const approvedMigrations=[{name:'route-g/offset_reader/conditional-and-h-placeholder-not-copyable',old:'ledger [1,4,5], no copy',current:'ledger [2,4,4], cleared_stub flat1 copied; total10 unchanged',basis:'CONTENT_MATRIX H cleared_stub and section3.1'},{name:'route-g/content/formal-copy-whitelist-exact-two-and-prototype-unmarked',old:'pause_dial +1 and blank_facet +2 only',current:'add cleared_stub +1; prior two and unmarked prototype preserved',basis:'Authorized H content revision'}];
  const manifest = {
    contentVersion:G.CONTENT_VERSION,old521NamesPreserved,approvedMigrations,
    generatedAt: 'runtime', total: results.length,
    passed: results.filter(x => x.ok).length, failed: results.filter(x => !x.ok).length,
    baseline, suites: Object.fromEntries(Object.entries(suites).map(([k, v]) => [k, v.length])),
    cases: results
  };
  fs.writeFileSync(path.join(__dirname, 'route-m3-suite-manifest.json'), JSON.stringify(manifest, null, 2));
  for (const r of results) console.log((r.ok ? 'PASS ' : 'FAIL ') + r.name + (r.error ? ' — ' + r.error : ''));
  console.log(`${manifest.passed}/${manifest.total} passed`);
  console.log(`Baseline: ${baseline.passed}/${baseline.expected}; names preserved: ${namesPreserved}`);
  process.exitCode = results.some(x => !x.ok) || !namesPreserved || !old521NamesPreserved ? 1 : 0;
}
