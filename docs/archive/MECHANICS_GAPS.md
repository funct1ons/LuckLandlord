# 机制正确性审计：M3/M4 正式内容

审计范围：只读核对 `docs/CONTENT_MATRIX.md`、`docs/BUILD_IMPLEMENTATION.md`、`js/data/content.js`、`js/engine/resolver.js`、`js/core/game.js`、`js/ui/main.js`、`tests/simulator.js` 及 fixture 报告。本文不调平衡，不重复原型 fixture 的全部旧问题；只记录正式内容的真实执行缺口。

## 结论先行

64/32/8 的**定义计数**存在，但不能视为功能完成。`content.js` 的正式符号由 `kind` 映射为少数通用占位效果；resolver 只实际执行 `add/grow/multiply/globalMultiply/tag/consume/destroy/transform/age/spawn/risk/condition/copy`，且 selector 只有 `self` 或 `adj:<单标签>`。`game.js` 的道具总线没有独立实现，只有 5 个 ID 子串分支；事件没有资格、选项、成本、modifier、保存或提交路径。`BUILD_IMPLEMENTATION.md` 已承认这些缺口。

### M3 必要原语状态

| 原语 | 现状 | 证据 | 影响 |
|---|---|---|---|
| 事件 payload/成功原子动作 | 缺失 | consume 直接 `reward += amount`，ON_CONSUME/ON_DESTROY 没有结构化 cause/source/target 快照；event 只有定义数组 | 消耗、销毁、转换监听无法按原因与目标标签正确区分；独立奖励会混入错误事件 |
| 道具总线 | 缺失 | `s.items` 只在 spin 后由 `item.includes(...)` 检查 5 项；无 itemId 归因、窗口计数、阶段/保存钩子 | 32 件道具只有定义文本，不能持续执行 |
| 计数/冷却/阶段窗口 | 部分存在但不通用 | 实例仅有 `counters:{}`；只有 `age` 写入；没有 perSpin/perStage/perSource/perTarget 限制与持久窗口 | “第 N 次”“每轮一次”“每阶段首次/第三次”、蓄压、成长阈值均无法可靠实现 |
| 选择/复合谓词 | 缺失 | `targets()` 只支持一个 scope+tag；无 count/order/tagsAll/excludeSelf/池/空格/现金快照/事件谓词 | 单目标、异类数量、同排、池内、阶段现金等均被占位或误算 |
| 锁位/加权无放回 | 缺失 | `G.choices()` 是正式 ID 的均匀 `shuffle(...).slice(0,3)`；无保留格状态 | switch_lamp、jar_rack、registration_pin、权重道具、事件保底不能执行 |

## 64 个正式符号逐项核对

表中“实际路径”指当前代码真实执行；“最小验收”是后续 worker 应能写成固定盘面断言。

### A 培育（8）

| ID | 声称效果 | 实际路径 | 缺口 | 最小验收 case |
|---|---|---|---|---|
| mist_pouch | 第3次上盘转 dew_lantern | kind=grow，ON_APPEAR age threshold=2，目标被硬写为 dew_lantern | 阈值错为2；计数虽写 age 但无“第3次”契约 | 同一 UID上盘3次：前2次存活，第三次转 dew_lantern且仅一次 |
| wick_bed | 基础产出 | 无 effects，resolver ledger 基础值 | 基本可执行；无正式候选/标签之外的附加缺口 | 抽中后 ledger=2，tags含plant/fuel |
| dew_lantern | 第2次转 amber_frond | kind=grow threshold=2，但通用 age 目标映射会在 dew_lantern 上转 amber_frond | 仍需确认转换轮不重触发 ON_APPEAR；当前无独立转换窗口 | 上盘2次转 amber_frond，转换轮不再获得 appear bonus |
| amber_frond | 自身被消耗独立奖励4 | kind=consume→ON_CONSUME add scope event amount4；consume handler 另直接 reward amount | 目前没有“自身被消耗”目标快照/单次奖励边界，且 `consume` 只会由其他 effect 触发 | 消耗 amber_frond：普通产出0、reward恰4、只触发一次 |
| fog_stitcher | 邻接plant age额外+1，每轮1 | kind=adjplant→邻接 plant add2 | 这是现金+2，不是 age 步进；无限目标/无每轮限额 | 一个相邻 mist_pouch：额外 age+1，跨阈值只转一次 |
| root_ledger | 每次plant成功转换自身永久+1，每轮最多2，上限30 | kind=convertgrow 未被 make 处理，effects为空 | 完全未执行；无转换成功事件、限额、软上限 | 两次 plant转换永久+2，第三次本轮不增，超过30封顶 |
| warm_pod | 邻接fuel时自身+3，否则基础 | kind=fuelfour 未被处理，effects为空 | 完全未执行；无邻接条件 | 有/无相邻fuel分别为4/1 |
| nursery_gauge | 至少2 plant成功转换时全盘plant×3/2，每轮一次 | kind=plantmult→ON_ADJACENT multiply adj:plant，无转换计数，且目标全邻接 | 条件、全盘、每轮一次均缺失，效果形态错误 | 两个plant成功转换后所有存活plant各×3/2；仅触发一次 |

