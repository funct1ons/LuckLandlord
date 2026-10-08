# GDD1 F1 基础契约（交主审，尚非独立审核结论）

## 1. 边界、依据和优先级

本次只有 F1：新规则身份、schema2 严格稳定状态、五流确定性向量、隔离存储、克隆事务基础和独立手算 oracle。**不交 F2 resolver、候选抽取器、事件执行器、玩家新局入口或功能UI**；正式美术、动画、音效、音乐后置。旧 `index.html`、`window.Game` 和旧保存路径不接新模块。`createFoundationState` 的空池是合法 schema 脚手架，不是游戏起手；不得宣称它是可玩 newRun。

依据已完整阅读的 `GAME_DESIGN_V1.md`、`GDD1_F0_FREEZE.md`、`GAME_DESIGN_V1_AUDIT.md`。F0 解除了旧正文中历史“待授权”的状态，不重写任何冻结文件。

1. 效果正文（5.A–5.H、5.I、6 等）决定金额、条件、目标、上限；phase 索引只登记激活/选目标/额度提交时点。索引不得删去正文效果。
2. **父成功→生命周期子链立即有界排空**。`step6/lifecycle` 是效果分类，不表示把步骤3/5的回调延迟到步骤6。
3. **root_wrap**：本轮第一个成功 plant 转换后仍存活的实例立即 +4，不额外要求 product。
4. **pressure_index**：第一件实际正注压事件，对该事件同一目标即时追加1，封固有上限，不递归、不跨phase等待。索引箭头不是延迟指令。正文小阀给自身加压，不因索引中的“邻接pressure”近似描述改给邻居。
5. 年龄顺序：自然年龄→轮历→雾班modifier→补雾工；共用 `maturedThisSpin`，同UID当轮不二次成熟。转换保UID/永久，清旧counter、epoch+1；新形态不执行本轮新的出现。
6. 步骤4条件一次快照；步骤5先锁定 adjacency-add 首目标且不补选，再动态 structural；灰毡结束自毁在消费之后；塔仅可挑低于自身释放阈值的真实计数件，先扣压/倍率/独立8并标已释放，再处理剩余达阈值者。末期条件仅明示的步骤8规则可读末态。
7. 最终普通产出逐格有理数向下取整，不能 JS 浮点或截断负数；独立奖励不乘倍率。pending 可负，现金结算下限0。

### 隔离源码与加载顺序

`js/gdd1/contract.js → rng.js → schema.js → save.js`，只使用 `window.GDD1`（或无DOM的 `globalThis`）。不引用旧 resolver/content/save，不读写玩家磁盘文件、不发请求、无需 npm 包。现代 Chrome/Edge 支持 `Object.hasOwn`；运行时可直接静态 `<script>` 在 `file://` 离线加载。测试的 Node 文件读写和 Python 向量参考是开发工具，不是玩家依赖。

`rules/content="GDD1"`、`schema=2`、`saveKey="fog-port.save.v1.gdd1"`、`rngAlgorithm="fnv1a-utf16le-xorshift32-v1"`。profile 独立保存，拒绝未知profile，不从旧内容版本推导。

- `full-v1`：仅完整64/32/8 ID与正式付款元数据、schema测试支持；**不意味着实现全量玩法**。
- `slice-abd-v1`：冻结 F2 24 A/B/D符号、10道具、fog/copper/brine三事件；23普通候选（spent仅生成）。付款明确 `ceil(Normal×65/100)`，不改变正式Normal基表。
- 同seed但profile不同，五流身份不同。F2 UI 必须向 load/import 传 `expectedProfile='slice-abd-v1'`，不把full档当切片局。

正式轮数 `[6,6,7,7,7,7,7,7,8,8]`，70轮；正式付款 `[70,125,210,320,460,630,850,1120,1460,1880]`，合计7125；切片 `[46,82,137,208,299,410,553,728,949,1222]`。F2起手仍待实现，只允许冻结的12件切片起手，不偷偷沿用旧10件prototype。

## 2. 迁移矩阵（不静默修复）

