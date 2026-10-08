'use strict';const assert=require('assert');global.GDD1={};for(const f of ['contract','rng','schema','content','full-content','full-effects','resolver'])require('../../js/gdd1/'+f+'.js');const F=GDD1;
function setup(types,item){const s=F.fullNewRun('ITEM-FOCUSED');s.pool=types.map(t=>F.instance(s,t));s.items=[item];s.itemState.quotas[item]={spin:0,stage:0,run:0};s.itemState.used[item]={spin:false,stage:false};return s;}
function resolve(s){const board=Array(20).fill(null);s.pool.slice(0,20).forEach((x,i)=>board[i]=x);return F.sliceResolve(s,board);}
let cases=0;
for(const n of [11,12,20,21]){const r=resolve(setup(Array(n).fill('phase_chip'),'item_small_hold'));assert.strictEqual(r.reward,n>=12&&n<=20?5:0);assert.strictEqual(r.total,Math.min(n,20)*2+r.reward);cases++;}
// item_low_balance_tab 条件：轮初现金 < 本期配额的一半。用 payment 推导阈值。
{const P=setup(['phase_chip'],'item_low_balance_tab').payment,half=Math.floor(P/2);
 for(const cash of [half-1,half,P]){const s=setup(['phase_chip'],'item_low_balance_tab');s.cash=cash;const r=resolve(s);assert.strictEqual(r.reward,cash<half?3:0);assert.strictEqual(r.total,2+r.reward);cases++;}}
let s=setup(['dock_chime','route_stub','saline_ampoule','tide_prism'],'item_manifest_clip');let r=resolve(s);// 2 dock + (2+4) route + 2 ampoule + 4 prism + independent 6.
assert.strictEqual(r.reward,6);assert.strictEqual(r.total,20);cases++;
s=setup(['dock_chime','route_stub','saline_ampoule','saline_ampoule'],'item_manifest_clip');r=resolve(s);assert.strictEqual(r.reward,0);cases++;
s=setup(['mist_pouch'],'item_root_wrap');s.pool[0].counters.age=2;r=resolve(s);assert.strictEqual(r.total,7);assert.strictEqual(r.reward,0);assert.strictEqual(s.itemState.quotas.item_root_wrap.spin,1);assert(r.log.some(e=>e.source==='item_root_wrap'&&e.action==='add'&&e.target===s.pool[0].uid&&e.amount===4));cases++;
s=setup(['condense_coil','saline_ampoule'],'item_brine_lining');r=resolve(s);assert.strictEqual(r.total,12);assert.strictEqual(r.reward,0);assert.strictEqual(s.pool[1].type,'tide_prism');cases++;
s=setup(['compliance_desk','spent_gasket'],'item_compliance_carbon');r=resolve(s);// 1 desk + 3 newly converted stub (no appearance +1) + 3 carbon.
assert.strictEqual(r.total,7);assert.strictEqual(r.reward,0);assert.strictEqual(s.pool[1].type,'cleared_stub');cases++;
s=setup(['pressure_pouch'],'item_release_receipt');for(const expected of [11,11,23,11]){s.pool[0].counters.pressure=3;r=resolve(s);assert.strictEqual(r.total,expected);assert.strictEqual(r.reward,expected-1);cases++;}assert.strictEqual(s.itemState.quotas.item_release_receipt.stage,4);assert.strictEqual(s.itemState.used.item_release_receipt.stage,true);
console.log('PASS '+cases+' focused exact item ledgers and bounds; remaining item contracts explicitly open');