### B 回收（8）

| ID | 声称效果 | 实际路径 | 缺口 | 最小验收 case |
|---|---|---|---|---|
| ash_felt | 被消耗生成copper_burr；第3次上盘存活则自毁奖励3，互斥 | kind=consume只声明ON_CONSUME add4 | 无spawn、无第3次、自毁、互斥原子组；奖励值也不是设计的3/生成毛刺 | 先消费：只生成1 copper_burr不自毁；未消费第3次：自毁reward3无普通产出 |
| sorting_tong | 消耗一个邻接scrap，独立6；无目标保底1 | consume target adj:scrap amount6 | resolver遍历所有匹配目标；无默认限1、无无目标保底 | 两个scrap相邻只消费位置优先一个；无目标reward=1 |
| copper_burr | 邻接machine自身+2 | machadd→邻接machine add2 | 目标方向反了：应作用自身，当前给machine加值 | copper_burr邻接machine时自身+2，machine不变 |
| spent_gasket | 负基础、禁候选 | 无effects；choices过滤排除 | 基础/候选规则可见，但生成原因与污染替代未实现 | 正常choices永不含；risk生成后下轮可见并带junk |
| sieve_drum | 邻接junk转copper_burr，每轮一次 | junkconvert→转cleared_stub | 产物错；无每轮一次 | junk→copper_burr且UID/permanent规则正确，第二次无动作 |
| heat_clerk | scrap消耗成功后永久+1/轮，上限30 | scrapgrow 未被处理，effects为空 | 完全未执行，且需目标标签scrap而非消费源标签 | 同轮2次scrap consume仅+1，跨轮可再+1，封顶30 |
| clinker_router | 每轮销毁邻接junk；监听非消耗destroy给pressure蓄压+2 | junkdestroy仅ON_ADJACENT destroy | 无pressure监听、cause过滤、每轮限额、目标优先 | destroy junk无consume reward，合法pressure恰+2；consume引起destroy不触发该监听 |
| furnace_auditor | 至少2种scrap成功消耗时全盘machine×3/2，一次 | scrapmult→ON_ADJACENT multiply adj:machine | 无成功事件、不同type计数、全盘与一次性；方向/范围错误 | 两种scrap成功consume后所有machine×3/2；同type两件不满足 |

### C 共振（8）

| ID | 声称效果 | 实际路径 | 缺口 | 最小验收 case |
|---|---|---|---|---|
| dock_chime | 同排其他resonance不同type数，最多+3 | rescount→ON_APPEAR add2占位 | 无同排、排除自身、type去重、上限；固定+2错误 | 同排2种其他type时+2，第四种仍最多+3 |
| pitch_fork | 一个邻接resonance+3，排除自身 | adjres遍历所有邻接resonance，各+3 | 默认限1缺失 | 两个邻居只给位置优先一个+3 |
| fog_reed | 一个邻接mist非自身时自身+3 | adjmist给邻居mist+3 | 方向错误、无“自身加值”、无单目标 | 自身+3，邻居不变 |
| beat_spool | 第3次上盘+9并重置 | cycle仅占位add2 | 周期计数、阈值、重置缺失 | 第1/2次无+9，第3次+9，第4次重新计数 |
| chord_frame | 邻接至少2种其他resonance时一个邻居×2 | resmult给所有邻接resonance×3/2 | 条件、ratio、单目标错误 | 两种其他type满足时一个邻居×2；一类不触发 |
| prism_hum | 邻接crystal时自身+4 | adjcrystal给邻居crystal+3 | 方向/数值错误，转换获得不重触发未实现 | 自身+4，直接/转换时点边界正确 |
| silence_keeper | 所在排恰1 resonance时自身+10 | sparse占位自身+8无排条件 | 条件错误 | 只有自身一resonance时+10；有第二个不加 |
| harbor_conductor | 同排至少3种resonance时该排×2，一次 | resmult仅邻接×3/2 | 同排/全排/类型/倍率/次数均缺失 | 同排3种不同type全部×2且不重复 |

