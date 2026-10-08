'use strict';
/**
 * 平衡实验台
 *   node tests/tools/balance-lab.js                     跑基线
 *   node tests/tools/balance-lab.js --payments 0.8      配额整体 ×0.8
 *   node tests/tools/balance-lab.js --mult 1.5          倍率强度 ×1.5（3/2 → 分数放大）
 *   node tests/tools/balance-lab.js --runs 60           每策略局数
 *   node tests/tools/balance-lab.js --matrix            扫参数矩阵
 *
 * 只读取和覆写内存中的定义，不改磁盘文件。
 */
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');

function arg(name, dflt) {
  const i = process.argv.indexOf('--' + name);
  if (i < 0) return dflt;
  const v = process.argv[i + 1];
  return v === undefined || v.startsWith('--') ? true : v;
}

const FILES = ['js/gdd1/contract.js','js/gdd1/rng.js','js/gdd1/schema.js','js/gdd1/save.js',
  'js/gdd1/full-save.js','js/gdd1/content.js','js/gdd1/full-content.js','js/gdd1/full-effects.js',
  'js/gdd1/descriptions.js','js/gdd1/offers.js','js/gdd1/resolver.js','js/gdd1/controller.js',
  'js/gdd1/full-controller.js'];

/** 把小数因子转成最简分数（用于倍率缩放，避免浮点） */
function toFraction(x) {
  let best = [Math.round(x), 1], err = Math.abs(x - Math.round(x));
  for (let d = 2; d <= 12; d++) {
    const n = Math.round(x * d);
    const e = Math.abs(x - n / d);
    if (e < err - 1e-12) { err = e; best = [n, d]; }
  }
  const g = (a, b) => (b ? g(b, a % b) : a);
  const k = g(best[0], best[1]) || 1;
  return [best[0] / k, best[1] / k];
}

/** 载入引擎，可选地在载入后修改参数 */
function loadEngine(opts) {
  const ctx = { window: {}, console, Object, JSON, Math, Array, String, Number, Boolean, Date,
    Set, Map, Error, isFinite, parseInt, parseFloat };
  ctx.globalThis = ctx; ctx.window.window = ctx.window;
  vm.createContext(ctx);
  for (const f of FILES) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
  const F = ctx.window.GDD1;

  const info = {};
  if (opts.payments && opts.payments !== 1) {
    // 配额缩放：PROFILES 是冻结的，整体替换（保持整数、单调递增）
    const scaled = Object.freeze(F.NORMAL_PAYMENTS.map(x => Math.max(1, Math.round(x * opts.payments))));
    for (let i = 1; i < scaled.length; i++) if (scaled[i] <= scaled[i - 1]) scaled[i] = scaled[i - 1] + 1;
    const prof = {};
    for (const [k, v] of Object.entries(F.PROFILES)) prof[k] = Object.freeze(Object.assign({}, v, { payments: scaled }));
    F.PROFILES = Object.freeze(prof);
    info.payments = F.PROFILES['full-v1'].payments;
  }
  if (opts.mult && opts.mult !== 1) {
    // 倍率强度缩放：ratio 分子按最简分数放大，保持整数、维持 BigInt 精确路径
    const [pn, pd] = toFraction(opts.mult);
    let n = 0;
    for (const id of F.SYMBOL_IDS) {
      for (const e of (F.fullSymbols[id].effects || [])) {
        if (e.op === 'multiply' && Array.isArray(e.ratio)) {
          const num = e.ratio[0] * pn, den = e.ratio[1] * pd;
          if (Number.isInteger(num) && Number.isInteger(den) && num <= 64 && den <= 64) { e.ratio = [num, den]; n++; }
        }
      }
    }
    info.multiplied = n + ' 处 (×' + pn + '/' + pd + ')';
  }
  if (opts.base && opts.base !== 1) {
    // 基础值缩放：整数化，保持 base 语义（负数垃圾不上调）
    let n = 0;
    for (const id of F.SYMBOL_IDS) {
      const d = F.fullSymbols[id];
      if (typeof d.base === 'number' && d.base > 0) { d.base = Math.max(1, Math.round(d.base * opts.base)); n++; }
    }
    info.based = n + ' 个符号 (×' + opts.base + ')';
  }
  if (opts.adds && opts.adds !== 1) {
    // 平面加值（add 动作）强度缩放
    let n = 0;
    for (const id of F.SYMBOL_IDS) {
      for (const e of (F.fullSymbols[id].effects || [])) {
        if (e.op === 'add' && typeof e.amount === 'number' && e.amount !== 0) {
          e.amount = Math.round(e.amount * opts.adds); n++;
        }
      }
    }
    info.added = n + ' 处';
  }
  return { F, info };
}

