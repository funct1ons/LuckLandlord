# LuckLandlord grok-engineering stage (not final)

Independent F4 functional audit: **PASS** (`docs/GDD1_F4_GROK_AUDIT.md`, 11628 bytes, SHA `19884a37955c48d4a468684aac87e05d3ae3d91c628f1cbaff99cb1487f5d23d`).

Production: `js/gdd1/resolver.js` 27996 / `e86d51fb4c20d235312b263146f18d2c4cd69c13453846fe0daf9b07a0aaf88b`; `js/gdd1/full-effects.js` 37993 / `f65bc06b4c38fb35db14cc21f6ed4c63a42efbb06956f71078974990c5d8de55`. 158 freeze: 156 unchanged, two authorized paths. freeze-v3: `tests/gdd1/f4-grok-freeze-v3.json` 49762 / `f04d90262d64b5393f64250e9705c0df5cbbd03f832aeff3f857ae37a829a8b9` (verify PASS, 237 entries). freeze v1/v2/158/v4 retained.

Main pane independently verified freeze-v3 `--verify` 237/237, SHA `f04d90262d64b5393f64250e9705c0df5cbbd03f832aeff3f857ae37a829a8b9`. That plus internal F4 PASS does **not** accept formal Normal.

SHA errata (new file, frozen reports untouched): live `docs/GDD1_F4_AUDIT_SUPPLEMENT.md` is 7352 / `8b83cc616b41a6b115cfb20f70b8d04dfe214de6c66cbdd33096449ffb229824` (64 hex), matching freeze-v3/audit/FIX. A 65-hex transcription inserts extra `d`. See `docs/GDD1_F4_GROK_SHA_ERRATA.md` and `tests/gdd1/f4-grok-sha-errata-v1.json`.

Normal full-v1 8000-game line-verify PASS (task exit ≠ completeness): 16/16 batches, jsonl lines 500 each, 8000 unique seeds, 0 missing, 0 duplicates, 0 errors, 0 unfinished, 0 attribution fails, 8000 command replays. Historical job-kill jsonl retained (v1 greedy 0 lines; random 18; synergy 10–12; value 12–13; v2 similar 10–16). Independent sim audit TOOLS_PASS `docs/GDD1_FULL_SIM_AUDIT.md` `e08580281e482d8bec0fce9414290401149fbecd171dc4a0f7d17177350ff437`. Holdout Wilson: Greedy 23/1000 = 2.30% [1.54%, 3.43%]; Random/Value/Synergy 0/1000 [0.00%, 0.38%]. Formal balance **NOT APPROVED**. No retune. Human play pending. Art/audio deferred.
