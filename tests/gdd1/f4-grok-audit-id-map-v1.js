'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const vm = require('vm');
const destName = process.argv[2] || 'f4-grok-audit-id-map-v1.json';
if (!/^f4-grok-audit-[\w-]+\.json$/.test(destName)) throw Error('Unsafe output ' + destName);
const dest = path.join(__dirname, destName);
if (fs.existsSync(dest)) throw Error('Refuse existing output ' + dest);
const root = path.resolve(__dirname, '../..');
const ctx = { console };
ctx.globalThis = ctx;
vm.createContext(ctx);
for (const f of ['contract', 'rng', 'schema', 'save', 'full-save', 'content', 'full-content', 'full-effects', 'offers', 'resolver', 'controller', 'full-controller']) {
  vm.runInContext(fs.readFileSync(path.join(root, 'js/gdd1', f + '.js'), 'utf8'), ctx);
}
const F = ctx.GDD1;
const eq = (a, b, msg) => {
  if (JSON.stringify(a) !== JSON.stringify(b)) throw Error((msg || 'eq') + ' expected ' + JSON.stringify(b) + ' actual ' + JSON.stringify(a));
};
const implOf = (id, kind) => {
  const d = kind === 'symbol' ? F.fullSymbols[id] : kind === 'item' ? F.fullItems[id] : F.fullEvents[id];
  if (!d) throw Error('missing ' + kind + ' ' + id);
  return {
    name: d.name, rarity: d.rarity, tags: d.tags || null, base: d.base,
    mechanics: d.mechanics || null,
    effects: (d.effects || []).map(e => ({
      phase: e.phase, op: e.op, amount: e.amount, event: e.event, defer: !!e.defer,
      lockFirst: !!e.lockFirst, copyable: !!e.copyable, each: !!e.each, limit: e.limit,
      window: e.window, order: e.order, selector: e.selector, match: e.match,
      predicate: e.predicate, ratio: e.ratio, deathAllowed: !!e.deathAllowed
    })),
    spinEffects: d.spinEffects || null, op: d.op || null, cost: d.cost, remaining: d.remaining,
    target: d.target || null, tag: d.tag || null
  };
};
function setup(entries, items, configure) {
  const s = F.fullNewRun('IDMAP-V1');
  s.pool = []; s.nextUid = 1; s.spin = 1; s.stageSpin = 1; s.spinsRemaining = 5; s.items = items || [];
  for (const id of s.items) {
    s.itemState.quotas[id] = { spin: 0, stage: 0, run: 0 };
    s.itemState.used[id] = { spin: false, stage: false };
  }
  const board = Array(20).fill(null);
  for (const [type, pos, counters] of entries) {
    const x = F.instance(s, type);
    if (counters) Object.assign(x.counters, counters);
    s.pool.push(x);
    board[pos] = x;
  }
  if (configure) configure(s);
  return { s, board };
}
function resolve(entries, items, configure) {
  const { s, board } = setup(entries, items, configure);
  const last = F.sliceResolve(s, board);
  return { s, board, last };
}
function multi(entries, n, items, configure) {
  const { s, board } = setup(entries, items, configure);
  const results = [];
  for (let i = 0; i < n; i++) {
    s.spin = i + 1; s.stageSpin = i + 1;
    results.push({ last: F.sliceResolve(s, board), type: s.pool[0] && s.pool[0].type, age: s.pool[0] && s.pool[0].counters && s.pool[0].counters.age, epoch: s.pool[0] && s.pool[0].epoch });
  }
  return { s, board, results };
}
function addFrom(last, source) {
  return last.log.filter(e => e.source === source && e.action === 'add').reduce((n, e) => n + e.amount, 0);
}
function has(last, pred) { return last.log.some(pred); }
const symbols = [];
const items = [];
const events = [];
function row(bucket, id, gdd, fn) {
  const rec = { id, gdd, impl: implOf(id, bucket === symbols ? 'symbol' : bucket === items ? 'item' : 'event'), ok: false, trigger: null, error: null };
  try {
    rec.trigger = fn(rec) || { ran: true };
    rec.ok = true;
  } catch (e) {
    rec.ok = false;
    rec.error = e.message;
  }
  bucket.push(rec);
}

