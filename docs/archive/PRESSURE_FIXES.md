# F 压力审核修复记录

独立审核初始结果为 25/39，14 FAIL。修复后原始 `tests/audit-pressure.js` 为 **39/39**，没有改动其预期。

## 根因与修复

1. **现金未提交**：`game.js` 在 `spin` 后只写入 `last/stats/history`，`choose` 仅处理候选和付款，导致 `cash=5`、本轮普通收益 `1` 最终仍为 5。根因是结算提交路径被删除，状态机仍停在 `SYMBOL_CHOICE`。新增 `pendingSettlement`：resolve 完成后持久化待提交金额，完成一次 `choose` 时原子入账并清空；旧 revision 重复命令和存档重载不会重复入账。支付在入账后执行，负收益按现金下限 0 处理。
2. **release_spire 目标选择**：旧实现先按位置取一个目标，`releasePressure` 才检查压力，低压目标会挡住后续合法目标；且已达到自身释放阈值的目标会被塔抢走。现在 selector 对压力目标先做有界计数过滤，再排除已满足声明式 counter 阈值的目标，最后按位置/UID稳定取一个。
3. **riskGuard 误保护 legacy 风险**：旧 resolver 只扫描相邻 guard，没有检查风险源标签，`gambit` 也会被保护。现在只对带 `pressure` 标签的风险源启用保护，保护器每轮按稳定顺序最多使用一次，多源/多副本独立处理，失败生成事实保留。
4. **counter 存档与 schema**：旧 `validateState` 只检查 counters 是对象，允许负值、超安全整数和未知键；content schema 也没有 counter 专属字段校验。现在只允许 `age/beat/pressure`，值必须是 0–1e9 安全整数；counter 的 delta/max/reset/at 必须是非负安全整数，未知字段拒绝；releasePressure 必须有正整数 ratio；risk loss/amount 必须是安全整数。

## 精确回归

- F31 验证真实 `spin → SYMBOL_CHOICE → choose(skip) → READY`：cash 5 + last.total 1 = 6。
- F20 验证离盘 spin 后保存、重载、再上盘不会提前提交或重复提交。
- F12/F13/F21/F22 验证 release_spire 的阈值排除、低压跳过、单目标竞争与一次释放。
- F23–F27 验证 counter、release、risk 非法参数和存档值拒绝。
- F28/F29/F32/F33 验证压力风险范围、边缘保护、损失封顶、多源保护和下一轮复位。
- F34 保留 recycling 迁移语义：router pressure 2、pouch pressure 1、reward 0、total 3，并精确检查监听目标 UID。

## 实测结果

- `node tests/audit-pressure.js`: 39/39
- `node tests/run.js`: 305/305
- `node tests/fixture-report.js`: 10 fixtures，全数手算匹配
- 8 个旧独审脚本：全部通过
- Edge file checks：4/4，browser DOM 305/305
- HTTP Edge smoke：通过
- 机器计数：旧 277 + 压力 27 + 回收隔离 1 = 305。此前“压力 28”已更正为“压力 27 + 回收隔离 1”。
