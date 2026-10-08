# GDD1 F2 独立审计

**结论：BLOCKED。** 冻结 `slice-abd-v1` 的 A/B/D 切片有两个阻断项：转换后旧 epoch 的结构动作仍执行；真实 UI 连续双击刷新会重复扣券。实现、冻结交付与历史证据保持当前冻结字节，审计停止修改，等待主审。

## 1. 读取与完整性

完整读取 `GDD1_F2_REPORT.md`、`f2-freeze.json`、GDD1 F1 REPORT/FIX/RETEST/ACCEPTANCE/AUDIT/CONTRACT、F0 FREEZE、冻结 `GAME_DESIGN_V1.md`，以及 `js/gdd1` 全部九个源码文件、实际 `js/gdd1UI/main.js`、F2 checks/extra/browser harness、四组浏览器结果、parity/availability 与桌面/窄屏截图。未派 agent。

开始时先直接校验冻结清单 51 项；最后再次逐项核验：

| 清单 | 文件数 | bytes + SHA-256 不一致 |
|---|---:|---:|
| `f2-freeze.json` | 51 | 0 |
| 原始 `protected-before.json` | 245 | 0 |

证据：[`f2-audit-protection.json`](../tests/gdd1/f2-audit-protection.json)。工作区没有 Git 仓库，以上判断依据实际 bytes/hash，不依据 Git 状态。

**过程偏差必须披露：**审计早期误直接执行既有 `f2-run.js`、`f2-regression.js`、`f2-verify.js`，它们向 `f2-node.json`、`f2-legacy.json`、`f2-f1-regression.json`、`f2-protection.json` 再次写入内容。随后立即披露并核验，这四文件及冻结 51 项的最终 bytes/hash 与冻结清单完全相同；没有通过编辑或恢复历史文件消除差异。不能把“最终字节相同”表述成“全程从未写入历史路径”。后续所有执行改用独立输出，旧 runner 再执行时由 VM 注入 fs 包装器，只允许重定向到 `f2-audit-historical-*`，其他写路径直接拒绝。没有改动实现源码。

## 2. 新增审计与结果

新增 **41 条独立引擎 case**，不以 seed 循环冒充 41 条场景；每个 case 在 [`f2-audit-checks.js`](../tests/gdd1/f2-audit-checks.js) 中具有独立操作与精确状态/数值断言。结果 **40/41**，原失败保留。另有 8 条 write UI case 和 4 条独立进程 read UI case，分别在 file/HTTP 执行；协议重复执行不重复计为新场景。

| 执行环境 | 通过/总数 | 失败 |
|---|---:|---|
| Node v24.14.1 | 40/41 | E1 epoch |
| Edge 154 file write | 46/49 | E1 引擎、E1 合法导入实际抽盘、E2 双击 |
| Edge 154 file read | 44/45 | E1 引擎 |
| Edge 154 HTTP write | 46/49 | 同 file write |
| Edge 154 HTTP read | 44/45 | 同 file read |

四组浏览器的引擎 case 名称、顺序、通过/失败与 Node 完全相同，见 [`f2-audit-parity.json`](../tests/gdd1/f2-audit-parity.json)。初次浏览器输出为 write 46/48、read 44/45；随后只增加“合法导入 + 无预约抽盘”复现，不修改任何已有断言；初次 HTML/JSON 另存 `*-initial.*` 保留。

覆盖与实际断言：

