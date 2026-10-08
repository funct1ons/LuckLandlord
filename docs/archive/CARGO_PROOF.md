# 夜班货运证明（M3–M5）

本批冻结 8 个正式 ID：`cargo_rope`、`route_stub`、`parcel_cage`、`sorting_runner`、`manifest_desk`、`switch_lamp`、`transit_seal`、`return_station`。实现使用 resolver 的通用 selector、predicate、action、event、counter/limit；resolver 未加入货运 ID 分支。

| ID | 实际语义与精确期望 |
|---|---|
| cargo_rope | 邻接 product 按位置稳定选一个，`+3`；两个目标仍只加一个，非 product 不受益。 |
| route_stub | 盘面 cargo 去重 type ≥3 时自身 `+4`，否则基础值；同 type 不重复计数。 |
| parcel_cage | 空盘格 `20 - 上盘格数` ≥4 时自身 `+3`；池大小与空格分开。 |
| sorting_runner | 邻接 product 单目标消耗；独立奖励 `6 + 目标定义 baseValue`，永久值与倍率不计入；无目标无奖励。 |
| manifest_desk | cargo 去重 type ≥4 时自身最终 `×3`，否则基础值；倍率按最终 floor 规则。 |
| switch_lamp | 邻接 product 稳定目标写入下一轮原格保留记录，实例 UID 归因，最多两格且重复目标不延长。 |
| transit_seal | ON_APPEAR 优先统计邻接 `plant → crystal → resonance`，临时加入数量最多标签；同数按该顺序，池实例 tags 不变。 |
| return_station | 仅当邻接 cargo source 成功 consume product 时独立奖励 `8`；非 cargo source、非 product、离盘源均不触发。 |

行为套件 `tests/cargo-behavior.js` 共 48 条货运 case（机器统计），包括每 ID schema/负向/边界，单目标竞争、非目标不受益、不同 type 去重、空格边界、目标基础值奖励、临时标签生命周期、消费归因、生成/保留 UID 与存档状态字段边界。Node `tests/run.js` 显式载入并执行。

实测：Node 全套 `277/277`；旧核心、正式 24 符号、独审培育/回收/蒸馏/共振及 fixture 均保持通过。此前基线为 `229/229`，本批新增货运与 schema 行为后机器 manifest 保留旧 case。

命令：

```text
node tests/run.js
node tests/audit-cultivation.js
node tests/audit-cultivation-retest.js
node tests/audit-recycling.js
node tests/audit-distillation.js
node tests/audit-resonance.js
node tests/audit-resonance-retest.js
powershell -ExecutionPolicy Bypass -File tests/browser-check.ps1
node tests/http-check.js
```

货运之后仍未完成：其余 24 个正式符号、32 道具完整效果、8 事件事务、完整锁位/权重平衡、视觉与最终独立审核。
