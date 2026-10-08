# GDD1 full-v1 Normal bot simulation — policy-v2 (engineering report)

Scope: frozen GDD1 + production + seed catalog + prices **unchanged**. New versioned strategy `policy-v2` re-run of formal Normal (64/32/8, 12 start, payments `[70,125,210,320,460,630,850,1120,1460,1880]`). This is **not** the 24/10/3 slice and **not** a substitute for slice 65% win rates. Phase A only: distinguish weak v1 bots from economy hardness. **No GDD/price/production retune.** Phase B needs explicit main-pane authorization.

Independent F4 functional PASS is `docs/GDD1_F4_GROK_AUDIT.md`. freeze-v4 436/436 SHA `cadba0fa63b151cb1b3a7933697cbeb295e9154ec4adb5bae595ffa7e8c09953` and agg-freeze 8/8 SHA `af08f789b4b453e45a588f247a70a623f6c15ca62928f3995c2b65d23c5581a2` are **retained, not overwritten**. Formal Normal economy is **NOT APPROVED**. Human play is pending. Art/Chrome deferred.

This file does not overwrite `docs/GDD1_FULL_SIM.md`, `docs/GDD1_FULL_SIM_AUDIT.md`, `docs/GDD1_FULL_SIM_AUDIT_AGG.md`, freeze-v4, agg-freeze, or v1 jsonl.

## Sampling

All 8000 games completed. Index byte-offset SHA-256 verified (8000 rows). Aggregator replayed 8 index-0 games to identical final hashes. Command errors in aggregator: 0. No overlapping seeds. Prefix `full-sim-policy-v2-batch-`. v1 `full-sim-batch-v3-*`, probes, and job-kill jsonl retained and excluded.

Seeds: same catalog `F4-FULL-v1/<Bot>/<train|holdout>/<0000-0999>`. Random policy `decision-full-v1/...` (control; must match v1 Random train/0000 finalHash `78423102…`). Value/Synergy/Greedy policy `decision-full-v2/...`. Train/holdout prefixes disjoint. No seed screening. No live RNG / future seed / live offer peek.

| Bot / Split | Wins / 1000 | Wilson 95% | Formation | Event A ratio | Final pool P10/P50/P90/P99 | Win pool P10/P50/P90/P99 | Game ms P10/P50/P90/P99 |
|---|---:|---|---|---|---|---|---|
| Greedy/holdout | 233 | 23.30% [20.79%, 26.02%] | 100.00% [99.62%, 100.00%] | 55.57% (count ratio; not independent Wilson) | 23/30/41/52 | 21/25/33/38 | 14330.47/17203.26/21140.1/25589.77 |
| Greedy/train | 238 | 23.80% [21.26%, 26.54%] | 100.00% [99.62%, 100.00%] | 53.02% (count ratio; not independent Wilson) | 23/30/41/52 | 21/26/32/37 | 14154.79/17130.87/21807.16/28064.34 |
| Random/holdout | 0 | 0.00% [0.00%, 0.38%] | 99.60% [98.98%, 99.84%] | 67.09% (count ratio; not independent Wilson) | 25/33/41/48 | NA/NA/NA/NA | 215.66/290.45/362.49/439.63 |
| Random/train | 0 | 0.00% [0.00%, 0.38%] | 99.60% [98.98%, 99.84%] | 63.92% (count ratio; not independent Wilson) | 25/33/41/47 | NA/NA/NA/NA | 210.31/289.2/363.42/422.24 |
| Synergy/holdout | 239 | 23.90% [21.36%, 26.64%] | 100.00% [99.62%, 100.00%] | 54.00% (count ratio; not independent Wilson) | 22/30/41/50 | 21/25/31/35 | 14224.69/17339.47/21609.63/27092.94 |
| Synergy/train | 225 | 22.50% [20.02%, 25.19%] | 100.00% [99.62%, 100.00%] | 54.23% (count ratio; not independent Wilson) | 23/30/41/52 | 21/25/32/40 | 14168.44/17221.64/21398.82/26504.96 |
| Value/holdout | 299 | 29.90% [27.14%, 32.81%] | 100.00% [99.62%, 100.00%] | 56.11% (count ratio; not independent Wilson) | 22/29/40/50 | 21/25/31/37 | 14174.3/17116.61/21088.6/25155.7 |
| Value/train | 291 | 29.10% [26.37%, 31.99%] | 100.00% [99.62%, 100.00%] | 58.46% (count ratio; not independent Wilson) | 22/29/41/52 | 21/24/30/36 | 14135.42/17363.84/20869.29/25795.41 |

Formation A–H is a diagnostic after spins, not proof of a complete build. Acquisition strata use public pre-choice formation and pool bands `<20` / `20-26` / `>26`. Acquired-game win rates are conditional and confounded; not causal item effectiveness.

Quantiles: nearest rank. Stage income/pool condition on reaching the stage. Period income/margins condition on completing that payment. Survival denominator 1000. Wilson 95% only on independent game/seed trials. Offer/event/acquisition-event ratios have counts without `lo`/`hi`.

## Integrity

Engineering integrity dest `tests/gdd1/full-sim-policy-v2-integrity.json` **PASS** (SHA-256 `8d7ff470d7dc504e0a2163f0b93a8926d8194a6c15df85c34f0d62d9f562220f`, 24377 bytes). This is **not** the independent tool audit.

| Check | Result |
|---|---|
| Official prefix | `full-sim-policy-v2-batch-` |
| replayAll | true (8000 command replays, not index-0 only) |
| seen | 8000 |
| missing | 0 |
| duplicates | 0 |
| errors | 0 |
| unfinished | 0 |
| attributionFails | 0 |
| replayFails | 0 |
| completeBatches | 16/16 (each jsonl lines=500 AND index n=500 AND replayed=500) |
| isolation.sharedExactSeedStrings | 0 |
| policy stream | Random `decision-full-v1`; Value/Synergy/Greedy `decision-full-v2` |

