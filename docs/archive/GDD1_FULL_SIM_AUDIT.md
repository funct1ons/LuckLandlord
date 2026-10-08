# GDD1 full-v1 Normal simulator / tools — independent audit

Independent auditor signature for the full-v1 Normal bot simulator and supporting tools, **before** economic aggregation is accepted. This document does not overwrite `docs/GDD1_F4_GROK_AUDIT.md`, `docs/GAME_DESIGN_V1.md`, `docs/GDD1_F4_AUDIT_SUPPLEMENT.md`, freeze JSON, production `js/gdd1/**`, or any historical `full-sim-batch*.jsonl`. Machine-readable companion: `tests/gdd1/f4-grok-audit-sim-v1.json`.

**Tools judgment: TOOLS_PASS**

**Economy judgment: NOT APPROVED** regardless of recorded win rates. Slice 65% is not a substitute. Formal Normal economy is not accepted by this audit.

F4 functional PASS (`docs/GDD1_F4_GROK_AUDIT.md`) was re-hashed and not re-litigated. Production `resolver.js` / `full-effects.js` match that freeze. Chrome is absent; UI was not touched.

## Frozen authorities (independently re-hashed)

| Authority | Bytes | SHA-256 | Hold |
|---|---:|---|---|
| `docs/GAME_DESIGN_V1.md` | 103576 | `e33e1699aed464cd656abc2344d9e68be92a7238da482f9861e5e67dedc8df07` | yes |
| `docs/GDD1_F4_AUDIT_SUPPLEMENT.md` | 7352 | `8b83cc616b41a6b115cfb20f70b8d04dfe214de6c66cbdd33096449ffb229824` | yes (matches expected 64-hex) |
| `docs/GDD1_F4_GROK_AUDIT.md` | 11628 | `19884a37955c48d4a468684aac87e05d3ae3d91c628f1cbaff99cb1487f5d23d` | yes; not re-litigated |
| `js/gdd1/resolver.js` | 27996 | `e86d51fb4c20d235312b263146f18d2c4cd69c13453846fe0daf9b07a0aaf88b` | yes; no production drift |
| `js/gdd1/full-effects.js` | 37993 | `f65bc06b4c38fb35db14cc21f6ed4c63a42efbb06956f71078974990c5d8de55` | yes; no production drift |
| `js/gdd1/full-controller.js` | 7963 | `2c44f91f7f8806216b06666e685cbd4ab1a6f4ca2973528b7022102cd13e4558` | matches F4 PASS |

## Simulator / tool hashes (live)

| File | Bytes | SHA-256 |
|---|---:|---|
| `tests/gdd1/full-sim-engine.js` | 10020 | `90531adfbc08ea0f00b037e8366e1379417f2964f97ae0eca16b8fce773f5227` |
| `tests/gdd1/full-sim-run.js` | 8926 | `940802bdf670801182c8bdf86b07290eecc99fdb35dd0f9d6c09bc7f3b02c53d` |
| `tests/gdd1/full-sim-stats.js` | 11517 | `4e900fb0cb336c327aac5942195b1f160dbedd13ae1f90f3ea70d5d892001424` |
| `tests/gdd1/full-sim-checks.js` | 8136 | `275843cb02a028b91a89b9f3c2093ec247dc394db9b7b4f5354544ef1a289f7b` |
| `tests/gdd1/full-sim-integrity.js` | 8731 | `1fbcea05f4be3b5b7875817f01818b5114cae24d5077c98302faf697194a6978` |
| `tests/gdd1/full-sim-seeds.js` | 1220 | `b43cf2162cef95feb0c9f55d7642031f9c224336c303d0baab8bfa7a438a3951` |
| `tests/gdd1/full-sim-seeds.json` | 1078594 | `2ffb7bf01cfea9a4ed0213af41bcd277c7873471c79725cbbe59f7807150ae31` |
| `tests/gdd1/full-sim-gates.js` | 6343 | `a1d4853f99cc1918af0a8116ccd66b89a9f515c0d3ecd0a03960b8abcc98a2d8` |
| `tests/gdd1/full-sim-tool-audit.js` | 11016 | `d8e62cdb35354464ff84e1b83c86ceb14674b1676ce4efbcc2b7be203aff2011` |
| `js/gdd1/rng.js` | 1680 | `f3f5c055a8e3f4d5e18d355488194f94dfbc28603be7c29a5aab1743bd6704f7` |
| `js/gdd1/contract.js` | 4911 | `b7bd44d05ccdd4ffffe13e4949f7de92f3c7f37e628feaf3a6bf58023e7ea5c9` |