### D 蒸馏（8）

| ID | 声称效果 | 实际路径 | 缺口 | 最小验收 case |
|---|---|---|---|---|
| brine_strip | 第2次上盘转saline_ampoule | grow threshold=2，但 make 的 grow 目标映射包含此ID | 目前阈值正确性需明确“第2次”；通用转换事件仍缺payload | 两次上盘转安瓿且不重触发appear |
| saline_ampoule | 基础产出 | 无effects | 基础可执行 | ledger=2 |
| condense_coil | 转邻接feedstock→tide_prism，每轮一次 | feedconvert transform，无限次数 | 无每轮限额、无默认单目标 | 两个feedstock只转一个，位置稳定 |
| tide_prism | 转换成为本类型时本轮+3，直接抽中无加 | transformadd占位ON_APPEAR add2 | 无转换来源判断；直接抽中也+2错误 | 转换得到+3，直接抽中+0 |
| deep_still | 消耗一个邻接mist，独立4，并池生成安瓿 | consumemist consume4 | 无spawn、无单目标、生成失败记录 | 成功消费1、reward4、下轮池新增安瓿 |
| crystal_index | crystal至少2种type时自身+6 | crystalcount占位+2 | 无全盘去重type、方向/值错 | 两种crystal type时+6，同type不触发 |
| pearl_separator | 转换邻接非product crystal→tide_prism | crystalconvert未处理，effects为空 | 完全未执行；无排除product | blank_facet可转，tide_prism不可转 |
| reserve_facet | 消耗fuel蓄压+2上限6；达6阶段末reward18归零 | fuelpressure给邻接fuel+3 | 方向、consume、counter、阶段释放、上限全缺失 | 两次fuel达到4不释放；第三次封顶6，阶段末reward18归零 |

### E 货运（8）

| ID | 声称效果 | 实际路径 | 缺口 | 最小验收 case |
|---|---|---|---|---|
| cargo_rope | 一个邻接product+3 | adjproduct给所有邻居+3 | 默认单目标缺失 | 两个product只一个+3 |
| route_stub | cargo至少3种type时自身+4 | cargocount占位+2 | 条件、去重、数值缺失 | 3种cargo+4，2种无额外 |
| parcel_cage | 空格至少4时自身+3 | empties占位+2 | 空格与池大小未计算、数值错 | 4空格+3，3空格无加 |
| sorting_runner | 消耗product，reward=6+目标基础值 | consumeproduct未处理，effects为空 | 完全未执行；目标基础快照缺失 | 消耗base4 product reward10且普通产出0 |
| manifest_desk | cargo≥4种时自身×3 | cargomult邻接cargo×3/2 | 条件/方向/倍率错误 | 4种cargo自身×3，否则基础 |
| switch_lamp | 下一轮保留邻接product，限额2 | reserve占位+2 | 无锁位/下一轮/全局2格 | 被保留实例原格出现一次；满2不延长 |
| transit_seal | 预处理选择邻居最多的plant/crystal/resonance临时标签 | wildtag占位+2 | 临时标签预处理、选择优先级、标签生命周期缺失 | 同数按plant→crystal→resonance；运行后池标签不变 |
| return_station | 邻接cargo源成功消费product后阶段末池≤20 reward8 | returnreward占位+2 | 无事件因果、池快照、阶段末/一次性 | cargo邻居消费product后且池≤20 reward8；其他消费不触发 |

### F 蓄能（8）

