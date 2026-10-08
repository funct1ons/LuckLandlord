'use strict';
const fs = require('fs');
const path = require('path');
const V2 = require('./full-sim-engine-policy-v2');
const dest = path.resolve(__dirname, '../../docs/GDD1_FULL_SIM_POLICY_V2.md');
if (fs.existsSync(dest)) throw Error('Refuse existing ' + dest);
const stats = JSON.parse(fs.readFileSync(path.join(__dirname, 'full-sim-policy-v2-statistics.json'), 'utf8'));
const recompute = JSON.parse(fs.readFileSync(path.join(__dirname, 'full-sim-policy-v2-recompute.json'), 'utf8'));
const gates = JSON.parse(fs.readFileSync(path.join(__dirname, 'full-sim-policy-v2-gates.json'), 'utf8'));
const v1 = JSON.parse(fs.readFileSync(path.join(__dirname, 'full-sim-statistics.json'), 'utf8'));
const v1Gates = JSON.parse(fs.readFileSync(path.join(__dirname, 'full-sim-gates.json'), 'utf8'));
const { groups } = stats;
const percent = x => x === null || x === undefined ? 'NA' : (100 * x).toFixed(2) + '%';
const interval = r => {
  if (!r || r.rate === null || r.rate === undefined) return 'NA';
  if (r.lo === null || r.lo === undefined) return percent(r.rate) + ' (count ratio; not independent Wilson)';
  return `${percent(r.rate)} [${percent(r.lo)}, ${percent(r.hi)}]`;
};
const quant = q => !q ? 'NA' : [q.P10, q.P50, q.P90, q.P99].map(x => x === null || x === undefined ? 'NA' : Number(x.toFixed(2))).join('/');
const REQUIRED = ['spin', 'choose', 'skip', 'remove', 'reroll', 'item', 'skipItem', 'eventA', 'eventB'];
function failHist(detail) {
  const h = {};
  for (const x of detail.failedSeeds || []) {
    const s = x.stage == null ? 'NA' : String(x.stage);
    h[s] = (h[s] || 0) + 1;
  }
  return Object.keys(h).sort((a, b) => Number(a) - Number(b)).map(s => s + ':' + h[s]).join(', ') || 'none';
}
function survivalRow(g, n) {
  const s = g.stage[n - 1];
  return s ? `${s.survival.k}/${g.n} ${interval(s.survival)}` : 'NA';
}
const keys = Object.keys(groups).sort();
const valueHold = groups['Value/holdout'];
const greedyHold = groups['Greedy/holdout'];
const synHold = groups['Synergy/holdout'];
const randHold = groups['Random/holdout'];
const strongRates = [valueHold, greedyHold, synHold].filter(Boolean).map(g => g.winRate.rate);
const maxHold = Math.max(...strongRates);
const minHold = Math.min(...strongRates);
const gapTo40 = 0.40 - maxHold;
const lines = [
  '# GDD1 full-v1 Normal bot simulation — policy-v2 (engineering report)',
  '',
  'Scope: frozen GDD1 + production + seed catalog + prices **unchanged**. New versioned strategy `policy-v2` re-run of formal Normal (64/32/8, 12 start, payments `[70,125,210,320,460,630,850,1120,1460,1880]`). This is **not** the 24/10/3 slice and **not** a substitute for slice 65% win rates. Phase A only: distinguish weak v1 bots from economy hardness. **No GDD/price/production retune.** Phase B needs explicit main-pane authorization.',
  '',
  'Independent F4 functional PASS is `docs/GDD1_F4_GROK_AUDIT.md`. freeze-v4 436/436 SHA `cadba0fa63b151cb1b3a7933697cbeb295e9154ec4adb5bae595ffa7e8c09953` and agg-freeze 8/8 SHA `af08f789…` are **retained, not overwritten**. Formal Normal economy is **NOT APPROVED**. Human play is pending. Art/Chrome deferred.',
  '',
  'This file does not overwrite `docs/GDD1_FULL_SIM.md`, `docs/GDD1_FULL_SIM_AUDIT.md`, `docs/GDD1_FULL_SIM_AUDIT_AGG.md`, freeze-v4, agg-freeze, or v1 jsonl.',
  '',
  '## Sampling',
  '',
  `All ${recompute.games} games completed. Index byte-offset SHA-256 verified (${recompute.indexHashes} rows). ${recompute.replays.length} index-0 games replayed to identical final hashes. Command errors in aggregator: ${recompute.errors.length}. No overlapping seeds. Prefix \`full-sim-policy-v2-batch-\`. v1 \`full-sim-batch-v3-*\`, probes, and job-kill jsonl retained and excluded.`,
  '',
  'Seeds: same catalog `F4-FULL-v1/<Bot>/<train|holdout>/<0000-0999>`. Random policy `decision-full-v1/...` (control; must match v1 Random train/0000 finalHash `78423102…`). Value/Synergy/Greedy policy `decision-full-v2/...`. Train/holdout prefixes disjoint. No seed screening. No live RNG / future seed / live offer peek.',
  '',
  '| Bot / Split | Wins / 1000 | Wilson 95% | Formation | Event A ratio | Final pool P10/P50/P90/P99 | Win pool P10/P50/P90/P99 | Game ms P10/P50/P90/P99 |',
  '|---|---:|---|---|---|---|---|---|'
];
for (const key of keys) {
  const g = groups[key];
  lines.push(`| ${key} | ${g.wins} | ${interval(g.winRate)} | ${interval(g.formationRate)} | ${interval(g.eventAcceptance)} | ${quant(g.pool)} | ${quant(g.winPool)} | ${quant(g.ms)} |`);
}
lines.push(
  '',
  'Formation A–H is a diagnostic after spins, not proof of a complete build. Acquisition strata use public pre-choice formation and pool bands `<20` / `20-26` / `>26`. Acquired-game win rates are conditional and confounded; not causal item effectiveness.',
  '',
  'Quantiles: nearest rank. Stage income/pool condition on reaching the stage. Period income/margins condition on completing that payment. Survival denominator 1000. Wilson 95% only on independent game/seed trials. Offer/event/acquisition-event ratios have counts without `lo`/`hi`.',
  '',
  '## Lookahead (disclosed)',
  '',
  V2.LOOKAHEAD,
  '',
  `- Horizon: **${V2.HORIZON_SPINS} spins** after the root action.`,
  `- Command cap: **${V2.COMMAND_CAP}** \`fullCommand\` in the surrogate.`,
  `- Remove beam: **${V2.REMOVE_BEAM}** statically worst pool members (all other legal **types** including skipItem/reroll/remove are in the root candidate set).`,
  `- Model seed: \`${V2.MODEL_SEED}\` via \`createRng\`. Live seed and five streams are never copied.`,
  '- Branch width: `|root candidates|` (typically 4–12). Continuation after the root action is `staticChoiceV2`, not a full tree.',
  '- Modeling assumptions: surrogate offers are model-generated and visible to continuation; they are **not** live offers. Utility is WON +1e5 / LOST −1e5 plus model income, mean synergy-or-static value, pool, tokens, cash-payment margin. **Not optimal, not exhaustive tree search, not a live-RNG oracle.**',
  '',
  '## Unused live actions',
  '',
  'Legal API includes spin/choose/skip/remove/reroll/item/skipItem/event A/B. Root beam enumerates those types; unused **live** commands mean the beam never selected them as best, not that they were pruned from candidates. Engineering checks proved skipItem/reroll/remove appear in root candidates.'
);
for (const key of keys) {
  const g = groups[key];
  const unused = REQUIRED.filter(op => !g.actions[op]);
  lines.push(`- **${key}** live commands ${g.commands}, model ${g.modelCommands}. Actions \`${JSON.stringify(g.actions)}\`. Unused live: ${unused.length ? unused.join(', ') : 'none'}.`);
}
lines.push('', '## v1 vs policy-v2 comparison (same 8000 seeds)', '');
lines.push('| Bot / Split | v1 wins | v1 Wilson | v2 wins | v2 Wilson | Δ wins | Δ rate | v1 unused | v2 unused | v1 fail stages | v2 fail stages |');
lines.push('|---|---:|---|---:|---|---:|---:|---|---|---|---|');
for (const key of keys) {
  const a = v1.groups[key], b = groups[key];
  const d1 = (v1Gates.detail && v1Gates.detail[key]) || {};
  const d2 = (gates.detail && gates.detail[key]) || {};
  const unused1 = REQUIRED.filter(op => !(a.actions || {})[op]).join(',') || 'none';
  const unused2 = REQUIRED.filter(op => !(b.actions || {})[op]).join(',') || 'none';
  const delta = b.wins - a.wins;
  const dRate = ((b.winRate.rate - a.winRate.rate) * 100).toFixed(2) + 'pp';
  lines.push(`| ${key} | ${a.wins} | ${interval(a.winRate)} | ${b.wins} | ${interval(b.winRate)} | ${delta} | ${dRate} | ${unused1} | ${unused2} | ${failHist(d1)} | ${failHist(d2)} |`);
}
lines.push(
  '',
  'v1 Greedy pruned remove/reroll unless statically preferred and never used skipItem/reroll on the recorded path. policy-v2 enables those types at the root. Random is the unchanged control.',
  '',
  '## Stage survival (policy-v2)',
  ''
);
for (const key of keys) {
  const g = groups[key];
  lines.push(`### ${key}`, '', '| Stage | Reached | Paid / 1000 | Spin income P10/P50/P90/P99 | Period income P10/P50/P90/P99 | Margin P10/P50/P90/P99 | Pool P10/P50/P90/P99 |', '|---:|---:|---:|---|---|---|---|');
  for (const s of g.stage) lines.push(`| ${s.stage} | ${s.reached.k} | ${s.survival.k} | ${quant(s.spinIncome)} | ${quant(s.periodIncome)} | ${quant(s.margin)} | ${quant(s.pool)} |`);
  lines.push('', `Formation mixed ${g.mixed}/1000. Winning routes \`${JSON.stringify(g.routes)}\`. Errors ${g.errors.length}.`, '');
  lines.push('Extreme seeds (full metric in statistics JSON):');
  for (const [name, seeds] of Object.entries(g.extremes)) lines.push(`- ${name}: ${seeds.map(x => '`' + x.seed + '` (total ' + x.total + ', peak ' + x.peak + ', margin ' + x.margin + ')').join('; ')}`);
  lines.push('');
}
lines.push(
  '## GDD §13.3 comparison (diagnostic; not a retune)',
  '',
  '待验证 targets: experienced human Normal 35–65%; Synergy/Greedy 40–70% and ≥15pp above Random; stage1 ≥95%, stage3 ≥75%, stage6 ~45–70%; winning pool median 18–26; small loop before stage 4 ≥70%; single-route win share 5–25%, mixed ≥40%.',
  '',
  `- **formalBalance**: ${gates.gates.formalBalance}`,
  `- **sampling**: ${gates.gates.sampling}`,
  `- **actions**: ${gates.gates.actions}`,
  `- **lookahead**: ${gates.gates.lookahead}`,
  `- **tools**: ${gates.gates.tools}`,
  `- **human**: ${gates.gates.human}`,
  `- **gdd133.synergyGreedyWinBand**: ${gates.gates.gdd133.synergyGreedyWinBand}`,
  `- **gdd133.fifteenPointsAboveRandom**: ${gates.gates.gdd133.fifteenPointsAboveRandom}`,
  '',
  'Holdout stage survival vs §13.3:',
  ''
);
for (const key of ['Greedy/holdout', 'Synergy/holdout', 'Value/holdout', 'Random/holdout']) {
  const g = groups[key];
  if (!g) continue;
  lines.push(`- **${key}** stage1 ${survivalRow(g, 1)}; stage3 ${survivalRow(g, 3)}; stage6 ${survivalRow(g, 6)}; stage10 ${survivalRow(g, 10)}; win-pool median ${g.winPool && g.winPool.P50}.`);
}
lines.push(
  '',
  '## Judgment: strategy upper bound vs economy',
  '',
  `policy-v2 holdout win rates: Value ${interval(valueHold.winRate)}, Greedy ${interval(greedyHold.winRate)}, Synergy ${interval(synHold.winRate)}, Random ${interval(randHold.winRate)}.`,
  '',
  `Synergy/Greedy (and Value) holdout Wilson intervals sit **outside** the §13.3 40–70% band (max holdout point ${percent(maxHold)}, min ${percent(minHold)}; gap from the strongest holdout point to 40% is **${(gapTo40 * 100).toFixed(2)}pp**). The ≥15pp vs Random **holds** because Random remains 0/1000.`,
  '',
  'v1 Greedy holdout was 2.30% [1.54%, 3.43%]; other v1 bots 0%. Enabling all legal types plus a 5-spin root beam lifted holdout wins into the ~23–30% region. That is a large policy effect, so v1 bots were weak. The remaining gap to 40% (Wilson lo still below 40% on n=1000) is the **strategy-upper-bound estimate under this disclosed lookahead**: a fairer 5-spin beam over all legal types, with synthetic-model continuation and no live peek, still does not enter the §13.3 bot band.',
  '',
  'This is **not** a proof that no stronger policy exists (horizon 5 / static continuation / remove beam 3 / model offers ≠ live). It is evidence that the shortfall is no longer explained only by “Greedy pruned skipItem/reroll/remove and looked 2 spins.” Economy-side hardness remains the leading residual hypothesis. **No price or GDD change is performed.** Phase B (versioned economy retune) requires explicit main-pane authorization.',
  '',
  '`formalBalance` remains **NOT APPROVED**. Independent policy-v2 tool audit is required before accepting these tool conclusions. Bots cannot substitute GDD §13.4 human play.',
  '',
  '## Deliverables',
  '',
  '- `tests/gdd1/full-sim-policy-v2-batch-*-{0,500}.jsonl` + `-index.json` (wx); probes and job-kill retained',
  '- `tests/gdd1/full-sim-policy-v2-statistics.json`, `full-sim-policy-v2-recompute.json`, `full-sim-policy-v2-gates.json`',
  '- `tests/gdd1/full-sim-engine-policy-v2.js`, `full-sim-run-policy-v2.js`, stats/gates/integrity/report',
  '- v1 `full-sim-batch-v3-*`, `full-sim-statistics.json`, freeze-v4, agg-freeze **not overwritten**',
  '',
  'Independent simulator/tool audit (`docs/GDD1_FULL_SIM_POLICY_V2_AUDIT.md`) is still required before accepting these conclusions. This engineering report is not that audit. No production retune.'
);
fs.writeFileSync(dest, lines.join('\n') + '\n', { flag: 'wx' });
console.log(JSON.stringify({ dest: 'docs/GDD1_FULL_SIM_POLICY_V2.md', bytes: fs.statSync(dest).size }));