Engine SHA matches the hash frozen inside `full-sim-seeds.json`. Runner SHA at seed freeze was `2c2a67308eb4e29654df23aeeea7699c9c94df4f22cf2b1cf31b9f11b0ed3bb3`; current runner is the later progress-sidecar revision. `play()` seed formula still matches the catalog (`F4-FULL-v1/<Bot>/<train\|holdout>/<0000-0999>` and `decision-full-v1/<Bot>/<split>/<index>`). Disclosed, not a line-verify failure.

`full-sim-statistics.json`, `full-sim-recompute.json`, and `full-sim-gates.json` were **absent**. Aggregation dests were not accepted.

## Counts (official v3, independently streamed)

Process exit code 0 is not proof of 500 complete games. This audit compared jsonl line count vs `-index.json` vs `full-sim-seeds.json`.

| Metric | Count |
|---|---:|
| Official v3 jsonl files | 16 |
| Games (jsonl lines with matching index rows) | 8000 |
| Expected catalog seeds | 8000 |
| Unique seeds seen | 8000 |
| Missing vs `full-sim-seeds.json` | 0 |
| Duplicate seeds | 0 |
| Unfinished phases (outcome not WON/LOST/ERROR) | 0 |
| Game-level errors | 0 |
| Command `ok:false` | 0 |
| Index sha/offset/bytes or seed-formula mismatches | 0 |
| Whole-game contribution ≠ sum(spin income) | 0 |
| Per-spin `bySource` ≠ `spin.income` | 0 |
| Complete batches (lines=500 AND index n=500 AND 0 unfinished/errors) | 16/16 |

Recorded terminal wins (disclosed only, **not** economy acceptance): Greedy train 33 + holdout 23 = 56; Random 0; Synergy 0; Value 0.

Every v3 shard: jsonl lines 500, index `n` 500, `progress.done` 500, `errors` 0. `progress.done` was treated as insufficient by itself.

## Command replay

Replay is `fullNewRun(seed)` then `fullCommand` of each **recorded** action with the live revision. It is not a Greedy policy re-run.

There are **8** games with `index===0` (one per bot/split in the `*-0` shards). The 16 v3 files’ first records are those 8 plus 8 `index===500` file-first games. This audit replayed:

- all 8 `index===0` games
- first record of each of the 16 files (covers the “16 first-of-file” reading of the index-0 request)
- 8 extra `index===1` games, one per bot/split

**24/24** command replays: `ok`, final JSON SHA matches recorded `finalHash`, contribution sum matches spin income.

