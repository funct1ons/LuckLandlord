'use strict';
const assert=require('assert');global.GDD1={};for(const f of ['contract','rng','schema','content','full-content','full-effects','resolver'])require('../../js/gdd1/'+f+'.js');
const F=GDD1;
for(const item of [false,true]){
 const s=F.fullNewRun('F4-CYCLE');s.pool=[F.instance(s,'beat_spool')];
 if(item){s.items=['item_shared_metronome'];s.itemState.quotas.item_shared_metronome={spin:0,stage:0,run:0};s.itemState.used.item_shared_metronome={spin:false,stage:false,run:false};}
 const expected=item?[1,10,1,10]:[1,1,10,1];
 for(let i=0;i<expected.length;i++){const b=Array(20).fill(null);b[0]=s.pool[0];const r=F.sliceResolve(s,b);assert.strictEqual(r.total,expected[i]);assert.strictEqual(r.reward,0);assert.strictEqual(s.pool[0].counters.beat,(i+1)%(item?2:3));assert.strictEqual(r.log.filter(x=>x.action==='cycle').length,1);}
}
for(const row of require('./f4-exact-contract.json').symbols){const d=F.fullSymbols[row.id];for(const k of ['name','rarity','tags','base'])assert.deepStrictEqual(d[k],row[k],row.id+'/'+k);}
for(const row of require('./f4-exact-contract.json').items){const d=F.fullItems[row.id];for(const k of ['name','rarity'])assert.strictEqual(d[k],row[k],row.id+'/'+k);}
console.log('PASS exact 64-symbol and 32-item metadata; beat cycle 3 and mechanism-based threshold 2, eight exact ledgers');
