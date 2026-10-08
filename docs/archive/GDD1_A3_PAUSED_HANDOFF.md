# GDD1 A3 — PAUSED handoff（暂停交接）

**状态：已暂停（PAUSED）** · 暂停时间 2026-10-06 18:53 前后（进程终止于 18:53 左右，最终统计见下）
**原因：用户要求暂停相关工作，非技术故障、非结论性停止。**
**本文件只记录断点事实，不含任何结论、判定或倾向性建议。**

---

## 1. 一句话现状

A3 的**两项诊断均已实现并启动批处理，但均未跑满目标样本（n=100×2 路/组），全部中途终止**。
**没有**生成报告、**没有**生成冻结文件、**没有**启动独立审计、**没有**做任何判读。
经济状态保持原样：**NOT APPROVED**（与暂停前完全一致）。

---

## 2. 为什么要暂停（事实记录，避免误读）

- 主审转达用户"暂停"指令后，工人（`lucklandlord-grok-engineering`，pane `wG:p2B`）**先将指令理解为 "job-kill" 并启动了 8 个 resume 任务**（`oracle Value/Greedy/Synergy resume`、`v4 Value/Synergy resume` 等）。
- 主审随后发出明确更正（"目标是暂停，不是完成"），并**由主审直接通过进程级操作终止了全部 12 个批处理进程**：
  - PID 66536 / 23728 / 63740（v4 Value×2、Greedy×1）
  - PID 69284 / 35808 / 72792 / 72116 / 73364 / 62548（oracle 六路）
  - PID 65004 / 69540 / 72916（v4 Synergy×2、Greedy×1）
- 验证：`full-sim-run*` 进程数 = **0**；CPU 负载由 74% 降至 **12%** 以下。
- 之后 `lucklandlord-grok-engineering` **agent 进程已退出**（`herdr agent get` 返回 `agent_not_found`；pane `wG:p2B` 已回到裸 PowerShell 提示符）。
- **因此本文件由主审代为撰写，而非工人自述。**

---

## 3. 批处理完成度（从 terminated 时的 `-progress.json` 读取）

### 3.1 v4（合法策略，后期付款感知）— 目标 n=100/路 × 6 路

| 文件前缀 | 已完成/目标 | wins |
|---|---|---|
| `full-sim-policy-v4-jobkill-greedy-holdout-0` | 44/100 | 11 |
| `full-sim-policy-v4-jobkill-greedy-holdout-100` | 44/100 | 13 |
| `full-sim-policy-v4-jobkill-synergy-holdout-0` | 44/100 | 21 |
| `full-sim-policy-v4-jobkill-synergy-holdout-100` | 44/100 | 14 |
| `full-sim-policy-v4-jobkill-value-holdout-0` | 40/100 | 18 |
| `full-sim-policy-v4-jobkill-value-holdout-100` | 42/100 | 21 |

合计约 **258/600 局**，errors 全 0。

### 3.2 oracle（完美先见诊断）— 目标 n=100/路 × 6 路

| 文件前缀 | 已完成/目标 | wins |
|---|---|---|
| `full-sim-oracle-diag-v5-jobkill-greedy-holdout-0` | 74/100 | 23 |
| `full-sim-oracle-diag-v5-jobkill-greedy-holdout-100` | 70/100 | 28 |
| `full-sim-oracle-diag-v5-jobkill-synergy-holdout-0` | 68/100 | 34 |
| `full-sim-oracle-diag-v5-jobkill-synergy-holdout-100` | 70/100 | 34 |
| `full-sim-oracle-diag-v5-jobkill-value-holdout-0` | 68/100 | 30 |
| `full-sim-oracle-diag-v5-jobkill-value-holdout-100` | 68/100 | 34 |

合计约 **418/600 局**，errors 全 0。

> ⚠ **以上数字为被强制终止时的快照，未做完整性校验（jsonl 末行可能截断），不得用于任何判读、不得引用为结果、不得用于经济批准。**

---

## 4. 断点文件清单（全部保留，未删除、未重命名、未覆盖）

### 4.1 运行器 / 引擎（A3 新增）

| 文件 | bytes | SHA256 |
|---|---|---|
| `tests/gdd1/full-sim-run-policy-v4.js` | 9403 | `0e925b435e62aa445f536022b596ec30799cd357f9c49677d473de5476696b84` |
| `tests/gdd1/full-sim-engine-policy-v4.js` | 3940 | `f1115efee767f2bdeeb3688916d92a1f82ddf418b639533493e8f19301d41435` |
| `tests/gdd1/full-sim-run-policy-v5-oracle.js` | 9406 | `c082dc53567e16dd8fc94cd08fce002ad5a5d824c861b66e49ce9df89024a4b3` |
| `tests/gdd1/full-sim-engine-policy-v5-oracle.js` | 3413 | `a478716a89d89241c65a7ab51e8576d8e82ba5919ded5b69a887e77b5f55cbe8` |

