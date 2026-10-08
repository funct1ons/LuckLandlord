# F 压力8独立冻结审核

## 判定：阻断，不能验收

仅新增 `tests/audit-pressure.js` 与本报告，不修实现、旧 suite、矩阵或 manifest。审核范围仅矩阵 F 八 ID 及其直接依赖的 selector、riskGuard、counter、command/save/schema；不宣称 M3–M5 完成。独审最终命令 `node tests/audit-pressure.js`：**25/39 PASS，14 FAIL，exit 1**。以下失败均以原始 state 先布置再首次 resolve，金额不是从日志存在推断；schema mutation 仅发生在独立 VM 内并恢复。

完整读取 CONTENT_MATRIX F 与 §3.1 阈值释放脚注、保护顺序脚注、MECHANICS_GAPS F、RULES、PRESSURE_PROOF、resolver、content、game、validation、save、pressure-suite、pressure-behavior、Node/browser入口。MECHANICS_GAPS 是历史占位诊断，不以其旧实现结论覆盖当前代码。现有阈值实现与 PRESSURE_PROOF 优先级叙述不能覆盖矩阵 §3.1 的“先选未满足自释放阈值目标、结构完成后统一释放”约束。

## 实际复跑证据（通过不等于压力完整行为通过）

| 命令/入口 | 实测 |
|---|---|
| `node tests/run.js` | 305/305；显式载入 pressure-suite |
| `node tests/pressure-behavior.js` | 8/8；其中 risk case 没有强制失败与精确损失断言 |
| `node tests/fixture-report.js` | 单独执行：10 fixtures reported; all match manual expectation: true |
| `node tests/audit-cultivation.js` | 7/7 |
| `node tests/audit-cultivation-retest.js` | 6/6 |
| `node tests/audit-recycling.js` | 10/10 |
| `node tests/audit-distillation.js` | 17/17 |
| `node tests/audit-resonance.js` | 18/18 |
| `node tests/audit-resonance-retest.js` | 18/18 |
| `node tests/audit-cargo.js` | 18/18 |
| `node tests/audit-cargo-retest.js` | 15/15 |
| Edge file 新 GUID profile，index/ui-smoke/storage write/read | 4/4；每进程 exit 0，严格 `data-result="pass"` 或 `data-smoke="pass"` |
| HTTP UI smoke，新 profile、临时输出路径 | exit 0，passed true；使用 http-check 相同源代码，仅 profile 与输出路径改到 TEMP，不更改文件 |

Edge file 使用与 `browser-check.ps1` 相同四 URL/参数的 PowerShell Start-Process 命令，DOM写 TEMP，避免改写旧证据。测试页 DOM 为 **305/305**，8 ID 前缀共24，另 cross-source/risk-guard、release/competition、save/restore 共3，实际压力 **27**。DOM：`C:\Users\admin\AppData\Local\Temp\pressure-dom-6e07460f6e3d40e1be80b70c14e70e58.html`。HTTP DOM：TEMP/pressure-http-dom.html；工具输出的旧 evidence 路径只是原脚本字符串，不代表写了旧证据。

fixture逐例手算与实际：回收链13=13、复制接入20=20、竞争消耗14=14、邻接调频16=16、销毁哨20=20、转换后链12=12、永久双乘17=17、成熟16=16、自毁哨12=12、育匣14=14。不能只用 unified suite 总数替代这项独立报告。

## 计数与旧 recycling 迁移

当前 manifest 305 个唯一名称，实际分组：core50 + formal75 + cultivation24 + recycling24 + distillation29 + resonance28 + cargo48 + pressure27 =305。去掉新增 isolated recycling 名称与 pressure27 后是旧277；保留旧 recycling 名称。**新增28=压力27+回收隔离1，不是压力28。** manifest 的 suites 对象缺 cargo/pressure 分组，cases/total 与 Node/browser一致，但不能声称分组元数据完整。现有 pressure-suite.js:2 所谓每ID3项其实 schema只检查effects存在，positive只检查total是安全整数，negative-boundary多数只检查reward是整数；并非每ID三种行为。

`recycling-behavior.js:23–24`：旧 `clinker_router/pressure-counter` 保留名称，pouch 0→1迁移正确：router自身也有pressure且位置0，B默认稳定选一个目标，destroy注压+2实际给router自身；pouch独立上盘+1。因此矩阵 B+F 手算 router2、pouch1、reward0、total3；独审F34精确验证UID/目标/金额。隔离case预置pouch1后变2，只证明其上盘推进，**不证明pouch收到router+2**；旧注释“existing pressure receives clinker +2”错误，不能以该case掩盖注压归因。没有旧277完整快照可做字节级名称集合对比，结构与保留名称已核实，不虚称有不存在的历史快照。

## 逐8 ID 行为结论

