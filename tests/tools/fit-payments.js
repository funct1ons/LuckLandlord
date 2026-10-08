'use strict';
/**
 * 给定"可达收入曲线"，反推能让好策略达到目标胜率的配额表。
 *
 * 实测可达收入（中位）：[169,294,444,470,496,491,508,527,611,?]
 * 收入在第 4 期后基本平坦 → 配额也必须是"先陡后平"的形状，
 * 否则后期限额必然超出可达收入。
 */
const fs = require('node:fs'); const vm = require('node:vm'); const path = require('node:path');
const ROOT = path.resolve(__dirname, '..', '..');
const FILES = ['js/gdd1/contract.js','js/gdd1/rng.js','js/gdd1/schema.js','js/gdd1/save.js','js/gdd1/full-save.js','js/gdd1/content.js','js/gdd1/full-content.js','js/gdd1/full-effects.js','js/gdd1/descriptions.js','js/gdd1/offers.js','js/gdd1/resolver.js','js/gdd1/controller.js','js/gdd1/full-controller.js'];

// 可达收入参考（来自 derive-payments.js 的实测中位；第10期外推）
const REACHABLE = [169, 294, 444, 470, 496, 491, 508, 527, 611, 650];

function load(payments) {
  const ctx = { window: {}, console, Object, JSON, Math, Array, String, Number, Boolean, Date, Set, Map, Error, isFinite, parseInt, parseFloat };
  ctx.globalThis = ctx; ctx.window.window = ctx.window; vm.createContext(ctx);
  for (const f of FILES) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
  const F = ctx.window.GDD1;
  if (payments) {
    const scaled = Object.freeze(payments.slice());
    const prof = {};
    for (const [k, v] of Object.entries(F.PROFILES)) prof[k] = Object.freeze(Object.assign({}, v, { payments: scaled }));
    F.PROFILES = Object.freeze(prof);
  }
  return F;
}

const CORE = ['harbor_conductor','chord_frame','dock_chime','pitch_fork','fog_reed','beat_spool','prism_hum','silence_keeper'];
const GOOD = CORE.concat(['nursery_gauge','furnace_auditor','manifest_desk','settlement_beacon','demand_coupler','crystal_index','tide_prism','amber_frond','dew_lantern','blank_facet','offset_reader','cleared_stub','saline_ampoule','wick_bed']);
const JUNK = ['spent_gasket','arrears_slip'];

