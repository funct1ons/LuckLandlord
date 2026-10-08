# GDD1 F1 实现交回

状态：**仅F1完成实现worker自测，交主审确认；不是独立审核通过，也未启动F2。**

## 改动范围

本次只新增文件，未改任何原有工程文件。源码隔离在：

- `js/gdd1/contract.js`：GDD1/schema2/saveKey/profile/完整ID元数据、Normal及切片付款、稳定phase，空池foundation scaffold（不是玩家newRun）。
- `js/gdd1/rng.js`：固定身份编码、五流独立FNV-1a/UTF-16LE→xorshift32、consumed持久化、非破坏性洗牌。
- `js/gdd1/schema.js`：严格必需/额外字段检查，版本/profile拒绝，稳定phase与窗口、pending/ledger守恒、UID/counter/epoch、事件、预约、item quota/used、付款义务校验；revision+深克隆的同步原子事务基础。
- `js/gdd1/save.js`：独立新key单记录current/previous、显式previous恢复、未来/旧版本拒绝、旧key原字节只读摘要、≤1MiB UTF-8导入、克隆预渲染验证后单写导入、存储失败不发布candidate。
- `docs/GDD1_F1_CONTRACT.md`：BODY/phase优先级、root_wrap/pressure_index即时语义、迁移矩阵、字段、稳定事务与目标引用、五流向量、11个独立手算预期及F2未实现清单。
- `tests/gdd1/`：新验证器、黄金向量/独立Python参考、手算JSON、离线/HTTP浏览器页面与case级parity、只读旧回归runner、保护证据与结果。

旧 `index.html`/`window.Game`不接新模块；没有改旧游戏入口，没有把M3 resolver挂到GDD1上。玩家新运行模块无文件系统/网络/npm依赖，可静态file://加载；Node/Python/HTTP测试server仅开发验证用。

## 最终自测结果

| 项目 | 结果 | 证据 |
|---|---|---|
| Node v24.14.1 F1基础+oracle完整性 | **117/117** | `tests/gdd1/f1-node-results.json` |
| Edge 154.0.4258.53 file:// 写入/读取 | **118/118** | `tests/gdd1/f1-edge-file-write.html` |
| Edge file:// 独立进程重载只读 | **118/118** | `tests/gdd1/f1-edge-file-read.html` |
| Edge HTTP 写入/读取 | **118/118** | `tests/gdd1/f1-edge-http-write.html` |
| Edge HTTP 独立进程重载只读 | **118/118** | `tests/gdd1/f1-edge-http-read.html` |
| 117个基础case Node/file/HTTP同名同结果 | 全一致 | `tests/gdd1/f1-parity-report.json` |
| 独立Python 3.13.12五流参考复算 | 4身份×5流×8输出（160值）、全部初值及consumed一致 | `rng-reference.py`、`rng-vectors.json`、`rng-reference-current.txt` |
| 11个≥4符号定义/≥3因果边手算 | 算术、UID/liveness/守恒完整性全部通过；**不是resolver行为通过** | `hand-oracles.json`、`oracle-integrity.js` |
| 原旧回归含core50及原10fixtures | **602/602**；原602案例名称/顺序一致 | `tests/gdd1/legacy-readonly-results.json` |
| 既有M3 | **64/66**，两条原失败保留、不修旧预期 | 同上 |
| 所有原有受保护文件 | **245/245长度及SHA256完全一致** | `protected-before.json`、`protected-after.json` |
| Chrome | **未测**：常用机器/用户安装路径及App Paths未找到Chrome | `f1-parity-report.json`明确缺测，不冒称通过 |

浏览器118=同一117基础cases+一项真实localStorage写读或重载续流；不是把单浏览器四次运行累加为独立功能门禁。五流保存后从正确下一输出续抽，不因重载重算pending或重新生成offer。浏览器用隔离临时profile；旧两个存档key没有写操作。

