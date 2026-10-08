# GDD1 F2 — A/B/D 可运行切片交付 / 停编送审

## 1. 交付边界

本轮只实现 `slice-abd-v1`，独立入口 **`gdd1.html`**。直接双击 `file://` 可用，无 npm、无远程资源、无构建步骤；也可用任意静态 HTTP 服务。原 `index.html`、旧引擎/数据/UI、旧历史报告与证据均未修改。

- A/B/D 各 8，共 **24 符号定义**；`spent_gasket` 不进入普通候选，因此 **23 候选**。
- 10 道具：dew_calendar、root_wrap、frost_glass、sorting_apron、waste_log、offcut_chute、clean_mesh、brine_lining、fraction_gauge、residue_stamp（均有 `item_` 前缀）。
- 3 事件：fog_shift、copper_queue、brine_inspection（均有 `event_` 前缀）。
- 起始 12 实例：mist×2、wick×2、ash×2、copper×2、saline×2、brine×1、spent×1；UID u1–u12，nextUid=13，现金0，刷新/删除券各2。
- 10期70轮，轮数 `[6,6,7,7,7,7,7,7,8,8]`。
- 付款 `[46,82,137,208,299,410,553,728,949,1222]`，逐期 Normal×0.65 向上取整。
- 页面持续标注 **“切片试验经济，不计正式通关”**。
- `full-v1` 仍仅为 F1 schema 元数据，不能从本轮入口启动或导入运行；没有扩展到 C/E/F/G/H、32道具、8事件、美术或音效。

**状态：本交付停止编辑，等待主审。这里的测试通过不等于独立验收，不等于平衡/真人胜率验收。**

## 2. 文件与接口

| 文件 | 职责 |
|---|---|
| `js/gdd1/content.js` | 有界定义、effect数据、监听死亡许可、切片新局 |
| `js/gdd1/descriptions.js` | 切片中文规则说明，来自冻结GDD；事件方案文字 |
| `js/gdd1/offers.js` | 加权无放回抽UID、未锁格洗牌、预约、分层候选与保底 |
| `js/gdd1/resolver.js` | selector / predicate / primitive / event / counter / limit 通用结算 |
| `js/gdd1/controller.js` | revision事务、Spin与选择、付款、道具、新期、事件确认 |
| `js/gdd1UI/main.js` | 实际页面交互、渲染、存档/导入导出、只读旧局摘要 |
| `gdd1.html`, `css/gdd1.css` | 独立功能页面；5×4盘、实例池、候选、账本/日志 |

公开切片入口为 `GDD1.sliceNewRun(seed)`、`sliceCommand(state,command)`；F1 的 `createFoundationState / transact / encode / decode / store / load / commitImport` 保留。`sliceResolve` 是**草稿状态结算函数**；实际交互只经 `sliceCommand` 克隆事务提交。未创建 F1 禁止提前提供的无前缀 `newRun/resolve/command`。

## 3. 已实现语义

### 抽样与候选

- 保留 F1 五流 RNG。定义数据、目标稳定顺序、纯渲染与恢复不取随机数；effect流在此切片的确定性动作中不消费。
- 超20实例按UID加权无放回抽20；不足20全部抽入。清栈细网的 junk 权重×1/2，合成后夹到 `[1/4,2]`。
- 预约先验 UID/epoch/到期轮并固定原格，其余全部未锁位置 Fisher–Yates 洗牌，空格不堆左上；预约在抽盘消耗，转换/删除清失效预约。
- 符号按两阶段一组稀有度表、道具按阶段组表，先抽非空层再层内ID，同组不重复，已持有道具排除。允许刷新再次见旧ID，不伪造新牌保证。
- 优先 eventCrystal → itemProduct → 阶段首次 common；自然窗口才检查/消费保底，刷新不重新发保底；消费被更高优先级压掉的阶段首次common窗口。
- refresh持久化0..3、每次1券、原窗口/原pending不变。满200仍给候选，可skip或删后选；201非法选择不消耗UID/RNG。

### 结算

- 基于 effect数据的通用 selector/predicate/primitive，resolver 无 symbol-ID 特判。
- 自然年龄 → 轮历 → 绑定fog → 补雾工；共享成熟guard，保UID/永久值，epoch+1、类型counter重建，新类型本轮不重开出现能力。
- 出现条件统一读取年龄后快照；结构阶段按当前存活/合法目标重新筛选；失败目标不消耗成功额度。
- 成功事件在父动作之后立即监听，因果 parent/depth 可追溯，不延迟到最后批处理。消耗另产生 cause=consume 的destroy；事件确认/主动删除不伪造运行成功事件。
- 死亡源默认不响应，仅明确的自身被耗扇叶/灰毡有死亡许可；灰毡第三次上盘自毁与被耗分支互斥。
- 支援压力只找真正带counter机制且尚可增加的实例；满压/无机制目标不会吞预算。压力检查点释放一次归零。
- 每源生成≤1、同effectKey全盘≤2，失败无新UID，新实例只入池、不补本盘；满池软跳过保留已成功消费，并记录原因。
- 每源/效果/目标倍率一次，同定义最多两个来源；BigInt有理数累积，金额最后一次向负无穷取整，独立奖励不乘倍率。
- 普通账本含来源贡献：基础/永久归自身，加值归来源，倍率边际差及舍入归应用来源；死亡普通贡献归零。每格贡献守恒，普通贡献+日志独立奖励=净额。间接供料只记录生成、不重复算钱。
- 净额仅写pending，cash不提前入账；选择/skip才 `max(0,cash+pending)`，期末随后付款。新符号不能补本期缺口。第10期付款成功WON，不发第10次道具。
- 预算/安全上限：池200、真实生成40、日志5000、深度32、金额绝对值1e9；草稿硬异常整笔回滚。此有界切片各定义硬动作数量还受小于64的effect额度/一次成熟guard限制。

