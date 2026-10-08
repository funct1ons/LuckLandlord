(function(root){
'use strict';
const F=root.GDD1;
const check=(ok,message)=>{if(!ok)throw Error(message)};
const clearOffer=s=>{s.offer.kind=null;s.offer.choices=[];s.offer.choiceRefreshesUsed=0;s.offer.guarantees.applied=null};
const counters=type=>{const m=F.sliceSymbols[type].mechanics;return m.age?{age:0}:m.pressure?{pressure:0}:{}};
const cleanup=s=>{s.reservations=s.reservations.filter(r=>s.pool.some(x=>x.uid===r.uid&&x.epoch===r.epoch));s.events.activeModifiers=s.events.activeModifiers.filter(m=>{const x=s.pool.find(x=>x.uid===m.uid);return x&&F.sliceSymbols[x.type].tags.includes('plant')&&F.sliceSymbols[x.type].mechanics.age})};
F.sliceEventTargets=function(s,id){const e=F.sliceEvents[id];if(!e)return[];return s.pool.filter(x=>{const d=F.sliceSymbols[x.type];return d.tags.includes(e.tag)&&(!e.age||d.mechanics.age)}).map(x=>x.uid)};
function events(s,paid){
 const ev=s.events;
 if(ev.cooldownPayments){ev.cooldownPayments--;return}
 if(paid<2||paid>8||ev.count>=3)return;
 const eligible=Object.keys(F.sliceEvents).filter(id=>!ev.seenIds.includes(id)&&F.sliceEventTargets(s,id).length&&s.cash>=F.sliceEvents[id].cost&&(!F.sliceEvents[id].spawn||s.pool.length<200));
 if(!eligible.length)return;
 if(F.random(s.rng,'event')>=.4)return;
 const id=eligible[Math.floor(F.random(s.rng,'event')*eligible.length)];ev.seenIds.push(id);ev.count++;ev.cooldownPayments=1;
 ev.choice={id,options:['A','B'],targetUids:F.sliceEventTargets(s,id),cost:F.sliceEvents[id].cost,stageId:s.stageId};s.phase='EVENT_CHOICE';
}
function setup(s){
 const paid=s.stageId;s.stageId++;s.stageSpin=0;s.spinsRemaining=F.NORMAL_SPINS[s.stageId-1];s.basePayment=s.payment=F.SLICE_PAYMENTS[s.stageId-1];s.phase='READY';
 s.rerollTokens=Math.min(9,s.rerollTokens+1);if(s.stageId>=3)s.removeTokens=Math.min(9,s.removeTokens+1);
 s.stageState={advanceClaims:[],paymentModifiers:[],skipCount:0};s.offer.guarantees.stageCommonHandled=false;
 s.itemState.stageId=s.stageId;for(const id of s.items){s.itemState.quotas[id].stage=0;s.itemState.used[id].stage=false}
 events(s,paid);
}
F.sliceCommand=function(state,command){
 return F.transact(state,command.revision,s=>{
  check(s.profile==='slice-abd-v1','Slice profile required');
  const op=command.op;
  if(op==='spin'){
   check(s.phase==='READY','Not ready');const board=F.sliceDraw(s);s.spin++;s.stageSpin++;s.spinsRemaining--;s.last=F.sliceResolve(s,board);s.pendingSettlement=s.last.total;s.phase='SYMBOL_CHOICE';F.sliceOffer(s,'symbol');
  }else if(op==='reroll'){
   check(s.phase==='SYMBOL_CHOICE'&&command.windowId===s.offer.windowId,'Stale symbol window');check(s.rerollTokens>0&&s.offer.choiceRefreshesUsed<3,'Refresh unavailable');s.rerollTokens--;s.offer.choiceRefreshesUsed++;F.sliceOffer(s,'symbol',false);
  }else if(op==='remove'){
   check(['READY','SYMBOL_CHOICE'].includes(s.phase)&&s.removeTokens>0,'Removal unavailable');check(s.pool.some(x=>x.uid===command.uid),'Unknown UID');check(s.pool.length!==1||command.confirmEmpty===true,'Confirm empty pool');s.pool=s.pool.filter(x=>x.uid!==command.uid);s.removeTokens--;cleanup(s);
  }else if(op==='choose'||op==='skip'){
   check(s.phase==='SYMBOL_CHOICE'&&command.windowId===s.offer.windowId,'Stale symbol window');
   if(op==='choose'){check(s.offer.choices.includes(command.id)&&s.pool.length<200,'Illegal selection/full pool');s.pool.push(F.instance(s,command.id))}else s.stageState.skipCount++;
   s.cash=Math.max(0,s.cash+s.pendingSettlement);check(s.cash<=1e9,'Cash safety bound');s.pendingSettlement=null;clearOffer(s);
   if(s.spinsRemaining){s.phase='READY';return}
   if(s.cash<s.payment){s.phase='LOST';return}
   s.cash-=s.payment;if(s.stageId===10){s.phase='WON';return}
   s.phase='ITEM_CHOICE';F.sliceOffer(s,'item');
  }else if(op==='item'||op==='skipItem'){
   check(s.phase==='ITEM_CHOICE'&&command.windowId===s.offer.windowId,'Stale item window');
   if(op==='item'){check(s.offer.choices.includes(command.id)&&!s.items.includes(command.id),'Illegal item');s.items.push(command.id);s.itemState.quotas[command.id]={spin:0,stage:0,run:0};s.itemState.used[command.id]={spin:false,stage:false}}
   clearOffer(s);setup(s);
  }else if(op==='event'){
   check(s.phase==='EVENT_CHOICE'&&s.events.choice.id===command.id,'Stale event');check(['A','B'].includes(command.option),'Unknown option');
   if(command.option==='A'){
    const e=F.sliceEvents[command.id],c=s.events.choice;check(c.targetUids.includes(command.uid)&&F.sliceEventTargets(s,c.id).includes(command.uid),'Invalid event target');check(s.cash>=e.cost&&(!e.spawn||s.pool.length<200),'Event cost/capacity');
    const x=s.pool.find(x=>x.uid===command.uid);s.cash-=e.cost;
    if(e.op==='modifier')s.events.activeModifiers.push({eventId:c.id,uid:x.uid,stageId:s.stageId,remaining:e.remaining});
    if(e.op==='transform'){x.type=e.type;x.epoch++;x.counters=counters(e.type);cleanup(s);s.pool.push(F.instance(s,e.spawn))}
    if(e.op==='remove'){s.pool=s.pool.filter(p=>p.uid!==x.uid);cleanup(s);s.offer.guarantees[e.guarantee]=true}
   }
   s.events.choice=null;s.phase='READY';
  }else if(op==='autosave'){check(typeof command.value==='boolean','Boolean required');s.settings.autosave=command.value}
  else throw Error('Unknown command');
 });
};
})(typeof window!=='undefined'?window:globalThis);
