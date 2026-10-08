'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');

const destArg = process.argv[2];
if (!destArg) throw Error('argv dest required');
const dest = path.resolve(destArg);
if (fs.existsSync(dest)) throw Error('Refuse existing output ' + dest);

const root = path.join(__dirname, '../..');
const ctx = { console };
ctx.globalThis = ctx;
vm.createContext(ctx);
for (const f of ['contract', 'rng', 'schema', 'save', 'content', 'full-content', 'full-effects', 'offers', 'resolver', 'full-controller']) {
  vm.runInContext(fs.readFileSync(path.join(root, 'js/gdd1', f + '.js'), 'utf8'), ctx);
}
const F = ctx.GDD1;

function sha(rel) {
  const buf = fs.readFileSync(path.join(root, rel));
  return { path: rel.replace(/\\/g, '/'), bytes: buf.length, sha256: crypto.createHash('sha256').update(buf).digest('hex') };
}

const canon = {
  preprocess: 'step2/tagAdded', step2: 'step2/tagAdded',
  step3: 'step3/age', age: 'step3/age', 'age-extra': 'step3/age',
  appearance: 'step4/appearance', initial: 'step4/appearance', step4: 'step4/appearance',
  'pressure-injection': 'step4/pressure-injection',
  risk: 'step4/risk', copy: 'step4/copy',
  'adjacency-add': 'step5/adjacency-add', structure: 'step5/structural-event', step5: 'step5/structural-event',
  listen: 'step6/lifecycle', end: 'step6/lifecycle', change: 'step6/lifecycle', step6: 'step6/lifecycle',
  step7: 'step7/pressure',
  summary: 'step8/end-summary', step8: 'step8/end-summary',
  step1: 'step1/draw', commit: 'choice/commit'
};

function canonPhase(p) { return canon[p] || p; }

const gddSymbol = {
  phase_chip: ['step2/tagAdded'], transit_seal: ['step2/tagAdded'], split_register: ['step2/tagAdded'], alignment_cloth: ['step2/tagAdded'],
  mist_pouch: ['step3/age'], dew_lantern: ['step3/age'], brine_strip: ['step3/age'], cloudy_negative: ['step3/age'], fog_stitcher: ['step3/age'],
  wick_bed: ['step4/appearance'], warm_pod: ['step4/appearance'], dock_chime: ['step4/appearance'], fog_reed: ['step4/appearance'],
  beat_spool: ['step4/appearance'], chord_frame: ['step4/appearance'], prism_hum: ['step4/appearance'], silence_keeper: ['step4/appearance'],
  saline_ampoule: ['step4/appearance'], crystal_index: ['step4/appearance'], route_stub: ['step4/appearance'], parcel_cage: ['step4/appearance'],
  manifest_desk: ['step4/appearance'], pause_dial: ['step4/appearance'], demand_coupler: ['step4/appearance'], spectrum_pin: ['step4/appearance'],
  blank_facet: ['step4/appearance'], arrears_slip: ['step4/appearance'], lean_receipt: ['step4/appearance'], cleared_stub: ['step4/appearance'],
  quota_margin: ['step4/appearance'], harbor_conductor: ['step4/appearance'], copper_burr: ['step4/appearance'],
  pressure_pouch: ['step4/pressure-injection', 'step7/pressure'], surge_vessel: ['step4/pressure-injection', 'step7/pressure'],
  cracked_regulator: ['step4/risk'], safety_shim: ['step4/risk'],
  offset_reader: ['step4/copy'], advance_stamp: ['step4/copy', 'step4/appearance'],
  pitch_fork: ['step5/adjacency-add'], cargo_rope: ['step5/adjacency-add'],
  sorting_tong: ['step5/structural-event'], sieve_drum: ['step5/structural-event'],
  clinker_router: ['step5/structural-event', 'step6/lifecycle'],
  condense_coil: ['step5/structural-event'], deep_still: ['step5/structural-event'], pearl_separator: ['step5/structural-event'],
  sorting_runner: ['step5/structural-event'],
  reserve_facet: ['step5/structural-event', 'step6/pressure-injection', 'step7/pressure'],
  feed_valve: ['step5/structural-event'], compliance_desk: ['step5/structural-event'], cancellation_clerk: ['step5/structural-event'],
  ash_felt: ['step6/lifecycle'], amber_frond: ['step6/lifecycle'], root_ledger: ['step6/lifecycle'], heat_clerk: ['step6/lifecycle'],
  tide_prism: ['step6/lifecycle'], echo_plate: ['step6/lifecycle'],
  release_spire: ['step7/pressure'],
  nursery_gauge: ['step8/end-summary'], furnace_auditor: ['step8/end-summary'], switch_lamp: ['step8/end-summary'],
  return_station: ['step8/end-summary'], settlement_beacon: ['step8/end-summary'],
  spent_gasket: ['base-only']
};

const gddItem = {
  item_dew_calendar: { a: 'step3/age', s: 'step3/age', c: 'step3/age' },
  item_root_wrap: { a: 'step3/age', s: 'step3/age', c: 'step3/age' },
  item_nursery_scale: { a: 'step1/draw', s: 'step1/draw', c: 'step1/draw' },
  item_frost_glass: { a: 'step4/appearance', s: 'step4/appearance', c: 'step9/ledger' },
  item_sorting_apron: { a: 'step5/structural-event', s: 'step5/structural-event', c: 'step6/lifecycle' },
  item_waste_log: { a: 'step6/lifecycle', s: 'step6/lifecycle', c: 'choice/commit' },
  item_offcut_chute: { a: 'step5/structural-event', s: 'step5/structural-event', c: 'step5/structural-event' },
  item_clean_mesh: { a: 'step1/draw', s: 'step1/draw', c: 'step1/draw' },
  item_lane_clapper: { a: 'step8/end-summary', s: 'step8/end-summary', c: 'step9/ledger' },
  item_rest_notch: { a: 'step8/end-summary', s: 'step8/end-summary', c: 'step9/ledger' },
  item_pitch_marker: { a: 'step2/tagAdded', s: 'step2/tagAdded', c: 'step8/end-summary' },
  item_shared_metronome: { a: 'step1/draw', s: 'step1/draw', c: 'step1/draw' },
  item_brine_lining: { a: 'step5/structural-event', s: 'step5/structural-event', c: 'step9/ledger' },
  item_fraction_gauge: { a: 'step1/draw', s: 'step1/draw', c: 'step1/draw' },
  item_jar_rack: { a: 'step5/structural-event', s: 'step5/structural-event', c: 'step8/end-summary' },
  item_residue_stamp: { a: 'step5/structural-event', s: 'step5/structural-event', c: 'step6/lifecycle' },
  item_manifest_clip: { a: 'step8/end-summary', s: 'step8/end-summary', c: 'step9/ledger' },
  item_return_track: { a: 'choice/commit', s: 'choice/commit', c: 'choice/commit' },
  item_small_hold: { a: 'step8/end-summary', s: 'step8/end-summary', c: 'step9/ledger' },
  item_exchange_hook: { a: 'step5/structural-event', s: 'step5/structural-event', c: 'choice/commit' },
  item_pressure_index: { a: 'step4/pressure-injection', s: 'step5/structural-event', c: 'step6/pressure-injection' },
  item_insulation_shawl: { a: 'step4/risk', s: 'step4/risk', c: 'step4/risk' },
  item_release_receipt: { a: 'step7/pressure', s: 'step7/pressure', c: 'step7/pressure' },
  item_spare_baffle: { a: 'step4/risk', s: 'step4/risk', c: 'step4/risk' },
  item_safe_carbon: { a: 'step4/copy', s: 'step4/copy', c: 'step9/ledger' },
  item_spectrum_book: { a: 'step2/tagAdded', s: 'step2/tagAdded', c: 'step8/end-summary' },
  item_registration_pin: { a: 'step4/copy', s: 'step4/copy', c: 'step8/end-summary' },
  item_growth_negative: { a: 'step6/lifecycle', s: 'step6/lifecycle', c: 'step6/lifecycle' },
  item_low_balance_tab: { a: 'step4/appearance', s: 'step4/appearance', c: 'step9/ledger' },
  item_compliance_carbon: { a: 'step5/structural-event', s: 'step5/structural-event', c: 'step9/ledger' },
  item_audit_clip: { a: 'choice/commit', s: 'choice/commit', c: 'choice/commit' },
  item_margin_lantern: { a: 'step4/appearance', s: 'step4/appearance', c: 'step9/ledger' }
};

