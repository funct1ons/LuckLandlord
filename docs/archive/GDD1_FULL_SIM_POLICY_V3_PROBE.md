# GDD1 policy-v3 strategy-upper-bound probe

Scope: frozen GDD1 + production + seed catalog + prices **unchanged**. Phase A2 only. **No phase B / no retune.** Random is the v1/v2 control on the same holdout indices (policy-v3 does not re-run Random).

## Disclosed lookahead

policy-v3: Random is NOT re-run (v1/v2 control on the same seeds). Value/Synergy/Greedy: root beam over ALL legal action TYPES with no skipItem/reroll/remove prune; remove UIDs ranked by dual static+synergy value, beam width min(8, |removes|) (wider than v2 beam 3; full set when pool removes ≤ 8). After the root action, continuation is dualChoiceV3 (staticChoice under synergy=false AND synergy=true; if they differ, keep the higher dualActionScore) for at most 8 spins / 64 fullCommand. Surrogate reseeds synthetic full-sim-model-v3/0 (createRng); live seed and five streams never copied. Model-generated offers are visible to dual continuation; they are not live offers. Branch width = |root candidates| (typically 8-20). Root utility still bot-specific: Value uses static mean, Greedy/Synergy use synergy mean. Utility: WON +1e5, LOST -1e5, model income, mean value, pool, tokens, cash-payment margin. Not optimal, not exhaustive tree search, not a live-RNG oracle. Horizon 8 (low end of 8-10) chosen to keep wall under the 3h budget with REMOVE_BEAM 8.

- HORIZON_SPINS = **8**
- COMMAND_CAP = **64**
- REMOVE_BEAM = **8** (all legal types at root; skipItem/reroll/remove not pruned)
- MODEL_SEED = `full-sim-model-v3/0` via `createRng`; live seed/five streams never copied
- Continuation: `dualChoiceV3` (static greedy AND synergy; if they differ, higher dualActionScore)
- Branch width = |root candidates| (typically 8–20)

## Official subset

Holdout indices 0–199 on Value/Synergy/Greedy. Same catalog `F4-FULL-v1/<Bot>/holdout/<index>`. Prefix `full-sim-policy-v3-batch-`. Probe dests retained.

| Bot | n | v1 Wilson | v2 Wilson | v3 Wilson | Δ v2 | Δ v1 | v3 fail stages |
|---|---:|---|---|---|---:|---:|---|
| Value | 200 | 0.00% [0.00%, 1.88%] | 27.00% [21.32%, 33.54%] | 33.50% [27.32%, 40.30%] | 6.50pp | 33.50pp | 10:54, 8:13, 9:66, WON:67 |
| Synergy | 200 | 0.00% [0.00%, 1.88%] | 25.00% [19.51%, 31.43%] | 33.50% [27.32%, 40.30%] | 8.50pp | 33.50pp | 10:41, 8:15, 9:77, WON:67 |
| Greedy | 200 | 1.50% [0.51%, 4.32%] | 22.00% [16.82%, 28.24%] | 25.50% [19.96%, 31.96%] | 3.50pp | 24.00pp | 10:52, 8:17, 9:80, WON:51 |
| Random (control, not re-run) | 200 | 0.00% [0.00%, 1.88%] | 0.00% [0.00%, 1.88%] | n/a | | | |

Speed probe (n=30, same policy, dests retained): Value 13/30, Synergy 10/30, Greedy 5/30, ~26 s/game. ETA for 200×3 parallel ~1.1–1.5 h wall (observed ~45 min for 6×100). Under the 3 h cap, so official n=200 per holdout bot (6 shards of 100). Engineering checks `full-sim-policy-v3-checks.json` 6/6 PASS (production hashes, peek ban, skipItem/reroll/remove in root candidates, horizon 8 / cap 64 / beam 8).

## Strategy upper-bound estimate

Depth ladder on the **same 200 holdout seeds**:

| Bot | v1 (no lookahead) | v2 (H=5, beam 3, static) | v3 (H=8, beam 8, dual) | v1→v2 | v2→v3 |
|---|---|---|---|---:|---:|
| Value | 0.00% | 27.00% | 33.50% | +27.00pp | +6.50pp |
| Synergy | 0.00% | 25.00% | 33.50% | +25.00pp | +8.50pp |
| Greedy | 1.50% | 22.00% | 25.50% | +20.50pp | +3.50pp |

- Strongest v3 holdout point: **33.50%**. Wilson 95% [27.32%, 40.30%]. The interval hi grazes 40%; the point estimate and lo stay below 40%.
- §13.3 40–70% band: **NOT ENTERED**.
- Diminishing returns: v1→v2 was a large policy effect (~20–27pp). v2→v3 (deeper horizon, wider remove beam, dual continuation) added only **+3.5 to +8.5pp**. Under this model class the extra search is not converting into band entry.
- Failures remain late: v3 losses concentrate at stages 9–10 (Value 66+54, Synergy 77+41, Greedy 80+52). v1 on the same seeds died much earlier (mostly 7–8).
- skipItem is in the root candidate set (checks + ITEM_CHOICE). Live skipItem appears once on Synergy v3; unused on Value/Greedy live paths means the beam did not select it, not that it was pruned. reroll/remove are used thousands of times.
- Random control on the same 200 holdout indices: 0/200 in both v1 and v2.

**Judgment:** 23–30% (v2 full 1000) was **not** the full strategy ceiling — v3 lifts this 200-seed slice to 25.5–33.5%. That ceiling under disclosed v3 search is still **well below 40%**. Economy-side residual hypothesis is **STRENGTHENED**. This is not a proof that no stronger policy exists (horizon 8 not 10, continuation not full tree, model offers ≠ live). It is enough to reject “v3 will enter 40–70% by searching a bit more.” **Economy need not be declared ‘no change’.** Phase B still requires explicit authorization.

formalBalance / economy remain **NOT APPROVED**. Human play still pending. Independent tool audit: `docs/GDD1_FULL_SIM_POLICY_V3_PROBE_AUDIT.md` **TOOLS_PASS** (SHA `919fc1d5661f1a81fedb5ae3d80dc009f70df8b5ba8cc675a9e4c835b6ad97cc`) and `tests/gdd1/f4-grok-audit-policy-v3.json` (SHA `b2306883bff33a91fd11147136fe7efb1bfa27d8db5156b1fa6cadfa262a1715`). Auditor independently recomputed 600/600, Wilson v1/v2/v3 on the same 200 seeds, 9/9 replays, peek PASS, skipItem in root candidates. blockReasons empty. The auditor hashed this report before this audit paragraph; freeze-policy-v3 hashes the current file.

## Depth vs v2

v2: HORIZON 5 / COMMAND_CAP 36 / REMOVE_BEAM 3 / static continuation. v3: HORIZON 8 / COMMAND_CAP 64 / REMOVE_BEAM 8 / dual continuation. v3 did not enter 40%+. The remaining gap to 40% is **6.5pp** from the strongest point estimate (33.50% → 40%), and Wilson lo is 12.7pp below 40%.

No production retune. Phase B needs explicit main-pane authorization. v1 jsonl, freeze-v4, agg-freeze, and freeze-policy-v2 are not overwritten.