Historical listing in that dest includes retained v1 `full-sim-batch-v3-*` plus older incomplete `full-sim-batch-*` (no v3) job-kills and policy-v2 probe/jobkill files. Those are excluded from the 8000. Empty/partial `full-sim-batch-*` without v3 are job-kill leftovers, not the official v1 8000.

## Lookahead (disclosed)

policy-v2: Random identical to full-sim-v1 (uniform legal, policy-full-v1 / decision-full-v1). Value/Synergy/Greedy: root beam over all legal action TYPES with no skipItem/reroll/remove prune; remove UIDs limited to the 3 statically worst pool members. After the root action, continuation is staticChoiceV2 for at most 5 spins / 36 fullCommand. Surrogate reseeds synthetic full-sim-model-v2/0 (createRng); live seed and five streams never copied. Model-generated offers are visible to static continuation; they are not live offers. Branch width = |root candidates| (typically 4-12). Utility: WON +1e5, LOST -1e5, model income, mean synergy-or-static value, pool, tokens, cash-payment margin. Not optimal, not exhaustive tree search, not a live-RNG oracle.

- Horizon: **5 spins** after the root action.
- Command cap: **36** `fullCommand` in the surrogate.
- Remove beam: **3** statically worst pool members (all other legal **types** including skipItem/reroll/remove are in the root candidate set).
- Model seed: `full-sim-model-v2/0` via `createRng`. Live seed and five streams are never copied.
- Branch width: `|root candidates|` (typically 4–12). Continuation after the root action is `staticChoiceV2`, not a full tree.
- Modeling assumptions: surrogate offers are model-generated and visible to continuation; they are **not** live offers. Utility is WON +1e5 / LOST −1e5 plus model income, mean synergy-or-static value, pool, tokens, cash-payment margin. **Not optimal, not exhaustive tree search, not a live-RNG oracle.**

## Unused live actions

Legal API includes spin/choose/skip/remove/reroll/item/skipItem/event A/B. Root beam enumerates those types; unused **live** commands mean the beam never selected them as best, not that they were pruned from candidates. Engineering checks proved skipItem/reroll/remove appear in root candidates.
- **Greedy/holdout** live commands 158574, model 7090327. Actions `{"spin":64525,"remove":9496,"choose":36055,"reroll":9683,"item":8314,"skip":28470,"eventB":902,"eventA":1128,"skipItem":1}`. Unused live: none.
- **Greedy/train** live commands 158247, model 7142764. Actions `{"spin":64433,"remove":9521,"choose":35893,"reroll":9536,"item":8304,"skip":28540,"eventB":949,"eventA":1071}`. Unused live: skipItem.
- **Random/holdout** live commands 110524, model 0. Actions `{"remove":6722,"spin":44677,"choose":33505,"reroll":7370,"item":4242,"skip":11172,"eventA":946,"eventB":464,"skipItem":1426}`. Unused live: none.
- **Random/train** live commands 109727, model 0. Actions `{"remove":6695,"spin":44383,"choose":33271,"skip":11112,"skipItem":1404,"eventA":884,"item":4222,"reroll":7257,"eventB":499}`. Unused live: none.
- **Synergy/holdout** live commands 158299, model 7141533. Actions `{"spin":64499,"choose":35509,"remove":9508,"reroll":9444,"item":8312,"skip":28990,"eventA":1100,"eventB":937}`. Unused live: skipItem.
- **Synergy/train** live commands 158605, model 7114897. Actions `{"spin":64627,"choose":35683,"reroll":9498,"remove":9539,"item":8327,"skip":28944,"eventA":1077,"eventB":909,"skipItem":1}`. Unused live: none.
- **Value/holdout** live commands 161780, model 7232888. Actions `{"spin":65417,"choose":35669,"reroll":10855,"item":8427,"remove":9643,"skip":29748,"eventA":1134,"eventB":887}`. Unused live: skipItem.
- **Value/train** live commands 161435, model 7277130. Actions `{"spin":65282,"choose":35526,"remove":9645,"reroll":10772,"item":8409,"skip":29756,"eventA":1195,"eventB":849,"skipItem":1}`. Unused live: none.

## v1 vs policy-v2 comparison (same 8000 seeds)

