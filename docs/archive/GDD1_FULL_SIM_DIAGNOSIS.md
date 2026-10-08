# GDD1 full-v1 Normal — engineering diagnosis (not independent audit)

Economy remains **NOT APPROVED**. No GDD, payment, or production change. No seed rescreen. Independent aggregation re-audit is a separate signature. Human play remains pending and does not block this diagnosis.

## Failure stage (lost games by `finalState.stageId`)

| Group | Wins | Lost@6 | Lost@7 | Lost@8 | Lost@9 | Lost@10 | Stage6 paid/1000 | Stage8 paid/1000 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Greedy/holdout | 23 | 1 | 52 | 560 | 309 | 55 | 999 | 387 |
| Greedy/train | 33 | 1 | 49 | 572 | 280 | 65 | 999 | 378 |
| Random/holdout | 0 | 315 | 559 | 80 | 1 | 0 | 640 | 1 |
| Random/train | 0 | 307 | 562 | 68 | 1 | 0 | 631 | 1 |
| Synergy/holdout | 0 | 15 | 478 | 492 | 14 | 0 | 984 | 14 |
| Synergy/train | 0 | 13 | 429 | 546 | 11 | 0 | 986 | 11 |
| Value/holdout | 0 | 2 | 169 | 751 | 74 | 4 | 998 | 78 |
| Value/train | 0 | 1 | 166 | 767 | 63 | 3 | 999 | 66 |

## Route formation (diagnostic A–H, not GDD small-loop identity)

| Group | Formed before stage 4 | Win mixed | Win unformed | Win pool P50 | Unused recorded ops |
|---|---:|---:|---:|---:|---|
| Greedy/holdout | 997/1000 | 23 | 0 | 25 | reroll|skipItem |
| Greedy/train | 995/1000 | 33 | 0 | 25 | reroll|skipItem |
| Random/holdout | 952/1000 | 0 | 0 | NA | none |
| Random/train | 955/1000 | 0 | 0 | NA | none |
| Synergy/holdout | 1000/1000 | 0 | 0 | NA | skipItem |
| Synergy/train | 998/1000 | 0 | 0 | NA | skipItem |
| Value/holdout | 1000/1000 | 0 | 0 | NA | skipItem |
| Value/train | 1000/1000 | 0 | 0 | NA | skipItem |

Greedy/Value/Synergy unused `skipItem` (and Greedy `reroll`) are policy choices. Random used every legal op and still 0 wins, so unused actions do not explain the 6000 zero-win games by themselves.

## GDD §13.3 holdout gaps (待验证 targets, not applied retune)

| Group | Win 40-70% | ≥15pp vs Random | S1 ≥95% | S3 ≥75% | S6 45-70% | Win pool 18-26 | Mixed wins ≥40% |
|---|---|---|---|---|---|---|---|
| Greedy/holdout | OUT 2.30% [1.54%, 3.43%] | NOT MET | IN | IN | ABOVE 70% 999/1000 | IN | IN |
| Random/holdout | OUT 0.00% [0.00%, 0.38%] | n/a | IN | IN | IN 640/1000 | no wins | no wins |
| Synergy/holdout | OUT 0.00% [0.00%, 0.38%] | NOT MET | IN | IN | ABOVE 70% 984/1000 | no wins | no wins |
| Value/holdout | OUT 0.00% [0.00%, 0.38%] | NOT MET | IN | IN | ABOVE 70% 998/1000 | no wins | no wins |

Stage 1 and 3 hold. Stage 6 is **above** 70% for Greedy/Value/Synergy (not a stage-6 collapse). Random stage 6 is inside 45–70% and still 0 wins. Greedy holdout 2.30% is far below 40–70% and only +2.3pp vs Random 0, not +15pp.

## Versioned tune candidates (do not apply)

- **tune-candidate-full-v1-diag-1** status: DIAGNOSTIC CANDIDATE ONLY; do not apply; do not edit GAME_DESIGN_V1.md or js/gdd1; do not rescreen seeds
- Strong and weak bots survive stages 1-6 then fail stages 7-10 against payments 850/1120/1460/1880. Stage 6 is not a universal collapse. Win rates are near zero except Greedy ~2-3%. Formation diagnostic fires early for Greedy/Value but does not convert to payment coverage. Greedy never recorded reroll or skipItem; Value/Synergy never skipItem. Random used all legal ops and still 0 wins.
- **C1-late-yield-not-rent**: Investigate late-stage yield (spin income P50 vs payment 850+) before cutting early rents 70-630. Do not raise all rents from P99 spikes. Reason: Stage6 paid Random 640, others 984-999; losses concentrate at 7-9 with negative margins. apply=false.
- **C2-policy-unused-ops**: If a later policy version is introduced, give Greedy a non-pruned skipItem/reroll branch. This is a bot change, not a GDD price change. Reason: Greedy unused reroll|skipItem; Value/Synergy unused skipItem. Random used both and still 0 wins, so unused ops are not a sufficient explanation of 0 wins. apply=false.
- **C3-feed-not-quota-first**: If yield is structurally below stage-7 payment after formed pools, consider candidate/feed/yield tables next, not quota width, and version it. No seed screening. Reason: GDD §13.3: tune candidate/feed/yield then quotas. Stage6 overshoot vs 45-70% plus late failure is not the “all routes collapse at stage 6” rollback trigger. apply=false.

Machine JSON: `tests/gdd1/full-sim-diagnosis-v1.json`.
