'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const destName = process.argv[2] || 'f4-grok-audit-semantic-v1-results.json';
if (!/^f4-grok-audit-[\w.-]+\.json$/.test(destName)) throw Error('Unsafe output ' + destName);
const dest = path.join(__dirname, destName);
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
fs.writeFileSync(dest, JSON.stringify(r, null, 2), { flag: 'wx' });
const failed = r.cases.filter(x => !x.ok).map(x => ({ name: x.name, error: x.error }));
console.log(JSON.stringify({ dest: 'tests/gdd1/' + destName, total: r.total, passed: r.passed, failed }, null, 2));
if (r.total !== r.passed) process.exitCode = 1;
