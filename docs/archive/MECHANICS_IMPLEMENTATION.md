# Mechanics v1 实现说明 / 冻结待只读独审

本批依据 [MECHANICS_ADVISORY.md](MECHANICS_ADVISORY.md) 的 MA-1 实施 A–E 机制修复。**开发自验不等于独立审核通过**；G 仍未验收，不扩展 H。送审冻结见 `tests/mechanics-v1-freeze.json`。§7 的 47 行映射见 `tests/mechanics-v1-ma7-map.json`；映射检查器只核验引用名称存在，不证明断言充分或独审通过。

## A. profile、效果身份与统一倍率

- `js/data/content.js`：formal 定义或显式 `policy:'matrix-v1'` 使用新软限制；prototype 默认 legacy。schema 拒绝未知 policy、不合法死亡许可以及未实现的 `limit.perStage/perSource/perTarget`，仅实现 `perSpin`。
- `js/engine/resolver.js`：collect 捕获 `sourceType`、`sourceEpoch`、`effectKey = definition.id + '/' + (effectId ?? index)` 和 profile；编译身份不回写 effects，不进入 copy 数值模板。
- `tryApplyMultiplier` 被 multiply、tag.ratio、globalMultiply 和 releasePressure 共用。同 sourceUID/effectKey/target 本轮一次；同 effectKey/target 最多两个不同来源。不同定义、effectId、目标相互独立；显式 matrix 全局倍率的目标为 `$board`。
- tag 先新增标签并记真实 tagAdded，再尝试倍率。倍率拒绝不撤销标签，不伪造重复 tagAdded。releasePressure 先确认倍率资格，成功后才扣压/置 released；拒绝不花压力。
- `limitSkipped` 字段为 id/parent/depth/event/source/target/effectKey/component/reason/limit。来源/目标限制、生成限制、池满、无合法目标及 transform-cycle 均可审计；父记录保持有效。formal perSpin 按 sourceUID/effectKey 的成功 invocation 计数，多目标不重复占 invocation。
- BigInt 有理数累计，普通收益最终逐格向负无穷 floor；独立 reward 不吃倍率。legacy lens、mirror、seedbox 沿兼容路径运行。

## B. 生成入口与生命周期事实

- 普通 spawn 和 risk.spawnOnFail 共用 `trySpawn`：matrix 每源 UID 所有生成效果合计一次，每 effectKey/spawn 全盘两次，只成功才计入软预算。
- 有效池容量 200 不含本轮死亡墓碑。可选生成池满记 pool-full，nextId 不递增；已成功消费/独立奖励以及已执行 risk 的 RNG/损失不撤销。真实第 41 个创建仍触发硬预算错误，由 command 原子回滚。
- formal owner 默认必须存活，scope/eventFilter/when 不等于死后许可；`allowDeadSource:true` 单独控制死亡执行。legacy 原死亡监听语义保留。
- `payloadFor` 冻结 source/target UID、type、position、tags、cause/kind，growth 另带请求/实际增量。邻接事件判断用位置快照，不依赖死亡目标仍在 live board。
- amber 仅自身成为 consume target 时由死亡目标领取 reward4；ash 仅自身被 consume 时可生毛刺，自熟 reward 仅自身 target 且 self_mature；deep_still 仅自身消费 mist 后生成；tide 仅自身转换后 +3。
- 正反对照包括普通死 echo 不再监听、另一活 echo 仍监听、显式死亡许可可读取合法快照。

## C. 年龄、变型与压力检查点

1. 开盘先保存 copy 原始数值模板；临时标签预处理完成。
2. formal 自然 age 统一前置，再执行正常 ON_SPIN/ON_APPEAR/ON_ADJACENT。额外加龄查目标当前合法 age 定义，跨阈值立即转换；无 age 的邻接植物不强写 age。已转换 epoch 不再推进新类型 age。
3. 每格 epoch、visitedTypes 从起始 type 建立。成功 transform 增 epoch；旧 sourceEpoch 的队列失效；回到已访问 type 记 transform-cycle，不发成功转换事件。UID/permanent 保留，counters/reservation 清除，base/tags 更新，保留已累积 add/倍率；不重开 appear/copy/tag。
4. 完成结构动作、消费/销毁派生注压及 ON_END_SPIN（含销毁）。formal releasePressure 队列延迟至这些完成后，按稳定顺序重新筛选存活目标、pressure≥cost、且尚未到自身阈值者。
5. 塔原子扣压+倍率，之后各目标一次自身阈值检查；塔释放过的目标不再领自身释放。pouch 达4独立10；valve 达6独立14；vessel 达3独立16且普通产出始终抑制；reserve 达6轮末独立18，不是付款动作。
6. 最终逐格账本及独立奖励汇总。派生 collect 会重排剩余队列，**不是严格 FIFO**；保留 priority/位置/效果序号/入队序号的稳定排序。ON_END 根 parent 重置 null。

