# tests/tools — 开发自检工具

用于改代码时的快速反馈，不是独立审计或平衡证明。按改动范围选择检查，不必每次重复跑全部浏览器脚本。

```powershell
node tests/tools/run-all.js     # 以下11项快速检查
node tests/tools/smoke-play.js  # 也可单独运行
```

## 快速检查清单

| 脚本 | 验证什么 |
|---|---|
| `smoke-play.js` | 引擎能否无头跑完整一局，无异常、无死循环 |
| `mechanics-runtime.js` | 候选、阶段保底、结算、保留位与事件运行 |
| `mechanics-targeted.js` | 保留、复制、消耗、阶段义务与升级的定向局面 |
| `icons-coverage.js` | 图标覆盖与未知项安全降级 |
| `icons-uniqueness.js` | 生产牌与升级图标不碰撞 |
| `audio-silent-fallback.js` | 无AudioContext静默降级及合成路径 |
| `animation-isolation.js` | 同Seed不同演出档位的逻辑结果一致 |
| `player-text.js` | 104项玩家描述与内容定义一致 |
| `audio-lifecycle.js` | 默认音量、可信手势门控与音频生命周期 |
| `settings-keys.js` | 独立UI设置与快捷键合同 |
| `player-guide-facts.js` | 手册数值与代码一致，图片引用可解析 |

## 独立工具与截图

- `node tests/tools/balance-v1.js`：数值调整方案B1·工作包A的测量工具（见下节）。
- `node tests/tools/story-copy.js`：故事术语、收益边界与先支邮戳政策，不包含在上述11项中。
- `node tools/art/check-objects.js`：96件物件几何、渐变ID与本地引用。
- `node tests/gdd1/confirm-shell.js`：确认/取消键盘、重复按键与嵌套焦点。
- `node tests/gdd1/visual-edgecases.js`：长文、大现金、柜体标签键盘与减少动态。
- `node tests/gdd1/shell-shot.js`：更新手册01–07截图，并检查玩家外壳。
- `node tests/gdd1/visual-shot.js`：四档视口，更新08工作台图及视觉报告。

## balance-v1（工作包A测量工具）

对应 `docs/BALANCE_ADJUSTMENT_PLAN.md` §3。**不修改任何游戏文件**，参数覆盖只发生在内存定义上。
旧 `balance-lab.js` / `derive-payments.js` / `fit-payments.js` 与历史报告保留不动。

```powershell
# 1) 10 个固定 seed 的工具自检（终止、复现、无非法命令、参数覆盖生效、profile 隔离）
node tests/tools/balance-v1.js --self-check --config tests/balance/b1/configs/P0-baseline.json --out tests/balance/b1

# 2) 训练集前 100 个 seed × 4 策略的初步基线
node tests/tools/balance-v1.js --config tests/balance/b1/configs/P0-baseline.json --games 100 `
  --policies random,value,synergy,greedy --out tests/balance/b1/baseline-train100 --label baseline-train100

# 3) 旧结论核查（只读已产出的 JSONL/聚合，不跑新对局）
node tests/tools/balance-v1.js --analyze tests/balance/b1/baseline-train100
```

| 文件 | 作用 |
|---|---|
| `balance-v1.js` | CLI：`--self-check` / 跑批次 / `--analyze` |
| `balance-v1/engine.js` | 加载 13 个引擎文件；白名单覆盖 + 生效读回校验 |
| `balance-v1/policies.js` | 四种策略；供料/消耗/倍率建模，概率折算 |
| `balance-v1/runner.js` | 单局执行、逐期记录；命令被拒即 ERROR |
| `balance-v1/aggregate.js` | 聚合与配对比较（含逐期归属健全性检查） |
| `balance-v1/stats.js` | Wilson 区间、分位数、配对 bootstrap |
| `balance-v1/analyze.js` | 旧结论核查（观察性） |
| `balance-v1/seeds.js` | 固定 seed 合同与清单哈希 |

产出目录 `tests/balance/b1/`（`*.jsonl` 被 `.gitignore` 排除，属可重建的原始产物，不随版本提交）。

关键口径：**ERROR ≠ LOST**。命令被拒、异常、超步数一律记 ERROR 并使该批`batchOk=false`；
只有 `WON`/`LOST` 参与胜率统计。留出集（`B1-HOLDOUT-*`）在本工具中被显式拒绝，工作包A不得运行。

浏览器工具需要Node 22+与本地Edge；运行游戏不需要这些开发依赖。其余欢迎、教程、图鉴、动画等脚本在 `tests/gdd1/`，按对应改动选择。已废弃的 `guide-shots.js` / `docs/images/shot.html` 移入 [历史截图工具](../../docs/archive/README.md)，不用来生成现行页面。

## 与正式回归的区别

`node tests/run.js` 的602项为历史规则回归；`tests/gdd1/f4-run.js` 检查GDD1合同与流程。本目录侧重当前健康检查，不能把不同引擎、样本与覆盖范围的结果混成“全游戏验收通过”。现行测试边界见 [视觉规范](../../docs/VISUAL_SPEC.md#12-验收与边界)。