| Bot / Split | v1 wins | v1 Wilson | v2 wins | v2 Wilson | Δ wins | Δ rate | v1 unused | v2 unused | v1 fail stages | v2 fail stages |
|---|---:|---|---:|---|---:|---:|---|---|---|---|
| Greedy/holdout | 23 | 2.30% [1.54%, 3.43%] | 233 | 23.30% [20.79%, 26.02%] | 210 | 21.00pp | reroll,skipItem | none | 6:1, 7:52, 8:560, 9:309, 10:55 | 6:1, 7:3, 8:94, 9:484, 10:185 |
| Greedy/train | 33 | 3.30% [2.36%, 4.60%] | 238 | 23.80% [21.26%, 26.54%] | 205 | 20.50pp | reroll,skipItem | skipItem | 6:1, 7:49, 8:572, 9:280, 10:65 | 7:1, 8:112, 9:469, 10:180 |
| Random/holdout | 0 | 0.00% [0.00%, 0.38%] | 0 | 0.00% [0.00%, 0.38%] | 0 | 0.00pp | none | none | 3:1, 4:7, 5:37, 6:315, 7:559, 8:80, 9:1 | 3:1, 4:7, 5:37, 6:315, 7:559, 8:80, 9:1 |
| Random/train | 0 | 0.00% [0.00%, 0.38%] | 0 | 0.00% [0.00%, 0.38%] | 0 | 0.00pp | none | none | 4:13, 5:49, 6:307, 7:562, 8:68, 9:1 | 4:13, 5:49, 6:307, 7:562, 8:68, 9:1 |
| Synergy/holdout | 0 | 0.00% [0.00%, 0.38%] | 239 | 23.90% [21.36%, 26.64%] | 239 | 23.90pp | skipItem | skipItem | 5:1, 6:15, 7:478, 8:492, 9:14 | 7:3, 8:104, 9:471, 10:183 |
| Synergy/train | 0 | 0.00% [0.00%, 0.38%] | 225 | 22.50% [20.02%, 25.19%] | 225 | 22.50pp | skipItem | none | 5:1, 6:13, 7:429, 8:546, 9:11 | 6:1, 7:1, 8:102, 9:461, 10:210 |
| Value/holdout | 0 | 0.00% [0.00%, 0.38%] | 299 | 29.90% [27.14%, 32.81%] | 299 | 29.90pp | skipItem | skipItem | 6:2, 7:169, 8:751, 9:74, 10:4 | 7:1, 8:80, 9:410, 10:210 |
| Value/train | 0 | 0.00% [0.00%, 0.38%] | 291 | 29.10% [26.37%, 31.99%] | 291 | 29.10pp | skipItem | none | 6:1, 7:166, 8:767, 9:63, 10:3 | 7:2, 8:75, 9:434, 10:198 |

v1 Greedy pruned remove/reroll unless statically preferred and never used skipItem/reroll on the recorded path. policy-v2 enables those types at the root. Random is the unchanged control.

## Stage survival (policy-v2)

### Greedy/holdout

| Stage | Reached | Paid / 1000 | Spin income P10/P50/P90/P99 | Period income P10/P50/P90/P99 | Margin P10/P50/P90/P99 | Pool P10/P50/P90/P99 |
|---:|---:|---:|---|---|---|---|
| 1 | 1000 | 1000 | 20/33/45/54 | 179/197/211/233 | 109/127/141/163 | 14/15/16/17 |
| 2 | 1000 | 1000 | 46/60/77/94 | 320/363/407/468 | 312/366/417/492 | 17/19/20/23 |
| 3 | 1000 | 1000 | 61/75/92/117 | 459/527/600/785 | 575/681/791/1014 | 19/21/24/28 |
| 4 | 1000 | 1000 | 66/83/105/155 | 504/579/696/1015 | 780/938/1139/1685 | 19/22/27/32 |
| 5 | 1000 | 1000 | 68/87/116/183 | 522/608/786/1197 | 857/1088/1432/2236 | 20/23/30/35 |
| 6 | 1000 | 999 | 70/91/128/208 | 534/634/866/1369 | 786/1092/1656/3016 | 20/25/33/40 |
| 7 | 999 | 996 | 72/95/144/230 | 553/662/989/1572 | 529/910/1763/3592 | 20/26/35/44 |
| 8 | 996 | 902 | 74/99/168/252 | 563/689/1120/1647 | 7/482/1706/3931 | 21/28/38/48 |
| 9 | 902 | 418 | 78/106/201/276 | 688/841/1514/2049 | -618/-59/1760/4460 | 21/29/40/50 |
| 10 | 418 | 233 | 97/148/246/316 | 850/1225/1836/2370 | -854/206/2795/5355 | 20/26/34/42 |

Formation mixed 996/1000. Winning routes `{"A":0,"B":0,"C":0,"D":0,"E":0,"F":0,"G":0,"H":0,"unformed":0,"mixed":233}`. Errors 0.

Extreme seeds (full metric in statistics JSON):
- lowestTotal: `F4-FULL-v1/Greedy/holdout/0815` (total 1791, peak 73, margin -24); `F4-FULL-v1/Greedy/holdout/0037` (total 2633, peak 97, margin -32); `F4-FULL-v1/Greedy/holdout/0408` (total 2634, peak 80, margin -31)
- highestTotal: `F4-FULL-v1/Greedy/holdout/0668` (total 13946, peak 309, margin 6811); `F4-FULL-v1/Greedy/holdout/0472` (total 12773, peak 308, margin 5646); `F4-FULL-v1/Greedy/holdout/0463` (total 12589, peak 354, margin 5444)
- highestPeak: `F4-FULL-v1/Greedy/holdout/0858` (total 10116, peak 384, margin 2991); `F4-FULL-v1/Greedy/holdout/0537` (total 12115, peak 372, margin 4984); `F4-FULL-v1/Greedy/holdout/0261` (total 11500, peak 361, margin 4369)
- worstMargin: `F4-FULL-v1/Greedy/holdout/0659` (total 5994, peak 119, margin -1147); `F4-FULL-v1/Greedy/holdout/0679` (total 6003, peak 154, margin -1122); `F4-FULL-v1/Greedy/holdout/0629` (total 6027, peak 163, margin -1108)

### Greedy/train