未重写全局调度器，没有生产符号 ID 特判；这是现有流程中的明确检查点。

## D. 状态入口与 pending

`G.command` 在克隆前执行 `G.validateState`；无效输入返回原引用，执行/结果校验失败也返回原输入状态。校验版本、seed/RNG/revision/spin/stage/余轮、cash/payment、资源、settings、实例/UID/nextId、choices/items、stats/history、reservation、last board/ledger/log 树及 pending。

reservation target 必须在当前 pool，source 是合法 UID、允许不在当前 pool。snapshot 可以记录已死亡/已转换历史实例；board/ledger 一一对应，死格金额0，合法 signed 金额及精确 ratio，总额守恒。log id 连续且 parent 必须指向较早记录。

SYMBOL_CHOICE 的 pending 必须已有且等于 last.total；其他稳定 phase 必须 null。spin 不支付 cash，choose 一次提交并清 pending 后才判断付款。满池添加/现金上限失败完整回滚；满池 skip 合法；reroll/remove 不结清 pending。

## E. 存储格式、迁移及真实 UI 事务

API：`G.encode/decode` 仅纯状态；`decodeStorageRecord` 解析存储层；`commitImport` 是导入独立提交；`store/load` 是普通保存/只读恢复。

```json
{"storageVersion":1,"current":"<纯状态对象>","previous":"<纯状态对象或 null>"}
```

以上示意中的 current/previous 实际为对象而非 JSON 字符串。主 key 为 `fog-port.save.v1`，备 key 为其 `.backup`。纯 JSON 使用 `text.length ≤ 1024*1024` 上限；封套上限为两倍加256（实现按 JS 字符串长度，不是 UTF-8 字节计量）。

- UI import 解码验证后暂设 next 进行真实 render；预渲染成功后调用 commitImport。该 API 校验/序列化/读取合法旧主（纯档或封套）形成 previous，最后**只一次主 key setItem**，不写 backup。autosave=false 仅会话变更，不访问存储。
- 失败先恢复 previous 内存引用，再尝试回滚 render（即使又抛也不改变引用）；busy 在 finally 清除。send 也使用 finally 清 busy。
- 成功 load 依序读取 current→previous→backup，不重算账本、不写任一槽。后续普通 store 识别有效封套 current/previous，编码成纯状态轮转到 backup，再写纯新主。
- 普通 store 仍非两 key 原子：备写失败时主不动；备成功而主失败时备已是合法旧主副本。这不等于导入强单写事务。
- schema version 保持1，rules 变为0.3。合法 rules0.2 迁移至0.3；cash/RNG/choices/pending/last 金额不重算，旧 last 标记 resolvedRules0.2，新 resolve 标记0.3。稳定 phase 缺 pending 补 null；未决缺字段拒绝，不从 last 修复；未知未来版本拒绝。
- 真实 FogUI 的六个异常 case（validation、preview-render、getItem、serialization、capacity、setItem）各从不同的主B/备A开始，断言内存及两槽原始字符串不变，成功后续 import 证明 busy 已释放。**六个 UI case 单独统计，不混入 Node 521。**

## 原有正式预期迁移与 setup 清单

原475含正式路线用例，不是475个 legacy 用例。原475名称/顺序保留，**两项正式预期获批准迁移**：

| 文件/完整case | 原断言 | 新断言 | 契约依据 |
|---|---|---|---|
| tests/cultivation-behavior.js / cultivation/amber_frond/consumer-pays-independent-four | reward10 | reward14；组合手算 total15 | runner 消费6+目标基础4，amber自身死亡额外4，runner普通1 |
| tests/cultivation-behavior.js / cultivation/amber_frond/consumer-base-separate | reward10 | reward14；组合手算 total15 | 同上 |

