# 《雾港回收工坊》游戏设计 GDD V1（工作名；原《雾港余热局》）

> **现行用途：规则与设计基准，保留初版提案及历史门禁；不是实时进度或平衡通过报告。**
> 当前实现与文档职责见 [文档导航](README.md)。初版“待主审”及后文工程阶段属于各自记录时点，不据此否定已经落地的玩家外壳，也不追溯扩大机制审核范围。
> **以下两段为初版撰写时点的历史范围说明，不是当前实现状态：**
> 初版仅新增本文件。当时 M3 是未验收中间版本；暂停代码开发，待本文完成和主审评审后另行授权。历史 602/602 只证明其覆盖的规则，不能证明经济成立、内容齐全或好玩。本文的数字是可测试初值，不是实测结果。
> 设计对象：自己和朋友玩的离线 PC 构筑游戏；有效机制优先，不为原创叠加系统，不复制外部代码或素材。原始 prompt、执行计划及历史审核证据均保持原样。批准后，本文是新版本目标合同；未批准前不追溯改变旧验收。

## 1. 定位与成功体验

一句话：**接手负债的雾港回收工坊，把随机运行的回收机改造成能持续赚现金、按期付清账单的机器，交满10期保住工坊。**

- 玩家是工坊经营者，不是城市供能配额执行者。材料、设备与帮手在随机盘面协同产出收入；收入计入纯虚拟现金，现金支付本期账单。账单是既有阶段付款的叙事映射，不新增动态债务系统。
- 单机、完全离线；HTML/CSS/Vanilla JS、本地 SVG/Web Audio/localStorage，支持 Windows Chrome/Edge、file 与可选本地 HTTP。没有现实赌博、真钱、账号、商店、采购、客户、利息、日历、能源计量或局外数值成长。
- 20格盘面、生产牌库、每轮三选一或跳过、有限移除/刷新、阶段付款、本局升级、少量自愿事件；不是手动摆位或手牌出牌。
- 内容模式 `full-v1` 的玩家名为“完整模式”，`slice-abd-v1` 为“精简模式（试验）”；两者都沿用内部难度 `Normal`（玩家名“标准难度”），内容模式与难度不混用。一局10期、70次运行；成功付清第10期账单即保住工坊，任一期到期、本轮收益入账后现金仍不足本期应付，才判本局经营失败。新玩家目标25–40分钟，熟练18–28分钟；这些仍是设计目标，不是实测结果。
- 三层决策：眼前够付本期账单；中期在供料/引擎/回报间分配候选；长期用移除、跳过、保留改善关键件同时上盘机会。牌库不超过20时新增牌通常填空，不必然稀释；不强制单路线或删重复。
- 不要求收齐套装。常见件即可启动，Rare提高上限，Epic不作为通关门票。初版数字目标仍由前期约15–30/轮，过渡到中期60–150、后期180–400；优秀局偶发800–2400，极端组合可超过10000，但不是付款必需；本次不重新批准这些经济目标。
- 成功体验是“我救活了这间工坊，而且看得懂机器为什么赚钱”，不是单纯刷现金总数。失败展示缺口、最近五轮均值、牌库大小与最少上盘的关键件，不指责玩家或伪称一次选择必然导致失败。

### 1.1 唯一入口与分册职责

本文是现行设计唯一入口；明确纳入 [GAME_IDENTITY.md](GAME_IDENTITY.md) 为**定位、故事与玩家语言分册**，不是平行权威。§1保留定位概要；分册唯一详细规定故事边界、玩家术语、内容说明模板与文案迁移验收；§3–9唯一详细规定规则、ID、效果与初版经济；§10规定功能/反馈布局，玩家词汇服从分册；§12–13保留工程顺序、历史验证及门禁。分册不复制或覆盖规则表。

### 1.2 范围与修订记录（2026-10-06）

**历史修订记录：当时定位、故事与玩家语言文档已修订，新手手册已重写；界面和内容数据文案尚未同步。** 该次修订仅更新背景、术语、表达规范和手册；不代表F0全GDD审批、规则变更、代码授权、实现验收或平衡通过。新工作名《雾港回收工坊》发行前仍需验证；原名《雾港余热局》保留于历史记录与未同步文件，不追溯改名。

本次保留§3–9、§12–13全部规则数值与ID，仅增技术/玩家词映射与历史范围标注。技术“配额/payment”对应“本期账单/本期应付”；“符号/symbol”对应“生产牌”；“池/pool”对应“生产牌库”；“持续道具/item”对应“本局升级”。旧规则表中的凭证、配额、交租不再是玩家目标词，不引入另一套货币、租赁或供能目标。

只读核实发现 `js/gdd1/contract.js` 的当前付款表已不同于§9初版表；本次不回写任何数值，不更新整份实现报告，也不把初版纸算当当前经济。规则/实现差异须另立复核任务。真人理解改善与发行名均待验证，不能宣称已通过或提高热度。

### 1.3 现行玩家外壳与视觉同步

现在欢迎/继续、六步教程、图鉴与完整详情、帮助/设置、局内构筑查看、结局和玩家语言已接入。已批准的A方向“雾港夜班”以原创本地SVG/PNG场景和96件彩色物件插画落地；布局、交互与视觉边界以 [VISUAL_SPEC.md](VISUAL_SPEC.md) 为准，操作说明见 [玩家手册](../PLAYER_GUIDE.md)。

技术定义中的规则描述保留，由独立玩家文案层提供可读说明。这轮不改规则、RNG、付款表、内容ID或存档格式，不回写§9初版经济数字；表现层验收不扩大旧机制独审范围，也不证明平衡、真人理解或审美认可。

## 2. 外部研究：事实、推断与取舍

实际执行了 `web_enable`、两批 `web_search`（提供者 openai）及 `fetch_content`。搜索结果可访问下列真实 URL；三款 Steam 产品页直接全文抓取失败，Monster Train 官网返回简短正文。因此以下只采用搜索可核实的公开高层机制，不声称完整阅读开发日志、亲玩四款游戏或获得其隐藏数值。检索不使用失败页面补造精确概率。

| 作品/来源 | 可核实事实 | 本项目设计推断及采用理由 | 不采用 |
|---|---|---|---|
| Luck be a Landlord — https://store.steampowered.com/app/1404850/ | 用老虎机与符号组合赚取租金的 roguelite 构筑，符号/道具存在相互作用 | 最贴近目标；直接采用“抽取池→选符号→交租”骨架，删除和跳过为概率工具 | 不套用它的租金表、全部内容与素材 |
| Removal Tokens 社区资料 — https://luck-be-a-landlord.fandom.com/wiki/Removal_Tokens | 删除券用于移除不想要的符号，产生空位 | 删除收益必须可见，显示抽中率变化；该条为社区资料，不作为官方精确投放表 | 不照搬来源所列特殊符号/精华 |
| Balatro — https://www.playstation.com/en-us/games/balatro/ ，https://store.steampowered.com/app/2379780/Balatro/ | 扑克启发的构筑，Joker 改变规则并产生计分协同，目标随 Blind 提高 | 将“基础值、加法、倍率、总额”分段演出；持续道具改变决策而非全是加百分比；明确可达的下一目标 | 不加扑克手牌、商店利息或 Boss 禁用规则，避免新系统负担 |
| Slay the Spire — https://store.steampowered.com/app/646570/Slay_the_Spire/ | 每局选牌塑造牌组，遗物能显著改变策略且存在取舍 | 奖励与当前池是否合适比稀有度重要；永久污染和自愿交易创造即时/长期权衡 | 不加入地图分叉、敌人意图或战斗资源 |
| Monster Train — https://www.themonstertrain.com/ ，https://www.themonstertrain.com/clans ，https://www.themonstertrain.com/dlc/the-last-divinity | 阵营组合、分层防守，卡牌升级与部分内容中的单位合成；官网介绍多阵营 | 用路线提供可读身份，再用 product/mist/fuel 等接口混搭；永久成长集中在实例，避免全池隐形膨胀 | 不加楼层、卡牌升级商店与合成 UI；借鉴“身份+跨体系”，不照搬战斗 |

结论是**更少系统、更强选择反馈**，不是四款游戏各塞一套功能。具体 64/32/8 和下文经济均为本项目设计推断，不归因于上述游戏。

## 3. 一局流程、状态与事务

### 3.1 新局

初始现金 0、刷新券 2、删除券 2、无道具，Normal 配额见 §9。初始 12 实例按下列顺序分配 UID（不是固定板位）：`mist_pouch×2、wick_bed×2、ash_felt×1、copper_burr×1、dock_chime×1、saline_ampoule×1、pressure_pouch×1、phase_chip×1、lean_receipt×1、spent_gasket×1`。12 件给早期空位收益空间；1 个明确垃圾教授删除，起始无消费者/倍率终核，避免预送完整路线。基础值之和 16，含低现金回执条件但不含其他协同的首轮为 20；实际邻接可再提高。

全部正式图鉴内容首局可获得；发现记录只影响展示，不改变候选概率。原型 20 件仅留兼容测试，不进入新局/普通候选/正式图鉴计数。

### 3.2 状态图

`MENU → READY → [RESOLVING] → SYMBOL_CHOICE(pending) → [SETTLE] → READY 或 [PAYMENT] → ITEM_CHOICE → [STAGE_SETUP] → EVENT_CHOICE(可选) → READY`。
最终付款：`PAYMENT → WON/LOST`。方括号为单命令内部原子过渡，不可存为半完成状态。

| 状态 | 可做 | 禁止/出口 |
|---|---|---|
| READY | Spin、查看构筑、删实例、配置借支、手动存档 | 不免费移动符号、不重抽盘面；Spin 只提交一次 |
| RESOLVING | UI 播放上一命令日志 | 逻辑同步完成，不能靠动画控制结算；错误整轮回滚 |
| SYMBOL_CHOICE | 选一/跳过、消耗刷新券、删除、查看完整账本 | cash 尚未入账，明确显示“现金 X + 待入账 Y”；禁止借支设置、再次 Spin |
| SETTLE/PAYMENT | choose/skip 的同一事务中先加 pending、清 pending，再查余轮/扣实际配额 | 非最终轮回 READY；到期无钱立即 LOST，不能领奖或借事件复活 |
| ITEM_CHOICE | 三选一持续道具，或明确“放弃奖励” | 无刷新、无删除；不再扣已支付配额；选择后原子配置下一阶段 |
| EVENT_CHOICE | 选事件方案、子目标、确认，或不参与 | 选择目标只在 UI 暂存；最终确认一次提交成本与所有收益；退出/重载仍保留本事件 |
| WON/LOST | 看账本/最终池、复制 seed、导出记录、重新开始、回菜单 | 不再生成候选、付款或道具；无无限模式 |

- **最后一次 Spin 仍有符号选择**；添加不立即产币。UI 明示“这个符号供下一阶段使用，不能补本期缺口”。失败玩家可以直接跳过并结算。最终第10期仍遵守同一顺序，不制造特殊刷钱窗口。
- choose 与 pending、付款、付款道具触发是同一事务。`cash'=max(0,cash+pending)`；负收益的原始额、实际现金变动与截断差分开记录。付款成功保留余额，不归零。
- ITEM_CHOICE 处于已支付的旧阶段；选择/放弃后：阶段+1、重置阶段窗口、赋新基础配额/Spin、发固定券、判定一次事件。事件所有“下阶段”指这个已准备的新阶段，不允许再次 stage+1。无事件直接 READY。
- 第10期不发第10个道具、不发进入不存在阶段的券或事件；付款道具仅写终局统计，不能阻挡 WON。全局最多9道具。
- revision 验证每个命令；快速双击、重复快捷键、失效目标、成本不足均不提交，不消耗 RNG。菜单“新局覆盖”须确认；继续恢复最后稳定决策点。

### 3.3 存档与随机

保存 schema/rules/content 版本、seed、全部 RNG 流、revision、stage/spin/余轮/实际配额、cash、pending、last账本、池UID/type/永久值/计数、道具及窗口、候选与其保底标记、下一UID、保留记录、事件/已出现集合/间隔、modifier到期和借支义务。

- 目标新版本 `rules=GDD1、content=GDD1、schema=2`（标识建议须在实现冻结时登记），不与当前0.3/M3-1混用。新规则另开新局，不声称旧seed得到相同结果。
- 新局派生 draw/effect/symbolOffer/itemOffer/event 五个独立 RNG 流；同seed+版本+难度+相同操作才复现。外观音效独立于逻辑RNG。存已生成候选与事件，读档不重抽；不承诺阻止玩家手工篡改本地文件。
- 每次成功命令后保存；先得到完整逻辑结果再播动画，动画中关闭恢复到 pending 候选。pending 必须等于已保存 last.total，不能重算。
- localStorage主档/上一有效备份；导入先验证、预渲染，单主key封套一次写入，失败不改内存或原主备档。一般自动保存两步并非绝对原子，应明示会话模式与备份恢复。
- 版本未知、未知UID/定义、非法金额/阶段、未来日志因果或未决档缺pending拒绝，保留原字节。file/HTTP、路径或浏览器不共享存储，提供≤1MiB JSON导入/导出。自动保存可关闭并警告。
- 旧0.3档不自动套新经济/新道具：提供只读旧局摘要与导出；若仍提供旧版本续玩须独立版本包。旧pending不得改算或标成GDD1。迁移不是静默“修坏档”。

## 4. 盘面、随机控制与统一结算

### 4.1 5×4 抽取

20格索引0–19，5列4排。每轮从池内无放回抽最多20个UID，再随机排列到20格（不足20也随机分布空位，**不把所有符号挤在左上角**）。空格不是实例，无标签与产出。池外实例不触发出现、成长或监听。默认八邻接、不跨行、不环绕；同排只有同一横排。

普通实例等权；道具修饰后每UID权重乘算并截在1/4–2，按剩余总权重逐次抽样无放回，抽中后移除，再独立洗匀未锁位置。抽样权重≠候选稀有度。少于20时全部上盘，权重不改变上盘率。