function play(F, seed, skill) {
  const D = (s, id) => F.defs(s).symbols[id];
  const exec = (s, c) => { const r = F.fullCommand(s, Object.assign({ revision: s.revision, windowId: s.offer.windowId }, c)); return r.ok ? r.state : null; };
  let s = F.fullNewRun(seed);
  for (let i = 0; i < 4000; i++) {
    if (!s || s.phase === 'WON' || s.phase === 'LOST') break;
    if (s.phase === 'READY') {
      if (skill !== 'random' && s.removeTokens > 0 && s.pool.length > (skill === 'high' ? 20 : 0)) {
        let victim = s.pool.find(x => JUNK.includes(x.type));
        if (!victim && skill === 'high') victim = s.pool.find(x => !GOOD.includes(x.type));
        if (!victim && skill === 'high') {
          const byType = {};
          for (const x of s.pool) (byType[x.type] = byType[x.type] || []).push(x);
          let worst = null;
          for (const arr of Object.values(byType)) {
            if (arr.length < 2) continue;
            arr.sort((a, b) => (a.permanent + D(s, a.type).base) - (b.permanent + D(s, b.type).base));
            if (!worst || (arr[0].permanent + D(s, arr[0].type).base) < (worst.permanent + D(s, worst.type).base)) worst = arr[0];
          }
          victim = worst;
        }
        if (!victim && skill === 'low') victim = s.pool.find(x => D(s, x.type).base <= 1 && !GOOD.includes(x.type));
        if (victim) { const r = exec(s, { op: 'remove', uid: victim.uid, confirmEmpty: false }); if (r) { s = r; continue; } }
      }
      s = exec(s, { op: 'spin' });
    } else if (s.phase === 'SYMBOL_CHOICE') {
      const c = s.offer.choices || [];
      if (!c.length) { s = exec(s, { op: 'skip' }); continue; }
      let pick, threshold;
      if (skill === 'random') { pick = c[Math.floor(c.length / 2)]; threshold = -999; }
      else {
        const score = id => {
          const d = D(s, id); let v = d.base * 2;
          if (CORE.includes(id)) v += 16; else if (GOOD.includes(id)) v += 6;
          if (d.tags.includes('junk')) v -= 30;
          if (d.rarity === 'rare') v += 3; if (d.rarity === 'epic') v += 8;
          return v;
        };
        pick = c.slice().sort((a, b) => score(b) - score(a))[0];
        threshold = skill === 'high' ? 8 : 2;
      }
      s = (threshold !== -999 && (score0(F, s, pick, CORE, GOOD) < threshold || s.pool.length >= 200)) ? exec(s, { op: 'skip' })
        : exec(s, { op: skill === 'random' ? 'choose' : 'choose', id: pick });
    } else if (s.phase === 'ITEM_CHOICE') { const c = s.offer.choices || []; s = c.length ? exec(s, { op: 'item', id: c[0] }) : exec(s, { op: 'skipItem' }); }
    else if (s.phase === 'EVENT_CHOICE') s = exec(s, { op: 'event', option: 'B', id: s.events.choice.id });
    else break;
  }
  return !!(s && s.phase === 'WON');
}
function score0(F, s, id, CORE, GOOD) {
  const d = F.defs(s).symbols[id]; let v = d.base * 2;
  if (CORE.includes(id)) v += 16; else if (GOOD.includes(id)) v += 6;
  if (d.tags.includes('junk')) v -= 30;
  if (d.rarity === 'rare') v += 3; if (d.rarity === 'epic') v += 8;
  return v;
}

function suite(F, skill, n) { let w = 0; for (let g = 0; g < n; g++) if (play(F, 'FIT-' + skill + '-' + g, skill)) w++; return w / n; }

// 候选配额形状：以可达收入的固定比例
const ONLY = process.argv[3] ? Number(process.argv[3]) : null;
const shapes = (ONLY ? [{ name: '中位×' + ONLY.toFixed(2), f: ONLY }] : [
  { name: '中位×0.60', f: 0.60 },
  { name: '中位×0.70', f: 0.70 },
  { name: '中位×0.80', f: 0.80 },
  { name: '中位×0.85', f: 0.85 },
  { name: '中位×0.88', f: 0.88 },
  { name: '中位×0.90', f: 0.90 },
  { name: '中位×0.92', f: 0.92 },
  { name: '中位×0.95', f: 0.95 },
  { name: '中位×1.00', f: 1.00 }
]);
const N = Number(process.argv[2] || 20);
console.log('=== 按"可达收入比例"反推配额（' + N + ' 局/策略）===');
console.log('  形状        random   low    high   high-random   配额表');
for (const sh of shapes) {
  const pay = REACHABLE.map(x => Math.max(1, Math.round(x * sh.f / 5) * 5));
  for (let i = 1; i < pay.length; i++) if (pay[i] <= pay[i - 1]) pay[i] = pay[i - 1] + 5;
  const F = load(pay);
  const r = suite(F, 'random', N), l = suite(F, 'low', N), h = suite(F, 'high', N);
  console.log('  ' + sh.name.padEnd(10) + '  ' + (r * 100).toFixed(0).padStart(4) + '%  ' +
    (l * 100).toFixed(0).padStart(4) + '%  ' + (h * 100).toFixed(0).padStart(4) + '%   ' +
    ((h - r) * 100).toFixed(0).padStart(6) + 'pp     [' + pay.join(',') + ']');
}
