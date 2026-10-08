# GAME DESIGN V1 design audit

审计范围：完整阅读 `docs/GAME_DESIGN_V1.md` 至末尾，并对照当前 `js/core/rng.js`、`js/core/game.js`、`js/engine/resolver.js`、`js/core/save.js`、`js/core/validation.js`、`js/data/content.js`、`js/ui/main.js` 与既有机制契约。按要求仅新增本报告；没有运行 runner、平衡模拟、浏览器或真人试玩，也没有修改 GDD、代码、测试或旧证据。

结论：GDD 已经把目标版本、迁移边界和验证门禁写得相当完整，但目前仍有若干规则闭合问题。F0 尚未通过；当前源码是 M3-1/0.3 的中间实现，不能把既有 602/602 或本次静态阅读称为 GDD1 功能成立或经济平衡成立。

## 必须修订的规则缺陷

| 严重度 | 位置 | 最小纸面反例 | 判断与最小修订 |
| --- | --- | --- | --- |
| **Critical** | §4.2 步骤 3–5、§5.I、§6.1（GDD 行 89、236–247、281、317） | 轮初相邻 `mist_pouch(age=2)` 与 `dew_lantern`，同时有 `item_dew_calendar` 和 `event_fog_shift`。自然年龄先使软囊成熟；轮历是否跳过、fog 的“两次合法年龄推进”是否消耗一次、是否还能作用于同一 UID，三种结果都符合现文。若 `fog_stitcher` 也给 age，来源顺序又改变成熟结果。 | 统一写出步骤 3 的操作序列：自然年龄 → 轮历 → 事件 modifier → 符号 `fog_stitcher`，或反之；定义“自然成熟”“本轮未成熟”“合法推进”的共享布尔字段；规定同一 UID 每个 modifier 是否独立消耗、成熟后是否立即失效。用 A(age=2)、B(age=1) 和两种 modifier 各给一条状态表。 |
| **High** | §4.2 步骤 5 与 §5.I 的普通出现窗口（行 89、148、173、206、236–247） | `pitch_fork`、`cargo_rope`、`alignment_cloth` 在同一盘面。步骤 5 说先做邻接数值加法，但 `cargo_rope` 明定步骤 4；`alignment_cloth` 依赖 `tagAdded`，而标签在步骤 2；若 rope 目标先被另一动作死亡，是否仍保留步骤 4 的选定目标也未统一。 | 给每个效果登记明确 phase：`preprocess/tag`、`appearance-snapshot`、`adjacency-add`、`structural-event`、`end-summary`。规定快照目标是在 phase 进入时锁定，或每个动作执行时重筛；删除“普通条件默认”对未标明效果的兜底。 |
| **High** | §6.1 `item_fraction_gauge` 与“首次时点”规则（行 294、320） | 起始盘面已有三种存活 crystal，步骤 2/3/5/6 都没有类型或存活变化；“首次全盘 crystal 异 type ≥3”是否应在步骤 1/4 立即奖励？若步骤 4 才首次检查，本轮它与普通出现条件的先后不明确。 | 明定检查点包含步骤 1 初始快照或明确排除初始满足；建议在步骤 1 建立一次初始资格并锁定，之后只在指定变化后检查，避免“无变化则永远不触发”。 |
| **High** | §7.1、§7.2、§8.1（行 335–350、372、525） | `event_fog_shift` 资格只有“池有带 age 的 plant”，但 A 还要求现金 4、可支付目标；`event_misprint_window` 资格只有 magic，但 A 需支付 6。玩家可能进入只有 B 可用的事件，或看到 A 后才发现成本不足。 | 把事件资格拆为 `event-visible` 与 `A-confirmable`；若 A 不可用，UI 必须在事件抽取前过滤该 ID，或展示不可选 A 并保留 B。明确资格抽样是否读取轮初现金、阶段配额、池容量和可用目标。 |
| **High** | §4.1 保留、§5.E、§8.4（行 76、173、391） | 两件 product 都被合法保留到下一轮，但分别落在位置 0 和 19；它们不相邻。文中“保留两件才可靠”容易被实现/玩家理解成邻接可靠，实际只保证出现位置，不保证关系。 | 把“保留可靠”改为“提高单件出现确定性，不保证邻接”；若目标是邻接，必须定义相邻格预约、相邻位置选择或单独的邻接保留效果，并说明与随机排列的冲突。 |
| **High** | §4.1、§8.1、§9.1（行 76、372、391、409） | 池正好 200，玩家仍进入 SYMBOL_CHOICE。选择新符号会使池成为 201；跳过是否合法？刷新三次是否仍能换候选？“最多同一候选窗口 3 次”没有存档字段，重载后无法判断次数。 | 明确满池仍显示候选但只能 skip，或在生成候选前禁用选择；定义 `choiceRefreshesUsed` 的阶段/窗口归属、保存时机、重载恢复和“刷新到第 3 次”的边界。把满池、删除至 0、生成失败与候选选择分开写成事务表。 |
| **High** | §3.2、§7、§10.3（行 57、337、458） | 付款后文档进入 `ITEM_CHOICE → STAGE_SETUP → EVENT_CHOICE`，但 §5.K 又说事件在“处理道具并配置下阶段后”判定。若道具选择后崩溃/重载，事件资格与 RNG 是否已消费？若事件目标取消，是否回到 ITEM_CHOICE 还是 EVENT_CHOICE？ | 画出唯一状态图，给每个阶段写 durable commit point：付款、道具候选生成、道具选择、资源发放、事件资格、40% 判定、事件选项、确认。事件 RNG、已出现 ID、间隔计时必须在同一事务记录。 |
| **High** | §3.3、§13.1 与现有实现（行 63–70、503） | GDD1 存档要求 `schema=2`、`rules=GDD1`、五条 RNG 流；当前 `rng.js:1` 仍为 `VERSION=1/RULES='0.3'/CONTENT_VERSION='M3-1'`，只有一个 `rngState`，`save.js:4–33` 仍按旧 0.2/0.3 迁移。 | 在设计冻结前登记精确字段和版本迁移矩阵：旧档只读摘要/独立 key；新档拒绝缺任一 RNG 流、事件窗口、保底标记或 schema 字段。不要用当前迁移逻辑冒充 GDD1 迁移。 |

