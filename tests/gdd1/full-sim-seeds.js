'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { bots } = require('./full-sim-engine');
const dest = path.join(__dirname, 'full-sim-seeds.json');
if (fs.existsSync(dest)) throw Error('Refuse existing ' + dest);
const hash = name => crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname, name))).digest('hex');
const entries = [];
for (const bot of bots) for (const split of ['train', 'holdout']) for (let i = 0; i < 1000; i++) {
  entries.push({
    bot, split, index: i,
    seed: `F4-FULL-v1/${bot}/${split}/${String(i).padStart(4, '0')}`,
    policySeed: `decision-full-v1/${bot}/${split}/${i}`
  });
}
const payload = {
  rule: 'Enumerated formula fixed before batch launch in full-sim-run.js; materialized here. No seed screening or tuning. Train/holdout prefixes disjoint by construction.',
  engineHash: hash('full-sim-engine.js'),
  runnerHash: hash('full-sim-run.js'),
  n: entries.length,
  entries
};
fs.writeFileSync(dest, JSON.stringify(payload) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ dest: 'tests/gdd1/full-sim-seeds.json', n: entries.length, engineHash: payload.engineHash, runnerHash: payload.runnerHash }));
