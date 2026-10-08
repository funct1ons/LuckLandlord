# GDD1 F3 Slice Simulation Independent Audit

审计结论：**BLOCKED（模拟工具的诊断口径与复现安全交付）**。原始 8,000 局执行、记录胜负、付款结算和胜率计算通过独立核验；本结论不把这些局判为无效，也不构成切片平衡失败。阻断项是路线/来源诊断与冻结证据复现方式。正式 Normal、全量 F4、Chrome/Edge/file/HTTP 和真人门禁均未批准。

## 范围、依据与文件保护

独立只读审计对象为冻结的 `slice-abd-v1`：24 符号、10 道具、3 事件，付款为正式表乘 65% 后向上取整 `[46,82,137,208,299,410,553,728,949,1222]`，70 轮。完整阅读 `GAME_DESIGN_V1.md`、F0 freeze、F1 acceptance、F2 report/audit/fix/retest、640 行原模拟报告、全部模拟脚本以及生产 contract/rng/schema/save/content/offers/resolver/controller。25 份原模拟 JSON 均完整解析并记录字节数与哈希；48 项原交付清单逐项匹配。

审计开始基线包含 **605 个既有普通文件**，包括原冻结交付；排除 `.git` 元数据和授权新增 audit 文件。末次保护核验 **603 文件字节与 SHA-256 完全一致**，变化仅 `.pi/loops.json` 及 `.pi/loops/01a101f0-a171-761a-8429-9edd4dbe73ac.json`，属于主窗既有调度运行时例外，未恢复或编辑。原交付自己的 556/554 基线是更早快照，与本审计 605/603 分母不同。没有未经授权新增文件。例外前后哈希见 `f3-slice-audit-protection.json`，因此不宣称“所有文件零变化”。

仅新增本报告与 `tests/gdd1/f3-slice-audit-*`。未执行原 runner、stats、gates、report、freeze/checks 入口；未调参、修改生产、GDD、原报告、已有测试或原证据；未启动子代理、服务器或调度循环。两个审计流式进程均正常结束。

## 独立验证结果

审计脚本 `f3-slice-audit-evidence.js` 不导入原 runner 或 aggregator。按原始 Buffer 换行流式读取 **10 文件、2,647,727,195 字节、8,000 局**，核验每条 seed/policySeed、line、offset、bytes、SHA-256、outcome、finalHash；末尾无残片，文件计数与文件长度吻合。验证种子固定公式、八组各 1,000、训练/留出不交叉、无重复、无 ERROR/未结束，8,000 终态均通过生产 schema。

独立实现 nearest-rank 分位数和代数等价 Wilson 公式，重算全部统计：胜率、阶段 reached/paid/conditional payment、spin/period income、margin、pool、formation、事件、命令数、计时、ID exposure/selection/贡献/来源、分层和极端样本；与冻结 statistics 逐字段一致。再完整独立重算 gate detail，包括阶段 4 前成型、历史 winningRoutes 和所有失败 seed。合计 **1,668,979 次标量/结构比较**无差异。数学一致不等于诊断口径符合设计，见后文。

| Bot | Train 胜局/1000 | Holdout 胜局/1000 | Holdout 胜率与 Wilson 95% |
|---|---:|---:|---|
| Random | 3 | 1 | 0.10%，0.02%–0.56% |
| Value | 195 | 173 | 17.30%，15.08%–19.77% |
| Synergy | 546 | 564 | 56.40%，53.31%–59.44% |
| Greedy | 810 | 790 | 79.00%，76.37%–81.41% |

**47 局独立回放、7,395 命令、3,135 spins**，含每个文件首局（包括 Greedy/train/0500 与 Greedy/holdout/0500）、八组胜负、每组总收入低/高值、峰值、最坏付款余量，以及三个事件 A。每命令检查记录的 revision/stage/spin/phase、合法动作和 after 状态；每 spin 检查 board、ledger、收益、日志数与 bySource；付款检查 available/payment/margin/paid；终态完整字段及 finalHash 相同。全部选择种子和哈希保存在 `f3-slice-audit-evidence.json`。它验证真实 command API 回放，未重新生成或替换原 8,000 局，也未重新测量原运行时间。