> 注：`full-sim-policy-a3-compare.js` 在终止前**未落盘**（工人曾声明创建 +191/-0，但磁盘上不存在）。

### 4.2 数据产物

- **jobkill 保留集**（12 个 jsonl + 12 个 progress）：
  `tests/gdd1/full-sim-policy-v4-jobkill-*.jsonl` / `-progress.json`
  `tests/gdd1/full-sim-oracle-diag-v5-jobkill-*.jsonl` / `-progress.json`
- **未跑完的 resume 残片**（每个 1–2 局，0 值；保留但无价值）：
  `full-sim-policy-v4-batch-value-holdout-41/-143`、`-synergy-holdout-45`
  `full-sim-oracle-diag-v5-batch-{greedy-holdout-74/-170, synergy-holdout-68/-170, value-holdout-69/-169}`
- 完整 SHA256 清单可用本文件第 3 节的 progress 值 + 下节命令重新生成。

> 注：`full-sim-policy-v4-batch-value-holdout-41.jsonl` 长度为 0 bytes（空文件，SHA256 `e3b0c442...b855`）。

---

## 5. 恢复运行的确切命令（未执行）

```powershell
cd C:\files\code\LuckLandlord

# v4（合法策略）——6 路
node tests/gdd1/full-sim-run-policy-v4.js batch Value   holdout 100 0
node tests/gdd1/full-sim-run-policy-v4.js batch Value   holdout 100 100
node tests/gdd1/full-sim-run-policy-v4.js batch Synergy holdout 100 0
node tests/gdd1/full-sim-run-policy-v4.js batch Synergy holdout 100 100
node tests/gdd1/full-sim-run-policy-v4.js batch Greedy  holdout 100 0
node tests/gdd1/full-sim-run-policy-v4.js batch Greedy  holdout 100 100

# oracle（诊断用，禁止作为验收证据）——6 路
node tests/gdd1/full-sim-run-policy-v5-oracle.js batch Value   holdout 100 0
node tests/gdd1/full-sim-run-policy-v5-oracle.js batch Value   holdout 100 100
node tests/gdd1/full-sim-run-policy-v5-oracle.js batch Synergy holdout 100 0
node tests/gdd1/full-sim-run-policy-v5-oracle.js batch Synergy holdout 100 100
node tests/gdd1/full-sim-run-policy-v5-oracle.js batch Greedy  holdout 100 0
node tests/gdd1/full-sim-run-policy-v5-oracle.js batch Greedy  holdout 100 100
```

**恢复前必须先读运行器的 resume 语义**（残片目录里已有多个不同 `startIndex` 的分片，盲目重跑可能产生重复样本）。
实测速率参考：12 路并发下 v4 ≈ 60–70 s/局、oracle ≈ 36–46 s/局；单路独占时约 26 s（v4）/ 21 s（oracle）。
16 逻辑核机器上 **12 路并发已超订约 1.5×**，恢复时建议减到 6–8 路。

---

## 6. 尚未开始的步骤（全部为 TODO，未执行任何一步）

1. 跑满 n=100×2 路/组（v4 与 oracle 各还差约 340 局 / 180 局）。
2. 与 v2 / v3 同种子对比表。
3. 生成 `docs/GDD1_FULL_SIM_POLICY_A3_DIAGNOSTICS.md`。
4. 机器可读 JSON（统计 + 门禁 + recompute）。
5. 冻结文件 `f4-grok-freeze-policy-v4.json` 及 oracle-diag 冻结。
6. 旧冻结复核（`freeze-policy-v3` 37/37、`freeze-policy-v2` 143/143、`freeze-v4` 436/436、`agg-freeze` 8/8）。
7. **独立签名审计**（非作者，可独立否决）`docs/GDD1_FULL_SIM_POLICY_A3_AUDIT.md` + JSON。
8. 按 `docs/GDD1_A3_AUTHORIZATION.md` 的判读规则表做**结论**。

---

## 7. 未受影响 / 保持原样的东西

- 生产代码、`docs/GAME_DESIGN_V1.md`、付款表、seed 目录：**未改动**。
- 阶段B（经济调参）：**未开始**。
- v1 / v2 / v3 全部历史证据与冻结文件：**未覆盖**。
- 经济状态：**NOT APPROVED**（不变）。
- 主审在**看到任何胜率汇总之前**写入的 `A3-AMD-1` 判读规则修订（见授权文件）：**保持有效**，未被倒逼修改。

---

## 8. 可选的下一动作（需用户/主审明确指令，勿自行执行）

- **继续**：按第 5 节恢复跑批 → 走完第 6 节。
- **判定为不必继续**：本诊断作废，A3 关闭，经济维持 NOT APPROVED；
  已投入的 258+418 局**不作为证据**，仅保留为断点记录。
- **长期搁置**：保留本文件与全部残片，随时可按第 5 节恢复。

---

*本文件由主审（pane `wG:p1`）撰写并落盘。工人 agent 已退出；如需重开，用新 agent 按第 5 节命令恢复。*
