# C 共振 schema 独立复测

范围仅为 C 共振八符号：`dock_chime`、`pitch_fork`、`fog_reed`、`beat_spool`、`chord_frame`、`prism_hum`、`silence_keeper`、`harbor_conductor`。本次只新增 [tests/audit-resonance-retest.js](../tests/audit-resonance-retest.js) 与本报告，没有修改实现、既有 suite、原审计脚本或历史报告。

## 结论

**PASS：共振八符号 schema 与行为冻结复测通过。**

- 原独立共振审计：18/18 PASS。
- 新增独立 schema 边界：18/18 PASS。
- 复测范围没有外推到其他正式内容；M3–M5 整体仍未完成。

## 独立新增边界

脚本 `tests/audit-resonance-retest.js` 独立加载当前运行时，新增 18 项：

- 合法 `count.max=0`，同时验证合法 `uniqueTypes` 与布尔 `excludeSelf`。
- 非法 count `max` 字符串、`NaN`、超出安全整数范围。
- 非法 count 未知字段、非法 `excludeSelf` 类型。
- 合法 `rowUniqueTypeCount.at` 正整数。
- 合法 `rowUniqueTypeCount.exact` 正整数与布尔 `excludeSelf`。
- 非法 row `at=0`、`at+exact` 同时存在、未知字段、非法 `excludeSelf`。
- 合法 `cycle.threshold=1` 与 `reset=0`。
- 非法 cycle `threshold=NaN`、不安全整数、负 `reset`、未知字段。
- 深度超过契约的数值表达式拒绝。

每个 probe 都先保存原始对象 JSON，执行合法或非法变更，调用 `validateContent()`，再删除对象现有字段并恢复快照；row predicate 也逐项恢复原始快照。18 项均确认接受/拒绝结果正确，且恢复后的对象与调用前完全一致，证明本次校验没有 mutation。

## 规则核对

当前 `js/data/content.js` 的校验路径已符合冻结说明：

- count 数值表达式只接受 `area/tags/uniqueTypes/max/excludeSelf`；`max` 为非负安全整数，未知字段和非法类型拒绝。
- count 谓词的 `at` 要求正安全整数，未知字段拒绝。
- `rowUniqueTypeCount` 的 `at` 与 `exact` 严格二选一，均要求正安全整数；未知字段和非法 `excludeSelf` 拒绝。
- `cycle` 要求合法计数器名、正安全整数 `threshold`、非负安全整数 `reset`，未知 action 字段拒绝；不会进行字符串或其他类型强转。
- 表达式递归深度超过 8 层拒绝。

## 完整验证

- `node tests/run.js`：**229/229 PASS**。
- `node tests/audit-resonance.js`：**18/18 PASS**。
- `node tests/audit-resonance-retest.js`：**18/18 PASS**。
- `node tests/audit-cultivation.js`：**7/7 PASS**。
- `node tests/audit-cultivation-retest.js`：**6/6 PASS**。
- `node tests/audit-recycling.js`：**10/10 PASS**。
- `node tests/audit-distillation.js`：**17/17 PASS**。
- `node tests/fixture-report.js`：**10/10**，全部符合人工预期。
- Edge file 新 profile：**4/4 PASS**。执行命令使用新的绝对临时 profile：`powershell -ExecutionPolicy Bypass -File tests/browser-check.ps1 -Profile <new-temp-profile>`。
- HTTP smoke：`tests/http-check.js` 返回 `passed:true`，Edge exit 0。

## manifest 核对

当前 [tests/suite-manifest.json](../tests/suite-manifest.json) 为：

- total 229
- passed 229
- failed 0
- 原有 225 条全部保留
- resonance suite 从 24 增至 28，新增 4 个冻结 schema case

浏览器入口继续加载并执行原有共振 suite；本次独立复测脚本不改浏览器 suite 或 manifest 生成逻辑。

复测结论只覆盖 C 共振八符号及其通用 schema 边界。M3–M5、其他正式符号、道具、事件、锁位权重、平衡与视觉仍未完成。
