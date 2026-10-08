'use strict';
// Freeze already-executed evidence; this does not replace running the test commands.
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const {checkSuite, checkBody, checkPressure} = require('./route-g-evidence-check.js');
const root = path.resolve(__dirname, '..');
const text = file => fs.readFileSync(path.join(root, file), 'utf8').replace(/^\uFEFF/, '');
const read = file => JSON.parse(text(file));
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex');
function requirePass(condition, message) { if (!condition) throw Error(message); }
const manifest = read('tests/suite-manifest.json');
requirePass(manifest.total === 475 && manifest.failed === 0 && manifest.passed === 475 &&
  manifest.baseline.passed === 357 && manifest.baseline.namesPreserved, 'Node is not frozen green');
const baselineHash = sha('tests/baseline-357-manifest.json');
const originalHash = sha('docs/archive/route-g-snapshot/suite-manifest.json');
requirePass(baselineHash === originalHash, 'Original 357 baseline changed');
const fixtures = read('tests/fixture-result.json');
requirePass(fixtures.length === 10 && fixtures.every(x => x.expected === x.actual), 'Fixture manual proof failed');
const fileSuite = checkSuite(text('tests/browser-result.html'));
for (const [file, attribute] of [
  ['ui-smoke-result.html', 'data-smoke'], ['storage-write-result.html', 'data-result'],
  ['storage-read-result.html', 'data-result']
]) checkBody(text('tests/' + file), attribute);
const httpSuite = checkSuite(text('tests/route-g-http-suite.html'));
checkBody(text('tests/route-g-http-smoke.html'), 'data-smoke');
const pressureUi = checkPressure(text('tests/route-g-pressure-http.html'));
const auditFiles = fs.readdirSync(__dirname).filter(file => /^audit-.*\.js$/.test(file)).sort();
requirePass(auditFiles.length === 11, 'Expected all 11 unchanged audit scripts');
const auditCounts = {};
for (const file of auditFiles) {
  const output = text('tests/route-g-' + file.replace(/\.js$/, '.txt'));
  let total, passed, failed;
  if (output.trimStart().startsWith('{')) {
    const result = JSON.parse(output);
    ({total, passed, failed} = result);
    const cases = result.cases || result.results;
    requirePass(Array.isArray(cases) && cases.length === total && cases.every(x => x.ok === true),
      'Audit case failed: ' + file);
  } else {
    passed = output.split(/\r?\n/).filter(line => line.startsWith('PASS ')).length;
    failed = output.split(/\r?\n/).filter(line => line.startsWith('FAIL ')).length;
    total = passed + failed;
  }
  requirePass(Number.isInteger(total) && total > 0 && total === passed && failed === 0, 'Audit failed: ' + file);
  auditCounts[file] = {total, passed, failed};
}
const sourceFiles = [
  'legacy/js/core/rng.js', 'legacy/js/data/content.js', 'legacy/js/engine/resolver.js', 'legacy/js/core/game.js',
  'legacy/js/core/validation.js', 'legacy/js/core/save.js', 'legacy/js/ui/main.js',
  'tests/run.js', 'tests/browser-tests.js', 'tests/index.html', 'tests/route-g-behavior.js',
  'tests/route-g-evidence-check.js', 'tests/route-g-http-check.js', 'tests/route-g-freeze.js',
  'tests/suite.js', 'tests/formal-symbols.js', 'tests/cultivation-behavior.js',
  'tests/recycling-behavior.js', 'tests/distillation-behavior.js', 'tests/resonance-behavior.js',
  'tests/cargo-behavior.js', 'tests/pressure-suite.js', 'tests/pressure-transaction.js',
  'tests/baseline-357-manifest.json', 'tests/fixture-report.js', 'tests/fixtures/combos.js',
  'tests/browser-check.ps1', 'tests/ui-smoke.html', 'tests/ui-smoke.js', 'tests/storage-smoke.html',
  'EXECUTION_PLAN.md', 'docs/CONTENT_MATRIX.md', 'docs/MECHANICS_GAPS.md', 'docs/RULES.md',
  'docs/PRESSURE_TRANSACTION_RETEST.md', 'docs/ROUTE_G_PROOF.md', 'docs/PROGRESS.md',
  ...auditFiles.map(file => 'tests/' + file)
];
const evidenceFiles = [
  'tests/suite-manifest.json', 'tests/route-g-node-result.txt', 'tests/fixture-result.json',
  'tests/route-g-file-proof.txt', 'tests/route-g-file-manifest-proof.json', 'tests/browser-result.html',
  'tests/ui-smoke-result.html', 'tests/storage-write-result.html', 'tests/storage-read-result.html',
  'tests/route-g-http-proof.json', 'tests/route-g-http-suite.html', 'tests/route-g-http-smoke.html',
  'tests/route-g-pressure-http-result.txt', 'tests/route-g-pressure-http.html', 'tests/route-g-strict-dom-proof.json',
  ...auditFiles.map(file => 'tests/route-g-' + file.replace(/\.js$/, '.txt'))
];
const passedAudits = Object.values(auditCounts).reduce((sum, x) => sum + x.passed, 0);
const proof = {
  status: 'DEVELOPMENT_FROZEN_AWAITING_INDEPENDENT_REVIEW',
  provider: 'openai-codex', model: 'gpt-6.1-sol', reasoning: 'xhigh', generatedAt: new Date().toISOString(),
  node: {total: manifest.total, passed: manifest.passed, baseline: manifest.baseline, suites: manifest.suites},
  baselineSHA256: baselineHash, originalBaselineSnapshotSHA256: originalHash,
  audits: {scripts: auditFiles.length, passed: passedAudits, failed: 0, caseCounts: auditCounts},
  fixture: {total: fixtures.length, manualMatches: fixtures.length},
  file: {checks: 4, suite: fileSuite}, http: {...read('tests/route-g-http-proof.json'), suite: httpSuite},
  pressureHttp: {nodeCases: 49, ui: pressureUi},
  sources: Object.fromEntries(sourceFiles.map(file => [file, sha(file)])),
  evidence: Object.fromEntries(evidenceFiles.map(file => [file, sha(file)]))
};
fs.writeFileSync(path.join(__dirname, 'route-g-freeze.json'), JSON.stringify(proof, null, 2));
console.log(`Frozen: ${manifest.passed}/${manifest.total}; old357 SHA preserved; G118; ` +
  `audits${passedAudits}/${passedAudits}; fixture10; Edge file4/HTTP2/pressureUI4`);
