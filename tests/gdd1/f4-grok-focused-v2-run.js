'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const dest = path.join(__dirname, 'f4-grok-focused-v2.json');
if (fs.existsSync(dest)) throw Error('Refuse existing output ' + dest);
const files = [
  'f4-base-route-contracts.js',
  'f4-adjacency-snapshot.js',
  'f4-age-order.js',
  'f4-appearance-cases.js',
  'f4-cargo-bridges.js',
  'f4-contract-behaviors.js',
  'f4-copy-cases.js',
  'f4-cycle-cases.js',
  'f4-dock-cases.js',
  'f4-event-draw.js',
  'f4-event-transactions.js',
  'f4-event-windows.js',
  'f4-item-commit.js',
  'f4-item-focused.js',
  'f4-item-lifecycle-boundaries.js',
  'f4-item-row-draw.js',
  'f4-pressure-cases.js',
  'f4-profile-save.js',
  'f4-profile-save-boundaries.js',
  'f4-reservation-priority.js',
  'f4-risk-cases.js',
  'f4-spire-cases.js',
  'f4-stage-boundaries.js',
  'f4-tag-cases.js',
  'f4-safety-transactions.js',
  'f4-risk-multisource.js',
  'f4-cycle-save-contract.js'
];
const cases = [];
for (const file of files) {
  const buf = fs.readFileSync(path.join(__dirname, file));
  const sha256 = crypto.createHash('sha256').update(buf).digest('hex');
  const r = spawnSync(process.execPath, [path.join(__dirname, file)], { encoding: 'utf8', cwd: path.join(__dirname, '../..') });
  const ok = r.status === 0;
  cases.push({ file, sha256, ok, stdout: r.stdout, stderr: r.stderr });
  if (!ok) console.error('FAIL', file, r.stderr || r.stdout);
}
const result = {
  status: 'Focused rule evidence after cloudy natural-age data fix; integration and freeze remain separate gates',
  supersedes: {
    retained: 'tests/gdd1/f4-grok-focused-v1.json',
    basis: 'v1 was post cloth/book; v2 re-runs the same 27 after removing cloudy_negative age-extra self amount 0'
  },
  passed: cases.filter(x => x.ok).length,
  total: cases.length,
  cases
};
fs.writeFileSync(dest, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ dest: 'tests/gdd1/f4-grok-focused-v2.json', passed: result.passed, total: result.total, failed: cases.filter(x => !x.ok).map(x => x.file) }, null, 2));
if (result.passed !== result.total) process.exitCode = 1;
