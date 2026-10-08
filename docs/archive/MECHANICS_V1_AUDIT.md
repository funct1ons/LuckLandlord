# Mechanics v1 独立只读审计

审计对象是冻结快照；本审计只新增本报告与 [tests/audit-mechanics-v1.js](../tests/audit-mechanics-v1.js)。实现和既有测试未改；现有 manifest 与 fixture 输出被 runner 以相同内容重新写出，最终 SHA256 与冻结记录仍完全一致（见运行边界说明）。审计脚本包含 30 个独立 case，全部先布置原始 state，再首次 resolve；断言金额、ratio、UID、counter、日志归因、原状态或存储字节。

## 冻结边界

重新读取并核对 `tests/mechanics-v1-freeze.json`：56 sources、31 最新 evidence、baseline357、route-g-freeze 旧 hash、26 historical evidence 全部匹配；核对结果为 `bad=[]`。冻结记录仍是 `DEVELOPMENT_FROZEN_READABLE_AWAITING_INDEPENDENT_REVIEW`，acceptance.mechanics/routeG/HExpanded 均为 false。最终内容核验再次为 `bad=[]`。执行期间直接运行 `tests/run.js` 和 `tests/fixture-report.js` 时，未预先拦截它们的写出，导致 `tests/mechanics-v1-suite-manifest.json` 和 `tests/fixture-result.json` 以完全相同字节重新写入。这违反了“勿覆盖任何产物”的运行约束，虽然 SHA256 与冻结记录一致、内容没有变化。此执行偏差不隐瞒，不能声称整个运行过程零写入。

完整阅读了 `docs/MECHANICS_ADVISORY.md`、`docs/MECHANICS_IMPLEMENTATION.md`、`docs/RULES.md`、`docs/CONTENT_MATRIX.md`、`docs/ARCHITECTURE.md`、resolver/content/game/save/validation/UI、`tests/mechanics-contract.js`、47 行 MA7 映射及冻结证据。实现关键位置：统一倍率 `js/engine/resolver.js:63`、生成入口 `:105`、事件收集/死亡权限 `:243`、队列 epoch 校验 `:419`、自然年龄 `:461`、压力检查点 `:487`；存储导入 `js/core/save.js:37`，状态边界 `js/core/validation.js:9`，command clone 前验证 `js/core/game.js:5`。

## 独立 case

执行命令：

```powershell
node tests/audit-mechanics-v1.js
```

结果：**30/30 PASS，0 FAIL**。

覆盖内容包括：

- multiply、tag.ratio、releasePressure 三入口；同定义两来源上限、第三来源 skip、不同定义/多目标独立、同源 effectKey 去重、每轮 reset、负数向负无穷 floor、skip 的 source/target/effectKey/component/reason/limit。
- tag 先新增再拒绝倍率；第三源新增 crystal；事件重复倍率不重复扣资源。
- 普通 spawn 与 risk.spawnOnFail 共用 UID/definition 预算；199/200 有效池、死亡墓碑释放容量、pool-full 不分配 UID；legacy 41 次硬预算回滚并保持原 state/RNG/revision。
- source/target payload、amber 目标奖励、ash 消耗/自熟互斥、deep_still 事件归因、死亡 owner 无许可/有许可正反例。
- natural age 先于额外 age、转换不重开新类型 age；epoch/visitedTypes 阻止 A-B-C-A 回到已访问 A，保留 UID/permanent/add/ratio 并清 reservation/counters。
- 注压→塔→自身阈值释放，pressure_pouch reward10 独立且不吃倍率，负普通产出仍按 ratio 计算。
- G8 copy/grow/tag/cycle：copy 使用初始数值快照；条件加值不可复制；grow capped actualIncrease 只发一次事件；双 echo 不递归；split tag 的 ratio 与 cycle 日志精确断言。
- rules0.2 稳定 phase 迁移、未决 pending 缺失拒绝、未来版本拒绝；commitImport 单主 key、current/previous/backup fallback、ordinary store 的非原子边界、读/写 fault 原始字节不变；完整 command 验证在 clone 前拒绝。

