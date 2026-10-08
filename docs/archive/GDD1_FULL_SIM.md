# GDD1 full-v1 Normal bot simulation (engineering report)

Scope: full-v1 Normal, 12 start, 70 spins, payments `[70,125,210,320,460,630,850,1120,1460,1880]`, 64/32/8. This is **not** the 24/10/3 slice and **not** a substitute for slice 65% win rates.

Independent F4 functional PASS is `docs/GDD1_F4_GROK_AUDIT.md`. freeze-v3 237/237 SHA `f04d90262d64b5393f64250e9705c0df5cbbd03f832aeff3f857ae37a829a8b9`. Formal Normal is **not** accepted by this report. Human play is pending. Art/audio deferred. No production retune.

Supplement SHA errata: live `docs/GDD1_F4_AUDIT_SUPPLEMENT.md` is 7352 / `8b83cc616b41a6b115cfb20f70b8d04dfe214de6c66cbdd33096449ffb229824` (64 hex), matching frozen reports. A 65-hex transcription inserts extra `d`. Frozen reports were not rewritten. See `docs/GDD1_F4_GROK_SHA_ERRATA.md`.

## Sampling

All 8000 games completed. Index byte-offset SHA-256 verified (8000 rows). 8 index-0 games replayed to identical final hashes. Command errors in aggregator: 0. No overlapping seeds. Prefix `full-sim-batch-v3-`. Incomplete v1/v2 jsonl retained and excluded (no index).

Seeds: `F4-FULL-v1/<Bot>/<train|holdout>/<0000-0999>` with policy `decision-full-v1/...`. Train/holdout prefixes disjoint. No seed screening.

| Bot / Split | Wins / 1000 | Wilson 95% | Formation | Event A ratio | Final pool P10/P50/P90/P99 | Game ms P10/P50/P90/P99 |
|---|---:|---|---|---|---|---|
| Greedy/holdout | 23 | 2.30% [1.54%, 3.43%] | 99.90% [99.44%, 99.98%] | 46.90% (count ratio; not independent Wilson) | 22/25/37/46 | 1950.23/2841.29/5432.53/19646.42 |
| Greedy/train | 33 | 3.30% [2.36%, 4.60%] | 99.90% [99.44%, 99.98%] | 46.56% (count ratio; not independent Wilson) | 22/25/37/48 | 1956.14/2831.13/5559.27/18876.1 |
| Random/holdout | 0 | 0.00% [0.00%, 0.38%] | 99.60% [98.98%, 99.84%] | 67.09% (count ratio; not independent Wilson) | 25/33/41/48 | 207.7/341.31/1179.84/1515.39 |
| Random/train | 0 | 0.00% [0.00%, 0.38%] | 99.60% [98.98%, 99.84%] | 63.92% (count ratio; not independent Wilson) | 25/33/41/47 | 206.18/334.89/1169.25/1406.35 |
| Synergy/holdout | 0 | 0.00% [0.00%, 0.38%] | 100.00% [99.62%, 100.00%] | 94.40% (count ratio; not independent Wilson) | 27/32/38/45 | 254.93/369.88/1589.86/1945.76 |
| Synergy/train | 0 | 0.00% [0.00%, 0.38%] | 99.90% [99.44%, 99.98%] | 93.51% (count ratio; not independent Wilson) | 26/32/39/46 | 258.1/377.52/1579.43/1908.23 |
| Value/holdout | 0 | 0.00% [0.00%, 0.38%] | 100.00% [99.62%, 100.00%] | 93.96% (count ratio; not independent Wilson) | 22/25/30/40 | 263.74/360.72/1456.53/1744.28 |
| Value/train | 0 | 0.00% [0.00%, 0.38%] | 100.00% [99.62%, 100.00%] | 93.67% (count ratio; not independent Wilson) | 23/24/31/40 | 264.41/360.47/1450.6/1784.44 |

Formation A–H is a diagnostic after spins, not proof of a complete build. Acquisition strata use public pre-choice formation and pool bands `<20` / `20-26` / `>26`. Acquired-game win rates are conditional and confounded; not causal item effectiveness.

