# GDD1 F2 E1/E2 独立复审

结论：**F2 E1/E2 功能范围 PASS，附证据保护事故例外。** 两个原阻断在原 case、12 个新增独立引擎边界和真实 Edge DOM 交互中消失。没有改源码、旧测试预期或冻结 GDD，没有派 agent，没有扩展全量内容或美术。历史文件保护不能称全程零写入或全部原样：复审误重写了一份旧 `retest-node.json`，见下文独立事故记录。结论仅限 A/B/D 的 24/10/3 切片；不代表 Chrome、全量64/32/8、平衡或真人体验通过。

完整读取冻结 GDD（663行）、F0冻结、F1合同/验收、F2 REPORT/AUDIT/FIX、相关 GDD1源码与 UI main、原41 audit checks 和 UI harness，以及原154检查与额外回归。Herdr使用遵守 [SKILL.md](C:/Users/admin/.pi/agent/skills/herdr/SKILL.md)，仅向授权主pane报告，没有再派 agent。

## 复审结果

|范围|结果|证据|
|---|---:|---|
|新增独立引擎边界|12/12|f2-retest-checks.js，f2-retest-node-boundary-only.json|
|原 audit41 + 新增12|53/53|f2-retest-node.json|
|Edge file write / 独立进程read|63/63；57/57|f2-retest-edge-file-write/read.html|
|Edge HTTP write / 独立进程read|63/63；57/57|f2-retest-edge-http-write/read.html|
|53引擎逐case Node/四次Edge parity|四组一致|f2-retest-parity.json|
|原 F2|154/154|f2-retest-original154-node.json|
|原 F1 baseline/fix/retest|117/117、101/101、38/38|f2-retest-f1.json|
|历史缺陷复现|22/28，原六已修复复现失败集合精确一致|f2-retest-historical-summary.json|
|legacy602 / M3|602/602；64/66原失败名及完整error精确保持|f2-retest-legacy.json|

原 audit41 名称和顺序完整保持，原 UI write8/read4 的名称、断言和相对顺序保持；新增两条 UI assertion 插在原 event-save 之前。53不是53条新场景：41原场景 + 12独立新增场景；63为53引擎 + 原write8 + 新write2；57为53引擎 + 原read4。协议重复不累加为新增场景。原独立12-only执行输出（22/22 write、16/16 read）另存 `*-boundary-only.html`。逐case parity 比较全部 name/ok/error，无隐藏失败。

12个独立case覆盖：旧队列取消时保留五流与目标；新 tide listener 的精确parent/depth/来源归因；注入appearance探针不补执行；多目标执行中首目标回调令source epoch变化后停止后续目标；首目标回调令source死亡后停止后续目标；自身amber死亡许可且旁观者不领；普通死亡listener不成长；取消旧动作不吞道具额度、后续合法事件领取；公开spin真实抽盤与save往返；硬异常整轮含五流回滚；空事件目标失败后同revision合法重试；故障存档保留pending、原envelope后合法重试。所有场景有精确数值/UID/事件/资源断言，不以seed循环虚增场景数。

多目标和新appearance边界是**内存effect数据变异机制探针**，只读生产文件，不声称该变异定义可由玩家自然获得。生产真实定义的epoch反例另由原audit E1及合法导入无预约抽盘 UI case覆盖。

## E1、E2

E1：resolver在dispatch进入、run执行及每个目标执行之前验证source UID/type/epoch/alive。旧reserve被pearl转tide后取消旧consume；wick保留收入2及池实例，tide收入7、reward0。新type的transform listener立即合法执行，其add的parent为transform；未重开appearance。多目标source中途转换/死亡后没有第二consume、没有对应第二额度/RNG消耗。死亡许可只对显式自身被耗listener合法，普通死亡listener不响应。整轮事务硬故障保持原对象和五流。

E2：真实按钮detail1有效，跨task重取重渲染按钮的detail2不改变state、存档bytes、revision、券或五流；后续detail1独立单击仍可刷新。真实EVENT_CHOICE空目标detail1失败，**同task**设置合法目标再detail1立即成功只扣一次成本，随后独立spin仍可用。原双击和原read重试assertion保留。使用真实Edge File/DataTransfer及DOM click handler，未用GDD1UI.send绕过按钮。是DOM自动化证据，不冒称物理鼠标真人试玩。