三个首轮手算纠正：

- deep_still 两个消费者只各自产生一份独立 reward4；amber 只有作为被消费目标才 reward4；该固定盘面实际 `reward=11,total=20`。
- natural age 案例中 dew 自然转换后，额外 age 不重开 amber 的新 age；转换日志 target 与 counter 结果均精确匹配。
- copy 案例实际 ledger `[3,9,2,5,3]`、total22，reader 只复制 blank_facet 的 +2，spectrum_pin 条件 +4 不可复制。

## 回归与冻结证据命令

执行：

```powershell
node tests/run.js
node tests/fixture-report.js
node tests/audit-cargo-retest.js
node tests/audit-cargo.js
node tests/audit-cultivation-retest.js
node tests/audit-cultivation.js
node tests/audit-distillation.js
node tests/audit-pressure-retest.js
node tests/audit-pressure-transaction-retest.js
node tests/audit-pressure.js
node tests/audit-recycling.js
node tests/audit-resonance-retest.js
node tests/audit-resonance.js
node tests/audit-pressure-retest.js --http
```

结果：Node **521/521**，baseline **357/357** 且 names/order preserved；fixture **10/10**。11 个历史脚本合计 **204/207**：cultivation-retest 6/6、cultivation 7/7、distillation 17/17、pressure-retest 49/49、pressure-transaction-retest 10/10、pressure 39/39、resonance-retest 18/18、resonance 18/18；cargo 17/18、cargo-retest 14/15、recycling 9/10。

`node tests/audit-pressure-retest.js --http`：49/49，Edge exit 0，strictSmoke=true，4 个独立 UI case 全部 ok：final skip→WON、choose→reward、负收益→LOST/cash clamp、损坏 pending import 保留 state/current/backup。

另外单独 VM 新进程调用 `G.mechanicsContractTests()`：**46/46 PASS**。冻结清单最终再次核验 56 sources、31 evidence、26 historical evidence：**bad=[]**。

本次亲跑的独立浏览器命令是：

```powershell
node tests/audit-mechanics-v1.js --browser
```

该命令将所有 DOM/浏览器输出写入新系统临时目录 `C:\Users\admin\AppData\Local\Temp\mechanics-v1-independent-JOIzne`，不写 `tests/`。结果：fresh `file://` suite/UI/storage-write/storage-read **4/4**，fresh HTTP suite/UI **2/2**；file/HTTP suite 各 **521/521**，逐 case name/order/ok/error 与 Node manifest 完全一致；两种协议 UI 六个 import fault 均逐名 PASS。报告中的冻结浏览器文件、HTTP proof、pressure HTML 仍属于“仅复核”，不计入本次亲跑工件。

## G8 逐 ID 专项判定

逐项读取 `tests/route-g-behavior.js` 实际断言（不是只引用 case 名），并结合本审计 case：

| ID | 实际覆盖的精确断言 | 判定 |
|---|---|---|
| phase_chip | `resonance-first-not-crystal-majority` total11/tag；crystal fallback total6；无邻居 total3；previous-turn 不泄漏；本审计 cloud/tag 交叉 | PASS |
| spectrum_pin | 三 distinct neighbor total14/amount5；重复 type total7/amount1；self/distant 排除 total10；dead neighbor 不计；本审计 reader 交叉 | PASS |
| cloudy_negative | age1/age2 不转换；第三次保留 UID/permanent、清 counters、无 appear add；reservation 清除；本审计 natural-age 交叉 | PASS |
| blank_facet | +2→total5、permanent 保留→7、非 product 不被消费；copy whitelist、转换后 snapshot 均有精确金额/log | PASS |
| offset_reader | blank +2、两个白名单只选一个、battery 不在 formal whitelist、pause 仅 flat、条件/H placeholder 不复制、转换后不在起始 snapshot、cap8、双 reader 不递归；本审计 G8 copy | PASS |
| alignment_cloth | tagAdded target +5、native tag 不合格、两个目标只首个、transit 与 transformed final-tags provenance；本审计第三源 tag/history | PASS |
| echo_plate | actualIncrease×4、远距无奖励、cap actual1、perSpin 两次、两 listener、legacy emit 去重、root/heat growth；本审计死 owner permission 与 no recursion | PASS |
| split_register | dual tag + ratio floor、two products first only、non-product no-op、no next-turn persistence、content whitelist；本审计 third source cap/cycle cross | PASS |

