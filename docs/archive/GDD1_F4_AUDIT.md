# GDD1 F4 Independent Full-Content Audit

**Judgment: BLOCKED / NOT ACCEPTED**

This is an independent audit record. No implementation, old test, or historical evidence file was modified. New evidence is limited to `tests/gdd1/f4-audit-*` and this report.

## Frozen evidence

| Artifact | SHA-256 |
|---|---|
| `docs/GAME_DESIGN_V1.md` | `e33e1699aed464cd656abc2344d9e68be92a7238da482f9861e5e67dedc8df07` |
| `tests/gdd1/f4-review-freeze-v1.json` | `c715a8a3e95aa66aef89cffce36d15604acbeee6fd3d28066987a06eefdec529` |
| `docs/GDD1_F0_FREEZE.md` | `a05aa54cf1424a2407a59854af41a9db4f47e46f2436027507c8278b9c26ebfe` |
| `docs/GDD1_F1_CONTRACT.md` | `09d50d390b412e45ba41516c01990930313cd6facb390125f7d92bf98b9bb1f7` |
| `docs/GDD1_F1_ACCEPTANCE.md` | `cccd5eac6f2940f2c1552fabc8bbdff1341ef58a25703cf30a2c66c81342702b` |
| `docs/GDD1_F2_AUDIT.md` | `bd146808acda9a9edfaf5eaa2f5e76cd6e9c81118408d323375491f47b9512a5` |
| `docs/GDD1_F3_ACCEPTANCE.md` | `9d52f771208bd75f36470999eb6f5189ba2c79affc9f7044337a551321615a2a` |
| `docs/GDD1_F4_REPORT.md` | `8a87d2c8ee142908695465508c1b19739ad1318cfd82850bc744db8baec0ebbd` |

The review-freeze manifest was checked as the required 158-entry review set. The complete recursive bytes/SHA manifest is [f4-audit-baseline-v1.json](../tests/gdd1/f4-audit-baseline-v1.json). It excludes `.pi/loops/` runtime files and the generated F4 audit result files so the baseline remains stable. `.pi/loops.json` was disclosed and left in place; it contained an empty loop list. No loop or background audit service was left running.

## Independent evidence

The new audit runner is [f4-audit-full-content.js](../tests/gdd1/f4-audit-full-content.js). It contains 48 precise boundary cases, including:

- 64 symbols, 32 items, 8 events, 12-start/70-spin structure, payment table, UID order, profile membership, RNG streams, and save profile isolation.
- Pending settlement, rollback, refresh/window limits, capacity 200, generation/effect safety bounds, pressure caps, final-stage handling, and synchronous save/import checks.
- Event eligibility/cooldown/capacity and schema/event-count boundaries.
- Static UI checks for full-v1 routing and the existing busy guard.
- Ten independent hand-calculated resolver fixtures, retained in [f4-audit-hand-oracles.json](../tests/gdd1/f4-audit-hand-oracles.json), covering base totals, pressure, ordinary-zero, copyable/additive, negative values, row effects, low-cash conditional effects, and direct base payment.

The first run was intentionally retained at `f4-audit-full-content-results.json`: 48 cases, 42 passing, 6 failing. Review of the original inputs against the frozen contract identified four test-construction errors (the row fixture hand total was 9, event copper eligibility is true for the initial pool, the refresh resource is two tokens, and schema permits the tested event count). Those failures were not deleted or overwritten. The corrected run is `f4-audit-full-content-results-v2.json`: 48/48 cases passing.

A green new runner is not sufficient for acceptance because several cases document implementation routing risks rather than merely exercising output.

## Blocking findings

### F4-B1: full-v1 command path still routes through slice implementation

The audited full controller calls `F.sliceDraw(s)`, `F.sliceResolve(s, board)`, and `F.sliceOffer(s, 'symbol'/'item')`. This is a direct source-level finding in `js/gdd1/full-controller.js`, independently asserted by the new runner. The full profile has 64 symbols, 32 items, 8 events, distinct normal payments, and full-only mechanics, but the command path is not a full-specific draw/offer/resolver boundary. This leaves full-content behavior dependent on slice implementation and blocks proof of complete GDD64 mechanics.

### F4-B2: prior independent F2 blocker remains part of the acceptance state

The preserved F2 audit reported stale-epoch structural action failures and real UI double-click refresh duplication. F4 does not erase those historical failures. The new runner verifies only the currently visible source guards and cannot convert the prior boundary evidence into a pass.

### F4-B3: browser/UI acceptance gap

This audit was run through the file and Node paths. Chrome automation and screenshot/pixel verification were not available in this audit session. Existing F4 material explicitly discloses that Chrome is not claimed. Therefore file/HTTP behavior, real double-click handling, import/export interaction, and visual parity remain unaccepted.

## Historical integrity

The following prior counts remain historical evidence, not new green claims: F1 base 117, fix 101, retest 38; F2 implementation 154, audit 41, retest 12; legacy 602. Historical M3 64/66 failures remain failures and were not overwritten. F3 acceptance was limited to the repaired slice scope and does not establish full resolver, balance, or browser acceptance. Existing F4 status was `PARTIAL / NOT ACCEPTED`; this independent audit agrees with that disposition.

## Coverage limits and next gate

The audit read the frozen GDD, F0/F1/F2/F3/F4 records, F4 rule map, all `js/gdd1` and `js/gdd1UI` implementation, and the save/schema/controller/resolver/content paths. The new tests cover the requested structural and boundary families and preserve failures. They do not claim that source-level routing through slice modules satisfies the full-content contract, nor do they claim Chrome parity.

Acceptance requires, at minimum, an independently reviewable full-specific command path (or a contract-backed proof that the shared path is complete), resolution of the preserved F2 blockers, and a real browser run covering file/HTTP save/import/refresh/events/payments/failure handling with two-protocol parity and three resolutions where available.
