# 压力蓄能 F 批次证明记录

本批实现 8 个矩阵 ID：`pressure_pouch`、`feed_valve`、`pause_dial`、`surge_vessel`、`cracked_regulator`、`safety_shim`、`release_spire`、`demand_coupler`。

已接入通用效果数据与 resolver：蓄压 counter 有实例级上限；阈值奖励为独立 reward；`surge_vessel` 在阈值前压制普通产出，达到 3 后释放；`release_spire` 以较高优先级先扣除相邻压力目标的 3 点蓄压并乘 3，避免同轮自行释放竞争；风险失败可按数据生成 `spent_gasket`；配额耦合器读取轮初现金和剩余运行窗口。

逐项 Node pressure case（`tests/pressure-behavior.js`）8/8：

- `pressure_pouch`：3 点边界不奖励，第四点精确 reward 10、counter 清零。
- `feed_valve`：竞争消费只移除一个 fuel，reward 3；蓄压达到 6 追加 reward 14，实例计数独立。
- `pause_dial`：ON_APPEAR 平面 +1；相邻 pressure 分支 +2，复制白名单只读 +1。
- `surge_vessel`：前两次普通账本为 0，第三次 reward 16 且普通产出仍为 0。
- `cracked_regulator`：固定 RNG 下成功/失败路径保持确定性，失败生成下一轮可见的 `spent_gasket`。
- `release_spire`：先扣压后判定释放，避免双领，倍率和 counter 可精确核对。
- `demand_coupler`：轮初现金不足配额且剩余不超过 2 时 ×4 并生成污染实例，中途现金变化不改资格。
- save/restore：蓄压 counter 编码、解码后保持一致。

验证命令：`node tests/pressure-behavior.js`（8/8）；`node tests/run.js` 当前 276/277。剩余 1 个旧 recycling case 仍断言 `pressure_pouch` 同轮计数为 0，与矩阵“每次上盘蓄压 +1”冲突，已保留旧 case 名称/预期并列为独立审核阻塞。浏览器 harness 尚未加入 pressure 文件，需在独立审核前接入并与 Node 机器计数对齐。

`safe_shim` 风险保护链已改为通用 `riskGuard` 数据声明：同轮按风险源位置稳定选择未使用邻接保护器，每个保护器每轮一次，失败损失最多减 4，污染生成事实保留。Node suite 已显式接入压力 suite，当前机器计数 305/305（旧 277 + 新 28），浏览器测试页同步加载 `pressure-suite.js` 并执行同一 `G.pressureBehaviorTests()`。

旧 recycling `clinker_router/pressure-counter` 迁移依据：矩阵 F 明确 `pressure_pouch` 每次上盘蓄压 +1；矩阵 B 明确 `clinker_router` 监听非消费 junk destroy 后给压力目标 +2。原盘面含 `clinker_router + spent_gasket + pressure_pouch`，所以新预期是 pressure counter 1（上盘）并保留原 case 名称；隔离 case 以预置 pressure=1 验证 destroy 监听的增量语义。8 个独审脚本均通过。

当前仍需完成严格 browser/HTTP Edge 新 profile 实跑，并继续核对风险保护 schema 的全部非法参数边界后再冻结。
