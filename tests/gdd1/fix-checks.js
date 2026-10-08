(function(root){
'use strict';
root.runGdd1FixTests=async function(){
 const F=root.GDD1,cases=[];
 const assert=(x,m='assertion failed')=>{if(!x)throw Error(m)};
 const eq=(a,b)=>assert(JSON.stringify(a)===JSON.stringify(b),'value drift');
 const rejects=f=>{let caught=false;try{f()}catch(_){caught=true}assert(caught,'expected rejection')};
 const test=async(name,fn)=>{try{await fn();cases.push({name:'gdd1/fix/'+name,ok:true})}catch(e){cases.push({name:'gdd1/fix/'+name,ok:false,error:e.message})}};
 function state(sp=0,stage=3,phase='READY'){
  const s=F.createFoundationState('F1-FIX','full-v1');
  Object.assign(s,{stageId:stage,stageSpin:sp,spin:F.NORMAL_SPINS.slice(0,stage-1).reduce((a,b)=>a+b,0)+sp,spinsRemaining:F.NORMAL_SPINS[stage-1]-sp,phase});
  s.basePayment=s.payment=F.NORMAL_PAYMENTS[stage-1];s.itemState.stageId=stage;s.itemState.spin=s.spin;
  s.last={spin:s.spin,total:0,reward:0,board:Array(20).fill(null),ledger:[],log:[]};
  if(phase==='SYMBOL_CHOICE'){s.pendingSettlement=0;Object.assign(s.offer,{windowId:1,kind:'symbol',choices:['mist_pouch']})}
  return s;
 }
 function memory(){const data=new Map(F.LEGACY_KEYS.map((k,i)=>[k,'legacy-'+i])),reads=[],writes=[];return {data,reads,writes,getItem(k){reads.push(k);return data.has(k)?data.get(k):null},setItem(k,v){writes.push([k,v]);data.set(k,v)}}}
 function target(s,type,age=0,epoch=0){s.nextUid=2;s.pool=[{uid:'u1',type,permanent:7,epoch,counters:age===null?{}:{age}}];return s}
 function modifier(s,eventId,remaining,stageId=s.stageId){s.events.seenIds=[eventId];s.events.count=1;s.events.activeModifiers=[{eventId,uid:eventId==='event_fog_shift'?'u1':null,stageId,remaining}];return s}
 function roundtrip(s){const before=JSON.stringify(s),m=memory();eq(F.decode(F.encode(s)),s);assert(F.store(m,s).ok);eq(F.load(m).state,s);eq(JSON.stringify(s),before);eq(F.LEGACY_KEYS.map(k=>m.data.get(k)),['legacy-0','legacy-1']);assert(m.writes.length===1&&m.writes[0][0]===F.SAVE_KEY)}
 function rejectEverywhere(s){const raw=JSON.stringify(s),m=memory();rejects(()=>F.validateState(s));rejects(()=>F.decode(raw));assert(!F.store(m,s).ok);assert(m.reads.length===0&&m.writes.length===0);m.data.set(F.SAVE_KEY,JSON.stringify({storageVersion:1,current:s,previous:null}));assert(!F.load(m).ok);m.reads.length=0;let previewed=false;const r=F.commitImport(m,raw,()=>{previewed=true});assert(!r.ok&&!r.state&&!previewed&&m.reads.length===0&&m.writes.length===0);eq(JSON.stringify(s),raw)}
 await test('preview/synchronous-clone-single-write',()=>{const s=state(),m=memory();assert(F.store(m,s).ok);const original=m.data.get(F.SAVE_KEY);s.cash=99;let alias;const r=F.commitImport(m,F.encode(s),n=>{alias=n;n.cash=888});assert(r.ok&&r.state.cash===99);alias.cash=-1;eq(r.state,s);assert(m.writes.length===2);const saved=JSON.parse(m.data.get(F.SAVE_KEY));eq(saved.previous,JSON.parse(original).current);eq(saved.current,s)});
 const previews=[['async-resolve',async()=>{}],['promise-resolve',()=>Promise.resolve()],['promise-reject',()=>{const p=Promise.reject(Error('late'));p.catch(()=>{});return p}],['custom-thenable',()=>({then(){throw Error('must not call then')}})],['function-thenable',()=>{const f=()=>{};f.then=()=>{throw Error('must not call then')};return f}],['then-getter',()=>Object.defineProperty({},'then',{get(){throw Error('must not inspect then')}})],['false',()=>false],['null',()=>null],['true',()=>true],['throw',()=>{throw Error('preview fault')}]];
 for(const [name,preview]of previews)await test('preview/reject-'+name,async()=>{const old=state(),next=F.clone(old);next.cash=99;const m=memory();assert(F.store(m,old).ok);m.reads.length=0;m.writes.length=0;const bytes=Array.from(m.data),oldBytes=JSON.stringify(old),rng=JSON.stringify(next.rng);const r=F.commitImport(m,F.encode(next),preview);assert(!r.ok&&!Object.hasOwn(r,'state'));await Promise.resolve();eq(Array.from(m.data),bytes);eq(m.reads,[]);eq(m.writes,[]);eq(JSON.stringify(old),oldBytes);eq(JSON.stringify(next.rng),rng)});
 await test('preview/invalid-input-never-calls-callback',()=>{const m=memory();let calls=0;assert(!F.commitImport(m,'{}',()=>calls++).ok);assert(calls===0&&m.reads.length===0&&m.writes.length===0)});
 for(const age of[0,1,2,3])await test('ash/age-'+age,()=>{const s=target(state(),'ash_felt',age);age===3?rejectEverywhere(s):roundtrip(s)});
 for(const type of['mist_pouch','dew_lantern'])for(const remaining of[1,2])await test('fog/legal-'+type+'-remaining-'+remaining,()=>roundtrip(modifier(target(state(4,5),type,0),'event_fog_shift',remaining,3)));
 for(const [type,age]of[['cloudy_negative',1],['brine_strip',1],['ash_felt',1],['wick_bed',null],['amber_frond',null]])await test('fog/illegal-'+type,()=>rejectEverywhere(modifier(target(state(),type,age),'event_fog_shift',2)));
 for(const remaining of[0,3])await test('fog/invalid-remaining-'+remaining,()=>rejectEverywhere(modifier(target(state(),'mist_pouch',0),'event_fog_shift',remaining)));
 await test('fog/natural-maturity-preserves-remaining-and-uid',()=>{const a=modifier(target(state(1),'mist_pouch',2),'event_fog_shift',2);const b=F.clone(a);b.pool[0].type='dew_lantern';b.pool[0].counters.age=0;b.pool[0].epoch++;roundtrip(a);roundtrip(b);assert(b.events.activeModifiers[0].remaining===2&&b.pool[0].uid===a.pool[0].uid&&b.pool[0].permanent===7)});
 await test('fog/legal-success-consumes-exactly-one',()=>{const a=modifier(target(state(1),'mist_pouch',1),'event_fog_shift',2);const b=F.clone(a);b.pool[0].counters.age=2;b.events.activeModifiers[0].remaining=1;roundtrip(a);roundtrip(b);const exhausted=F.clone(b);exhausted.events.activeModifiers[0].remaining=0;rejectEverywhere(exhausted);exhausted.events.activeModifiers=[];roundtrip(exhausted)});
 await test('fog/age-less-conversion-requires-invalidation',()=>{const a=modifier(target(state(2),'dew_lantern',1),'event_fog_shift',1);roundtrip(a);const b=F.clone(a);b.pool[0].type='amber_frond';b.pool[0].epoch++;b.pool[0].counters={};rejectEverywhere(b);b.events.activeModifiers=[];roundtrip(b)});
 await test('fog/deletion-requires-invalidation-not-rebinding',()=>{const s=modifier(target(state(),'mist_pouch',1),'event_fog_shift',2);s.pool=[];rejectEverywhere(s);s.pool=[{uid:'u2',type:'mist_pouch',permanent:0,epoch:0,counters:{age:0}}];s.nextUid=3;rejectEverywhere(s);s.events.activeModifiers=[];roundtrip(s)});
 await test('fog/cross-stage-full-remaining-not-stage-window',()=>roundtrip(modifier(target(state(4,9),'dew_lantern',1,5),'event_fog_shift',2,3)));
 for(const [id,window]of[['event_silent_bell',3],['event_misprint_window',3],['event_empty_manifest',1]]){
  for(const sp of[0,1,2,3,4])for(const phase of(sp===0?['READY']:['READY','SYMBOL_CHOICE'])){
   if(sp<window)await test(id+'/'+phase+'/spin-'+sp+'/exact-remaining',()=>roundtrip(modifier(state(sp,3,phase),id,window-sp)));
   await test(id+'/'+phase+'/spin-'+sp+'/reject-'+(sp<window?'wrong-remaining':'expired'),()=>rejectEverywhere(modifier(state(sp,3,phase),id,sp<window?(window-sp===1?2:1):1)));
   await test(id+'/'+phase+'/spin-'+sp+'/no-active-legal',()=>roundtrip(state(sp,3,phase)));
  }
  await test(id+'/previous-stage-rejected',()=>rejectEverywhere(modifier(state(0,4),id,window,3)));
 }
 await test('fixed-window/last-spin-commit-must-clear-before-choice',()=>{const s=modifier(state(2,3,'SYMBOL_CHOICE'),'event_silent_bell',1);roundtrip(s);const before=JSON.stringify(s);const r=F.transact(s,s.revision,n=>{n.spin++;n.stageSpin++;n.spinsRemaining--;n.itemState.spin=n.spin;n.last.spin=n.spin});assert(!r.ok&&r.state===s);eq(JSON.stringify(s),before);const ok=F.transact(s,s.revision,n=>{n.spin++;n.stageSpin++;n.spinsRemaining--;n.itemState.spin=n.spin;n.last.spin=n.spin;n.events.activeModifiers=[]});assert(ok.ok,ok.error);roundtrip(ok.state)});
 return {total:cases.length,passed:cases.filter(x=>x.ok).length,cases,scope:'F1 schema/save regression; state transitions are supplied fixtures, not F2 gameplay execution'};
};
})(typeof window!=='undefined'?window:globalThis);
