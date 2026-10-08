'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '../..');
const context = vm.createContext({ console });
for (const name of ['contract', 'rng', 'schema', 'save', 'content', 'full-content', 'full-effects', 'offers', 'resolver', 'full-controller', 'full-save']) {
  vm.runInContext(fs.readFileSync(path.join(root, 'js/gdd1', name + '.js'), 'utf8'), context, { filename: name + '.js' });
}
const F = context.GDD1;
const copy = x => JSON.parse(JSON.stringify(x));
const bots = ['Random', 'Value', 'Synergy', 'Greedy'];
function policyRng(seed) {
  let x = F.hashIdentity('policy-full-v1/' + seed), consumed = 0;
  return {
    next() { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; x >>>= 0; consumed++; return x / 4294967296; },
    snapshot() { return { state: x, consumed }; }
  };
}
function publicView(s) {
  const v = copy(s);
  delete v.rng;
  delete v.seed;
  return v;
}
function defs(v) { return F.defs(v); }
function countTag(v, tag) {
  const d = defs(v).symbols;
  return v.pool.filter(x => d[x.type] && d[x.type].tags.includes(tag)).length;
}
function typeCount(v, type) { return v.pool.filter(x => x.type === type).length; }
function distinctTag(v, tag) {
  const d = defs(v).symbols;
  return new Set(v.pool.filter(x => d[x.type] && d[x.type].tags.includes(tag)).map(x => x.type)).size;
}
function rarityScore(r) {
  return r === 'epic' ? 1.8 : r === 'rare' ? 1.25 : r === 'uncommon' ? 0.85 : 0.5;
}
function value(id, v, synergy = false) {
  const items = F.fullItems;
  if (items[id]) return rarityScore(items[id].rarity);
  const d = F.fullSymbols[id];
  if (!d) return 0;
  let n = d.base;
  if (id === 'spent_gasket' || id === 'arrears_slip') n = 0.15;
  if (d.mechanics && d.mechanics.age && !d.mechanics.age.destroy) n += 1.3;
  if (d.mechanics && d.mechanics.age && d.mechanics.age.destroy) n -= 0.35;
  if (d.mechanics && d.mechanics.pressure) n += 1.15;
  if (d.rarity === 'rare') n += 0.35;
  if (d.rarity === 'epic') n += 0.7;
  if (!synergy) return n;
  const chance = k => Math.min(1, k * 0.18);
  const tags = d.tags || [];
  if (tags.includes('machine') || id === 'copper_burr') n += 2 * chance(countTag(v, 'machine'));
  if (tags.includes('fuel')) n += 1.6 * chance(countTag(v, 'fuel'));
  if (tags.includes('scrap')) n += 2 * chance(countTag(v, 'scrap'));
  if (tags.includes('feedstock')) n += 2 * chance(countTag(v, 'feedstock'));
  if (tags.includes('junk')) n += 1.1 * chance(countTag(v, 'junk'));
  if (tags.includes('mist')) n += 1.5 * chance(countTag(v, 'mist'));
  if (tags.includes('plant')) n += Math.min(6, countTag(v, 'plant') * 0.5);
  if (tags.includes('crystal')) n += distinctTag(v, 'crystal') >= 2 ? 3 : 0.5;
  if (tags.includes('resonance')) n += 1.3 * chance(countTag(v, 'resonance'));
  if (tags.includes('cargo')) n += 0.9 * chance(countTag(v, 'cargo'));
  if (tags.includes('pressure')) n += 1.2 * chance(countTag(v, 'pressure'));
  if (tags.includes('magic')) n += 1.0 * chance(countTag(v, 'magic'));
  if (tags.includes('contract')) n += 0.8 * chance(countTag(v, 'contract'));
  if (id === 'sorting_tong') n += Math.min(7, typeCount(v, 'heat_clerk') * 2);
  if (id === 'root_ledger') n += Math.min(7, countTag(v, 'plant') * 0.8);
  return n;
}
function legal(v) {
  const w = { windowId: v.offer.windowId };
  let a = [];
  if (v.phase === 'READY') a = [{ op: 'spin' }];
  if (v.phase === 'SYMBOL_CHOICE') {
    a = [...(v.pool.length < 200 ? v.offer.choices.map(id => ({ op: 'choose', id, ...w })) : []), { op: 'skip', ...w }];
  }
  if (['READY', 'SYMBOL_CHOICE'].includes(v.phase) && v.removeTokens && v.pool.length) {
    a.push(...v.pool.map(x => ({ op: 'remove', uid: x.uid, confirmEmpty: v.pool.length === 1 })));
  }
  if (v.phase === 'SYMBOL_CHOICE' && v.rerollTokens && v.offer.choiceRefreshesUsed < 3) a.push({ op: 'reroll', ...w });
  if (v.phase === 'ITEM_CHOICE') a = [...v.offer.choices.map(id => ({ op: 'item', id, ...w })), { op: 'skipItem', ...w }];
  if (v.phase === 'EVENT_CHOICE') {
    const id = v.events.choice.id;
    const e = defs(v).events[id];
    a = [{ op: 'event', id, option: 'B' }];
    if (e && v.cash >= e.cost && F.fullEventEligible(v, id)) {
      const uids = v.events.choice.targetUids || [];
      if (uids.length) {
        a.push(...uids.filter(uid => v.pool.some(x => x.uid === uid)).map(uid => ({ op: 'event', id, option: 'A', uid })));
      } else a.push({ op: 'event', id, option: 'A' });
    }
  }
  return a;
}
function staticChoice(v, synergy) {
  const a = legal(v);
  const rem = a.filter(x => x.op === 'remove').sort((p, q) => {
    const x = v.pool.find(z => z.uid === p.uid), y = v.pool.find(z => z.uid === q.uid);
    return value(x.type, v, synergy) + x.permanent - value(y.type, v, synergy) - y.permanent;
  });
  if (rem.length) {
    const x = v.pool.find(p => p.uid === rem[0].uid);
    if (x.type === 'spent_gasket' || x.type === 'arrears_slip' || (v.pool.length > 24 && value(x.type, v, synergy) + x.permanent < 2.1)) return rem[0];
  }
  if (v.phase === 'READY') return a[0];
  if (v.phase === 'SYMBOL_CHOICE') {
    const ranked = a.filter(x => x.op === 'choose').sort((p, q) => value(q.id, v, synergy) - value(p.id, v, synergy));
    const floor = v.pool.length < 20 ? 0 : v.pool.reduce((n, x) => n + value(x.type, v, synergy) + x.permanent, 0) / v.pool.length;
    if (ranked.length && value(ranked[0].id, v, synergy) > floor + 0.15) return ranked[0];
    if (a.some(x => x.op === 'reroll') && (!ranked.length || value(ranked[0].id, v, synergy) < floor) && v.offer.choiceRefreshesUsed === 0) return a.find(x => x.op === 'reroll');
    return a.find(x => x.op === 'skip');
  }
  if (v.phase === 'ITEM_CHOICE') {
    const r = a.filter(x => x.op === 'item').sort((p, q) => value(q.id, v, true) - value(p.id, v, true));
    return r.length && value(r[0].id, v, true) > 0.1 ? r[0] : a.find(x => x.op === 'skipItem');
  }
  const A = a.filter(x => x.option === 'A');
  if (!A.length) return a[0];
  const eid = v.events.choice.id;
  if (eid === 'event_copper_queue') return v.pool.length < 24 ? A[0] : a[0];
  if (eid === 'event_brine_inspection') return v.pool.length > 20 ? A.sort((p, q) => v.pool.find(x => x.uid === p.uid).permanent - v.pool.find(x => x.uid === q.uid).permanent)[0] : a[0];
  if (eid === 'event_fog_shift') return v.cash >= v.payment * 0.15 + 4 ? A[0] : a[0];
  if (eid === 'event_misprint_window') return v.cash >= 6 ? A[0] : a[0];
  return v.cash >= v.payment * 0.1 ? A[0] : a[0];
}
function surrogate(v, sample) {
  const s = copy(v);
  s.seed = 'full-sim-model-v1/' + sample;
  s.rng = F.createRng(s.seed, s.profile, s.difficulty);
  return s;
}
function rollout(v, action) {
  let s = surrogate(v, 0), income = 0, spins = 0, commands = 0;
  const apply = a => {
    const r = F.fullCommand(s, { ...a, revision: s.revision });
    commands++;
    if (!r.ok) throw Error('Model command: ' + r.error);
    s = r.state;
  };
  apply(action);
  while (!['WON', 'LOST'].includes(s.phase) && spins < 2 && commands < 14) {
    if (s.phase === 'READY') { apply({ op: 'spin' }); income += s.last.total; spins++; }
    else if (s.phase === 'SYMBOL_CHOICE') apply({ op: 'skip', windowId: s.offer.windowId });
    else if (s.phase === 'ITEM_CHOICE') apply({ op: 'skipItem', windowId: s.offer.windowId });
    else apply({ op: 'event', id: s.events.choice.id, option: 'B' });
  }
  const mean = s.pool.length ? s.pool.reduce((n, x) => n + value(x.type, publicView(s), true) + x.permanent, 0) / s.pool.length : 0;
  const utility = (s.phase === 'LOST' ? -100000 : 0) + (s.phase === 'WON' ? 100000 : 0) + income + mean * 2 + Math.min(20, s.pool.length) * 0.35 + s.removeTokens * 0.2 + s.rerollTokens * 0.2;
  return { utility, commands, spins };
}
function decide(bot, v, rng) {
  const a = legal(v);
  if (!a.length) throw Error('No legal actions');
  if (bot === 'Random') return { action: a[Math.floor(rng.next() * a.length)], modelCommands: 0 };
  if (bot !== 'Greedy') return { action: staticChoice(v, bot === 'Synergy'), modelCommands: 0 };
  const preferred = staticChoice(v, true);
  let candidates = a.filter(x => !['remove', 'reroll'].includes(x.op));
  if (preferred.op === 'remove' || preferred.op === 'reroll') candidates.push(preferred);
  if (v.phase === 'READY' && preferred.op !== 'remove') return { action: { op: 'spin' }, modelCommands: 0 };
  let best = null, n = 0;
  for (const action of candidates) {
    const r = rollout(v, action);
    n += r.commands;
    if (!best || r.utility > best.utility) best = { action, utility: r.utility };
  }
  return { ...best, modelCommands: n };
}
function formation(v, recent) {
  const n = type => typeCount(v, type);
  const recentSum = k => recent.reduce((a, b) => a + (b[k] || 0), 0);
  const A = countTag(v, 'plant') >= 4 && (n('fog_stitcher') || v.items.includes('item_dew_calendar')) && (recentSum('plantTransforms') >= 2 || recentSum('plantProductIncome') >= 12);
  const B = countTag(v, 'scrap') >= 2 && (n('sorting_tong') || n('sieve_drum')) && (n('heat_clerk') || v.items.includes('item_offcut_chute')) && recentSum('scrapProcessed') >= 2;
  const C = (n('chord_frame') && distinctTag(v, 'resonance') >= 3) || (n('silence_keeper') && distinctTag(v, 'resonance') >= 4);
  const D = countTag(v, 'feedstock') >= 3 && (n('condense_coil') || n('deep_still')) && distinctTag(v, 'crystal') >= 2;
  const E = distinctTag(v, 'cargo') >= 4 && countTag(v, 'product') >= 2 && v.pool.length >= 16 && v.pool.length <= 24;
  const F = countTag(v, 'pressure') >= 3 && (n('surge_vessel') || n('release_spire') || n('feed_valve'));
  const G = (n('alignment_cloth') || n('offset_reader')) && (n('phase_chip') + n('spectrum_pin') + n('echo_plate') >= 2);
  const H = distinctTag(v, 'contract') >= 3 && countTag(v, 'junk') === 0;
  return ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].filter((_, i) => [A, B, C, D, E, F, G, H][i]);
}
module.exports = { F, copy, bots, policyRng, publicView, legal, value, staticChoice, surrogate, rollout, decide, formation, defs };
