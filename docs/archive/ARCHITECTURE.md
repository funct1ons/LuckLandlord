# 工程契约

## Mechanics v1 已独审 / H-1 待独审

MA-1机制固定覆盖与G8符号专项已通过独立审核（30case及真实临时browser-proof），不是前56/64无缺口或M3–M5完成。H八项开发自验待独审，见 [ROUTE_H_PROOF.md](ROUTE_H_PROOF.md)；旧机制冻结仍保留历史状态与证据不改。细节见 [MECHANICS_IMPLEMENTATION.md](MECHANICS_IMPLEMENTATION.md)，依据 [MECHANICS_ADVISORY.md](MECHANICS_ADVISORY.md)。

- schema1/rules0.3；command先完整校验输入，克隆执行，再校验提交。pending节点及付款前单次提交不改变。
- formal或显式matrix-v1 profile：collect捕获effectKey/sourceEpoch，倍率共用入口、生成共用成功预算，死亡许可与事件source/target事实分离；legacy50/10手算夹具源不变。
- 临时标签预处理→formal自然年龄→常规结构/注压→END结构→稳定延迟塔→一次自身阈值→最终账本。派生队列重新稳定排序，不是严格FIFO；epoch/visitedTypes阻止旧队列复活及往返转换。
- encode/decode为纯状态，decodeStorageRecord支持单主key封套current/previous；import经真实预渲染后仅一次主写、backup不动。普通store仍沿备份后主写的非原子语义。
- Node/file/HTTP suite各521/521（原475名称顺序保持，2项amber正式预期获批迁移）；真实UI六故障单独统计，旧审计204/207且3项契约差异FAIL保留。47行MA7映射引用核验不是独审结论。
- 最新冻结清单：tests/mechanics-v1-freeze.json；不覆写旧baseline357、suite-manifest或route-g-freeze。

普通 defer scripts 顺序：core/rng → data/content → engine/resolver → core/game → core/validation → core/save → UI/main。所有 API 在 window.Game，闭包内隔离。Node 测试使用 vm 加载相同脚本，不构建、不安装包。
引擎输入状态与固定盘面（测试可选），输出新状态与审计日志；不访问 DOM、localStorage、时间或 Math.random。控制器拥有状态，统一 revision 命令。存储适配器捕获浏览器异常；UI 只渲染。
数据 schema：id/name/rarity/tags/description/baseValue/icon/triggers/effects；effect 包含 trigger/action/scope/target/amount/priority，可选 emit、ratio、to、chance、threshold。定义与实例分离，实例 uid/type/permanent/counters。schema 自动校验 action/trigger/tag/target/emit/引用/必需参数/倍率分母/稀有度。目标范围通过Game.targetScopes映射扩展；动作通过resolver内handler映射扩展，当前不是任意第三方插件API。金额倍率BigInt有理数，显示近似数不参与金额。
M2 界面为开发可玩原型，不承诺正式美术、音效、动画或平衡。Debug 仅 #debug 显示。模拟独立 Bot RNG，浏览器分批运行并可取消。


## Current schema contract
Effects may use legacy string targets or structured selector objects (rea, tag filters, stable order, count, exclusion). Predicates and numeric expressions are bounded recursive data, not executable code; validation rejects unknown tags/actions, malformed limits, invalid ratios, and excessive nesting. Resolver budgets remain depth 32/effects 5000/spawns 40/pool 200. A–F 的48正式符号曾获独审验收；G8固定专项已独审；H-1新增通用stageAdvance、轮初配额谓词/全池谓词与持久stageState claims/paymentModifiers、READY advanceAccepted设置。schema1/rules0.3/contentVersionH-1，旧0.2/0.3缺H字段默认拒绝迁移且pending不重算。H及完整后续M3–M5待独审/未完成；A–F近邻差异仍待定点复核。原475回归包含正式路线，并非475个legacy用例。