保留先占指定格、从抽样集合排除；全局最多2格、只持续紧接着的一轮。履行后立即消费记录；可被本轮新效果再次预约，但不能在履行前无限续期。优先级换轨灯→安瓿架→定位针，同来源按板位/UID；同目标不占第二格且不改原位置，满额无效并说明，不寻找额外目标补偿。死亡/转换/主动删除撤销预约；源离场不取消已合法预约。没有通用付费锁定按钮，锁位来自明确符号/道具，不让所有路线免费摆盘。

刷新：SYMBOL_CHOICE 每次1券，换整组三张，最多同一候选窗口3次；不改变本盘/pending。`choiceRefreshesUsed`为存档字段，范围0..3，只有玩家确认刷新成功时递增，skip、删除、候选生成失败、满池或道具放弃都不递增；新的自然候选窗口开始时重置为0，重载恢复该字段及已消费保底槽。池达到200仍生成候选并显示三槽：可skip、可先删除再选择，不能强制自动skip；若无合法新增实例，选择新符号被禁用但skip仍可用。允许再次看到上一组ID，不伪造“保证新牌”。删除：READY/SYMBOL_CHOICE 每实例1券，可删至0池但需确认空池风险；不退选卡、不触发consume/destroy，不抹去本轮已经确定的收益或借支义务。券上限各9，溢出丢弃且提示；不折现。固定投放见§9。

### 4.2 结算时序（新正式合同，不照搬偶然队列顺序）

1. **快照**：保存轮初现金/实际配额/本阶段余轮（扣本轮前）、抽盘、模板、原始类型标签/位置；建立临时cell、存活状态和效果身份。
2. **预处理临时标签**：事件modifier→符号按位置/效果序号单遍执行；后面的来源能看到前面的标签，不迭代到不动点。然后标签道具与织布使用真实tagAdded。只新增原定义没有的标签才记新增；无新增仍可有独立倍率部分。
3. **自然成长与额外年龄**：对本轮抽盘内每个仍有`age`的实例建立共享记录`maturedThisSpin=false`、`ageValid=true`、`modifierConsumed={calendar:false,event:false,stitcher:false}`。严格按**自然年龄→轮历→fog事件modifier→fog_stitcher**执行；每次成功的合法推进只消耗对应来源一次额度，达到成熟立即设`maturedThisSpin=true`并转换，新类型`age=0`且`epoch+1`，之后本轮所有年龄来源对该UID失效。转换保UID与永久值；只有新类型仍有age时才保留future fog剩余次数，若定义无age则`ageValid=false`且未来年龄来源无效，不在本轮重开出现效果。轮历与fog事件均只从`ageValid=true && !maturedThisSpin`的起始plant中选目标；fog_stitcher同样遵守该字段。自然成熟不会把已用自然推进返还，也不会因后续死亡重选。
4. **出现、数值与风险**：进入本步骤时建立一次“出现条件快照”：读取步骤2临时标签与步骤3年龄转换之后的存活盘、类型、位置和空格；轮初现金/配额/余轮仍读步骤1。所有未另标窗口的普通符号条件（包括自身加值、同排/邻接计数和条件倍率）统一读此快照，判定一次，不读后续结构结果。仅起始仍同epoch的源执行出现平面加值、条件、周期/自增压力、借支、copy；本轮转换得到的新类型不补执行出现能力。条件倍率在此选定快照中的合法目标并记入倍率累加器，步骤9才结算金额；不是推迟到步骤8重新选目标或重新判条件。风险失败保护先符号薄衬、再披布、再挡板的生成替代。copy读取步骤1合法目标的常数模板，不复制运行后add。
5. **邻接与结构**：先执行`adjacency-add`子阶段，再执行转换/消耗/主动销毁等`structural-event`；同一`adjacency-add`子阶段按源位置→UID→效果定义序号。`cargo_rope`与`pitch_fork`都在此子阶段进入时锁定各自的第一个合法邻接目标；目标随后死亡、转换或失效时不补选、不回写加值。派生成功事件排在父动作后立即有界排空，再进行下一根；结构动作的目标在动作执行时重新筛选，默认第一个合法目标、默认1个，只有“每个/全盘”才多目标。
6. **轮末结构**：灰温毡成熟自毁、其死亡许可监听、所有成功事件的成长/奖励/生成排空。普通死亡源之后不再响应；已合法施加给别人的数值不倒扣。
7. **压力检查点**：结构/注压全部结束→塔挑未达到自身释放阈值且有≥3压的实例→扣压+倍率原子提交并标本轮已释放→剩余达阈值者各释放一次归零。轮末后不允许新增结构回跳；道具只可奖励/修饰，不启动新结构链。
8. **末期汇总与明确的轮末倍率**：只执行明示“轮末汇总（步骤8）”的条件：货运返程池数、培育转换次数、废热消费异类、清池契约，以及§6.1明确在最终盘判定的道具。读取本步骤入口的最终存活盘/有效池与本轮成功事件记录。普通出现条件（包括条件倍率）不在此重判；“存活”是目标合法性要求，不独自表示轮末窗口。预约请求在此统一按来源优先级接受。
9. **账本**：存活且未抑制者逐格 `floor((当前基础+永久值+临时加值)×全部有理倍率)`，负数也向负无穷取整。独立奖励直接相加、不吃任何倍率；死亡格与脉冲釜普通产出为0。结果写pending，不改cash。所有计数/池/RNG/候选同时原子提交。

### 4.3 冲突、成长、死亡及归因

- 目标只成功消费/销毁一次；失败不发钱、不成长、不生成成功事件。consume 产生一次consume和一次cause=consume的destroy；“非消耗销毁”只认destroy/self_mature，不认主动删除/事件操作。
- 目标被消耗后没有普通产出。琥露扇叶自己的+4是死亡目标独立奖励，不归消费者；灰温毡只有自己被耗才生毛刺，旁观毡不响应。deep_still只认自己消耗mist，潮棱只认自己转换成功。
- 转换保UID与通用永久值、清类型计数和预约、更新基础与原生标签；保已加临时数值/倍率与获标历史，但不保旧临时标签本体；不重触发出现。epoch失效旧队列，禁止本轮回到访问过的类型。
- 永久成长即时影响本轮，软上限30；按实际增量发一次growth。已30无成长事件。加值/独立奖励不伪装永久成长；印板不再发成长，避免递归。
- 每源/效果/目标倍率每轮一次，同一定义效果对同目标最多两个来源；不同定义可相乘。标签倍率失败不撤销标签；塔倍率资格失败不扣压。普通数值加法不套用“两来源倍率”限制。
- 生成每源本轮合计≤1，同一effectKey全盘≤2。道具ID视为独立来源。仅成功创建计预算；下轮才可抽，不补空格。池200时可选生成失败而已完成消费/借支/风险不回滚；无新UID、不产生虚假生成事件。
- 支援的压力目标必须有真正pressure计数机制，不是任意带pressure标签者；无计数机制的温灯荚/路由器不能吞掉无用压力。允许注给本身有计数机制的源，但通常路由器无此机制。
- 源死亡默认取消尚未执行动作/监听，只有明确“自身被消耗”的扇叶/毡及毡自毁奖励允许死亡快照。事件保存source/target UID、位置、前后type、标签、cause、实际成长等，不从当前池倒猜。
- 金额/池是安全限制，不是正常玩法上限：池200；每轮真实生成≤40、动作≤5000、深度≤32、每源每定义硬预算64；每格/独立奖励/净额/现金绝对值≤1e9。硬异常整轮回滚，保留seed/输入与可导出错误，不能部分发钱后继续。软限额只跳过该效果并写原因。
- 贡献账本：基础与永久产出归自身；加值归来源；倍率按稳定应用顺序记录边际差额，舍入差归最后改变该格金额的来源；死亡目标普通部分归零、消费奖励归消费者、扇叶奖励归扇叶、道具收益归itemId。总贡献严格等于净收益；现金截断/付款单列。间接供料作为“助攻”计数，不再次算钱。

## 5. 完整64符号规格

下表采用既有ID与中文名称；标签是定义的一部分。common/uncommon/rare/epic=普通/精良/稀有/史诗。统一默认：普通符号条件（加值与倍率相同）在步骤4的出现条件快照判定一次；表内标“出现快照（步骤4）”即采用该默认。只有明确标“轮末汇总（步骤8）”才读最终存活盘/有效池。生命周期监听在对应成功事件发生时判定，年龄/临时标签/压力等按其指定步骤执行，不套普通条件默认；“本轮”或“存活”两个词本身不改变窗口。所有金额的玩家名为现金（纯虚拟）；“凭证”仅保留为旧技术/历史词，所有“每轮”指本实例上盘的一轮。

符号默认来源上盘且存活、效果各每轮一次，显式2次者例外；独立奖励不吃倍率；普通候选排除两件垃圾。表格说明优先于旧kind映射与历史测试注释。以下64行完整定义，不要求实现者再拼接旧矩阵脚注。

玩家标签中文名与旧风味副名统一维护于 [定位与玩家语言分册 §3](GAME_IDENTITY.md)，本节不再另设一份显示名称字典。以下表格的英文tag仍是技术筛选标识，不变更其语义：scrap不等于junk；pressure标签不自动授予蓄压机制；多标签实例仍只算一个实例，type去重按定义ID。池标签只读原定义，临时标签仅影响当轮盘面。

### 5.A 雾露培育（8）

| id | 中文名 | rarity | tags | 基础值 | 清晰效果与原语 | 启动/回报角色 |
|---|---|---|---|---:|---|---|
| mist_pouch | 凝雾软囊 | common | plant,mist | 1 | 第 3 次上盘转换为 dew_lantern；成长由 age 表达 | common 入口，稳定等待 |
| wick_bed | 灯芯苗床 | common | plant,fuel | 2 | 无附加效果；既能直接产出也可被热料消费者消耗 | 基础生产者、过渡供给 |
| dew_lantern | 露灯苞 | uncommon | plant,mist,product | 3 | 第 2 次上盘转换为 amber_frond；普通候选可直接获得 | 中段成长件 |
| amber_frond | 琥露扇叶 | uncommon | plant,fuel,product,cargo | 4 | 自身被消耗时发独立奖励 4；与消费者奖励不同来源 | 成熟回报、货运成品 |
| fog_stitcher | 补雾工 | uncommon | machine,support | 1 | 每轮给一个邻接 plant 的 age 额外推进 1 步；无 age 的成品无效；本轮最多 1 | 可替代成长核心 |
| root_ledger | 根须账簿 | rare | plant,contract | 1 | 全盘每次 plant 成功转换，自身永久 +1；每轮最多 2，永久上限 30 | 长期回报核心 |
| warm_pod | 温灯荚 | common | plant,pressure | 1 | **出现快照（步骤4）**：若自身邻接至少一个起始存活 fuel，自身 +3，否则基础值 | common 快速条件回报 |
| nursery_gauge | 苗圃指针 | rare | machine,plant | 2 | 本轮至少 2 个 plant 成功转换时，全盘存活 plant ×3/2；每轮一次 | 成型放大，非必需核心 |

### 5.B 废热回收（8）

| id | 中文名 | rarity | tags | 基础值 | 清晰效果与原语 | 启动/回报角色 |
|---|---|---|---|---:|---|---|
| ash_felt | 灰温毡 | common | scrap,fuel | 1 | 被消耗时生成一枚 copper_burr；若累计上盘 3 次且结束时仍存活，原子自毁并发独立奖励 3，不产普通收入；两分支互斥 | common 链式输入 |
| sorting_tong | 分温夹 | common | machine | 1 | 消耗一个邻接 scrap，独立奖励 6；无目标不发独立奖励，仅基础1 | common 回收核心 |
| copper_burr | 铜毛刺 | common | scrap,product,cargo | 2 | 邻接任意 machine 时自身 +2 | 次级原料与过渡成品 |
| spent_gasket | 过役垫圈 | common | scrap,junk | -1 | 无附加效果；禁正常候选，由高收益装置或事件生成 | 明确污染/回收输入 |
| sieve_drum | 除滞滚筒 | uncommon | machine,support | 2 | 转换一个邻接 junk 为 copper_burr；每轮一次；不是删除 | 可替代无消耗核心 |
| heat_clerk | 余温录员 | uncommon | machine,contract | 1 | 全盘发生 scrap 消耗时自身永久 +1，每轮最多 1，上限 30 | 回收长期回报 |
| clinker_router | 灰渣分路器 | rare | machine,pressure | 2 | 每轮销毁一个邻接 junk，无消费奖励；监听全盘非消耗销毁 junk，给一个存活且具有蓄压计数机制的 pressure 蓄压 +2（不得超过该实例上限）；自身上盘监听，每轮最多 2 | 废物转蓄压接口 |
| furnace_auditor | 炉账稽核灯 | rare | machine | 2 | 全盘本轮成功消耗至少 2 个不同 type 的 scrap 时，给每个存活 machine ×3/2，一次 | 多原料回报，避免只堆同件 |

### 5.C 鸣片共振（8）

| id | 中文名 | rarity | tags | 基础值 | 清晰效果与原语 | 启动/回报角色 |
|---|---|---|---|---:|---|---|
| dock_chime | 栈桥鸣片 | common | resonance,cargo | 2 | **出现快照（步骤4）**：自身 + 同排其他起始存活 resonance 的不同 type 数，最多 +3；后续死亡不重算 | common 入口/异类频率 |
| pitch_fork | 港音分叉 | common | resonance,support | 1 | 给一个邻接 resonance +3，排除自己 | common 邻接支援 |
| fog_reed | 雾笛簧 | common | resonance,mist | 1 | **出现快照（步骤4）**：若自身邻接至少一个起始存活 mist，自身 +3；后续目标被消费不撤销 | 培育/蒸馏桥接 |
| beat_spool | 拍点线轴 | uncommon | resonance,machine | 1 | 自身第 3 次上盘额外 +9 并重置拍点计数为 0；周期按上盘 | 周期性过渡收入 |
| chord_frame | 和音框 | uncommon | resonance,machine | 2 | **出现快照（步骤4）**：若自身邻接至少两种其他起始存活 resonance type，按稳定顺序给一个合法邻居 ×2；后续死亡不补选 | 可替代倍率核心 |
| prism_hum | 晶腔哼鸣器 | uncommon | resonance,crystal | 2 | **出现快照（步骤4）**：若自身邻接至少一个起始存活 crystal，自身 +4；本轮若由转换获得不执行出现效果 | 蒸馏连接、稳定回报 |
| silence_keeper | 静拍保管员 | rare | resonance,contract | 1 | **出现快照（步骤4）**：若所在排起始存活 resonance 恰有1个（含自身），自身 +10；后续死亡不使其重判 | 稀疏路线替代核心 |
| harbor_conductor | 港湾拍长 | epic | resonance | 2 | 所在排至少 3 个不同 resonance type 时，该排 resonance ×2；本轮一次，不叠自身第二份 | 密集同排回报，非启动要求 |

