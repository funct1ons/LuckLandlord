# GDD1 F3 Slice Simulation

## Scope

This is a structural/economic slice simulation of `slice-abd-v1`: 24 symbols, 10 items, 3 events, and the ceil-65% Normal slice. It is not the F4 8,000-game gate, and the formal Normal bot/human target bands are not acceptance criteria here. No production source, frozen GDD, or prior evidence was changed.

The simulator loads the real GDD1 VM API (`sliceNewRun` and `sliceCommand`). It records complete per-game JSONL, a byte-offset/SHA-256 index, and a materialized fixed seed index. Train and holdout seeds are disjoint by construction:

`F3-SLICE-v1/<bot>/<train|holdout>/<0000..0999>`

Policy RNG is a separate deterministic stream (`decision-v1/...`) and is never stored in or consumed by the live five-stream game RNG. No seeds are screened, removed, or tuned.

## Strategies

- **Random**: uniformly samples a legal action from the current public state.
- **Value**: deterministic immediate symbol/item value ordering with legal skip/remove/reroll/event handling.
- **Synergy**: deterministic value ordering with slice-tag and inventory synergies.
- **Greedy**: evaluates legal candidates by cloning state and executing actual `sliceCommand` calls for a bounded two-spin finite lookahead. It does not inspect or generate future offers while scoring candidates; the clone has an independent synthetic RNG. The live state and live RNG are unchanged.

No strategy claims to model a human. Invalid commands are errors, not wins.

## Validation

`f3-slice-sim-checks.js` covers public-state redaction, clone immutability, hidden-RNG invariance, future-offer invariance, policy-RNG separation/replay, reroll/remove accounting, payment failure, stage reward accounting, event A/B behavior, and invalid-event rollback. The expected result is 9/9.

`f3-slice-sim-stats.js` verifies every JSONL line against its byte offset and SHA-256 index entry, rejects duplicate seeds, checks whole-game contribution attribution against realized income, and replays the first game of each file through the real command API to its recorded final hash.

## Results

All 8000 games completed. Every byte-offset/index SHA-256 verified; 8 selected fixed-seed games replayed to identical final state hashes. 0 command errors. No seed overlap.

| Bot / Split | Wins / 1000 | Wilson 95% | Formation A/B/D | Event A acceptance | Final pool P10/P50/P90/P99 | Game ms P10/P50/P90/P99 |
|---|---:|---|---|---|---|---|
| Greedy/holdout | 790 | 79.00% [76.37%, 81.41%] | 93.70% [92.02%, 95.05%] | 14.55% [12.29%, 17.14%] | 23/25/32/43 | 4397.24/5145.38/10550.39/14698.28 |
| Greedy/train | 810 | 81.00% [78.45%, 83.31%] | 94.50% [92.91%, 95.75%] | 14.92% [12.57%, 17.62%] | 23/25/32/42 | 4439.81/5182.44/10679.92/15685.67 |
| Random/holdout | 1 | 0.10% [0.02%, 0.56%] | 97.20% [95.98%, 98.06%] | 58.72% [55.85%, 61.52%] | 30/39/48/54 | 521.27/797.87/1011.3/1250.49 |
| Random/train | 3 | 0.30% [0.10%, 0.88%] | 97.00% [95.75%, 97.89%] | 58.82% [55.99%, 61.59%] | 29/39/47/54 | 465.39/797.64/1024.39/1219.58 |
| Synergy/holdout | 564 | 56.40% [53.31%, 59.44%] | 98.00% [96.93%, 98.70%] | 64.43% [59.95%, 68.66%] | 24/26/34/42 | 614.56/979.69/1157.29/1308.46 |
| Synergy/train | 546 | 54.60% [51.50%, 57.66%] | 98.30% [97.29%, 98.94%] | 60.87% [56.45%, 65.12%] | 24/26/33/42 | 627.5/983.5/1148.89/1296.04 |
| Value/holdout | 173 | 17.30% [15.08%, 19.77%] | 99.90% [99.44%, 99.98%] | 87.72% [85.81%, 89.41%] | 25/36/43/48 | 670.29/854.15/961.83/1110.13 |
| Value/train | 195 | 19.50% [17.16%, 22.07%] | 99.90% [99.44%, 99.98%] | 87.63% [85.71%, 89.32%] | 26/36/43/48 | 674.35/856.62/961.07/1130.72 |

Formation is a diagnostic, not proof of a complete build. A: >=4 plants, fog_stitcher or dew_calendar support, and >=2 recent-three-spin plant transforms or >=12 recent-three-spin plant-product ledger income. B: >=2 scrap, sorting_tong or sieve_drum, heat_clerk or offcut_chute, and >=2 recent-three-spin scrap operations. D: >=3 feedstock, condense_coil or deep_still, and >=2 crystal types. Formation is evaluated after spins. Acquisition strata use public pre-choice formation and pool bands <20 / 20-26 / >26. No causal item-effect claim is made from selected-item win rates.

Quantiles use nearest rank. Stage income/pool statistics condition on reaching the stage; period income/margins condition on completing its payment window. Survival is unconditional, denominator 1000. Wilson is descriptive binomial uncertainty; game streams are disjoint across bots, not paired comparisons.

### Greedy/holdout

| Stage | Reached | Paid / 1000 | Spin income P10/P50/P90/P99 | Period income P10/P50/P90/P99 | Payment margin P10/P50/P90/P99 | Pool P10/P50/P90/P99 |
|---:|---:|---:|---|---|---|---|
| 1 | 1000 | 1000 | 16/31/42/48 | 161/178/197/211 | 115/132/151/165 | 12/14/14/15 |
| 2 | 1000 | 1000 | 40/52/64/74 | 262/314/357/389 | 302/364/419/463 | 16/18/20/21 |
| 3 | 1000 | 1000 | 58/67/75/83 | 421/465/510/545 | 594/696/778/854 | 20/21/24/25 |
| 4 | 1000 | 1000 | 62/70/79/90 | 449/491/541/596 | 850/980/1093/1215 | 21/23/25/26 |
| 5 | 1000 | 1000 | 64/73/83/96 | 461/512/570/631 | 1031/1190/1336/1516 | 21/24/25/28 |
| 6 | 1000 | 1000 | 66/75/87/104 | 469/527/603/661 | 1110/1308/1509/1724 | 21/24/26/31 |
| 7 | 1000 | 1000 | 67/77/90/107 | 479/542/620/689 | 1069/1300/1556/1840 | 22/24/27/34 |
| 8 | 1000 | 1000 | 68/79/93/110 | 483/552/636/720 | 850/1124/1447/1777 | 22/24/28/36 |
| 9 | 1000 | 998 | 69/80/95/113 | 563/646/745/848 | 479/829/1212/1622 | 22/24/29/39 |
| 10 | 998 | 790 | 69/81/97/117 | 568/654/759/875 | -151/263/724/1187 | 22/24/31/42 |

Live commands: 156605; model commands: 1623007. Live command ms P10/P50/P90/P99: 1.28/2.12/5.15/8.42. Resolver log actions per spin: 2/5/11/18. First formation spin: 4/17/41/65. Mixed A/B/D formations: 356/1000. Errors: 0.
Actions: `{"spin":69984,"choose":32150,"remove":6828,"item":8998,"skip":37834,"eventB":693,"eventA":118}`.

