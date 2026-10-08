# GDD1 F4 Supplemental Independent Audit

**Judgment: BLOCKED / NOT ACCEPTED**

This supplement records the current independent evidence without replacing the original F4 report, historical evidence, or first-run failures. No production source, old assertion, historical result, or protected snapshot was modified.

## Current evidence

- Independent regression rerun: F1 `38/38`, F2 audit `41/41`, F2 retest `12/12`; no current failures. This corrects the earlier interpretation that the historical F2 blocker remained current.
- Full profile mapping: `full-v1` selects distinct full registries; all 64 symbols, 32 items, and 8 events are present and dispatchable. Structural mapping is not semantic acceptance.
- Independent semantic fixture v3: `32` cases, `28` passed, `4` failed. The copper case was an oracle-construction error: the frozen rule gives `copper_burr` base 2 plus adjacent-machine +2, and `offset_reader` contributes +3 even when no copyable template exists. The preserved v3 result remains unchanged.
- Corrected semantic fixture v4: `32` cases, `29` passed, `3` failed. The three remaining failures reduce to two implementation root causes described below. Result: `tests/gdd1/f4-audit-semantic-v4-results.json`.
- Protected freeze: `158/158` entries matched with zero mismatches. The frozen GDD SHA256 is `e33e1699aed464cd656abc2344d9e68be92a7238da482f9861e5e67dedc8df07`.
- Current Edge CDP UI evidence: file and HTTP routes, real save/import/reload, double-click suppression, payment/event paths, injected action failure, storage-write fault, invalid import rollback, and three viewport sizes are covered by the retained v7 evidence (`20/20`). Exact reference-to-Edge parity is separately retained as implementation-parity evidence (`22` cases) and is not treated as an independent oracle.

## Blocking semantic findings

### 1. `alignment_cloth` ignores tagAdded causal order

Minimal fixture: seed `INDEPENDENT-V3`; board `split_register@0 (u1)`, `phase_chip@1 (u2)`, `alignment_cloth@2 (u3)`, `copper_burr@6 (u4)`; no items. Frozen GDD sections §5.I and §5.I.1 require preprocessing to record real `tagAdded` events, then alignment cloth to select the first legal adjacent target by record order.

Expected tag records are `u4`, `u4`, `u2`; expected cloth target is `u4`; expected ledger amounts are `[2,2,1,10]`, total `15`. Actual records are `u4`, `u4`, `u2`, followed by an `alignment_cloth` add from `u3` to `u2` for `5`; actual ledger is `[2,7,1,3]`, total `13`. The implementation selects by board/position instead of the recorded causal order.

### 2. `item_spectrum_book` commits in the wrong phase and survives target death

Fixture A: `phase_chip@0`, `dock_chime@1`, `item_spectrum_book`. §5.I.1 and §6.1 require selection during `step2/tagAdded` but commitment at `step8/end-summary`. Expected book action phase is `step8/end-summary`; actual action is parent `0`, source `item_spectrum_book`, target `u1`, amount `3`, phase `step2/tagAdded`.

Fixture B: `split_register@0`, `copper_burr@1`, `sorting_runner@2`, `item_spectrum_book`. The book targets `u2`; later parent action `4` consumes/destroys `u2` at `step5/structural-event`. The frozen contract requires no deferred add and no retargeting after target death. Actual book action `id 1`, parent `0`, source `item_spectrum_book`, target `u2`, amount `3`, is already committed at `step2/tagAdded`; final dead-target ledger amount is `0` and total is `11`. These are one lifecycle root cause expressed at two boundaries: commit is immediate rather than deferred, and target validity is not rechecked at commit.

Because these are concrete frozen-GDD semantic failures, F4 remains BLOCKED. Registration, dispatch, UI, parity, and regression green results cannot override them.

## Historical and protection disclosures

The original first-run full-content result remains preserved at `42/48`; corrected v2 remains separately preserved at `48/48`. Mapping correction generations and all prior failures remain preserved. Historical baselines remain authoritative, including F1 base `117`, fix `101`, retest `38`, F2 implementation `154`, audit `41`, retest `12`, legacy `602`, and historical M3 `64/66` failures.

The protected 158-entry review snapshot remains byte/hash protected. The older 245-entry authorized-source context is a different historical scope and is not silently substituted for the 158-entry freeze.

Chrome was not available for the browser run and remains disclosed. Edge is the current browser gate. The v7 UI and v6 safe-F2 artifacts were created with names outside this supplement's `f4-audit-*` naming rule; they are retained, disclosed, and not presented as compliant replacements or deleted.

Provider/model disclosure: the main pane reported a switch to requested `llmfree_openai/gpt-6.1-sol`, medium after upstream unavailability. This auditor did not independently verify that runtime switch; an earlier environment inspection returned model `gpt-6-astra`. No result was upgraded or regenerated because of the reported switch.

## Artifact hashes

The following SHA256 values are independently recorded for handoff:

| Artifact | Bytes | SHA256 |
|---|---:|---|
| `tests/gdd1/f4-audit-semantic-v3.js` | 5907 | `e912fd007aa6be74b9c3bc29323cb5230b6a1b9d9e53988185438408251ef5a8` |
| `tests/gdd1/f4-audit-semantic-v3-results.json` | 268108 | `91a42cd3c48d9d942ba64dc3ab7d5e8f43840e52d47c1dbc33074a5dbc38d421` |
| `tests/gdd1/f4-audit-semantic-v4-run.js` | 968 | `d21e796a69f85b6a2d8cc98cf8e6e5829ffa484b55998c7875a7b9a8aa1d9acb` |
| `tests/gdd1/f4-audit-semantic-v4-results.json` | 268091 | `48b9045350a34a078f0c48a559dfc96de01423dd6c3edfdcdd644687b98ec676` |
| `tests/gdd1/f4-audit-freeze-v2-results.json` | 240 | `785be3e3b076543b61fcb86e93396ac16a95fab5ee6aaa7a05ce89ded1ebb53f` |
| `tests/gdd1/f4-audit-independent-current-v1.json` | 9904 | `143f06d918feeb84da8b3b35ad3112c7241b1ea4e290cfccd1ad65f5191309bc` |
| `tests/gdd1/f4-ui-cdp-v7-results.json` | 4920 | `b9fff1d9aaf0caed373502389487e00f72cb23324712ea55894aa464b6632096` |
| `tests/gdd1/f4-audit-edge-parity-v2-results.json` | 73826 | `7ecee4344c6d9d193d5cc854f5224475203769de051296043b3eb2ec08f03016` |
| `tests/gdd1/f4-f2-safe-v6-node.json` | 14462 | `ac51b7dd4ebf992765839f7fc08f2795074753a6756a67b35221fcfe6a78041e` |

## Remaining scope and handoff limitations

A new browser run of the independent 32 semantic fixtures was not completed. The retained 22-case browser parity uses implementation fixtures and cannot fill that gap. A complete per-ID independent semantic oracle for all 64/32/8 definitions also remains open; structural mapping and the 32 fixtures establish only their stated scope. The 245-entry versus 158-entry comparison has not been completed entry by entry in this supplement. No fresh final freeze rerun was completed after report generation; the recorded 158/158 result is retained evidence from the earlier run. The main pane requested a bounded handoff after provider interruptions rather than expanding tests. No persistent browser/server was launched during this finalization; earlier CDP runners include browser/server cleanup. Runtime `.pi/loops.json` and `.pi/loops/` remain outside this auditor's restoration scope.

This supplement is an independent audit handoff. It does not authorize production repair and does not claim acceptance.
