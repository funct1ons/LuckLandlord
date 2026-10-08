'use strict';
const assert=require('assert');global.GDD1={};for(const f of ['contract','rng','schema','save','full-save','content','full-content','full-effects','offers','resolver','controller','full-controller'])require('../../js/gdd1/'+f+'.js');
const F=GDD1,bytes=new Map(F.LEGACY_KEYS.map((k,i)=>[k,'legacy-bytes-'+i])),writes=[];
const storage={getItem:k=>bytes.has(k)?bytes.get(k):null,setItem(k,v){writes.push(k);bytes.set(k,v)}};
const full=F.fullNewRun('BOUNDARY-FULL'),slice=F.sliceNewRun('BOUNDARY-SLICE');
assert(F.store(storage,full).ok);assert(F.store(storage,slice).ok);
const snapshot=()=>JSON.stringify([...bytes]);const initial=snapshot();let previews=0;
for(const [state,expected]of [[slice,'full-v1'],[full,'slice-abd-v1']]){
 const count=writes.length,r=F.commitImport(storage,F.encode(state),()=>{previews++},expected);
 assert(!r.ok);assert(r.error.includes('profile mismatch'));assert.strictEqual(previews,0);assert.strictEqual(writes.length,count);assert.strictEqual(snapshot(),initial);
}
for(const [state,profile,key,other]of [[full,'full-v1',F.FULL_SAVE_KEY,F.SAVE_KEY],[slice,'slice-abd-v1',F.SAVE_KEY,F.FULL_SAVE_KEY]]){
 const otherBytes=bytes.get(other),legacy=F.LEGACY_KEYS.map(k=>bytes.get(k));
 const next=F.clone(state);next.revision++;
 assert(F.store(storage,next).ok);assert.deepStrictEqual(F.load(storage,profile).state,next);assert.strictEqual(bytes.get(other),otherBytes);
 const record=bytes.get(key);assert.deepStrictEqual(F.recoverPrevious(record),state);
 const before=snapshot(),count=writes.length;
 for(const preview of [()=>{throw Error('render failed')},()=>Promise.resolve()]){const r=F.commitImport(storage,F.encode(state),preview,profile);assert(!r.ok);assert.strictEqual(snapshot(),before);assert.strictEqual(writes.length,count);}
 const broken={getItem:storage.getItem,setItem(){throw Error('quota fault')}};
 assert(!F.commitImport(broken,F.encode(state),()=>undefined,profile).ok);assert.strictEqual(snapshot(),before);
 assert(F.commitImport(storage,F.encode(F.recoverPrevious(record)),()=>undefined,profile).ok);
 assert.deepStrictEqual(F.load(storage,profile).state,state);assert.strictEqual(bytes.get(other),otherBytes);assert.deepStrictEqual(F.LEGACY_KEYS.map(k=>bytes.get(k)),legacy);
 // Explicit rollback and reload do not authorize silent recovery of malformed current.
 const bad=JSON.parse(bytes.get(key));bad.current.schema=999;bytes.set(key,JSON.stringify(bad));const corrupted=snapshot();
 assert(!F.load(storage,profile).ok);assert.strictEqual(snapshot(),corrupted);assert.strictEqual(bytes.get(other),otherBytes);bytes.set(key,record);
}
assert.deepStrictEqual(F.LEGACY_KEYS.map(k=>bytes.get(k)),F.LEGACY_KEYS.map((k,i)=>'legacy-bytes-'+i));
console.log('PASS wrong-profile import before preview/write; both-profile reload, explicit rollback, synchronous preview/write faults; other and legacy keys unchanged');