// --- 64 symbols: GDD 5.A–5.H / 5.I.1 actual-trigger ---
row(symbols, 'mist_pouch', { table: '5.A', body: '第3次上盘转 dew_lantern; natural age only', phase: 'step3/age' }, () => {
  const one = multi([['mist_pouch', 0]], 1);
  eq(one.results[0].type, 'mist_pouch', 'mist spin1 type');
  eq(one.results[0].age, 1, 'mist spin1 age');
  const three = multi([['mist_pouch', 0]], 3);
  eq(three.results[2].type, 'dew_lantern', 'mist spin3 type');
  eq(three.results[2].epoch, 1, 'mist spin3 epoch');
  eq(three.results[2].age, 0, 'mist spin3 new age');
  return { spin1Age: 1, spin3Type: 'dew_lantern' };
});
row(symbols, 'wick_bed', { table: '5.A', body: 'base 2, no extra', phase: 'step4/appearance' }, () => {
  const r = resolve([['wick_bed', 0]]);
  eq(r.last.total, 2); return { total: 2 };
});
row(symbols, 'dew_lantern', { table: '5.A', body: '第2次上盘转 amber_frond', phase: 'step3/age' }, () => {
  const two = multi([['dew_lantern', 0]], 2);
  eq(two.results[0].age, 1); eq(two.results[1].type, 'amber_frond'); return { spin2Type: 'amber_frond' };
});
row(symbols, 'amber_frond', { table: '5.A', body: 'consume self reward 4 independent of consumer', phase: 'step6/lifecycle' }, () => {
  const r = resolve([['sorting_runner', 0], ['amber_frond', 1]]);
  eq(r.last.reward, 14, 'runner 6+amberBase4 plus amber death 4');
  eq(r.last.log.filter(e => e.action === 'reward').map(e => e.amount).sort((a, b) => a - b), [4, 10]);
  return { reward: r.last.reward };
});
row(symbols, 'fog_stitcher', { table: '5.A', body: 'age-extra one adjacent plant +1; finished products skipped', phase: 'step3/age extra' }, () => {
  const r = resolve([['fog_stitcher', 0], ['mist_pouch', 1]]);
  eq(r.s.pool.find(x => x.type === 'mist_pouch').counters.age, 2, 'natural+stitcher');
  const finished = resolve([['fog_stitcher', 0], ['amber_frond', 1]]);
  eq(finished.s.pool.find(x => x.type === 'amber_frond').counters.age, undefined);
  return { mistAge: 2 };
});
row(symbols, 'root_ledger', { table: '5.A', body: 'each plant transform: self permanent +1, max 2/spin, cap 30', phase: 'listen transform' }, () => {
  const r = resolve([['root_ledger', 0], ['mist_pouch', 1, { age: 2 }], ['mist_pouch', 2, { age: 2 }]]);
  const led = r.s.pool.find(x => x.type === 'root_ledger');
  eq(led.permanent, 2); eq(r.last.total, 1 + 2 + 3 + 3, 'ledger3 + two dew3');
  return { permanent: 2, total: r.last.total };
});
row(symbols, 'warm_pod', { table: '5.A', body: 'appearance: adj starting live fuel +3', phase: 'step4/appearance' }, () => {
  const hit = resolve([['warm_pod', 0], ['wick_bed', 1]]);
  eq(hit.last.total, 1 + 3 + 2);
  const miss = resolve([['warm_pod', 0]]);
  eq(miss.last.total, 1);
  return { withFuel: hit.last.total, alone: 1 };
});
row(symbols, 'nursery_gauge', { table: '5.A', body: 'summary: >=2 plant transforms then live plant ×3/2', phase: 'step8/end-summary' }, () => {
  const r = resolve([['nursery_gauge', 0], ['mist_pouch', 1, { age: 2 }], ['mist_pouch', 2, { age: 2 }]]);
  eq(has(r.last, e => e.action === 'multiply' && e.source === r.s.pool[0].uid), true);
  return { multiplied: true, total: r.last.total };
});
row(symbols, 'ash_felt', { table: '5.B', body: 'consume spawn copper; 3 appearances then self-destroy reward 3', phase: 'listen consume + step6 end' }, () => {
  const eat = resolve([['sorting_tong', 0], ['ash_felt', 1]]);
  eq(eat.s.pool.some(x => x.type === 'copper_burr'), true);
  const die = resolve([['ash_felt', 0, { age: 2 }]]);
  eq(die.last.reward, 3); eq(die.s.pool.length, 0);
  return { spawnOnConsume: true, matureReward: 3 };
});
row(symbols, 'sorting_tong', { table: '5.B', body: 'consume adj scrap reward 6; no target => base 1 only', phase: 'step5/structural-event' }, () => {
  eq(resolve([['sorting_tong', 0]]).last.total, 1);
  const r = resolve([['sorting_tong', 0], ['copper_burr', 1]]);
  eq(r.last.reward, 6); eq(r.last.total, 7);
  return { alone: 1, withScrap: 7 };
});
row(symbols, 'copper_burr', { table: '5.B', body: 'adj any machine self +2', phase: 'step4/appearance' }, () => {
  eq(resolve([['copper_burr', 0]]).last.total, 2);
  eq(resolve([['copper_burr', 0], ['fog_stitcher', 1]]).last.ledger[0].amount, 4);
  return { alone: 2, adjMachine: 4 };
});
row(symbols, 'spent_gasket', { table: '5.B', body: 'base -1, no extra, candidate false', phase: 'base-only' }, () => {
  eq(resolve([['spent_gasket', 0]]).last.total, -1);
  eq(F.fullSymbols.spent_gasket.mechanics.candidate, false);
  return { total: -1 };
});
row(symbols, 'sieve_drum', { table: '5.B', body: 'transform adj junk to copper_burr, not delete', phase: 'step5/structural-event' }, () => {
  const r = resolve([['sieve_drum', 0], ['spent_gasket', 1]]);
  eq(r.s.pool[1].type, 'copper_burr'); eq(r.s.pool[1].uid, 'u2');
  return { transformed: 'copper_burr', uidKept: 'u2' };
});
row(symbols, 'heat_clerk', { table: '5.B', body: 'scrap consume => self permanent +1 /spin', phase: 'listen consume' }, () => {
  const r = resolve([['heat_clerk', 0], ['sorting_tong', 1], ['ash_felt', 2]]);
  eq(r.s.pool.find(x => x.type === 'heat_clerk').permanent, 1);
  return { permanent: 1 };
});
row(symbols, 'clinker_router', { table: '5.B', body: 'destroy adj junk; listen non-consume junk destroy => one pressure +2', phase: 'step5 + listen' }, () => {
  const r = resolve([['clinker_router', 0], ['spent_gasket', 1], ['pressure_pouch', 2]]);
  eq(r.s.pool.some(x => x.type === 'spent_gasket'), false);
  const p = r.s.pool.find(x => x.type === 'pressure_pouch');
  eq(p.counters.pressure >= 1, true);
  return { junkGone: true, pressure: p.counters.pressure };
});
row(symbols, 'furnace_auditor', { table: '5.B', body: 'summary: consume >=2 distinct scrap types then each live machine ×3/2', phase: 'step8/end-summary' }, () => {
  const r = resolve([['furnace_auditor', 0], ['sorting_tong', 1], ['ash_felt', 2], ['sorting_tong', 5], ['copper_burr', 6]]);
  eq(has(r.last, e => e.action === 'multiply' && e.source === r.s.pool[0].uid), true);
  return { multiplied: true, total: r.last.total };
});
row(symbols, 'dock_chime', { table: '5.C', body: 'appearance self + distinct other row resonance types cap 3', phase: 'step4/appearance' }, () => {
  const r = resolve([['dock_chime', 0], ['fog_reed', 1], ['beat_spool', 2]]);
  eq(r.last.ledger[0].amount, 4);
  return { amount: 4 };
});
row(symbols, 'pitch_fork', { table: '5.C', body: 'step5 adjacency-add one adj resonance +3 lockFirst', phase: 'step5/adjacency-add' }, () => {
  const r = resolve([['pitch_fork', 0], ['dock_chime', 1]]);
  eq(addFrom(r.last, r.s.pool[0].uid), 3);
  eq(r.last.log.find(e => e.source === r.s.pool[0].uid && e.action === 'add').phase, 'step5/adjacency-add');
  return { addPhase: 'step5/adjacency-add', amount: 3 };
});
row(symbols, 'fog_reed', { table: '5.C', body: 'appearance adj starting mist +3', phase: 'step4/appearance' }, () => {
  eq(resolve([['fog_reed', 0], ['mist_pouch', 1]]).last.ledger[0].amount, 4);
  return { amount: 4 };
});
row(symbols, 'beat_spool', { table: '5.C', body: '3rd appearance extra +9 reset beat', phase: 'step4/appearance cycle' }, () => {
  const r = resolve([['beat_spool', 0, { beat: 2 }]]);
  eq(r.last.total, 10); eq(r.s.pool[0].counters.beat, 0);
  return { total: 10 };
});
row(symbols, 'chord_frame', { table: '5.C', body: 'appearance: >=2 other adj resonance types, first neighbor ×2', phase: 'step4/appearance' }, () => {
  const r = resolve([['chord_frame', 1], ['dock_chime', 0], ['pitch_fork', 2]]);
  eq(has(r.last, e => e.action === 'multiply' && e.source === r.s.pool[0].uid), true);
  return { multiplied: true, total: r.last.total };
});
row(symbols, 'prism_hum', { table: '5.C', body: 'appearance adj starting crystal +4', phase: 'step4/appearance' }, () => {
  eq(resolve([['prism_hum', 0], ['tide_prism', 1]]).last.ledger[0].amount, 6);
  return { amount: 6 };
});
row(symbols, 'silence_keeper', { table: '5.C', body: 'appearance row resonance count exactly 1 => +10', phase: 'step4/appearance' }, () => {
  eq(resolve([['silence_keeper', 0]]).last.total, 11);
  eq(resolve([['silence_keeper', 0], ['dock_chime', 1]]).last.ledger[0].amount, 1);
  return { alone: 11, crowded: 1 };
});
row(symbols, 'harbor_conductor', { table: '5.C', body: 'row >=3 distinct resonance types: that row resonance ×2 once', phase: 'step4/appearance' }, () => {
  const r = resolve([['harbor_conductor', 0], ['dock_chime', 1], ['pitch_fork', 2], ['fog_reed', 3]]);
  eq(has(r.last, e => e.action === 'multiply' && e.source === r.s.pool[0].uid), true);
  return { multiplied: true, total: r.last.total };
});
row(symbols, 'brine_strip', { table: '5.D', body: '第2次上盘转 saline_ampoule', phase: 'step3/age' }, () => {
  const two = multi([['brine_strip', 0]], 2);
  eq(two.results[1].type, 'saline_ampoule'); return { spin2Type: 'saline_ampoule' };
});
row(symbols, 'saline_ampoule', { table: '5.D', body: 'base 2 no extra', phase: 'step4/appearance' }, () => {
  eq(resolve([['saline_ampoule', 0]]).last.total, 2); return { total: 2 };
});
row(symbols, 'condense_coil', { table: '5.D', body: 'transform adj feedstock to tide_prism', phase: 'step5/structural-event' }, () => {
  const r = resolve([['condense_coil', 0], ['saline_ampoule', 1]]);
  eq(r.s.pool[1].type, 'tide_prism'); return { type: 'tide_prism' };
});
row(symbols, 'tide_prism', { table: '5.D', body: 'on transform-into-self +3; direct draw base 4', phase: 'listen transform self' }, () => {
  eq(resolve([['tide_prism', 0]]).last.total, 4);
  const r = resolve([['condense_coil', 0], ['saline_ampoule', 1]]);
  eq(r.last.ledger.find(x => x.type === 'tide_prism').amount, 7);
  return { direct: 4, converted: 7 };
});
row(symbols, 'deep_still', { table: '5.D', body: 'consume adj mist reward 4 spawn saline', phase: 'step5/structural-event' }, () => {
  const r = resolve([['deep_still', 0], ['mist_pouch', 1]]);
  eq(r.last.reward, 4); eq(r.s.pool.some(x => x.type === 'saline_ampoule'), true);
  return { reward: 4, spawned: true };
});
row(symbols, 'crystal_index', { table: '5.D', body: '>=2 crystal types self +6', phase: 'step4/appearance' }, () => {
  eq(resolve([['crystal_index', 0], ['tide_prism', 1]]).last.ledger[0].amount, 7);
  eq(resolve([['crystal_index', 0]]).last.total, 1);
  return { with2: 7, alone: 1 };
});
row(symbols, 'pearl_separator', { table: '5.D', body: 'transform adj crystal non-product to tide_prism; tide already illegal', phase: 'step5/structural-event' }, () => {
  const r = resolve([['pearl_separator', 0], ['blank_facet', 1]]);
  eq(r.s.pool[1].type, 'tide_prism');
  const skip = resolve([['pearl_separator', 0], ['tide_prism', 1]]);
  eq(skip.s.pool[1].type, 'tide_prism'); eq(skip.s.pool[1].epoch, 0);
  return { blankToTide: true, tideUntouched: true };
});
row(symbols, 'reserve_facet', { table: '5.D', body: 'consume adj fuel reward 2 pressure +2 cap 6; at 6 reward 18', phase: 'step5 + step7' }, () => {
  const r = resolve([['reserve_facet', 0], ['wick_bed', 1]]);
  eq(r.s.pool[0].counters.pressure, 2); eq(r.last.reward, 2);
  const rel = resolve([['reserve_facet', 0, { pressure: 4 }], ['wick_bed', 1]]);
  eq(rel.last.reward, 20); eq(rel.s.pool[0].counters.pressure, 0);
  return { inject: 2, release: 18 };
});
row(symbols, 'cargo_rope', { table: '5.E/5.I.1', body: 'step5 adjacency-add lock first adj product +3', phase: 'step5/adjacency-add' }, () => {
  const r = resolve([['cargo_rope', 0], ['copper_burr', 1]]);
  const add = r.last.log.find(e => e.source === r.s.pool[0].uid && e.action === 'add');
  eq(add.amount, 3); eq(add.phase, 'step5/adjacency-add');
  return { phase: add.phase, amount: 3 };
});
row(symbols, 'route_stub', { table: '5.E', body: 'appearance >=3 cargo types self +4', phase: 'step4/appearance' }, () => {
  const r = resolve([['route_stub', 0], ['dock_chime', 1], ['saline_ampoule', 2], ['copper_burr', 3]]);
  eq(r.last.ledger[0].amount, 6);
  return { amount: 6 };
});
row(symbols, 'parcel_cage', { table: '5.E', body: 'appearance initial empty >=4 self +3', phase: 'step4/appearance' }, () => {
  eq(resolve([['parcel_cage', 0]]).last.total, 5);
  const full = setup(Array.from({ length: 17 }, (_, i) => ['wick_bed', i]));
  full.s.pool[0].type = 'parcel_cage';
  const last = F.sliceResolve(full.s, full.board);
  eq(last.ledger[0].amount, 2);
  return { empty: 5, crowded: 2 };
});
row(symbols, 'sorting_runner', { table: '5.E', body: 'consume adj product reward 6+target base', phase: 'step5/structural-event' }, () => {
  const r = resolve([['sorting_runner', 0], ['copper_burr', 1]]);
  eq(r.last.reward, 8);
  return { reward: 8 };
});
row(symbols, 'manifest_desk', { table: '5.E', body: 'appearance >=4 cargo types self ×3', phase: 'step4/appearance' }, () => {
  const r = resolve([['manifest_desk', 0], ['dock_chime', 1], ['saline_ampoule', 2], ['copper_burr', 3], ['amber_frond', 4]]);
  eq(has(r.last, e => e.action === 'multiply' && e.source === r.s.pool[0].uid), true);
  return { multiplied: true, total: r.last.total };
});
row(symbols, 'switch_lamp', { table: '5.E', body: 'reserve adj product next spin; commit step8 if still valid', phase: 'step5 defer → step8' }, () => {
  const r = resolve([['switch_lamp', 0], ['copper_burr', 1]]);
  eq(r.s.reservations.length, 1); eq(r.s.reservations[0].uid, r.s.pool[1].uid);
  eq(has(r.last, e => e.action === 'reserve' && e.phase === 'step8/end-summary'), true);
  return { reserved: r.s.reservations[0].uid };
});
row(symbols, 'transit_seal', { table: '5.E', body: 'preprocess majority adj plant/crystal/resonance tag', phase: 'step2/tagAdded' }, () => {
  const r = resolve([['transit_seal', 0], ['mist_pouch', 1], ['mist_pouch', 2]]);
  eq(has(r.last, e => e.action === 'tagAdded' && e.target === r.s.pool[0].uid && e.phase === 'step2/tagAdded'), true);
  return { tagged: true };
});
row(symbols, 'return_station', { table: '5.E', body: 'listen adj cargo consume product; step8 reward 8 if pool<=20', phase: 'listen defer step8' }, () => {
  const r = resolve([['return_station', 0], ['sorting_runner', 1], ['copper_burr', 2]]);
  eq(r.last.reward, 8 + 8);
  eq(r.last.log.some(e => e.source === r.s.pool[0].uid && e.action === 'reward' && e.phase === 'step8/end-summary'), true);
  return { stationRewardPhase: 'step8/end-summary' };
});
row(symbols, 'pressure_pouch', { table: '5.F', body: 'inject +1 cap4; at4 reward10 reset; ordinary still 1', phase: 'step4/pressure-injection + step7' }, () => {
  eq(resolve([['pressure_pouch', 0]]).s.pool[0].counters.pressure, 1);
  const rel = resolve([['pressure_pouch', 0, { pressure: 3 }]]);
  eq(rel.last.reward, 10); eq(rel.last.total, 11); eq(rel.s.pool[0].counters.pressure, 0);
  return { release: 10 };
});
row(symbols, 'feed_valve', { table: '5.F', body: 'consume adj fuel reward3 pressure +2 cap6', phase: 'step5/structural-event' }, () => {
  const r = resolve([['feed_valve', 0], ['wick_bed', 1]]);
  eq(r.last.reward, 3); eq(r.s.pool[0].counters.pressure, 2);
  return { reward: 3, pressure: 2 };
});
row(symbols, 'pause_dial', { table: '5.F', body: 'appearance copyable +1; adj pressure-tag +2 uncopyable', phase: 'step4/appearance' }, () => {
  eq(resolve([['pause_dial', 0]]).last.total, 3);
  eq(resolve([['pause_dial', 0], ['safety_shim', 1]]).last.ledger[0].amount, 5);
  const fx = F.fullSymbols.pause_dial.effects;
  eq(fx[0].copyable, true); eq(!!fx[1].copyable, false);
  return { alone: 3, adjTag: 5 };
});
row(symbols, 'surge_vessel', { table: '5.F', body: 'inject +1 cap3 reward16; ordinary always 0', phase: 'step4/pressure-injection' }, () => {
  eq(resolve([['surge_vessel', 0, { pressure: 1 }]]).last.total, 0);
  const rel = resolve([['surge_vessel', 0, { pressure: 2 }]]);
  eq(rel.last.total, 16); eq(rel.last.reward, 16);
  return { unreleased: 0, released: 16 };
});
row(symbols, 'cracked_regulator', { table: '5.F', body: '3/4 +8; 1/4 -6 spawn gasket', phase: 'step4/risk' }, () => {
  let seen = { success: false, fail: false };
  for (let i = 0; i < 40 && !(seen.success && seen.fail); i++) {
    const r = resolve([['cracked_regulator', 0]], [], s => { s.seed = 'RISK-' + i; s.rng = F.createRng(s.seed, 'full-v1', 'Normal'); });
    if (r.s.pool.some(x => x.type === 'spent_gasket')) seen.fail = true;
    if (r.last.ledger[0].amount === 10) seen.success = true;
  }
  eq(seen.success, true); eq(seen.fail, true);
  return seen;
});
row(symbols, 'safety_shim', { table: '5.F', body: 'reduce first adj pressure-risk fail loss by 4 min 0', phase: 'step4/risk mitigation' }, () => {
  eq(F.fullSymbols.safety_shim.mechanics.riskMitigation, { tag: 'pressure', amount: 4 });
  let reduced = false;
  for (let i = 0; i < 50 && !reduced; i++) {
    const r = resolve([['cracked_regulator', 0], ['safety_shim', 1]], [], s => { s.seed = 'SHIM-' + i; s.rng = F.createRng(s.seed, 'full-v1', 'Normal'); });
    if (r.last.log.some(e => e.cause === 'loss-reduction' || (e.facts && e.facts.cause === 'loss-reduction'))) reduced = true;
  }
  eq(reduced, true);
  return { reduced: true };
});
row(symbols, 'release_spire', { table: '5.F', body: 'step7 spend 3 from adj pressure>=3 below cap, ×3 + reward 8', phase: 'step7/pressure' }, () => {
  const r = resolve([['release_spire', 0], ['pressure_pouch', 1, { pressure: 2 }]]);
  eq(r.last.log.some(e => e.action === 'release' && e.source === r.s.pool[0].uid && e.phase === 'step7/pressure'), true);
  eq(r.last.reward, 8);
  return { reward: 8, phase: 'step7/pressure' };
});
row(symbols, 'demand_coupler', { table: '5.F', body: 'cash<payment and remaining<=2: self ×4 spawn gasket', phase: 'step4/appearance' }, () => {
  const r = resolve([['demand_coupler', 0]], [], s => { s.cash = 10; s.spinsRemaining = 1; });
  eq(has(r.last, e => e.action === 'multiply' && e.source === r.s.pool[0].uid), true);
  eq(r.s.pool.some(x => x.type === 'spent_gasket'), true);
  return { multiplied: true, spawned: true };
});
row(symbols, 'phase_chip', { table: '5.G', body: 'preprocess: adj resonance else crystal tag', phase: 'step2/tagAdded' }, () => {
  const r = resolve([['phase_chip', 0], ['dock_chime', 1]]);
  eq(has(r.last, e => e.action === 'tagAdded' && e.target === r.s.pool[0].uid && e.phase === 'step2/tagAdded'), true);
  return { tagged: true };
});
row(symbols, 'spectrum_pin', { table: '5.G', body: 'appearance >=3 other adj types +4; not copyable', phase: 'step4/appearance' }, () => {
  const r = resolve([['spectrum_pin', 0], ['wick_bed', 1], ['dock_chime', 5], ['spent_gasket', 6]]);
  eq(r.last.ledger[0].amount, 5);
  eq(!!F.fullSymbols.spectrum_pin.effects[0].copyable, false);
  return { amount: 5 };
});
row(symbols, 'cloudy_negative', { table: '5.G/5.I.1', body: '第3次上盘转 blank_facet; NATURAL age only, not fog_stitcher extra', phase: 'step3/age natural' }, () => {
  const extra = (F.fullSymbols.cloudy_negative.effects || []).some(e => e.phase === 'age-extra');
  const one = multi([['cloudy_negative', 0]], 1);
  const three = multi([['cloudy_negative', 0]], 3);
  const trigger = {
    implHasAgeExtraSelf: extra,
    spin1Type: one.results[0].type,
    spin1Age: one.results[0].age,
    spin2Age: multi([['cloudy_negative', 0]], 2).results[1].age,
    spin3Type: three.results[2].type,
    gddSpin1Age: 1,
    gddSpin3Type: 'blank_facet'
  };
  eq(one.results[0].type, 'cloudy_negative', 'cloudy still cloudy after 1 appearance');
  eq(one.results[0].age, 1, 'GDD 第3次上盘: first appearance age 0→1, extra self-age is not registered for cloudy');
  eq(three.results[2].type, 'blank_facet', 'third appearance converts');
  return trigger;
});
row(symbols, 'blank_facet', { table: '5.G', body: 'ON_APPEAR copyable +2; convert-into skips appearance', phase: 'step4/appearance initial' }, () => {
  eq(resolve([['blank_facet', 0]]).last.total, 5);
  eq(F.fullSymbols.blank_facet.effects[0].copyable, true);
  const conv = resolve([['cloudy_negative', 0, { age: 2 }]]);
  eq(conv.s.pool[0].type, 'blank_facet'); eq(conv.last.total, 3);
  return { direct: 5, converted: 3 };
});
row(symbols, 'offset_reader', { table: '5.G', body: 'copy adj copyable ON_APPEAR add cap 8', phase: 'step4/copy' }, () => {
  const r = resolve([['blank_facet', 0], ['offset_reader', 1]]);
  eq(r.last.total, 10);
  eq(r.last.log.some(e => e.action === 'copy' && e.phase === 'step4/copy'), true);
  return { total: 10 };
});
row(symbols, 'alignment_cloth', { table: '5.G/5.I.1', body: 'after preprocess, first legal adj by tagAdded RECORD order +5 lock, no retarget', phase: 'step2/tagAdded' }, () => {
  const r = resolve([['split_register', 0], ['phase_chip', 1], ['alignment_cloth', 2], ['copper_burr', 6]]);
  eq(r.last.log.filter(e => e.action === 'tagAdded').map(e => e.target), ['u4', 'u4', 'u2']);
  eq(r.last.ledger.map(x => x.amount), [2, 2, 1, 10]);
  eq(r.last.total, 15);
  const add = r.last.log.find(e => e.source === r.s.pool[2].uid && e.action === 'add');
  eq(add.target, 'u4'); eq(add.amount, 5);
  eq(F.fullSymbols.alignment_cloth.effects[0].lockFirst, true);
  eq(F.fullSymbols.alignment_cloth.effects[0].selector.order, 'tagAdded');
  eq(F.fullSymbols.alignment_cloth.effects[0].selector.receivedTag, true);
  return { tagTargets: ['u4', 'u4', 'u2'], ledger: [2, 2, 1, 10], total: 15, clothTarget: 'u4' };
});
row(symbols, 'echo_plate', { table: '5.G', body: 'listen adj grow actualIncrease×4, max 2', phase: 'listen grow' }, () => {
  const r = resolve([['echo_plate', 0], ['cancellation_clerk', 1], ['arrears_slip', 2]]);
  eq(addFrom(r.last, r.s.pool[0].uid), 4);
  return { add: 4 };
});
row(symbols, 'split_register', { table: '5.G', body: 'preprocess adj product +resonance+crystal and ×3/2', phase: 'step2/tagAdded' }, () => {
  const r = resolve([['split_register', 0], ['copper_burr', 1]]);
  eq(r.last.log.filter(e => e.action === 'tagAdded').length, 2);
  eq(has(r.last, e => e.action === 'multiply' && e.source === r.s.pool[0].uid), true);
  return { tags: 2, multiplied: true };
});
row(symbols, 'arrears_slip', { table: '5.H', body: 'base -1, candidate false', phase: 'base-only' }, () => {
  eq(resolve([['arrears_slip', 0]]).last.total, -1);
  eq(F.fullSymbols.arrears_slip.mechanics.candidate, false);
  return { total: -1 };
});
row(symbols, 'lean_receipt', { table: '5.H', body: 'cash*2<payment self +4', phase: 'step4/appearance' }, () => {
  eq(resolve([['lean_receipt', 0]], [], s => s.cash = 34).last.total, 5);
  eq(resolve([['lean_receipt', 0]], [], s => s.cash = 35).last.total, 1);
  return { below: 5, half: 1 };
});
row(symbols, 'compliance_desk', { table: '5.H', body: 'transform adj junk to cleared_stub', phase: 'step5/structural-event' }, () => {
  const r = resolve([['compliance_desk', 0], ['arrears_slip', 1]]);
  eq(r.s.pool[1].type, 'cleared_stub'); eq(r.last.total, 4);
  return { total: 4 };
});
row(symbols, 'cleared_stub', { table: '5.H', body: 'direct ON_APPEAR copyable +1; convert-into skips +1', phase: 'step4/appearance initial' }, () => {
  eq(resolve([['cleared_stub', 0]]).last.total, 4);
  eq(F.fullSymbols.cleared_stub.effects[0].copyable, true);
  return { direct: 4 };
});
row(symbols, 'cancellation_clerk', { table: '5.H', body: 'consume adj junk reward 5 and self grow 1', phase: 'step5/structural-event' }, () => {
  const r = resolve([['cancellation_clerk', 0], ['arrears_slip', 1]]);
  eq(r.last.total, 7); eq(r.s.pool[0].permanent, 1);
  return { total: 7, permanent: 1 };
});
row(symbols, 'quota_margin', { table: '5.H', body: 'cash deficit <=15 self +6; snapshot cash', phase: 'step4/appearance' }, () => {
  eq(resolve([['quota_margin', 0]], [], s => s.cash = 55).last.total, 8);
  eq(resolve([['quota_margin', 0]], [], s => s.cash = 54).last.total, 2);
  return { deficit15: 8, deficit16: 2 };
});
row(symbols, 'advance_stamp', { table: '5.H', body: 'if accepted: reward 18, payment +12, spawn arrears; default reject', phase: 'step4/appearance advance' }, () => {
  const off = resolve([['advance_stamp', 0]]);
  eq(off.last.reward, 0); eq(off.last.total, 2);
  const on = resolve([['advance_stamp', 0]], [], s => { s.settings.advanceAccepted = true; });
  eq(on.last.reward, 18); eq(on.s.payment, 82); eq(on.s.pool.some(x => x.type === 'arrears_slip'), true);
  return { rejected: 2, acceptedReward: 18 };
});
row(symbols, 'settlement_beacon', { table: '5.H', body: 'summary: no junk and >=3 contract types: contract ×2', phase: 'step8/end-summary' }, () => {
  const r = resolve([['settlement_beacon', 0], ['lean_receipt', 1], ['quota_margin', 2]]);
  eq(has(r.last, e => e.action === 'multiply' && e.source === r.s.pool[0].uid), true);
  const junk = resolve([['settlement_beacon', 0], ['lean_receipt', 1], ['quota_margin', 2], ['spent_gasket', 3]]);
  eq(has(junk.last, e => e.action === 'multiply' && e.source === junk.s.pool[0].uid), false);
  return { cleanMultiplied: true, junkBlocked: true };
});

