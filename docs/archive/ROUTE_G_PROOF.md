# G 异相映印：开发冻结证明（待独立审核）

## 状态与边界

- 本文记录 **G 的开发验证通过**，不代替独立审核，不宣布 G 已验收。
- 前六路线 A–F 的 48 个符号已验收；原统一基线 **357/357** 保留。G 新增 **118/118**，统一 Node / Edge 浏览器均 **475/475**。
- 本轮 worker 使用 `openai-codex / gpt-6.1-sol / xhigh`；未派子 agent，未回滚其他路线，未改独立审计脚本。
- 依据：`EXECUTION_PLAN.md`、`CONTENT_MATRIX.md` 的 G 表与 P1–P12 / 时序脚注、`MECHANICS_GAPS.md` G、`RULES.md`、`PRESSURE_TRANSACTION_RETEST.md`。矩阵及规则原文未降低要求。
- 没有旧用例迁移、重命名或预期修改。`tests/baseline-357-manifest.json` 是改动前 357 case 的保留清单；运行时逐名、逐序核对。`tests/suite-manifest.json` 明确记录 `baseline: {expected:357,total:357,passed:357,namesPreserved:true}`。

## 实现文件与通用原语

| 文件 | 本轮改动 |
|---|---|
| `js/data/content.js` | G 八符号的矩阵效果、名称、rarity；正式复制白名单；新参数严格 schema |
| `js/engine/resolver.js` | 多行整理；标签预处理与来源日志；邻接 type 去重；不可变数值复制快照；成长实际增量事件 |
| `js/core/validation.js` | `tagAdded` 日志及成长实际增量的存档合法性检查 |
| `tests/route-g-behavior.js` | 118 个精确行为 / 边界 / schema / 真实事务测试 |
| `tests/run.js`, `tests/browser-tests.js`, `tests/index.html` | Node / browser 显式加载与调用 G；机器 manifest 与旧基线证明 |
| `tests/route-g-evidence-check.js`, `tests/route-g-http-check.js` | 严格 DOM、浏览器/Node 全 case 一致、独立 HTTP 证明 |

`game.js`、`save.js`、UI 事务实现与所有 `tests/audit-*.js` 未修改。resolver 没有 G ID 分支。区别通过 `choiceMode`、`copyMode`、`maxAdd`、`temporaryTagAdded`、`neighborUniqueTypeCount`、`eventTargetNeighbor`、`eventValue` 等数据参数表达。

### P1 / P3 / P6：标签与时序

1. 所有本轮 `ON_APPEAR tag` 在普通加值/条件计算之前预处理；所以板位更早的监听者也能使用稍后板位提供的标签。
2. `tagAdded` 记录 source UID、target UID、真正新增的 tags。原生已有标签不产生“新增”记录。
3. 对相织布按本轮真实日志、存活目标和邻接关系选一个目标；不是凭最终 tags 推测。转换后仍按该 UID 本轮确实获标的历史判断。
4. 标签和本轮 ratio 只存在于结算 cell；不写入池实例。编码/恢复后的下一轮重新由定义建立，不继承前轮的临时标签或 ×3/2。

### P4：永久成长实际增量

- `grow` 请求 amount 后，永久值上限 30；payload 记录 before/after、requestedIncrease、actualIncrease、source/target UID。
- 只有 `actualIncrease > 0` 产生一次 `ON_GROW`；达到上限时不发事件，不错误触发 lens 或印板。
- legacy `grow emit:ON_GROW` 与自动实际成长事件去重，lens 不会重复倍增。印板回报只是 `add`，不会再发 `ON_GROW`。
- 多监听者各自收到同一事实，各自限额，不消耗公共事件。印板检查成长 **target** 的邻接关系，而非 grow 发起者的位置。

### P5：复制快照及兼容