Quantiles: nearest rank. Stage income/pool condition on reaching the stage. Period income/margins condition on completing that payment. Survival denominator 1000. Wilson 95% only on independent game/seed trials. Offer/event/acquisition-event ratios have counts without `lo`/`hi`.

## Lookahead and unused actions

Greedy: clone + independent synthetic seed `full-sim-model-v1/0`, at most 2 spins / 14 `fullCommand`, prune remove/reroll unless static preferred. Future generated offers skipped. No live seed/RNG peek. Value/Synergy static tags. Random uniform legal.

Legal API includes spin/choose/skip/remove/reroll/item/skipItem/event A/B. Availability is not evidence that every bot exercises every command.
- **Greedy/holdout** live commands 129407, model 1319639. Actions `{"spin":57342,"choose":23185,"remove":5459,"item":7411,"skip":34157,"eventB":984,"eventA":869}`. Unused: reroll, skipItem.
- **Greedy/train** live commands 129610, model 1315087. Actions `{"spin":57451,"choose":22924,"remove":5393,"item":7425,"skip":34527,"eventB":1010,"eventA":880}`. Unused: reroll, skipItem.
- **Random/holdout** live commands 110524, model 0. Actions `{"remove":6722,"spin":44677,"choose":33505,"reroll":7370,"item":4242,"skip":11172,"eventA":946,"eventB":464,"skipItem":1426}`. Unused: none.
- **Random/train** live commands 109727, model 0. Actions `{"remove":6695,"spin":44383,"choose":33271,"skip":11112,"skipItem":1404,"eventA":884,"item":4222,"reroll":7257,"eventB":499}`. Unused: none.
- **Synergy/holdout** live commands 122322, model 0. Actions `{"spin":50535,"choose":26577,"remove":2650,"item":6503,"reroll":10438,"skip":23958,"eventA":1568,"eventB":93}`. Unused: skipItem.
- **Synergy/train** live commands 123174, model 0. Actions `{"spin":50882,"choose":26938,"remove":2794,"item":6553,"reroll":10429,"skip":23944,"eventA":1528,"eventB":106}`. Unused: skipItem.
- **Value/holdout** live commands 133266, model 0. Actions `{"remove":6809,"spin":53445,"choose":29010,"item":6909,"reroll":10903,"skip":24435,"eventA":1649,"eventB":106}`. Unused: skipItem.
- **Value/train** live commands 133069, model 0. Actions `{"remove":6872,"spin":53376,"choose":29107,"item":6901,"reroll":10759,"skip":24269,"eventA":1672,"eventB":113}`. Unused: skipItem.

## Per-strategy stages

### Greedy/holdout

| Stage | Reached | Paid / 1000 | Spin income P10/P50/P90/P99 | Period income P10/P50/P90/P99 | Margin P10/P50/P90/P99 | Pool P10/P50/P90/P99 |
|---:|---:|---:|---|---|---|---|
| 1 | 1000 | 1000 | 20/32/44/52 | 177/193/210/229 | 107/123/140/159 | 14/15/16/17 |
| 2 | 1000 | 1000 | 44/57/72/85 | 297/343/390/440 | 284/342/395/466 | 17/20/21/23 |
| 3 | 1000 | 1000 | 54/66/80/96 | 402/466/529/622 | 491/597/704/860 | 20/21/24/27 |
| 4 | 1000 | 1000 | 57/71/88/114 | 432/500/578/741 | 612/776/942/1259 | 20/23/26/31 |
| 5 | 1000 | 1000 | 58/73/93/131 | 446/513/617/824 | 613/830/1082/1575 | 20/23/28/36 |
| 6 | 1000 | 999 | 60/76/98/143 | 451/533/644/935 | 450/738/1091/1654 | 20/24/31/39 |
| 7 | 999 | 947 | 61/78/103/162 | 466/549/692/1024 | 82/437/897/1831 | 21/24/33/43 |
| 8 | 947 | 387 | 64/82/110/167 | 495/573/740/1040 | -449/-80/518/1620 | 21/25/35/45 |
| 9 | 387 | 78 | 72/95/139/212 | 653/769/1046/1387 | -730/-436/403/2200 | 22/25/35/45 |
| 10 | 78 | 23 | 82/131/197/244 | 853/1046/1344/1778 | -889/-382/965/3258 | 23/24/31/40 |