const gddEvent = {
  event_fog_shift: { a: 'choice/commit', s: 'step3/age', c: 'step3/age' },
  event_copper_queue: { a: 'choice/commit', s: 'choice/commit', c: 'choice/commit' },
  event_boiler_test: { a: 'choice/commit', s: 'choice/commit', c: 'choice/commit' },
  event_silent_bell: { a: 'choice/commit', s: 'step4/appearance', c: 'step9/ledger' },
  event_brine_inspection: { a: 'choice/commit', s: 'choice/commit', c: 'choice/commit' },
  event_empty_manifest: { a: 'choice/commit', s: 'step8/end-summary', c: 'step9/ledger' },
  event_misprint_window: { a: 'choice/commit', s: 'step2/tagAdded', c: 'step9/ledger' },
  event_quota_recount: { a: 'choice/commit', s: 'choice/commit', c: 'choice/commit' }
};

function slimEffect(e) {
  return {
    phase: e.phase,
    canon: canonPhase(e.phase),
    op: e.op,
    defer: !!e.defer,
    lockFirst: !!e.lockFirst,
    listen: e.phase === 'listen',
    event: e.event || null,
    eventTarget: !!e.eventTarget,
    selector: e.selector || null,
    amount: e.amount === undefined ? null : e.amount
  };
}

function engineSymbolWindows(d) {
  const set = new Set();
  const notes = [];
  for (const e of d.effects || []) {
    set.add(canonPhase(e.phase));
    if (e.defer) { set.add('step8/end-summary'); notes.push('defer-commit-step8'); }
    if (e.op === 'pressure' || e.op === 'release') set.add('step7/pressure');
  }
  const m = d.mechanics || {};
  if (m.age) set.add('step3/age');
  if (m.pressure) set.add('step7/pressure');
  if (m.riskMitigation) { set.add('step4/risk'); notes.push('mechanics.riskMitigation'); }
  if (m.candidate === false && !(d.effects || []).length) notes.push('candidate-false');
  if (!(d.effects || []).length && !m.age && !m.pressure && !m.riskMitigation) {
    if ((gddSymbol[d.id] || []).includes('step4/appearance')) set.add('step4/appearance');
    else set.add('base-only');
  }
  return { set, notes };
}

function classifySymbol(id, d) {
  const gdd = gddSymbol[id] || [];
  const { set, notes } = engineSymbolWindows(d);
  const missing = gdd.filter(p => !set.has(p));
  const equivalent = [];
  for (const p of missing.slice()) {
    if (p === 'step4/copy' && set.has('step4/appearance') && (d.effects || []).some(e => e.op === 'advance')) {
      equivalent.push('advance-qualification-at-step4-snapshot');
      missing.splice(missing.indexOf(p), 1);
    } else if (p === 'step6/pressure-injection' && (d.effects || []).some(e => e.op === 'consume' && e.pressure)) {
      equivalent.push('structural-pressure-on-parent-success');
      missing.splice(missing.indexOf(p), 1);
    } else if (p === 'step8/end-summary' && (d.effects || []).some(e => e.defer)) {
      equivalent.push('deferred-commit-step8');
      missing.splice(missing.indexOf(p), 1);
    }
  }
  let alignment = 'MATCH';
  if (equivalent.length && !missing.length) alignment = 'EQUIVALENT';
  if (missing.length) alignment = 'MISMATCH';
  return { gdd, engine: [...set], notes, equivalent, missing, alignment };
}

function classifyItem(id, d) {
  const gdd = gddItem[id];
  const effects = (d.effects || []).map(slimEffect);
  const m = d.mechanics || {};
  const fx = effects[0];
  const notes = [];
  let alignment = 'MATCH';
  const equivalent = [];
  const missing = [];
  if (!gdd) return { gdd: null, effects, mechanics: m, alignment: 'MISMATCH', missing: ['no-gdd'], equivalent, notes };
  if (id === 'item_spectrum_book') {
    const ok = !!(fx && fx.op === 'add' && fx.event === 'tagAdded' && fx.eventTarget && fx.defer && fx.amount === 3);
    alignment = ok ? 'EQUIVALENT' : 'MISMATCH';
    equivalent.push('listen-tagAdded-lock-step2-defer-commit-step8');
    if (!ok) missing.push('book-contract');
    return { gdd, effects, mechanics: m, alignment, equivalent, missing, notes };
  }
  if (id === 'item_pitch_marker') {
    const ok = !!(fx && fx.op === 'add' && fx.event === 'tagAdded' && fx.defer && fx.amount === 5);
    alignment = ok ? 'EQUIVALENT' : 'MISMATCH';
    equivalent.push('listen-tagAdded-defer-step8');
    if (!ok) missing.push('pitch-marker-contract');
    return { gdd, effects, mechanics: m, alignment, equivalent, missing, notes };
  }
  if (!fx) {
    if (m.cycleThresholdReduction) { equivalent.push('mechanics.cycleThresholdReduction=step1'); notes.push('empty-effects'); }
    else if (m.skipOrdinals) { equivalent.push('mechanics.skipOrdinals=choice/commit'); notes.push('empty-effects'); }
    else if (m.paymentResource) { equivalent.push('mechanics.paymentResource=choice/commit'); notes.push('empty-effects'); }
    else if (m.copyBonus) { equivalent.push('mechanics.copyBonus=step4/copy'); notes.push('empty-effects'); }
    else if (m.riskReduction) { equivalent.push('mechanics.riskReduction=step4/risk'); notes.push('empty-effects'); }
    else if (m.replaceRiskJunk) { equivalent.push('mechanics.replaceRiskJunk=step4/risk'); notes.push('empty-effects'); }
    else missing.push('no-effect-no-mechanics');
    alignment = missing.length ? 'MISMATCH' : 'EQUIVALENT';
    return { gdd, effects, mechanics: m, alignment, equivalent, missing, notes };
  }
  const act = fx.canon;
  if (gdd.a === 'step4/appearance' && act === 'step8/end-summary') {
    alignment = 'MISMATCH';
    missing.push('GDD-appearance-vs-engine-summary');
  } else if (gdd.a === 'step1/draw' && fx.phase === 'change') {
    alignment = 'EQUIVALENT';
    equivalent.push('change-listener-covers-step1-and-later-mutations');
  } else if (gdd.a === 'step4/pressure-injection' && fx.listen && fx.event === 'pressureIncrease') {
    alignment = 'EQUIVALENT';
    equivalent.push('listen-pressureIncrease-covers-steps-4-6');
  } else if (gdd.a === 'step7/pressure' && fx.listen && fx.event === 'release') {
    alignment = 'EQUIVALENT';
    equivalent.push('listen-release');
  } else if (fx.listen && fx.defer && gdd.c === 'step8/end-summary') {
    alignment = 'EQUIVALENT';
    equivalent.push('listen-defer-step8');
  } else if (fx.listen && (gdd.a.startsWith('step5') || gdd.a.startsWith('step6') || gdd.a === 'step3/age')) {
    alignment = 'EQUIVALENT';
    equivalent.push('listen-on-parent-success-immediate');
  } else if (act === gdd.a || act === gdd.c || (gdd.c === 'step9/ledger' && (act === gdd.a || act === 'step8/end-summary' || act === 'step4/appearance'))) {
    alignment = 'MATCH';
  } else if (fx.op === 'weight' && gdd.a === 'step1/draw') {
    alignment = 'MATCH';
  } else {
    alignment = 'EQUIVALENT';
    equivalent.push('engine-' + act + '-vs-gdd-' + gdd.a);
  }
  return { gdd, effects, mechanics: m, alignment, equivalent, missing, notes };
}

