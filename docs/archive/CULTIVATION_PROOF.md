# Cultivation proof

本批已完成 8 个培育 ID 的精确行为验收，测试入口为 [tests/cultivation-behavior.js](../tests/cultivation-behavior.js)，通过 [tests/run.js](../tests/run.js) 与浏览器入口执行。文件包含 20 个以上行为 case，断言 UID、类型、age、permanent、普通 ledger、独立 reward、邻接影响、倍率范围和下一轮窗口。

手算规则写在 case 断言中：普通产出为 `floor((base + permanent + add) × multiplier)`；`amber_frond` 消费为 consumer 基础奖励 6 加独立奖励 4；`warm_pod` 为基础 1 加邻接 fuel 的 3；`nursery_gauge` 为全盘存活 plant 的 `floor(value × 3 / 2)`，每轮一次；`root_ledger` 每个成功 plant 转换加 1，perSpin 上限 2，permanent 上限 30。

验证结果：

- Node：`145/145 passed`
- fixture：`10 fixtures reported; all match manual expectation: true`
- Edge file：`data-result="pass"`
- Edge HTTP：`edgeExit: 0, passed: true`

关键实现修复包括对象 selector 的 `area` 读取、predicate 的邻接与 count 目标解析、转换事件只向正确的 target subject 广播、转换前 plant 标签快照、age 转换清零、root_ledger 的每轮计数和封顶、warm_pod 的真实邻接 fuel 判定、nursery_gauge 的两次转换门槛及全盘一次性倍率。

旧 `formal-symbols.js` 中的弱断言仍作为 schema/历史回归保留，但不计行为覆盖。发现 `copper_burr/machine-condition` 原断言在无 machine 邻居时期待 4，违反矩阵“邻接 machine 才自身 +2”；已改名为 `machine-condition-legacy-error-corrected`，改为无邻居时精确 2，并记录原断言无效原因。其余旧 16 项无效项不作为本批行为通过依据。
