# 压力事务修复独立复测

结论：压力事务修复与压力8范围**实测通过**；本报告仅覆盖压力8与事务修复，不外推 M3–M5。实现、已有 tests、原报告历史均未修改；仅新增本报告与 `tests/audit-pressure-transaction-retest.js`。

## 新增独审

新增 10 个边界 case（超过要求的8）：多次 save/reload 后 choose、防非法 choose 状态与存储不变、主档/备份缺失与双损坏、signed ±1e9 现金截断、稳定旧档四 phase 缺字段迁移、旧 SYMBOL_CHOICE 缺字段拒绝、塔无合法目标、legacy/formal schema 合法。

`node tests/audit-pressure-transaction-retest.js`：**10/10 PASS**。

原独立压力复测 `node tests/audit-pressure-retest.js`：**49/49 PASS**。原压力 `node tests/audit-pressure.js`：**39/39 PASS**。

## 修复契约核验

- `validation.js:3–11`：SYMBOL_CHOICE 的 pending 必须为 safe integer、绝对值≤1e9、存在 last 且等于 `last.total`；其他稳定阶段必须为 null。
- `save.js:2`：READY/ITEM_CHOICE/WON/LOST 旧档缺 pending 迁移 null；旧 SYMBOL_CHOICE 缺字段拒绝；decode 先验证，load/store 不改坏主档、backup。
- `game.js`：spin 写 pending，不提前改 cash；choose 单次入账并清空；付款后再进入 WON/LOST/ITEM_CHOICE；旧 revision/重复命令拒绝。
- `resolver.js:8`：releasePressure 先过滤压力≥amount、排除自身释放阈值，再稳定单选；两个合法目标只释放第一个，无合法目标不变。
- `content.js`：counter/releasePressure/risk 严格字段白名单、必填项、safe integer/范围校验；legacy 与 formal 合法 schema 保持通过。

## 运行结果

| 命令 | 实测 |
|---|---|
| `node tests/run.js` | **357/357 PASS** |
| `node tests/audit-pressure-transaction-retest.js` | **9/9 PASS** |
| `node tests/audit-pressure-retest.js` | **49/49 PASS** |
| `node tests/audit-pressure.js` | **39/39 PASS** |
| cultivation audits | 7/7、6/6 |
| recycling audit | 10/10 |
| distillation audit | 17/17 |
| resonance audits | 18/18、18/18 |
| cargo audits | 18/18、15/15 |
| fixture report | 10/10 |

Node manifest 为 **357**，保留原305名称并新增 pressure-transaction 52 个，名称唯一；未改原 manifest 内容。原305 browser case 与新增52均由 browser suite 执行，目标357/357。

## 浏览器与 HTTP

按全新 profile 执行 `browser-check.ps1` 四个 file URL：index、ui-smoke、storage write/read 均 exit 0，严格 DOM 属性 `data-result="pass"` / `data-smoke="pass"` 通过。HTTP 入口执行 `node tests/audit-pressure-retest.js --http`：Node 49/49，HTTP Edge exit0，strict smoke 与独立坏导入原子性检查均 PASS。

真实 UI 生命周期覆盖：spin→SYMBOL_CHOICE 不提前入账；save/reload 后 choose 只入账一次；末轮正/负收益分别进入正确终局并按0截断；非法 pending 导入拒绝且内存、主档、backup不变。

规则依据：RULES 的最后轮先选择再付款、负收益 cash floor 0、稳定节点恢复不重算、非法导入不得覆盖原状态；CONTENT_MATRIX §3.1 的 release_spire 单目标/先筛资格约束。报告不宣称人工试玩、视觉审查、平衡或 M3–M5 完成。
