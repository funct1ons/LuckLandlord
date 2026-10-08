'use strict';
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const dest = path.join(__dirname, 'full-sim-launch-v2.json');
if (fs.existsSync(dest)) throw Error('Refuse existing ' + dest);
const root = path.resolve(__dirname, '../..');
const jobs = [];
for (const bot of ['Random', 'Value', 'Synergy', 'Greedy']) {
  for (const split of ['train', 'holdout']) {
    for (const start of [0, 500]) {
      const tag = `${bot.toLowerCase()}-${split}-${start}`;
      const outPath = path.join(__dirname, `full-sim-log-v2-${tag}.out.txt`);
      const errPath = path.join(__dirname, `full-sim-log-v2-${tag}.err.txt`);
      if (fs.existsSync(outPath) || fs.existsSync(errPath)) throw Error('Refuse existing log ' + tag);
      const out = fs.openSync(outPath, 'wx');
      const err = fs.openSync(errPath, 'wx');
      const child = spawn(process.execPath, [path.join(__dirname, 'full-sim-run.js'), 'batch', bot, split, '500', String(start), 'v2'], {
        cwd: root,
        detached: true,
        stdio: ['ignore', out, err],
        windowsHide: true
      });
      child.unref();
      jobs.push({ pid: child.pid, bot, split, start, tag });
    }
  }
}
fs.writeFileSync(dest, JSON.stringify({
  note: 'Detached 16x500 full-v1 batches; incomplete full-sim-batch-*.jsonl without -v2 are retained job-killed first attempt',
  jobs
}, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ dest: 'tests/gdd1/full-sim-launch-v2.json', n: jobs.length, pids: jobs.map(j => j.pid) }));