| ID | Offer appearances | Exposed games | Selected | Acquired games | Acquired-game wins | Income contribution |
|---|---:|---:|---:|---:|---:|---:|
| amber_frond | 9792 | 1000 | 2425 | 891 | 710 | 818692 |
| ash_felt | 11127 | 1000 | 1386 | 601 | 490 | 18222 |
| brine_strip | 11066 | 1000 | 2162 | 877 | 702 | 2359 |
| clinker_router | 5209 | 996 | 172 | 154 | 117 | 9812 |
| condense_coil | 11192 | 1000 | 1724 | 995 | 788 | 48692 |
| copper_burr | 11200 | 1000 | 2573 | 888 | 688 | 236496 |
| crystal_index | 9857 | 1000 | 4637 | 982 | 789 | 693203 |
| deep_still | 9870 | 1000 | 539 | 410 | 306 | 45356 |
| dew_lantern | 9800 | 1000 | 3277 | 918 | 739 | 16674 |
| event_brine_inspection | 600 | 600 | 81 | 81 | 65 | 0 |
| event_fog_shift | 211 | 211 | 37 | 37 | 33 | 0 |
| fog_stitcher | 9857 | 1000 | 156 | 148 | 101 | 4673 |
| furnace_auditor | 5275 | 998 | 266 | 228 | 173 | 14711 |
| heat_clerk | 9681 | 1000 | 370 | 306 | 254 | 90190 |
| item_brine_lining | 1665 | 1000 | 960 | 960 | 759 | 15056 |
| item_clean_mesh | 2902 | 1000 | 872 | 872 | 682 | 0 |
| item_dew_calendar | 2988 | 1000 | 906 | 906 | 720 | 0 |
| item_fraction_gauge | 2581 | 1000 | 905 | 905 | 720 | 74529 |
| item_frost_glass | 2474 | 1000 | 908 | 908 | 719 | 10098 |
| item_offcut_chute | 2567 | 1000 | 867 | 867 | 682 | 0 |
| item_residue_stamp | 2859 | 1000 | 869 | 869 | 686 | 220 |
| item_root_wrap | 2707 | 1000 | 893 | 893 | 707 | 8492 |
| item_sorting_apron | 2260 | 1000 | 956 | 956 | 752 | 20472 |
| item_waste_log | 2993 | 1000 | 862 | 862 | 683 | 0 |
| mist_pouch | 11091 | 1000 | 776 | 499 | 403 | 4810 |
| nursery_gauge | 5202 | 993 | 438 | 352 | 275 | 22980 |
| pearl_separator | 5212 | 995 | 665 | 549 | 430 | 24072 |
| reserve_facet | 5178 | 995 | 1143 | 753 | 630 | 72538 |
| root_ledger | 5298 | 998 | 168 | 157 | 122 | 12630 |
| saline_ampoule | 11055 | 1000 | 2354 | 902 | 720 | 73748 |
| sieve_drum | 9798 | 1000 | 596 | 442 | 330 | 49564 |
| sorting_tong | 11244 | 1000 | 1256 | 839 | 681 | 98431 |
| spent_gasket | 0 | 0 | 0 | 0 | 0 | -1886 |
| tide_prism | 9749 | 1000 | 1818 | 826 | 660 | 1884576 |
| warm_pod | 11056 | 1000 | 2369 | 910 | 721 | 331919 |
| wick_bed | 11143 | 1000 | 880 | 588 | 458 | 210022 |

Extreme seeds (full metric and final hash in statistics JSON):
- lowestTotal: `F3-SLICE-v1/Greedy/holdout/0498` (total 3203, peak 60, margin -209); `F3-SLICE-v1/Greedy/holdout/0617` (total 3399, peak 68, margin -13); `F3-SLICE-v1/Greedy/holdout/0052` (total 4013, peak 68, margin -621)
- highestTotal: `F3-SLICE-v1/Greedy/holdout/0801` (total 6441, peak 212, margin 1807); `F3-SLICE-v1/Greedy/holdout/0343` (total 6394, peak 136, margin 1760); `F3-SLICE-v1/Greedy/holdout/0906` (total 6120, peak 140, margin 1486)
- highestPeak: `F3-SLICE-v1/Greedy/holdout/0801` (total 6441, peak 212, margin 1807); `F3-SLICE-v1/Greedy/holdout/0861` (total 5591, peak 179, margin 957); `F3-SLICE-v1/Greedy/holdout/0622` (total 5512, peak 158, margin 878)
- worstMargin: `F3-SLICE-v1/Greedy/holdout/0052` (total 4013, peak 68, margin -621); `F3-SLICE-v1/Greedy/holdout/0419` (total 4013, peak 68, margin -621); `F3-SLICE-v1/Greedy/holdout/0502` (total 4026, peak 83, margin -608)

### Greedy/train

| Stage | Reached | Paid / 1000 | Spin income P10/P50/P90/P99 | Period income P10/P50/P90/P99 | Payment margin P10/P50/P90/P99 | Pool P10/P50/P90/P99 |
|---:|---:|---:|---|---|---|---|
| 1 | 1000 | 1000 | 16/31/41/48 | 162/178/196/211 | 116/132/150/165 | 12/14/14/15 |
| 2 | 1000 | 1000 | 41/52/65/74 | 265/320/359/389 | 304/370/419/458 | 16/19/20/21 |
| 3 | 1000 | 1000 | 57/67/75/83 | 420/468/507/545 | 590/701/782/850 | 20/22/24/25 |
| 4 | 1000 | 1000 | 63/70/79/90 | 452/491/542/585 | 856/984/1103/1182 | 21/23/25/27 |
| 5 | 1000 | 1000 | 64/72/83/97 | 462/508/570/621 | 1039/1188/1352/1471 | 21/24/25/29 |
| 6 | 1000 | 1000 | 66/75/87/103 | 474/528/597/667 | 1127/1309/1517/1698 | 22/24/26/30 |
| 7 | 1000 | 1000 | 67/77/90/108 | 482/544/620/694 | 1089/1299/1560/1801 | 22/24/27/34 |
| 8 | 1000 | 1000 | 68/79/93/112 | 485/555/642/728 | 865/1124/1451/1758 | 22/24/28/35 |
| 9 | 1000 | 999 | 69/80/96/116 | 558/649/754/849 | 509/825/1225/1642 | 22/24/29/37 |
| 10 | 999 | 810 | 69/82/98/119 | 567/658/764/876 | -122/258/734/1259 | 22/24/31/41 |

Live commands: 156713; model commands: 1631331. Live command ms P10/P50/P90/P99: 1.29/2.12/5.08/8.49. Resolver log actions per spin: 2/5/11/19. First formation spin: 4/15/41/63. Mixed A/B/D formations: 349/1000. Errors: 0.
Actions: `{"spin":69992,"choose":32673,"remove":6966,"item":8999,"skip":37319,"eventA":114,"eventB":650}`.

| ID | Offer appearances | Exposed games | Selected | Acquired games | Acquired-game wins | Income contribution |
|---|---:|---:|---:|---:|---:|---:|
| amber_frond | 9979 | 1000 | 2390 | 887 | 728 | 789680 |
| ash_felt | 11245 | 1000 | 1492 | 622 | 512 | 19031 |
| brine_strip | 11127 | 1000 | 2124 | 862 | 700 | 2300 |
| clinker_router | 5190 | 995 | 198 | 179 | 132 | 11446 |
| condense_coil | 11097 | 1000 | 1733 | 996 | 810 | 48330 |
| copper_burr | 11174 | 1000 | 2506 | 863 | 693 | 245068 |
| crystal_index | 9926 | 999 | 4720 | 983 | 806 | 694487 |
| deep_still | 9928 | 1000 | 576 | 438 | 339 | 48262 |
| dew_lantern | 10048 | 1000 | 3394 | 942 | 771 | 16353 |
| event_brine_inspection | 562 | 562 | 83 | 83 | 65 | 0 |
| event_copper_queue | 2 | 2 | 1 | 1 | 0 | 0 |
| event_fog_shift | 200 | 200 | 30 | 30 | 26 | 0 |
| fog_stitcher | 9707 | 1000 | 159 | 149 | 112 | 4430 |
| furnace_auditor | 5218 | 993 | 264 | 206 | 169 | 13948 |
| heat_clerk | 9798 | 1000 | 398 | 300 | 260 | 94687 |
| item_brine_lining | 1663 | 1000 | 962 | 962 | 776 | 14960 |
| item_clean_mesh | 2936 | 1000 | 852 | 852 | 689 | 0 |
| item_dew_calendar | 2962 | 1000 | 909 | 909 | 738 | 0 |
| item_fraction_gauge | 2585 | 1000 | 911 | 911 | 744 | 77497 |
| item_frost_glass | 2534 | 1000 | 923 | 923 | 745 | 9696 |
| item_offcut_chute | 2489 | 1000 | 874 | 874 | 703 | 0 |
| item_residue_stamp | 2891 | 1000 | 856 | 856 | 688 | 226 |
| item_root_wrap | 2706 | 1000 | 907 | 907 | 740 | 8828 |
| item_sorting_apron | 2299 | 1000 | 950 | 950 | 772 | 21228 |
| item_waste_log | 2933 | 1000 | 855 | 855 | 695 | 0 |
| mist_pouch | 11020 | 1000 | 722 | 491 | 406 | 4713 |
| nursery_gauge | 5181 | 997 | 442 | 357 | 289 | 19502 |
| pearl_separator | 5248 | 996 | 666 | 546 | 432 | 22968 |
| reserve_facet | 5009 | 997 | 1193 | 764 | 653 | 78602 |
| root_ledger | 5222 | 998 | 189 | 178 | 135 | 10958 |
| saline_ampoule | 10979 | 1000 | 2323 | 910 | 743 | 71226 |
| sieve_drum | 9852 | 1000 | 578 | 437 | 336 | 46208 |
| sorting_tong | 11063 | 1000 | 1290 | 840 | 696 | 98710 |
| spent_gasket | 0 | 0 | 0 | 0 | 0 | -1949 |
| tide_prism | 9865 | 1000 | 1899 | 854 | 701 | 1892952 |
| warm_pod | 11037 | 1000 | 2465 | 929 | 748 | 350279 |
| wick_bed | 11063 | 1000 | 952 | 586 | 474 | 209412 |

