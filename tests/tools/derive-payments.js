'use strict';
/**
 * 收入曲线测量 → 反推配额表
 *   node tests/tools/derive-payments.js
 *
 * 思路：先用当前（已调）配额跑一批对局，测量"好策略实际能拿到多少"，
 * 再让每期配额落在可达收入的合理比例上，而不是拍脑袋设一条翻倍曲线。
 */
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..', '..');

const FILES = ['js/gdd1/contract.js','js/gdd1/rng.js','js/gdd1/schema.js','js/gdd1/save.js',
  'js/gdd1/full-save.js','js/gdd1/content.js','js/gdd1/full-content.js','js/gdd1/full-effects.js',
  'js/gdd1/descriptions.js','js/gdd1/offers.js','js/gdd1/resolver.js','js/gdd1/controller.js',
  'js/gdd1/full-controller.js'];

function load() {
  const ctx = { window: {}, console, Object, JSON, Math, Array, String, Number, Boolean, Date,
    Set, Map, Error, isFinite, parseInt, parseFloat };
  ctx.globalThis = ctx; ctx.window.window = ctx.window;
  vm.createContext(ctx);
  for (const f of FILES) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
  return ctx.window.GDD1;
}

const KEY = ['harbor_conductor','chord_frame','dock_chime','pitch_fork','fog_reed','beat_spool',
  'prism_hum','silence_keeper','nursery_gauge','furnace_auditor','manifest_desk','settlement_beacon',
  'demand_coupler','crystal_index','tide_prism','amber_frond','dew_lantern','blank_facet',
  'offset_reader','cleared_stub'];

/** 跑一局，返回每期结束时的"本期收入"（不含结余） */
function play(F, seed) {
  const D = (s, id) => F.defs(s).symbols[id];
  const exec = (s, c) => {
    const r = F.fullCommand(s, Object.assign({ revision: s.revision, windowId: s.offer.windowId }, c));
    return r.ok ? r.state : null;
  };
  let s = F.fullNewRun(seed);
  const perStage = {};
  let stage = 1, income = 0;
  // 期数在 choose/skip 内部推进（付款发生在选择提交时），所以每步之后都要检查。
  const note = (before, after) => {
    if (after && after.stageId !== before) { perStage[before] = income; income = 0; }
  };
  for (let i = 0; i < 3000; i++) {
    if (!s || s.phase === 'WON' || s.phase === 'LOST') break;
    const before = s.stageId;
    if (s.phase === 'READY') {
      if (s.removeTokens > 0) {
        const j = s.pool.find(x => ['spent_gasket','arrears_slip'].includes(x.type)) ||
                  s.pool.find(x => D(s, x.type).base <= 1 && !KEY.includes(x.type) && !D(s, x.type).mechanics.age);
        if (j) { const r = exec(s, { op: 'remove', uid: j.uid, confirmEmpty: false }); if (r) { s = r; note(before, s); continue; } }
      }
      s = exec(s, { op: 'spin' });
      if (!s) break;
      if (s.last) income += s.last.total;
      note(before, s);
    } else if (s.phase === 'SYMBOL_CHOICE') {
      const c = s.offer.choices || [];
      if (!c.length) { s = exec(s, { op: 'skip' }); note(before, s); continue; }
      const score = id => {
        const d = D(s, id); let v = d.base * 2;
        if (KEY.includes(id)) v += 14;
        if (d.tags.includes('resonance')) v += 6;
        if (d.tags.includes('junk')) v -= 20;
        return v;
      };
      const best = c.slice().sort((a, b) => score(b) - score(a))[0];
      s = (score(best) < 2 || s.pool.length >= 200) ? exec(s, { op: 'skip' }) : exec(s, { op: 'choose', id: best });
      note(before, s);
    } else if (s.phase === 'ITEM_CHOICE') {
      const c = s.offer.choices || [];
      s = c.length ? exec(s, { op: 'item', id: c[0] }) : exec(s, { op: 'skipItem' });
      note(before, s);
    } else if (s.phase === 'EVENT_CHOICE') {
      s = exec(s, { op: 'event', option: 'B', id: s.events.choice.id });
      note(before, s);
    } else break;
  }
  return { perStage, won: !!(s && s.phase === 'WON'), finalStage: s ? s.stageId : 0 };
}

const F = load();
const RUNS = Number(process.argv[2] || 60);
console.log('=== 测量可达收入曲线（' + RUNS + ' 局，协同策略）===\n');

const byStage = Array.from({ length: 10 }, () => []);
for (let g = 0; g < RUNS; g++) {
  const r = play(F, 'DERIVE-' + g);
  for (const [st, inc] of Object.entries(r.perStage)) byStage[Number(st) - 1].push(inc);
}

console.log('  期  样本   P25   中位    P75    均值');
const stats = [];
for (let i = 0; i < 10; i++) {
  const a = byStage[i].slice().sort((x, y) => x - y);
  if (!a.length) { console.log('  ' + String(i + 1).padStart(2) + '     0      -      -      -       -'); stats.push(null); continue; }
  const q = p => a[Math.min(a.length - 1, Math.floor(a.length * p))];
  const mean = a.reduce((x, y) => x + y, 0) / a.length;
  console.log('  ' + String(i + 1).padStart(2) + '  ' + String(a.length).padStart(4) +
    '  ' + String(q(.25)).padStart(5) + '  ' + String(q(.5)).padStart(6) +
    '  ' + String(q(.75)).padStart(5) + '  ' + mean.toFixed(0).padStart(6));
  stats.push({ n: a.length, p25: q(.25), p50: q(.5), p75: q(.75), mean });
}

console.log('\n=== 反推配额建议 ===');
console.log('  原则：配额应让「中位收入」有合理富余（好策略能过、差策略过不去）');
console.log('  期   中位收入   建议配额(中位×0.85)   现配额');
const current = Array.from(F.NORMAL_PAYMENTS);
const suggested = [];
for (let i = 0; i < 10; i++) {
  if (!stats[i]) { suggested.push(current[i]); console.log('  ' + String(i + 1).padStart(2) + '      -            (沿用 ' + current[i] + ')        ' + current[i]); continue; }
  // 用中位收入 × 0.85：好策略稳过，差策略吃紧
  const sug = Math.max(1, Math.round(stats[i].p50 * 0.85 / 5) * 5);
  suggested.push(sug);
  console.log('  ' + String(i + 1).padStart(2) + '  ' + String(stats[i].p50).padStart(8) +
    '        ' + String(sug).padStart(10) + '          ' + String(current[i]).padStart(6));
}
console.log('\n  建议表: [' + suggested.join(',') + ']');
console.log('  合计: ' + suggested.reduce((a, b) => a + b, 0));
