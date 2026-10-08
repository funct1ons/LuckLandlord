'use strict';
/**
 * 验证假设：收益停滞是因为池子太大，而不是内容不够。
 * 对比两种策略：
 *   A 温和删除（只删 junk 和 base<=1）
 *   B 激进精简（主动把池子压到 ~20，让关键符号高概率同时上盘）
 */
const fs = require('node:fs'); const vm = require('node:vm'); const path = require('node:path');
const ROOT = path.resolve(__dirname, '..', '..');
const FILES = ['js/gdd1/contract.js','js/gdd1/rng.js','js/gdd1/schema.js','js/gdd1/save.js','js/gdd1/full-save.js','js/gdd1/content.js','js/gdd1/full-content.js','js/gdd1/full-effects.js','js/gdd1/descriptions.js','js/gdd1/offers.js','js/gdd1/resolver.js','js/gdd1/controller.js','js/gdd1/full-controller.js'];
function load() {
  const ctx = { window: {}, console, Object, JSON, Math, Array, String, Number, Boolean, Date, Set, Map, Error, isFinite, parseInt, parseFloat };
  ctx.globalThis = ctx; ctx.window.window = ctx.window; vm.createContext(ctx);
  for (const f of FILES) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
  return ctx.window.GDD1;
}
const F = load();
const D = (s, id) => F.defs(s).symbols[id];
const exec = (s, c) => { const r = F.fullCommand(s, Object.assign({ revision: s.revision, windowId: s.offer.windowId }, c)); return r.ok ? r.state : null; };

// 共鸣核心：这些符号决定倍率能否叠起来
const CORE = ['harbor_conductor','chord_frame','dock_chime','pitch_fork','fog_reed','beat_spool','prism_hum','silence_keeper'];
const GOOD = CORE.concat(['nursery_gauge','furnace_auditor','manifest_desk','settlement_beacon','demand_coupler','crystal_index','tide_prism','amber_frond','dew_lantern','blank_facet','offset_reader','cleared_stub','saline_ampoule','wick_bed']);

function play(seed, mode, targetPool) {
  const perStage = {}; let income = 0;
  const note = (before, after) => { if (after && after.stageId !== before) { perStage[before] = income; income = 0; } };
  let s = F.fullNewRun(seed);
  for (let i = 0; i < 4000; i++) {
    if (!s || s.phase === 'WON' || s.phase === 'LOST') break;
    const before = s.stageId;
    if (s.phase === 'READY') {
      // 删除优先级：junk > 不在 GOOD 里 > 重复 type 中 base 最低的
      if (s.removeTokens > 0 && s.pool.length > (mode === 'prune' ? targetPool : 0)) {
        let victim = s.pool.find(x => ['spent_gasket','arrears_slip'].includes(x.type));
        if (!victim && mode === 'prune') victim = s.pool.find(x => !GOOD.includes(x.type));
        if (!victim && mode === 'prune') {
          // 同 type 重复时，删掉最弱的（永久值最低、base 最低）
          const byType = {};
          for (const x of s.pool) (byType[x.type] = byType[x.type] || []).push(x);
          let worst = null;
          for (const [t, arr] of Object.entries(byType)) {
            if (arr.length < 2) continue;
            arr.sort((a, b) => (a.permanent + D(s, a.type).base) - (b.permanent + D(s, b.type).base));
            if (!worst || (arr[0].permanent + D(s, arr[0].type).base) < (worst.permanent + D(s, worst.type).base)) worst = arr[0];
          }
          victim = worst;
        }
        if (!victim && mode === 'mild') victim = s.pool.find(x => D(s, x.type).base <= 1 && !GOOD.includes(x.type));
        if (victim) { const r = exec(s, { op: 'remove', uid: victim.uid, confirmEmpty: false }); if (r) { s = r; note(before, s); continue; } }
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
        if (CORE.includes(id)) v += 16;
        else if (GOOD.includes(id)) v += 6;
        if (d.tags.includes('junk')) v -= 30;
        if (d.rarity === 'rare') v += 3; if (d.rarity === 'epic') v += 8;
        return v;
      };
      const best = c.slice().sort((a, b) => score(b) - score(a))[0];
      // 精简模式：池子已够小就只拿真正想要的
      const threshold = mode === 'prune' ? 8 : 2;
      s = (score(best) < threshold || s.pool.length >= 200) ? exec(s, { op: 'skip' }) : exec(s, { op: 'choose', id: best });
      note(before, s);
    } else if (s.phase === 'ITEM_CHOICE') { const c = s.offer.choices || []; s = c.length ? exec(s, { op: 'item', id: c[0] }) : exec(s, { op: 'skipItem' }); note(before, s); }
    else if (s.phase === 'EVENT_CHOICE') { s = exec(s, { op: 'event', option: 'B', id: s.events.choice.id }); note(before, s); }
    else break;
  }
  return { perStage, won: !!(s && s.phase === 'WON'), pool: s ? s.pool.length : 0, stage: s ? s.stageId : 0, cash: s ? s.cash : 0, payment: s ? s.payment : 0 };
}

const N = Number(process.argv[2] || 30);
for (const [mode, target] of [['mild', 0], ['prune', 20], ['prune', 16]]) {
  let wins = 0; const stageCount = {}; const incomes = [];
  for (let g = 0; g < N; g++) {
    const r = play('PRUNE-' + mode + target + '-' + g, mode, target);
    if (r.won) wins++;
    stageCount[r.stage] = (stageCount[r.stage] || 0) + 1;
    incomes.push(Object.values(r.perStage).reduce((a, b) => a + b, 0));
  }
  const avg = a => (a.reduce((x, y) => x + y, 0) / a.length).toFixed(0);
  console.log(mode + ' (目标池 ' + (target || '不限') + '): 胜 ' + wins + '/' + N +
    '  平均总收益 ' + avg(incomes) +
    '  终止阶段分布 ' + Object.entries(stageCount).sort((a, b) => a[0] - b[0]).map(([k, v]) => '第' + k + '期×' + v).join(' '));
}