**17 个独立探针通过**，覆盖公共状态深拷贝、隐藏 identity/RNG 不变性、策略 RNG 分离、Greedy 实际副本执行与两轮/14 命令上限、候选身份不影响评分、刷新上限及旧窗口/旧 revision 原子回滚、删除与 pending、空池确认、临期选择不能挽救付款、阶段 10 无额外奖励、自然/calendar/fog/stitcher 一轮一次成熟、三事件 A/B/成本/容量/保底，并包含下文两个诊断反例。探针“通过”意味着反例按代码复现，不表示被审计诊断已正确。探针构造的阶段 fixture 初次缺少 skipCount 重置，已仅在新增审计脚本纠正后重跑；原产品未变。

## 逐项门禁判定

| 项目 | 审计结果 | 适用范围与依据 |
|---|---|---|
| 固定采样、8,000 完成、胜负与胜率 | PASS | 原始字节、种子、终态、索引与独立聚合一致 |
| 生产 command API、付款与阶段事务 | PASS（切片） | 47 回放及独立失败/边界探针；不替代完整浏览器事务门禁 |
| 公共信息边界、策略 RNG、副本不污染实时状态 | PASS | 四 Bot 隐藏状态不变性及深拷贝/流分离探针 |
| Greedy 有限前瞻真实性 | PASS，方法有限 | 实际副本命令、合成 RNG、单样本、剪枝与终端启发评分；非穷举最优 |
| 实际动作使用 | PASS（记录真实性） | 各组命令计数核对；Greedy 两组 reroll=0、skipItem=0，不据此声称每 Bot 使用每动作 |
| 阶段/收益/付款余量/池/性能聚合 | PASS（描述统计） | 全字段独立重算；阶段统计条件于 reached，period 含失败但完成的付款窗口 |
| 阵型/主路线诊断 | BLOCKED | 诊断阈值替代与历史路线口径不满足 GDD 主路线收入识别 |
| 效果来源按 ID 归因 | BLOCKED | 最终类型回填丢失同 UID 转换前来源类型；总收益守恒仍正确 |
| Exposure/重复获取 Wilson 区间 | BLOCKED（推断口径） | 同局关联试次被赋予独立二项区间；原报告部分披露但 JSON 未区分 |
| 原证据安全复现 | BLOCKED | 原建议 stats 入口覆盖冻结输出，无保护；原 first-per-file 回放声明不准确 |
| 既有文件保护 | PASS，运行时例外披露 | 605 基线、603 相同、两调度文件例外；原 48 manifest 匹配 |
| 正式 Normal / 全量 F4 / Chrome/Edge / 真人 | 未批准 | 切片租金、内容和样本不能充当这些门禁 |

## 缺陷与最小后续范围

### A1：成型替代与主路线口径，阻断诊断交付

位置：`tests/gdd1/f3-slice-sim-engine.js:89–94`，尤其第 91 行；`f3-slice-sim-gates.js:4`；`GAME_DESIGN_V1.md:463,467`；原报告第 43、588–601 行。

GDD 要求池内 ≥4 **成长/成品**、培育支援及最近三轮活动条件，并明确“主路线按实际收入来源而不是标签数量识别”。实现 A 使用任意 `plant` 数量，包括没有年龄机制、没有 product 标签的 `wick_bed` 等；历史收入达到阈值后可给当前已无成熟链的池判 A。独立输入：四个 `wick_bed`、一个 `fog_stitcher`，recent=`[{plantTransforms:0,plantProductIncome:12,scrapProcessed:0}]`。实际返回 `['A']`；按“成长/成品”严格机制口径这四件不满足，至少应由明确资格表或设计澄清决定，不能直接把 plant 等价为成长/成品。

另 `winningRoutes` 仅使用 `firstFormation` 的历史 key；以前成型后拆掉仍算该路线，有两历史 key 即 mixed，无须收入份额。实际为“曾满足自定义诊断的路线数”，GDD 预期为收入来源判定主/副路线。该问题影响成型率、成型轮、阶段 4 前小循环、路线和混搭解读，不影响现金与胜负。