// ── 策略 ──────────────────────────────────────────────
const KEY_SYMBOLS = ['harbor_conductor','chord_frame','dock_chime','pitch_fork','fog_reed',
  'beat_spool','prism_hum','silence_keeper','nursery_gauge','furnace_auditor','manifest_desk',
  'settlement_beacon','demand_coupler','crystal_index','tide_prism','amber_frond','dew_lantern',
  'blank_facet','offset_reader','cleared_stub'];
const JUNK = ['spent_gasket','arrears_slip'];

function makePolicy(F, kind) {
  const D = (s, id) => F.defs(s).symbols[id];
  const score = (s, id) => {
    const d = D(s, id);
    let v = d.base * 2;
    if (kind === 'synergy') {
      if (KEY_SYMBOLS.includes(id)) v += 14;
      if (d.tags.includes('resonance')) v += 6;
    } else if (kind === 'value') {
      if (d.rarity === 'rare') v += 4;
      if (d.rarity === 'epic') v += 8;
      if (d.rarity === 'uncommon') v += 2;
    }
    if (d.tags.includes('junk')) v -= 20;
    return v;
  };
  return {
    score,
    skipBad: kind === 'synergy' || kind === 'greedy',
    deleteJunk: kind !== 'random',
    random: kind === 'random'
  };
}

function playOne(F, seed, kind, capRounds) {
  const pol = makePolicy(F, kind);
  const D = (s, id) => F.defs(s).symbols[id];
  const exec = (s, c) => {
    const r = F.fullCommand(s, Object.assign({ revision: s.revision, windowId: s.offer.windowId }, c));
    return r.ok ? r.state : null;
  };
  let s = F.fullNewRun(seed);
  const marks = { stageReached: 1, totalIncome: 0, rounds: 0 };
  for (let i = 0; i < capRounds * 4; i++) {
    if (!s || s.phase === 'WON' || s.phase === 'LOST') break;
    if (s.phase === 'READY') {
      if (pol.deleteJunk && s.removeTokens > 0) {
        const j = s.pool.find(x => JUNK.includes(x.type)) ||
                  s.pool.find(x => D(s, x.type).base <= 1 && !KEY_SYMBOLS.includes(x.type) && !D(s, x.type).mechanics.age);
        if (j) { const r = exec(s, { op: 'remove', uid: j.uid, confirmEmpty: false }); if (r) { s = r; continue; } }
      }
      s = exec(s, { op: 'spin' });
    } else if (s.phase === 'SYMBOL_CHOICE') {
      if (s.last) { marks.totalIncome += s.last.total; marks.rounds++; }
      const c = s.offer.choices || [];
      if (!c.length) { s = exec(s, { op: 'skip' }); continue; }
      let pick;
      if (pol.random) pick = c[Math.floor(c.length / 2)];
      else pick = c.slice().sort((a, b) => pol.score(s, b) - pol.score(s, a))[0];
      const bad = !pol.random && pol.score(s, pick) < 2 && pol.skipBad;
      s = (bad || s.pool.length >= 200) ? exec(s, { op: 'skip' }) : exec(s, { op: 'choose', id: pick });
    } else if (s.phase === 'ITEM_CHOICE') {
      const c = s.offer.choices || [];
      s = c.length ? exec(s, { op: 'item', id: c[0] }) : exec(s, { op: 'skipItem' });
    } else if (s.phase === 'EVENT_CHOICE') {
      s = exec(s, { op: 'event', option: 'B', id: s.events.choice.id });
    } else break;
    if (s) marks.stageReached = Math.max(marks.stageReached, s.stageId);
  }
  return Object.assign(marks, {
    won: !!(s && s.phase === 'WON'),
    phase: s ? s.phase : 'ERR',
    cash: s ? s.cash : 0,
    payment: s ? s.payment : 0,
    pool: s ? s.pool.length : 0
  });
}

function runSuite(F, kind, runs, capRounds) {
  let wins = 0; const stages = []; let spins = 0; const income = [];
  const losses = {};
  for (let g = 0; g < runs; g++) {
    const r = playOne(F, 'BAL-' + kind + '-' + g, kind, capRounds);
    if (r.won) wins++;
    stages.push(r.stageReached);
    spins += r.rounds;
    income.push(r.totalIncome);
    if (!r.won) losses[r.stageReached] = (losses[r.stageReached] || 0) + 1;
  }
  const avg = a => a.reduce((x, y) => x + y, 0) / a.length;
  return {
    kind, runs, wins,
    winRate: wins / runs,
    avgStage: avg(stages),
    avgSpins: spins / runs,
    avgIncome: avg(income),
    losses
  };
}

