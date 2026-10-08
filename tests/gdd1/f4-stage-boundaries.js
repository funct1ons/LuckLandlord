'use strict';
// Explicit funded fixture: controller boundaries, NOT natural economic victory.
const assert=require('assert');global.GDD1={};for(const f of ['contract','rng','schema','save','content','full-content','full-effects','descriptions','offers','resolver','controller','full-controller'])require('../../js/gdd1/'+f+'.js');const F=GDD1;let s=F.fullNewRun('F4-FUNDED-BOUNDARY');s.cash=1000000;F.validateState(s);let count=0,paid=[];
while(!['WON','LOST'].includes(s.phase)&&count++<300){let cmd;
 if(s.phase==='READY')cmd={op:'spin'};
 else if(s.phase==='SYMBOL_CHOICE'){if(!s.spinsRemaining){paid.push({stage:s.stageId,spin:s.spin,payment:s.payment});
  for(const delta of [-1,0,1]){const fixture=F.clone(s);fixture.cash=fixture.payment+delta-fixture.pendingSettlement;assert(fixture.cash>=0);F.validateState(fixture);const before=JSON.stringify(fixture),r=F.fullCommand(fixture,{op:'skip',windowId:fixture.offer.windowId,revision:fixture.revision});assert(r.ok,r.error);assert.strictEqual(JSON.stringify(fixture),before,'transaction mutates input');assert.strictEqual(r.state.phase,delta<0?'LOST':fixture.stageId===10?'WON':'ITEM_CHOICE');assert.strictEqual(r.state.cash,delta<0?fixture.payment-1:delta);assert.strictEqual(r.state.pendingSettlement,null);if(fixture.stageId===10){assert.strictEqual(r.state.rerollTokens,fixture.rerollTokens);assert.strictEqual(r.state.removeTokens,fixture.removeTokens);assert.strictEqual(r.state.events.choice,null);}}
 }cmd={op:'skip',windowId:s.offer.windowId};}
 else if(s.phase==='ITEM_CHOICE')cmd={op:'skipItem',windowId:s.offer.windowId};
 else if(s.phase==='EVENT_CHOICE')cmd={op:'event',id:s.events.choice.id,option:'B'};
 else throw Error(s.phase);
 const r=F.fullCommand(s,Object.assign(cmd,{revision:s.revision}));assert(r.ok,r.error);s=r.state;F.validateState(s);
}
assert.strictEqual(s.phase,'WON');assert.strictEqual(s.spin,70);assert.strictEqual(s.stageId,10);assert.strictEqual(s.offer.kind,null);assert.strictEqual(s.events.choice,null);assert.deepStrictEqual(paid.map(x=>x.payment),F.PROFILES['full-v1'].payments);assert.strictEqual(paid.length,10);console.log(JSON.stringify({scope:'Explicit funded all-stage transaction fixture; not balance or natural victory',phase:s.phase,spin:s.spin,payments:paid},null,2));
