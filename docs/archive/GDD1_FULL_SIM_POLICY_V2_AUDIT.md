# GDD1 full-v1 Normal policy-v2 tools — independent audit

Independent auditor signature for policy-v2 tools and the official prefix `full-sim-policy-v2-batch-`. Same auditor who signed `docs/GDD1_FULL_SIM_AUDIT.md` (**TOOLS_PASS**) and `docs/GDD1_FULL_SIM_AUDIT_AGG.md` (**AGG_PASS**). This document does not overwrite production `js/gdd1/**`, `docs/GAME_DESIGN_V1.md`, freeze-v4, agg-freeze, v1 jsonl, or policy-v2 engine/run/stats/gates/integrity/report/prices. Machine-readable companion: `tests/gdd1/f4-grok-audit-policy-v2.json`.

This audit streamed the 16 official jsonl files, recomputed Wilson/stage/actions, hashed authorities, inspected candidate construction in source, probed skipItem at ITEM_CHOICE, probed peek, and replayed 16 games through production `fullNewRun` + `fullCommand`. It does not recitation-pass `docs/GDD1_FULL_SIM_POLICY_V2.md`.

**Tools judgment: TOOLS_PASS**

**Economy judgment: NOT APPROVED** regardless of recorded policy-v2 win rates or Wilson intervals. Slice 65% is not a substitute. Formal Normal economy is not accepted by this audit.

**formalBalance: NOT APPROVED.** No retune. Phase B not started.

## Frozen authorities (independently re-hashed)

| Authority | Bytes | SHA-256 | Hold |
|---|---:|---|---|
| `docs/GAME_DESIGN_V1.md` | 103576 | `e33e1699aed464cd656abc2344d9e68be92a7238da482f9861e5e67dedc8df07` | yes |
| `js/gdd1/resolver.js` | 27996 | `e86d51fb4c20d235312b263146f18d2c4cd69c13453846fe0daf9b07a0aaf88b` | yes |
| `js/gdd1/full-effects.js` | 37993 | `f65bc06b4c38fb35db14cc21f6ed4c63a42efbb06956f71078974990c5d8de55` | yes |
| `tests/gdd1/f4-grok-freeze-v4.json` | 94204 | `cadba0fa63b151cb1b3a7933697cbeb295e9154ec4adb5bae595ffa7e8c09953` | yes; 436/436 live hashes; `--verify` pass |
| `tests/gdd1/f4-grok-agg-freeze-v1.json` | 2525 | `af08f789b4b453e45a588f247a70a623f6c15ca62928f3995c2b65d23c5581a2` | yes; 8/8 live hashes; `--verify` pass |
| `tests/gdd1/full-sim-statistics.json` (v1) | 59337286 | `3cb38a192b0fc2805d956eda40f91db827f8d43095c9b5d26d33e246eeea04bf` | yes; unmutated |

Production also re-hashed: `js/gdd1/full-controller.js` 7963 `2c44f91f7f8806216b06666e685cbd4ab1a6f4ca2973528b7022102cd13e4558`; `js/gdd1/rng.js` 1680 `f3f5c055a8e3f4d5e18d355488194f94dfbc28603be7c29a5aab1743bd6704f7`; `js/gdd1/contract.js` 4911 `b7bd44d05ccdd4ffffe13e4949f7de92f3c7f37e628feaf3a6bf58023e7ea5c9`; `gdd1.html` 2266 `57a8bc7f8e770e6f0dc316f859f473840daf243ff5b54dc6033d0119c5ec20d5`.

## Policy-v2 tools / dests (read-only hashes)