| Reason | Seed | Outcome | Actions | Final SHA |
|---|---|---|---:|---|
| index-0 + file-first | `F4-FULL-v1/Greedy/holdout/0000` | LOST | 124 | `dfc1517aaffacca36c68ed23062a865c9bcf1c5eb8eee9f8ce82d117c2f7f18f` |
| extra index-1 | `F4-FULL-v1/Greedy/holdout/0001` | LOST | 135 | `d07b9bfd32dfe15e5efe81be0c0e7c21dca7bc2f401cc4c42f23633a5970549d` |
| file-first | `F4-FULL-v1/Greedy/holdout/0500` | LOST | 124 | `99d43cf6eb014cb20683fae0b01c136dbdab8e461524acaaeab42c2ab1b5ec56` |
| index-0 + file-first | `F4-FULL-v1/Greedy/train/0000` | WON | 151 | `4ad5476a4f296e4e34e4f6a3662f4875fa36724208ea927853e8838d5ad1acc3` |
| extra index-1 | `F4-FULL-v1/Greedy/train/0001` | LOST | 118 | `64ade7c4e723482cacc0ded0b3b214e967008eb1b23c2e63517b4c3e1feea6bb` |
| file-first | `F4-FULL-v1/Greedy/train/0500` | LOST | 125 | `74c95b6ac0c47dae775fad2f56fba96f1741e41469027c058394ae553a5ee519` |
| index-0 + file-first | `F4-FULL-v1/Random/holdout/0000` | LOST | 117 | `d76ae7fb04e71d62d2bb21ecf746c9b36be31b97187ed9e847d7574c39ebd545` |
| extra index-1 | `F4-FULL-v1/Random/holdout/0001` | LOST | 100 | `7fe1d9911f57bd279db1393617cd9c5127749083c232d2538b52547d93bcffd4` |
| file-first | `F4-FULL-v1/Random/holdout/0500` | LOST | 114 | `e2ec3a0e771cbdb7358caf257996f28b00580354363fd146b928996abc93a3da` |
| index-0 + file-first | `F4-FULL-v1/Random/train/0000` | LOST | 114 | `7842310233ff52db850bb5e7599bcbb87f5e3fce4b913dd75b2fa4441b9c7c9e` |
| extra index-1 | `F4-FULL-v1/Random/train/0001` | LOST | 82 | `b602b43a9ea7a315968080b305b35a58affed160f4f26c10d7ee3d0616ec75df` |
| file-first | `F4-FULL-v1/Random/train/0500` | LOST | 118 | `9cfa88226955f53da5e739eafd40ec9b34269a4b2afde659dd61c99671c947fd` |
| index-0 + file-first | `F4-FULL-v1/Synergy/holdout/0000` | LOST | 130 | `299241744f725d574aa8c054fbe9baacc877804799dc58e7f49bf4b3c6617627` |
| extra index-1 | `F4-FULL-v1/Synergy/holdout/0001` | LOST | 112 | `878526a9068c570bcad19c9593e17c80dacbcd19a27a1deeb52d09fb78432ad6` |
| file-first | `F4-FULL-v1/Synergy/holdout/0500` | LOST | 113 | `34a19d6b54bc3f9009d7f41fef9de265b299d2f48ae7ab5999d0a38b4bd247d9` |
| index-0 + file-first | `F4-FULL-v1/Synergy/train/0000` | LOST | 111 | `d067c9a837874a771b4fdd8c172cfa89267906e95785191b4424f7684033d3b4` |
| extra index-1 | `F4-FULL-v1/Synergy/train/0001` | LOST | 111 | `52c20cf52cb65b74062df18c97732806c355e1d2573339da7b58337c99a82125` |
| file-first | `F4-FULL-v1/Synergy/train/0500` | LOST | 113 | `3655b0a4678a140e104d8569a1a14faf05d8b90468fca05822f79894d69845ea` |
| index-0 + file-first | `F4-FULL-v1/Value/holdout/0000` | LOST | 119 | `e7724020ebd8b0bc5e7ba9a267720e96921aa6cf3cad704f6dd8f757fa16406b` |
| extra index-1 | `F4-FULL-v1/Value/holdout/0001` | LOST | 116 | `2790088b29c28aacfac6d036abb1dcf96ad35e3a75c529d7987d1a8878c9b340` |
| file-first | `F4-FULL-v1/Value/holdout/0500` | LOST | 136 | `ae18fbc80d1fb9df26f302b0b35eb508f69151d54f45147a993cce5740bd8d13` |
| index-0 + file-first | `F4-FULL-v1/Value/train/0000` | LOST | 141 | `3928304543013f3df766a90fd4a05b21c2d192564cc51a5b2ff740473dfb047c` |
| extra index-1 | `F4-FULL-v1/Value/train/0001` | LOST | 131 | `c41356407ab5b4a397e86323cb9d62efe315abc8a49dc460cb5e77e35a68eeb2` |
| file-first | `F4-FULL-v1/Value/train/0500` | LOST | 133 | `074008733111d93513a022df105a6015ae5863c58c4b51f41db48a5536173799` |

## Income attribution (one game per bot, plus all 8000)

Live spin probe: ledger contributions + reward log amounts equal `last.total`.

All 8000 recorded games: `sum(contributions) === sum(spins.income)` and each spin `sum(bySource) === income`.

Index-0 spot (one per bot):

| Bot | Seed | Contribution sum | Spin income | Match | Spins |
|---|---|---:|---:|---|---:|
| Greedy | `F4-FULL-v1/Greedy/holdout/0000` | 3522 | 3522 | yes | 54 |
| Random | `F4-FULL-v1/Random/holdout/0000` | 2620 | 2620 | yes | 47 |
| Synergy | `F4-FULL-v1/Synergy/holdout/0000` | 3299 | 3299 | yes | 54 |
| Value | `F4-FULL-v1/Value/holdout/0000` | 2548 | 2548 | yes | 47 |

## Policy RNG / publicView / Greedy lookahead