| 输入/位置 | F1动作 | 是否可运行/可写 |
|---|---|---|
| 旧 `fog-port.save.v1` schema1/0.2/0.3/H-1/M3-1裸档或envelope | 只读原始字符串；尽力显示 version/rules/contentVersion/phase/cash/pending 摘要；原字节可导出 | 不作为GDD1运行，不调用旧迁移器，不写旧key |
| 旧 `.backup` / 损坏旧字节 | 同样只读；损坏仍提供原字节，摘要null | 不“恢复成”GDD1 |
| 旧档复制到新key/导入 | 严格拒绝 | 不默认rng、事件、quota、pending |
| 新schema2且全部身份/必需字段合法 | 载入原稳定状态 | 不重新结算、不重新抽候选/事件 |
| 已知schema2但缺一个rng流/consumed/事件/offer/item quota/used/reservation字段 | 拒绝 | 无补字段、无seed重播 |
| 未知rules/content/schema/algorithm/profile/difficulty | 拒绝 | 不降级到previous掩盖未来版本 |
| full与slice档 | 可显式识别两profile；指定expectedProfile不符则拒绝 | 不跨profile改付款/池/seed |
| 新key current非法、previous合法 | 普通load拒绝；用户显式调用 `recoverPrevious` 可导出经过验证的previous | 不自动写回；未显式处理损坏字节前store拒绝覆盖 |
| 新key不存在 | 返回No GDD1 save | 不碰旧key，不自动开旧局 |
| 存储读取被禁、写入被禁/超quota | 报可见错误/Session-only，调用者保持原内存局 | 不清旧档、不假报保存成功 |
| 导入>1MiB UTF-8、非法JSON或非法状态 | 验证前拒绝 | 无预渲染、无写入 |
| 导入预渲染失败或最终写入失败 | 不发布candidate，不覆盖当前有效档 | 原内存与原字节保留 |

新key用单记录 `{storageVersion:1,current,previous}`，一次 `setItem` 原子替换；previous是上一次经验证current，初次null。不建立新的legacy备用key。内部envelope允许≤2MiB+256字节，**导入/导出单状态≤1MiB**。只保存稳定phase，临时resolver栈不序列化。Raw导出 `encode` 与浏览器内部envelope不是同一种输入，禁止猜测格式静默转换。

`commitImport(storage,text,preview,expectedProfile)`：decode→独立clone预渲染验证→一次store→返回新state。preview不可写存储/真实DOM或更改当前局；正式DOM切换由F2 controller在成功后完成。preview失败或写失败返回无state，旧内存不应被赋值。预览拿不到最终candidate别名。`store`失败不决定玩家本轮是否运行；F2应保持会话可继续并可见地提示未保存。

## 3. 五RNG流协议与确定性向量

### 固定算法（新规则，不复用旧rngState）

每流初始身份：`JSON.stringify(["GDD1","GDD1",profile,"Normal",seed,streamName])`。依JS UTF-16 code unit顺序按**低字节→高字节**喂FNV-1a：起始2166136261，每字节xor后乘16777619模2^32；结果0映为1。包含引号/逗号/方括号等JSON字符，不规范化Unicode，孤立代理单元也按两个字节处理。

每抽：`x ^= x<<13; x ^= x>>>17; x ^= x<<5`，无符号32位保存；`consumed += 1`。随机数 `uint32/4294967296`，范围[0,1)，选择索引floor。洗牌降序Fisher–Yates，长度n耗max(n−1,0)次。state非零uint32、consumed非负安全整数；未知流/身份直接拒绝。0次流还必须等于身份推导初始值。**载入不执行next/shuffle**。

独立参考 `tests/gdd1/rng-reference.py` 不import任何JS/resolver，以 Python UTF-16LE byte FNV及掩码xorshift计算；已提交 `rng-vectors.json`，4组身份×5流×8次，共160个输出；另验证每流初值与consumed=8。Unicode向量 `雾港🌫`、空seed和两个profile均覆盖。参考重新计算只能写新测试路径/标准输出，不能把业务结果倒灌oracle。

F1-GOLDEN/slice-abd-v1首向量：

| 流 | 初state | 首uint32 | 第8次state |
|---|---:|---:|---:|
| draw | 1602634797 | 2004245036 | 3348825999 |
| effect | 2612130202 | 366905403 | 3669799216 |
| symbolOffer | 1365114811 | 1006105902 | 1756149598 |
| itemOffer | 105029952 | 523994837 | 3140514799 |
| event | 559497161 | 3533934521 | 4209952737 |

