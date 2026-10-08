# 回收 8 ID 独立复测

本轮复测只核查冻结的回收 8 ID：`ash_felt`、`sorting_tong`、`copper_burr`、`spent_gasket`、`sieve_drum`、`heat_clerk`、`clinker_router`、`furnace_auditor`。只读检查实现；本轮只新增本报告，未改实现或现有测试。结论不扩展到 M3–M5。

## 修复与历史证据核对

已完整阅读 [RECYCLING_FIXES.md](RECYCLING_FIXES.md)。worker 修复范围是浏览器 harness：`tests/index.html` 显式加载 `recycling-behavior.js`，`tests/browser-check.ps1` 增加独立 profile 参数并继续要求 Edge exit code 为 0 且 DOM 包含 `data-result="pass"` 或 smoke pass 标记。

历史首次 FAIL 证据仍保留：首次 `index.html` Edge exit=0，但因缺少回收脚本导致 `recyclingBehaviorTests` 未定义，DOM 没有 `data-result="pass"`。该事实在 [RECYCLING_FIXES.md](RECYCLING_FIXES.md:7-17) 和更新后的 [RECYCLING_AUDIT.md](RECYCLING_AUDIT.md:97) 中仍有记录。没有把历史失败改写为历史通过，也没有放宽 DOM 检查。

`tests/index.html` 当前脚本顺序包含 `recycling-behavior.js`，且 `browser-tests.js` 仍无条件调用 `window.Game.recyclingBehaviorTests()`；这证明浏览器与 Node 使用同一回收行为脚本。`browser-check.ps1` 当前检查条件仍是：`$p.ExitCode -ne 0 -or $content -notmatch 'data-(result|smoke)="pass"'` 时失败。

## 本轮实跑结果

| 检查 | 结果 |
|---|---|
| `node tests/run.js` | **172/172 PASS** |
| `node tests/audit-recycling.js` | **10/10 PASS** |
| `node tests/audit-cultivation.js` | **7/7 PASS** |
| `node tests/audit-cultivation-retest.js` | **6/6 PASS** |
| `node tests/fixture-report.js` | **10/10 PASS**，10 fixtures 均匹配独立手算期望 |
| `node tests/http-check.js` | **PASS**，`edgeExit:0, passed:true` |
| `tests/browser-check.ps1` 新 profile | **4/4 PASS**：`index.html`、`ui-smoke.html`、storage write、storage read 均 Edge exit=0 且 DOM pass |

Browser 命令使用全新临时 profile：

`powershell -ExecutionPolicy Bypass -File tests/browser-check.ps1 -Profile <new-guid-profile>`

未复用历史 profile，也未以历史 HTML 产物代替本轮 DOM 检查。

## browser DOM 核对

PASS 条件没有被放宽。脚本仍同时验证进程退出码和页面标记；`index.html` 页面由 `browser-tests.js` 汇总 Node suite、培育 suite、回收 suite，只有全部结果 `ok` 才设置 `document.body.dataset.result='pass'`。storage 页面仍由各自 smoke 标记验证。四项均通过，说明本轮浏览器确实加载并执行了回收行为脚本。

## manifest 与 legacy 核对

读取 [tests/recycling-case-manifest.json](../tests/recycling-case-manifest.json)：

- `generated: current`
- `total: 172`
- `pass: 172`
- `fail: 0`
- `cases.length: 172`

逐项边界匹配如下：manifest 第 1 项是 `schema 20 legacy+正式定义`，第 50 项是 `ON_SPIN/ON_END_SPIN广播各一次，不随格数重复`；第 51 项开始是 `formal/...`，第 126 项开始是培育行为，第 150 项开始是 `recycling/...`，最后一项是 `recycling/save/restore-after-recycling`。当前 manifest 中实际匹配到 **23** 个 `recycling/...` case，与 `tests/recycling-behavior.js` 的 23 个 `run(...)` 一致；没有 24 个回收 case。

legacy 完整性：当前 `tests/suite.js` 运行的原型核心集合实际为 **50/50**，manifest 前 50 项全部是 legacy/core suite；没有发现为凑总数删除或替换 legacy case 的证据。正式 schema/formal、培育和回收分别从第 51 项以后追加计数。

计数核对的关键结果是：当前回收脚本和 manifest 都只有 **23** 个回收 case，而 worker 修复文档及历史说明写成 24。当前总数 172 - 实际回收 23 = 149 个非回收 case，恰好与历史 149 对齐；因此本工作区可证实的是“149 + 23 = 172”，不能把回收批次写成新增 24。缺少的第 24 个回收 case 无法从当前脚本、manifest 或历史证据定位，不能编造名称。

## 回收 8 批次结论

**条件 PASS / 计数 FAIL**：当前脚本中的 23 个回收行为 case、独立 10 个审计 case、浏览器 harness 加载、真实 save/restore、HTTP 及四项 Edge file 检查均通过；但“回收新增 24 case”的批次计数声明与当前真实 manifest 不匹配，因此回收 8 批次整体不能标记为无条件 PASS。

该 PASS 只表示本批次已有实现和本轮独立检查通过。它不表示回收矩阵所有未来边界都已实现，也不表示 M3–M5 通过。事件总线、持续道具、锁位/加权抽样、完整 P1–P12 和其余路线仍在既有缺口范围内。