Formation mixed 942/1000. Winning routes `{"A":0,"B":0,"C":0,"D":0,"E":0,"F":0,"G":0,"H":0,"unformed":0,"mixed":23}`. Errors 0.

Extreme seeds (full metric in statistics JSON):
- lowestTotal: `F4-FULL-v1/Greedy/holdout/0912` (total 1713, peak 71, margin -102); `F4-FULL-v1/Greedy/holdout/0081` (total 2330, peak 83, margin -337); `F4-FULL-v1/Greedy/holdout/0480` (total 2380, peak 70, margin -291)
- highestTotal: `F4-FULL-v1/Greedy/holdout/0668` (total 10393, peak 254, margin 3258); `F4-FULL-v1/Greedy/holdout/0709` (total 10174, peak 266, margin 3049); `F4-FULL-v1/Greedy/holdout/0648` (total 9478, peak 263, margin 2347)
- highestPeak: `F4-FULL-v1/Greedy/holdout/0550` (total 7630, peak 302, margin 499); `F4-FULL-v1/Greedy/holdout/0629` (total 4713, peak 291, margin -538); `F4-FULL-v1/Greedy/holdout/0829` (total 7909, peak 277, margin 784)
- worstMargin: `F4-FULL-v1/Greedy/holdout/0259` (total 5969, peak 197, margin -1156); `F4-FULL-v1/Greedy/holdout/0009` (total 6073, peak 144, margin -1058); `F4-FULL-v1/Greedy/holdout/0640` (total 6170, peak 163, margin -957)

### Greedy/train

| Stage | Reached | Paid / 1000 | Spin income P10/P50/P90/P99 | Period income P10/P50/P90/P99 | Margin P10/P50/P90/P99 | Pool P10/P50/P90/P99 |
|---:|---:|---:|---|---|---|---|
| 1 | 1000 | 1000 | 20/32/44/51 | 176/192/210/224 | 106/122/140/154 | 14/15/16/18 |
| 2 | 1000 | 1000 | 44/56/72/85 | 296/342/391/431 | 285/339/396/450 | 17/20/21/23 |
| 3 | 1000 | 1000 | 54/67/81/100 | 399/467/536/669 | 485/595/705/880 | 20/22/24/27 |
| 4 | 1000 | 1000 | 57/71/88/117 | 432/500/581/758 | 614/777/955/1303 | 20/23/26/32 |
| 5 | 1000 | 1000 | 58/73/92/127 | 442/513/618/797 | 612/830/1089/1606 | 20/23/28/35 |
| 6 | 1000 | 999 | 59/76/98/150 | 452/528/649/966 | 459/726/1101/1859 | 20/24/31/39 |
| 7 | 999 | 950 | 61/78/105/165 | 467/546/698/1086 | 90/422/957/2036 | 20/24/33/43 |
| 8 | 950 | 378 | 65/82/114/184 | 497/574/766/1128 | -451/-95/580/1819 | 21/24/35/45 |
| 9 | 378 | 98 | 73/97/153/217 | 644/774/1128/1495 | -731/-418/589/2812 | 22/24/35/44 |
| 10 | 98 | 33 | 84/135/189/236 | 809/1111/1388/1584 | -895/-313/1006/2846 | 23/24/33/40 |

Formation mixed 967/1000. Winning routes `{"A":0,"B":0,"C":0,"D":0,"E":0,"F":0,"G":0,"H":0,"unformed":0,"mixed":33}`. Errors 0.

