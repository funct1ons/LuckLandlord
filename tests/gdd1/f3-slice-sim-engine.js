'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const context=vm.createContext({console});
for(const name of ['contract','rng','schema','save','content','offers','resolver','controller'])vm.runInContext(fs.readFileSync(path.resolve(__dirname,'../../js/gdd1/'+name+'.js'),'utf8'),context,{filename:name+'.js'});
const F=context.GDD1,copy=x=>JSON.parse(JSON.stringify(x));
const bots=['Random','Value','Synergy','Greedy'];
function policyRng(seed){let x=F.hashIdentity('policy-v1/'+seed),consumed=0;return {next(){x^=x<<13;x^=x>>>17;x^=x<<5;x>>>=0;consumed++;return x/4294967296},snapshot(){return {state:x,consumed}}};}
function publicView(s){const v=copy(s);delete v.rng;delete v.seed;return v;}
function counts(v,tag){return v.pool.filter(x=>F.sliceSymbols[x.type].tags.includes(tag)).length;}
function value(id,v,synergy=false){
 if(F.sliceItems[id]){
  const n={item_dew_calendar:counts(v,'plant')*.8,item_root_wrap:counts(v,'plant')*.6,item_frost_glass:counts(v,'mist')*.3,item_sorting_apron:counts(v,'scrap')*.5,item_waste_log:counts(v,'junk')*.2,item_offcut_chute:counts(v,'scrap')*.4,item_clean_mesh:counts(v,'junk')*.25,item_brine_lining:counts(v,'feedstock')*.8,item_fraction_gauge:new Set(v.pool.filter(x=>F.sliceSymbols[x.type].tags.includes('crystal')).map(x=>x.type)).size*.6,item_residue_stamp:counts(v,'mist')*.5};return n[id];
 }
 const d=F.sliceSymbols[id];let n=d.base;
 if(d.mechanics.age&&!d.mechanics.age.destroy)n=id==='mist_pouch'?3.3:id==='dew_lantern'?3.8:2;
 if(id==='ash_felt')n=1.6;
 if(!synergy)return n;
 const chance=k=>Math.min(1,k*.22);
 if(id==='copper_burr')n+=2*chance(counts(v,'machine'));
 if(id==='warm_pod')n+=3*chance(counts(v,'fuel'));
 if(id==='sorting_tong')n+=4*chance(counts(v,'scrap'));
 if(id==='condense_coil')n+=4*chance(counts(v,'feedstock'));
 if(id==='sieve_drum')n+=3*chance(counts(v,'junk'));
 if(id==='deep_still')n+=3*chance(counts(v,'mist'));
 if(id==='root_ledger')n+=Math.min(7,counts(v,'plant')*.8);
 if(id==='heat_clerk')n+=Math.min(7,v.pool.filter(x=>x.type==='sorting_tong').length*2);
 if(id==='crystal_index')n+=new Set(v.pool.filter(x=>F.sliceSymbols[x.type].tags.includes('crystal')).map(x=>x.type)).size>=2?6:1;
 if(id==='reserve_facet')n+=4*chance(counts(v,'fuel'));
 if(id==='nursery_gauge')n+=counts(v,'plant')*.4;
 if(id==='furnace_auditor')n+=v.pool.filter(x=>x.type==='sorting_tong').length;
 return n;
}
function legal(v){
 const w={windowId:v.offer.windowId};let a=[];
 if(v.phase==='READY')a=[{op:'spin'}];
 if(v.phase==='SYMBOL_CHOICE')a=[...(v.pool.length<200?v.offer.choices.map(id=>({op:'choose',id,...w})):[]),{op:'skip',...w}];
 if(['READY','SYMBOL_CHOICE'].includes(v.phase)&&v.removeTokens&&v.pool.length)a.push(...v.pool.map(x=>({op:'remove',uid:x.uid,confirmEmpty:v.pool.length===1})));
 if(v.phase==='SYMBOL_CHOICE'&&v.rerollTokens&&v.offer.choiceRefreshesUsed<3)a.push({op:'reroll',...w});
 if(v.phase==='ITEM_CHOICE')a=[...v.offer.choices.map(id=>({op:'item',id,...w})),{op:'skipItem',...w}];
 if(v.phase==='EVENT_CHOICE'){
  const e=F.sliceEvents[v.events.choice.id];a=[{op:'event',id:v.events.choice.id,option:'B'}];
  if(v.cash>=e.cost&&(!e.spawn||v.pool.length<200))a.push(...v.events.choice.targetUids.filter(uid=>v.pool.some(x=>x.uid===uid&&F.sliceSymbols[x.type].tags.includes(e.tag)&&(!e.age||F.sliceSymbols[x.type].mechanics.age))).map(uid=>({op:'event',id:v.events.choice.id,option:'A',uid})));
 }
 return a;
}
function staticChoice(v,synergy){
 const a=legal(v),rem=a.filter(x=>x.op==='remove').sort((a,b)=>{const x=v.pool.find(p=>p.uid===a.uid),y=v.pool.find(p=>p.uid===b.uid);return value(x.type,v,synergy)+x.permanent-value(y.type,v,synergy)-y.permanent});
 if(rem.length){const x=v.pool.find(p=>p.uid===rem[0].uid);if(x.type==='spent_gasket'||v.pool.length>24&&value(x.type,v,synergy)+x.permanent<2.1)return rem[0];}
 if(v.phase==='READY')return a[0];
 if(v.phase==='SYMBOL_CHOICE'){
  const ranked=a.filter(x=>x.op==='choose').sort((a,b)=>value(b.id,v,synergy)-value(a.id,v,synergy));
  const floor=v.pool.length<20?0:v.pool.reduce((n,x)=>n+value(x.type,v,synergy)+x.permanent,0)/v.pool.length;
  if(ranked.length&&value(ranked[0].id,v,synergy)>floor+.15)return ranked[0];
  if(a.some(x=>x.op==='reroll')&&(!ranked.length||value(ranked[0].id,v,synergy)<floor)&&v.offer.choiceRefreshesUsed===0)return a.find(x=>x.op==='reroll');
  return a.find(x=>x.op==='skip');
 }
 if(v.phase==='ITEM_CHOICE'){const r=a.filter(x=>x.op==='item').sort((a,b)=>value(b.id,v,true)-value(a.id,v,true));return r.length&&value(r[0].id,v,true)>.1?r[0]:a.find(x=>x.op==='skipItem');}
 const A=a.filter(x=>x.option==='A');if(!A.length)return a[0];
 if(v.events.choice.id==='event_copper_queue')return v.pool.length<24?A[0]:a[0];
 if(v.events.choice.id==='event_brine_inspection')return v.pool.length>20?A.sort((a,b)=>v.pool.find(x=>x.uid===a.uid).permanent-v.pool.find(x=>x.uid===b.uid).permanent)[0]:a[0];
 return v.cash>=v.payment*.15+4?A[0]:a[0];
}
function surrogate(v,sample){const s=copy(v);s.seed='f3-model-v1/'+sample;s.rng=F.createRng(s.seed,s.profile,s.difficulty);return s;}
function rollout(v,action){
 let s=surrogate(v,0),income=0,spins=0,commands=0;
 const apply=a=>{const r=F.sliceCommand(s,{...a,revision:s.revision});commands++;if(!r.ok)throw Error('Model command: '+r.error);s=r.state;};
 apply(action);
 while(!['WON','LOST'].includes(s.phase)&&spins<2&&commands<14){
  if(s.phase==='READY'){apply({op:'spin'});income+=s.last.total;spins++;}
  else if(s.phase==='SYMBOL_CHOICE')apply({op:'skip',windowId:s.offer.windowId});
  else if(s.phase==='ITEM_CHOICE')apply({op:'skipItem',windowId:s.offer.windowId});
  else apply({op:'event',id:s.events.choice.id,option:'B'});
 }
 const mean=s.pool.length?s.pool.reduce((n,x)=>n+value(x.type,publicView(s),true)+x.permanent,0)/s.pool.length:0;
 const utility=(s.phase==='LOST'?-100000:0)+(s.phase==='WON'?100000:0)+income+mean*2+Math.min(20,s.pool.length)*.35+s.removeTokens*.2+s.rerollTokens*.2;
 return {utility,commands,spins};
}
function decide(bot,v,rng){
 const a=legal(v);if(!a.length)throw Error('No legal actions');
 if(bot==='Random')return {action:a[Math.floor(rng.next()*a.length)],modelCommands:0};
 if(bot!=='Greedy')return {action:staticChoice(v,bot==='Synergy'),modelCommands:0};
 // Same synthetic draw stream for each candidate; no live RNG or future offers.
 const preferred=staticChoice(v,true);let candidates=a.filter(x=>!['remove','reroll'].includes(x.op));
 if(preferred.op==='remove'||preferred.op==='reroll')candidates.push(preferred);
 if(v.phase==='READY'&&preferred.op!=='remove')return {action:{op:'spin'},modelCommands:0};
 let best=null,n=0;for(const action of candidates){const r=rollout(v,action);n+=r.commands;if(!best||r.utility>best.utility)best={action,utility:r.utility};}
 return {...best,modelCommands:n};
}
function formation(v,recent){
 const n=type=>v.pool.filter(x=>x.type===type).length;
 const A=counts(v,'plant')>=4&&(n('fog_stitcher')||v.items.includes('item_dew_calendar'))&&(recent.reduce((a,b)=>a+b.plantTransforms,0)>=2||recent.reduce((a,b)=>a+b.plantProductIncome,0)>=12);
 const B=counts(v,'scrap')>=2&&(n('sorting_tong')||n('sieve_drum'))&&(n('heat_clerk')||v.items.includes('item_offcut_chute'))&&recent.reduce((a,b)=>a+b.scrapProcessed,0)>=2;
 const D=counts(v,'feedstock')>=3&&(n('condense_coil')||n('deep_still'))&&new Set(v.pool.filter(x=>F.sliceSymbols[x.type].tags.includes('crystal')).map(x=>x.type)).size>=2;
 return ['A','B','D'].filter((_,i)=>[A,B,D][i]);
}
module.exports={F,copy,bots,policyRng,publicView,legal,value,staticChoice,surrogate,rollout,decide,formation};
