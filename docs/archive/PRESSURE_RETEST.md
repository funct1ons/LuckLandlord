# F 压力修复独立复测（接续中断 worker）

结论：**仍阻断压力8验收。现金正常命令路径修复有效，但 pending 存档/导入契约、泄峰塔单目标、严格 action schema 仍失败。** 范围仅压力8与本次直接实测的现金、保存、UI核心路径，不宣称 M3–M5 完成。无人派生 agent，未修改实现、既有 suite、旧独审或 manifest。

先读取并保留中断 worker 的20用例及有效证据；补至49个独立展开case（38个P编号，参数化逐项计数）。最终 `node tests/audit-pressure-retest.js`：**30/49 PASS，19 FAIL，exit1**。新增29项超过要求15项。修正原P15把丢失收益误列PASS的判断：正常待选档的pending应等于last.total，null不是兼容成功。P9原描述保留，但实际问题是pending为对象而非数值，无需发明对象amount schema。P10/P25同根因，不能把19失败说成19独立漏洞。

## 依据与隔离

完整读取 PRESSURE_AUDIT、PRESSURE_FIXES、RULES、CONTENT_MATRIX（含F与§3.1/保护顺序脚注）、当前 game/save/validation/resolver/content、原39独审与真实UI main。所有行为fixture先布置原始state，再首次resolve；不使用先结算再改counter的helper。content mutation仅在独立VM，finally恢复；不改变原39预期。Node/browser入口和manifest也已核对。

规则依据：RULES“最后一轮先选择再付款”“负值允许，现金最低0”“恢复仅稳定状态，不重算”“非法导入不得覆盖原档”“拒绝未知计数器”；矩阵§1“目标数量默认1，位置后UID选第一个合法目标”；F泄峰塔明确“对一个”；§3.1要求排除自释放阈值再择目标。新增action schema检查是这些已声明原语的必要类型/字段验证，不自创内容效果。counter存档0..1e9整数是当前FIXES与validation明示合同；没有把这个存档上限擅自加到所有content action参数上。

## 正常现金事务与阶段结论

`game.js:7` spin只保存last/pending，现金仍旧值、phase为SYMBOL_CHOICE；`:8`合法choose（index/null）才原子credit、清pending、付款，`:6`付款后才WON/LOST/ITEM_CHOICE；`:9`reward才推进stage。`main.js:1–3`真实点击使用G.command。

精确PASS：pouch收益1，cash5→spin仍5→choose6；选择0/2与skip均提交一次；reroll/remove不提前提交；旧revision、重复spin、READY下重复choose、非法index -1/3/0.5/undefined不改变完整原状态；保存后恢复pending只提交一次。末阶段配额651：cash650+1→WON/cash0；cash0+1→LOST/cash1；旧cash651够配额但本轮-1→LOST/cash650；负值在0截断。阶段0现金29+1→ITEM_CHOICE/cash0，reward后stage1/payment59/remaining7。没有提前用旧cash判输/赢。混合普通产出1-1-1=-1，cash2→1。

P37：塔0、surge1原pressure3、低压shim5、合法feed6原pressure3，首次resolve后ratio=[1,1,1,3]、reward16、total22；正确先排除自阈值与低压。P38真实本局RNG两次失败：legacy gambit在0为-3，shim在1为1，pressure风险在5为0（2-6+4），总额-2，仅pressure生成一gasket；legacy不占保护器。原39的多源/多保护器/下轮复位仍通过。counter存档边界0/1e9有效；负值、分数、1e9+1、不安全整数及未知键拒绝，原39亦覆盖。

## 全部19个失败（统一命令 `node tests/audit-pressure-retest.js`）

表中审计位置为 `tests/audit-pressure-retest.js` 行；每个参数化失败均单独列出。源码以本次冻结文件行号为准。

| Case / 审计行 | 精确预期 → 实际 | 实现行与规则 |
|---|---|---|
| P8 /13 | pending字符串'1'应拒绝 → validate接受 | validation.js:3–79从未校验pending；RULES保存合法金额/稳定恢复 |
| P9 /14 | pending对象{amount:1,unknown:2}应拒绝 →接受 | 同上；pending真实合同为数值/null |
| P10 /15 |旧SYMBOL_CHOICE缺pending须迁移或拒绝 →encode/decode接受且仍缺 | save.js:2、game.js:8；稳定决策节点须可恢复 |
| P15 /20 |待选last.total1/pending null应拒绝 →接受并choose cash0，应1 | validation.js:3、game.js:8；收入守恒 |
| P21 1.5 /28 |非整数pending拒绝 →接受 | validation.js:3；安全整数金额 |
| P21 1000000001 /28 |超过金额1e9拒绝 →接受 | 同上；RULES金额预算 |
| P21 9007199254740992 /28 |不安全整数拒绝 →接受 | 同上 |
| P22 /29 |last.total1/pending8拒绝 →接受且choose cash8，应1 | game.js:8信任pending、validation.js:140仅核ledger+reward=last.total；金额守恒 |
| P23 /30 |READY/last null应pending null →pending8接受 | validation.js:3；稳定流程状态 |
| P25 /32 |旧待选缺pending迁移为1或decode拒绝 →decode接受，choose报非法存档数值 | save.js:2、game.js:8，undefined参与加法产生NaN，命令原状态不变但节点无法完成 |
| P31 /38 |塔0，feed1和feed5各pressure3，只第一个扣压：[0,0,3]；普通2+3+1=6 →两feed都扣：[0,0,0]，普通2+3+3=8 | content.js:400 count all；resolver.js:8 targets、:13 drain遍历ts；F“对一个”、矩阵§1 |
| P33 name unknown /40 |counter未知名拒绝 →接受 | content.js:626仅正则，不核age/beat/pressure；validation.js:31拒绝其运行产物；RULES未知计数器拒绝 |
| P33 release yes /40 |release必须bool →字符串接受 | content.js:626无release类型；resolver.js:12按truthy执行；严格counter schema |
| P34 unknown /41 |releasePressure未知字段拒绝 →接受 | content.js:627只额外核ratio；严格字段合同 |
| P34 amount -3 /41 |扣压力amount须正整数 →-3接受 | content.js:620通用checkValue允许负数，:627无专属约束；resolver.js:12实际可增加压力；F“扣3” |
| P35 unknown /42 |risk未知字段拒绝 →接受 | content.js:624/628无白名单；严格risk schema |
| P35缺loss /42 |risk失败金额必需 →undefined接受 | content.js:628只在存在时检查；resolver.js:12失败加undefined可产生NaN；F失败损失 |
| P35缺chance /42 |risk概率必需 →undefined接受 | content.js:623只在存在时检查；resolver.js:12 RNG<undefined会永远false；F 3/4概率 |
| P36 /43 |坏主档pending8/total1应退有效备份pending1 →load返回主档8 | save.js:4依赖decode，validation.js:3遗漏；RULES损坏主档有效备份 |

