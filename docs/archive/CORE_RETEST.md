# M0–M2 独立复测报告

## 复测范围与限制

本次复测依据 `EXECUTION_PLAN.md`、`docs/CORE_REVIEW.md`、`docs/CORE_FIXES.md`、`docs/TEST_REPORT.md`、`docs/RULES.md`、`docs/PROGRESS.md`，并读取 `js/core/*`、`js/engine/*`、`js/data/content.js`、相关 UI、测试套件、fixture 与浏览器脚本。复测期间只写入本报告，未修改实现、规则、测试或其他文档，未另派 agent。

浏览器部分执行的是现有自动化 Edge DOM 点击/存档脚本。它证明脚本覆盖的流程与状态结果，不等于人工试玩、视觉审查或手感验收；本报告不把自动点击称为人工游玩。

## 执行证据

| 检查 | 结果 | 证据 |
|---|---|---|
| `node tests/run.js` | **50/50 passed** | 控制台完整输出；覆盖 RNG、抽样、竞争消耗、转换、倍率、回滚、付款、存档、schema、revision、时序与作用域 |
| `node tests/fixture-report.js` | **10/10 matched** | 输出 `all match manual expectation: true`；每例实际盘面至少 4 类，最大因果深度 3 |
| `powershell -NoProfile -ExecutionPolicy Bypass -File tests/browser-check.ps1` | **4/4 Edge checks passed，进程退出码均 0** | `tests/browser-result.html`、`ui-smoke-result.html`、`storage-write-result.html`、`storage-read-result.html` |
| `node tests/http-check.js` | **Edge exit 0，passed true** | `tests/http-smoke-result.html` |
| `node tests/run.js simulate 1000` | **1000 局无异常** | `errors: []`，平均阶段 10，value 胜率 100% |

初次报告提到的 Edge stderr/退出码问题已按脚本实际方式重跑；本次 `browser-check.ps1` 四个子进程均直接返回 0，未以 stderr 警告作为通过依据。

## 原六项缺陷独立复现

我用独立 Node VM 重新加载核心脚本，并分别构造原审核输入：

1. **缺失 stats：通过修复。** 将 `stats` 改为空对象后 `G.decode` 返回 `非法统计`。
2. **损坏 last 引用：通过修复。** `last.board` 使用未知类型后 `G.decode` 返回 `非法结算快照`，不会接受该状态。
3. **伪 WON：通过修复。** 普通新局仅改 `phase='WON'` 后被 `G.decode` 以 `非法付款状态` 拒绝。
4. **100×29/100：通过修复。** 独立注入倍率并执行一次 Spin，结果 `total: 29`；代码使用 BigInt 分子/分母，未把浮点误差固化到金额。
5. **非法 schema 参数：通过修复。** 未知 target、零分母、非法 priority、未知 emit 的效果定义被 `validateContent()` 返回 `Invalid effect slag` 拒绝。
6. **主档缺失但备份存在：通过修复。** 仅提供 `fog-port.save.v1.backup` 时 `G.load()` 返回 `ok:true`，并带 `warning: 主档缺失，已恢复备份`。

此外独立验证 `choose` 缺少 revision 返回 `过期命令`；测试套件同时覆盖缺失和过期 revision。

## 导入事务与浏览器流程

`tests/ui-smoke.js` 在 Edge 中实际通过正常 DOM 点击流程：价值选择路线完成 WON；持续跳过路线完成 LOST；重复 Spin 不提交；符号待选阶段保存/继续前后状态、候选与 RNG 一致；坏档导入覆盖缺 stats、未知快照类型和伪 WON，均被拒绝，原状态与原主档保持不变；跨 Edge 进程恢复待选状态并验证下一条选择命令结果一致。

`tests/storage-smoke.js` 的 write/read 两个独立页面也通过，证明脚本覆盖的 file 存档重启恢复路径。`tests/http-check.js` 进一步通过 localhost HTTP UI 烟测。

未验证项目仍包括人工完整 Run、Chrome、干净机器、三种分辨率、视觉可读性及实际文件选择器/下载动作；这些属于后续实机/人工验收边界，不能由自动脚本替代。

## revision 强制复测

`G.command` 在所有命令入口先要求 `cmd.revision === state.revision`。缺少 revision 的选择命令被拒绝，过期 revision 也被拒绝；现有 UI、Bot 与测试调用均传当前 revision。重复点击在浏览器烟测中没有产生第二次提交。

## 导入事务复测

`decode` 在替换状态前执行完整校验；UI 导入路径在成功渲染与保存后才提交状态，失败时保留原状态。Node 测试覆盖损坏/未来/重复/未知/phase/RNG/金额/候选等拒绝场景；浏览器自动烟测覆盖坏档拒绝、状态不变和主档不变。存储写入失败回归也通过，未提交新档。

## 十个复杂 fixture 与因果链

`fixture-report.js` 报告 10 例均与独立手算期望相符。源 fixture 与测试同时核对实际盘面类型、人工公式、parent/depth 因果日志和最大深度 3，而不是只检查结果数字。当前十例包含回收、复制接入、竞争消耗、邻接调频、销毁哨、转换后监听、永久成长双倍率、成熟、自毁哨和生成下轮出现等不同交互；测试输出确认每例至少 4 种实际符号类型。

复测结论是：满足本次 M2 门禁所要求的 10 个真实多类型、三层因果 fixture。它们仍共享部分基础回收链，不能单独证明所有未来内容组合都已覆盖；转换竞争、失效队列、自毁快照、END_SPIN 及生成预算另有专项回归，并已包含在 50/50 中。

## M0–M2 门禁结论

| 里程碑 | 结论 | 依据与边界 |
|---|---|---|
| **M0 规则冻结与工程契约** | **通过** | `docs/RULES.md` 已明确抽样、邻接、付款顺序、END/GAIN 时序、精确倍率、revision、存档状态和保护预算；50/50 覆盖关键契约。正式内容/视觉不属于 M0 本次阻断。 |
| **M1 纯逻辑核心与可玩闭环** | **通过** | 50/50、正常 Edge 自动胜败流程、跳过失败流程、file/HTTP 加载、跨进程存档恢复、坏档事务保护均有证据。人工试玩、Chrome 和三分辨率仍待后续验收。 |
| **M2 效果引擎与复杂交互验证** | **通过** | 精确有理倍率、全局倍率、目标作用域、稳定队列、回滚、schema、强制 revision、10 个真实多类型 fixture 和专项时序/预算测试均通过。复制仍是规则明确的受限 ON_APPEAR/add 原型，不应扩大解释为任意模板复制。 |

## 未作为 M0–M2 阻断的后续项

1000 局模拟无异常，但 value 策略胜率为 100%，说明当前原型经济尚未调平；测试输出也明确不把它当正式平衡或趣味证明，正式平衡属于 M5。未完成的正式道具/事件、锁定、60+ 内容、正式视觉、音效、人工三局、Chrome/干净 PC 和三分辨率验收属于 M3+ 或 M8 范围，不阻断本次 M0–M2 复测。

本报告结论仅覆盖本次实际执行的证据；未执行的人工和视觉项目保留为待测，不写成通过。
