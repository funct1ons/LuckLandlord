'use strict';
const fs=require('fs'),vm=require('vm'),path=require('path'),root=path.resolve(__dirname,'../..');
const write=fs.writeFileSync;fs.writeFileSync=(p,d)=>{if(!path.basename(p).startsWith('f4-'))throw Error('Frozen-output write refused');return write(p,d,{flag:'wx'})};
const ctx={window:{},console};vm.createContext(ctx);
for(const x of ['contract','rng','schema','save','full-save','content','full-content','full-effects','offers','resolver','controller'])vm.runInContext(fs.readFileSync(path.join(root,'js/gdd1/'+x+'.js'),'utf8'),ctx,{filename:x});
vm.runInContext(fs.readFileSync(path.join(__dirname,'f2-checks.js'),'utf8'),ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname,'f2-extra.js'),'utf8'),ctx);
const cases=ctx.window.runGdd1F2Tests(),result={total:cases.length,passed:cases.filter(x=>x.ok).length,cases};
fs.writeFileSync(path.join(__dirname,process.argv[2]||'f4-f2-safe-node.json'),JSON.stringify(result,null,2));
for(const c of cases.filter(c=>!c.ok))console.log('FAIL '+c.name+': '+c.error);
console.log(result.passed+'/'+result.total);process.exitCode=cases.some(x=>!x.ok)?1:0;

