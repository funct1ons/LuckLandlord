'use strict';
// Execute unchanged independent assertions in fresh VMs; never invoke historical writers.
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'../..');
function load(ctx,file){vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx,{filename:file});}
function context(engine){const ctx={window:{},console,Promise,Error,Object,JSON,Array,Map,Set,Number,Math};vm.createContext(ctx);for(const n of engine)load(ctx,'js/gdd1/'+n+'.js');return ctx;}
(async()=>{
 const c=context(['contract','rng','schema','save']);
 c.window.GDD1_TEST_VECTORS=JSON.parse(fs.readFileSync(path.join(__dirname,'rng-vectors.json'),'utf8'));
 c.window.GDD1_HAND_ORACLES=JSON.parse(fs.readFileSync(path.join(__dirname,'hand-oracles.json'),'utf8'));
 for(const n of ['foundation-tests','oracle-integrity','fix-checks','retest-checks','audit-checks'])load(c,'tests/gdd1/'+n+'.js');
 const f1=await c.window.runGdd1Retest();
 const d=context(['contract','rng','schema','save','full-save','content','full-content','full-effects','offers','resolver','controller','full-controller']);
 for(const n of ['f2-audit-checks','f2-retest-checks'])load(d,'tests/gdd1/'+n+'.js');
 const audit=d.window.runF2Audit(),retest=d.window.runF2Retest();
 const result={scope:'Unchanged independent assertions, full and slice coexistence for F2',f1,f2Audit:{total:audit.length,passed:audit.filter(x=>x.ok).length,cases:audit},f2Retest:{total:retest.length,passed:retest.filter(x=>x.ok).length,cases:retest}};
 const out=process.argv[2]||'f4-independent-regression-v1.json';if(!/^f4-[\w-]+\.json$/.test(out))throw Error('Unsafe output');
 fs.writeFileSync(path.join(__dirname,out),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({f1:[f1.passed,f1.total],audit:[result.f2Audit.passed,audit.length],retest:[result.f2Retest.passed,retest.length],failures:[...f1.cases,...audit,...retest].filter(x=>!x.ok)},null,2));
 process.exitCode=f1.passed===f1.total&&audit.every(x=>x.ok)&&retest.every(x=>x.ok)?0:1;
})().catch(e=>{console.error(e);process.exitCode=1;});
