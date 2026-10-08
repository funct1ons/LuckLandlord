# GDD1 policy-v3 A2 probe — independent audit

Independent auditor signature for policy-v3 tools and the official prefix `full-sim-policy-v3-batch-`. Same auditor who signed policy-v2 **TOOLS_PASS**. This document does not overwrite production `js/gdd1/**`, `docs/GAME_DESIGN_V1.md`, freeze-v4, agg-freeze, freeze-policy-v2, v1/v2 jsonl, or policy-v3 engine/run/compare. Machine-readable companion: `tests/gdd1/f4-grok-audit-policy-v3.json`.

This audit streamed the 6 official jsonl files, joined the same 200 holdout seeds against v1 and v2, recomputed Wilson, hashed authorities, inspected `rootCandidates` in source, probed skipItem at ITEM_CHOICE, probed peek, and replayed 9 games through production `fullNewRun` + `fullCommand`.

**Tools judgment: TOOLS_PASS**

**Economy judgment: NOT APPROVED** regardless of recorded v3 win rates or Wilson intervals.

**formalBalance: NOT APPROVED.** No retune. Phase B not started.

## Frozen authorities (independently re-hashed)

| Authority | Bytes | SHA-256 | Hold |
|---|---:|---|---|
| `docs/GAME_DESIGN_V1.md` | 103576 | `e33e1699aed464cd656abc2344d9e68be92a7238da482f9861e5e67dedc8df07` | yes |
| `js/gdd1/resolver.js` | 27996 | `e86d51fb4c20d235312b263146f18d2c4cd69c13453846fe0daf9b07a0aaf88b` | yes |
| `js/gdd1/full-effects.js` | 37993 | `f65bc06b4c38fb35db14cc21f6ed4c63a42efbb06956f71078974990c5d8de55` | yes |
| freeze-v4 | 94204 | `cadba0fa63b151cb1b3a7933697cbeb295e9154ec4adb5bae595ffa7e8c09953` | yes; 436/436; `--verify` pass |
| agg-freeze | 2525 | `af08f789b4b453e45a588f247a70a623f6c15ca62928f3995c2b65d23c5581a2` | yes; 8/8; `--verify` pass |
| freeze-policy-v2 | 35511 | `6b2df68cb12937c5daeb99dd081e3330bd22cc7b209e6ebc83c62717652d2460` | yes; 143/143; `--verify` pass |

v1 jsonl present: **16/16**. v2 jsonl present: **16/16**.

## Policy-v3 tools / dests (read-only hashes)

| File | Bytes | SHA-256 |
|---|---:|---|
| `tests/gdd1/full-sim-engine-policy-v3.js` | 7066 | `96743eba9e0c634826d2aa3a0676a4140adb0abbef009d5456906ce53f576e9e` |
| `tests/gdd1/full-sim-run-policy-v3.js` | 9331 | `3d2775275e9491f85ee699ba173bf8a95532401a399f04b9f199f1e94b47a413` |
| `tests/gdd1/full-sim-policy-v3-compare.js` | 10694 | `92a3b57db52a6b4010b99c7a57304828f44c6062ece2a3d1212e81b814342f6d` |
| `tests/gdd1/full-sim-policy-v3-probe-summary.json` | 6258 | `39d533875e8acb2ef253cb71495dca768dcb37f68f918700282e0ad0eb743626` |
| `docs/GDD1_FULL_SIM_POLICY_V3_PROBE.md` | 5363 | `cca35206da7a989d13b75dbf9bf5b66853b30d0d148c0d6b800f4b950f474885` |
| `tests/gdd1/full-sim-engine.js` | 10020 | `90531adfbc08ea0f00b037e8366e1379417f2964f97ae0eca16b8fce773f5227` |

## Check 1 — official 6 jsonl vs index vs catalog

Prefix `full-sim-policy-v3-batch-` only. Probe dests `full-sim-policy-v3-probe-*` retained and excluded from the 600.

| Metric | Count |
|---|---:|
| Official jsonl files | 6 |
| Games | 600 |
| Unique seeds | 600 |
| Duplicate seeds / (bot,split,index) | 0 / 0 |
| Missing vs catalog `F4-FULL-v1/<Bot>/holdout/<0000-0199>` | 0 |
| Unfinished | 0 |
| Game errors / command `ok:false` | 0 / 0 |
| policySeed fails | 0 |
| Index sha/finalHash matches | 600 |
| Attribution (contrib ≠ spin income) | 0 |

Each shard: 100 lines, index n=100, `index.length`=100. policySeed is `decision-full-v3/<Bot>/holdout/<index>`.

Official jsonl SHA-256 (streamed):

