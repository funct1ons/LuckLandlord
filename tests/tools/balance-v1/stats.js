'use strict';
/**
 * tests/tools/balance-v1/stats.js
 *
 * 只做描述统计与区间估计。bootstrap 用固定种子的独立 RNG，保证聚合结果可复现。
 * 注意：两个独立区间的差不能当作配对差区间——配对比较必须用 bootstrapPairedCI。
 */
const { makeRng } = require('./rand');

const Z95 = 1.959963984540054;

/** Wilson 得分区间（比例）。n=0 时返回 null，不假装有区间。 */
function wilson(k, n, z) {
  const zz = z === undefined ? Z95 : z;
  if (!n) return { k, n, p: null, lo: null, hi: null };
  const p = k / n;
  const denom = 1 + (zz * zz) / n;
  const center = (p + (zz * zz) / (2 * n)) / denom;
  const half = (zz * Math.sqrt((p * (1 - p)) / n + (zz * zz) / (4 * n * n))) / denom;
  return { k, n, p, lo: Math.max(0, center - half), hi: Math.min(1, center + half) };
}

/** 线性插值分位数。输入必须升序。 */
function percentile(sorted, q) {
  if (!sorted.length) return null;
  if (sorted.length === 1) return sorted[0];
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

function summarize(values) {
  const nums = values.filter(v => typeof v === 'number' && Number.isFinite(v)).slice().sort((a, b) => a - b);
  if (!nums.length) return { n: 0, mean: null, min: null, p10: null, p50: null, p90: null, p99: null, max: null };
  return {
    n: nums.length,
    mean: nums.reduce((a, b) => a + b, 0) / nums.length,
    min: nums[0],
    p10: percentile(nums, 0.10),
    p50: percentile(nums, 0.50),
    p90: percentile(nums, 0.90),
    p99: percentile(nums, 0.99),
    max: nums[nums.length - 1]
  };
}

/**
 * 配对差 bootstrap 区间。
 * @param {number[]} perSeedDiff 每个共享 seed 的差（如 A胜−B胜 ∈ {-1,0,1}）
 * @param {number} iterations
 * @param {string} seedText 固定种子文本，保证可复现
 */
function bootstrapPairedCI(perSeedDiff, iterations, seedText, alpha) {
  const a = alpha === undefined ? 0.05 : alpha;
  const n = perSeedDiff.length;
  if (!n) return { n: 0, mean: null, lo: null, hi: null, iterations: 0 };
  const rng = makeRng(seedText);
  const mean = perSeedDiff.reduce((x, y) => x + y, 0) / n;
  const means = new Array(iterations);
  for (let i = 0; i < iterations; i++) {
    let sum = 0;
    for (let j = 0; j < n; j++) sum += perSeedDiff[rng.int(n)];
    means[i] = sum / n;
  }
  means.sort((x, y) => x - y);
  return {
    n,
    mean,
    lo: percentile(means, a / 2),
    hi: percentile(means, 1 - a / 2),
    iterations
  };
}

module.exports = { wilson, percentile, summarize, bootstrapPairedCI, Z95 };