| File | Bytes | SHA-256 |
|---|---:|---|
| `tests/gdd1/full-sim-engine.js` | 10020 | `90531adfbc08ea0f00b037e8366e1379417f2964f97ae0eca16b8fce773f5227` |
| `tests/gdd1/full-sim-engine-policy-v2.js` | 6006 | `ae021bf8e4b4e02104cc3a9d141a163ce798270def459b8870247a7d70abd915` |
| `tests/gdd1/full-sim-run-policy-v2.js` | 8824 | `a72fed888fc71b43b20bfcf93bfff89eb913aadc691031dfc6bddcbe1c348895` |
| `tests/gdd1/full-sim-stats-policy-v2.js` | 11611 | `62c1519cad9b2f56cae14b06dc6cac68a14d1549bb452b86a1dff57091356e5a` |
| `tests/gdd1/full-sim-gates-policy-v2.js` | 6278 | `6f39d1495712d13f7db89aff0177176182f978f893b099ecbacba55e95f870c6` |
| `tests/gdd1/full-sim-integrity-policy-v2.js` | 9119 | `9ea112b92a91d3aa5376fae0a1da9c4f6c012278b418396d9d2cb23cd315d666` |
| `tests/gdd1/full-sim-policy-v2-statistics.json` | 90972565 | `2d8587f8ffb62ced250ab1f4cbbe1c071c9d5cec3c776e2fb3d885a12e3f29f4` |
| `tests/gdd1/full-sim-policy-v2-gates.json` | 967389 | `c8405c7b6633594b1b22fdd096801cc51e14cc8ee0424771a96515aa0f857207` |
| `tests/gdd1/full-sim-policy-v2-recompute.json` | 1581 | `37f4df3fbf45adb40ed87e985d1007e44eb09f303377893492e6e9152a246c18` |
| `tests/gdd1/full-sim-policy-v2-integrity.json` | 24377 | `8d7ff470d7dc504e0a2163f0b93a8926d8194a6c15df85c34f0d62d9f562220f` |
| `docs/GDD1_FULL_SIM_POLICY_V2.md` | 31747 | `c45fa8ae127eacb43467b707d1eb28d5e0c3d2d0c5ea6f9a6518ba95210c62a8` |

## Check 1 — official 16 jsonl vs index vs catalog

Prefix `full-sim-policy-v2-batch-` only. Probes `full-sim-policy-v2-probe-*` and jobkill `full-sim-policy-v2-jobkill-*` exist and are excluded from the 8000.

| Metric | Count |
|---|---:|
| Official jsonl files | 16 |
| Index files with n=500 and index.length=500 | 16 |
| Games (jsonl lines matching index rows) | 8000 |
| Unique seeds | 8000 |
| Duplicate seeds | 0 |
| Duplicate (bot,split,index) | 0 |
| Missing vs catalog `F4-FULL-v1/<Bot>/<train\|holdout>/<0000-0999>` | 0 |
| Extra vs catalog | 0 |
| Train / holdout / shared exact seed strings | 4000 / 4000 / 0 |
| Unfinished (phase not WON/LOST) | 0 |
| Game-level errors | 0 |
| Command `ok:false` | 0 |
| Catalog / policySeed fails | 0 / 0 |
| Attribution (contrib ≠ spin income) | 0 |
| Games with `game.log` | 0 |

Every shard: jsonl lines 500, index `n` 500, `index.length` 500. Catalog path matches. Random policySeed is `decision-full-v1/Random/<split>/<index>`. Value/Synergy/Greedy policySeed is `decision-full-v2/<Bot>/<split>/<index>`.

Official jsonl SHA-256 (streamed):

