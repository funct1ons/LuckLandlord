# 货运独审修复记录

本次修复针对 `docs/CARGO_AUDIT.md` 中 3 个 FAIL 与浏览器 harness 漏载问题，未修改独立审核报告历史。

## 根因与修复

1. `switch_lamp` 的 reservation 在普通 resolve 前直接进入固定盘面，失效 UID 导致 `未知实例` 并使整轮事务失败。`resolver.js` 现在在重排前按现存 UID、位置和上限清理失效记录；consume、destroy、transform 完成时也清理目标 reservation；`game.js` 的合法 remove 命令同步清理。`validation.js` 对 reservations 结构、UID、位置、来源和最多两条记录严格校验，非法导入仍拒绝。
2. reservation 与生命周期状态现在保存在 state 并经过 save/decode；正常命令不会以放宽校验方式恢复坏状态。
3. 多个货运监听的 effect 计数继续使用 `source UID + effect index`，cargo rope 使用通用 row 单目标 selector，使双/三 source 对同一 product 的 add 各自独立一次，非 product 不加；竞争仍由目标 alive 原子校验处理。
4. `tag.chooseTags` 增加严格 schema：必须为非空数组、全部为已注册 tag、无重复；非法空数组、未知 tag、非字符串值均拒绝。
5. `tests/index.html` 显式加载 `cargo-behavior.js`，`browser-tests.js` 显式调用 `G.cargoBehaviorTests()`，浏览器结果包含货运 suite。

## 实测命令与真实计数

- `node tests/run.js`：`277/277`，manifest 为旧 core/formal/前 32 符号共 `229`，货运实际 `48`，合计 `229 + 48 = 277`。
- `node tests/audit-cargo.js`：`18/18`。
- 旧独审：培育 `7/7`、培育复测 `6/6`、回收 `10/10`、蒸馏 `17/17`、共振 `18/18`、共振复测 `18/18`。
- fixture：`10/10`。
- Edge file 严格 DOM：`4/4`；浏览器测试页显式执行货运 suite，`tests/browser-result.html` 实测 `277/277`。
- HTTP：`tests/http-smoke-result.html`，`passed=true`。

保留旧 suite、旧 277 case 与独审历史；货运状态更新为“修复后待独立复测”，M3–M5 其余未完成范围保持原记录。
