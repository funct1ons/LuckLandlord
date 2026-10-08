'use strict';
/**
 * tests/tools/balance-v1/seeds.js
 *
 * 固定 seed 合同。清单是代码内的确定性生成规则 + 显式清单文件，不删除坏 seed。
 */
const fs = require('node:fs');
const path = require('node:path');

/** 训练集前缀（工作包A只允许使用训练集；留出集本轮禁止运行）。 */
const TRAIN_PREFIX = 'B1-TRAIN-';
const HOLDOUT_PREFIX = 'B1-HOLDOUT-';

/** 10 个固定自检 seed：覆盖 5 个路线组标签与常见局面，序号固定后不再改动。 */
function selfCheckSeeds() {
  return Array.from({ length: 10 }, (_, i) => TRAIN_PREFIX + String(i).padStart(4, '0'));
}

/** 训练集前 n 个 seed（与 balance-lab 的 BAL-* 命名无关，保证策略间共享同一名单）。 */
function trainSeeds(n) {
  const out = [];
  for (let i = 0; i < n; i++) out.push(TRAIN_PREFIX + String(i).padStart(4, '0'));
  return out;
}

function hashSeeds(seeds) {
  const crypto = require('node:crypto');
  return crypto.createHash('sha256').update(JSON.stringify(seeds)).digest('hex');
}

function writeSeedList(file, seeds, meta) {
  const payload = Object.assign({ count: seeds.length, seedsHash: hashSeeds(seeds), seeds }, meta || {});
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(payload, null, 2) + '\n', 'utf8');
  return payload.seedsHash;
}

module.exports = { TRAIN_PREFIX, HOLDOUT_PREFIX, selfCheckSeeds, trainSeeds, hashSeeds, writeSeedList };
