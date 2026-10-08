'use strict';
const E = require('./full-sim-engine');
const V3 = require('./full-sim-engine-policy-v3');
const { F, copy, bots, publicView, legal, value, formation, defs } = E;
const HORIZON_SPINS = V3.HORIZON_SPINS;
const COMMAND_CAP = V3.COMMAND_CAP;
const REMOVE_BEAM = V3.REMOVE_BEAM;
const WARNING = 'ORACLE DIAGNOSTIC — NOT ACCEPTANCE EVIDENCE, MUST NOT BE USED FOR ECONOMY APPROVAL';
const LOOKAHEAD = 'policy-v5-oracle DIAGNOSTIC (CHEATING): identical to policy-v3 search (HORIZON ' + HORIZON_SPINS + ', COMMAND_CAP ' + COMMAND_CAP + ', REMOVE_BEAM ' + REMOVE_BEAM + ', dual continuation, all legal TYPES at root with remove beam ' + REMOVE_BEAM + ') EXCEPT the surrogate copies the LIVE state including seed and the five RNG streams. Candidate rollouts therefore see the real future offers/draws from this decision point. This is defined cheating. Dest prefix full-sim-oracle-diag-v5-*. ' + WARNING + ' Not a production policy. Not formal Normal evidence. Economy MUST NOT be approved from these numbers.';

function policyRngV5(seed) {
  let x = F.hashIdentity('policy-full-v5-oracle/' + seed), consumed = 0;
  return {
    next() { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; x >>>= 0; consumed++; return x / 4294967296; },
    snapshot() { return { state: x, consumed }; }
  };
}
function forkLive(live) {
  if (!live || !live.rng || !live.seed) throw Error('oracle requires live state with rng+seed');
  return copy(live);
}
function rolloutOracle(live, action, synergy) {
  let s = forkLive(live), income = 0, spins = 0, commands = 0;
  const apply = a => {
    const r = F.fullCommand(s, { ...a, revision: s.revision });
    commands++;
    if (!r.ok) throw Error('Oracle model command: ' + r.error);
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
  const view = publicView(s);
  const mean = s.pool.length ? s.pool.reduce((n, x) => n + value(x.type, view, synergy) + x.permanent, 0) / s.pool.length : 0;
  const margin = (s.cash + (s.pendingSettlement || 0)) - (s.payment || 0);
  const utility = (s.phase === 'LOST' ? -100000 : 0) + (s.phase === 'WON' ? 100000 : 0) + income + mean * 2 + Math.min(20, s.pool.length) * 0.35 + s.removeTokens * 0.25 + s.rerollTokens * 0.25 + Math.max(-50, Math.min(80, margin)) * 0.15;
  return { utility, commands, spins };
}
function decideV5(bot, live) {
  if (bot === 'Random') throw Error('policy-v5-oracle does not re-run Random');
  const v = publicView(live);
  const a = legal(v);
  if (!a.length) throw Error('No legal actions');
  const synergy = bot !== 'Value';
  const candidates = V3.rootCandidates(v);
  let best = null, n = 0;
  for (const action of candidates) {
    const r = rolloutOracle(live, action, synergy);
    n += r.commands;
    if (!best || r.utility > best.utility) best = { action, utility: r.utility };
  }
  return { ...best, modelCommands: n, candidates: candidates.length, oracle: true, warning: WARNING };
}
module.exports = {
  F, copy, bots, publicView, legal, value, formation, defs,
  policyRngV5, forkLive, rolloutOracle, decideV5,
  HORIZON_SPINS, COMMAND_CAP, REMOVE_BEAM, WARNING, LOOKAHEAD
};