Extreme seeds (full metric and final hash in statistics JSON):
- lowestTotal: `F3-SLICE-v1/Greedy/train/0544` (total 3318, peak 75, margin -94); `F3-SLICE-v1/Greedy/train/0553` (total 3964, peak 67, margin -670); `F3-SLICE-v1/Greedy/train/0141` (total 4030, peak 70, margin -604)
- highestTotal: `F3-SLICE-v1/Greedy/train/0999` (total 6648, peak 153, margin 2014); `F3-SLICE-v1/Greedy/train/0804` (total 6438, peak 187, margin 1804); `F3-SLICE-v1/Greedy/train/0475` (total 6247, peak 150, margin 1613)
- highestPeak: `F3-SLICE-v1/Greedy/train/0804` (total 6438, peak 187, margin 1804); `F3-SLICE-v1/Greedy/train/0840` (total 5831, peak 173, margin 1197); `F3-SLICE-v1/Greedy/train/0999` (total 6648, peak 153, margin 2014)
- worstMargin: `F3-SLICE-v1/Greedy/train/0553` (total 3964, peak 67, margin -670); `F3-SLICE-v1/Greedy/train/0141` (total 4030, peak 70, margin -604); `F3-SLICE-v1/Greedy/train/0541` (total 4051, peak 88, margin -583)

### Random/holdout

| Stage | Reached | Paid / 1000 | Spin income P10/P50/P90/P99 | Period income P10/P50/P90/P99 | Payment margin P10/P50/P90/P99 | Pool P10/P50/P90/P99 |
|---:|---:|---:|---|---|---|---|
| 1 | 1000 | 1000 | 13/22/30/37 | 111/129/149/170 | 65/83/103/124 | 10/12/13/14 |
| 2 | 1000 | 1000 | 25/35/46/55 | 166/210/259/294 | 155/212/275/324 | 12/15/17/19 |
| 3 | 1000 | 1000 | 32/45/58/68 | 234/317/394/443 | 264/391/523/604 | 15/18/21/23 |
| 4 | 1000 | 1000 | 40/54/65/74 | 289/379/444/489 | 363/566/737/861 | 17/21/25/28 |
| 5 | 1000 | 999 | 46/58/68/79 | 338/406/462/506 | 427/674/881/1027 | 19/24/29/33 |
| 6 | 999 | 994 | 49/59/70/82 | 350/415/472/543 | 383/679/916/1099 | 21/28/33/38 |
| 7 | 994 | 979 | 49/59/71/86 | 361/416/480/562 | 224/547/820/1030 | 24/31/37/42 |
| 8 | 979 | 795 | 49/60/72/89 | 365/420/485/567 | -100/245/547/753 | 27/35/41/45 |
| 9 | 795 | 192 | 51/60/74/92 | 430/487/564/663 | -419/-159/154/428 | 32/39/46/51 |
| 10 | 192 | 1 | 54/64/82/102 | 463/520/607/744 | -703/-577/-319/-96 | 37/44/52/62 |

Live commands: 150974; model commands: 0. Live command ms P10/P50/P90/P99: 1.1/5.11/7.67/13.38. Resolver log actions per spin: 1/4/10/18. First formation spin: 7/15/35/55. Mixed A/B/D formations: 587/1000. Errors: 0.
Actions: `{"remove":8959,"spin":61700,"choose":46450,"skip":15250,"skipItem":1956,"reroll":9503,"item":6003,"eventB":476,"eventA":677}`.

| ID | Offer appearances | Exposed games | Selected | Acquired games | Acquired-game wins | Income contribution |
|---|---:|---:|---:|---:|---:|---:|
| amber_frond | 9812 | 1000 | 2109 | 874 | 1 | 594388 |
| ash_felt | 11677 | 1000 | 2492 | 919 | 1 | 25158 |
| brine_strip | 11957 | 1000 | 2578 | 929 | 1 | 2615 |
| clinker_router | 4673 | 989 | 1017 | 625 | 1 | 25758 |
| condense_coil | 11909 | 1000 | 2510 | 930 | 1 | 59300 |
| copper_burr | 11880 | 1000 | 2564 | 928 | 1 | 210702 |
| crystal_index | 9963 | 1000 | 2211 | 883 | 1 | 186092 |
| deep_still | 9826 | 1000 | 2148 | 893 | 1 | 76672 |
| dew_lantern | 9629 | 1000 | 2175 | 882 | 1 | 20886 |
| event_brine_inspection | 695 | 695 | 463 | 463 | 1 | 0 |
| event_copper_queue | 142 | 142 | 70 | 70 | 0 | 0 |
| event_fog_shift | 316 | 316 | 144 | 144 | 0 | 0 |
| fog_stitcher | 9824 | 1000 | 2121 | 892 | 1 | 36771 |
| furnace_auditor | 4740 | 989 | 1068 | 661 | 0 | 29195 |
| heat_clerk | 9880 | 1000 | 2156 | 877 | 1 | 119769 |
| item_brine_lining | 2667 | 995 | 682 | 682 | 1 | 9768 |
| item_clean_mesh | 2242 | 983 | 533 | 533 | 0 | 0 |
| item_dew_calendar | 2728 | 995 | 677 | 677 | 1 | 0 |
| item_fraction_gauge | 2217 | 984 | 576 | 576 | 1 | 13566 |
| item_frost_glass | 2200 | 979 | 567 | 567 | 0 | 6012 |
| item_offcut_chute | 2394 | 991 | 618 | 618 | 1 | 0 |
| item_residue_stamp | 2194 | 977 | 542 | 542 | 0 | 560 |
| item_root_wrap | 2263 | 976 | 563 | 563 | 1 | 5004 |
| item_sorting_apron | 2743 | 995 | 671 | 671 | 1 | 13392 |
| item_waste_log | 2210 | 980 | 574 | 574 | 1 | 0 |
| mist_pouch | 11758 | 1000 | 2561 | 919 | 1 | 6372 |
| nursery_gauge | 4648 | 984 | 1010 | 640 | 1 | 24378 |
| pearl_separator | 4666 | 993 | 1018 | 646 | 1 | 24938 |
| reserve_facet | 4803 | 995 | 1025 | 642 | 1 | 49318 |
| root_ledger | 4883 | 992 | 1065 | 649 | 0 | 29344 |
| saline_ampoule | 11761 | 1000 | 2606 | 930 | 1 | 169188 |
| sieve_drum | 9785 | 1000 | 2156 | 897 | 1 | 73302 |
| sorting_tong | 11812 | 1000 | 2460 | 927 | 1 | 120203 |
| spent_gasket | 0 | 0 | 0 | 0 | 0 | -11296 |
| tide_prism | 9942 | 1000 | 2263 | 890 | 1 | 830444 |
| warm_pod | 11899 | 1000 | 2609 | 914 | 1 | 189413 |
| wick_bed | 11882 | 1000 | 2528 | 938 | 1 | 223418 |

Extreme seeds (full metric and final hash in statistics JSON):
- lowestTotal: `F3-SLICE-v1/Random/holdout/0382` (total 701, peak 40, margin -71); `F3-SLICE-v1/Random/holdout/0388` (total 1073, peak 61, margin -109); `F3-SLICE-v1/Random/holdout/0118` (total 1115, peak 59, margin -67)
- highestTotal: `F3-SLICE-v1/Random/holdout/0077` (total 4697, peak 95, margin 63); `F3-SLICE-v1/Random/holdout/0910` (total 4538, peak 122, margin -96); `F3-SLICE-v1/Random/holdout/0452` (total 4519, peak 97, margin -119)
- highestPeak: `F3-SLICE-v1/Random/holdout/0948` (total 4350, peak 144, margin -284); `F3-SLICE-v1/Random/holdout/0753` (total 4163, peak 127, margin -471); `F3-SLICE-v1/Random/holdout/0914` (total 4511, peak 127, margin -123)
- worstMargin: `F3-SLICE-v1/Random/holdout/0933` (total 3852, peak 78, margin -782); `F3-SLICE-v1/Random/holdout/0057` (total 3858, peak 86, margin -776); `F3-SLICE-v1/Random/holdout/0607` (total 3868, peak 72, margin -766)

### Random/train