| 范围 | 新增边界 |
|---|---|
| 通用 resolver | 在 VM 内重命名全部 24 个 symbol id 与 effects 引用，coil→tide 仍按 primitive 执行；不改磁盘定义。源码未见按 symbol ID 的专用 resolver 分支。此运行检查不是每个 primitive 的全矩阵证明 |
| 年龄 / guard | fog 最后一次、离盘不扣、fog 成熟保 UID/永久且 counter 重建、两个自然成熟不耗 calendar、ash 第三次销毁且无 fog 绑定 |
| epoch / 预约 | 旧源结构队列取消（失败）；同轮 saline→tide 的新 listener 合法但不补 appearance；两处锁位只耗17次 shuffle、来源可已离池、删除仅清目标预约 |
| 即时事件 / 死亡许可 | 每次 maturity 后立即 grow 再进入下一自然 root；只有自己的 amber 领取死亡奖励；consume→destroy parent/depth/cause 精确；死亡普通 listener 不成长。死亡普通 listener 是内存内数据变异探针，不宣称原 content 可自然消费 heat_clerk |
| 压力 | pressure 5→6 的实际增量仅1、释放18并归零；warm_pod 无机制不会凭标签创建压力 |
| 生成 / 倍率 / 归因 | 同 key 第三 source 不分 UID；满200且消耗释放1槽只能生成1个；三倍率源最多2且正负单次 floor；死亡 add 为0而独立奖励6保留，贡献合计严格守恒 |
| 池 20/200/201 | 20 全抽只耗19 shuffle；200 无放回选20耗39且池不变；201 在 spin 前拒绝并保持输入/RNG |
| 候选 / refresh / skip / delete | 三保底 event>product>common，refresh 不重新发保底且保留 deferred product；0券全回滚；同 revision 旧 window 拒绝；删最后实例须确认且 pending 不消失 |
| 完整事务 | 负 pending 现金封0；期末恰好付款后新实例不能追溯收入；差1无 item RNG；旧 command 双提交拒绝；item 选择后阶段/券封9/额度/cooldown 原子 setup；无事件目标不抽概率 |
| 事件 | stale target type A 保持事件；fog 成本4只付一次；copper 199→200 保永久/epoch且不追溯日志；brine 删除不耗删除券、不发 runtime destroy |
| 导入 / UI | validation 先于 preview/storage；preview clone 丢弃且单写；preview throw 不改 envelope；真实 DOM render fault、Storage fault、成功 current/previous、独立进程恢复未确认事件与 pending、两旧 key 精确保持 |

运行入口：

```text
node tests/gdd1/f2-audit-run.js
node tests/gdd1/f2-audit-epoch-repro.js
node tests/gdd1/f2-audit-historical.js
node tests/gdd1/f2-audit-server.js
powershell -NoProfile -ExecutionPolicy Bypass -File tests/gdd1/f2-audit-browser.ps1
node tests/gdd1/f2-audit-verify.js
```

Node audit runner 按真实失败返回非零。Browser runner 以 `data-complete` 确认测试完成，**不把 complete 当成 PASS**；真实失败由 HTML/JSON 的 cases 与 `data-passed=false` 表达。HTTP 服务已停止。

## 3. E1：转换后的旧 epoch 结构队列没有失效（阻断）

合同依据：冻结 GDD §4.3（约100行）“epoch失效旧队列”，F1 合同的转换保UID/永久、epoch+1、新形态不重新执行出现能力。

最小直接 resolver case：`pearl_separator@0`、`reserve_facet@1`、`wick_bed@2`。三者为真实切片定义、稳定 counter，无内容 patch；state 在调用前和稳定输出后均经 `validateState` 验证。

1. `run('structure')` 建立所有 source 效果队列。
2. pearl 在 **structure** 转换 reserve→tide，UID 不变、epoch 0→1。
3. tide 的即时 transform listener 自身 add3 合法，正常收入应为7。
4. 已排队的 reserve consume 本应失效，却继续消耗 wick，独立 reward2。

| 观察量 | 预期 | 实际 |
|---|---:|---:|
| consume 数 | 0 | 1 |
| wick 普通收入 / 是否留池 | 2 / 是 | 0 / 否 |
| tide 普通收入 | 7 | 7 |
| 独立 reward | 0 | 2 |
| 总额 | 11 | 11（偶然抵消） |

不能用总额相等掩盖资源与归因错误；后续局面少了一个 wick，且出现了不属于当前类型的消耗因果。

