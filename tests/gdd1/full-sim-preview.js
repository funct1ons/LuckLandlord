'use strict';
const fs = require('fs');
const readline = require('readline');
const path = require('path');
const destName = process.argv[2] || 'full-sim-v3-preview-partial.json';
const prefix = process.argv.find(a => a.startsWith('--prefix='))?.slice('--prefix='.length) || 'full-sim-batch-v3-';
if (!/^full-sim-[\w.-]+\.json$/.test(destName)) throw Error('Unsafe dest');
const dest = path.join(__dirname, destName);
if (fs.existsSync(dest)) throw Error('Refuse existing ' + dest);
async function main() {
  const files = fs.readdirSync(__dirname).filter(p => p.startsWith(prefix) && p.endsWith('.jsonl') && fs.existsSync(path.join(__dirname, p.replace('.jsonl', '-index.json')))).sort();
  const groups = {};
  for (const name of files) {
    const meta = JSON.parse(fs.readFileSync(path.join(__dirname, name.replace('.jsonl', '-index.json')), 'utf8'));
    const key = meta.bot + '/' + meta.split;
    const g = groups[key] || (groups[key] = { n: 0, wins: 0, errors: 0, unfinished: 0, actions: {}, stageAtEnd: Array.from({ length: 11 }, () => 0), lostStage: Array.from({ length: 11 }, () => 0) });
    const input = readline.createInterface({ input: fs.createReadStream(path.join(__dirname, name)), crlfDelay: Infinity });
    let line = 0;
    for await (const text of input) {
      const game = JSON.parse(text);
      line++;
      g.n++;
      g.wins += game.won ? 1 : 0;
      g.errors += game.error ? 1 : 0;
      if (!['WON', 'LOST', 'ERROR'].includes(game.outcome)) g.unfinished++;
      const stage = game.finalState && game.finalState.stageId || 0;
      g.stageAtEnd[stage] = (g.stageAtEnd[stage] || 0) + 1;
      if (game.outcome === 'LOST') g.lostStage[stage] = (g.lostStage[stage] || 0) + 1;
      for (const a of game.actions) {
        const k = a.command.op === 'event' ? 'event' + a.command.option : a.command.op;
        g.actions[k] = (g.actions[k] || 0) + 1;
      }
    }
    if (line !== meta.n) throw Error('preview incomplete ' + name);
  }
  const payload = {
    scope: 'partial/full v3 preview; retain all seeds; not formal acceptance; not a substitute for full-sim-statistics.json',
    prefix, files: files.length, groups
  };
  fs.writeFileSync(dest, JSON.stringify(payload, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ dest: 'tests/gdd1/' + destName, files: files.length, summary: Object.fromEntries(Object.entries(groups).map(([k, g]) => [k, { n: g.n, wins: g.wins, errors: g.errors, unfinished: g.unfinished, actions: g.actions, lostStage: g.lostStage }])) }, null, 2));
}
main().catch(e => { console.error(e); process.exitCode = 1; });