G8 专项结论：**8/8 PASS**。这些是 G8 机制固定盘面与边界证据；不等于 route G 整体验收，也不等于 M3-M5 内容完成。未覆盖或仅静态列举的矩阵扩展包括完整道具总线、事件选择、概率权重、P10 modifier、剩余 selector/row 语义和完整 64/32/8 内容验收。
## 本次浏览器工件与 profile

共同父目录 `C:\Users\admin\AppData\Local\Temp\mechanics-v1-independent-JOIzne`：file 四项共用全新 `file-profile`，DOM 为 `file-suite.html`、`file-ui.html`、`file-storage-write.html`、`file-storage-read.html`；HTTP 两项各用全新 `http-suite-profile`、`http-ui-profile`，DOM 为 `http-suite.html`、`http-ui.html`。各有 `*-stderr.txt`，完整结构结果保存于 `browser-proof.json`。亲跑六项 Edge exit 均0，严格 DOM marker、521 case exact parity、两协议各6 fault 检查均通过。

`pressure --http` 也是本次亲跑：stdout49/49及四个独立UI case逐名ok；DOM为 `C:\Users\admin\AppData\Local\Temp\pressure-http-1791188019528.html`，profile为该路径去掉 `.html`。冻结的 `tests/mechanics-v1-pressure-http.html` 仅核hash。

早期报告只写“冻结清单已有浏览器证据复核”，消息已写亲跑结果，范围表达不一致。事实区分为：初始冻结浏览器证据仅复核；随后stdin内存检查确实亲跑但未保留DOM；本次 `--browser` 再亲跑并保留临时DOM/proof。没有将复用冻结工件冒称本次工件。

## 三项历史 FAIL 的判定

这三项保留 FAIL，属于 MA-1 批准的契约差异/旧断言冲突，不能记作历史审计全绿，也不能据此宣称回归：

| 历史脚本 / case | 实际 | 判定 |
|---|---:|---|
| `audit-cargo.js` / `switch_lamp/invalid-uid-clears-on-normal-resolve` | 17/18 | malformed reservation 在 `G.command` clone 前完整校验并拒绝；合法 remove/consume/next-spin retention 由 mechanics-contract/D 正向 case 覆盖。 |
| `audit-cargo-retest.js` / `reservation/runtime-invalid-record-is-cleaned` | 14/15 | 同一 MA-1 校验边界；invalid reservation import 不改变 source 仍 PASS。旧脚本要求 resolve 顺手清理 ghost，和冻结后的“先验证、拒绝原引用”契约冲突。 |
| `audit-recycling.js` / `dead-listener-target-snapshot` | 9/10 | formal dead owner 默认无监听资格；只有显式 `allowDeadSource:true` 的死亡快照监听执行。独立正反 case 均 PASS。 |

仅 amber 两项正式 reward 10→14 迁移获主审批准；legacy core50、10 个手算 fixture 源与历史输出未改。报告不宣称 G 或 M3-M5 完成。

## 结论

本次独立新增审计为 **30/30 PASS**，冻结回归为 Node 521/521、fixture 10/10、历史审计 204/207（保留上述三项契约差异）、pressure HTTP 49/49 + 4/4 UI。结果支持 MA-1 机制行为在这些固定盘面上的独立证据；**MA-1 机制：PASS（30/30 独立 case、46/46 contract 与回归所覆盖范围）。G8 专项：PASS（逐 ID 8/8）。未覆盖/后续：G 整体验收、H、道具/事件/概率/平衡与 M3-M5 仍未完成。**