| Stage | Reached | Paid / 1000 | Spin income P10/P50/P90/P99 | Period income P10/P50/P90/P99 | Payment margin P10/P50/P90/P99 | Pool P10/P50/P90/P99 |
|---:|---:|---:|---|---|---|---|
| 1 | 1000 | 1000 | 13/22/30/37 | 112/128/150/168 | 66/82/104/122 | 10/12/13/14 |
| 2 | 1000 | 1000 | 25/34/45/56 | 164/207/256/294 | 154/208/272/321 | 12/15/17/19 |
| 3 | 1000 | 1000 | 32/45/58/69 | 233/315/393/439 | 262/388/517/616 | 14/18/21/24 |
| 4 | 1000 | 1000 | 39/54/65/74 | 285/376/440/489 | 354/553/742/865 | 17/21/25/27 |
| 5 | 1000 | 1000 | 45/58/68/79 | 327/406/464/513 | 393/660/887/1033 | 19/24/28/32 |
| 6 | 1000 | 996 | 48/59/69/83 | 345/412/468/517 | 362/666/924/1093 | 22/28/32/36 |
| 7 | 996 | 971 | 49/59/70/83 | 357/417/474/531 | 190/533/815/1019 | 24/31/37/41 |
| 8 | 971 | 782 | 49/59/72/87 | 362/418/479/551 | -114/227/536/815 | 27/34/41/45 |
| 9 | 782 | 184 | 50/60/73/91 | 430/483/554/645 | -412/-172/138/444 | 32/39/46/52 |
| 10 | 184 | 3 | 54/64/80/102 | 458/515/607/755 | -714/-593/-312/157 | 35/43/51/62 |

Live commands: 150485; model commands: 0. Live command ms P10/P50/P90/P99: 1.11/4.71/7.67/13.26. Resolver log actions per spin: 1/4/10/17. First formation spin: 7/16/34/55. Mixed A/B/D formations: 548/1000. Errors: 0.
Actions: `{"remove":8933,"spin":61497,"choose":46137,"reroll":9440,"skip":15360,"item":5993,"eventA":697,"skipItem":1940,"eventB":488}`.

| ID | Offer appearances | Exposed games | Selected | Acquired games | Acquired-game wins | Income contribution |
|---|---:|---:|---:|---:|---:|---:|
| amber_frond | 9713 | 1000 | 2089 | 877 | 3 | 592260 |
| ash_felt | 11841 | 1000 | 2464 | 931 | 3 | 23794 |
| brine_strip | 11807 | 1000 | 2534 | 932 | 3 | 2587 |
| clinker_router | 4620 | 990 | 1056 | 667 | 3 | 25416 |
| condense_coil | 11776 | 1000 | 2610 | 910 | 3 | 63109 |
| copper_burr | 11683 | 1000 | 2537 | 929 | 3 | 207678 |
| crystal_index | 9934 | 999 | 2210 | 869 | 3 | 189974 |
| deep_still | 9723 | 1000 | 2123 | 873 | 2 | 74866 |
| dew_lantern | 9922 | 1000 | 2170 | 894 | 3 | 20832 |
| event_brine_inspection | 660 | 660 | 425 | 425 | 2 | 0 |
| event_copper_queue | 163 | 163 | 81 | 81 | 1 | 0 |
| event_fog_shift | 362 | 362 | 191 | 191 | 0 | 0 |
| fog_stitcher | 9788 | 1000 | 2127 | 896 | 2 | 36911 |
| furnace_auditor | 4625 | 983 | 991 | 624 | 3 | 24447 |
| heat_clerk | 9717 | 1000 | 2144 | 877 | 3 | 111015 |
| item_brine_lining | 2596 | 997 | 679 | 679 | 2 | 9452 |
| item_clean_mesh | 2217 | 980 | 578 | 578 | 1 | 0 |
| item_dew_calendar | 2812 | 994 | 658 | 658 | 2 | 0 |
| item_fraction_gauge | 2250 | 979 | 564 | 564 | 3 | 14182 |
| item_frost_glass | 2242 | 980 | 556 | 556 | 1 | 5895 |
| item_offcut_chute | 2386 | 991 | 592 | 592 | 2 | 0 |
| item_residue_stamp | 2279 | 976 | 556 | 556 | 2 | 596 |
| item_root_wrap | 2112 | 968 | 570 | 570 | 1 | 5312 |
| item_sorting_apron | 2712 | 990 | 675 | 675 | 2 | 12561 |
| item_waste_log | 2166 | 975 | 565 | 565 | 0 | 0 |
| mist_pouch | 11740 | 1000 | 2578 | 918 | 2 | 6446 |
| nursery_gauge | 4716 | 990 | 1009 | 638 | 3 | 24125 |
| pearl_separator | 4780 | 989 | 1048 | 657 | 2 | 25220 |
| reserve_facet | 4775 | 992 | 1058 | 658 | 1 | 48806 |
| root_ledger | 4717 | 990 | 1011 | 652 | 2 | 26690 |
| saline_ampoule | 11788 | 1000 | 2492 | 909 | 3 | 164464 |
| sieve_drum | 9738 | 1000 | 2121 | 894 | 3 | 70224 |
| sorting_tong | 12023 | 1000 | 2606 | 928 | 3 | 123371 |
| spent_gasket | 0 | 0 | 0 | 0 | 0 | -11058 |
| tide_prism | 9929 | 1000 | 2118 | 887 | 3 | 831893 |
| warm_pod | 11735 | 1000 | 2514 | 920 | 3 | 179420 |
| wick_bed | 11721 | 1000 | 2527 | 926 | 1 | 222810 |

Extreme seeds (full metric and final hash in statistics JSON):
- lowestTotal: `F3-SLICE-v1/Random/train/0334` (total 1053, peak 41, margin -129); `F3-SLICE-v1/Random/train/0922` (total 1141, peak 52, margin -41); `F3-SLICE-v1/Random/train/0180` (total 1150, peak 48, margin -32)
- highestTotal: `F3-SLICE-v1/Random/train/0395` (total 4820, peak 108, margin 186); `F3-SLICE-v1/Random/train/0533` (total 4791, peak 123, margin 157); `F3-SLICE-v1/Random/train/0477` (total 4676, peak 113, margin 42)
- highestPeak: `F3-SLICE-v1/Random/train/0791` (total 4137, peak 144, margin -497); `F3-SLICE-v1/Random/train/0913` (total 4468, peak 134, margin -166); `F3-SLICE-v1/Random/train/0761` (total 4417, peak 131, margin -217)
- worstMargin: `F3-SLICE-v1/Random/train/0059` (total 3844, peak 90, margin -790); `F3-SLICE-v1/Random/train/0880` (total 3860, peak 77, margin -778); `F3-SLICE-v1/Random/train/0854` (total 3871, peak 68, margin -763)

### Synergy/holdout

| Stage | Reached | Paid / 1000 | Spin income P10/P50/P90/P99 | Period income P10/P50/P90/P99 | Payment margin P10/P50/P90/P99 | Pool P10/P50/P90/P99 |
|---:|---:|---:|---|---|---|---|
| 1 | 1000 | 1000 | 17/30/39/47 | 158/173/192/205 | 112/127/146/159 | 12/13/14/14 |
| 2 | 1000 | 1000 | 37/48/60/70 | 248/290/337/358 | 282/339/392/418 | 15/18/20/20 |
| 3 | 1000 | 1000 | 52/64/73/85 | 383/449/491/537 | 539/647/736/796 | 17/22/24/25 |
| 4 | 1000 | 1000 | 58/68/80/95 | 419/482/535/597 | 772/922/1042/1153 | 19/23/25/28 |
| 5 | 1000 | 1000 | 59/71/85/103 | 429/500/573/659 | 933/1126/1290/1476 | 20/23/26/31 |
| 6 | 1000 | 1000 | 59/72/89/106 | 429/509/605/694 | 987/1222/1456/1686 | 20/24/26/32 |
| 7 | 1000 | 1000 | 60/74/93/113 | 431/516/635/744 | 888/1186/1512/1813 | 21/24/27/35 |
| 8 | 1000 | 998 | 59/76/98/118 | 427/533/676/795 | 630/987/1439/1824 | 22/24/29/36 |
| 9 | 998 | 971 | 60/80/104/129 | 491/631/815/1036 | 211/665/1286/1830 | 24/24/31/40 |
| 10 | 971 | 564 | 61/83/109/139 | 506/654/864/1060 | -440/108/920/1710 | 24/26/34/42 |

Live commands: 168481; model commands: 0. Live command ms P10/P50/P90/P99: 1.34/4.93/7.62/12.95. Resolver log actions per spin: 2/6/11/18. First formation spin: 7/7/20/29. Mixed A/B/D formations: 192/1000. Errors: 0.
Actions: `{"remove":8578,"spin":69752,"choose":39341,"item":4442,"reroll":10969,"skip":30411,"skipItem":4527,"eventA":297,"eventB":164}`.