| Stage | Reached | Paid / 1000 | Spin income P10/P50/P90/P99 | Period income P10/P50/P90/P99 | Margin P10/P50/P90/P99 | Pool P10/P50/P90/P99 |
|---:|---:|---:|---|---|---|---|
| 1 | 1000 | 1000 | 20/33/45/53 | 180/196/212/230 | 110/126/142/160 | 14/15/16/17 |
| 2 | 1000 | 1000 | 46/60/76/91 | 324/362/405/452 | 316/363/416/465 | 17/19/20/23 |
| 3 | 1000 | 1000 | 60/75/91/115 | 463/524/591/742 | 580/674/783/960 | 19/21/24/28 |
| 4 | 1000 | 1000 | 66/83/104/139 | 502/580/690/964 | 786/933/1128/1577 | 19/22/27/32 |
| 5 | 1000 | 1000 | 68/87/115/178 | 519/609/769/1110 | 872/1086/1418/2092 | 20/24/30/36 |
| 6 | 1000 | 1000 | 70/92/127/211 | 534/637/862/1311 | 799/1093/1642/2704 | 20/25/32/40 |
| 7 | 1000 | 999 | 71/95/141/242 | 542/658/986/1579 | 517/899/1752/3319 | 21/26/35/44 |
| 8 | 999 | 887 | 73/99/168/269 | 555/685/1149/1754 | -26/457/1778/3841 | 21/28/38/47 |
| 9 | 887 | 418 | 79/107/197/295 | 687/857/1501/2246 | -603/-51/1886/4681 | 21/28/39/49 |
| 10 | 418 | 238 | 99/151/247/331 | 852/1266/1839/2437 | -809/228/2471/5743 | 21/26/34/43 |

Formation mixed 998/1000. Winning routes `{"A":0,"B":0,"C":0,"D":0,"E":0,"F":0,"G":0,"H":0,"unformed":0,"mixed":238}`. Errors 0.

Extreme seeds (full metric in statistics JSON):
- lowestTotal: `F4-FULL-v1/Greedy/train/0627` (total 2461, peak 81, margin -214); `F4-FULL-v1/Greedy/train/0241` (total 3185, peak 91, margin -600); `F4-FULL-v1/Greedy/train/0352` (total 3223, peak 85, margin -562)
- highestTotal: `F4-FULL-v1/Greedy/train/0151` (total 15993, peak 389, margin 8868); `F4-FULL-v1/Greedy/train/0240` (total 13401, peak 349, margin 6276); `F4-FULL-v1/Greedy/train/0631` (total 13397, peak 283, margin 6266)
- highestPeak: `F4-FULL-v1/Greedy/train/0309` (total 7448, peak 418, margin 323); `F4-FULL-v1/Greedy/train/0491` (total 12868, peak 399, margin 5743); `F4-FULL-v1/Greedy/train/0367` (total 12109, peak 391, margin 4984)
- worstMargin: `F4-FULL-v1/Greedy/train/0534` (total 6010, peak 123, margin -1115); `F4-FULL-v1/Greedy/train/0654` (total 6016, peak 135, margin -1109); `F4-FULL-v1/Greedy/train/0080` (total 6048, peak 138, margin -1083)

### Random/holdout

| Stage | Reached | Paid / 1000 | Spin income P10/P50/P90/P99 | Period income P10/P50/P90/P99 | Margin P10/P50/P90/P99 | Pool P10/P50/P90/P99 |
|---:|---:|---:|---|---|---|---|
| 1 | 1000 | 1000 | 17/23/33/42 | 125/143/165/183 | 55/73/95/113 | 11/13/14/15 |
| 2 | 1000 | 1000 | 27/38/51/65 | 184/231/276/322 | 124/179/241/295 | 13/16/19/20 |
| 3 | 1000 | 999 | 32/46/62/75 | 242/328/403/462 | 170/296/424/521 | 16/19/23/26 |
| 4 | 999 | 992 | 39/54/69/85 | 299/381/453/540 | 169/355/545/688 | 18/23/27/31 |
| 5 | 992 | 955 | 43/57/73/89 | 333/402/471/548 | 70/300/532/730 | 21/26/32/37 |
| 6 | 955 | 640 | 45/59/75/92 | 358/416/479/549 | -156/91/352/596 | 24/30/36/42 |
| 7 | 640 | 81 | 49/64/81/100 | 396/449/513/570 | -378/-220/18/347 | 28/35/41/47 |
| 8 | 81 | 1 | 55/72/91/138 | 441/517/562/884 | -626/-537/-271/499 | 33/40/46/53 |
| 9 | 1 | 0 | 45/59/151/151 | 559/559/559/559 | -402/-402/-402/-402 | 44/44/44/44 |
| 10 | 0 | 0 | NA/NA/NA/NA | NA/NA/NA/NA | NA/NA/NA/NA | NA/NA/NA/NA |

Formation mixed 972/1000. Winning routes `{"A":0,"B":0,"C":0,"D":0,"E":0,"F":0,"G":0,"H":0,"unformed":0,"mixed":0}`. Errors 0.

Extreme seeds (full metric in statistics JSON):
- lowestTotal: `F4-FULL-v1/Random/holdout/0183` (total 395, peak 33, margin -10); `F4-FULL-v1/Random/holdout/0636` (total 684, peak 45, margin -41); `F4-FULL-v1/Random/holdout/0333` (total 689, peak 39, margin -36)
- highestTotal: `F4-FULL-v1/Random/holdout/0913` (total 4853, peak 174, margin -402); `F4-FULL-v1/Random/holdout/0428` (total 3756, peak 153, margin -31); `F4-FULL-v1/Random/holdout/0514` (total 3726, peak 122, margin -65)
- highestPeak: `F4-FULL-v1/Random/holdout/0119` (total 3395, peak 195, margin -396); `F4-FULL-v1/Random/holdout/0913` (total 4853, peak 174, margin -402); `F4-FULL-v1/Random/holdout/0428` (total 3756, peak 153, margin -31)
- worstMargin: `F4-FULL-v1/Random/holdout/0684` (total 3094, peak 97, margin -691); `F4-FULL-v1/Random/holdout/0916` (total 3096, peak 83, margin -689); `F4-FULL-v1/Random/holdout/0327` (total 3102, peak 87, margin -683)

### Random/train