function classifyEvent(id, d) {
  const gdd = gddEvent[id];
  const spin = (d.spinEffects || []).map(slimEffect);
  const missing = [];
  const equivalent = [];
  let alignment = 'MATCH';
  if (!d || !gdd) alignment = 'MISMATCH';
  else if (id === 'event_silent_bell') {
    const fx = spin[0];
    if (fx && fx.canon === 'step8/end-summary') {
      alignment = 'MISMATCH';
      missing.push('GDD-step4-appearance-vs-engine-summary-multiply');
    }
  } else if (id === 'event_fog_shift' && !(d.spinEffects || []).length) {
    alignment = 'EQUIVALENT';
    equivalent.push('modifier-remaining-consumed-at-step3-age');
  } else if (gdd.s === 'step8/end-summary' && spin.some(e => e.canon === 'step8/end-summary')) alignment = 'MATCH';
  else if (gdd.s === 'step2/tagAdded' && spin.some(e => e.canon === 'step2/tagAdded')) alignment = 'MATCH';
  else if (gdd.a === 'choice/commit' && gdd.c === 'choice/commit') alignment = 'MATCH';
  return { gdd, op: d && d.op, cost: d && d.cost, remaining: d && d.remaining, spinEffects: spin, alignment, equivalent, missing };
}

const mismatches = [];
const symbols = [];
for (const id of F.SYMBOL_IDS) {
  const d = F.fullSymbols[id];
  const row = { id, name: d && d.name, base: d && d.base, tags: d && d.tags, effects: (d.effects || []).map(slimEffect), mechanics: d && d.mechanics || {}, map: classifySymbol(id, d) };
  row.mapOk = row.map.alignment !== 'MISMATCH';
  if (row.map.alignment === 'MISMATCH') mismatches.push({ kind: 'symbol-map', id, map: row.map });
  symbols.push(row);
}
const items = [];
for (const id of F.ITEM_IDS) {
  const d = F.fullItems[id];
  const row = { id, name: d && d.name, map: classifyItem(id, d) };
  row.mapOk = row.map.alignment !== 'MISMATCH';
  if (row.map.alignment === 'MISMATCH') mismatches.push({ kind: 'item-map', id, map: row.map });
  items.push(row);
}
const events = [];
for (const id of F.EVENT_IDS) {
  const d = F.fullEvents[id];
  const row = { id, name: d && d.name, map: classifyEvent(id, d) };
  row.mapOk = row.map.alignment !== 'MISMATCH';
  if (row.map.alignment === 'MISMATCH') mismatches.push({ kind: 'event-map', id, map: row.map });
  events.push(row);
}

