'use strict';
const assert=require('assert');
global.GDD1={};
for(const f of ['contract','rng','schema','save','content','full-content','full-effects','offers','resolver','full-controller'])require('../../js/gdd1/'+f+'.js');
const F=GDD1, cases=[];
function test(name,fn){try{fn();cases.push({name,ok:true})}catch(e){cases.push({name,ok:false,error:e.message})}}
// 配额表于 2026-10 平衡调整（原 [70,125,...,1880] 三策略均 0% 胜率；
// 根因是曲线形状——后期配额达可达收入的约 3 倍）。
// 这里仍然逐位钉住具体数值：目的是让"配额被意外改动"能被发现，
// 而不是让数值永远不许变。改动配额时必须同步更新本断言并说明理由。
const EXPECTED_PAYMENTS=[150,265,400,425,445,450,455,475,550,585];
const EXPECTED_SLICE=[98,173,260,277,290,293,296,309,358,381];
test('f4/content-counts',()=>{assert.equal(F.SYMBOL_IDS.length,64);assert.equal(F.ITEM_IDS.length,32);assert.equal(F.EVENT_IDS.length,8);assert.equal(F.PROFILES['full-v1'].payments[0],150);assert.deepEqual(F.PROFILES['full-v1'].payments,EXPECTED_PAYMENTS);assert.deepEqual(F.SLICE_PAYMENTS,EXPECTED_SLICE)});
test('f4/normal-initial-state',()=>{const s=F.fullNewRun('F4-NORMAL');assert.equal(s.profile,'full-v1');assert.equal(s.pool.length,12);assert.equal(s.stageId,1);assert.equal(s.spinsRemaining,6);assert.equal(s.payment,150);assert.equal(F.validateState(s),true)});
test('f4/deterministic-replay',()=>{const a=F.fullNewRun('F4-REPLAY'),b=F.fullNewRun('F4-REPLAY');assert.deepEqual(a,b)});
test('f4/full-command-path',()=>{let s=F.fullNewRun('F4-CMD');let r=F.fullCommand(s,{op:'spin',revision:s.revision});assert(r.ok);s=r.state;assert.equal(s.phase,'SYMBOL_CHOICE');const id=s.offer.choices[0];r=F.fullCommand(s,{op:'choose',revision:s.revision,windowId:s.offer.windowId,id});assert(r.ok);assert.equal(r.state.phase,'READY');});
test('f4/save-roundtrip',()=>{const s=F.fullNewRun('F4-SAVE');const text=F.encode(s);assert.deepEqual(F.decode(text,'full-v1'),s)});
require('./f4-contract-cases.js')(F,test,assert);
const out={scope:'GDD1 F4 full-v1',total:cases.length,passed:cases.filter(x=>x.ok).length,cases};console.log(JSON.stringify(out,null,2));if(out.passed!==out.total)process.exitCode=1;