### F2消费者归属（此处是契约，不是已实现）

| 流 | 唯一用途 | 不可消耗场景 |
|---|---|---|
| draw | 抽池/盘位的带权无放回选择与相关洗牌 | 打开图鉴、显示日志、候选/事件 |
| effect | 明示随机效果，按pos→UID→effectIndex稳定序，进入风险判定才抽 | 重载、无合法目标、纯数值copy |
| symbolOffer | 符号层选择/层内ID/自然候选与合法保底抽样、实际刷新 | 预览、超3次刷新、券不足、取消 |
| itemOffer | 未持有道具按阶段权重三选；不足3展示实际剩余 | ITEM_CHOICE重载、重复确认 |
| event | 先资格+A可执行过滤，再40%出现判定，再合法ID权重选择 | 资格不符、无合法事件、重复重载；B/取消不重新roll |

预先锁位与权重draw的**具体消耗算法**及候选保底抽样细节由F2实现时显式固定并加向量；F1只冻结流身份/算法/用途，不冒称已验证抽盘实现。无用户操作的schema读取、预渲染、失败命令全部五流state/consumed不变。

## 4. 目标字段与稳定事务

所有顶层字段严格存在且不接受额外字段；身份不可在事务中改变。字段名单以 `schema.js` 的 exact检查为代码真值。

| 组 | 必需字段/约束 |
|---|---|
| 身份与进度 | schema/rules/content/saveKey/rngAlgorithm/profile/difficulty/seed/rng/revision；stageId=1..10；spin全局0..70；stageSpin与spinsRemaining严格同Normal窗口；basePayment取profile表，payment必须=base+可解释义务；cash=0..1e9 |
| 待结算与旧轮展示 | pendingSettlement仅SYMBOL_CHOICE非null，可负且等last.total；last原账本/奖励/盘/因果日志持久化，load不执行resolver。last.spin=spin，ledger逐原盘UID恰一条，死亡amount0，sum(ledger)+reward=total |
| 池 | pool≤200；UID为u正整数且唯一、<nextUid；type属于profile；permanent0..30；epoch非负安全整数；counter必须匹配该定义：age、pressure、beat或空，不得用warm_pod的标签冒充蓄压机制。成熟年龄不得留在已稳定池中 |
| 资源/持有 | items≤9不重复且属于profile，不越过已支付领取窗口；rerollTokens/removeTokens0..9 |
| 当前报价 | offer.windowId/kind/choices/choiceRefreshesUsed0..3/guarantees，SYMBOL/ITEM phase有原候选，不允许重复、禁候选污染或已持有道具；非选择阶段无候选。刷新后applied保底为空，来源pending标志原样保存 |
| 保底 | guarantees.applied=null或stage-common/event-crystal/item-product；stageCommonHandled/eventCrystalPending/itemProductPending三个显式bool，不因重载猜测 |
| 事件 | seenIds/count/cooldownPayments/activeModifiers/choice；三次总上限、seen不重复；EVENT_CHOICE保存id、固定A/B、targetUids、cost、stageId；费用必须与正文一致（fog4/misprint6/其余0），未确认事件不得已提交同ID modifier/付款义务。报价可能过期，确认时必须再次校验，不自动补目标。fog保绑定UID/remaining1..2；其他按明示阶段窗口 |
| 预约 | reservations≤2，UID与pos分别不重复；uid/pos/epoch/source/expiresSpin；目标当前存在且epoch匹配，只到spin+1；来源可为已离池的曾发行UID或持有item |
| 道具窗口 | fractionGaugeReserved稳定时false，临时预占随clone rollback；itemState.stageId/spin/quotas/used，每个持有item必须有`quotas:{spin,stage,run}`计数和`used:{spin,stage}`bool，无旧数组默认修补。计数记录对应监听成功数，used记录已消费机会；例如回执stage计数记录真实释放、used.stage记录第三次奖励已领 |
| 阶段义务 | stageState.advanceClaims/paymentModifiers/skipCount；advance每UID+12且一一配对；事件锅试+12或重核+10均可解释，不能自造payment；pool之外已离池邮戳仍保本阶段义务 |
| 设置 | settings.autosave/advanceAccepted显式bool |