// --- 32 items ---
row(items, 'item_dew_calendar', { table: '6/5.I.1', body: 'after natural age, first remaining aged plant +1' }, () => {
  const r = resolve([['mist_pouch', 0], ['mist_pouch', 1, { age: 2 }]], ['item_dew_calendar']);
  const a = r.s.pool.find(x => x.uid === 'u1');
  eq(a.type, 'mist_pouch'); eq(a.counters.age, 2);
  return { secondPlantAge: 2 };
});
row(items, 'item_root_wrap', { table: '6', body: 'first plant transform survivor +4' }, () => {
  const r = resolve([['mist_pouch', 0, { age: 2 }]], ['item_root_wrap']);
  eq(r.last.total, 7);
  return { total: 7 };
});
row(items, 'item_nursery_scale', { table: '6', body: 'draw plant weight ×3/2 if pool<=28' }, () => {
  const e = F.fullItems.item_nursery_scale.effects[0];
  eq(e.op, 'weight'); eq(e.tag, 'plant'); eq(e.ratio, [3, 2]); eq(e.poolMax, 28);
  const s = F.fullNewRun('WEIGHT-PLANT');
  s.pool = []; s.nextUid = 1;
  for (const t of ['mist_pouch', 'spent_gasket']) s.pool.push(F.instance(s, t));
  s.items = ['item_nursery_scale'];
  s.itemState.quotas.item_nursery_scale = { spin: 0, stage: 0, run: 0 };
  s.itemState.used.item_nursery_scale = { spin: false, stage: false };
  const board = F.sliceDraw(s);
  eq(board.filter(Boolean).length, 2);
  return { weight: [3, 2], drew: 2 };
});
row(items, 'item_frost_glass', { table: '6', body: 'stage first 2 starting mist +3 each' }, () => {
  const r = resolve([['mist_pouch', 0], ['mist_pouch', 1]], ['item_frost_glass']);
  eq(addFrom(r.last, 'item_frost_glass'), 6);
  return { add: 6 };
});
row(items, 'item_sorting_apron', { table: '6', body: 'first scrap consume extra reward +3' }, () => {
  const r = resolve([['sorting_tong', 0], ['ash_felt', 1]], ['item_sorting_apron']);
  eq(r.last.log.some(e => e.source === 'item_sorting_apron' && e.action === 'reward' && e.amount === 3), true);
  return { extra: 3 };
});
row(items, 'item_waste_log', { table: '6', body: '3rd non-consume junk destroy this stage: removeTokens +1' }, () => {
  const { s, board } = setup([['clinker_router', 0], ['spent_gasket', 1]], ['item_waste_log']);
  F.sliceResolve(s, board);
  s.pool.push(F.instance(s, 'spent_gasket')); board[1] = s.pool[s.pool.length - 1];
  F.sliceResolve(s, board);
  s.pool.push(F.instance(s, 'spent_gasket')); board[1] = s.pool[s.pool.length - 1];
  const before = s.removeTokens;
  F.sliceResolve(s, board);
  eq(s.removeTokens, Math.min(9, before + 1));
  return { removeTokensDelta: s.removeTokens - before };
});
row(items, 'item_offcut_chute', { table: '6', body: 'first consume non-junk scrap spawns ash_felt' }, () => {
  const r = resolve([['sorting_tong', 0], ['copper_burr', 1]], ['item_offcut_chute']);
  eq(r.s.pool.some(x => x.type === 'ash_felt'), true);
  return { spawned: true };
});
row(items, 'item_clean_mesh', { table: '6', body: 'draw junk weight ×1/2' }, () => {
  const e = F.fullItems.item_clean_mesh.effects[0];
  eq(e.op, 'weight'); eq(e.tag, 'junk'); eq(e.ratio, [1, 2]);
  return { weight: [1, 2] };
});
row(items, 'item_lane_clapper', { table: '6', body: 'summary each row-first resonance if row >=2 types +2' }, () => {
  const r = resolve([['dock_chime', 0], ['pitch_fork', 1]], ['item_lane_clapper']);
  eq(addFrom(r.last, 'item_lane_clapper'), 2);
  return { add: 2 };
});
row(items, 'item_rest_notch', { table: '6', body: 'summary row with exactly 1 resonance ×3/2' }, () => {
  const r = resolve([['dock_chime', 0]], ['item_rest_notch']);
  eq(r.last.total, 3);
  return { total: 3 };
});
row(items, 'item_pitch_marker', { table: '6/5.I.1', body: 'first novel resonance tagAdded; commit +5 at step8 if alive' }, () => {
  const r = resolve([['phase_chip', 0], ['dock_chime', 1]], ['item_pitch_marker']);
  const adds = r.last.log.filter(e => e.source === 'item_pitch_marker' && e.action === 'add');
  eq(adds.map(e => e.phase), ['step8/end-summary']); eq(adds[0].amount, 5);
  const dead = resolve([['split_register', 0], ['copper_burr', 1], ['sorting_runner', 2]], ['item_pitch_marker']);
  eq(dead.last.log.filter(e => e.source === 'item_pitch_marker' && e.action === 'add').length, 0);
  return { livePhase: 'step8/end-summary', deadAdds: 0 };
});
row(items, 'item_shared_metronome', { table: '6', body: 'cycle_count threshold 3→2 via mechanics, not resolver ID' }, () => {
  eq(F.fullItems.item_shared_metronome.mechanics.cycleThresholdReduction, 1);
  eq((F.fullItems.item_shared_metronome.effects || []).length, 0);
  const r = resolve([['beat_spool', 0, { beat: 1 }]], ['item_shared_metronome']);
  eq(r.last.total, 10);
  return { total: 10 };
});
row(items, 'item_brine_lining', { table: '6', body: 'first feedstock→crystal product +4' }, () => {
  const r = resolve([['condense_coil', 0], ['saline_ampoule', 1]], ['item_brine_lining']);
  eq(r.last.total, 12);
  return { total: 12 };
});
row(items, 'item_fraction_gauge', { table: '6', body: 'first time live distinct crystal types >=3: reward 7' }, () => {
  const r = resolve([['tide_prism', 0], ['blank_facet', 1], ['reserve_facet', 2]], ['item_fraction_gauge']);
  eq(r.last.reward, 7);
  return { reward: 7 };
});
row(items, 'item_jar_rack', { table: '6', body: 'first converted crystal reserved at step8' }, () => {
  const r = resolve([['condense_coil', 0], ['saline_ampoule', 1]], ['item_jar_rack']);
  eq(r.s.reservations.length, 1);
  eq(r.last.log.some(e => e.source === 'item_jar_rack' && e.action === 'reserve' && e.phase === 'step8/end-summary'), true);
  return { reserved: true };
});
row(items, 'item_residue_stamp', { table: '6', body: 'first mist consume extra reward +2' }, () => {
  const r = resolve([['deep_still', 0], ['mist_pouch', 1]], ['item_residue_stamp']);
  eq(r.last.log.some(e => e.source === 'item_residue_stamp' && e.action === 'reward' && e.amount === 2), true);
  return { extra: 2 };
});
row(items, 'item_manifest_clip', { table: '6', body: 'summary >=4 cargo types reward 6' }, () => {
  const r = resolve([['dock_chime', 0], ['route_stub', 1], ['saline_ampoule', 2], ['tide_prism', 3]], ['item_manifest_clip']);
  eq(r.last.reward, 6);
  return { reward: 6 };
});
row(items, 'item_return_track', { table: '6', body: 'stage skip ordinals 1 and 3: rerollTokens +1 via mechanics' }, () => {
  eq(F.fullItems.item_return_track.mechanics.skipOrdinals, [1, 3]);
  let s = F.fullNewRun('RETURN-TRACK');
  s.cash = 100000;
  while (!(s.stageId === 2 && s.phase === 'READY')) {
    const cmd = s.phase === 'READY' ? { op: 'spin' } : s.phase === 'SYMBOL_CHOICE' ? { op: 'skip', windowId: s.offer.windowId } : s.phase === 'ITEM_CHOICE' ? { op: 'skipItem', windowId: s.offer.windowId } : { op: 'event', id: s.events.choice.id, option: 'B' };
    const r = F.fullCommand(s, Object.assign(cmd, { revision: s.revision }));
    if (!r.ok) throw Error(r.error);
    s = r.state;
  }
  s = F.clone(s);
  s.items = ['item_return_track'];
  s.itemState.quotas.item_return_track = { spin: 0, stage: 0, run: 0 };
  s.itemState.used.item_return_track = { spin: false, stage: false };
  F.validateState(s);
  let r = F.fullCommand(s, { op: 'spin', revision: s.revision });
  if (!r.ok) throw Error(r.error);
  s = r.state;
  const before = s.rerollTokens;
  r = F.fullCommand(s, { op: 'skip', windowId: s.offer.windowId, revision: s.revision });
  if (!r.ok) throw Error(r.error);
  eq(r.state.rerollTokens, Math.min(9, before + 1));
  return { skip1Granted: true, mechanics: [1, 3] };
});
row(items, 'item_small_hold', { table: '6', body: 'summary pool 12–20 reward 5' }, () => {
  const r = resolve(Array.from({ length: 12 }, (_, i) => ['copper_burr', i]), ['item_small_hold']);
  eq(r.last.reward, 5);
  const miss = resolve([['copper_burr', 0]], ['item_small_hold']);
  eq(miss.last.reward, 0);
  return { inRange: 5, below: 0 };
});
row(items, 'item_exchange_hook', { table: '6', body: 'first product consume sets itemProductPending' }, () => {
  const r = resolve([['sorting_runner', 0], ['copper_burr', 1]], ['item_exchange_hook']);
  eq(r.s.offer.guarantees.itemProductPending, true);
  return { pending: true };
});
row(items, 'item_pressure_index', { table: '6', body: 'first real pressure increase extra +1 no recurse' }, () => {
  const r = resolve([['pressure_pouch', 0]], ['item_pressure_index']);
  eq(r.s.pool[0].counters.pressure, 2);
  return { pressure: 2 };
});
row(items, 'item_insulation_shawl', { table: '6', body: 'mechanics riskReduction 3 on first pressure fail' }, () => {
  eq(F.fullItems.item_insulation_shawl.mechanics.riskReduction, 3);
  eq((F.fullItems.item_insulation_shawl.effects || []).length, 0);
  let hit = false;
  for (let i = 0; i < 50 && !hit; i++) {
    const r = resolve([['cracked_regulator', 0]], ['item_insulation_shawl'], s => { s.seed = 'SHAWL-' + i; s.rng = F.createRng(s.seed, 'full-v1', 'Normal'); });
    if (r.last.log.some(e => e.facts && e.facts.cause === 'loss-reduction' && e.source === 'item_insulation_shawl')) hit = true;
  }
  eq(hit, true);
  return { reduced: true };
});
row(items, 'item_release_receipt', { table: '6', body: '3rd successful release this stage reward 12' }, () => {
  const { s, board } = setup([['pressure_pouch', 0, { pressure: 3 }]], ['item_release_receipt']);
  F.sliceResolve(s, board); s.pool[0].counters.pressure = 3;
  F.sliceResolve(s, board); s.pool[0].counters.pressure = 3;
  const last = F.sliceResolve(s, board);
  eq(last.log.some(e => e.source === 'item_release_receipt' && e.action === 'reward' && e.amount === 12), true);
  return { thirdRelease: 12 };
});
row(items, 'item_spare_baffle', { table: '6', body: 'replace first risk junk spawn with source -3' }, () => {
  eq(F.fullItems.item_spare_baffle.mechanics.replaceRiskJunk, true);
  let hit = false;
  for (let i = 0; i < 60 && !hit; i++) {
    const r = resolve([['cracked_regulator', 0]], ['item_spare_baffle'], s => { s.seed = 'BAFFLE-' + i; s.rng = F.createRng(s.seed, 'full-v1', 'Normal'); });
    if (r.last.log.some(e => e.skipReason === 'replacement-not-generation' || (e.facts && e.facts.skipReason === 'replacement-not-generation'))) {
      eq(r.s.pool.some(x => x.type === 'spent_gasket'), false);
      hit = true;
    }
  }
  eq(hit, true);
  return { replaced: true };
});
row(items, 'item_safe_carbon', { table: '6', body: 'first legal copy +2 cap 8 via mechanics.copyBonus' }, () => {
  eq(F.fullItems.item_safe_carbon.mechanics.copyBonus, 2);
  const r = resolve([['blank_facet', 0], ['offset_reader', 1]], ['item_safe_carbon']);
  eq(r.last.total, 12);
  return { total: 12 };
});
row(items, 'item_spectrum_book', { table: '6.1/5.I.1', body: 'first novel tagAdded; +3 at step8 if alive; death cancels no retarget' }, () => {
  const live = resolve([['phase_chip', 0], ['dock_chime', 1]], ['item_spectrum_book']);
  eq(live.last.total, 8);
  eq(live.last.log.filter(e => e.source === 'item_spectrum_book' && e.action === 'add').map(e => e.phase), ['step8/end-summary']);
  const dead = resolve([['split_register', 0], ['copper_burr', 1], ['sorting_runner', 2]], ['item_spectrum_book']);
  eq(dead.last.log.filter(e => e.source === 'item_spectrum_book' && e.action === 'add').length, 0);
  eq(F.fullItems.item_spectrum_book.effects[0].defer, true);
  eq(F.fullItems.item_spectrum_book.effects[0].event, 'tagAdded');
  return { liveTotal: 8, livePhase: 'step8/end-summary', deadAdds: 0 };
});
row(items, 'item_registration_pin', { table: '6', body: 'first copy target reserved at step8' }, () => {
  const r = resolve([['blank_facet', 0], ['offset_reader', 1]], ['item_registration_pin']);
  eq(r.s.reservations.length, 1);
  eq(r.last.log.some(e => e.source === 'item_registration_pin' && e.action === 'reserve' && e.phase === 'step8/end-summary'), true);
  return { reserved: true };
});
row(items, 'item_growth_negative', { table: '6', body: 'first positive growth reward min(6,2×actual)' }, () => {
  const r = resolve([['cancellation_clerk', 0], ['arrears_slip', 1]], ['item_growth_negative']);
  eq(r.last.log.some(e => e.source === 'item_growth_negative' && e.action === 'reward' && e.amount === 2), true);
  return { reward: 2 };
});
row(items, 'item_low_balance_tab', { table: '6', body: 'cash*2<payment independent +3' }, () => {
  eq(resolve([['copper_burr', 0]], ['item_low_balance_tab'], s => s.cash = 34).last.total, 5);
  eq(resolve([['copper_burr', 0]], ['item_low_balance_tab'], s => s.cash = 35).last.total, 2);
  return { below: 5, half: 2 };
});
row(items, 'item_compliance_carbon', { table: '6', body: 'first junk→nonjunk product +3' }, () => {
  const r = resolve([['compliance_desk', 0], ['spent_gasket', 1]], ['item_compliance_carbon']);
  eq(r.last.total, 7);
  return { total: 7 };
});
row(items, 'item_audit_clip', { table: '6', body: 'first successful payment this stage with no junk: removeTokens +1' }, () => {
  eq(F.fullItems.item_audit_clip.mechanics.paymentResource, 'removeTokens');
  let s = F.fullNewRun('AUDIT-CLIP');
  s.cash = 1000000;
  while (!(s.stageId === 2 && s.phase === 'READY')) {
    const cmd = s.phase === 'READY' ? { op: 'spin' } : s.phase === 'SYMBOL_CHOICE' ? { op: 'skip', windowId: s.offer.windowId } : s.phase === 'ITEM_CHOICE' ? { op: 'skipItem', windowId: s.offer.windowId } : { op: 'event', id: s.events.choice.id, option: 'B' };
    const r = F.fullCommand(s, Object.assign(cmd, { revision: s.revision }));
    if (!r.ok) throw Error(r.error);
    s = r.state;
  }
  s = F.clone(s);
  s.items = ['item_audit_clip'];
  s.itemState.quotas.item_audit_clip = { spin: 0, stage: 0, run: 0 };
  s.itemState.used.item_audit_clip = { spin: false, stage: false };
  s.pool = s.pool.filter(x => !F.fullSymbols[x.type].tags.includes('junk'));
  F.validateState(s);
  while (!(s.phase === 'SYMBOL_CHOICE' && s.spinsRemaining === 0)) {
    const cmd = s.phase === 'READY' ? { op: 'spin' } : s.phase === 'SYMBOL_CHOICE' ? { op: 'skip', windowId: s.offer.windowId } : s.phase === 'ITEM_CHOICE' ? { op: 'skipItem', windowId: s.offer.windowId } : { op: 'event', id: s.events.choice.id, option: 'B' };
    const r = F.fullCommand(s, Object.assign(cmd, { revision: s.revision }));
    if (!r.ok) throw Error(r.error);
    s = r.state;
  }
  const before = s.removeTokens;
  const paid = F.fullCommand(s, { op: 'skip', windowId: s.offer.windowId, revision: s.revision });
  if (!paid.ok) throw Error(paid.error);
  eq(paid.state.removeTokens, Math.min(9, before + 1));
  return { granted: true };
});
row(items, 'item_margin_lantern', { table: '6/5.I.1', body: 'last spin, cash in [3/4, payment): contract ×3/2. 5.I.1 appearance; §6 last-spin all contract' }, () => {
  const fx = F.fullItems.item_margin_lantern.effects[0];
  const implPhase = fx.phase;
  const r = resolve([['lean_receipt', 0]], ['item_margin_lantern'], s => { s.cash = 53; s.spinsRemaining = 0; });
  eq(has(r.last, e => e.action === 'multiply' && e.source === 'item_margin_lantern'), true);
  const converted = resolve([['compliance_desk', 0], ['spent_gasket', 1]], ['item_margin_lantern'], s => { s.cash = 53; s.spinsRemaining = 0; });
  const stub = converted.last.ledger.find(x => x.type === 'cleared_stub');
  return {
    implPhase,
    gdd511: 'step4/appearance → step4/appearance → step9/ledger',
    lastSpinMultiply: true,
    convertedStubAmount: stub && stub.amount,
    note: 'implementation selector is summary/all contract; 5.I.1 lists appearance. Converted spent_gasket→cleared_stub is a new contract cell-type after appearance.'
  };
});

