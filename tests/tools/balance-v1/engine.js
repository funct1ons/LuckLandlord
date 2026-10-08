'use strict';
/**
 * tests/tools/balance-v1/engine.js
 *
 * 把 js/gdd1/*.js 按 index.html 之外的真实加载顺序读进隔离 vm 上下文，
 * 并支持「白名单参数覆盖 + 生效校验」。
 *
 * 边界：
 *   - 只读源码，不写任何游戏文件；覆盖只作用于内存中的定义对象。
 *   - 覆盖白名单之外的 target 一律报错，不静默忽略。
 *   - 覆盖必须能被读回验证；读不回目标值即抛错（对应方案 §2.6：
 *     full-effects.js 末尾的 exactMetadata 会覆盖前面 rows 的同名字段）。
 */
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const crypto = require('node:crypto');

// __dirname = <repo>/tests/tools/balance-v1
const ROOT = path.resolve(__dirname, '..', '..', '..');

// 与 tests/tools/balance-lab.js 相同的加载顺序，保证行为一致。
const ENGINE_FILES = [
  'js/gdd1/contract.js', 'js/gdd1/rng.js', 'js/gdd1/schema.js', 'js/gdd1/save.js',
  'js/gdd1/full-save.js', 'js/gdd1/content.js', 'js/gdd1/full-content.js', 'js/gdd1/full-effects.js',
  'js/gdd1/descriptions.js', 'js/gdd1/offers.js', 'js/gdd1/resolver.js', 'js/gdd1/controller.js',
  'js/gdd1/full-controller.js'
];

const OFFERS_FILE = 'js/gdd1/offers.js';
const SYMBOL_WEIGHTS_PATTERN = /const symbolWeights=(\[\[[\s\S]*?\]\]);/;
const ITEM_WEIGHTS_PATTERN = /const itemWeights=(\[\[[\s\S]*?\]\]);/;

const RARITIES = ['common', 'uncommon', 'rare', 'epic'];

function sha256(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(stableStringify).join(',') + ']';
  const keys = Object.keys(value).sort();
  return '{' + keys.map(k => JSON.stringify(k) + ':' + stableStringify(value[k])).join(',') + '}';
}

function clone(x) { return JSON.parse(JSON.stringify(x)); }

/** 读取源码；weight 覆盖通过「精确单次匹配的字符串替换」实现，匹配失败即报错而非猜测。 */
function readSources(weightOverrides) {
  const sources = new Map();
  for (const f of ENGINE_FILES) sources.set(f, fs.readFileSync(path.join(ROOT, f), 'utf8'));
  const notes = [];
  if (weightOverrides && weightOverrides.length) {
    let src = sources.get(OFFERS_FILE);
    const symbolWeights = clone(readArrayLiteral(src, SYMBOL_WEIGHTS_PATTERN, 'symbolWeights'));
    const itemWeights = clone(readArrayLiteral(src, ITEM_WEIGHTS_PATTERN, 'itemWeights'));
    for (const o of weightOverrides) {
      if (o.target === 'symbolWeightRow') {
        assertIndex(o.index, symbolWeights.length, 'symbolWeightRow.index');
        symbolWeights[o.index] = o.value;
      } else {
        assertIndex(o.index, itemWeights.length, 'itemWeightRow.index');
        itemWeights[o.index] = o.value;
      }
    }
    src = patchOnce(src, OFFERS_FILE, 'const symbolWeights=' + JSON.stringify(symbolWeights) + ';',
      SYMBOL_WEIGHTS_PATTERN, 'symbolWeights');
    src = patchOnce(src, OFFERS_FILE, 'const itemWeights=' + JSON.stringify(itemWeights) + ';',
      ITEM_WEIGHTS_PATTERN, 'itemWeights');
    sources.set(OFFERS_FILE, src);
    notes.push({ kind: 'weights', symbolWeights, itemWeights });
  }
  return { sources, notes };
}

