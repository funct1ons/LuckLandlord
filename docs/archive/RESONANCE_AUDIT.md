# C 共振冻结独立审核

审核范围严格限定为 8 个 C 共振符号：`dock_chime`、`pitch_fork`、`fog_reed`、`beat_spool`、`chord_frame`、`prism_hum`、`silence_keeper`、`harbor_conductor`。本次只新增 [tests/audit-resonance.js](../tests/audit-resonance.js) 与本报告；没有改实现、既有测试、矩阵或 manifest。

## 结论

行为边界：**PASS，15/15**。新增测试验证了矩阵要求的行首尾不绕行、八邻接含对角线、稳定单目标、排除自身、不同 type 去重、周期计数与重置、多个实例独立计数、同排精确正负边界、倍率精确比值、转换不重触发出现、真实命令保存/恢复。

schema 严格性：**FAIL，3/4**。非法输入中未知标签被拒绝；但以下三类非法定义被当前 `validateContent()` 接受：

- `count.at = 0`：测试 `schema/count-zero-threshold`，预期拒绝，实际未抛错。复现：`node tests/audit-resonance.js`。
- `rowUniqueTypeCount` 同时含 `at` 与 `exact`：测试 `schema/row-count-both-at-exact`，预期拒绝，实际未抛错。复现同上。
- `cycle.threshold = "3"`：测试 `schema/cycle-invalid-threshold-type`，预期拒绝，实际未抛错。复现同上。

证据位置：schema 对 `rowUniqueTypeCount` 的检查在 `js/data/content.js:573`，没有要求 `at/exact` 互斥或至少一个存在；count 表达式检查在 `js/data/content.js:537`，没有约束阈值字段；cycle 动作仅列入 `G.actions`，没有对 `threshold/name/reset/amount` 做动作专用字段类型检查。审核不自行修实现。

## 新增真实边界用例

`tests/audit-resonance.js` 共 18 项：15 项行为/保存恢复通过，4 项 schema 探针中 1 项通过、3 项失败。helper 的流程是先以 `G.newRun()` 创建原始 state，再创建实例、布置 board，最后首次调用真实 `G.command(... type:'spin')`；周期与保存恢复继续走真实 `choose`、`store`、`load` 命令路径，没有先 resolve 后改状态的假测试。

预期值均直接按矩阵手算：例如 dock 同排两个相同 type 只计 1；pitch 对角线相邻、边界位置不环绕；beat 第三次为 `1+9=10` 后计数归零；chord 邻居基础值 3 乘 `2/1` 为 6；harbor 同排三类时全排乘 2，dock 自身先得同排异类上限 +3 后再乘为 10。

## 冻结验证记录

- `node tests/run.js`：**225/225 passed**。manifest 的原有基线为 201（core 50 + formal 75 + cultivation 24 + recycling 23 + distillation 29），新增 resonance 为 24，总计 225；原 201 名称均保留。
- `node tests/audit-cultivation.js`：7/7 passed。
- `node tests/audit-cultivation-retest.js`：6/6 passed。
- `node tests/audit-recycling.js`：10/10 passed。
- `node tests/audit-distillation.js`：17/17 passed。
- `node tests/fixture-report.js`：10 fixtures，全部符合人工预期。
- `powershell -ExecutionPolicy Bypass -File tests/browser-check.ps1`：Edge file 检查 4/4 passed（`index.html`、`ui-smoke.html`、storage write/read）。
- `node tests/http-check.js`：HTTP smoke passed，Edge exit 0，证据为 `tests/http-smoke-result.html`。
- `tests/index.html` 明确加载 `resonance-behavior.js`；`tests/browser-tests.js` 执行 `resonanceBehaviorTests()`。浏览器 suite 与 Node manifest 均执行原 201 + 共振 24；新增独立审计脚本不修改既有 suite/manifest。

## 范围声明

本报告只给上述 8 个共振符号的冻结审核结论。M3–M5 总体仍未完成；其他路线、道具、事件不因本次 Node、fixture 或浏览器基线通过而获得完成声明。未对实现作任何修复。