function fixture(entries, held = [], configure = () => {}) {
  const s = F.fullNewRun('ID-MAP-V1');
  s.pool = [];
  s.nextUid = 1;
  s.spin = 1;
  s.stageSpin = 1;
  s.spinsRemaining = 5;
  s.items = held.slice();
  for (const id of held) {
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
  configure(s, board);
  return { s, board };
}

function resolve(entries, held, configure) {
  const { s, board } = fixture(entries, held, configure);
  const last = F.sliceResolve(s, board);
  return { s, board, last };
}

const failures = [];
const triggers = [];
const covered = { symbol: new Set(), item: new Set(), event: new Set() };

function fail(row, err) {
  row.ok = false;
  row.error = err;
  failures.push({ kind: 'trigger', name: row.name, id: row.id, error: err });
  triggers.push(row);
}

function pass(row) {
  row.ok = true;
  triggers.push(row);
}

function probe(id, kind, name, entries, held, expected, configure) {
  const row = { name, id, kind, expected };
  covered[kind].add(id);
  try {
    const { last, s, board } = resolve(entries, held, configure);
    row.actual = { total: last.total, reward: last.reward, ledger: last.ledger.map(x => x.amount) };
    if (expected.total !== undefined && last.total !== expected.total) throw Error('total expected ' + expected.total + ' actual ' + last.total);
    if (expected.reward !== undefined && last.reward !== expected.reward) throw Error('reward expected ' + expected.reward + ' actual ' + last.reward);
    if (expected.ledger && JSON.stringify(last.ledger.map(x => x.amount)) !== JSON.stringify(expected.ledger)) {
      throw Error('ledger expected ' + JSON.stringify(expected.ledger) + ' actual ' + JSON.stringify(last.ledger.map(x => x.amount)));
    }
    if (expected.type && s.pool[0] && s.pool[0].type !== expected.type && !(board[0] && board[0].type === expected.type)) {
      const got = (s.pool.find(x => x.uid === 'u1') || board[0] || s.pool[0] || {}).type;
      if (got !== expected.type) throw Error('type expected ' + expected.type + ' actual ' + got);
    }
    if (expected.phaseAction) {
      const hit = last.log.some(e => e.action === expected.phaseAction.action && e.phase === expected.phaseAction.phase && (!expected.phaseAction.source || e.source === expected.phaseAction.source));
      if (!hit) throw Error('missing ' + JSON.stringify(expected.phaseAction));
    }
    if (expected.bookPhase) {
      const adds = last.log.filter(e => e.source === 'item_spectrum_book' && e.action === 'add');
      if (JSON.stringify(adds.map(e => e.phase)) !== JSON.stringify(expected.bookPhase)) throw Error('book phases ' + JSON.stringify(adds.map(e => e.phase)));
    }
    if (expected.noBookAdd && last.log.some(e => e.source === 'item_spectrum_book' && e.action === 'add')) throw Error('unexpected book add');
    if (expected.pressure !== undefined) {
      const p = (s.pool[0] && s.pool[0].counters && s.pool[0].counters.pressure);
      if (p !== expected.pressure) throw Error('pressure expected ' + expected.pressure + ' actual ' + p);
    }
    if (expected.reserved) {
      if (!s.reservations.length) throw Error('expected reservation');
    }
    if (expected.guarantee) {
      if (!s.offer.guarantees[expected.guarantee]) throw Error('missing guarantee ' + expected.guarantee);
    }
    if (expected.tagAdded) {
      const got = last.log.filter(e => e.action === 'tagAdded').map(e => e.target);
      if (JSON.stringify(got) !== JSON.stringify(expected.tagAdded)) throw Error('tagAdded ' + JSON.stringify(got));
    }
    pass(row);
  } catch (e) {
    fail(row, e.message);
  }
}

function seedFor(success) {
  for (let i = 0; i < 4000; i++) {
    const seed = 'RISK/' + i;
    const rng = F.createRng(seed, 'full-v1', 'Normal');
    if ((F.random(rng, 'effect') < 0.75) === success) return seed;
  }
  throw Error('no risk seed');
}

probe('wick_bed', 'symbol', 'wick-base2', [['wick_bed', 0]], [], { total: 2, ledger: [2] });
probe('spent_gasket', 'symbol', 'gasket-base-only', [['spent_gasket', 0]], [], { total: -1, ledger: [-1] });
probe('copper_burr', 'symbol', 'copper-isolated', [['copper_burr', 0]], [], { total: 2, ledger: [2] });
probe('copper_burr', 'symbol', 'copper-machine-neighbor', [['copper_burr', 0], ['sieve_drum', 1]], [], { total: 6, ledger: [4, 2] });
probe('blank_facet', 'symbol', 'blank-appearance', [['blank_facet', 0]], [], { total: 5, ledger: [5], phaseAction: { action: 'add', phase: 'step4/appearance' } });
probe('cleared_stub', 'symbol', 'stub-appearance', [['cleared_stub', 0]], [], { total: 4, ledger: [4] });
probe('saline_ampoule', 'symbol', 'ampoule-base', [['saline_ampoule', 0]], [], { total: 2 });
probe('arrears_slip', 'symbol', 'slip-base', [['arrears_slip', 0]], [], { total: -1 });
probe('amber_frond', 'symbol', 'amber-isolated', [['amber_frond', 0]], [], { total: 4 });
probe('tide_prism', 'symbol', 'prism-isolated', [['tide_prism', 0]], [], { total: 4 });
probe('ash_felt', 'symbol', 'ash-isolated-no-mature', [['ash_felt', 0]], [], { total: 1 });
probe('pause_dial', 'symbol', 'pause-alone', [['pause_dial', 0]], [], { total: 3, ledger: [3] });
probe('pause_dial', 'symbol', 'pause-pressure-tag', [['pause_dial', 0], ['safety_shim', 1]], [], { total: 6 });
probe('pressure_pouch', 'symbol', 'pouch-ordinary', [['pressure_pouch', 0]], [], { total: 1, pressure: 1, phaseAction: { action: 'pressureIncrease', phase: 'step4/pressure-injection' } });
probe('pressure_pouch', 'symbol', 'pouch-release', [['pressure_pouch', 0, { pressure: 3 }]], [], { total: 11, reward: 10 });
probe('surge_vessel', 'symbol', 'surge-ordinary-zero', [['surge_vessel', 0]], [], { total: 0, ledger: [0], pressure: 1 });
probe('surge_vessel', 'symbol', 'surge-release', [['surge_vessel', 0, { pressure: 2 }]], [], { total: 16, reward: 16 });
probe('mist_pouch', 'symbol', 'mist-natural-epoch', [['mist_pouch', 0, { age: 2 }]], [], { type: 'dew_lantern', total: 3 });
probe('dew_lantern', 'symbol', 'dew-natural-amber', [['dew_lantern', 0, { age: 1 }]], [], { type: 'amber_frond', total: 4 });
probe('brine_strip', 'symbol', 'brine-to-ampoule', [['brine_strip', 0, { age: 1 }]], [], { type: 'saline_ampoule', total: 2 });
probe('cloudy_negative', 'symbol', 'cloudy-to-blank-no-appearance', [['cloudy_negative', 0, { age: 2 }]], [], { type: 'blank_facet', total: 3, ledger: [3] });
probe('fog_stitcher', 'symbol', 'stitcher-extra-age', [['fog_stitcher', 0], ['mist_pouch', 1, { age: 1 }]], [], { total: 4 });
probe('root_ledger', 'symbol', 'ledger-on-plant-transform', [['root_ledger', 0], ['mist_pouch', 1, { age: 2 }]], [], { total: 5 });
probe('warm_pod', 'symbol', 'pod-fuel-neighbor', [['warm_pod', 0], ['wick_bed', 1]], [], { total: 6 });
probe('nursery_gauge', 'symbol', 'gauge-two-transforms', [['nursery_gauge', 0], ['mist_pouch', 1, { age: 2 }], ['mist_pouch', 2, { age: 2 }]], [], { total: 11 });
probe('sorting_tong', 'symbol', 'tong-consume-ash', [['sorting_tong', 0], ['ash_felt', 1]], [], { total: 7, reward: 6 });
probe('sieve_drum', 'symbol', 'sieve-junk-to-copper', [['sieve_drum', 0], ['spent_gasket', 1]], [], { total: 4 });
probe('heat_clerk', 'symbol', 'clerk-scrap-grow', [['heat_clerk', 0], ['sorting_tong', 1], ['ash_felt', 2]], [], { total: 9 });
probe('clinker_router', 'symbol', 'router-destroy-junk', [['clinker_router', 0], ['spent_gasket', 1]], [], { total: 2 });
probe('furnace_auditor', 'symbol', 'auditor-two-scrap-types', [['sorting_tong', 0], ['ash_felt', 1], ['sorting_tong', 5], ['copper_burr', 6], ['furnace_auditor', 10]], [], { total: 17 });
probe('dock_chime', 'symbol', 'dock-isolated', [['dock_chime', 0]], [], { total: 2 });
probe('pitch_fork', 'symbol', 'fork-one-neighbor', [['pitch_fork', 0], ['dock_chime', 1]], [], { total: 7 });
probe('fog_reed', 'symbol', 'reed-mist-neighbor', [['fog_reed', 0], ['mist_pouch', 1]], [], { total: 5 });
probe('beat_spool', 'symbol', 'spool-third', [['beat_spool', 0, { beat: 2 }]], [], { total: 10 });
probe('chord_frame', 'symbol', 'chord-one-locked-neighbor', [['chord_frame', 0], ['dock_chime', 1], ['fog_reed', 6]], [], { total: 9 });
probe('prism_hum', 'symbol', 'hum-crystal-neighbor', [['prism_hum', 0], ['blank_facet', 1]], [], { total: 11 });
probe('silence_keeper', 'symbol', 'silence-lonely-row', [['silence_keeper', 0]], [], { total: 11 });
probe('harbor_conductor', 'symbol', 'harbor-three-types', [['harbor_conductor', 0], ['dock_chime', 1], ['fog_reed', 2]], [], { total: 14 });
probe('condense_coil', 'symbol', 'coil-feedstock-to-tide', [['condense_coil', 0], ['saline_ampoule', 1]], [], { total: 8 });
probe('deep_still', 'symbol', 'still-consume-mist', [['deep_still', 0], ['mist_pouch', 1]], [], { total: 6, reward: 4 });
probe('crystal_index', 'symbol', 'index-two-crystal-types', [['crystal_index', 0], ['blank_facet', 1]], [], { total: 12 });
probe('pearl_separator', 'symbol', 'pearl-blank-to-tide', [['pearl_separator', 0], ['blank_facet', 1]], [], { total: 11 });
probe('reserve_facet', 'symbol', 'facet-consume-fuel', [['reserve_facet', 0], ['wick_bed', 1]], [], { total: 4, reward: 2, pressure: 2 });
probe('cargo_rope', 'symbol', 'rope-product', [['cargo_rope', 0], ['cleared_stub', 1]], [], { total: 8 });
probe('route_stub', 'symbol', 'stub-three-cargo-types', [['route_stub', 0], ['dock_chime', 1], ['saline_ampoule', 2]], [], { total: 10 });
probe('parcel_cage', 'symbol', 'cage-empty-min4', [['parcel_cage', 0]], [], { total: 5 });
probe('sorting_runner', 'symbol', 'runner-consume-product', [['sorting_runner', 0], ['cleared_stub', 1]], [], { total: 10, reward: 9 });
probe('manifest_desk', 'symbol', 'desk-four-cargo-types', [['manifest_desk', 0], ['dock_chime', 1], ['saline_ampoule', 2], ['tide_prism', 3]], [], { total: 14 });
probe('switch_lamp', 'symbol', 'lamp-reserve-product', [['switch_lamp', 0], ['cleared_stub', 1]], [], { total: 5, reserved: true });
probe('transit_seal', 'symbol', 'seal-isolated-majority-plant', [['transit_seal', 0]], [], { total: 2 });
probe('return_station', 'symbol', 'station-deferred-consume', [['sorting_runner', 0], ['cleared_stub', 1], ['return_station', 5]], [], { total: 20, reward: 17 });
probe('feed_valve', 'symbol', 'valve-consume-fuel', [['feed_valve', 0], ['wick_bed', 1]], [], { total: 4, reward: 3 });
probe('demand_coupler', 'symbol', 'coupler-late-stage', [['demand_coupler', 0]], [], { total: 4 }, s => { s.spinsRemaining = 1; s.cash = 0; });
probe('phase_chip', 'symbol', 'chip-tag-resonance', [['phase_chip', 0], ['dock_chime', 1]], [], { total: 5, phaseAction: { action: 'tagAdded', phase: 'step2/tagAdded' } });
probe('spectrum_pin', 'symbol', 'pin-three-adj-types', [['spectrum_pin', 0], ['wick_bed', 1], ['spent_gasket', 5], ['dock_chime', 6]], [], { total: 8 });
probe('offset_reader', 'symbol', 'reader-copy-blank', [['offset_reader', 0], ['blank_facet', 1]], [], { total: 10 });
probe('alignment_cloth', 'symbol', 'cloth-tagAdded-record-order', [['split_register', 0], ['phase_chip', 1], ['alignment_cloth', 2], ['copper_burr', 6]], [], {
  total: 15, ledger: [2, 2, 1, 10], tagAdded: ['u4', 'u4', 'u2'], phaseAction: { action: 'add', phase: 'step2/tagAdded', source: 'u3' }
});
probe('echo_plate', 'symbol', 'echo-adjacent-grow', [['cancellation_clerk', 0], ['spent_gasket', 1], ['echo_plate', 5]], [], { total: 12 });
probe('split_register', 'symbol', 'split-product-bundle', [['split_register', 0], ['cleared_stub', 1]], [], { total: 8 });
probe('lean_receipt', 'symbol', 'lean-below-half', [['lean_receipt', 0]], [], { total: 5 }, s => { s.cash = 34; });
probe('lean_receipt', 'symbol', 'lean-half', [['lean_receipt', 0]], [], { total: 1 }, s => { s.cash = 35; });
probe('compliance_desk', 'symbol', 'desk-junk-to-stub', [['compliance_desk', 0], ['spent_gasket', 1]], [], { total: 4 });
probe('cancellation_clerk', 'symbol', 'clerk-consume-junk', [['cancellation_clerk', 0], ['arrears_slip', 1]], [], { total: 7, reward: 5 });
probe('quota_margin', 'symbol', 'margin-deficit15', [['quota_margin', 0]], [], { total: 8 }, s => { s.cash = 55; });
probe('quota_margin', 'symbol', 'margin-deficit16', [['quota_margin', 0]], [], { total: 2 }, s => { s.cash = 54; });
probe('advance_stamp', 'symbol', 'stamp-opt-out', [['advance_stamp', 0]], [], { total: 2 });
probe('advance_stamp', 'symbol', 'stamp-opt-in', [['advance_stamp', 0]], [], { total: 20, reward: 18 }, s => { s.settings.advanceAccepted = true; });
probe('settlement_beacon', 'symbol', 'beacon-three-contracts-no-junk', [['lean_receipt', 0], ['quota_margin', 1], ['settlement_beacon', 2]], [], { total: 10 }, s => { s.cash = 35; });
probe('release_spire', 'symbol', 'spire-spend3', [['reserve_facet', 0, { pressure: 3 }], ['release_spire', 1]], [], { total: 17, reward: 8 });

{
  const row = { name: 'regulator-risk-success', id: 'cracked_regulator', kind: 'symbol', expected: { total: 10 } };
  covered.symbol.add('cracked_regulator');
  try {
    const seed = seedFor(true);
    const { last } = resolve([['cracked_regulator', 0]], [], s => { s.seed = seed; s.rng = F.createRng(seed, 'full-v1', 'Normal'); });
    row.actual = { total: last.total };
    if (last.total !== 10) throw Error('total ' + last.total);
    pass(row);
  } catch (e) { fail(row, e.message); }
}
{
  const row = { name: 'shim-risk-fail', id: 'safety_shim', kind: 'symbol', expected: { total: 1 } };
  covered.symbol.add('safety_shim');
  try {
    const seed = seedFor(false);
    const { last } = resolve([['cracked_regulator', 0], ['safety_shim', 1]], [], s => { s.seed = seed; s.rng = F.createRng(seed, 'full-v1', 'Normal'); });
    row.actual = { total: last.total };
    if (last.total !== 1) throw Error('total ' + last.total);
    pass(row);
  } catch (e) { fail(row, e.message); }
}

probe('item_dew_calendar', 'item', 'calendar-extra-age', [['mist_pouch', 0, { age: 1 }]], ['item_dew_calendar'], { type: 'dew_lantern', total: 3 });
probe('item_root_wrap', 'item', 'wrap-on-transform', [['mist_pouch', 0, { age: 2 }]], ['item_root_wrap'], { total: 7 });
probe('item_frost_glass', 'item', 'frost-first-two-mist', [['mist_pouch', 0], ['mist_pouch', 1], ['mist_pouch', 2]], ['item_frost_glass'], { total: 9 });
probe('item_sorting_apron', 'item', 'apron-scrap-reward', [['sorting_tong', 0], ['ash_felt', 1]], ['item_sorting_apron'], { total: 10, reward: 9 });
probe('item_offcut_chute', 'item', 'chute-spawn-ash', [['sorting_tong', 0], ['ash_felt', 1]], ['item_offcut_chute'], { total: 7 });
probe('item_lane_clapper', 'item', 'clapper-two-types', [['dock_chime', 0], ['fog_reed', 1]], ['item_lane_clapper'], { total: 6 });
probe('item_rest_notch', 'item', 'notch-single-resonance', [['dock_chime', 0]], ['item_rest_notch'], { total: 3 });
probe('item_pitch_marker', 'item', 'marker-first-resonance-tag', [['phase_chip', 0], ['dock_chime', 1]], ['item_pitch_marker'], { total: 10 });
probe('item_shared_metronome', 'item', 'metronome-threshold-2', [['beat_spool', 0, { beat: 1 }]], ['item_shared_metronome'], { total: 10 });
probe('item_brine_lining', 'item', 'lining-feedstock-crystal', [['condense_coil', 0], ['saline_ampoule', 1]], ['item_brine_lining'], { total: 12 });
probe('item_fraction_gauge', 'item', 'gauge-three-crystal-types', [['split_register', 0], ['cleared_stub', 1], ['blank_facet', 10], ['prism_hum', 19]], ['item_fraction_gauge'], { total: 22, reward: 7 });
probe('item_jar_rack', 'item', 'rack-reserve-crystal', [['condense_coil', 0], ['saline_ampoule', 1]], ['item_jar_rack'], { total: 8, reserved: true });
probe('item_residue_stamp', 'item', 'stamp-consume-mist', [['deep_still', 0], ['mist_pouch', 1]], ['item_residue_stamp'], { total: 8, reward: 6 });
probe('item_manifest_clip', 'item', 'clip-four-cargo', [['dock_chime', 0], ['route_stub', 1], ['saline_ampoule', 2], ['tide_prism', 3]], ['item_manifest_clip'], { total: 20, reward: 6 });
probe('item_small_hold', 'item', 'hold-pool-12', Array.from({ length: 12 }, (_, i) => ['phase_chip', i]), ['item_small_hold'], { total: 29, reward: 5 });
probe('item_exchange_hook', 'item', 'hook-product-guarantee', [['sorting_runner', 0], ['cleared_stub', 1]], ['item_exchange_hook'], { total: 10, guarantee: 'itemProductPending' });
probe('item_pressure_index', 'item', 'index-extra-pressure', [['pressure_pouch', 0]], ['item_pressure_index'], { total: 1, pressure: 2 });
probe('item_release_receipt', 'item', 'receipt-third-release', [['pressure_pouch', 0, { pressure: 3 }]], ['item_release_receipt'], { total: 11 });
probe('item_safe_carbon', 'item', 'carbon-copy-bonus', [['offset_reader', 0], ['blank_facet', 1]], ['item_safe_carbon'], { total: 12 });
probe('item_spectrum_book', 'item', 'book-step8-commit', [['phase_chip', 0], ['dock_chime', 1]], ['item_spectrum_book'], { total: 8, bookPhase: ['step8/end-summary'] });
probe('item_spectrum_book', 'item', 'book-dead-no-retarget', [['split_register', 0], ['copper_burr', 1], ['sorting_runner', 2]], ['item_spectrum_book'], { noBookAdd: true });
probe('item_registration_pin', 'item', 'pin-reserve-copy-target', [['offset_reader', 0], ['blank_facet', 1]], ['item_registration_pin'], { total: 10, reserved: true });
probe('item_growth_negative', 'item', 'negative-first-grow', [['cancellation_clerk', 0], ['spent_gasket', 1]], ['item_growth_negative'], { total: 9, reward: 7 });
probe('item_low_balance_tab', 'item', 'tab-below-half', [['copper_burr', 0]], ['item_low_balance_tab'], { total: 5 }, s => { s.cash = 34; });
probe('item_low_balance_tab', 'item', 'tab-half', [['copper_burr', 0]], ['item_low_balance_tab'], { total: 2 }, s => { s.cash = 35; });
probe('item_compliance_carbon', 'item', 'carbon-junk-convert', [['compliance_desk', 0], ['spent_gasket', 1]], ['item_compliance_carbon'], { total: 7 });
probe('item_margin_lantern', 'item', 'lantern-last-spin-contract', [['cleared_stub', 0]], ['item_margin_lantern'], { total: 6 }, s => { s.cash = 53; s.spinsRemaining = 0; });

{
  const row = { name: 'receipt-third-stage-window', id: 'item_release_receipt', kind: 'item', expected: { totals: [11, 11, 23, 11] } };
  covered.item.add('item_release_receipt');
  try {
    const { s, board } = fixture([['pressure_pouch', 0, { pressure: 3 }]], ['item_release_receipt']);
    const totals = [];
    for (let i = 0; i < 4; i++) {
      s.pool[0].counters.pressure = 3;
      totals.push(F.sliceResolve(s, board).total);
    }
    row.actual = { totals };
    if (JSON.stringify(totals) !== JSON.stringify([11, 11, 23, 11])) throw Error('totals ' + JSON.stringify(totals));
    pass(row);
  } catch (e) { fail(row, e.message); }
}
{
  const row = { name: 'waste-log-third-destroy', id: 'item_waste_log', kind: 'item', expected: { tokens: [2, 2, 3, 3] } };
  covered.item.add('item_waste_log');
  try {
    const { s, board } = fixture([['clinker_router', 0], ['spent_gasket', 1]], ['item_waste_log']);
    const tokens = [];
    for (let i = 0; i < 4; i++) {
      if (i) {
        const junk = F.instance(s, 'spent_gasket');
        s.pool.push(junk);
        board[1] = junk;
      }
      F.sliceResolve(s, board);
      tokens.push(s.removeTokens);
    }
    row.actual = { tokens, stage: s.itemState.quotas.item_waste_log.stage };
    if (JSON.stringify(tokens) !== JSON.stringify([2, 2, 3, 3])) throw Error('tokens ' + JSON.stringify(tokens));
    pass(row);
  } catch (e) { fail(row, e.message); }
}
{
  const row = { name: 'shawl-risk-fail', id: 'item_insulation_shawl', kind: 'item', expected: { total: -1 } };
  covered.item.add('item_insulation_shawl');
  try {
    const seed = seedFor(false);
    const { last } = resolve([['cracked_regulator', 0]], ['item_insulation_shawl'], s => { s.seed = seed; s.rng = F.createRng(seed, 'full-v1', 'Normal'); });
    row.actual = { total: last.total };
    if (last.total !== -1) throw Error('total ' + last.total);
    pass(row);
  } catch (e) { fail(row, e.message); }
}
{
  const row = { name: 'baffle-replace-junk', id: 'item_spare_baffle', kind: 'item', expected: { total: -7, generated: 0 } };
  covered.item.add('item_spare_baffle');
  try {
    const seed = seedFor(false);
    const { last, s } = resolve([['cracked_regulator', 0]], ['item_spare_baffle'], st => { st.seed = seed; st.rng = F.createRng(seed, 'full-v1', 'Normal'); });
    const generated = s.pool.filter(x => x.type === 'spent_gasket').length;
    row.actual = { total: last.total, generated };
    if (last.total !== -7 || generated !== 0) throw Error('total ' + last.total + ' generated ' + generated);
    pass(row);
  } catch (e) { fail(row, e.message); }
}

function gddWeightedDraw(s, weightOf) {
  const rest = s.pool.slice();
  const selected = [];
  const rng = F.clone(s.rng);
  while (selected.length < 20) {
    const weights = rest.map(weightOf);
    selected.push(rest.splice(F.weightedIndex(weights, rng, 'draw'), 1)[0]);
  }
  const positions = F.shuffle(Array.from({ length: 20 }, (_, i) => i), rng, 'draw');
  const board = Array(20).fill(null);
  selected.forEach((x, i) => { board[positions[i]] = x.uid; });
  return board;
}

{
  const row = { name: 'nursery-scale-gdd-3-2-plant-weight', id: 'item_nursery_scale', kind: 'item' };
  covered.item.add('item_nursery_scale');
  try {
    const types = Array.from({ length: 21 }, (_, i) => (i % 3 === 0 ? 'mist_pouch' : i % 3 === 1 ? 'spent_gasket' : 'phase_chip'));
    const { s } = fixture(types.map((t, i) => [t, i]), ['item_nursery_scale']);
    const expected = gddWeightedDraw(s, x => x.type === 'mist_pouch' ? 1.5 : 1);
    const actual = F.sliceDraw(s).map(x => x ? x.uid : null);
    row.actual = { equal: JSON.stringify(actual) === JSON.stringify(expected) };
    if (!row.actual.equal) throw Error('draw board mismatch vs GDD 3/2 plant weights');
    pass(row);
  } catch (e) { fail(row, e.message); }
}
{
  const row = { name: 'clean-mesh-gdd-1-2-junk-weight', id: 'item_clean_mesh', kind: 'item' };
  covered.item.add('item_clean_mesh');
  try {
    const types = Array.from({ length: 21 }, (_, i) => (i % 3 === 0 ? 'mist_pouch' : i % 3 === 1 ? 'spent_gasket' : 'phase_chip'));
    const { s } = fixture(types.map((t, i) => [t, i]), ['item_clean_mesh']);
    const expected = gddWeightedDraw(s, x => x.type === 'spent_gasket' ? 0.5 : 1);
    const actual = F.sliceDraw(s).map(x => x ? x.uid : null);
    row.actual = { equal: JSON.stringify(actual) === JSON.stringify(expected) };
    if (!row.actual.equal) throw Error('draw board mismatch vs GDD 1/2 junk weights');
    pass(row);
  } catch (e) { fail(row, e.message); }
}

function stage3Ready() {
  let base = F.fullNewRun('ID-MAP-EVENTS');
  base.cash = 100000;
  while (base.stageId < 3 || base.phase !== 'READY') {
    const c = base.phase === 'READY' ? { op: 'spin' }
      : base.phase === 'SYMBOL_CHOICE' ? { op: 'skip', windowId: base.offer.windowId }
        : base.phase === 'ITEM_CHOICE' ? { op: 'skipItem', windowId: base.offer.windowId }
          : { op: 'event', id: base.events.choice.id, option: 'B' };
    const r = F.fullCommand(base, Object.assign(c, { revision: base.revision }));
    if (!r.ok) throw Error('advance ' + base.phase + ' ' + r.error);
    base = r.state;
  }
  return base;
}

function quote(id, types) {
  const s = F.clone(eventBase);
  s.pool = types.map(t => F.instance(s, t));
  s.events = { seenIds: [id], count: 1, cooldownPayments: 1, activeModifiers: [], choice: { id, options: ['A', 'B'], targetUids: [], cost: F.fullEvents[id].cost, stageId: s.stageId } };
  s.phase = 'EVENT_CHOICE';
  s.events.choice.targetUids = F.fullEventTargets(s, id);
  F.validateState(s);
  return s;
}

function applyEvent(s, option) {
  return F.fullCommand(s, { op: 'event', id: s.events.choice.id, option, revision: s.revision, uid: s.events.choice.targetUids[0] || null });
}

let eventBase;
{
  const row = { name: 'event-stage3-ready-fixture', id: 'event_fog_shift', kind: 'event' };
  try {
    eventBase = stage3Ready();
    row.ok = eventBase.phase === 'READY' && eventBase.stageId === 3;
    if (!row.ok) throw Error('stage ' + eventBase.stageId + ' ' + eventBase.phase);
    pass(row);
  } catch (e) { fail(row, e.message); }
}

function eventProbe(id, name, types, check) {
  const row = { name, id, kind: 'event' };
  covered.event.add(id);
  try {
    if (!eventBase) throw Error('no event base');
    const s = quote(id, types);
    const r = applyEvent(s, 'A');
    if (!r.ok) throw Error(r.error);
    check(s, r.state, row);
    pass(row);
  } catch (e) { fail(row, e.message); }
}

eventProbe('event_fog_shift', 'fog-bind-remaining-2', ['mist_pouch'], (before, after, row) => {
  row.expected = { cash: before.cash - 4, remaining: 2, uid: before.pool[0].uid };
  if (after.cash !== before.cash - 4) throw Error('cash');
  if (!after.events.activeModifiers[0] || after.events.activeModifiers[0].remaining !== 2) throw Error('remaining');
  if (after.events.activeModifiers[0].uid !== before.pool[0].uid) throw Error('uid');
});
eventProbe('event_copper_queue', 'copper-queue-transform-plus-gasket', ['spent_gasket'], (before, after, row) => {
  row.expected = { type0: 'copper_burr', type1: 'spent_gasket', pool: before.pool.length + 1 };
  if (after.pool[0].type !== 'copper_burr') throw Error('type ' + after.pool[0].type);
  if (after.pool[1].type !== 'spent_gasket') throw Error('gasket');
  if (after.pool.length !== before.pool.length + 1) throw Error('pool');
});
eventProbe('event_boiler_test', 'boiler-payment-cash-pressure', ['pressure_pouch'], (before, after, row) => {
  row.expected = { payment: before.payment + 12, cash: before.cash + 10, pressure: 2 };
  if (after.payment !== before.payment + 12) throw Error('payment');
  if (after.cash !== before.cash + 10) throw Error('cash');
  if (after.pool[0].counters.pressure !== 2) throw Error('pressure');
});
eventProbe('event_silent_bell', 'silent-bell-first-spin-half', ['dock_chime'], (before, after, row) => {
  row.expected = { remaining: 3, firstTotal: 1 };
  if (!after.events.activeModifiers[0] || after.events.activeModifiers[0].remaining !== 3) throw Error('remaining');
  const spun = F.fullCommand(after, { op: 'spin', revision: after.revision });
  if (!spun.ok) throw Error(spun.error);
  if (spun.state.last.total !== 1) throw Error('first spin ' + spun.state.last.total);
});
eventProbe('event_brine_inspection', 'brine-delete-and-crystal-guarantee', ['saline_ampoule'], (before, after, row) => {
  row.expected = { pool: 0, guarantee: true };
  if (after.pool.length !== 0) throw Error('pool');
  if (!after.offer.guarantees.eventCrystalPending) throw Error('guarantee');
});
eventProbe('event_empty_manifest', 'empty-manifest-first-five-cargo', Array(21).fill('dock_chime'), (before, after, row) => {
  row.expected = { pool: 20, adds: 5 };
  if (after.pool.length !== 20) throw Error('pool');
  const spun = F.fullCommand(after, { op: 'spin', revision: after.revision });
  if (!spun.ok) throw Error(spun.error);
  const adds = spun.state.last.log.filter(e => e.source === 'event_empty_manifest' && e.action === 'add');
  if (adds.length !== 5) throw Error('adds ' + adds.length);
});
eventProbe('event_misprint_window', 'misprint-first-magic-cargo-plus2', ['phase_chip'], (before, after, row) => {
  row.expected = { cash: before.cash - 6, remaining: 3, firstTotal: 4 };
  if (after.cash !== before.cash - 6) throw Error('cash');
  const spun = F.fullCommand(after, { op: 'spin', revision: after.revision });
  if (!spun.ok) throw Error(spun.error);
  if (spun.state.last.total !== 4) throw Error('first spin ' + spun.state.last.total);
});
eventProbe('event_quota_recount', 'quota-stub-reroll', ['dock_chime'], (before, after, row) => {
  row.expected = { payment: before.payment + 10, stub: true, reroll: Math.min(9, before.rerollTokens + 1) };
  if (after.payment !== before.payment + 10) throw Error('payment');
  if (after.pool[1].type !== 'cleared_stub') throw Error('stub');
  if (after.rerollTokens !== Math.min(9, before.rerollTokens + 1)) throw Error('reroll');
});

{
  const row = { name: 'return-track-first-skip', id: 'item_return_track', kind: 'item', expected: { reroll: 3 } };
  covered.item.add('item_return_track');
  try {
    let s = F.clone(eventBase);
    s.items = ['item_return_track'];
    s.itemState.quotas.item_return_track = { spin: 0, stage: 0, run: 0 };
    s.itemState.used.item_return_track = { spin: false, stage: false };
    s.pool = [F.instance(s, 'mist_pouch')];
    s.rerollTokens = 2;
    F.validateState(s);
    let r = F.fullCommand(s, { op: 'spin', revision: s.revision });
    if (!r.ok) throw Error(r.error);
    r = F.fullCommand(r.state, { op: 'skip', windowId: r.state.offer.windowId, revision: r.state.revision });
    if (!r.ok) throw Error(r.error);
    row.actual = { reroll: r.state.rerollTokens, skipCount: r.state.stageState.skipCount };
    if (r.state.rerollTokens !== 3) throw Error('reroll ' + r.state.rerollTokens);
    pass(row);
  } catch (e) { fail(row, e.message); }
}
{
  const row = { name: 'audit-clip-payment-no-junk', id: 'item_audit_clip', kind: 'item', expected: { removeTokens: 2, phase: 'ITEM_CHOICE' } };
  covered.item.add('item_audit_clip');
  try {
    let s = F.clone(eventBase);
    s.items = ['item_audit_clip'];
    s.itemState.quotas.item_audit_clip = { spin: 0, stage: 0, run: 0 };
    s.itemState.used.item_audit_clip = { spin: false, stage: false };
    s.pool = [F.instance(s, 'mist_pouch')];
    s.stageSpin = 6;
    s.spin = 18;
    s.spinsRemaining = 1;
    s.itemState.spin = 18;
    if (s.last) s.last.spin = 18;
    s.cash = s.payment + 10;
    s.removeTokens = 1;
    F.validateState(s);
    let r = F.fullCommand(s, { op: 'spin', revision: s.revision });
    if (!r.ok) throw Error(r.error);
    r = F.fullCommand(r.state, { op: 'skip', windowId: r.state.offer.windowId, revision: r.state.revision });
    if (!r.ok) throw Error(r.error);
    row.actual = { phase: r.state.phase, removeTokens: r.state.removeTokens };
    if (r.state.phase !== 'ITEM_CHOICE') throw Error('phase ' + r.state.phase);
    if (r.state.removeTokens !== 2) throw Error('tokens ' + r.state.removeTokens);
    pass(row);
  } catch (e) { fail(row, e.message); }
}

const resolverSrc = fs.readFileSync(path.join(root, 'js/gdd1/resolver.js'), 'utf8');
const offersSrc = fs.readFileSync(path.join(root, 'js/gdd1/offers.js'), 'utf8');
const fullContentSrc = fs.readFileSync(path.join(root, 'js/gdd1/full-content.js'), 'utf8');
if (/alignment_cloth|item_spectrum_book|spectrum_book/.test(resolverSrc)) {
  failures.push({ kind: 'generic', error: 'resolver names cloth/book' });
}

const missingTriggers = {
  symbol: F.SYMBOL_IDS.filter(id => !covered.symbol.has(id)),
  item: F.ITEM_IDS.filter(id => !covered.item.has(id)),
  event: F.EVENT_IDS.filter(id => !covered.event.has(id))
};
if (missingTriggers.symbol.length || missingTriggers.item.length || missingTriggers.event.length) {
  failures.push({ kind: 'coverage', missingTriggers });
}

const required = {
  clothRecordOrder: triggers.some(t => t.name === 'cloth-tagAdded-record-order' && t.ok),
  bookStep8: triggers.some(t => t.name === 'book-step8-commit' && t.ok),
  bookDead: triggers.some(t => t.name === 'book-dead-no-retarget' && t.ok),
  noResolverIdSpecialCases: !/alignment_cloth|item_spectrum_book|spectrum_book/.test(resolverSrc)
};

const result = {
  scope: 'Engineering 64/32/8 GDD §5.I.1 / §6.1 / §7 map plus hand-calculated triggers from GDD BODY. Not independent auditor signature. Shared F.defs(state) for sliceDraw/sliceResolve/sliceOffer is intentional.',
  production: { resolver: sha('js/gdd1/resolver.js'), fullEffects: sha('js/gdd1/full-effects.js') },
  sharedDefs: {
    note: 'F.defs(state) selects full vs slice catalogs; sliceDraw/sliceResolve/sliceOffer share that resolver. Not a defect; do not duplicate engines.',
    resolverUsesDefs: /F\.defs\(s\)/.test(resolverSrc),
    offersUsesDefs: /F\.defs\(s\)/.test(offersSrc),
    fullContentDefinesDefs: /F\.defs=function\(s\)/.test(fullContentSrc)
  },
  symbols: { total: symbols.length, mapped: symbols.length, match: symbols.filter(x => x.map.alignment === 'MATCH').length, equivalent: symbols.filter(x => x.map.alignment === 'EQUIVALENT').length, mismatch: symbols.filter(x => x.map.alignment === 'MISMATCH').length },
  items: { total: items.length, mapped: items.length, match: items.filter(x => x.map.alignment === 'MATCH').length, equivalent: items.filter(x => x.map.alignment === 'EQUIVALENT').length, mismatch: items.filter(x => x.map.alignment === 'MISMATCH').length },
  events: { total: events.length, mapped: events.length, match: events.filter(x => x.map.alignment === 'MATCH').length, equivalent: events.filter(x => x.map.alignment === 'EQUIVALENT').length, mismatch: events.filter(x => x.map.alignment === 'MISMATCH').length },
  triggers: { total: triggers.length, passed: triggers.filter(x => x.ok).length, failed: triggers.filter(x => !x.ok).length, cases: triggers },
  coverage: { symbols: covered.symbol.size, items: covered.item.size, events: covered.event.size, missingTriggers },
  required,
  mismatches,
  ids: { symbols, items, events },
  ok: required.clothRecordOrder && required.bookStep8 && required.bookDead && required.noResolverIdSpecialCases && symbols.length === 64 && items.length === 32 && events.length === 8 && !missingTriggers.symbol.length && !missingTriggers.item.length && !missingTriggers.event.length
};

fs.writeFileSync(dest, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({
  dest: path.relative(root, dest).replace(/\\/g, '/'),
  symbols: result.symbols,
  items: result.items,
  events: result.events,
  triggers: { total: result.triggers.total, passed: result.triggers.passed, failed: result.triggers.failed },
  required: result.required,
  mapMismatches: mismatches.length,
  triggerFailures: failures.filter(x => x.kind === 'trigger').map(x => ({ name: x.name, error: x.error })),
  ok: result.ok
}, null, 2));
if (!result.ok) process.exitCode = 1;
