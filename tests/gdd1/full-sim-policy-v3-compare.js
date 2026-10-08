'use strict';
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const crypto = require('crypto');
const V3 = require('./full-sim-engine-policy-v3');
const destJson = path.join(__dirname, process.argv[2] || 'full-sim-policy-v3-probe-summary.json');
const destMd = path.resolve(__dirname, '../../docs/GDD1_FULL_SIM_POLICY_V3_PROBE.md');
if (fs.existsSync(destJson)) throw Error('Refuse existing ' + destJson);
if (fs.existsSync(destMd)) throw Error('Refuse existing ' + destMd);
const Z = 1.959963984540054;
function wilson(k, n) {
  if (!n) return { k, n, rate: null, lo: null, hi: null };
  const p = k / n, z2 = Z * Z, d = 1 + z2 / n;
  const center = p + z2 / (2 * n);
  const margin = Z * Math.sqrt((p * (1 - p) + z2 / (4 * n)) / n);
  return { k, n, rate: p, lo: (center - margin) / d, hi: (center + margin) / d, z: Z };
}
function pct(x) { return x == null ? 'NA' : (100 * x).toFixed(2) + '%'; }
function interval(r) { return r.rate == null ? 'NA' : `${pct(r.rate)} [${pct(r.lo)}, ${pct(r.hi)}]`; }
async function streamJsonl(file, onGame) {
  const rl = readline.createInterface({ input: fs.createReadStream(file), crlfDelay: Infinity });
  for await (const line of rl) {
    if (!line.trim()) continue;
    onGame(JSON.parse(line));
  }
}
function failHist(rows) {
  const h = {};
  for (const r of rows) {
    const s = r.won ? 'WON' : String(r.failStage == null ? 'NA' : r.failStage);
    h[s] = (h[s] || 0) + 1;
  }
  return Object.keys(h).sort().map(k => k + ':' + h[k]).join(', ');
}
function actionHist(rows) {
  const h = {};
  for (const r of rows) for (const [op, n] of Object.entries(r.actions || {})) h[op] = (h[op] || 0) + n;
  return h;
}
const BOTS = ['Value', 'Synergy', 'Greedy'];
const v3Files = fs.readdirSync(__dirname).filter(n => /^full-sim-policy-v3-(probe|batch)-.+\.jsonl$/.test(n)).sort();
const official = v3Files.filter(n => n.startsWith('full-sim-policy-v3-batch-'));
const probe = v3Files.filter(n => n.startsWith('full-sim-policy-v3-probe-'));
if (!official.length) throw Error('no official v3 batch jsonl');

