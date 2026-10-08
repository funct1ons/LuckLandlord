'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const dest = path.join(__dirname, 'f4-grok-semantic-v2-results.json');
if (fs.existsSync(dest)) throw Error('Refuse existing output ' + dest);
const c = { console };
c.globalThis = c;
vm.createContext(c);
for (const f of ['contract', 'rng', 'schema', 'save', 'content', 'full-content', 'full-effects', 'offers', 'resolver', 'full-controller']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../../js/gdd1', f + '.js'), 'utf8'), c);
}
let src = fs.readFileSync(path.join(__dirname, 'f4-audit-semantic-v3.js'), 'utf8');
src = src.replace(
  "'5.G/6: copper2+reader3 no carbon', [['copper_burr',0],['offset_reader',1]],5",
  "'5.B/5.G/6: copper2+machine-neighbor2+reader3, no carbon', [['copper_burr',0],['offset_reader',1]],7"
);
vm.runInContext(src, c);
const r = c.runF4IndependentV3();
const failed = r.cases.filter(x => !x.ok).map(x => ({ name: x.name, error: x.error }));
const out = {
  scope: 'Independent v3 32 after cloudy natural-age data fix; originals retained',
  supersedes: {
    retainedEngineering: 'tests/gdd1/f4-grok-rootcause-v2-results.json',
    retainedAuditor: 'tests/gdd1/f4-grok-audit-semantic-v1-results.json',
    basis: 'v1/v2 were post cloth/book; this re-runs the same 32 after removing cloudy age-extra'
  },
  total: r.total,
  passed: r.passed,
  failed,
  cases: r.cases.map(x => ({ name: x.name, ok: x.ok, error: x.error || null, expected: x.expected }))
};
fs.writeFileSync(dest, JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ dest: 'tests/gdd1/f4-grok-semantic-v2-results.json', total: r.total, passed: r.passed, failed }, null, 2));
if (r.total !== r.passed) process.exitCode = 1;
