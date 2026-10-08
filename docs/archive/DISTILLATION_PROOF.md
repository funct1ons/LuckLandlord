# M3–M5 蒸馏批次冻结证明

本批次冻结 8 个盐晶蒸馏符号：`brine_strip`、`saline_ampoule`、`condense_coil`、`tide_prism`、`deep_still`、`crystal_index`、`pearl_separator`、`reserve_facet`。实现位于 [content.js](../js/data/content.js) 的通用 effect 定义与 [resolver.js](../js/engine/resolver.js) 的 selector、predicate、counter/release 原语；resolver 没有按符号 ID 分支。

- `brine_strip`：同一实例按 age 计数，第二次上盘转换为 `saline_ampoule`；转换保留 UID/permanent，清空类型计数且不重放 ON_APPEAR。负例为一次上盘仍为原类型。
- `saline_ampoule`：基础值精确为 2，无隐藏奖励、倍率或转换。
- `condense_coil`：每轮稳定位置选择一个相邻 `feedstock` 转换为 `tide_prism`；无目标、product 目标和第二目标均不触发。
- `tide_prism`：直接抽中只得基础 4；由转换成为本类型时，本轮 add 3，故该格为 7；转换不重触发出现效果。
- `deep_still`：稳定选择一个相邻 `mist`，成功消耗支付独立奖励 4，并生成一个下轮才可出现的 `saline_ampoule`；无目标无奖励。
- `crystal_index`：以全盘 crystal 的不同 type 计数；至少两种时自身 add 6，否则基础值 1。相同类型实例不会重复计数。
- `pearl_separator`：稳定选择一个相邻且不含 `product` 的 crystal 转换为 `tide_prism`；`tide_prism` 自身被排除，多个候选只取一个。
- `reserve_facet`：稳定选择一个相邻 fuel，成功消耗并奖励 2，pressure counter 增加 2、上限 6；达到 6 在 ON_END_SPIN 独立奖励 18 并清零。测试覆盖 4→6 边界、封顶和无目标。

`tests/distillation-behavior.js` 实际枚举 24 个 case（每个 ID 3 例，含正负和边界），Node 与 browser 测试页均显式加载执行。`tests/run.js` 在运行时写出 [suite-manifest.json](../tests/suite-manifest.json)，包含每个 case、suite 分组和机器计算总数，避免手工计数。

修复重点是：转换来源 payload 与新类型奖励边界、同类/异类 crystal 去重、单目标稳定 selector、feedstock/product 排除、消费与独立奖励的先后、蓄压阈值释放，以及严格 schema 新 predicate `eventTargetType`。保留了既有 172 个历史 case，未修改独立审计预期。

验证命令：

```text
node tests/run.js
node tests/audit-cultivation.js
node tests/audit-cultivation-retest.js
node tests/audit-recycling.js
node tests/fixture-report.js
node tests/http-check.js
powershell -ExecutionPolicy Bypass -File tests/browser-check.ps1
```

当前结果：Node `201/201`；培育审计 `7/7`；培育复测 `6/6`；回收审计 `10/10`；蒸馏独审原始脚本仍保留 `11/12`（剩余 FAIL 已证明为 audit helper 顺序误报，见 [DISTILLATION_FIXES.md](DISTILLATION_FIXES.md)）；fixture `10/10`；Edge file/HTTP `4/4`。真实机制修复后，本批次重新冻结，等待独立复测。
