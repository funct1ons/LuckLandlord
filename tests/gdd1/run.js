'use strict';
// Confined output: new F1 result only. Does not import or invoke tests/run.js.
const fs=require('node:fs'), path=require('node:path'), vm=require('node:vm');
const root=path.resolve(__dirname,'../..');
const files=['js/gdd1/contract.js','js/gdd1/rng.js','js/gdd1/schema.js','js/gdd1/save.js','tests/gdd1/foundation-tests.js','tests/gdd1/oracle-integrity.js'];
const ctx={window:{GDD1_TEST_VECTORS:JSON.parse(fs.readFileSync(path.join(__dirname,'rng-vectors.json'),'utf8')),
  GDD1_HAND_ORACLES:JSON.parse(fs.readFileSync(path.join(__dirname,'hand-oracles.json'),'utf8'))},console};
vm.createContext(ctx);
files.forEach(file=>vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx,{filename:file}));
const cases=[...ctx.window.runGdd1FoundationTests(),...ctx.window.runGdd1OracleIntegrityTests()];
const result={scope:'F1 foundation only; no resolver/F2 gameplay acceptance',total:cases.length,passed:cases.filter(x=>x.ok).length,cases};
fs.writeFileSync(path.join(__dirname,'f1-node-results.json'),JSON.stringify(result,null,2)+'\n');
for(const c of cases) console.log((c.ok?'PASS ':'FAIL ')+c.name+(c.error?' — '+c.error:''));
console.log(`${result.passed}/${result.total} F1 foundation cases passed`);
process.exitCode=cases.some(x=>!x.ok)?1:0;