P24证明旧READY档缺pending仍能下一spin重新产生并正常到账，不把所有缺字段旧档一律说成不可用。阻断是旧待选档与不一致pending，缺字段策略应明确按phase恢复或拒绝。

## 完整实跑与写入隔离

| 命令/入口 | 结果 |
|---|---|
| `node -r <TEMP写入隔离器> tests/run.js` |305/305，exit0 |
| `node tests/audit-pressure.js` |39/39，exit0，原预期未改 |
| `node tests/audit-pressure-retest.js` |30/49，exit1 |
| `node tests/audit-cultivation.js` / `audit-cultivation-retest.js` |7/7、6/6，exit0 |
| `node tests/audit-recycling.js` |10/10，exit0 |
| `node tests/audit-distillation.js` |17/17，exit0 |
| `node tests/audit-resonance.js` / `audit-resonance-retest.js` |18/18、18/18，exit0 |
| `node tests/audit-cargo.js` / `audit-cargo-retest.js` |18/18、15/15，exit0 |
| `node -r <TEMP写入隔离器> tests/fixture-report.js` |单独10/10，exit0 |
| Edge file四URL |4/4，每进程exit0、严格data-result/pass或data-smoke/pass |
| `node tests/audit-pressure-retest.js --http` |Node30/49；HTTP Edge exit0，原smoke严格PASS；新增真实UI 3/4，损坏pending导入FAIL |

run.js默认改写suite-manifest，fixture-report默认改写fixture-result。为遵守“只可写两个文件”，TEMP preload仅拦截这两个writeFileSync，实际测试计算未更改；另独立VM捕获运行manifest并比对磁盘manifest：305名称逐项一致、305唯一；没有改已有证据或suite。manifest suites仍缺cargo/pressure分组，不能声称分组元数据完整。机器case总数旧277+压力27+回收隔离1=305；浏览器DOM也是305/305，新独审49不在旧浏览器harness中。

fixture逐例手算与本次实际均相等：回收链13、复制20、竞争14、调频16、销毁哨20、转换12、永久双乘17、成熟16、自毁哨12、育匣14。不是只引用统一suite总数。

## Edge DOM证据

file四项使用本次全新GUID profile；storage write/read共用该新profile以检验跨进程恢复，四进程都exit0；DOM全部写TEMP，严格检查属性值，不凭文本中出现pass判断。路径：

- index /305：`C:\Users\admin\AppData\Local\Temp\pressure-retest-26256e33fa76406980235c9bdd9a12a7.html`
- ui-smoke：`C:\Users\admin\AppData\Local\Temp\pressure-retest-b4c2964796a648beab6b4426cc6ff161.html`
- storage write：`C:\Users\admin\AppData\Local\Temp\pressure-retest-35e4b8de74f740769f8a70a86d398bd3.html`
- storage read：`C:\Users\admin\AppData\Local\Temp\pressure-retest-96cd1be783e143e6875ba0cf402881be.html`
- HTTP最终DOM：`C:\Users\admin\AppData\Local\Temp\pressure-http-1791111583199.html`

HTTP服务器只在内存向原ui-smoke.js尾部追加独立检查，不改页面/JS文件；用全新独立profile。真实按钮PASS：最后spin→保存→continue→skip→WON/cash0；choose→ITEM_CHOICE→reward→下一stage；负收益末轮skip→LOST/cash0。FAIL：`FogUI.importText`接受pending8但last.total1的档，内存/主档/备份变化均true，应拒绝并全部保持。源码main.js:2导入先decode再render/store，save.js:3会把上一有效主档移到backup；decoder遗漏pending导致坏档被当作有效档。这是可玩的真实导入漏洞，不只schema存在性检查。

旧烟测PASS不覆盖新增pending损坏场景。自动Edge检查不代替人工试玩、视觉或平衡验收。压力8结论仍阻断，待修这些实际缺口后原样复跑；本次未改实现。
