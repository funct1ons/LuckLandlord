# Clarifications (post freeze-v4 addendum; frozen reports not rewritten)

This file does not overwrite `docs/GDD1_FULL_SIM.md`, `docs/GDD1_FULL_SIM_AUDIT.md`, or freeze-v4.

1. Engineering `full-sim-tool-audit` 7/8 then 8/8 (and later v5 11/11) is implementer self-test. It is not independent tool audit. Independent signature is `docs/GDD1_FULL_SIM_AUDIT.md` (TOOLS_PASS, economy NOT APPROVED).

2. “Greedy ~180/500” in an earlier stage note was each of four shards (`train 0`, `train 500`, `holdout 0`, `holdout 500`), not a single first batch.

3. Random/Value/Synergy 0/2000 each is the recorded result of frozen policies on frozen full-v1 Normal prices. It is diagnostic. It is not a production bug claim and is not a prompt to retune payments.

4. freeze-v4 was created after `GDD1_FULL_SIM.md`, `full-sim-statistics.json` / `recompute` / `gates`, and independent `GDD1_FULL_SIM_AUDIT.md`. It was not created while batches were running.

5. Independent auditor streamed all 8000 for uniqueness, index SHA, attribution, unfinished, and errors; command-replay sample was 24 games. Engineering integrity replayed all 8000 recorded command lists. Job-kill v1/v2 jsonl remain on disk.
