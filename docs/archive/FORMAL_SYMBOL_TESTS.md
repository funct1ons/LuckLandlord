# Formal A/B/D symbol tests

独立入口：[tests/formal-symbols.js](../tests/formal-symbols.js)。Node 与浏览器均加载该文件；本轮实际结果为 **125/125 passed**（旧 50 + 新 75）。每个 ID 有命名 `schema-defined` 与 `schema-negative` case，并对关键机制增加正/负行为 case。

| ID | 语义 | 正/负 case | 实际结果 |
|---|---|---|---|
| mist_pouch | age 达 3 转 dew_lantern | age-3-positive / age-2-negative | PASS |
| wick_bed | plant/fuel 基础产出 | base-production / schema-negative | PASS |
| dew_lantern | age 达 2 转 amber_frond | conversion-positive / conversion-negative | PASS |
| amber_frond | consume 后独立 reward | consume-reward / schema-negative | PASS |
| fog_stitcher | 邻接 plant 计数 | plant-filter / schema-negative | PASS |
| root_ledger | plant 转换成长 | plant-convert-reward / schema-negative | PASS |
| warm_pod | 邻接 fuel 条件 | fuel-condition / schema-negative | PASS |
| nursery_gauge | 全盘 plant 数量门槛与倍率 | plant-count-negative / schema-negative | PASS |
| ash_felt | consume spawn copper_burr | consume-spawn / schema-negative | PASS |
| sorting_tong | 单目标 scrap consume | scrap-target / schema-negative | PASS |
| copper_burr | machine 邻居条件 | machine-condition / schema-negative | PASS |
| spent_gasket | junk 负基础值 | negative-base / schema-negative | PASS |
| sieve_drum | junk 转 copper_burr | junk-filter / schema-negative | PASS |
| heat_clerk | scrap 计数条件 | scrap-count / schema-negative | PASS |
| clinker_router | junk destroy | destroy-cause / schema-negative | PASS |
| furnace_auditor | 两种 scrap 门槛 | scrap-count-negative / schema-negative | PASS |
| brine_strip | 第二次上盘转 saline_ampoule | age-2-positive / age-2-negative | PASS |
| saline_ampoule | feedstock 基础产出 | base-production / schema-negative | PASS |
| condense_coil | 单目标 feedstock 转 tide_prism | feedstock-filter / schema-negative | PASS |
| tide_prism | 转换获得奖励、直抽无奖励 | direct-draw-no-transform-bonus / schema-negative | PASS |
| deep_still | 邻接 mist 消耗条件 | mist-negative / schema-negative | PASS |
| crystal_index | 两种 crystal type 门槛 | crystal-count-negative / schema-negative | PASS |
| pearl_separator | 排除 product crystal | product-filter / schema-negative | PASS |
| reserve_facet | 邻接 fuel 消耗并记录 | fuel-pressure / schema-negative | PASS |

所有数值断言按矩阵规则手算；没有调用引擎生成预期值。旧 `tests/suite.js`、10 fixture、浏览器入口继续保留。
