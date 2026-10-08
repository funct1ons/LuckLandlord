# A3 授权规格（主审 wG:p1 → 工程员 lucklandlord-grok-engineering）

状态：**有效授权，立即开工**。A2 已接受并冻结（freeze-policy-v3 37/37），勿再重开 A2。

硬约束（全程）：不得修改 `docs/GAME_DESIGN_V1.md`、`js/gdd1/**` 生产代码、付款表、seed 目录；不得开始阶段B（经济调参）；不得筛 seed；不得以内容数量/烟测冒充功能完成。人测/Chrome/美术不做。

---

## 诊断 1：policy-v4 —— 纯策略加深 + 后期付款感知

目的：回答“继续加强合法策略，能否把胜率推进 §13.3 的 40–70% 带”。

实现要求：
- `HORIZON_SPINS` = 12–16；`COMMAND_CAP` = 96–128。
- `REMOVE_BEAM` = 全量（不再限制候选数量）。
- root 候选必须仍包含**全部合法动作类型**：`spin/choose/skip/remove/reroll/item/skipItem/eventA/eventB`（不得剪枝任何一种）。
- **关键改动（最新短板假设）**：效用函数加入**后期付款感知** —— 显式评估抵达未来 **2–3 次付款**时的 cash-payment margin（v2/v3 只含 mean value / model income，没有显式盯 850/1120/1460/1880 这几笔大额付款）。必须在报告中写清效用函数各项与权重。
- 合成模型种子：`createRng('full-sim-model-v4/0')`。
- 禁止 peek 真实 RNG / 五流 / 未来 seed / 真实 offer（合成 offer 必须在报告中披露为“模型生成的假 offer，非真实 offer”）。
- 建议先跑每组 20–30 局测速，给出 200 局的 ETA；若 wall > 3 小时，先交 100 局/组并写明是欠采样。

样本：与 v3 **完全相同**的 holdout 索引 `F4-FULL-v1/<Bot>/holdout/0000–0199`（Value / Synergy / Greedy 三组），前缀 `full-sim-policy-v4-batch-`。

指标（必须逐项输出）：胜局数 / n、Wilson 95%、失败阶段分布、形成率、动作计数与未用动作、replay 一致性（index-0 与至少 1 个额外索引重放 hashMatch）、以及**与 v2/v3 同种子对比表**。

通过标准：若 v4 holdout 点估计进入 **40–70%**（且 Wilson 区间与 40% 重叠或在其上），即判定“策略足以达标，经济无需变更”。若 < 40% 且相对 v3 增益很小（< 5pp），记为“策略侧收益饱和”。

---

## 诊断 2：policy-v5-oracle —— 完美先见上界（**仅诊断，禁止作为验收证据**）

目的：回答“当信息完全不是瓶颈时，这套经济最多能赢多少”。

实现要求：
- 与 v3 相同，**唯一例外**：rollout 时复制真实 `state` + 真实五条 RNG 流，即允许机器人“知道未来真实会抽到什么”（定义上的作弊）。
- 输出文件名必须含 `oracle-diag`；报告与 JSON 必须显著标注：
  `ORACLE DIAGNOSTIC — NOT ACCEPTANCE EVIDENCE, MUST NOT BE USED FOR ECONOMY APPROVAL`
- 不得用 oracle 结果替代 Random 对照组，不得用于批准经济，不得冒充真人成绩。

样本：同一 holdout `0000–0199`，200 局/组，前缀 `full-sim-policy-v5-oracle-diag-`。

指标：胜局数 / n、Wilson 95%、失败阶段分布、与 v3/v4 同种子对比、以及“oracle 增益 = oracle 胜率 − v3 胜率”。

---

## 判读规则（必须原样写入报告，不得事后修改）

### 修订 A3-AMD-1（主审，2026-10-06 17:5x；仅在看到 12 局早期进度、**未看到任何胜率汇总**时作出；只收紧措辞、不改任何阈值）

| oracle 结果 | v4 结果 | 结论（必须照此写） |
|---|---|---|
| < 40% | 任意 | **经济过难得到决定性支持**：连完美先见（复制真实 state + 五流的作弊上界）都无法进入 40–70% 带，说明**不存在**任何能达到 40% 的合法轨迹。建议阶段B版本化调参（仍需主审显式授权） |
| ≥ 40% 且 < 70% | < 40% | **经济结构上可行，但瓶颈归因未定**：oracle 只证明"存在可达轨迹"，**不证明**人类/合法策略能找到它。必须写成：*经济未证明过难；但也未证明健康。信息优势可能是全部差距来源，因此不得据此宣布"经济无需变更"或"不应改数值"*。后续应先做 v4 vs oracle 的差距分解（多少差距来自前瞻深度、多少来自前瞻宽度/信息），再决定是否进入阶段B |
| ≥ 70% | < 40% | **经济偏易（对完美信息者）**：oracle 可轻松通关，说明数值本身不缺收益，落差几乎全在决策能力。结论写"不应上调收益"，并优先做策略侧改进 |
| 40–70% | ≥ 40% | **经济无需变更**，v1/v2 短板是策略；合法策略已能达标 |

补充禁令（无论哪个分支）：不得用 oracle 胜率作为**经济批准**依据；不得用 oracle 胜率宣称"平衡已通过"；oracle 只能用于**排除不可能性**与**给出上界**。正式 economy 状态继续为 NOT APPROVED。

若 oracle 与 v4 **都** < 40%，额外要求：给出“要进入 40% 需要多少额外收益”的量化估计（例如后期付款的 P50 margin 缺口），供阶段B参考，但**不得直接改数值**。

---

## 交付物（全部新前缀，旧证据一律不覆盖）

1. `docs/GDD1_FULL_SIM_POLICY_A3_DIAGNOSTICS.md` —— 三方同种子对比、收敛性判断、两张诊断各自判读、明确结论；含 horizon/cap/beam/模型种子/效用函数/假设的完整披露。
2. 机器可读 JSON：v4 与 oracle 的统计 + 门禁 + recompute。
3. 冻结：`f4-grok-freeze-policy-v4.json`、oracle-diag 冻结（若适用）。**不得覆盖**；必须验证 `freeze-policy-v3` 37/37、`freeze-policy-v2` 143/143、`freeze-v4` 436/436、`agg-freeze` 8/8 **仍全通过**。
4. 独立签名审计（**必须由未撰写该策略/引擎的子代理签署，可独立否决**）：`docs/GDD1_FULL_SIM_POLICY_A3_AUDIT.md` + 机器可读 JSON。审计至少核查：seed 唯一性与计数、Wilson 逐位、stage survival、动作计数、lookahead 披露与代码一致（含 v4 的 horizon/cap/beam/效用与 oracle 的 peek 范围）、**oracle 标记与“不得用于批准”约束是否落实**、v1/v2/v3 证据未被覆盖、以及是否能独立拒绝工程结论。审计不得复述工程结论代替验证。

## 完成条件

完成后**即停并报告**：三项结果（v3/v4/oracle）、关键 SHA、verify 计数、被审计否决的点（若有）。**不要开始阶段B** —— 经济调参需主审另行显式授权。
