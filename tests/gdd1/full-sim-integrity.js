'use strict';
const fs = require('fs');
const readline = require('readline');
const path = require('path');
const crypto = require('crypto');
const E = require('./full-sim-engine');
const destName = process.argv[2] || 'full-sim-integrity-v3.json';
const prefix = process.argv.find(a => a.startsWith('--prefix='))?.slice('--prefix='.length) || 'full-sim-batch-v3-';
const replayAll = !process.argv.includes('--replay-sample');
if (!/^full-sim-[\w.-]+\.json$/.test(destName)) throw Error('Unsafe dest');
if (!/^full-sim-[\w-]+-$/.test(prefix)) throw Error('Unsafe prefix');
const dest = path.join(__dirname, destName);
if (fs.existsSync(dest)) throw Error('Refuse existing ' + dest);
const hash = x => crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const expected = JSON.parse(fs.readFileSync(path.join(__dirname, 'full-sim-seeds.json'), 'utf8'));
function catalogKey(bot, split, index) { return `${bot}/${split}/${index}`; }
async function countLines(file) {
  let n = 0;
  const input = readline.createInterface({ input: fs.createReadStream(file), crlfDelay: Infinity });
  for await (const line of input) if (line.length) n++;
  return n;
}
async function main() {
  const catalog = new Map();
  for (const e of expected.entries) catalog.set(catalogKey(e.bot, e.split, e.index), e);
  const seen = new Set();
  const batches = [];
  const errors = [];
  const unfinished = [];
  const missing = [];
  const duplicates = [];
  const attributionFails = [];
  const replayFails = [];
  const historical = [];
  for (const name of fs.readdirSync(__dirname).sort()) {
    if (!name.endsWith('.jsonl')) continue;
    if (name.startsWith(prefix)) continue;
    if (/^full-sim-batch-/.test(name)) {
      const full = path.join(__dirname, name);
      const idx = full.replace('.jsonl', '-index.json');
      historical.push({
        name,
        bytes: fs.statSync(full).size,
        lines: await countLines(full),
        hasIndex: fs.existsSync(idx),
        note: 'prior launch retained; not in v3 8000; job-kill/incomplete disclosed'
      });
    }
  }
  const files = fs.readdirSync(__dirname).filter(p => p.startsWith(prefix) && p.endsWith('.jsonl')).sort();
  for (const name of files) {
    const jsonl = path.join(__dirname, name);
    const idxPath = jsonl.replace('.jsonl', '-index.json');
    const progressPath = jsonl.replace('.jsonl', '-progress.json');
    const progress = fs.existsSync(progressPath) ? JSON.parse(fs.readFileSync(progressPath, 'utf8')) : null;
    if (!fs.existsSync(idxPath)) {
      batches.push({
        name,
        complete: false,
        reason: 'no-index',
        jsonlBytes: fs.statSync(jsonl).size,
        progress,
        lines: await countLines(jsonl),
        note: 'task/progress is not acceptance; missing index'
      });
      continue;
    }
    const meta = JSON.parse(fs.readFileSync(idxPath, 'utf8'));
    let line = 0, offset = 0, wins = 0, gameErrors = 0, replayed = 0;
    const input = readline.createInterface({ input: fs.createReadStream(jsonl), crlfDelay: Infinity });
    for await (const text of input) {
      const game = JSON.parse(text);
      const idx = meta.index[line];
      const bytes = Buffer.from(text + '\n');
      const sha = crypto.createHash('sha256').update(bytes).digest('hex');
      line++;
      if (!idx) { errors.push({ seed: game.seed, file: name, error: 'index missing row ' + line }); continue; }
      if (idx.seed !== game.seed || idx.offset !== offset || idx.bytes !== bytes.length || idx.sha256 !== sha) {
        errors.push({ seed: game.seed, file: name, error: 'index mismatch line ' + line });
      }
      offset += bytes.length;
      const expect = catalog.get(catalogKey(game.bot, game.split, game.index));
      const seedExpect = `F4-FULL-v1/${game.bot}/${game.split}/${String(game.index).padStart(4, '0')}`;
      const policyExpect = `decision-full-v1/${game.bot}/${game.split}/${game.index}`;
      if (!expect || expect.seed !== game.seed || game.seed !== seedExpect || game.policySeed !== policyExpect) {
        errors.push({ seed: game.seed, file: name, error: 'seed formula mismatch' });
      }
      if (seen.has(game.seed)) duplicates.push({ seed: game.seed, file: name, line });
      seen.add(game.seed);
      if (game.error) {
        gameErrors++;
        errors.push({ seed: game.seed, file: name, error: game.error, outcome: game.outcome });
      }
      if (!['WON', 'LOST', 'ERROR'].includes(game.outcome)) unfinished.push({ seed: game.seed, file: name, outcome: game.outcome, phase: game.finalState && game.finalState.phase });
      if (game.won) wins++;
      if (game.publicViewHasRng) errors.push({ seed: game.seed, error: 'recorded peek flag' });
      const sum = Object.values(game.contributions || {}).reduce((x, y) => x + y, 0);
      const total = (game.spins || []).reduce((x, y) => x + y.income, 0);
      if (sum !== total) attributionFails.push({ seed: game.seed, sum, total });
      const shouldReplay = replayAll || game.index === 0 || game.index % 100 === 0;
      if (shouldReplay) {
        let st = E.F.fullNewRun(game.seed);
        let ok = true, fail = null;
        for (const x of game.actions) {
          const r = E.F.fullCommand(st, { ...x.command, revision: st.revision });
          if (!r.ok) { ok = false; fail = r.error; break; }
          st = r.state;
        }
        const rh = hash(st);
        replayed++;
        if (!ok || rh !== game.finalHash) replayFails.push({ seed: game.seed, fail, replayHash: rh, recorded: game.finalHash });
      }
    }
    const complete = line === 500 && meta.n === 500 && meta.index.length === 500 && gameErrors === 0 && !unfinished.some(u => u.file === name);
    batches.push({
      name,
      bot: meta.bot,
      split: meta.split,
      startIndex: Number((name.match(/-(\d+)\.jsonl$/) || [])[1]),
      progressDone: progress && progress.done,
      indexN: meta.n,
      jsonlLines: line,
      wins,
      gameErrors,
      replayed,
      complete,
      ms: meta.ms,
      note: 'complete only if jsonl lines=500 AND index n=500 AND 0 unfinished; progress.done and process exit are insufficient'
    });
    if (line !== meta.n) errors.push({ file: name, error: 'jsonl lines ' + line + ' !== index n ' + meta.n });
  }
  for (const e of expected.entries) {
    if (!seen.has(e.seed)) missing.push(e.seed);
  }
  const train = [...seen].filter(s => s.includes('/train/'));
  const holdout = [...seen].filter(s => s.includes('/holdout/'));
  const sharedExact = train.filter(s => holdout.includes(s));
  const payload = {
    scope: 'per-game v3 integrity; task completed ≠ 500 complete; historical job-kill jsonl retained; not formal Normal acceptance',
    prefix,
    replayAll,
    expectedGames: expected.n,
    seen: seen.size,
    missing: missing.length,
    missingSeeds: missing.slice(0, 20),
    duplicates: duplicates.length,
    duplicateRows: duplicates.slice(0, 20),
    attributionFails: attributionFails.length,
    replayFails: replayFails.length,
    replayFailRows: replayFails.slice(0, 20),
    unfinished: unfinished.length,
    unfinishedRows: unfinished,
    errors: errors.length,
    errorRows: errors.slice(0, 50),
    historicalJobKill: historical,
    batches,
    isolation: {
      trainSeeds: train.length,
      holdoutSeeds: holdout.length,
      sharedExactSeedStrings: sharedExact.length,
      note: 'train/holdout use disjoint path prefixes F4-FULL-v1/<Bot>/<split>/; same numeric index is allowed across splits because the path differs. Policy decision-full-v1/... is a separate stream from the five game RNG streams.'
    },
    pass: seen.size === expected.n && missing.length === 0 && duplicates.length === 0 && attributionFails.length === 0 && replayFails.length === 0 && unfinished.length === 0 && errors.length === 0 && batches.every(b => b.complete) && batches.length === 16
  };
  fs.writeFileSync(dest, JSON.stringify(payload, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({
    dest: 'tests/gdd1/' + destName,
    pass: payload.pass,
    seen: payload.seen,
    missing: payload.missing,
    duplicates: payload.duplicates,
    errors: payload.errors,
    unfinished: payload.unfinished,
    attributionFails: payload.attributionFails,
    replayFails: payload.replayFails,
    completeBatches: batches.filter(b => b.complete).length,
    incompleteBatches: batches.filter(b => !b.complete).map(b => ({ name: b.name, lines: b.jsonlLines, indexN: b.indexN, progressDone: b.progressDone })),
    historical: historical.map(h => ({ name: h.name, lines: h.lines, bytes: h.bytes, hasIndex: h.hasIndex }))
  }, null, 2));
  if (!payload.pass) process.exitCode = 1;
}
main().catch(e => { console.error(e); process.exitCode = 1; });
