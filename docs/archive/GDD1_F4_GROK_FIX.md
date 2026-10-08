# GDD1 F4 Grok Fix — ENGINEERING / NOT INDEPENDENT ACCEPTANCE

This report records the authorized production repair of the two independent semantic root causes in `docs/GDD1_F4_AUDIT_SUPPLEMENT.md`. It does not replace `docs/GDD1_F4_REPORT.md`, `docs/GDD1_F4_AUDIT.md`, or the supplement. Independent acceptance remains open until the auditor signs PASS or BLOCKED.

Supersede basis: this document covers the grok-branch generic-engine repair and new `f4-grok-*` evidence only. Original 158 freeze hashes, v4 29/32 failures, F1/F2/F3 acceptances, historical M3 64/66 failures, and naming deviations `f4-ui-cdp-v7` / `f4-f2-safe-v6` remain retained originals.

## Frozen authorities (unchanged)

| Artifact | Bytes | SHA-256 |
|---|---:|---|
| `docs/GAME_DESIGN_V1.md` | 103576 | `e33e1699aed464cd656abc2344d9e68be92a7238da482f9861e5e67dedc8df07` |
| `tests/gdd1/f4-review-freeze-v1.json` | 27504 | `c715a8a3e95aa66aef89cffce36d15604acbeee6fd3d28066987a06eefdec529` |
| `docs/GDD1_F4_AUDIT_SUPPLEMENT.md` | 7352 | `8b83cc616b41a6b115cfb20f70b8d04dfe214de6c66cbdd33096449ffb229824` |
| `tests/gdd1/f4-audit-semantic-v4-results.json` | 268091 | `48b9045350a34a078f0c48a559dfc96de01423dd6c3edfdcdd644687b98ec676` |
| `docs/GDD1_F4_REPORT.md` | 14491 | `8a87d2c8ee142908695465508c1b19739ad1318cfd82850bc744db8baec0ebbd` |
| `docs/GDD1_F4_AUDIT.md` | 5783 | `53b3157c69a99d3a73d52e3e253fe70e025480c6688771d883727254e974972b` |
| `tests/gdd1/protected-before.json` (245) | 60821 | `8b47a1950e561b55fdd761463e3d8854a1999ee3eb950f3f580ad53b5ae0751e` |

The v4 result remains 29/32 with three failures and two root causes. It was not overwritten.

## Production change (authorized vs 158)

Only `js/gdd1/resolver.js` and `js/gdd1/full-effects.js` changed. The 158-entry freeze is still the protection authority for the other 156 paths. This report does not claim the 158 freeze is byte-identical after the repair.

| File | 158 freeze | After repair |
|---|---|---|
| `js/gdd1/resolver.js` | 27757 / `435bf3266b0b3d161f2d26d5345c9b21e2a669a316c9c4bbaf09e3c6ab34351c` | 27996 / `e86d51fb4c20d235312b263146f18d2c4cd69c13453846fe0daf9b07a0aaf88b` |
| `js/gdd1/full-effects.js` | 38016 / `82b207481c292270bb73109854ecd2f474ae4e191317f8476a4ccf80e7e338a3` | 38059 / `b602a74a9e485454b3d5801e7a1a648ffa7fc8bdc220cc8928b483728c8af205` |

Generic mechanism only. Resolver `select()` orders by first `tagAdded` causal-log index when `selector.receivedTag` or `selector.order==='tagAdded'`, otherwise board position then UID. No `symbolID` branches. `alignment_cloth` data: adjacent + `receivedTag` + `order:'tagAdded'`, amount 5, `lockFirst`. `item_spectrum_book` data: listen `add` on `tagAdded`, `eventTarget`, `defer:true`, amount 3, committing through the existing `deferredAdds` path at `step8/end-summary`. Same listen+defer pattern as `item_pitch_marker`.

GDD: §5.I / §5.I.1 cloth after preprocess, first legal adjacent by tagAdded record order, lock, no death retarget. §5.I.1 / §6.1 book `step2/tagAdded → step2/tagAdded → step8/end-summary`; first novel tag; +3 only if still alive.

Counterexample oracles (independent v3/v4, unchanged assertions):

