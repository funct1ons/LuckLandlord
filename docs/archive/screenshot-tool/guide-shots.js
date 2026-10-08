'use strict';
/**
 * 重新生成说明书的游戏截图。
 *   node tests/tools/guide-shots.js
 *
 * 需要本机安装 Edge。截图写入 docs/images/。
 * 这些是真实游戏画面（加载真实引擎与 UI），不是手绘示意图。
 */
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.join(ROOT, 'docs', 'images');
const HARNESS = path.join(OUT, 'shot.html');
const EDGE_CANDIDATES = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
];

function findEdge() {
  for (const p of EDGE_CANDIDATES) if (fs.existsSync(p)) return p;
  return null;
}

const edge = findEdge();
if (!edge) {
  console.log('未找到 Edge，无法生成截图。请手动打开 docs/images/shot.html 截图。');
  process.exit(1);
}
if (!fs.existsSync(HARNESS)) {
  console.log('缺少截图工具页: docs/images/shot.html');
  process.exit(1);
}
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const SHOTS = [
  { name: '01-start', url: 'file:///' + path.join(ROOT, 'gdd1.html').replace(/\\/g, '/'), h: 768, budget: 6000 },
  { name: '02-choice', q: '?spins=3&speed=instant&stop=choice', h: 1080, budget: 25000 },
  { name: '03-board', q: '?spins=18&speed=instant&stop=choice&showledger=1', h: 1080, budget: 25000 },
  { name: '04-pool', q: '?spins=40&speed=instant&stop=choice', h: 1080, budget: 30000 },
  { name: '05-won', q: '?spins=999&speed=instant&stop=won', h: 1080, budget: 40000 }
];

const base = 'file:///' + HARNESS.replace(/\\/g, '/');
let ok = 0;

for (const s of SHOTS) {
  const out = path.join(OUT, s.name + '.png');
  if (fs.existsSync(out)) fs.unlinkSync(out);
  const url = s.url || (base + (s.q || ''));
  const r = spawnSync(edge, [
    '--headless=new', '--disable-gpu', '--no-first-run',
    '--window-size=1366,' + s.h,
    '--screenshot=' + out,
    '--virtual-time-budget=' + s.budget,
    url
  ], { stdio: 'ignore', timeout: 120000 });
  const made = fs.existsSync(out);
  const kb = made ? Math.round(fs.statSync(out).size / 1024) : 0;
  console.log((made ? 'OK   ' : 'FAIL ') + s.name.padEnd(12) + kb + ' KB');
  if (made) ok++;
}

console.log('');
console.log(ok + '/' + SHOTS.length + ' 张截图已生成到 docs/images/');
process.exitCode = ok === SHOTS.length ? 0 : 1;
