# Mechanics Batch 1 — Stabilization Record

Status: code snapshot stabilized for independent review.

- Actual wired 24-symbol slice: cultivation, recycling, and distillation (A/B/D), matching the current implementation and prior worker wiring. The original route request said cultivation, recycling, and resonance; resonance is not claimed complete here.
- Schema contract now accepts structured selector objects in `target` or `selector`, while retaining legacy string targets. It validates selector areas/tags/count/order, recursive predicates (depth 8), bounded numeric expressions (`constant`, `counter`, `min`, `max`, `add`, `mul`), ratios, limits, trigger/action/tag references, and rejects invalid zero/negative ratio denominators, unknown tags/actions, and malformed fields.
- Existing resolver budgets remain enforced: depth 32, 5000 effects, 40 spawns, pool 200, and safe integer monetary totals. Legacy event/copy/death snapshot and fixture semantics are preserved.
- Validation evidence: `node tests/run.js` => 50/50; `node tests/fixture-report.js` => 10/10 manual values; browser file checks => 4/4; HTTP smoke => passed.

Remaining: full P1–P12 mechanics, persistent item bus, event transactions, weighted retention/candidate controls, resonance/C/E/F/G/H content, and M3–M5 balance are still incomplete. Freeze this snapshot for independent review.


## Formal A/B/D verification update

- Independent test file 	ests/formal-symbols.js now covers all 24 cultivation/recycling/distillation IDs with named positive/negative cases.
- Node and browser entries load the independent suite. Current combined Node result: 125/125 passed (legacy 50 plus formal cases).
- This verifies the wired data/resolver slice; broader P1-P12 mechanics, persistent item bus, events, and resonance/C/E/F/G/H remain outside this batch.

