(function(root){
'use strict';
const F=root.GDD1;
if(!F.defs)F.defs=function(){return{symbols:F.sliceSymbols,items:F.sliceItems,events:F.sliceEvents}};
const phases={initial:'step4/appearance',step1:'step1/draw',step2:'step2/tagAdded',preprocess:'step2/tagAdded',step3:'step3/age',appearance:'step4/appearance',step4:'step4/appearance','pressure-injection':'step4/pressure-injection',risk:'step4/risk',copy:'step4/copy','adjacency-add':'step5/adjacency-add',structure:'step5/structural-event',step5:'step5/structural-event',end:'step6/lifecycle',step6:'step6/lifecycle',step7:'step7/pressure',listen:'step6/lifecycle',summary:'step8/end-summary',step8:'step8/end-summary',change:'step6/lifecycle',commit:'choice/commit'};
F.sliceResolve=function(s,input){
 if(!Array.isArray(input)||input.length!==20)throw Error('20-cell board required');
 const ids=input.filter(Boolean).map(x=>x.uid);if(new Set(ids).size!==ids.length)throw Error('Duplicate board UID');
 const cells=input.map((x,pos)=>{if(!x)return null;const instance=s.pool.find(p=>p.uid===x.uid);if(!instance)throw Error('Board outside pool');return{x:instance,pos,alive:true,add:0,addParts:[],multiplyParts:[],ratio:[1n,1n],startType:instance.type,startEpoch:instance.epoch,matured:false,visited:new Set([instance.type])}});
 const copyTemplates=new Map(cells.filter(Boolean).map(c=>[c.x.uid,{epoch:c.x.epoch,amount:F.defs(s).symbols[c.x.type].effects.filter(e=>e.copyable===true&&e.op==='add'&&!e.predicate&&Number.isSafeInteger(e.amount)&&['initial','appearance'].includes(e.phase)).reduce((n,e)=>n+e.amount,0)}]));
 const reserveRequests=[],deferredAdds=[],deferredRewards=[];
 const initial={cash:s.cash,payment:s.payment,remaining:s.spinsRemaining+1};
 const log=[],events=[],counts=new Map(),hardCounts=new Map(),generated=new Map(),multipliers=new Map();let reward=0,spawnCount=0,fractionReserved=false;
 for(const id of s.items){s.itemState.quotas[id].spin=0;s.itemState.used[id].spin=false}
 s.itemState.spin=s.spin;
 const d=c=>F.defs(s).symbols[c.x.type];
 const tag=(c,t)=>d(c).tags.includes(t)||(c.tags||[]).includes(t);
 const near=(a,b)=>a.x.uid!==b.x.uid&&Math.abs(a.pos%5-b.pos%5)<=1&&Math.abs(Math.floor(a.pos/5)-Math.floor(b.pos/5))<=1;
 const safe=v=>{if(!Number.isSafeInteger(v)||Math.abs(v)>1e9)throw Error('Amount safety bound');return v};
 const emit=(action,source,target,amount,parent,phase,detail={})=>{
  if(log.length>=5000)throw Error('Action safety bound');if(s.profile==='full-v1'){const key=source.id+'/'+(source.key||source.id),count=(hardCounts.get(key)||0)+1;if(count>64)throw Error('Source effect safety bound');hardCounts.set(key,count);}const depth=parent===null?0:log[parent].depth+1;if(depth>32)throw Error('Depth safety bound');
  const row={id:log.length,parent,depth,phase,action,source:source.id,target:target?target.x.uid:null,amount:amount===undefined?null:amount,
   facts:Object.assign({effectKey:source.key||source.id,sourcePos:source.cell?source.cell.pos:null,targetPos:target?target.pos:null,beforeType:target?target.x.type:null,afterType:target?target.x.type:null,beforeTags:target?d(target).tags.slice():[],afterTags:target?d(target).tags.slice():[],cause:action,actualIncrease:0,createdUid:null,skipReason:null},detail)};
  log.push(row);return row.id;
 };
 const sourceOf=(c,e)=>({id:c.x.uid,cell:c,key:e.key,epoch:c.x.epoch,type:c.x.type});
 const itemSource=(id,e)=>({id,cell:null,key:e.key});
 const sourceValid=(source,e,event)=>!source.cell||(source.cell.x.uid===source.id&&source.cell.x.epoch===source.epoch&&source.cell.x.type===source.type&&(source.cell.alive||(e.deathAllowed&&event&&event.target===source.id)));
 const poolCleanup=()=>{s.reservations=s.reservations.filter(r=>s.pool.some(x=>x.uid===r.uid&&x.epoch===r.epoch));s.events.activeModifiers=s.events.activeModifiers.filter(m=>{if(s.profile==='full-v1'&&m.uid===null)return m.remaining>0&&m.stageId===s.stageId;const x=s.pool.find(x=>x.uid===m.uid);return m.remaining>0&&x&&F.defs(s).symbols[x.type].tags.includes('plant')&&F.defs(s).symbols[x.type].mechanics.age})};
 const select=(selector,source,view=cells)=>{
  if(!selector)return source.cell&&source.cell.alive?[source.cell]:[];
  return view.filter(c=>c&&c.alive&&(selector.scope!=='self'||source.cell&&c.x.uid===source.cell.x.uid)&&(selector.scope!=='adjacent'||source.cell&&near(source.cell,c))&&(selector.scope!=='row'||source.cell&&Math.floor(c.pos/5)===Math.floor(source.cell.pos/5))&&(!selector.excludeSelf||!source.cell||c.x.uid!==source.id)&&(!selector.tag||tag(c,selector.tag))&&(!selector.notTag||!tag(c,selector.notTag))&&(!selector.age||d(c).mechanics.age&&!c.matured)&&(!selector.pressureMechanism||d(c).mechanics.pressure)&&(!selector.pressureAtLeast||d(c).mechanics.pressure&&c.x.counters.pressure>=selector.pressureAtLeast)&&(!selector.belowReleaseThreshold||d(c).mechanics.pressure&&c.x.counters.pressure<d(c).mechanics.pressure.cap)&&(!selector.notReleased||!c.released)&&(!selector.rowFirst||!view.some(other=>other&&other.alive&&Math.floor(other.pos/5)===Math.floor(c.pos/5)&&other.pos<c.pos&&tag(other,selector.tag)))&&(!selector.rowMinTypes||new Set(view.filter(other=>other&&other.alive&&Math.floor(other.pos/5)===Math.floor(c.pos/5)&&tag(other,selector.tag)).map(other=>other.x.type)).size>=selector.rowMinTypes)&&(selector.rowCountExact===undefined||view.filter(other=>other&&other.alive&&Math.floor(other.pos/5)===Math.floor(c.pos/5)&&tag(other,selector.tag)).length===selector.rowCountExact)&&(!selector.receivedTag||events.some(e=>e.action==='tagAdded'&&e.target===c.x.uid))&&(!selector.copyable||copyTemplates.has(c.x.uid)&&copyTemplates.get(c.x.uid).epoch===c.x.epoch&&copyTemplates.get(c.x.uid).amount>0)).sort((a,b)=>{if(selector.receivedTag||selector.order==='tagAdded'){const ia=log.findIndex(row=>row.action==='tagAdded'&&row.target===a.x.uid);const ib=log.findIndex(row=>row.action==='tagAdded'&&row.target===b.x.uid);if(ia!==ib)return ia-ib;}return a.pos-b.pos||Number(a.x.uid.slice(1))-Number(b.x.uid.slice(1));});
 };
 let appearance=null;
 const predicate=(p,source,view)=>{
  if(!p)return true;
  if(p.all)return p.all.every(x=>predicate(x,source,view));
  if(p.cashDeficitAtMost)return initial.cash<initial.payment&&initial.payment-initial.cash<=p.cashDeficitAtMost;
  if(p.remainingAtMost)return initial.cash<initial.payment&&initial.remaining<=p.remainingAtMost;
  if(p.poolWithoutTag)return !s.pool.some(x=>F.defs(s).symbols[x.type].tags.includes(p.poolWithoutTag));
  if(p.initialEmptyMin!==undefined)return 20-input.filter(Boolean).length>=p.initialEmptyMin;
  if(p.lastSpin&&s.spinsRemaining!==0)return false;
  if(p.cashFraction&&initial.cash*p.cashFraction[1]<initial.payment*p.cashFraction[0])return false;
  if(p.cashBelowPayment&&initial.cash>=initial.payment)return false;
  if(p.poolBetween&&(s.pool.length<p.poolBetween[0]||s.pool.length>p.poolBetween[1]))return false;
  if(p.poolBetween||p.cashFraction||p.lastSpin||p.cashBelowPayment)return true;
  if(p.cashBelowHalf)return initial.cash*2<initial.payment;
  if(p.counter)return source.cell.x.counters[p.counter]>=p.min;
  if(p.events){let found=events.filter(e=>e.action===p.events&&(!p.beforeTag||e.beforeTags.includes(p.beforeTag)));return(p.distinct?new Set(found.map(e=>e.beforeType)).size:found.length)>=p.min}
  const found=select(p.count,source,view),count=p.distinct?new Set(found.map(c=>c.x.type)).size:found.length;return count>=(p.min||0)&&(p.max===undefined||count<=p.max);
 };
 const allowance=(source,e)=>{
  if(source.cell)return(counts.get(source.id+'/'+e.key)||0)<(e.limit||1);
  const q=s.itemState.quotas[source.id],used=s.itemState.used[source.id];return e.threshold?!used[e.window||'spin']:q[e.window||'spin']<(e.limit||1);
 };
 const consumeQuota=(source,e)=>{
  if(source.cell){const k=source.id+'/'+e.key;counts.set(k,(counts.get(k)||0)+1)}
  else{const q=s.itemState.quotas[source.id],u=s.itemState.used[source.id];q.spin++;q.stage++;q.run++;u.spin=true;if(e.window==='stage')u.stage=true}
 };
 const skip=(source,target,e,reason,parent,phase)=>{emit('limitSkipped',source,target,null,parent,phase,{skipReason:reason});return false};
 function dispatch(event,parent){
  events.push(event);
  const listeners=[];
  for(const c of cells){if(!c)continue;for(const e of d(c).effects)if(e.phase==='listen'&&e.event===event.action&&(c.alive||e.deathAllowed&&event.target===c.x.uid))listeners.push([sourceOf(c,e),e])}
  for(const id of s.items.slice().sort())for(const e of F.defs(s).items[id].effects)if(e.phase==='listen'&&e.event===event.action)listeners.push([itemSource(id,e),e]);
  for(const [source,e]of listeners){const m=e.match||{};if(!sourceValid(source,e,event)||m.targetSelf&&event.target!==source.id||m.afterSelfType&&event.afterType!==source.cell.x.type||m.beforeTag&&!event.beforeTags.includes(m.beforeTag)||m.afterTag&&!event.afterTags.includes(m.afterTag)||m.notAfterTag&&event.afterTags.includes(m.notAfterTag)||m.notBeforeTag&&event.beforeTags.includes(m.notBeforeTag)||m.notCause&&event.cause===m.notCause||m.adjacent&&(!source.cell||!cells.some(c=>c&&c.x.uid===event.target&&near(source.cell,c)))||m.positiveIncrease&&!(event.actualIncrease>0)||m.actorTag&&!(event.actorTags||[]).includes(m.actorTag)||m.actorAdjacent&&(!source.cell||!cells.some(c=>c&&c.x.uid===event.actor&&near(source.cell,c))))continue;
   if(e.threshold){const q=s.itemState.quotas[source.id],u=s.itemState.used[source.id];q.spin++;q.stage++;q.run++;if(q.stage===e.threshold&&!u.stage){const t=perform(source,e,null,parent,'step6/lifecycle');if(t)u.stage=true}continue}
   if(!allowance(source,e))continue;
   const targets=e.eventTarget||e.op==='reserve'&&event.target?[cells.find(c=>c&&c.x.uid===event.target&&c.alive)]:e.selector?select(e.selector,source):[source.cell];
   for(const target of targets)if(sourceValid(source,e,event)&&perform(source,e.eventAmount?Object.assign({},e,{amount:Math.min(e.eventAmount.cap||1e9,event.actualIncrease*e.eventAmount.factor)}):e,target,parent,e.op==='pressure'?'step6/pressure-injection':log[parent].phase)){consumeQuota(source,e);break}
  }
 }
 function gauge(parent){
  for(const id of s.items.slice().sort())for(const e of F.defs(s).items[id].effects)if(e.phase==='change'){
   const source=itemSource(id,e);if(!allowance(source,e)||fractionReserved||!predicate(e.predicate,source,cells))continue;
   fractionReserved=true;try{if(perform(source,e,null,parent,'step6/lifecycle'))consumeQuota(source,e)}finally{fractionReserved=false}
  }
 }
 function transform(source,target,type,parent,phase,cause){
  if(!target||!target.alive||target.x.type===type||target.visited.has(type))return false;
  const beforeType=target.x.type,beforeTags=d(target).tags.slice(),old=target.x;
  const fresh=F.instance({profile:s.profile,nextUid:1},type);old.type=type;old.epoch++;old.counters=fresh.counters;target.tags=[];target.visited.add(type);poolCleanup();
  const detail={beforeType,afterType:type,beforeTags,afterTags:d(target).tags.slice(),cause};
  const id=emit('transform',source,target,null,parent,phase,detail);dispatch(Object.assign({action:'transform',target:old.uid},detail),id);gauge(id);return true;
 }
 function age(source,target,parent){
  if(!target||!target.alive||target.matured||!d(target).mechanics.age||target.startEpoch!==target.x.epoch)return false;
  const m=d(target).mechanics.age;target.x.counters.age++;
  const id=emit('age',source,target,1,parent,'step3/age');
  if(target.x.counters.age>=m.threshold&&!m.destroy){target.matured=true;transform(source,target,m.to,id,'step3/age','mature')}
  return true;
 }
 function spawn(source,type,parent,phase){
  const key=source.key,sourceCount=generated.get(source.id)||0,globalCount=generated.get(key)||0;
  if(s.pool.length>=200)return skip(source,null,{},'pool-cap',parent,phase);
  if(sourceCount>=1||globalCount>=2)return skip(source,null,{},'generation-budget',parent,phase);
  if(spawnCount>=40)throw Error('Generation safety bound');
  const x=F.instance(s,type);s.pool.push(x);spawnCount++;generated.set(source.id,sourceCount+1);generated.set(key,globalCount+1);emit('spawn',source,null,null,parent,phase,{createdUid:x.uid,afterType:type,afterTags:F.defs(s).symbols[type].tags.slice()});return true;
 }
 function perform(source,e,target,parent,phase){
  if(e.op==='age')return age(source,target,parent);
  if(e.op==='advance'){if(!s.settings.advanceAccepted||s.stageState.advanceClaims.includes(source.id))return false;s.stageState.advanceClaims.push(source.id);s.stageState.paymentModifiers.push({source:source.id,amount:e.obligation,cause:'advance'});s.payment+=e.obligation;perform(source,{op:'reward',amount:e.amount},source.cell,parent,phase);if(e.spawn)spawn(source,e.spawn,parent,phase);return true;}
  if(e.op==='copy'){
   const template=target&&copyTemplates.get(target.x.uid);if(!source.cell||!source.cell.alive||!target||!target.alive||!template||template.epoch!==target.x.epoch||template.amount<=0)return false;
   let amount=Math.min(e.cap||8,template.amount);const supplements=[];
   for(const id of s.items.slice().sort()){const m=F.defs(s).items[id].mechanics||{},fx={key:id+':copy',limit:1},src=itemSource(id,fx);if(m.copyBonus&&allowance(src,fx)){amount=Math.min(e.cap||8,amount+m.copyBonus);supplements.push([src,fx]);}}
   const id=emit('copy',source,target,amount,parent,'step4/copy',{actualIncrease:amount});perform(source,{op:'add',amount},source.cell,id,'step4/copy');for(const [src,fx]of supplements)consumeQuota(src,fx);
   dispatch({action:'copy',target:target.x.uid,beforeType:target.x.type,afterType:target.x.type,beforeTags:d(target).tags.slice(),afterTags:d(target).tags.slice(),cause:'copy',actualIncrease:amount},id);return true;
  }
  if(e.op==='risk'){
   if(!target||!target.alive)return false;const success=F.random(s.rng,'effect')<e.chance[0]/e.chance[1];let loss=success?0:e.failureLoss;
   const id=emit('risk',source,target,success?e.successAdd:-loss,parent,'step4/risk',{cause:success?'risk-success':'risk-failure'});
   if(!success){for(const c of cells){if(!c||!c.alive||!near(c,target))continue;const protection=d(c).mechanics.riskMitigation,key=c.x.uid+'/risk-protection';if(protection&&protection.tag===e.riskTag&&!counts.has(key)){loss=Math.max(0,loss-protection.amount);counts.set(key,1);emit('risk',sourceOf(c,{key:'risk-protection'}),target,protection.amount,id,'step4/risk',{cause:'loss-reduction'})}}
    for(const item of s.items.slice().sort()){const def=F.defs(s).items[item],m=def.mechanics||{},fx={key:item+':risk',limit:1};const src=itemSource(item,fx);if(m.riskReduction&&e.riskTag==='pressure'&&allowance(src,fx)){loss=Math.max(0,loss-m.riskReduction);consumeQuota(src,fx);emit('risk',src,target,m.riskReduction,id,'step4/risk',{cause:'loss-reduction'})}}}
   perform(source,{op:'add',amount:success?e.successAdd:-loss},target,id,'step4/risk');
   if(!success&&e.spawn){let replacement=false;const spawnDef=F.defs(s).symbols[e.spawn];for(const item of s.items.slice().sort()){const m=F.defs(s).items[item].mechanics||{},fx={key:item+':risk',limit:1},src=itemSource(item,fx);if(m.replaceRiskJunk&&spawnDef.tags.includes('junk')&&allowance(src,fx)){perform(src,{op:'add',amount:-m.replacementLoss},target,id,'step4/risk');consumeQuota(src,fx);emit('limitSkipped',src,target,null,id,'step4/risk',{cause:'risk-replaced',skipReason:'replacement-not-generation'});replacement=true;break}}if(!replacement)spawn(source,e.spawn,id,'step4/risk')}
   return true;
  }
  if(e.op==='cycle'){
   if(!target||!target.alive||!d(target).mechanics.cycle_count)return false;
   const threshold=Math.max(2,d(target).mechanics.cycle_count-(s.items.some(id=>F.defs(s).items[id].mechanics&&F.defs(s).items[id].mechanics.cycleThresholdReduction)?1:0));
   target.x.counters.beat++;const id=emit('cycle',source,target,1,parent,phase);
   if(target.x.counters.beat>=threshold){target.x.counters.beat=0;perform(source,{op:'add',amount:e.amount},target,id,phase)}
   return true;
  }
  if(e.op==='reward'){if(e.defer){deferredRewards.push({source,e,target,parent});return true;}reward=safe(reward+e.amount);emit('reward',source,target,e.amount,parent,phase);return true}
  if(e.op==='spawn')return spawn(source,e.type,parent,phase);
  if(e.op==='token'){s[e.resource]=Math.min(9,s[e.resource]+e.amount);emit('reward',source,null,0,parent,'choice/commit',{cause:'token'});return true}
  if(e.op==='add'){if(!target||!target.alive)return false;if(e.defer){deferredAdds.push({source,e,target,parent});return true;}let amount=e.amount;
   if(e.countAmount){const found=select(e.countAmount.selector,source,appearance||cells);amount=Math.min(e.countAmount.cap,e.countAmount.distinct?new Set(found.map(c=>c.x.type)).size:found.length)}
   target.add=safe(target.add+amount);target.addParts.push({source:source.id,amount});emit('add',source,target,amount,parent,phase);return true}
  if(e.op==='grow'){if(!target||!target.alive)return false;const amount=Math.min(e.amount,30-target.x.permanent);if(!amount)return false;target.x.permanent+=amount;const id=emit('grow',source,target,amount,parent,phase,{actualIncrease:amount});dispatch({action:'grow',target:target.x.uid,beforeType:target.x.type,afterType:target.x.type,beforeTags:d(target).tags,afterTags:d(target).tags,cause:'growth',actualIncrease:amount},id);return true}
  if(e.op==='multiply'){
   if(!target||!target.alive)return false;const key=e.key+'/'+target.x.uid,k=source.id+'/'+key;
   if(multipliers.has(k)||(multipliers.get(key)||0)>=2)return skip(source,target,e,'multiplier-budget',parent,phase);
   target.ratio[0]*=BigInt(e.ratio[0]);target.ratio[1]*=BigInt(e.ratio[1]);target.multiplyParts.push({source:source.id,ratio:e.ratio});multipliers.set(k,1);multipliers.set(key,(multipliers.get(key)||0)+1);const id=emit('multiply',source,target,null,parent,phase);if(e.spawn)spawn(source,e.spawn,id,phase);return true;
  }
  if(e.op==='pressure'){
   if(!target||!target.alive||!d(target).mechanics.pressure)return false;const cap=d(target).mechanics.pressure.cap,amount=Math.min(e.amount,cap-target.x.counters.pressure);if(!amount)return false;target.x.counters.pressure+=amount;const id=emit('pressureIncrease',source,target,amount,parent,phase,{actualIncrease:amount});if(!e.noDispatch)dispatch({action:'pressureIncrease',target:target.x.uid,beforeType:target.x.type,afterType:target.x.type,beforeTags:d(target).tags,afterTags:d(target).tags,cause:'pressure'},id);return true;
  }
  if(e.op==='release'){
   if(!target||!target.alive||!d(target).mechanics.pressure||target.released)return false;const before=target.x.counters.pressure,spent=e.spend||before;
   if(before<spent||e.belowThreshold&&before>=d(target).mechanics.pressure.cap)return false;
   target.x.counters.pressure-=spent;target.released=true;const id=emit('release',source,target,spent,parent,phase,{actualIncrease:-spent});
   if(e.ratio)perform(source,{op:'multiply',ratio:e.ratio,key:e.key},target,id,phase);
   if(e.reward)perform(source,{op:'reward',amount:e.reward},target,id,phase);
   dispatch({action:'release',target:target.x.uid,beforeType:target.x.type,afterType:target.x.type,beforeTags:d(target).tags,afterTags:d(target).tags,cause:'pressure'},id);return true;
  }
  if(e.op==='reserve'){
   if(e.defer){if(!target||!target.alive)return false;const id=emit('reserve',source,target,null,parent,phase,{cause:'reservation-request'});reserveRequests.push({source,e,target,epoch:target.x.epoch,parent:id});return true;}
   if(!target||!target.alive||s.reservations.length>=2||s.reservations.some(r=>r.uid===target.x.uid||r.pos===target.pos))return false;
   const pos=target.pos,sourceId=source.cell?source.id:source.id;s.reservations.push({uid:target.x.uid,pos,epoch:target.x.epoch,source:sourceId,expiresSpin:s.spin+1});emit('reserve',source,target,null,parent,phase);return true;
  }
  if(e.op==='guarantee'){
   if(!e.guarantee)return false;s.offer.guarantees[e.guarantee]=true;emit('reward',source,target,0,parent,'choice/commit',{cause:'offer-guarantee'});return true;
  }
  if(e.op==='tagMajority'){let winner=e.tags[0],maximum=-1;for(const tagName of e.tags){const count=select({scope:'adjacent',tag:tagName},source).length;if(count>maximum){maximum=count;winner=tagName;}}return perform(source,{op:'tagAdded',tag:winner},target,parent,phase);}
  if(e.op==='tagChoice'){for(const tagName of e.tags){if(select({scope:'adjacent',tag:tagName},source).length)return perform(source,{op:'tagAdded',tag:tagName},target,parent,phase);}return false;}
  if(e.op==='tagBundle'){if(!target||!target.alive)return false;let success=false;for(const tagName of e.tags)success=perform(source,{op:'tagAdded',tag:tagName},target,parent,phase)||success;if(e.ratio)success=perform(source,{op:'multiply',ratio:e.ratio},target,parent,phase)||success;return success;}
  if(e.op==='tagAdded'){
   if(!target||!target.alive)return false;const tagName=e.tag||'temporary';if(tag(target,tagName))return false;target.tags=target.tags||[];const beforeTags=[...d(target).tags,...target.tags];target.tags.push(tagName);const id=emit('tagAdded',source,target,0,parent,phase,{beforeTags,afterTags:[...beforeTags,tagName]});dispatch({action:'tagAdded',target:target.x.uid,beforeType:target.x.type,afterType:target.x.type,beforeTags,afterTags:[...beforeTags,tagName],cause:'tagAdded'},id);gauge(id);return true;
  }
  if(e.op==='transform')return transform(source,target,e.type,parent,phase,'transform');
  if(e.op==='consume'||e.op==='destroy'){
   if(!target||!target.alive)return false;
   const beforeType=target.x.type,beforeTags=[...new Set([...d(target).tags,...target.tags||[]])],cause=e.op==='consume'?'consume':e.cause||'destroy';
   target.alive=false;s.pool=s.pool.filter(x=>x.uid!==target.x.uid);poolCleanup();
   const facts={beforeType,afterType:null,beforeTags,afterTags:[],cause};const id=emit(e.op,source,target,null,parent,phase,facts);
   dispatch(Object.assign({action:e.op,target:target.x.uid,actor:source.id,actorTags:source.cell?[...new Set([...d(source.cell).tags,...source.cell.tags||[]])]:[]},facts),id);
   if(e.op==='consume'){const death=emit('destroy',source,target,null,id,phase,facts);dispatch(Object.assign({action:'destroy',target:target.x.uid},facts),death)}
   if(e.reward)perform(source,{op:'reward',amount:e.reward+(e.rewardTargetBase?F.defs(s).symbols[beforeType].base:0)},target,id,phase);
   if(e.growSource&&source.cell&&source.cell.alive)perform(source,{op:'grow',amount:e.growSource},source.cell,id,phase);
   if(e.pressure)perform(source,{op:'pressure',amount:e.pressure},source.cell,id,phase);
   if(e.spawn)spawn(source,e.spawn,id,phase);
   gauge(id);return true;
  }
  throw Error('Unsupported primitive '+e.op);
 }
 function run(phase,view=cells){
  const sources=[];for(const c of cells)if(c&&c.alive&&c.x.epoch===c.startEpoch)for(const e of d(c).effects)if(e.phase===phase)sources.push([sourceOf(c,e),e]);
  for(const id of s.items.slice().sort())for(const e of F.defs(s).items[id].effects)if(e.phase===phase)sources.push([itemSource(id,e),e]);
  for(const [source,e]of sources){if(!sourceValid(source,e)||!allowance(source,e)||!predicate(e.predicate,source,view))continue;
   const selection=source.cell===null&&!e.selector?[null]:select(e.selector,source,view),targets=e.lockFirst?selection.slice(0,1):selection;let success=false;
   for(const old of targets){if(!sourceValid(source,e)||!allowance(source,e))break;const target=old?cells.find(c=>c&&c.x.uid===old.x.uid):null;if(perform(source,e,target,null,phases[phase]||'step3/age')){success=true;if(e.each&&source.cell===null)consumeQuota(source,e);if(!e.each)break}}
   if(success&&!(e.each&&source.cell===null))consumeQuota(source,e);
  }
 }
 function eventEffects(phase){if(s.profile!=='full-v1')return;for(const m of s.events.activeModifiers){if(m.uid!==null||m.stageId!==s.stageId||m.remaining<=0)continue;const def=F.defs(s).events[m.eventId];for(const [index,fx] of (def.spinEffects||[]).entries()){if(fx.phase!==phase)continue;const e=Object.assign({key:m.eventId+':'+index},fx);if(e.ratios)e.ratio=e.ratios[s.stageSpin-1];if(e.op==='multiply'&&!e.ratio)continue;const source={id:m.eventId,cell:null,key:e.key};for(const c of select(e.selector,source).slice(0,e.maxTargets||20))perform(source,e,c,null,phase==='preprocess'?'step2/tagAdded':'step8/end-summary')}}}
 gauge(null);
 eventEffects('preprocess');
 if(s.profile==='full-v1')run('preprocess');
 run('initial');
 // Draw-phase weight effects have already executed in sliceDraw; never replay
 // them as resolver actions (including when full content coexists with slice).
 if(s.profile==='full-v1')run('step2');
 for(const c of cells)if(c){const m=d(c).mechanics.age;if(m)age({id:c.x.uid,cell:c,key:'natural-age'},c,null)}
 run('step3');
 for(const m of s.events.activeModifiers.slice()){const c=cells.find(c=>c&&c.x.uid===m.uid);if(c&&age({id:c.x.uid,cell:c,key:'event-age'},c,null))m.remaining--}
 poolCleanup();run('age-extra');
 appearance=cells.map(c=>c&&Object.assign({},c,{x:F.clone(c.x)}));
 run('appearance',appearance);run('step4',appearance);if(s.profile==='full-v1'){run('copy',appearance);run('pressure-injection');run('adjacency-add');}run('structure');run('step5');run('end');run('step6');
 run('step7');
 for(const c of cells)if(c&&c.alive&&d(c).mechanics.pressure){const m=d(c).mechanics.pressure;if(c.x.counters.pressure>=m.cap&&!c.released){c.released=true;c.x.counters.pressure=0;const src={id:c.x.uid,cell:c,key:'pressure-release'};const id=emit('release',src,c,m.reward,null,'step7/pressure');perform(src,{op:'reward',amount:m.reward},c,id,'step7/pressure');if(s.profile==='full-v1')dispatch({action:'release',target:c.x.uid,beforeType:c.x.type,afterType:c.x.type,beforeTags:d(c).tags,afterTags:d(c).tags,cause:'pressure'},id)}}
 run('summary');eventEffects('summary');
 for(const request of deferredRewards)if(sourceValid(request.source,request.e)&&predicate(request.e.commitPredicate,request.source,cells))perform(request.source,Object.assign({},request.e,{defer:false}),request.target,request.parent,'step8/end-summary');
 for(const request of deferredAdds)if(request.target.alive)perform(request.source,Object.assign({},request.e,{defer:false}),request.target,request.parent,'step8/end-summary');
 for(const request of reserveRequests.sort((a,b)=>(a.e.priority||0)-(b.e.priority||0)||(a.source.cell?a.source.cell.pos:0)-(b.source.cell?b.source.cell.pos:0)||a.source.id.localeCompare(b.source.id))){if(request.target.alive&&request.target.x.epoch===request.epoch)perform(request.source,Object.assign({},request.e,{defer:false}),request.target,request.parent,'step8/end-summary');else skip(request.source,request.target,request.e,'reservation-target-invalid',request.parent,'step8/end-summary');}
 if(s.profile==='full-v1')for(const m of s.events.activeModifiers)if(m.uid===null&&m.stageId===s.stageId)m.remaining--;
 const board=cells.map(c=>c?{uid:c.x.uid,type:c.x.type,epoch:c.x.epoch,alive:c.alive}:null),ledger=[];
 const floor=(n,den)=>n>=0n?n/den:-((-n+den-1n)/den);
 for(const c of cells){if(!c)continue;const flat=safe(d(c).base+c.x.permanent+c.add),ordinaryZero=s.profile==='full-v1'&&d(c).mechanics.ordinaryZero,n=BigInt(ordinaryZero?0:flat)*c.ratio[0],den=c.ratio[1];const amount=c.alive?safe(Number(floor(n,den))):0,parts=new Map();
  const add=(id,value)=>parts.set(id,safe((parts.get(id)||0)+value));
  if(c.alive&&!ordinaryZero){add(c.x.uid,d(c).base+c.x.permanent);for(const p of c.addParts)add(p.source,p.amount);let num=BigInt(flat),div=1n,previous=BigInt(flat);for(const p of c.multiplyParts){num*=BigInt(p.ratio[0]);div*=BigInt(p.ratio[1]);const next=floor(num,div);add(p.source,Number(next-previous));previous=next}}
  const contributions=Array.from(parts,([source,amount])=>({source,amount}));if(contributions.reduce((a,b)=>a+b.amount,0)!==amount)throw Error('Contribution mismatch');ledger.push({uid:c.x.uid,type:c.x.type,amount,alive:c.alive,ratio:c.ratio.map(String),contributions})}
 const total=safe(reward+ledger.reduce((a,b)=>a+b.amount,0));poolCleanup();return{spin:s.spin,total,reward,board,ledger,log};
};
})(typeof window!=='undefined'?window:globalThis);