| ID | Offer appearances | Exposed games | Selected | Acquired games | Acquired-game wins | Income contribution |
|---|---:|---:|---:|---:|---:|---:|
| amber_frond | 11422 | 1000 | 2897 | 904 | 508 | 579188 |
| ash_felt | 12670 | 1000 | 39 | 39 | 20 | 11324 |
| brine_strip | 12603 | 1000 | 470 | 374 | 229 | 1335 |
| clinker_router | 6109 | 997 | 56 | 55 | 29 | 4266 |
| condense_coil | 12662 | 1000 | 1343 | 983 | 558 | 33499 |
| copper_burr | 12601 | 1000 | 2539 | 856 | 474 | 124906 |
| crystal_index | 11497 | 1000 | 8001 | 961 | 557 | 1126916 |
| deep_still | 11545 | 1000 | 459 | 389 | 232 | 41802 |
| dew_lantern | 11461 | 1000 | 1796 | 813 | 463 | 20391 |
| event_brine_inspection | 266 | 266 | 102 | 102 | 61 | 0 |
| event_fog_shift | 195 | 195 | 195 | 195 | 117 | 0 |
| fog_stitcher | 11539 | 1000 | 2 | 2 | 1 | 41 |
| furnace_auditor | 6019 | 999 | 239 | 184 | 94 | 18923 |
| heat_clerk | 11450 | 1000 | 1331 | 535 | 302 | 160982 |
| item_brine_lining | 3505 | 998 | 431 | 431 | 237 | 4104 |
| item_clean_mesh | 3397 | 988 | 0 | 0 | 0 | 0 |
| item_dew_calendar | 1015 | 999 | 996 | 996 | 562 | 0 |
| item_fraction_gauge | 1439 | 976 | 960 | 960 | 544 | 164227 |
| item_frost_glass | 3217 | 983 | 55 | 55 | 31 | 375 |
| item_offcut_chute | 3246 | 998 | 354 | 354 | 208 | 0 |
| item_residue_stamp | 3111 | 985 | 98 | 98 | 69 | 34 |
| item_root_wrap | 1134 | 983 | 967 | 967 | 544 | 4380 |
| item_sorting_apron | 3355 | 999 | 581 | 581 | 335 | 8622 |
| item_waste_log | 3488 | 986 | 0 | 0 | 0 | 0 |
| mist_pouch | 12823 | 1000 | 2003 | 866 | 496 | 6668 |
| nursery_gauge | 5872 | 996 | 3245 | 797 | 387 | 147278 |
| pearl_separator | 6074 | 997 | 47 | 46 | 6 | 2852 |
| reserve_facet | 6068 | 995 | 1431 | 964 | 549 | 166576 |
| root_ledger | 6009 | 997 | 4515 | 880 | 458 | 136469 |
| saline_ampoule | 12742 | 1000 | 526 | 396 | 235 | 60602 |
| sieve_drum | 11554 | 1000 | 204 | 178 | 100 | 16592 |
| sorting_tong | 12745 | 1000 | 1259 | 913 | 509 | 78641 |
| spent_gasket | 0 | 0 | 0 | 0 | 0 | 0 |
| tide_prism | 11468 | 1000 | 2796 | 906 | 515 | 1376986 |
| warm_pod | 12692 | 1000 | 3656 | 953 | 533 | 366109 |
| wick_bed | 12538 | 1000 | 487 | 379 | 218 | 111120 |

Extreme seeds (full metric and final hash in statistics JSON):
- lowestTotal: `F3-SLICE-v1/Synergy/holdout/0465` (total 2330, peak 74, margin -133); `F3-SLICE-v1/Synergy/holdout/0569` (total 2415, peak 69, margin -48); `F3-SLICE-v1/Synergy/holdout/0040` (total 3058, peak 80, margin -354)
- highestTotal: `F3-SLICE-v1/Synergy/holdout/0872` (total 7383, peak 181, margin 2745); `F3-SLICE-v1/Synergy/holdout/0463` (total 7310, peak 190, margin 2676); `F3-SLICE-v1/Synergy/holdout/0171` (total 7141, peak 204, margin 2507)
- highestPeak: `F3-SLICE-v1/Synergy/holdout/0166` (total 6615, peak 236, margin 1977); `F3-SLICE-v1/Synergy/holdout/0171` (total 7141, peak 204, margin 2507); `F3-SLICE-v1/Synergy/holdout/0775` (total 5801, peak 199, margin 1167)
- worstMargin: `F3-SLICE-v1/Synergy/holdout/0458` (total 3802, peak 71, margin -832); `F3-SLICE-v1/Synergy/holdout/0776` (total 3813, peak 87, margin -825); `F3-SLICE-v1/Synergy/holdout/0083` (total 3861, peak 73, margin -777)

### Synergy/train

| Stage | Reached | Paid / 1000 | Spin income P10/P50/P90/P99 | Period income P10/P50/P90/P99 | Payment margin P10/P50/P90/P99 | Pool P10/P50/P90/P99 |
|---:|---:|---:|---|---|---|---|
| 1 | 1000 | 1000 | 17/30/39/46 | 158/173/190/204 | 112/127/144/158 | 12/13/14/14 |
| 2 | 1000 | 1000 | 38/48/60/69 | 250/291/335/358 | 286/337/388/423 | 15/18/20/20 |
| 3 | 1000 | 1000 | 53/64/72/86 | 392/447/490/530 | 552/647/728/788 | 17/22/24/25 |
| 4 | 1000 | 1000 | 57/68/79/95 | 420/477/531/599 | 783/914/1037/1145 | 19/23/25/27 |
| 5 | 1000 | 1000 | 59/70/85/100 | 430/496/568/641 | 939/1109/1279/1443 | 20/23/26/30 |
| 6 | 1000 | 1000 | 59/72/89/106 | 429/504/597/692 | 987/1203/1439/1702 | 20/24/26/30 |
| 7 | 1000 | 1000 | 59/74/93/112 | 427/513/630/768 | 891/1162/1488/1875 | 21/24/27/32 |
| 8 | 1000 | 1000 | 60/76/97/117 | 433/534/674/785 | 625/960/1383/1920 | 22/24/28/36 |
| 9 | 1000 | 982 | 60/79/102/122 | 495/628/806/945 | 214/637/1232/1962 | 24/24/30/40 |
| 10 | 982 | 546 | 61/81/108/128 | 498/649/854/994 | -435/70/848/1724 | 24/26/33/43 |

Live commands: 168697; model commands: 0. Live command ms P10/P50/P90/P99: 1.33/5.04/7.63/12.82. Resolver log actions per spin: 2/5/11/18. First formation spin: 7/7/20/34. Mixed A/B/D formations: 170/1000. Errors: 0.
Actions: `{"remove":8538,"spin":69856,"choose":39431,"item":4401,"reroll":10982,"skip":30425,"eventA":294,"skipItem":4581,"eventB":189}`.

| ID | Offer appearances | Exposed games | Selected | Acquired games | Acquired-game wins | Income contribution |
|---|---:|---:|---:|---:|---:|---:|
| amber_frond | 11606 | 1000 | 2891 | 917 | 500 | 585180 |
| ash_felt | 12808 | 1000 | 26 | 26 | 16 | 10778 |
| brine_strip | 12797 | 1000 | 510 | 403 | 249 | 1358 |
| clinker_router | 6148 | 1000 | 50 | 50 | 34 | 3768 |
| condense_coil | 12631 | 1000 | 1366 | 979 | 541 | 33420 |
| copper_burr | 12776 | 1000 | 2651 | 851 | 462 | 124998 |
| crystal_index | 11584 | 1000 | 7871 | 969 | 545 | 1091283 |
| deep_still | 11453 | 1000 | 491 | 403 | 236 | 43830 |
| dew_lantern | 11427 | 1000 | 1710 | 797 | 442 | 19998 |
| event_brine_inspection | 296 | 296 | 107 | 107 | 55 | 0 |
| event_fog_shift | 187 | 187 | 187 | 187 | 118 | 0 |
| fog_stitcher | 11655 | 1000 | 1 | 1 | 0 | 11 |
| furnace_auditor | 5989 | 997 | 250 | 205 | 111 | 19248 |
| heat_clerk | 11474 | 1000 | 1257 | 496 | 270 | 142718 |
| item_brine_lining | 3434 | 999 | 450 | 450 | 252 | 4808 |
| item_clean_mesh | 3443 | 982 | 0 | 0 | 0 | 0 |
| item_dew_calendar | 1019 | 996 | 993 | 993 | 540 | 0 |
| item_fraction_gauge | 1429 | 972 | 955 | 955 | 527 | 161644 |
| item_frost_glass | 3325 | 982 | 40 | 40 | 26 | 267 |
| item_offcut_chute | 3317 | 999 | 351 | 351 | 194 | 0 |
| item_residue_stamp | 3083 | 991 | 93 | 93 | 50 | 24 |
| item_root_wrap | 1137 | 973 | 951 | 951 | 517 | 3788 |
| item_sorting_apron | 3369 | 998 | 568 | 568 | 310 | 6909 |
| item_waste_log | 3390 | 987 | 0 | 0 | 0 | 0 |
| mist_pouch | 12493 | 1000 | 1918 | 861 | 477 | 6569 |
| nursery_gauge | 5968 | 997 | 3340 | 819 | 373 | 151316 |
| pearl_separator | 6148 | 996 | 50 | 50 | 9 | 3056 |
| reserve_facet | 6115 | 1000 | 1478 | 968 | 539 | 164920 |
| root_ledger | 6023 | 997 | 4620 | 886 | 439 | 156200 |
| saline_ampoule | 12500 | 1000 | 525 | 398 | 243 | 66352 |
| sieve_drum | 11327 | 1000 | 247 | 217 | 124 | 20270 |
| sorting_tong | 12713 | 1000 | 1259 | 903 | 480 | 74033 |
| spent_gasket | 0 | 0 | 0 | 0 | 0 | 0 |
| tide_prism | 11498 | 1000 | 2810 | 913 | 502 | 1380577 |
| warm_pod | 12632 | 1000 | 3590 | 947 | 505 | 360348 |
| wick_bed | 12749 | 1000 | 520 | 399 | 217 | 116468 |

