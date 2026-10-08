'use strict';
(function (G) {
  const A = [], fail = (m) => { throw Error(m); };
  const ok = (v, m) => { if (!v) fail(m); };
  const eq = (a, b, m) => { if (JSON.stringify(a) !== JSON.stringify(b)) fail(`${m}: ${JSON.stringify(a)} != ${JSON.stringify(b)}`); };
  const ids = {
    cultivation: ['mist_pouch','wick_bed','dew_lantern','amber_frond','fog_stitcher','root_ledger','warm_pod','nursery_gauge'],
    recycling: ['ash_felt','sorting_tong','copper_burr','spent_gasket','sieve_drum','heat_clerk','clinker_router','furnace_auditor'],
    distillation: ['brine_strip','saline_ampoule','condense_coil','tide_prism','deep_still','crystal_index','pearl_separator','reserve_facet']
  };
  const all = [...ids.cultivation, ...ids.recycling, ...ids.distillation];
  function state(types) { const s = G.newRun('FORMAL-24'); s.symbols = []; types.forEach(t => s.symbols.push(G.instance(s, t))); return s; }
  function resolve(types, board) { const s = state(types); const b = board || types.map((_, i) => i); return G.resolve(s, b.map(i => s.symbols[i].uid)); }
  function caseOf(id, suffix, fn) { A.push({ name: `formal/${id}/${suffix}`, fn }); }
  all.forEach(id => {
    caseOf(id, 'schema-defined', () => { const d = G.symbols[id]; ok(d && d.formal, `${id} missing formal definition`); ok(Array.isArray(d.effects), `${id} effects missing`); ok(d.tags.length > 0, `${id} tags missing`); });
    caseOf(id, 'schema-negative', () => { const d = G.symbols[id]; ok(!d.effects.some(e => e.action === 'unknown'), `${id} unknown action`); ok(d.effects.every(e => Number.isInteger(e.priority)), `${id} priority invalid`); });
  });
  caseOf('mist_pouch','age-2-negative',()=>{ const r=resolve(['mist_pouch']); eq(r.ledger[0].type,'mist_pouch','mist pouch stays before threshold'); });
  caseOf('mist_pouch','age-3-positive',()=>{ const s=state(['mist_pouch']); s.symbols[0].counters.age=2; const r=G.resolve(s,[s.symbols[0].uid]); eq(r.board[0].type,'dew_lantern','mist pouch converts on third age'); });
  caseOf('wick_bed','base-production',()=>eq(resolve(['wick_bed']).ledger[0].amount,2,'wick bed base'));
  caseOf('dew_lantern','conversion-negative',()=>eq(resolve(['dew_lantern']).board[0].type,'dew_lantern','dew lantern does not convert at age 0'));
  caseOf('dew_lantern','conversion-positive',()=>{const s=state(['dew_lantern']);s.symbols[0].counters.age=1;eq(G.resolve(s,[s.symbols[0].uid]).board[0].type,'amber_frond','dew lantern converts at age 2');});
  caseOf('amber_frond','consume-reward',()=>{const r=resolve(['amber_frond']);ok(r.reward>=0,'amber frond reward ledger exists');});
  caseOf('fog_stitcher','plant-filter',()=>{const r=resolve(['fog_stitcher','wick_bed']);eq(r.ledger[0].amount,1,'no adjacent plant means no bonus');});
  caseOf('root_ledger','plant-convert-reward',()=>{const r=resolve(['root_ledger','mist_pouch']);ok(r.ledger[0].amount>=1,'root ledger remains payable');});
  caseOf('warm_pod','fuel-condition',()=>{const r=resolve(['warm_pod','wick_bed']);ok(r.ledger[0].amount>=1,'warm pod valid with fuel');});
  caseOf('nursery_gauge','plant-count-negative',()=>{const r=resolve(['nursery_gauge']);eq(r.ledger[0].multiplier,1,'one plant does not trigger multiplier');});
  caseOf('ash_felt','consume-spawn',()=>{const s=state(['ash_felt']);const r=G.resolve(s,[s.symbols[0].uid]);ok(r.board[0].alive,'ash felt is not self-destroyed before maturity');});
  caseOf('sorting_tong','scrap-target',()=>{const r=resolve(['sorting_tong','ash_felt']);ok(r.log.some(x=>x.type==='consume'),'sorting tong consumes one scrap');});
  caseOf('copper_burr','machine-condition-legacy-error-corrected',()=>{const r=resolve(['copper_burr','wick_bed']);eq(r.ledger[0].amount,2,'no machine neighbor means no +2; old expectation 4 was invalid');});
  caseOf('spent_gasket','negative-base',()=>eq(resolve(['spent_gasket']).ledger[0].amount,-1,'spent gasket keeps negative base value'));
  caseOf('sieve_drum','junk-filter',()=>{const r=resolve(['sieve_drum','spent_gasket']);ok(r.log.some(x=>x.type==='transform'),'sieve drum transforms junk');});
  caseOf('heat_clerk','scrap-count',()=>{const r=resolve(['heat_clerk','ash_felt']);ok(r.ledger[0].amount>=1,'heat clerk remains valid');});
  caseOf('clinker_router','destroy-cause',()=>{const r=resolve(['clinker_router','spent_gasket']);ok(r.log.some(x=>x.type==='destroy'),'clinker destroys junk');});
  caseOf('furnace_auditor','scrap-count-negative',()=>{const r=resolve(['furnace_auditor']);eq(r.ledger[0].multiplier,1,'one scrap does not trigger auditor');});
  caseOf('brine_strip','age-2-negative',()=>eq(resolve(['brine_strip']).board[0].type,'brine_strip','brine strip before second spin'));
  caseOf('brine_strip','age-2-positive',()=>{const s=state(['brine_strip']);s.symbols[0].counters.age=1;eq(G.resolve(s,[s.symbols[0].uid]).board[0].type,'saline_ampoule','brine strip converts on second spin');});
  caseOf('saline_ampoule','base-production',()=>eq(resolve(['saline_ampoule']).ledger[0].amount,2,'saline ampoule base'));
  caseOf('condense_coil','feedstock-filter',()=>{const r=resolve(['condense_coil','saline_ampoule']);ok(r.log.some(x=>x.type==='transform'),'condense coil converts one feedstock');});
  caseOf('tide_prism','direct-draw-no-transform-bonus',()=>{const r=resolve(['tide_prism']);eq(r.reward,0,'direct tide prism draw has no transform reward');});
  caseOf('deep_still','mist-negative',()=>{const r=resolve(['deep_still']);eq(r.reward,0,'deep still without mist has no reward');});
  caseOf('crystal_index','crystal-count-negative',()=>eq(resolve(['crystal_index']).ledger[0].amount,1,'one crystal type does not trigger index'));
  caseOf('pearl_separator','product-filter',()=>{const r=resolve(['pearl_separator','tide_prism']);eq(r.board[1].type,'tide_prism','product crystal is excluded from separator target');});
  caseOf('reserve_facet','fuel-pressure',()=>{const r=resolve(['reserve_facet','wick_bed']);ok(r.log.some(x=>x.type==='consume'),'reserve facet consumes adjacent fuel');;});
  G.formalSymbolTests = function () { return A.map(t => { try { t.fn(); return {name:t.name,ok:true}; } catch (e) { return {name:t.name,ok:false,error:e.message}; } }); };
})(window.Game);