function readArrayLiteral(src, pattern, name) {
  const m = src.match(pattern);
  if (!m) throw new Error('配置不可用：' + name + ' 源码模式未匹配（offers.js 结构已变化）');
  try { return JSON.parse(m[1]); }
  catch (e) { throw new Error('配置不可用：' + name + ' 不是合法 JSON 字面量'); }
}

function patchOnce(src, file, replacement, pattern, name) {
  const m = src.match(new RegExp(pattern.source, 'g'));
  if (!m || m.length !== 1) {
    throw new Error('配置不可用：' + file + ' 中 ' + name + ' 出现 ' + (m ? m.length : 0) + ' 次，拒绝模糊替换');
  }
  return src.replace(pattern, () => replacement);
}

function assertIndex(value, length, name) {
  if (!Number.isInteger(value) || value < 0 || value >= length) {
    throw new Error('配置不可用：' + name + ' 必须是 0..' + (length - 1) + ' 的整数');
  }
}

function integerArray(value, length, name, opts) {
  const o = opts || {};
  if (!Array.isArray(value) || value.length !== length) {
    throw new Error('配置不可用：' + name + ' 必须是长度 ' + length + ' 的数组');
  }
  for (const v of value) {
    if (!Number.isInteger(v)) throw new Error('配置不可用：' + name + ' 只能包含整数（不允许小数四舍五入）');
    if (o.positive && v <= 0) throw new Error('配置不可用：' + name + ' 必须为正整数');
    if (v < 0) throw new Error('配置不可用：' + name + ' 不能为负');
  }
  if (o.increasing) {
    for (let i = 1; i < value.length; i++) {
      // 不自动修正单调性：修表是调用方的事，工具只拒绝。
      if (value[i] <= value[i - 1]) throw new Error('配置不可用：' + name + ' 必须严格递增（工具不会自动修正）');
    }
  }
  if (o.sum !== undefined) {
    const sum = value.reduce((a, b) => a + b, 0);
    if (sum !== o.sum) throw new Error('配置不可用：' + name + ' 合计必须为 ' + o.sum + '，实为 ' + sum);
  }
  return value.slice();
}

/** 切片配额 = 完整表 ×0.65 向上取整（与 contract.js 的 F1 契约 §1 保持一致）。 */
function deriveSlicePayments(normal) {
  return normal.map(x => Math.ceil(x * 65 / 100));
}

function getPath(obj, pathStr) {
  return pathStr.split('.').reduce((acc, k) => (acc === undefined || acc === null ? undefined : acc[k]), obj);
}

function setPath(obj, pathStr, value) {
  const keys = pathStr.split('.');
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (cur[keys[i]] === undefined || cur[keys[i]] === null) throw new Error('配置不可用：路径 ' + pathStr + ' 不存在');
    cur = cur[keys[i]];
  }
  cur[keys[keys.length - 1]] = value;
}

const OVERRIDE_TARGETS = new Set([
  'normalPayments', 'slicePayments', 'spins', 'symbolWeightRow', 'itemWeightRow',
  'symbolBase', 'symbolTags', 'symbolRarity', 'symbolEffect', 'symbolMechanic'
]);

/**
 * 应用白名单覆盖。任何非法/越界/未生效都抛错，绝不静默。
 * @returns {Array} applied 记录，含 before/after，便于输出「生效参数」证据。
 */
