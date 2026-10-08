'use strict';
const fs = require('fs');
const path = require('path');
const destJson = path.join(__dirname, 'full-sim-diagnosis-v1.json');
const destMd = path.resolve(__dirname, '../../docs/GDD1_FULL_SIM_DIAGNOSIS.md');
if (fs.existsSync(destJson)) throw Error('Refuse existing ' + destJson);
if (fs.existsSync(destMd)) throw Error('Refuse existing ' + destMd);
const { groups } = JSON.parse(fs.readFileSync(path.join(__dirname, 'full-sim-statistics.json'), 'utf8'));
const gates = JSON.parse(fs.readFileSync(path.join(__dirname, 'full-sim-gates.json'), 'utf8'));
const pct = r => !r || r.rate === null ? 'NA' : (100 * r.rate).toFixed(2) + '%';
const interval = r => !r || r.lo === null || r.lo === undefined ? pct(r) + ' (ratio)' : `${pct(r)} [${(100 * r.lo).toFixed(2)}%, ${(100 * r.hi).toFixed(2)}%]`;
const rows = {};
for (const [key, g] of Object.entries(groups)) {
  const detail = gates.detail[key];
  const lostStage = Array.from({ length: 11 }, () => 0);
  for (const s of detail.failedSeeds) lostStage[s.stage || 0]++;
  const s1 = g.stage[0], s3 = g.stage[2], s6 = g.stage[5], s7 = g.stage[6], s8 = g.stage[7], s9 = g.stage[8], s10 = g.stage[9];
  const lateP90P50 = s8.spinIncome.P50 ? s8.spinIncome.P90 / s8.spinIncome.P50 : null;
  rows[key] = {
    n: g.n, wins: g.wins, winRate: g.winRate, unused: (detail.unused || []),
    formedBeforeStage4: detail.formedBeforeStage4,
    formedBeforeStage4Rate: detail.formedBeforeStage4 / g.n,
    winningRoutes: detail.winningRoutes,
    mixedWins: detail.winningRoutes.mixed, unformedWins: detail.winningRoutes.unformed,
    winPoolP50: g.winPool.P50, poolP50: g.pool.P50,
    stagePaid: g.stage.map(s => s.survival.k),
    stageReached: g.stage.map(s => s.reached.k),
    lostStage,
    s1: s1.survival, s3: s3.survival, s6: s6.survival, s7: s7.survival, s8: s8.survival, s9: s9.survival, s10: s10.survival,
    s8spin: s8.spinIncome, s8margin: s8.margin, lateP90P50,
    actions: g.actions, eventAcceptance: g.eventAcceptance
  };
}
const holdout = ['Greedy/holdout', 'Random/holdout', 'Synergy/holdout', 'Value/holdout'];
const gdd = {
  human: '35-65% experienced / 10-30% novice first 3; bots cannot substitute',
  synergyGreedy: '40-70% and ≥15pp above Random',
  stage1: '≥95%', stage3: '≥75%', stage6: '45-70%',
  winPool: 'median 18-26', formedBefore4: '≥70% small loop before stage 4',
  singleRouteWin: '5-25%', mixedWin: '≥40%',
  lateP90P50: '1.5-3.5'
};
const gaps = {};
for (const k of holdout) {
  const r = rows[k];
  gaps[k] = {
    winBand: r.wins / r.n >= 0.40 && r.wins / r.n <= 0.70 ? 'IN' : 'OUT',
    fifteenAboveRandom: k === 'Random/holdout' ? 'n/a' : ((r.wins / r.n) - (rows['Random/holdout'].wins / 1000) >= 0.15 ? 'MET' : 'NOT MET'),
    stage1: r.s1.rate >= 0.95 ? 'IN' : 'OUT',
    stage3: r.s3.rate >= 0.75 ? 'IN' : 'OUT',
    stage6: r.s6.rate >= 0.45 && r.s6.rate <= 0.70 ? 'IN' : (r.s6.rate > 0.70 ? 'ABOVE 70%' : 'BELOW 45%'),
    winPool: r.wins ? (r.winPoolP50 >= 18 && r.winPoolP50 <= 26 ? 'IN' : 'OUT') : 'no wins',
    formedBefore4: r.formedBeforeStage4Rate >= 0.70 ? 'IN (diagnostic formation, not GDD small-loop identity)' : 'OUT',
    mixedWins: r.wins ? (r.mixedWins / r.wins >= 0.40 ? 'IN' : 'OUT') : 'no wins',
    lateP90P50: r.lateP90P50 === null ? 'NA' : (r.lateP90P50 >= 1.5 && r.lateP90P50 <= 3.5 ? 'IN' : 'OUT')
  };
}
const proposal = {
  version: 'tune-candidate-full-v1-diag-1',
  status: 'DIAGNOSTIC CANDIDATE ONLY; do not apply; do not edit GAME_DESIGN_V1.md or js/gdd1; do not rescreen seeds',
  observation: 'Strong and weak bots survive stages 1-6 then fail stages 7-10 against payments 850/1120/1460/1880. Stage 6 is not a universal collapse. Win rates are near zero except Greedy ~2-3%. Formation diagnostic fires early for Greedy/Value but does not convert to payment coverage. Greedy never recorded reroll or skipItem; Value/Synergy never skipItem. Random used all legal ops and still 0 wins.',
  orderPerGdd: ['candidate/feed/yield first', 'then quotas', 'small versioned steps'],
  candidates: [
    {
      id: 'C1-late-yield-not-rent',
      change: 'Investigate late-stage yield (spin income P50 vs payment 850+) before cutting early rents 70-630. Do not raise all rents from P99 spikes.',
      reason: 'Stage6 paid Random 640, others 984-999; losses concentrate at 7-9 with negative margins.',
      apply: false
    },
    {
      id: 'C2-policy-unused-ops',
      change: 'If a later policy version is introduced, give Greedy a non-pruned skipItem/reroll branch. This is a bot change, not a GDD price change.',
      reason: 'Greedy unused reroll|skipItem; Value/Synergy unused skipItem. Random used both and still 0 wins, so unused ops are not a sufficient explanation of 0 wins.',
      apply: false
    },
    {
      id: 'C3-feed-not-quota-first',
      change: 'If yield is structurally below stage-7 payment after formed pools, consider candidate/feed/yield tables next, not quota width, and version it. No seed screening.',
      reason: 'GDD §13.3: tune candidate/feed/yield then quotas. Stage6 overshoot vs 45-70% plus late failure is not the “all routes collapse at stage 6” rollback trigger.',
      apply: false
    }
  ]
};
const payload = { scope: 'engineering diagnosis; NOT independent audit; economy NOT APPROVED; no retune applied', gdd, rows, gaps, proposal };
fs.writeFileSync(destJson, JSON.stringify(payload, null, 2) + '\n', { flag: 'wx' });
const lines = [
  '# GDD1 full-v1 Normal — engineering diagnosis (not independent audit)',
  '',
  'Economy remains **NOT APPROVED**. No GDD, payment, or production change. No seed rescreen. Independent aggregation re-audit is a separate signature. Human play remains pending and does not block this diagnosis.',
  '',
  '## Failure stage (lost games by `finalState.stageId`)',
  '',
  '| Group | Wins | Lost@6 | Lost@7 | Lost@8 | Lost@9 | Lost@10 | Stage6 paid/1000 | Stage8 paid/1000 |',
  '|---|---:|---:|---:|---:|---:|---:|---:|---:|'
];
for (const [k, r] of Object.entries(rows)) {
  lines.push(`| ${k} | ${r.wins} | ${r.lostStage[6]} | ${r.lostStage[7]} | ${r.lostStage[8]} | ${r.lostStage[9]} | ${r.lostStage[10]} | ${r.s6.k} | ${r.s8.k} |`);
}
lines.push('', '## Route formation (diagnostic A–H, not GDD small-loop identity)', '',
  '| Group | Formed before stage 4 | Win mixed | Win unformed | Win pool P50 | Unused recorded ops |',
  '|---|---:|---:|---:|---:|---|');