最小后续范围：在模拟工具内明确成长/成品资格并独立回归；对历史成型指标改名并限制解释。若要输出 GDD 主路线，应另按收入来源计算主/副路线和混搭，不能用历史 key 替代。对冻结原件保留本审计，后续任何重算/修订使用新版本输出；不得将工具修订变成租金调参。

### A2：最终类型归因污染按 ID 效果诊断，阻断来源交付

位置：`tests/gdd1/f3-slice-sim-run.js:20–24`；`js/gdd1/resolver.js:16–22,87,90,95,136–139`；`js/gdd1/schema.js` 的 contribution facts 校验。

现有 ledger 顶层是目标最终 `{uid,type,amount,alive,ratio,contributions}`；每 contribution 只有 `{source,amount}`，按 source UID 合并。**没有序列化的来源 commit-time type 或 epoch**。resolver 的内部 `sourceOf` 有 type/epoch，但 `addParts` 与 `multiplyParts` 只存 UID，汇总 Map 又合并同 UID。日志 `facts.beforeType/afterType` 是目标类型，不能普遍当来源类型；`effectKey` 和变换日志可帮助重建，却不是通用来源提交元数据。

独立输入：`crystal_index` 在格 0、`pearl_separator` 在格 1、`reserve_facet` 在格 2，20 格其余空。appearance 阶段 index 因两种晶体先给自身 +6；separator 把它转成 `tide_prism`，同 UID、epoch+1，prism 自监听再 +3。最后普通收入 **13=最终基础4+先前index6+prism监听3**。ledger 保留 UID `u13`，type=`tide_prism`，contributions=`[{source:'u13',amount:13}]`。runner 用本轮最后类型查 UID，实际把 13 全计 `tide_prism`。用于“哪个定义效果创造收入”的预期拆分是 **crystal_index=6、tide_prism=7**，UID 保持 `u13`。完整 ledger、两条 add 日志及预期拆分在 probes JSON。

本审计所有总收入守恒检查和回放仍通过，说明这是归因语义缺陷，不是少钱或伪造胜局。A 的 `plantProductIncome` 同样取产品 ledger 全金额，包含外部支援，不能称纯产品来源贡献。

最小范围有两层：只需要冻结现状可在新工具报告将该值明确命名为“最终类型所属 UID 的收入”，停止用于效果强弱和路线主导判断；若修复效果来源口径，F3 工具应建立按 `(sourceUid,sourceType,sourceEpoch)` 的贡献分解并在每个 add/multiply/reward 提交时捕获来源，基础结算按最终类型记 4，index add 记 6，prism listener 记 3。相同 UID 不能拆成新实例；分解总和须等于现有 ledger。可在模拟专用、内存中的 resolver instrumentation 保存来源元数据，维持生产公开输出；若决定把元数据持久化到正式 ledger，则需要授权修改 resolver/schema/存档兼容与回归，不能仅给现有 JSON 猜测添加 `sourceType`。仅靠 ledger 的聚合 13 无法唯一还原，旧样本要用已有命令回放重建新版本侧车证据。

### A3：相关观测的 Wilson 置信区间，阻断推断口径

位置：`tests/gdd1/f3-slice-sim-stats.js:5,20,33–34`；原报告第 45、605 行。

实际 `ids.selectionRate` 用 selected/exposures，exposure 包括同局多个窗口及 reroll；`acquisitionStrata` 的 n 是获取事件，同局同 ID 同阶段可重复，wins 重复计同一个终局结果。却统一输出 Wilson lo/hi，标签只说 Wilson 95%。独立原始输入 `F3-SLICE-v1/Greedy/holdout/0000` 在 `sieve_drum/1/unformed/<20` 获取两次；同一胜局给该 strata 增加 n=2、wins=2，实际独立 game cluster 只有 1、终局胜利只有 1。该原始字节抽取反例保存在 probes JSON。独立重算证明公式数值正确，不能证明这些观察是独立 Bernoulli。原报告第 605 行说原始 appearance 比例不是独立 Wilson 试次，与 JSON 字段语义冲突。

