'use strict';
const fs=require('node:fs'),path=require('node:path');
const dir=__dirname,node=JSON.parse(fs.readFileSync(path.join(dir,'retest-node.json'),'utf8')),reports=[];
const expected=[...node.baseline.cases,...node.fixRegression.cases,...node.retest.cases];
for(const protocol of ['file','http'])for(const mode of ['write','read']){const file=`retest-edge-${protocol}-${mode}.html`,html=fs.readFileSync(path.join(dir,file),'utf8'),m=html.match(/<pre id="result">([\s\S]*?)<\/pre>/);if(!m)throw Error('missing '+file);const b=JSON.parse(m[1]);const same=JSON.stringify(b.cases)===JSON.stringify(expected);reports.push({file,protocol,mode,total:b.total,passed:b.passed,storage:b.storage,userAgent:b.userAgent,caseLevelParity:same,ok:same&&b.passed===b.total&&b.storage.ok});}
const result={node:{baseline:node.baseline,retest:node.retest},reports,chrome:{tested:false,reason:'Chrome executable absent; no Chrome result claimed'},ok:reports.every(x=>x.ok)};fs.writeFileSync(path.join(dir,'retest-parity.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));process.exitCode=result.ok?0:1;
