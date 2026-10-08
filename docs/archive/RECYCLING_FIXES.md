# RECYCLING_FIXES

本次只修复浏览器 file:// 证据链，不扩展回收内容。

## 根因

独立审计首次运行中，`tests/index.html` 未加载 `tests/recycling-behavior.js`，但 `tests/browser-tests.js` 无条件调用 `window.Game.recyclingBehaviorTests()`。因此浏览器脚本在设置 `document.body.dataset.result` 前抛出 `TypeError`，DOM 保持 `运行中`，`data-result="pass"` 缺失。Edge 进程仍正常退出，故仅看 exit code 会错误地把本次检查当成通过。

## 修复

- 在 `tests/index.html` 显式加入 `recycling-behavior.js`，使 browser harness 与 Node harness 加载相同的回收行为套件。
- `tests/browser-check.ps1` 保持严格 DOM 检查：必须同时满足 Edge exit code 为 0 且输出包含 `data-result="pass"` 或对应 smoke pass 标记；没有放宽条件。
- 为每次 Edge 运行支持独立 `-Profile`，避免复用浏览器 profile 造成状态污染。

## 证据

- 首次失败证据：审计记录 `index.html` exit=0 但无 `data-result="pass"`；根因为缺失回收脚本导致的真实 DOM JavaScript 异常。
- 独立 profile run 1：Edge file 检查 4/4 passed。
- 独立 profile run 2：Edge file 检查 4/4 passed。
- 保留工件：`tests/browser-result-run1.html`、`tests/browser-result-run2.html`、`tests/node-result-current.txt`、`tests/recycling-case-manifest.json`。

## 计数说明

当前 `node tests/run.js` 实际为 172/172：原有非回收套件 149 个，`tests/recycling-behavior.js` 实际枚举 23 个回收 case，合计 149+23=172。此前“24 个回收、148 个非回收、丢失旧 case”的表述均为本 worker 的计数错误，不能据此推断有旧 case 丢失。逐 case 当前 manifest 为 `tests/recycling-case-manifest.json`。