Extreme seeds (full metric in statistics JSON):
- lowestTotal: `F4-FULL-v1/Greedy/train/0974` (total 1701, peak 74, margin -114); `F4-FULL-v1/Greedy/train/0161` (total 2298, peak 64, margin -367); `F4-FULL-v1/Greedy/train/0793` (total 2312, peak 91, margin -359)
- highestTotal: `F4-FULL-v1/Greedy/train/0000` (total 9971, peak 257, margin 2846); `F4-FULL-v1/Greedy/train/0399` (total 9644, peak 226, margin 2519); `F4-FULL-v1/Greedy/train/0397` (total 9286, peak 196, margin 2155)
- highestPeak: `F4-FULL-v1/Greedy/train/0932` (total 8493, peak 283, margin 1368); `F4-FULL-v1/Greedy/train/0750` (total 7372, peak 281, margin 247); `F4-FULL-v1/Greedy/train/0235` (total 6634, peak 267, margin -491)
- worstMargin: `F4-FULL-v1/Greedy/train/0210` (total 6048, peak 202, margin -1085); `F4-FULL-v1/Greedy/train/0991` (total 6115, peak 142, margin -1010); `F4-FULL-v1/Greedy/train/0215` (total 6128, peak 137, margin -997)

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
| 1 | 1000 | 1000 | 20/30/40/48 | 166/179/195/209 | 96/109/125/139 | 14/15/16/16 |
| 2 | 1000 | 1000 | 39/51/64/77 | 270/309/343/374 | 248/293/335/385 | 17/20/21/23 |
| 3 | 1000 | 1000 | 47/57/69/83 | 354/406/456/510 | 400/489/572/659 | 20/23/24/27 |
| 4 | 1000 | 1000 | 51/61/74/87 | 380/430/486/534 | 465/595/732/854 | 22/24/28/32 |
| 5 | 1000 | 999 | 52/63/76/91 | 391/442/501/565 | 403/576/763/917 | 23/27/31/36 |
| 6 | 999 | 984 | 54/64/77/94 | 401/449/513/585 | 188/396/633/838 | 24/29/33/41 |
| 7 | 984 | 506 | 55/65/79/96 | 412/457/517/597 | -238/6/290/578 | 26/31/36/43 |
| 8 | 506 | 14 | 60/69/83/101 | 444/483/556/619 | -633/-494/-203/111 | 27/32/38/44 |
| 9 | 14 | 0 | 73/87/101/145 | 639/696/747/935 | -779/-676/-427/-126 | 27/32/40/41 |
| 10 | 0 | 0 | NA/NA/NA/NA | NA/NA/NA/NA | NA/NA/NA/NA | NA/NA/NA/NA |

Formation mixed 697/1000. Winning routes `{"A":0,"B":0,"C":0,"D":0,"E":0,"F":0,"G":0,"H":0,"unformed":0,"mixed":0}`. Errors 0.

Extreme seeds (full metric in statistics JSON):
- lowestTotal: `F4-FULL-v1/Synergy/holdout/0309` (total 1090, peak 50, margin -99); `F4-FULL-v1/Synergy/holdout/0838` (total 1553, peak 65, margin -262); `F4-FULL-v1/Synergy/holdout/0113` (total 1661, peak 73, margin -154)
- highestTotal: `F4-FULL-v1/Synergy/holdout/0013` (total 5129, peak 188, margin -126); `F4-FULL-v1/Synergy/holdout/0192` (total 4818, peak 110, margin -427); `F4-FULL-v1/Synergy/holdout/0702` (total 4729, peak 98, margin -522)
- highestPeak: `F4-FULL-v1/Synergy/holdout/0013` (total 5129, peak 188, margin -126); `F4-FULL-v1/Synergy/holdout/0950` (total 2654, peak 135, margin -11); `F4-FULL-v1/Synergy/holdout/0976` (total 3552, peak 135, margin -235)
- worstMargin: `F4-FULL-v1/Synergy/holdout/0839` (total 4464, peak 98, margin -783); `F4-FULL-v1/Synergy/holdout/0867` (total 4476, peak 109, margin -779); `F4-FULL-v1/Synergy/holdout/0831` (total 4475, peak 113, margin -770)

### Synergy/train