Extreme seeds (full metric and final hash in statistics JSON):
- lowestTotal: `F3-SLICE-v1/Synergy/train/0805` (total 2994, peak 79, margin -418); `F3-SLICE-v1/Synergy/train/0671` (total 3150, peak 74, margin -262); `F3-SLICE-v1/Synergy/train/0245` (total 3170, peak 81, margin -242)
- highestTotal: `F3-SLICE-v1/Synergy/train/0968` (total 7852, peak 239, margin 3218); `F3-SLICE-v1/Synergy/train/0078` (total 7767, peak 245, margin 3133); `F3-SLICE-v1/Synergy/train/0506` (total 7569, peak 191, margin 2935)
- highestPeak: `F3-SLICE-v1/Synergy/train/0078` (total 7767, peak 245, margin 3133); `F3-SLICE-v1/Synergy/train/0968` (total 7852, peak 239, margin 3218); `F3-SLICE-v1/Synergy/train/0639` (total 5059, peak 212, margin 425)
- worstMargin: `F3-SLICE-v1/Synergy/train/0575` (total 3830, peak 99, margin -804); `F3-SLICE-v1/Synergy/train/0275` (total 3833, peak 71, margin -801); `F3-SLICE-v1/Synergy/train/0893` (total 3866, peak 76, margin -768)

### Value/holdout

| Stage | Reached | Paid / 1000 | Spin income P10/P50/P90/P99 | Period income P10/P50/P90/P99 | Payment margin P10/P50/P90/P99 | Pool P10/P50/P90/P99 |
|---:|---:|---:|---|---|---|---|
| 1 | 1000 | 1000 | 17/29/36/40 | 154/162/172/184 | 108/116/126/138 | 13/14/14/14 |
| 2 | 1000 | 1000 | 38/46/55/63 | 250/277/302/332 | 279/312/344/383 | 18/20/20/20 |
| 3 | 1000 | 1000 | 51/58/64/72 | 364/405/441/484 | 507/578/640/717 | 22/24/24/25 |
| 4 | 1000 | 1000 | 56/64/70/76 | 394/443/478/507 | 704/816/906/1003 | 24/25/27/30 |
| 5 | 1000 | 1000 | 60/66/72/78 | 422/468/500/530 | 835/981/1104/1232 | 24/27/30/33 |
| 6 | 1000 | 1000 | 63/70/74/80 | 448/488/516/538 | 868/1060/1204/1366 | 24/29/33/36 |
| 7 | 1000 | 1000 | 66/72/76/80 | 462/504/528/548 | 780/1009/1179/1349 | 25/31/35/39 |
| 8 | 1000 | 999 | 68/74/78/80 | 476/516/538/552 | 545/796/991/1169 | 26/33/37/42 |
| 9 | 999 | 954 | 70/76/78/80 | 564/600/626/640 | 157/444/665/860 | 26/34/40/45 |
| 10 | 954 | 173 | 72/76/80/80 | 582/610/632/640 | -420/-156/83/275 | 26/35/42/48 |

Live commands: 170082; model commands: 0. Live command ms P10/P50/P90/P99: 1.15/4.93/7.33/11.82. Resolver log actions per spin: 0/0/5/12. First formation spin: 7/7/20/34. Mixed A/B/D formations: 42/1000. Errors: 0.
Actions: `{"remove":9649,"spin":69624,"choose":37545,"item":6067,"reroll":10953,"skip":32079,"skipItem":2886,"eventA":1122,"eventB":157}`.

| ID | Offer appearances | Exposed games | Selected | Acquired games | Acquired-game wins | Income contribution |
|---|---:|---:|---:|---:|---:|---:|
| amber_frond | 11360 | 1000 | 9696 | 1000 | 173 | 2385344 |
| ash_felt | 12712 | 1000 | 345 | 286 | 29 | 11681 |
| brine_strip | 12623 | 1000 | 1227 | 717 | 97 | 2156 |
| clinker_router | 6027 | 998 | 71 | 68 | 8 | 5968 |
| condense_coil | 12619 | 1000 | 72 | 69 | 52 | 1028 |
| copper_burr | 12647 | 1000 | 1222 | 729 | 102 | 233076 |
| crystal_index | 11748 | 1000 | 27 | 27 | 3 | 1948 |
| deep_still | 11449 | 1000 | 399 | 330 | 23 | 37424 |
| dew_lantern | 11376 | 1000 | 6061 | 998 | 171 | 32739 |
| event_brine_inspection | 897 | 897 | 741 | 741 | 125 | 0 |
| event_fog_shift | 382 | 382 | 381 | 381 | 40 | 0 |
| fog_stitcher | 11436 | 1000 | 28 | 28 | 3 | 380 |
| furnace_auditor | 5935 | 994 | 69 | 69 | 11 | 5882 |
| heat_clerk | 11427 | 1000 | 24 | 23 | 1 | 350 |
| item_brine_lining | 1555 | 1000 | 973 | 973 | 148 | 536 |
| item_clean_mesh | 4256 | 993 | 0 | 0 | 0 | 0 |
| item_dew_calendar | 1075 | 1000 | 999 | 999 | 173 | 0 |
| item_fraction_gauge | 2078 | 996 | 984 | 984 | 171 | 287 |
| item_frost_glass | 3936 | 998 | 161 | 161 | 12 | 1599 |
| item_offcut_chute | 2440 | 999 | 756 | 756 | 118 | 0 |
| item_residue_stamp | 3488 | 996 | 311 | 311 | 28 | 128 |
| item_root_wrap | 1207 | 992 | 988 | 988 | 171 | 21572 |
| item_sorting_apron | 2611 | 1000 | 895 | 895 | 153 | 162 |
| item_waste_log | 4187 | 998 | 0 | 0 | 0 | 0 |
| mist_pouch | 12617 | 1000 | 5045 | 994 | 168 | 10239 |
| nursery_gauge | 6014 | 997 | 71 | 70 | 7 | 7840 |
| pearl_separator | 5869 | 999 | 59 | 55 | 10 | 4654 |
| reserve_facet | 5887 | 998 | 78 | 64 | 1 | 19068 |
| root_ledger | 5947 | 999 | 4 | 4 | 4 | 1879 |
| saline_ampoule | 12665 | 1000 | 1228 | 726 | 101 | 439232 |
| sieve_drum | 11507 | 1000 | 422 | 353 | 52 | 35598 |
| sorting_tong | 12703 | 1000 | 77 | 71 | 11 | 3077 |
| spent_gasket | 0 | 0 | 0 | 0 | 0 | 0 |
| tide_prism | 11607 | 1000 | 10014 | 1000 | 173 | 975790 |
| warm_pod | 12755 | 1000 | 65 | 64 | 9 | 3293 |
| wick_bed | 12801 | 1000 | 1241 | 723 | 99 | 171184 |

Extreme seeds (full metric and final hash in statistics JSON):
- lowestTotal: `F3-SLICE-v1/Value/holdout/0607` (total 2447, peak 69, margin -16); `F3-SLICE-v1/Value/holdout/0398` (total 2903, peak 75, margin -513); `F3-SLICE-v1/Value/holdout/0608` (total 2948, peak 72, margin -464)
- highestTotal: `F3-SLICE-v1/Value/holdout/0104` (total 4970, peak 80, margin 336); `F3-SLICE-v1/Value/holdout/0115` (total 4970, peak 81, margin 336); `F3-SLICE-v1/Value/holdout/0899` (total 4963, peak 80, margin 329)
- highestPeak: `F3-SLICE-v1/Value/holdout/0896` (total 3404, peak 108, margin -12); `F3-SLICE-v1/Value/holdout/0790` (total 4724, peak 104, margin 90); `F3-SLICE-v1/Value/holdout/0712` (total 4597, peak 101, margin -41)
- worstMargin: `F3-SLICE-v1/Value/holdout/0002` (total 3918, peak 84, margin -720); `F3-SLICE-v1/Value/holdout/0377` (total 3921, peak 88, margin -713); `F3-SLICE-v1/Value/holdout/0004` (total 3931, peak 88, margin -707)