| ID | 独立精确证据/判断 |
|---|---|
| pressure_pouch | F1/F2：前3次reward0，第四次reward10、counter0、UID不变、普通1；F20真实command离盘counter2不变，恢复后上盘counter3/total1。存档counter安全门失败。 |
| feed_valve | F3/F4：稳定消费一个fuel UID，消费reward3，counter+2；4→6释放合计reward17、counter0、普通1。 |
| pause_dial | F5：基础2+可复制平面1+邻压2=5。只读模板声明copyable true/false正确；此独审未新增真实读头复制case，不把声明当独立复制执行证明。 |
| surge_vessel | F6：前两次counter1/2、普通0；第三次counter0、reward16、普通仍0。塔在已达自释放阈值时抢夺违反脚注，见F12。 |
| cracked_regulator | F7/F8：查找固定种子使本局真实RNG成功/失败，成功普通10无污染，失败普通-4且恰一gasket；reward0。loss参数schema失败。 |
| safety_shim | F9/F10/F29/F32/F33：减损4不转正、两风险两保护器稳定、禁止跨行环绕、-2损失最多减为0、每保护器每轮仅一次并下轮复位；生成事实保留。错误保护非pressure风险，F28失败。 |
| release_spire | F13/F22边界与竞争可过，但F12/F21证明自释放排除与合法目标选择不正确；不验收。 |
| demand_coupler | F14/F15/F30：初现金payment-1且remaining2时ratio4并一污染，remaining3与cash恰payment时ratio1且不生成。数据/闭包读取轮初cash正确；未新增中途现金被改的自定义效果，因此此项为源码时点证明而非新增动态case。 |

通用现金结算F31失败影响压力真实可玩收益，即使resolver金额正确仍不能验收command闭环。真实cycle reset已有共振旧独审复跑；压力count reset有F1/F4/F6精确case。schema和覆盖充分性与行为判定分别列出，不以schema存在当效果完成。

## 真实 FAIL，复现均为 `node tests/audit-pressure.js`

| case / 审计文件行 | 预期与实际 | 实现定位 |
|---|---|---|
| F12 / tests/audit-pressure.js:26 | surge原始pressure3已满足自阈值，应不能塔选中，ratio1、reward16；实际ratio3，reward0，counter0。 | content.js:397/400；resolver.js:12 releasePressure及counter；塔priority-20抢在appear前且不排除阈值目标。 |
| F21 / :38 | 塔0、低压shim1、合法feed5 pressure3，应跳过shim选feed UID并扣至0/ratio3；实际feed仍3/ratio1。 | resolver.js:8 targets先slice1，:12 handler才判断n<3，不回退第二合法目标。 |
| F23负值 / :40 | pressure=-1存档应拒绝；实际decode接受。 | validation.js:31只校验counters是object；save.js:2透传。 |
| F23不安全整数 / :40 | pressure=9007199254740992应拒绝；实际接受。 | 同上。 |
| F24 / :41 | counters.unknown应拒绝；实际encode接受。 | 同上，无合法计数key白名单。 |
| F25 delta / :42 | pressure delta=-1不符合该有界增加动作参数，应拒绝；实际content校验接受。 | content.js:610–629无counter action专属校验。 |
| F25 max / :42 | max=-1应拒绝；实际接受。 | 同上。 |
| F25 reset / :42 | reset=-1应拒绝；实际接受。 | 同上。 |
| F25 at / :42 | at=9007199254740992应拒绝；实际接受。 | 同上。 |
| F25 unknown / :42 | action未知字段unknown应拒绝；实际接受。 | 同上。 |
| F26 / :43 | releasePressure缺ratio应拒绝；实际接受（执行时可能抛TypeError）。 | content.js:622只对multiply/globalMultiply要求ratio。 |
| F27 / :44 | risk loss=-1.5应拒绝；实际接受。 | content.js:624检查guardReduction/spawn，不检查loss。 |
| F28 / :45 | 非pressure gambit基础1、失败-4=-3，不应受shim保护；实际普通1（loss减到0）。 | resolver.js:12 risk扫描保护器不核风险源pressure标签。 |
| F31 / :48 | 原cash5，上盘pouch普通1，真实spin后cash应6；实际5，last.total1。 | game.js:7 spin分支更新stats/history却不credit cash，:8 choose也不credit；G.command全部switch无settle命令，UI send亦仅spin/choose。F31已走spin→SYMBOL_CHOICE→choose skip→READY后才断言，排除未提交假失败；RULES要求负收益现金floor0同样缺失。 |

F25 delta负值的判定限于压力“增加”数据的合法参数；若引擎未来明确定义通用扣压counter动作，需另行明示schema合同，而不是默默接受当前未知参数。独审不擅自改设计。

## 冻结交主审

冻结的是失败证据与两份新增审核文件，不是实现通过。核心阻断：塔目标资格/阈值时序、风险保护标签、counter/action schema，以及真实现金提交。不要改期望迎合现实现；修复后应原样复跑39独审与所有回归，再由主审决定压力8范围验收。自动Edge检查不等于人工试玩、视觉/多分辨率或平衡验收。