| Stage | Reached | Paid / 1000 | Spin income P10/P50/P90/P99 | Period income P10/P50/P90/P99 | Margin P10/P50/P90/P99 | Pool P10/P50/P90/P99 |
|---:|---:|---:|---|---|---|---|
| 1 | 1000 | 1000 | 20/30/40/48 | 168/179/196/208 | 98/109/126/138 | 14/15/16/16 |
| 2 | 1000 | 1000 | 39/51/65/78 | 268/309/344/385 | 246/293/336/384 | 16/20/21/22 |
| 3 | 1000 | 1000 | 47/58/70/84 | 355/409/456/511 | 397/491/573/663 | 20/23/25/27 |
| 4 | 1000 | 1000 | 51/62/75/89 | 386/438/489/559 | 475/607/725/885 | 22/24/28/31 |
| 5 | 1000 | 999 | 52/63/76/91 | 391/447/501/567 | 419/595/763/935 | 23/27/31/36 |
| 6 | 999 | 986 | 54/64/78/96 | 400/454/513/592 | 199/415/627/884 | 24/29/34/41 |
| 7 | 986 | 557 | 54/65/79/96 | 407/458/525/589 | -225/27/294/617 | 26/31/37/45 |
| 8 | 557 | 11 | 59/69/83/101 | 447/485/556/615 | -637/-503/-206/149 | 27/33/39/44 |
| 9 | 11 | 0 | 70/82/99/157 | 617/651/697/879 | -737/-625/-467/-149 | 28/31/34/37 |
| 10 | 0 | 0 | NA/NA/NA/NA | NA/NA/NA/NA | NA/NA/NA/NA | NA/NA/NA/NA |

Formation mixed 707/1000. Winning routes `{"A":0,"B":0,"C":0,"D":0,"E":0,"F":0,"G":0,"H":0,"unformed":0,"mixed":0}`. Errors 0.

Extreme seeds (full metric in statistics JSON):
- lowestTotal: `F4-FULL-v1/Synergy/train/0377` (total 1052, peak 63, margin -133); `F4-FULL-v1/Synergy/train/0005` (total 1675, peak 69, margin -142); `F4-FULL-v1/Synergy/train/0757` (total 1700, peak 72, margin -121)
- highestTotal: `F4-FULL-v1/Synergy/train/0338` (total 5102, peak 159, margin -149); `F4-FULL-v1/Synergy/train/0716` (total 4786, peak 109, margin -467); `F4-FULL-v1/Synergy/train/0442` (total 4688, peak 99, margin -563)
- highestPeak: `F4-FULL-v1/Synergy/train/0338` (total 5102, peak 159, margin -149); `F4-FULL-v1/Synergy/train/0014` (total 3244, peak 135, margin -549); `F4-FULL-v1/Synergy/train/0299` (total 3244, peak 135, margin -547)
- worstMargin: `F4-FULL-v1/Synergy/train/0480` (total 2978, peak 87, margin -817); `F4-FULL-v1/Synergy/train/0444` (total 4462, peak 95, margin -783); `F4-FULL-v1/Synergy/train/0647` (total 4508, peak 104, margin -737)

### Value/holdout

| Stage | Reached | Paid / 1000 | Spin income P10/P50/P90/P99 | Period income P10/P50/P90/P99 | Margin P10/P50/P90/P99 | Pool P10/P50/P90/P99 |
|---:|---:|---:|---|---|---|---|
| 1 | 1000 | 1000 | 21/30/41/51 | 171/185/201/216 | 101/115/131/146 | 13/15/15/16 |
| 2 | 1000 | 1000 | 38/51/66/81 | 262/312/352/393 | 246/302/351/398 | 16/20/21/22 |
| 3 | 1000 | 1000 | 48/60/75/89 | 365/427/481/549 | 404/518/611/705 | 20/22/24/27 |
| 4 | 1000 | 1000 | 53/65/80/96 | 403/462/521/590 | 499/662/793/965 | 21/23/25/30 |
| 5 | 1000 | 1000 | 55/68/83/99 | 420/481/540/616 | 464/680/866/1128 | 21/24/26/34 |
| 6 | 1000 | 998 | 58/70/86/104 | 437/500/560/633 | 288/545/784/1091 | 22/24/28/36 |
| 7 | 998 | 829 | 61/73/88/107 | 455/518/578/651 | -92/209/503/892 | 22/24/29/39 |
| 8 | 829 | 78 | 64/76/92/110 | 486/539/600/669 | -552/-341/-7/441 | 22/24/29/37 |
| 9 | 78 | 4 | 72/86/105/136 | 628/689/806/1006 | -787/-677/-204/594 | 22/24/30/37 |
| 10 | 4 | 0 | 62/88/108/117 | 539/618/828/828 | -859/-811/-550/-550 | 23/23/28/28 |