F1 last日志基础行固定 `id,parent,depth,phase,action,source,target,amount`，保证父先于子、depth≤32、action/phase在登记集合、最多5000行。ledger用有理数整数**字符串**避免浮点漂移。F1验证结构与守恒，**不借载入重演来验证所有历史真实性**。F2完整日志还须在新模块中明确扩展 effectKey、sourcePos/targetPos、beforeTags/afterTags、targetTypeBefore/After、cause、actualIncrease、createdUid、skipReason 等行为归因字段及对应严格校验；不能为通过测试删掉必要事实，不能复用旧日志冒充GDD1。这是F2实现清单，不声称当前最小日志已是完整玩法日志。

### 原子提交规则

`transact(state,expectedRevision,synchronousMutator)`：验证原状态→检查revision→深克隆→同步mutator→身份/revision不可改→单次revision+1→完整验证→返回新的不与mutator别名共享的clone。异常/非法状态/过期revision/异步mutator返回 `{ok:false,state:原对象,error}`，现金、UID、RNG、quota、保底及phase原样不动。它**不是命令派发器**，F2仍需如下转移校验和target/window检查。

命令target必须用UID（不信type或显示槽位），携带expectedRevision；选择还带windowId和候选ID，事件带保存的id/A-B/报价target。旧窗口、双击、无效phase、目标死亡/转换、资源不足、取消都不得部分扣券、分配UID、抽RNG或改变额度。

| 原稳定phase→提交后 | F2需要原子包含的内容 |
|---|---|
| READY→SYMBOL_CHOICE | draw、年龄/临时标签/出现快照、完整事件队列和limits、ledger、last、pending；消耗一轮、更新窗口、生成一次符号候选、保存五流；硬异常整轮回滚 |
| SYMBOL_CHOICE→READY | 接受原候选ID或skip；实际刷新≤3耗券且替换同窗口报价，保底机会消耗不再补；确认后现金=max(0,cash+pending)，pending清空，非最后轮不付款 |
| 最后轮SYMBOL_CHOICE→LOST | 先结算pending再比较实际payment，差1即失败，不能旧现金比较或提前发奖励 |
| 最后轮SYMBOL_CHOICE→ITEM_CHOICE | 恰好够即扣款；进入持久化道具报价，此时不递增stageId、未进入事件setup，不二次抽道具 |
| ITEM_CHOICE→READY/EVENT_CHOICE | 选或放弃均消耗此道具窗口；原子递增stage、固定券并封9、重置阶段quota/used/义务等；新道具不追溯上轮；按事件资格/cooldown/总数/A可执行过滤→40%→selector一次。失败整个setup不提交 |
| EVENT_CHOICE→READY | 保存出现时已提交seen/count/cooldown/报价；A再验目标/费用/容量后效果原子commit；B消费既有出现机会不重新计数/roll；选择目标的取消/非法A仍留原EVENT_CHOICE全部字段 |
| 最后第10期付款→WON | 结算后够款直接扣款WON，不生成第10个道具、不发券、不出事件、不启动第11期 |
| WON/LOST | 稳定重载/导出；不能继续运行或借刷新重开 |

F2候选三ID不重复；common第一自然窗口优先、事件晶保底次之、道具product再后，最多替换一槽；只有真实成功生成窗口消费相应保底，不把refresh当新的自然机会。F1不实现随机层内分布，F2不得用静态前三个道具或旧全formal洗牌替代。

## 5. 独立手算oracle（11个，不使用resolver生成）

原始机器可读输入/预期：`tests/gdd1/hand-oracles.json`。**作者直接依正文手算**；`oracle-integrity.js`仅核对算术、≥4初始符号定义、≥3因果边、UID不重用和守恒；不是resolver行为测试、不算符号/道具/事件功能门禁。

通用条件：5×4盘，pos=行×5+列，八邻接；未列位置null；输入按pos分配u1…并由JSON显式记录；其余permanent=0/counters按实例给出，new epoch=0。full-v1只为这些跨路线手算的schema身份，不扩F2范围。所有11件**不使用任何随机效果**：假定提供已抽定盘，后续五流state/consumed均不变；没有候选生成。所有转换保UID/永久、epoch+1，未来生成池内UID不出现在当轮ledger。下表数字均为各格最后普通income（死亡0）+明确独立reward。