## 必须修订的源码/设计接口差距

这些是设计合同与当前实现的确定差距，尚未被功能测试证明；它们必须在 F1/F2 前分开处理，不能通过改旧断言解决。

- **起手与经济不一致。** GDD §3.1、§9.1（行 33、397）规定正式 12 实例、70 次运行、付款总额 7125 和明确券投放；`game.js:35` 仍以 10 个 prototype 实例开局，`content.js:580–586` 的阶段仍是旧公式 `30+i*24+i*i*5`，与 70 轮/新付款表不同。
- **候选算法不一致。** §8.1（行 372）要求按稀有度层抽样、三槽不同 ID、阶段 common 保底和 product/晶体保底；`game.js:36` 只是把 `formalSymbolIds` 洗牌后取三项，没有稀有度层、保底字段、阶段窗口或独立 symbol-offer RNG。
- **道具候选算法不一致。** §8.2（行 372）要求按付款序号稀有度层抽三张未拥有道具并允许放弃；`game.js:37` 直接取 `Object.keys(G.items).filter(...).slice(0,3)`，没有抽样或放弃命令。当前 `content.js:500–568` 只给一部分道具接上效果，且仍包含 `item_salvage_pump` 占位。
- **事件没有交互闭环。** `content.js:569–578` 只有八个 ID/名称/描述；`game.js:39–46` 没有 `EVENT_CHOICE`、事件资格、40% 抽样、A/B 事务、恢复或事件 modifier。GDD 明确说“仅显示叙述不算实现”（行 350）。
- **当前 UI 仍是原型反馈。** `main.js:1–3` 直接渲染静态格子、文字账本和按钮；没有 GDD §10 的滚轮时序、分层动画、贡献归因、事件界面、完整图鉴、失败诊断、pending 与实际现金的完整呈现。它可以继续作为原型，但不能作为设计验收。
- **内容效果仍有已写明的近邻冲突。** `content.js:386` 的 `cargo_rope` selector 是 `area:'row'`，而 GDD §5.E/§5.I（行 173、247）要求邻接；`content.js:393` 的 `return_station` 直接监听 consume reward，没有 GDD 要求的“cargo source、product、池≤20、轮末汇总”闭合条件；`content.js:379` 的 `pitch_fork` 虽是邻接，却没有进入统一 phase 表。报告只记录差距，不改代码。
- **阶段义务与版本状态只是局部原语。** `advance_stamp` 定义在 `content.js:431`，验证在 `validation.js:20–26、106`，但当前实现仍把 paymentIncrease 写成 8，与 GDD1 表中 `advance_stamp` 的设计文字“配额 +12”（行 222）冲突；GDD 后面的迁移表又写义务 8→12（行 515），同一文档内部未统一最终值。必须选择一个正式值并在效果、UI、schema、纸算中一致。
- **阶段奖励/事件时序未实现。** `game.js:42` 选择道具后直接进入下一阶段并清空 `stageState`，没有固定券发放、事件判定、事件状态或“第10期不发第10个道具”的显式合同；`itemChoices` 在此也没有不足三项/放弃路径。

