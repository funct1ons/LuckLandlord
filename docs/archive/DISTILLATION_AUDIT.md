# 蒸馏 8 独立冻结审核

审核对象：`brine_strip`、`saline_ampoule`、`condense_coil`、`tide_prism`、`deep_still`、`crystal_index`、`pearl_separator`、`reserve_facet`。

本审核只新增 `tests/audit-distillation.js`，包含 12 个精确断言：真实 `G.command` 生命周期、spin settle、阶段推进、保存恢复、多实例限额、转换 UID/永久值/计数、转换不重放 `ON_APPEAR`、`deep_still` 生成、crystal 异类型去重、product 过滤和非法 `eventTargetType` schema。

## 结果

| 检查 | 结果 |
|---|---:|
| 蒸馏 8 精确独立审计 | **FAIL：11/12** |
| Node 全套 | **PASS：196/196** |
| cultivation audit | **PASS：7/7** |
| cultivation retest | **PASS：6/6** |
| recycling audit | **PASS：10/10** |
| fixture 10 | **PASS：10/10** |
| Edge file/HTTP 4 | **PASS：4/4** |
| suite-manifest 原 172 名称与新增 24 | 保持原 manifest；本审核未修改 |

运行命令：

```text
node tests/audit-distillation.js
```

## 纠正后的规则裁定

原先两项 FAIL 是审计误读，已仅修改审计脚本与本报告：

- `brine_strip`：`CONTENT_MATRIX.md` D 区明确写“第 2 次上盘转换为 saline_ampoule”。原测试错误地把它写成第三次，并错误地把首次调用的状态解释为第三次边界。现在 `tests/audit-distillation.js:12` 预置 `age=1`，验证第二次上盘转换，PASS。矩阵关于“第 N 次上盘转换仅 age 进度”的统一说明也支持这一裁定。
- `reserve_facet`：矩阵 D 行写“蓄压达 6 时结束阶段发独立奖励 18 并归零”；同文件统一结构约定要求 reserve 等“结构动作完成后统一阈值步骤”；`RULES.md` 解析段明确 `ON_END_SPIN` 在最终 ledger 前执行。因此“结束阶段”在当前规则语境中是 spin 结束处理阶段，不能擅自解释成付款/租金阶段末。正常 `G.command` 单实例路径和保存恢复现已 PASS。

## 剩余真实 FAIL

`tests/audit-distillation.js:19` 固定盘面为：

```text
reserve_facet@0, wick_bed@1, reserve_facet@2, wick_bed@3
```

两个 reserve 各自都有独立、合法、相邻的 fuel；不存在同一 fuel 竞争。两者预置 pressure=4，各消费一个 fuel，手算应为：

```text
2 个消费奖励 × 2 + 2 个阈值释放 × 18 = 40
```

实际 reward 为 38。两个 reserve 的 pressure 都清零，但只收到一份 18 释放，说明多实例 `ON_CONSUME` 到 self counter/阈值释放的归因或去重存在真实缺陷。该 FAIL 不来自邻接不合法、同一 fuel 竞争或阶段末延迟误读。

## 边界说明

`tests/distillation-behavior.js` 的 24 个旧用例直接调用 `G.resolve`，不能用总数替代 8 个 ID 的生命周期证明。蒸馏 8 的 11/12 也不能外推为 M3–M5 全部完成。本次没有修改实现、现有测试、矩阵或 suite manifest。
