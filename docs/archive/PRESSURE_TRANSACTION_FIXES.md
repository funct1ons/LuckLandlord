# 压力事务修复记录

范围仅压力8接续复测；不修改独审预期、CONTENT_MATRIX、旧305用例或独立报告。实现覆盖19项真实失败，新增 `tests/pressure-transaction.js` 52个机器回归，并接入 Node/browser manifest。

| # | 根因 | 实现 | 回归 |
|---|---|---|---|
| 1 | pending 未校验类型 | SYMBOL_CHOICE 仅接受安全整数金额 | pending damaged |
| 2 | pending 对象可透传 | 拒绝对象/数组/布尔/字符串 | damaged/schema |
| 3 | 旧待选档缺 pending | 缺字段稳定阶段迁移 null；待选阶段拒绝 | legacy undecided |
| 4 | pending null 丢收益 | 待选节点必须有 last.total | P15 |
| 5 | pending 与 last.total 不一致 | 严格相等校验 | P22 |
| 6 | 非整数 pending | 安全整数边界 | P21 |
| 7 | pending 金额超范围 | 绝对值不超过 1e9 | boundary |
| 8 | 不安全整数 | Number.isSafeInteger | boundary |
| 9 | READY/终局残留 pending | 非待选阶段必须为 null | phase matrix |
| 10 | choose 信任损坏金额 | decode/encode/command 三层校验 | P15/P22 |
| 11 | 旧 SYMBOL_CHOICE 解码后 choose 崩溃 | 明确拒绝而非半迁移 | P25 |
| 12 | 塔 selector count all | releasePressure 强制稳定单目标 | P31/P37 |
| 13 | 塔低压目标阻挡合法目标 | 先过滤 pressure >= amount | P17/P37 |
| 14 | 塔抢已达自释放阈值 | selector 排除 self-threshold | P17/P37 |
| 15 | counter 未知名/未知字段 | 仅 age/beat/pressure，严格白名单 | P19/P33 |
| 16 | counter 非法数值 | delta/max/at/reset 非负安全整数 | P34/schema |
| 17 | releasePressure schema 宽松 | amount 正整数、ratio 正整数二元组 | P34 |
| 18 | risk schema 宽松 | chance/loss/amount 必需且类型严格 | P35 |
| 19 | 坏主档导入覆盖状态/备份 | decode 先验，load/store 保持原子不变 | P36 + HTTP UI |

现金路径保留原行为：choose 只提交一次 pending，负收益允许且现金下限为0；末轮成功/失败、阶段推进、重复命令均回归通过。动作 schema 保留合法 legacy/formal effect，不使用 ID 硬编码。

## 验证命令

- `node tests/audit-pressure-retest.js`: 49/49
- `node tests/audit-pressure-retest.js --http`: Node 49/49；HTTP Edge 4/4，含真实 UI 损坏 pending 导入不变检查
- `node tests/run.js`: 357/357，manifest 新增 `pressureTransaction: 52`，名称357唯一
- `node tests/audit-pressure.js`: 39/39
- 旧独审：cultivation 7/7 + retest 6/6；recycling 10/10；distillation 17/17；resonance 18/18 + retest 18/18；cargo 18/18 + retest 15/15
- `node tests/fixture-report.js`: 10/10
- `powershell -ExecutionPolicy Bypass -File tests/browser-check.ps1`: Edge file 4/4，严格 DOM 属性通过

PROGRESS 仍保持“待独审”；M3-M5 未完成。本记录不宣称平衡、人工试玩或后续路线完成。