(async () => {
  const v3 = {};
  const loadV3 = async file => {
    const idx = JSON.parse(fs.readFileSync(path.join(__dirname, file.replace('.jsonl', '-index.json')), 'utf8'));
    const bySeed = {};
    await streamJsonl(path.join(__dirname, file), g => {
      const actions = {};
      for (const a of g.actions || []) actions[a.command.op] = (actions[a.command.op] || 0) + 1;
      bySeed[g.seed] = {
        seed: g.seed, bot: g.bot, split: g.split, index: g.index,
        won: !!g.won, outcome: g.outcome, error: g.error || null,
        failStage: g.finalState && g.finalState.stageId,
        ms: g.ms, modelCommands: g.modelCommands, actions,
        finalHash: g.finalHash, policySeed: g.policySeed
      };
    });
    return { file, idx, bySeed };
  };
  const shards = [];
  for (const f of official) shards.push(await loadV3(f));
  const probeShards = [];
  for (const f of probe) probeShards.push(await loadV3(f));

  const wanted = {};
  for (const sh of shards) {
    for (const g of Object.values(sh.bySeed)) {
      if (g.split !== 'holdout') continue;
      wanted[g.bot] = wanted[g.bot] || {};
      if (wanted[g.bot][g.seed]) throw Error('dup v3 ' + g.seed);
      wanted[g.bot][g.seed] = g;
    }
  }

  async function loadPrior(prefix, botsSeeds) {
    const out = {};
    const files = fs.readdirSync(__dirname).filter(n => n.startsWith(prefix) && n.endsWith('.jsonl') && !n.includes('jobkill'));
    const need = new Set();
    for (const bot of Object.keys(botsSeeds)) for (const seed of Object.keys(botsSeeds[bot])) need.add(seed);
    for (const f of files) {
      if (!/holdout/.test(f)) continue;
      await streamJsonl(path.join(__dirname, f), g => {
        if (!need.has(g.seed)) return;
        const actions = {};
        for (const a of g.actions || []) actions[a.command.op] = (actions[a.command.op] || 0) + 1;
        out[g.seed] = {
          seed: g.seed, bot: g.bot, won: !!g.won, outcome: g.outcome,
          failStage: g.finalState && g.finalState.stageId, actions, finalHash: g.finalHash
        };
      });
    }
    return out;
  }
  const v2 = await loadPrior('full-sim-policy-v2-batch-', wanted);
  const v1 = await loadPrior('full-sim-batch-v3-', wanted);
  const v2rand = {};
  const v1rand = {};
  const randNeed = new Set();
  const maxIndex = Math.max(...shards.flatMap(s => Object.values(s.bySeed).map(g => g.index)));
  const minIndex = Math.min(...shards.flatMap(s => Object.values(s.bySeed).map(g => g.index)));
  for (let i = minIndex; i <= maxIndex; i++) randNeed.add(`F4-FULL-v1/Random/holdout/${String(i).padStart(4, '0')}`);
  for (const f of ['full-sim-policy-v2-batch-random-holdout-0.jsonl', 'full-sim-batch-v3-random-holdout-0.jsonl']) {
    const bag = f.includes('policy-v2') ? v2rand : v1rand;
    if (!fs.existsSync(path.join(__dirname, f))) continue;
    await streamJsonl(path.join(__dirname, f), g => {
      if (randNeed.has(g.seed)) bag[g.seed] = { seed: g.seed, won: !!g.won, outcome: g.outcome, failStage: g.finalState && g.finalState.stageId, finalHash: g.finalHash };
    });
  }

  const groups = {};
  for (const bot of BOTS) {
    const rows = Object.values(wanted[bot] || {}).sort((a, b) => a.index - b.index);
    if (!rows.length) continue;
    const missingV2 = rows.filter(r => !v2[r.seed]);
    const missingV1 = rows.filter(r => !v1[r.seed]);
    if (missingV2.length) throw Error(bot + ' missing v2 ' + missingV2.length);
    if (missingV1.length) throw Error(bot + ' missing v1 ' + missingV1.length);
    const w3 = rows.filter(r => r.won).length;
    const w2 = rows.filter(r => v2[r.seed].won).length;
    const w1 = rows.filter(r => v1[r.seed].won).length;
    groups[bot] = {
      n: rows.length, indexMin: rows[0].index, indexMax: rows[rows.length - 1].index,
      v3: wilson(w3, rows.length), v2: wilson(w2, rows.length), v1: wilson(w1, rows.length),
      deltaV2pp: (w3 - w2) / rows.length * 100,
      deltaV1pp: (w3 - w1) / rows.length * 100,
      failV3: failHist(rows),
      failV2: failHist(rows.map(r => v2[r.seed])),
      failV1: failHist(rows.map(r => v1[r.seed])),
      actionsV3: actionHist(rows),
      actionsV2: actionHist(rows.map(r => v2[r.seed])),
      meanMs: rows.reduce((n, r) => n + r.ms, 0) / rows.length,
      errors: rows.filter(r => r.error).length
    };
  }
  const randRows = [...randNeed].sort().map(seed => v2rand[seed]).filter(Boolean);
  const rand = {
    n: randRows.length,
    v2: wilson(randRows.filter(r => r.won).length, randRows.length),
    v1: wilson((Object.values(v1rand).filter(r => r.won).length), Object.keys(v1rand).length)
  };

  const strongest = BOTS.map(b => groups[b] && groups[b].v3.rate).filter(x => x != null);
  const maxRate = Math.max(...strongest);
  const inBand = maxRate >= 0.40;
  const judgment = inBand
    ? 'v3 entered the §13.3 40–70% band on this holdout subset. Economy needs no change for the bot-band question (human play still pending).'
    : 'v3 remains significantly below 40% on this holdout subset. Economy-side residual hypothesis is STRENGTHENED. Phase B still requires explicit authorization.';

  const summary = {
    status: 'policy-v3 holdout subset probe',
    lookahead: V3.LOOKAHEAD,
    horizon: V3.HORIZON_SPINS,
    commandCap: V3.COMMAND_CAP,
    removeBeam: V3.REMOVE_BEAM,
    modelSeed: V3.MODEL_SEED,
    officialFiles: official,
    probeFiles: probe,
    groups, randomControl: rand,
    productionUnchanged: true,
    gddUnchanged: true,
    inBand40: inBand,
    maxHoldoutRate: maxRate,
    judgment,
    wilsonZ: Z
  };
  fs.writeFileSync(destJson, JSON.stringify(summary, null, 2) + '\n', { flag: 'wx' });

  const lines = [
    '# GDD1 policy-v3 strategy-upper-bound probe',
    '',
    'Scope: frozen GDD1 + production + seed catalog + prices **unchanged**. Phase A2 only. **No phase B / no retune.** Random is the v1/v2 control on the same holdout indices (policy-v3 does not re-run Random).',
    '',
    '## Disclosed lookahead',
    '',
    V3.LOOKAHEAD,
    '',
    `- HORIZON_SPINS = **${V3.HORIZON_SPINS}**`,
    `- COMMAND_CAP = **${V3.COMMAND_CAP}**`,
    `- REMOVE_BEAM = **${V3.REMOVE_BEAM}** (all legal types at root; skipItem/reroll/remove not pruned)`,
    `- MODEL_SEED = \`${V3.MODEL_SEED}\` via \`createRng\`; live seed/five streams never copied`,
    '- Continuation: `dualChoiceV3` (static greedy AND synergy; if they differ, higher dualActionScore)',
    '- Branch width = |root candidates| (typically 8–20)',
    '',
    '## Official subset',
    '',
    `Holdout indices ${minIndex}–${maxIndex} on Value/Synergy/Greedy. Same catalog \`F4-FULL-v1/<Bot>/holdout/<index>\`. Prefix \`full-sim-policy-v3-batch-\`. Probe dests retained.`,
    '',
    '| Bot | n | v1 Wilson | v2 Wilson | v3 Wilson | Δ v2 | Δ v1 | v3 fail stages |',
    '|---|---:|---|---|---|---:|---:|---|'
  ];
  for (const bot of BOTS) {
    const g = groups[bot];
    if (!g) continue;
    lines.push(`| ${bot} | ${g.n} | ${interval(g.v1)} | ${interval(g.v2)} | ${interval(g.v3)} | ${g.deltaV2pp.toFixed(2)}pp | ${g.deltaV1pp.toFixed(2)}pp | ${g.failV3} |`);
  }
  lines.push(`| Random (control, not re-run) | ${rand.n} | ${interval(rand.v1)} | ${interval(rand.v2)} | n/a | | | |`);
  lines.push(
    '',
    '## Strategy upper-bound estimate',
    '',
    `- Strongest v3 holdout point: **${pct(maxRate)}**.`,
    `- §13.3 40–70% band: **${inBand ? 'ENTERED' : 'NOT ENTERED'}**.`,
    `- v2 holdout on the full 1000 was Value 29.90%, Greedy 23.30%, Synergy 23.90%. This subset compares the **same seeds** across v1/v2/v3.`,
    `- ${judgment}`,
    '',
    'formalBalance / economy remain **NOT APPROVED**. Human play still pending. Independent tool audit required before accepting these tool conclusions.',
    '',
    '## Depth vs v2',
    '',
    'v2: HORIZON 5 / COMMAND_CAP 36 / REMOVE_BEAM 3 / static continuation. v3: HORIZON 8 / COMMAND_CAP 64 / REMOVE_BEAM 8 / dual continuation. If v3 ≈ v2 on the same seeds, additional search is not converting into wins (strategy ceiling under this model class). If v3 lifts into 40%+, the v2 23–30% was still a weak-policy artefact.',
    '',
    'No production retune. Phase B needs explicit main-pane authorization.'
  );
  fs.writeFileSync(destMd, lines.join('\n') + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ destJson: path.basename(destJson), destMd: 'docs/GDD1_FULL_SIM_POLICY_V3_PROBE.md', groups: Object.fromEntries(BOTS.map(b => [b, groups[b] && { n: groups[b].n, v3: groups[b].v3, v2: groups[b].v2, v1: groups[b].v1 }])), inBand, maxRate, judgment }));
})().catch(e => { console.error(e); process.exit(1); });