### 5.D 盐晶蒸馏（8）

| id | 中文名 | rarity | tags | 基础值 | 清晰效果与原语 | 启动/回报角色 |
|---|---|---|---|---:|---|---|
| brine_strip | 盐雾滤带 | common | mist,feedstock | 1 | 第 2 次上盘转换为 saline_ampoule | common 原液入口 |
| saline_ampoule | 微盐安瓿 | common | feedstock,cargo | 2 | 无额外效果；可直接产出或作为转换前体 | common 前体/过渡 |
| condense_coil | 凝潮盘管 | common | machine | 1 | 转换一个邻接 feedstock 为 tide_prism，每轮一次 | common 转换核心 |
| tide_prism | 潮棱块 | uncommon | crystal,product,cargo | 4 | 自身转换成为本类型时，自身本轮 +3；直接抽中只产基础 | 多用途成品回报 |
| deep_still | 深盐分馏器 | uncommon | machine | 2 | 消耗一个邻接 mist，独立奖励 4，并在池生成 saline_ampoule；生成失败不影响已成功消耗但须记录 | 可替代供料核心 |
| crystal_index | 晶层索引 | uncommon | crystal,support | 1 | 若全盘 crystal 有至少 2 种 type，自身 +6 | 混型中期回报 |
| pearl_separator | 浮珠分离器 | rare | machine | 2 | 转换一个邻接 crystal 且非 product 的实例为 tide_prism；目标已是 tide_prism 不合法 | 异谱材料精炼接口 |
| reserve_facet | 留温晶面 | rare | crystal,pressure | 2 | 消耗一个邻接 fuel，自身蓄压 +2（上限 6），独立奖励 2；蓄压达 6 时本轮压力检查点发独立奖励 18 并归零 | 延迟回报、蓄压过渡 |

### 5.E 夜班货运（8）

| id | 中文名 | rarity | tags | 基础值 | 清晰效果与原语 | 启动/回报角色 |
|---|---|---|---|---:|---|---|
| cargo_rope | 夜班扎绳 | common | cargo,support | 1 | **邻接加值（步骤5 adjacency-add）**：进入该子阶段时锁定一个邻接 product +3；目标随后死亡不补选 | common 多体系入口 |
| route_stub | 转栈短票 | common | cargo,contract | 2 | **出现快照（步骤4）**：若全盘起始存活 cargo 至少3种 type，自身 +4；本轮后续生成/转换不补触发 | common 异类回报 |
| parcel_cage | 铜格货笼 | common | cargo,machine | 2 | **出现快照（步骤4）**：若本轮抽盘空格至少4，自身 +3；空格按步骤1盘面快照计，池大小不替代空格 | 精简池过渡 |
| sorting_runner | 分栈跑员 | uncommon | cargo | 1 | 消耗一个邻接 product，独立奖励为 6 + 目标基础值（不含永久/倍率） | 可替代兑现核心 |
| manifest_desk | 夜单台 | uncommon | cargo,contract | 2 | **出现快照（步骤4）**：若全盘起始存活 cargo 至少4种 type，自身 ×3；本轮后续新增/死亡不重判 | 混搭构筑核心 |
| switch_lamp | 换轨灯 | uncommon | cargo,machine | 1 | 下一轮保留一个邻接 product 在原格；每轮一次；全局保留上限 2，已保留不延长 | 概率控制核心 |
| transit_seal | 联运封蜡 | rare | cargo,magic | 2 | 自身预处理临时获得 plant/crystal/resonance 中一个：选择其邻居含量最多者，同数按此序；当轮结束消失 | 跨体系通配，不改变池标签 |
| return_station | 空箱返程站 | rare | cargo,machine | 2 | 本轮邻接 cargo 源成功消耗 product 后，结束时若池不超过 20，发独立奖励 8；每轮一次 | 需其他消费者的精简回报 |

注：return_station 本身不消耗，需邻接其他 cargo 消费者配合，不能自行兑现。

### 5.F 压力蓄能（8）

| id | 中文名 | rarity | tags | 基础值 | 清晰效果与原语 | 启动/回报角色 |
|---|---|---|---|---:|---|---|
| pressure_pouch | 余压软袋 | common | pressure | 1 | 每次上盘蓄压 +1，上限 4；达到 4 时独立 reward10（不吃倍率）并归零，普通产出仍为1 | common 延迟回报入口 |
| feed_valve | 添温小阀 | common | machine,pressure | 1 | 消耗一个邻接 fuel，独立奖励 3，自身蓄压 +2，上限 6；达 6 时独立奖励 14 并归零 | common 蓄压核心 |
| pause_dial | 歇拍刻盘 | common | pressure,support | 2 | **出现快照（步骤4）**：自身固定平面 +1（可复制）；若邻接起始存活且带`pressure`标签的实例，另 +2（不可复制）；后续目标死亡不撤销 | 稳定过渡 |
| surge_vessel | 脉冲釜 | uncommon | pressure,machine | 1 | 每次上盘先蓄压 +1；未达 3 时普通产出归零；达 3 时独立奖励 16 并归零，普通产出仍 0 | 可替代纯时间核心 |
| cracked_regulator | 裂缝调压器 | uncommon | pressure,machine | 2 | 每次上盘用本局 RNG：3/4 自身 +8；1/4 自身 -6 且池生成 spent_gasket；每轮一次 | 高收益污染风险 |
| safety_shim | 卸压薄衬 | uncommon | pressure,support | 1 | 本轮首次邻接 pressure 风险判定的失败损失减少 4（最多减到 0）；不改变失败/生成事实 | 风险过渡、非全免 |
| release_spire | 泄峰塔 | rare | pressure,machine | 3 | 对一个邻接蓄压至少 3 的实例，扣 3 蓄压，使其本轮 ×3，并发独立奖励8；只在该目标具有蓄压机制、尚未达到自身释放阈值且本轮未释放时合法 | 资源型倍率回报 |
| demand_coupler | 配额耦合器 | rare | pressure,contract | 1 | 轮初现金低于本阶段配额且剩余运行不超过 2 时，自身 ×4，同时本轮在池生成 spent_gasket；每轮一次 | 临期抢救，未来污染 |

### 5.G 异相映印（8）

| id | 中文名 | rarity | tags | 基础值 | 清晰效果与原语 | 启动/回报角色 |
|---|---|---|---|---:|---|---|
| phase_chip | 偏相小片 | common | magic | 2 | 预处理：有邻接 resonance 时临时加 resonance；否则邻接 crystal 时临时加 crystal；否则不变 | common 通配入口 |
| spectrum_pin | 谱别别针 | common | magic,support | 1 | **出现快照（步骤4）**：若邻接至少3种其他起始存活 type，自身 +4；不计自身、不因后续死亡补算 | common 异类过渡 |
| cloudy_negative | 雾面底片 | common | magic,feedstock | 1 | 第 3 次上盘转换为 blank_facet | common 映印/蒸馏原料 |
| blank_facet | 无谱晶坯 | uncommon | magic,crystal | 3 | ON_APPEAR 平面 +2（可复制）；非 product，可交浮珠分离器精炼；转换获得不触发出现 | 简明跨路线产物 |
| offset_reader | 偏印读头 | rare | magic,machine | 3 | 选一个邻接实例，复制其显式 copyable 的 ON_APPEAR 平面 add 常数，最多 +8；不复制条件、事件或其他动作 | 数值复制核心 |
| alignment_cloth | 对相织布 | uncommon | magic,support | 1 | 给一个邻接本轮获得临时标签的实例 +5，每轮一次；按 tagAdded 日志而非最终标签猜测 | 通配核心替代，不靠稀有复制 |
| echo_plate | 迟相印板 | rare | magic,resonance | 1 | 一个邻接实例本轮永久值成功增加时，自身 + 该次实际增加值×4，每轮最多 2 次；不再产生 ON_GROW | 永久成长跨体系回报 |
| split_register | 双谱登记器 | epic | magic,contract | 2 | 预处理给一个邻接 product 临时增加 resonance 和 crystal；它本轮普通产出 ×3/2；一次，不影响池标签 | 双接口回报，无递归复制 |

复制白名单（本版本）：`cleared_stub` 的 ON_APPEAR 平面 +1 是第三项显式可复制模板；前两项保持：`spectrum_pin` 的条件成功加值不在白名单；为给复制提供真实输入，`blank_facet` 增加 ON_APPEAR add +2、`pause_dial` 增加 ON_APPEAR add +1，均标记 copyable:true。三者其余条件不复制。前两项基础值仍是表内 3/2，cleared_stub 基础值3。实现必须将三项写进效果数组，不能让说明和数据各一套。其余效果全部 copyable:false。

### 5.H 契约套利（8）

| id | 中文名 | rarity | tags | 基础值 | 清晰效果与原语 | 启动/回报角色 |
|---|---|---|---|---:|---|---|
| arrears_slip | 待核欠条 | common | contract,junk | -1 | 无额外效果；禁正常候选；可被合规台转换或撤账员消耗 | 有用途的污染，不是假奖励 |
| lean_receipt | 薄账回执 | common | contract | 1 | 轮初现金低于本阶段配额的 1/2 时自身 +4，否则基础值 | common 低谷入口 |
| compliance_desk | 合规小台 | common | contract,machine | 1 | 转换一个邻接 junk 为 cleared_stub，每轮一次 | common 减负核心 |
| cleared_stub | 核清存根 | common | contract,product,cargo | 3 | 本轮若非由转换获得、自身 +1；转换轮不加；ON_APPEAR add +1 可复制 | 垃圾转换回报/货运供货 |
| cancellation_clerk | 撤账员 | uncommon | contract | 1 | 消耗一个邻接 junk，独立奖励 5；自身永久 +1，上限 30；成功才成长 | 可替代压缩池核心 |
| quota_margin | 配额边签 | uncommon | contract,pressure | 2 | 若本轮初现金不足配额且只差不超过 15，自身 +6；不得读本轮中途收益 | 支付前过渡 |
| advance_stamp | 先支邮戳 | rare | contract | 2 | 每阶段自身首次上盘额外独立奖励 18，同时本阶段配额 +12 并尝试生成 arrears_slip（可选生成失败仍保留奖励与义务）；可选接受/拒绝在运行前配置，默认拒绝 | 透明借支风险核心 |
| settlement_beacon | 清算信标 | rare | contract,machine | 2 | 若本轮池内 junk 为 0 且存活 contract 至少 3 种 type，本轮 contract ×2；每轮一次 | 清池后的构筑回报 |

`advance_stamp` 的接受是 READY 时的持久设置，运行中不弹窗；不允许结算后看结果才接受。拒绝时只有基础值且不消耗领取资格，之后READY改为接受，可在本阶段下一次上盘领取；接受时每UID/阶段只领一次。删除/转换邮戳不撤销已加的配额义务，关闭设置也不退款；进入新阶段重置领取记录但保留玩家设置。完整版本必须实现后进入候选；纵切片按§12另行限制。


本版本强度调整理由：读头基础3避免稀有件在窄白名单环境中反而弱于输入件；泄峰塔独立8使花3压力不总是劣于等自释放；先支邮戳义务从8提高到12，净借支优势从10降到6，再付污染成本。分温夹不额外发无目标1，避免“保底”被理解成基础1之外再次奖励。以上是新版本迁移，不改旧手算证据。

### 5.I 时点逐项核对与冲突裁定

为避免“本轮/存活”被误读成轮末，以下是本表指定条件的最终合同：

| 定义 | 判定时点 | 纸面边界 |
|---|---|---|
| `warm_pod` | 出现快照（步骤4） | 起始相邻fuel后来被consume，仍保留+3；起始无fuel、步骤5才生成fuel，不补+3 |
| `dock_chime` | 出现快照（步骤4） | 同排3种其他resonance给+3；其中一件步骤5死亡，不撤销+3、不重新计数 |
| `fog_reed` | 出现快照（步骤4） | 起始邻mist被步骤5消费，仍保留自身+3；步骤5才转换出的mist不触发 |
| `chord_frame` | 出现快照（步骤4） | 起始两种其他resonance满足后锁定一个位置优先邻居×2；首目标随后死亡不转给第二目标 |
| `prism_hum` | 出现快照（步骤4） | 起始邻crystal满足则+4；feedstock在步骤5转crystal不会回头触发本件 |
| `silence_keeper` | 出现快照（步骤4） | 起始所在排仅自身一个resonance得+10；另一鸣片步骤5被销毁也不把已不满足的密集排改算 |
| `route_stub` | 出现快照（步骤4） | 起始cargo有3种type得+4；步骤5生成第四种不补+4 |
| `parcel_cage` | 出现快照（步骤4，以步骤1空格） | 抽盘16个实例/4空格触发；池里只有16件但抽盘20满格不触发；生成后空位变化不重判 |
| `manifest_desk` | 出现快照（步骤4） | 起始cargo四种type×3；步骤5死亡一件不撤销，起始三种且步骤5生成第四种不触发 |
| `pause_dial` | 出现快照（步骤4） | 起始邻接带`pressure`标签的实例即可加不可复制+2；这是一条普通标签加值，不要求目标具有蓄压计数机制。步骤5注入压力不追溯 |
| `spectrum_pin` | 出现快照（步骤4） | 起始邻接三种其他type+4；重复type只算一次，步骤5转换成第三type不补+4 |
| `cargo_rope` | 出现快照（步骤4） | 位置优先给一个起始邻product+3；第二product不因首目标死亡补选 |
| `transit_seal` / `phase_chip` / `split_register` | 预处理（步骤2） | 临时标签先于步骤4条件；不改变池标签，轮末不再重新选择 |
| `furnace_auditor` / `nursery_gauge` / `settlement_beacon` | 分别为轮末事件汇总、轮末转换计数、轮末清池条件 | 只有表内明示的成功事件/最终池/最终存活盘才读步骤8；不按普通出现默认处理 |