| File | Bytes | SHA-256 |
|---|---:|---|
| greedy-holdout-0 | 60128594 | `bcf0f6e6ceb41686730fb7d37d6122717c1705d84b7183df6c6dc165770d5964` |
| greedy-holdout-500 | 60290962 | `9a1d122d3a008a7836778183aec975efada9285019a96814d63bb7e8ddde923f` |
| greedy-train-0 | 60004315 | `c9908078a893570622f558dd21fb907c0e0b87b8f2e623901d5c3b309d959085` |
| greedy-train-500 | 60052712 | `a56a7d3cab5cd0bb18049ee1bfa1f97e38f56f7bf8c1dae32614a577fab549ad` |
| random-holdout-0 | 43342588 | `e859ce3ae24b9f27072ee79dcc2e2a2f4c95544e056fc4286e482c365a87a175` |
| random-holdout-500 | 43573589 | `38c2e067a752c3cbf6381a8bd996c4d798499e48c13e27f652e87727063beff8` |
| random-train-0 | 43278115 | `9bcc6c2975151d5fe193b8db98f8a962283314fa4a28b8ca1c58323ff159d47e` |
| random-train-500 | 42960538 | `584dd9fa4ccd4e9a1da4e1963423f9ce3624f38566f4353ae999a098277e57a0` |
| synergy-holdout-0 | 59891144 | `36c35d8feeb96bd6bbf03aab271a557aa2912962500eb33a9366f1d13d9bd7ee` |
| synergy-holdout-500 | 60047058 | `4219579af1b1c5f446aad2b40ec4e24c7e481ff1ebdecf6ea6226bd2d990a1df` |
| synergy-train-0 | 60091441 | `344b66807ad2a4b8a1c2a330961d5b9b4e6595a6fe48bba04e1be510886be9fe` |
| synergy-train-500 | 60218579 | `332ec04e508dafa23ce4f0ba13e19698ca0c7024ec993d54c2f3c605907a6134` |
| value-holdout-0 | 61424389 | `e146d258ba2976f26cc530689fca38c617e5f5fa6702dd53b6cd9c54c4b6e113` |
| value-holdout-500 | 61361086 | `c944a49fb093ad180f3dfa5f65244468e88f883f37dc7955b7b82688532fb213` |
| value-train-0 | 61393809 | `b6789f0faaa0d999f04ed02d97ca5e79446323eb9ae8ebb4dca85697f9704ca0` |
| value-train-500 | 61475072 | `f88a53dc8fa322ed8993bb6f3e51f3dec9cee5e265f8698211fa4c78b4338b20` |

## Check 2 — independent Wilson 95% (z=1.959963984540054)

Wilson on independent games only. Formula: (c=(p+z^2/(2n))/(1+z^2/n)), (r=z\sqrt{p(1-p)/n+z^2/(4n^2)}/(1+z^2/n)), lo/hi = c±r. Compared k/n/rate/lo/hi to `full-sim-policy-v2-statistics.json` with `Object.is` (bitwise). **0 mismatches.**

Offer/event/selection ratios in statistics have **0** lo/hi fields (eventAcceptance 8, selectionRate 824, eventRatio 116984). Wilson was not applied to dependent ratios.

### Holdout

| Bot | k | n | rate | lo | hi | display |
|---|---:|---:|---:|---:|---:|---|
| Greedy | 233 | 1000 | 0.233 | 0.20785061925196213 | 0.2601928697793244 | 23.30% [20.79%, 26.02%] |
| Random | 0 | 1000 | 0 | 2.168404344971009e-19 | 0.0038267584855551234 | 0.00% [0.00%, 0.38%] |
| Synergy | 239 | 1000 | 0.239 | 0.2135979397357572 | 0.2663996281937026 | 23.90% [21.36%, 26.64%] |
| Value | 299 | 1000 | 0.299 | 0.27143763442230356 | 0.3281007224888896 | 29.90% [27.14%, 32.81%] |

### Train

| Bot | k | n | rate | lo | hi | display |
|---|---:|---:|---:|---:|---:|---|
| Greedy | 238 | 1000 | 0.238 | 0.21263955247557198 | 0.2653656689708589 | 23.80% [21.26%, 26.54%] |
| Random | 0 | 1000 | 0 | 2.168404344971009e-19 | 0.0038267584855551234 | 0.00% [0.00%, 0.38%] |
| Synergy | 225 | 1000 | 0.225 | 0.20019895514206568 | 0.25190576202498965 | 22.50% [20.02%, 25.19%] |
| Value | 291 | 1000 | 0.291 | 0.2636897827038124 | 0.3199098023431496 | 29.10% [26.37%, 31.99%] |

## Check 3 — stage reached / paid / survival

Reached from spins equals `finalState.stageId >= s` for all 8 groups × 10 stages. Paid matches statistics `survival.k`. Reached matches statistics `reached.k`. **0 mismatches.**

Holdout paid: Greedy 1000/1000/999 (s1/s3/s6) then s10 paid 233; Random 1000/999/640, s8 paid 1, s9 0, s10 0; Synergy 1000/1000/1000, s10 paid 239; Value 1000/1000/1000, s10 paid 299.

## Check 4 — live action counts