### Value/train

| Stage | Reached | Paid / 1000 | Spin income P10/P50/P90/P99 | Period income P10/P50/P90/P99 | Payment margin P10/P50/P90/P99 | Pool P10/P50/P90/P99 |
|---:|---:|---:|---|---|---|---|
| 1 | 1000 | 1000 | 17/29/35/40 | 154/162/173/183 | 108/116/127/137 | 13/14/14/14 |
| 2 | 1000 | 1000 | 38/46/55/62 | 252/278/302/329 | 282/312/342/373 | 18/20/20/20 |
| 3 | 1000 | 1000 | 51/58/64/72 | 370/405/443/476 | 520/582/641/706 | 22/24/24/25 |
| 4 | 1000 | 1000 | 56/64/70/74 | 403/443/480/510 | 722/814/910/1001 | 24/25/28/29 |
| 5 | 1000 | 1000 | 60/68/72/78 | 430/470/500/524 | 859/983/1110/1219 | 24/27/31/33 |
| 6 | 1000 | 1000 | 64/70/75/78 | 452/490/518/538 | 906/1061/1213/1347 | 25/29/33/37 |
| 7 | 1000 | 1000 | 66/72/76/80 | 471/506/529/548 | 827/1012/1190/1334 | 26/31/36/39 |
| 8 | 1000 | 1000 | 68/74/78/80 | 482/516/538/554 | 579/800/1001/1156 | 27/33/38/42 |
| 9 | 1000 | 977 | 70/76/78/80 | 570/602/626/640 | 206/452/674/845 | 26/35/41/45 |
| 10 | 977 | 195 | 72/76/80/80 | 586/612/638/640 | -404/-151/92/264 | 26/36/43/48 |

Live commands: 170641; model commands: 0. Live command ms P10/P50/P90/P99: 1.15/4.95/7.34/11.81. Resolver log actions per spin: 0/0/5/11. First formation spin: 7/7/20/41. Mixed A/B/D formations: 32/1000. Errors: 0.
Actions: `{"remove":9771,"spin":69816,"choose":37648,"item":6040,"reroll":10976,"skipItem":2937,"skip":32168,"eventA":1126,"eventB":159}`.

| ID | Offer appearances | Exposed games | Selected | Acquired games | Acquired-game wins | Income contribution |
|---|---:|---:|---:|---:|---:|---:|
| amber_frond | 11563 | 1000 | 9819 | 1000 | 195 | 2436412 |
| ash_felt | 12778 | 1000 | 353 | 302 | 57 | 11666 |
| brine_strip | 12769 | 1000 | 1193 | 712 | 106 | 2139 |
| clinker_router | 5887 | 999 | 60 | 60 | 12 | 4990 |
| condense_coil | 12607 | 1000 | 64 | 63 | 52 | 887 |
| copper_burr | 12642 | 1000 | 1190 | 713 | 123 | 225992 |
| crystal_index | 11867 | 1000 | 22 | 22 | 6 | 1085 |
| deep_still | 11429 | 1000 | 386 | 328 | 27 | 36068 |
| dew_lantern | 11624 | 1000 | 6185 | 999 | 194 | 32271 |
| event_brine_inspection | 886 | 886 | 727 | 727 | 143 | 0 |
| event_fog_shift | 399 | 399 | 399 | 399 | 54 | 0 |
| fog_stitcher | 11417 | 1000 | 20 | 20 | 1 | 264 |
| furnace_auditor | 6068 | 998 | 77 | 71 | 5 | 6396 |
| heat_clerk | 11506 | 1000 | 21 | 19 | 3 | 436 |
| item_brine_lining | 1593 | 999 | 971 | 971 | 171 | 444 |
| item_clean_mesh | 4186 | 1000 | 0 | 0 | 0 | 0 |
| item_dew_calendar | 1046 | 1000 | 1000 | 1000 | 195 | 0 |
| item_fraction_gauge | 2006 | 994 | 980 | 980 | 190 | 0 |
| item_frost_glass | 3924 | 998 | 163 | 163 | 11 | 1485 |
| item_offcut_chute | 2478 | 1000 | 745 | 745 | 145 | 0 |
| item_residue_stamp | 3507 | 994 | 318 | 318 | 26 | 108 |
| item_root_wrap | 1192 | 998 | 994 | 994 | 195 | 20680 |
| item_sorting_apron | 2723 | 1000 | 869 | 869 | 163 | 63 |
| item_waste_log | 4242 | 997 | 0 | 0 | 0 | 0 |
| mist_pouch | 12493 | 1000 | 4826 | 996 | 193 | 9986 |
| nursery_gauge | 6055 | 999 | 72 | 71 | 13 | 7650 |
| pearl_separator | 5882 | 999 | 68 | 66 | 9 | 5602 |
| reserve_facet | 5994 | 997 | 69 | 56 | 3 | 14142 |
| root_ledger | 6047 | 999 | 6 | 6 | 2 | 2022 |
| saline_ampoule | 12352 | 1000 | 1179 | 705 | 113 | 427126 |
| sieve_drum | 11389 | 1000 | 388 | 327 | 60 | 32412 |
| sorting_tong | 12746 | 1000 | 73 | 70 | 15 | 2635 |
| spent_gasket | 0 | 0 | 0 | 0 | 0 | 0 |
| tide_prism | 11949 | 1000 | 10278 | 1000 | 195 | 991153 |
| warm_pod | 12662 | 1000 | 55 | 52 | 9 | 2459 |
| wick_bed | 12650 | 1000 | 1244 | 726 | 108 | 172560 |

Extreme seeds (full metric and final hash in statistics JSON):
- lowestTotal: `F3-SLICE-v1/Value/train/0145` (total 3120, peak 82, margin -292); `F3-SLICE-v1/Value/train/0603` (total 3123, peak 78, margin -289); `F3-SLICE-v1/Value/train/0717` (total 3131, peak 82, margin -285)
- highestTotal: `F3-SLICE-v1/Value/train/0487` (total 4974, peak 80, margin 336); `F3-SLICE-v1/Value/train/0183` (total 4939, peak 80, margin 305); `F3-SLICE-v1/Value/train/0788` (total 4936, peak 96, margin 302)
- highestPeak: `F3-SLICE-v1/Value/train/0597` (total 4608, peak 111, margin -30); `F3-SLICE-v1/Value/train/0147` (total 4569, peak 104, margin -65); `F3-SLICE-v1/Value/train/0894` (total 4607, peak 100, margin -27)
- worstMargin: `F3-SLICE-v1/Value/train/0088` (total 3944, peak 85, margin -694); `F3-SLICE-v1/Value/train/0532` (total 3952, peak 82, margin -686); `F3-SLICE-v1/Value/train/0205` (total 3963, peak 86, margin -675)

## Interpretation

The observed strategy spread is material: random legal action sampling is extremely weak, value selection is substantially below synergy selection, and finite lookahead must be interpreted against its higher command cost and stated pruning/model limitations. These rates are slice observations, not hard failures against formal Normal targets. No production balance, policy, seed, or design parameter was tuned after the pilot or during train/holdout.

Greedy evaluates all choose/skip/item/skipItem/event candidates plus the one deterministic preferred remove/reroll candidate, rather than exhaustively searching every removal target. READY spins directly unless the deterministic policy recommends removal. The horizon is at most two future spins / 14 model commands, one common synthetic RNG sample per candidate. Future generated offers are always skipped. Terminal and inventory terms are heuristic evaluation of real simulated outcomes. This is bounded/pruned lookahead, not an optimal bot, hidden-RNG oracle, or exhaustive tree search.

Per-ID totals are recorded by actual ledger/log source identity. Acquisition origins classify UIDs first seen in initial state, choice, event, or generated spin state; transformations preserve original UID acquisition classification. Event selections are not symbols/items. Event A effects without an emitted ledger contribution are not assigned invented income. Exposures count offer appearances, including rerolls, so selected/exposure rates are not independent Bernoulli trials; acquired-game win rates are conditional and confounded by acquisition stage/build/survivorship. Full acquisition strata and source-stage contribution tables remain in statistics JSON.

Human validation remains pending manual play. An independent simulator review is required before extending to the full content gate. Art/audio remain deferred.

## Deliverables

- `f3-slice-sim-engine.js`: strategy and finite-lookahead implementation.
- `f3-slice-sim-run.js`: complete-game JSONL runner.
- `f3-slice-sim-checks.js`: focused simulator/API checks.
- `f3-slice-sim-seeds.js`: fixed 8,000-entry seed/policy index.
- `f3-slice-sim-stats.js`: verification and aggregate statistics.
- `f3-slice-sim-*.jsonl` and matching `-index.json`: raw games and byte indexes.