- 正式效果仅 `blank_facet` 的出现平面 +2、`pause_dial` 的出现平面 +1 为 `copyable:true`。后者条件 +2 为 false；其余正式效果均 false，包括尚未完成的 H 占位效果。
- 偏印读头 `copyMode:explicit`，只选一个合法邻接模板实例，读取本轮开始的 UID→平面常数快照；复制总和最多 +8，不是每个效果各 +8。
- 只复制自作用域、自目标、无条件/事件/限额/selector 的 `ON_APPEAR add` 常数；不复制成长、结构动作、复制动作或递归事件。复制日志记实际加值。
- 中途转换为晶坯不会新添初始模板；初始晶坯后来转换仍保留其不可变 +2 数值快照。复制不读取已累计的临时 add。
- legacy mirror 默认/`copyMode:legacy` 保留未显式标记 battery 出现 +2 的兼容；偏印读头不因此把 battery 纳入正式白名单。

## 逐 ID 规则、精确预期与实测

所有下列名称位于 `tests/route-g-behavior.js`，完整名称前缀为 `route-g/`。所有列举 case 已在 Node、Edge file、Edge HTTP 实跑，结果一致为 PASS。金额为手算预期，不由 resolver 结果生成。

### phase_chip — 偏相小片（4 case）

**规则：** common，magic，基础 2。预处理先检查邻接 resonance；有则临时 resonance，否则邻接 crystal 时临时 crystal；不比较多数。

- `phase_chip/resonance-first-not-crystal-majority`：一 resonance、两 crystal，仍记录新增 resonance；金额 2+1+4+4=**11**，UID/permanent/counters 不变。
- `phase_chip/crystal-fallback-diagonal`：斜邻 crystal 也有效，2+4=**6**，只新增 crystal。
- `phase_chip/no-neighbor-no-temporary-tag`：远位 resonance 无效，2+1=**3**，无 tagAdded。
- `phase_chip/previous-turn-tag-is-not-current-turn-tag`：首轮织布协同 **9**；去掉来源后第二轮 **3**，无标签/加值，池实例仍无临时字段。

### spectrum_pin — 谱别别针（4 case）

**规则：** common，magic/support，基础 1。自身邻接至少三种不同 type 才自身 +4；不可复制。

- `spectrum_pin/three-distinct-neighbors-plus-four`：别针 5、echo 1、battery 4、crystal 4，合计 **14**，每项 ratio 1/1。
- `spectrum_pin/duplicates-count-once`：两个 echo 不是两种 type；1+1+1+4=**7**，别针仅 1。
- `spectrum_pin/self-and-distant-type-excluded`：不计自己/远位，1+1+4+4=**10**，无奖励。
- `spectrum_pin/earlier-dead-neighbor-not-counted`：提前死亡的 slag 不计种类，ledger `[1,1,0,4,1]`，合计 **7**。

### cloudy_negative — 雾面底片（4 case）

**规则：** common，magic/feedstock，基础 1。第三次上盘转换 blank_facet；保留 UID/permanent，清所有 counter，不重新 ON_APPEAR。

- `cloudy_negative/first-appearance-exact`：**1**；完整实例为原 UID、原 type、permanent 0、`age:1`。
- `cloudy_negative/second-appearance-no-conversion`：**1**，`age:2`，没有转换。
- `cloudy_negative/third-preserves-identity-clears-counters-no-appear`：permanent 4，age 2 / beat 7 →同 UID 的 blank_facet、permanent 4、counters `{}`；3+4=**7**，ratio 1/1，无 +2 add。
- `cloudy_negative/transform-clears-reservation-and-all-counters`：age/pressure/beat 全清，旧 reservation 清除；permanent 3 保留，3+3=**6**，无重新出现加值。

### blank_facet — 无谱晶坯（3 case）

**规则：** uncommon，magic/crystal，基础 3。出现平面 +2 显式可复制；不是 product。

- `blank_facet/plain-plus-two`：3+2=**5**；日志恰为一次 add 2，ratio 1/1。
- `blank_facet/permanent-kept-no-growth`：permanent 2 保留，3+2+2=**7**，完整实例不变。
- `blank_facet/not-product-not-consumed`：邻接 sorting_runner 不消费它，5+1=**6**，reward 0，双方 alive，定义 tags 精确为 magic/crystal。