### 道具/事件/存档

- 道具额度保存spin/stage/run及used，轮/阶段正确重置；分馏格尺成功前使用局部预约，稳定状态仍为 `fractionGaugeReserved=false`，不会重复兑现。
- 新期资源在道具选择或放弃之后同样发放，上限9；阶段3–10额外删除券。
- 第2–8次成功付款后进入新阶段再评估事件；合法集合非空才抽40%判定，成功再抽事件；seen永久记录，最多3次，成功后的下一次付款冷却。
- 事件确认重新检查UID/当前类型/成本/容量；fog绑定原UID，成熟不吞次数、不转绑；铜事件保UID/永久并新增spent；brine移除前体并设置下一自然窗口晶体保底。未确认或B不提前做A效果。
- GDD1独立存储key/schema/profile；导入先完整解码及**离屏实际UI渲染预览**，再一次写入包络，最后发布state。预览异常/存储异常不变当前state或旧存储字节。续局不重新结算/抽候选。
- UI支持新局确认、继续、保存、自动保存、导入、Blob导出、实际目标选择、删除空池确认、消费保底刷新确认，以及旧key原字节只读导出。

## 4. 测试与证据

本轮所有新增测试/结果为 `tests/gdd1/f2-*`，未运行会覆盖历史清单的旧runner。`f2-regression.js` 只在独立VM加载原脚本，重定向**结果输出文件名**到F2，不改历史测试、案例或预期。

| 检查 | 最终结果 | 证据 |
|---|---:|---|
| Node v24.14.1 F2 | **154/154** | `f2-node.json` |
| Edge 154 file 写入/实际UI | **165/165** | `f2-edge-file-write.html/.json` |
| Edge 154 file 独立进程恢复 | **156/156** | `f2-edge-file-read.html/.json` |
| Edge 154 HTTP 写入/实际UI | **165/165** | `f2-edge-http-write.html/.json` |
| Edge 154 HTTP 独立进程恢复 | **156/156** | `f2-edge-http-read.html/.json` |
| 154条Node/Edge逐例结果 | **四组一致** | `f2-parity.json` |
| 原旧回归 | **602/602，名字顺序不变** | `f2-legacy.json` |
| 历史M3（非本轮独立验收） | **64/66，原2失败保留** | `f2-legacy.json` |
| F1基础+手算索引 | **117/117** | `f2-f1-regression.json` |
| F1修复回归 | **101/101** | 同上 |
| F1独立复测原案例 | **38/38** | 同上 |
| F1原缺陷复现脚本 | **22/28；预期6个已修复缺陷复现失败集合完全匹配** | 同上 |
| 开工前341文件 | **仅schema允许增量** | `f2-before.json`, `f2-protection.json` |
| 原受保护245文件 | **245/245哈希/字节一致** | `f2-protection.json` |

154条引擎检查包括：24定义无目标精确基值；每种年龄成熟、邻接/快照、即时转换监听、死亡许可、灰毡双分支、蓄压上限与无机制过滤、异type条件；10道具的兑现/无目标/阶段额度；3事件A/B/失效目标/费用/容量；准确UID/epoch/counter/日志parent；12/21抽盘RNG消费与预约；候选层权重/无重复/三保底与刷新0..3；200/201；两种期末付款±1/恰好值；生成/倍率软上限、负有理舍入；resolver硬故障/导入渲染故障/存储故障；归因守恒与篡改拒绝。

附加覆盖包含：20个seed逐命令存档往返后重放一致，30个seed实际事件触发/未触发/冷却两种分支，8个**人工高永久值fixture**连续70轮及9道具/10付款完整通过。人工fixture只验证状态机，不是普通seed胜率或经济平衡证明。

真实UI检查通过实际DOM按钮及File/DataTransfer导入控件处理器运行，验证pending刷新不重抽、删后选、付款/道具/下一期、事件无目标拒绝和确认、导入渲染异常、Storage.setItem异常、真实Blob下载控制、390px iframe无横向溢出及旧key原字节不变。跨进程read不是同页变量恢复。