- `play()` decides on `publicView(state)`, which deletes `rng` and `seed`. Serialized public view has neither key.
- Policy stream is `policy-full-v1/` + `decision-full-v1/<Bot>/<split>/<index>`, independent of the five game streams (`draw`, `effect`, `symbolOffer`, `itemOffer`, `event`). Policy `next()` does not mutate live `state.rng`. Streams are `{state,consumed}` advanced by `F.nextUint32`; they do not expose `.next`.
- Train vs holdout **exact seed strings are disjoint** (4000/4000, 0 shared). Same numeric index across splits is allowed because the path differs (`.../train/0000` vs `.../holdout/0000`). Policy seeds are also 8000-unique.
- Greedy surrogate always reseeds `full-sim-model-v1/0` via `F.createRng`. Decision is invariant to hidden live seed/RNG. Live state is not mutated. Rollout future offer contents do not change utility. Horizon observed: ≤2 spins / ≤14 commands (probe: 2 spins, 4 commands). `remove`/`reroll` pruned unless static preferred; READY without preferred remove returns `{op:'spin'}` with `modelCommands:0`.

## Legal actions / unused commands

`legal()` includes `spin` / `choose` / `skip` / `remove` / `reroll` / `item` / `skipItem` / event A / event B. READY also offers `remove` when tokens remain (this is why engineering tool-audit v1 7/8 failed: that oracle expected spin-only at READY).

Unused **recorded** commands are disclosure, not a missing API:

| Group | Unused recorded ops |
|---|---|
| Random/train, Random/holdout | none (all nine used) |
| Value/train, Value/holdout | `skipItem` |
| Synergy/train, Synergy/holdout | `skipItem` |
| Greedy/train, Greedy/holdout | `reroll`, `skipItem` |

Value/Synergy/Greedy always took an item in `ITEM_CHOICE` in this 8000. Greedy never recorded a reroll. Random used both.

## Wilson usage in `full-sim-stats.js`

Wilson 95% (`rate()`, z=1.959963984540054, with `lo`/`hi`) is applied only to independent game/seed trials: win rate, formation/mixed rates, stage reached/survival/conditional payment/formed-among-reached, `acquiredWinRate` (unique games that acquired an id), and stratum `gameWinWilson` (one unique seed per stratum).

Offer / event / acquisition-event quantities use `ratio()`: counts + rate, **no** `lo`/`hi`, `independentBernoulli: false`:

- `eventAcceptance` (event A vs A+B commands; repeated events in one game are dependent)
- `selectionRate` (selected / exposures including rerolls)
- `eventRatio` (acquisition-event in stratum)

They are not labeled independent Wilson.

## Engineering tool-audit oracles (retained; independently re-run)

This audit did not rubber-stamp engineering dests. Historical files were not overwritten.

| Dest | Result | SHA-256 | Independent reading |
|---|---|---|---|
| `full-sim-tool-audit-v1.json` | 7/8 retained failure | `cb15b22eb4a699be442e6481e4d7c53d4675c4534214dd200cd397cd14597e46` | Oracle expected READY=`['spin']`; live legal also includes `remove`. Not a missing API. |
| `full-sim-tool-audit-v2.json` | 8/8 | `26702163d0bf42eb139cf4a9afc6dd30874fe941b8104c8e015978e9f5c4d5d3` | exists |
| `full-sim-tool-audit-v3.json` | 10/11 retained failure | `dab8ebb368c5297ac1097389cd8114f4fc7b3e4dc8338f00b00457a985cd1fb6` | Oracle called `s.rng.draw.next`. Streams have no `.next`. Not a live RNG leak. |
| `full-sim-tool-audit-v4.json` | 10/11 retained failure | `1912521f6d27283f0cf251d380bafb0ea19dd5add4b4a069474aef9398324f75` | Oracle required `effect.consumed>0` after one spin. First spin may not consume effect. |
| `full-sim-tool-audit-v5.json` | 11/11 | `75bb382128913187b8b44a3572173922a83217a5c7f850cb72ace73584174dfe` | exists; this audit re-implemented the checks instead of copying v5 |

Independent re-run of legal surface, publicView, Greedy surrogate, horizon, 8000-seed catalog, policy isolation, income attribution, Normal 12-start 70 / 64/32/8: all passed.

## Historical incomplete launches (retained, not overwritten)

