# Route H / 契约套利 H-1 开发证明（待独审）

## 范围与既有验收

MA-1 通用机制及 G8 固定专项已由主审依据 [MECHANICS_V1_AUDIT.md](MECHANICS_V1_AUDIT.md) 的独立30case、逐ID与真实临时浏览器工件接受；不代表前56/64无缺口或M3–M5完成。本批唯一代码写入者，未派子agent；实际 llmfree_openai/gpt-6.1-sol medium。H八个ID按 CONTENT_MATRIX H/§3.1 实现，当前只是开发自验、冻结待独审。

## 通用实现与持久契约

- content.js 的八个明确效果使用 selector/consume/transform/grow/multiply，以及新通用 stageAdvance 动作，没有 resolver 按符号ID分支。
- 轮初固定 cash/paymentSnapshot。cashBelowPaymentRatio 用 BigInt 交叉乘法，odd payment 不先取整；paymentShortfall 闭区间1..15。借支修改配额不改变同轮条件快照。
- poolTagCount 检查整个有效池（排除本轮死亡墓碑，含未上盘及本轮新生成），读取类型真实标签，不把临时盘面标签写进池；liveTypeCount 检查盘面存活且按type去重。信标 ON_END_SPIN 判定，使用现有共同倍率API。
- stageAdvance 仅自身 ON_APPEAR、存活有效源、READY预配置接受时执行。每 source UID/effectKey/阶段一次；记录于 stageState.claims，不用本轮Map冒充阶段数据。先检查payment上限，再保存claim、+18独立奖励、+8实际payment及对应 paymentModifiers，然后调用共同 trySpawn；软预算/池满失败只取消生成，不撤销已接受的奖励/义务。stageContract日志公开reward、paymentBefore/After、paymentIncrease、createdUid（失败为null），并保留limitSkipped原因。
- settings.advanceAccepted 默认false，configureStage revision命令仅READY允许boolean。拒绝只base2、不记已领；后续READY可接受未领实例；已领后关闭不撤销旧义务。SYMBOL_CHOICE改设置返回原引用/字节不变。真实checkbox锁定非READY，HUD展示实际state.payment而非阶段表原值，显示本阶段义务与领取数。
- reward进入下一阶段时stageState清空，payment换新阶段表；settings保留玩家配置。同阶段义务添加到实际payment，不误用表值覆盖。activeModifiers当前只允许空数组；完整事件modifier总线未实现，不冒称支持任意P10。debug换阶段也清阶段窗口。
- schema严格验证contentVersion、settings两个boolean/未知字段、stageState确切两字段、claims UID/effectKey已知stageAdvance/重复、对应modifier唯一/amount与定义一致/义务总额不超实际payment、递归/未知类型拒绝；已移除source的合法义务保留。领取source遵守u正整数且suffix<nextId，不要求仍在pool；删除邮戳不会取消债额或抹掉已领记录，下一阶段才清空。claims/modifiers各最多1000项（有界存档安全上限），每claim必须一一对应唯一义务。stageContract日志严格结构与新UID界限。

## 内容版本与旧档迁移

schema仍1、rules仍0.3；新增独立contentVersion='H-1'，与机制修订区别开，保留既有独审“rules0.4未来拒绝”契约。新档必须有H字段，不凭空补坏新档。旧合法0.2/0.3无contentVersion档迁移为H-1：缺stageState补空claims/modifiers，缺advanceAccepted补false（有新字段却没有版本属歧义，拒绝）。不猜旧实例是否已领取；默认拒绝意味着迁移不会自动领款。明确接受后才使用新规则。旧pending不重算、不重抽，不改变last金额/cash/RNG/choices/pending；0.2历史last仍标resolvedRules0.2。未知contentVersion/rules/schema拒绝，load迁移只读，成功保存才提交。

导入/ordinary保存的机制封套语义不变。旧冻结、31mechanics evidence、旧baseline357/routeG冻结/历史manifest/browser证据均只读。H输出全部route-h-*。

## 逐ID精确证据

共81个H Node/browser同一suite，每个ID至少3项（schema与交叉另计）；先布置原始state再首次resolve，非弱schema/收益>=0：