| ID | ≥4定义输入/位置简表 | 普通ledger（按pos顺序） | 独立奖励 | pending |
|---|---|---|---|---:|
| H01 | mist0 age2, root1, echo2, nursery19 | 3+2+5+2=12 | 0 | 12 |
| H02 | mist0 age2, root1 perm29, echo2, dew5 age1, nursery19；root_wrap/growth_negative | floor(7×3/2)=10 + floor(31×3/2)=46 +5+6+3=70 | 实际growth1×2=2 | 72 |
| H03 | valve0 pressure0, dew1 age1, spire5, root6, echo7；root_wrap/index | 3+0+3+2+5=13 | amber4+valve3+tower8=15 | 28 |
| H04 | tong0, ash1 age0, heat6, echo7；apron/growth_negative | 1+0+2+5=8 | tong6+apron3+growth2=11 | 19 |
| H05 | tong0, ash1 age2, heat6, echo7, tong10, spent11, auditor19；apron/growth_negative | 1+0+3+5+1+0+3=13 | 两tong12+apron3+growth2=17 | 30 |
| H06 | split0,copper1,chord2,dock3,cloth6,mist10 age2,root15,echo16 | 2+27+2+4+1+3+2+5=46 | 0 | 46 |
| H07 | phase0,pitch1,dock2,cloth5,chord6,mist10 age2,root15,echo16 | 20+1+4+1+2+3+2+5=38 | 0 | 38 |
| H08 | valve0 pressure1,wick1,spire5,pause6,mist10 age2,root15,echo16；index/receipt，阶段已释放2次 | 3+0+3+5+3+2+5=21 | consume3+tower8+receipt12=23 | 44 |
| H09 | reserve0 pressure3,amber1,router5,spent6,mist10 age2,root15,echo16；index | 2+0+2+0+3+2+5=14 | reserve consume2+amber4+self18=24 | 38 |
| H10 | mist0 age2,mist1 age1,stitcher5,root6,echo7；calendar/root_wrap/growth_negative；fog绑定第二囊remaining2 | 7+3+1+3+9=23 | first growth2 | 25 |
| H11 | coil0,saline1,mist10 age2,root15,echo16,blank17,reserve18 pressure0,index19；root_wrap/growth_negative/brine_lining/fraction_gauge | 1+11+7+2+5+5+2+7=40 | draw gauge7+growth2=9 | 49 |

### 三层因果与应核查事实（不仅总额）

- H01：年龄完成→转换事实→root永久实际+1→邻接echo+4，至少3条真实因果边。u1变dew/age0/epoch1，root永久1，echo成功1；只1件plant转换，nursery不放大。
- H02：同链但root29→30后第二转换实际增长0，不发第二growth/echo；plant转换事实仍有2件，nursery步骤8对存活plant×3/2。root_wrap仅首dew+4，增长底片只领2；不能floor总和，必须分别10/46/6/3。dew5→amber的旧age队列失效。
- H03：dew年龄→amber同UID→root成长→echo；随后valve消费amber，root_wrap的+4普通值随死亡归零，但amber独立4不丢。小阀pressure0→2→3(index即时)→0(tower)，塔本次8不吃×3；目标未到阈值6，合法，标已释放，不自释放14。
- H04：tong成功消费→scrap消费事实→heat实际成长1→echo+4；并行死亡分支ash→新copper u5，nextUid6。新铜只入池，当轮不赚base2/邻接2。apron/growth_negative各一次；灰毡消费分支不自毁、不领3。
- H05：同链，第二不同scrap不再让heat成长（每轮1），echo不虚发第二+4。已自然到age3的ash在步骤5被消费，仍只走消费产铜u8分支，nextUid9。步骤8 auditor使两tong各floor1.5=1、heat3、auditor自己3；不是全盘×3/2，echo保持5。
- H06：年龄→转换→root成长→echo；另真实新增标签→cloth+5→chord条件满足并锁铜×2，与split×3/2叠成3/1。铜普通(2+2machine+5)×3=27。dock只计同排铜/chord两种其他resonance，+2。池中铜原标签不变，不能“最终有标签就猜tagAdded”。
- H07：同年龄三边链；phase取得resonance→真实tagAdded→cloth+5，随后pitch首目标phase+3、chord首目标phase×2，(2+5+3)×2=20。dock同排phase/pitch两种+2。不能提前扫描copy或把pitch普通加值放在预处理之前。
- H08：同年龄三边链；consume→pressure+2→index同事件+1→tower实际释放→第三次receipt12。pressure1→3→4→1，未到阈值6，不自释放。pause仅普通标签条件，+1白名单与不可copy+2分开；它没有pressure counter，塔不能挑它。
- H09：同年龄三边链；reserve消费amber→pressure3→5→6(index)；router非消费销毁spent，注压目标已封6，actual0，不产生第二pressureIncrease。检查点reserve自释放18→0，独立奖励24，router没有消费奖励，不把destroy junk当consume scrap。
- H10：自然第一囊成熟→root成长→echo；第二囊自然1→2，calendar跳过成熟第一囊选择第二囊→3并成熟，再发第二root/echo。fog/stitcher共用matured guard，不再推进新dew，fogremaining仍2、不转绑；root永久2、echo9，root_wrap只第一囊，底片只首实际growth。
- H11：年龄→dew→root实际成长→echo；另一分支coil转换saline→tide→自身+3及brine_lining+4，普通4+3+4=11，同UID/epoch1。saline不是plant，不触发root。draw时blank/reserve/index已有3种crystal，gauge只7一次、预占已清；转出第四种不再奖励。index出现快照+6已满足，blank原出现+2合法，新tide不补出现。

