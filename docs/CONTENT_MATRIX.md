# 《雾港余热局》M3–M4 原创内容矩阵（设计稿 CM-0.1）

> **状态：以下 64 个符号、32 个持续道具、8 个事件以及所有路线、schema 扩展均未实现、未模拟、未验收。所有数值（含概率、次数、上限、费用和倍率）均为待模拟初稿，不代表最终平衡。**
> 输入已完整阅读：`prompt.txt`、`EXECUTION_PLAN.md`、`docs/RULES.md`、`js/data/content.js`；另只读检查 `js/engine/resolver.js`，用于核实原语缺口。M0–M2 的 core-worker 产物尚待审核，本文件不宣称其门禁通过，不修改代码或现行规则。
> 本次仅写此文件。现有 20 个技术测试符号保持原样；本表使用独立 ID，作为正式内容候选，不把测试符号冒充新增成果。最终保留/替换哪些测试符号须经审核另定，**本稿计数不包含它们**。现有维修券、校准券和凭证是一次性奖励，不计入持续道具。

> **历史范围说明：** 本文件保留旧 CM-0.1 提案，效果与数值有意不同于现行 GDD，
> 不作为今日实现报告或重新验收结论。“全部未实现”“当前”“尚未开始”等均指原写作时点。
> 现行机制规格唯一入口为 [GAME_DESIGN_V1.md](GAME_DESIGN_V1.md)；当前玩家语言按其纳入的
> [GAME_IDENTITY.md §3](GAME_IDENTITY.md#3-术语对照玩家界面统一用新词)。历史名称与内部 ID 保留。

## 1. 统一术语与边界

以下旧术语与标签字典只用于阅读历史稿，不再维护为现行玩家词表；15标签与4稀有度以分册§3为准。

- 货币称 **凭证**；城市要求称 **供能配额**；一次操作称 **运行**（代码 Spin）；牌组称 **符号池**；持续被动称 **道具**。刷新券、删除券是资源，不是道具。
- **上盘**：实例本轮被抽中；**邻接**：八方向、不跨行、不环绕；**同排**：同一横排；**全盘**：20 格中的存活实例；**池内**含本轮未上盘实例，必须显式声明。
- **消耗**：从池永久移除目标，发独立奖励，并产生消耗与销毁事件；**销毁**：移除但自身不默认产奖励；**转换**：保留实例 ID 和通用永久值，清空类型计数，不重触发出现。
- **普通产出** = floor((基础值 + 永久值 + 本轮加值) × 局部倍率)。独立奖励不吃倍率；被消耗/销毁实例无普通产出。风险损失可产生负净收益，现金下限仍为 0。
- **成长**只按实例上盘推进；**阶段**为两次付款之间的区间；“每阶段首次”必须保存已用标记；永久成长默认即时影响本轮，遵循 RULES v0.2。
- **蓄压**是实例计数，不是凭证；**频标**是本轮标签，不进入存档池标签；**履约标记**是本阶段运行记录，不改变付款规则。
- common / uncommon / rare / epic 分别译为普通 / 精良 / 稀有 / 史诗。special 只供事件产物，默认不进普通候选池；本表没有 special 稀有度，垃圾可被指定生成但禁入正常候选。
- 所有效果默认源须上盘且存活；死亡后监听只在表内明确许可并使用事件快照。道具没有位置，也不进入盘面。
- 目标数量默认 **1**，按位置后实例 ID 选第一个合法目标；明确“每个”才多目标。抢占失败不奖励、不增长、不计成功。无合法目标则不做任何副作用。
- 新生成实例只在下轮可抽；本轮转换不重新获得出现效果。禁同实例转换往返刷新次数；复制不得生成事件链或复制身份、计数、倍率、结构修改。

### 标签字典（候选扩展，未接入 G.tags）

| 标签 | 中文 | 用途 |
|---|---|---|
| plant | 雾培 | 出现成长、雾露培育输入 |
| fuel | 热料 | 可消耗的回收/蓄压供给 |
| scrap | 残料 | 回收输入，**不等于垃圾** |
| junk | 滞物 | 有负担，可删除、转换或利用 |
| machine | 装置 | 机械作用目标，不自动代表回收路线 |
| resonance | 鸣片 | 同排、邻接和频标接口 |
| crystal | 潮晶 | 蒸馏成品及跨路线原料 |
| magic | 异相 | 受限映印与临时标签 |
| contract | 契据 | 履约、现金条件、滞物利用 |
| cargo | 运件 | 夜班货运可收集的成品 |
| pressure | 压件 | 带蓄压或延迟释放功能 |
| mist | 雾料 | 轻量培育/蒸馏接口 |
| feedstock | 原液 | 可转换的蒸馏前体 |
| product | 成品 | 多体系货运/消费的共同接口 |
| support | 工具 | 支援目标，不代表任意路线标签 |

后六项为新增标签。临时标签参与本轮 selector、计数和倍率，不改变池组成/候选概率；一个实例有多个标签不算多个实例。路线标签不是独立规则字段。

## 2. 通用效果 schema 与引擎差距

### 2.1 现有基础与审核提醒

当前 content.js 有 action：`add consume destroy transform grow multiply age copy spawn tag risk condition`；trigger：`ON_APPEAR ON_ADJACENT ON_CONSUME ON_DESTROY ON_TRANSFORM ON_GAIN ON_GROW ON_END_SPIN`。当前 resolver 仅支持 self 或 `adj:单标签`，邻接动作会遍历全部匹配目标；consume 固定奖励，condition 仅现金小于阈值，age 固定阈值转换，copy 仅邻居 ON_APPEAR add。**本表的“一个目标”、组合条件、计数、道具、事件、概率控制均不能直接塞入现有 extra 字段假称已支持。**

此外当前 tags 在 ON_APPEAR 入队后执行，不是独立预处理；初始动作按 priority 排序、派生 FIFO、ON_END_SPIN 在 ledger 前执行。下列新语义必须先与 core 审核者确认时序，不以设计稿覆盖现行规则。重点核实死亡监听的源快照、触发原因、倍率精度与贡献账本，避免死亡后的普通 add 被误当独立奖励。

### 2.2 提案数据形状（不是可执行 JS）

```text
Effect {
  id, trigger, scope: self|boardEvent|runEvent,
  priority, selector: {area:self|adjacent|row|board|pool,
    tagsAny?, tagsAll?, excludeTags?, excludeSelf:true,
    count:1|all, order:positionThenUid},
  when: PredicateTree,
  action, args, limit:{perSpin?, perStage?, perSource?, perTarget?},
  eventFilter:{kind?, sourceTags?, targetTags?, cause?, rootId?},
  copyable:false, attribution:sourceUid|itemId
}
```

谓词用 `all/any/not` 组合 `count/uniqueTypeCount/cashSnapshot/poolSize/counter/event/stageSpinsRemaining`；数值表达式只开放 `constant/count/counter/min/max/add/mul`，不执行任意字符串代码。常见动作沿用现有名称；新增 `reward/counter/changeStagePayment/reserve/choiceModifier` 等必须注册并测试。模板把效果描述转为日志参数，不靠 UI 解析自然语言。

### 2.3 扩展原语索引（下文方括号标注需求）

| 编号 | 待实现通用能力 | 与现有实现的差别/约束 |
|---|---|---|
| P1 | selector：限量、同排/全盘/池、复合标签、排除自身、稳定择优 | 当前 adj 单标签会作用所有目标；默认限 1，不抽随机目标 |
| P2 | 谓词与有界数值表达式 | 类型去重、池大小、空格、现金相对本阶段配额、剩余运行数；现金固定轮初快照 |
| P3 | 保存计数、冷却、每轮/阶段配额；counter 增减、阈值释放 | 当前只有 age；计数上限显式，不准隐式无限增长 |
| P4 | 结构事件 payload、原因过滤、独立 reward、成功原子动作组 | payload 含源/目标/标签快照、原始本轮产出、转前后类型；consume 只能一份奖励；destroySelf+reward 须显式原子执行 |
| P5 | 安全数值复制：指定一邻居的可复制平面加值 | 不复制结构、复制、永久成长、事件监听；取不可变数值快照，不递归；每源一次 |
| P6 | 临时标签预处理与互斥选择 | 在邻接条件前完成；每源选一个标签，不变池标签；不重入 ON_APPEAR |
| P7 | 独立持续道具总线与存档状态 | 支持 run/stage/choice/draw 钩子，itemId 归因；每 ID 仅拥有一件，不进入盘面 |
| P8 | 下一轮保留/锁位；无放回加权抽取 | 保留实例先占位再抽其余，最多 2 格；权重作用盘面而非稀有度候选；不重复实例 |
| P9 | 候选筛选/保底、有限刷新/删除/跳过资源规则 | 只在新生成候选时处理；已生成候选保存；不能读 UI；多来源冲突固定排序 |
| P10 | 阶段风险修正和轻量事件选择 | 修改本阶段配额、有界临时 modifier，付款前金额公开；绝不延期或复活失败 |
| P11 | 延迟普通产出、释放、负效果替代 | 本轮产出归零与独立奖励分开；保护不删除负收益日志；对 junk 的压制不改类型 |
| P12 | 成长步数修饰、转换计数携带与产物标签窗口 | 必须声明携带哪些计数；本稿默认清空，只有明示奖励携带，不偷继承年龄 |

现有 add/grow/multiply 等仅作为基础动作可复用，不代表相关新内容已支持。P1–P4/P7 是扩展基础，P5/P6 是 M4 映印门禁，P8/P9 是概率控制门禁，P10 是 M3–M4 事件门禁。拒绝 64 个专属 handler；若通用表达式不能安全表达，先缩减内容而不是塞 if 链。

### 2.4 统一安全和触发细节（新增语义提案，待审核）

1. 临时标签在基础后、初始加值前预处理；计数条件使用当时合法存活目标。倍率在可变值完成后结算，ON_END_SPIN 的释放和奖励仍在最终 ledger 前。
2. 监听“消耗/销毁/转换”按事件成功事实触发；有 `cause:consume` 的销毁不再算“非消耗销毁”。事件源和目标分别过滤。全盘监听不会因匹配 N 个目标重复响应一个事件。
3. 常规同源同目标倍率效果每轮一次；不同源可相乘，但本稿同一倍率定义最多 2 个来源影响同目标。超出来源按稳定顺序无效且记日志，不能等溢出才截断。
4. 永久值内容软上限 30（现有引擎没有该软上限）；达上限不再增加，仍可保留正常消耗奖励。不是跨局成长。
5. 生成：每源每轮最多 1、同定义全局每轮最多 2。池达到 200 时可选生成视为失败并明确显示，其他动作不把失败伪装成功；引擎安全预算仍按 RULES 硬上限受控回滚。
6. 所有有限次数、item 计数、保留状态、事件选项、modifier 到期时点都进入存档。事件在稳定状态提交，页面刷新不能重抽。

## 3. 符号矩阵：64 个（全部未实现）

每行完整定义 `id / 中文名 / rarity / tags / baseValue / effect / role`。效果栏就是可实现规格；图标需求统一为原创单色铜线 SVG 加一处路线色，M6 制作，不把临时编号算正式美术。

### A. 雾露培育（8）

| id | 中文名 | rarity | tags | 基础值 | 清晰效果与原语 | 启动/回报角色 |
|---|---|---|---|---:|---|---|
| mist_pouch | 凝雾软囊 | common | plant,mist | 1 | 第 3 次上盘转换为 dew_lantern；成长由 age 表达 | common 入口，稳定等待 |
| wick_bed | 灯芯苗床 | common | plant,fuel | 2 | 无附加效果；既能直接产出也可被热料消费者消耗 | 基础生产者、过渡供给 |
| dew_lantern | 露灯苞 | uncommon | plant,mist,product | 3 | 第 2 次上盘转换为 amber_frond；普通候选可直接获得 | 中段成长件 |
| amber_frond | 琥露扇叶 | uncommon | plant,fuel,product,cargo | 4 | 自身被消耗时发独立奖励 4；与消费者奖励不同来源 [P4] | 成熟回报、货运成品 |
| fog_stitcher | 补雾工 | uncommon | machine,support | 1 | 每轮给一个邻接 plant 的 age 额外推进 1 步；无 age 的成品无效；本轮最多 1 [P1,P12] | 可替代成长核心 |
| root_ledger | 根须账簿 | rare | plant,contract | 1 | 全盘每次 plant 成功转换，自身永久 +1；每轮最多 2，永久上限 30 [P3,P4] | 长期回报核心 |
| warm_pod | 温灯荚 | common | plant,pressure | 1 | 邻接至少一个 fuel 时自身 +3，否则正常基础值 [P1,P2] | common 快速条件回报 |
| nursery_gauge | 苗圃指针 | rare | machine,plant | 2 | 本轮至少 2 个 plant 成功转换时，全盘存活 plant ×3/2；每轮一次 [P1,P2,P3,P4] | 成型放大，非必需核心 |

### B. 废热回收（8）

| id | 中文名 | rarity | tags | 基础值 | 清晰效果与原语 | 启动/回报角色 |
|---|---|---|---|---:|---|---|
| ash_felt | 灰温毡 | common | scrap,fuel | 1 | 被消耗时生成一枚 copper_burr；若累计上盘 3 次且结束时仍存活，原子自毁并发独立奖励 3，不产普通收入；两分支互斥 [P3,P4] | common 链式输入 |
| sorting_tong | 分温夹 | common | machine | 1 | 消耗一个邻接 scrap，独立奖励 6；无目标则保底 1 [P1] | common 回收核心 |
| copper_burr | 铜毛刺 | common | scrap,product,cargo | 2 | 邻接任意 machine 时自身 +2 [P2] | 次级原料与过渡成品 |
| spent_gasket | 过役垫圈 | common | scrap,junk | -1 | 无附加效果；禁正常候选，由高收益装置或事件生成 | 明确污染/回收输入 |
| sieve_drum | 除滞滚筒 | uncommon | machine,support | 2 | 转换一个邻接 junk 为 copper_burr；每轮一次；不是删除 [P1,P3] | 可替代无消耗核心 |
| heat_clerk | 余温录员 | uncommon | machine,contract | 1 | 全盘发生 scrap 消耗时自身永久 +1，每轮最多 1，上限 30 [P3,P4] | 回收长期回报 |
| clinker_router | 灰渣分路器 | rare | machine,pressure | 2 | 每轮销毁一个邻接 junk，无消费奖励；监听全盘非消耗销毁 junk，给一个存活 pressure 蓄压 +2；自身上盘监听，每轮最多 2 [P1,P3,P4] | 废物转蓄压接口 |
| furnace_auditor | 炉账稽核灯 | rare | machine | 2 | 全盘本轮成功消耗至少 2 个不同 type 的 scrap 时，给每个存活 machine ×3/2，一次 [P1,P2,P3,P4] | 多原料回报，避免只堆同件 |

### C. 鸣片共振（8）

| id | 中文名 | rarity | tags | 基础值 | 清晰效果与原语 | 启动/回报角色 |
|---|---|---|---|---:|---|---|
| dock_chime | 栈桥鸣片 | common | resonance,cargo | 2 | 自身 + 同排其他 resonance 的不同 type 数，最多 +3 [P1,P2] | common 入口/异类频率 |
| pitch_fork | 港音分叉 | common | resonance,support | 1 | 给一个邻接 resonance +3，排除自己 [P1] | common 邻接支援 |
| fog_reed | 雾笛簧 | common | resonance,mist | 1 | 邻接 mist 非自身时 +3；一个邻居够用 [P2] | 培育/蒸馏桥接 |
| beat_spool | 拍点线轴 | uncommon | resonance,machine | 1 | 自身第 3 次上盘额外 +9 并重置拍点计数为 0；周期按上盘 [P3] | 周期性过渡收入 |
| chord_frame | 和音框 | uncommon | resonance,machine | 2 | 邻接有至少 2 种其他 resonance type 时，一个邻接 resonance ×2 [P1,P2] | 可替代倍率核心 |
| prism_hum | 晶腔哼鸣器 | uncommon | resonance,crystal | 2 | 邻接 crystal 时自身 +4；本轮自身被转换获得时不重新触发 [P2] | 蒸馏连接、稳定回报 |
| silence_keeper | 静拍保管员 | rare | resonance,contract | 1 | 若所在排恰有 1 个 resonance（含自身），自身 +10；与密集共振互斥 [P1,P2] | 稀疏路线替代核心 |
| harbor_conductor | 港湾拍长 | epic | resonance | 2 | 所在排至少 3 个不同 resonance type 时，该排 resonance ×2；本轮一次，不叠自身第二份 [P1,P2,P3] | 密集同排回报，非启动要求 |

### D. 盐晶蒸馏（8）

| id | 中文名 | rarity | tags | 基础值 | 清晰效果与原语 | 启动/回报角色 |
|---|---|---|---|---:|---|---|
| brine_strip | 盐雾滤带 | common | mist,feedstock | 1 | 第 2 次上盘转换为 saline_ampoule | common 原液入口 |
| saline_ampoule | 微盐安瓿 | common | feedstock,cargo | 2 | 无额外效果；可直接产出或作为转换前体 | common 前体/过渡 |
| condense_coil | 凝潮盘管 | common | machine | 1 | 转换一个邻接 feedstock 为 tide_prism，每轮一次 [P1,P3] | common 转换核心 |
| tide_prism | 潮棱块 | uncommon | crystal,product,cargo | 4 | 自身转换成为本类型时，自身本轮 +3；直接抽中只产基础 | 多用途成品回报 |
| deep_still | 深盐分馏器 | uncommon | machine | 2 | 消耗一个邻接 mist，独立奖励 4，并在池生成 saline_ampoule；生成失败不影响已成功消耗但须记录 [P1,P4] | 可替代供料核心 |
| crystal_index | 晶层索引 | uncommon | crystal,support | 1 | 若全盘 crystal 有至少 2 种 type，自身 +6 [P1,P2] | 混型中期回报 |
| pearl_separator | 浮珠分离器 | rare | machine | 2 | 转换一个邻接 crystal 且非 product 的实例为 tide_prism；目标已是 tide_prism 不合法 [P1] | 异谱材料精炼接口 |
| reserve_facet | 留温晶面 | rare | crystal,pressure | 2 | 消耗一个邻接 fuel，自身蓄压 +2（上限 6），独立奖励 2；蓄压达 6 时结束阶段发独立奖励 18 并归零 [P1,P3,P4] | 延迟回报、蓄压过渡 |

### E. 夜班货运（8）

| id | 中文名 | rarity | tags | 基础值 | 清晰效果与原语 | 启动/回报角色 |
|---|---|---|---|---:|---|---|
| cargo_rope | 夜班扎绳 | common | cargo,support | 1 | 给一个邻接 product +3；不消耗 [P1] | common 多体系入口 |
| route_stub | 转栈短票 | common | cargo,contract | 2 | 本轮全盘 cargo 至少 3 种 type 时自身 +4 [P1,P2] | common 异类回报 |
| parcel_cage | 铜格货笼 | common | cargo,machine | 2 | 本轮空格至少 4 时自身 +3；“少池”不是空格的同义词 [P2] | 精简池过渡 |
| sorting_runner | 分栈跑员 | uncommon | cargo | 1 | 消耗一个邻接 product，独立奖励为 6 + 目标基础值（不含永久/倍率）[P1,P2,P4] | 可替代兑现核心 |
| manifest_desk | 夜单台 | uncommon | cargo,contract | 2 | 全盘 cargo 至少 4 种 type 时，自身 ×3；否则基础值 [P1,P2] | 混搭构筑核心 |
| switch_lamp | 换轨灯 | uncommon | cargo,machine | 1 | 下一轮保留一个邻接 product 在原格；每轮一次；全局保留上限 2，已保留不延长 [P1,P3,P8] | 概率控制核心 |
| transit_seal | 联运封蜡 | rare | cargo,magic | 2 | 自身预处理临时获得 plant/crystal/resonance 中一个：选择其邻居含量最多者，同数按此序；当轮结束消失 [P1,P6] | 跨体系通配，不改变池标签 |
| return_station | 空箱返程站 | rare | cargo,machine | 2 | 本轮邻接 cargo 源成功消耗 product 后，结束时若池不超过 20，发独立奖励 8；每轮一次 [P1,P2,P3,P4] | 需其他消费者的精简回报 |

注：return_station 本身不消耗，需邻接其他 cargo 消费者配合，不能自行兑现。

### F. 压力蓄能（8）

| id | 中文名 | rarity | tags | 基础值 | 清晰效果与原语 | 启动/回报角色 |
|---|---|---|---|---:|---|---|
| pressure_pouch | 余压软袋 | common | pressure | 1 | 每次上盘蓄压 +1，上限 4；达到 4 时独立 reward10（不吃倍率）并归零，普通产出仍为1 [P3, MA-1] | common 延迟回报入口 |
| feed_valve | 添温小阀 | common | machine,pressure | 1 | 消耗一个邻接 fuel，独立奖励 3，自身蓄压 +2，上限 6；达 6 时独立奖励 14 并归零 [P1,P3,P4] | common 蓄压核心 |
| pause_dial | 歇拍刻盘 | common | pressure,support | 2 | ON_APPEAR 平面 +1（可复制）；邻接非自身 pressure 时另 +2（不可复制）；无随机损失 [P2] | 稳定过渡 |
| surge_vessel | 脉冲釜 | uncommon | pressure,machine | 1 | 每次上盘先蓄压 +1；未达 3 时普通产出归零；达 3 时独立奖励 16 并归零，普通产出仍 0 [P3,P11] | 可替代纯时间核心 |
| cracked_regulator | 裂缝调压器 | uncommon | pressure,machine | 2 | 每次上盘用本局 RNG：3/4 自身 +8；1/4 自身 -6 且池生成 spent_gasket；每轮一次 [P3,P4] | 高收益污染风险 |
| safety_shim | 卸压薄衬 | uncommon | pressure,support | 1 | 本轮首次邻接 pressure 风险判定的失败损失减少 4（最多减到 0）；不改变失败/生成事实 [P1,P3,P11] | 风险过渡、非全免 |
| release_spire | 泄峰塔 | rare | pressure,machine | 2 | 对一个邻接蓄压至少 3 的实例，扣 3 蓄压，使其本轮 ×3；只在该目标未自行释放时合法 [P1,P2,P3] | 资源型倍率回报 |
| demand_coupler | 配额耦合器 | rare | pressure,contract | 1 | 轮初现金低于本阶段配额且剩余运行不超过 2 时，自身 ×4，同时本轮在池生成 spent_gasket；每轮一次 [P2,P3,P4] | 临期抢救，未来污染 |

### G. 异相映印（8）

| id | 中文名 | rarity | tags | 基础值 | 清晰效果与原语 | 启动/回报角色 |
|---|---|---|---|---:|---|---|
| phase_chip | 偏相小片 | common | magic | 2 | 预处理：有邻接 resonance 时临时加 resonance；否则邻接 crystal 时临时加 crystal；否则不变 [P1,P6] | common 通配入口 |
| spectrum_pin | 谱别别针 | common | magic,support | 1 | 若自身邻接至少 3 种不同 type，自身 +4 [P1,P2] | common 异类过渡 |
| cloudy_negative | 雾面底片 | common | magic,feedstock | 1 | 第 3 次上盘转换为 blank_facet | common 映印/蒸馏原料 |
| blank_facet | 无谱晶坯 | uncommon | magic,crystal | 3 | ON_APPEAR 平面 +2（可复制）；非 product，可交浮珠分离器精炼；转换获得不触发出现 | 简明跨路线产物 |
| offset_reader | 偏印读头 | rare | magic,machine | 1 | 选一个邻接实例，复制其显式 copyable 的 ON_APPEAR 平面 add 常数，最多 +8；不复制条件、事件或其他动作 [P1,P5] | 数值复制核心 |
| alignment_cloth | 对相织布 | uncommon | magic,support | 1 | 给一个邻接本轮获得临时标签的实例 +5，每轮一次；按 tagAdded 日志而非最终标签猜测 [P1,P3,P6] | 通配核心替代，不靠稀有复制 |
| echo_plate | 迟相印板 | rare | magic,resonance | 1 | 一个邻接实例本轮永久值成功增加时，自身 + 该次实际增加值×4，每轮最多 2 次；不再产生 ON_GROW [P1,P3,P4] | 永久成长跨体系回报 |
| split_register | 双谱登记器 | epic | magic,contract | 2 | 预处理给一个邻接 product 临时增加 resonance 和 crystal；它本轮普通产出 ×3/2；一次，不影响池标签 [P1,P3,P6] | 双接口回报，无递归复制 |

复制白名单（H-1 内容修订）：`cleared_stub` 的 ON_APPEAR 平面 +1 是第三项显式可复制模板（§H、§3.1）；前两项保持：`spectrum_pin` 的条件成功加值不在白名单；为给复制提供真实输入，`blank_facet` 增加 ON_APPEAR add +2、`pause_dial` 增加 ON_APPEAR add +1，均标记 copyable:true。三者其余条件不复制。前两项基础值仍是表内 3/2，cleared_stub 基础值3。实现必须将三项写进效果数组，不能让说明和数据各一套。其余效果全部 copyable:false。

### H. 契约套利（8）

| id | 中文名 | rarity | tags | 基础值 | 清晰效果与原语 | 启动/回报角色 |
|---|---|---|---|---:|---|---|
| arrears_slip | 待核欠条 | common | contract,junk | -1 | 无额外效果；禁正常候选；可被合规台转换或撤账员消耗 | 有用途的污染，不是假奖励 |
| lean_receipt | 薄账回执 | common | contract | 1 | 轮初现金低于本阶段配额的 1/2 时自身 +4，否则基础值 [P2] | common 低谷入口 |
| compliance_desk | 合规小台 | common | contract,machine | 1 | 转换一个邻接 junk 为 cleared_stub，每轮一次 [P1,P3] | common 减负核心 |
| cleared_stub | 核清存根 | common | contract,product,cargo | 3 | 本轮若非由转换获得、自身 +1；转换轮不加；ON_APPEAR add +1 可复制 | 垃圾转换回报/货运供货 |
| cancellation_clerk | 撤账员 | uncommon | contract | 1 | 消耗一个邻接 junk，独立奖励 5；自身永久 +1，上限 30；成功才成长 [P1,P3,P4] | 可替代压缩池核心 |
| quota_margin | 配额边签 | uncommon | contract,pressure | 2 | 若本轮初现金不足配额且只差不超过 15，自身 +6；不得读本轮中途收益 [P2] | 支付前过渡 |
| advance_stamp | 先支邮戳 | rare | contract | 2 | 每阶段自身首次上盘额外独立奖励 18，同时本阶段配额 +8 并生成 arrears_slip；可选接受/拒绝在运行前配置，默认拒绝 [P3,P4,P10] | 透明借支风险核心 |
| settlement_beacon | 清算信标 | rare | contract,machine | 2 | 若本轮池内 junk 为 0 且存活 contract 至少 3 种 type，本轮 contract ×2；每轮一次 [P1,P2,P3] | 清池后的构筑回报 |

`advance_stamp` 的接受是 READY 时的持久设置，运行中不弹窗；不允许结算后看结果才接受。拒绝时只有基础值。若尚无 P10，此符号暂不进入候选。

### 3.1 矩阵规格整理（避免实现者猜测）

- 上述注释必须折入最终数据描述，不保留“表格说一套，注释说另一套”：return_station 的唯一触发为邻接 cargo 源消费 product；blank_facet 和 pause_dial 的 copyable 平面加值属于完整定义。
- `cleared_stub` 的 ON_APPEAR +1 自带出现时点条件（因转换不重触发出现，条件可省）；可复制是读取平面模板，不让复制者继承“转换”状态。
- 所有 “自身被消耗” 独立奖励用目标快照监听，不要求死亡实例 alive。其他普通 add 不会在死亡后被折算现金。
- reserve_facet、feed_valve、pressure_pouch、surge_vessel 自行释放在结构动作完成后统一阈值步骤；release_spire 先选择未满足自释放阈值的目标并扣计数，然后统一阈值释放。需要稳定 priority 合约，禁止按队列偶然顺序同时双领。
- root_ledger 的监听只检查转换前 targetTags 含 plant；晶块转换回成品不是雾培转换。heat_clerk 检查被消耗目标标签 scrap，不是消费源标签。
- 此处“第 N 次上盘转换”仅 age 进度；fog_stitcher 的额外步数不得重复触发一次转换，也不影响全局运行数。

## 4. 八条路线：入口、替代、风险、过渡与跨体系接口

每条至少有两条有方向的跨体系边；不是“共享标签就算协同”。Epic 只提高上限，不是路线启动要求。

| 路线 | common 入口 → 引擎 → 回报 | 可替代核心 | 真实风险与付款前过渡 | 跨体系接口（至少 2） |
|---|---|---|---|---|
| 雾露培育 | mist_pouch/wick_bed → fog_stitcher → amber_frond/root_ledger | 不见补雾工就自然 age；warm_pod 提供快收入；账簿非必拿 | 成熟前收入低；池过大降低上盘成长率；临期拿 wick_bed、warm_pod，不继续囤囊 | →回收：amber_frond 的 fuel 给 feed_valve/消费者，补消耗奖励；→蒸馏：雾料供 deep_still 生成安瓿；→货运：成熟 product 给扎绳/跑员 |
| 废热回收 | ash_felt/copper_burr → sorting_tong → heat_clerk/furnace_auditor | sieve_drum 先把 junk 转成可用成品；消费者与转换者竞争目标，非固定套装 | 消费原料耗尽会熄火；生成毛刺会稀释池；临期保留稳定毛刺，删除负垫圈，不盲目吞完 | →蓄能：clinker_router 把非消耗清 junk 转蓄压；→货运：copper_burr 的 product 可兑现；←契约：生成欠条提供清理素材，但缺清理器就污染 |
| 鸣片共振 | dock_chime/pitch_fork → chord_frame 或 silence_keeper → harbor_conductor | 稀疏静拍与密集同排二选一；没有史诗时框即可倍增 | 位置随机，堆同 type 不能满足异类；临期 beat_spool 周期回报或雾笛的单邻居 +3 | ←培育：mist 令 fog_reed 快收益；←蒸馏：crystal 令 prism_hum +4；←映印：phase_chip/封蜡补类型，但不能用同 type 重复刷 |
| 盐晶蒸馏 | brine_strip/saline_ampoule → condense_coil → tide_prism/crystal_index | deep_still 供前体、pearl_separator 精炼异相晶坯 | 转换不是现金奖励，转换源太多缺目标；临期直接拿潮棱，不再等待滤带 | →共振：潮晶满足 prism_hum；→货运：成品喂 sorting_runner；←映印：blank_facet 是分离器的非 product crystal 原料 |
| 夜班货运 | cargo_rope/route_stub → manifest_desk 或 sorting_runner → return_station | 几个普通成品即可工作，不要求全套标签；switch_lamp 是稳定性替代 | 消费破坏其他路线成熟回报；异类门槛在大池抽不到；临期 parcel_cage 精简收益、常见核清存根兜底 | ←培育：成熟扇叶被扎绳加值而不耗；←蒸馏：潮棱可直接兑基础+6；→共振/蒸馏：transit_seal 的单标签临时补条件；保留成品也帮成长慢线 |
| 压力蓄能 | pressure_pouch/feed_valve → surge_vessel/release_spire → 临期高倍轮 | 不走随机风险，用纯时间脉冲；小阀可取代高稀有塔 | 延迟轮低收益，污染可能下阶段失败；塔消耗蓄压与自行释放互斥；临期选 pause_dial/已成熟燃料，没 3 次窗口不拿新脉冲 | ←回收：灰温毡为 fuel，路由器注入蓄压；←培育：苗床/扇叶可用作燃料；→契约：demand_coupler 在配额不足时增幅但交付负垫圈 |
| 异相映印 | phase_chip/cloudy_negative → alignment_cloth 或 offset_reader → echo_plate/split_register | 无稀有读头，通配+织布已可运转；晶坯可转蒸馏 | copy 白名单窄、无可复制目标时只产 1；临时标签不能改善池概率；临期 blank_facet 稳定普通加值 | →蒸馏：晶坯可精炼潮棱；→共振：偏相临时鸣片与双谱补同排条件；←回收/培育/契约：永久成长给 echo_plate 不同事件回报，不复制成长本身 |
| 契约套利 | lean_receipt/compliance_desk → cancellation_clerk → settlement_beacon | 合规转换保留成品 vs 撤账消费压池，二者可替代不可同吃 | 低现金增益不等于可付配额；先支邮戳新增义务和污染；临期 quota_margin/稳定存根，不赌借支必赚 | →货运：cleared_stub 是运件成品；→回收：欠条可由除滞滚筒转毛刺；←蓄能：裂缝装置供 junk、清池后信标回报；清池也帮助任何慢成长路线提高上盘率 |

### 协同设计约束

- 互相竞争是合法互动：sorting_runner 吃成熟扇叶会阻止本轮 plant 倍率；清理器转换 junk 后撤账员无目标；release_spire 提前用压力会推迟爆发。Tooltip 必须说清牺牲什么。
- 至少一条 common→uncommon 路径可启动每线；路线识别按候选收益/目标密度，不靠收齐八个名字。
- 不鼓励无限扩池：雾培依赖出现次数、货运依赖异类密度、共振依赖位置。跳过与删除有实质价值。

## 5. 持续道具矩阵：32 个（全部未实现）

每件唯一拥有、不堆重复 ID。获得后直到本局结束持续监听；**所有奖励都来自反复满足规则，不是获得时发现金/券后就失效**。基础没有上盘收益，故无需符号 baseValue。每阶段、每轮次数保存；“首次”在窗口刷新，不是全局仅一次。

| id | 中文名 | rarity | 持续生效规则（含边界） | 设计用途/需求 |
|---|---|---|---|---|
| item_dew_calendar | 露班轮历 | common | 每轮第一个上盘且有 age 的 plant 额外推进 1 步；每轮一次 | 培育速度；P7,P12 |
| item_root_wrap | 根温绑带 | uncommon | 每轮第一个 plant 转换后存活实例本轮 +4 | 成熟过渡；P4,P7 |
| item_nursery_scale | 苗圃轻秤 | rare | 抽盘时池内 plant 权重 ×3/2；仅当池总数不超过 28；无放回 | 概率调节，有扩池成本；P2,P7,P8 |
| item_frost_glass | 防寒窄窗 | uncommon | 每阶段最先上盘的 2 个 mist 自身本轮 +3；每阶段重置 | 雾料经济；P3,P7 |
| item_sorting_apron | 分温围裙 | common | 每轮首次成功 consume 的 scrap 独立奖励额外 +3 | 回收兑现；P4,P7 |
| item_waste_log | 滞物登记本 | uncommon | 每阶段非消耗销毁 junk 累计 3 个后获得删除券 +1；每阶段最多 1 券 | 长期压池规则；P3,P4,P7,P9 |
| item_offcut_chute | 边料回流槽 | rare | 每轮首次消耗非 junk 的 scrap 时生成 ash_felt；同轮新实例不出现 | 续料但会稀释池；P4,P7 |
| item_clean_mesh | 清栈细网 | uncommon | 抽盘时 junk 权重 ×1/2；仍留池中，不等于删除 | 缓解而非取消污染；P7,P8 |
| item_lane_clapper | 轨边拍板 | common | 每轮每排第一个 resonance，若该排至少 2 种 resonance type，自身 +2 | 同排多样性；P1,P2,P7 |
| item_rest_notch | 休拍刻槽 | uncommon | 每轮恰有 1 个 resonance 的排，该实例普通产出 ×3/2 | 稀疏共振替代；P1,P2,P7 |
| item_pitch_marker | 音高记签 | rare | 每轮本盘首个成功新增 resonance 临时标签的实例，若存活则 +5 | 通配接口；P6,P7 |
| item_shared_metronome | 公用节拍器 | uncommon | beat_spool 的拍点阈值降低 1，最低 2；相同 mechanic:cycle_count 的后续符号也可用 | 用机制键不写死名字；P3,P7 |
| item_brine_lining | 盐雾内衬 | common | 每轮首次 feedstock 转换为 crystal，产物本轮 +4 | 转换过渡；P4,P7 |
| item_fraction_gauge | 分馏格尺 | uncommon | 每轮第一个全盘 crystal 异 type 数至少 3 的时点，独立奖励 7；每轮一次 | 异类晶构筑；P1,P2,P3,P7 |
| item_jar_rack | 安瓿架 | rare | 每轮转换得到的第一个 crystal 保留到下一轮原格；与灯共享全局 2 格上限 | 保留概率；P4,P7,P8 |
| item_residue_stamp | 残液验章 | uncommon | 每轮第一个 mist 被消耗，独立奖励 +2；但不补回目标 | 蒸馏/回收接口；P4,P7 |
| item_manifest_clip | 夜单夹 | common | 每轮 cargo 的不同 type 数至少 4 时，独立奖励 6 | 多路线轻回报；P2,P7 |
| item_return_track | 空返侧轨 | uncommon | 每阶段第 1、3 次主动跳过符号候选，各得刷新券 +1；每阶段最多 2 | 跳过有节奏价值，非无限刷；P3,P7,P9 |
| item_small_hold | 小舱限载牌 | rare | 池数量在 12–20 时，每轮独立奖励 5；小于 12 无效 | 精简但不鼓励单符号池；P2,P7 |
| item_exchange_hook | 换装挂钩 | uncommon | 每阶段首次成功 consume product 时，下一次符号候选保证一个 common product（可用集合中等权）；仍需选择 | 补货而非免费产币；P4,P7,P9 |
| item_pressure_index | 压班索引 | common | 每輪第一个 pressure 正常增加蓄压时额外 +1，不超实例上限；附加增加不再次触发本件 | 延迟线提速；P3,P7 |
| item_insulation_shawl | 隔温披布 | uncommon | 每轮首次 pressure risk 失败的负加值减少 3，最小 0；不改变污染或失败事实 | 降损不免风险；P4,P7,P11 |
| item_release_receipt | 泄压回执 | rare | 每阶段第三次成功蓄压释放时独立奖励 12；每阶段最多一次 | 鼓励可重复释放；P3,P4,P7 |
| item_spare_baffle | 备用挡板 | uncommon | 每轮首个风险生成的 junk 不入池，改为该源本轮 -3；生成事实记为替代，不能触发消耗/销毁奖励 | 风险换代价，非免费免灾；P4,P7,P11 |
| item_safe_carbon | 安全复写膜 | common | 每轮首个合法数值 copy 的实际加值增加 2，总加值仍不超过 8；无合法 copy 不生效 | 受限复制；P5,P7 |
| item_spectrum_book | 谱类手册 | uncommon | 每轮首次实例临时获得其原定义没有的标签，若存活则 +3；多加两个标签只触发一次 | 通配，不认原有标签；P3,P6,P7 |
| item_registration_pin | 对版定位针 | rare | 每轮首次 copy 成功后，保留其被复制目标到下一轮；全局 2 格上限；保留失败不补偿 | 概率控制但不复制实例；P5,P7,P8 |
| item_growth_negative | 增量底片册 | uncommon | 每轮第一个成功永久成长事件，独立奖励为实际增长值×2，最多 6；不发 ON_GROW | 成长跨体系；P4,P7 |
| item_low_balance_tab | 薄账分页条 | common | 每轮轮初现金不足本阶段配额 1/2 时，独立奖励 3；不是初获现金 | 低谷过渡；P2,P7 |
| item_compliance_carbon | 合规复核纸 | uncommon | 每轮首次 junk 转换为非 junk 的产物，本轮 +3；失败转换不奖励 | 清理接口；P4,P7 |
| item_audit_clip | 稽核夹 | rare | 每阶段首次成功付款且付款后池内无 junk，获得删除券 +1；最终胜利仅记统计，不追加待选步骤 | 可重复履约规则；P2,P7,P9 |
| item_margin_lantern | 余账灯 | uncommon | 每阶段最后一轮，若轮初现金在配额的 3/4 至不足配额区间，该轮 contract ×3/2 | 条件临期乘区；P2,P7 |

`item_pressure_index` 中“每輪”与其他行统一读“每轮”。道具赠券不等于一次性券：回流券规则随每个新阶段再次生效，须展示进度。阶段支付失败不触发任何付款道具；最终付款钩子不能生成会阻碍 WON 的资源决策。

### 道具冲突规则提案

- 模板键如 `mechanic:cycle_count` 必须由数据声明，不用 id 特判。
- 保护顺序：风险判定→确定负值→符号 safety_shim→道具 insulation_shawl；两者可叠但不能转为正收益。生成替代只匹配 cause:risk，不替代普通供料生成。
- 保留冲突：switch_lamp→jar_rack→registration_pin；已保留同实例不消耗第二格；满额无效，日志解释。实例被本轮后续销毁则撤销其保留，无额外补偿。
- 抽取权重叠乘，单实例权重最终限制 1/4–2；保留优先，抽样不重复。不会改变普通候选 common/rare 概率。
- 候选保底先汇总后生成，最多占三个槽中的一个，按道具 ID 稳定排序；已生成候选不因后续拿道具而改写。

## 6. 原创轻量事件：8 个（全部未实现）

事件不冒充持续道具。阶段 2–9 成功付款并处理完道具奖励后，最多出现一个事件；每局最多 3 个，每事件每局最多一次。至少隔一阶段，不在最后胜利或付款失败后出现。每个有“不参与”安全选项；seeded RNG 先保存事件 ID 和全部选项，再等玩家决定。按资格筛选后等权；空集合就跳过，不再次偷抽。只使用本地状态，不读取日期/网络。

| id / 中文名 | 资格 | 选项 A（明确成本/回报） | 选项 B | 持续范围/需求 |
|---|---|---|---|---|
| event_fog_shift / 雾班调换 | 池内有 plant | 支付 8 凭证，选一个 plant，其下次上盘 age 额外 +1；无 age 不能选 | 不参与，保留凭证 | 一次有界 modifier，使用后消失；P9,P10,P12 |
| event_copper_queue / 铜屑排队 | 池内有 junk | 选一个 junk 转成 copper_burr，同时再加入 spent_gasket；总数量不变但类型改变 | 不参与 | 稳定节点转换，不发本轮战斗事件、不计消耗；P1,P10 |
| event_silent_bell / 停鸣通知 | 池内有 resonance | 下阶段前 2 轮 resonance 普通产出 ×1/2，之后首个运行 resonance ×2；增幅只有一轮 | 不参与 | 先亏后赚，重启精确到期；P7,P10 |
| event_brine_inspection / 盐雾抽检 | 池内有 feedstock | 删除一个自选 feedstock，下一次符号候选保证一个 uncommon crystal；须正常选择，不能得免费符号 | 不参与 | 一次删原料换候选质量，保底仍允许跳过；P9,P10 |
| event_empty_manifest / 空白夜单 | 池大小至少 21 | 免费删除一个自选 common 非 junk；下一阶段首轮 cargo +2/个（最多 5 个） | 不参与 | 不能删除特殊成长历史而不警告；奖励受上限；P1,P9,P10 |
| event_boiler_test / 压锅试鸣 | 无额外资格 | 下阶段配额 +12；给一个 pressure 蓄压 +2（不超上限）；没有 pressure 时加入 pressure_pouch，初始蓄压 2 | 不参与 | 公开新配额，再确认；不会现场释放奖励；P3,P10 |
| event_misprint_window / 错版窗口 | 池中有 magic | 支付 6 凭证，下一阶段前 3 轮各最先上盘的 magic 临时获得 cargo 标签；只一个/轮 | 不参与 | 临时标签参与当轮，不进池 tags；P6,P10 |
| event_quota_recount / 配额复点 | 下一阶段存在 | 下阶段配额 +10，加入 cleared_stub，并获得刷新券 +1；不是额外道具 | 不参与 | 一次资源交易，有新义务；P9,P10 |

成本不足的选项置为不可选并解释；配额修改是加法、不可负数、不延后付款。选择任一选项（包括不参与）立即事务保存，事件不重复领奖。事件转换/删除明确 cause:event，不触发任何上盘监听或道具运行收益，以免在稳定节点制造虚构 Combo。

## 7. 机制覆盖与非换皮依据

| 提示词要求的 13 类 | 明确符号证据 | 策略差异 |
|---|---|---|
| 1 基础生产 | wick_bed、saline_ampoule、blank_facet | 能当跨路线原料，拿取时要权衡使用与普通收益 |
| 2 邻接强化 | pitch_fork、cargo_rope、fog_reed | 单目标加值、异标签条件与位置约束 |
| 3 消耗 | sorting_tong、sorting_runner、feed_valve | 压池、基础值兑现、蓄压不同回报模型 |
| 4 成长 | mist_pouch、dew_lantern、cloudy_negative | 出现计数、多级成熟、异路线产物 |
| 5 转换 | condense_coil、sieve_drum、compliance_desk | 原料提升、垃圾利用、留池 vs 消耗 |
| 6 Destroy | 下述销毁模板补充、clinker_router 监听 | 不与 consume 混算，压池与蓄压互联 |
| 7 永久成长 | root_ledger、heat_clerk、cancellation_clerk | 转换监听、消费监听、成功自消费成长；上限和频率不同 |
| 8 倍率 | chord_frame、release_spire、settlement_beacon | 位置、消耗储能、清池条件，不是裸全局翻倍 |
| 9 复制 | offset_reader | 稀有、只复制白名单加值，禁止递归 |
| 10 Wildcard | phase_chip、transit_seal、split_register | 单谱选择、多标签接口、池标签不变 |
| 11 风险 | cracked_regulator、advance_stamp | 结果随机污染 vs 明示借支义务，两种风险模型 |
| 12 条件 | parcel_cage、manifest_desk、quota_margin | 空格、异类数、支付缺口三个决策维度 |
| 13 Debuff/Junk | spent_gasket、arrears_slip | 负收益占池；可转成不同成品或消费压池 |

### 必须折入完整符号定义的 Destroy 模板补充

为避免只有“消耗也触发销毁”却没有独立 Destroy 玩法，**修改本稿两行设计规格（不改现有代码、不新增计数）**：

- `clinker_router` 增加 `ON_ADJACENT destroy`：销毁一个邻接 junk，每轮最多 1；无独立奖励；随后原有监听给压力目标 +2。自身上盘、目标成功消失才 emit，destroy 优先于非消耗监听。
- `ash_felt` 增加 `ON_END_SPIN`：若本实例累计上盘 3 次且仍存活，销毁自身并发独立奖励 3；本轮没有普通收入；奖励和销毁原子提交 [P3,P4]。若此前被 consume 则仅走生成 copper_burr 分支，不自毁、不双领。

因此 64 个定义里有主动销毁垃圾、自毁成熟和消费销毁三种明确区分的生命周期。补充动作、return_station 纠正文句和 copy 白名单应在实施前折回第 3 节各行，schema 校验不得只读表格忽略此节。无这些动作不算覆盖第 6 类。

## 8. M3 → M4 分批实现建议（尚未开始）

### M3 可玩切片：24 符号 + 10 道具 + 3 事件

- 先启用三线：培育、回收、蒸馏。24 符号为 A/B/D 各 8，含 spent_gasket（仅生成），不添加没有原料的孤立消费者。
- 10 道具：dew_calendar、root_wrap、frost_glass、sorting_apron、waste_log、offcut_chute、clean_mesh、brine_lining、fraction_gauge、residue_stamp（均为 item_ 前缀）。
- 3 事件：fog_shift、copper_queue、brine_inspection（event_ 前缀）。先完成 P1–P4、P7、必要 P8/P9/P10/P12 再启用依赖内容。
- 培育→蒸馏→回收有具体输入边；回收主动清 junk 接线稍后蓄能。未出现 pressure 的路由器清理仍有效，但注压无目标不发奖励；M3 候选可暂禁路由器，用通用数据 `enabledMilestone:M4` 标记，不擅自更改其效果。
- 正常候选只有 23 个（24 定义减禁选垃圾）；若禁路由器则 22 个。这是切片限制，不可声称正式 60+ 已完成。阶段奖励必须是真持续道具，不再将占位券显示为道具。

### M4 两批扩充

1. C/E/F：24 符号，累计 48；增 12 道具（四件共振、四件货运、四件蓄能），累计 22；增 silent_bell、empty_manifest、boiler_test 三事件，累计 6。P8 保留、P11 压力与风险替代先验收。
2. G/H：16 符号，累计 **64**；增 8 道具（四件异相、四件契约）及 nursery_scale、jar_rack，累计 **32**；增 misprint_window、quota_recount，累计 **8**。P5/P6 和阶段配额更改先验收；所有八路线人工体验后才进入 M5 调平衡。

启用新批次必须提升内容版本；旧档不能直接引用未知定义。图鉴只显示发现，不限制候选池；锁定/复制工具不产生局外永久数值。

## 9. 实施前验证清单与待模拟问题

### 内容静态校验

- [ ] 64 个符号 ID 唯一、32 个道具 ID 唯一、8 个事件 ID 唯一；引用产物存在，候选禁止 junk 两项。
- [ ] 每符号 fields：id/name/rarity/tags/baseValue/description/icon/triggers/effects；tags 枚举已注册；每效果有唯一 effectId、触发上限和 selector 数量。
- [ ] 描述包含注释折入后的实际规则；复制模板全白名单，普通奖励不进入 copy。
- [ ] 每件道具通过“获得后至少两个阶段仍可触发”的测试；不能一次发 8 现金伪装被动。
- [ ] 所有计数、临时 modifier、事件/候选、阶段债额修正、保留状态可精确保存恢复。

### 关键固定盘面测试规格（待写测试，不报已通过）

1. 两个分温夹抢一灰温毡：一个得 6，毡普通产出 0，只生成一毛刺；监听成功一次。
2. 灰温毡第三次出现先被消耗：不再自毁得 3；反之未消费则自毁得 3、不生成毛刺。
3. 路由器销毁负垫圈：没有消费奖励，只有邻接合法压力 +2；同件其他消费者取消目标。
4. 凝潮盘管转换安瓿：产物潮棱保留 UID/永久值，得转换 add 3；不重新 age/appear。晶索引按存活结果判断。
5. 补雾工令软囊跨成熟阈值：一次转换、一次账簿成长，不给刚转换露灯重复出现。
6. 保留灯和安瓿架同抢产物：一个占格；产物后被消费则保留取消；次轮无重复 UID。
7. 相片读头邻接 add+2 晶坯与另一个读头：只取一个白名单，不复制 copy、不多领 2+2。
8. 偏相片在预处理得 resonance：可满足共振条件；运行后池 tags 仍 magic；同 type 不虚增异类数。
9. 裂压失败+薄衬+披布+备用挡板：负加值按顺序缓解，junk 被替代后仍有 -3 代价，不发虚假 destroy 奖励。
10. 配额邮戳先支接受：支付目标可见 +8，欠条进池，下轮才可能出现；拒绝不改债额，不弹结算中对话。
11. 泄峰塔扣压与自释放互斥；压力账本不出现双份释放；计数到上限不继续溢出。
12. 最后一轮现金恰等新配额成功，差 1 失败；事件不得在败局重抽、道具不能令已经失败的支付复活。

这些是单机制/冲突规格，不冒充 EXECUTION_PLAN 的“四符号三层”复杂 Combo 门禁。另需围绕“毡→夹→录员成长→迟相印板”“囊转换→根账成长→迟相加值→和音框倍率”等构造至少 10 个 ≥4 符号、≥3 层事件的人工推导 fixture，期望值由独立算账产生。

### 数值模拟重点

- 各 common 入口前两阶段的收益分位数、首次成熟/释放时间、所需目标上盘率；不能只比较基础值。
- 永久上限 30 与每轮 1/2 次软限制是否压制或纵容终局；永久值应和倍率一起看。
- ash_felt 回流与 offcut_chute 是否导致池持续膨胀，消费者是否反而因原料耗尽失速。
- 低谷现金条件会不会诱导人为烧现金；先支配额 +8/奖励18/欠条是否实际无成本。
- 同排概率使共振过弱还是保留过强；加权抽取与最多2锁位对每条路线的成型率影响。
- 临时通配是否使 manifest/type 去重失去约束；same type 必须只计一次。
- 独立奖励路线与倍率路线的上下界，不能以共振极端爆发作为所有路线过关门槛。
- 四类 Bot 的拿取率、跳过率、删除目标、平均成型轮、失败阶段及条件化胜率；固定训练 seed 与留出集分离。本文没有运行模拟，不承诺胜率。

## 10. 交付计数与结论

- 原创新增设计：**64 符号**（8×8），**32 持续道具**（8×4），**8 轻量事件**，**8 路线**；至少 16 条明确跨体系接口，实际表中每路线给出 3 条以上方向性连接。
- 64 符号稀有度：**26 common、21 uncommon、15 rare、2 epic**；其中 2 个 common junk 禁正常候选，正常候选定义最多 62 个。这是内容覆盖数量，不是抽到概率。
- **13/13 类机制均有明确设计**；主动销毁/自毁、平面复制、临时标签、永久成长、延迟收益、污染与借支是不同规则，不以 +1/+2 替换名字凑数。
- 引擎新增需求为 **P1–P12 共 12 组通用能力**；优先目标选择、谓词、计数、成功事件/独立奖励、持续道具。现有 12 actions 不等于已支持本稿复合效果。
- 所有新增内容未实现；没有修改 `content.js`、`RULES.md` 或其他文件，没有运行平衡模拟或代替 core-worker 宣称 M0–M2 合格。下阶段应先审核基础规则，再把本稿补充折为单一数据定义并按依赖门禁逐批实现。

## 附录 A：M0–M2 现有技术内容基线（保留记录，待审核）

本节按当前 `js/data/content.js` 重建已有基线，**不是新增设计，也不是通过验收的证明**。原矩阵早期版本的逐字内容不在本次可核对记录中，故明确保留实际数据而不杜撰其结论。主矩阵 64/32/8 的计数不含此节。

| 现有 id | 中文名 | rarity | tags | baseValue | 当前代码声明的效果 |
|---|---|---|---|---:|---|
| slag | 余温残片 | common | scrap | 1 | 无 |
| hook | 回收钩 | common | machine | 1 | 邻接 consume scrap，独立奖励5（当前实现遍历全部邻接目标） |
| echo | 灰声铃 | common | resonance | 1 | 全盘 ON_CONSUME 自身 add2，emit ON_GAIN |
| meter | 记热表 | common | machine | 1 | 全盘 ON_GAIN 自身 grow1，emit ON_GROW |
| lens | 琥珀透镜 | common | resonance | 1 | 全盘 ON_GROW 自身 multiply2 |
| bud | 雾芽囊 | common | plant | 1 | 上盘 age，2次转 bloom |
| bloom | 灯花穗 | common | plant,fuel | 3 | 无 |
| still | 盐汽釜 | common | machine | 1 | 邻接 fuel transform 为 crystal |
| crystal | 潮光晶 | common | crystal | 4 | 自身 ON_TRANSFORM add2，emit ON_GAIN |
| tuner | 调频梳 | common | resonance | 1 | 邻接 resonance 每个 add2 |
| press | 余压环 | uncommon | machine | 1 | 邻接 machine 每个 multiply3/2 |
| mirror | 薄相纸 | uncommon | magic | 1 | 出现时 copy 邻接 machine 的出现 add 模板 |
| spark | 瞬火签 | uncommon | fuel | 0 | 出现 add6；邻接阶段 destroy 自身并 emit ON_GAIN；死亡不产普通收益，需审核设计意图 |
| warden | 弃物哨 | uncommon | machine | 1 | 全盘 ON_DESTROY 自身 add3，emit ON_GAIN |
| seedbox | 雾育匣 | uncommon | plant | 1 | 每次上盘 spawn bud，下轮才可出现 |
| wild | 异谱膜 | uncommon | magic | 1 | 出现时临时 tag resonance |
| gambit | 裂压阀 | uncommon | machine | 1 | 出现 risk：75% add5，否则 add-4 |
| voucher | 低谷票 | uncommon | contract | 1 | 轮初现金低于50时 add3 |
| rust | 滞热锈 | rare | scrap,junk | -1 | 无 |
| battery | 定热芯 | rare | machine | 2 | 出现 add2 |

现有标签9项：scrap/machine/resonance/plant/fuel/crystal/magic/contract/junk。现有道具奖励仅为删除+1、刷新+2、现金+8的占位资源，不计持续道具。现有阶段为10阶段，运行数 `6+(i%3)`，配额 `30+i*24+i*i*5`（i从0开始），仅记录现状，仍待经济模拟。

保留 M0–M2 契约：20格无放回抽取、八邻接、转换保留UID/permanent但清计数、不重触发出现、新生成下轮可出现、永久增长即时、被销毁无普通产出、独立奖励不吃倍率、负收益现金截断、原子克隆提交、候选与RNG保存。深度32/动作5000/单源定义64/生成40/池200/金额1e9是当前安全预算，不能把扩展内容的软限制误当当前引擎已有能力。M0–M2 测试证据及审核结论由 core-worker/主执行者另行提供。
