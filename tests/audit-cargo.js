'use strict';
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const ctx={window:{},console};vm.createContext(ctx);
for(const f of ['legacy/js/core/rng.js','legacy/js/data/content.js','legacy/js/engine/resolver.js','legacy/js/core/game.js','legacy/js/core/validation.js','legacy/js/core/save.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),ctx,{filename:f});
const G=ctx.window.Game,cases=[];
function raw(types){const s=G.newRun('CARGO-AUDIT');s.symbols=[];for(const t of types)s.symbols.push(G.instance(s,t));return s;}
function spin(s,board){const r=G.command(s,{revision:s.revision,type:'spin',board});assert.equal(r.ok,true,r.error);return r.state;}
function choose(s){const r=G.command(s,{revision:s.revision,type:'choose',index:null});assert.equal(r.ok,true,r.error);return r.state;}
function amt(s,type,i=0){return s.last.ledger.filter(x=>x.type===type)[i].amount;}
function test(name,fn){try{fn();cases.push({name,ok:true});}catch(e){cases.push({name,ok:false,error:e.message});}}
// Each case builds raw state, places the board, then executes the first real resolve.
test('cargo_rope/stable-one-target-and-row-edge',()=>{const s=raw(['cargo_rope','tide_prism','tide_prism']);const x=spin(s,[s.symbols[0].uid,s.symbols[1].uid,s.symbols[2].uid]);assert.equal(amt(x,'tide_prism'),7);});
test('route_stub/exact-three-distinct-types',()=>{const s=raw(['route_stub','saline_ampoule','tide_prism','copper_burr']);assert.equal(amt(spin(s),'route_stub'),6);});
test('parcel_cage/empty-four-threshold-not-pool-size',()=>{const s=raw(['parcel_cage','wick_bed','wick_bed']);assert.equal(amt(spin(s),'parcel_cage'),5);});
test('sorting_runner/base-only-reward-and-consume-once',()=>{const s=raw(['sorting_runner','tide_prism']);s.symbols[1].permanent=7;const x=spin(s);assert.equal(x.last.reward,10);assert.equal(x.symbols.some(z=>z.type==='tide_prism'),false);});
test('sorting_runner/two-runners-compete-single-target',()=>{const s=raw(['sorting_runner','sorting_runner','tide_prism']);const x=spin(s);assert.equal(x.last.reward,10);assert.equal(x.last.log.filter(z=>z.type==='consume').length,1);});
test('manifest_desk/four-distinct-and-floor',()=>{const s=raw(['manifest_desk','saline_ampoule','tide_prism','copper_burr']);assert.equal(amt(spin(s),'manifest_desk'),6);});
test('transit_seal/tie-precedence-and-pool-unchanged',()=>{const s=raw(['transit_seal','saline_ampoule','tide_prism']);const x=spin(s);assert.equal(amt(x,'transit_seal'),2);assert.deepEqual(s.symbols[0].tags,undefined);});
test('return_station/cargo-cause-only',()=>{const s=raw(['return_station','sorting_runner','tide_prism']);assert.equal(spin(s).last.reward,18);});
test('switch_lamp/reserve-next-normal-command-and-save-restore',()=>{let s=raw(['switch_lamp','tide_prism']);s=spin(s);assert.equal(s.reservations.length,1);const uid=s.reservations[0].uid;s=choose(s);assert.equal(s.phase,'READY');const storage={m:new Map(),getItem(k){return this.m.get(k)||null},setItem(k,v){this.m.set(k,v)}};assert.equal(G.store(storage,s).ok,true);s=G.load(storage).state;const x=spin(s);assert.equal(x.last.board.findIndex(c=>c&&c.uid===uid),s.reservations[0]?.pos??-1);});
test('switch_lamp/fixed-board-does-not-falsely-prove-lock',()=>{const s=raw(['switch_lamp','tide_prism']);const ids=s.symbols.map(x=>x.uid);const x=spin(s,[ids[0],ids[1]]);assert.equal(x.reservations.length,1);});
test('switch_lamp/invalid-uid-clears-on-normal-resolve',()=>{const s=raw(['switch_lamp','tide_prism']);s.reservations=[{uid:'ghost',pos:1,source:'u1'}];const x=spin(s);assert.equal(x.last.board.some(c=>c&&c.uid==='ghost'),false);});
test('switch_lamp/dead-target-not-reserved-after-consume',()=>{const s=raw(['switch_lamp','sorting_runner','tide_prism']);const x=spin(s);assert.equal(x.symbols.some(z=>z.type==='tide_prism'),false);assert.equal(x.reservations.some(r=>r.uid==='u3'),false);});
test('multiple-listeners/independent-per-source-limits',()=>{const s=raw(['cargo_rope','cargo_rope','tide_prism']);const x=spin(s);assert.equal(x.last.log.filter(z=>z.type==='add').length,2);assert.equal(x.last.reward,0);});
test('鐣皌ype-and-space/route-stub-does-not-count-duplicates',()=>{const s=raw(['route_stub','saline_ampoule','saline_ampoule']);assert.equal(amt(spin(s),'route_stub'),2);});
test('transit_seal/temporary-tag-does-not-persist-next-round',()=>{let s=raw(['transit_seal','wick_bed','saline_ampoule']);s=spin(s);s=choose(s);s=spin(s);assert.equal(s.symbols.find(z=>z.type==='transit_seal').tags,undefined);});
test('schema/invalid-amount-selector-expression-rejected',()=>{const d=G.symbols.cargo_rope,old=d.effects;try{d.effects=[{trigger:'ON_APPEAR',action:'add',scope:'self',target:'self',priority:0,amount:'3'}];assert.throws(()=>G.validateContent());}finally{d.effects=old;}});
test('schema/invalid-unknown-selector-field-rejected',()=>{const d=G.symbols.cargo_rope,old=d.effects;try{d.effects=[{trigger:'ON_APPEAR',action:'add',scope:'self',target:{area:'adj',bogus:true},priority:0,amount:3}];assert.throws(()=>G.validateContent());}finally{d.effects=old;}});
test('schema/invalid-empty-tags-rejected',()=>{const d=G.symbols.transit_seal,old=d.effects;try{d.effects=[{trigger:'ON_APPEAR',action:'tag',scope:'self',target:'self',priority:0,chooseTags:[]}];assert.throws(()=>G.validateContent());}finally{d.effects=old;}});
const failed=cases.filter(x=>!x.ok);console.log(JSON.stringify({scope:'CARGO independent freeze audit',total:cases.length,passed:cases.length-failed.length,failed:failed.length,cases},null,2));process.exitCode=failed.length?1:0;
