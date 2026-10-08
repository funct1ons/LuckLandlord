# GDD1 F1 修复交回记录

状态：**A1–A4 实现修复完成；待独立 retest。** 本报告不是独立验收，不解除 `GDD1_F1_AUDIT.md` 的历史 BLOCKED 结论，不开始 F2 或美术工作。

## 范围和契约依据

完整核对冻结正文 `GAME_DESIGN_V1.md`、`GDD1_F0_FREEZE.md`、`GDD1_F1_CONTRACT.md`、`GDD1_F1_REPORT.md`、`GDD1_F1_AUDIT.md`，四个 `js/gdd1` 文件及独审复现、浏览器和历史回归证据。本轮只修改 `js/gdd1/save.js` 与 `js/gdd1/schema.js`，新增 `tests/gdd1/fix-*` 与本报告；未修改原测试预期、独审脚本/报告、旧证据、manifest、freeze、GDD 或旧工程。没有再派 agent。

没有发现必须变更冻结设计的真实冲突。以下边界按正文的成熟清除、UID 转换延续及固定阶段窗口规则落实在 F1 的稳定状态验证中。

## 修复内容

- **A1 / 同步 preview。** `commitImport(storage,text,preview,profileId)` 的 preview 接收独立 clone，必须同步完成并返回 `undefined`。任何其他返回值（包含 async 函数产生的 Promise、原生 Promise、自定义对象/函数 thenable）立即失败，发生在 `store` 的任何 storage 读取、写入和返回成功 state 之前。同步 throw 同样失败。不会读取/执行返回对象的 `then` 或其 getter。调用方仍负责遵守既有 preview 不写 storage/真实 UI 的约定；本修复验证的是导入 API 自身没有 storage 调用或成功发布。同步合法 preview 保留单次写入与 previous 备份语义。
- **A2 / 稳定 ash。** 所有声明了 age 的符号均采用严格小于成熟阈值的稳定计数约束；`ash_felt.age` 的合法值为 0/1/2，age3 拒绝。age3 是正文第六步处理前的瞬态，不能导入或存为稳定池末态。
- **A3 / fog 目标。** fog UID 必须对应当前仍存在、同时满足 plant 和 age 的定义，本版为 `mist_pouch` / `dew_lantern`；`cloudy_negative`、`brine_strip`、`ash_felt` 等有 age 但非 plant 的定义拒绝。无 age 的 plant 同样拒绝。跨阶段保留合法：绑定阶段仍可早于当前阶段，remaining 允许 1/2，不套用阶段固定窗口。`mist_pouch -> dew_lantern` 的同 UID 转换可保留剩余次数、永久值与 epoch 延续；自然/日历成熟不消耗 fog 次数。转为无 age 产物或 UID 删除后必须清除 modifier，不能把旧 UID 自动绑定到新 UID。合法 fog 实际使用一次的稳定输入从 remaining2 变为1；耗尽后稳定输入必须删除 modifier，不能保留 remaining0。
- **A4 / 固定窗口。** silent 与 misprint 的窗口为阶段前三轮，empty 为首轮。active modifier 必须来自当前阶段，并满足 `stageSpin < window`、`remaining === window - stageSpin`。stageSpin 为已完成轮数，`SYMBOL_CHOICE` 已经是当前轮提交后的稳定阶段；最后一轮生效处理完毕须在进入该稳定阶段前清除。没有适用符号也不能延迟窗口过期。fog 的跨阶段次数不受此约束。

这些修改不实现 spin resolver 或事件运行时；F1 回归中的转换/删除/消耗轨迹是手工给定前后状态，验证其 schema、decode、store、load、import 和 transaction 边界，不声称已执行 F2 游戏效果。

## 新回归及精确结果

`fix-checks.js` 新增 **101 case，101/101 通过**，覆盖同步合法 preview、异步 Promise resolve/reject、自定义 thenable、函数 thenable、then getter、错误返回值和同步异常；失败时 storage 无读取/写入、无成功 state 返回、原 state/RNG/存储字节保持；ash age0/1/2 与3；fog 合法/非法 plant+age、跨阶段、同 UID 转换、自然成熟不扣次数、一次成功扣一次、无 age 转换与删除清除；三个固定窗口在 stageSpin0/1/2/3/4 与 READY/SYMBOL_CHOICE 下的 remaining 精确边界、过期及错误阶段；最后生效轮 transaction 必须同步清除。

所有回归结果由 `fix-run.js` 写入 `fix-node.json`，原 suite 通过只读 VM 加载，原 legacy runner 的唯一结果写入被重定向到 `fix-legacy.json`；原脚本和原输出没有被改写。

