'use strict';
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const dest = path.join(__dirname, 'full-sim-policy-v2-launch.json');
if (fs.existsSync(dest)) throw Error('Refuse existing ' + dest);
const root = path.resolve(__dirname, '../..');
const jobs = [];
for (const bot of ['Random', 'Value', 'Synergy', 'Greedy']) {
  for (const split of ['train', 'holdout']) {
    for (const start of [0, 500]) {
      const tag = `${bot.toLowerCase()}-${split}-${start}`;
      const outPath = path.join(__dirname, `full-sim-policy-v2-log-${tag}.out.txt`);
      const errPath = path.join(__dirname, `full-sim-policy-v2-log-${tag}.err.txt`);
      const jsonl = path.join(__dirname, `full-sim-policy-v2-batch-${bot.toLowerCase()}-${split}-${start}.jsonl`);
      if (fs.existsSync(outPath) || fs.existsSync(errPath) || fs.existsSync(jsonl)) throw Error('Refuse existing ' + tag);
      const out = fs.openSync(outPath, 'wx');
      const err = fs.openSync(errPath, 'wx');
      const child = spawn(process.execPath, [path.join(__dirname, 'full-sim-run-policy-v2.js'), 'batch', bot, split, '500', String(start)], {
        cwd: root,
        detached: true,
        stdio: ['ignore', out, err],
        windowsHide: true
      });
      child.unref();
      jobs.push({ pid: child.pid, bot, split, start, tag, dest: 'tests/gdd1/full-sim-policy-v2-batch-' + tag + '.jsonl' });
    }
  }
}
fs.writeFileSync(dest, JSON.stringify({
  note: 'Detached 16x500 full-sim-policy-v2 batches; v1 full-sim-batch-v3-* and probes retained; no overwrite',
  prefix: 'full-sim-policy-v2-batch-',
  jobs
}, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ dest: 'tests/gdd1/full-sim-policy-v2-launch.json', n: jobs.length, pids: jobs.map(j => j.pid) }));
