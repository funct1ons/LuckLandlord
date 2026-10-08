(function (G) {
  'use strict';
  G.mechanicsContractTests = function () {
    const results = [];
    const eq = (a, b) => {
      if (JSON.stringify(a) !== JSON.stringify(b)) throw Error(JSON.stringify(a) + ' != ' + JSON.stringify(b));
    };
    const test = (name, fn) => {
      try { fn(); results.push({name: 'mechanics-contract/' + name, ok: true}); }
      catch (e) { results.push({name: 'mechanics-contract/' + name, ok: false, error: e.message}); }
    };
    function fixture(entries) {
      const s = G.newRun('MECHANICS-CONTRACT');
      s.symbols = [];
      const board = Array(20).fill(null);
      entries.forEach(([type, pos]) => {
        const obj = G.instance(s, type);
        s.symbols.push(obj);
        board[pos] = obj.uid;
      });
      return {s, board, run: () => G.resolve(s, board)};
    }
    function temporaryDefinitions(defs, fn) {
      const old = {};
      try { for (const [id, def] of Object.entries(defs)) { old[id] = G.symbols[id]; G.symbols[id] = def; } return fn(); }
      finally { for (const id of Object.keys(defs)) { if (old[id] === undefined) delete G.symbols[id]; else G.symbols[id] = old[id]; } }
    }
    const formalDef = (id, effects, base = 0, tags = []) => ({id, name:id, icon:id, description:id,
      tags, rarity:'test', baseValue:base, formal:true, effects, triggers:[...new Set(effects.map(x=>x.trigger))]});
    const effect = (id, action, extra) => Object.assign({effectId:id, trigger:'ON_APPEAR', action,
      scope:'self', target:{area:'board',tagsAny:['product'],count:'all'}, priority:0, policy:'matrix-v1'}, extra);
    test('A/three-registers-exact-limit-and-provenance', () => {
      const f = fixture([['split_register', 0], ['split_register', 1], ['split_register', 2], ['tide_prism', 6]]);
      const rng = f.s.rngState, next = f.s.nextId, r = f.run();
      eq(r.ledger.map(x => x.amount), [2, 2, 2, 9]);
      eq(r.ledger[3].ratio, ['9', '4']);
      eq([r.reward, r.total, f.s.rngState, f.s.nextId], [0, 15, rng, next]);
      eq(r.log.filter(x => x.type === 'limitSkipped').map(x => [x.source, x.target, x.reason]),
        [[f.board[2], f.board[6], 'definition-target-sources']]);
      eq(r.log.filter(x => x.type === 'tagAdded').map(x => [x.source, x.tags]),
        [[f.board[0], ['resonance']]]);
    });
    test('A/pool-order-and-next-resolve-do-not-change-winners', () => {
      const f = fixture([['split_register', 0], ['split_register', 1], ['split_register', 2], ['tide_prism', 6]]);
      const first = f.run();
      f.s.symbols.reverse();
      const second = f.run();
      eq(second, first);
      eq(G.resolve(f.s, [f.board[6]]).total, 4);
    });
    test('A/different-definitions-and-targets-have-independent-caps', () => temporaryDefinitions({
      ma_src_a: formalDef('ma_src_a',[effect('m','multiply',{ratio:[3,2]})]),
      ma_src_b: formalDef('ma_src_b',[effect('m','multiply',{ratio:[2,1]})]),
      ma_target: formalDef('ma_target',[],4,['product']),
      ma_target2: formalDef('ma_target2',[],4,['product'])
    }, () => {
      const f=fixture([['ma_src_a',0],['ma_src_a',1],['ma_src_a',2],['ma_src_b',5],['ma_src_b',6],['ma_src_b',7],['ma_target',10],['ma_target2',11]]),r=f.run();
      eq(r.ledger.filter(x=>x.type==='ma_target'||x.type==='ma_target2').map(x=>x.amount),[36,36]);
      eq(r.log.filter(x=>x.type==='limitSkipped').map(x=>x.reason),['definition-target-sources','definition-target-sources','definition-target-sources','definition-target-sources']);
    }));
    test('A/same-source-effectKey-repeat-and-negative-floor', () => temporaryDefinitions({
      ma_repeat: formalDef('ma_repeat',[effect('one','multiply',{ratio:[3,2]}),effect('two','multiply',{ratio:[3,2]})]),
      ma_negative: formalDef('ma_negative',[], -1,['product'])
    }, () => {
      const f=fixture([['ma_repeat',0],['ma_negative',1]]),r=f.run();
      eq(r.ledger[1].amount,-3);eq(r.ledger[1].ratio,['9','4']);eq(r.log.filter(x=>x.type==='limitSkipped').length,0);
    }));
    test('A/third-source-tag-is-retained-when-ratio-is-skipped', () => temporaryDefinitions({
      ma_tag_src: formalDef('ma_tag_src',[Object.assign(effect('tag','tag',{target:{area:'adj',tagsAny:['product'],count:'1'},chooseTags:['resonance','crystal'],choiceMode:'mostNeighbors',ratio:[3,2]}),{policy:'matrix-v1'})]),
      ma_tag_target: formalDef('ma_tag_target',[],4,['product'])
    }, () => {
      const f=fixture([['ma_tag_src',0],['ma_tag_src',2],['ma_tag_src',11],['ma_tag_target',6],['echo',1],['crystal',12],['crystal',16]]),r=f.run();
      eq(r.log.filter(x=>x.type==='tagAdded').map(x=>[x.source,x.tags]),[[f.board[0],['resonance']],[f.board[11],['crystal']]]);
      eq(r.log.filter(x=>x.type==='limitSkipped').map(x=>[x.source,x.reason]),[[f.board[11],'definition-target-sources']]);
      eq(r.ledger.find(x=>x.uid===f.board[6]).ratio,['9','4']);
    }));
    test('B/ash-only-consumed-owner-spawns', () => {
      const f = fixture([['sorting_tong',0],['ash_felt',1],['ash_felt',2],['ash_felt',3]]);
      const r = f.run();
      eq(r.ledger.map(x => x.amount), [1,0,1,1]); eq([r.reward,r.total], [6,9]);
      eq(f.s.symbols.filter(x => x.type === 'copper_burr').length,1);
      eq(r.log.filter(x => x.type === 'spawn').map(x => x.source), [f.board[1]]);
    });
    test('B/three-demand-soft-budget-preserves-values', () => {
      const f = fixture([['demand_coupler',0],['demand_coupler',1],['demand_coupler',2]]);
      f.s.spinsRemaining = 2; const before = f.s.nextId, r = f.run();
      eq(r.ledger.map(x => x.amount),[4,4,4]); eq(r.total,12);
      eq(f.s.nextId,before+2); eq(f.s.symbols.filter(x => x.type === 'spent_gasket').length,2);
      eq(r.log.filter(x => x.type === 'limitSkipped').map(x => x.reason),['definition-spawns']);
    });
    test('B/full-pool-optional-spawn-does-not-use-id', () => {
      const f = fixture([['demand_coupler',0]]); f.s.spinsRemaining=2;
      while(f.s.symbols.length<200)f.s.symbols.push(G.instance(f.s,'slag'));
      const next=f.s.nextId,r=f.run();eq(f.s.nextId,next);eq(r.total,4);
      eq(r.log.filter(x=>x.type==='limitSkipped').map(x=>x.reason),['pool-full']);
    });
    test('B/pool-199-first-success-second-pool-full', () => temporaryDefinitions({
      ma_spawn_a: formalDef('ma_spawn_a',[Object.assign(effect('a','spawn',{target:'self',to:'spent_gasket'}),{policy:'matrix-v1'})]),
      ma_spawn_b: formalDef('ma_spawn_b',[Object.assign(effect('b','spawn',{target:'self',to:'spent_gasket'}),{policy:'matrix-v1'})])
    }, () => {
      const f=fixture([['ma_spawn_a',0],['ma_spawn_b',1]]);while(f.s.symbols.length<199)f.s.symbols.push(G.instance(f.s,'slag'));
      const before=f.s.nextId,r=f.run();
      eq(f.s.nextId,before+1);eq(r.log.filter(x=>x.type==='limitSkipped').map(x=>x.reason),['pool-full']);
      f.s.symbols.splice(50,1);const r2=f.run();eq(f.s.symbols.filter(x=>x.type==='spent_gasket').length,2);eq(r2.log.filter(x=>x.type==='limitSkipped').map(x=>x.reason),['pool-full']);
    }));
    test('B/dead-owner-echo-does-not-listen-without-permission', () => temporaryDefinitions({
      ma_echo: formalDef('ma_echo',[{effectId:'grow',trigger:'ON_GROW',action:'add',scope:'event',target:'self',priority:0,amount:8}],1,['product']),
      ma_killer: formalDef('ma_killer',[{effectId:'kill',trigger:'ON_APPEAR',action:'destroy',scope:'self',target:{area:'adj',tagsAny:['product'],count:'1'},priority:0}]),
      ma_product: formalDef('ma_product',[effect('grow','grow',{target:'self',amount:2,priority:1})],1,[])
    }, () => { const f=fixture([['ma_killer',0],['ma_echo',1],['ma_product',2],['ma_echo',6]]),r=f.run();eq(r.log.filter(x=>x.source===f.board[1]&&x.type==='add').length,0);eq(r.ledger.find(x=>x.uid===f.board[1]).alive,false);eq(r.log.filter(x=>x.source===f.board[6]&&x.type==='add').length,1);eq(r.ledger.find(x=>x.uid===f.board[6]).amount,9); }));
    test('B/amber-owned-death-reward-and-payload', () => {
      const f=fixture([['feed_valve',0],['amber_frond',1]]),r=f.run();
      eq([r.reward,r.total,f.s.symbols[0].counters.pressure],[7,8,2]);
      const p=r.log.find(x=>x.type==='reward').payload;
      eq([p.source,p.target,p.sourcePos,p.targetPos,p.cause],[f.board[0],f.board[1],0,1,'consume']);
      eq(p.targetTags,G.symbols.amber_frond.tags);
    });
    test('C/natural-and-extra-age-crossing-is-immediate', () => {
      const f=fixture([['mist_pouch',0],['fog_stitcher',1],['root_ledger',2]]);
      f.s.symbols[0].counters.age=1;const r=f.run();
      eq([f.s.symbols[0].type,f.s.symbols[0].counters,f.s.symbols[2].permanent],['dew_lantern',{},1]);
      eq(r.ledger.map(x=>x.amount),[3,1,2]);eq(r.total,6);
    });
    test('C/tower-sees-injection-before-own-threshold', () => {
      const f=fixture([['release_spire',0],['feed_valve',1],['wick_bed',2]]);
      f.s.symbols[1].counters.pressure=1;const r=f.run();
      eq(r.ledger.map(x=>x.amount),[2,3,0]);eq([r.reward,r.total,f.s.symbols[1].counters.pressure],[3,8,0]);
    });
    test('C/natural-threshold-excluded-from-tower', () => {
      const f=fixture([['release_spire',0],['feed_valve',1],['wick_bed',2]]);
      f.s.symbols[1].counters.pressure=4;const r=f.run();
      eq(r.ledger.map(x=>x.amount),[2,1,0]);eq([r.reward,r.total,f.s.symbols[1].counters.pressure],[17,20,0]);
    });
    test('D/invalid-command-preserves-reference-and-rng', () => {
      const s=G.newRun('INVALID');s.rngState=0;const before=JSON.stringify(s);
      const r=G.command(s,{type:'spin',revision:s.revision});eq(r.ok,false);
      eq(r.state===s,true);eq(JSON.stringify(s),before);
    });
    test('D/import-single-write-envelope-and-no-backup-touch', () => {
      const old=G.newRun('OLD'),next=G.newRun('NEXT'),key='fog-port.save.v1',back=key+'.backup';
      const entries=new Map([[key,G.encode(old)],[back,'original-backup']]),writes=[];
      const storage={getItem:k=>entries.get(k)||null,setItem:(k,v)=>{writes.push(k);entries.set(k,v);}};
      G.commitImport(storage,next);eq(writes,[key]);eq(entries.get(back),'original-backup');
      eq(G.load(storage).state.seed,'NEXT');
      const envelope=JSON.parse(entries.get(key));envelope.current.rngState=0;
      entries.set(key,JSON.stringify(envelope));eq(G.load(storage).state.seed,'OLD');
    });
    test('D/import-write-failure-preserves-both-bytes', () => {
      const key='fog-port.save.v1',entries=new Map([[key,G.encode(G.newRun('OLD'))],[key+'.backup','BACK']]);
      const before=JSON.stringify([...entries]);let rejected=false;
      try{G.commitImport({getItem:k=>entries.get(k)||null,setItem:()=>{throw Error('quota');}},G.newRun('NEXT'));}catch(e){rejected=true;}
      eq(rejected,true);eq(JSON.stringify([...entries]),before);
    });
    test('D/envelope-rotation-fallback-and-storage-faults', () => {
      const key='fog-port.save.v1',back=key+'.backup',a=G.newRun('A'),b=G.newRun('B'),c=G.newRun('C');
      const entries=new Map([[key,G.encode(b)],[back,G.encode(a)]]),storage={getItem:k=>entries.get(k)||null,setItem:(k,v)=>entries.set(k,v)};
      G.commitImport(storage,c);let e=JSON.parse(entries.get(key));eq([e.current.seed,e.previous.seed,entries.get(back)],['C','B',G.encode(a)]);
      e.current.rngState=0;entries.set(key,JSON.stringify(e));eq(G.load(storage).state.seed,'B');
      e.previous.rngState=0;entries.set(key,JSON.stringify(e));eq(G.load(storage).state.seed,'A');
      const before=JSON.stringify([...entries]);for(const broken of [
        {getItem:()=>{throw Error('read')},setItem:storage.setItem},
        {getItem:storage.getItem,setItem:()=>{throw Error('write')}}
      ]) { let threw=false;try{G.commitImport(broken,c)}catch(x){threw=true}eq(threw,true);eq(JSON.stringify([...entries]),before); }
    });
    test('D/rules-02-migration-preserves-pending', () => {
      const r=G.command(G.newRun('MIGRATE'),{type:'spin',revision:0});eq(r.ok,true);
      const old=G.clone(r.state);old.rules='0.2';const next=G.decode(JSON.stringify(old));
      eq([next.rules,next.cash,next.rngState,next.pendingSettlement,next.choices,next.last.resolvedRules],
        ['0.3',old.cash,old.rngState,old.pendingSettlement,old.choices,'0.2']);
    });
    test('A/same-source-events-dedupe-with-independent-effectIds',()=>temporaryDefinitions({
      ma_events:formalDef('ma_events',[effect('m','multiply',{trigger:'ON_GROW',scope:'event',ratio:[3,2]}),effect('n','multiply',{trigger:'ON_GROW',scope:'event',ratio:[2,1]})]),
      ma_emitter:formalDef('ma_emitter',[effect('g1','grow',{target:'self',amount:1}),effect('g2','grow',{target:'self',amount:1})]),
      ma_t:formalDef('ma_t',[],4,['product'])
    },()=>{const f=fixture([['ma_events',0],['ma_emitter',1],['ma_t',5],['ma_t',6]]),r=f.run();eq(r.ledger.filter(x=>x.type==='ma_t').map(x=>[x.amount,x.ratio]),[[12,['6','2']],[12,['6','2']]]);eq(r.log.filter(x=>x.type==='limitSkipped').map(x=>x.reason),Array(4).fill('source-target-once'));}));
    test('A/three-sources-negative-floor',()=>temporaryDefinitions({ma_mult:formalDef('ma_mult',[effect('m','multiply',{ratio:[3,2]})]),ma_neg:formalDef('ma_neg',[],-1,['product'])},()=>{const f=fixture([['ma_mult',0],['ma_mult',1],['ma_mult',2],['ma_neg',6]]),r=f.run();eq(r.ledger[3].amount,-3);eq(r.ledger[3].ratio,['9','4']);eq(r.log.filter(x=>x.type==='limitSkipped').length,1);}));
    test('B/single-uid-two-spawn-effects-and-independent-uid',()=>temporaryDefinitions({
      ma_s:formalDef('ma_s',[effect('s1','spawn',{target:'self',to:'spent_gasket'}),effect('s2','spawn',{target:'self',to:'spent_gasket'})]),
      ma_s2:formalDef('ma_s2',[effect('s','spawn',{target:'self',to:'spent_gasket'})])
    },()=>{const f=fixture([['ma_s',0],['ma_s2',1]]),next=f.s.nextId,r=f.run();eq(f.s.nextId,next+2);eq(r.log.filter(x=>x.type==='limitSkipped').map(x=>x.reason),['source-spawn']);eq(f.s.symbols.filter(x=>x.type==='spent_gasket').length,2);}));
    test('B/pool-200-consumed-mist-tombstone-frees-capacity',()=>{const f=fixture([['deep_still',0],['mist_pouch',1]]);while(f.s.symbols.length<200)f.s.symbols.push(G.instance(f.s,'slag'));const next=f.s.nextId,r=f.run();eq([f.s.symbols.length,f.s.nextId,r.reward],[200,next+1,4]);eq(f.s.symbols.some(x=>x.uid===f.board[1]),false);eq(f.s.symbols.filter(x=>x.type==='saline_ampoule').length,1);});
    test('B/three-risk-failures-use-common-definition-cap',()=>temporaryDefinitions({ma_r:formalDef('ma_r',[effect('risk','risk',{target:'self',chance:0,amount:8,loss:-6,spawnOnFail:'spent_gasket'})],2)},()=>{const f=fixture([['ma_r',0],['ma_r',1],['ma_r',2]]),probe={rngState:f.s.rngState};for(let i=0;i<3;i++)G.random(probe);const next=f.s.nextId,r=f.run();eq(r.ledger.map(x=>x.amount),[-4,-4,-4]);eq([f.s.nextId,f.s.rngState],[next+2,probe.rngState]);eq(r.log.filter(x=>x.type==='limitSkipped').map(x=>x.reason),['definition-spawns']);}));
    test('C/tower-and-age-position-swaps-preserve-checkpoints',()=>{
      for(const positions of [[0,1,2],[1,0,5]]){const f=fixture([['release_spire',positions[0]],['feed_valve',positions[1]],['wick_bed',positions[2]]]);f.s.symbols[1].counters.pressure=1;const r=f.run();eq(r.total,8);eq(r.ledger.find(x=>x.type==='feed_valve').ratio,['3','1']);eq(f.s.symbols[1].counters.pressure,0);}
      for(const positions of [[0,1,2],[1,0,2]]){const f=fixture([['mist_pouch',positions[0]],['fog_stitcher',positions[1]],['root_ledger',positions[2]]]);f.s.symbols[0].counters.age=1;const r=f.run();eq(r.total,6);eq(f.s.symbols[0].counters,{});eq(r.log.filter(x=>x.type==='grow'&&x.event==='ON_TRANSFORM').length,1);}
    });
    test('C/pouch-independent-ten-is-not-multiplied',()=>temporaryDefinitions({ma_twice:formalDef('ma_twice',[effect('m','multiply',{target:{area:'board',tagsAny:['pressure'],count:'all'},ratio:[2,1]})])},()=>{const f=fixture([['ma_twice',0],['pressure_pouch',1]]);f.s.symbols[1].counters.pressure=3;const r=f.run();eq([r.total,r.reward,r.ledger[1].amount,f.s.symbols[1].counters.pressure],[12,10,2,0]);}));
    test('C/return-to-visited-type-rejected-old-source-queue-stale',()=>temporaryDefinitions({
      ma_cycle_a:formalDef('ma_cycle_a',[effect('forward','transform',{target:'self',to:'ma_cycle_b',priority:0}),effect('stale','add',{target:'self',amount:99,priority:10})],1),
      ma_cycle_b:formalDef('ma_cycle_b',[effect('back','transform',{trigger:'ON_TRANSFORM',scope:'event',target:'self',to:'ma_cycle_a',priority:1})],2)
    },()=>{const f=fixture([['ma_cycle_a',0]]),r=f.run();eq([r.total,f.s.symbols[0].type],[2,'ma_cycle_b']);eq(r.log.filter(x=>x.type==='add').length,0);eq(r.log.filter(x=>x.type==='limitSkipped').map(x=>x.reason),['transform-cycle']);eq(r.log.filter(x=>x.type==='transform'&&x.payload).length,1);}));
    test('D/schema-rejects-unsupported-limits-profile-without-mutation',()=>{
      const d=G.symbols.split_register,old=d.effects;try{for(const patch of [{policy:'unknown'},{allowDeadSource:false},{limit:{perStage:1}},{limit:{perSource:1}},{limit:{perTarget:1}}]){d.effects=[Object.assign({},old[0],patch)];const before=JSON.stringify(d.effects);let rejected=false;try{G.validateContent()}catch(e){rejected=true}eq(rejected,true);eq(JSON.stringify(d.effects),before);}}finally{d.effects=old;}
    });
    test('D/ordinary-store-rotates-valid-envelope-current',()=>{const key='fog-port.save.v1',back=key+'.backup',entries=new Map([[key,G.encode(G.newRun('B'))],[back,G.encode(G.newRun('A'))]]),st={getItem:k=>entries.get(k)||null,setItem:(k,v)=>entries.set(k,v)};G.commitImport(st,G.newRun('C'));eq(G.store(st,G.newRun('D')).ok,true);eq([G.decode(entries.get(key)).seed,G.decode(entries.get(back)).seed],['D','C']);});
    test('D/02-all-stable-phases-migrate-without-financial-recompute',()=>{
      for(const phase of ['READY','ITEM_CHOICE','WON','LOST']){const s=G.newRun('OLD-'+phase);s.rules='0.2';s.phase=phase;if(phase!=='READY')s.spinsRemaining=0;if(phase==='WON')s.stage=9;if(phase==='ITEM_CHOICE')s.choices=G.itemChoices(s);delete s.pendingSettlement;const before=JSON.stringify([s.cash,s.rngState,s.choices,s.spin]);const next=G.decode(JSON.stringify(s));eq(next.pendingSettlement,null);eq(JSON.stringify([next.cash,next.rngState,next.choices,next.spin]),before);eq(next.rules,'0.3');}
    });
    test('A/native-dual-tags-no-added-still-two-multipliers',()=>temporaryDefinitions({ma_native:formalDef('ma_native',[],4,['product','resonance','crystal'])},()=>{const f=fixture([['split_register',0],['split_register',1],['ma_native',6]]),r=f.run();eq(r.ledger[2].ratio,['9','4']);eq(r.log.filter(x=>x.type==='tagAdded').length,0);}));
    test('A/dead-before-multiplier-does-not-take-source-quota',()=>temporaryDefinitions({ma_die:formalDef('ma_die',[effect('die','destroy',{target:'self',priority:-10}),effect('m','multiply',{ratio:[3,2]})]),ma_alive:formalDef('ma_alive',[effect('m','multiply',{ratio:[3,2]})]),ma_target:formalDef('ma_target',[],4,['product'])},()=>{const f=fixture([['ma_die',0],['ma_alive',1],['ma_alive',2],['ma_target',6]]),r=f.run();eq(r.ledger[3].amount,9);eq(r.log.filter(x=>x.type==='multiply').map(x=>x.source),[f.board[1],f.board[2]]);}));
    test('A/multiplier-already-applied-survives-owner-death',()=>temporaryDefinitions({ma_die_late:formalDef('ma_die_late',[effect('m','multiply',{ratio:[3,2]}),effect('die','destroy',{target:'self',priority:10})]),ma_target:formalDef('ma_target',[],4,['product'])},()=>{const f=fixture([['ma_die_late',0],['ma_target',6]]),r=f.run();eq(r.ledger[1].amount,6);eq(r.ledger[0].alive,false);}));
    test('B/three-consumed-ash-two-spawns-all-consume-rewards',()=>{const f=fixture([['sorting_tong',0],['ash_felt',1],['sorting_tong',3],['ash_felt',4],['sorting_tong',15],['ash_felt',16]]),next=f.s.nextId,r=f.run();eq(r.reward,18);eq(f.s.nextId,next+2);eq(f.s.symbols.filter(x=>x.type==='copper_burr').length,2);eq(r.log.filter(x=>x.type==='limitSkipped').map(x=>x.reason),['definition-spawns']);for(const pos of [1,4,16])eq(f.s.symbols.some(x=>x.uid===f.board[pos]),false);});
    test('B/different-spawn-definition-not-merged-by-product-type',()=>temporaryDefinitions({ma_s:formalDef('ma_s',[effect('s','spawn',{target:'self',to:'spent_gasket'})]),ma_other:formalDef('ma_other',[effect('s','spawn',{target:'self',to:'spent_gasket'})])},()=>{const f=fixture([['ma_s',0],['ma_s',1],['ma_s',2],['ma_other',3]]),next=f.s.nextId,r=f.run();eq(f.s.nextId,next+3);eq(f.s.symbols.filter(x=>x.type==='spent_gasket').length,3);eq(r.board.filter(Boolean).length,4);eq(r.log.filter(x=>x.type==='limitSkipped').map(x=>x.source),[f.board[2]]);}));
    test('B/direct-tide-not-rewarded-by-other-target-conversion',()=>{const f=fixture([['tide_prism',0],['condense_coil',1],['brine_strip',2]]),r=f.run();eq(r.ledger.map(x=>x.amount),[4,1,7]);eq(r.log.filter(x=>x.type==='add'&&x.event==='ON_TRANSFORM').map(x=>x.source),[f.board[2]]);});
    test('B/explicit-death-permission-self-snapshot-works',()=>temporaryDefinitions({ma_dead:formalDef('ma_dead',[effect('die','destroy',{target:'self',priority:0}),effect('reward','reward',{trigger:'ON_DESTROY',scope:'event',target:'self',when:{eventTargetSelf:true},allowDeadSource:true,reward:4})],1)},()=>{const f=fixture([['ma_dead',0]]),r=f.run();eq([r.reward,r.ledger[0].amount],[4,0]);const p=r.log.find(x=>x.type==='reward').payload;eq([p.source,p.target,p.sourcePos,p.targetPos],[f.board[0],f.board[0],0,0]);}));
    test('C/two-towers-only-first-releases-three-pressure',()=>{const f=fixture([['release_spire',0],['feed_valve',1],['release_spire',2]]);f.s.symbols[1].counters.pressure=3;const r=f.run();eq(r.ledger.map(x=>x.amount),[2,3,2]);eq([r.total,r.reward,f.s.symbols[1].counters.pressure],[7,0,0]);eq(r.log.filter(x=>x.type==='limitSkipped').map(x=>x.reason),['no-legal-target']);});
    test('D/strict-state-invalid-boundaries-reject-before-clone',()=>{for(const mutate of [s=>delete s.settings,s=>delete s.revision,s=>s.payment=-1,s=>s.spinsRemaining=0,s=>s.nextId=1,s=>s.reservations=[{uid:s.symbols[0].uid,pos:1,source:'u1'},{uid:s.symbols[0].uid,pos:2,source:'u2'}]]){const s=G.newRun('BAD');mutate(s);const text=JSON.stringify(s),r=G.command(s,{revision:s.revision,type:'spin'});eq(r.ok,false);eq(r.state===s,true);eq(JSON.stringify(s),text);}});
    test('D/legal-reservation-remove-consume-next-spin-retention',()=>{
      const f=fixture([['switch_lamp',0],['tide_prism',1]]);let r=G.command(f.s,{type:'spin',revision:0,board:f.board});eq(r.ok,true);let s=G.command(r.state,{type:'choose',revision:r.state.revision,index:null}).state;const reserved=s.reservations[0];eq(reserved.uid,f.board[1]);const removed=G.command(s,{type:'remove',revision:s.revision,uid:reserved.uid});eq(removed.ok,true);eq(removed.state.reservations.length,0);
      const saved=G.decode(G.encode(s));r=G.command(saved,{type:'spin',revision:saved.revision});eq(r.ok,true);eq(r.state.last.board[reserved.pos].uid,reserved.uid);
      const g=fixture([['switch_lamp',0],['sorting_runner',1],['tide_prism',2]]);const out=G.command(g.s,{type:'spin',revision:0,board:g.board});eq(out.ok,true);eq(out.state.reservations.length,0);eq(out.state.symbols.some(x=>x.uid===g.board[2]),false);
    });
    test('A/command-choose-next-round-resets-limits',()=>{const f=fixture([['split_register',0],['split_register',1],['split_register',2],['tide_prism',6]]);let s=f.s;for(let i=0;i<2;i++){const r=G.command(s,{type:'spin',revision:s.revision,board:f.board});eq(r.ok,true);eq(r.state.last.ledger.find(x=>x.uid===f.board[6]).amount,9);const chosen=G.command(r.state,{type:'choose',revision:r.state.revision,index:null});eq(chosen.ok,true);s=chosen.state;}});
    test('D/choose-cash-overflow-rollback-and-full-pool-skip',()=>{const f=fixture([['slag',0]]);let r=G.command(f.s,{type:'spin',revision:0,board:f.board});eq(r.ok,true);let s=r.state;s.last.ledger.forEach(x=>x.amount=0);s.last.reward=1e9;s.last.total=1e9;s.pendingSettlement=1e9;s.cash=5;const before=JSON.stringify(s),out=G.command(s,{type:'choose',revision:s.revision,index:null});eq(out.ok,false);eq(out.state===s,true);eq(JSON.stringify(s),before);s.cash=0;s.last.reward=1;s.last.total=1;s.pendingSettlement=1;while(s.symbols.length<200)s.symbols.push(G.instance(s,'slag'));const stateBefore=JSON.stringify(s),add=G.command(s,{type:'choose',revision:s.revision,index:0});eq(add.ok,false);eq(JSON.stringify(s),stateBefore);const skip=G.command(s,{type:'choose',revision:s.revision,index:null});eq(skip.ok,true);eq([skip.state.cash,skip.state.pendingSettlement],[1,null]);});
    test('D/pending-envelope-current-previous-backup-never-recomputes',()=>{const pending=seed=>{const r=G.command(G.newRun(seed),{type:'spin',revision:0});eq(r.ok,true);return r.state;},a=pending('P-A'),b=pending('P-B'),c=pending('P-C'),key='fog-port.save.v1',back=key+'.backup',entries=new Map([[key,G.encode(b)],[back,G.encode(a)]]),st={getItem:k=>entries.get(k)||null,setItem:(k,v)=>entries.set(k,v)};G.commitImport(st,c);for(const wanted of [c,b,a]){const loaded=G.load(st).state;eq([loaded.seed,loaded.pendingSettlement,loaded.rngState,loaded.last],[wanted.seed,wanted.pendingSettlement,wanted.rngState,wanted.last]);const env=JSON.parse(entries.get(key));if(wanted===c)env.current.rngState=0;else if(wanted===b)env.previous.rngState=0;entries.set(key,JSON.stringify(env));}eq(entries.get(back),G.encode(a));});
    test('A/identical-ratios-different-definitions-remain-independent',()=>temporaryDefinitions({ma_a:formalDef('ma_a',[effect('m','multiply',{ratio:[3,2]})]),ma_b:formalDef('ma_b',[effect('m','multiply',{ratio:[3,2]})]),ma_t:formalDef('ma_t',[],4,['product'])},()=>{const f=fixture([['ma_a',0],['ma_a',1],['ma_a',2],['ma_b',5],['ma_b',6],['ma_b',7],['ma_t',11]]),r=f.run();eq(r.ledger[6].amount,20);eq(r.ledger[6].ratio,['81','16']);eq(r.log.filter(x=>x.type==='limitSkipped').map(x=>x.effectKey),['ma_a/m','ma_b/m']);}));
    test('A/global-policy-multiplies-board-once-not-per-selector-target',()=>temporaryDefinitions({ma_global:formalDef('ma_global',[effect('global','globalMultiply',{ratio:[3,2]})]),ma_t:formalDef('ma_t',[],4,['product'])},()=>{const f=fixture([['ma_global',0],['ma_t',1],['ma_t',2]]),r=f.run();eq(r.ledger.slice(1).map(x=>x.amount),[6,6]);eq(r.log.filter(x=>x.type==='limitSkipped').map(x=>[x.target,x.reason]),[['$board','source-target-once']]);}));
    test('A/release-multiplier-refusal-does-not-spend-pressure',()=>temporaryDefinitions({ma_release:formalDef('ma_release',[effect('r','releasePressure',{trigger:'ON_GROW',scope:'event',target:{area:'adj',tagsAny:['pressure'],count:'1'},ratio:[3,1],amount:3})]),ma_initiator:formalDef('ma_initiator',[effect('g1','grow',{target:'self',amount:1}),effect('g2','grow',{target:'self',amount:1})]),ma_pressure:formalDef('ma_pressure',[],1,['pressure'])},()=>{const f=fixture([['ma_release',0],['ma_pressure',1],['ma_initiator',5]]);f.s.symbols[1].counters.pressure=9;const r=f.run();eq(f.s.symbols[1].counters.pressure,6);eq(r.ledger.find(x=>x.type==='ma_pressure').amount,3);eq(r.log.filter(x=>x.type==='limitSkipped').map(x=>x.reason),['source-target-once']);}));
    return results;
  };
})(window.Game);
