# 蒸馏独审纠正与 reserve_facet 修复

## 事实定位

`tests/audit-distillation.js` 的双 reserve case 使用了 `direct(types)`：该 helper 先立即执行 `G.resolve`，然后测试才写入两个实例的 `pressure=4`，随后再次 resolve。第一次 resolve 已经把两个相邻 fuel 消耗掉，因此第二次调用无法再产生两个 `reward=2`。这解释了审计实际 `38`：少的是两个消费奖励中的一个合计差额 2，不能解释为少一次 `reward=18`。

正确顺序是先建实例、写入两个 pressure=4，再首次 resolve。固定盘面 `reserve@0 wick@1 reserve@2 wick@3` 的实际日志如下（UID 以该次运行为准）：

```text
consume source=u11 target=u12 amount=2
ON_CONSUME counter source=u11 payload.source=u11 payload.target=u12
consume source=u13 target=u14 amount=2
ON_CONSUME counter source=u13 payload.source=u13 payload.target=u14
ON_END_SPIN counter source=u11 pressure 6 -> 0 reward=18
ON_END_SPIN counter source=u13 pressure 6 -> 0 reward=18
reward entries: consume 2 + consume 2 + release 18 + release 18 = 40
ledger reserve_facet: [2, 2]
```

该结论与 `CONTENT_MATRIX.md` D 区 `reserve_facet` 的“消耗一个邻接 fuel，独立奖励 2；蓄压达 6 时结束阶段发独立奖励 18 并归零”一致，也符合 `RULES.md` 的 `ON_END_SPIN` 在最终 ledger 前执行规则。brine 的第二次转换保持原裁定。

## 真实机制问题与修复

原实现中 `ON_CONSUME` 的 `scope:'event'` 会让所有 reserve 实例监听所有 fuel 消费。多个 reserve 时，非消费源也会偷增 pressure。resolver 仍保持通用实现，新增 schema predicate `eventSourceSelf:true`，通过事件 payload 的 source UID 与监听实例 UID 比较；`reserve_facet` 的 pressure listener 使用复合 predicate：目标含 fuel 且事件 source 是自身。

因此：

- 两个独立 fuel：两次消费各奖励 2，两次 pressure 各自达到 6，各释放 18，总 reward 40。
- 同一 fuel 竞争：只有稳定顺序成功者消费并得到 2，失败者不增加 pressure；成功者仍按自身 counter 释放 18。
- 非消费源不会偷加或清零 pressure。
- 每轮 `limit.perSpin` 在新 resolve 中重置。

## 新增回归

`tests/distillation-behavior.js` 新增并接入 Node/browser：

- 双 reserve 的 source/target UID、consume reward、pressure event 和最终账本精确断言
- 三 reserve 独立目标与总 reward 60
- 同 fuel 竞争只成功一次
- 非 source event 不增加 counter
- 每轮限额重置

未修改 `tests/audit-distillation.js` 或独审报告；独审原始 11/12 历史结果保留，错误来源已记录供主审复核。