## 时序和归因的专项判断

### 步骤 4/5 快照混用

这是必须修的规则缺陷，不只是措辞问题。GDD 同时说“普通加值统一读步骤 4 快照”（§4.2 步骤 4），又单列 `cargo_rope` 为步骤 4、把邻接数值加法放到步骤 5，并让 `alignment_cloth` 依赖运行时 `tagAdded` 日志（§5.I、§6.1）。最小可执行合同应至少定义：标签预处理是否先于年龄；年龄/事件 modifier 是否能产生新类型；出现效果选目标是否锁定；邻接 add 是否重新筛选活目标；被锁定目标死亡后的金额是否保留。当前文档不足以让两个独立实现得到同一 ledger。

### 轮历、fog modifier 与 fog_stitcher

文档已指出 GDD1 有意改变旧 M3 年龄规则，但没有把三个“额外推进来源”合并成一个排程器。若同一 UID 在自然成熟后仍被轮历或 fog modifier 处理，必须明确是否消耗次数；若 `fog_stitcher` 先处理另一个 plant，板位顺序也会影响转换。建议用 `{uid, naturalMatured, extraAgeConsumedBy:[calendar,event,stitcher], epoch}` 的纸面记录，规定每个 source 独立额度和成熟后的失效时刻。

### 计数道具重入

§6.1 说计数阈值按真实事件记、达到阈值只奖励一次，但没有说明同一 hook 的 callback 是否可以再次触发同一 hook。`resolver.js:134–162` 的 `itemEvent` 会在回调中执行 item action，`game.js:4–18` 通过窗口计数预占避免部分重入；这仍不足以定义跨 `transform → boardChange → transform`、`consume → destroy` 的统一顺序。必须给每个 item hook 一条“先验证目标、预占次数、执行 action、派生事件是否可重入”的事务规则。

### 事件目标承诺和 40% 抽样

§7.1 已正确写出“先资格集合、再 40%、再事件 ID、保存选项”，但资格、A 成本和目标资格尚未分层；§5.K 的算例把“假设选中事件”写成具体流程，容易被误读为触发保证。建议给 `eligibleForAppearance`、`eligibleForA`、`eligibleTarget` 三个集合和各自的 RNG 消耗表，明确资格为空时不消耗 40% RNG，A 失败不重抽事件 ID。

## 可达性、经济与概率

- **64/32/8 的静态可达性成立，玩法可达性未证明。** GDD 的正式表有 64 symbols、32 items、8 events；阶段 1–4 Epic 为 0%，但后期 Epic 有非零层，理论上可达。道具没有 Epic 层，32 件都依赖 9 次付款中的候选暴露和未拥有过滤；没有模拟不能声称每件在普通局有实际可见机会或路线所需组合能在阶段 6 前成型。
- **起手经济纸算有算术不一致。** §9.1（行 397）写保守阶段路径第 4 期只有 198，随后称加上低现金回执最多 80 和鸣片协同最多 26 后“最多 304”。按该段给出的数值是 `198+80+26=304`，这一步算术本身成立；但前一句又把同一段阶段目标描述为 167 收入，`167+80+26=273`。必须明确 198 是阶段余额/收入还是另一口径，否则“仍低于 320”的反例无法复算。
- **common 期望值 2.16/.75 在当前表的特定假设下是对的。** 早期 common 层有 24 个、后期有 24 个，三槽最多抽 3 个且不重复 ID，因此层不会耗尽；若每槽独立按同一阶段层概率抽、只在定义层内无放回，期望 common 数仍为 `3p`，即 2.16 或 0.75。它不是缺陷，但应把“无层耗尽、无保底覆盖、每槽同一 p”写出来；一旦保底占槽或层空回退，必须单独给条件概率，不能把该均值沿用到保底窗口。
- **邻接纸算是概率，不是保留保证。** §8.4 的 28.95% 是满盘随机位置下两个实例邻接的几何概率；保留两件只提高两者同盘，不改变该邻接概率，除非新增位置约束。建议把“同时出现率”和“同时邻接率”分成两列。
- **经济与供料存在明确待模拟风险。** §9.3 自己把均值目标路径算出最终余额 1595，也指出无成型路径第 6 期失败；这说明配额可能过宽或过窄，不能从纸算推导正常胜率。消耗奖励不吃倍率、稀有塔/邮戳的价值和事件拒绝率仍需按 §13.3 的 Bot 与真人门禁验证。