function applyOverrides(F, overrides) {
  const applied = [];
  const weightRows = [];
  // 若同一份配置显式给了 slicePayments，就以它为准，不用派生值覆盖。
  const hasExplicitSlice = (overrides || []).some(o => o && o.target === 'slicePayments');
  for (const o of overrides || []) {
    if (!o || typeof o !== 'object') throw new Error('配置不可用：override 必须是对象');
    if (!OVERRIDE_TARGETS.has(o.target)) {
      throw new Error('配置不可用：target「' + o.target + '」不在白名单内（允许：' + [...OVERRIDE_TARGETS].join(', ') + '）');
    }
    switch (o.target) {
      case 'normalPayments': {
        const next = integerArray(o.value, 10, 'normalPayments', { positive: true, increasing: true });
        const before = Array.from(F.NORMAL_PAYMENTS);
        // 保留 profile 差异：切片表是完整表的 ×0.65 向上取整，不写两套来源。
        const slice = hasExplicitSlice
          ? Array.from(F.SLICE_PAYMENTS)
          : deriveSlicePayments(next);
        F.NORMAL_PAYMENTS = Object.freeze(next.slice());
        F.SLICE_PAYMENTS = Object.freeze(slice.slice());
        const profiles = {};
        for (const [k, v] of Object.entries(F.PROFILES)) {
          const table = k === 'full-v1' ? next : slice;
          profiles[k] = Object.freeze(Object.assign({}, v, { payments: Object.freeze(table.slice()) }));
        }
        F.PROFILES = Object.freeze(profiles);
        applied.push({
          target: o.target, before, after: next.slice(), derivedSlice: slice.slice(),
          sliceRecomputed: !hasExplicitSlice
        });
        break;
      }
      case 'slicePayments': {
        const next = integerArray(o.value, 10, 'slicePayments', { positive: true, increasing: true });
        const before = Array.from(F.SLICE_PAYMENTS);
        F.SLICE_PAYMENTS = Object.freeze(next.slice());
        const profiles = {};
        for (const [k, v] of Object.entries(F.PROFILES)) {
          profiles[k] = Object.freeze(Object.assign({}, v,
            k === 'slice-abd-v1' ? { payments: Object.freeze(next.slice()) } : {}));
        }
        F.PROFILES = Object.freeze(profiles);
        applied.push({ target: o.target, before, after: next.slice() });
        break;
      }
      case 'spins': {
        const next = integerArray(o.value, 10, 'spins', { positive: true });
        const before = Array.from(F.NORMAL_SPINS);
        F.NORMAL_SPINS = Object.freeze(next.slice());
        applied.push({ target: o.target, before, after: next.slice() });
        break;
      }
      case 'symbolWeightRow':
      case 'itemWeightRow': {
        const value = integerArray(o.value, 4, o.target, { sum: 100 });
        assertIndex(o.index, o.target === 'symbolWeightRow' ? 5 : 3, o.target + '.index');
        weightRows.push({ target: o.target, index: o.index, value });
        applied.push({ target: o.target, index: o.index, after: value.slice() });
        break;
      }
      case 'symbolBase': {
        const d = F.fullSymbols[o.id];
        if (!d) throw new Error('配置不可用：未知符号 ' + o.id);
        if (!Number.isInteger(o.value)) throw new Error('配置不可用：symbolBase 必须是整数');
        const before = d.base;
        d.base = o.value;
        applied.push({ target: o.target, id: o.id, before, after: d.base });
        break;
      }
      case 'symbolTags': {
        const d = F.fullSymbols[o.id];
        if (!d) throw new Error('配置不可用：未知符号 ' + o.id);
        if (!Array.isArray(o.value) || !o.value.length || o.value.some(x => typeof x !== 'string' || !x)) {
          throw new Error('配置不可用：symbolTags 必须是非空字符串数组');
        }
        const before = d.tags.slice();
        d.tags = o.value.slice();
        applied.push({ target: o.target, id: o.id, before, after: d.tags.slice() });
        break;
      }
      case 'symbolRarity': {
        const d = F.fullSymbols[o.id];
        if (!d) throw new Error('配置不可用：未知符号 ' + o.id);
        if (!RARITIES.includes(o.value)) throw new Error('配置不可用：symbolRarity 必须是 ' + RARITIES.join('/'));
        const before = d.rarity;
        d.rarity = o.value;
        applied.push({ target: o.target, id: o.id, before, after: d.rarity });
        break;
      }
      case 'symbolEffect': {
        const d = F.fullSymbols[o.id];
        if (!d) throw new Error('配置不可用：未知符号 ' + o.id);
        const effects = d.effects || [];
        assertIndex(o.index, effects.length, 'symbolEffect.index');
        const field = o.path;
        if (!['ratio', 'amount', 'reward'].includes(field)) {
          throw new Error('配置不可用：symbolEffect.path 只允许 ratio/amount/reward');
        }
        const target = effects[o.index];
        const before = clone(target[field]);
        if (field === 'ratio') {
          const ratio = integerArray(o.value, 2, 'ratio', { positive: true });
          target.ratio = ratio;
        } else {
          if (!Number.isInteger(o.value)) throw new Error('配置不可用：' + field + ' 必须是整数');
          target[field] = o.value;
        }
        applied.push({ target: o.target, id: o.id, index: o.index, path: field, before, after: clone(target[field]) });
        break;
      }
      case 'symbolMechanic': {
        const d = F.fullSymbols[o.id];
        if (!d) throw new Error('配置不可用：未知符号 ' + o.id);
        if (!['pressure.reward', 'pressure.cap'].includes(o.path)) {
          throw new Error('配置不可用：symbolMechanic.path 只允许 pressure.reward / pressure.cap');
        }
        if (!Number.isInteger(o.value)) throw new Error('配置不可用：symbolMechanic 值必须是整数');
        if (!d.mechanics || !d.mechanics.pressure) throw new Error('配置不可用：' + o.id + ' 没有 pressure 机制');
        const before = getPath(d.mechanics, o.path);
        setPath(d.mechanics, o.path, o.value);
        applied.push({ target: o.target, id: o.id, path: o.path, before, after: getPath(d.mechanics, o.path) });
        break;
      }
      /* istanbul ignore next */
      default:
        throw new Error('配置不可用：未处理的 target ' + o.target);
    }
  }
  return { applied, weightRows };
}