原有测试 **setup 字段迁移为零**，未调整原夹具 UID/RNG/counters/阶段/池来绕过新校验；仅上述两个 reward 断言改变。新增临时定义由 temporaryDefinitions/finally 恢复，新增 fault 夹具/合法 phase 是独立 case，不是原有 setup 迁移。legacy/core 50 的测试源码及10手算 fixture 源码与旧冻结哈希相同，结果仍50/50、10/10；这不宣称所有正式旧预期完全未改。

## 旧独审的3项真实 FAIL（保留原文件，不改预期）

| 原脚本 / 精确case | 本批结果 | 旧契约期望 | MA-1 新契约 / 纠正证明 |
|---|---|---|---|
| audit-cargo.js / switch_lamp/invalid-uid-clears-on-normal-resolve | FAIL；该脚本17/18 | command 输入 ghost reservation 后 resolve 清理并成功 | command 克隆前完整校验，target须在pool，拒绝 malformed 输入；合法清理/保留见 mechanics-contract/D/legal-reservation-remove-consume-next-spin-retention |
| audit-cargo-retest.js / reservation/runtime-invalid-record-is-cleaned | FAIL；该脚本14/15 | 同样期待 command 清理 ghost 后成功 | 同上；其 save/invalid-reservation-import-does-not-mutate-source 仍 PASS，不能误记成该保存用例失败 |
| audit-recycling.js / dead-listener-target-snapshot | FAIL；该脚本9/10 | 追加 formal 死 owner event reward，未显式允许死亡仍期望触发 | event scope 不授予死亡资格；见 mechanics-contract/B/dead-owner-echo-does-not-listen-without-permission 和 B/explicit-death-permission-self-snapshot-works 的正反例 |

3项已批准的契约差异不是独审已通过。其原脚本、旧 route-g 输出不改，本批真实输出另存 mechanics-v1-audit-*.txt。

## 自验结果与证据

| Node suite | passed/total |
|---|---:|
| core | 50/50 |
| formal | 75/75 |
| cultivation | 24/24 |
| recycling | 24/24 |
| distillation | 29/29 |
| resonance | 28/28 |
| cargo | 48/48 |
| pressure | 27/27 |
| pressureTransaction | 52/52 |
| routeG | 118/118 |
| mechanicsContract | 46/46 |
| 合计 | **521/521** |

原357基线357/357名称顺序保持；原475整体名称顺序保持，但有上述正式预期迁移。file suite 与 HTTP suite 各521/521，并比对每个 case 的名称、顺序、ok/error 结果；file:// fresh profile 四检查通过。HTTP suite/UI 两检查通过，真实六故障独立统计。

11个旧独审逐脚本新进程：cargo17/18、cargo-retest14/15、cultivation7/7、cultivation-retest6/6、distillation17/17、pressure39/39、pressure-retest49/49、pressure-transaction-retest10/10、recycling9/10、resonance18/18、resonance-retest18/18；合计204/207，**3 FAIL 保留**。pressure-retest另单跑--http：49/49、严格 smoke/pressure DOM标记以及4个独立 UI case全部通过。fixture-report另进程10/10且写出重定向。

主要证据：
- tests/mechanics-v1-suite-manifest.json / mechanics-v1-node-result.txt
- tests/mechanics-v1-ma7-map.json / mechanics-v1-coverage-check.js
- tests/mechanics-v1-browser-result.html / mechanics-v1-ui-smoke-result.html / mechanics-v1-storage-{write,read}-result.html
- tests/mechanics-v1-http-proof.json / mechanics-v1-http-{suite,ui}.html
- tests/mechanics-v1-audit-proof.json / mechanics-v1-audit-*.txt
- tests/mechanics-v1-pressure-http.txt / mechanics-v1-pressure-http.html / mechanics-v1-strict-dom-proof.json
- tests/mechanics-v1-fixture-result.json / mechanics-v1-fixtures.txt
- tests/mechanics-v1-freeze.json：源与最新证据SHA256，旧48 sources授权差异和26历史evidence相同证明。

旧 baseline-357-manifest.json、suite-manifest.json、route-g-freeze.json 不覆写。冻结状态仅表示停止开发编辑、可供只读独审；不表示 G 或本批机制已获验收。