### offset_reader — 偏印读头（6 ID case + 4 copy 边界）

**规则：** rare，magic/machine，基础 1。仅一个邻接实例的显式可复制出现平面常数，总上限 +8。

- `offset_reader/explicit-blank-plus-two`：reader 3、facet 5，总 **8**；copy source/target UID 与 amount 2 精确核对。
- `offset_reader/two-whitelisted-neighbors-one-template`：两个 facet 只复制稳定首个，`[3,5,5]`，总 **13**。
- `offset_reader/unmarked-legacy-battery-not-formal-whitelist`：`[1,4]`，总 **5**，无 copy。
- `offset_reader/pause-flat-only-not-conditional`：暂停盘条件仍在自身生效，但读头只复制 +1；`[2,5,1]`，总 **8**，pressure 1。
- `offset_reader/conditional-and-h-placeholder-not-copyable`：copper 条件与 H cleared_stub 不复制；`[1,4,5]`，总 **10**。
- `offset_reader/newly-transformed-facet-not-in-start-snapshot`：本轮才变成晶坯没有模板；`[1,3]`，总 **4**；UID/counters 精确核对。
- `copy/snapshot-retains-numeric-template-after-conversion`：初始 facet 转 battery 后，仍复制原 +2；`[3,2,1]`，总 **6**。
- `copy/total-eight-cap-not-per-effect-cap`：临时测试模板 7+6，只复制 8；`[9,16]`，总 **25**。
- `copy/two-readers-no-recursion-no-derived-events`：`[3,3,5]`，总 **11**；copy 均 depth 0、parent null，没有派生事件。
- `copy/legacy-mirror-unmarked-battery-compatible`：旧 mirror/battery `[3,4]`，总 **7**。

测试用替代效果通过 finally 恢复，不改正式内容白名单。

### alignment_cloth — 对相织布（5 case）

**规则：** uncommon，magic/support，基础 1。给一个邻接本轮确实获得临时标签的实例 +5，一轮一次。

- `alignment_cloth/actual-tag-added-target-plus-five`：`[7,1,1]`，总 **9**；cloth 的唯一 add target UID/amount 5 精确核对。
- `alignment_cloth/native-tag-does-not-qualify`：原生 echo 不合格，1+1=**2**，没有 add。
- `alignment_cloth/two-tagged-neighbors-only-first-once`：两个合格只选首个，`[7,1,2,1]`，总 **11**。
- `alignment_cloth/works-for-non-g-transit-tag-provenance`：transit_seal 本轮新增 plant 合格；`[7,1,2]`，总 **10**。
- `alignment_cloth/tag-history-not-transformed-final-tags`：phase 获 crystal 后转 battery，仍由 UID 的本轮获标记录合格；`[1,7,1,4]`，总 **13**，转换后实例 counters `{}`。

### echo_plate — 迟相印板（6 ID case + 4 growth 边界）

**规则：** rare，magic/resonance，基础 1。邻接实例实际永久增量 ×4，最多两次；回报不再产生 ON_GROW。

- `echo_plate/actual-increase-two-times-four`：grow 2，印板 1+8=9，battery 4，总 **13**；payload target UID / actualIncrease 2 精确核对。
- `echo_plate/non-neighbor-growth-no-reward`：远位 grow 不触发，`[1,4]`，总 **5**。
- `echo_plate/cap-truncation-actual-one-not-requested-three`：29 请求 +3，实际到 30 只增 1；`[5,32]`，总 **37**；before/after/actual 为 29/30/1。
- `echo_plate/two-events-limit-third-growth-still-applies`：三次 grow 1 全执行，但印板只取前两次；`[9,5]`，总 **14**，permanent 3。
- `echo_plate/real-root-ledger-conversion-growth`：真实转换事件使 root_ledger 永久 +1；`[2,5,3]`，总 **10**，转换保留 UID、counters 清空。
- `echo_plate/real-heat-clerk-consumption-growth`：真实消费使 heat_clerk +1；ledger `[2,5,1,0]` + reward 6 = **14**；被消费 UID 从池移除。
- `growth/at-cap-no-event-no-legacy-lens-multiply`：已 30 的 grow 不发奖励/倍率；`[1,32,1]`，总 **34**。
- `growth/two-listeners-independent-not-consumed-event`：同一个 +2 的两个印板各 +8；`[9,4,9]`，总 **22**。
- `growth/explicit-legacy-emit-deduplicated-lens-once`：legacy emit 与自动事件不重复；lens 恰好 ×2，`[9,4,2]`，总 **15**。
- `growth/adjacency-tests-target-not-growth-source`：远位 battery 给近位 crystal +2，印板仍响应目标；`[9,6,2]`，总 **17**。

