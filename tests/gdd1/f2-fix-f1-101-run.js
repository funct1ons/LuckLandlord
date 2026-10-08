'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
(async()=>{
 const ctx={window:{},console};vm.createContext(ctx);
 for(const name of['contract','rng','schema','save'])vm.runInContext(read('js/gdd1/'+name+'.js'),ctx,{filename:name+'.js'});
 ctx.window.GDD1_TEST_VECTORS=JSON.parse(read('tests/gdd1/rng-vectors.json'));ctx.window.GDD1_HAND_ORACLES=JSON.parse(read('tests/gdd1/hand-oracles.json'));
 for(const name of['foundation-tests','oracle-integrity','fix-checks','audit-checks'])vm.runInContext(read('tests/gdd1/'+name+'.js'),ctx,{filename:name+'.js'});
 const baseline=[...ctx.window.runGdd1FoundationTests(),...ctx.window.runGdd1OracleIntegrityTests()];
 const regression=await ctx.window.runGdd1FixTests();
 // Unmodified historical reproducer expects defects to exist; its six failures
 // are recorded separately and never interpreted as new acceptance failures.
 const historical=await ctx.window.runGdd1AuditChecks();
 const expected=['audit/reproduce-A1-async-preview','audit/reproduce-A2-ash-age3','audit/reproduce-A3-fog-nonplant','audit/reproduce-A4a','audit/reproduce-A4b','audit/reproduce-A4c'];
 const failures=historical.cases.filter(x=>!x.ok);
 const result={node:process.version,baseline:{total:baseline.length,passed:baseline.filter(x=>x.ok).length,cases:baseline},regression,historicalReproducer:{...historical,expectedFailures:expected,expectedFailureSetMatches:JSON.stringify(failures.map(x=>x.name))===JSON.stringify(expected)},cases:[...baseline,...regression.cases]};
 result.total=result.cases.length;result.passed=result.cases.filter(x=>x.ok).length;
 fs.writeFileSync(path.join(__dirname,'f2-fix-f1-101-node.json'),JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({baseline:result.baseline.passed+'/'+baseline.length,regression:regression.passed+'/'+regression.total,historicalProbes:historical.passed+'/'+historical.total,historicalFailures:failures,expectedFailureSetMatches:result.historicalReproducer.expectedFailureSetMatches},null,2));
 const legacyOutput=path.join(__dirname,'f2-fix-f1-101-legacy.json');
 const legacyCtx={console,__dirname,process:{exitCode:0},require:n=>n==='node:fs'?{...fs,writeFileSync(p,data){if(path.basename(p)!=='legacy-readonly-results.json')throw Error('Unexpected historical write');fs.writeFileSync(legacyOutput,data)}}:require(n)};
 vm.runInNewContext(read('tests/gdd1/legacy-readonly.js'),legacyCtx,{filename:'legacy-readonly.js'});
 const legacy=JSON.parse(fs.readFileSync(legacyOutput,'utf8'));
 process.exitCode=result.passed!==result.total||!result.historicalReproducer.expectedFailureSetMatches||legacyCtx.process.exitCode||legacy.old.passed!==602||legacy.m3.passed!==64?1:0;
})().catch(e=>{console.error(e);process.exitCode=1});

