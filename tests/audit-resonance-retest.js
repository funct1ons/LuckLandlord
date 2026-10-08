'use strict';
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const ctx={window:{},console};vm.createContext(ctx);for(const f of ['legacy/js/core/rng.js','legacy/js/data/content.js','legacy/js/engine/resolver.js','legacy/js/core/game.js','legacy/js/core/validation.js','legacy/js/core/save.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),ctx,{filename:f});
const G=ctx.window.Game, results=[];
function restore(obj,snap){for(const k of Object.keys(obj))delete obj[k];Object.assign(obj,JSON.parse(snap));}
function probe(name,mut,expected){const target=G.symbols.dock_chime.effects[0];const before=JSON.stringify(target);let accepted=false,error='';try{mut(target);G.validateContent();accepted=true}catch(e){error=e.message}finally{restore(target,before);}const after=JSON.stringify(target);const ok=accepted===expected&&before===after;results.push({name,ok,expected:expected?'accept':'reject',actual:accepted?'accept':'reject',error:ok?'':error||'mutation detected'});}
probe('legal-count-max-zero',e=>{e.amount={count:{area:'row',tags:['resonance'],uniqueTypes:true,max:0,excludeSelf:false}}},true);
probe('reject-count-string-max',e=>{e.amount={count:{area:'row',tags:['resonance'],max:'0'}}},false);
probe('reject-count-NaN-max',e=>{e.amount={count:{area:'row',tags:['resonance'],max:NaN}}},false);
probe('reject-count-unsafe-max',e=>{e.amount={count:{area:'row',tags:['resonance'],max:Number.MAX_SAFE_INTEGER+1}}},false);
probe('reject-count-unknown-field',e=>{e.amount={count:{area:'row',tags:['resonance'],bogus:true}}},false);
probe('reject-count-illegal-excludeSelf',e=>{e.amount={count:{area:'row',tags:['resonance'],excludeSelf:'false'}}},false);
function rowProbe(name,value,expected){const d=G.symbols.silence_keeper.effects[0],before=JSON.stringify(d.when);let accepted=false;try{d.when={rowUniqueTypeCount:value};G.validateContent();accepted=true}catch{}finally{d.when=JSON.parse(before)}results.push({name,ok:accepted===expected&&JSON.stringify(d.when)===before,expected:expected?'accept':'reject',actual:accepted?'accept':'reject'});}
rowProbe('legal-row-at-positive',{tags:['resonance'],at:1},true);
rowProbe('legal-row-exact-positive',{tags:['resonance'],exact:1,excludeSelf:false},true);
rowProbe('reject-row-zero-at',{tags:['resonance'],at:0},false);
rowProbe('reject-row-both-at-exact',{tags:['resonance'],at:1,exact:1},false);
rowProbe('reject-row-unknown-field',{tags:['resonance'],at:1,unexpected:0},false);
rowProbe('reject-row-illegal-excludeSelf',{tags:['resonance'],at:1,excludeSelf:0},false);
const cycle=G.symbols.beat_spool.effects[0];function cycleProbe(name,mut,expected){const before=JSON.stringify(cycle);let accepted=false;try{mut(cycle);G.validateContent();accepted=true}catch{}finally{restore(cycle,before)}results.push({name,ok:accepted===expected&&JSON.stringify(cycle)===before,expected:expected?'accept':'reject',actual:accepted?'accept':'reject'});}
cycleProbe('legal-cycle-reset-zero',e=>{e.threshold=1;e.reset=0},true);
cycleProbe('reject-cycle-NaN-threshold',e=>{e.threshold=NaN},false);
cycleProbe('reject-cycle-unsafe-threshold',e=>{e.threshold=Number.MAX_SAFE_INTEGER+1},false);
cycleProbe('reject-cycle-negative-reset',e=>{e.reset=-1},false);
cycleProbe('reject-cycle-unknown-field',e=>{e.unknownCycleField=true},false);
const deep=G.symbols.dock_chime.effects[0],base=JSON.stringify(deep.amount);let expr=1;for(let i=0;i<9;i++)expr={add:[expr,1]};let deepAccepted=false;try{deep.amount=expr;G.validateContent();deepAccepted=true}catch{}finally{deep.amount=JSON.parse(base)}results.push({name:'reject-expression-depth-over-contract',ok:!deepAccepted&&JSON.stringify(deep.amount)===base,expected:'reject',actual:deepAccepted?'accept':'reject'});
const failed=results.filter(x=>!x.ok);console.log(JSON.stringify({scope:'C resonance schema independent retest',total:results.length,passed:results.length-failed.length,failed:failed.length,results},null,2));process.exitCode=failed.length?1:0;
