'use strict';
const E = require('./full-sim-engine');
const V3 = require('./full-sim-engine-policy-v3');
const { F, copy, bots, publicView, legal, value, formation, defs } = E;
const HORIZON_SPINS = 12;
const COMMAND_CAP = 96;
const REMOVE_BEAM = 'full';
const FUTURE_PAYMENTS = 3;
const MODEL_SEED = 'full-sim-model-v4/0';
const LOOKAHEAD = 'policy-v4 diagnostic-1 (no peek): Random is NOT re-run. Value/Synergy/Greedy: root beam over ALL legal action TYPES and ALL legal remove UIDs (REMOVE_BEAM=full, no cap). Continuation is V3 dualChoiceV3 (greedy+synergy). Horizon ' + HORIZON_SPINS + ' spins / ' + COMMAND_CAP + ' fullCommand (low end of 12–16 / 96–128 because full remove beam is expensive). Surrogate reseeds synthetic ' + MODEL_SEED + ' via createRng; live seed and five streams never copied. Model offers are not live offers. Utility is LATE-PAYMENT-AWARE: cash+pending+modelIncome minus the sum of the next ' + FUTURE_PAYMENTS + ' unpaid Normal payments (F.NORMAL_PAYMENTS from current stageId, fewer if near the end), plus WON/LOST, model income, mean synergy-or-static value, pool, tokens. Not optimal, not exhaustive tree search, not a live-RNG oracle.';

function policyRngV4(seed) {
  let x = F.hashIdentity('policy-full-v4/' + seed), consumed = 0;
  return {
    next() { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; x >>>= 0; consumed++; return x / 4294967296; },
    snapshot() { return { state: x, consumed }; }
  };
}
function rootCandidates(v) {
  return legal(v);
}
function surrogateV4(v) {
  const s = copy(v);
  s.seed = MODEL_SEED;
  s.rng = F.createRng(s.seed, s.profile, s.difficulty);
  return s;
}
function futureNeed(s) {
  const pays = F.NORMAL_PAYMENTS;
  const start = Math.max(0, (s.stageId || 1) - 1);
  const next = pays.slice(start, start + FUTURE_PAYMENTS);
  return next.reduce((a, b) => a + b, 0);
}
function utilityV4(s, income, synergy) {
  const view = publicView(s);
  const mean = s.pool.length ? s.pool.reduce((n, x) => n + value(x.type, view, synergy) + x.permanent, 0) / s.pool.length : 0;
  const have = (s.cash || 0) + (s.pendingSettlement || 0) + income;
  const need = futureNeed(s);
  const futureMargin = have - need;
  return (s.phase === 'LOST' ? -100000 : 0) + (s.phase === 'WON' ? 100000 : 0) + income + mean * 2 + Math.min(20, s.pool.length) * 0.35 + s.removeTokens * 0.25 + s.rerollTokens * 0.25 + Math.max(-800, Math.min(800, futureMargin)) * 0.45;
}
function rolloutV4(v, action, synergy) {
  let s = surrogateV4(v), income = 0, spins = 0, commands = 0;
  const apply = a => {
    const r = F.fullCommand(s, { ...a, revision: s.revision });
    commands++;
    if (!r.ok) throw Error('Model command: ' + r.error);
    s = r.state;
  };
  apply(action);
  while (!['WON', 'LOST'].includes(s.phase) && spins < HORIZON_SPINS && commands < COMMAND_CAP) {
    const view = publicView(s);
    if (s.phase === 'READY') {
      const step = V3.dualChoiceV3(view);
      apply(step);
      if (step.op === 'spin') { income += s.last.total; spins++; }
    } else apply(V3.dualChoiceV3(view));
  }
  return { utility: utilityV4(s, income, synergy), commands, spins, futureNeed: futureNeed(s) };
}
function decideV4(bot, v) {
  if (bot === 'Random') throw Error('policy-v4 does not re-run Random');
  const a = legal(v);
  if (!a.length) throw Error('No legal actions');
  const synergy = bot !== 'Value';
  const candidates = rootCandidates(v);
  let best = null, n = 0;
  for (const action of candidates) {
    const r = rolloutV4(v, action, synergy);
    n += r.commands;
    if (!best || r.utility > best.utility) best = { action, utility: r.utility };
  }
  return { ...best, modelCommands: n, candidates: candidates.length };
}
module.exports = {
  F, copy, bots, publicView, legal, value, formation, defs,
  policyRngV4, rootCandidates, surrogateV4, futureNeed, utilityV4, rolloutV4, decideV4,
  HORIZON_SPINS, COMMAND_CAP, REMOVE_BEAM, FUTURE_PAYMENTS, MODEL_SEED, LOOKAHEAD
};
