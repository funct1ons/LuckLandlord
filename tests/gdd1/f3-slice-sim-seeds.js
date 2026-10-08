'use strict';
const fs=require('fs'),crypto=require('crypto');
const {bots}=require('./f3-slice-sim-engine');
const entries=bots.flatMap(bot=>['train','holdout'].flatMap(split=>Array.from({length:1000},(_,index)=>({bot,split,index,seed:`F3-SLICE-v1/${bot}/${split}/${String(index).padStart(4,'0')}`,policySeed:`decision-v1/${bot}/${split}/${index}`}))));
if(new Set(entries.map(x=>x.seed)).size!==8000)throw Error('seed overlap');
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(__dirname+'/'+p)).digest('hex');
fs.writeFileSync(__dirname+'/f3-slice-sim-seeds.json',JSON.stringify({rule:'Enumerated formula fixed before batch launch in run.js; materialized while batches run. No seed screening or tuning.',policyHash:hash('f3-slice-sim-engine.js'),runnerHash:hash('f3-slice-sim-run.js'),entries},null,2)+'\n');
console.log('8000 fixed seeds');
