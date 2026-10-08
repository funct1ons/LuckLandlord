'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const dir=__dirname,node=JSON.parse(fs.readFileSync(path.join(dir,'fix-node.json'),'utf8')),reports=[];
for(const protocol of['file','http'])for(const mode of['write','read']){
 const file=`fix-edge-${protocol}-${mode}.html`,html=fs.readFileSync(path.join(dir,file),'utf8'),match=html.match(/<pre id="result">([\s\S]*?)<\/pre>/);
 if(!match)throw Error('Missing case JSON '+file);
 const text=match[1].replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&amp;/g,'&'),browser=JSON.parse(text);
 const sameCases=JSON.stringify(browser.cases)===JSON.stringify(node.cases);
 const ok=sameCases&&browser.total===node.total&&browser.passed===browser.total&&browser.storage.ok;
 reports.push({file,protocol,mode,total:browser.total,passed:browser.passed,sameCases,storage:browser.storage,userAgent:browser.userAgent,ok});
}
const fixtures={window:{}};vm.createContext(fixtures);vm.runInContext(fs.readFileSync(path.join(dir,'browser-data.js'),'utf8'),fixtures);
const browserFixtureLiteralsMatch=JSON.stringify(fixtures.window.GDD1_TEST_VECTORS)===JSON.stringify(JSON.parse(fs.readFileSync(path.join(dir,'rng-vectors.json'))))&&JSON.stringify(fixtures.window.GDD1_HAND_ORACLES)===JSON.stringify(JSON.parse(fs.readFileSync(path.join(dir,'hand-oracles.json'))));
const result={node:{total:node.total,passed:node.passed},reports,browserFixtureLiteralsMatch,chrome:{tested:false,reason:'Chrome absent from standard machine/user paths and HKLM/HKCU App Paths; no Chrome run claimed'},scope:'Case-level F1 repair parity; each browser run also checks real localStorage',ok:reports.every(x=>x.ok)&&browserFixtureLiteralsMatch};
fs.writeFileSync(path.join(dir,'fix-parity.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));process.exitCode=result.ok?0:1;
