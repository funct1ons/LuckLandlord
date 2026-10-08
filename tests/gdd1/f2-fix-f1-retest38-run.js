'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
(async()=>{
 const ctx={window:{},console,Promise,Error,Object,JSON,Array,Map,Set,Number,Math};vm.createContext(ctx);
 for(const name of ['contract','rng','schema','save'])vm.runInContext(read('js/gdd1/'+name+'.js'),ctx,{filename:name+'.js'});
 ctx.window.GDD1_TEST_VECTORS=JSON.parse(read('tests/gdd1/rng-vectors.json'));
 ctx.window.GDD1_HAND_ORACLES=JSON.parse(read('tests/gdd1/hand-oracles.json'));
 for(const name of ['foundation-tests','oracle-integrity','fix-checks','retest-checks','audit-checks'])vm.runInContext(read('tests/gdd1/'+name+'.js'),ctx,{filename:name+'.js'});
 const baseline=[...ctx.window.runGdd1FoundationTests(),...ctx.window.runGdd1OracleIntegrityTests()];
 const fixRegression=await ctx.window.runGdd1FixTests();
 const retest=await ctx.window.runGdd1Retest();
 const historical=await ctx.window.runGdd1AuditChecks();
 const expected=['audit/reproduce-A1-async-preview','audit/reproduce-A2-ash-age3','audit/reproduce-A3-fog-nonplant','audit/reproduce-A4a','audit/reproduce-A4b','audit/reproduce-A4c'];
 const hf=historical.cases.filter(x=>!x.ok).map(x=>x.name);
 const files=['js/gdd1/save.js','js/gdd1/schema.js'];
 const hashes=Object.fromEntries(files.map(f=>{const b=fs.readFileSync(path.join(root,f));return [f,{bytes:b.length,sha256:crypto.createHash('sha256').update(b).digest('hex')}]}));
 const result={node:process.version,baseline:{total:baseline.length,passed:baseline.filter(x=>x.ok).length,cases:baseline},fixRegression:{total:fixRegression.total,passed:fixRegression.passed,cases:fixRegression.cases},retest,historicalReproducer:{total:historical.total,passed:historical.passed,failures:hf,expectedFailureSetMatches:JSON.stringify(hf)===JSON.stringify(expected)},hashes,scope:'Independent read-only VM retest; historical audit defects must fail after repair'};
 fs.writeFileSync(path.join(__dirname,'f2-fix-f1-retest38-node.json'),JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify(result,null,2));
 process.exitCode=result.baseline.passed!==result.baseline.total||result.fixRegression.passed!==result.fixRegression.total||result.retest.passed!==result.retest.total||!result.historicalReproducer.expectedFailureSetMatches?1:0;
})().catch(e=>{console.error(e);process.exitCode=1});

