# GDD1 F1 独立审核

**结论：F1 BLOCKED，不予接受。F2 未授权，不进入开发。**

本次是独立审核，不是实现 worker 的自测复述。完整阅读冻结 `GAME_DESIGN_V1.md`、`GDD1_F0_FREEZE.md`、`GDD1_F1_CONTRACT.md`、`GDD1_F1_REPORT.md`，以及 `js/gdd1` 四文件和审核开始时 `tests/gdd1` 全部源码、向量、手算、保护清单、Node/浏览器/历史回归证据。117/117 和 245/245 是基线，不是接受条件。

仅新增本报告和 `tests/gdd1/audit-*`。未改实现、GDD、已有合同/报告、旧证据、manifest/freeze；未调用 `tests/run.js`，未派 agent。F1 原有 runner 会覆写既有结果，本次不执行它们，直接在独立 VM 中调用 suite 函数并只写 audit 输出。

## 1. 阻塞 Findings

### A1 / P1：异步预渲染失败仍提交导入

位置：`js/gdd1/save.js:68-76`，尤其第73行忽略 `preview(...)` 的返回值。

合同要求 decode -> 独立 clone 预渲染验证 -> 单写 store -> 发布 candidate，预渲染失败不得改当前有效字节或发布新 state。API 未拒绝 Promise/异步 preview；与 `schema.js:186` 显式拒绝异步 mutator 的处理不同。

最小行为复现（`F` 为独立加载的 GDD1 namespace，`m` 为 Map-backed Storage）：

```js
const old = F.createFoundationState('AUDIT-F1', 'full-v1');
F.store(m, old);
const next = F.clone(old); next.cash = 99;
const late = Promise.reject(Error('late render failure'));
late.catch(() => {}); // 防止审计进程未处理拒绝，并不改变失败事实
const result = F.commitImport(m, F.encode(next), () => late);
// 实际 result.ok=true，新增一次写入，持久档 cash=99；随后 preview 拒绝。
```

Node 和四次 Edge 同名 probe 都复现：`reproduce-A1-async-preview`。这不是 localStorage 部分写入问题，而是验证尚未成功就越过提交点。最小处理方向是明确同步预览契约并拒绝其 Promise/非许可返回值，或真正等待成功后再写档；本次禁止修改实现，没有修复。

### A2 / P2：稳定池接受已到自毁阈值的 ash_felt

位置：`js/gdd1/schema.js:46-53`。`ash_felt.age` 上界包含3，而禁止未提交成熟只覆盖 `F.AGE_TYPES`，ash 不在该表。

冻结 §5.B 与 §4.2：第3次上盘后，灰毡必须被消费，或在步骤6原子自毁并发独立3；不可能在完整稳定轮末池内仍有 age3 灰毡。它不是可以保存的 resolver 中间态。

最小字段差异：合法基础状态上设置 `nextUid=2`，池为

```js
[{uid:'u1', type:'ash_felt', permanent:0, epoch:0, counters:{age:3}}]
```

实际 decode/store/load 均接受。证据 `reproduce-A2-ash-age3` 与 `audit-node.json` 的 `A2.input` 包含完整状态。校验器已经拒绝 mist 等成熟阈值，却漏掉这个固定生命周期边界。该问题不是要求 load 重演所有历史。

### A3 / P2：fog modifier 接受有年龄、但非 plant 的目标

位置：`js/gdd1/schema.js:83-85`。只检查 AGE_TYPES，没有核对 plant 资格。

冻结 §4.2、§7.1 明确 fog 只能绑定有 age 的 plant；UID 绑定不转绑，新形态无 age 时失效。`cloudy_negative` 为 magic/feedstock，不是 plant。完整反例为 stage3 READY，pool 有 u1 cloudy_negative age1，seenIds 包含 fog，active modifier 为

```js
{eventId:'event_fog_shift', uid:'u1', stageId:3, remaining:2}
```

