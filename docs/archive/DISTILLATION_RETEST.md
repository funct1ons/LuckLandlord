# 蒸馏 8 冻结复测报告

复测范围：当前冻结实现、`DISTILLATION_FIXES.md`、8 个蒸馏 ID、事件源归因与保存恢复。仅修改了 [tests/audit-distillation.js](../tests/audit-distillation.js) 并新增本报告；未修改实现、既有行为测试、矩阵或 manifest。

## 结论

| 检查 | 结果 |
|---|---:|
| 蒸馏 8 独立审计 | **PASS：17/17** |
| Node 全套 | **PASS：201/201** |
| cultivation audit | **PASS：7/7** |
| cultivation retest | **PASS：6/6** |
| recycling audit | **PASS：10/10** |
| fixture | **PASS：10/10** |
| Edge file | **PASS：4/4** |
| HTTP | **PASS**，`tests/http-smoke-result.html` |

独立审计命令：

```text
node tests/audit-distillation.js
```

输出：

```text
DISTILLATION AUDIT 8: 17/17 passed
```

## 对上次误报的追踪与修正

上次双 reserve case 使用 `direct(types)`，而 `direct()` 的实现是：

```js
const s = state(types);
return {s, r: G.resolve(s, s.symbols.map(x => x.uid))};
```

它先执行第一次 `G.resolve`，第一次已经消费了相邻 fuel；之后再写入 pressure=4 并第二次 resolve 时，消费奖励当然缺失。`38` 比 `40` 少的是两个消费奖励中的一个合计差额 2，不能解释成少了一份 18 的释放。当前脚本改为先构造原始 state、先写两个 pressure=4，再只执行一次固定盘面 resolve：

```text
reserve_facet@0, wick_bed@1, reserve_facet@2, wick_bed@3
```

两个 reserve 各有独立合法 fuel，实际得到两次 consume reward 2 和两次 release reward 18，总计 40。

同时按规则重读并保留以下裁定：

- `CONTENT_MATRIX.md` D 区：`brine_strip` 是“第 2 次上盘转换为 saline_ampoule”。复测预置 `age=1`，第二次上盘转换 PASS。
- `CONTENT_MATRIX.md` reserve_facet 行：pressure 达 6 后“结束阶段”奖励 18 并归零。
- `CONTENT_MATRIX.md` 统一结构说明：reserve 等实例在结构动作完成后统一阈值步骤。
- `RULES.md`：`ON_END_SPIN` 在最终 ledger 前执行。故“结束阶段”按 spin 结束处理阶段解释，不引入付款阶段末或租金延迟契约。

## 新增精确复测覆盖

除原有 12 个 case 外，新增 5 个边界 case：

- 双 reserve 独立 source/target：两个消费事件各自只更新自身并总奖励 40。
- 三 reserve 独立 source/target：三个固定合法 fuel，各自消费并释放，总奖励 60。
- 同一 fuel 竞争：两个 reserve 竞争一个 fuel，仅稳定成功源消费、得 reward 2 并释放 18；失败源 pressure 保持 4。
- 死亡 target 快照：消费后 target 已死亡，事件日志仍保留 source UID、target UID、cause 和 targetTags，快照监听奖励精确计入。
- 非法 `eventSourceSelf` 类型：schema 拒绝字符串值；`eventTargetType` 非法值仍被拒绝。
- 多轮保存恢复：第一轮 settle/save/restore 后，第二轮消费使 pressure 达阈值并释放，奖励精确为 20。

当前 resolver 的 `eventSourceSelf:true` 与复合 `when` 已通过双源、三源、竞争和死亡快照检查；未发现剩余蒸馏 8 事件源归因 BUG。

## Manifest 核对

`tests/suite-manifest.json` 机器结果：

```json
{
  "total": 201,
  "passed": 201,
  "failed": 0,
  "suites": {
    "core": 50,
    "formal": 75,
    "cultivation": 24,
    "recycling": 23,
    "distillation": 29
  }
}
```

原有 172 个 case 名称保留；新增蒸馏行为测试为 5 个，Node 总数从 196 增至 201。独立审计 17 个 case 不写入 suite manifest，避免把外部审计计数混入正式 suite。

本报告只裁定蒸馏 8 及其直接事件/保存边界为 PASS，不代表 M3–M5 全部内容已经完成。
