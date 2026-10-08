# 实现与审核进度

## 已验收

- 前六路线 A–F：**48 个正式符号已通过独立审核**。G 开始前统一回归基线为 **357/357**；旧 case 名称、顺序与预期未迁移。
- 压力现金事务保持 `pendingSettlement`：spin 仅产生待结算额，choose 一次性提交；保存/恢复、失败写入与重复提交保护仍通过回归。历史修复记录见 [PRESSURE_FIXES.md](PRESSURE_FIXES.md)、[PRESSURE_TRANSACTION_RETEST.md](PRESSURE_TRANSACTION_RETEST.md)。

## Mechanics v1 A–E 已独审（固定覆盖）

- 已完成通用倍率/生成限制、事件归属与死亡许可、epoch/自然年龄/压力检查点、完整状态入口校验、rules0.2→0.3迁移和单主key导入封套。**MA-1固定机制与G8专项已获主审独审通过**，依据MECHANICS_V1_AUDIT独立30case、逐ID及真实临时浏览器工件；不是前56/64无缺口，也不是M3–M5完成。旧冻结状态/证据不改写历史。
- Node/file/HTTP suite各 **521/521 = 原475 + 新46**；原475含正式case，不是475个legacy。原475名称顺序保持，2项amber正式reward10→14迁移已批准；legacy/core50源码及手算10夹具源码不变。旧setup字段迁移为零。
- 真实UI六项导入故障独立统计（不混Node521）；file fresh-profile四检查、HTTP suite/UI两检查通过，case名称顺序及结果一致。
- 11个旧独审本批逐进程 **204/207，3项FAIL保留**：cargo初审ghost reservation、cargo-retest运行时ghost reservation、recycling无死亡许可的formal dead listener。不得沿用旧“全部独审全绿”描述本批；其他8脚本通过。
- 压力--http另单跑49/49、严格smoke/pressure DOM及4独立UI；fixture-report另单跑10/10。
- [MECHANICS_IMPLEMENTATION.md](MECHANICS_IMPLEMENTATION.md)记录实际接口、时序、格式、迁移及精确FAIL；tests/mechanics-v1-ma7-map.json逐行47条引用映射仅证明case名存在，不是独审通过证明。
- tests/mechanics-v1-freeze.json保存源/新证据SHA256、旧48sources授权差异及26历史evidence相同证明；旧baseline357/suite-manifest/route-g-freeze不覆写。

## 历史 G 开发自验记录（不代表本批最新结果）

- G 异相映印：八个符号及通用原语已实现，**待独审，不列入已验收 48 个**。
- 当前 Node / Edge suite **475/475 = 原 357 + G 118**；Node 保留不可变基线并逐名逐序验证，browser 全 case 与 Node 一致。
- 以下是旧 route-g 冻结记录：当时11 个既有 `audit-*.js` 全绿；不代表mechanics-v1本批独审通过。pressure-retest 另实跑 `--http`（49/49 + UI 4/4 严格 DOM）；独立 fixture-report 10/10；新 profile Edge file 4/4；额外新 profile HTTP suite/UI 2/2。
- 规则、逐 ID 手算预期、测试、命令、DOM 和冻结证据见 [ROUTE_G_PROOF.md](ROUTE_G_PROOF.md)。自动浏览器验证不等同于视觉或人工游玩验收。

## H 契约套利已独审（文档覆盖范围）

- H 八项已完成独立审核，**在 [ROUTE_H_AUDIT.md](ROUTE_H_AUDIT.md) 记录的覆盖范围内 PASS**；独立边界用例 **61/61**，涵盖逐 ID 行为、阶段领取与义务、READY 设置、pending 恢复、迁移和事务边界。此结论不是全 64 符号无缺口或 M3–M5 完成的声明。
- 独审另行重跑 Node **602/602 = 原521 + H81**，并用新 Edge profile 执行 file/HTTP suite，逐 case 名称、顺序、状态及错误与 Node 和冻结 manifest 一致。真实 UI 六项导入故障与 H 三项设置/拒绝/恢复用例分别通过，storage write/read 通过；浏览器工件位于独审报告记录的系统临时目录。
- 原521名称顺序保留，仅两处获批 G 复制预期迁移：cleared_stub 的平面 +1 成为第三项显式可复制模板；依据及原/新断言见 [ROUTE_H_PROOF.md](ROUTE_H_PROOF.md)。开发冻结与历史证据保留，不改写为新的审核产物。
- 既有历史审计仍为 **204/207**，原三项契约冲突保留；H 独审不重新扩大 MA-1/G8 的既有验收范围，也不宣称穷尽所有 schema 嵌套字段或跨路线组合。

## 仍未完成

- **G overall、M3–M5 其余验收工作仍未完成**。G8 固定专项和 H 文档覆盖范围通过，不等于全前56/64无缺口；A–F顾问列出的近邻差异仍待定点复核。
- **32 items、8 events** 的完整矩阵实现与审核、完整事件/阶段 modifier 总线、候选权重、长期经济平衡、视觉完善及人工完整游玩仍未完成。
