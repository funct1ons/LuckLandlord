'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');
const assert = require('assert');

const root = path.resolve(__dirname, '../..');
const htmlName = 'f4-grok-edge-semantic-v1.html';
const htmlPath = path.join(__dirname, htmlName);
const outname = 'f4-grok-edge-semantic-v1';
const destName = outname + '-results.json';
const destPath = path.join(__dirname, destName);
const edgePath = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const COPPER_FROM = "'5.G/6: copper2+reader3 no carbon', [['copper_burr',0],['offset_reader',1]],5";
const COPPER_TO = "'5.B/5.G/6: copper2+machine-neighbor2+reader3, no carbon', [['copper_burr',0],['offset_reader',1]],7";
const PROD = ['contract', 'rng', 'schema', 'save', 'content', 'full-content', 'full-effects', 'offers', 'resolver', 'full-controller'];

if (fs.existsSync(htmlPath)) throw Error('refusing overwrite ' + htmlPath);
if (fs.existsSync(destPath)) throw Error('refusing overwrite ' + destPath);

function hashFile(rel) {
  const buf = fs.readFileSync(path.join(root, rel));
  return { path: rel.replace(/\\/g, '/'), bytes: buf.length, sha256: crypto.createHash('sha256').update(buf).digest('hex') };
}

function slimCases(r) {
  return r.cases.map(c => ({
    name: c.name,
    ok: !!c.ok,
    error: c.error == null ? null : String(c.error),
    expected: c.expected
  }));
}

function compareFields(label, a, b) {
  const names = a.map(x => x.name);
  const ok = a.map(x => x.ok);
  const error = a.map(x => x.error);
  const expected = a.map(x => x.expected);
  const mismatches = [];
  if (a.length !== 32) mismatches.push(label + ': count ' + a.length + ' !== 32');
  if (b.length !== 32) mismatches.push(label + ': other count ' + b.length + ' !== 32');
  if (JSON.stringify(names) !== JSON.stringify(b.map(x => x.name))) mismatches.push(label + ': names');
  if (JSON.stringify(ok) !== JSON.stringify(b.map(x => x.ok))) mismatches.push(label + ': ok');
  if (JSON.stringify(error) !== JSON.stringify(b.map(x => x.error))) mismatches.push(label + ': error');
  if (JSON.stringify(expected) !== JSON.stringify(b.map(x => x.expected))) mismatches.push(label + ': expected');
  return {
    label,
    count: a.length,
    namesEqual: JSON.stringify(names) === JSON.stringify(b.map(x => x.name)),
    okEqual: JSON.stringify(ok) === JSON.stringify(b.map(x => x.ok)),
    errorEqual: JSON.stringify(error) === JSON.stringify(b.map(x => x.error)),
    expectedEqual: JSON.stringify(expected) === JSON.stringify(b.map(x => x.expected)),
    mismatches
  };
}

function runNodeIndependent() {
  const ctx = { console };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  for (const f of PROD) {
    vm.runInContext(fs.readFileSync(path.join(root, 'js/gdd1', f + '.js'), 'utf8'), ctx);
  }
  let src = fs.readFileSync(path.join(__dirname, 'f4-audit-semantic-v3.js'), 'utf8');
  if (!src.includes(COPPER_FROM)) throw Error('copper oracle patch needle missing from f4-audit-semantic-v3.js');
  src = src.replace(COPPER_FROM, COPPER_TO);
  if (src.includes(COPPER_FROM) || !src.includes(COPPER_TO)) throw Error('copper oracle patch did not apply');
  vm.runInContext(src, ctx);
  const r = ctx.runF4IndependentV3();
  if (!r || r.total !== 32) throw Error('independent v3 did not return 32 cases: ' + (r && r.total));
  return r;
}

function writeHtml(patchedSrc) {
  const scripts = PROD.map(f => '<script src="../../js/gdd1/' + f + '.js"></script>').join('') +
    '<script src="f4-audit-semantic-v3.js"></script>';
  const inline = patchedSrc.replace(/</g, '\\u003c');
  const html = '<!doctype html><meta charset="utf-8"><title>f4-grok-edge-semantic-v1</title>' +
    scripts +
    '<pre id="result"></pre><script>' + inline +
    ';window.__semantic=(function(){var r=runF4IndependentV3();return{total:r.total,passed:r.passed,cases:r.cases.map(function(c){return{name:c.name,ok:!!c.ok,error:c.error==null?null:String(c.error),expected:c.expected};})};})();' +
    'document.getElementById("result").textContent=JSON.stringify(window.__semantic);</script>\n';
  fs.writeFileSync(htmlPath, html, { flag: 'wx' });
}

const nodeRaw = runNodeIndependent();
const nodeSlim = slimCases(nodeRaw);
let v3src = fs.readFileSync(path.join(__dirname, 'f4-audit-semantic-v3.js'), 'utf8');
v3src = v3src.replace(COPPER_FROM, COPPER_TO);
writeHtml(v3src);

const payload = {
  scope: 'Independent 32-fixture live-run of runF4IndependentV3 with the v4 copper oracle patch (copper2+machine-neighbor2+reader3=7). Engineering evidence for Node + real Edge file:// + http://127.0.0.1. NOT the 11 implementer parity fixtures. NOT the independent auditor signature.',
  copperOraclePatch: { from: COPPER_FROM, to: COPPER_TO },
  production: {
    resolver: hashFile('js/gdd1/resolver.js'),
    fullEffects: hashFile('js/gdd1/full-effects.js'),
    v3source: hashFile('tests/gdd1/f4-audit-semantic-v3.js')
  },
  node: {
    total: nodeRaw.total,
    passed: nodeRaw.passed,
    failed: nodeRaw.cases.filter(c => !c.ok).map(c => ({ name: c.name, error: c.error || null })),
    cases: nodeSlim
  },
  edge: {
    available: fs.existsSync(edgePath),
    path: edgePath,
    file: null,
    http: null
  },
  compare: null,
  ok: false
};

