# GDD1 full-v1 Normal aggregation — independent audit

Independent auditor signature for statistics / recompute / gates / the engineering report against original prefix `full-sim-batch-v3-`. This is the same auditor who signed `docs/GDD1_FULL_SIM_AUDIT.md` (**TOOLS_PASS**, economy **NOT APPROVED**). This document does not overwrite production `js/gdd1/**`, freeze JSON, batch jsonl, `docs/GDD1_FULL_SIM.md`, or the prior tool audit. Machine-readable companion: `tests/gdd1/f4-grok-audit-sim-agg-v1.json`.

**Aggregation judgment: AGG_PASS**

**Economy judgment: NOT APPROVED** regardless of recorded win rates or Wilson intervals. Slice 65% is not a substitute. Formal Normal economy is not accepted by this audit.

Engineering JSON was re-computed from the original v3 jsonl. It was not rubber-stamped.

## Frozen authorities (independently re-hashed)

| Authority | Bytes | SHA-256 | Hold |
|---|---:|---|---|
| `docs/GAME_DESIGN_V1.md` | 103576 | `e33e1699aed464cd656abc2344d9e68be92a7238da482f9861e5e67dedc8df07` | yes |
| `tests/gdd1/f4-grok-freeze-v4.json` | 94204 | `cadba0fa63b151cb1b3a7933697cbeb295e9154ec4adb5bae595ffa7e8c09953` | yes; 436/436 live hashes |
| `docs/GDD1_FULL_SIM_AUDIT.md` | 16285 | `e08580281e482d8bec0fce9414290401149fbecd171dc4a0f7d17177350ff437` | yes; prior TOOLS_PASS |
| `js/gdd1/resolver.js` | 27996 | `e86d51fb4c20d235312b263146f18d2c4cd69c13453846fe0daf9b07a0aaf88b` | yes |
| `js/gdd1/full-effects.js` | 37993 | `f65bc06b4c38fb35db14cc21f6ed4c63a42efbb06956f71078974990c5d8de55` | yes |

freeze-v4 `--verify` (read-only) and independent hashing of every freeze entry: **436/436 pass**. Production was not modified.

Engineering artifacts hashed as found (read-only):

| File | Bytes | SHA-256 |
|---|---:|---|
| `docs/GDD1_FULL_SIM.md` | 24474 | `4a31b21bd65569ac92a3fd0c7aa3f80e2635059388067e587428fa567c723dab` |
| `tests/gdd1/full-sim-statistics.json` | 59337286 | `3cb38a192b0fc2805d956eda40f91db827f8d43095c9b5d26d33e246eeea04bf` |
| `tests/gdd1/full-sim-recompute.json` | 1581 | `68d383366ae64ade4210adc89492d03b31593b2bbbbde8b8ff461cecb2bf2ee5` |
| `tests/gdd1/full-sim-gates.json` | 1182561 | `07ad530858265de4b07b7227238ff0ecfe3000139c1c18da2535ded94d95c8a6` |
| `tests/gdd1/f4-grok-audit-sim-v1.json` | 56366 | `9b3c5cc1a615ce13d35608abb7bb129a3526b63e6a42ef80f59f8ed868ac9bbf` |

## Independent group table

Wilson 95% uses (z=1.959963984540054) on independent games. Stage paid is `payments[].paid`. Formed/mixed are among all 1000 games. Win routes are among wins only.

