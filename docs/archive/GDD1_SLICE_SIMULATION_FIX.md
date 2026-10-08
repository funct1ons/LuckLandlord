# GDD1 Slice Simulation Tool Fix (F3 / A1–A5)

This repair adds diagnostic tooling and recorded-command replay evidence. It does not change production, the frozen design, the original simulator/policies, the original 8000 trajectories, the old simulation report, or the audit. Formal Normal balance, full F4 content, browser transactions and human play remain separate unapproved gates. Art/audio remain deferred. Independent review must evaluate this new repair before expansion.

## Scope and method

Inputs were read completely: `GDD1_SLICE_SIMULATION_AUDIT.md`, `GDD1_SLICE_SIMULATION.md`, frozen `GAME_DESIGN_V1.md` and F0 gate, production contract/RNG/schema/save/content/offers/resolver/controller, simulator engine/runner/statistics/report/gates/freeze, and the relevant audit probes/evidence/protection/freeze. All pre-existing regular workspace files were SHA-256 baselined before the first new implementation file. The baseline has 586 files, excludes Git metadata and `.pi/loops/` runtime records, and includes `.pi/loops.json` with explicit runtime exception handling. Only new `tests/gdd1/f3-slice-fix-*` files and this document are owned by the repair.

The new replay consumes the actual stored command history, including losses; it never calls the bot decision function, performs a new policy run, picks a replacement seed, tunes a parameter, or modifies RNG. Each input line must match its frozen byte offset, byte length, line, seed, policy seed, SHA-256, outcome and final hash. Every command checks all recorded pre/post fields; every spin checks the complete board and ledger, total, log count and independently reconstructed original final-type income. Each payment checks the complete recorded payment object. Final state bytes and hash must match. An assertion failure stops publication; no mismatch is normalized or repaired. The original policy engine is loaded only in the independent A4 fixture to test the frozen policy limitation.

## A1: strict formation and income routes

A requires at least four current plants with a real non-destroy age/growth mechanism or plant product qualification, plus `fog_stitcher` or `item_dew_calendar` support. `wick_bed`, `warm_pod`, `root_ledger` and `nursery_gauge` alone do not qualify as growth/product inventory. There must be a full recent three-spin window with at least two plant transforms or at least 12 committed plant-product source income. B retains two scrap plus processor and contract/item support plus two operations within that recent window; D retains three feedstock plus transformer and two distinct crystal types. These are post-spin diagnostics. Acquisition strata recompute qualification from the actual pre-choice state and the same recent activity window. Old values remain explicitly named `legacyEverFormation`, `legacyPreFormations`, `legacyEverFormed`, `legacyBeforeStage4` and `legacyFormedAmongReached`; the frozen original records retain their original names and bytes.

Main/secondary routes use actual committed income sources, including route-owned items, over the recorded run. Main is the highest positive net A/B/D income (ties use alphabetic order). Negative ordinary income remains negative. For secondary/mixed diagnostics the share is `max(0, route net income) / sum(max(0, each route net income))`, including any other route bucket. A secondary route needs at least **20%**; mixed means at least two A/B/D routes meet that threshold. No threshold was frozen by GDD for this slice. This 20% choice and its denominator are tool diagnostics, not an approved balance or frozen-rule interpretation. Historical formation does not choose the main income route.

## A2: definition identity at commit, conserved income

`f3-slice-fix-instrument.js` loads exact frozen source text in isolated Node VM contexts and inserts two uniquely asserted diagnostic hooks in memory: after resolver `emit` commits a log row, and before each final ledger cell is calculated. Neither hook mutates a resolver value, controller state, content definition or RNG. The hooks capture source UID/definition/epoch, target, effect key, parent/depth, emitted facts, and committed multiplier ratio. Final base/permanent snapshots capture actual final type/epoch. No extra fields enter the strict save/schema/game state.

