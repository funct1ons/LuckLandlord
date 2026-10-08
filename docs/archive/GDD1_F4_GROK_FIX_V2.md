# GDD1 F4 Grok Fix v2 — ENGINEERING / NOT INDEPENDENT ACCEPTANCE

This addendum records a third authorized data repair found during independent per-ID actual-trigger review. It does not overwrite `docs/GDD1_F4_GROK_FIX.md`, `docs/GDD1_F4_REPORT.md`, `docs/GDD1_F4_AUDIT.md`, the supplement, freeze v1, or v4 29/32.

Supersede basis: v1 covered cloth record-order and book step8 defer. v2 keeps those and removes `cloudy_negative` `age-extra` self `amount:0`, which made generic `age()` increment twice per appearance (convert on 2nd appearance). GDD 5.G / 5.I.1: 第3次上盘, natural age only, listed with `mist_pouch` not `fog_stitcher`.

## Production

Still only `js/gdd1/resolver.js` and `js/gdd1/full-effects.js` versus the 158 freeze. Resolver bytes/SHA unchanged from v1. No `symbolID` branches.

| File | 158 freeze | After cloth/book (v1) | After cloudy (v2) |
|---|---|---|---|
| `js/gdd1/resolver.js` | 27757 / `435bf3266b0b3d161f2d26d5345c9b21e2a669a316c9c4bbaf09e3c6ab34351c` | 27996 / `e86d51fb4c20d235312b263146f18d2c4cd69c13453846fe0daf9b07a0aaf88b` | same as v1 |
| `js/gdd1/full-effects.js` | 38016 / `82b207481c292270bb73109854ecd2f474ae4e191317f8476a4ccf80e7e338a3` | 38059 / `b602a74a9e485454b3d5801e7a1a648ffa7fc8bdc220cc8928b483728c8af205` | 37993 / `f65bc06b4c38fb35db14cc21f6ed4c63a42efbb06956f71078974990c5d8de55` |

`cloudy_negative` keeps `mechanics.age {threshold:3, to:'blank_facet'}`. The extra self age effect is gone. Natural age in the resolver still runs once per appearance.

Evidence (new prefixes, old files retained): `tests/gdd1/f4-grok-cloudy-v1.json` spins 1/2 cloudy age 1/2, spin 3 `blank_facet` total 3 no appearance +2; focused 27/27 in `f4-grok-focused-v2.json`; independent 32/32 in `f4-grok-semantic-v2-results.json`.

Independent auditor signature remains a separate document. This file does not claim F4 PASS.