实际 decode/store/load 接受，Node/Edge 均复现 `reproduce-A3-fog-nonplant`。同类资格缺口也涉及非 plant 的 brine_strip；本次实跑反例为 cloudy_negative，不把未实跑的扩展当新 case。

这与允许 EVENT_CHOICE 保存稍后需重新校验的 stale 报价不同：这里是已经确认的 active modifier 目标非法。

### A4 / P2：阶段 modifier 在固定窗口结束后仍可作为 active 持久化

位置：`js/gdd1/schema.js:86-88`。检查当前 stage 与 remaining 范围，却不核对 stageSpin 到期。

三个最小反例均为合法 stage3 稳定 READY，其余字段同步更新、seen/count 匹配：

| probe | 已完成 stageSpin | active modifier | remaining | 冻结约束 |
|---|---:|---|---:|---|
| A4a | 4 | event_silent_bell | 3 | 只作用新阶段第1/2/3轮，没有上盘也消耗窗口 |
| A4b | 4 | event_misprint_window | 3 | 前3轮，第4轮已到期 |
| A4c | 2 | event_empty_manifest | 1 | 只作用新阶段首轮，不补发 |

均被 decode/store/load 接受，六平台/进程无关：本次实测 Node + Edge file/HTTP 两次进程共五次一致。严格来说，这是 schema 接受过期 active 状态；F2 尚无执行器，**没有声称已观测其重新给钱**。固定时点/到期属于 F1 durable modifier 合同，不能仅寄望未来 controller 修补非法档。

最小方向是核对固定阶段窗口，并明确 remaining 与已完成轮次的关系/清除点；本次未改变字段设计或实现。

## 2. 实测与原子性范围

证据入口：`audit-run.js`、`audit-checks.js`、`audit-node.json`。

| 检查 | 独立结果 | 限定解释 |
|---|---|---|
| 既有 foundation + integrity 函数，只读 VM 复跑 | 117/117 | 仍不等于 F1 接受；其中11只是原 integrity |
| 独立对抗检查 | 28/28 probe 执行成功 | 22个正常边界 + 6个缺陷复现；缺陷复现“通过”不是合同通过 |
| 五流独立 BigInt 参考 | 80/80身份；20,480个输出一致 | 2 profile × 8 seed × 5流，各256步，含空seed、中文/代理对、孤立代理、引号/斜杠/换行、组合Unicode、1024长度 |
| 11个语义手算重新推导 | 11/11 一致 | 不调用 resolver，也不使用 integrity 计算预期；不是行为引擎通过 |
| 原始保护清单 | 245/245 字节长度/SHA256一致 | 只读取旧清单，不重写 protected-after |
| F1交付清单 | 33/33 一致 | 包含实现/合同/报告/原证据 |
| 审核入口额外快照 | 279/279 一致 | 覆盖全部非 `.pi`、非 audit 原文件；新增 audit 文件除外 |

正常边界覆盖：六稳定 phase 单写封套 roundtrip；pending -1e9/-1/0/1/1e9 原额不重算且不入现金；pending/last 不符、未来/循环 parent 拒绝；revision 上限/异常 rollback、RNG/UID不部分提交；异步 mutator 拒绝、callback alias 与提交态分离；consumed 上限拒绝且 RNG 不部分改变；shuffle 0/1/201 的消耗次数；Storage 写失败/读取权限失败、非法导入不预览/不读取存储；未来 current 不自动 fallback/不覆盖，显式 previous 恢复；profile mismatch 拒绝；pool200接受/201拒绝。

另只读复跑的原 suite 覆盖 0池、UTF-8导入限额、缺字段/未知身份/流/counter、quota/used、预约 epoch/下一轮到期、负pending/保底/刷新持久化、同步预览抛错和写失败等。不能把其106个基础 case 与新增28累加成“134个独立功能点”。

