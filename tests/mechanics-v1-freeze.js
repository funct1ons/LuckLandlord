'use strict';
// Closeout only: validates existing evidence, copies pressure DOM, writes a new freeze; never edits old freeze/evidence.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const json=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const text=p=>fs.readFileSync(p,'utf8');
const assert=(ok,msg)=>{if(!ok)throw Error(msg);};
const old=json('tests/route-g-freeze.json'),node=json('tests/mechanics-v1-suite-manifest.json'),http=json('tests/mechanics-v1-http-proof.json'),audit=json('tests/mechanics-v1-audit-proof.json');
assert(node.total===521&&node.passed===521&&node.failed===0,'Node suite must be 521/521');
assert(node.baseline.namesPreserved&&node.suites.mechanicsContract===46,'Baseline/new suite mismatch');
function browserManifest(p){const match=/<script id="suite-manifest" type="application\/json">([\s\S]*?)<\/script>/.exec(text(p));assert(!!match,'Missing manifest '+p);return JSON.parse(match[1]);}
for(const p of ['tests/mechanics-v1-browser-result.html','tests/mechanics-v1-http-suite.html']){assert(text(p).includes('data-result="pass"'),'Missing pass marker '+p);assert(JSON.stringify(browserManifest(p).cases)===JSON.stringify(node.cases),'Complete case result parity '+p);}
assert(http.ok&&http.results.filter(x=>x.name!=='ui').every(x=>x.exactCaseResultsMatch),'HTTP proof lacks exact result verification');
const historicalManifest=json('tests/suite-manifest.json');
assert(JSON.stringify(historicalManifest.cases.map(x=>x.name))===JSON.stringify(node.cases.slice(0,475).map(x=>x.name)),'Original475 names/order');
assert(text('tests/mechanics-v1-file-proof.txt').includes('4/4 Edge file://'),'Missing4file');
const decodeHTML=s=>s.replace(/&quot;/g,'"').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&#39;/g,"'").replace(/&amp;/g,'&');
const faultNames=['validation','preview-render','getItem','serialization','capacity','setItem'].map(x=>'mechanics-ui/import-'+x);
const uiFaultProof=[];
for(const p of ['tests/mechanics-v1-ui-smoke-result.html','tests/mechanics-v1-http-ui.html']){const dom=text(p),match=/<pre id="smoke-result">([\s\S]*?)<\/pre>/.exec(dom);assert(dom.includes('data-smoke="pass"')&&match,'Strict UI '+p);const smoke=JSON.parse(decodeHTML(match[1]));const faults=smoke.evidence.find(e=>e&&e.mechanicsImportFaults).mechanicsImportFaults;assert(smoke.pass&&faults.length===6&&faults.every(x=>x.ok)&&JSON.stringify(faults.map(x=>x.name))===JSON.stringify(faultNames),'Six UI faults '+p);uiFaultProof.push({path:p,passed:6,total:6,names:faults.map(x=>x.name)});}
const pressureOutput=text('tests/mechanics-v1-pressure-http.txt'),pressurePath=/evidence=([^\r\n]+)/.exec(pressureOutput);
assert(pressurePath&&pressureOutput.includes('49/49 passed')&&pressureOutput.includes('EXIT 0'),'Pressure HTTP stdout');
const pressureDOM=fs.readFileSync(pressurePath[1].trim(),'utf8');
assert(pressureDOM.includes('data-smoke="pass"')&&pressureDOM.includes('data-pressure="pass"'),'Pressure strict smoke/pressure markers');
const pm=/<pre id="pressure-independent">([\s\S]*?)<\/pre>/.exec(pressureDOM);assert(pm,'Missing pressure UI machine output');
const pressureCases=JSON.parse(decodeHTML(pm[1]));
const pressureExpected=['UI final click skip commits before WON','UI click choose then reward progresses','UI negative final click LOST with cash clamp','UI damaged pending import rejected preserving state/current/backup'];
assert(pressureCases.length===4&&pressureCases.every(x=>x.ok)&&JSON.stringify(pressureCases.map(x=>x.name))===JSON.stringify(pressureExpected),'Pressure exact independent UI results');
fs.writeFileSync('tests/mechanics-v1-pressure-http.html',pressureDOM);
const strict={fileChecks:4,nodeFileHttpExactCaseResults:true,uiImportFaults:uiFaultProof,pressureHttp:{node:{total:49,passed:49},strictSmoke:true,strictPressure:true,independentUI:pressureCases,sourceTempPath:pressurePath[1].trim()},independentReviewPassed:false};
fs.writeFileSync('tests/mechanics-v1-strict-dom-proof.json',JSON.stringify(strict,null,2));
const reasons={
 'legacy/js/core/rng.js':'MA-1 D: rules0.3 schema1',
 'legacy/js/data/content.js':'MA-1 A/B: profile, schema, lifecycle owner predicates and death permissions',
 'legacy/js/engine/resolver.js':'MA-1 A/B/C: common limits, snapshots, epoch, natural age and pressure checkpoints',
 'legacy/js/core/game.js':'MA-1 D: complete pre-clone validation',
 'legacy/js/core/validation.js':'MA-1 D: full state, snapshot, log and pending boundaries',
 'legacy/js/core/save.js':'MA-1 D/E: pure-state migration and atomic import envelope/storage decoder',
 'legacy/js/ui/main.js':'MA-1 E: preview, reference rollback and finally busy',
 'tests/run.js':'Integrate mechanics-contract; redirect new manifest output',
 'tests/browser-tests.js':'Integrate mechanics-contract; preserve original baseline accounting',
 'tests/index.html':'Explicit mechanics-contract browser suite script',
 'tests/cultivation-behavior.js':'Approved two amber formal reward assertions10->14; no old setup migration',
 'tests/browser-check.ps1':'Redirect file browser evidence to mechanics-v1 names',
 'tests/ui-smoke.js':'Real FogUI six independent injected import faults',
 'docs/RULES.md':'Rules0.3 actual mechanics/storage semantics; no strict FIFO claim',
 'docs/CONTENT_MATRIX.md':'Approved pressure_pouch independent reward10 clarification',
 'docs/PROGRESS.md':'Closeout pending-review status; G still unaccepted and old audit differences disclosed'
};
const oldSourceComparison=[];
for(const[p,oldSHA256]of Object.entries(old.sources)){const newSHA256=sha(p),changed=newSHA256!==oldSHA256;assert(!changed||reasons[p],'Unauthorized old-source delta '+p);oldSourceComparison.push({path:p,oldSHA256,newSHA256,changed,authorization:changed?reasons[p]:'unchanged'});}
const historicalEvidence=[];for(const[p,oldSHA256]of Object.entries(old.evidence)){const currentSHA256=sha(p);assert(currentSHA256===oldSHA256,'Old historical evidence changed '+p);historicalEvidence.push({path:p,oldSHA256,currentSHA256,unchanged:true});}
assert(oldSourceComparison.length===48&&historicalEvidence.length===26,'Oldfreeze counts');
const sources={};const additionalSources=['docs/ARCHITECTURE.md','docs/MECHANICS_IMPLEMENTATION.md','docs/MECHANICS_ADVISORY.md','tests/mechanics-contract.js','tests/mechanics-v1-coverage-check.js','tests/mechanics-v1-audit-check.js','tests/mechanics-v1-http-check.js','tests/mechanics-v1-freeze.js'];
for(const p of [...Object.keys(old.sources),...additionalSources])sources[p]=sha(p);
const evidencePaths=[
 'tests/mechanics-v1-suite-manifest.json','tests/mechanics-v1-node-result.txt','tests/mechanics-v1-ma7-map.json',
 'tests/mechanics-v1-browser-result.html','tests/mechanics-v1-ui-smoke-result.html','tests/mechanics-v1-storage-write-result.html','tests/mechanics-v1-storage-read-result.html','tests/mechanics-v1-file-proof.txt','tests/mechanics-v1-edge-stderr.txt',
 'tests/mechanics-v1-http-proof.json','tests/mechanics-v1-http-suite.html','tests/mechanics-v1-http-ui.html','tests/mechanics-v1-http-suite-stderr.txt','tests/mechanics-v1-http-ui-stderr.txt',
 'tests/mechanics-v1-audit-proof.json','tests/mechanics-v1-pressure-http.txt','tests/mechanics-v1-pressure-http.html','tests/mechanics-v1-strict-dom-proof.json','tests/mechanics-v1-fixture-result.json','tests/mechanics-v1-fixtures.txt',
 ...audit.results.filter(x=>/^audit-/.test(x.audit)&&!x.audit.includes('--http')).map(x=>'tests/'+x.evidence)
];
const evidence={};for(const p of evidencePaths)evidence[p]=sha(p);
const auditCounts={
 'audit-cargo-retest.js':{total:15,passed:14,failed:1,failedCases:['reservation/runtime-invalid-record-is-cleaned']},
 'audit-cargo.js':{total:18,passed:17,failed:1,failedCases:['switch_lamp/invalid-uid-clears-on-normal-resolve']},
 'audit-cultivation-retest.js':{total:6,passed:6,failed:0},'audit-cultivation.js':{total:7,passed:7,failed:0},
 'audit-distillation.js':{total:17,passed:17,failed:0},'audit-pressure-retest.js':{total:49,passed:49,failed:0},
 'audit-pressure-transaction-retest.js':{total:10,passed:10,failed:0},'audit-pressure.js':{total:39,passed:39,failed:0},
 'audit-recycling.js':{total:10,passed:9,failed:1,failedCases:['dead-listener-target-snapshot']},
 'audit-resonance-retest.js':{total:18,passed:18,failed:0},'audit-resonance.js':{total:18,passed:18,failed:0}
};
for(const[name,counts]of Object.entries(auditCounts)){const r=audit.results.find(x=>x.audit===name);assert(r&&r.exit===(counts.failed?1:0),'Audit exit mismatch '+name);for(const failed of counts.failedCases||[])assert(text('tests/'+r.evidence).includes(failed),'Missing historical failed case '+failed);}
assert(text('tests/mechanics-v1-fixtures.txt').includes('10 fixtures reported; all match manual expectation: true'),'Fixture10');
const freeze={status:'DEVELOPMENT_FROZEN_READABLE_AWAITING_INDEPENDENT_REVIEW',generatedAt:new Date().toISOString(),acceptance:{mechanics:false,routeG:false,HExpanded:false},
 node:{total:node.total,passed:node.passed,baseline:node.baseline,suites:node.suites,original475NamesAndOrderPreserved:true,original475IncludesFormal:true,approvedFormalExpectedMigrations:2,oldSetupMigrations:0},
 compatibility:{coreLegacy50SourceUnchanged:sha('tests/suite.js')===old.sources['tests/suite.js'],manual10FixtureSourceUnchanged:sha('tests/fixtures/combos.js')===old.sources['tests/fixtures/combos.js']},
 uiImportFaults:{total:6,passed:6,countedInNode:false,fileAndHTTP:true},coverage:{MA7Rows:47,nameReferencesVerified:true,independentAuditPassed:false},
 audits:{scripts:11,total:207,passed:204,failed:3,caseCounts:auditCounts,allHistoricalAuditsGreen:false},fixtures:{total:10,manualMatches:10},strictDOM:strict,
 historical:{freezePath:'tests/route-g-freeze.json',freezeSHA256:sha('tests/route-g-freeze.json'),baseline357SHA256:sha('tests/baseline-357-manifest.json'),suiteManifestSHA256:sha('tests/suite-manifest.json'),oldSourcesCompared:48,authorizedChangedSources:oldSourceComparison.filter(x=>x.changed).length,oldSourceComparison,historicalEvidenceCompared:26,historicalEvidenceAllUnchanged:true,historicalEvidence},sources,evidence,
 note:'Readonly review freeze, not acceptance. Evidence name checks and selftests are not an independent review. Stale earlier mechanics-v1-http-smoke-result.html/http-smoke files are excluded; latest HTTP suite/UI proofs are authoritative.'};
fs.writeFileSync('tests/mechanics-v1-freeze.json',JSON.stringify(freeze,null,2));
console.log(JSON.stringify({status:freeze.status,node:freeze.node.total,passed:freeze.node.passed,audits:'204/207;3FAIL',sources:Object.keys(sources).length,evidence:Object.keys(evidence).length,oldSources:48,authorizedDeltas:freeze.historical.authorizedChangedSources,historicalEvidenceUnchanged:26,pressureStrictUI:4,uiFaultsSeparate:6},null,2));