## GDD Gate Assessment

- **scope**: ceil65% Normal 24/10/3 slice; NOT full F4 acceptance
- **functional**: Not re-run; F2 independent PASS is prior slice evidence, not full definitions gate
- **transaction**: 9 focused simulator checks passed; no claim of complete Node/Chrome/Edge file/HTTP transaction gate
- **sampling**: PASS slice only: 4 x (1000 train +1000 holdout), 8000 disjoint fixed seeds, independent policy RNG, no rejected seeds
- **actions**: All actual legal command API used and counted; Greedy recorded zero reroll and zero skipItem. Availability is not evidence that every bot exercises every command. Greedy reroll continuation is conservatively skipped; warrants independent policy/tool audit.
- **lookahead**: PASS bounded real-command clone lookahead; one synthetic sample, two spins/14 commands, pruned remove/reroll. Not exhaustive search.
- **diagnostics**: Wilson/stage income/margin/pool/event/exposure/selection/source/strata/extremes/performance available. Route dominance full-route gate not assessable on A/B/D slice.
- **human**: PENDING manual: experienced and novice rates, first-contact stage survival, usability; bots cannot substitute
- **formalBalance**: NOT APPROVED; full Normal targets not hard slice criteria; extend only after independent tool audit
- **protection**: 554/556 baseline byte-identical; only .pi/loops.json and its named loop record changed through main-pane scheduled runtime. Raw protection correctly returns ok=false; no files restored.
- **interruption**: Main pane canceled long foreground bg_wait; original processes continued, no seed rerun. Later synchronous partial aggregator hit 60s timeout before output, then recomputation-only aggregator completed; no game rerun.
- **remaining**: Independent simulator audit, then full content expansion/F4; art/audio deferred

### Slice Target Diagnostics

These are nonbinding slice diagnostics, not formal Normal acceptance. Small-loop definition uses the A/B/D formation diagnostic stated above. Single-route shares and mixed shares below condition on wins; absent routes C/E/F/G/H cannot be assessed.

| Bot/split | Formed before stage 4 / 1000 | Winning pool median | Win single A/B/D | Mixed wins | Late stage 10 P90/P50 |
|---|---:|---:|---|---:|---:|
| Greedy/holdout | 484 | 25 | 406/32/13 | 290/790 | 1.20 |
| Greedy/train | 504 | 25 | 430/43/7 | 289/810 | 1.20 |
| Random/holdout | 589 | 53 | 0/0/0 | 1/1 | 1.28 |
| Random/train | 594 | 41 | 0/1/0 | 2/3 | 1.25 |
| Synergy/holdout | 873 | 25 | 396/3/10 | 141/564 | 1.31 |
| Synergy/train | 856 | 26 | 391/8/12 | 119/546 | 1.33 |
| Value/holdout | 830 | 28 | 173/0/0 | 0/173 | 1.05 |
| Value/train | 835 | 28 | 192/0/0 | 3/195 | 1.05 |

All failed seeds, including legitimate LOST outcomes, are listed in `f3-slice-sim-gates.json` and retained with full command history in raw JSONL. Command errors are zero; no unfinished games remain. No human gate was exercised.

The per-ID table and JSON strata identify review candidates without deleting or tuning definitions. Non-junk selection rates outside 3-75% should be examined per strategy, acquisition stage, pool band and exposure source; raw offer appearance ratios are diagnostic only, not independent Wilson-trial estimates.

### Protection Exceptions

The initial 556-file baseline includes prior `retest-node.json` in its current post-incident state. No restoration was attempted. The only byte differences are `.pi/loops.json` and `.pi/loops/01a101f0-a171-761a-8429-9edd4dbe73ac.json`, which the main pane identifies as the existing ten-minute runtime scheduler. They are outside simulator ownership. The raw protection record remains `ok=false`, with both paths listed. All other 554 existing files match baseline size and SHA-256. No unexpected non-authorized file was created. This exception is disclosed, not treated as an all-files equality PASS.

### Execution Timing

- f3-slice-sim-batch-greedy-holdout-0-index.json: 500 games, 0 errors, 3062.9 seconds; v24.14.1, win32, 13th Gen Intel(R) Core(TM) i5-13400F.
- f3-slice-sim-batch-greedy-holdout-500-index.json: 500 games, 0 errors, 3074.8 seconds; v24.14.1, win32, 13th Gen Intel(R) Core(TM) i5-13400F.
- f3-slice-sim-batch-greedy-train-0-index.json: 500 games, 0 errors, 3088.9 seconds; v24.14.1, win32, 13th Gen Intel(R) Core(TM) i5-13400F.
- f3-slice-sim-batch-greedy-train-500-index.json: 500 games, 0 errors, 3098.9 seconds; v24.14.1, win32, 13th Gen Intel(R) Core(TM) i5-13400F.
- f3-slice-sim-batch-random-holdout-0-index.json: 1000 games, 0 errors, 782.4 seconds; v24.14.1, win32, 13th Gen Intel(R) Core(TM) i5-13400F.
- f3-slice-sim-batch-random-train-0-index.json: 1000 games, 0 errors, 763.8 seconds; v24.14.1, win32, 13th Gen Intel(R) Core(TM) i5-13400F.
- f3-slice-sim-batch-synergy-holdout-0-index.json: 1000 games, 0 errors, 926.3 seconds; v24.14.1, win32, 13th Gen Intel(R) Core(TM) i5-13400F.
- f3-slice-sim-batch-synergy-train-0-index.json: 1000 games, 0 errors, 934.3 seconds; v24.14.1, win32, 13th Gen Intel(R) Core(TM) i5-13400F.
- f3-slice-sim-batch-value-holdout-0-index.json: 1000 games, 0 errors, 837.5 seconds; v24.14.1, win32, 13th Gen Intel(R) Core(TM) i5-13400F.
- f3-slice-sim-batch-value-train-0-index.json: 1000 games, 0 errors, 840.7 seconds; v24.14.1, win32, 13th Gen Intel(R) Core(TM) i5-13400F.

## Structural Findings

1. Policy sensitivity is substantial on identical content rules but disjoint seeds: holdout wins are Random 0.1%, Value 17.3%, Synergy 56.4%, Greedy 79.0%. Greedy's holdout Wilson interval is 76.37-81.41%; this is above the formal strong-bot target ceiling, but that ceiling is not a hard acceptance criterion for discounted-rent slice data. This supports reviewing full-price economics after full-content expansion, not raising slice rent now.
2. Formation is not sufficient for solvency: Random and Value report approximately 97% and 99.9% ever-formed diagnostics despite very weak completion. The diagnostic should be audited independently; it identifies local activity rather than sustainable endgame economy.
3. A dominates successful single-route builds. Holdout single-A wins are Greedy 406/790 and Synergy 396/564; mixed wins are 290/790 (36.7%) and 141/564 (25.0%). The suggested full-game mixed >=40% and single-route shares are not met by these diagnostic classifications, but absent routes C/E/F/G/H and policy biases preclude full-route balance inference.
4. Winning-pool medians are Greedy 25, Synergy 25, Value 28; Random has only one holdout win (pool 53), so its winning distribution is insufficient evidence. Sparse removal/skip choices and over-acquisition materially separate policies.
5. Fog_stitcher is selected below 3% of appearances by both strong bots; Synergy also rarely selects ash_felt, sieve_drum, clinker_router, pearl_separator, frost_glass, clean_mesh and waste_log. These are review candidates, not deletion recommendations: inspect acquisition stage, support inventory, effects and policy blind spots in the stored strata.
6. Greedy uses 0 rerolls and 0 skipItem across train and holdout. Commands are available, but the continuation skips unknown offers and penalizes token use, biasing the reroll evaluation. Treat the bot as the documented bounded/pruned implementation, and audit this limitation before using it for full F4 comparisons. No strategy was modified to improve the observed result.

## Freeze And Reproduction

All simulation processes finished before freeze; no server was started, and the background task list is empty. Only authorized new simulator files/report were edited. No existing evidence runner was invoked. The long foreground wait cancellation and partial-statistics timeout did not interrupt or restart any game process.

To independently recompute raw evidence, run `node tests/gdd1/f3-slice-sim-stats.js`; it reads all ten batch JSONL files and validates their matching indexes before aggregating. The original runner rejects existing output names rather than overwriting evidence. Fixed seeds and frozen engine/runner hashes are in `f3-slice-sim-seeds.json`. All failures remain raw LOST records, not excluded seeds.

The final `f3-slice-sim-deliverables.json` enumerates file byte lengths/SHA-256, excluding itself to avoid a circular hash; the freeze record identifies the same explicit runtime exceptions as the raw protection report. This deliverable is frozen for independent review, not a declaration of F4 or human acceptance.
