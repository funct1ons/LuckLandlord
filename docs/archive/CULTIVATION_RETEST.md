# 培育修复独立复测报告

本次复测在冻结实现上完成，只新增独立脚本 [tests/audit-cultivation-retest.js](../tests/audit-cultivation-retest.js) 与本报告；未修改实现或现有测试。审核范围仍限培育八个 ID，不能据此声称 24 或 64 个符号全部实现，也不能声称 M3–M5 完成。

## 命令结果

- `node tests/run.js`：**PASS 149/149**。
- `node tests/audit-cultivation.js`：**PASS 7/7**。
- `node tests/audit-cultivation-retest.js`：**PASS 6/6**。
- `node tests/fixture-report.js`：**PASS 10/10**，报告为 `all match manual expectation: true`。

## 本次独立复测

1. **root 每 UID / effect perSpin 限额**：两个 root ledger 各自处理同轮前两次 plant 转换；下一轮计数隔离并继续成长。通过。`formalM3` 中 root effect 位于 [content.js](../js/data/content.js:359)，使用 `scope:event`、`eventTargetTags:["plant"]`、`limit.perSpin:2`；resolver 的计数 key 使用监听实例 UID 与 effect index，见 [resolver.js](../js/engine/resolver.js:12)。
2. **ash_felt 三次上盘**：新增 ON_APPEAR counter、第三次 END_SPIN destroy、self_mature ON_DESTROY reward，真实 `command spin → choose → spin` 生命周期通过；未上盘不推进。通过。定义位于 [content.js](../js/data/content.js:362)。
3. **consume cause 隔离**：sorting_tong 消耗 ash_felt 时只得到消费奖励，不触发 self_mature 奖励。通过。consume 事件 payload 明确 `cause:'consume'`，见 [resolver.js](../js/engine/resolver.js:13)；事件谓词读取 `eventCause`，见 [resolver.js](../js/engine/resolver.js:10)。
4. **四个 ID 专用分支移除**：独立静态检查未发现 resolver 中针对 `warm_pod`、`amber_frond`、`root_ledger`、`nursery_gauge` 的 ID 条件分支。通过。四者由 effect schema 定义，见 [content.js](../js/data/content.js:357-362)。
5. **通用 event scope / 死亡快照**：event scope 可在目标死亡后读取事件 payload；现有 149 测试中的销毁快照用例与本次事件 predicate 复测均通过。`collect` 对 event scope 和 ON_DESTROY 保留监听，见 [resolver.js](../js/engine/resolver.js:12)。
6. **schema 严格拒绝**：非法 scope、未知 `eventTargetTags`、非字符串 `eventCause` 均被 `G.validateContent()` 拒绝。新增字段校验位于 [content.js](../js/data/content.js:564-566)，scope 白名单位于 [content.js](../js/data/content.js:579)。
7. **保存恢复计数**：ash_felt 两次上盘后 `G.encode/G.decode`，再通过真实 command 完成第三次上盘，自毁并获得 3 reward。通过，证明 counters 在稳定节点保存恢复后继续有效。

## 剩余问题与边界

本批培育修复未发现 FAIL。仍不能扩展结论：

- `tests/formal-symbols.js` 的行为覆盖仍集中在 A/B/D 三组 24 个 formal ID；其余路线和完整 64 符号行为不因 149/149 通过而自动完成。
- 32 件持续道具的完整生命周期、事件完整流程、锁位与加权抽样、完整 P1–P12 仍未由本次审核验收。
- 本报告只证明培育八及其直接通用原语的冻结复测结果，不证明 M3、M4、M5 总体完成。

## 结论

培育八修复复测：**PASS**。149 个既有测试、7 个既有独立审计、6 个新增独立复测和 10 个 fixture 全部通过；总体内容范围仍按未完成项目处理，禁止将本报告表述为 24 或 64 个符号全实现证明。