Recorded live commands are `game.actions`. Zero games have a `log` field. Ops compared to statistics `groups.*.actions`. **0 mismatches.**

Required ops: spin, choose, skip, remove, reroll, item, skipItem, eventA, eventB.

| Bot / Split | live | unused of 9 | skipItem | spin | choose | skip | remove | reroll | item | eventA | eventB |
|---|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Greedy/holdout | 158574 | none | 1 | 64525 | 36055 | 28470 | 9496 | 9683 | 8314 | 1128 | 902 |
| Greedy/train | 158247 | skipItem | 0 | 64433 | 35893 | 28540 | 9521 | 9536 | 8304 | 1071 | 949 |
| Random/holdout | 110524 | none | 1426 | 44677 | 33505 | 11172 | 6722 | 7370 | 4242 | 946 | 464 |
| Random/train | 109727 | none | 1404 | 44383 | 33271 | 11112 | 6695 | 7257 | 4222 | 884 | 499 |
| Synergy/holdout | 158299 | skipItem | 0 | 64499 | 35509 | 28990 | 9508 | 9444 | 8312 | 1100 | 937 |
| Synergy/train | 158605 | none | 1 | 64627 | 35683 | 28944 | 9539 | 9498 | 8327 | 1077 | 909 |
| Value/holdout | 161780 | skipItem | 0 | 65417 | 35669 | 29748 | 9643 | 10855 | 8427 | 1134 | 887 |
| Value/train | 161435 | none | 1 | 65282 | 35526 | 29756 | 9645 | 10772 | 8409 | 1195 | 849 |

Corpus-wide unused of the 9: **none**. skipItem is live-unused in Greedy/train, Synergy/holdout, Value/holdout (count 0). That is a beam **selection** result. Check 5 shows skipItem is in the root candidate set at ITEM_CHOICE.

ContribSum === spinIncomeSum for all 8 groups. All winning routes mixed (no single-letter firstFormation among wins).

## Check 5 — lookahead constants and rootCandidates

Read from `tests/gdd1/full-sim-engine-policy-v2.js` exports and source:

- `HORIZON_SPINS === 5`
- `COMMAND_CAP === 36`
- `REMOVE_BEAM === 3`
- `MODEL_SEED === 'full-sim-model-v2/0'`
- `LOOKAHEAD` string equals the export built from those constants

Candidate construction as read from source (not from the engineering report):

```
function rootCandidates(v, synergy) {
  const a = legal(v);
  const core = a.filter(x => !['remove'].includes(x.op));
  return [...core, ...worstRemoves(v, synergy, REMOVE_BEAM)];
}
```

`core` excludes only `remove`. skipItem, reroll, item, choose, skip, eventA/eventB remain in the root set whenever they are legal.

Independent local probe (TEMP, no production writes):

- SYMBOL_CHOICE: legal ops choose/skip/remove/reroll; candidates include choose/skip/reroll plus remove; legalRemoves 12, candidateRemoves 3 (= REMOVE_BEAM).
- ITEM_CHOICE reached: legal ops `item`, `skipItem`; candidate ops `item`, `skipItem`; `skipItemInRoot === true`.

Unused live skipItem means the beam never selected it. It was not pruned from the root set.

## Check 6 — peek ban

`publicView` in `full-sim-engine.js`:

```
function publicView(s) {
  const v = copy(s);
  delete v.rng;
  delete v.seed;
  return v;
}
```

`surrogateV2` in `full-sim-engine-policy-v2.js`:

```
function surrogateV2(v) {
  const s = copy(v);
  s.seed = MODEL_SEED;
  s.rng = F.createRng(s.seed, s.profile, s.difficulty);
  return s;
}
```

Independent probe: decide ignores a swapped live seed; live state unchanged after decide; publicView has neither rng nor seed; surrogate seed is `full-sim-model-v2/0`; surrogate rng is not the live rng; live rng unchanged after rollout. Source does not copy live rng into the surrogate. **PASS.**

## Check 7 — Random is the v1 control

Random policySeed: `decision-full-v1/Random/<split>/<index>`. Value/Synergy/Greedy: `decision-full-v2/<Bot>/<split>/<index>`. policySeedFails 0.

Random train index 0000:

| Source | finalHash |
|---|---|
| policy-v2 jsonl `F4-FULL-v1/Random/train/0000` | `7842310233ff52db850bb5e7599bcbb87f5e3fce4b913dd75b2fa4441b9c7c9e` |
| v1 `full-sim-batch-v3-random-train-0.jsonl` index 0000 | `7842310233ff52db850bb5e7599bcbb87f5e3fce4b913dd75b2fa4441b9c7c9e` |

**Match: yes.** policySeed `decision-full-v1/Random/train/0`. Outcome LOST, 114 actions.

## Check 8 — independent production replays

Replay is `F.fullNewRun(seed)` then recorded `F.fullCommand` from `tests/gdd1/full-sim-engine.js` (production resolver/effects). Engineering integrity JSON was not used as a substitute.

**16/16 hashMatch.** All 8 (bot, split) index 0 plus 8 extra index 100.

| Reason | Seed | Outcome | Actions | finalHash |
|---|---|---|---:|---|
| index-0 | `F4-FULL-v1/Greedy/holdout/0000` | LOST | 152 | `736ba7470433aa9f90aadcfb95e8e2dd142fefbf41fcbdd766bc7ac540a18594` |
| extra-100 | `F4-FULL-v1/Greedy/holdout/0100` | LOST | 134 | `374fdf269a4ace4aeeac91d6c3fcca2124516e452499df729aa8ab779416e004` |
| index-0 | `F4-FULL-v1/Greedy/train/0000` | WON | 179 | `33f03a7f00d9ef643ac4c178df090631d04a7e8e787892f3b169b081dc721269` |
| extra-100 | `F4-FULL-v1/Greedy/train/0100` | WON | 172 | `ce9ef271d837755e869a1407a1b145fb0470847e81d4720f2963025a11194617` |
| index-0 | `F4-FULL-v1/Random/holdout/0000` | LOST | 117 | `d76ae7fb04e71d62d2bb21ecf746c9b36be31b97187ed9e847d7574c39ebd545` |
| extra-100 | `F4-FULL-v1/Random/holdout/0100` | LOST | 117 | `907d92af00d90b02f77b88a9766dd1ceb6a15b04728caec281050189ac66b2cd` |
| index-0 | `F4-FULL-v1/Random/train/0000` | LOST | 114 | `7842310233ff52db850bb5e7599bcbb87f5e3fce4b913dd75b2fa4441b9c7c9e` |
| extra-100 | `F4-FULL-v1/Random/train/0100` | LOST | 116 | `a68dbf2e478e6d06719b57cececd0defac44c4d537755e49b6fa114584bb6273` |
| index-0 | `F4-FULL-v1/Synergy/holdout/0000` | LOST | 169 | `be36953ddfd01fce5b40c9b35fb6c062d8c63aee4b3050a4b39afd977fdf991d` |
| extra-100 | `F4-FULL-v1/Synergy/holdout/0100` | LOST | 153 | `ecfbaa58c9bca7af9a85c8920351fef06a61a85fe5f72192bebfa4b56e8ac927` |
| index-0 | `F4-FULL-v1/Synergy/train/0000` | LOST | 170 | `a2f9fa11a34b169694cecdeb34c054b4627863f2883450538c375fbb4769d0b6` |
| extra-100 | `F4-FULL-v1/Synergy/train/0100` | LOST | 153 | `d6eba96d9431d141bf39efa40ae3b3233ca72290f59a07e3a497058ef7c12f8a` |
| index-0 | `F4-FULL-v1/Value/holdout/0000` | LOST | 153 | `6b74eb3482612957f64174603e8d487b82a24f694d277988e146260972fafacd` |
| extra-100 | `F4-FULL-v1/Value/holdout/0100` | WON | 171 | `75586dc2553d22c25bf2d9d449f19e84c705d892b7325707c33eccf232179c8d` |
| index-0 | `F4-FULL-v1/Value/train/0000` | WON | 170 | `03422c486bcae4c3631e15ba95f53f61109cd18f07f1126d3ad00a7de4752b2c` |
| extra-100 | `F4-FULL-v1/Value/train/0100` | LOST | 154 | `021bc6fc5067d42d5c3e6eeb6f22e2aa4f219446b0bce670d2dd5c1468349b10` |