因此统一裁定：**普通条件=步骤4出现快照；末期汇总=只有明确写“轮末汇总/结束时/压力检查点”才步骤8；成功生命周期事件在事件发生时。** 表格若未写窗口，遵循普通条件默认，不允许实现者自行改成动态重算。

`cargo_rope`、`pitch_fork`与其他邻接数值效果属于步骤5的`adjacency-add`，不属于步骤4普通出现快照；`alignment_cloth`属于步骤2预处理完成后的`tagAdded`即时子阶段：只读取该次预处理真实追加的记录，按记录顺序锁定第一个合法邻接目标，后续死亡不补选。所有64个符号、32个道具、8个事件必须按下列登记执行；未列为appearance-snapshot的效果不得套用普通条件默认。

#### 5.I.1 完整 phase 登记

本索引按**效果**登记，不替代表 5.A–5.H 的正文；同一 ID 可在多个阶段出现，不能用索引删去或合并正文效果。阶段名固定为：`step1/draw`（抽盘权重与初始资格）、`step2/tagAdded`（预处理产生真实新增标签后立即记录；后续对齐效果读取 BODY 的 tagAdded 值）、`step3/age`（自然年龄与年龄修饰）、`step4/appearance`（出现快照、普通条件、复制与风险）、`step4/pressure-injection`（步骤4实际压力注入）、`step5/adjacency-add`（邻接加值）、`step5/structural-event`（消费、转换、销毁等结构动作；不属于 add）、`step6/pressure-injection`（步骤6实际压力注入）、`step7/pressure`（释放检查）、`step8/end-summary`（轮末盘面或有效池汇总）、`step9/ledger`（账本提交）、`choice/commit`（候选、道具、事件、付款等稳定事务提交）。任何父效果成功后，其生命周期回调立即在该父效果成功之后有界执行，无论父效果发生在步骤3、步骤5、步骤6或其他登记阶段；不得延迟到步骤6统一执行。

**64 个符号的效果登记**

- `step2/tagAdded`：`phase_chip`、`transit_seal`、`split_register` 的预处理登记；`alignment_cloth` 紧随预处理读取 BODY 的真实 `tagAdded` 值，按记录顺序锁定目标并立即执行。
- `step3/age`：`mist_pouch`、`dew_lantern`、`brine_strip`、`cloudy_negative`、`fog_stitcher`。前四个是年龄推进或成熟转换；`fog_stitcher` 是额外年龄推进。
- `step4/appearance`：`wick_bed`、`warm_pod`、`dock_chime`、`fog_reed`、`beat_spool`、`chord_frame`、`prism_hum`、`silence_keeper`、`saline_ampoule`、`crystal_index`、`route_stub`、`parcel_cage`、`manifest_desk`、`pause_dial`、`demand_coupler`、`spectrum_pin`、`blank_facet`、`arrears_slip`、`lean_receipt`、`cleared_stub`、`quota_margin`、`harbor_conductor`、`copper_burr`。这些自身条件均在步骤4判定，不登记为邻接加值。
- `step4/pressure-injection`：`pressure_pouch`、`surge_vessel`。步骤4的实际注压在发生时立即完成；其余压力释放登记见步骤7。
- `step4/risk`：`cracked_regulator`、`safety_shim`。风险事实、失败结果和污染结果在此确定；保护效果只减少合法损失，不取消风险。`item_insulation_shawl`、`item_spare_baffle` 的风险回调在失败/生成成功后立即提交。
- `step4/copy`：`offset_reader`。它只读取步骤1快照中的合法 copyable 模板，复制在步骤4完成；`advance_stamp` 的接受资格与自身普通条件也在步骤4快照确定。
- `step5/adjacency-add`：`pitch_fork`、`cargo_rope`。二者在步骤5进入时按位置、UID、效果序锁定第一个合法邻接目标；目标随后失效不补选。
- `step5/structural-event`：`sorting_tong`、`sieve_drum`、`clinker_router`、`condense_coil`、`deep_still`、`pearl_separator`、`sorting_runner`、`reserve_facet`、`feed_valve`、`compliance_desk`、`cancellation_clerk`。这些效果执行消费、转换或销毁，不能登记为普通 add；成功后的生命周期回调立即紧随父动作执行，压力增加也按实际发生立即登记；不得延迟到步骤6。`reserve_facet` 的结构性注压与释放阶段、`feed_valve` 对邻接 pressure 的结构性注压均按 BODY 状态登记。
- `step6/lifecycle`：`ash_felt`、`amber_frond`、`root_ledger`、`heat_clerk`、`clinker_router`、`tide_prism`、`echo_plate`。这些是父成功后的立即回调登记：随父成功事件紧接执行，不代表统一延迟到步骤6；`clinker_router` 的非消耗销毁监听也在对应销毁成功后立即执行，`tide_prism` 只在成功转换成为该类型时触发。
- `step6/pressure-injection`：`reserve_facet`。其结构性实际注压在父结构成功后立即登记；释放阶段按 BODY 的 `step7/pressure-release` 状态登记。
- `step7/pressure`：`pressure_pouch`、`surge_vessel`、`reserve_facet`、`release_spire`。`pressure_pouch` 与 `surge_vessel` 的实际注压在步骤4，`reserve_facet` 的结构性注压在父成功后立即发生并在步骤7释放检查，`release_spire` 只在步骤7扣压并施加倍率。
- `step8/end-summary`：`nursery_gauge`、`furnace_auditor`、`switch_lamp`、`return_station`、`settlement_beacon`。`return_station` 的消费成功记录在对应父成功后的立即回调，池不超过20的奖励只在步骤8提交。
- `base-only`：`spent_gasket`。它没有额外效果，仍属于完整正式 ID 集合。

**32 个道具的三段登记**

每项都写成 `activationPhase → targetSelectionPhase → commitPhase`；三段分别表示开始监听、选择合法目标或资格、提交效果额度。阶段窗口按 §6 正文重置。

- `item_dew_calendar`：`step3/age → step3/age → step3/age`；自然年龄结束后选第一个起始、存活、未成熟且仍有 age 的 plant，成功推进一次并消耗本轮额度。
- `item_root_wrap`：`step3/age → step3/age → step3/age`；监听任何阶段（包括步骤3、步骤5等）plant 成功转换后的仍存活实例，转换成功后立即提交本轮 +4；不要求 product。
- `item_nursery_scale`：`step1/draw → step1/draw → step1/draw`；选有效池内 plant UID，抽盘前提交 ×3/2 权重。
- `item_frost_glass`：`step4/appearance → step4/appearance → step9/ledger`；按板位、UID选本阶段前两个起始 mist，分别提交每个 +3。
- `item_sorting_apron`：`step5/structural-event → step5/structural-event → step6/lifecycle`；选本轮首次成功消费的 scrap，提交独立奖励 +3。
- `item_waste_log`：`step6/lifecycle → step6/lifecycle → choice/commit`；只计本阶段非消耗销毁 junk 的成功事件，第三次提交删除券 +1，阶段内一次。
- `item_offcut_chute`：`step5/structural-event → step5/structural-event → step5/structural-event`；选本轮首次成功消费且目标不是 junk 的 scrap，提交生成 ash_felt；新实例留在池中，下轮才可出现。
- `item_clean_mesh`：`step1/draw → step1/draw → step1/draw`；选有效池内 junk UID，抽盘前提交 ×1/2 权重。
- `item_lane_clapper`：`step8/end-summary → step8/end-summary → step9/ledger`；选每排第一个 resonance 且该排至少两种 resonance type 的实例，提交 +2。
- `item_rest_notch`：`step8/end-summary → step8/end-summary → step9/ledger`；选恰有一个 resonance 的排，提交该实例 ×3/2。
- `item_pitch_marker`：`step2/tagAdded → step2/tagAdded → step8/end-summary`；选本轮第一个成功新增 resonance 临时标签且仍存活的实例，末期提交 +5。
- `item_shared_metronome`：`step1/draw → step1/draw → step1/draw`；在 Spin 初始化时设置 cycle 阈值 3→2，当前计数不追溯触发；相同机制键 `cycle_count` 的后续符号也可用。
- `item_brine_lining`：`step5/structural-event → step5/structural-event → step9/ledger`；选本轮首次 feedstock→crystal 的成功转换产物，提交 +4。
- `item_fraction_gauge`：`step1/draw → step1/draw → step1/draw`；步骤1检查初始资格，此后每次 board/type/tag/liveness 变化立即检查；仅当前资格与本轮 quota/reservation 均可用时预占并提交独立奖励7，失败回滚不消耗额度、不保留预占。
- `item_jar_rack`：`step5/structural-event → step5/structural-event → step8/end-summary`；选本轮首次转换得到的 crystal UID，末期提交下一轮原格预约。
- `item_residue_stamp`：`step5/structural-event → step5/structural-event → step6/lifecycle`；选本轮首次成功消费的 mist，提交独立奖励 +2。
- `item_manifest_clip`：`step8/end-summary → step8/end-summary → step9/ledger`；选末期有效盘中 cargo type 达到4种的资格，提交独立奖励6。
- `item_return_track`：`choice/commit → choice/commit → choice/commit`；选本阶段第1次和第3次主动跳过，分别提交刷新券 +1，阶段内最多两次。
- `item_small_hold`：`step8/end-summary → step8/end-summary → step9/ledger`；选末期有效池数量12–20的资格，提交独立奖励5。
- `item_exchange_hook`：`step5/structural-event → step5/structural-event → choice/commit`；选本阶段首次成功消费 product，提交下一次自然候选的 common product 保底。
- `item_pressure_index`：`step4/pressure-injection → step5/structural-event → step6/pressure-injection`；每个实际 pressure 增加事件立即检查本轮额度，首个合法事件对同一事件目标额外 +1（不超过目标上限），附加增加不递归触发；覆盖步骤4–6，不延迟到步骤7。
- `item_insulation_shawl`：`step4/risk → step4/risk → step4/risk`；选本轮首次 pressure risk 失败，提交负加值减少3且最低为0。
- `item_release_receipt`：`step7/pressure → step7/pressure → step7/pressure`；选本阶段第三次成功压力释放，提交独立奖励12，阶段内一次。
- `item_spare_baffle`：`step4/risk → step4/risk → step4/risk`；选本轮首次 risk 产生 junk，提交生成替代为源本轮 -3；生成事实保留且不触发消费/销毁奖励。
- `item_safe_carbon`：`step4/copy → step4/copy → step9/ledger`；选本轮首次成功合法 copy，提交实际加值 +2且总加值不超过8。
- `item_spectrum_book`：`step2/tagAdded → step2/tagAdded → step8/end-summary`；选本轮首次新增原定义没有的标签，目标仍存活时末期提交 +3。
- `item_registration_pin`：`step4/copy → step4/copy → step8/end-summary`；选本轮首次成功 copy 的目标 UID，末期提交下一轮预约；预约失败不补偿。
- `item_growth_negative`：`step6/lifecycle → step6/lifecycle → step6/lifecycle`；选本轮第一个 actualIncrease>0 的 growth，提交独立奖励 `min(6, 2×实际增长)`。
- `item_low_balance_tab`：`step4/appearance → step4/appearance → step9/ledger`；选轮初现金低于本阶段配额一半的快照资格，提交独立奖励3。
- `item_compliance_carbon`：`step5/structural-event → step5/structural-event → step9/ledger`；选本轮首次 junk→非junk 的成功转换产物，提交 +3。
- `item_audit_clip`：`choice/commit → choice/commit → choice/commit`；选本阶段首次成功付款且付款后池内无 junk，提交删除券 +1；最终胜利只记统计。
- `item_margin_lantern`：`step4/appearance → step4/appearance → step9/ledger`；选阶段最后一轮且轮初现金处于配额的3/4至不足配额区间，提交 contract ×3/2。

**8 个事件的效果登记**

- `event_fog_shift`：`choice/commit → step3/age → step3/age`，modifier 绑定确认 UID，后续两次合法年龄推进逐次扣减。
- `event_copper_queue`：`choice/commit → choice/commit`；确认事务内立即转换 junk、加入 spent_gasket 并提交池数量增加一件；所有直接效果均 `cause=event`，不触发运行监听。
- `event_boiler_test`：`choice/commit → choice/commit`；确认事务内立即提交配额+12、现金+10与目标 pressure+2（或生成 pressure_pouch 初压2）；所有直接效果均 `cause=event`，不触发运行监听。
- `event_silent_bell`：`choice/commit → step4/appearance → step9/ledger`，绑定阶段前两轮 ×1/2、第三轮 ×2。
- `event_brine_inspection`：`choice/commit → choice/commit → choice/commit`，确认删除 feedstock，并在下一次候选提交时消费 crystal 保底。
- `event_empty_manifest`：`choice/commit → step8/end-summary → step9/ledger`，绑定新阶段首轮，末期对最多五个 cargo 提交 +2。
- `event_misprint_window`：`choice/commit → step2/tagAdded → step9/ledger`，新阶段前三轮首个 magic 立即获得 cargo 标签并提交 +2。
- `event_quota_recount`：`choice/commit → choice/commit → choice/commit`，确认配额、cleared_stub、刷新券三项原子提交。

本索引只规定效果何时激活、选目标和提交额度；金额、标签、目标条件、边界与迁移规则仍以表 5.A–5.H、§5.I 和 §6 正文为准。`pause_dial` 的普通加值只读取 `pressure` 标签；只有明确登记为压力机制的效果才可注压、扣压或释放。

## 5.J 起始双植物自然成熟迁移边界

这是GDD1相对当前M3中间契约的有意破坏性迁移。旧契约是：自然成熟的首个实例不接受额外年龄，且额外年龄不会顺延给第二个实例；GDD1先完成全部自然年龄，再过滤掉本轮已成熟实例，给第一个仍有age且未成熟的plant额外一步。

