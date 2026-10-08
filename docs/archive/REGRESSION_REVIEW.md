# 回归独立审查

审查对象：`docs/REGRESSION_REPAIR.md`、`tests/suite.js`、fixtures、browser/UI smoke 及其既有结果产物。审查时间：2026-10-04（本次运行时工作区时间）。本文件只记录审查，不修改实现、测试或 fixture。

## 结论

当前不能把回归修复认定为通过。既有产物声称 `50/50`，但在本次共享工作区直接运行得到：

- `node tests/run.js`：`35/50 passed`；
- `node tests/fixture-report.js`：10 个 fixture 均未与手算期望匹配（报告为 `all match manual expectation: false`）；
- `powershell -NoProfile -ExecutionPolicy Bypass -File tests/browser-check.ps1`：首个 `index.html` 检查失败。

因此，`tests/node-result.txt`、`tests/browser-result.html` 和修复文档中的 50/50 只能作为较早时点的历史产物，不能作为当前代码版本的稳定证据。文件时间也显示 `resolver.js` 在 04:06 更新，而 `suite.js` 与 `REGRESSION_REPAIR.md` 在 04:01 更新；这与并行修改或测试竞态相符。不得把本次失败误判成稳定的最终修复结论，也不得把历史 50/50 反向覆盖本次失败。

## 断言与 fixture 审查

静态检查没有发现为恢复 50/50 而删除复杂因果断言或把 fixture 期望改成由引擎生成：`tests/suite.js` 仍检查第三层因果链、根事件类型、竞争消耗一次、转换 ID/永久值/清零、不重复触发、END_SPIN、回滚、最终付款、终局、存档拒绝、29/100、负数向下取整和备份写入失败。`tests/fixture-report.js` 读取 fixture 中独立保存的 `expected` 与 `reason`，再对实际金额作比较；从代码结构看没有用实际值覆盖手算值的绕过。

不过当前运行暴露了真实不一致，集中在金额/因果结果，例如复杂 fixture 出现 `15 != 13`、`16 != 14`、`18 != 16`、`32 != 20`，以及“复制仅 add 模板”出现 `5 != 7`。这属于阻断性实现或并行修改问题，不能以“测试基线已恢复”解释。金额 `29/100` 的静态断言仍存在，但在整套回归未通过时不能单独推出整体修复成立。

## 关键契约覆盖

现有 suite 仍明确覆盖：

- `100 × 29/100 = 29`，并覆盖 `100/-100/101/-101` 及多倍率边界；
- 最终阶段通过 `stage: 9`、最后一次 spin、选择后进入 `WON`；差 1 付款进入 `LOST`，恰好付款现金归零；
- `G.decode` 拒绝缺 stats、伪终局、损坏 last、未知 UID/type、非法 phase/RNG/金额/候选；
- 主档损坏时从有效备份恢复，以及备份写入失败时不提交新主档；
- legacy 20 个原型符号与正式符号分开计数，复杂 fixture 的手算期望仍由 fixture 提供。

这些是存在于测试代码中的审查证据，不等于当前运行已经通过。

## Browser/UI smoke 证据边界

`tests/ui-smoke.js` 走的是真实 Edge DOM 点击流程：正常路线选择价值较高候选并允许一次刷新，持续选择跳过路线直到 `LOST`，检查重复 Spin、保存/继续后的候选与 RNG、坏档导入后状态和主档不变。它没有通过“人为删除整个池”制造失败；跳过路线是合法的选择流程，可证明流程能到达失败终局，但不能当作真实人类 Run、经济平衡或玩家行为证据。

本次 browser-check 在 `index.html` 即失败，因此现有 `ui-smoke-result.html` 中的通过结果也只能视为历史产物。即使该 smoke 通过，它仍不能证明人工试玩、视觉质量、Chrome、三分辨率或关闭浏览器后的人工恢复体验。`storage-smoke` 的跨进程读写和 HTTP smoke 同样只能证明其脚本覆盖的自动流程。

## 处理意见

在 mechanics-core 完成并行修改、冻结可复测版本后，应重新生成 node、fixture 和 browser 结果；在此之前本审查保持阻断状态。无需重复审计 `MECHANICS_GAPS.md` 已列出的未实现内容。
