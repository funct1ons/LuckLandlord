# E货运修复后独立复测

本次仅新增 [tests/audit-cargo-retest.js](../tests/audit-cargo-retest.js) 与本报告；未修改实现、既有 suite、原审计报告或 manifest。范围仅为货运 8 ID 及其使用的通用 reservation、selector、schema、save 机制。

## 结果

- `node tests/audit-cargo-retest.js`：**15/15 PASS**。新增 case 覆盖 reservation 的合法 remove、consume、destroy、transform 清理；运行时失效 UID 清理；下一轮真实 command；save/restore；非法导入拒绝与源 state 不变；双/三 cargo_rope source 独立 effect limit；非 product；chooseTags 空、重复、未知、非字符串拒绝；合法选择优先级和临时性。
- `node tests/audit-cargo.js`：**18/18 PASS**。
- `node tests/run.js`：**277/277 PASS**。既有 manifest case 名称和数量未改；运行前后均为 277 个名称。
- 浏览器新 profile：`powershell -ExecutionPolicy Bypass -File tests/browser-check.ps1 -Profile <fresh>`：**4/4 Edge file checks PASS**。
- browser DOM `tests/browser-result.html`：**277/277 PASS**，其中机器计数 `PASS cargo/` 为 **48**，与 Node 的货运 48 case 一致；`tests/index.html` 显式载入 `cargo-behavior.js`，`browser-tests.js` 显式执行 `G.cargoBehaviorTests()`。
- `node tests/http-check.js`：HTTP smoke PASS，证据为 [tests/http-smoke-result.html](../tests/http-smoke-result.html)。
- 既有独审与 fixture：培育 `7/7`、培育复测 `6/6`、回收 `10/10`、蒸馏 `17/17`、共振 `18/18`、共振复测 `18/18`、fixture `10/10`，全部通过。

## 复核结论

`switch_lamp` 的 reservation 在合法 remove、consume、destroy、transform 后均清理；运行时注入的 ghost UID 在 resolver 进入正常盘面前被移除，随后可继续正常结算；下一次未传 fixed board 的真实 spin 会使用原位置保留目标，save/decode 后同样成立。非法存档 reservation 由 `G.decode` 拒绝，原 state 未被改变。reservation 结构由 validation 限制为已存在 UID、合法位置、字符串 source、最多两条记录。

双 rope 和三 rope 对同一 product 分别得到一次独立 `+3`，对应 source UID/effect index 的 perSpin 计数；非 product 邻接目标保持基础值。既有竞争行为仍由 alive 原子检查限制为单目标消费。

`transit_seal` 的 chooseTags 对空数组、重复 tag、未知 tag、非字符串值均拒绝；合法 `plant → crystal → resonance` 选择仍按邻居数量和顺序生效，池实例 tags 不持久化，下一轮重新从定义生成，满足临时标签生命周期。

## 证据边界

本轮没有发现修复后的货运失败。通过结论只覆盖上述货运 8 ID 与被直接复测的通用机制；Node/browser 48 个既有货运 case 的执行证据分开记录，schema case 的通过不单独等同于完整效果证明。结论不外推 M3–M5 其余符号、道具、事件、锁位权重或平衡性。