// ── 主程序 ────────────────────────────────────────────
function main() {
  const runs = Number(arg('runs', 40));
  const capRounds = 200;
  const opts = {
    payments: Number(arg('payments', 1)),
    mult: Number(arg('mult', 1)),
    base: Number(arg('base', 1)),
    adds: Number(arg('adds', 1))
  };

  if (arg('matrix', false)) {
    const n = Math.min(runs, 24);
    // 单一杠杆各自的效果
    const axes = [
      { name: '配额 ×0.85', o: { payments: 0.85 } },
      { name: '配额 ×0.70', o: { payments: 0.70 } },
      { name: '配额 ×0.55', o: { payments: 0.55 } },
      { name: '倍率 ×1.5', o: { mult: 1.5 } },
      { name: '倍率 ×2', o: { mult: 2 } },
      { name: '基础值 ×1.5', o: { base: 1.5 } },
      { name: '平面加值 ×1.5', o: { adds: 1.5 } },
      { name: '配额0.7+倍率1.5', o: { payments: 0.7, mult: 1.5 } },
      { name: '配额0.7+加值1.5', o: { payments: 0.7, adds: 1.5 } },
      { name: '配额0.7+基础1.5', o: { payments: 0.7, base: 1.5 } }
    ];
    console.log('=== 单杠杆扫描（每格 ' + n + ' 局）===');
    console.log('  调整方案'.padEnd(24) + 'random  value  synergy   技能差');
    for (const a of axes) {
      const { F } = loadEngine(a.o);
      const rs = {};
      for (const k of ['random', 'value', 'synergy']) rs[k] = runSuite(F, k, n, capRounds);
      const pct = r => (r.winRate * 100).toFixed(0).padStart(4) + '%';
      const gap = (rs.synergy.winRate - rs.random.winRate) * 100;
      console.log('  ' + a.name.padEnd(22) + pct(rs.random) + '  ' + pct(rs.value) + '  ' +
        pct(rs.synergy) + '   ' + gap.toFixed(0).padStart(4) + 'pp');
    }
    return;
  }

  const { F, info } = loadEngine(opts);
  console.log('=== 平衡实验台 ===');
  console.log('参数: payments×' + opts.payments + '  mult×' + opts.mult +
    '  base×' + opts.base + '  adds×' + opts.adds);
  if (info.payments) console.log('  实际配额: ' + Array.from(info.payments).join(', '));
  if (info.multiplied) console.log('  倍率调整: ' + info.multiplied);
  if (info.based) console.log('  基础值调整: ' + info.based);
  if (info.added) console.log('  平面加值调整: ' + info.added);
  console.log('每策略 ' + runs + ' 局\n');

  const kinds = ['random', 'value', 'synergy'];
  const results = [];
  for (const k of kinds) {
    const r = runSuite(F, k, runs, capRounds);
    results.push(r);
    const lossStr = Object.entries(r.losses).sort((a, b) => a[0] - b[0])
      .map(([k2, v]) => '第' + k2 + '期×' + v).join(' ');
    console.log('  ' + k.padEnd(9) + ' 胜率 ' + (r.winRate * 100).toFixed(0).padStart(3) + '%' +
      '  平均到达 第' + r.avgStage.toFixed(1) + '期' +
      '  平均 ' + r.avgSpins.toFixed(0) + ' 轮' +
      '  总收益 ' + r.avgIncome.toFixed(0));
    if (lossStr) console.log('            失败分布: ' + lossStr);
  }
  console.log('\n  目标（GDD 13.3）: Synergy 40–70%，且至少高于 Random 15 个百分点');
  const syn = results.find(r => r.kind === 'synergy');
  const rnd = results.find(r => r.kind === 'random');
  if (syn && rnd) {
    const gap = (syn.winRate - rnd.winRate) * 100;
    console.log('  技能差距: ' + gap.toFixed(0) + ' 个百分点 ' + (gap >= 15 ? '✓' : '✗ 需 ≥15'));
    console.log('  Synergy 胜率 ' + (syn.winRate * 100).toFixed(0) + '% ' +
      (syn.winRate >= 0.4 && syn.winRate <= 0.7 ? '✓ 在带内' : '✗ 不在 40–70% 带'));
  }
}

main();