| File | Bytes | SHA-256 |
|---|---:|---|
| greedy-holdout-0 | 12560867 | `bd7e052b17f049b5d07f7f2a8bf293177808a72d0fa3e61606cdeff916b8cb2c` |
| greedy-holdout-100 | 12428480 | `e6d84f725d499c1be31de53b271f4f427fb5b060a14f0360fd82c1b5995242cb` |
| synergy-holdout-0 | 12471193 | `51694f1fb4bf234d5ace12f4e087c1debde7fe20ea504818d6e267325b0b19ba` |
| synergy-holdout-100 | 12730416 | `a8ba38d709a16cc45fb53dac9f86ffd0411cd0a9ab7bd4c77d50ce51d50633ae` |
| value-holdout-0 | 12607691 | `12a91152bb2d27e3fe15ca2944f48cdbf89ec8e51b11f5df3907e2cb1e5e48c5` |
| value-holdout-100 | 12649481 | `d55d42c083ae56c33299d5f3271e2e529a498deaf19e100dae9a8137c3575917` |

## Check 2 — independent Wilson (z=1.959963984540054)

Auditor formula (same as the v2 8000-game audit): (c=(p+z^2/(2n))/d), (r=z\sqrt{p(1-p)/n+z^2/(4n^2)}/d).

Joined the **same 200 seeds** in v1 `full-sim-batch-v3-*-holdout-*.jsonl` and v2 `full-sim-policy-v2-batch-*-holdout-*.jsonl` by seed string. Missing v1/v2: 0.

### 200-seed holdout table (auditor)

| Bot | n | v1 k | v1 Wilson | v2 k | v2 Wilson | v3 k | v3 Wilson | Δv2 | Δv1 |
|---|---:|---:|---|---:|---|---:|---|---:|---:|
| Value | 200 | 0 | 0.00% [0.00%, 1.88%] | 54 | 27.00% [21.32%, 33.54%] | 67 | 33.50% [27.32%, 40.30%] | +6.50pp | +33.50pp |
| Synergy | 200 | 0 | 0.00% [0.00%, 1.88%] | 50 | 25.00% [19.51%, 31.43%] | 67 | 33.50% [27.32%, 40.30%] | +8.50pp | +33.50pp |
| Greedy | 200 | 3 | 1.50% [0.51%, 4.32%] | 44 | 22.00% [16.82%, 28.24%] | 51 | 25.50% [19.96%, 31.96%] | +3.50pp | +24.00pp |
| Random (control) | 200 | 0 | 0.00% [0.00%, 1.88%] | 0 | 0.00% [0.00%, 1.88%] | n/a | n/a | | |

Exact floats (auditor):

- Value v3: k=67 n=200 rate=0.335 lo=0.2732408697841632 hi=0.40297808792033485
- Synergy v3: k=67 n=200 rate=0.335 lo=0.2732408697841632 hi=0.40297808792033485
- Greedy v3: k=51 n=200 rate=0.255 lo=0.1996049517203135 hi=0.3196292582045472

**k/n/rate match** `full-sim-policy-v3-probe-summary.json` exactly on every bot and on Random. **lo/hi are not bitwise identical** on 8 cells (1 ULP). Reproducing engineering's `(center-margin)/d` recovers their published lo bitwise. This audit treats that as formula association, not a win-count defect. Material mismatch count: **0**.

Fail-stage v3 (auditor): Value `10:54, 8:13, 9:66, WON:67`; Synergy `10:41, 8:15, 9:77, WON:67`; Greedy `10:52, 8:17, 9:80, WON:51`. Matches the summary strings.

## Check 3 — lookahead constants and rootCandidates

Read from `tests/gdd1/full-sim-engine-policy-v3.js` exports:

- `HORIZON_SPINS === 8`
- `COMMAND_CAP === 64`
- `REMOVE_BEAM === 8`
- `MODEL_SEED === 'full-sim-model-v3/0'`
- `LOOKAHEAD` string equals the export built from those constants

Source:

```
function rootCandidates(v) {
  const a = legal(v);
  const core = a.filter(x => x.op !== 'remove');
  return [...core, ...worstRemoves(v, REMOVE_BEAM)];
}
```

`core` excludes only `remove`. skipItem, reroll, skip, event, item, choose remain when legal. Independent probe: SYMBOL_CHOICE legalRemoves 12, candidateRemoves 8 (= min(8, |removes|)). ITEM_CHOICE: legal ops `item`, `skipItem`; `skipItemInRoot === true`.

Live unused skipItem: **Value only**. Synergy skipItem=1, Greedy skipItem=1. Unused live skipItem is beam selection, not prune.