| Stage | Reached | Paid / 1000 | Spin income P10/P50/P90/P99 | Period income P10/P50/P90/P99 | Margin P10/P50/P90/P99 | Pool P10/P50/P90/P99 |
|---:|---:|---:|---|---|---|---|
| 1 | 1000 | 1000 | 17/23/33/41 | 125/143/163/182 | 55/73/93/112 | 11/13/14/15 |
| 2 | 1000 | 1000 | 27/38/51/64 | 185/230/277/307 | 122/177/238/280 | 13/16/19/20 |
| 3 | 1000 | 1000 | 32/47/62/75 | 248/330/398/459 | 169/297/417/508 | 16/20/23/25 |
| 4 | 1000 | 987 | 38/53/69/83 | 294/379/448/517 | 163/362/520/665 | 18/23/27/30 |
| 5 | 987 | 938 | 42/56/72/87 | 329/397/467/539 | 57/296/503/708 | 21/26/31/35 |
| 6 | 938 | 631 | 45/59/75/93 | 357/416/482/556 | -148/84/333/612 | 24/30/36/41 |
| 7 | 631 | 69 | 49/63/81/100 | 391/447/508/585 | -392/-231/11/327 | 28/34/41/46 |
| 8 | 69 | 1 | 57/73/93/110 | 453/509/587/681 | -612/-502/-278/69 | 30/37/45/47 |
| 9 | 1 | 0 | 54/66/85/85 | 544/544/544/544 | -847/-847/-847/-847 | 52/52/52/52 |
| 10 | 0 | 0 | NA/NA/NA/NA | NA/NA/NA/NA | NA/NA/NA/NA | NA/NA/NA/NA |

Formation mixed 973/1000. Winning routes `{"A":0,"B":0,"C":0,"D":0,"E":0,"F":0,"G":0,"H":0,"unformed":0,"mixed":0}`. Errors 0.

Extreme seeds (full metric in statistics JSON):
- lowestTotal: `F4-FULL-v1/Random/train/0434` (total 580, peak 34, margin -147); `F4-FULL-v1/Random/train/0788` (total 596, peak 37, margin -129); `F4-FULL-v1/Random/train/0182` (total 612, peak 37, margin -123)
- highestTotal: `F4-FULL-v1/Random/train/0631` (total 4400, peak 139, margin -847); `F4-FULL-v1/Random/train/0227` (total 3765, peak 115, margin -30); `F4-FULL-v1/Random/train/0365` (total 3639, peak 117, margin -156)
- highestPeak: `F4-FULL-v1/Random/train/0631` (total 4400, peak 139, margin -847); `F4-FULL-v1/Random/train/0998` (total 3366, peak 132, margin -419); `F4-FULL-v1/Random/train/0455` (total 3204, peak 122, margin -581)
- worstMargin: `F4-FULL-v1/Random/train/0631` (total 4400, peak 139, margin -847); `F4-FULL-v1/Random/train/0238` (total 3121, peak 88, margin -664); `F4-FULL-v1/Random/train/0245` (total 3140, peak 84, margin -651)

### Synergy/holdout

| Stage | Reached | Paid / 1000 | Spin income P10/P50/P90/P99 | Period income P10/P50/P90/P99 | Margin P10/P50/P90/P99 | Pool P10/P50/P90/P99 |
|---:|---:|---:|---|---|---|---|
| 1 | 1000 | 1000 | 20/33/45/54 | 180/196/211/227 | 110/126/141/157 | 14/15/16/17 |
| 2 | 1000 | 1000 | 46/60/76/92 | 320/362/408/465 | 313/362/415/480 | 17/19/20/23 |
| 3 | 1000 | 1000 | 61/75/92/116 | 460/525/605/742 | 576/678/789/999 | 19/21/24/28 |
| 4 | 1000 | 1000 | 67/83/106/146 | 506/579/707/937 | 783/934/1159/1551 | 19/22/27/33 |
| 5 | 1000 | 1000 | 69/87/118/185 | 521/609/790/1254 | 861/1090/1453/2317 | 20/23/30/36 |
| 6 | 1000 | 1000 | 71/91/132/208 | 541/636/910/1348 | 790/1093/1757/2899 | 20/25/32/40 |
| 7 | 1000 | 997 | 73/95/151/246 | 556/655/1040/1586 | 523/897/1969/3415 | 21/26/35/44 |
| 8 | 997 | 893 | 74/99/176/269 | 560/690/1200/1746 | -8/468/2017/3996 | 21/27/37/47 |
| 9 | 893 | 422 | 77/107/204/287 | 682/850/1574/2117 | -612/-46/2063/4541 | 21/29/39/49 |
| 10 | 422 | 239 | 98/153/251/334 | 846/1264/1887/2412 | -857/221/3103/5710 | 20/26/34/44 |

Formation mixed 998/1000. Winning routes `{"A":0,"B":0,"C":0,"D":0,"E":0,"F":0,"G":0,"H":0,"unformed":0,"mixed":239}`. Errors 0.

Extreme seeds (full metric in statistics JSON):
- lowestTotal: `F4-FULL-v1/Synergy/holdout/0706` (total 2604, peak 92, margin -61); `F4-FULL-v1/Synergy/holdout/0206` (total 2629, peak 89, margin -36); `F4-FULL-v1/Synergy/holdout/0438` (total 2651, peak 101, margin -14)
- highestTotal: `F4-FULL-v1/Synergy/holdout/0036` (total 13838, peak 365, margin 6707); `F4-FULL-v1/Synergy/holdout/0761` (total 13343, peak 372, margin 6212); `F4-FULL-v1/Synergy/holdout/0199` (total 12911, peak 318, margin 5780)
- highestPeak: `F4-FULL-v1/Synergy/holdout/0799` (total 12125, peak 409, margin 5000); `F4-FULL-v1/Synergy/holdout/0962` (total 12837, peak 395, margin 5710); `F4-FULL-v1/Synergy/holdout/0703` (total 10055, peak 390, margin 2924)
- worstMargin: `F4-FULL-v1/Synergy/holdout/0625` (total 5850, peak 218, margin -1281); `F4-FULL-v1/Synergy/holdout/0043` (total 5972, peak 119, margin -1159); `F4-FULL-v1/Synergy/holdout/0007` (total 5979, peak 136, margin -1152)