/** 读回校验：每个覆盖都必须能在「完全加载后」的定义里读到目标值。 */
function verifyOverrides(F, applied, notes) {
  const problems = [];
  for (const a of applied) {
    const readBack = () => {
      switch (a.target) {
        case 'normalPayments': return Array.from(F.PROFILES['full-v1'].payments);
        case 'slicePayments': return Array.from(F.PROFILES['slice-abd-v1'].payments);
        case 'spins': return Array.from(F.NORMAL_SPINS);
        case 'symbolBase': return F.fullSymbols[a.id].base;
        case 'symbolTags': return F.fullSymbols[a.id].tags;
        case 'symbolRarity': return F.fullSymbols[a.id].rarity;
        case 'symbolEffect': return F.fullSymbols[a.id].effects[a.index][a.path];
        case 'symbolMechanic': return getPath(F.fullSymbols[a.id].mechanics, a.path);
        default: return null;
      }
    };
    if (a.target === 'symbolWeightRow' || a.target === 'itemWeightRow') continue; // 由 notes 校验
    const actual = readBack();
    if (stableStringify(actual) !== stableStringify(a.after)) {
      problems.push(a.target + (a.id ? '/' + a.id : '') + ' 覆盖未生效：期望 ' +
        stableStringify(a.after) + '，实际 ' + stableStringify(actual));
    }
  }
  const note = (notes || []).find(n => n.kind === 'weights');
  if (note) {
    for (const a of applied) {
      if (a.target === 'symbolWeightRow') {
        if (stableStringify(note.symbolWeights[a.index]) !== stableStringify(a.after)) {
          problems.push('symbolWeightRow#' + a.index + ' 覆盖未生效');
        }
      }
      if (a.target === 'itemWeightRow') {
        if (stableStringify(note.itemWeights[a.index]) !== stableStringify(a.after)) {
          problems.push('itemWeightRow#' + a.index + ' 覆盖未生效');
        }
      }
    }
  }
  if (problems.length) throw new Error('参数覆盖未生效（拒绝继续）：\n  - ' + problems.join('\n  - '));
}

const FOCUS_IDS = ['chord_frame', 'harbor_conductor', 'silence_keeper', 'sorting_runner',
  'return_station', 'pressure_pouch', 'feed_valve'];