- **边界A，双软囊同轮自然成熟**：起始 `mist_pouch A(age=2, pos0)`、`mist_pouch B(age=2, pos1)`，步骤3两者都自然+1并各自转 `dew_lantern`。旧M3行为：首个A判“自然成熟”后不加A，也不找B，A/B均只完成自然转换；GDD1行为：A被过滤，B也已自然成熟，因此无合法目标，A/B均不再加龄。此例确认“首个成熟不顺延”旧规则与“过滤所有成熟者”新规则在双成熟时结果相同，迁移差异不在该边界。
- **边界B，首个成熟、第二个未成熟**：A=`mist_pouch(age=2,pos0)`，B=`mist_pouch(age=1,pos1)`，两者步骤3先自然处理，A转`dew_lantern`，B到age2仍为`mist_pouch`。旧M3行为：A占据首个位置且自然成熟，额外年龄不转移给B，B停在age2；GDD1行为：过滤A后选择B，B额外+1并在同轮转`dew_lantern`。B的转换只发生一次，不重开新类型出现效果。这样新规则明确提高成熟速度，必须用新经济与新seed重新模拟，不能迁移旧自然年龄测试的期望。

年龄状态表（同一spin共享`maturedThisSpin`）：

| 起始状态 | 自然年龄后 | 轮历 | fog事件 | fog_stitcher | 本轮结果 |
|---|---|---|---|---|---|
| A age2、B age1，无modifier | A成熟；B age2 | 不适用 | 不适用 | 不适用 | 仅A转换，B保留age2 |
| A age2、B age1，有轮历 | A成熟；B age2 | 轮历绑定B，成功推进B并消耗calendar | 无 | 无 | A、B均成熟/转换；若事件modifier也绑定B，其remaining不因本次calendar归零 |
| A age2、B age1，有fog事件 | A成熟；B age2 | 无 | fog modifier绑定B，成功推进B，remaining 2→1 | 无 | A、B均成熟/转换；B若仍有age，下一轮继续保留该UID的remaining=1 |
| A age2、B age1，有fog_stitcher | A成熟；B age2 | 无 | 无 | 仍活的fog_stitcher且B为其邻接、B起始有age且本轮未成熟；成功推进B并消耗stitcher | A、B均成熟/转换，后续不重选 |
| A age2、B age1，calendar+fog(B)+stitcher并存 | A成熟；B先被calendar推进并成熟 | calendar绑定B并成功 | fog已绑定B但B已成熟，remaining仍2且本轮不消耗 | 无其他合法邻接目标，stitcher不执行 | 只执行calendar；fog不转选A/其他UID，stitcher不转选其他目标；B新类型age=0、epoch+1 |
| A age2、B age1，fog绑定A | A自然成熟并转`dew_lantern`；B age2 | 无 | 绑定A但A本轮已自然成熟，不消耗remaining=2；不转绑B | 无 | A新类型若仍有age则下轮仍带remaining=2；B不受该modifier影响 |
| A/B均自然成熟 | A/B均成熟 | 无合法目标 | 无合法目标 | 无合法目标 | 三类modifier均不消耗；新类型age=0且epoch+1 |
## 5.K 付款→道具→事件事务算例

以第2阶段付款成功为例，设进入付款前 `cash=130`、本阶段实际配额`payment=125`、本轮`pendingSettlement=20`、余轮为0，池有feedstock，且本局尚未出现`event_brine_inspection`：

1. 玩家在SYMBOL_CHOICE选择候选，事务先结算 `cash=150`、清除pending，再扣125，付款后余额25；阶段2的`spinsRemaining=0`不允许停留READY。
2. 进入`ITEM_CHOICE`，从未拥有道具层按阶段2权重抽三件，玩家选择`item_brine_lining`。此选择不追溯本轮；阶段3开始时道具监听生效，阶段计数窗口清零。若玩家放弃，道具机会仍已消耗，不补发第二组选项。
3. 阶段奖励资源在同一STAGE_SETUP发放：付款完成后进入第3阶段，按§9第3阶段固定资源获得1刷新券、1删除券；刷新券上限9，若已满则丢弃并提示，不折现。道具选择不能重抽资源。
4. 付款后仅在stage setup完成且存在至少一个可确认A时做事件抽取：本例的资格集合还需满足阶段编号、池含feedstock、事件ID未出现、距离上次事件至少一付款节点、事件数<3、现金/容量/目标均可确认。若集合为空，不消耗40% RNG，直接READY；集合非空后40%判定成功，再等权选`event_brine_inspection`并保存选项。若40%失败，则直接进入READY阶段3，不保存事件ID、不增加事件次数、不消耗间隔，也不进入EVENT_CHOICE。若弹窗期间feedstock死亡或容量改变，A确认失败且仍留EVENT_CHOICE，不重抽。
5. 玩家选择B“不参与”：不花钱、不删feedstock、不添加modifier；**但该事件已计入本局事件次数1/3、该ID已出现、间隔计时已消耗**，下一付款节点（阶段3）不尝试事件。原状态与选择结果一次提交后进入READY阶段3。
6. 若选择A则**免费**删除一个feedstock并设置下一次候选精良晶保底；本例选择B，所以现金仍25、阶段3实际配额210，事件不加价；UI显示`payment=210`，不得把阶段2的125沿用。

这也裁定“拒绝”不是事件未发生：拒绝没有收益/成本，但消耗事件出现机会、ID一次性和间隔；支付失败或最终第10期没有上述事件事务。若阶段2虽付款成功但候选资格为空，则不消耗40%触发抽样机会，也不计事件次数。

## 6. 全部32持续道具（玩家称“本局升级”）

共同获取方式：第1–9次成功付款后三选一，候选权重见§8；不进入盘面，每ID只能拥有1件、全局最多9件。没有事件专属或商店道具。获得时不补发本阶段已经错过的触发；立即开始监听下一阶段。表内次数按道具自身独立计，每轮/阶段重置，跨保存必须保持。所有表内奖励金额均为独立奖励，只有标“产物/自身+”的加值进入格子乘区。

| id | 中文名 | rarity | 持续生效规则（含边界） | 设计用途 |
|---|---|---|---|---|
| item_dew_calendar | 露班轮历 | common | **轮内步骤3之后**：每轮第一个起始带age、存活且本轮未自然成熟的 plant 额外推进1步；每轮一次；若首个自然成熟则跳过寻找下一个 | 培育速度 |
| item_root_wrap | 根温绑带 | uncommon | 每轮第一个 plant 转换后存活实例本轮 +4 | 成熟过渡 |
| item_nursery_scale | 苗圃轻秤 | rare | 抽盘时池内 plant 权重 ×3/2；仅当池总数不超过 28；无放回 | 概率调节，有扩池成本 |
| item_frost_glass | 防寒窄窗 | uncommon | 每阶段最先上盘的 2 个 mist 自身本轮 +3；每阶段重置 | 雾料经济 |
| item_sorting_apron | 分温围裙 | common | 每轮首次成功 consume 的 scrap 独立奖励额外 +3 | 回收兑现 |
| item_waste_log | 滞物登记本 | uncommon | 每阶段非消耗销毁 junk 累计 3 个后获得删除券 +1；每阶段最多 1 券 | 长期压池规则 |
| item_offcut_chute | 边料回流槽 | rare | 每轮首次消耗非 junk 的 scrap 时生成 ash_felt；同轮新实例不出现 | 续料但会稀释池 |
| item_clean_mesh | 清栈细网 | uncommon | 抽盘时 junk 权重 ×1/2；仍留池中，不等于删除 | 缓解而非取消污染 |
| item_lane_clapper | 轨边拍板 | common | 每轮每排第一个 resonance，若该排至少 2 种 resonance type，自身 +2 | 同排多样性 |
| item_rest_notch | 休拍刻槽 | uncommon | 每轮恰有 1 个 resonance 的排，该实例普通产出 ×3/2 | 稀疏共振替代 |
| item_pitch_marker | 音高记签 | rare | 每轮本盘首个成功新增 resonance 临时标签的实例，若存活则 +5 | 通配接口 |
| item_shared_metronome | 公用节拍器 | uncommon | beat_spool 的拍点阈值降低 1，最低 2；相同 mechanic:cycle_count 的后续符号也可用 | 用机制键不写死名字 |
| item_brine_lining | 盐雾内衬 | common | 每轮首次 feedstock 转换为 crystal，产物本轮 +4 | 转换过渡 |
| item_fraction_gauge | 分馏格尺 | uncommon | 每轮第一个全盘 crystal 异 type 数至少 3 的时点，独立奖励 7；每轮一次 | 异类晶构筑 |
| item_jar_rack | 安瓿架 | rare | 每轮转换得到的第一个 crystal 保留到下一轮原格；与灯共享全局 2 格上限 | 保留概率 |
| item_residue_stamp | 残液验章 | uncommon | 每轮第一个 mist 被消耗，独立奖励 +2；但不补回目标 | 蒸馏/回收接口 |
| item_manifest_clip | 夜单夹 | common | 每轮 cargo 的不同 type 数至少 4 时，独立奖励 6 | 多路线轻回报 |
| item_return_track | 空返侧轨 | uncommon | 每阶段第 1、3 次主动跳过符号候选，各得刷新券 +1；每阶段最多 2 | 跳过有节奏价值，非无限刷 |
| item_small_hold | 小舱限载牌 | rare | 池数量在 12–20 时，每轮独立奖励 5；小于 12 无效 | 精简但不鼓励单符号池 |
| item_exchange_hook | 换装挂钩 | uncommon | 每阶段首次成功 consume product 时，下一次符号候选保证一个 common product（可用集合中等权）；仍需选择 | 补货而非免费产币 |
| item_pressure_index | 压班索引 | common | 每轮第一个 pressure 正常增加蓄压时额外 +1，不超实例上限；附加增加不再次触发本件 | 延迟线提速 |
| item_insulation_shawl | 隔温披布 | uncommon | 每轮首次 pressure risk 失败的负加值减少 3，最小 0；不改变污染或失败事实 | 降损不免风险 |
| item_release_receipt | 泄压回执 | rare | 每阶段第三次成功蓄压释放时独立奖励 12；每阶段最多一次 | 鼓励可重复释放 |
| item_spare_baffle | 备用挡板 | uncommon | 每轮首个风险生成的 junk 不入池，改为该源本轮 -3；生成事实记为替代，不能触发消耗/销毁奖励 | 风险换代价，非免费免灾 |
| item_safe_carbon | 安全复写膜 | common | 每轮首个合法数值 copy 的实际加值增加 2，总加值仍不超过 8；无合法 copy 不生效 | 受限复制 |
| item_spectrum_book | 谱类手册 | uncommon | 每轮首次实例临时获得其原定义没有的标签，若存活则 +3；多加两个标签只触发一次 | 通配，不认原有标签 |
| item_registration_pin | 对版定位针 | rare | 每轮首次 copy 成功后，保留其被复制目标到下一轮；全局 2 格上限；保留失败不补偿 | 概率控制但不复制实例 |
| item_growth_negative | 增量底片册 | uncommon | 每轮第一个成功永久成长事件，独立奖励为实际增长值×2，最多 6；不发 ON_GROW | 成长跨体系 |
| item_low_balance_tab | 薄账分页条 | common | 每轮轮初现金不足本阶段配额 1/2 时，独立奖励 3；不是初获现金 | 低谷过渡 |
| item_compliance_carbon | 合规复核纸 | uncommon | 每轮首次 junk 转换为非 junk 的产物，本轮 +3；失败转换不奖励 | 清理接口 |
| item_audit_clip | 稽核夹 | rare | 每阶段首次成功付款且付款后池内无 junk，获得删除券 +1；最终胜利仅记统计，不追加待选步骤 | 可重复履约规则 |
| item_margin_lantern | 余账灯 | uncommon | 每阶段最后一轮，若轮初现金在配额的 3/4 至不足配额区间，该轮 contract ×3/2 | 条件临期乘区 |

### 6.1 道具触发窗口补全

- 按字典序itemId排序同一窗口，各件都有独立额度，不因另一件先触发而失去资格；先验目标有效，再消耗成功额度。次数阈值进度（滞物登记本、泄压回执）按真实事件记，达到阈值只奖励一次。
- 轮历：步骤3全体自然年龄处理完后，按板位/UID找首个起始带age、存活且本轮未成熟的plant，额外1步；若首个已自然成熟则跳过寻找下一个，不吞次数。本轮若全部已成熟，则无合法目标，不给任何新产物再加龄。**这是GDD1新设计迁移**：当前M3中间契约`naturally-matured-first-does-not-age-product-or-second`选择起始首个后不顺延；GDD1改为过滤自然已成熟者后选择。旧用例/证据原样保留，不能把旧结果改成新设计已通过。绑带/内衬/复核纸：转换成功的当刻首个合法存活产物加值，后来被耗则普通产出归零，不另发现金。
- 防寒窗：以起始上盘快照认mist，阶段内按板位前两次出现（同UID不同轮可占两次）；转换为mist不算再次上盘。轨边拍板/休拍槽、夜单夹、小舱牌在最终存活盘/有效池汇总；休拍槽按实例数恰1，不按type数恰1。
- 音高记签、谱类手册先按tagAdded事实顺序记录首个目标，末期若仍活才加值；若后来死亡不顺延补另一个。一次同时加双标签只记一次。图标展示已用/未用。
- 格尺在步骤1建立初始盘面资格，之后每次板面、类型、标签或存活变化都触发一次检查；先验证当前资格与本轮quota，只有资格成立才写入`fractionGaugeReserved=true`，回调完成前禁止同一轮重入。首次活着的crystal异类≥3且quota可用时才预占并发独立7；失败（无合法存活crystal、奖励提交失败或回滚）不消耗额度、不保留预占，后续变化可重试。派生顺序为：变化提交→验证资格/quota→预占→发独立奖励→提交已用标记；回调产生的新变化排在当前回调之后，不递归进入当前窗口。
- 周期节拍器作用机制键cycle_count，只改beat阈值3→2；不缩短年龄或蓄压阈值，不当场触发旧计数，下一次上盘推进时结算。
- 压班索引在步骤4–6首个实际增加pressure事件后追加1，不超过目标固有上限；事件预置压力不触发，附加1不再发自身触发。自行释放与塔成功均计泄压回执的“释放”，同UID同轮最多一次。
- 披布在薄衬后减少首个pressure风险失败负add最多3，最低0；挡板只替代cause=risk的第一件junk生成，给源不可再减免的普通add -3；替代不是销毁，不触发回收收益，不占成功生成额度。源后死亡会失去这个普通负值，属于允许的结构协同。
- 复写膜只增首个成功copy的数值2，上限8；基础复制值需>0且目标合法，不能无目标凭空产2。定位针记录该copy的目标UID；与其他预约在步骤8统一解决，失败不补偿、不退款。
- 增量册只认首个actualIncrease>0的growth，奖励min(6,2×实际增长)，不是全轮累计到6；不会发第二次growth。
- 空返侧轨只认玩家主动skip（不认满池自动失败、刷新或道具放弃）；阶段第1/3次各给1刷新券，发券在choose事务内，不能反过来刷新已提交候选。换装挂钩每阶段首次product消费为下一次符号候选排保底，生成候选即消费标记；不是自动发符号。
- 安瓿架只取本轮首次转换成crystal的目标，下一轮原格保留；定位失败也消耗本次请求。轻秤按抽盘前有效池≤28判断，不读本轮之后的生成；细网只改抽样，不让junk从池消失。
- 稽核夹在成功扣款后检查全池无junk，奖励删除券1；败局不发。最终胜利记录“本可获得1券”，不新增可消费资源。余账灯条件按轮初快照，3/4边界用整数交叉乘法而非浮点近似。
- 道具表稀有度为8普通、16精良、8稀有、0史诗。`item_low_balance_tab`必须存在；历史占位`item_salvage_pump`不作为第33件，目标版本移除候选并按§13处理旧档。

