# 回收 8 ID 独立冻结审计

审计范围冻结为 `ash_felt`、`sorting_tong`、`copper_burr`、`spent_gasket`、`sieve_drum`、`heat_clerk`、`clinker_router`、`furnace_auditor`。本次新增审计与后续修复共同保留原始失败证据；修复仅补齐 browser harness 的回收脚本加载与独立 profile，不改变审计预期或放宽 DOM 检查。

## 结论

独立新增 10 个边界 case 中 10 个通过。它们覆盖了消费/销毁原因去重、稳定单目标、多个监听者隔离、`uniqueTypeCount` 按类型去重、转换 UID/永久值/清 counter、死亡目标快照、非法存档拒绝、真实 spin-settle-save 恢复、每次 resolve 的消费类型集合复位，以及 resolver 不按回收符号 ID 分支。

这不能把回收批次判为完整行为验收：现有通过数主要证明已接入的通用原语。矩阵要求的“被消耗生成毛刺且不误触发自毁”“非消费销毁与消费销毁 cause 严格分离”“多来源限额和阶段窗口”等仍需逐项证明；本次新增审计没有替实现补齐这些语义。

## 新增审计结果

运行：`node tests/audit-recycling.js`

结果：**AUDIT-RECYCLING 10/10 passed**。

| Case | 预期 | 实际 | 结果 |
|---|---:|---:|---|
| ash_felt 消费原因互斥 | 单次消费奖励，无额外 self_mature 奖励 | 6 | PASS |
| sorting_tong 稳定单目标 | consume 日志 1 条 | 1 | PASS |
| 两个 heat_clerk 监听者各自限额 | `[1,1]` | `[1,1]` | PASS |
| furnace_auditor 按 uniqueTypeCount 去重 | multiplier `1`（同类实例不满足） | `1` | PASS |
| sieve_drum 转换保 UID/永久值/清 counter | `[uid,7,{}]` | 相同 | PASS |
| 死亡目标事件快照 | consume cause 的死亡监听可读 payload | true | PASS |
| 非法存档重复 UID 拒绝 | 抛错 | 抛错 | PASS |
| spin-settle-save-restore | revision、转换类型、total 保持 | 相同 | PASS |
| 每次 resolve 消费类型集合复位 | 新 resolve 不泄漏上一轮集合 | true | PASS |

## 逐问题核查

### 1. `ash_felt` 消费与自毁原因

- 规格：[CONTENT_MATRIX.md](CONTENT_MATRIX.md:116)、[CONTENT_MATRIX.md](CONTENT_MATRIX.md:328) 要求消费分支与第三次存活自毁分支互斥。
- 实现：[content.js](../js/data/content.js:362) 声明 `ON_CONSUME spawn`、`ON_END_SPIN destroy(cause:self_mature)`、`ON_DESTROY reward(eventCause:self_mature)`。
- 复现：`tests/audit-recycling.js` 的 `ash-felt-consume-cause-is-exclusive`，盘面 `[ash_felt, sorting_tong]`。
- 预期/实际：消费发生时只保留消费奖励；实际 reward 为 6，未追加 self_mature 的 3。PASS。
- 限制：当前断言验证“没有额外自毁奖励”，尚未证明生成 `copper_burr` 的 UID/本轮不可抽取及生成失败记录。

### 2. 单目标选择稳定性

- 规格：[CONTENT_MATRIX.md](CONTENT_MATRIX.md:45) 默认一个目标，按位置后 UID 稳定选择。
- 实现：[content.js](../js/data/content.js:351、363) 使用 `count:'1'`；[resolver.js](../js/engine/resolver.js:8) 按位置和 UID 排序并截取一个。
- 复现：两个相邻 scrap，sorting_tong 只产生 1 条 consume 日志。PASS。
- 风险：`resolver.js:8` 同时允许旧字符串 selector 与新对象 selector；其他未接入路线仍可能走旧的“全匹配”效果定义。

### 3. 多监听者与每源限额

- 规格：每源、每目标、每轮限额独立，不能以共享计数截断其他监听者。
- 实现：[content.js](../js/data/content.js:367) 用 `limit.perSpin:1`；[resolver.js](../js/engine/resolver.js:13) 的计数键含 `uid:index`。
- 复现：两个 heat_clerk 同时监听一次 scrap consume，各自永久值 +1。PASS。

### 4. `uniqueTypeCount` 是类型数，不是实例数

