'use strict';
const E = require('./full-sim-engine');
const { F, copy, bots, publicView, legal, value, formation, defs } = E;
const HORIZON_SPINS = 5;
const COMMAND_CAP = 36;
const REMOVE_BEAM = 3;
const MODEL_SEED = 'full-sim-model-v2/0';
const LOOKAHEAD = 'policy-v2: Random identical to full-sim-v1 (uniform legal, policy-full-v1 / decision-full-v1). Value/Synergy/Greedy: root beam over all legal action TYPES with no skipItem/reroll/remove prune; remove UIDs limited to the ' + REMOVE_BEAM + ' statically worst pool members. After the root action, continuation is staticChoiceV2 for at most ' + HORIZON_SPINS + ' spins / ' + COMMAND_CAP + ' fullCommand. Surrogate reseeds synthetic ' + MODEL_SEED + ' (createRng); live seed and five streams never copied. Model-generated offers are visible to static continuation; they are not live offers. Branch width = |root candidates| (typically 4-12). Utility: WON +1e5, LOST -1e5, model income, mean synergy-or-static value, pool, tokens, cash-payment margin. Not optimal, not exhaustive tree search, not a live-RNG oracle.';

function policyRngV1(seed) {
  return E.policyRng(seed);
}
function policyRngV2(seed) {
  let x = F.hashIdentity('policy-full-v2/' + seed), consumed = 0;
  return {
    next() { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; x >>>= 0; consumed++; return x / 4294967296; },
    snapshot() { return { state: x, consumed }; }
  };
}
function worstRemoves(v, synergy, k) {
  const rem = legal(v).filter(x => x.op === 'remove');
  rem.sort((p, q) => {
    const x = v.pool.find(z => z.uid === p.uid), y = v.pool.find(z => z.uid === q.uid);
    return value(x.type, v, synergy) + x.permanent - (value(y.type, v, synergy) + y.permanent);
  });
  return rem.slice(0, k);
}
function staticChoiceV2(v, synergy) {
  const a = legal(v);
  if (!a.length) throw Error('No legal actions');
  const rem = worstRemoves(v, synergy, 1);
  if (rem.length) {
    const x = v.pool.find(p => p.uid === rem[0].uid);
    const junk = x.type === 'spent_gasket' || x.type === 'arrears_slip';
    const dilute = v.pool.length > 22 && value(x.type, v, synergy) + x.permanent < 2.4;
    if (junk || dilute) return rem[0];
  }
  if (v.phase === 'READY') return a.find(x => x.op === 'spin');
  if (v.phase === 'SYMBOL_CHOICE') {
    const ranked = a.filter(x => x.op === 'choose').sort((p, q) => value(q.id, v, synergy) - value(p.id, v, synergy));
    const floor = v.pool.length < 20 ? 0 : v.pool.reduce((n, x) => n + value(x.type, v, synergy) + x.permanent, 0) / v.pool.length;
    const best = ranked[0];
    const reroll = a.find(x => x.op === 'reroll');
    if (reroll && (!best || value(best.id, v, synergy) < floor + 0.05)) return reroll;
    if (best && value(best.id, v, synergy) > floor + 0.15) return best;
    return a.find(x => x.op === 'skip');
  }
  if (v.phase === 'ITEM_CHOICE') {
    const r = a.filter(x => x.op === 'item').sort((p, q) => value(q.id, v, true) - value(p.id, v, true));
    const skip = a.find(x => x.op === 'skipItem');
    if (!r.length) return skip;
    if (value(r[0].id, v, true) <= 0.35) return skip;
    return r[0];
  }
  const A = a.filter(x => x.option === 'A');
  if (!A.length) return a[0];
  const eid = v.events.choice.id;
  if (eid === 'event_copper_queue') return v.pool.length < 24 ? A[0] : a[0];
  if (eid === 'event_brine_inspection') return v.pool.length > 20 ? A.sort((p, q) => v.pool.find(x => x.uid === p.uid).permanent - v.pool.find(x => x.uid === q.uid).permanent)[0] : a[0];
  if (eid === 'event_fog_shift') return v.cash >= v.payment * 0.15 + 4 ? A[0] : a[0];
  if (eid === 'event_misprint_window') return v.cash >= 6 ? A[0] : a[0];
  return v.cash >= v.payment * 0.1 ? A[0] : a[0];
}
function rootCandidates(v, synergy) {
  const a = legal(v);
  const core = a.filter(x => !['remove'].includes(x.op));
  return [...core, ...worstRemoves(v, synergy, REMOVE_BEAM)];
}
function surrogateV2(v) {
  const s = copy(v);
  s.seed = MODEL_SEED;
  s.rng = F.createRng(s.seed, s.profile, s.difficulty);
  return s;
}
function rolloutV2(v, action, synergy) {
  let s = surrogateV2(v), income = 0, spins = 0, commands = 0;
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
      const step = staticChoiceV2(view, synergy);
      apply(step);
      if (step.op === 'spin') { income += s.last.total; spins++; }
    } else apply(staticChoiceV2(view, synergy));
  }
  const view = publicView(s);
  const mean = s.pool.length ? s.pool.reduce((n, x) => n + value(x.type, view, synergy) + x.permanent, 0) / s.pool.length : 0;
  const margin = (s.cash + (s.pendingSettlement || 0)) - (s.payment || 0);
  const utility = (s.phase === 'LOST' ? -100000 : 0) + (s.phase === 'WON' ? 100000 : 0) + income + mean * 2 + Math.min(20, s.pool.length) * 0.35 + s.removeTokens * 0.25 + s.rerollTokens * 0.25 + Math.max(-50, Math.min(80, margin)) * 0.15;
  return { utility, commands, spins };
}
function decideV2(bot, v, rng) {
  const a = legal(v);
  if (!a.length) throw Error('No legal actions');
  if (bot === 'Random') return E.decide('Random', v, rng);
  const synergy = bot !== 'Value';
  const candidates = rootCandidates(v, synergy);
  if (!candidates.length) throw Error('No root candidates');
  let best = null, n = 0;
  for (const action of candidates) {
    const r = rolloutV2(v, action, synergy);
    n += r.commands;
    if (!best || r.utility > best.utility) best = { action, utility: r.utility };
  }
  return { ...best, modelCommands: n, candidates: candidates.length };
}
module.exports = {
  F, copy, bots, publicView, legal, value, formation, defs,
  policyRngV1, policyRngV2, staticChoiceV2, rootCandidates, surrogateV2, rolloutV2, decideV2,
  HORIZON_SPINS, COMMAND_CAP, REMOVE_BEAM, MODEL_SEED, LOOKAHEAD
};