For every live cell, its final base plus actual permanent value belongs to its own final definition/epoch; each additive delta belongs to its definition at commit. Multipliers belong to the committing external or self source: in stable committed order, compute cumulative rational products with BigInt, floor the whole cumulative value, and assign `floor(next)-floor(previous)` to that multiplier. Rounding and interactions therefore belong to the multiplier source, not its target. Dead ordinary income and its pre-death add/multiply parts settle to zero. Independent reward rows retain the source definition even after target death; token rewards have zero cash income. Every target decomposition must equal the frozen ledger amount and its UID contribution map; all target parts plus rewards must equal spin income. This allocation preserves source sums and is explicit about multiplier order rather than claiming a causal intervention estimate.

The exact counterexample now has UID `u13`: `crystal_index` epoch0 commits +6, then transforms into `tide_prism` epoch1. Final base4 and new listener+3 belong to prism; index gets6 and prism gets7. The total remains13 for that cell (17 for the three-cell fixture). Assigning all13 to prism from the final UID/type is rejected by the independent oracle.

Every sidecar records UID acquisition origins, immutable input-index pointers, complete commit traces, per-spin parts, per-type and UID/type/epoch income, strict formations, acquisitions and route shares. Generated UIDs retain their original acquisition origin after transforms; growth is captured as an actual capped commit and its resulting permanent income belongs to the future cell owner. Item sources retain their item ID and null epoch. Event-age commits retain the `event-age` key (the frozen slice's fog event); controller event commands and their state effects are replayed against the raw record. Events with no cash ledger contribution receive no invented income. Fog cost is a cash cost, not resolver income; copper event transforms/spawns and brine event removes/guarantees affect future state. These distinctions and UID ancestry support inspecting event effects without relabeling cash as income. Input raw command history remains the authoritative controller event provenance.

## A3: denominator and dependence

Offer appearances, including rerolls, are repeated correlated observations. Selected/appearance and A/B event-decision ratios report counts, rate, observation unit, denominator and dependence only, without `lo`/`hi`. Acquisition strata retain actual event counts and event-win counts, but terminal win Wilson uses **one unique seed/game per stratum**. The key is definition / acquisition stage / strict pre-choice formation / pre-pool band (<20,20–26,>26). Acquired-definition game win Wilson also conditions on acquisition and remains confounded by stage, build, survivorship and policy; it is not causal item effectiveness. Total game win intervals use unique disjoint game seeds. The independent counterexample has three winning acquisitions in one game and one losing acquisition in another: event ratio3/4, unique-game win1/2, Wilson approximately[0.094531,0.905469]. Duplicate records with the same seed likewise do not create a second independent game.

## A4: frozen Greedy limitation

Greedy generates offers in the synthetic clone but never reads their identities to choose future acquisitions. The fixture replaces generated symbol/item identities and observes identical decisions and utilities, while proving generation calls occurred. The policy remains one synthetic sample (`f3-model-v1/0`), at most two future READY spins / 14 model commands, deterministic removal/reroll pruning, READY shortcut, and skip/skipItem/event-B continuation. The frozen observed Greedy totals are zero rerolls and zero skipItem in both splits. Candidate availability is not evidence of strategy coverage. A4 corrects the description; it does not improve the policy or reinterpret these wins as exhaustive search.

## A5: separate safe entry points

Output root is fixed to `tests/gdd1`. New public entry points require an explicit `f3-slice-fix-*` prefix; there is no default that can touch the old report/statistics/gates/freeze. Replay preflights all ten sidecars, all ten indexes, new statistics/report, and every staging path. Any existing destination or staging file rejects the operation before work. Files are written to new `-work-` paths and published only after all replay and aggregate checks. Exclusive hard links prevent overwriting even if another process creates a destination after preflight; a publication failure rolls back links created by this operation and preserves existing bytes. Replay failures delete owned staging files after workers exit. Abrupt process/OS loss may leave staging files; a later invocation refuses them and requires a new prefix or an explicit review of owned staging. No legacy runner that overwrites evidence was executed.

Recorded-command replay to a fresh version:

```text
node tests/gdd1/f3-slice-fix-run.js --prefix f3-slice-fix-results-v2
```

Reaggregate already generated sidecars into a new prefix, without any gameplay replay:

```text
node tests/gdd1/f3-slice-fix-report.js --input-prefix f3-slice-fix-results-v1 --prefix f3-slice-fix-review-v2
```

Independent fixture rerun requires a new case-output filename (or no output argument for console-only execution). Fixtures include temporary safety-test files and clean them afterward; freeze verification itself is strictly read-only:

```text
node tests/gdd1/f3-slice-fix-checks.js tests/gdd1/f3-slice-fix-review-cases.json
node tests/gdd1/f3-slice-fix-freeze.js --verify
node tests/gdd1/f3-slice-audit-freeze.js --verify
```

## Independent precision cases

Final case evidence is `f3-slice-fix-cases-v3.json`, all18 pass. Oracles cover wick rejection, current qualification/support/recent-window expiry, income routes/share threshold, exact6/7 transform attribution, base/add/item/consume/reward/spawn ancestry, permanent growth30, two-source multiplier cap2 and cumulative half-rounding, actual negative -1 income, synthetic negative rational floor(-1×3/2)=-2, fog age/item-add identity, pool200 generation cap, copper event capacity rejection with byte-identical state and RNG, repeated-event versus unique-seed Wilson, generated-offer identity invariance, output preflight and exclusive-publication rollback. The negative multiplier algebra fixture adjusts definitions only in its own isolated VM because frozen slice multipliers do not target negative junk; it is explicitly synthetic and is never used by raw replay. Earlier new fixture evidence is retained: the first saved run failed two VM-array prototype comparisons; v2 corrected these and passed17, v3 adds the atomic copper-event cap case. Initial unsaved fixture failures corrected only the expected deterministic initial UID and the frozen `multiplier-budget` reason name; cap2, exact ledgers and skip semantics were never relaxed.

## Migration results, coverage and protection

Results and final freeze are appended after the complete recorded-command replay and aggregate validation. No partial run is reported as 8000 complete.

### Completed migration

All **8000/8000** original records replayed successfully. The original 8 replay samples remain unchanged historical evidence; this new replay covers the first game of all **10 physical JSONL files**, every terminal win/loss, all stored high/low income/payment extremes, and all event-A representatives. The frozen audit selected **47** distinct representative replays; all are included in this full population. No unfinished/omitted records or command mismatches remain. The background replay exited0 after15m40s, published22 new files, and ended. No server/service/loop was launched.

Core A1–A5 precision cases: **14/14**. Including four extra negative-floor/generation-cap/duplicate-seed/event-cap cases: **18/18**.

|Bot/split|Wins unchanged|Old ever formation → strict|Old before stage4 → strict|Old historical mixed wins → new income mixed wins|Source income total unchanged|
|---|---:|---:|---:|---:|---:|
|Greedy/holdout|790/1000|937 → 836|484 → 384|290 → 647|4911351|
|Greedy/train|810/1000|945 → 857|504 → 369|289 → 666|4924038|
|Random/holdout|1/1000|972 → 907|589 → 360|1 → 1|3164630|
|Random/train|3/1000|970 → 904|594 → 335|2 → 3|3133298|
|Synergy/holdout|564/1000|980 → 879|873 → 764|141 → 356|4775208|
|Synergy/train|546/1000|983 → 879|856 → 761|119 → 321|4754139|
|Value/holdout|173/1000|999 → 998|830 → 821|0 → 159|4414114|
|Value/train|195/1000|999 → 999|835 → 828|3 → 184|4449133|

Across all records: **1292678 commands**, **542221 spins**, **77770 payments**, **34525911 total resolver income**. All complete recorded command/board/ledger/payment comparisons and final hashes match. All original statistics/report/gates/freeze files remain byte-identical; only new definitions/strata diagnoses changed.

|Bot/split|Changed definition|Old final-UID income|New committed-definition income|Delta|
|---|---|---:|---:|---:|
|Greedy/holdout|tide_prism|1884576|1872396|-12180|
|Greedy/holdout|crystal_index|693203|705173|11970|
|Greedy/holdout|reserve_facet|72538|72748|210|
|Greedy/train|tide_prism|1892952|1880984|-11968|
|Greedy/train|crystal_index|694487|706199|11712|
|Greedy/train|reserve_facet|78602|78858|256|
|Random/holdout|tide_prism|830444|825358|-5086|
|Random/holdout|crystal_index|186092|190988|4896|
|Random/holdout|reserve_facet|49318|49508|190|
|Random/train|tide_prism|831893|826695|-5198|
|Random/train|crystal_index|189974|194978|5004|
|Random/train|reserve_facet|48806|49000|194|
|Synergy/holdout|tide_prism|1376986|1376148|-838|
|Synergy/holdout|reserve_facet|166576|166622|46|
|Synergy/holdout|crystal_index|1126916|1127708|792|
|Synergy/train|tide_prism|1380577|1379777|-800|
|Synergy/train|reserve_facet|164920|164952|32|
|Synergy/train|crystal_index|1091283|1092051|768|
|Value/holdout|tide_prism|975790|975782|-8|
|Value/holdout|reserve_facet|19068|19076|8|
|Value/train|tide_prism|991153|991131|-22|
|Value/train|crystal_index|1085|1097|12|
|Value/train|reserve_facet|14142|14152|10|

These per-definition shifts conserve every spin, target/UID ledger and group total. Per-stage sources and acquisition-origin income are in the new statistics; full UID/type/epoch parts and actual commit traces are in the indexed sidecars.

|Bot/split|Actual acquisition events|Unique game/stratum memberships|Strata with repeated events|Event-A / all A+B decisions|
|---|---:|---:|---:|---:|
|Greedy/holdout|41266|37242|425|118/811|
|Greedy/train|41786|37531|433|114/764|
|Random/holdout|53130|49196|862|677/1153|
|Random/train|52827|48941|856|697/1185|
|Synergy/holdout|44080|35181|420|297/461|
|Synergy/train|44126|35251|385|294/483|
|Value/holdout|44734|33619|233|1122/1279|
|Value/train|44814|33559|212|1126/1285|

A game may belong to several distinct strata; membership totals are not a population denominator. Every within-stratum terminal-win interval deduplicates that seed. Event and offer ratios have no binomial endpoints. The raw acquisition event counts are retained. Full per-ID selected/appearance rates and stage/pool/formation-conditioned game-win strata are in the new statistics.

Protection at finalization: **585/586** entry-baseline files byte-identical, **0** unexpected existing-file changes and **0** unauthorized additions; production changes **0**. Frozen original manifest **48/48**, audit manifest **10/10**, audit baseline **574/574** non-runtime files and historical **245/245** pass exact bytes/SHA-256. The one observed entry-baseline difference is `.pi/loops.json`, the existing parent runtime scheduler; `.pi/loops/` is a separately excluded runtime subtree. These are disclosed exceptions, never restored. They do not count as production or tool edits.

The final new manifest `f3-slice-fix-freeze.json` hashes every new authorized regular file and this report, excluding only itself to avoid circularity. `--verify` rehashes all new entries and verifies the entire old baseline, original48, audit10, audit574 and historical245 without writing. The report hash is in that freeze; the freeze hash is delivered to the main pane separately. New protection and migration counts are also separately recorded in `f3-slice-fix-protection.json` and `f3-slice-fix-summary.json`.

Remaining limits: no full-price/full-content balance inference, strategy optimization, causal acquisition inference, browser/Edge/Chrome transaction retest, human play or art/audio. Diagnostic20% mixes are not formal GDD route gate approval. Independent review remains required. Implementation stops after freeze verification.
