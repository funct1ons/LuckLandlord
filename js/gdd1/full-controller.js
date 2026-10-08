(function(root){
'use strict';
const F=root.GDD1;
const check=(ok,message)=>{if(!ok)throw Error(message)};
const clearOffer=s=>{s.offer.kind=null;s.offer.choices=[];s.offer.choiceRefreshesUsed=0;s.offer.guarantees.applied=null};
const counters=(s,type)=>{const m=F.defs(s).symbols[type].mechanics||{};return m.age?{age:0}:m.pressure?{pressure:0}:{}};
const cleanup=s=>{s.reservations=s.reservations.filter(r=>s.pool.some(x=>x.uid===r.uid&&x.epoch===r.epoch));s.events.activeModifiers=s.events.activeModifiers.filter(m=>{if(m.uid===null)return m.remaining>0&&m.stageId===s.stageId;const x=s.pool.find(x=>x.uid===m.uid);return x&&F.defs(s).symbols[x.type].tags.includes('plant')&&F.defs(s).symbols[x.type].mechanics.age})};
F.fullEventTargets=function(s,id){const e=F.defs(s).events[id];if(!e||e.target===null)return[];const t=e.target||{tag:e.tag,age:e.age};return s.pool.filter(x=>{const d=F.defs(s).symbols[x.type];return (!t.tag||d.tags.includes(t.tag))&&(!t.notTag||!d.tags.includes(t.notTag))&&(!t.rarity||d.rarity===t.rarity)&&(!t.age||d.mechanics.age)&&(!t.pressureMechanism||d.mechanics.pressure)}).map(x=>x.uid)};
F.fullEventEligible=function(s,id){const e=F.defs(s).events[id];if(!e)return false;const targets=F.fullEventTargets(s,id);return s.pool.length>=(e.minPool||0)&&s.spinsRemaining>=(e.minStageSpins||0)&&s.cash>=e.cost&&(targets.length>0||e.allowEmptyTarget===true)&&(!(e.requiresCapacity||e.spawn||e.capacityWhenEmpty&&!targets.length)||s.pool.length<200)};
function events(s,paid){
 const ev=s.events;
 if(ev.cooldownPayments){ev.cooldownPayments--;return}
 if(paid<2||paid>8||ev.count>=3)return;
 const eligible=Object.keys(F.defs(s).events).filter(id=>!ev.seenIds.includes(id)&&F.fullEventEligible(s,id));
 if(!eligible.length)return;
 if(F.random(s.rng,'event')>=.4)return;
 const id=eligible[Math.floor(F.random(s.rng,'event')*eligible.length)];ev.seenIds.push(id);ev.count++;ev.cooldownPayments=1;
 ev.choice={id,options:['A','B'],targetUids:F.fullEventTargets(s,id),cost:F.defs(s).events[id].cost,stageId:s.stageId};s.phase='EVENT_CHOICE';
}
// Shared scheduling boundary used by stage setup and deterministic contract tests.
F.fullScheduleEvent=events;
function setup(s){
 const paid=s.stageId;s.stageId++;s.stageSpin=0;s.spinsRemaining=F.NORMAL_SPINS[s.stageId-1];s.basePayment=s.payment=F.PROFILES[s.profile].payments[s.stageId-1];s.phase='READY';
 s.rerollTokens=Math.min(9,s.rerollTokens+1);if(s.stageId>=3)s.removeTokens=Math.min(9,s.removeTokens+1);
 s.stageState={advanceClaims:[],paymentModifiers:[],skipCount:0};s.offer.guarantees.stageCommonHandled=false;
 s.itemState.stageId=s.stageId;for(const id of s.items){s.itemState.quotas[id].stage=0;s.itemState.used[id].stage=false}
 events(s,paid);
}
F.fullCommand=function(state,command){
 return F.transact(state,command.revision,s=>{
  check(s.profile==='full-v1','Full profile required');
  const op=command.op;
  if(op==='spin'){
   check(s.phase==='READY','Not ready');const board=F.sliceDraw(s);s.spin++;s.stageSpin++;s.spinsRemaining--;s.last=F.sliceResolve(s,board);s.pendingSettlement=s.last.total;s.phase='SYMBOL_CHOICE';F.sliceOffer(s,'symbol');
  }else if(op==='reroll'){
   check(s.phase==='SYMBOL_CHOICE'&&command.windowId===s.offer.windowId,'Stale symbol window');check(s.rerollTokens>0&&s.offer.choiceRefreshesUsed<3,'Refresh unavailable');s.rerollTokens--;s.offer.choiceRefreshesUsed++;F.sliceOffer(s,'symbol',false);
  }else if(op==='remove'){
   check(['READY','SYMBOL_CHOICE'].includes(s.phase)&&s.removeTokens>0,'Removal unavailable');check(s.pool.some(x=>x.uid===command.uid),'Unknown UID');check(s.pool.length!==1||command.confirmEmpty===true,'Confirm empty pool');s.pool=s.pool.filter(x=>x.uid!==command.uid);s.removeTokens--;cleanup(s);
  }else if(op==='choose'||op==='skip'){
   check(s.phase==='SYMBOL_CHOICE'&&command.windowId===s.offer.windowId,'Stale symbol window');
   if(op==='choose'){check(s.offer.choices.includes(command.id)&&s.pool.length<200,'Illegal selection/full pool');s.pool.push(F.instance(s,command.id))}else {s.stageState.skipCount++;for(const id of s.items.slice().sort()){const m=F.defs(s).items[id].mechanics||{};if(m.skipOrdinals&&m.skipOrdinals.includes(s.stageState.skipCount)){s[m.resource]=Math.min(9,s[m.resource]+m.amount);const q=s.itemState.quotas[id];q.spin++;q.stage++;q.run++;s.itemState.used[id].spin=true;}}}
   s.cash=Math.max(0,s.cash+s.pendingSettlement);check(s.cash<=1e9,'Cash safety bound');s.pendingSettlement=null;clearOffer(s);
   if(s.spinsRemaining){s.phase='READY';return}
   if(s.cash<s.payment){s.phase='LOST';return}
   s.cash-=s.payment;for(const id of s.items.slice().sort()){const m=F.defs(s).items[id].mechanics||{},q=s.itemState.quotas[id];if(m.paymentResource&&q.stage===0&&!s.pool.some(x=>F.defs(s).symbols[x.type].tags.includes(m.poolWithoutTag))){if(s.stageId!==10||!m.finalOnlyStats)s[m.paymentResource]=Math.min(9,s[m.paymentResource]+m.amount);q.stage++;q.run++;s.itemState.used[id].stage=true;}}
   if(s.stageId===10){s.phase='WON';return}
   s.phase='ITEM_CHOICE';F.sliceOffer(s,'item');
  }else if(op==='item'||op==='skipItem'){
   check(s.phase==='ITEM_CHOICE'&&command.windowId===s.offer.windowId,'Stale item window');
   if(op==='item'){check(s.offer.choices.includes(command.id)&&!s.items.includes(command.id),'Illegal item');s.items.push(command.id);s.itemState.quotas[command.id]={spin:0,stage:0,run:0};s.itemState.used[command.id]={spin:false,stage:false}}
   clearOffer(s);setup(s);
  }else if(op==='event'){
   check(s.phase==='EVENT_CHOICE'&&s.events.choice.id===command.id,'Stale event');check(['A','B'].includes(command.option),'Unknown option');
   if(command.option==='A'){
    const e=F.defs(s).events[command.id],c=s.events.choice;check(F.fullEventEligible(s,c.id),'Event qualification/cost/capacity changed');
    const targets=F.fullEventTargets(s,c.id),targetUid=command.uid||c.targetUids[0];const x=targetUid&&s.pool.find(x=>x.uid===targetUid);if(targets.length)check(x&&c.targetUids.includes(targetUid)&&targets.includes(targetUid),'Invalid event target');else check(!command.uid,'Unexpected event target');
    s.cash-=e.cost;
    if(e.op==='modifier')s.events.activeModifiers.push({eventId:c.id,uid:e.age&&x?x.uid:null,stageId:s.stageId,remaining:e.remaining||1});
    if(e.op==='transform'){check(x,'Event transform target required');x.type=e.type;x.epoch++;x.counters=counters(s,e.type);cleanup(s);if(e.spawn){check(s.pool.length<200,'Event pool capacity');s.pool.push(F.instance(s,e.spawn))}}
    if(e.op==='remove'||e.op==='removeModifier'){check(x,'Event remove target required');s.pool=s.pool.filter(p=>p.uid!==x.uid);cleanup(s);if(e.guarantee)s.offer.guarantees[e.guarantee]=true;if(e.op==='removeModifier')s.events.activeModifiers.push({eventId:c.id,uid:null,stageId:s.stageId,remaining:e.remaining})}
    if(e.op==='boiler'){s.stageState.paymentModifiers.push({source:c.id,amount:12,cause:'event'});s.payment+=12;s.cash+=10;const target=x||(()=>{check(s.pool.length<200,'Event pool capacity');const created=F.instance(s,'pressure_pouch');s.pool.push(created);return created})();check(F.defs(s).symbols[target.type].mechanics.pressure,'Pressure mechanism required');target.counters.pressure=Math.min(F.defs(s).symbols[target.type].mechanics.pressure.cap,target.counters.pressure+2)}
    if(e.op==='quota'){s.stageState.paymentModifiers.push({source:c.id,amount:10,cause:'event'});s.payment+=10;s.rerollTokens=Math.min(9,s.rerollTokens+1);check(s.pool.length<200,'Event pool capacity');s.pool.push(F.instance(s,'cleared_stub'))}
   }
   s.events.choice=null;s.phase='READY';
  }else if(op==='advanceAccepted'){check(s.phase==='READY'&&typeof command.value==='boolean','READY boolean required');s.settings.advanceAccepted=command.value;
  }else if(op==='autosave'){check(typeof command.value==='boolean','Boolean required');s.settings.autosave=command.value}
  else throw Error('Unknown command');
 });
};
})(typeof window!=='undefined'?window:globalThis);