**正常保存与事务未发现单key/克隆层面的原子性回退。** `store`一次写 current/previous，读取不抽随机；正常同步 preview 抛错、写失败均不发布 candidate。A1 是本次新增的真实提交前置条件缺口。Storage 写入前自行产生副作用的 preview 属于合同禁止的调用方行为，本次没有用恶意 callback 改真实DOM/存储来冒充 adapter bug。

旧两个key预置非空原字节哨兵；store/load/import 只写新key，readLegacy 返回相同字节。旧档隔离检查通过，不迁移、不覆盖，也没有接入旧 Game/resolver。load 结构守恒不等于防篡改/全部历史真实性验证，本次 findings 均为可直接检查的固定状态不变量。

## 3. 11个 Hand Oracle 独立复算

`audit-oracles.js` 只读取冻结GDD正文64行的 base/tags和原手算的**输入**；用新写的显式纸算公式推导预期，再与原 ledger/reward amounts/created/removed/pending 对照。运行时不 import GDD1 四模块、resolver、oracle-integrity。这是审核证据用纸算器，不是 F2 的可玩引擎。逐案 derivation 与完整计算行在 `audit-oracles.json`。

所有位置按5×4八邻接；生成物仅入池，普通产出逐格floor，独立奖励不乘倍率。逐案人工核对原 facts 中的 UID、epoch/counter、永久、使用额度、无重触发与 causal partial order；没有把描述文本匹配当行为执行。

| 案例 | 独立普通产出推导（死亡0） | 独立奖励 | pending | 核查重点 |
|---|---|---|---:|---|
| H01 | 3+2+5+2 | 0 | 12 | age2->dew epoch1/age0 -> root+1 -> 邻echo+4；仅1转换，无nursery倍率 |
| H02 | floor(7×1.5)+floor(31×1.5)+5+floor(4×1.5)+floor(2×1.5)=70 | 2 | 72 | 两自然成熟；root29->30后actual0不发第二growth；wrap首u1；nursery包含自己 |
| H03 | 3+0+3+2+5=13 | amber4+valve3+tower8=15 | 28 | dew先成熟/成长/echo再被耗；wrap+4普通值死亡归零；pressure0->2->3->0，塔标释放无self14 |
| H04 | 1+0+2+5=8 | tong6+apron3+growth2=11 | 19 | scrap成功->heat实际1->echo4；ash只走消费支产u5，nextUid6，无新铜当轮收入/自毁3 |
| H05 | 1+0+3+5+1+0+3=13 | 两tong12+apron3+growth2=17 | 30 | ash到age3但消费优先；另耗spent，heat每轮1；auditor只倍率存活machine，两个1.5逐格floor；u8池内 |
| H06 | 2+(2+machine2+cloth5)×(1.5×2)+2+4+1+3+2+5=46 | 0 | 46 | 铜实际新增双标签；织布只+5一次；chord铜/dock两类锁铜；dock同排铜/chord+2；池标签不变 |
| H07 | (2+cloth5+pitch3)×2+1+4+1+2+3+2+5=38 | 0 | 38 | phase先获resonance；织布后pitch锁pos0；chord首pos0；dock仅phase/pitch两种；无额外crystal |
| H08 | 3+0+3+5+3+2+5=21 | valve3+tower8+receipt12=23 | 44 | pressure1->3->4->1；真实第三次释放；pause2+平面1+标签条件2但无counter，不可塔/注压目标 |
| H09 | 2+0+2+0+3+2+5=14 | reserve2+amber4+self18=24 | 38 | consume注压3->5->6；router非消费destroy，cap6实际0无注压事件；reserve自行释放归0 |
| H10 | 7+3+1+3+9=23 | 首growth2 | 25 | 自然第一囊成熟；calendar过滤后令第二成熟；fog remaining2不消耗，stitcher不成功；root永久2/echo两次，wrap只首 |
| H11 | 1+(4+自身3+lining4)+7+2+5+5+2+7=40 | draw gauge7+growth2=9 | 49 | 初盘已有3晶类格尺一次并清预占；saline->tide不触发plant成长/新出现；blank平面2，index快照+6；所有转换保UID/epoch+1 |