| ID | 矩阵规则 / 手算核心 | tests/route-h-behavior.js 代表case与边界 |
|---|---|---|
| arrears_slip | -1、junk禁普通候选；被撤账消耗普通0 | negative-base；100 draw候选无junk；consumer removesUID/reward5 |
| lean_receipt | cash14/payment30→5；cash15→1；payment31 cash15→5、cash16→1；payment0 cash0→1 | exact-half、六个cash/payment精确case；stamp同轮payment快照 |
| compliance_desk | 台1+转换存根3+未选欠条-1=3；只一目标 | one-conversion；two-sources-one-junk赢家@0；distant无动作；UID/permanent7保留→10、counters/reservation清空 |
| cleared_stub | 直接3+1=4；转换轮3；reader复制1→2 | direct-flat-one；reader+copper+stub ledger2,4,4 total10；转换后无新copy snapshot；初始模板变battery后仍copy1；blank/pause不回退 |
| cancellation_clerk | 自消费欠条reward5，permanent1即本轮普通2，总7 | no-target无grow；29→30与30→30，总36；两个消费者唯一赢家；别的消费/转换不成长 |
| quota_margin | gap0/1/15/16分别2/8/8/2 | gap四case、surplus无奖励、同轮stamp快照不读新增义务 |
| advance_stamp | 默认2；接受base2/reward18总20、payment30→38，生成新UID但不补本盘 | exact claim/modifier/RNG/UID/log；3副本reward54普通6总60/payment54仅生成2；full200仍reward18/payment+8/noUID；离盘不领；pending恢复不重领；新stage reset；原payment47→55；overflow完整rollback；最后支付37失败/38成功；删除source义务仍合法 |
| settlement_beacon | clean全池+3不同存活contract→普通×2：4,8,4总16 | offboard junk阻断；duplicates不足；死亡type不算；清junk转换后总12；3源仅2各目标×4，ledger8,8,8,16,8总48；deadowner无倍率；不同倍率先累计12/2再floor，lean1→6而非过早floor4 |

## 获批旧预期最小迁移（仅两case）

原521名称/顺序全保留。legacy/core50及fixtures10源码不变，mechanics独审源码不改。

| 原case名称（保留） | 旧预期 → H-1 | 矩阵依据 |
|---|---|---|
| route-g/offset_reader/conditional-and-h-placeholder-not-copyable | ledger[1,4,5]、copy无 → [2,4,4]、只复制cleared_stub平面1；总10不变 | H存根+1可复制，§3.1；copper条件仍不可复制 |
| route-g/content/formal-copy-whitelist-exact-two-and-prototype-unmarked | 两白名单 → 加cleared_stub第三模板；blank2/pause1与prototype未标记保留 | 主审明确授权H内容扩展 |

没有其他旧521期望迁移。newRun统一初始化H字段，旧手工setup无改动；合法旧decode走明确旧版本迁移。历史amber10→14迁移仍是mechanics批既有授权，不计新H迁移。

新测试开发手算纠正：sieve转毛刺本轮不出现，因此账本2,2,1总5（不是7）；BigInt ratio不约分，3/2×2×2保存12/2（不是6/1），金额仍6。首次file UI失败是测试按整row文本匹配欠条，误删包含欠条说明的邮戳；改为name span准确匹配，真实重复领取验证重跑通过。不是修改生产收益以迁就测试。

## 命令与结果

```powershell
node tests/run.js > tests/route-h-node-result.txt
node tests/audit-mechanics-v1.js > tests/route-h-mechanics-audit.txt
node tests/route-h-audit-check.js > tests/route-h-audit-summary.txt
powershell -ExecutionPolicy Bypass -File tests/route-h-browser-check.ps1 > tests/route-h-file-proof.txt
node tests/route-h-http-check.js > tests/route-h-http-result.txt
node tests/route-h-freeze.js
```

最新结果以 route-h-suite-manifest.json / route-h-freeze.json 为准：Node **602/602 =旧521+H81**，原357名称顺序及原521名称顺序保留；Node/file/HTTP全部case name/order/ok/error一致。file4 fresh profile严格DOM；HTTP suite/UI分别新profile。真实UI六旧import faults + H三设置/拒绝/恢复case独立统计，不混Node602。

mechanics独审30/30；11旧审计204/207，仍原三批准冲突：cargo/switch_lamp/invalid-uid-clears-on-normal-resolve、cargo-retest/reservation/runtime-invalid-record-is-cleaned、recycling/dead-listener-target-snapshot。新H没有增加旧审计失败；不宣称全历史绿。pressure --http另跑49/49+4独立UI严格DOM；fixtures另进程10/10输出重定向。旧失败审计文件不改。

## 待独审与未完成

H冻结待主审独立审核，入口 [tests/route-h-freeze.json](../tests/route-h-freeze.json) 的sources/evidence逐路径SHA256、sourceDifferences对旧机制源的授权差异、旧mechanics31与历史26证据核验；包含旧521名序、两获批迁移清单、H81及真实UI3单独统计。旧机制独审入口 [MECHANICS_V1_AUDIT.md](MECHANICS_V1_AUDIT.md) 与脚本保持未改。A–F顾问已列近邻selector/row、clinker次数、cargo_rope范围、return_station末pool/product等差异待定点复核；不得以64个存在/602绿色宣称全内容正确。32道具完整持续总线、8事件稳定选择、完整P10/候选权重、经济平衡、正式美术、人工完整游玩仍未完成。本报告不是M3–M5完成声明。
