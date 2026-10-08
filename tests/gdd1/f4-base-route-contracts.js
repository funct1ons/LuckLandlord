'use strict';const assert=require('assert');global.GDD1={};for(const f of ['contract','rng','schema','content','full-content','full-effects','resolver'])require('../../js/gdd1/'+f+'.js');const F=GDD1;let count=0;
function fixture(entries){const s=F.fullNewRun('BASE-ROUTES'),b=Array(20).fill(null);s.pool=[];for(const [pos,t]of entries){const x=F.instance(s,t);s.pool.push(x);b[pos]=x;}return {s,b};}
function check(f,total,reward=0){const rng=F.clone(f.s.rng),r=F.sliceResolve(f.s,f.b);assert.strictEqual(r.total,total,JSON.stringify(f.b.map(x=>x&&x.type)));assert.strictEqual(r.reward,reward);assert.deepStrictEqual(f.s.rng,rng);count++;return r;}
for(const [t,base]of [['wick_bed',2],['saline_ampoule',2],['spent_gasket',-1],['arrears_slip',-1]]){const f=fixture([[0,t]]),r=check(f,base);assert.strictEqual(r.log.length,0);}
let f=fixture([[0,'mist_pouch']]);check(f,1);assert.strictEqual(f.b[0].counters.age,1);check(f,1);assert.strictEqual(f.b[0].counters.age,2);check(f,3);assert.strictEqual(f.b[0].type,'dew_lantern');assert.strictEqual(f.b[0].epoch,1);
f=fixture([[0,'dew_lantern']]);check(f,3);check(f,4);assert.strictEqual(f.b[0].type,'amber_frond');assert.strictEqual(f.b[0].epoch,1);
f=fixture([[0,'brine_strip']]);check(f,1);check(f,2);assert.strictEqual(f.b[0].type,'saline_ampoule');assert.strictEqual(f.b[0].epoch,1);
f=fixture([[0,'feed_valve'],[1,'amber_frond']]);let r=check(f,8,7);assert.strictEqual(f.b[0].counters.pressure,2);assert.strictEqual(f.s.pool.length,1);assert(r.log.some(e=>e.action==='reward'&&e.source===f.b[1].uid&&e.amount===4));
f=fixture([[0,'root_ledger'],[1,'mist_pouch'],[5,'mist_pouch'],[19,'mist_pouch']]);for(const x of f.s.pool.slice(1))x.counters.age=2;r=check(f,12);assert.strictEqual(f.b[0].permanent,2);assert.strictEqual(r.log.filter(e=>e.action==='grow').length,2);
f=fixture([[0,'nursery_gauge'],[1,'mist_pouch'],[5,'mist_pouch']]);f.b[1].counters.age=f.b[5].counters.age=2;r=check(f,11);assert.strictEqual(r.log.filter(e=>e.action==='multiply').length,3);
f=fixture([[0,'sorting_tong'],[1,'ash_felt']]);r=check(f,7,6);assert.deepStrictEqual(f.s.pool.map(x=>x.type),['sorting_tong','copper_burr']);assert.strictEqual(r.log.filter(e=>e.action==='spawn').length,1);
f=fixture([[0,'ash_felt']]);f.b[0].counters.age=2;r=check(f,3,3);assert.strictEqual(f.s.pool.length,0);assert(!r.log.some(e=>e.action==='spawn'));assert.strictEqual(r.ledger[0].amount,0);
f=fixture([[0,'sorting_tong']]);r=check(f,1);assert(!r.log.some(e=>e.action==='reward'));
f=fixture([[0,'warm_pod'],[1,'wick_bed'],[2,'feed_valve']]);r=check(f,8,3);assert.strictEqual(r.ledger.find(x=>x.uid===f.b[0].uid).amount,4);assert(!r.ledger.find(x=>x.uid===f.b[1].uid).alive);
f=fixture([[0,'copper_burr'],[1,'sieve_drum']]);check(f,6);
f=fixture([[0,'sieve_drum'],[1,'spent_gasket']]);r=check(f,4);assert.strictEqual(f.b[1].type,'copper_burr');assert.strictEqual(f.b[1].epoch,1);assert.strictEqual(f.b[1].uid,r.board[1].uid);assert(!r.log.some(e=>e.action==='destroy'||e.action==='consume'));
f=fixture([[0,'sorting_tong'],[1,'ash_felt'],[10,'heat_clerk']]);r=check(f,9,6);assert.strictEqual(f.b[10].permanent,1);
f=fixture([[0,'clinker_router'],[1,'spent_gasket'],[19,'pressure_pouch']]);r=check(f,3);assert.strictEqual(f.b[19].counters.pressure,3);assert(!r.log.some(e=>e.action==='consume'));
f=fixture([[0,'furnace_auditor'],[5,'sorting_tong'],[6,'ash_felt'],[18,'sorting_tong'],[19,'copper_burr']]);r=check(f,17,12);assert.strictEqual(r.log.filter(e=>e.action==='multiply').length,3);
f=fixture([[0,'fog_reed'],[1,'mist_pouch'],[2,'deep_still']]);r=check(f,10,4);assert.strictEqual(r.ledger.find(x=>x.uid===f.b[0].uid).amount,4);assert.strictEqual(f.s.pool.at(-1).type,'saline_ampoule');
f=fixture([[0,'prism_hum'],[1,'blank_facet']]);check(f,11);
f=fixture([[0,'condense_coil'],[1,'saline_ampoule']]);r=check(f,8);assert.strictEqual(f.b[1].type,'tide_prism');assert.strictEqual(r.log.find(e=>e.action==='add').amount,3);
f=fixture([[0,'tide_prism']]);r=check(f,4);assert(!r.log.some(e=>e.action==='add'));
f=fixture([[0,'crystal_index'],[1,'blank_facet']]);check(f,12);
f=fixture([[0,'crystal_index'],[1,'crystal_index']]);check(f,2);
f=fixture([[0,'pearl_separator'],[1,'blank_facet']]);r=check(f,11);assert.strictEqual(f.b[1].type,'tide_prism');assert.strictEqual(r.ledger[1].amount,9); // appearance2 retained + transform3 + base4
f=fixture([[0,'pearl_separator'],[1,'tide_prism']]);r=check(f,6);assert(!r.log.some(e=>e.action==='transform'));
f=fixture([[0,'reserve_facet'],[1,'wick_bed']]);f.b[0].counters.pressure=4;r=check(f,22,20);assert.strictEqual(f.b[0].counters.pressure,0);
f=fixture([[0,'lean_receipt']]);{const half=Math.floor(f.s.payment/2);f.s.cash=half-1;check(f,5);f.s.cash=half;check(f,1);}
f=fixture([[0,'compliance_desk'],[1,'spent_gasket']]);r=check(f,4);assert.strictEqual(f.b[1].type,'cleared_stub');assert.strictEqual(f.b[1].epoch,1);assert(!r.log.some(e=>e.action==='add'));assert.strictEqual(f.b[1].counters&&Object.keys(f.b[1].counters).length,0);
console.log('PASS '+count+' exact real full-v1 base-route ledgers, natural cycles, snapshots, immediate lifecycle, capped listeners, summary, transform preservation and no RNG');