测试中修正过新PowerShell脚本的变量冒号插值错误，并在最终四次浏览器运行全部重新通过；没有靠删case/改旧预期掩盖失败。最终自检还拒绝异步mutator及其泄露clone别名，校正事件fixture为“先前fog持续modifier+当前另一事件报价”，拒绝未确认A的modifier/付款义务部分提交及错误报价费用。

## 保护证据

编辑代码前已对全部原有工程文件（除`.pi`控制目录）记录245条path/bytes/SHA256，而不只是最低指定证据。包括prompt、EXECUTION_PLAN、冻结GDD/audit/F0、所有旧源码、legacy core50/10fixtures、baseline、manifest、freeze、历史输出。

- 初始快照 SHA256：`8b47a1950e561b55fdd761463e3d8854a1999ee3eb950f3f580ad53b5ae0751e`
- GAME_DESIGN_V1：`e33e1699aed464cd656abc2344d9e68be92a7238da482f9861e5e67dedc8df07`
- GAME_DESIGN_V1_AUDIT：`21fa22ecd565728c8fe670e1cc907504b34ffdabb7de1ae65b6d4e8300532221`
- GDD1_F0_FREEZE：`a05aa54cf1424a2407a59854af41a9db4f47e46f2436027507c8278b9c26ebfe`

新 `verify-protected.js`先验证初始快照本身hash，再读旧文件复核，仅写新`tests/gdd1/protected-after.json`。没有运行会覆写旧manifest的`tests/run.js`/冻结生成器；新只读runner直接调用原suite函数，只写新gdd1目录。

## 已知问题与未实现边界

1. M3两条既有失败：
   - `route-m3/brine/feedstock-to-crystal-first-add-four`：实际`[[1,11],0,12]`，旧预期`[[2,8],0,10]`。
   - `route-m3/bus/storage-envelope-and-backup-counters-preserved`：实际缺失对应恢复状态（undefined），旧预期完整envelope/counter状态。
   完整错误在新只读结果中。M3未独审，不把64/66视为可直接复用的正式版本；F1不依赖它。
2. Chrome缺测；已测Node+Edge file/HTTP并比对case级结果，不声称满足未来完整跨Chrome/Edge平台门禁。
3. F1 schema/log为基础版本，结构校验不是历史运行重演。完整效果日志归因字段、抽盘/候选算法消费向量、F2命令派发/phase转移及真实玩法门禁仍待F2；没有用metadata数目或手算完整性替代行为验证。
4. 11个手算使用full-v1跨路线定义（含echo等），作为GDD1语义oracle；**不得为了跑这些全量oracle而扩F2的A/B/D24符号范围**。F2只实现适用切片的行为，跨路线oracle留待相应获批阶段。
5. 保存adapter遵守单key原子写；真正UI预览不得副作用当前DOM/存储，发布新局由后续controller在成功后进行。本次不声称已验证完整玩家UI导入交互。

本次未发现需要改冻结GDD的F1真实设计阻塞；BODY/phase近邻歧义按已授权优先级消解，没有自改设计。未来若出现真实阻塞仍只交最小反例给主审。

## 复核命令与停止点

```powershell
node tests/gdd1/run.js
python tests/gdd1/rng-reference.py
node tests/gdd1/legacy-readonly.js
node tests/gdd1/verify-protected.js
# 浏览器HTTP验证先单独运行开发server：node tests/gdd1/server.js
powershell -ExecutionPolicy Bypass -File tests/gdd1/browser-check.ps1
node tests/gdd1/check-parity.js
```

`check-parity.js`需要上列浏览器新结果及当前独立参考输出；这些证据已提交在新路径。开发HTTP验证server已停止；未修改任何旧manifest，无Git操作、未派agent。新交付文件hash清单在 `tests/gdd1/f1-deliverables.json`（只记录本次新文件，不是旧冻结manifest）。

**此处交回并停止。等主审确认F1与独立审核安排后才进入F2；本报告不是自动授权下一阶段。**
