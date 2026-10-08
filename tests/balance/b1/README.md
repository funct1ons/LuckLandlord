# tests/balance/b1 — 工作包A产物

对应 [数值调整方案 B1](../../../docs/BALANCE_ADJUSTMENT_PLAN.md) §3、§7 的「A 测量可信」。
**这不是平衡验收，也不代表任何游戏数值已调整。**

## 目录内容

| 路径 | 内容 | 是否入库 |
|---|---|---|
| `configs/P0-baseline.json` | 现行正式数值基线（无覆盖） | 是 |
| `self-check/` | 10 个固定 seed × 4 策略的工具自检证据 | 是 |
| `baseline-train100/aggregate.json` | 聚合结果（含生效参数快照） | 是 |
| `baseline-train100/report.md` | 批次报告 | 是 |
| `baseline-train100/analysis.md` / `analysis.json` | 旧结论核查 | 是 |
| `baseline-train100/games.jsonl` | 逐局原始记录 | **否**（`.gitignore` 排除 `*.jsonl`，可重建） |
| `baseline-train100/seeds.json` | seed 清单与哈希 | 是 |
| `baseline-train100-run.txt` | 原始运行输出 | 是 |

`games.jsonl` 被排除是仓库既有规则（大文件可重建）。重建命令见根目 `docs/BALANCE_B1_REPORT.md`；
聚合结果里带有该批次的 `sourceHash` / `configHash` / `seedsHash`，可用于确认重建是否同源。

## 复现

```powershell
node tests/tools/balance-v1.js --self-check --config tests/balance/b1/configs/P0-baseline.json --out tests/balance/b1
node tests/tools/balance-v1.js --config tests/balance/b1/configs/P0-baseline.json --games 100 `
  --policies random,value,synergy,greedy --out tests/balance/b1/baseline-train100 --label baseline-train100
node tests/tools/balance-v1.js --analyze tests/balance/b1/baseline-train100
```

## 边界

- 只使用训练集前缀 `B1-TRAIN-*`。留出集 `B1-HOLDOUT-*` 被工具显式拒绝，本轮不得运行。
- 未修改 `js/`、存档、UI 或素材；参数覆盖只在内存中，非法覆盖一律报错而非静默忽略。
- 失败 seed 一律保留并计入报告，不删除、不重抽。
- `ERROR` 与 `LOST` 严格分离：有 ERROR 时该批 `batchOk=false`，且胜率标注为不可用。