| ID | 声称效果 | 实际路径 | 缺口 | 最小验收 case |
|---|---|---|---|---|
| pressure_pouch | 每次上盘蓄压+1，4时+10归零 | pressure ON_APPEAR add3现金 | 蓄压计数/阈值/独立奖励缺失 | 上盘4次reward10且counter归零，普通值不改 |
| feed_valve | consume fuel，reward3，蓄压+2，6时reward14 | fuelpressure邻接fuel+3 | 方向、消费、counter、阈值错误 | 成功消费后fuel消失、reward3、pressure+2 |
| pause_dial | ON_APPEAR +1可复制；邻压另+2不可复制 | copyadd仅ON_APPEAR add2 copyable | 值错；邻压分支缺失；复制白名单错误 | 直接+1；读头最多复制+1，不复制邻压+2 |
| surge_vessel | 每次上盘蓄压；未到3普通产出0，3时reward16仍普通0 | release ON_APPEAR add5 | 延迟普通产出、counter/reward缺失 | 1/2次ledger普通0；第3次reward16、普通仍0 |
| cracked_regulator | 3/4 +8，1/4 -6并生成gasket，每轮一次 | risk ON_APPEAR chance.75 amount8 loss-6 | 无每轮一次、失败生成、cause/污染处理 | 固定RNG成功+8；失败-6且下轮有spent_gasket |
| safety_shim | 首次邻压风险失败损失减4 | riskguard未处理，effects为空 | 完全未执行 | -6风险变-2；第二次不再减；不改生成事实 |
| release_spire | 扣邻压3使目标×3，目标未自行释放才合法 | releaseboost未处理，effects为空 | 完全未执行、互斥释放缺失 | target counter≥3扣3并×3；自行释放目标不可选 |
| demand_coupler | 轮初现金不足配额且≤2次时自身×4并生成gasket | lowcash占位condition threshold50 amount4 | 无配额/剩余运行快照、倍率、生成 | 满足时×4并生成；中途现金变动不改变资格 |

### G 映印（8）

| ID | 声称效果 | 实际路径 | 缺口 | 最小验收 case |
|---|---|---|---|---|
| phase_chip | 按邻居最多选择临时 resonance/crystal | wildtag占位+2 | 无临时标签选择与预处理 | 有resonance优先获得临时标签，运行后不改池 |
| spectrum_pin | 邻接≥3种type时自身+4 | typediversity占位+2 | 条件/数值缺失 | 3种不同type+4，2种无加 |
| cloudy_negative | 第3次上盘转blank_facet | grow threshold2 | 阈值错 | 第3次转换，前2次不转 |
| blank_facet | ON_APPEAR +2，可复制；转换获得不触发appear | copyadd+2 copyable | 转换/直接抽中边界未建事件语义 | 直接抽中+2；转换得到不再+2；读头只可复制该+2 |
| offset_reader | 复制一个邻居白名单ON_APPEAR add，最多+8 | copy target adj:machine；resolver copy遍历目标effects并把add加到自身 | 无白名单、单目标、+8总限、copy成功事件 | 两个邻居仅择一；复制值最多8且不递归 |
| alignment_cloth | 邻居临时加标签实例+5，每轮一次 | tagbonus占位+2 | 无tagAdded事件、方向、限额 | 临时标签成功者存活时+5；原有标签不触发 |
| echo_plate | 邻居永久成长实际值×4，每轮最多2 | growbonus占位+2 | 无ON_GROW payload/实际增长/限额 | +2成长使echo+8，第三次不再加 |
| split_register | 邻product临时+resonance+crystal，普通×3/2，一次 | productmult邻接product×3/2 | 无标签预处理、全效果/一次性 | 一个product同时满足两标签并×3/2，池标签不改 |

### H 契约（8）

| ID | 声称效果 | 实际路径 | 缺口 | 最小验收 case |
|---|---|---|---|---|
| arrears_slip | 负基础、禁候选 | 无effects；choices过滤排除 | 生成/借支事件未实现 | 正常候选排除；事件生成后可入池 |
| lean_receipt | 轮初现金<配额一半时+4 | lowcash condition threshold50 amount4 | 固定50替代动态配额/轮初快照；值错 | 配额100、轮初49+4；轮中降到49不改变资格 |
| compliance_desk | junk→cleared_stub，每轮一次 | junkconvert→cleared_stub | 无每轮限额/默认单目标 | 一个junk转stub；第二个本轮不转 |
| cleared_stub | 非转换获得自身+1；转换轮不加；appear+1可复制 | copyadd ON_APPEAR +2 copyable | 转换来源判断缺失；值错 | 直接抽中+1，转换得到+0，读头只复制+1 |
| cancellation_clerk | consume junk reward5且成功永久+1，上限30 | consumejunk未处理 | 完全未执行 | 成功消费一次reward5并+1；无目标不增长 |
| quota_margin | 轮初不足配额且差≤15时+6 | lowcash固定threshold50 amount4 | 无差额条件、值/倍率错误 | payment100 cash85+6，cash84无加 |
| advance_stamp | 阶段首次上盘可接受：reward18、配额+8、生成欠条 | stagebonus占位+2 | 无READY配置、阶段首次、选项、配额修改/生成/持久保存 | 接受后公开payment+8并入池欠条；拒绝只基础值 |
| settlement_beacon | pool junk=0且contract≥3种时contract×2，一次 | cleanmult邻接contract×3/2 | 无池/类型条件、全盘/倍率/一次性 | 条件满足所有contract×2；有junk或少于3种不触发 |

