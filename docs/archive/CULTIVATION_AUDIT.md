# 培育八规则独立冻结快照审核

审核范围仅为培育八个 ID：`mist_pouch`、`wick_bed`、`dew_lantern`、`amber_frond`、`fog_stitcher`、`root_ledger`、`warm_pod`、`nursery_gauge`。本审核没有修改实现或既有测试；新增验证文件为 [tests/audit-cultivation.js](../tests/audit-cultivation.js)。不得据此宣称 M3–M5 完成。

## 执行结果

- `node tests/run.js`：**PASS 145/145**。
- `node tests/fixture-report.js`：**PASS**，10 个 fixture 与手算一致。
- `node tests/audit-cultivation.js`：**FAIL 5/7**；2 个行为失败，5 个边界通过。
- `tests/cultivation-behavior.js` 统计 `run(` 为 21 个，达到“至少 20”数量门槛；数量本身不等于覆盖质量。

审计脚本输出的失败为：

1. `two-root-ledgers-each-per-spin-cap`：预期两个独立 root ledger 在同轮各获得 2 次 plant 转换成长，实际均为 1。复现：`node tests/audit-cultivation.js`。原因是 [resolver.js](../js/engine/resolver.js:6) 的 `rootGrowthCount` 是一次 resolve 的共享计数器，且 [resolver.js](../js/engine/resolver.js:13) 用 `rootGrowthCount++<2` 截断所有 root ledger，而不是每个监听者各自的 per-source 限额。该语义也依赖 resolver 中的 `q.obj.type==='root_ledger'` ID 判断。
2. `ash-felt-three-appear-self-destroy`：预期第三次上盘结束时 `alive=false,reward=3`，实际 `alive=true,reward=0`。复现：`node tests/audit-cultivation.js`。矩阵要求见 [CONTENT_MATRIX.md](CONTENT_MATRIX.md:116) 与 [CONTENT_MATRIX.md](CONTENT_MATRIX.md:328)；当前 [content.js](../js/data/content.js:362) 没有 age/上盘计数效果，只有 consume spawn 和一个读取不存在 `age` counter 的 END_SPIN destroy，因此成熟自毁永远不会发生。

## 已通过的独立边界

- `pearl_separator` 对已是 `tide_prism` 的 product crystal 不产生转换日志。
- 转换保留 UID/permanent、清空 counters；该检查走真实 `G.command` 生命周期。
- nursery 两次 plant 转换后全盘存活 plant 只乘一次 3/2，远端 plant 也纳入。
- 存档写入失败返回失败，原档内容不被提交。
- 培育既有行为用例数量为 21。

## 语义与覆盖审查

转换 subject/source/事件时序的基础原语在 `RULES v0.2` 与现有 resolver 中可观察到：转换保留 UID/permanent、清 counter、不重触发 ON_APPEAR；死亡监听允许 event scope 使用快照；独立 reward 不进倍率；邻接 selector 的八方向不跨行；命令使用 clone 后提交，失败回滚。上述基础语义通过已有测试和本次转换/save边界，但培育内容仍有实现专用分支。

明显的 ID 硬编码包括：

- `warm_pod` 的邻居判断直接写在 [resolver.js](../js/engine/resolver.js:13) 的 add handler 中。
- `amber_frond` 消耗奖励直接写在 [resolver.js](../js/engine/resolver.js:13) 的 consume handler 中。
- `root_ledger` 监听与每轮上限直接写在 [resolver.js](../js/engine/resolver.js:13) 的 transform handler 中。
- `nursery_gauge` 的 plant 转换门槛和全盘倍率直接写在 [resolver.js](../js/engine/resolver.js:14) 的 resolve 尾段中。
- `formalM3` 中 `root_ledger` 和 `nursery_gauge` 的效果数组为空，[content.js](../js/data/content.js:352-362)；它们不是由通用 schema 表达。

这破坏了矩阵声明的 P1–P4/P12 通用语义目标：实现把若干规则绑定到名字，无法证明 P1–P12 对 P1–P12 的通用表达能力，也没有证明同一机制键可供 P1–P12 其他符号复用。`validateContent` 只证明结构计数和字段形状，不能证明行为；其 64/32/8 计数检查位于 [content.js](../js/data/content.js:566)。

`tests/formal-symbols.js` 只覆盖培育、回收、蒸馏三组共 24 个 formal ID，并且每个都有 schema-defined/schema-negative 两个浅检查；共振、货运、蓄能、异相、契约其余 40 个符号仍未被该测试行为覆盖。即使 `145/145` 全通过，也不能把形式符号测试当作完整内容验收。

现有培育行为测试对八个 ID 有正负样例，但多数只验证单一数值或单次盘面；没有覆盖双 root 监听者、ash_felt 三次生命周期、事件 cause/source 快照、多监听者/死监听者组合、保存中断后的恢复路径等边界。本独立脚本补了其中可复现的边界并保留失败证据。

## 结论

培育八范围：**FAIL，不能验收**。失败至少涉及 root ledger 多监听者限额与 ash_felt 成熟自毁；其余通过项只能证明基础 resolver/save 原语和部分培育路径可运行。报告范围严格止于培育八，不宣称 M3、M4 或 M5 完成。
