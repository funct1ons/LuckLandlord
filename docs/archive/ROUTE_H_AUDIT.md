# Route H independent audit

This report records an independent read-only audit of the frozen Route H implementation. The audit added only [tests/audit-route-h.js](../tests/audit-route-h.js) and this report. Browser artifacts from the fresh run were written under `C:\Users\admin\AppData\Local\Temp\route-h-independent-6c6I1J`.

## Result

The independent Node audit contains 61 boundary cases and passed 61/61. Each fixture is built from raw state, resolved from a cloned state, and checks that the caller's input bytes remain unchanged. Assertions inspect ledger amounts, positions, alive state, rewards, logs, UID allocation, counters, reservations, payment obligations, pending settlement, revisions, and encoded state where applicable.

Coverage includes:

- arrears negative values, junk exclusion, and snapshot behavior;
- lean receipt odd and exact-half cash/payment boundaries, zero payment, and no mid-resolution payment effect;
- compliance competition, distant targets, UID/permanent/counter preservation, reservation removal, and one-shot conversion without a new appear event;
- cleared-stub direct value, transformed snapshots, and copy whitelist behavior;
- cancellation clerk successful consumption, competition, cap 30, dead/tombstoned targets, and multiple consumers;
- quota gaps 0, 1, 15, 16, negative gap, and payment snapshot;
- `advance_stamp` READY configuration, revision and type checks, default neutral behavior, accepted UID/effect/stage claims, payment +8, reward 18, exact stage contracts, repeated resolution, definition and source spawn limits, pool sizes 199/200, full-pool retained obligations, off-board behavior, removed claimed sources, pending reload, stage reset, final ±1 settlement boundaries, and payment overflow atomicity;
- settlement pool junk, tombstones, distinct live types, source caps, and multiplier floors;
- rules 0.2/0.3 migration, strict H-1 state shape, unknown content, unsupported active modifiers, duplicate/mismatch/UID/numeric violations, recursive state, and atomic import/write faults.

The resolver remains data-driven in the audited path: the independent script loads the generic resolver and content definitions and does not add or alter H-specific resolver branches. A source scan found no H content IDs in `js/engine/resolver.js`; stage advancement uses generic effect fields. `js/core/game.js` explicitly excludes `arrears_slip` from offered candidates, as required for junk exclusion. This is a candidate-list rule, so the audit does not claim that all H IDs are absent from all core files.

| H ID | Independent assertions |
| --- | --- |
| arrears_slip | negative ledger, permanent offset, 128 offer draws excluding junk, consumption tombstone |
| lean_receipt | 4/9 and 5/9, 8/18 and 9/18, payment zero, round-start payment snapshot |
| compliance_desk | distant target, two sources competing, single conversion, stable UID/permanent, cleared counters/reservation, no appear add |
| cleared_stub | direct base3+flat1+permanent, copied flat1, transformed junk excluded from initial copy snapshot |
| cancellation_clerk | owned successful consume, cap28→29 and30→30, competing consumers, other consumer does not grow owner, dead owner |
| quota_margin | gap -1/0/1/15/16 and stamp changing payment during resolution |
| advance_stamp | neutral default, READY setting/revision, once key, exact reward18/payment8/UID log, four sources with two spawns, pool199/200, pending/remove/reload, reset, final cash17/18/19, schemas/import |
| settlement_beacon | whole-pool junk, distinct live types, removed tombstone, three-source cap, fractional composed ratio, dead owner |

Review of the existing 81 H developer cases found precise ledger/log assertions in most cases. The no-neighbor, surplus-gap, and candidate-exclusion checks include total-only or broad aggregate checks; the independent cases add exact ledgers, state bytes, and first-resolution snapshots. The generic death/fractional-composition checks temporarily replace fixture content and restore it in `finally`; they write no source files.

## Fresh browser run

A fresh Microsoft Edge profile was used for both file and localhost HTTP runs:

- file suite: 602/602, exact frozen name/order/status/error parity;
- HTTP suite: 602/602, exact frozen name/order/status/error parity;
- file UI: the six import fault cases and all three Route H UI cases passed;
- HTTP UI: the same six import fault cases and all three Route H UI cases passed;
- file storage write/read pages completed successfully.

The current Node total suite also passed 602/602 with exact case parity and old 521 names preserved. Its existing manifest write was intercepted and redirected to `C:\Users\admin\AppData\Local\Temp\h-independent-node-q0jLkP`; no old repository evidence was overwritten. Both browser suites therefore match the freshly executed Node cases as well as the frozen manifest.

The independent browser runner wrote no repository artifacts. The Temp result directory contains the HTML, stderr, profiles, and `browser-proof.json` for this run.

## Frozen evidence review

`tests/route-h-freeze.json` was checked without changing it. All 152 recorded source/evidence hashes matched (`freezeHashBad: []`). The frozen development evidence records 602/602 Node cases, 81/81 Route H behavior cases, preserved old names, and the protected evidence sets. Those values are reported separately from the current independent 61-case Node run, current 602-case Node suite, and fresh browser run.

H independent mechanism verdict: **PASS for the documented coverage**. MA-1/G8 are reviewed only within their prior accepted scope; this H audit does not reopen them. The three historical failures remain cargo reservation behavior (cargo and cargo-retest) and recycling dead-owner listener behavior; the frozen historical aggregate remains 204/207. Overall G, M3–M5, and other project acceptance work remain incomplete. Residual coverage limitation: the independent script does not separately reproduce every developer content-schema mutation, every possible unsupported nested field, or every cross-route combination. Those checks are present in the freshly rerun 602-case suite and reviewed frozen evidence; the 61 independent cases provide additional boundary evidence rather than an exhaustive proof.

## Files changed

- [tests/audit-route-h.js](../tests/audit-route-h.js)
- [docs/ROUTE_H_AUDIT.md](ROUTE_H_AUDIT.md)