Formation mixed 968/1000. Winning routes `{"A":0,"B":0,"C":0,"D":0,"E":0,"F":0,"G":0,"H":0,"unformed":0,"mixed":0}`. Errors 0.

Extreme seeds (full metric in statistics JSON):
- lowestTotal: `F4-FULL-v1/Value/holdout/0670` (total 1745, peak 62, margin -72); `F4-FULL-v1/Value/holdout/0280` (total 1776, peak 89, margin -39); `F4-FULL-v1/Value/holdout/0321` (total 2215, peak 85, margin -456)
- highestTotal: `F4-FULL-v1/Value/holdout/0856` (total 6575, peak 137, margin -550); `F4-FULL-v1/Value/holdout/0839` (total 6473, peak 166, margin -668); `F4-FULL-v1/Value/holdout/0127` (total 6320, peak 145, margin -811)
- highestPeak: `F4-FULL-v1/Value/holdout/0501` (total 6282, peak 169, margin -859); `F4-FULL-v1/Value/holdout/0839` (total 6473, peak 166, margin -668); `F4-FULL-v1/Value/holdout/0288` (total 4480, peak 148, margin -767)
- worstMargin: `F4-FULL-v1/Value/holdout/0501` (total 6282, peak 169, margin -859); `F4-FULL-v1/Value/holdout/0555` (total 4411, peak 108, margin -834); `F4-FULL-v1/Value/holdout/0644` (total 4436, peak 106, margin -819)

### Value/train

| Stage | Reached | Paid / 1000 | Spin income P10/P50/P90/P99 | Period income P10/P50/P90/P99 | Margin P10/P50/P90/P99 | Pool P10/P50/P90/P99 |
|---:|---:|---:|---|---|---|---|
| 1 | 1000 | 1000 | 21/30/41/51 | 172/185/200/215 | 102/115/130/145 | 13/15/15/16 |
| 2 | 1000 | 1000 | 38/51/66/80 | 264/310/345/384 | 250/300/344/388 | 16/20/21/22 |
| 3 | 1000 | 1000 | 48/60/75/90 | 370/427/482/539 | 415/512/608/696 | 20/22/24/26 |
| 4 | 1000 | 1000 | 53/65/80/96 | 404/462/518/594 | 515/654/793/942 | 21/24/25/29 |
| 5 | 1000 | 1000 | 56/68/83/101 | 422/482/539/620 | 487/676/858/1084 | 22/24/26/32 |
| 6 | 1000 | 999 | 58/70/86/102 | 436/499/558/623 | 296/546/771/1048 | 22/24/28/35 |
| 7 | 999 | 833 | 61/73/89/108 | 459/516/575/686 | -77/216/480/791 | 22/24/29/38 |
| 8 | 833 | 66 | 65/76/91/109 | 487/537/590/678 | -554/-334/-41/356 | 22/24/30/40 |
| 9 | 66 | 3 | 69/84/104/120 | 613/678/767/878 | -797/-677/-324/469 | 22/24/28/35 |
| 10 | 3 | 0 | 58/84/121/128 | 515/656/871/871 | -1135/-927/-896/-896 | 23/23/24/24 |

Formation mixed 951/1000. Winning routes `{"A":0,"B":0,"C":0,"D":0,"E":0,"F":0,"G":0,"H":0,"unformed":0,"mixed":0}`. Errors 0.