源码：[`resolver.js:115`](../js/gdd1/resolver.js#L115) 在建立 sources 时检查 `c.x.epoch===c.startEpoch`，但执行循环约117行只检查 alive、allowance、predicate，没有再次检查 source epoch。其 effects 对象已是旧 reserve effect，转换修改的是共享 cell，旧 effect 随后仍进入 `perform()`。

**排除“只是注入 board”**：新增 [`f2-audit-epoch-repro.js`](../tests/gdd1/f2-audit-epoch-repro.js) 从合法 durable state 经公开 `sliceCommand(spin)`、真实 `sliceDraw` 复现，保存完整输入/命令/输出于 [`f2-audit-epoch-repro.json`](../tests/gdd1/f2-audit-epoch-repro.json)。无预约 seed `AUDIT-UNLOCKED-2` 的抽盘位置为 pearl@9、reserve@13、wick@12；真实日志 transform id0→add id1 后，旧 `effectKey=reserve_facet:0` 的 consume id2、destroy id3、reward id4 仍执行。输入保持不变、命令接受、输出合法。再经实际 File/DataTransfer 导入该状态并点击 UI spin，file/HTTP 同样失败。

这里证明的是**合法导入状态通过产品实际入口可达**；没有伪称已从初始12实例逐轮采购构造完整70轮轨迹。缺陷不依赖违规状态或自定义 content；正常规则允许这三种符号及这种相邻布局。

影响为同一阶段队列中的 source 被更早动作转换后，旧类型动作仍执行；当前已证实 structure consume。其他 primitive 的影响范围需实现员修复后回归验证，审计不扩写推测为已复现事实。

## 4. E2：UI 连续双击刷新重复扣券（阻断）

合同依据：冻结 GDD 约59行“revision 验证每个命令；快速双击、重复快捷键、失效目标、成本不足均不提交，不消耗 RNG”，以及 F1 CONTRACT §原子提交规则。

最小 UI 复现：已有 SYMBOL_CHOICE、refreshUsed=0、券9。实际按钮派发 detail1 的 click 后，重新取当前 refresh 按钮派发 detail2 的 click，代表同步重渲染后的第二次点击。file/HTTP 均得到：

| 观察量 | 预期：第一下有效、第二下抑制 | 实际 |
|---|---:|---:|
| refreshUsed | 1 | 2 |
| 剩余券 | 8 | 7 |
| revision 增量 | 1 | 2 |

原失败 `f2-audit-ui/double-refresh-two-click-details-only-one-commit` 完整保留。它使用真实 UI click handler，不通过暴露 `send` 绕过按钮。

源码 `js/gdd1UI/main.js:31–32`：`send` 每次使用当前 revision，`busy` 在同步 finally 中立即清零；click handler 未过滤第二次点击。引擎拒绝旧 revision 的测试已通过，但 UI 会给第二次点击配新 revision，因此那个通过项不能证明 UI 双击安全。

**搭建与归类错误披露：**初次把两个 click 当作“同一个 stale revision”是错误测试建模，曾在进度和报告草稿里将它归为 harness 错误；对照冻结 GDD 的 UI 双击条款后纠正。case 本身仍有效检查 UI 重复扣券，既没有修改预期，也没有隐藏失败。使用新按钮是为模拟重渲染后命中可见控件，不能用点击已离屏的旧按钮来制造假 PASS。这是 DOM 自动化证据，不是物理鼠标真人试玩。

## 5. 搭建错误、历史保留及范围限制

历史机制 fixture 的部分 item 在 stage1 直接注入，而自然获得窗口应在付款后；这属于搭建范围限制，应按 resolver 机制探针解释，不能作为合法局面全流程证明。旧 `f2-extra` 的 heat_clerk 死亡监听探针使用 u14：其 hand 从 nextUid13 发实例，第二个实例确实是 u14，**不能误报为 UID 搭建错误**。新增相应探针从 u1 分配、检查真实 u2，并明确是内存定义变异。

本审计还有两次 PowerShell `node -e` 解析浏览器 JSON 的引号转义失败；它们没有运行 case、没有输出结果文件，也不是产品缺陷。随后改为独立 JS verifier。原 browser PS1 若仅以 `data-passed=true` 作为 harness 完成标志会在真实失败处中断剩余协议；独立 harness 在首次执行前改用 `data-complete`，然后分别检查 assertions，避免把真实失败误归启动失败或漏掉 HTTP 证据。

只读隔离历史重跑结果：

- 现有 F2 机制组 154/154；该 PASS 没覆盖 E1/E2。
- 旧 legacy 602/602，case 名保持；M3 **64/66**，两个原失败的名称和完整 error 与旧证据完全相同：`route-m3/brine/feedstock-to-crystal-first-add-four`、`route-m3/bus/storage-envelope-and-backup-counters-preserved`。没有删除、改预期或把 M3 宣称为通过。
- F1 baseline 117/117、fix 101/101、retest 38/38；历史缺陷复现 22/28，原六个 repaired-defect 复现按既定语义失败且集合精确相同，不能误报为六个新产品回归。

重定向写入记录与历史比较见 `f2-audit-historical-summary.json`；完整隔离结果在 `f2-audit-historical-*`。这些回归不新增到41条独立 case 的计数。

此次结论只适用于24符号/10道具/3事件的 `slice-abd-v1` A/B/D 切片及已述边界。**不等于全量64/32/8、数值平衡、Chrome兼容性或真人试玩通过。** Chrome 在已查三个路径均不可用，Edge 154 不冒称 Chrome；390px截图/现有无横向溢出检查不能替代所有尺寸交互。

阻断失败保留，冻结实现不修改。主审可据 E1/E2 决定是否开修复轮；本审计到此停编等待主审。
