'use strict';
const fs=require('node:fs'),path=require('node:path');
const dir=__dirname;
const node=JSON.parse(fs.readFileSync(path.join(dir,'f1-node-results.json'),'utf8'));
const reports=[];
for(const protocol of ['file','http'])for(const mode of ['write','read']){
  const file=`f1-edge-${protocol}-${mode}.html`;
  const html=fs.readFileSync(path.join(dir,file),'utf8');
  const match=html.match(/<pre id="result">([\s\S]*?)<\/pre>/);
  if(!match)throw Error('Missing case JSON: '+file);
  const text=match[1].replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&amp;/g,'&');
  const browser=JSON.parse(text);
  const base=browser.cases.filter(x=>!x.name.startsWith('gdd1/f1/browser-storage/'));
  const sameCases=JSON.stringify(base)===JSON.stringify(node.cases);
  if(!sameCases||browser.passed!==browser.total)throw Error('Case-level parity mismatch: '+file);
  reports.push({browser:'Edge',protocol,mode,total:browser.total,passed:browser.passed,sameCases,nodeBaseCases:base.length});
}
const vector=JSON.parse(fs.readFileSync(path.join(dir,'rng-vectors.json'),'utf8'));
const reference=JSON.parse(fs.readFileSync(path.join(dir,'rng-reference-current.txt'),'utf8').replace(/^\uFEFF/,''));
if(JSON.stringify(vector)!==JSON.stringify(reference))throw Error('Independent Python reference disagrees');
// Static offline test data must also exactly match the source fixture JSON.
const vm=require('node:vm'),ctx={window:{}};vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(dir,'browser-data.js'),'utf8'),ctx);
if(JSON.stringify(ctx.window.GDD1_TEST_VECTORS)!==JSON.stringify(vector)||
   JSON.stringify(ctx.window.GDD1_HAND_ORACLES)!==JSON.stringify(JSON.parse(fs.readFileSync(path.join(dir,'hand-oracles.json'),'utf8'))))throw Error('Browser fixture literals drifted');
const result={node:{total:node.total,passed:node.passed},reports,independentPythonReferenceMatches:true,browserFixtureLiteralsMatch:true,
  chrome:{tested:false,reason:'No installed Chrome executable found in machine/user application paths; not claimed passed'},
  scope:'F1 foundation parity only, not gameplay/UI acceptance or independent audit'};
fs.writeFileSync(path.join(dir,'f1-parity-report.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
