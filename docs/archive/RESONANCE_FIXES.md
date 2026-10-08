# 共振 schema 修复记录

独立审核 [`RESONANCE_AUDIT.md`](RESONANCE_AUDIT.md) 的行为部分为 15/15；本修复针对其 3 个 schema 失败，未修改审核报告或任何独审预期。

修复位于 [`js/data/content.js`](../js/data/content.js) 的通用 `validateContent()`：

- 数值表达式 `count` 只接受 `area/tags/uniqueTypes/max/excludeSelf`，未知字段（包括 `at`）拒绝；`max` 严格为非负安全整数。`count.at` 在谓词语义中表示“至少匹配数量”，内容阈值要求正整数，因此 `at:0` 拒绝；数值表达式不会把 `at` 当阈值强行解释。
- `rowUniqueTypeCount` 要求 `at` 与 `exact` 恰好二选一，均为正安全整数；未知字段和非法 `excludeSelf` 类型拒绝。
- `cycle` action 要求合法计数器名称、正安全整数 `threshold`、非负安全整数 `reset`，并拒绝字符串阈值和未知 action 字段；没有类型强转。

新增实际测试位于 [`tests/resonance-behavior.js`](../tests/resonance-behavior.js)：零阈值拒绝、合法 `count.max=0` 边界、`at/exact` 互斥、字符串 cycle threshold 拒绝。测试仍通过 Node/browser 加载，未删除原 225 case。

验证：

- `node tests/run.js`：229/229
- `node tests/audit-resonance.js`：18/18
- `node tests/audit-cultivation.js`：7/7
- `node tests/audit-cultivation-retest.js`：6/6
- `node tests/audit-recycling.js`：10/10
- `node tests/audit-distillation.js`：17/17
- `node tests/fixture-report.js`：10/10
- Edge file：4/4
- HTTP：passed=true

共振路线状态仍为待复测；M3–M5、其他正式符号、道具、事件、锁位权重、平衡和视觉继续未完成。
