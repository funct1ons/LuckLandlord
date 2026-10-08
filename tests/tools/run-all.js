'use strict';
/**
 * 开发自检工具集：一次跑完全部轻量验证。
 *   node tests/tools/run-all.js
 *
 * 这些不是"审核证据"，而是改代码时的快速反馈：
 *   - 逻辑是否还能跑通
 *   - 动画是否意外影响了逻辑
 *   - 图标/音效是否还完整
 *   - 说明书里的数值是否和代码一致
 */
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

const dir = __dirname;
const SUITES = [
  ['smoke-play.js', '引擎完整跑一局（无头）'],
  ['mechanics-runtime.js', '核心机制运行时验证'],
  ['mechanics-targeted.js', '定向机制验证（保留位/复制/消耗/道具）'],
  ['icons-coverage.js', '图标覆盖度与降级'],
  ['icons-uniqueness.js', '图标唯一性（无碰撞）'],
  ['audio-silent-fallback.js', '音效静默降级与合成路径'],
  ['animation-isolation.js', '动画档位不影响逻辑'],
  ['player-text.js', '104项玩家文案与定义一致'],
  ['audio-lifecycle.js', '音频手势门控与生命周期'],
  ['settings-keys.js', '独立设置与快捷键'],
  ['player-guide-facts.js', '说明书数值与代码一致']
];

let failed = 0;
const results = [];

for (const [file, label] of SUITES) {
  const full = path.join(dir, file);
  if (!fs.existsSync(full)) { results.push([file, label, 'MISSING', '']); failed++; continue; }
  const r = spawnSync(process.execPath, [full], { encoding: 'utf8', timeout: 300000 });
  const out = (r.stdout || '') + (r.stderr || '');
  const lines = out.trim().split('\n').filter(Boolean);
  const summary = lines.length ? lines[lines.length - 1].trim().slice(0, 70) : '';
  const ok = r.status === 0;
  if (!ok) failed++;
  results.push([file, label, ok ? 'PASS' : 'FAIL', summary]);
  console.log((ok ? 'PASS ' : 'FAIL ') + file.padEnd(30) + label);
  if (!ok && summary) console.log('      ' + summary);
}

console.log('');
console.log(`${SUITES.length - failed}/${SUITES.length} tools passed`);
process.exitCode = failed ? 1 : 0;
