'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const dest = path.join(__dirname, 'f4-grok-id-map-v2.json');
if (fs.existsSync(dest)) throw Error('Refuse existing output ' + dest);

const root = path.join(__dirname, '../..');
const ctx = { console };
ctx.globalThis = ctx;
vm.createContext(ctx);
for (const f of ['contract', 'rng', 'schema', 'save', 'content', 'full-content', 'full-effects', 'offers', 'resolver', 'full-controller']) {
  vm.runInContext(fs.readFileSync(path.join(root, 'js/gdd1', f + '.js'), 'utf8'), ctx);
}
const F = ctx.GDD1;

const symbolGdd = {
  phase_chip: 'step2/tagAdded', transit_seal: 'step2/tagAdded', split_register: 'step2/tagAdded', alignment_cloth: 'step2/tagAdded',
  mist_pouch: 'step3/age', dew_lantern: 'step3/age', brine_strip: 'step3/age', cloudy_negative: 'step3/age', fog_stitcher: 'step3/age',
  wick_bed: 'step4/appearance', warm_pod: 'step4/appearance', dock_chime: 'step4/appearance', fog_reed: 'step4/appearance',
  beat_spool: 'step4/appearance', chord_frame: 'step4/appearance', prism_hum: 'step4/appearance', silence_keeper: 'step4/appearance',
  saline_ampoule: 'step4/appearance', crystal_index: 'step4/appearance', route_stub: 'step4/appearance', parcel_cage: 'step4/appearance',
  manifest_desk: 'step4/appearance', pause_dial: 'step4/appearance', demand_coupler: 'step4/appearance', spectrum_pin: 'step4/appearance',
  blank_facet: 'step4/appearance', arrears_slip: 'step4/appearance', lean_receipt: 'step4/appearance', cleared_stub: 'step4/appearance',
  quota_margin: 'step4/appearance', harbor_conductor: 'step4/appearance', copper_burr: 'step4/appearance',
  pressure_pouch: 'step4/pressure-injection', surge_vessel: 'step4/pressure-injection',
  cracked_regulator: 'step4/risk', safety_shim: 'step4/risk', offset_reader: 'step4/copy', advance_stamp: 'step4/copy',
  pitch_fork: 'step5/adjacency-add', cargo_rope: 'step5/adjacency-add',
  sorting_tong: 'step5/structural-event', sieve_drum: 'step5/structural-event', clinker_router: 'step5/structural-event',
  condense_coil: 'step5/structural-event', deep_still: 'step5/structural-event', pearl_separator: 'step5/structural-event',
  sorting_runner: 'step5/structural-event', reserve_facet: 'step5/structural-event', feed_valve: 'step5/structural-event',
  compliance_desk: 'step5/structural-event', cancellation_clerk: 'step5/structural-event',
  ash_felt: 'step6/lifecycle', amber_frond: 'step6/lifecycle', root_ledger: 'step6/lifecycle', heat_clerk: 'step6/lifecycle',
  tide_prism: 'step6/lifecycle', echo_plate: 'step6/lifecycle',
  nursery_gauge: 'step8/end-summary', furnace_auditor: 'step8/end-summary', switch_lamp: 'step8/end-summary',
  return_station: 'step8/end-summary', settlement_beacon: 'step8/end-summary',
  release_spire: 'step7/pressure', spent_gasket: 'base-only'
};
const itemGdd = {
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
const eventGdd = {
  event_fog_shift: 'choice/commit → step3/age → step3/age',
  event_copper_queue: 'choice/commit → choice/commit',
  event_boiler_test: 'choice/commit → choice/commit',
  event_silent_bell: 'choice/commit → step4/appearance → step9/ledger',
  event_brine_inspection: 'choice/commit → choice/commit → choice/commit',
  event_empty_manifest: 'choice/commit → step8/end-summary → step9/ledger',
  event_misprint_window: 'choice/commit → step2/tagAdded → step9/ledger',
  event_quota_recount: 'choice/commit → choice/commit → choice/commit'
};

function canon(phase) {
  return {
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
  }[phase] || phase;
}

function symbolMapOk(d, gdd, effects, primary) {
  if (!d || !gdd) return false;
  if (gdd === 'base-only') return effects.length === 0;
  if (gdd === 'step4/appearance' && effects.length === 0) return true;
  if (gdd === 'step8/end-summary' && effects.some(e => e.op === 'reserve' && e.defer)) return true;
  if (gdd === 'step4/copy' && effects.some(e => e.op === 'copy' || e.op === 'advance')) return true;
  if (gdd === 'step4/risk' && (effects.some(e => e.op === 'risk') || (d.mechanics && d.mechanics.riskMitigation))) return true;
  if (gdd === 'step3/age' && ((d.mechanics && d.mechanics.age) || effects.some(e => e.phase === 'age-extra'))) return true;
  if (gdd === 'step4/pressure-injection' && effects.some(e => e.op === 'pressure')) return true;
  if (gdd === 'step7/pressure' && effects.some(e => e.op === 'release')) return true;
  if (gdd === 'step8/end-summary' && effects.some(e => e.canon === 'step8/end-summary' || e.phase === 'listen')) return true;
  if (gdd === 'step6/lifecycle' && effects.some(e => e.phase === 'listen' || e.phase === 'end')) return true;
  if (gdd === 'step5/structural-event' && effects.some(e => e.canon === 'step5/structural-event')) return true;
  if (gdd === 'step5/adjacency-add' && effects.some(e => e.canon === 'step5/adjacency-add')) return true;
  if (gdd === 'step2/tagAdded' && effects.some(e => e.canon === 'step2/tagAdded')) return true;
  if (gdd === primary) return true;
  return false;
}

function fixture(entries, items = [], configure = () => {}) {
  const s = F.fullNewRun('ID-MAP-V2');
  s.pool = [];
  s.nextUid = 1;
  s.spin = 1;
  s.stageSpin = 1;
  s.spinsRemaining = 5;
  s.items = items.slice();
  for (const id of items) {
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
  configure(s);
  return { s, board };
}

function resolve(entries, items, configure) {
  const { s, board } = fixture(entries, items, configure);
  const last = F.sliceResolve(s, board);
  return { s, last };
}

const failures = [];
const symbols = [];
for (const id of F.SYMBOL_IDS) {
  const d = F.fullSymbols[id];
  const gdd = symbolGdd[id];
  const effects = (d.effects || []).map(e => ({
    phase: e.phase, canon: canon(e.phase), op: e.op,
    defer: !!e.defer, lockFirst: !!e.lockFirst, event: e.event || null,
    selector: e.selector || null, amount: e.amount === undefined ? null : e.amount
  }));
  const primary = effects[0] ? effects[0].canon : 'base-only';
  const mapOk = symbolMapOk(d, gdd, effects, primary);
  const row = { id, gdd, primary, effects, mapOk, name: d && d.name, base: d && d.base, tags: d && d.tags };
  if (!mapOk) failures.push({ kind: 'symbol-map', id, gdd, primary, effects });
  symbols.push(row);
}

const items = [];
for (const id of F.ITEM_IDS) {
  const d = F.fullItems[id];
  const gdd = itemGdd[id];
  const effects = (d.effects || []).map(e => ({
    phase: e.phase, canon: canon(e.phase), op: e.op, defer: !!e.defer, event: e.event || null,
    eventTarget: !!e.eventTarget, amount: e.amount === undefined ? null : e.amount
  }));
  const mech = d.mechanics || {};
  const row = { id, gdd, effects, mechanics: mech, name: d && d.name };
  if (id === 'item_spectrum_book') {
    const fx = effects[0];
    row.mapOk = !!(fx && fx.op === 'add' && fx.event === 'tagAdded' && fx.eventTarget && fx.defer && fx.amount === 3);
    if (!row.mapOk) failures.push({ kind: 'item-map', id, effects });
  } else if (id === 'item_pitch_marker') {
    const fx = effects[0];
    row.mapOk = !!(fx && fx.op === 'add' && fx.event === 'tagAdded' && fx.defer && fx.amount === 5);
    if (!row.mapOk) failures.push({ kind: 'item-map', id, effects });
  } else {
    row.mapOk = !!d && !!gdd;
    if (!row.mapOk) failures.push({ kind: 'item-map', id });
  }
  items.push(row);
}

const events = [];
for (const id of F.EVENT_IDS) {
  const d = F.fullEvents[id];
  const spin = (d && d.spinEffects || []).map(e => ({ phase: e.phase, canon: canon(e.phase), op: e.op }));
  const row = { id, gdd: eventGdd[id], op: d && d.op, cost: d && d.cost, spinEffects: spin, present: !!d };
  row.mapOk = !!d && !!eventGdd[id];
  if (!row.mapOk) failures.push({ kind: 'event-map', id });
  events.push(row);
}

function probe(name, entries, itemsHeld, expected, configure) {
  try {
    const { last, s } = resolve(entries, itemsHeld, configure);
    if (expected.total !== undefined && last.total !== expected.total) throw Error('total expected ' + expected.total + ' actual ' + last.total);
    if (expected.ledger) {
      const got = last.ledger.map(x => x.amount);
      if (JSON.stringify(got) !== JSON.stringify(expected.ledger)) throw Error('ledger expected ' + JSON.stringify(expected.ledger) + ' actual ' + JSON.stringify(got));
    }
    if (expected.phaseAction) {
      const hit = last.log.some(e => e.action === expected.phaseAction.action && e.phase === expected.phaseAction.phase && (!expected.phaseAction.source || e.source === expected.phaseAction.source));
      if (!hit) throw Error('missing ' + JSON.stringify(expected.phaseAction) + ' in ' + last.log.map(e => e.phase + ':' + e.action).join(','));
    }
    if (expected.bookPhase) {
      const adds = last.log.filter(e => e.source === 'item_spectrum_book' && e.action === 'add');
      if (JSON.stringify(adds.map(e => e.phase)) !== JSON.stringify(expected.bookPhase)) throw Error('book phases ' + JSON.stringify(adds.map(e => e.phase)));
    }
    if (expected.noBookAdd && last.log.some(e => e.source === 'item_spectrum_book' && e.action === 'add')) throw Error('unexpected book add');
    if (expected.type) {
      if (s.pool[0].type !== expected.type) throw Error('type ' + s.pool[0].type);
    }
    if (expected.reservations !== undefined && s.reservations.length !== expected.reservations) {
      throw Error('reservations expected ' + expected.reservations + ' actual ' + s.reservations.length);
    }
    return { name, ok: true, total: last.total, reservations: s.reservations.length };
  } catch (e) {
    failures.push({ kind: 'trigger', name, error: e.message });
    return { name, ok: false, error: e.message };
  }
}

const triggers = [];
triggers.push(probe('spent_gasket-base-only', [['spent_gasket', 0]], [], { total: -1, ledger: [-1] }));
triggers.push(probe('wick-base2', [['wick_bed', 0]], [], { total: 2, ledger: [2] }));
triggers.push(probe('saline-base2', [['saline_ampoule', 0]], [], { total: 2, ledger: [2] }));
triggers.push(probe('arrears-base-neg1', [['arrears_slip', 0]], [], { total: -1, ledger: [-1] }));
triggers.push(probe('copper-base2', [['copper_burr', 0]], [], { total: 2, ledger: [2] }));
triggers.push(probe('copper-machine-neighbor', [['copper_burr', 0], ['offset_reader', 1]], [], { total: 7, ledger: [4, 3] }));
triggers.push(probe('blank-appearance', [['blank_facet', 0]], [], { total: 5, ledger: [5], phaseAction: { action: 'add', phase: 'step4/appearance' } }));
triggers.push(probe('cleared-appearance', [['cleared_stub', 0]], [], { total: 4, ledger: [4] }));
triggers.push(probe('pause-alone', [['pause_dial', 0]], [], { total: 3, ledger: [3] }));
triggers.push(probe('pouch-ordinary', [['pressure_pouch', 0]], [], { total: 1, phaseAction: { action: 'pressureIncrease', phase: 'step4/pressure-injection' } }));
triggers.push(probe('pouch-release', [['pressure_pouch', 0, { pressure: 3 }]], [], { total: 11 }));
triggers.push(probe('surge-ordinary-zero', [['surge_vessel', 0]], [], { total: 0, ledger: [0] }));
triggers.push(probe('mist-natural-epoch', [['mist_pouch', 0, { age: 2 }]], [], { type: 'dew_lantern', total: 3 }));
triggers.push(probe('cloudy-to-blank-no-appearance', [['cloudy_negative', 0, { age: 2 }]], [], { total: 3, ledger: [3] }));
triggers.push(probe('cloth-record-order', [['split_register', 0], ['phase_chip', 1], ['alignment_cloth', 2], ['copper_burr', 6]], [], {
  total: 15, ledger: [2, 2, 1, 10], phaseAction: { action: 'add', phase: 'step2/tagAdded', source: 'u3' }
}));
triggers.push(probe('book-step8', [['phase_chip', 0], ['dock_chime', 1]], ['item_spectrum_book'], { total: 8, bookPhase: ['step8/end-summary'] }));
triggers.push(probe('book-dead-no-retarget', [['split_register', 0], ['copper_burr', 1], ['sorting_runner', 2]], ['item_spectrum_book'], { noBookAdd: true }));
triggers.push(probe('dock-row', [['dock_chime', 0], ['pitch_fork', 1], ['fog_reed', 2]], [], { total: 9 }));
triggers.push(probe('lean-below-half', [['lean_receipt', 0]], [], { total: 5 }, s => { s.cash = 34; }));
triggers.push(probe('lean-half', [['lean_receipt', 0]], [], { total: 1 }, s => { s.cash = 35; }));
triggers.push(probe('low-balance-below', [['copper_burr', 0]], ['item_low_balance_tab'], { total: 5 }, s => { s.cash = 34; }));
triggers.push(probe('low-balance-half', [['copper_burr', 0]], ['item_low_balance_tab'], { total: 2 }, s => { s.cash = 35; }));
triggers.push(probe('cycle-third', [['beat_spool', 0, { beat: 2 }]], [], { total: 10 }));
triggers.push(probe('metronome-second', [['beat_spool', 0, { beat: 1 }]], ['item_shared_metronome'], { total: 10 }));
triggers.push(probe('copy-blank', [['blank_facet', 0], ['offset_reader', 1]], [], { total: 10 }));
triggers.push(probe('pitch-lock-first', [['pitch_fork', 0], ['dock_chime', 1]], [], { total: 7, ledger: [1, 6] }));
triggers.push(probe('cargo-rope-product', [['cargo_rope', 0], ['cleared_stub', 1]], [], { total: 8 }));
triggers.push(probe('sorting-runner-consume', [['sorting_runner', 0], ['cleared_stub', 1]], [], { total: 10 }));
triggers.push(probe('compliance-desk', [['compliance_desk', 0], ['arrears_slip', 1]], [], { total: 4 }));
triggers.push(probe('cancellation-clerk', [['cancellation_clerk', 0], ['arrears_slip', 1]], [], { total: 7 }));
triggers.push(probe('margin-deficit15', [['quota_margin', 0]], [], { total: 8 }, s => { s.cash = 55; }));
triggers.push(probe('margin-deficit16', [['quota_margin', 0]], [], { total: 2 }, s => { s.cash = 54; }));
triggers.push(probe('rest-single', [['dock_chime', 0]], ['item_rest_notch'], { total: 3 }));
triggers.push(probe('hold-one-copper', [['copper_burr', 0]], ['item_small_hold'], { total: 2 }));
triggers.push(probe('phase-chip-tag', [['phase_chip', 0], ['dock_chime', 1]], [], { total: 5, phaseAction: { action: 'tagAdded', phase: 'step2/tagAdded' } }));
triggers.push(probe('switch-lamp-reserve-commit', [['switch_lamp', 0], ['cleared_stub', 1]], [], {
  total: 5, ledger: [1, 4], reservations: 1, phaseAction: { action: 'reserve', phase: 'step8/end-summary' }
}));

const solos = [];
for (const id of F.SYMBOL_IDS) {
  try {
    const { last } = resolve([[id, 0]], []);
    solos.push({
      id,
      ok: true,
      total: last.total,
      phases: [...new Set(last.log.map(e => e.phase))],
      actions: [...new Set(last.log.map(e => e.action))]
    });
  } catch (e) {
    failures.push({ kind: 'solo', id, error: e.message });
    solos.push({ id, ok: false, error: e.message });
  }
}

const resolverSrc = fs.readFileSync(path.join(root, 'js/gdd1/resolver.js'), 'utf8');
if (/alignment_cloth|item_spectrum_book|spectrum_book/.test(resolverSrc)) failures.push({ kind: 'generic', error: 'resolver names cloth/book' });

const v1Note = {
  retained: 'tests/gdd1/f4-grok-id-map-v1.json',
  supersedeBasis: [
    'v1 mapOk treated appearance-section base-only IDs (wick_bed, saline_ampoule, arrears_slip) as unmapped; GDD 5.I.1 lists them at step4/appearance with no extra effect',
    'v1 mapOk missed switch_lamp structure/reserve defer committing at step8/end-summary',
    'v1 pitch-lock-first expected 6; hand calc omitted dock row-diversity +1 before adjacency-add +3, actual 7 ledger [1,6]'
  ]
};

const result = {
  scope: 'Engineering 64/32/8 GDD map plus hand-calculated triggers; not independent auditor signature',
  supersedes: v1Note,
  symbols: { total: symbols.length, mapped: symbols.filter(x => x.mapOk).length },
  items: { total: items.length, mapped: items.filter(x => x.mapOk).length },
  events: { total: events.length, mapped: events.filter(x => x.mapOk).length },
  triggers: { total: triggers.length, passed: triggers.filter(x => x.ok).length, cases: triggers },
  solos: { total: solos.length, passed: solos.filter(x => x.ok).length, cases: solos },
  failures,
  ids: { symbols, items, events },
  ok: failures.length === 0 && symbols.length === 64 && items.length === 32 && events.length === 8
};
fs.writeFileSync(dest, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({
  dest: 'tests/gdd1/f4-grok-id-map-v2.json',
  symbols: result.symbols,
  items: result.items,
  events: result.events,
  triggers: { total: result.triggers.total, passed: result.triggers.passed },
  solos: result.solos,
  failures: failures.length,
  ok: result.ok
}, null, 2));
if (!result.ok) process.exitCode = 1;