## 32 个持续道具逐项核对

`G.items` 只保存 `{id,name,rarity,description,hook}`；`hook` 循环写为 draw/resolve/choice，并没有按 hook 分发。`game.js` 结算只实现以下 5 个子串：`dew_calendar` 只要 live 中有 plant 就每轮+1（没有“第一个有age”）；`sorting_apron` 只要 live 有 scrap 就+3（不是首次成功consume）；`clean_mesh` 无junk则+2（不是junk权重×1/2）；`manifest_clip` cargo type≥2就+6（规格≥4）；`low_balance_tab` 轮中结算时读当前 cash<payment/2（规格轮初）。其余 27 件没有执行路径。

| ID | 声称效果 | 实际路径 | 缺口 | 最小验收 case |
|---|---|---|---|---|
| item_dew_calendar | 每轮第一个有age plant额外推进1 | live有plant即itemBonus+1 | 不推进age；不限定第一个/有age；变成现金 | plant无age不触发；第一个有age只推进1 |
| item_root_wrap | 首个plant转换后存活实例+4 | 无 | 无转换成功事件 | 同轮两次转换仅首个存活产物+4 |
| item_nursery_scale | 池≤28时plant抽取权重×1.5 | 无 | 无加权抽取 | 同池固定seed plant权重按1.5生效 |
| item_frost_glass | 每阶段最先2个mist各+3 | 无 | 阶段窗口/序号 | 阶段内第1/2个mist+3，第3个无 |
| item_sorting_apron | 首次成功consume scrap独立+3 | 有scrap存活即+3 | 触发条件错误 | 无consume不奖励；首次consume只+3 |
| item_waste_log | 阶段非消费destroy junk累3给删除券1 | 无 | cause、计数、阶段上限 | 第3个非消费destroy+1，consume引起destroy不算 |
| item_offcut_chute | 首次consume非junk scrap生成ash_felt | 无 | 生成/首次/下轮出现 | 成功后池新增ash_felt且本轮不抽 |
| item_clean_mesh | junk权重×1/2 | 无junk时现金+2 | 完全错路径 | 同池junk抽取概率减半，仍在池 |
| item_lane_clapper | 每排首个resonance且该排≥2 type时+2 | 无 | 同排/type/首个 | 固定盘面每排仅首个触发 |
| item_rest_notch | 恰1 resonance的排该实例×1.5 | 无 | 排计数/倍率 | 一排1个×1.5，两件不触发 |
| item_pitch_marker | 首个成功新增临时resonance标签存活+5 | 无 | tagAdded事件 | 临时新增触发，原生resonance不触发 |
| item_shared_metronome | cycle_count阈值-1最低2 | 无 | 机制键与计数 | beat_spool阈值由3变2且不低于2 |
| item_brine_lining | 首次feedstock→crystal产物+4 | 无 | transform事件/首个 | 转换产物+4，直接crystal不触发 |
| item_fraction_gauge | 首次crystal异type≥3 reward7 | 无 | 全盘去重type/一次 | 第一次达到3 reward7，后续无 |
| item_jar_rack | 每轮首个转换crystal保留下一轮原格 | 无 | 锁位/转换事件 | 只保留首个，原格下一轮出现一次 |
| item_residue_stamp | 首个mist被consume reward2 | 无 | 成功consume事件 | 消耗mist+2，不补回 |
| item_manifest_clip | cargo异type≥4 reward6 | 代码异type≥2即+6 | 条件过低且不独立归因 | 2种无奖励，4种+6 |
| item_return_track | 阶段第1/3次主动skip各刷新券 | 无 | 主动skip计数/阶段重置 | 第1/3 skip各+1，第2/4无 |
| item_small_hold | 池12–20每轮reward5 | 无 | 池大小窗口 | 11/21无效，12/20有效 |
| item_exchange_hook | 阶段首次consume product后下次候选保底common product | 无 | 候选保底/延迟标记 | 下次候选含common product，仍可skip |
| item_pressure_index | 每轮首个正常蓄压额外+1不越上限 | 无 | counter增量事件/防重入 | 首次+1，附加+1不再次触发 |
| item_insulation_shawl | 首次pressure risk失败损失减3 | 无 | 风险失败事件 | -6→-3，仅首个，不改污染 |
| item_release_receipt | 阶段第3次成功释放reward12 | 无 | release计数/阶段 | 第3次+12，每阶段一次 |
| item_spare_baffle | 首个风险junk改为源本轮-3，不入池 | 无 | 风险替代/原因 | junk不入池但记录替代，源-3 |
| item_safe_carbon | 首个合法copy实际值+2，总≤8 | 无 | copy成功事件/上限 | copy4→6，copy7→8，无合法copy不耗 |
| item_spectrum_book | 首次新增原定义没有的临时标签且存活+3 | 无 | tagAdded与原定义比较 | 新标签+3，多标签仍一次 |
| item_registration_pin | 首次成功copy后保留被复制目标 | 无 | copy target/锁位 | copy失败不锁；成功占一格 |
| item_growth_negative | 首个永久成长reward=实际增长×2，最多6 | 无 | ON_GROW payload | +2成长reward4，单轮累计最多6 |
| item_low_balance_tab | 轮初现金<配额一半reward3 | 代码结算后读取当前cash | 轮初快照缺失；可能被本轮收益改变 | 初始不足即使结算后现金足仍+3 |
| item_compliance_carbon | 首次junk→非junk产物本轮+3 | 无 | 成功transform事件 | 成功转换+3，失败无 |
| item_audit_clip | 阶段首次成功付款且池无junk得删除券 | 无 | payment commit后钩子 | 付款成功且无junk+1；失败/有junk无 |
| item_margin_lantern | 阶段最后轮现金在75%至不足配额时contract×1.5 | 无 | 最后一轮、轮初现金、contract选择 | 边界75%包含；足额不触发 |