| 核对项 | 结果 | 新证据 |
| --- | --- | --- |
| 原 F1 foundation + oracle-integrity | **117/117** | `fix-node.json` baseline |
| 新 fix 回归 | **101/101** | `fix-node.json` regression |
| Node 同名 parity 基础集合 | **218/218** | `fix-node.json` cases |
| 原独审脚本正常边界 | **22/22** | `fix-node.json` historicalReproducer |
| 原独审缺陷复现 | **6/6 如预期不再复现**；原脚本总体 22/28 | 同上，保留实际失败对象 |
| 旧工程回归 | **602/602**，名称保留 | `fix-legacy.json` |
| M3 | **64/66**，原两项失败保持 | `fix-legacy.json` |
| Edge file write / 新进程 read | **218/218 各一次**，真实 storage 检查各通过 | `fix-edge-file-*.html`、`fix-parity.json` |
| Edge HTTP write / 新进程 read | **218/218 各一次**，真实 storage 检查各通过 | `fix-edge-http-*.html`、`fix-parity.json` |
| Node 与 Edge 四组逐 case parity | **全部名称、顺序、ok/error 完全一致** | `fix-parity.json` |
| Chrome | **缺测** | `fix-browser-availability.json` |

Edge 版本 **154.0.4258.53**。每个协议使用一个新临时浏览器 profile，write/read 分别启动新进程；除218个同名 case 外，真实 localStorage 另核对两份非空 legacy 原字节、五条 RNG 续流及 Promise/thenable 失败后存档字节不变。这项 storage 检查是独立布尔结果，没有重复计入218。HTTP 服务只供本地回归，验证完已停止。未在机器/用户常见 Chrome 路径或 HKLM/HKCU/WOW6432Node App Paths 找到 Chrome；不把 Edge 的 HeadlessChrome UA 当成 Chrome 测试。

原独审脚本未作任何修改，其以下六个 case 专门断言缺陷存在，因此修复后**实际返回 ok:false**，不能包装成原脚本28/28通过：

| 原 case | 实际失败原因 |
| --- | --- |
| `audit/reproduce-A1-async-preview` | `assert`：不再成功提前提交 |
| `audit/reproduce-A2-ash-age3` | `GDD1: uncommitted maturity` |
| `audit/reproduce-A3-fog-nonplant` | `GDD1: fog modifier target/remaining` |
| `audit/reproduce-A4a` | `GDD1: stage modifier` |
| `audit/reproduce-A4b` | `GDD1: stage modifier` |
| `audit/reproduce-A4c` | `GDD1: stage modifier` |

M3 原失败精确保持：`route-m3/brine/feedstock-to-crystal-first-add-four` 仍为 `[[1,11],0,12] != [[2,8],0,10]`；`route-m3/bus/storage-envelope-and-backup-counters-preserved` 仍为 `undefined !=` 原预期 envelope。它们未纳入修复范围或改动预期，M3 未独立验收。

## 保护与前后 hash

`fix-before.json` 保存本轮编辑前快照；`fix-verify.js` 结果 `fix-protection.json` 显示：

- 旧工程保护清单：**245/245 字节数和 SHA-256 不变**。
- 本轮进入时的历史文件：**299 项中297不变**，仅两项授权源码发生变化，无意外变更。
- 旧 `f1-deliverables.json` 继续保持原文件原字节。它列出的33项中31项仍匹配原 hash，2项源码按本报告修复产生新 hash；没有覆盖历史清单伪造为33/33。
- 冻结 GDD SHA-256：`e33e1699aed464cd656abc2344d9e68be92a7238da482f9861e5e67dedc8df07`，保持不变。
- 原 `protected-before.json` SHA-256：`8b47a1950e561b55fdd761463e3d8854a1999ee3eb950f3f580ad53b5ae0751e`，保持不变。

| 源码 | 修改前 bytes / SHA-256 | 修改后 bytes / SHA-256 |
| --- | --- | --- |
| `js/gdd1/save.js` | 4480 / `b84ad697806e3d7a285fd3c822fb2c02d3700acf3d0dc754b3f0356d306619ba` | 4686 / `2f0d39ceebee434cbbb38c9fb01c6bf73e7ad6328ced84ab022a135d618eebba` |
| `js/gdd1/schema.js` | 14538 / `809249e65162f0d0b5d391776872b42abcb7b7b07f0382b1550a46338df9e636` | 14987 / `607b30ac2c74708e1dff56063f1aa82d4e57f4099837707e6c02e25c2d22a858` |

新交付 hash 由 `fix-deliverables.json` 另行记录，包含本报告、当前四个 F1 模块及新增 fix 产物；不替换任何旧 manifest。

## 复核入口

```text
node tests/gdd1/fix-run.js
node tests/gdd1/fix-server.js
powershell -ExecutionPolicy Bypass -File tests/gdd1/fix-browser.ps1
node tests/gdd1/fix-parity.js
node tests/gdd1/fix-verify.js
```

浏览器命令需在本地HTTP服务运行时执行；验证后停止服务。上述 runner 只写 fix 前缀证据。原117包含11个 oracle 算术完整性检查，它们仍不等于实际 resolver 验收。新101与浏览器验证属于实现者回归，独立 retest 应由独审者另行执行并形成新记录。

完成后停止，等待独立 retest；没有修改旧独审结论，也没有进入 F2。
