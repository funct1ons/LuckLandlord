'use strict';
const G = window.Game;
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
const baselineCases = results.filter(r => !r.name.startsWith('route-g/') && !r.name.startsWith('mechanics-contract/') && !r.name.startsWith('route-h/'));
const manifest = {
  total: results.length, passed: results.filter(r => r.ok).length,
  failed: results.filter(r => !r.ok).length,
  baseline: {expected: 357, total: baselineCases.length, passed: baselineCases.filter(r => r.ok).length},
  suites: Object.fromEntries(Object.entries(suites).map(([k, v]) => [k, v.length])),
  cases: results
};
document.getElementById('results').textContent = results.map(r =>
  (r.ok ? 'PASS ' : 'FAIL ') + r.name + (r.error ? ' ' + r.error : '')
).join('\n') + '\n' + manifest.passed + '/' + manifest.total + ' passed';
const machine = document.createElement('script');
machine.id = 'suite-manifest';
machine.type = 'application/json';
machine.textContent = JSON.stringify(manifest);
document.body.appendChild(machine);
document.body.dataset.result = manifest.failed === 0 && manifest.baseline.total === 357 ? 'pass' : 'fail';