## 成熟游戏事实与本项目差异

本次能实际抓取并核对的公开来源支持以下有限事实：

- [Balatro PlayStation 官方页](https://www.playstation.com/en-us/games/balatro/)称其为 poker-inspired roguelike deck builder，使用有效 poker hands、改变玩法的 jokers、decks/tarots/planets/spectral cards/vouchers，并以 blinds/ante 作为推进目标。GDD 借鉴的是“构筑部件改变计分协同”的高层关系；本项目没有扑克手牌、blind 或商店，差异明确。
- [Slay the Spire Steam 页](https://store.steampowered.com/app/646570/Slay_the_Spire/)公开写明 roguelike 与 card game 融合、每局选择卡牌、发现 powerful relics、不同路线/敌人/事件。GDD 借鉴“选择塑造构筑、遗物改变策略”，没有照搬战斗、地图和敌人意图。
- [Monster Train 官方 clans 页](https://www.themonstertrain.com/clans)公开展示多个 clan、单位与跨体系身份；页面内容也明确描述不同 clan 的主题和独特机制。GDD 借鉴“身份/路线与跨体系组合”，没有照搬楼层战斗或 clan UI。
- Luck be a Landlord 的 Steam 页本次抓取失败，不能把未重新核验的页面内容写成当前审计的独立事实。GDD 已给出 URL，但本次只能把“该来源待复核”列为研究限制；不能用相似概念证明其成熟机制或本项目可玩性。

这些来源只能证明公开产品页所述高层机制和本项目的差异，不能证明 GDD 的 64/32/8、配额、掉率、胜率或体验已被成熟游戏验证。GDD 第 2 节对此已有正确的限制性表述。

## 待模拟/试玩风险，不应在 F0 伪称已成立

1. 9 次道具机会面对 32 件、且每件只能拥有一次，路线窄件（轻秤、安瓿架、定位针、margin lantern 等）的暴露率、被选率和实际贡献未测。
2. 起始 12 件的自然成熟迁移、低现金条件、压力释放和独立奖励可能让第 3–6 阶段方差远大于均值表；需要按 seed 分层报告 P10/P50/P90/P99，而不是平均收益。
3. 两件保留、随机位置和八邻接的组合价值未测；不能把 28.95% 几何概率当作路线稳定性。
4. 事件 A 成本、B 拒绝机会成本、池稀释和阶段间隔会改变事件接受率；当前没有事件实现或数据可用来估计。
5. copy/tag/成长/压力的多层因果可能形成“单遍快照”的板位偏差；需要至少 10 个四定义以上手算组合，再做训练/留出模拟。
6. 离线 `file://`、localStorage、导入封套和五流 RNG 的实现成本与浏览器差异尚未验证。当前代码只有一个 `rngState`（`rng.js:1`），不能据此承诺 GDD 的复现隔离。
7. 当前文档说“失败须展示缺口、最近五轮均值、池大小和关键件抽中次数”（§1），但当前 UI 只显示阶段、现金、配额、轮数、券、种子和最近账本（`main.js:1`）；可诊断失败体验仍是产品风险。

## 最小 F0/F1 修订清单

在批准设计前，至少应：

1. 统一步骤 2–9 的 phase 表，逐个列出 64 符号、32 道具、8 事件的判定窗口、目标锁定、重筛选、死亡和 RNG 消耗。
2. 决定 `advance_stamp` 的最终义务值（文中同时出现 +8 与 +12），并统一 §5.H、§5.K、validation 目标和迁移表。
3. 补齐事件 A/B/资格/恢复/容量状态图，以及满池候选、刷新次数、道具放弃和保留相邻性的事务规则。
4. 把当前实现差距作为迁移合同：新版本 key/schema/RNG 字段、旧档只读策略、正式起手池、付款表、候选层和道具/事件投放。
5. 修正或解释经济纸算的口径，给出 common 保底覆盖时的条件概率，而不是只给非保底均值。
6. F0 后再按 §13.3 做功能、经济和性能验证，最后做至少 3 位玩家、每人 3 次的试玩；在这些门禁完成前，不宣称平衡、可达性或成熟游戏验证。



## 复核：designer 修订后的 F0 规则闭合结论

本节为后续修订复核，保留初审记录，不删除历史判断。复核对象是当前完整 `GAME_DESIGN_V1.md`，尤其是新增的 §4.1 刷新/满池规则、§4.2 步骤 3–5、§5.I.1 完整 phase 登记、§5.J 年龄状态表、§5.K 事务提交点、§6.1 格尺初始资格、§7 事件 A 可确认资格和 §8.1/§8.4 概率与保留说明。

### 初审误报的纠正

- **`advance_stamp` 的 +8/+12：不再判为 GDD 内部矛盾。** §5.H 的 +12 是 GDD1 最终值；§5.H 的强度调整说明和 §13.1 的“8→12”明确描述旧值迁移到新值。当前源码仍为旧 +8，这是 F1/F2 的迁移实现差距，不是 F0 设计歧义。初审中将其列入“必须修订规则缺陷”是误报。
- **起手经济的 198/167：不再判为算术矛盾。** §9.1 已明确 198 是第 3 期结余 31 加第 4 期收入 167 后、支付第 4 期前的阶段余额；`31+167=198`，再加低现金回执上限 80 与鸣片协同上限 26 得 `304`。初审中以 `167+80+26=273` 作为冲突口径是不成立的，已纠正。
- **common 期望值：不再判为缺陷。** 在“层未耗尽、三槽不重复 ID、无强制槽覆盖、每槽按同一层概率抽”的限定下，三槽 common 期望确为 `3p`，即早期 2.16、后期 0.75。GDD 已在 §8.1 补充强制槽时的 `1+2p`、层耗尽/多保底时改用条件概率。它是清楚的纸面近似条件，不是规则漏洞。
- **schema/five-RNG：不再作为 F0 设计失败。** §3.3 已定义目标字段和隔离要求；当前只有一个 RNG 流、旧 schema 和 M3-1 版本属于实现迁移工作，留在 F1/F2 工程门禁，不影响 F0 规则合同闭合。
- **Luck be a Landlord 研究事实：限制更新。** GDD 已记录本次 Steam 直接抓取限制；主审另以 Steam 搜索核对了该产品页的 slot、rent、symbol interaction、item-build 高层定位。报告不再把它写成“无高层事实”，而是保留“直接全文抓取失败、不得据此声称精确成熟参数”的限制。

### F0 复核结果

**F0 规则闭合：PASS（设计审查范围内）。** 修订后已给出可执行的主时序、年龄来源顺序和共享状态、邻接加值 phase、目标锁定/不补选、初始格尺资格、事件 durable commit point、事件 A 确认资格、满池 skip/选择规则、`choiceRefreshesUsed` 持久字段、保留不保证邻接、保底覆盖概率口径，以及 64/32/8 的 phase 分组。F0 PASS 只表示规则合同足以进入纯代码工程；不表示实现、经济、性能、美术、配乐或真人体验已经通过。

### F0 后仍需精确替换的两项小歧义

这两项不阻塞 F0，但建议在 GDD 冻结版再做文字收口，避免两个实现者产生不同字段：

1. **§5.I.1 的 age phase 标记。** A 组把 `mist_pouch`、`dew_lantern` 列在 `appearance-snapshot`，但 §4.2 步骤 3 和 §5.J 明确它们的 `age` 是步骤 3 生命周期动作。建议将 A 组首项替换为：`mist_pouch`/`dew_lantern`/`brine_strip`/`cloudy_negative` = `age`（步骤3，按共享 maturedThisSpin 记录）；`amber_frond`/`root_ledger` = `lifecycle`；`fog_stitcher`/`item_dew_calendar`/`event_fog_shift` = `age-modifier`。这样不会把年龄转换误读为步骤4普通出现。
2. **§5.I.1 的道具“或”标记。** `pitch_marker`、`nursery_scale`、`offcut_chute`、`jar_rack`、`registration_pin` 等仍以“pre-draw或lifecycle”或“end-summary/reservation”合并登记；这不是行为冲突，但不是单一可执行 phase。建议为每件道具拆成 `activationPhase`、`targetSelectionPhase`、`commitPhase` 三列；例如 `item_registration_pin`=`lifecycle(copy success)`→`reservation(step8)`，`item_jar_rack`=`lifecycle(first crystal transform)`→`reservation(step8)`, `item_nursery_scale`=`pre-draw`, `item_offcut_chute`=`lifecycle(first eligible consume)`, `item_pitch_marker`=`preprocess/tagAdded`→`end-summary`。若保持现有文字，也必须在工程 schema 中固定同样的枚举映射。



## 最终复核：F0 结论与 GDD hash

最终 GDD 已由 `gdd-final-editor` 完成 §5.I.1 修订；本次复核只读取该节与 §12，并核对正文对应规则。SHA256：`1BF2F5D8D40A2C023E9C5B2F0B8DD1221A6A01BED5BF1D82EEDCF14FB0F9F0B3`。

### §5.I.1 指定项复核

- 生命周期回调已明确为父效果成功后的**立即、有界回调**，不延迟到统一步骤 6。
- `copper_burr` 已登记为步骤 4 appearance；`root_ledger` 已登记为转换成功后的 lifecycle，结合正文只在 plant 转换事件中成长，不把它解释成 age 或 product 条件。
- `item_fraction_gauge` 已登记步骤 1 初始资格，并在每次 board/type/tag/liveness 变化后检查，带 reservation、回滚和防重入规则。
- `item_pressure_index` 已登记步骤 4–6 实际压力增加后的即时追加，明确预置压力不触发、附加压力不递归触发。
- `item_shared_metronome` 已登记 Spin 初始化，阈值从 3 到 2，当前计数不追溯触发。
- `event_copper_queue` 与 `event_boiler_test` 已明确确认事务内立即提交，直接效果使用 `cause=event` 且不触发运行监听；其余事件也按 choice/commit、modifier 或 end-summary 登记。
- 四个标签相关符号 `phase_chip`、`transit_seal`、`split_register`、`alignment_cloth` 均已列入 `step2/tagAdded`，并明确真实新增标签、记录顺序和即时对齐行为，没有发现遗漏。

### §12 工程豁免复核

§12 已明确第一工程阶段只验收功能 UI、状态反馈和可核对日志；占位图形、正式 SVG、滚轮动画、音效和背景音乐后置，并且不改变逻辑、RNG、存档或日志验收。因此，在用户授权的纯代码工程范围内，未完成正式美术或配乐不构成 F0/F1 功能阻碍。

### 最终结论

**F0 规则闭合：PASS。** 最终版足以进入纯代码工程。该结论只表示设计合同、时序索引和工程豁免已经闭合；不表示实现、平衡、性能、可达性、视觉资产或真人体验通过。实现阶段仍必须建立 GDD1 独立 schema、五流 RNG、正式起手/付款/候选/事件系统及对应证据，不能复用旧 M3-1/602/602 作为 GDD1 验收证明。



## 最终复核覆盖修正（superseding hash）

最终 GDD SHA256 已重新核对为 `E33E1699AED464CD656ABC2344D9E68BE92A7238DA482F9861E5E67DEDC8DF07`。此前复核记录中的旧 hash `1BF2F5...` 仅保留为历史复核轨迹，本结论以本 hash 为准。

最终 §5.I.1 覆盖检查通过：

- `step4/appearance` 已补齐完整 appearance 集合，并明确加入 `copper_burr`；年龄型符号仍单独归入 `step3/age`。
- 生命周期回调明确为父效果成功后的立即、有界回调；`root_wrap` 覆盖任意阶段成功转换的存活 plant，且不要求 product。
- `item_fraction_gauge` 在 `step1/draw` 检查初始资格，并在每次 board/type/tag/liveness 变化后检查，具备 reservation、回滚和防重入语义。
- `item_pressure_index` 覆盖 step4、step5、step6 的实际压力增加，并对同一事件目标即时追加 +1；预置压力与递归追加均被排除。
- `item_shared_metronome` 在 Spin 初始化时设置 cycle 阈值，当前计数不追溯触发。
- `reserve_facet` 与 `feed_valve` 的结构性压力增加和 step7 释放边界已分开；`feed_valve` 不被错误登记为自身释放效果。
- `event_copper_queue` 与 `event_boiler_test` 均为 choice/commit 即时事务，直接效果带 `cause=event` 且不触发运行监听。
- `phase_chip`、`transit_seal`、`split_register`、`alignment_cloth` 四个 tag 相关符号均已列入 step2/tagAdded，并定义真实新增标签和即时对齐顺序。

§12 已明确第一工程阶段豁免正式 SVG、滚轮动画、音效和背景音乐，只验收功能 UI、状态反馈和可核对日志；这符合用户授权的纯代码工程范围，不构成 F0 阻碍。

**最终 F0 结论：PASS（设计规则闭合范围内）。** 该结论不等同于实现、平衡、性能、可达性或真人体验通过；这些仍属于后续工程和验证门禁。完成本节后停止编辑。