file和HTTP使用各自临时profile；write/read由不同Edge进程运行，恢复未确认事件字节记录、五流和revision一致；read执行pending保存并实际iframe重载不重算。渲染故障和Storage.setItem故障保持当前state/DOM/envelope，成功导入一次写入并保留previous；两个旧key非空字节保持。Chrome标准安装路径未有可执行文件，本轮缺测，不把Edge UA的HeadlessChrome冒充Chrome。

## 授权代码迁移与保护

|文件|F2原冻结SHA256|E1/E2修复冻结SHA256|
|---|---|---|
|js/gdd1/resolver.js|a3a16b619c3f910e14a9916b8bfed9556e97bcf2b82b5c77ab93b693e7bb930f|ceb14cd1a65a0b5fd9ff9c74d0d493fa30876a1231a515cd59ce4fcf0bd005bd|
|js/gdd1UI/main.js|578eb0d2457ca7b54db556975f50ca6a387506c00c3943afa36ab9515868bdb7|4145b5be5193cc3c9c15b65d61e8c59a8e91b2227a022dfb073c2ff8608be7d5|

本复审不改这两个实现文件。fix-freeze2/2、fix-deliverables36/36、原audit-deliverables40/40、原受保护245/245 bytes+SHA均匹配；原F2 freeze51恰49项不变和上述2项授权迁移。main hash使用主审已纠正值。证据在 `f2-retest-protection.json`。开工snapshot覆盖459既有文件（docs/js/css/tests），最终458相同、1旧结果事故例外；该snapshot不包含根目录文件，不能宣称覆盖整个工作区。另核对的原245清单包含其原保护范围。

## 事故与旧报告勘误

1. 本复审误执行 `node tests/gdd1/retest-run.js > tests/gdd1/f2-retest-f1-run.txt`，实际重写 `tests/gdd1/retest-node.json`。立即披露主审；**没有恢复、没有改旧manifest**。前后均27272bytes，但原SHA `a1bb4a3beefe47ed9646673bd7aa645a930c353e205255c0c3715fce35bdb590`，现SHA `17447f669087e5ca7f85f5b339cdfee33a1c6c623f98ff208bc2af1afabcbd40`，不是同字节。只变 `hashes["js/gdd1/schema.js"].bytes` 14987→17026及对应sha 607b30...→50d8ef...。将这两个元数据字段在**内存**换回F1接受值后，相同JSON序列化+换行恰得原baseline SHA，证明其他case/result/error字段未变。不是功能回归，但确为历史证据保护例外。前bytes由该hash精确重构确认；没有冒称初始snapshot已存bytes。详见 `f2-retest-incident.json`。
2. 此后历史runner全部由 `f2-retest-historical.js` VM包裹，fs写路径明确白名单且重定向新prefix；未知写入直接拒绝。四个实际requested→redirected记录完整保留，未直接再执行旧runner。没有修改独立预期。
3. 浏览器初次file两进程完成，HTTP因测试服务尚未启动未进入harness；原输出另存 `*-initial.*`，启动服务后补跑四组。一次PowerShell内联生成脚本引号解析失败，未执行case、未写历史结果；改用新JS生成文件。复审新增harness草稿曾被修正，这些新文件不作为旧冻结证据。
4. 旧FIX报告Verification承认初次43/45 read被45/45覆盖、原字节未保留，Preservation却仍称“retained”。**以未保留为事实，retained句不成立**；仅在本报告勘误，未改旧报告。fixer曾重写f2-audit-node再用旧resolver恢复同字节的历史偏差同样保留；最终audit40匹配不代表此前零写。

## 交回与索引

最终全部新增文件的完整bytes/SHA索引见 `tests/gdd1/f2-retest-deliverables.json`（自身不包含，避免自引用）；含报告、initial/boundary-only/final证据与事故记录。最终验证输出为 `f2-retest-final-verification.txt`。测试HTTP服务8324已关闭；此处停编交回主pane，不扩全量，不自行宣称平衡、Chrome或真人验收通过。
