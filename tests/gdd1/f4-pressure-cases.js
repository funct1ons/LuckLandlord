'use strict';
const assert=require('assert');global.GDD1={};for(const f of ['contract','rng','schema','content','full-content','full-effects','resolver'])require('../../js/gdd1/'+f+'.js');const F=GDD1;
for(const [type,item,expected,pressure] of [['pressure_pouch',false,[1,1,1,11],[1,2,3,0]],['surge_vessel',false,[0,0,16,0],[1,2,0,1]],['pressure_pouch',true,[1,11,1,11],[2,0,2,0]],['surge_vessel',true,[0,16,0,16],[2,0,2,0]]]){
 const s=F.fullNewRun('F4-PRESSURE');s.pool=[F.instance(s,type)];if(item){s.items=['item_pressure_index'];s.itemState.quotas.item_pressure_index={spin:0,stage:0,run:0};s.itemState.used.item_pressure_index={spin:false,stage:false,run:false};}
 for(let i=0;i<4;i++){const board=Array(20).fill(null);board[0]=s.pool[0];const r=F.sliceResolve(s,board);assert.strictEqual(r.total,expected[i],type+'/'+item+'/'+i);assert.strictEqual(s.pool[0].counters.pressure,pressure[i]);assert.strictEqual(r.ledger[0].amount,type==='surge_vessel'?0:1);assert.strictEqual(r.reward,expected[i]-(type==='surge_vessel'?0:1));const increases=r.log.filter(x=>x.action==='pressureIncrease');assert(increases.length<=2,'index must not recurse');assert(increases.every(x=>x.phase.includes('pressure-injection')));}
}
console.log('PASS 16 exact pressure ledgers: pouch, surge, capped immediate index and non-recursion');
