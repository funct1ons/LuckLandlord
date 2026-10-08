# E货运 8 ID 独立冻结审核

审核范围仅为 `cargo_rope`、`route_stub`、`parcel_cage`、`sorting_runner`、`manifest_desk`、`switch_lamp`、`transit_seal`、`return_station`。本审核没有修改实现、既有 suite、suite manifest 或矩阵；新增文件为 [tests/audit-cargo.js](../tests/audit-cargo.js) 与本报告。

## 执行证据

- `node tests/audit-cargo.js`：18 个独立边界 case，15 PASS、3 FAIL。每个行为 case 都先构造原始 state，再布置盘面，再执行第一次真实 `G.command(... type:'spin')`；包含连续两轮、保存恢复、新 schema 非法参数。
- `node tests/run.js`：**277/277 PASS**。运行器显式加载 `tests/cargo-behavior.js`。
- 机器读取 `tests/suite-manifest.json`：core 50、formal 75、cultivation 24、recycling 23、distillation 29、resonance 28，合计旧 229；货运实际 48（每 ID schema/negative/boundary 三项共24，加行为/负向/边界共24），所以 **229 + 48 = 277**。worker 的“新增53、保留229、总277”算术与实际 manifest 同时不成立；没有证据表明旧 suite 丢失5项，真实新增是48，报告数字错误。
- `tests/browser-tests.js` 只执行 `runTests/formal/cultivation/recycling/distillation/resonance`，没有加载或执行 `cargo-behavior.js`。因此现有 browser 结果不能证明货运 suite；`tests/browser-check.ps1` 的 4/4 只覆盖已有 browser harness（Edge file/http smoke），不是货运行为验证。

## 行为结论

通过的 15 项覆盖：单目标稳定选择、异 type 去重、空格阈值与池大小区分、sorting_runner 目标基础值奖励及竞争消费、manifest_desk 倍率、transit_seal 选择优先级和临时标签、return_station 因果奖励、switch_lamp 正常两轮及保存恢复、非 product 与 schema 非法值边界。

3 个 FAIL 是实现/校验缺口，不能归因于测试误用：

1. `switch_lamp/invalid-uid-clears-on-normal-resolve`：注入 `{uid:'ghost',pos:1}` 后执行正常 spin，命令在 resolver 处以 `未知实例` 失败；`js/engine/resolver.js` 的保留重排直接把 reservation UID 放入盘面，没有先清理不存在的 UID。预期是失效记录清理后正常结算，实际是整轮失败。
2. `multiple-listeners/independent-per-source-limits`：两个 cargo_rope 监听同一邻接 product，预期每个 source 各自一次、但单目标竞争仍只影响 target；实际日志只有一次 add。该结果表明多监听者独立限额/竞争语义未满足，现有 `tests/cargo-behavior.js` 只测两个 switch_lamp source 的 reservation 去重，未覆盖此行为。
3. `schema/invalid-empty-tags-rejected`：`transit_seal` 的 `chooseTags:[]` 被 `G.validateContent()` 接受。矩阵/规则要求选择集合为正式的 plant → crystal → resonance；空集合属于非法 schema 参数，但当前校验未拒绝。

## 重点语义核对

`sorting_runner` 实际按 `6 + G.symbols[target.type].baseValue` 计奖励，目标 permanent 不进入奖励；消费目标不再贡献普通账本，因此独立奖励没有双算。`transit_seal` 在 ON_APPEAR 的效果队列中临时追加 tag，池实例没有 tags 字段，下一轮从定义重新生成 tags，生命周期符合临时标签约束。`switch_lamp` 正常路径会把 UID/原位置写入 `reservations`，下一次未显式 fixed board 的正常 command 会重排保留；保存/恢复保留该字段并通过审计 case。失效 UID 清理则失败如上，且显式 fixed board 不应被用来证明保留生效。

## 范围边界

本结论只适用于上述 E 货运 8 ID；不外推 M3–M5 其余符号、完整道具、事件事务、锁位权重或平衡性。架构证据（通用 resolver/schema/save 路径）与行为证据（上述 18 case、277 suite、browser 未加载货运）分开计数；schema case 的存在不视为效果已验证。