if (!payload.edge.available) {
  payload.edge.note = 'Chrome is absent; Edge is the gate; msedge.exe missing at helper path. Browser file/HTTP not faked.';
  payload.compare = { skipped: true, reason: 'edge-missing' };
  payload.ok = false;
  fs.writeFileSync(destPath, JSON.stringify(payload, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ dest: 'tests/gdd1/' + destName, node: payload.node.passed + '/' + payload.node.total, edge: 'missing', ok: false }, null, 2));
  process.exitCode = 1;
  process.exit();
}

process.argv[2] = outname;
const helper = fs.readFileSync(path.join(__dirname, 'f4-ui-cdp.js'), 'utf8');
const prefix = helper.slice(0, helper.indexOf('const results=[];for'));
const cleanup = helper.slice(helper.indexOf('})().catch(e=>'));
if (!prefix.includes('outname=process.argv[2]') || !cleanup.includes('server.close')) {
  throw Error('CDP helper PREFIX/CLEANUP markers not found');
}

const body = String.raw`
const nodeSlim=` + JSON.stringify(nodeSlim) + String.raw`;
function fields(cases){return{names:cases.map(c=>c.name),ok:cases.map(c=>c.ok),error:cases.map(c=>c.error),expected:cases.map(c=>c.expected)};}
const results=[];
for(const [route,url]of [['file','file:///'+root.replace(/\\/g,'/')+'/tests/gdd1/f4-grok-edge-semantic-v1.html'],['http','http://127.0.0.1:'+server.address().port+'/tests/gdd1/f4-grok-edge-semantic-v1.html']]){
  const {targetId}=await call('Target.createTarget',{url:'about:blank'}),{sessionId}=await call('Target.attachToTarget',{targetId,flatten:true});
  await call('Page.enable',{},sessionId);
  await call('Runtime.enable',{},sessionId);
  await call('Page.navigate',{url},sessionId);
  const r=await call('Runtime.evaluate',{expression:"new Promise((resolve,reject)=>{const start=Date.now(),timer=setInterval(()=>{if(window.__semantic){clearInterval(timer);resolve(window.__semantic)}else if(Date.now()-start>20000){clearInterval(timer);reject(Error('Independent semantic page did not finish: '+(document.getElementById('result')&&document.getElementById('result').textContent||document.body&&document.body.textContent||'')))}},25)})",returnByValue:true,awaitPromise:true},sessionId);
  if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));
  const value=r.result.value;
  assert(value&&Array.isArray(value.cases),route+' missing cases');
  assert.strictEqual(value.cases.length,32,route+' case count');
  results.push({route,total:value.total,passed:value.passed,cases:value.cases});
  await call('Target.closeTarget',{targetId});
}
const fileCases=results.find(x=>x.route==='file').cases;
const httpCases=results.find(x=>x.route==='http').cases;
const fileFields=fields(fileCases),httpFields=fields(httpCases),nodeFields=fields(nodeSlim);
assert.deepStrictEqual(fileFields.names,nodeFields.names);
assert.deepStrictEqual(httpFields.names,nodeFields.names);
assert.deepStrictEqual(fileFields.ok,nodeFields.ok);
assert.deepStrictEqual(httpFields.ok,nodeFields.ok);
assert.deepStrictEqual(fileFields.error,nodeFields.error);
assert.deepStrictEqual(httpFields.error,nodeFields.error);
assert.deepStrictEqual(fileFields.expected,nodeFields.expected);
assert.deepStrictEqual(httpFields.expected,nodeFields.expected);
const nodePassed=nodeSlim.filter(c=>c.ok).length;
const payload={
  scope:'Independent 32-fixture live-run of runF4IndependentV3 with the v4 copper oracle patch (copper2+machine-neighbor2+reader3=7). Engineering evidence for Node + real Edge file:// + http://127.0.0.1. NOT the 11 implementer parity fixtures. NOT the independent auditor signature.',
  copperOraclePatch:{from:` + JSON.stringify(COPPER_FROM) + String.raw`,to:` + JSON.stringify(COPPER_TO) + String.raw`},
  production:` + JSON.stringify(payload.production) + String.raw`,
  node:{total:32,passed:nodePassed,failed:nodeSlim.filter(c=>!c.ok).map(c=>({name:c.name,error:c.error})),cases:nodeSlim},
  edge:{available:true,path:` + JSON.stringify(edgePath) + String.raw`,file:{total:results[0].total,passed:results[0].passed,cases:fileCases},http:{total:results[1].total,passed:results[1].passed,cases:httpCases}},
  compare:{
    names:fileFields.names,
    fileEqualsNode:true,
    httpEqualsNode:true,
    fileEqualsHttp:JSON.stringify(fileCases)===JSON.stringify(httpCases),
    fieldsCompared:['name','ok','error','expected'],
    caseCount:32
  },
  ok:nodePassed===32&&results[0].passed===32&&results[1].passed===32
};
save('results.json',JSON.stringify(payload,null,2)+'\n');
console.log(JSON.stringify({dest:'tests/gdd1/f4-grok-edge-semantic-v1-results.json',node:nodePassed+'/32',file:results[0].passed+'/32',http:results[1].passed+'/32',ok:payload.ok},null,2));
if(!payload.ok)process.exitCode=1;
`;

new Function('require', 'process', '__dirname', prefix + body + cleanup)(require, process, __dirname);