| Bot / Split | n | Wins | Wilson 95% | Stage1 paid | Stage3 paid | Stage6 paid | Unique seeds | Unused ops | Formed / mixed (all) | Wins unformed / mixed / single |
|---|---:|---:|---|---:|---:|---:|---:|---|---|---|
| Greedy/holdout | 1000 | 23 | 2.30% [1.54%, 3.43%] | 1000 | 1000 | 999 | 1000 | reroll, skipItem | 999 / 942 | 0 / 23 / 0 |
| Greedy/train | 1000 | 33 | 3.30% [2.36%, 4.60%] | 1000 | 1000 | 999 | 1000 | reroll, skipItem | 999 / 967 | 0 / 33 / 0 |
| Random/holdout | 1000 | 0 | 0.00% [0.00%, 0.38%] | 1000 | 999 | 640 | 1000 | none | 996 / 972 | 0 / 0 / 0 |
| Random/train | 1000 | 0 | 0.00% [0.00%, 0.38%] | 1000 | 1000 | 631 | 1000 | none | 996 / 973 | 0 / 0 / 0 |
| Synergy/holdout | 1000 | 0 | 0.00% [0.00%, 0.38%] | 1000 | 1000 | 984 | 1000 | skipItem | 1000 / 697 | 0 / 0 / 0 |
| Synergy/train | 1000 | 0 | 0.00% [0.00%, 0.38%] | 1000 | 1000 | 986 | 1000 | skipItem | 999 / 707 | 0 / 0 / 0 |
| Value/holdout | 1000 | 0 | 0.00% [0.00%, 0.38%] | 1000 | 1000 | 998 | 1000 | skipItem | 1000 / 968 | 0 / 0 / 0 |
| Value/train | 1000 | 0 | 0.00% [0.00%, 0.38%] | 1000 | 1000 | 999 | 1000 | skipItem | 1000 / 951 | 0 / 0 / 0 |

Reached (spins at stage) equals `finalState.stageId >= stage` for all 8 groups × 10 stages. Statistics `stage[].reached.k` and `survival.k` match these independent counts. Engineering report stage tables match.

## Required checks

1. **Authorities / freeze-v4.** GDD, freeze-v4, prior audit, resolver, and full-effects SHA match the required hex. freeze-v4 independently hashed 436/436; `node tests/gdd1/f4-grok-freeze-v4.js --verify` pass 436/436.
2. **Counts.** 16 v3 jsonl + index; 8000 games; 8000 index SHA/offset/bytes matches; 8 groups × 1000; 8000 unique seeds vs `full-sim-seeds.json`; 0 duplicates; 0 missing; 0 extra; 0 errors; 0 unfinished; 0 command `ok:false`.
3. **Wilson win rate.** Independent (k/n/\mathrm{rate}/\mathrm{lo}/\mathrm{hi}) equals `statistics.groups[*].winRate` at 1e-15. Displayed percents match `docs/GDD1_FULL_SIM.md`.
4. **Stage reached / paid.** Independent paid (stage 1/3/6 shown above; all 1..10 in the JSON companion) matches statistics survival.k. Reached matches statistics reached.k.
5. **Attribution.** Whole-game contribution sum equals sum of spin incomes for all 8000. Group totals: Greedy holdout 4121911, train 4157916; Random holdout 2209731, train 2179227; Synergy holdout 2935314, train 2970345; Value holdout 3387276, train 3376772. Attribution fails 0.
6. **Live commands.** Ops match statistics `actions`. Unused: Greedy reroll+skipItem; Random none; Synergy/Value skipItem. Gates unused lists match. Live command totals match the engineering report (Greedy holdout 129407, train 129610; Random holdout 110524, train 109727; Synergy holdout 122322, train 123174; Value holdout 133266, train 133069).
7. **Formation routes among wins.** Greedy holdout mixed 23, train mixed 33; all other groups 0 wins. Matches statistics `routes` and gates `winningRoutes`. No unformed wins. No single-route wins.
8. **Recompute / replay.** `full-sim-recompute.json`: files 16, games 8000, indexHashes 8000, errors []. All 8 listed index-0 replays plus 8 extra index 100 (one per bot/split) replayed with `fullNewRun` + recorded `fullCommand`; 16/16 `hashMatch`. Listed hashes:

| Reason | Seed | Outcome | Actions | Final SHA |
|---|---|---|---:|---|
| recompute index-0 | `F4-FULL-v1/Greedy/holdout/0000` | LOST | 124 | `dfc1517aaffacca36c68ed23062a865c9bcf1c5eb8eee9f8ce82d117c2f7f18f` |
| extra index-100 | `F4-FULL-v1/Greedy/holdout/0100` | LOST | 143 | `52addce2fda8bf2a3859e650a4962d7124a9faac306dd9dba8480cc12496b9c6` |
| recompute index-0 | `F4-FULL-v1/Greedy/train/0000` | WON | 151 | `4ad5476a4f296e4e34e4f6a3662f4875fa36724208ea927853e8838d5ad1acc3` |
| extra index-100 | `F4-FULL-v1/Greedy/train/0100` | LOST | 136 | `720de957c207aded1ebaf8e9da53a08318530aed190b45107596bdbc82f7e49e` |
| recompute index-0 | `F4-FULL-v1/Random/holdout/0000` | LOST | 117 | `d76ae7fb04e71d62d2bb21ecf746c9b36be31b97187ed9e847d7574c39ebd545` |
| extra index-100 | `F4-FULL-v1/Random/holdout/0100` | LOST | 117 | `907d92af00d90b02f77b88a9766dd1ceb6a15b04728caec281050189ac66b2cd` |
| recompute index-0 | `F4-FULL-v1/Random/train/0000` | LOST | 114 | `7842310233ff52db850bb5e7599bcbb87f5e3fce4b913dd75b2fa4441b9c7c9e` |
| extra index-100 | `F4-FULL-v1/Random/train/0100` | LOST | 116 | `a68dbf2e478e6d06719b57cececd0defac44c4d537755e49b6fa114584bb6273` |
| recompute index-0 | `F4-FULL-v1/Synergy/holdout/0000` | LOST | 130 | `299241744f725d574aa8c054fbe9baacc877804799dc58e7f49bf4b3c6617627` |
| extra index-100 | `F4-FULL-v1/Synergy/holdout/0100` | LOST | 131 | `37a2b32fcf05484ee74165262a0f89e8db96b126ad665c3faf0fb5951bb2eeb8` |
| recompute index-0 | `F4-FULL-v1/Synergy/train/0000` | LOST | 111 | `d067c9a837874a771b4fdd8c172cfa89267906e95785191b4424f7684033d3b4` |
| extra index-100 | `F4-FULL-v1/Synergy/train/0100` | LOST | 112 | `08e97fd3f89061a0d2082f0f46c705582c322fc78438963aa63e47459e6d238f` |
| recompute index-0 | `F4-FULL-v1/Value/holdout/0000` | LOST | 119 | `e7724020ebd8b0bc5e7ba9a267720e96921aa6cf3cad704f6dd8f757fa16406b` |
| extra index-100 | `F4-FULL-v1/Value/holdout/0100` | LOST | 154 | `b1cdf52e1f06333bcff1a4e17aff38a3f132326f863d435b58b028429129679a` |
| recompute index-0 | `F4-FULL-v1/Value/train/0000` | LOST | 141 | `3928304543013f3df766a90fd4a05b21c2d192564cc51a5b2ff740473dfb047c` |
| extra index-100 | `F4-FULL-v1/Value/train/0100` | LOST | 114 | `af010f783b8311da74434744242d0a21dfb699e40d69efacfc10c628c2baf20c` |

9. **Gates.** `formalBalance` starts **NOT APPROVED**. `sampling` is PASS with 8000. Unused note matches independent unused lists. `failedSeedCount` equals (n-\mathrm{wins}) per group (Greedy holdout 977, train 967, others 1000). Those failed seeds exist in the original v3 jsonl.
10. **Engineering report.** `docs/GDD1_FULL_SIM.md` wins, Wilson percents, unused-action JSON, live command totals, and stage reached/paid tables match independent numbers and statistics JSON. `formalBalance` **NOT APPROVED**. Prior TOOLS_PASS citation present with SHA `e08580281e482d8bec0fce9414290401149fbecd171dc4a0f7d17177350ff437`.
11. **Wilson not on ratios.** statistics `eventAcceptance` (8), `selectionRate` (824), `eventRatio` (76018) have no `lo`/`hi`.
12. **Historical job-kill.** 32 v1/v2 jsonl files remain (no `-index.json`). Aggregation used only prefix `full-sim-batch-v3-`. v1 greedy 0 lines; random 18; synergy 10–12; value 12–13. v2 greedy 0; random 15–16; synergy 10–11; value 10–11.
13. **Train vs holdout.** 4000 + 4000 exact seed strings, shared 0.

## Mismatches

**Material mismatches: none.**

One auditor-parser false positive was recorded during MD unused-line capture: greedy `([^*]+)` on the last unused-actions line (Value/train) consumed later markdown. Direct read of engineering line 42 is `Unused: skipItem.` Independent unused is `skipItem`. Not a mismatch of engineering vs jsonl.

## Economy

Recorded Greedy holdout 23/1000 and train 33/1000, others 0/1000, are diagnostic counts only. They are **not** GDD §13.3 acceptance. Slice 65% is not a substitute. **Economy remains NOT APPROVED.**
