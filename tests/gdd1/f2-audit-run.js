'use strict';
const fs=require('fs'),vm=require('vm'),path=require('path'),root=path.resolve(__dirname,'../..');
const ctx={window:{},console};vm.createContext(ctx);
for(const x of ['contract','rng','schema','save','content','offers','resolver','controller'])vm.runInContext(fs.readFileSync(path.join(root,'js/gdd1/'+x+'.js'),'utf8'),ctx,{filename:x});
vm.runInContext(fs.readFileSync(path.join(__dirname,'f2-audit-checks.js'),'utf8'),ctx);
const cases=ctx.window.runF2Audit(),result={total:cases.length,passed:cases.filter(x=>x.ok).length,cases,scope:'independent F2 audit; no frozen output paths'};
fs.writeFileSync(path.join(__dirname,'f2-audit-node.json'),JSON.stringify(result,null,2));
for(const c of cases.filter(c=>!c.ok))console.log('FAIL '+c.name+': '+c.error);
console.log(result.passed+'/'+result.total);process.exitCode=cases.some(x=>!x.ok)?1:0;
