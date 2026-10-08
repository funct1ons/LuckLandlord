'use strict';
const fs = require('fs');
const readline = require('readline');
const path = require('path');
const dest = path.join(__dirname, 'full-sim-gates.json');
if (fs.existsSync(dest)) throw Error('Refuse existing ' + dest);
const { groups } = JSON.parse(fs.readFileSync(path.join(__dirname, 'full-sim-statistics.json'), 'utf8'));
const REQUIRED = ['spin', 'choose', 'skip', 'remove', 'reroll', 'item', 'skipItem', 'eventA', 'eventB'];
function band(rate, lo, hi) { return rate !== null && rate !== undefined && rate >= lo && rate <= hi; }
async function main() {
  const detail = {};
  const files = fs.readdirSync(__dirname).filter(x => /^full-sim-batch-v3-.*\.jsonl$/.test(x) && fs.existsSync(path.join(__dirname, x.replace('.jsonl', '-index.json'))));
  for (const file of files) {
    for await (const line of readline.createInterface({ input: fs.createReadStream(path.join(__dirname, file)), crlfDelay: Infinity })) {
      const x = JSON.parse(line);
      const key = x.bot + '/' + x.split;
      const d = detail[key] || (detail[key] = {
        games: 0, wins: 0, errors: [], unfinished: [], formedBeforeStage4: 0,
        winningRoutes: { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, G: 0, H: 0, unformed: 0, mixed: 0 },
        failedSeeds: [], unused: [], actions: {}
      });
      d.games++;
      d.wins += x.won ? 1 : 0;
      if (x.error) d.errors.push({ seed: x.seed, error: x.error });
      if (!['WON', 'LOST', 'ERROR'].includes(x.outcome)) d.unfinished.push(x.seed);
      const routes = Object.keys(x.firstFormation || {});
      if (routes.some(r => x.firstFormation[r].stage < 4)) d.formedBeforeStage4++;
      if (x.won) {
        if (!routes.length) d.winningRoutes.unformed++;
        else if (routes.length > 1) d.winningRoutes.mixed++;
        else d.winningRoutes[routes[0]]++;
      } else {
        d.failedSeeds.push({ seed: x.seed, outcome: x.outcome, stage: x.finalState && x.finalState.stageId, margin: x.payments.at(-1) && x.payments.at(-1).margin });
      }
      for (const a of x.actions) {
        const k = a.command.op === 'event' ? 'event' + a.command.option : a.command.op;
        d.actions[k] = (d.actions[k] || 0) + 1;
      }
    }
  }
  for (const d of Object.values(detail)) d.unused = REQUIRED.filter(op => !d.actions[op]);
  const greedyHold = groups['Greedy/holdout'], synHold = groups['Synergy/holdout'], randHold = groups['Random/holdout'];
  const strong = [greedyHold, synHold].filter(Boolean);
  const strongInBand = strong.every(g => band(g.winRate.rate, 0.40, 0.70));
  const fifteen = strong.every(g => g && randHold && (g.winRate.rate - randHold.winRate.rate) >= 0.15);
  const stage = (g, n, lo, hi) => g && g.stage[n - 1] && band(g.stage[n - 1].survival.rate, lo, hi);
  const collapse6 = Object.values(groups).every(g => g.stage[5].survival.rate === 0);
  const all100 = strong.length && strong.every(g => g.winRate.rate === 1);
  const unusedNote = Object.entries(detail).map(([k, d]) => k + ':' + (d.unused.join('|') || 'none')).join('; ');
  const errors = Object.values(detail).reduce((n, d) => n + d.errors.length, 0);
  const unfinished = Object.values(detail).reduce((n, d) => n + d.unfinished.length, 0);
  const games = Object.values(detail).reduce((n, d) => n + d.games, 0);
  const gates = {
    scope: 'full-v1 Normal 64/32/8; 12 start; payments 70..1880; NOT slice 24/10/3; slice win rates are not a substitute',
    functional: 'Independent F4 PASS is docs/GDD1_F4_GROK_AUDIT.md; this file does not re-judge F4',
    sampling: games === 8000 && errors === 0 && unfinished === 0
      ? 'PASS 4×(1000 train + 1000 holdout), 8000 disjoint fixed seeds, independent policy RNG, no rejected seeds, 0 command errors, 0 unfinished'
      : 'BLOCKED games=' + games + ' errors=' + errors + ' unfinished=' + unfinished,
    actions: 'Legal API includes skip/remove/reroll/item/event. Recorded unused commands: ' + unusedNote + '. Availability is not evidence every bot exercises every command.',
    lookahead: 'Greedy clone + synthetic seed full-sim-model-v1/0, ≤2 spins / 14 commands, prune remove/reroll unless static preferred; future offers skipped. Not exhaustive search. No live RNG peek. Engineering tool-audit-v2 8/8 is not independent auditor PASS.',
    diagnostics: 'Wilson on independent games; offer/event/strata event ratios without lo/hi; unique-seed strata terminal Wilson; all failed seeds retained',
    gdd133: {
      synergyGreedyWinBand: strongInBand ? 'HOLDOUT in 40-70%' : 'OUTSIDE 40-70% (diagnostic)',
      fifteenPointsAboveRandom: fifteen ? 'HOLD' : 'NOT MET (diagnostic)',
      stage1: Object.fromEntries(Object.entries(groups).map(([k, g]) => [k, stage(g, 1, 0.95, 1) ? 'in ≥95%' : 'outside ≥95%'])),
      stage3: Object.fromEntries(Object.entries(groups).map(([k, g]) => [k, stage(g, 3, 0.75, 1) ? 'in ≥75%' : 'outside ≥75%'])),
      stage6: Object.fromEntries(Object.entries(groups).map(([k, g]) => [k, stage(g, 6, 0.45, 0.70) ? 'in 45-70%' : 'outside 45-70%'])),
      allRoutesStage6Collapse: collapse6,
      strongAll100: all100
    },
    human: 'PENDING; bots cannot substitute GDD §13.4',
    tools: 'Engineering tool-audit v1 retained 7/8, v2 8/8. Independent tool/simulator audit still required before accepting economic conclusions.',
    formalBalance: (strongInBand && fifteen && !collapse6 && !all100 && games === 8000 && errors === 0)
      ? 'NOT APPROVED pending independent tool audit even if holdout bands hold'
      : 'NOT APPROVED; holdout Wilson/survival outside GDD §13.3 待验证 bands and/or independent tool audit pending. No retune performed.',
    protection: 'Do not overwrite freeze-v1/v2/v3/158/v4-29/32, historical jsonl, or SHA-errata sources. Runtime .pi/loops disclosed not restored.',
    remaining: 'Independent simulator/tool audit; freeze-v4 after this gates+report; human play; art/audio deferred'
  };
  fs.writeFileSync(dest, JSON.stringify({ gates, detail: Object.fromEntries(Object.entries(detail).map(([k, d]) => [k, { ...d, failedSeedCount: d.failedSeeds.length, failedSeeds: d.failedSeeds }])) }, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ dest: 'tests/gdd1/full-sim-gates.json', games, errors, unfinished, unusedNote, formalBalance: gates.formalBalance, sampling: gates.sampling }));
}
main().catch(e => { console.error(e); process.exitCode = 1; });