JSON `facts`列出最终epoch/counter/永久、quota/used、pressure路径、created/removed UID与无重触发要求。`chain`仅要求因果partial order，不伪造符号监听与道具监听之间冻结正文未要求的所有线性日志顺序；F2必须给真实父子id及相关源/目标，不以写死这些描述替代resolver验证。

## 6. 验证路径、保护与交回原则

- `node tests/gdd1/run.js`：新namespace独立加载，五流黄金向量、流隔离、跨存续抽、六稳定phase、负/零/正pending、严格拒档、200池边界、reservation epoch/到期、fog/item窗口、revision/异步/别名回滚、单key保存、显式previous恢复、导入预渲染/写失败、UTF-8限额；另11个手算**完整性**检查。
- `python tests/gdd1/rng-reference.py`：独立向量复算；只打印stdout，输出与已提交JSON逐值比对。
- `tests/gdd1/index.html`：静态脚本，file/HTTP用同名cases；实际localStorage只读旧key，写新key；read模式跨浏览器进程重载验证五流延续。新测试浏览器使用独立临时profile，避免触碰真实玩家局。
- `node tests/gdd1/legacy-readonly.js`：直接载入旧suite函数，不调用原 `tests/run.js`（它会改旧manifest）；旧602全量与原names顺序检查，M3独立报告两条既有失败，所有结果只在新tests/gdd1路径。
- `node tests/gdd1/verify-protected.js`：初始 `protected-before.json` 覆盖**245个全部原有工程文件**（除.pi），结束逐字节长度+SHA256复核。prompt、EXECUTION_PLAN、冻结GDD/audit、legacy core50/10fixtures、baseline、manifest、freeze、历史证据及旧源码都在内，不仅最小指定集。

初始快照本身SHA256：`8b47a1950e561b55fdd761463e3d8854a1999ee3eb950f3f580ad53b5ae0751e`。冻结GDD：`e33e1699aed464cd656abc2344d9e68be92a7238da482f9861e5e67dedc8df07`；audit：`21fa22ecd565728c8fe670e1cc907504b34ffdabb7de1ae65b6d4e8300532221`。**不得运行重写旧manifest/freeze的runner，禁止用旧预期适配新规则**。

实际结果、浏览器可用性和缺测只在 `GDD1_F1_REPORT.md` 如实报告。F1仅由唯一实现worker完成，无再派agent、无Git reset/checkout。完成交回后停止等待主审；独立审核另行进行。F2仍限定24/10/3切片、12起手、ceil65%Normal、候选保底/五流/完整事务/功能UI日志，不是全量或平衡。若后续有真实设计阻塞，以最小反例交主审，不自行改冻结GDD。