No historical v1/v2 jsonl has an `-index.json`. None were treated as the 8000.

### v1 `full-sim-batch-{bot}-*.jsonl` (no `v3`)

| File | Bytes | Lines |
|---|---:|---:|
| `full-sim-batch-greedy-holdout-0.jsonl` | 0 | 0 |
| `full-sim-batch-greedy-holdout-500.jsonl` | 0 | 0 |
| `full-sim-batch-greedy-train-0.jsonl` | 0 | 0 |
| `full-sim-batch-greedy-train-500.jsonl` | 0 | 0 |
| `full-sim-batch-random-holdout-0.jsonl` | 1514155 | 18 |
| `full-sim-batch-random-holdout-500.jsonl` | 1524123 | 18 |
| `full-sim-batch-random-train-0.jsonl` | 1514094 | 18 |
| `full-sim-batch-random-train-500.jsonl` | 1580730 | 18 |
| `full-sim-batch-synergy-holdout-0.jsonl` | 959311 | 11 |
| `full-sim-batch-synergy-holdout-500.jsonl` | 861585 | 10 |
| `full-sim-batch-synergy-train-0.jsonl` | 999813 | 12 |
| `full-sim-batch-synergy-train-500.jsonl` | 949392 | 11 |
| `full-sim-batch-value-holdout-0.jsonl` | 1100790 | 12 |
| `full-sim-batch-value-holdout-500.jsonl` | 1128818 | 12 |
| `full-sim-batch-value-train-0.jsonl` | 1184346 | 13 |
| `full-sim-batch-value-train-500.jsonl` | 1209302 | 13 |

### v2 `full-sim-batch-v2-*.jsonl`

| File | Bytes | Lines |
|---|---:|---:|
| `full-sim-batch-v2-greedy-holdout-0.jsonl` | 0 | 0 |
| `full-sim-batch-v2-greedy-holdout-500.jsonl` | 0 | 0 |
| `full-sim-batch-v2-greedy-train-0.jsonl` | 0 | 0 |
| `full-sim-batch-v2-greedy-train-500.jsonl` | 0 | 0 |
| `full-sim-batch-v2-random-holdout-0.jsonl` | 1248029 | 15 |
| `full-sim-batch-v2-random-holdout-500.jsonl` | 1307598 | 15 |
| `full-sim-batch-v2-random-train-0.jsonl` | 1349342 | 16 |
| `full-sim-batch-v2-random-train-500.jsonl` | 1324801 | 15 |
| `full-sim-batch-v2-synergy-holdout-0.jsonl` | 880123 | 10 |
| `full-sim-batch-v2-synergy-holdout-500.jsonl` | 861660 | 10 |
| `full-sim-batch-v2-synergy-train-0.jsonl` | 924024 | 11 |
| `full-sim-batch-v2-synergy-train-500.jsonl` | 851949 | 10 |
| `full-sim-batch-v2-value-holdout-0.jsonl` | 1008153 | 11 |
| `full-sim-batch-v2-value-holdout-500.jsonl` | 946329 | 10 |
| `full-sim-batch-v2-value-train-0.jsonl` | 991409 | 11 |
| `full-sim-batch-v2-value-train-500.jsonl` | 1016657 | 11 |

## Official v3 dests (acceptance set)

`tests/gdd1/full-sim-batch-v3-<bot>-<split>-{0,500}.jsonl` with matching `-index.json`. All 16 present, 500/500, hashed per line against the index.

## Coverage limits (not claimed)

- Formal Normal economy is **NOT APPROVED**. Recorded Greedy 56 wins / 0 for the other three bots is not a balance sign-off and is not a GDD §13.3 band claim.
- Human play is pending. Bots cannot substitute GDD §13.4.
- Art/audio deferred.
- Chrome is absent. This round did not use UI. Edge remains the browser gate if UI is later required.
- Historical v1 7/8 and v3/v4 10/11 engineering oracles remain historical failures.
- `.pi/loops.json` / `.pi/loops/` were not restored (runtime exception, disclosed).
- Production `js/gdd1/**`, `js/gdd1UI/**`, `gdd1.html` were not modified by this auditor.

## Machine dest

`tests/gdd1/f4-grok-audit-sim-v1.json` — 56366 bytes — SHA-256 `9b3c5cc1a615ce13d35608abb7bb129a3526b63e6a42ef80f59f8ed868ac9bbf`.