### Synergy/train

| Stage | Reached | Paid / 1000 | Spin income P10/P50/P90/P99 | Period income P10/P50/P90/P99 | Margin P10/P50/P90/P99 | Pool P10/P50/P90/P99 |
|---:|---:|---:|---|---|---|---|
| 1 | 1000 | 1000 | 20/33/45/54 | 179/195/211/231 | 109/125/141/161 | 14/15/16/17 |
| 2 | 1000 | 1000 | 46/60/76/91 | 318/361/407/456 | 310/362/415/465 | 17/19/20/23 |
| 3 | 1000 | 1000 | 61/75/92/118 | 464/525/604/765 | 580/675/798/1020 | 19/21/24/28 |
| 4 | 1000 | 1000 | 66/83/104/148 | 504/579/684/1014 | 782/934/1142/1661 | 19/22/27/33 |
| 5 | 1000 | 1000 | 69/87/115/186 | 524/607/768/1223 | 868/1078/1442/2316 | 20/24/30/36 |
| 6 | 1000 | 999 | 71/91/129/216 | 536/638/870/1401 | 793/1087/1660/2926 | 20/25/32/40 |
| 7 | 999 | 998 | 73/96/145/243 | 553/663/988/1604 | 522/912/1783/3611 | 21/26/34/45 |
| 8 | 998 | 896 | 74/99/168/266 | 560/686/1152/1772 | -5/478/1791/4097 | 21/27/37/48 |
| 9 | 896 | 435 | 78/107/197/283 | 685/853/1496/2090 | -612/-30/1828/4517 | 22/28/39/51 |
| 10 | 435 | 225 | 97/151/250/318 | 863/1265/1867/2352 | -843/65/2700/5201 | 21/26/35/41 |

Formation mixed 996/1000. Winning routes `{"A":0,"B":0,"C":0,"D":0,"E":0,"F":0,"G":0,"H":0,"unformed":0,"mixed":225}`. Errors 0.

Extreme seeds (full metric in statistics JSON):
- lowestTotal: `F4-FULL-v1/Synergy/train/0224` (total 1805, peak 72, margin -16); `F4-FULL-v1/Synergy/train/0244` (total 2635, peak 92, margin -30); `F4-FULL-v1/Synergy/train/0033` (total 3264, peak 95, margin -521)
- highestTotal: `F4-FULL-v1/Synergy/train/0196` (total 13894, peak 336, margin 6763); `F4-FULL-v1/Synergy/train/0685` (total 13329, peak 343, margin 6192); `F4-FULL-v1/Synergy/train/0095` (total 13193, peak 326, margin 6060)
- highestPeak: `F4-FULL-v1/Synergy/train/0886` (total 8982, peak 401, margin 1857); `F4-FULL-v1/Synergy/train/0641` (total 10773, peak 385, margin 3648); `F4-FULL-v1/Synergy/train/0634` (total 11651, peak 371, margin 4520)
- worstMargin: `F4-FULL-v1/Synergy/train/0053` (total 5902, peak 141, margin -1223); `F4-FULL-v1/Synergy/train/0615` (total 5979, peak 136, margin -1148); `F4-FULL-v1/Synergy/train/0225` (total 6004, peak 126, margin -1127)

### Value/holdout

| Stage | Reached | Paid / 1000 | Spin income P10/P50/P90/P99 | Period income P10/P50/P90/P99 | Margin P10/P50/P90/P99 | Pool P10/P50/P90/P99 |
|---:|---:|---:|---|---|---|---|
| 1 | 1000 | 1000 | 20/32/44/55 | 178/193/209/223 | 108/123/139/153 | 13/16/16/18 |
| 2 | 1000 | 1000 | 45/59/76/91 | 316/362/404/444 | 306/359/410/449 | 17/19/21/23 |
| 3 | 1000 | 1000 | 60/75/93/117 | 461/527/606/755 | 574/679/785/928 | 19/21/24/28 |
| 4 | 1000 | 1000 | 67/84/108/158 | 510/588/707/1028 | 783/944/1155/1575 | 19/22/26/31 |
| 5 | 1000 | 1000 | 70/89/121/194 | 534/624/825/1212 | 876/1104/1497/2169 | 20/23/29/35 |
| 6 | 1000 | 1000 | 72/94/140/225 | 546/657/972/1465 | 814/1140/1823/2851 | 20/24/31/38 |
| 7 | 1000 | 999 | 74/99/159/249 | 564/684/1095/1582 | 536/981/2047/3412 | 21/25/34/42 |
| 8 | 999 | 919 | 75/104/189/272 | 570/723/1281/1684 | 31/600/2106/4079 | 21/27/36/47 |
| 9 | 919 | 509 | 80/112/213/286 | 698/902/1576/2138 | -583/119/2303/4585 | 21/28/38/49 |
| 10 | 509 | 299 | 97/158/253/319 | 847/1303/1902/2333 | -857/338/2990/5297 | 21/26/33/42 |

Formation mixed 997/1000. Winning routes `{"A":0,"B":0,"C":0,"D":0,"E":0,"F":0,"G":0,"H":0,"unformed":0,"mixed":299}`. Errors 0.