/** 完全加载后的有效参数快照。 */
function effectiveParams(F, loaded) {
  const symbolWeights = loaded.symbolWeights;
  const itemWeights = loaded.itemWeights;
  const symbols = {};
  for (const [id, d] of Object.entries(F.fullSymbols)) {
    symbols[id] = {
      name: d.name, rarity: d.rarity, tags: (d.tags || []).slice(), base: d.base,
      mechanics: clone(d.mechanics || {}),
      effects: (d.effects || []).map(e => clone(e))
    };
  }
  const items = {};
  for (const [id, d] of Object.entries(F.fullItems)) {
    items[id] = { name: d.name, rarity: d.rarity, mechanics: clone(d.mechanics || {}), effects: (d.effects || []).map(e => clone(e)) };
  }
  const events = {};
  for (const [id, d] of Object.entries(F.fullEvents)) events[id] = clone(d);
  const profileSummary = {};
  for (const [k, v] of Object.entries(F.PROFILES)) {
    profileSummary[k] = { symbols: v.symbols.length, items: v.items.length, events: v.events.length, payments: Array.from(v.payments) };
  }
  const focus = {};
  for (const id of FOCUS_IDS) {
    const d = F.fullSymbols[id];
    focus[id] = d ? { base: d.base, rarity: d.rarity, mechanics: clone(d.mechanics || {}), effects: (d.effects || []).map(e => clone(e)) } : null;
  }
  return {
    schema: F.SCHEMA, rules: F.RULES, content: F.CONTENT, rngAlgorithm: F.RNG_ALGORITHM,
    profiles: profileSummary,
    normalSpins: Array.from(F.NORMAL_SPINS),
    symbolWeights: clone(symbolWeights),
    itemWeights: clone(itemWeights),
    focus,
    symbols, items, events
  };
}

/**
 * 加载引擎。
 * @param {object} config 已解析的配置 {id, description, overrides: []}
 */
function loadEngine(config) {
  const cfg = config || { id: 'P0-baseline', overrides: [] };
  const weightOverrides = (cfg.overrides || []).filter(o => o.target === 'symbolWeightRow' || o.target === 'itemWeightRow');
  const { sources, notes } = readSources(weightOverrides);

  const srcHashes = {};
  for (const [f, text] of sources) srcHashes[f] = sha256(text);
  const combined = sha256(ENGINE_FILES.map(f => f + ':' + srcHashes[f]).join('\n'));

  const ctx = {
    window: {}, console, Object, JSON, Math, Array, String, Number, Boolean, Date,
    Set, Map, Error, TypeError, RangeError, isFinite, isNaN, parseInt, parseFloat, BigInt, Symbol
  };
  ctx.globalThis = ctx;
  ctx.window.window = ctx.window;
  vm.createContext(ctx);
  for (const f of ENGINE_FILES) {
    vm.runInContext(sources.get(f), ctx, { filename: f });
  }
  const F = ctx.window.GDD1;

  const note = notes.find(n => n.kind === 'weights');
  const loadedWeights = {
    symbolWeights: note ? note.symbolWeights : readArrayLiteral(sources.get(OFFERS_FILE), SYMBOL_WEIGHTS_PATTERN, 'symbolWeights'),
    itemWeights: note ? note.itemWeights : readArrayLiteral(sources.get(OFFERS_FILE), ITEM_WEIGHTS_PATTERN, 'itemWeights')
  };

  const { applied } = applyOverrides(F, cfg.overrides || []);
  verifyOverrides(F, applied, notes);

  const configHash = sha256(stableStringify({ id: cfg.id || null, overrides: cfg.overrides || [] }));

  return {
    F,
    srcHashes,
    sourceHash: combined,
    engineFiles: ENGINE_FILES.slice(),
    configHash,
    configId: cfg.id || 'P0-baseline',
    appliedOverrides: applied,
    effective: effectiveParams(F, loadedWeights)
  };
}

module.exports = {
  ROOT,
  ENGINE_FILES,
  FOCUS_IDS,
  loadEngine,
  sha256,
  stableStringify,
  clone
};
