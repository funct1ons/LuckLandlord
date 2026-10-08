# GDD1 F1 独立复审（修复后）

## 结论

**F1 基础范围 PASS；不代表 F2、平衡、美术或完整 resolver/UI 验收。** A1–A4 四类原真实阻塞在独立复审中均消失；未发现新的 F1 阻塞。Chrome 缺测，不能宣称跨 Chrome/Edge 完整平台通过。原 `GDD1_F1_AUDIT.md` 的历史 `BLOCKED` 结论未改写，本报告是修复后的独立复审记录。

复审只新增 `tests/gdd1/retest-*` 与本报告；未修改源码、冻结GDD、F1合同/报告、原审计、原证据、既有测试或manifest。HTTP复审服务已停止。

## 独立复审入口与结果

新增 Node 入口：

```text
node tests/gdd1/retest-run.js
node tests/gdd1/retest-parity.js
node tests/gdd1/fix-verify.js       # 只读保护/hash复核，输出仍为既有fix证据路径
```

`retest-run.js` 在独立 VM 中加载四个 `js/gdd1` 模块，并只读调用原 foundation/oracle、原 fix 回归和原 audit reproducer；不调用会覆写旧输出的旧 runner。

| 范围 | 结果 | 解释 |
|---|---:|---|
| 原 F1 foundation + oracle integrity | **117/117** | 只读 VM 重跑 |
| 原 fix regression | **101/101** | 只读 VM 重跑，未修改 fix 输出 |
| 本次新增独立边界 | **38/38** | 非 F2、非 resolver 行为执行 |
| 原审计正常边界 | **22/22** | 只读复跑 |
| 原审计六个缺陷复现 | **6/6 按预期失败** | A1、A2、A3、A4a/b/c 均不再被接受；失败不是新回归 |
| Node/Edge case parity | **256/256** | 117 + 101 + 38，名称/顺序/ok/error逐case一致 |
| Edge file write/read | **256/256，各次** | 独立临时 profile；真实 localStorage、五流续抽通过 |
| Edge HTTP write/read | **256/256，各次** | 独立临时 profile；真实 localStorage、五流续抽通过 |
| Chrome | **缺测** | 未发现可执行文件；不以 Edge 的 HeadlessChrome UA 冒充 Chrome |

Edge 版本为 `154.0.4258.53`。file/HTTP 均执行 write 后独立进程 read；legacy 两个旧 key 的非空原字节保持不变。证据：`retest-edge-file-{write,read}.html`、`retest-edge-http-{write,read}.html`、`retest-parity.json`、`retest-node.json`。

## A1–A4 独立确认

### A1：preview 同步提交边界 — 已消失

新增测试覆盖：

- 合法同步 preview：只接收独立 clone，返回 `undefined` 后才允许一次读/一次写；preview 执行期间 storage 读写计数均为零。
- `Promise.resolve()`、已 reject Promise、自定义 thenable、函数 thenable、`then` getter、普通 `null` 返回值均拒绝。
- then/then getter 未被调用或读取。
- 同步 throw 拒绝；失败不读写 storage、不返回成功 state，原 state/原字节保持。

这确认修复是“同步且返回 undefined”的明确契约，而非等待异步失败后补偿。

### A2：ash age 边界 — 已消失

`ash_felt` age `0/1/2` 均可验证、编码、解码；age `3` 在 `validateState`、`decode`、`store`、`commitImport` 全入口拒绝，且拒绝前不发生 storage 读写。符合第三次上盘后不得作为稳定池末态保存的约束。

### A3：fog 资格、UID 延续与清除 — 已消失

独立覆盖：

- `mist_pouch` / `dew_lantern` 且有 age、remaining `1/2` 合法。
- `cloudy_negative`、`brine_strip`、`ash_felt` 等有 age 非 plant 拒绝；plant 无 age 拒绝。
- 跨阶段 modifier 合法，remaining 不被阶段窗口错误限制。
- `mist_pouch → dew_lantern` 保持同 UID、永久值、remaining 与 epoch 延续。
- 自然成熟不扣 remaining。
- 转为无 age 形态、删除 UID、或出现新 UID 重新占位时，旧 modifier 必须先清除；remaining `0` 不可稳定保存。

这些是稳定状态/schema/save 边界检查，不冒称执行了 F2 fog resolver。

### A4：silent/misprint/empty 固定窗口 — 已消失

独立覆盖 stageSpin `0/1/2/3`：

- `silent_bell` / `misprint_window` 仅前三轮，合法 remaining 精确为 `3-stageSpin`，到期拒绝。
- `empty_manifest` 仅首轮，合法 remaining 为 `1`，后续拒绝。
- 错误阶段携带旧 modifier 拒绝。
- 最后一轮从 `SYMBOL_CHOICE` 进入下一稳定状态时，transaction 只有显式清除 modifier 才可提交；未清除版本回滚。

因此“无适用符号也不能延迟窗口过期”的持久状态边界已锁定；没有实现或声称实现事件执行器。

## 旧审计六复现的如实解释

原 `audit-checks.js` 的六个 reproducer 是“缺陷必须存在”的断言，因此修复后实际返回 `ok:false`：

- `reproduce-A1-async-preview`：不再提前提交。
- `reproduce-A2-ash-age3`：返回 `uncommitted maturity`。
- `reproduce-A3-fog-nonplant`：返回 `fog modifier target/remaining`。
- `reproduce-A4a/b/c`：返回 `stage modifier`。

它们被 `retest-node.json` 记录为预期失败集合，不能包装成旧脚本 `28/28` 通过，也没有覆盖原 `BLOCKED` 报告。

## 手算与范围边界

11 个 hand oracle 仅按冻结正文做语义/算术完整性复核；本次复跑其原 integrity 结果为 11/11，未调用 resolver。没有把 11 个手算、101 个 fix case 或 256 个浏览器 case 宣称为 F2 行为门禁。

未测试/未验收：F2 resolver、候选抽取、事件执行、付款转移、切片24/10/3完整玩法、玩家新局入口、功能UI、完整归因日志、平衡、真人体验、美术、Chrome。

## 保护与源码 hash

`node tests/gdd1/fix-verify.js` 只读复核结果：

- 原工程保护清单：**245/245** bytes + SHA-256 不变。
- 修复入口快照：299 项中 **297** 不变；仅授权的 `save.js`、`schema.js` 改变。
- unexpected source changes：**0**。
- 冻结GDD及原审计/合同/报告未被复写。

当前两份修复源码：

| 文件 | bytes | SHA-256 |
|---|---:|---|
| `js/gdd1/save.js` | 4686 | `2f0d39ceebee434cbbb38c9fb01c6bf73e7ad6328ced84ab022a135d618eebba` |
| `js/gdd1/schema.js` | 14987 | `607b30ac2c74708e1dff56063f1aa82d4e57f4099837707e6c02e25c2d22a858` |

修复前 hash 与修复说明中的记录一致：`save.js` 4480 / `b84ad697806e3d7a285fd3c822fb2c02d3700acf3d0dc754b3f0356d306619ba`；`schema.js` 14538 / `809249e65162f0d0b5d391776872b42abcb7b7b07f0382b1550a46338df9e636`。

## 交回

F1 基础 schema/save 修复经独立边界、Node、Edge file/HTTP、case parity 与保护证据复核通过；Chrome 缺测明确保留。**停止于 F1，不开始 F2。**