### split_register — 双谱登记器（3 case）

**规则：** epic，magic/contract，基础 2。预处理给一个邻接 product 临时 resonance/crystal，该目标普通产出一次 ×3/2；不改变池标签。

- `split_register/dual-tag-single-product-rational-floor`：copper permanent 1，floor((2+1)×3/2)=4；register 2，总 **6**；新增两标签、UID/permanent/counters 精确核对。
- `split_register/two-products-first-only`：稳定首个 tide_prism ×3/2，第二个 amber 不变；`[2,6,4]`，总 **12**。tide 原有 crystal，tagAdded 只记录新增 resonance。
- `split_register/non-product-no-tag-no-ratio`：echo 不合格，`[2,1]`，总 **3**；全为 ratio 1/1，无 tagAdded。

## 跨原语、schema 与真实存档事务

### 时序精确案例

- `tags/preprocessing-before-earlier-position-addition`：pitch_fork 在 phase 之前仍看到其 resonance；`[1,5,1]`=**7**，日志顺序 tag → tagAdded → add。
- `tags/split-labels-visible-to-addition-before-ordinary-floor`：`[1,7,2]`=**10**，copper 的 ratio 精确 3/2，先加值再取整。
- `tags/no-persistent-tags-or-ratio-next-turn-without-source`：首轮 **10**，编码/恢复并去来源后第二轮 **3**，实例完全没有临时字段。
- `content/formal-copy-whitelist-exact-two-and-prototype-unmarked`：精确核对两个正式 true 模板及 legacy battery 的 undefined。
- `content/eight-matrix-base-tags-rarity-exact`：八 ID 的 base/tags/rarity 整表精确相等。

### 新字段 schema（67 case）

- **14 个合法边界**：多标签、firstPresent/mostNeighbors、正有理数倍率、复制上限 1/8、legacy 模式、实际成长值表达式、不同 type 阈值 1/8、临时获标 selector、grow 0/30、平面 constant 模板。
- **53 个非法边界**：空/重复/未知/非字符串标签、互斥形状、永久标签、未知 mode/字段/触发器、零/负/小数倍率、复制上限 0/9/小数/字符串/缺失、事件复制/多目标/非邻接/不排己、错误 eventValue 及上下文、不同 type 阈值 0/9/小数/额外字段、非 true 的获标 selector、负/缺失/无穷 grow、负成长表达式、条件/事件/成长/动态/带限额的 copyable 模板。
- `save/tagAdded-log-strict-invalid-boundaries`：空/未知/重复 tags、不存在 source/target UID、错误 event、非空 amount 均拒绝；合法日志 encode/decode 完全相等。

### `pendingSettlement` 与存档原子性

- `command/save-restore-pending-once-with-g-tags-copy-growth` 使用真实 command → store → load → choose。七符号手算：
  `register 2 + floor((copper 2 + 邻接 machine 2 + cloth 5)×3/2) 13 + cloth 1 + reader 3 + facet 5 + plate 9 + grown battery 4 = 37`。
  spin 前现金 23；spin 后 cash 仍 23、pending 37；原输入完整状态不变；恢复后非法 choose 完整不变；正确 choose 现金 **60**、pending null；重放拒绝且不能重复入账。