## Check 9 — integrity dest vs this stream

`tests/gdd1/full-sim-policy-v2-integrity.json` **PRESENT** (24377 bytes, `8d7ff470d7dc504e0a2163f0b93a8926d8194a6c15df85c34f0d62d9f562220f`). Engineering `pass: true`, seen 8000, missing/duplicates/attributionFails/replayFails/unfinished/errors all 0, `replayAll: true`.

Those **count** claims match this auditor stream (8000/0/0/0). Isolation 4000/4000/0 matches.

`replayAll` for all 8000 is an engineering claim. This auditor independently replayed **16/16** sampled games and did **not** replay all 8000. Status: **SAMPLE_CONFIRMED**. Not a tools BLOCK: required independent replay is the sample in check 8.

Integrity `historicalJobKill` lists leftover v1 `full-sim-batch-*` names as historical; those files are excluded from the policy-v2 8000. Official v1 dests are the v3 prefix (check 11).

## Check 10 — GDD §13.3 gates on this Wilson

GDD §13.3 待验证: Synergy/Greedy target 40–70% and at least 15 percentage points above Random.

Independent holdout evaluation:

- Greedy 23.30% [20.79%, 26.02%] — **OUTSIDE 40–70%**. Wilson hi 26.02% is below 40%.
- Synergy 23.90% [21.36%, 26.64%] — **OUTSIDE 40–70%**. Wilson hi 26.64% is below 40%.
- Value 29.90% [27.14%, 32.81%] — also below 40% (not the named band pair).
- Random 0.00% [0.00%, 0.38%].
- ≥15pp vs Random: Greedy +23.3 pp, Synergy +23.9 pp — **HOLD**. Conservative lo(bot)−hi(Random): Greedy 20.41 pp, Synergy 20.97 pp, both ≥15.

Stage 1 paid ≥95% **HOLD** all 8 groups. Stage 3 paid ≥75% **HOLD** all 8 groups. Stage 6 paid 45–70%: Random holdout 640/1000 in band; Greedy/Synergy/Value ~100% **outside** (too high).

**formalBalance remains NOT APPROVED.** **Economy remains NOT APPROVED.** Distance from Greedy/Synergy holdout Wilson hi to the 40% floor is ~14–17 pp. That gap is an economy/price issue on this evidence. This audit does not retune and does not start phase B.

## Check 11 — v1 evidence retained

- freeze-v4 `--verify` **436/436 pass**; independent live hash of every freeze entry 436/436.
- agg-freeze `--verify` **8/8 pass**; independent live hash 8/8.
- 16 v1 `full-sim-batch-v3-*-{0,500}.jsonl` still present (hashes in the JSON companion).
- `docs/GDD1_FULL_SIM.md` `4a31b21bd65569ac92a3fd0c7aa3f80e2635059388067e587428fa567c723dab`
- `docs/GDD1_FULL_SIM_AUDIT.md` `e08580281e482d8bec0fce9414290401149fbecd171dc4a0f7d17177350ff437`
- `docs/GDD1_FULL_SIM_AUDIT_AGG.md` `338e34e2fa548038993c8557373de3d5da72751a63ede271ecaac403f114227f`

None of those files were written by this audit.

## Independent rejection

This audit can reject:

1. Economy / formalBalance approval — Greedy and Synergy holdout Wilson upper bounds sit below the 40% floor.
2. “skipItem unused ⇒ pruned from the beam” — source + ITEM_CHOICE probe put skipItem in `rootCandidates`.
3. Peek of live RNG — publicView deletes rng+seed; surrogate reseeds `full-sim-model-v2/0`.
4. Random control break — Random train 0000 finalHash matches v1 bitwise.

After those rejections, the remaining tool claims hold on independent numbers. Policy-v2 tools recorded the games they claim to have recorded. The 40–70% miss is not a counting, Wilson, peek, or candidate-construction defect.

## Verdict

**TOOLS_PASS**

**Economy: NOT APPROVED**

**formalBalance: NOT APPROVED**

No phase B. No retune. Chrome/human/art out of scope.