Extreme seeds (full metric in statistics JSON):
- lowestTotal: `F4-FULL-v1/Value/train/0590` (total 1726, peak 83, margin -91); `F4-FULL-v1/Value/train/0896` (total 2282, peak 70, margin -383); `F4-FULL-v1/Value/train/0857` (total 2283, peak 70, margin -390)
- highestTotal: `F4-FULL-v1/Value/train/0971` (total 6231, peak 152, margin -896); `F4-FULL-v1/Value/train/0639` (total 6200, peak 163, margin -927); `F4-FULL-v1/Value/train/0628` (total 5998, peak 117, margin -1135)
- highestPeak: `F4-FULL-v1/Value/train/0639` (total 6200, peak 163, margin -927); `F4-FULL-v1/Value/train/0971` (total 6231, peak 152, margin -896); `F4-FULL-v1/Value/train/0625` (total 4839, peak 144, margin -416)
- worstMargin: `F4-FULL-v1/Value/train/0628` (total 5998, peak 117, margin -1135); `F4-FULL-v1/Value/train/0639` (total 6200, peak 163, margin -927); `F4-FULL-v1/Value/train/0641` (total 4345, peak 107, margin -902)

## GDD §13.3 comparison (diagnostic; not a retune)

待验证 targets: experienced human Normal 35–65%; Synergy/Greedy 40–70% and ≥15pp above Random; stage1 ≥95%, stage3 ≥75%, stage6 ~45–70%; winning pool median 18–26; small loop before stage 4 ≥70%; single-route win share 5–25%, mixed ≥40%.

- **formalBalance**: NOT APPROVED; holdout Wilson/survival outside GDD §13.3 待验证 bands and/or independent tool audit pending. No retune performed.
- **sampling**: PASS 4×(1000 train + 1000 holdout), 8000 disjoint fixed seeds, independent policy RNG, no rejected seeds, 0 command errors, 0 unfinished
- **actions**: Legal API includes skip/remove/reroll/item/event. Recorded unused commands: Greedy/holdout:reroll|skipItem; Greedy/train:reroll|skipItem; Random/holdout:none; Random/train:none; Synergy/holdout:skipItem; Synergy/train:skipItem; Value/holdout:skipItem; Value/train:skipItem. Availability is not evidence every bot exercises every command.
- **lookahead**: Greedy clone + synthetic seed full-sim-model-v1/0, ≤2 spins / 14 commands, prune remove/reroll unless static preferred; future offers skipped. Not exhaustive search. No live RNG peek. Engineering tool-audit-v2 8/8 is not independent auditor PASS.
- **tools**: Independent `docs/GDD1_FULL_SIM_AUDIT.md` judgment **TOOLS_PASS** (16285 / `e08580281e482d8bec0fce9414290401149fbecd171dc4a0f7d17177350ff437`); companion `tests/gdd1/f4-grok-audit-sim-v1.json` 56366 / `9b3c5cc1a615ce13d35608abb7bb129a3526b63e6a42ef80f59f8ed868ac9bbf`. Engineering tool-audit v1 7/8 and v3 10/11 retained as oracle failures; v2 8/8 and v5 11/11. Integrity `tests/gdd1/full-sim-integrity-v3.json` pass: 8000/8000, 0 missing/dup/error/unfinished, 8000 command replays.
- **human**: PENDING; bots cannot substitute GDD §13.4

If strong strategies are 100% or all routes collapse at stage 6, current tables return to design. This run does not change GDD, payments, or definitions.

## Deliverables

- `tests/gdd1/full-sim-batch-v3-*-{0,500}.jsonl` + `-index.json` (wx)
- `tests/gdd1/full-sim-statistics.json`, `full-sim-recompute.json`, `full-sim-gates.json`
- `tests/gdd1/full-sim-seeds.json`, engine/runner/stats/checks
- `tests/gdd1/full-sim-tool-audit-v1.json` (7/8 retained) and `full-sim-tool-audit-v2.json` (8/8)
- Incomplete prior jsonl retained

Independent tool audit is TOOLS_PASS as cited above. Economic conclusions remain **NOT APPROVED**. This engineering report is not formal Normal acceptance. No GDD/payment/definition retune.
