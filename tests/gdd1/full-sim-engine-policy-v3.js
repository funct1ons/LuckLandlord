'use strict';
const E = require('./full-sim-engine');
const { F, copy, bots, publicView, legal, value, formation, defs } = E;
const HORIZON_SPINS = 8;
const COMMAND_CAP = 64;
const REMOVE_BEAM = 8;
const MODEL_SEED = 'full-sim-model-v3/0';
const LOOKAHEAD = 'policy-v3: Random is NOT re-run (v1/v2 control on the same seeds). Value/Synergy/Greedy: root beam over ALL legal action TYPES with no skipItem/reroll/remove prune; remove UIDs ranked by dual static+synergy value, beam width min(' + REMOVE_BEAM + ', |removes|) (wider than v2 beam 3; full set when pool removes ≤ ' + REMOVE_BEAM + '). After the root action, continuation is dualChoiceV3 (staticChoice under synergy=false AND synergy=true; if they differ, keep the higher dualActionScore) for at most ' + HORIZON_SPINS + ' spins / ' + COMMAND_CAP + ' fullCommand. Surrogate reseeds synthetic ' + MODEL_SEED + ' (createRng); live seed and five streams never copied. Model-generated offers are visible to dual continuation; they are not live offers. Branch width = |root candidates| (typically 8-20). Root utility still bot-specific: Value uses static mean, Greedy/Synergy use synergy mean. Utility: WON +1e5, LOST -1e5, model income, mean value, pool, tokens, cash-payment margin. Not optimal, not exhaustive tree search, not a live-RNG oracle. Horizon 8 (low end of 8-10) chosen to keep wall under the 3h budget with REMOVE_BEAM 8.';

function policyRngV3(seed) {
  let x = F.hashIdentity('policy-full-v3/' + seed), consumed = 0;
  return {
    next() { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; x >>>= 0; consumed++; return x / 4294967296; },
    snapshot() { return { state: x, consumed }; }
  };
}
function dualValue(id, v) {
  return 0.5 * value(id, v, false) + 0.5 * value(id, v, true);
}
function worstRemoves(v, k) {
  const rem = legal(v).filter(x => x.op === 'remove');
  rem.sort((p, q) => {
    const x = v.pool.find(z => z.uid === p.uid), y = v.pool.find(z => z.uid === q.uid);
    return dualValue(x.type, v) + x.permanent - (dualValue(y.type, v) + y.permanent);
  });
  return rem.slice(0, k);
}
function staticChoice(v, synergy) {
  const a = legal(v);
  if (!a.length) throw Error('No legal actions');
  const rem = worstRemoves(v, 1);
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
function actionScore(v, act) {
  if (!act) return -1e9;
  if (act.op === 'choose' || act.op === 'item') return dualValue(act.id, v);
  if (act.op === 'remove') {
    const x = v.pool.find(z => z.uid === act.uid);
    return -(dualValue(x.type, v) + x.permanent);
  }
  if (act.op === 'reroll') return 0.2;
  if (act.op === 'skip') return 0;
  if (act.op === 'skipItem') return 0.05;
  if (act.op === 'spin') return 1;
  if (act.op === 'event' && act.option === 'A') return 0.4;
  return 0;
}
function dualChoiceV3(v) {
  const greedy = staticChoice(v, false);
  const syn = staticChoice(v, true);
  if (JSON.stringify(greedy) === JSON.stringify(syn)) return greedy;
  return actionScore(v, syn) >= actionScore(v, greedy) ? syn : greedy;
}
function rootCandidates(v) {
  const a = legal(v);
  const core = a.filter(x => x.op !== 'remove');
  return [...core, ...worstRemoves(v, REMOVE_BEAM)];
}
function surrogateV3(v) {
  const s = copy(v);
  s.seed = MODEL_SEED;
  s.rng = F.createRng(s.seed, s.profile, s.difficulty);
  return s;
}
function rolloutV3(v, action, synergy) {
  let s = surrogateV3(v), income = 0, spins = 0, commands = 0;
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
      const step = dualChoiceV3(view);
      apply(step);
      if (step.op === 'spin') { income += s.last.total; spins++; }
    } else apply(dualChoiceV3(view));
  }
  const view = publicView(s);
  const mean = s.pool.length ? s.pool.reduce((n, x) => n + value(x.type, view, synergy) + x.permanent, 0) / s.pool.length : 0;
  const margin = (s.cash + (s.pendingSettlement || 0)) - (s.payment || 0);
  const utility = (s.phase === 'LOST' ? -100000 : 0) + (s.phase === 'WON' ? 100000 : 0) + income + mean * 2 + Math.min(20, s.pool.length) * 0.35 + s.removeTokens * 0.25 + s.rerollTokens * 0.25 + Math.max(-50, Math.min(80, margin)) * 0.15;
  return { utility, commands, spins };
}
function decideV3(bot, v) {
  if (bot === 'Random') throw Error('policy-v3 does not re-run Random; use v1/v2 control');
  const a = legal(v);
  if (!a.length) throw Error('No legal actions');
  const synergy = bot !== 'Value';
  const candidates = rootCandidates(v);
  if (!candidates.length) throw Error('No root candidates');
  let best = null, n = 0;
  for (const action of candidates) {
    const r = rolloutV3(v, action, synergy);
    n += r.commands;
    if (!best || r.utility > best.utility) best = { action, utility: r.utility };
  }
  return { ...best, modelCommands: n, candidates: candidates.length };
}
module.exports = {
  F, copy, bots, publicView, legal, value, formation, defs,
  policyRngV3, dualValue, dualChoiceV3, staticChoice, rootCandidates, surrogateV3, rolloutV3, decideV3, worstRemoves,
  HORIZON_SPINS, COMMAND_CAP, REMOVE_BEAM, MODEL_SEED, LOOKAHEAD
};