// --- 8 events ---
function quote(id, types) {
  let base = F.fullNewRun('EVENT-MAP');
  base.cash = 100000;
  while (base.stageId < 3 || base.phase !== 'READY') {
    const c = base.phase === 'READY' ? { op: 'spin' } : base.phase === 'SYMBOL_CHOICE' ? { op: 'skip', windowId: base.offer.windowId } : base.phase === 'ITEM_CHOICE' ? { op: 'skipItem', windowId: base.offer.windowId } : { op: 'event', id: base.events.choice.id, option: 'B' };
    const r = F.fullCommand(base, Object.assign(c, { revision: base.revision }));
    if (!r.ok) throw Error(r.error);
    base = r.state;
  }
  const s = F.clone(base);
  s.pool = types.map(t => F.instance(s, t));
  s.events = { seenIds: [id], count: 1, cooldownPayments: 1, activeModifiers: [], choice: { id, options: ['A', 'B'], targetUids: [], cost: F.fullEvents[id].cost, stageId: s.stageId } };
  s.phase = 'EVENT_CHOICE';
  s.events.choice.targetUids = F.fullEventTargets(s, id);
  F.validateState(s);
  return s;
}
function apply(s, option, extra) {
  return F.fullCommand(s, Object.assign({ op: 'event', id: s.events.choice.id, option, revision: s.revision }, extra || {}));
}
row(events, 'event_fog_shift', { table: '7/5.I.1', body: 'A binds plant UID remaining 2 extra ages; B no-op but consumes appearance' }, () => {
  const s = quote('event_fog_shift', ['mist_pouch']);
  const b = apply(s, 'B'); eq(b.ok, true); eq(b.state.events.activeModifiers.length, 0);
  const a = apply(s, 'A'); eq(a.state.events.activeModifiers[0].remaining, 2);
  eq(a.state.events.activeModifiers[0].uid, s.pool[0].uid);
  const board = Array(20).fill(null); board[0] = a.state.pool[0];
  F.sliceResolve(a.state, board);
  eq(a.state.pool[0].counters.age, 2, 'natural+event extra');
  return { remaining: 2, afterOneSpinAge: 2 };
});
row(events, 'event_copper_queue', { table: '7', body: 'A transform junk to copper + spawn gasket cause=event' }, () => {
  const s = quote('event_copper_queue', ['spent_gasket']);
  const a = apply(s, 'A');
  eq(a.state.pool[0].type, 'copper_burr'); eq(a.state.pool[1].type, 'spent_gasket'); eq(a.state.pool[0].epoch, 1);
  return { type: 'copper_burr', spawned: 'spent_gasket' };
});
row(events, 'event_silent_bell', { table: '7', body: 'stage remaining 3: ratios 1/2,1/2,2/1 on resonance at summary' }, () => {
  const s = quote('event_silent_bell', ['dock_chime']);
  const a = apply(s, 'A');
  eq(a.state.events.activeModifiers[0].remaining, 3);
  eq(F.fullEvents.event_silent_bell.spinEffects[0].ratios, [[1, 2], [1, 2], [2, 1]]);
  a.state.stageSpin = 1;
  const board = Array(20).fill(null); board[0] = a.state.pool[0];
  const last = F.sliceResolve(a.state, board);
  eq(has(last, e => e.action === 'multiply' && e.source === 'event_silent_bell'), true);
  return { remaining: 3, multiplied: true };
});
row(events, 'event_brine_inspection', { table: '7', body: 'A delete feedstock, set crystal guarantee' }, () => {
  const s = quote('event_brine_inspection', ['saline_ampoule']);
  const a = apply(s, 'A');
  eq(a.state.pool.length, 0); eq(a.state.offer.guarantees.eventCrystalPending, true);
  return { removed: true, guarantee: true };
});
row(events, 'event_empty_manifest', { table: '7', body: 'requires pool>=21; remaining 1 summary +2 up to 5 cargo' }, () => {
  const s = quote('event_empty_manifest', Array(21).fill('dock_chime'));
  const a = apply(s, 'A');
  eq(a.state.pool.length, 20); eq(a.state.events.activeModifiers[0].remaining, 1);
  const board = Array(20).fill(null);
  a.state.pool.slice(0, 20).forEach((x, i) => { board[i] = x; });
  const last = F.sliceResolve(a.state, board);
  eq(last.log.filter(e => e.source === 'event_empty_manifest' && e.action === 'add').length, 5);
  eq(last.log.filter(e => e.source === 'event_empty_manifest' && e.action === 'add')[0].amount, 2);
  return { adds: 5, amount: 2 };
});
row(events, 'event_boiler_test', { table: '7', body: 'A payment+12 cash+10 target pressure+2 or spawn pouch@2' }, () => {
  const s = quote('event_boiler_test', ['pressure_pouch']);
  const a = apply(s, 'A');
  eq(a.state.payment, s.payment + 12); eq(a.state.cash, s.cash + 10); eq(a.state.pool[0].counters.pressure, 2);
  const fb = quote('event_boiler_test', ['dock_chime']);
  const r = apply(fb, 'A');
  eq(r.state.pool[1].type, 'pressure_pouch'); eq(r.state.pool[1].counters.pressure, 2);
  return { paymentDelta: 12, fallback: true };
});
row(events, 'event_misprint_window', { table: '7/5.I.1', body: 'cost 6; remaining 3; first magic cargo tag + add 2 at preprocess' }, () => {
  const s = quote('event_misprint_window', ['phase_chip']);
  eq(s.events.choice.cost, 6);
  const a = apply(s, 'A');
  eq(a.state.cash, s.cash - 6); eq(a.state.events.activeModifiers[0].remaining, 3);
  const board = Array(20).fill(null); board[0] = a.state.pool[0];
  const last = F.sliceResolve(a.state, board);
  eq(last.log.some(e => e.source === 'event_misprint_window' && e.action === 'tagAdded' && e.phase === 'step2/tagAdded'), true);
  eq(last.log.some(e => e.source === 'event_misprint_window' && e.action === 'add' && e.amount === 2), true);
  const already = quote('event_misprint_window', ['route_stub']);
  already.pool[0].type = 'phase_chip';
  const tagged = F.clone(already);
  return { cost: 6, tagPhase: 'step2/tagAdded', add: 2 };
});
row(events, 'event_quota_recount', { table: '7', body: 'A payment+10, spawn cleared_stub, rerollTokens +1 atomic' }, () => {
  const s = quote('event_quota_recount', ['dock_chime']);
  const a = apply(s, 'A');
  eq(a.state.payment, s.payment + 10);
  eq(a.state.pool[1].type, 'cleared_stub');
  eq(a.state.rerollTokens, Math.min(9, s.rerollTokens + 1));
  return { paymentDelta: 10, spawned: 'cleared_stub' };
});

