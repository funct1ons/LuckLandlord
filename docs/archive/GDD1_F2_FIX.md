# GDD1 F2 E1/E2 Fix Report

## Scope

This fix changes only `js/gdd1/resolver.js` and `js/gdd1UI/main.js`.

E1 validates the queued source UID, epoch, type, and alive state before dispatch and before each target action. A stale action is cancelled before match, quota, or RNG work. A matching event target may still process its death transition. Immediate listeners for legitimate new types remain available without repeating appearance.

E2 keeps the synchronous UI busy guard and ignores delegated click events with `detail > 1`, which suppresses the real re-rendered consecutive refresh click without swallowing a corrected click after a failed command. The first real click remains normal, later independent clicks remain available, and the engine revision check remains authoritative. No keyboard shortcut handlers were present, so none were added.

## Verification

- `node --check js/gdd1/resolver.js`: pass
- `node --check js/gdd1UI/main.js`: pass
- `tests/gdd1/f2-fix-checks.js`: 3/3 targeted checks pass, including pearl -> reserve -> tide cancellation, no repeated tide appearance, and stale double choose rejection.
- `tests/gdd1/f2-fix-run.js`: 41/41 audit checks pass.
- Edge real UI, file URL, write process: 49/49.
- Edge real UI, HTTP URL, write process: 49/49.
- The write suites include the re-rendered consecutive refresh click case and confirm one coupon spend.
- Independent F1 fix101 rerun: baseline 117/117; fix regression 101/101. Historical audit remained 22/28 with the exact expected six historical findings.
- Independent F1 retest38 rerun: baseline 117/117; fix regression 101/101; retest 38/38. Historical audit remained 22/28 with the exact expected six historical findings.
- The first 43/45 read run was written to the paths `tests/gdd1/f2-fix-edge-file-read.html` and `tests/gdd1/f2-fix-edge-http-read.html`, then overwritten by the corrected 45/45 rerun at those same paths. No separate original 43/45 bytes were retained; this is disclosed rather than represented as an original artifact.

## Preservation and audit trail

`tests/gdd1/f2-audit-deliverables.json` was checked read-only: 40/40 entries match. The 51-entry freeze has exactly the two authorized source mismatches. `tests/gdd1/f2-audit-node.json` was written during the run by the historical runner, then restored with the old resolver; its final SHA256 is `988456e467dd1a8ef0a3e68d97ea00b0920fdb047f6c4b3452357f8ad1cf4301`, equal to the pre-run baseline. No freeze or deliverables file was written. The first 43/45 read attempt was retained as evidence and is superseded by the corrected 45/45 run.

The protection record is [f2-fix-protection.json](../tests/gdd1/f2-fix-protection.json). The complete new-artifact inventory is [f2-fix-deliverables.json](../tests/gdd1/f2-fix-deliverables.json); it excludes itself by design. It records the unchanged historical 245-file protection set, 40-file F2 audit deliverables, and 49 unchanged freeze entries. All newly produced evidence uses the `f2-fix-*` prefix.