## 7. 全部8事件：自愿的短期交易

### 7.1 投放与状态机

只在成功付完第2–8期、处理道具并配置下阶段后尝试；每个可尝试节点40%出事件，每局最多3个，同一ID最多一次，至少隔一次付款节点（例如付2后出现，则付3后不尝试、付4后可尝试）。付9后不再出现，避免临终强行污染；付10直接胜利。先确定资格集合，为空不抽概率；非空抽触发概率，成功后按表权重抽ID并永久保存全部选项/报价/目标资格。每件权重1，过滤后归一；不参与也算该事件已出现并计间隔。

只有B“不参与”始终合法，不花钱且结束事件。A需全部成本/目标/池容量合法才可确认，不自动换目标。子目标取消返回同事件，不重抽、不扣费；重载回EVENT_CHOICE。事件修改整个事务提交，失败保留原状态与RNG。事件转换/删除cause=event，不触发运行监听，不发出现、成长、消费、销毁或道具现金奖励。

| ID/名称 | 资格与权重 | A：成本 → 回报（完整初值） | B | 持续/异常 |
|---|---|---|---|---|
| event_fog_shift / 雾班调换 | 池有带age的plant；1 | 支付4；选一plant，其接下来2次合法年龄推进的上盘各额外+1步 | 不参与 | modifier绑定确认的UID，初始remaining=2；每轮最多1次，在自然年龄后；若绑定UID自然成熟则本轮不扣次数、不转绑其他UID；转换后仅在新类型仍有age时继续保留，成为无age成品或删除则失效；无合格目标不出本事件 |
| event_copper_queue / 铜屑排队 | 池有junk且池<200；1 | 免费选一junk转copper_burr，并加1 spent_gasket | 不参与 | **池总数+1**，不是旧稿“总数量不变”；欠条-1→毛刺2但多一垫圈-1，基础净+2，换取稀释；保UID/永久值、清counter/预约；满池A禁用 |
| event_silent_bell / 停鸣通知 | 池有resonance；1 | 新阶段第1、2轮resonance普通产出×1/2；第3轮×2 | 不参与 | 不延长到“下一次有鸣片才算”，按全局阶段轮次到期；没有上盘也消耗窗口。与其他倍率精确相乘，独立奖励不受影响；新阶段至少3轮才有资格 |
| event_brine_inspection / 盐雾抽检 | 池有feedstock；1 | 免费删除自选1 feedstock；下一次符号候选保底1 uncommon crystal | 不参与 | 是删原料换更好候选，不直接给晶体；无删除券消耗；普通精良晶候选为tide_prism/prism_hum/crystal_index/blank_facet；可跳过或刷新，保底规则见§8 |
| event_empty_manifest / 空白夜单 | 池≥21且有common非junk；1 | 免费删自选1 common非junk；新阶段首轮最多5个cargo各普通+2 | 不参与 | 保留计数/永久成长会丢失，先展示确认；按板位首5个存活cargo步骤8加值；临时cargo也有效；首轮不上盘不补发 |
| event_boiler_test / 压锅试鸣 | 有下一阶段；1 | 新阶段配额+12；立即得10现金；给自选1有蓄压机制的pressure +2，封固有上限；无合格目标则加pressure_pouch且初压2 | 不参与 | 立即现金净义务仍2，换取蓄压/符号；不现场释放，下次上盘检查；需生成而池满时A禁用。给单件成长可能合算但不是免费净收益 |
| event_misprint_window / 错版窗口 | 池有magic；1 | 支付6；新阶段前3轮首个上盘magic临时得cargo且普通+2 | 不参与 | 每轮最多1，步骤2按板位选；本来有cargo仍加2但不伪造tagAdded；无magic上盘不补发；第4轮到期；和货运成型收益相比支付6才可能值得 |
| event_quota_recount / 配额复点 | 有下一阶段且池<200；1 | 新阶段配额+10；池加1 cleared_stub，刷新券+1 | 不参与 | 给后续稳定4/轮但会稀释池；第一个上盘正常+1；刷新上限9时提示溢出，允许自愿确认，不能偷偷折现金 |

### 7.2 事件抽取、确认与持久提交

阶段设置必须已完成，且先计算`eligibleForAppearance`、`eligibleForA`、`eligibleTarget`。只有存在至少一个同时满足A成本、池容量与目标条件的方案，才允许进入事件抽取；若集合为空，不消耗任何事件RNG，直接READY。集合非空后才消耗一次40%判定RNG；判定成功后才用等权ID selector抽事件ID。进入`EVENT_CHOICE`时持久保存事件ID、选项、目标候选、modifier额度与间隔计数。玩家确认A时重新验证现金、容量和目标；确认失败不消费新的RNG、不换ID、不离开`EVENT_CHOICE`，只显示失败原因。取消目标同样留在`EVENT_CHOICE`。B确认与A成功/失败均以同一事务提交事件次数、ID已出现和间隔。

事务提交点固定为：付款成功写入付款与现金；道具候选生成写入offer window/RNG位置；道具选择或放弃写入消耗；`STAGE_SETUP`原子发放刷新券、删除券并写入新阶段；随后才做事件资格、40%与ID提交。任一提交点重载从该点继续，不重复扣款或抽样。

报价先展示“基础配额+事件增额+已有借支=实际付款”。modifier按进入阶段即绑定stageId，事件未来加龄是唯一可跨阶段的UID次数modifier；其他阶段效果离开阶段一律失效。事件资料是8个有完整选择的定义，不把仅显示叙述算实现。

## 8. 候选权重、路线与池稀释

### 8.1 符号候选

每次Spin结算生成3个不同定义ID（允许选到自己已有定义的新实例），候选包括62种正式非junk。先抽稀有度，再在该层合法定义等权；三槽不重复ID。层空则重新按其余非空层原权重归一。不使用当前代码对62件简单洗牌，也不以数组序号决定稀有度。

| 当前阶段 | common | uncommon | rare | epic |
|---|---:|---:|---:|---:|
| 1–2 | 72% | 25% | 3% | 0% |
| 3–4 | 58% | 34% | 8% | 0% |
| 5–6 | 43% | 42% | 14% | 1% |
| 7–8 | 32% | 45% | 21% | 2% |
| 9–10 | 25% | 45% | 27% | 3% |

没有隐形同路线权重，避免越拿越窄、难转型。每阶段第1次**自然生成**的候选，槽1在本阶段无额外保底冲突时保证一个common；其余槽正常，防后期完全断原料。刷新不补发这个common保证。

两种强制保底：事件精良晶优先于换装挂钩common product；最多占1槽。事件保证先消费，道具保证若同窗口冲突则留到下一次自然候选；都以等权选一个符合资格的定义。common product集合只有`copper_burr、cleared_stub`。已生成该窗口之后标记消费，刷新**不保留强制槽**，UI先警告；读档保留已经生成的保证。阶段基础common保底被强制槽覆盖便本阶段视为处理，不延迟。候选不足3定义时给全部合法ID并可跳过，不借原型填充。

### 8.2 道具候选

付款序号1–3：普通55%、精良40%、稀有5%；4–6：30/50/20；7–9：20/50/30；无史诗层。每槽先层后该层未拥有ID等权，三张不重复；层空回退归一。暂不按路线过滤：不合适道具也是风险，但玩家可放弃，绝不自动塞前三ID。全32件在第1次奖励即有非零机会；没有一次获得立即发钱/券冒充持续道具。选完进入新阶段后才重置窗口，不能追溯领奖。

### 8.3 A–H路线成型与替代

以下是**路线目标/诊断阈值**，不是隐藏奖励或必收清单。主路线按实际收入来源而不是标签数量识别，可同时记录副路线。阶段3–4（约第13–26轮）应能形成一个小循环；阶段6前至少一个持续引擎+稳定过渡收入。缺Rare也能交租。

| 路线 | 入口→可用引擎→成型判据 | 短板/替代与跨路线组合 |
|---|---|---|
| A 培育 | 软囊/苗床/温灯荚→自然成熟或补雾工→池内≥4成长/成品、一个培育支援，连续3轮至少2次转换或成熟成品贡献≥12 | 大池拖慢出现；不用根账也能拿成品过渡。扇叶喂F小阀并独立+4，雾料喂D深盐，成熟product接E扎绳/跑员 |
| B 回收 | 毡/毛刺→夹或滚筒→2供料+1处理器+录员或回流槽，3轮至少2次成功处理 | 吃光则停；不能不断拿消费器。毛刺留给E、灰毡给F、H/风险产junk供清理；清理与消费互相竞争 |
| C 共振 | 鸣片/分叉/雾簧→和音框，或走静拍稀疏→池4种鸣片但重复少，框触发率目标≥35% | 随机位置与同type不能凑种类；静拍与密集互斥。A/D的mist/crystal激活雾簧/晶腔，G临时鸣片补类型，E保留成品+G双谱稳定关键排 |
| D 蒸馏 | 滤带/安瓿→盘管或深盐→3前体+1转换器+2不同crystal类型 | 转换太多把原料吃完；晶索引不是无限自长。G晶坯可精炼；潮棱给C条件、E消费；F留温晶面分摊燃料需求 |
| E 货运 | 扎绳/短票→夜单台或跑员→≥4 cargo type、2 product，池16–24 | 不要求同路线；消费别人的高永久成品可能亏。A扇叶兑现额外4、D潮棱兑现10、H存根可稳定留着产4；换轨灯留成品帮助G/C组合 |
| F 蓄能 | 软袋/小阀/歇拍→脉冲釜或燃料循环→3计数件在错开的轮次释放；塔仅提高回报不负责启动 | 临期新拿釜没窗口可能亏；风险污染需B/H。A燃料、B注压、H临期现金条件接入；风险薄衬是保护不是必要套装 |
| G 映印 | 小片/底片→织布或读头→2个获标/可复制输入+2支援，3轮至少2次有效获标/复制 | 复制白名单只有3项，读头不是万能乘区；无Rare时小片+织布已有效。A/B/H永久成长接印板，D接晶坯、C接临时鸣片、E成品接双谱 |
| H 契约 | 薄账/合规台→撤账或成品→清junk、有3 contract type；信标可选终核 | 人为维持低cash不是免费收益；邮戳净差6还带垃圾。B滚筒把欠条变毛刺、E接存根、F失败供料；低谷件负责过渡，不能当永远+4 |

### 8.4 稀释的纸面解释

等权且N≥20时单核心上盘率20/N；一对指定核心同时出现率`20×19/(N×(N−1))`。N=20/24/30分别为100%/68.84%/43.68%的双件同盘率；30删到24提升25.16个百分点，不是“仅少6个垃圾”。在满20格的随机位置，两个指定实例八邻接概率110/380=28.95%（角4×3、边10×5、内6×8共110有向邻接）。因此N=30的一对特定件同盘且邻接约12.65%，不能按每轮稳定触发来算账。锁位一件并不保证第二件邻接，保留两件只保证两件在同一盘出现；只有两件在原始盘面已经相邻，且从预约到步骤8持续合法，才可承诺邻接。随机位置下两个指定实例的邻接概率仍是几何概率，不因“两件保留”自动提升。

池<20新增正收益件通常填空位而不稀释上盘率，但会改变空格条件与邻接；池>20推荐18–26的目标区间不是硬限制。UI展示“20/池大小抽取、当前核心同盘率仅为等权估算”，有权重时不可继续标20/N精确概率；提供权重图标而非误报百分比。拿第4个同名符号不在同轮候选禁止，但类型门槛不计四种。

## 9. 初版经济、难度和追赶

### 9.1 Normal具体表

初始0现金；每期收益可累计、余额留存。基准付款不含事件/借支，固定Spin不因富穷改变。进入阶段发券，在前一期道具选完的STAGE_SETUP里一次领取；第1期资源来自新局。

| 阶段 | Spins | 基础付款 | 零结余所需均值 | 进入时刷新券 | 进入时删除券 | 设计期内均值目标（非测得） |
|---|---:|---:|---:|---:|---:|---:|
| 1 | 6 | 70 | 11.67 | 2 | 2 | 18–25 |
| 2 | 6 | 125 | 20.83 | 1 | 0 | 25–35 |
| 3 | 7 | 210 | 30.00 | 1 | 1 | 35–50 |
| 4 | 7 | 320 | 45.71 | 1 | 1 | 50–70 |
| 5 | 7 | 460 | 65.71 | 1 | 1 | 70–95 |
| 6 | 7 | 630 | 90.00 | 1 | 1 | 90–130 |
| 7 | 7 | 850 | 121.43 | 1 | 1 | 120–165 |
| 8 | 7 | 1120 | 160.00 | 1 | 1 | 155–210 |
| 9 | 8 | 1460 | 182.50 | 1 | 1 | 180–260 |
| 10 | 8 | 1880 | 235.00 | 1 | 1 | 220–340 |

