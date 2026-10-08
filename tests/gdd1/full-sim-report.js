'use strict';
const fs = require('fs');
const path = require('path');
const dest = path.resolve(__dirname, '../../docs/GDD1_FULL_SIM.md');
if (fs.existsSync(dest)) throw Error('Refuse existing ' + dest);
const stats = JSON.parse(fs.readFileSync(path.join(__dirname, 'full-sim-statistics.json'), 'utf8'));
const recompute = JSON.parse(fs.readFileSync(path.join(__dirname, 'full-sim-recompute.json'), 'utf8'));
const gates = JSON.parse(fs.readFileSync(path.join(__dirname, 'full-sim-gates.json'), 'utf8'));
const { groups } = stats;
const percent = x => x === null || x === undefined ? 'NA' : (100 * x).toFixed(2) + '%';
const interval = r => {
  if (!r || r.rate === null || r.rate === undefined) return 'NA';
  if (r.lo === null || r.lo === undefined) return percent(r.rate) + ' (count ratio; not independent Wilson)';
  return `${percent(r.rate)} [${percent(r.lo)}, ${percent(r.hi)}]`;
};
const quant = q => !q ? 'NA' : [q.P10, q.P50, q.P90, q.P99].map(x => x === null || x === undefined ? 'NA' : Number(x.toFixed(2))).join('/');
const REQUIRED = ['spin', 'choose', 'skip', 'remove', 'reroll', 'item', 'skipItem', 'eventA', 'eventB'];
const lines = [
  '# GDD1 full-v1 Normal bot simulation (engineering report)',
  '',
  'Scope: full-v1 Normal, 12 start, 70 spins, payments `[70,125,210,320,460,630,850,1120,1460,1880]`, 64/32/8. This is **not** the 24/10/3 slice and **not** a substitute for slice 65% win rates.',
  '',
  'Independent F4 functional PASS is `docs/GDD1_F4_GROK_AUDIT.md`. freeze-v3 237/237 SHA `f04d90262d64b5393f64250e9705c0df5cbbd03f832aeff3f857ae37a829a8b9`. Formal Normal is **not** accepted by this report. Human play is pending. Art/audio deferred. No production retune.',
  '',
  'Supplement SHA errata: live `docs/GDD1_F4_AUDIT_SUPPLEMENT.md` is 7352 / `8b83cc616b41a6b115cfb20f70b8d04dfe214de6c66cbdd33096449ffb229824` (64 hex), matching frozen reports. A 65-hex transcription inserts extra `d`. Frozen reports were not rewritten. See `docs/GDD1_F4_GROK_SHA_ERRATA.md`.',
  '',
  '## Sampling',
  '',
  `All ${recompute.games} games completed. Index byte-offset SHA-256 verified (${recompute.indexHashes} rows). ${recompute.replays.length} index-0 games replayed to identical final hashes. Command errors in aggregator: ${recompute.errors.length}. No overlapping seeds. Prefix \`full-sim-batch-v3-\`. Incomplete v1/v2 jsonl retained and excluded (no index).`,
  '',
  'Seeds: `F4-FULL-v1/<Bot>/<train|holdout>/<0000-0999>` with policy `decision-full-v1/...`. Train/holdout prefixes disjoint. No seed screening.',
  '',
  '| Bot / Split | Wins / 1000 | Wilson 95% | Formation | Event A ratio | Final pool P10/P50/P90/P99 | Game ms P10/P50/P90/P99 |',
  '|---|---:|---|---|---|---|---|'
];
for (const [key, g] of Object.entries(groups)) {
  lines.push(`| ${key} | ${g.wins} | ${interval(g.winRate)} | ${interval(g.formationRate)} | ${interval(g.eventAcceptance)} | ${quant(g.pool)} | ${quant(g.ms)} |`);
}
lines.push(
  '',
  'Formation A–H is a diagnostic after spins, not proof of a complete build. Acquisition strata use public pre-choice formation and pool bands `<20` / `20-26` / `>26`. Acquired-game win rates are conditional and confounded; not causal item effectiveness.',
  '',
  'Quantiles: nearest rank. Stage income/pool condition on reaching the stage. Period income/margins condition on completing that payment. Survival denominator 1000. Wilson 95% only on independent game/seed trials. Offer/event/acquisition-event ratios have counts without `lo`/`hi`.',
  '',
  '## Lookahead and unused actions',
  '',
  'Greedy: clone + independent synthetic seed `full-sim-model-v1/0`, at most 2 spins / 14 `fullCommand`, prune remove/reroll unless static preferred. Future generated offers skipped. No live seed/RNG peek. Value/Synergy static tags. Random uniform legal.',
  '',
  'Legal API includes spin/choose/skip/remove/reroll/item/skipItem/event A/B. Availability is not evidence that every bot exercises every command.'
);
for (const [key, g] of Object.entries(groups)) {
  const unused = REQUIRED.filter(op => !g.actions[op]);
  lines.push(`- **${key}** live commands ${g.commands}, model ${g.modelCommands}. Actions \`${JSON.stringify(g.actions)}\`. Unused: ${unused.length ? unused.join(', ') : 'none'}.`);
}
lines.push('', '## Per-strategy stages', '');
for (const [key, g] of Object.entries(groups)) {
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
  '',
  'If strong strategies are 100% or all routes collapse at stage 6, current tables return to design. This run does not change GDD, payments, or definitions.',
  '',
  '## Deliverables',
  '',
  '- `tests/gdd1/full-sim-batch-v3-*-{0,500}.jsonl` + `-index.json` (wx)',
  '- `tests/gdd1/full-sim-statistics.json`, `full-sim-recompute.json`, `full-sim-gates.json`',
  '- `tests/gdd1/full-sim-seeds.json`, engine/runner/stats/checks',
  '- `tests/gdd1/full-sim-tool-audit-v1.json` (7/8 retained) and `full-sim-tool-audit-v2.json` (8/8)',
  '- Incomplete prior jsonl retained',
  '',
  'Independent simulator/tool audit is still required before accepting economic conclusions. This engineering report is not that audit.'
);
fs.writeFileSync(dest, lines.join('\n') + '\n', { flag: 'wx' });
console.log(JSON.stringify({ dest: 'docs/GDD1_FULL_SIM.md', bytes: fs.statSync(dest).size }));