Extreme seeds (full metric in statistics JSON):
- lowestTotal: `F4-FULL-v1/Value/holdout/0216` (total 2657, peak 87, margin -8); `F4-FULL-v1/Value/holdout/0387` (total 3324, peak 100, margin -461); `F4-FULL-v1/Value/holdout/0753` (total 3348, peak 90, margin -437)
- highestTotal: `F4-FULL-v1/Value/holdout/0886` (total 14837, peak 363, margin 7712); `F4-FULL-v1/Value/holdout/0333` (total 13613, peak 330, margin 6488); `F4-FULL-v1/Value/holdout/0638` (total 13151, peak 324, margin 6024)
- highestPeak: `F4-FULL-v1/Value/holdout/0897` (total 9725, peak 398, margin 2598); `F4-FULL-v1/Value/holdout/0899` (total 11477, peak 389, margin 4344); `F4-FULL-v1/Value/holdout/0361` (total 7084, peak 374, margin -57)
- worstMargin: `F4-FULL-v1/Value/holdout/0319` (total 5976, peak 155, margin -1151); `F4-FULL-v1/Value/holdout/0422` (total 6026, peak 142, margin -1099); `F4-FULL-v1/Value/holdout/0018` (total 6031, peak 149, margin -1094)

### Value/train

| Stage | Reached | Paid / 1000 | Spin income P10/P50/P90/P99 | Period income P10/P50/P90/P99 | Margin P10/P50/P90/P99 | Pool P10/P50/P90/P99 |
|---:|---:|---:|---|---|---|---|
| 1 | 1000 | 1000 | 20/32/44/53 | 179/194/210/227 | 109/124/140/157 | 13/16/16/18 |
| 2 | 1000 | 1000 | 45/59/75/92 | 314/360/404/448 | 306/359/409/463 | 17/19/21/23 |
| 3 | 1000 | 1000 | 61/75/93/112 | 463/535/601/703 | 571/680/786/898 | 19/21/24/28 |
| 4 | 1000 | 1000 | 67/83/105/146 | 506/584/690/927 | 780/951/1135/1464 | 19/22/27/33 |
| 5 | 1000 | 1000 | 69/89/117/184 | 530/619/787/1172 | 882/1104/1432/2140 | 20/23/30/39 |
| 6 | 1000 | 1000 | 72/94/133/227 | 544/651/904/1492 | 822/1139/1718/2929 | 20/24/33/42 |
| 7 | 1000 | 998 | 73/98/155/246 | 560/679/1062/1636 | 560/962/1877/3647 | 20/25/35/45 |
| 8 | 998 | 923 | 75/103/183/267 | 573/711/1245/1700 | 52/577/1920/4230 | 21/27/38/50 |
| 9 | 923 | 489 | 80/112/214/287 | 697/903/1608/2116 | -582/67/2060/4521 | 21/27/38/51 |
| 10 | 489 | 291 | 99/161/256/324 | 881/1327/1961/2333 | -813/283/2905/5579 | 21/25/34/45 |

Formation mixed 999/1000. Winning routes `{"A":0,"B":0,"C":0,"D":0,"E":0,"F":0,"G":0,"H":0,"unformed":0,"mixed":291}`. Errors 0.

Extreme seeds (full metric in statistics JSON):
- lowestTotal: `F4-FULL-v1/Value/train/0745` (total 2628, peak 78, margin -43); `F4-FULL-v1/Value/train/0696` (total 2654, peak 88, margin -17); `F4-FULL-v1/Value/train/0015` (total 3178, peak 84, margin -613)
- highestTotal: `F4-FULL-v1/Value/train/0497` (total 15312, peak 422, margin 8187); `F4-FULL-v1/Value/train/0159` (total 14364, peak 398, margin 7223); `F4-FULL-v1/Value/train/0628` (total 13907, peak 291, margin 6776)
- highestPeak: `F4-FULL-v1/Value/train/0624` (total 11443, peak 425, margin 4318); `F4-FULL-v1/Value/train/0497` (total 15312, peak 422, margin 8187); `F4-FULL-v1/Value/train/0722` (total 9592, peak 407, margin 2461)
- worstMargin: `F4-FULL-v1/Value/train/0566` (total 5916, peak 127, margin -1209); `F4-FULL-v1/Value/train/0464` (total 5990, peak 155, margin -1151); `F4-FULL-v1/Value/train/0621` (total 5998, peak 158, margin -1127)

## GDD §13.3 comparison (diagnostic; not a retune)

待验证 targets: experienced human Normal 35–65%; Synergy/Greedy 40–70% and ≥15pp above Random; stage1 ≥95%, stage3 ≥75%, stage6 ~45–70%; winning pool median 18–26; small loop before stage 4 ≥70%; single-route win share 5–25%, mixed ≥40%.