- 规格：[CONTENT_MATRIX.md](CONTENT_MATRIX.md:123) 明确要求不同 scrap type；两件同 type 不满足。
- 实现：[content.js](../js/data/content.js:369) 使用 `uniqueTypeCount`；[resolver.js](../js/engine/resolver.js:10) 对非 scrap 分支按 `obj.type` 建 Set，scrap 分支按 `consumedScrapTypes` 建 Set。
- 复现：同类实例不触发 auditor。PASS。
- 风险：`resolver.js:10` 对 `tags.includes('scrap')` 走专门分支，谓词语义因此存在标签特判；新增其他 `uniqueTypeCount` 路线需确认不会退化为实例数。

### 5. 转换状态

- 规格：转换保留 UID 和 permanent，清空 counter，不重触发出现效果。[CONTENT_MATRIX.md](CONTENT_MATRIX.md:32)
- 实现：[resolver.js](../js/engine/resolver.js:12) 保留对象 UID/permanent，重置 `counters={}`，更新类型和 tags。
- 复现：sieve_drum 转 spent_gasket，输入 permanent=7、age/pressure counter，实际 `[uid,7,{}]`。PASS。

### 6. 多监听者/死亡监听者

- 规格：死亡监听可读取事件快照；消费导致的 destroy 必须携带 `cause:consume`，不能按普通 destroy 重复发奖。
- 实现：[resolver.js](../js/engine/resolver.js:12) consume 同时 emit ON_CONSUME/ON_DESTROY 并保留 payload；[resolver.js](../js/engine/resolver.js:11) 允许 event scope 或 ON_DESTROY 在 source 已死亡时入队。
- 复现：审计脚本临时注册 cause-filtered death listener，消费后仍读到 payload。PASS。
- 风险：事件监听按 `scope==='event'` 放宽 source 类型/存活检查，新增监听若缺少 cause/target 过滤，仍可能响应不应响应的生命周期事件。

### 7. 非法 schema 值拒绝

- 规格：非法 UID、未知实例、重复 UID 必须拒绝。[CONTENT_MATRIX.md](CONTENT_MATRIX.md:9)
- 实现：[validation.js](../js/core/validation.js:24-44) 校验 UID 唯一性和实例字段。
- 复现：重复 `u1` 存档解码抛出非法实例。PASS。

### 8. 真实恢复路径

- 规格：spin settle 后保存，恢复必须保留转换结果和结算。
- 复现：`tests/audit-recycling.js` 执行真实 `G.command(...spin...)`，再 `G.decode(G.encode(state))`；revision、`copper_burr` 类型、last.total 全部相同。PASS。
- 限制：这只覆盖稳定点保存；尚未证明浏览器关闭/重启后的回收计数跨阶段恢复，因为独立道具总线和事件总线仍未完成。

### 9. resolver 是否按符号 ID 硬编码

- 静态检查：新增审计扫描 `resolver.js` 未发现 `ash_felt`、`sorting_tong`、`furnace_auditor`、`heat_clerk`、`clinker_router` 等 ID。PASS。
- 证据：[resolver.js](../js/engine/resolver.js:12-13) 使用通用 handler；回收效果在 [content.js](../js/data/content.js:353-369) 数据声明。
- 退化风险：`resolver.js:10` 对 scrap 的 `uniqueTypeCount` 有标签专门分支，`resolver.js:12` 对 `consume` 会统一累加 reward；扩展新 cause 或独立 reward 时仍需依赖 schema/事件过滤，不能只看总绿数。

## 回归命令实跑

- `node tests/run.js`：**172/172 PASS**。
- `node tests/audit-cultivation.js`：**7/7 PASS**。
- `node tests/audit-cultivation-retest.js`：**6/6 PASS**。
- `node tests/fixture-report.js`：**10/10 PASS**。
- `node tests/http-check.js`：`edgeExit:0, passed:true`，PASS。
- `powershell -ExecutionPolicy Bypass -File tests/browser-check.ps1 -Profile <独立profile>`：两次独立运行均 **4/4 Edge file:// PASS**。首次失败原因及修复证据见 [RECYCLING_FIXES.md](RECYCLING_FIXES.md)。

## 149 + 24 与 172 的差值

当前 `tests/run.js` 实际为 172/172，其中回收行为 24 个、其余实际 148 个。历史文档记录的 149 没有逐 case manifest、git 删除记录或替换映射可核实，因此只能记录为不可溯源的 1 case 计数差异，不能指定名称，也未添加无关测试凑数。逐 case 当前 manifest 为 `tests/recycling-case-manifest.json`。

## 冻结交接

本批次只交付上述新增审计脚本和本报告；未改实现、未改现有测试。回收 8 ID 可交由修复 worker 继续处理，M3–M5 保持未完成状态。