## Check 4 — peek ban

`publicView` deletes rng+seed. `surrogateV3` reseeds `F.createRng(MODEL_SEED)`. Source does not copy live rng. Independent probe: decide ignores swapped live seed; live rng unchanged after rollout; surrogate seed is `full-sim-model-v3/0`. `decideV3('Random')` throws `policy-v3 does not re-run Random; use v1/v2 control`. **PASS.**

## Check 5 — production replays

`F.fullNewRun(seed)` then recorded `F.fullCommand`. **9/9 hashMatch** (each bot index 0, 100, and extra 50).

| Reason | Seed | Outcome | Actions | finalHash |
|---|---|---|---:|---|
| index-0 | `F4-FULL-v1/Value/holdout/0000` | LOST | 152 | `5a15d90aaea534fbd459aa93bbb64ad1eaf669505b7d325b8c23c541d3844ad9` |
| index-100 | `F4-FULL-v1/Value/holdout/0100` | WON | 181 | `490f2fc6997271d3f3d2ae130e1891a1471ed7ef6991f38032d607e3487b1efd` |
| extra-50 | `F4-FULL-v1/Value/holdout/0050` | LOST | 171 | `2b2cf64d93833639958379ae2791f1c0e9392d6687fc617f028f5db6bbb3bee5` |
| index-0 | `F4-FULL-v1/Synergy/holdout/0000` | WON | 171 | `525e8f9ada8b7cd58b4ab730cfce66b21c96e10917174dca3e54d898ad084ce8` |
| index-100 | `F4-FULL-v1/Synergy/holdout/0100` | LOST | 155 | `383901a50958bcf38ead4a25086320441a39788fa5734fdbc4f907a63d36aea4` |
| extra-50 | `F4-FULL-v1/Synergy/holdout/0050` | LOST | 173 | `d77bcad2f4acb4ece1a9c7bb66fb68c048ecd5e6efcd5b1f845c21d71edf3828` |
| index-0 | `F4-FULL-v1/Greedy/holdout/0000` | LOST | 133 | `a05eeceb84e59bd5454b58cb439093844ea217b08f1fc25d0c9f372b3a179afa` |
| index-100 | `F4-FULL-v1/Greedy/holdout/0100` | LOST | 134 | `454c4529bd3cc243e2a595775ec89e02667dbf3472f3d6d835a9012c30c435d8` |
| extra-50 | `F4-FULL-v1/Greedy/holdout/0050` | LOST | 153 | `a50199706c01929dfe45b2424de4f924cf9847377b6d21480eb6cfdb7a00f1b0` |

## Check 6 — policySeed

All 600 games: `decision-full-v3/<Bot>/holdout/<index>`. Fails: 0.

## Check 7 — GDD §13.3 on this Wilson

Independent holdout points: Value 33.50%, Synergy 33.50%, Greedy 25.50%. **None ≥ 40%.** Band **not entered**.

Value/Synergy Wilson hi = 40.30% overlaps 40%; lo = 27.32% and the point stay below. Greedy hi = 31.96% is below 40%.

v1→v2 on this slice was +20.5 to +27.0 pp. v2→v3 is +3.5 to +8.5 pp. Extra search under disclosed v3 (H=8, beam 8, dual continuation) did not convert into band entry.

**Economy-side residual hypothesis is STRENGTHENED** on these numbers: the strongest point is still 6.5 pp below 40%, and Wilson lo is 12.7 pp below 40%. This is a 200-seed subset, not a proof that no stronger policy exists. It is enough to reject “v3 enters 40–70% by searching a bit more.”

formalBalance / economy remain **NOT APPROVED**.

## Check 8 — prior evidence retained

freeze-v4 436/436, agg-freeze 8/8, freeze-policy-v2 143/143, v1 16 jsonl, v2 16 jsonl. None of those files were written by this audit.

## Independent rejection

This audit can reject:

1. Economy / formalBalance approval — strongest v3 point 33.50% is below the 40% floor.
2. “v3 entered the band because Wilson hi is 40.30%” — the gate is the point/rate target; hi overlap is not band entry.
3. “skipItem unused ⇒ pruned” — ITEM_CHOICE probe put skipItem in `rootCandidates`; live skipItem is 1 on Synergy and Greedy.
4. Peek of live RNG — surrogate reseeds `full-sim-model-v3/0`; Random throws.

After those rejections, the remaining tool claims hold: 600/600, 9/9 replays, k/n exact vs summary.

## Verdict

**TOOLS_PASS**

**Economy: NOT APPROVED**

**formalBalance: NOT APPROVED**

**in-band 40–70%: no**

No phase B. No retune.