截图：`f2-desktop.png`；`f2-mobile.png` 为 `f2-visual.html` 中**实际390px iframe viewport**（外层500px，右侧留白），不把Chromium headless最小外窗宽度误报为390px。

**Chrome未安装**：三个标准Chrome路径均不存在，证据 `f2-browser-availability.json`。本轮只有Edge实跑，不能把Edge UA的HeadlessChrome字符串说成Chrome实跑；也未声称Firefox/WebKit或真人操作验收。

历史M3原2失败仍为：
- `route-m3/brine/feedstock-to-crystal-first-add-four`
- `route-m3/bus/storage-envelope-and-backup-counters-preserved`

## 5. Schema增量与保护

仅演进F1的 `js/gdd1/schema.js`：
- 因果log可继续使用原8字段，或使用新增严格 `facts` 字段集。
- ledger可继续使用原字段，或额外携带严格 `contributions`，验证来源合法/唯一及守恒。
- 未放松F1已有阶段、身份、UID、age、fog、包络、同步预览规则；原测试原样通过。

| 文件 | F2前SHA-256 | F2后SHA-256 |
|---|---|---|
| `js/gdd1/schema.js` | `607b30ac2c74708e1dff56063f1aa82d4e57f4099837707e6c02e25c2d22a858` | `50d8eff3f55a7150635795a301f568409c8fd57a4d7a438e2b6ab5aebc9154a9` |
| `js/gdd1/save.js`（未改） | `2f0d39ceebee434cbbb38c9fb01c6bf73e7ad6328ced84ab022a135d618eebba` | 同前 |

冻结GDD `docs/GAME_DESIGN_V1.md` SHA-256始终为 `e33e1699aed464cd656abc2344d9e68be92a7238da482f9861e5e67dedc8df07`。所有F0/F1历史文档/测试结果/旧清单原字节不变。

## 6. 冻结代码SHA-256

完整本轮代码/报告/测试/证据的字节数及SHA-256见 **`tests/gdd1/f2-freeze.json`**；清单不自包含，以免自引用。下面是可运行入口与源码冻结值：

| 文件 | SHA-256 |
|---|---|
| `gdd1.html` | `caaa700d91e46baa88296d201b6853c93aed5321b708ec7c7cc9dd326b17c62c` |
| `css/gdd1.css` | `d28159e4d642c4d4b650daa2036fa53928f0dcccca5f505d0640970d62687740` |
| `js/gdd1/contract.js` | `b7bd44d05ccdd4ffffe13e4949f7de92f3c7f37e628feaf3a6bf58023e7ea5c9` |
| `js/gdd1/rng.js` | `f3f5c055a8e3f4d5e18d355488194f94dfbc28603be7c29a5aab1743bd6704f7` |
| `js/gdd1/schema.js` | `50d8eff3f55a7150635795a301f568409c8fd57a4d7a438e2b6ab5aebc9154a9` |
| `js/gdd1/save.js` | `2f0d39ceebee434cbbb38c9fb01c6bf73e7ad6328ced84ab022a135d618eebba` |
| `js/gdd1/content.js` | `e6c753479683480c27ad0a3888a058edb8e90a0a4397e218c9e7fa8efe7ad239` |
| `js/gdd1/descriptions.js` | `d167d5053a1a30811dbc4a787555ba83fd302af293c82c6b17431f79d021d4ca` |
| `js/gdd1/offers.js` | `6d3ec272e2af0e32bc4d604cd5b6b4be53196e3be593a27ca6fee0303ed23295` |
| `js/gdd1/resolver.js` | `a3a16b619c3f910e14a9916b8bfed9556e97bcf2b82b5c77ab93b693e7bb930f` |
| `js/gdd1/controller.js` | `fb2f2870ea89cbe742c7f8190ad5c48fbacb4e09906545039119214f955afe24` |
| `js/gdd1UI/main.js` | `578eb0d2457ca7b54db556975f50ca6a387506c00c3943afa36ab9515868bdb7` |

## 7. 重跑方式与送审限制

```powershell
node tests/gdd1/f2-run.js
node tests/gdd1/f2-regression.js
node tests/gdd1/f2-verify.js
# 浏览器需要测试静态服务先保持运行（游戏自身不需要Node）
node tests/gdd1/f2-server.js
# 另一终端
powershell -NoProfile -ExecutionPolicy Bypass -File tests/gdd1/f2-browser.ps1
node tests/gdd1/f2-parity.js
```

测试只重写F2结果路径；重跑会改变已冻结证据，应与本冻结另存比较，不能冒充原结果。工程不是git仓库，保护依据是开工前全量哈希与245原清单，不虚构commit。

待主审：独立审查通用原语、阶段排序、日志/归因、真实交互故障及冻结保护。任何后续修复均须另立增量证据，不能悄改此报告/冻结清单或历史结果。本轮不继续扩展正式全量、做美术音效、宣称平衡完成或自行宣布独立验收。