合计70 Spins、基础付款7125、固定刷新11券（初始2+9）、删除10券（初始2+阶段3–10的8）。70次符号候选、9次道具候选；最多3事件。默认不售券、没有每次跳过发钱。所有固定资源都不受是否拿道具影响，放弃道具仍领券。

起始池压力纸算（无道具、从不拿新符号、不删除、忽略所有正邻接收益）：第1期六轮依次20、20、22、29、21、21，共133，支付70余63。第3轮两软囊转露灯、灰毡自毁独立3且不产普通1；第4轮软袋释放10；第5轮两露灯转扇叶。此时池11件、9空格，基础普通21；第2期六轮有第8/12全局轮两次软袋释放，至少146收入，付125余84；第3期七轮一次释放，157收入，付210余31；第4期七轮两次释放，167收入，得到进入第4期付款前的**阶段余额198**（第3期结余31+第4期收入167，非用167替换31），仍不足320，失败。该保守路径不计低现金回执重新激活（每轮至多额外4，阶段2/3/4最多24/28/28），即使把这80全加给玩家，阶段4也仍不足320。唯一其他起始正邻接协同是偏相片获鸣片后，同排栈桥鸣片最多+1/轮；前四期共26轮，即使再给满26，阶段4付款前也最多304<320。因此第一期对不乱删的新手是教学容错，第4期前不构筑会遇到真实墙；不是起手12件便能通关。此推演限定不拿任何符号/道具、不删、不参与事件，允许领取但不使用券；不能把保守下界说成所有seed精确值。

理由：起始池低而有空位，第一期容错足够；第3期开始要求稳定加值/转换，而非继续每轮拿裸基础；第6期需要路线运转；最终235/轮要求乘区/永久成长/事件协同，但远低于极端10000。付款不照抄旧公式30+i×24+i²×5，也不按旧四Bot100%胜率证明可用。

### 9.2 难度与追赶边界

- Normal为唯一首轮调平衡档；无暗中操纵盘面、无根据当前现金改变候选。低谷回执/分页条、阶段固定删除和可跳过事件就是透明追赶。
- 提案Hard：Spin/权重不变，付款逐期ceil(Normal×1.15)，初始删除1，去掉第2期刷新1；Nightmare：逐期ceil(×1.30)，初始删除1、初始刷新1，初始再加1 arrears_slip。须Normal通过后另测，首个可玩纵切片菜单不开放。不得宣传已平衡。
- 无复活、无限延期、局外永久属性。可提供独立“教学seed”展示固定流程但不计普通胜率，不能在标准局第一轮强行发核心。
- 防滚雪球：永久值30、同定义倍率双源、生成软限、最多2保留、候选不隐形同路线加权、无利息、道具唯一且9件、付款后的现金仍有后续用途但不自动生钱。保留真实爆发，不用粗暴总收益硬封顶替代调平衡。
- 最易失控组合（双信标×双框×双谱、成长印板、回流续料）先以候选稀有度/成型成本检验；若所有路线都被迫追一个乘区，再调效果或同源限制，不能只把配额抬高迫使其他路线失败。

### 9.3 纸面推演（已做，不冒充模拟）

1. 以每期平均收入 `[22,30,42,60,82,110,145,185,225,280]`、不花现金的假设路径计算，期末余额依次为`62,117,201,301,415,555,720,895,1235,1595`。总收入8720−7125=1595。它说明均值目标中部可能过宽松，而不是证明某条路线真能赚到这些数；平衡模拟须重点检查富余是否过早。
2. 偏弱路径`[18,24,32,44,60,80,100,125,155,190]`，前6期余额`38,57,71,59,19,-51`，实际第6期失败（不会继续负现金付款）。所以无成型构筑不能只靠起始池熬到底；真实收益波动、候选和花费会改变首败期。
3. 无倍率、每次都上盘的软袋4次总普通4+独立10=14，均值3.5；脉冲釜3次独立16，均值5.33但前两次0；拍点3次普通1+1+10=12，均值4。解释临期选釜的机会成本，不能拿长期均值掩盖倒计时。
4. 裂缝调压器每次平均普通`2+0.75×8−0.25×6=6.5`，但每4次期望加1垃圾；若接下来6次均上盘，垃圾期望负6且占位，不能宣称净6.5长期无代价。薄衬/披布/挡板同时持有时，失败负6→−2→0，然后挡板另−3，风险源普通−1、无垃圾；成功10，平均7.25。保护成本是盘面槽/道具选择。
5. 分栈跑员耗扇叶：消费者1 + 独立(6+4) + 扇叶独立4 =15，扇叶普通0；耗永久30扇叶仍15，故会牺牲强成熟件。夹耗灰毡：普通夹1+奖励6=7、只生1毛刺下轮用，不能本轮再算毛刺2/4。
6. 两个双谱同时作用基础4潮棱：floor(4×1.5×1.5)=9，第三来源无倍率；仍可给缺少标签的目标合法加标签。塔3+初压1小阀吃苗床：阀压1+2=3，塔扣3→0且阀×3，普通3+3，独立3+8，总17；初压4则阀到6自行释放14，塔不能抢，普通3+1、独立3+14，总21。新塔数值不能引用旧8/20作期望。
7. 停鸣事件若三轮鸣片普通收益各20，则10+10+40=60，与原60相同；若第三轮能规划到40，则10+10+80=100对比80，收益20。它是时间规划交易，不是见到必拿的免费×2。
8. 候选纸算：无保底且层未耗尽的非保底三槽，common期望为`3p(common)`；阶段common强制槽占一槽时，common期望为`1+2p(common)`；uncommon强制槽占一槽时，若只统计保底槽以外的uncommon，期望为`2p(uncommon)`（含强制槽则为`1+2p(uncommon)`）。这里`1`是floor/guarantee selector强制槽，`2p`是剩余两个槽先抽层再层内等权的期望；层耗尽或多个保底占槽时改用剩余层条件概率，不能沿用3p。不是“62选3所以Rare随便拿”。

纸面未证明：实际路线能达到上表期均值、锁位价值、候选暴露是否足够、事件选择率、平均局长。不能用这些算式替代自动模拟/朋友试玩。

## 10. 信息、回收机运行手感与完整UI

本节的Spin/符号/池/道具/待结算/实际配额是技术或旧稿词；所有玩家可见标题、按钮、Tooltip、日志和结局统一按§1纳入分册映射为运行/生产牌/生产牌库/本局升级/待入账/本期应付。老虎机滚轮仅是表现参考，不承担故事身份或现实赌博含义。模式名显示“完整模式”与“精简模式（试验）”，后者限制与提示见分册；不得宣传已验证容易通关。

### 10.1 屏幕与可读性

第一工程阶段只交付功能 UI、状态反馈和可核对日志：界面可以使用占位图形，必须能显示现金、待入账、本期应付、本期剩余运行、候选、本局升级、账本和因果记录。正式 SVG 图标、滚轮动画、音效和背景音乐属于后续表现阶段；它们不改变逻辑、RNG、存档或日志验收。

暖铜回收机、深青工坊、琥珀收益灯。中心5×4是最大视觉块；顶栏始终现金/待入账/本期应付/本期剩余运行；左本局升级与临时效果、右生产牌库规模/路线摘要；底部运行或三选一，不在每次运行弹多个模态框。1366×768不横向滚动，详情面板可内滚；候选至少名称、基础值、完整短效果、标签/稀有度、为何与牌库协同。中文长名不被编号代替。

### 10.2 一次Spin的反馈合同

- 正常一次1.6–2.0秒：拉杆/按钮0.10s→滚动0.45s→五列分别于0.45/0.57/0.69/0.81/0.93s停止→基础闪亮0.15s→组合聚合0.4–0.7s→总额定格。结果在动画开始前已算完，停轮只是表现，不是玩家反应小游戏。
- 连线表示邻接、消费缩小移向来源、转换发光换图、永久成长加小刻度、倍率用大号×数；音色区分钱/成长/倍率，最多8并发音效、每0.1秒最多一段升调；连击音高最多升12半音，避免尖叫。
- 统计“Combo”=有因果连接的成功效果链，不把每格基础币当一次组合。最强链涉及≥4个不同定义或本轮收益≥前5轮中位数×2时触发大Combo（无历史时用40作参考），全程最多3.5s，所有数字仍可在账本查到。
- 普通收益→加法→乘区→独立奖励→总净额；损失红色但不盖住正收益，待入账用空心现金图标，选择或跳过后钱包才入账。按钮文本“选择并入账/跳过并入账”，消除现金没变的疑惑。
- 快速档0.5s、即时档≤0.1s；Space在动画中只跳过演出，不开始下一轮。关闭屏震/粒子/音效/减少动态不会改变RNG和逻辑。后台切回不重播整条长链；500日志聚合为几组，原账本保留。
- 压力：余3轮顶栏变暖、余1轮边框和一次短提示音；显示`缺口/max(1,余轮)`所需每轮额，与最近5轮均值并列标“参考非保证”。不会每秒报警，不用假险胜动画。

### 10.3 上手、输入与结算

六步可跳过引导：从牌库随机抽入20格→普通产出→三选一/跳过并入账→相邻连线→付款倒计时→移除前后出现机会。用当局实际结果演示，不改标准随机；不把牌库≤20时的移除说成提高其他牌出现率，有权重时不误报等权概率。Tooltip术语支持点击固定、键盘焦点，不依赖hover。点击生产牌显示上盘计数/蓄压/永久成长（本局内）、下次阈值及哪些效果能复制。

键盘：Space运行/跳动画、1/2/3选候选（有确认状态保护）、S跳过、R刷新、Tab池、Esc关闭查看层（不能取消pending/事件成本）；鼠标全功能。输入框聚焦不响应快捷键，重复keydown忽略；所有命令层重验证。

胜利/失败屏：seed/规则版本/内容模式/难度/时长、完成期数、付款差额、最终生产牌库与9项以内本局升级、最高单轮收益、总净收益、MVP与贡献账本、主副路线。再来一局/同seed重试/复制seed/回菜单；同seed重试明确需相同操作才同结果。完整模式付清10期显示“工坊保住了”；精简模式标明试验规则，不代表完整模式通关。失败显示“本期账单未付清”，并分列本期应付、可付现金和缺口。图鉴“未发现”可隐藏图但不得阻止正常候选。设置音量、动画、屏震、减少动态、色盲辅助、全屏、自动保存。音乐可缺省关闭，不联网取素材。

## 11. 初版实现 vs 目标（初版历史阅读快照，不是当前实现报告）

以下正文的“当前/现有”均指初版撰写时点；保留原事实，不代表2026-10-06的源码状态，本次不更新该历史对照表。

完整阅读指定prompt/计划/PROGRESS/CONTENT_MATRIX/MECHANICS_ADVISORY/MECHANICS_GAPS/BUILD_IMPLEMENTATION、RULES、A–F各PROOF/AUDIT、ROUTE_G_PROOF、MECHANICS_V1_AUDIT、ROUTE_H_PROOF/AUDIT，以及全部现有core四文件、resolver、content、UI main。G独立ROUTE_G_AUDIT文件不存在；G8专项依赖机制审计，不编造不存在报告。历史初审FAIL与后来限定范围PASS并存，当时验收状态见归档的 [PROGRESS_LEGACY](archive/PROGRESS_LEGACY.md)；不把这些历史缺口或限定PASS当作今日全游戏结论。

| 项目 | 当前源码/记录事实 | GDD目标与差距 |
|---|---|---|
| 新局/经济 | game.newRun仍10个legacy实例；阶段旧公式，初始券2/2 | 正式12实例、70轮/7125配额与逐阶段券表 |
| 现金事务 | spin写pending、choose入账后付款；revision/clone校验已有 | 保留不回退；UI必须显示待入账与稳定阶段 |
| 符号 | 64定义、A–F历史范围验收，G8专项/H范围审计；部分元数据仍英文ID或乱码 | 全64表成为新版本合同；修A–F近邻差异，不以旧602掩盖 |
| 已知近邻 | chord_frame代码用row条件、cargo_rope用row；return_station即时奖励且缺末池≤20/product条件；router监听次数1 | 分别邻接、邻接、末期因果+池数、最多2且只注真实pressure机制；独立复核 |
| 候选/道具获取 | 符号62等权洗牌；itemChoices未拥有数组前3 | 分稀有度抽样与保底、道具三选权重，允许放弃 |
| 道具 | 当前M3-1中已有itemHook和10个效果数据，不是“全缺”；另有manifest/low_balance子串占位路径；low_balance ID缺、salvage占位存在 | 32逐条总线，去占位，真实窗口/原因/归因；不把未审中间改动称验收 |
| 事件 | 8只有名称/描述，event未进入交互；activeModifiers不接受非空 | 完整8选项、事件与阶段modifier、恢复/资格/容量/权重 |
| 抽样/保留 | 已有部分预约/加权路径，锁数2；不能据此认完整一轮有效期与均匀空位 | 抽中集合与位置分离、保留只下一轮、所有路径同契约 |
| 引擎 | 有epoch、成功事件、死亡许可、BigInt、压力检查、软限额 | 按§4清晰阶段，原型兼容隔离；新塔/读头/邮戳与目标过滤迁移 |
| 保存 | 单key导入封套、backup回退、pending验证已有 | 增五RNG流/事件/窗口；新版本独立存档，不静默移植旧局 |
| 表现 | main.js静态格/数字、原型按钮与JSON账本，无正式滚轮演出 | 正式机器界面、分段动画/音效/中文术语/可访问操作 |
| 验证 | 旧602和历史207中3契约冲突是特定证据；未本次跑runner | 另开GDD1证据集，功能/平衡/真人分别过门禁 |