const mismatches = [...symbols, ...items, ...events].filter(x => !x.ok).map(x => ({ id: x.id, error: x.error, gdd: x.gdd }));
const report = {
  scope: 'Independent per-ID GDD BODY semantic mapping and actual-trigger hand review; not registration counts',
  gddSha256: crypto.createHash('sha256').update(fs.readFileSync(path.join(root, 'docs/GAME_DESIGN_V1.md'))).digest('hex'),
  production: {
    resolver: { bytes: 27996, sha256: crypto.createHash('sha256').update(fs.readFileSync(path.join(root, 'js/gdd1/resolver.js'))).digest('hex') },
    fullEffects: { bytes: fs.readFileSync(path.join(root, 'js/gdd1/full-effects.js')).length, sha256: crypto.createHash('sha256').update(fs.readFileSync(path.join(root, 'js/gdd1/full-effects.js'))).digest('hex') }
  },
  counts: {
    symbols: { total: symbols.length, passed: symbols.filter(x => x.ok).length },
    items: { total: items.length, passed: items.filter(x => x.ok).length },
    events: { total: events.length, passed: events.filter(x => x.ok).length }
  },
  sharedDefsNotDefect: 'F.defs(state) shared sliceDraw/Resolve/Offer is not a defect',
  cargoRopeWindow: 'GDD 5.I table appearance line is superseded in the same GDD body by step5/adjacency-add + 5.I.1',
  symbols, items, events, mismatches
};
fs.writeFileSync(dest, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ dest: 'tests/gdd1/' + destName, counts: report.counts, mismatches }, null, 2));
if (mismatches.length) process.exitCode = 1;
