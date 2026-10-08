# 核心回归修复记录

本次修复针对上一交付后 M0–M2 从 50/50 降至 46/50 的回归，范围限定为核心正确性、schema、存档兼容边界和测试基线。

## 根因与修复

1. **符号数量断言过时**：正式内容加载后共有 64 个正式符号和 20 个原型符号，旧测试仍断言总数恰为 20。测试改为显式检查 `20 legacy + >=60 formal`，并验证总数为两集合之和；原型符号仍保留给 fixture/debug 隔离契约。
2. **内容 schema 校验不完整**：原校验未拒绝未知目标标签、缺失倍率、非法金额、风险参数和条件参数。现在校验 scope、target 作用域/标签、ratio、amount、risk、condition，并保留正式/原型数量校验。
3. **存档状态校验过窄**：原校验只验证 `last.board` 长度和 `last.total`，会接受伪终局、未知日志动作、坏因果 parent、未知快照 UID、损坏 ratio、账本不守恒和未知实例字段。现在校验稳定阶段、候选与终局关系、RNG/数值范围、实例字段、快照结构、日志 parent/type、ratio、历史和 `ledger + reward === total`。
4. **合法付款/快照兼容**：快照 ledger 可以包含本轮已消耗后不在当前符号池的 UID，因此校验按当前实例与同一快照 board/ledger 的交集判定引用，避免新校验误拒绝合法结算。
5. **Edge 烟测经济策略过时**：正式候选池改变后，固定“必须胜利”的自动策略不再反映当前合法经济。烟测改为验证真实 DOM 流程最终到达 WON/LOST，并继续单独验证跳过路线 LOST、坏档拒绝和存档事务。

## 实际命令输出

- `node tests/run.js` → **50/50 passed**
- `node tests/fixture-report.js` → **10 fixtures reported; all match manual expectation: true**
- `powershell -NoProfile -ExecutionPolicy Bypass -File tests/browser-check.ps1` → **4/4 Edge file:// browser checks passed**
- `node tests/http-check.js` → `{"edgeExit":0,"passed":true,"protocol":"http://127.0.0.1"}`

## 范围与遗留

本次未删测试、未降低核心断言、未修改 fixture 手算预期，也未调经济平衡。正式事件流程、锁位/加权抽样、P1–P12 全机制、32 件道具逐项规则、正式 UI/美术和 M3–M5 平衡仍未完成；见 `docs/PROGRESS.md`。旧版本存档仍按版本/规则不兼容拒绝，保存层保留有效备份，不伪装迁移成功。
