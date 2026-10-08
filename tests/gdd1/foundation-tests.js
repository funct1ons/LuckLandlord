(function (root) {
  'use strict';
  root.runGdd1FoundationTests = function () {
    const F = root.GDD1, results = [];
    const assert = (ok, message='assertion failed') => { if (!ok) throw Error(message); };
    const eq = (a,b) => assert(JSON.stringify(a) === JSON.stringify(b), JSON.stringify(a)+' != '+JSON.stringify(b));
    const rejects = fn => { let rejected=false; try {fn();} catch (_) {rejected=true;} assert(rejected,'expected rejection'); };
    const test = (name,fn) => { try {fn();results.push({name:'gdd1/f1/'+name,ok:true});} catch (e) {results.push({name:'gdd1/f1/'+name,ok:false,error:e.message});} };
    const fresh = () => F.createFoundationState('F1-GOLDEN');
    function fixture(phase='READY', total=0) {
      const s = fresh(); s.phase=phase;
      if (phase === 'SYMBOL_CHOICE') {s.spin=s.stageSpin=1;s.spinsRemaining=5;s.pendingSettlement=total;}
      if (['ITEM_CHOICE','LOST','WON'].includes(phase)) {
        s.stageId=phase === 'WON' ? 10 : 1;
        s.stageSpin=F.NORMAL_SPINS[s.stageId-1];s.spinsRemaining=0;
        s.spin=F.NORMAL_SPINS.slice(0,s.stageId).reduce((a,b)=>a+b,0);
      }
      if (phase === 'EVENT_CHOICE') {
        s.stageId=3;s.spin=12;s.stageSpin=0;s.spinsRemaining=7;
        s.events={seenIds:['event_brine_inspection'],count:1,cooldownPayments:1,activeModifiers:[],
          choice:{id:'event_brine_inspection',options:['A','B'],targetUids:[],cost:0,stageId:3}};
      }
      s.basePayment=s.payment=F.PROFILES[s.profile].payments[s.stageId-1];
      s.itemState.stageId=s.stageId;s.itemState.spin=s.spin;
      if (s.spin > 0) s.last={spin:s.spin,total,reward:total,board:Array(20).fill(null),ledger:[],log:[]};
      if (phase === 'SYMBOL_CHOICE') Object.assign(s.offer,{windowId:1,kind:'symbol',choices:['mist_pouch','wick_bed','copper_burr']});
      if (phase === 'ITEM_CHOICE') Object.assign(s.offer,{windowId:7,kind:'item',choices:['item_dew_calendar','item_root_wrap','item_brine_lining']});
      F.validateState(s);return s;
    }
    function memory() {
      const data={}; const reads=[],writes=[];
      return {data,reads,writes,getItem(k){reads.push(k);return Object.hasOwn(data,k)?data[k]:null;},setItem(k,v){writes.push(k);data[k]=v;}};
    }
    test('isolated-namespace-and-no-game-dependency',()=>{assert(!root.Game);eq([F.SCHEMA,F.RULES,F.CONTENT,F.SAVE_KEY],[2,'GDD1','GDD1','fog-port.save.v1.gdd1']);assert(!F.newRun && !F.resolve && !F.command);});
    test('profile-counts-and-no-prototype-or-placeholder',()=>{eq([F.SYMBOL_IDS.length,F.ITEM_IDS.length,F.EVENT_IDS.length],[64,32,8]);eq([F.PROFILES['slice-abd-v1'].symbols.length,F.PROFILES['slice-abd-v1'].items.length,F.PROFILES['slice-abd-v1'].events.length],[24,10,3]);assert(F.ITEM_IDS.includes('item_low_balance_tab')&&!F.ITEM_IDS.includes('item_salvage_pump'));eq(new Set(F.SYMBOL_IDS).size,64);});
    test('payment-constants-exact-integer-ceil-not-new-economy',()=>{eq(F.SLICE_PAYMENTS,F.NORMAL_PAYMENTS.map(x=>Math.floor((x*65+99)/100)));eq(F.NORMAL_SPINS.reduce((a,b)=>a+b,0),70);eq(F.NORMAL_PAYMENTS.reduce((a,b)=>a+b,0),7125);});
    for (const vector of root.GDD1_TEST_VECTORS.vectors) for (const name of F.STREAMS) {
      test('golden/'+vector.profile+'/'+JSON.stringify(vector.seed)+'/'+name,()=>{
        const rng=F.createRng(vector.seed,vector.profile,vector.difficulty), expected=vector.streams[name];
        eq(rng[name].state,expected.initial);
        eq(expected.values.map(()=>F.nextUint32(rng,name)),expected.values);
        eq(rng[name],{state:expected.values.at(-1),consumed:8});
      });
    }
    test('cross-stream-isolation-interleaving',()=>{const a=fresh(),b=fresh();for(let i=0;i<13;i++){F.random(a.rng,'draw');F.random(a.rng,'symbolOffer');F.random(a.rng,'itemOffer');F.random(a.rng,'event');}eq(a.rng.effect,b.rng.effect);eq(F.nextUint32(a.rng,'effect'),F.nextUint32(b.rng,'effect'));});
    test('all-stream-continuations-survive-roundtrip',()=>{const a=fresh();F.STREAMS.forEach((name,i)=>{for(let n=0;n<=i;n++)F.random(a.rng,name);});const b=F.decode(F.encode(a));for(const name of F.STREAMS) for(let i=0;i<32;i++)eq(F.nextUint32(a.rng,name),F.nextUint32(b.rng,name));eq(a.rng,b.rng);});
    test('shuffle-nonmutation-and-exact-consumption',()=>{const a=fresh(),values=[1,2,3,4];const shuffled=F.shuffle(values,a.rng,'draw');eq(values,[1,2,3,4]);eq(shuffled.slice().sort(),values);eq(a.rng.draw.consumed,3);F.shuffle([],a.rng,'draw');eq(a.rng.draw.consumed,3);});
    for(const invalid of ['unknown','DRAW',null]) test('unknown-stream/'+invalid,()=>{const s=fresh(),before=JSON.stringify(s);rejects(()=>F.random(s.rng,invalid));eq(JSON.stringify(s),before);});
    for(const phase of F.STABLE_PHASES) test('stable-roundtrip/'+phase,()=>{const s=fixture(phase);eq(F.decode(F.encode(s)),s);});
    for(const total of [-19,0,42]) test('pending-original-no-recompute/'+total,()=>{const s=fixture('SYMBOL_CHOICE',total);s.offer.choiceRefreshesUsed=3;s.offer.guarantees.itemProductPending=true;F.random(s.rng,'symbolOffer');const before=JSON.stringify(s);eq(JSON.stringify(F.decode(F.encode(s))),before);eq(s.cash,0);});
    const mutations = {
      schema:s=>s.schema=1, rules:s=>s.rules='0.3', content:s=>s.content='M3-1', key:s=>s.saveKey='fog-port.save.v1',
      future:s=>s.schema=3, missingRng:s=>delete s.rng.event, extraRng:s=>s.rng.cosmetic={state:1,consumed:0},
      rngZero:s=>s.rng.draw.state=0, rngFraction:s=>s.rng.effect.state=1.5, missingConsumed:s=>delete s.rng.itemOffer.consumed,
      negativeConsumed:s=>s.rng.event.consumed=-1, emptyWrongIdentity:s=>s.rng.draw.state=1, extra:s=>s.version=2,
      missingEvents:s=>delete s.events, missingOffer:s=>delete s.offer, missingQuotas:s=>delete s.itemState.quotas,
      missingGauge:s=>delete s.fractionGaugeReserved, gaugeReserved:s=>s.fractionGaugeReserved=true,
      cash:s=>s.cash=-1, resourceOverflow:s=>s.removeTokens=10, fractionalStage:s=>s.stageId=1.5,
      transientPhase:s=>s.phase='STAGE_SETUP', illegalReady:s=>s.spinsRemaining=0, fakeSpin:s=>s.spin=1,
      unknownProfile:s=>s.profile='unknown', badDifficulty:s=>s.difficulty='Hard', unknownItems:s=>s.items=['item_salvage_pump'],
      legacyInstance:s=>{s.nextUid=2;s.pool=[{uid:'u1',type:'slag',permanent:0,epoch:0,counters:{}}];},
      nonexistentCounter:s=>{s.nextUid=2;s.pool=[{uid:'u1',type:'warm_pod',permanent:0,epoch:0,counters:{pressure:1}}];},
      missingMechanismCounter:s=>{s.nextUid=2;s.pool=[{uid:'u1',type:'mist_pouch',permanent:0,epoch:0,counters:{}}];},
      maturityUncommitted:s=>{s.nextUid=2;s.pool=[{uid:'u1',type:'mist_pouch',permanent:0,epoch:0,counters:{age:3}}];},
      futureUid:s=>{s.pool=[{uid:'u1',type:'wick_bed',permanent:0,epoch:0,counters:{}}];},
      permanentCap:s=>{s.nextUid=2;s.pool=[{uid:'u1',type:'wick_bed',permanent:31,epoch:0,counters:{}}];},
      unknownModifier:s=>s.events.activeModifiers=[{eventId:'unknown',uid:null,stageId:1,remaining:1}],
      unpairedClaim:s=>{s.nextUid=2;s.stageState.advanceClaims=['u1'];},
      unexplainedPayment:s=>s.payment++,
      eventCount:s=>s.events.count=1, eventDuplicate:s=>{s.events.seenIds=['event_fog_shift','event_fog_shift'];s.events.count=2;}
    };
    for(const [name,mutate] of Object.entries(mutations)) test('schema-reject/'+name,()=>{const s=fresh();mutate(s);const before=JSON.stringify(s);rejects(()=>F.decode(before));eq(JSON.stringify(s),before);});
    for(const [name,mutate] of Object.entries({missingPending:s=>delete s.pendingSettlement,wrongPending:s=>s.pendingSettlement=1,
      duplicateOffer:s=>s.offer.choices=['mist_pouch','mist_pouch'],fourthRefresh:s=>s.offer.choiceRefreshesUsed=4,
      futureLog:s=>s.last.log=[{id:0,parent:1,depth:1,phase:'step5/structural-event',action:'consume',source:null,target:null,amount:6}],
      badSum:s=>s.last.total++,unknownLogAction:s=>s.last.log=[{id:0,parent:null,depth:0,phase:'step1/draw',action:'invent',source:null,target:null,amount:null}]})) {
      test('pending-reject/'+name,()=>{const s=fixture('SYMBOL_CHOICE');mutate(s);rejects(()=>F.encode(s));});
    }
    test('three-layer-causal-log-and-nonempty-ledger-preserved',()=>{const s=F.createFoundationState('F1-GOLDEN','full-v1');s.phase='SYMBOL_CHOICE';s.spin=s.stageSpin=1;s.spinsRemaining=5;s.pendingSettlement=12;s.itemState.spin=1;s.nextUid=5;s.pool=[{uid:'u1',type:'dew_lantern',permanent:0,epoch:1,counters:{age:0}},{uid:'u2',type:'root_ledger',permanent:1,epoch:0,counters:{}},{uid:'u3',type:'echo_plate',permanent:0,epoch:0,counters:{}},{uid:'u4',type:'nursery_gauge',permanent:0,epoch:0,counters:{}}];Object.assign(s.offer,{windowId:1,kind:'symbol',choices:['mist_pouch','wick_bed','copper_burr']});const board=Array(20).fill(null),positions=[0,1,2,19];s.pool.forEach((x,i)=>{board[positions[i]]={uid:x.uid,type:x.type,epoch:x.epoch,alive:true};});s.last={spin:1,total:12,reward:0,board,ledger:s.pool.map((x,i)=>({uid:x.uid,type:x.type,amount:[3,2,5,2][i],alive:true,ratio:['1','1']})),log:[{id:0,parent:null,depth:0,phase:'step3/age',action:'age',source:'u1',target:'u1',amount:1},{id:1,parent:0,depth:1,phase:'step3/age',action:'transform',source:'u1',target:'u1',amount:null},{id:2,parent:1,depth:2,phase:'step6/lifecycle',action:'grow',source:'u2',target:'u2',amount:1},{id:3,parent:2,depth:3,phase:'step6/lifecycle',action:'add',source:'u3',target:'u3',amount:4}]};eq(F.decode(F.encode(s)),s);s.last.log[3].parent=1;rejects(()=>F.encode(s));s.last.log[3].parent=2;s.last.log[3].target='u5';rejects(()=>F.encode(s));});
    test('pool-200-and-zero-pool-valid-but-201-rejects',()=>{const s=fresh();for(let i=1;i<=200;i++)s.pool.push({uid:'u'+i,type:'wick_bed',permanent:0,epoch:0,counters:{}});s.nextUid=201;F.validateState(s);s.pool.push({uid:'u201',type:'wick_bed',permanent:0,epoch:0,counters:{}});s.nextUid++;rejects(()=>F.encode(s));F.validateState(fresh());});
    test('duplicate-uid-rejects',()=>{const s=fresh();s.nextUid=2;s.pool=Array.from({length:2},()=>({uid:'u1',type:'wick_bed',permanent:0,epoch:0,counters:{}}));rejects(()=>F.encode(s));});
    test('reservation-epoch-expiry-source-may-have-left',()=>{const s=fixture('SYMBOL_CHOICE');s.nextUid=3;s.pool=[{uid:'u1',type:'dew_lantern',permanent:0,epoch:1,counters:{age:0}}];s.reservations=[{uid:'u1',pos:19,epoch:1,source:'u2',expiresSpin:2}];eq(F.decode(F.encode(s)),s);s.reservations[0].epoch=0;rejects(()=>F.encode(s));s.reservations[0].epoch=1;s.reservations[0].expiresSpin=3;rejects(()=>F.encode(s));});
    test('persistent-fog-and-item-window-roundtrip',()=>{const s=fixture('EVENT_CHOICE');s.stageId=5;s.spin=26;s.spinsRemaining=7;s.basePayment=s.payment=F.PROFILES[s.profile].payments[4];s.last.spin=26;s.itemState.stageId=5;s.itemState.spin=26;s.nextUid=3;s.pool=[{uid:'u1',type:'mist_pouch',permanent:0,epoch:0,counters:{age:1}},{uid:'u2',type:'saline_ampoule',permanent:0,epoch:0,counters:{}}];s.events.seenIds=['event_fog_shift','event_brine_inspection'];s.events.count=2;s.events.choice={id:'event_brine_inspection',options:['A','B'],targetUids:['u2'],cost:0,stageId:5};s.events.activeModifiers=[{eventId:'event_fog_shift',uid:'u1',stageId:3,remaining:2}];s.items=['item_frost_glass'];s.itemState.quotas={'item_frost_glass':{spin:0,stage:0,run:1}};s.itemState.used={'item_frost_glass':{spin:false,stage:false}};eq(F.decode(F.encode(s)),s);s.pool[0].type='wick_bed';s.pool[0].counters={};rejects(()=>F.encode(s));});
    test('event-unconfirmed-modifier-and-wrong-cost-reject',()=>{const s=fixture('EVENT_CHOICE');s.events.choice.cost=4;rejects(()=>F.encode(s));s.events={seenIds:['event_fog_shift'],count:1,cooldownPayments:1,activeModifiers:[],choice:{id:'event_fog_shift',options:['A','B'],targetUids:['u1'],cost:4,stageId:3}};s.nextUid=2;s.pool=[{uid:'u1',type:'mist_pouch',permanent:0,epoch:0,counters:{age:1}}];F.validateState(s);s.events.activeModifiers=[{eventId:'event_fog_shift',uid:'u1',stageId:3,remaining:2}];rejects(()=>F.encode(s));});
    test('transaction-success-on-clone-single-revision',()=>{const s=fresh(),before=JSON.stringify(s),r=F.transact(s,0,n=>{n.cash=12;F.random(n.rng,'effect');});assert(r.ok,r.error);eq(s.revision,0);eq(r.state.revision,1);eq(JSON.stringify(s),before);eq(r.state.rng.effect.consumed,1);});
    test('transaction-rejects-async-and-seals-callback-alias',()=>{const s=fresh(),before=JSON.stringify(s);const asyncResult=F.transact(s,0,async n=>{n.cash=3;});assert(!asyncResult.ok);eq(JSON.stringify(s),before);let leaked;const result=F.transact(s,0,n=>{n.cash=4;leaked=n;});assert(result.ok,result.error);leaked.cash=-20;eq(result.state.cash,4);F.validateState(result.state);});
    for (const mode of ['stale','throw','invalid','identity']) test('transaction-rollback/'+mode,()=>{const s=fresh(),before=JSON.stringify(s);const r=F.transact(s,mode === 'stale'?1:0,n=>{F.random(n.rng,'event');n.nextUid++;n.cash=20;if(mode==='throw')throw Error('fault');if(mode==='invalid')n.cash=-1;if(mode==='identity'){n.seed='replacement';n.rng=F.createRng(n.seed,n.profile,n.difficulty);}});assert(!r.ok);assert(r.state===s);eq(JSON.stringify(s),before);});
    test('save-single-new-key-write-and-previous-valid-state',()=>{const storage=memory(),a=fresh(),b=fresh();b.cash=1;assert(F.store(storage,a).ok);assert(F.store(storage,b).ok);eq(storage.writes,[F.SAVE_KEY,F.SAVE_KEY]);eq(F.load(storage).state,b);eq(F.recoverPrevious(storage.data[F.SAVE_KEY]),a);assert(storage.reads.every(x=>x===F.SAVE_KEY));});
    test('legacy-raw-and-envelope-readonly-export',()=>{const storage=memory();storage.data[F.LEGACY_KEYS[0]]=' {"version":1,"rules":"0.3","contentVersion":"M3-1","phase":"SYMBOL_CHOICE","cash":9,"pendingSettlement":-3} ';storage.data[F.LEGACY_KEYS[1]]='{broken';const before=JSON.stringify(storage.data),r=F.readLegacy(storage);eq(r[0].text,storage.data[F.LEGACY_KEYS[0]]);eq(r[0].summary.pendingSettlement,-3);eq(r[1].text,'{broken');eq(r[1].summary,null);eq(storage.writes,[]);eq(JSON.stringify(storage.data),before);rejects(()=>F.decode(r[0].text));assert(!F.load(storage).ok);});
    test('future-current-not-silently-recovered-or-overwritten',()=>{const storage=memory(),a=fresh();assert(F.store(storage,a).ok);assert(F.store(storage,a).ok);const record=JSON.parse(storage.data[F.SAVE_KEY]);record.current.schema=3;storage.data[F.SAVE_KEY]=JSON.stringify(record);const before=storage.data[F.SAVE_KEY];assert(!F.load(storage).ok);eq(F.recoverPrevious(before),a);assert(!F.store(storage,a).ok);eq(storage.data[F.SAVE_KEY],before);});
    test('blocked-storage-or-write-failure-preserves-state-and-record',()=>{const storage=memory(),a=fresh();assert(F.store(storage,a).ok);const before=storage.data[F.SAVE_KEY];storage.setItem=()=>{throw Error('quota');};a.cash=7;assert(!F.store(storage,a).ok);eq(storage.data[F.SAVE_KEY],before);eq(a.cash,7);assert(!F.load({getItem(){throw Error('blocked');}}).ok);});
    test('import-preview-throw-no-storage-or-memory-publication',()=>{const storage=memory(),s=fresh();assert(F.store(storage,s).ok);const before=JSON.stringify(storage.data),count=storage.writes.length;const r=F.commitImport(storage,F.encode(s),()=>{throw Error('render fault');});assert(!r.ok);eq(JSON.stringify(storage.data),before);eq(storage.writes.length,count);});
    test('import-preview-disposable-clone-and-one-write',()=>{const storage=memory(),s=fixture('SYMBOL_CHOICE',-5);const r=F.commitImport(storage,F.encode(s),preview=>{preview.cash=999;});assert(r.ok,r.error);eq(r.state,s);eq(F.load(storage).state,s);eq(storage.writes,[F.SAVE_KEY]);});
    test('import-validation-before-preview-and-storage',()=>{const storage=memory();let called=false;const r=F.commitImport(storage,'{"schema":1}',()=>{called=true;});assert(!r.ok);eq(called,false);eq(storage.reads,[]);eq(storage.writes,[]);});
    test('import-write-fault-does-not-publish-candidate',()=>{const storage=memory();storage.setItem=()=>{throw Error('denied');};const r=F.commitImport(storage,F.encode(fresh()),()=>{});assert(!r.ok && !r.state);});
    test('explicit-profile-mismatch-never-converted',()=>{const storage=memory(),s=F.createFoundationState('F1-GOLDEN','full-v1');assert(F.store(storage,s).ok);const before=storage.data[F.SAVE_KEY];assert(!F.load(storage,'slice-abd-v1').ok);rejects(()=>F.decode(F.encode(s),'slice-abd-v1'));const r=F.commitImport(storage,F.encode(s),()=>{throw Error('preview should not run');},'slice-abd-v1');assert(!r.ok && r.error.includes('profile'));eq(storage.data[F.SAVE_KEY],before);eq(F.load(storage,'full-v1').state,s);});
    test('prototype-property-is-not-profile',()=>{rejects(()=>F.createRng('s','toString','Normal'));rejects(()=>F.createFoundationState('s','__proto__'));});
    test('UTF8-import-byte-limit-and-malformed-json',()=>{rejects(()=>F.decode('"'+'雾'.repeat(400000)+'"'));rejects(()=>F.decode('{'));rejects(()=>F.decode(' '.repeat(1048577)));});
    return results;
  };
})(typeof window !== 'undefined' ? window : globalThis);