- `command/save-main-write-failure-keeps-valid-pending-backup`：cash 17 / pending 9；正确 choose 为 26；模拟主存档写入失败时 current 与 backup 均保持合法 pending 状态；恢复后仍只能提交一次至 **26**。
- 全部旧压力事务测试保留，并重跑独立 Node / HTTP 审核；没有把现金恢复为 spin 时提前入账。

## 完整实跑命令与结果

以下均已实际执行，不是计划。原独审文件未改。

```powershell
node tests/run.js
# 475/475；Baseline: 357/357; names preserved: true

Get-ChildItem tests/audit-*.js | Sort-Object Name | ForEach-Object { node $_.FullName }
node tests/audit-pressure-retest.js --http
node tests/fixture-report.js

$profile = Join-Path $env:TEMP ('route-g-file-' + [guid]::NewGuid().ToString('N'))
powershell.exe -NoProfile -ExecutionPolicy Bypass -File tests/browser-check.ps1 -Profile $profile
node tests/route-g-evidence-check.js
node tests/route-g-http-check.js
node tests/route-g-evidence-check.js tests/route-g-pressure-http.html
node tests/route-g-freeze.js
```

| 审计 / harness | 实测 |
|---|---:|
| Node unified | 475/475（旧 357 + G 118） |
| audit-cultivation / retest | 7/7、6/6 |
| audit-recycling | 10/10 |
| audit-distillation | 17/17 |
| audit-resonance / retest | 18/18、18/18 |
| audit-cargo / retest | 18/18、15/15 |
| audit-pressure | 39/39 |
| audit-pressure-retest | 49/49；另 --http 49/49 + UI 4/4 |
| audit-pressure-transaction-retest | 10/10 |
| 单独 fixture-report | 10/10 手算匹配 |
| Edge file（suite / UI / storage write / read） | 4/4，全部 exit 0、严格 body pass |
| Edge HTTP（suite / UI） | 2/2，严格 body pass |

Node suites：core 50、formal 75、cultivation 24、recycling 24、distillation 29、resonance 28、cargo 48、pressure 27、pressureTransaction 52、routeG 118。

### 可定位证据

- `tests/route-g-node-result.txt`、`tests/suite-manifest.json`、`tests/baseline-357-manifest.json`。
- 11 个 `tests/route-g-audit-*.txt`；`tests/fixture-result.json`（10 fixtures）。
- `tests/route-g-file-proof.txt`、`tests/route-g-file-manifest-proof.json`；file DOM 是 `browser-result.html`、`ui-smoke-result.html`、`storage-write-result.html`、`storage-read-result.html`。
- file 新 profile：`C:\Users\admin\AppData\Local\Temp\route-g-file-3e51dbc3bd814918b7192bc31fde12e1`。
- `tests/route-g-http-proof.json`、`tests/route-g-http-suite.html`、`tests/route-g-http-smoke.html`；HTTP 新 profile：`C:\Users\admin\AppData\Local\Temp\route-g-http-81c6ba3a-d54e-4017-974a-b2f48d1e3593`。
- `tests/route-g-pressure-http-result.txt`、`tests/route-g-pressure-http.html`、`tests/route-g-strict-dom-proof.json`。额外严格验证 `data-smoke="pass"`、`data-pressure="pass"` 和 JSON 四项 `ok:true`，没有只看 Edge exit / 宽松字符串存在。
- `tests/route-g-freeze.json`：由 `tests/route-g-freeze.js` 严格复核已实跑证据后生成，记录代码/测试/规则/审计文件 SHA-256 与冻结计数，交独审时可复核。

浏览器 manifest 与 Node 的 **全部 case 名称、顺序、ok、suite 数量完全一致**；不是只比较末尾总计。自动 Edge 证明不等同于人工游玩或视觉验收。

## 未完成项目

G 待独立审核；H 的 8 个正式符号尚未实现验收。道具、事件、权重、长期平衡、视觉与人工完整游玩仍未完成。不能由本次绿色回归推导为整游戏内容完成。