## 12. 最小可玩纵切片与全量顺序

**第一工程阶段只验收功能 UI 与可核对日志。** 这一阶段可以使用占位图形和简化状态反馈来验证 New→Spin→结算→选择→付款→道具/事件→保存/恢复闭环。正式 SVG 图标、老虎机滚轮动画、音效和背景音乐全部后置；纵切片验收明确豁免这些正式表现资产与演出质量，不得因它们尚未完成而阻塞功能验收。

**以下是评审后的建议，不是现在恢复开发。** 纵切片不是引擎demo，也不是把未接线64张卡全部暴露。

1. 合同先行：主审确认§3–9，冻结版本、时序、抽样和经济；先补新规则手算fixture/迁移映射，不动旧证据。
2. 最小完整体验：A/B/D各8=24定义（23普通候选，spent仅生成），10道具：`item_dew_calendar、item_root_wrap、item_frost_glass、item_sorting_apron、item_waste_log、item_offcut_chute、item_clean_mesh、item_brine_lining、item_fraction_gauge、item_residue_stamp`；3事件fog_shift/copper_queue/brine_inspection。仍10期70轮，但该切片配额明确为Normal表×0.65向上取整，UI标“切片试验经济，不计正式通关”。
3. 切片起始12：mist_pouch×2、wick_bed×2、ash_felt×2、copper_burr×2、saline_ampoule×2、brine_strip×1、spent_gasket×1；初始/投放券同正式。无pressure机制目标时router只清junk，reserve自身可作为合法压力目标；没有隐形生成其他未启用路线。
4. 道具耗尽：10件供9奖，末次候选可只有2件，允许放弃；切片稀有度在合法非空层归一，没有Epic自动回退。事件资格自动过滤。完成真实New→Spin/pending→候选/删刷→付款→道具/事件→胜败→重载闭环，同时做可读的功能状态反馈、日志账本和一次连线/倍率/消费反馈；正式SVG、滚轮动画、音效和音乐属于后续阶段，本纵切片只需占位反馈。
5. C/E/F加24→48；加各四道具12→22；加silent/empty/boiler三事件→6；压力保护/一轮锁定与货运末期条件优先测。此时取消切片65%付款，恢复正式表后独立采样，不把前阶段切片通关续接正式统计。
6. G/H加16→64；加各四道具8及轻秤/安瓿架2→32；加misprint/quota两事件→8。补copy/tag/阶段义务/新版本存档/UI；全量再做经济/全部路线回归。
7. 最后集中调平衡、替换全部正式SVG、制作滚轮动画、音效/Combo与背景音乐，完成三分辨率与浏览器QA。商店、每日挑战、无尽、升阶延后，不以外围系统遮盖无趣。

## 13. 迁移、冻结点、风险与验证门禁

### 13.1 破坏性迁移清单

### 13.1.1 schema=2精确字段与独立存档

GDD1存档必须包含：`schema:2`、`rules:"GDD1"`、`content:"GDD1"`、`saveKey:"fog-port.save.v1.gdd1"`；旧`fog-port.save.v1`与`fog-port.save.v1.backup`只读，不迁移覆盖。随机流固定为`rng.draw`、`rng.effect`、`rng.symbolOffer`、`rng.itemOffer`、`rng.event`，并保存每流state与consumed计数。另须持久保存`phase`/`stageId`/`spin`/`cash`/`pendingSettlement`、`offer.windowId`/`offer.kind`/`offer.choiceRefreshesUsed`(0..3)/`offer.guarantees`、`events.seenIds`/`events.count`/`events.cooldownPayments`/`events.activeModifiers`、`reservations`（UID、格位、epoch、来源、到期轮）、`fractionGaugeReserved`与各item quota/used字段。缺任一字段或出现未知rules时拒绝载入；旧档仅显示摘要并以独立key导出，不写回旧key。

### 13.1.2 成熟游戏经验→项目防坑→验证

| 可核对的成熟游戏高层经验 | 本项目防坑规则 | 待验证门禁 |
|---|---|---|
| Balatro公开页强调手牌/构筑部件改变计分协同 | 不把标签数量当收益，所有协同写入phase、来源与归因 | 64符号逐效果正/负/边界例 |
| Slay the Spire公开页强调选择塑造路线、遗物改变策略 | 候选可skip、删除后再选，道具可放弃且不自动塞前三 | 候选/刷新/保底重载事务 |
| Monster Train官方clans页展示身份与跨体系组合 | A–H分组可跨组，但不隐藏路线权重或强制套装 | 路线成型率、混搭率、P10/P50/P90 |
| Luck Steam高层搜索支持slot、rent、symbol interaction、item build的产品定位；Steam直取失败 | 只借鉴“抽取→租/付款→协同构筑”的高层关系，不声称精确成熟参数；direct fetch失败保留为研究限制 | 独立GDD1 bot、真人和来源复核，不能用旧602替代 |


| 迁移 | 必须记录/不能偷做 |
|---|---|
| 0.3/M3-1→GDD1 | 独立版本/存档键；旧pending与旧报告只读；旧局不继续用新费用 |
| 原型起始→正式12、旧费用→新表 | 新局与模拟初始条件同时改，旧fixture留legacy命名空间 |
| 抽取位置随机与5流RNG | 相同旧seed不再承诺同盘；新黄金seed向量与每流消耗记录 |
| 分温夹无目标额外1取消 | 新期望普通1，不把旧奖励1悄悄保留 |
| 读头基础1→3（复制cap8不变） | 窄白名单稀有件需要基本收入；风险是与安全复写膜组合后成为无脑优选，待模拟；旧G手算不覆写 |
| 塔基础2→3，原扣3压力×3不变，新增独立奖励8（旧0） | 消耗储能需足以对抗等待自释放；风险是路由器注压+多个塔形成高收益循环，待模拟；旧压力期望不覆写 |
| 邮戳独立18不变，新增义务8→12，污染规则不变 | 净借支优势10→6，减小无脑接受；风险是Rare在高配额阶段仍不值得占槽或池满时成本被规避，待模拟；旧H手算不覆写 |
| router压力目标、C/E选择/条件、时序阶段 | 逐规则列旧行为→目标、受影响case与新手算；不能只改断言变绿 |
| 道具/事件 | low_balance新增、salvage占位移出正式；10已有道具也按新窗口复核；事件copper明确池+1，boiler/misprint/fog报价新设计 |
| 新候选/奖励/保底/券上限 | 池稀有度逐行不能按位置推断；掉落统计与UI提示同一数据源 |
| 轮历自然成熟后选目标 | M3中间契约：首个已自然成熟，不给其产物或第二个加龄 → GDD1：先滤掉本轮已成熟者，再给首个合法plant；避免无效吞次数，风险是成熟速度提高，须重测经济；§5.J给新旧纸算，不改旧证据 |
| 普通条件统一出现快照 | 澄清本文原§4.2/§5矛盾：普通加值与条件倍率均步骤4一次判定，只有明示轮末项步骤8；后续邻居死亡不重判，原型/旧正式偶然队列时点不作为新合同 |
| 保留单轮消费、年龄不二次成熟 | 记录UID/epoch/履行轮，兼容旧持久预约不能猜测 |

冻结点F0：主审接受完整GDD；F1：统一规则/schema/迁移与手算案例接受；F2：纵切片真实闭环通过；F3：64/32/8全量行为通过；F4：Normal训练/留出模拟达标；F5：真人和视觉验收。任一步未过不扩量/不冒称下一步完成。初版交付时只有本文设计交付，F0尚待评审；本次定位/语言范围确认不等于F0通过。

### 13.2 初版已做的非代码验证（历史记录）

本节“本次”与末尾交付结论均指初版交付；不是本次定位/语言修订的验证成果，也不是当前实现、平衡或真人验收状态。

- 以符号表中带rarity的定义行而非所有Markdown首列统计，逐表64个唯一ID=8×8，与CONTENT_MATRIX符号ID集合完全相等；道具32个唯一ID与矩阵完全相等，事件8个唯一ID完全相等。符号稀有度26/21/15/2；垃圾common2件禁选，所以普通候选62=24/21/15/2。所有转换/生成产物在64表内，复制白名单恰3，不含条件加值。
- 道具32=8×4，稀有度8/16/8；事件8、逐项资格/两选项/成本收益/到期明确。初始12基础16、总70轮、付款7125、固定券11/10、最多9道具/3事件已静态核算。
- 核对默认单目标、死亡奖励/独立乘区、同源倍率上限、压力阈值、最终付款/pending、事件池+1等矛盾，并在本文裁定；完成§9纸面均值与概率推演。
- 只读Python文本校验得到：符号64/64唯一、道具32/32唯一、事件8/8唯一，三个ID集合相对原矩阵缺失/新增均为空；路线A–H齐全，稀有度计数与付款/均值路径算术相符。仅检查设计文本，不加载游戏、不调用测试runner。
- 阶段奖励闭合：付款1–9后各一次道具机会，第10次无，最多9件；事件仅付款2–8后，间隔约束最多可占2/4/6/8四个位置，但局上限3使第4次不再判定。出现后拒绝也计出现次数与已出现ID；支付失败/最终胜利绝不进事件。不能把40%触发当保证每局3次。
- 本次没有执行游戏runner、自动平衡、浏览器或真人试玩，没有写入旧manifest/freeze/audit证据。来源阅读、设计与手算不称功能测试通过。

### 13.3 必须后续代码模拟/自动测试

功能门禁：每符号至少正/负/边界3例、每道具至少触发/未触发/多来源或窗口/跨保存4例、每事件至少资格/成本不足/确认/拒绝/恢复/容量或过期6例；schema数目检查另计、不顶替行为。至少10个≥4定义、≥3层因果的独立手算组合，覆盖消费→死亡产物、转换→成长→印板、标签→邻接→倍率、压力→塔/释放→道具。验证源/目标/收益/UID/RNG/计数/日志而不是只查总额整数。

事务门禁：所有稳定phase重载；正负pending、最后轮恰好/差1、双击、满池、0池/200池、事件目标取消/失效、保底刷新、道具最后不足3、锁位死亡/转换/新预约、一局上限、存储失败/导入失败/未来版本拒绝。Node/Chrome/Edge、file/HTTP case级同名同结果；独立临时输出，不能重写旧冻结。

平衡门禁：四类Bot（Random、Value、Synergy、有限前瞻Greedy）每类训练1000局+留出1000局，共8000，独立决策RNG。真实使用skip/remove/reroll/items/events并记录次数；Greedy必须用副本推演，不把静态标签评分称前瞻。报告各期存活、收益P10/P50/P90/P99、付款余量、成型轮、池大小、事件接受率、各ID暴露/选取/贡献/条件化胜率和运行性能，不能只报平均胜率。

**待验证目标，不是现状：**熟悉规则的真人Normal胜率35–65%，新手前3局10–30%；Synergy/Greedy目标40–70%且至少高于Random15个百分点。首次接触的阶段1存活≥95%、阶段3≥75%、阶段6约45–70%；不同人群/策略分开统计，不能相互拼成曲线。胜局最终池中位18–26、阶段4前形成小循环≥70%；任何单主路线胜局占比建议5–25%，混搭局≥40%；非junk定义候选条件选择率若持续<3%或>75%列入复审，非硬删卡阈值。后期单轮P90/P50希望1.5–3.5；P99极端爆发不据此抬全体租金。

统计控制：训练/留出seed名单固定不同前缀、不交叉调参；比例报样本数与95% Wilson区间；物品“拿到后胜率”按获取阶段/原构筑/策略分层，避免幸存者偏差。极端seed与坏seed不得从报告删除。调参先候选/供料/收益，再配额，小步版本化；若强策略全100%或所有路线普遍第6期崩溃，当前表退回设计，不宣称接近完成。

性能目标（待测）：普通逻辑P95<16ms，500效果P95<50ms，正常动画1–2秒、大Combo≤3.5秒；指定机器/浏览器，禁用动画后状态完全相同。安全上限触发应可恢复失败而非假胜利。

### 13.4 必须真人试玩，不能被Bot替代

至少3位玩家（含2位未看GDD的朋友），每位3次完整尝试，共9次，至少包含3次正常胜局和3次付款失败；不足胜局可继续招募/调参，不Debug改现金冒充。记录完整局时长、每次候选犹豫、看不懂词汇、删除理由、是否能预测消费损失、是否能解释一次大Combo、失败归因、是否愿意立即再来一局。

目标：首次10分钟后≥80%能解释“池大稀释/跳过有用/待入账”；≥80%能在账本帮助下解释选定Combo；至少2/3愿意再开一局；中位完整Normal时长25–40分钟，新手选择不是一直无脑最高稀有。观察“好看但等太久”“所有消费者都坑”“不断补原料像工作”比单纯问好玩吗更有价值。三分辨率1366×768/1920×1080/2560×1440与键鼠、静音/减少动态逐项实机确认。

### 13.5 仍开放的风险（有初值，不阻塞形成设计）

1. 新经济均值中部纸算结余1595可能偏宽；需模拟证实实际组合可达性后再降收入或调阶段压力，不能拿纸面目标当真实收益。
2. 消耗路线独立奖励不乘倍率，可能终局输给共振/契约；优先看永久成长/续料可靠性与塔新奖励，不直接让所有独立奖励吃全局倍率。
3. 单遍临时标签有板位顺序影响；已明确顺序，可读性若差可另提同时快照方案，但属于新规则版本，不在实现中暗改。
4. 64内容对新手过载；先降低说明密度、突出可用协同，不把复杂内容永远锁在图鉴解锁墙。
5. 防寒窗/配额边签/部分稀有精炼器是否过窄：先量化暴露与条件收益，再修数字；不得为保留数量容忍无用卡。
6. 新塔独立8、邮戳净6、事件报价都是设计初值，须重新测试；过去PASS只代表过去契约。
7. 三条历史审计FAIL继续作为记录保留；新规则失败与历史已批准冲突分别报告，不用改历史报告消除红字。

**交付结论：规则、64符号、32道具、8事件、概率与经济、表现、纵切片、迁移及验证计划已形成可执行初版。实现、平衡与真人体验尚待授权后的验证。现在停止，不恢复代码开发。**

