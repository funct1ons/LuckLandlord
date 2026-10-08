'use strict';
/**
 * 诊断：为什么收益在第 4 期后停滞？
 * 检查：池子长大了，但产出没有跟着长——是哪些环节断了？
 */
const fs = require('node:fs'); const vm = require('node:vm'); const path = require('node:path');
const ROOT = path.resolve(__dirname, '..', '..');
const FILES = ['js/gdd1/contract.js','js/gdd1/rng.js','js/gdd1/schema.js','js/gdd1/save.js','js/gdd1/full-save.js','js/gdd1/content.js','js/gdd1/full-content.js','js/gdd1/full-effects.js','js/gdd1/descriptions.js','js/gdd1/offers.js','js/gdd1/resolver.js','js/gdd1/controller.js','js/gdd1/full-controller.js'];
const ctx = { window: {}, console, Object, JSON, Math, Array, String, Number, Boolean, Date, Set, Map, Error, isFinite, parseInt, parseFloat };
ctx.globalThis = ctx; ctx.window.window = ctx.window; vm.createContext(ctx);
for (const f of FILES) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
const F = ctx.window.GDD1;
const D = (s, id) => F.defs(s).symbols[id];
const exec = (s, c) => { const r = F.fullCommand(s, Object.assign({ revision: s.revision, windowId: s.offer.windowId }, c)); return r.ok ? r.state : null; };
const KEY = ['harbor_conductor','chord_frame','dock_chime','pitch_fork','fog_reed','beat_spool','prism_hum','silence_keeper'];

console.log('=== 统计：一局中的倍率触发情况 ===');
let s = F.fullNewRun('DIAG-X');
let multRounds = 0, totalRounds = 0, addRounds = 0, ledgerRows = 0;
const stageStats = {};
for (let i = 0; i < 3000; i++) {
  if (!s || s.phase === 'WON' || s.phase === 'LOST') break;
  if (s.phase === 'READY') {
    if (s.removeTokens > 0) {
      const j = s.pool.find(x => ['spent_gasket','arrears_slip'].includes(x.type)) ||
                s.pool.find(x => D(s, x.type).base <= 1 && !KEY.includes(x.type) && !D(s, x.type).mechanics.age);
      if (j) { const r = exec(s, { op: 'remove', uid: j.uid, confirmEmpty: false }); if (r) { s = r; continue; } }
    }
    s = exec(s, { op: 'spin' });
  } else if (s.phase === 'SYMBOL_CHOICE') {
    if (s.last) {
      totalRounds++;
      const hasMult = s.last.ledger.some(x => x.ratio[0] !== '1');
      const hasAdd = s.last.log.some(x => x.action === 'add');
      if (hasMult) multRounds++;
      if (hasAdd) addRounds++;
      ledgerRows += s.last.ledger.length;
      const st = s.stageId;
      stageStats[st] = stageStats[st] || { rounds: 0, withMult: 0, withAdd: 0, income: 0, boards: 0 };
      stageStats[st].rounds++; stageStats[st].income += s.last.total;
      stageStats[st].boards += s.last.board.filter(Boolean).length;
      if (hasMult) stageStats[st].withMult++;
      if (hasAdd) stageStats[st].withAdd++;
    }
    const c = s.offer.choices || [];
    if (!c.length) { s = exec(s, { op: 'skip' }); continue; }
    const score = id => { const d = D(s, id); let v = d.base * 2; if (KEY.includes(id)) v += 14; if (d.tags.includes('resonance')) v += 6; if (d.tags.includes('junk')) v -= 20; return v; };
    const best = c.slice().sort((a, b) => score(b) - score(a))[0];
    s = (score(best) < 2 || s.pool.length >= 200) ? exec(s, { op: 'skip' }) : exec(s, { op: 'choose', id: best });
  } else if (s.phase === 'ITEM_CHOICE') { const c = s.offer.choices || []; s = c.length ? exec(s, { op: 'item', id: c[0] }) : exec(s, { op: 'skipItem' }); }
  else if (s.phase === 'EVENT_CHOICE') s = exec(s, { op: 'event', option: 'B', id: s.events.choice.id });
  else break;
}

console.log('  总轮数 ' + totalRounds + '，其中出现倍率的轮次 ' + multRounds + ' (' + (multRounds / totalRounds * 100).toFixed(0) + '%)');
console.log('  出现 add 动作的轮次 ' + addRounds + ' (' + (addRounds / totalRounds * 100).toFixed(0) + '%)');
console.log('  平均上盘格数 ' + (ledgerRows / totalRounds).toFixed(1));

console.log('\n=== 逐期：每轮均收益 / 上盘格 / 倍率轮占比 / 加值轮占比 ===');
console.log('  期  轮数  每轮均  上盘格  倍率轮  加值轮');
for (const st of Object.keys(stageStats).sort((a, b) => a - b)) {
  const x = stageStats[st];
  console.log('  ' + String(st).padStart(2) + '  ' + String(x.rounds).padStart(4) +
    '  ' + (x.income / x.rounds).toFixed(1).padStart(6) +
    '  ' + (x.boards / x.rounds).toFixed(1).padStart(6) +
    '  ' + (x.withMult / x.rounds * 100).toFixed(0).padStart(5) + '%' +
    '  ' + (x.withAdd / x.rounds * 100).toFixed(0).padStart(5) + '%');
}

console.log('\n=== 关键：池子长大了，但每轮抽到几格？ ===');
console.log('  终局池大小: ' + s.pool.length);
console.log('  盘面只有 20 格 → 池越大，' + '"想要的符号同时上盘"越难');
console.log('  这是收益停滞的直接原因：符号变多了，但每轮的产出面积没变');

console.log('\n=== 结论 ===');
console.log('  1. 上盘格数固定 20，池子增长只增加"选择"，不增加"产出面积"');
console.log('  2. 加值/倍率需要多个符号同时上盘且位置正确，概率随池子增大而降低');
console.log('  3. 因此：不删除的玩家，收益会锁死在基础值×20 的水平');
console.log('  4. 要打破停滞，需要的是"能持续放大单格产出"的机制（永久成长/叠加倍率），');
console.log('     而不是继续往池子里加符号');
