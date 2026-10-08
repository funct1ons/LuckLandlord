# Cultivation fixes

本次独立审核指出的两项确定错误已按通用 effect schema 修复，未修改 `tests/audit-cultivation.js` 的预期：

- `root_ledger` 现在由 `ON_TRANSFORM` + event payload 的 `eventTargetTags: ["plant"]` + `limit.perSpin: 2` 表达。resolver 的计数 key 按监听实例 UID 与 effect index 记录，因此两个 root ledger 在同一轮各自获得两次成长；下一轮计数自然复位，死亡监听者不会继续生效，permanent 仍由通用 grow handler 封顶 30。
- `ash_felt` 现在由通用 `ON_APPEAR` counter 推进 age、`ON_END_SPIN` destroy 和带 `eventCause: "self_mature"` 的 `ON_DESTROY` reward 表达。未上盘不推进；第三次上盘结束时自毁并 reward 3；consume 通过 cause=consume 的销毁事件不会满足 self_mature，因此不会重复奖励。
- `warm_pod`、`amber_frond`、`root_ledger`、`nursery_gauge` 的 resolver ID 专用分支已移除。warm 使用已有 neighbor predicate；amber 使用 ON_CONSUME event scope reward；root 使用事件 payload/tag predicate 与 per-source limit；nursery 使用 conversion predicate、board selector 与 per-spin limit。
- predicate schema 扩展了 `eventTargetTags`、`eventCause`、`plantConvertCount`、`convertCount`，并保留结构校验；事件 scope 可读取死亡目标快照。

实际结果：Node `149/149 passed`；audit `7/7 passed`；fixture `10/10`；Edge file `data-result="pass"`；Edge HTTP `passed: true`。

M3–M5 总体仍未完成，事件完整流程、32 件道具、锁位/加权抽样、完整 P1–P12 和其他路线机制继续等待后续工作与独立审核。