- `split_register@0`, `phase_chip@1`, `alignment_cloth@2`, `copper_burr@6`, no items: records `u4,u4,u2`, ledger `[2,2,1,10]`, total 15.
- `phase_chip@0`, `dock_chime@1`, `item_spectrum_book`: total 8, book add phase `step8/end-summary`.
- `split_register@0`, `copper_burr@1`, `sorting_runner@2`, `item_spectrum_book`: locked target consumed, zero book add, no retarget.

Shared `F.sliceDraw` / `F.sliceResolve` / `F.sliceOffer` dispatched by `F.defs(state)` is the intended full/slice profile split. This repair does not duplicate engines.

## Engineering gates after the fix

| Evidence | Result | SHA-256 |
|---|---|---|
| `tests/gdd1/f4-grok-rootcause-v1-results.json` | independent 32/32; extra 6/7 (vm-realm `deepStrictEqual` on identical tag arrays) | `7710996226831f1f16d70317d99cf99bbba08b049d0be0035e1059605d9af1e3` |
| `tests/gdd1/f4-grok-rootcause-v2-results.json` | independent 32/32, extra 7/7; supersedes v1 extra FAIL only | `96a8fece6c7b7b8450a43bba525f85a2356f427a01b73ec6bbc5e93c205d7a3a` |
| `tests/gdd1/f4-grok-focused-v1.json` | 27/27 focused scripts | `c663c22f9fb6d88edfcea148c949546130d4cc247a6c89395d1d81c071fa6c42` |
| `tests/gdd1/f4-grok-regression-v1.json` | F1 38/38, F2 audit 41/41, retest 12/12 | `143f06d918feeb84da8b3b35ad3112c7241b1ea4e290cfccd1ad65f5191309bc` |

Historical counts remain historical: F1 base 117, fix 101, retest 38; F2 implementation 154, audit 41, retest 12; legacy 602; M3 64/66 two failures. Current 38/41/12 green does not rewrite those originals. Old F2 UI/epoch defects are already repaired; historical F2 blocker reports are not current.

Copper oracle construction error in v3 (expected 5 vs GDD 7) remains in the preserved v3 result. Engineering re-runs apply the same v4 patch (`copper2+machine-neighbor2+reader3=7`) without editing `f4-audit-semantic-v3.js`.

## Protection

| Evidence | SHA-256 |
|---|---|
| `tests/gdd1/f4-grok-authorized-diff-v1.json` | `5811576150a80249ddfc1dc7ee37f860043892045a5b0dc4ff05eefeabb3d250` |
| `tests/gdd1/f4-grok-protection-v1.json` | `81a5186fa84774e0c60f08a8a853dd8bc192abacbde8ccc7b273e06645a6fcb0` |
| `tests/gdd1/f4-grok-freeze-v1.json` | `f78d91d01a1a1d9bfb1b5c4c1b5db2bfb09d489b23de91ee97e41d9c2f0170bf` |

New freeze: 170 entries, self-excluded, `--verify` pass. It records current hashes of the original 158 paths (two authorized diffs) plus new grok evidence and the supplement. It is an engineering snapshot, not independent acceptance.

Original 245 F1 `protected-before.json` files remain 245/245 byte+SHA identical. That 245 set does not include GDD1 engine sources; it is a different historical scope from the 158 review freeze and is not substituted for it. `.pi/loops.json` and `.pi/loops/` remain disclosed runtime scheduler exceptions and were not restored.

Pre-fix recursive snapshot: `tests/gdd1/f4-grok-baseline-pre-fix-v1.json` (Windows skip missed `.pi/loops`; retained). Derived index without runtime files: `tests/gdd1/f4-grok-baseline-pre-fix-v1-noruntime.json`.

## Not claimed here

- Independent F4 functional PASS. An independent auditor is running `f4-grok-audit-*` evidence: live 32-fixture Node + real Edge file/HTTP (not the old 22 implementer fixtures), 64/32/8 per-ID semantic mapping and actual-trigger hand review, UI/save/RNG/payment/pending/limits, and a PASS/BLOCKED signature.
- Normal full Bot simulation, economy, or Wilson intervals. Full prices are not replaced by slice win rates. Bot sim starts only after independent F4 functional PASS.
- Human play. Chrome. Art, animation, audio, music.
- That shared slice entry points are a defect.

Edge is this round's browser gate. Temporary servers and browsers must be closed after each runner.