> 注：`G.items` 实际有 32 个 ID，最后一件为 `item_salvage_pump`，而矩阵正式第32件是 `item_margin_lantern`。这是内容 ID 不一致，必须先修正数据契约；不能把 salvage_pump 当成矩阵道具。

## 8 个事件逐项核对

`G.events` 只有 `{id,name,description}`。`newRun` 的 `event:null` 未被设置；付款后只有 `s.phase='ITEM_CHOICE'`、物品候选和 `stats.events+=0`；`command` 没有 event choice/accept/decline 分支；`save` 也没有事件/选项 modifier schema。因此 8 个事件均为“定义存在、执行为0”。

| ID | 声称效果 | 实际路径 | 缺口 | 最小验收 case |
|---|---|---|---|---|
| event_fog_shift | 池有plant；付8，选plant下次age+1或不参与 | 仅数组定义 | 无资格/成本/选择/一次modifier/保存 | 稳定付款后事件出现；支付8；指定plant下一次age+1 |
| event_copper_queue | 池有junk；选junk→copper_burr并加入spent_gasket | 仅数组定义 | 无事件cause、数量不变转换、事务保存 | junk数量总数不变，类型按选项改变 |
| event_silent_bell | resonance；下阶段前2轮×1/2，之后首个×2 | 仅数组定义 | 无阶段modifier/到期/选择 | 3轮固定盘面收益分别半值、半值、首个双倍 |
| event_brine_inspection | feedstock；删一个，下一候选保底uncommon crystal | 仅数组定义 | 无删除选择/候选保底/可skip | 删除后下次候选含uncommon crystal且不自动选择 |
| event_empty_manifest | 池≥21；删common非junk，下一阶段cargo+2/个最多5 | 仅数组定义 | 无池资格/受限删除/下一阶段modifier | 删除目标合法；5个cargo上限 |
| event_boiler_test | 配额+12；pressure蓄压+2，无pressure则加入pressure_pouch | 仅数组定义 | 无确认/配额保存/生成 | 新payment立即公开；无pressure时生成counter=2 |
| event_misprint_window | magic；下阶段前3轮每轮首个magic临时cargo | 仅数组定义 | 无临时标签窗口 | 每轮首个magic有cargo，第四轮无，池tags不改 |
| event_quota_recount | 下阶段配额+10、加入cleared_stub、刷新券+1 | 仅数组定义 | 无资源事务/候选生成/持久保存 | 付款后一次性三项状态原子提交 |

