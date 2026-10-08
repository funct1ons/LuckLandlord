# 历史归档

这里保留旧提案、原型计划、阶段交接、问题冻结与独立审计证据。**不是当前待办或验收状态。** 原文中的“当前”“未实现”“待审核”和PASS/FAIL都属于其记录时点与覆盖范围；不追溯改写历史结论。

现行入口见 [文档导航](../README.md)。规则设计、故事和视觉分别以 [GAME_DESIGN_V1](../GAME_DESIGN_V1.md)、[GAME_IDENTITY](../GAME_IDENTITY.md)、[VISUAL_SPEC](../VISUAL_SPEC.md) 为入口。

## 本轮整理

| 文件 | 保留原因 |
|---|---|
| [VISUAL_DIRECTION_PROPOSAL.md](VISUAL_DIRECTION_PROPOSAL.md) | 已批准并执行的A方向提案、参考作品与决策依据 |
| [PLAYER_SHELL_ISSUES.md](PLAYER_SHELL_ISSUES.md) | 原始问题冻结、后续解决记录与本次视觉证据；已完成，不再充当待办 |
| [PLAYER_SHELL_HANDOFF.md](PLAYER_SHELL_HANDOFF.md) | 早期玩家外壳交接快照；视觉改版以现行规范为准 |
| [EXECUTION_PLAN.md](EXECUTION_PLAN.md) | 最初从零开发计划，包含当时授权与工程假设 |
| [PROGRESS_LEGACY.md](PROGRESS_LEGACY.md) | 旧机制路线/审计进度，不代表今日外壳完成情况 |
| [CONTENT_MATRIX.md](CONTENT_MATRIX.md) | CM-0.1历史内容提案，与现行GDD和运行数据有意不同 |
| [CHANGELOG_PROTOTYPE.md](CHANGELOG_PROTOTYPE.md) | 旧M0–M5原型开发记录 |
| `screenshot-tool/` | 过期截图HTML、配套脚本及旧胜利图，已停止维护；不要用于当前页面生成 |

原执行计划、进度和矩阵在旧路径仍有兼容副本，因为历史冻结工具按路径和内容读取它们。此处集中展示归档；不删除冻结输入、不伪造新的审计结论。文内普通代码路径按原写作时仓库结构解释。

## 其他历史材料

其余 `*_PROOF`、`*_AUDIT`、`*_FIXES`、`*_RETEST` 等保留阶段证据与故障处理过程，不能由后来的UI回归推导为旧机制缺口已经解决。历史规则、数值和手算预期不在这轮整理中重写。

当前截图由 `tests/gdd1/shell-shot.js` 和 `visual-shot.js` 生成，正式手册图位于 `docs/images/`；旧截图工具的存档不保证能够在现行UI上运行。