11案语义未发现需改冻结设计或旧oracle的冲突。依赖的三层链（年龄/消费成功 -> 转换/scrap事实 -> 实际永久成长 -> 邻接echo）以及pressure即时index、死亡许可/产物等已逐案检查。全案无随机效果，抽定盘之后无五流消耗；“无随机”是本文规则推导，不是运行未来 resolver 得出的结果。

## 4. 独立浏览器与缺测

自建 `audit-browser.html` + `audit-checks.js`，不使用原浏览器测试页或原DOM输出。Edge安装产品版本 **154.0.4258.53**，Node **v24.14.1**。file 与 HTTP 各使用独立临时 user-data-dir；同协议 write/read 使用同一profile，但 read 为第二独立浏览器进程。

四次均28/28执行一致，且 findings 完整JSON与Node一致。另各验证真实localStorage的五流续抽、旧key非空哨兵不变、持久档与写入态逐字段一致。`audit-parity.json`保存 case级名称/ok/error与findings一致性，不仅比较总数；四次不能相加为112个独立门禁。浏览器UA中的 HeadlessChrome 字样是Edge的Chromium标识，**不是Chrome实测**。

证据：`audit-edge-{file,http}-{write,read}.html`、对应stderr、`audit-parity.json`。HTTP仅监听127.0.0.1:8317并只供给gdd1模块/证据；最终已停止。

Chrome：检查常见机器32/64位、用户安装路径及HKLM/HKCU/App Paths，未发现可执行文件，**Chrome缺测**。未安装替代浏览器冒充通过，Node+Edge不满足冻结未来Chrome/Edge完整平台门禁。没有做玩家UI、视觉、真人或平衡验收，它们不是本次F1工作。

审计工具过程中遇到Windows apply_patch批处理命令长度/引用限制，新增证据改用write/edit工具；未影响原文件。独立浏览器脚本首轮因PowerShell数组拼接形成错误file URL，得到ERR_TOO_MANY_REDIRECTS/空DOM；修正仅audit脚本后四次完整重跑，最终结果见上述证据。没有删除产品case或更改旧预期来处理失败。

## 5. 范围结论与复现

五流算法/隔离/身份、旧key隔离、同步克隆事务、正常单key封套/显式恢复、稳定phase与pending的既有正向持久化，以及11案纸算语义在本次覆盖内通过。**异步导入前置验证和三个稳定schema不变量类别仍阻塞F1**，不能用117/117、oracle完整性或保护hash抵消。

没有发现必须更改冻结GDD的设计阻塞；问题位于现有F1基础验证/保存实现。F2候选/抽盘具体消耗算法、命令phase转移、真实付款恰好/差1/双击、事件确认执行、切片24/10/3及功能UI未实现，不能作为本次已通过项，也不因为未实现F2而错误要求本次开发。

历史旧602/602、M3 64/66及两条既有失败已完整阅读，但本次未重新运行旧回归，不称它们为本次新通过/新失败，不修旧合同。

```powershell
node tests/gdd1/audit-run.js
node tests/gdd1/audit-oracles.js
# 独立浏览器复现需要开发HTTP服务器，运行后另终端执行：
node tests/gdd1/audit-server.js
powershell -ExecutionPolicy Bypass -File tests/gdd1/audit-browser.ps1
node tests/gdd1/audit-parity.js
# 复现完成后停止audit-server，不运行任何旧runner。
```

最小状态重放：独立加载contract/rng/schema/save后，从 `audit-node.json` 中取 `audit.findings.find(x=>x.id==='A2'/'A3'/'A4a'...).input`，调用 `F.decode(JSON.stringify(input))`，当前不会抛错；期望严格拒绝。A1复现如上，完整命名probe在audit-checks。这些probe的成功只表示缺陷仍可复现。

**交回独立审核结论：F1 BLOCKED；本次未修实现，未授予F2权限。完成后停止。**
