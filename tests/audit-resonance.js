'use strict';
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const ctx={window:{},console};vm.createContext(ctx);
for(const f of ['legacy/js/core/rng.js','legacy/js/data/content.js','legacy/js/engine/resolver.js','legacy/js/core/game.js','legacy/js/core/validation.js','legacy/js/core/save.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),ctx,{filename:f});
const G=ctx.window.Game; const cases=[];
function raw(types){const s=G.newRun('RESONANCE-AUDIT-C');s.symbols=[];for(const t of types)s.symbols.push(G.instance(s,t));return s;}
function spin(s,positions){const ids=s.symbols.map(x=>x.uid);const board=positions||ids;const r=G.command(s,{revision:s.revision,type:'spin',board});assert.equal(r.ok,true,r.error);return r.state;}
function amount(s,type,occ=0){const xs=s.last.ledger.filter(x=>x.type===type);return xs[occ].amount;}
function test(name,fn){try{fn();cases.push({name,ok:true});}catch(e){cases.push({name,ok:false,error:e.message});}}
// C matrix boundaries: every helper constructs raw state, places board, then performs the first resolve.
test('dock_chime/duplicate-type-dedup',()=>{const s=raw(['dock_chime','echo','echo']);const x=spin(s);assert.equal(amount(x,'dock_chime'),3);});
test('dock_chime/row-edge-no-wrap',()=>{const s=raw(['dock_chime','echo']);const x=spin(s,[s.symbols[0].uid,null,null,null,null,s.symbols[1].uid]);assert.equal(amount(x,'dock_chime'),2);});
test('pitch_fork/diagonal-eight-neighbor',()=>{const s=raw(['pitch_fork','echo']);const x=spin(s,[s.symbols[0].uid,null,null,null,null,null,s.symbols[1].uid]);assert.equal(amount(x,'echo'),4);});
test('pitch_fork/edge-no-wrap',()=>{const s=raw(['pitch_fork','echo']);const x=spin(s,[s.symbols[0].uid,null,null,null,s.symbols[1].uid]);assert.equal(amount(x,'echo'),1);});
test('pitch_fork/stable-single-target',()=>{const s=raw(['pitch_fork','echo','lens']);const x=spin(s);assert.equal(amount(x,'echo'),4);assert.equal(amount(x,'lens'),1);});
test('fog_reed/self-add-direction',()=>{const s=raw(['fog_reed','mist_pouch']);const x=spin(s);assert.equal(amount(x,'fog_reed'),4);assert.equal(amount(x,'mist_pouch'),1);});
test('beat_spool/cycle-boundary-and-reset',()=>{let s=raw(['beat_spool']);for(let i=0;i<3;i++){s=spin(s);if(i<2)s=G.command(s,{revision:s.revision,type:'choose',index:null}).state;}assert.equal(amount(s,'beat_spool'),10);s=G.command(s,{revision:s.revision,type:'choose',index:null}).state;s=spin(s);assert.equal(amount(s,'beat_spool'),1);});
test('beat_spool/multi-instance-independent',()=>{let s=raw(['beat_spool','beat_spool']);for(let i=0;i<3;i++){s=spin(s);if(i<2)s=G.command(s,{revision:s.revision,type:'choose',index:null}).state;}assert.equal(amount(s,'beat_spool',0),10);assert.equal(amount(s,'beat_spool',1),10);});
test('chord_frame/distinct-type-and-ratio',()=>{const s=raw(['chord_frame','echo','echo']);const x=spin(s);assert.equal(x.last.ledger[1].multiplier,1);const t=raw(['chord_frame','echo','lens']);t.symbols[1].permanent=2;const y=spin(t);assert.deepEqual(JSON.parse(JSON.stringify(y.last.ledger[1].ratio)),['2','1']);assert.equal(amount(y,'echo'),6);});
test('prism_hum/converted-does-not-reappear',()=>{const s=raw(['prism_hum','condense_coil','saline_ampoule']);const x=spin(s);assert.equal(amount(x,'prism_hum'),2);assert.equal(x.last.board[2].type,'tide_prism');});
test('silence_keeper/exact-row-one',()=>{const s=raw(['silence_keeper','dock_chime']);const x=spin(s,[s.symbols[0].uid,null,null,null,null,s.symbols[1].uid]);assert.equal(amount(x,'silence_keeper'),11);});
test('harbor_conductor/row-wide-single-application',()=>{const s=raw(['harbor_conductor','dock_chime','fog_reed','beat_spool']);const x=spin(s);assert.equal(amount(x,'harbor_conductor'),4);assert.equal(amount(x,'dock_chime'),10);});
test('harbor_conductor/two-types-negative',()=>{const s=raw(['harbor_conductor','dock_chime']);const x=spin(s);assert.equal(amount(x,'harbor_conductor'),2);});
test('save-restore/real-command-state',()=>{const s=spin(raw(['beat_spool']));const store=new Map();const storage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)};assert.equal(G.store(storage,s).ok,true);const loaded=G.load(storage);assert.equal(loaded.ok,true);assert.deepEqual(JSON.parse(G.encode(loaded.state)),JSON.parse(G.encode(s)));});
// Strict schema probes: these must reject malformed recursion/types/tags/zero thresholds.
function expectReject(label,mut){test('schema/'+label,()=>{const d=G.symbols.dock_chime,e=d.effects[0],old=JSON.parse(JSON.stringify(e));try{mut(e);assert.throws(()=>G.validateContent());}finally{Object.assign(e,old);}});}
expectReject('count-zero-threshold',e=>{e.amount={count:{area:'row',tags:['resonance'],at:0}};});
expectReject('row-count-both-at-exact',e=>{e.when={rowUniqueTypeCount:{tags:['resonance'],at:1,exact:1}};});
expectReject('cycle-invalid-threshold-type',e=>{const b=G.symbols.beat_spool.effects[0];b.threshold='3';});
expectReject('unknown-expression-tag',e=>{e.amount={count:{area:'row',tags:['not_a_tag']}};});
const failed=cases.filter(x=>!x.ok);console.log(JSON.stringify({scope:'C resonance eight IDs',total:cases.length,passed:cases.length-failed.length,failed:failed.length,cases},null,2));process.exitCode=failed.length?1:0;