## Bot / Greedy 核对

| 项目 | 真实情况 |
|---|---|
| Bot是否支持删除 | **命令层支持，Bot不使用**。`G.command(remove)` 在READY/SYMBOL_CHOICE可删并扣 `removeTokens`；`tests/simulator.js` 没有 `remove` 分支，四种Bot永远不删。 |
| Bot是否支持刷新 | **命令层支持，Bot不使用**。`reroll` 可在SYMBOL_CHOICE扣券并重抽；模拟器没有调用。 |
| Bot是否支持道具 | **只被动获得随机奖励，未按道具策略执行**。ITEM_CHOICE统一随机 `reward`；只有上面5个硬编码分支在spin结算，其他道具无效果。 |
| Bot是否支持事件 | **不支持**。事件永远不进入状态机，模拟器无事件命令。 |
| Greedy是否真实推演 | **不是**。`pick()` 只按 `baseValue + owned同标签数*2` 评分，`d.baseValue<1`扣4；没有模拟后续spin、consume、转换、计数、位置、道具、事件或付款风险。“Greedy”只是标签协同权重更高的选取策略。 |
| Value/Synergy | 同一个静态评分框架；Value仅负基础值惩罚，Synergy为1.5倍同标签计数。均不读取正式效果语义。 |

## 可独立委托的实施批次

### 批次1：M3 原语与三线最小闭环（有界）

范围：resolver 结构事件 payload、稳定 selector（self/adj/row/board/pool、单目标、排除自身、稳定顺序）、counter/limit/阶段窗口、成功原子动作（consume/destroy/transform/reward/spawn）、现金轮初快照；独立 item bus（itemId归因、run/stage/spin/choice/draw 钩子、存档）；先接 A/B/D 三线 24 符号与10件指定道具。验收必须覆盖 CONTENT_MATRIX §9 的 1–6、11，并证明计数不只是定义：fixture 中 age、蓄压、永久成长、每轮限额改变状态。

### 批次2：候选控制与事件事务（有界）

范围：锁位/下一轮原格、无放回加权、候选保底/有限刷新删除、事件资格筛选与稳定节点（payload、accept/decline、成本、modifier到期、保存恢复）；先接 `event_fog_shift`、`event_copper_queue`、`event_brine_inspection`，以及 C/E/F 依赖的保留和风险道具。验收必须证明 refresh/remove/skip 真实改变资源与候选，事件不会在付款失败或终局重抽。

### 批次3：M4 内容接线与 Bot 行为（有界）

范围：P5/P6 复制白名单和临时标签、P10配额 modifier、G/H 16符号、剩余22道具和5事件；修正 `item_salvage_pump`/`item_margin_lantern` ID契约；Bot 增加真实 reroll/remove/item/event 决策接口，Greedy改为有限前瞻模拟或明确改名为静态 heuristic。验收覆盖 64/32/8 每项至少一个触发 fixture，并报告 Bot 对删除、刷新、道具、事件的调用计数。

## 数值调整建议（与功能缺失分开）

以下不是本审计的阻塞功能，只应在机制正确后单列模拟：基础值与独立奖励的相对收益；第3次/第4次成熟或释放的等待成本；倍率叠加上限；池膨胀与消费者耗材；配额增长曲线；锁位2格与权重上下限；事件借支的奖励/债额；Bot胜率和Greedy前瞻深度。当前 M5 四Bot 100%胜率只能说明现行占位经济过易，不能用来证明正式内容平衡或功能完成。

## 证据定位

- 正式数据占位映射：`js/data/content.js` 的 `make()`；多数 kind 未创建 effects，未知 kind 最终只落入占位 `ON_APPEAR add`。
- 实际动作与事件队列：`js/engine/resolver.js` 的 `handlers`、`targets`、`collect/drain`。
- 道具、候选、付款状态机：`js/core/game.js` 的 `choices/itemChoices/command(spin)`。
- UI 仅展示定义描述和删除按钮；没有事件交互：`js/ui/main.js`。
- Bot静态评分与不调用remove/reroll/event：`tests/simulator.js`。