预期：每局终局胜率的 Wilson 可保留为对固定采样方案的描述性近似；同局相关 offer/获取比例须明确 denominator、分析单元和相关性，不能套独立样本的置信覆盖解释。最小范围为给重复试次字段去掉 lo/hi 或标作不具有独立二项覆盖保证的描述值；需要不确定性估计则按 game/seed 聚类抽样或先定义每局单一试次，不改种子和终局记录。

### A4：Greedy 表述与方法局限，修订说明即可

位置：`tests/gdd1/f3-slice-sim-engine.js:63–88`；原报告第 18 行。

原句“不 inspect or generate future offers while scoring”中的 generate 不准确。rollout 使用合成 seed `f3-model-v1/0` 和真实 spin/reroll；controller 会生成副本候选。独立探针将生成候选身份替换为合法单项，在一次 SYMBOL_CHOICE 决策中观察 **10 次 offer 生成**，决策/utility/modelCommands 不变。实际保障是“不读取实时未来 RNG，不选择副本未来 offer 的身份”，不是完全不生成。

单个公共合成样本、remove/reroll 剪枝、READY 多数直接 spin、后续 skip/skipItem/B、终端启发评分均是现有算法限制。候选 reroll 后续直接 skip，无法评估拿到新候选的价值，与两组 Greedy 0 reroll 一致。rollout 计数中的两轮是初始候选之后的 READY spins；若直接对初始 spin 调 rollout，初始候选 spin 不计其 income/spins，现有 READY 策略捷径使这通常不参与 live 候选评分。本审计不把它叫最优规划器，也不因 Greedy holdout 79% 判切片平衡失败。

最小范围：修订新版本说明，明确合成副本生成、跳过续策、一个样本和计数定义；不必因措辞修正调 Bot 或租金。若以后改善 reroll continuation，属于策略版本变化，需新冻结训练/留出样本。

### A5：原回放覆盖与冻结复现覆写风险，阻断复现交付

位置：`tests/gdd1/f3-slice-sim-stats.js:25,36`；`f3-slice-sim-gates.js:6`；原报告第 26、30、635–640 行。

原 stats 按 `game.index===0` 回放，因此十文件只回放 **8 局**，遗漏两个 Greedy 起始 500 分块首局。原 recompute 确实列 8，Results 也如实写 8；Validation 写“first game of each file”不成立。审计新增 **47 局**不追溯改写原覆盖。

原 reproduction 建议执行 stats.js，但它无存在性保护，直接覆盖原 statistics/recompute；gates 同时覆盖 gates JSON 并向原报告追加。run 的 JSONL 存在性保护不覆盖这些聚合入口。本审计只读源码确认，未用实际覆盖实验验证。

最小范围：后续修复者让聚合/报告工具显式接受新 output root 或版本前缀，默认拒绝已有冻结输出，并准确按物理文件/代表性路径说明回放采样。原冻结文件保持原 hash；安全复验当前交付使用下列 audit 入口，仅生成 audit 证据。

## 安全复验与冻结

从仓库根目录执行：

```text
node tests/gdd1/f3-slice-audit-evidence.js
node tests/gdd1/f3-slice-audit-probes.js
node tests/gdd1/f3-slice-audit-protect.js --verify
node tests/gdd1/f3-slice-audit-freeze.js --verify
```

前三项仅重建 audit 输出；审计冻结后若重建导致新证据字节变化，最后的 manifest 校验应失败，不能覆盖 manifest 掩盖变化。仅检查冻结交付时执行最后一项即可。不要运行无参数 audit-protect，它用于最初基线；不要运行原 stats/report/gates/freeze 入口。

本次最终冻结 `f3-slice-audit-freeze.json` 记录所有授权新文件的 SHA-256、605 文件保护快照、原 48 项 manifest 摘要与 BLOCKED 状态；manifest 自身明确排除，使用 `--verify` 只读验证。原 manifest SHA-256 为 `1f1acb1a9f0a7352d65f6bda9f2f43c4dc514ebc80c212acd459f9f7f16d21a3`。机器核验 pass 与审计交付 BLOCKED 分开记录。

本报告交付后停止编辑，交由主审调度唯一修复者。修复范围限工具诊断/归因/安全复现和说明；正式内容、经济参数、浏览器与真人门禁需各自独立授权和验证。