- **formalBalance**: NOT APPROVED; holdout Wilson/survival outside GDD §13.3 待验证 bands and/or independent tool audit pending. No retune performed.
- **sampling**: PASS 4×(1000 train + 1000 holdout), 8000 disjoint fixed seeds, independent policy RNG, no rejected seeds, 0 command errors, 0 unfinished
- **actions**: Legal API includes skip/remove/reroll/item/event. Recorded unused commands: Greedy/holdout:none; Greedy/train:skipItem; Random/holdout:none; Random/train:none; Synergy/holdout:skipItem; Synergy/train:none; Value/holdout:skipItem; Value/train:none. Availability is not evidence every bot exercises every command.
- **lookahead**: policy-v2: Random identical to full-sim-v1 (uniform legal, policy-full-v1 / decision-full-v1). Value/Synergy/Greedy: root beam over all legal action TYPES with no skipItem/reroll/remove prune; remove UIDs limited to the 3 statically worst pool members. After the root action, continuation is staticChoiceV2 for at most 5 spins / 36 fullCommand. Surrogate reseeds synthetic full-sim-model-v2/0 (createRng); live seed and five streams never copied. Model-generated offers are visible to static continuation; they are not live offers. Branch width = |root candidates| (typically 4-12). Utility: WON +1e5, LOST -1e5, model income, mean synergy-or-static value, pool, tokens, cash-payment margin. Not optimal, not exhaustive tree search, not a live-RNG oracle.
- **tools**: Independent policy-v2 tool audit required (auditor must not write engine/run). v1 TOOLS_PASS docs/GDD1_FULL_SIM_AUDIT.md retained. This file is engineering gates, not that audit.
- **human**: PENDING; bots cannot substitute GDD §13.4
- **gdd133.synergyGreedyWinBand**: OUTSIDE 40-70% (diagnostic)
- **gdd133.fifteenPointsAboveRandom**: HOLD

Holdout stage survival vs §13.3:

- **Greedy/holdout** stage1 1000/1000 100.00% [99.62%, 100.00%]; stage3 1000/1000 100.00% [99.62%, 100.00%]; stage6 999/1000 99.90% [99.44%, 99.98%]; stage10 233/1000 23.30% [20.79%, 26.02%]; win-pool median 25.
- **Synergy/holdout** stage1 1000/1000 100.00% [99.62%, 100.00%]; stage3 1000/1000 100.00% [99.62%, 100.00%]; stage6 1000/1000 100.00% [99.62%, 100.00%]; stage10 239/1000 23.90% [21.36%, 26.64%]; win-pool median 25.
- **Value/holdout** stage1 1000/1000 100.00% [99.62%, 100.00%]; stage3 1000/1000 100.00% [99.62%, 100.00%]; stage6 1000/1000 100.00% [99.62%, 100.00%]; stage10 299/1000 29.90% [27.14%, 32.81%]; win-pool median 25.
- **Random/holdout** stage1 1000/1000 100.00% [99.62%, 100.00%]; stage3 999/1000 99.90% [99.44%, 99.98%]; stage6 640/1000 64.00% [60.98%, 66.92%]; stage10 0/1000 0.00% [0.00%, 0.38%]; win-pool median null.

## Judgment: strategy upper bound vs economy

policy-v2 holdout win rates: Value 29.90% [27.14%, 32.81%], Greedy 23.30% [20.79%, 26.02%], Synergy 23.90% [21.36%, 26.64%], Random 0.00% [0.00%, 0.38%].

Synergy/Greedy (and Value) holdout Wilson intervals sit **outside** the §13.3 40–70% band (max holdout point 29.90%, min 23.30%; gap from the strongest holdout point to 40% is **10.10pp**; strongest Wilson hi 32.81% is still 7.19pp below 40%). The ≥15pp vs Random **holds** because Random remains 0/1000.

v1 Greedy holdout was 2.30% [1.54%, 3.43%]; other v1 bots 0%. Enabling all legal types plus a 5-spin root beam lifted holdout wins into the ~23–30% region. Failures moved later (v1 Greedy mostly stages 8–9; policy-v2 mostly stages 9–10; stage 6 survival ~100% for lookahead bots, which is above the 45–70% first-contact band). That is a large policy effect, so v1 bots were weak. The remaining gap to 40% (entire Wilson interval below 40% on n=1000) is the **strategy-upper-bound estimate under this disclosed lookahead**: a fairer 5-spin beam over all legal types, with synthetic-model continuation and no live peek, still does not enter the §13.3 bot band. Winning-pool medians 24–26 sit in 18–26. All recorded wins are mixed-route.

This is **not** a proof that no stronger policy exists (horizon 5 / static continuation / remove beam 3 / model offers ≠ live). It is evidence that the shortfall is no longer explained only by “Greedy pruned skipItem/reroll/remove and looked 2 spins.” Economy-side hardness remains the leading residual hypothesis. **No price or GDD change is performed.** Phase B (versioned economy retune) requires explicit main-pane authorization.

`formalBalance` remains **NOT APPROVED**. Independent policy-v2 tool audit dests exist: `docs/GDD1_FULL_SIM_POLICY_V2_AUDIT.md` (**TOOLS_PASS**, SHA `988510d0a9e81b6594c643c0409da88ef8f10ba43eab53b5f0486b1d49598a3d`) and `tests/gdd1/f4-grok-audit-policy-v2.json` (SHA `e96d3c7c1ddece34061c5ddb3da553d26c49aaf5ae15b1e179caf5dc9d267f16`). Auditor blockReasons empty. Economy still **NOT APPROVED**. Bots cannot substitute GDD §13.4 human play. The auditor hashed this report before the Integrity section was appended; freeze-policy-v2 hashes the current file.

## Deliverables

- `tests/gdd1/full-sim-policy-v2-batch-*-{0,500}.jsonl` + `-index.json` (wx); probes and job-kill retained
- `tests/gdd1/full-sim-policy-v2-statistics.json`, `full-sim-policy-v2-recompute.json`, `full-sim-policy-v2-gates.json`, `full-sim-policy-v2-integrity.json` (PASS 8000/8000, replayAll, 0 fail)
- `tests/gdd1/full-sim-engine-policy-v2.js`, `full-sim-run-policy-v2.js`, stats/gates/integrity/report
- v1 `full-sim-batch-v3-*`, `full-sim-statistics.json`, freeze-v4, agg-freeze **not overwritten**

Independent simulator/tool audit: `docs/GDD1_FULL_SIM_POLICY_V2_AUDIT.md` **TOOLS_PASS**. This engineering report is not that audit. No production retune.