for (const [k, r] of Object.entries(rows)) {
  lines.push(`| ${k} | ${r.formedBeforeStage4}/1000 | ${r.mixedWins} | ${r.unformedWins} | ${r.winPoolP50 === null ? 'NA' : r.winPoolP50} | ${r.unused.join('|') || 'none'} |`);
}
lines.push('', 'Greedy/Value/Synergy unused `skipItem` (and Greedy `reroll`) are policy choices. Random used every legal op and still 0 wins, so unused actions do not explain the 6000 zero-win games by themselves.',
  '', '## GDD §13.3 holdout gaps (待验证 targets, not applied retune)', '',
  '| Group | Win 40-70% | ≥15pp vs Random | S1 ≥95% | S3 ≥75% | S6 45-70% | Win pool 18-26 | Mixed wins ≥40% |',
  '|---|---|---|---|---|---|---|---|');
for (const k of holdout) {
  const g = gaps[k];
  lines.push(`| ${k} | ${g.winBand} ${interval(rows[k].winRate)} | ${g.fifteenAboveRandom} | ${g.stage1} | ${g.stage3} | ${g.stage6} ${rows[k].s6.k}/1000 | ${g.winPool} | ${g.mixedWins} |`);
}
lines.push('', 'Stage 1 and 3 hold. Stage 6 is **above** 70% for Greedy/Value/Synergy (not a stage-6 collapse). Random stage 6 is inside 45–70% and still 0 wins. Greedy holdout 2.30% is far below 40–70% and only +2.3pp vs Random 0, not +15pp.',
  '', '## Versioned tune candidates (do not apply)', '',
  `- **${proposal.version}** status: ${proposal.status}`,
  `- ${proposal.observation}`,
  ...proposal.candidates.map(c => `- **${c.id}**: ${c.change} Reason: ${c.reason} apply=${c.apply}.`),
  '',
  'Machine JSON: `tests/gdd1/full-sim-diagnosis-v1.json`.'
);
fs.writeFileSync(destMd, lines.join('\n') + '\n', { flag: 'wx' });
console.log(JSON.stringify({ destJson: 'tests/gdd1/full-sim-diagnosis-v1.json', destMd: 'docs/GDD1_FULL_SIM_DIAGNOSIS.md', bytes: { json: fs.statSync(destJson).size, md: fs.statSync(destMd).size } }));
