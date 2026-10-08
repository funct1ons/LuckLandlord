# 通用机制咨询冻结方案 MA-1

> **性质：advisor 方案，不是实现、独审或验收报告。** 唯一写入本文件；未修改实现、矩阵、既有测试或独审报告，未派子 agent。
> 本次执行身份：用户指定的 Herdr mechanics-advisor；后续代码由主协调委托的 medium worker 编写。
> G 仍待完整独立审核；H、32 道具、8 事件、候选权重、平衡、美术和 M3–M5 均不能据此宣称完成。

## 0. 冻结依据与证据保护

完整阅读了 EXECUTION_PLAN、RULES、CONTENT_MATRIX（含 P1–P12、统一安全细则、各路线补充、道具/事件及附录）、MECHANICS_GAPS、ROUTE_G_PROOF、PRESSURE_TRANSACTION_RETEST；完整阅读 resolver/content/game/validation/save/rng/UI 与核心 suite、G118、pressure transaction、两份压力复测、压力审计、A/B/C/D/E 行为测试、fixtures、统一 runner、UI smoke 等关键文件。

- `tests/audit-route-g.js`、`docs/ROUTE_G_AUDIT.md` **均不存在**。不得引用“G 独审通过”；已有 route-g-audit-* 文本是此前路线审计输出，不是 G 专项独审。
- `tests/route-g-freeze.json` SHA-256：`7F8B2E18FB9C25FA888FB9EB5BBBD69176C01C61DEC066A43FC1480BC9220D3F`。
- 只读重新计算 freeze 的 **48 个 sources、26 个 evidence：均匹配**。
- 本次运行 `tests/run.js` 时拦截 `fs.writeFileSync`，不覆盖 `suite-manifest.json`：**475/475，旧357名称和顺序保留**。
- 本次直接重新运行：`audit-pressure-transaction-retest.js` **10/10**、`audit-pressure-retest.js` **49/49**、`audit-pressure.js` **39/39**。
- 补充 probe 通过 stdin→Node VM 运行，无落盘、无替换冻结证据。本文所写“实测”仅指这些 Node 检查。未在本次重跑浏览器；冻结的浏览器证据只核对了 hash。
- `PRESSURE_TRANSACTION_RETEST.md` 上方写10、旧结果表仍写9；本次脚本实际10项。历史报告不改写。
- MECHANICS_GAPS 是较早占位阶段诊断，不应把其中已补齐的 G copy/tag/grow 再说成缺失；反过来，475绿色也不能证明矩阵所有跨机制语义正确。

## 1. 主审已明确裁定的契约

本节裁定来自本次咨询期间主协调的明确回复，不伪称原矩阵已无歧义。

1. **矩阵 §2.4.3（约第90行）适用于 split_register 的 tag 附带 ratio（约第190行）。** 第三个同定义来源对同目标的倍率无效、稳定选择并记录原因；不因此撤销/跳过标签动作。倍率是否成功与是否新增标签是两个结果。
2. 矩阵新增软限额适用于 **formal 内容或显式启用 matrix policy 的效果**。legacy lens 多次 ON_GROW 重复乘2、legacy seedbox 触发40硬生成预算回滚，按旧规则/fixture保留。不能把 formal 规则追溯套到全部原型。
3. 不用475绿色维护错误正式语义。已定位的正式用例可由 worker 经主审授权作最小迁移，须记原预期、正确手算、规则依据；**legacy core50、10个手算fixture保持**。既有独审文件保留历史，不暗改，新增纠正复测。
4. amber 的奖励按**被消耗目标自身**认领；`eventTargetSelf` 与消费者的 `eventSourceSelf` 不可混淆。允许读取死亡目标快照，不等于允许任意死亡监听器响应以后所有事件。ash先修归因，再限生成，不能用“全局2”掩盖误触发。
5. 压力顺序按 **结构/注压完成→塔选择扣压→统一自行阈值释放** 修复；`reserve_facet` 的“结束阶段”继续指 `ON_END_SPIN`，不是付款阶段。
6. pressure_pouch 到4的“额外+10”本轮明确澄清为 **独立 reward10，不吃倍率**。保留既有F1/F2；worker须在规则及内容说明补清楚，并增加倍率对照，不能默改为普通 add。
7. 导入严格单主key封套方案优先，但必须同时解释后续普通store如何保留最新previous。两key补偿不能承诺绝对原子；最小备选是只写plain主档、保留现有backup并明示取舍。下文给出主推荐与备选，worker不需要再发明第三种事务格式。

## 2. 现状：已验证与待验证分开

### 2.1 已验证正确、应保留

- 已有独立 `ON_APPEAR tag` 预处理，普通加值前完成；`tagAdded`只记录真正新增标签，织布读取本轮日志而非最终标签猜测。
- copy 在盘面初始化时保存 UID→平面数值模板；转换不补入新模板，初始模板后转换仍可复制。explicit白名单仅晶坯+2、歇拍盘+1；legacy mirror仍可读未标记battery+2。不能改成复制运行后的 `add` 或实时定义。
- grow 封顶30、按实际增量发单个 ON_GROW；legacy显式emit去重。29请求3实际1，已30不发事件。
- transform 保留UID/通用permanent，清 counters/旧保留，更新base，不重开appear，保留本轮add/倍率。G已有模板/获标历史跨转换测试。
- BigInt有理数累计，普通产出最后逐项floor，负数亦向负无穷；独立奖励不吃倍率。
- `spin` 不提前改cash，只保存 pending=last.total；`choose`一次入账后清pending，再付款。非法pending拒绝、旧未决档缺pending拒绝、稳定旧档缺字段迁移null，均已复跑。

### 2.2 已验证缺口（实际反例，不是猜测）

| 缺口 | 当前路径/复现 | 必要修复 |
|---|---|---|
| 三倍率来源无限叠 | `multiply`直接乘；`tag.ratio`调用multiply；`releasePressure`再次直接乘。三个register@0/1/2→tide@6，实际ratio27/8、目标13、总19；应ratio9/4、目标9、总15 | 统一倍率入口，按定义/目标限制来源；不要仅给multiply加判断 |
| 计数不是真实通用限额 | drain仅`UID:index`、入队消费perSpin，不含定义类型/目标；schema允许perSource/perTarget/perStage但resolver忽略；无soft跳过日志 | 分离硬预算和软成功账本；不能继续接受无实现字段 |
| 生成无矩阵软上限 | 三demand满足窗口实际生成3；risk生成绕过spawn handler；池200的formal生成直接throw回滚 | 共用spawn入口，源UID总1、同定义总2、池满可选失败 |
| 死亡目标归因错误 | valve@0吃amber@1，实际reward3,total4；应reward7,total8。amber当前eventSourceSelf检查消费者 | 目标自身过滤、死亡快照权限单独声明 |
| ash广播误生成 | tong@0、ash@1/2/3，只吃@1，实际三个ash各生毛刺 | ash只认本UID成为consume目标；死亡目标本人可一次spawn |
| 死亡formal监听器被广泛放行 | `scope:event`绕过collect/drain alive。临时测试battery先毁echo_plate再grow2，死plate仍有ON_GROW add日志 | formal监听默认alive，仅声明死亡快照的监听例外；legacy留原兼容 |
| 压力阶段错误 | 塔priority-20先于注压；valve初压1吃fuel后到3，塔已错过，当前总6；正确总8 | 延迟塔与自释放到统一检查点 |
| 年龄追加依赖站位 | mist初age1@0、stitcher@1：natural到2后counter到3，仍mist，总3；对换源目标次序可当天转dew并令root成长，总6 | natural age先统一推进，额外年龄经同一age-step原语，跨阈值立即一次转换 |
| 存档字段校验不足 | 缺revision/settings、负spinsRemaining、负payment、cash=-1、nextId复用现有UID均被decode接受 | 有界字段和稳定phase依赖；不能靠render抛异常兜底 |
| 导入失败未保证两槽原样 | current=B/backup=A，G.store写backup=B后主写抛错：返回false，current仍B但backup已B。另用Node VM最小DOM stub执行真实FogUI.importText(C)，同样确认内存回B、主B、备份变B（非真实浏览器验收） | 自动保存语义保留；导入使用独立单写提交，见§6 |

### 2.3 静态可确认、需新增probe的近邻问题

这些是完整读代码发现的确定执行分支问题，但本次未把每项单独运行成独立case：

- `deep_still`生成监听缺eventSourceSelf，会为别的消费者生成；`tide_prism`转换监听scope:event使其他潮棱也可能响应同一次转换。与上表同属事件归因修复，不能靠限额遮蔽。
- transform只比较sourceType，A→B→A可使旧A队列重新合法；矩阵禁止往返刷新次数。需要实例本轮变型epoch及访问类型集合，而不是只看最终type。
- `targets.tagsAny`实际用every，相当于tagsAll；`order:'uid'`被接受但实际仍position排序；row/uniqueTypeCount部分分支没有alive过滤。新policy契约应fail-closed，不能把这些字段宣传成已支持。
- ON_END根事件收集未清activeParent，可能挂到之前动作下；collect重新sort整个队列，不是RULES所写的严格派生FIFO。不要在本批顺手把全队列换成另一调度器：新增阶段仅明确移动必要formal动作，legacy顺序保持，文档如实写稳定队列的真实语义。
- `clinker_router`监听数据perSpin1而矩阵写最多2；`chord_frame`条件用row而不是adj；`cargo_rope`目标用row；`return_station`即时reward，缺轮末pool≤20及product过滤。以上不属于G已完成的证明；建议后续A–F定点复核，不能对外宣称无已知差异。
- 单项金额仅检查safe integer，abs1e9主要靠pending最终净额，正负巨额抵消可避开单项硬上限。应在最终每格/独立奖励处校验边界，避免只查总额。

## 3. 最小通用限额方案（本轮必须做）

### 3.1 policy与定义身份

不增加符号ID if链。利用已有`definition.formal`：

```text
profile = definition.formal ? 'matrix-v1' : (effect.policy ?? 'legacy')
effectKey = definition.id + '/' + (effect.effectId ?? effectIndex)
componentKey = effectKey + '/' + ('multiplier' | 'spawn' | 'action')
```

- `effectKey`在collect时捕获，不能执行时用已转换后的type重算；定义ID是通用命名空间，不是针对某个符号的特殊分支。
- 正式效果默认matrix-v1，无需批量塞重复limit；原型无policy继续legacy。唯一新增`policy`值可先只允许`matrix-v1`，不要允许formal通过`legacy`逃限制。
- effectId可先保留可选的索引后备，已声明的ID须非空、长度有界、同定义唯一。新内容应显式命名；今后重排索引属内容版本变化。
- queue记录增加`effectKey/componentKey/profile/sourceEpoch`，编译元数据不回写原effects、不混进copy数值模板。新增数据字段policy/死亡许可/阶段若采用原始字段，须同步各action严格白名单（尤其counter/risk/tag/grow/copy/cycle），禁止schema放行但执行忽略。延迟压力q只有实际执行时才计一次成功/产一份日志，不在主队列收集与释放阶段各算一次。
- 所有本轮计数在单次resolve局部Map/Set，**不进持久实例counter、不进pending、不靠s.spin是否递增清零**。直接连续两次resolve也各是新轮窗口。

### 3.2 倍率：一个入口，三个账本维度

建议内部API：`tryApplyMultiplier(q, target, ratio) -> {applied, reason}`。multiply、tag附带ratio、releasePressure及以后局部道具倍率一律通过此入口。

1. 同源同定义同目标：`Set(componentKey, sourceUID, targetUID)`，本轮最多一次。
2. 同定义同目标：`Map(componentKey,targetUID) -> Set(sourceUID)`，本轮最多两个不同来源。
3. 不同定义相互独立；不同目标相互独立。不是“全盘只允许两个倍率源”，不是“同ratio[3,2]算同定义”。
4. 被拒来源不乘、不消费成功计数。拒绝不把原ratio改成1，也不撤销前两个来源。
5. 获选按现有确定性时序中的phase/priority/源位置/UID/定义序号/seq。同一阶段同定义三个来源即位置先后前两者；不预占尚未发生的来源、不额外用RNG。
6. 对`count:all`逐目标检查。某目标封顶不应break导致其他目标失效。源的一次effect invocation可以合法影响多个目标，`perSpin:1`不是“只有第一个target”。
7. 标签先正常新增、记tagAdded，再尝试ratio。已原生含两标签时仍可获得合法倍率；没有新增标签不等于倍率失败。
8. releasePressure是“扣压+倍率”的原子资源动作：先检查倍率可用和目标资格，再一起提交。倍率被限额拒绝时不白扣3，不置released。不是仿照tag让扣压照扣。
9. legacy globalMultiply仍旧行为；显式matrix policy的global倍率用目标哨兵`$board`只应用一次，不能因selector多个目标重乘。现有formal没有globalMultiply，不强行把全局倍率转换为每格动作。

日志增加独立`limitSkipped`（或统一命名`effectSkipped`，worker选一个并冻结），字段至少：`id,parent,depth,event,source,target,effectKey,component,reason,limit`；原因枚举`source-target-once / definition-target-sources / source-spawn / definition-spawns / pool-full / no-legal-target`。原有成功日志形状尽量保持，避免无谓修改G精确顺序断言。被限额拒绝的第三次tag仍有tag根日志及倍率skip子日志，不新增假的tagAdded。

### 3.3 生成：不以产物type当定义键

内部API：`trySpawn(q, to, cause, optional) -> {spawned, uid?, reason?}`；普通spawn、risk.spawnOnFail、未来道具生成统一调用。

- `spawnBySourceUID`：该源本轮所有生成定义合计最多1。转换不重置这个UID预算。
- `spawnByDefinition`：同一生成componentKey全盘最多2。不同定义即使生成相同产物也独立。
- 数量按**成功新建实例**计；不合法目标、已失效源、soft拒绝、池满失败不增nextId、不消费这两个成功配额。
- 同一个risk效果一次失败仍扣其应有损失、保留RNG判定；被限额只取消生成部分，不把风险改成成功，也不取消此前消费奖励。deep_still消费成功后生成失败仍reward4。
- 对matrix-v1生成采用可选失败（或数据显式`spawnOptional:true`，默认由profile编译），池有效存活数量200时跳过并日志；未知产物、非法状态、硬预算超限仍throw。
- 当前被消耗实例在resolve末尾才从s.symbols移除。判断池容量须用有效池人数（排除本轮已死UID），不能因为未清理的墓碑误判200；创建时让G.instance接受内部有效容量上下文，或先以受控方式移除死亡池实例但保留board/事件快照。不要在两处各算一套容量。
- 硬安全预算40与soft1/2分离。计数所有真正创建实例（含legacy与formal）；第41次仍throw并由command回滚。旧seedbox 20源×3原型效果仍应触发硬失败，不变成成功少生两枚。

### 3.4 action配额、失败与硬保护

- 现有`limit.perSpin`表达“此源此effect成功执行次数”，key至少`sourceUID/effectKey`。多个targets算同一次invocation，单target失败不冒充整次成功。
- 本批不实现持久perStage总线。schema应拒绝当前没有执行含义的perStage/perSource/perTarget，而不是默默接受。之后以新、明确命名的字段实现并迁移；上述矩阵1/2限额由profile规则和内部UID账本实现，不借这些含糊字段。
- 引入最小`applied`结果约定：返回false表示未产生合法动作；counter未过阈值释放、同type转换、无合法copy等明确false。grow在cap实际0不发事件、不花“成功成长”配额。legacy保持已有语义，避免触动其fixture。
- 硬attempt计数独立于soft成功计数；深度32、动作5000、单源定义64等防循环超限应throw，不应与soft上限一样静默continue。即使soft拒绝，也要有有界调度/日志预算，不能用无效触发逃无限循环保护。

## 4. 时序、事件与生命周期（本轮必要的局部调整）

### 4.1 不做大规模scheduler重写

保留当前resolver函数/现有queue，增加少量阶段暂存列表与能力元数据。原型仍原排序。正式动作阶段契约如下：

1. 抽盘、cell/base/permanent、轮初cash/payment/spinsRemaining快照；捕获原始copy模板、源定义/epoch。
2. tag预处理单遍、稳定顺序；后面的tag可读前面已加标签。矩阵未要求同时求不动点，**不新增反复传播直到稳定**。
3. 普通出现/条件/加值及结构事件链。正式自然age先统一入队，额外age步骤经同一入口；结构失败不emit。copy继续读取步骤1模板。
4. 所有已声明结构工作排空（包括轮末自毁产生的允许链），压力增量仅积累/封顶，不自行内联释放。
5. 已收集的塔动作按稳定顺序重新筛选当前存活合法目标，选择前过滤pressure≥cost及已达自身阈值者；成功扣压+倍率原子提交。
6. 统一检查尚未被塔释放的自行阈值：pouch4→reward10，valve6→reward14，vessel3→reward16且始终suppressed，reserve6→轮末reward18；各UID本轮一次并reset。不靠排列早晚双领。
7. 其余明确的轮末汇总/倍率/独立奖励，最终ledger；不可重开appear/tag/copy。若已过阶段产生新结构/注压，必须由schema拒绝该跨阶段组合或记录下一轮语义，不能悄悄回到步骤4。

最小实现可以只把formal压力release/counter配置编译到暂存列表，并把formal轮末结构动作提前到压力检查点前，不移动无关legacy根效果。给编译后effect加内部`phase`或数据`phase`枚举均可，schema严格白名单。**不能用pressure UID/type逐个特判**；依据counter机制键、release参数与profile。

对全量“初始固定加法先于结构”的RULES文字与当前priority混排差异，本批优先保证上述必要检查点，不顺手重排所有原型。worker应在RULES说明真实稳定排序/允许阶段，不把全队列重排后的绿色测试当旧语义兼容证明。

### 4.2 年龄与转换

增加内部`advanceAge(target, steps, capturedAgeDefinition)`，natural age和补雾额外步都走这里：有age机制且本轮尚未转换才合法；跨阈值立即transform一次。不能给无age的成品塞age，也不能给本轮刚转的dew再推进一次新类型age。该原语不改全局spin计数。

每cell保存本轮`epoch`，transform成功即+1；q记录sourceEpoch，旧q不因A→B→A恢复执行。维护`visitedTypes`（初始type在内），禁止本轮转换回已访问type；允许尚未访问的新类型链，受硬预算保护。UID/permanent不变，清类型counter/reservation，保留当轮add/已获倍率、copy初始模板与tagAdded历史。临时标签转换后是否继续挂在新类型上沿当前实现重建tags，不凭本次咨询另扩继承规则；G已有历史判断测试必须保留。

### 4.3 事件快照与监听资格

统一构造只含数据的不可变payload（复制数组/对象后冻结），至少：

```text
kind, cause, source, sourceType, sourcePos, sourceTags,
target, targetType, targetPos, targetTags,
fromType?, toType?, beforePermanent?, afterPermanent?,
requestedIncrease?, actualIncrease?
```

这里source是事件发起者（消费者/转换者/grow发起者），不是监听器owner。source/target若死亡，payload仍可读，不能重新从当前池拼标签。需要原始本轮产出的后续机制再显式添加金额快照，本批未消费该字段不冒称已实现。

- `scope`决定订阅范围；`when/eventFilter`决定事件事实；`allowDeadSource`（或`deathSnapshot`枚举）决定监听器owner是否可死后执行，三者分离。
- formal默认要求owner与普通target存活。仅矩阵明确的“自身被消耗/自身销毁”监听允许死后；无权限的死root/heat/echo_plate/return_station不继续响应。
- amber、ash被耗分支：self订阅ON_CONSUME、事件target=ownerUID、明确死亡快照许可；amber reward4，ash spawn一次。ash成熟reward只认target=owner且cause=self_mature；被耗则不走成熟分支。
- deep_still生成：事件source=ownerUID且targetTags含mist；tide_prism的ON_TRANSFORM+3只给事件target本身。root读转换前targetTags plant；heat读被耗targetTags scrap。
- legacy scope:event/ON_DESTROY保持原行为；legacy死者add仍不是独立cash，ledger dead=0，旧自毁emit fixture不改。
- 成长事件仅由grow入口产生一次，actualIncrease>0；所有监听者接收同一事实各自限额。formal邻接判定使用事件targetPos快照（事件发生时邻接），不要因为事件目标稍后死亡/变型就把已发生的成长事实抹掉；监听者自身死亡仍取消。

## 5. 最小修改文件与实施顺序

| 顺序 | 文件/API | 必须完成的内容 | 出口 |
|---|---|---|---|
| A | 新增机制测试；resolver/content/validation | profile、effectKey、统一multiplier及skip日志；tag和release分支接入 | 三来源/多目标/多轮/负floor/legacy全部通过 |
| B | resolver/content | 事件目标/源谓词分离、死亡权限、快照；ash/deep/tide归因；共用spawn软限额 | 不能再错源生成/奖励；池满保留成功消费 |
| C | resolver/content | 年龄推进、epoch、防往返；压力暂存/统一检查点；单次实际grow维持 | 位置对照与跨路线压力案例通过 |
| D | validation/game/save/UI | 完整字段边界、命令入参完整校验、import单写事务；不改变pending节点 | pending52+压力99原有回归无倒退，异常注入通过 |
| E | rng版本常量、RULES/说明、新报告/新证据 | 记录主审澄清、旧档策略、正式用例迁移、全新冻结证据 | 主协调再委托独审；不是worker自宣G通过 |

不要一次引入item bus/event bus/表达式语言重写。现有`one`/targets/handlers可继续用；新增帮助函数留在resolver内部或轻量模块即可，无构建依赖，不破坏file://加载顺序。

## 6. pending、schema与导入事务

### 6.1 永不回退的状态机

```text
READY --spin原子克隆--> SYMBOL_CHOICE
  cash不动；pool/counters/RNG/last/choices已提交；pending = last.total
SYMBOL_CHOICE --choose/skip原子克隆--> cash=max(0,cash+pending)
  pending=null；然后到期付款；READY / ITEM_CHOICE / WON / LOST
```

reroll/remove在SYMBOL_CHOICE只改其明确资源，不改last/pending；保存/恢复不重算spin、不重抽候选。新增限额Map不保存，因为整个resolve同步完成后才到稳定节点。不能为了规则换版在旧pending上重放、补发或重新计算金额。

### 6.2 具体schema边界（不一刀切误拒）

在`command`克隆前执行完整`validateState`，不是仅validatePendingSettlement；返回错误仍必须原对象/完整序列化不变。decode先校验对象结构再访问last.board/log，避免TypeError代替可解释错误。

- version/rules已知；seed字符串且有长度界；rngState为1..0xffffffff整数；revision/spin/nextId非负安全整数（nextId≥1）。UID使用当前u数字格式，nextId大于池/快照中已分配UID后缀，不能用nextId与池长度相等代替（已删除/已生成实例会留洞）。
- cash整数0..1e9；payment整数0..1e9，**不强制等于阶段表**，给将来公开modifier留口；本批尚未支持modifier则拒绝非空未实现结构，而不是执行猜测。
- stage 0..9；spinsRemaining 0..本stage.spins。READY需≥1；SYMBOL_CHOICE允许0（最后轮）到stage.spins-1；ITEM_CHOICE/WON/LOST需0。ITEM_CHOICE非最终stage，WON必须stage9；不要把“最后轮SYMBOL_CHOICE”误拒为已终局。
- choices：READY/WON/LOST空；SYMBOL_CHOICE当前生成规则为3个合法符号且不重复（若今后候选池不足，随新规则开放1..3）；ITEM_CHOICE为1..3未拥有合法道具。不能只检查ID存在而不检查phase。
- rerollTokens/removeTokens整数0..1e9；settings必需且autosave为boolean；stats对象字段各自安全整数，累计total可负（不是cash），chosen计数为合法ID→非负整数；history≤50。
- **不要为“更严格”强加stats.spins===spin、stats.stages===stage等历史不变量**：旧测试/调试建立状态未完整同步统计。若未来要求，另立迁移门禁，不在本修复伪造统计。
- permanent非负safe integer；保持旧档大于30的合法历史值，不向下改写（30是新增长软上限，不是存档硬删值）。counter仍允许已验收0..1e9的age/beat/pressure；实例机制执行时按上限/阈值处理，不把合法旧计数突然变坏档。
- reservations最多2且UID/位置分别唯一、目标在池；source可以已经离场但必须是合法UID字符串，不能强制其仍在池。
- last：board20，ledger与非空board一一对应且UID唯一；dead amount=0；amount/reward/total各有安全整数/金额上限，逐项和守恒；允许快照UID不在池（消耗和选择阶段删除后），不强制board与当前池type一致。
- last.log结构、id=数组序号、parent为null或严格更早的有效id（不能自指/向后环）、depth0..32；新增skip日志有白名单原因/component/有限字符串与数值、合法来源目标快照引用。旧合法日志无新字段仍读。
- pending规则保持原样：SYMBOL_CHOICE必须signed安全整数、abs≤1e9、last存在、等于last.total；其他phase必须null。负pending合法，负cash不合法。

> 更强验证可能暴露旧正式测试中的不合法手工夹具。区分“夹具缺字段”与“实现坏状态”，最小修正setup并列清单，不降低验证迁就坏档。legacy core50不应因无关统计推导而被破坏。

### 6.3 自动保存与导入的原子性边界

`G.store`现有语义是尽量保存并保留有效恢复点。主写失败后backup可能更新为原current，这仍可恢复合法pending；不把这种行为误报成现金修复回退。**导入失败两槽字节不变是更强要求，应另设API。**

推荐`G.commitImport(storage, preparedState)`：所有JSON/schema/大小/候选/版本校验及UI预渲染成功后，最后一次存储写操作提交。localStorage没有两key原子事务，不能用“catch里再setItem恢复”承诺双故障必成。

严格方案采用仅存储层小封套（不改变导出GameState）：

```text
{ storageVersion: 1, current: <已验证纯GameState>, previous: <原current有效GameState或null> }
```

- 成功导入仅一次`setItem(KEY,envelopeJSON)`，完全不写BACK。若浏览器标准setItem抛错，主/备份都保留原字节；若成功，导入前最新有效状态在previous，原backup也保留。
- old current若为封套，只提取其有效current（必要时previous），不递归嵌套封套。原current坏时可选择有效backup作为previous；不把坏JSON当有效档。
- 新增`decodeStorageRecord/readStoredState`：兼容旧plain state，封套先current，损坏则previous，再旧BACK；load不自动写回任何槽。
- `G.encode/G.decode`继续只处理纯GameState，导入/导出不接收封套当游戏状态。存储封套严格keys/version，最多2份各≤1MiB state与小开销，总上限另定如2MiB+固定开销；不要让现有1MiB导入上限被绕开。超容量就拒绝导入并保持原状态。
- 普通G.store继续写plain，轮转时先以`readStoredState`从旧主记录提取最新有效纯state，再将其`G.encode`结果写BACK（不要把封套层层嵌套）。例：导入成功后KEY=C/previous=B、BACK=A；下一次自动保存D先写BACK=C，再写KEY=D。成功后最新上一份仍C；备份写失败则KEY保持C/B且BACK=A；主写失败则KEY仍C/B、BACK=C。被丢弃的B是更老历史，不是最新previous。这样不会一写plain就丢掉最新有效上一份。
- 旧主plain损坏且没有内嵌previous时，沿当前逻辑不拿它覆盖有效BACK。封套current损坏但previous=B有效时，B是明确的完整恢复点，可提取B轮转BACK；两者都坏则不得用坏值覆盖BACK。load始终只读。该变化保留现有自动store主写失败pending备份语义；它不是导入强原子的实现替代。
- UI可暂把state设成next来render，异常立即恢复previous；只有预渲染成功才commitImport；成功后不再执行会影响事务结果的可失败工作。错误render回滚前先恢复state引用，防回滚渲染再抛导致内存错位。`send`的busy用try/finally清除。
- autosave=false沿现有约定只提交会话状态、不写存储，并清楚提示；若要求导入始终持久化是另一产品裁定，不在本批暗改。

如主审选择更小的“导入仅单写plain主档、现有backup不轮转”，可省封套，但必须明确成功导入前最新current未必保留；不能声称满足严格上一份备份。本咨询推荐上述严格方案。

### 6.4 版本与迁移

规则行为改变应提升规则/内容修订（例如rules0.3，schema version仍1若字段兼容），不能继续用相同seed+0.2冒称结果一致。worker先列迁移映射再改常量：

1. 旧0.2纯state先按旧支持的稳定结构验证；只对READY/ITEM_CHOICE/WON/LOST缺pending补null。旧SYMBOL_CHOICE缺pending仍拒绝，绝不猜“可能已到账”。
2. 有合法pending的旧SYMBOL_CHOICE可迁移，**原last.total/pending/cash/RNG/候选完全保留**；本次choose按原金额提交，下一spin才用新机制。
3. 旧last是历史账本，不按新倍率重算；可给历史last标`resolvedRules:'0.2'`（新last写新修订），或在迁移记录中保存旧规则来源，避免把历史27/8伪称新规则结果。
4. unknown未来版本拒绝，decode/load不写回；用户导入/下次正常成功保存才提交新格式。非法旧状态不凭空补stats/payment/revision。
5. 不持久化每轮软限额；H首次上盘/阶段道具以后确需保存的是stage窗口状态，届时新增schema，不借本轮临时Map顶替。

## 7. 精确验收表（新增独立case，期望手算）

坐标为5×4的0..19；以下未注明者permanent=0，无道具、空余位置null。旧测试保留，新增测试应同时断言UID、ledger、reward、ratio、日志归因、nextId、RNG和原状态不变，而非只看total。

### 7.1 倍率与限额

| 案例 | 精确期望 |
|---|---|
| 三register@0/1/2，tide@6 | register各2，tide=floor(4×3/2×3/2)=9；ledger[2,2,2,9]，reward0,total15；ratio9/4；前两源生效，第三源一次definition-target-sources日志。仅首源新增resonance，tide原生crystal不伪造tagAdded |
| 同盘池数组逆序、保持board/UID位置 | 获胜源仍@0/@1；不按池数组先后取第三源；金额/日志因果一致 |
| 两register→tide，本来已有resonance+crystal（合成定义） | 无tagAdded，仍倍率9/4；不以added.length判断倍率资格 |
| 不同定义独立（测试A来源三枚×3/2，B来源三枚×2，共同作用base4目标） | A接受2、B接受2；目标floor(4×9/4×4)=36；各第三源分别拒绝。相同ratio也不能合并不同定义 |
| 同定义三源、两个base4目标，scope board all | 每目标各9，各自记录第三来源拒绝；不是第一个目标用光定义配额后第二个仅4 |
| 同源同定义同目标由两个成功事件再触发 | 只一次×3/2；不同effectId的第二个倍率独立可叠；另一个target可照常获益 |
| 两次resolve同盘 / command→choose→次轮 | 每轮目标均9，不能第二轮卡住，也不能沿用上轮ratio变20；移除全部源后目标回4 |
| 合成负base=-1目标，三同定义×3/2 | 只前2，floor(-9/4)=-3；不得截断-2，更不得错乘第三源变floor(-27/8)=-4 |
| 合成同定义tag第三源倍率失败但新增另一标签 | 用同一chooseTags定义、三个源不同邻居，使前两源选resonance、第三源选crystal，稳定target均为同一个原生仅product目标；第三source ratio被拒但新增crystal及tagAdded成立。不要用三个真实register假造此情形：它们tags相同，后两个本来就无新增标签。织布仍按真实tagAdded合格 |
| 死源先于倍率阶段死亡 | 不占两来源配额；后续两个合法活源均可生效；若源已合法施加倍率后才死，则保留已施加的目标数值，不倒算撤销 |
| legacy mirror@0+battery@1 | 3+4=7，legacy仍可复制未标记模板；formal reader+battery仍1+4=5 |
| legacy含warden的fixture | 保持原20及lens×4；不把同源重复ON_GROW按formal去重 |

合成定义应使用测试临时替换+finally恢复或独立VM，不写生产符号ID分支。为看清不同倍率定义，优先断言目标金额，不把用于发事件的额外符号收入混入期望。

### 7.2 生成与死亡快照

| 案例 | 精确期望 |
|---|---|
| 三demand@0/1/2、现金0、payment30、spinsRemaining2 | 三源各普通4，总12；仅前2新增gasket（池最终5）；第三只生成skip，自身×4不取消 |
| 一个matrix源两个不同spawn定义 | 每源总量1，第二定义被source-spawn拒绝；换成两个不同UID不同定义则各生1 |
| 同定义两个成功、第三失败；另一定义第四源同产物 | 总生成3，不是按产物type合并成2；新UID只在池，下轮才抽取 |
| tong@0、ash@1/2/3 | 只@1被耗，只它生一毛刺；两个活ash不生成。普通tong1+ash@2的1+ash@3的1，reward6，总9；只消耗UID离池 |
| 三个真正被耗ash（分别被三个消费者） | 前两个死亡owner生成，第三生成soft跳过；三个消费奖励都保留；不存在“所有活ash监听每一次消费” |
| valve@0、amber@1 | valve普通1、amber0；消费3+amber独立4=reward7,total8；valve压2；amber4来源是死亡目标UID，不是valve |
| runner@0、amber@1 | runner普通1、amber0；runner6+base4=10，amber另4；reward14,total15 |
| 原池200，其中deep_still成功耗一mist再生成 | 有效池199后能补回200；消费reward4保留，生成成功1；墓碑不得误判200 |
| 池200且demand无删除释放空间 | spin成功，demand普通4（其他只上指定盘）；生成失败有pool-full日志，nextId不变；不是整轮throw |
| 池199，两个合法可选生成源且无死亡 | 第一个成功到200；第二pool-full；source/definition成功计数只有1；无不存在的新UID |
| legacy20 seedbox各3 spawn定义 | 第41个真实spawn命中硬预算，command返回失败；输入池/RNG/nextId/cash/counters/revision完整不变 |
| 已死echo_plate随后邻居grow2 | 不再有该plate的ON_GROW add；它普通0，不产生后续事件；另一活plate仍得8 |
| 一个普通tide直抽、另一个target转换成tide | 仅转换target+3；原tide仍4（不能因event全局也变7） |

### 7.3 压力、成长、变型和标签

| 案例 | 精确期望 |
|---|---|
| tower@0、valve@1初压1、wick@2 | 消费成功reward3，valve压1+2=3；塔扣3→0且×3；ledger[2,3,0]，total8。换tower/valve位置但保持两段邻接仍8 |
| 同盘valve初压4 | 消费后6，已达自阈值塔不可选；reward3+14=17，ledger[2,1,0]，total20，valve压0、ratio1 |
| 两塔、valve初压3且无fuel | 前塔扣3倍率×3，后一塔无合法目标；ledger[2,3,2]，reward0,total7。不得扣负数或×9 |
| 塔的首邻居surge当前2、第二合法valve3 | surge自然+1到3，只自释放16且普通0；塔跳过surge选valve→0×3。若另带safety1，则ledger[2,0,1,3]，reward16,total22（现F/P37期望保留） |
| pressure_pouch初压3+一个无加值matrix倍率源×2 | pouch自然到4→独立10、counter0；pouch普通1×2=2，reward10；不能普通22。若倍率源base0，total12 |
| reserve初压4吃wick | reward2+18=20、reserve普通2,total22、counter0；三独立reserve仍各释放，reward60，不受“同定义2来源倍率”误限 |
| mist初age1@0、stitcher@1、root@2 | natural1+extra1跨3→dew，同UID/permanent，counter{}；root永久+1；ledger[3,1,2]，reward0,total6；调换源目标位置同结果，不再一边3一边6 |
| cloudy初age2、permanent4 | 转facet、counter{}，普通3+4=7，无appear+2；原copy模板仍空 |
| 初始facet后被转battery再让reader复制 | 复制初始+2，非新battery模板；原G期望[3,2,1]、总6保持 |
| grow请求3、原permanent29、邻echo_plate | 实际1、单ON_GROW，plate1+4=5；battery无原appear且base2+30=32；total37；到30再grow则无事件 |
| A→B→A与已排A动作 | 回A作为无效转换拒绝并记transform-cycle原因（不发成功事件/不刷新额度）；旧A根动作绝不因最终type再吻合而复活；真正队列预算超限另走整轮回滚 |
| 预处理获标→变型→织布 | 沿G历史规则：按同UID本轮tagAdded合格，而不是要求最终定义仍含该临时标签；copy/标签下一轮都重新建立 |

### 7.4 pending与故障注入

1. cash23、G现有七符号total37：spin后cash23/pending37；save/load任意次不变；非法choose全状态/两槽不变；合法choose→cash60/pendingnull；当前revision再choose也拒绝。
2. final stage配额651：cash650+pending1→WON/cash0；cash651+pending(-1)→LOST/cash650；cash0+pending(-1)→LOST/cash0。付款前必须先提交当前轮，不早付也不复活。
3. signed pending ±1e9仍可导入/提交；cash0+1e9→1e9；cash5-1e9→0。cash5+1e9越现金硬上限时整个choose失败、pending保留，不偷偷截成1e9。
4. pending为null/string/object/fraction/NaN/Infinity/abs>1e9/缺失/不等last.total，SYMBOL_CHOICE均拒绝；其他稳定phase非null拒绝；旧未决缺字段不从last“修复”。
5. spin硬预算失败与choose满池添加失败均返回原状态；skip满池仍合法且单次入账。reroll与remove不结清pending。
6. decode缺settings/revision、非法payment/phase余轮/重复reservation/nextId冲突均拒绝；拒绝路径不写任一存储key、不改变UI state。
7. 主档坏/缺→合法backup恢复；主备都坏→可解释失败，不覆盖两槽。已存pending恢复仍只入账一次。
8. 普通store：backup写失败→主不动；backup成功主写失败→保留合法旧主与旧主副本（沿现有语义）。这项不假装满足导入强原子。
9. import：验证异常、预渲染异常、getItem异常、序列化/容量异常、最后setItem异常，各自独立注入，内存与current/backup原始字符串完全不变。旧current=B、backup=A为必须夹具，不能两槽一开始相同掩盖写变。
10. import成功current封套=C/previous=B、backup仍A；重启load=C；人为损坏current内容后可回退B；再损坏previous回退A；每个有效pending都不重算。后续普通store应识别封套为有效旧档。

## 8. 已知测试迁移与不应迁移的证据

- `cultivation/amber_frond/consumer-pays-independent-four`与`cultivation/amber_frond/consumer-base-separate`目前都用runner+amber且写reward10。**应14**，依据矩阵runner“6+目标基础”、amber“自身被消耗独立4”、§3.1死亡目标奖励；总应15。旧绿是两错误/漏项碰巧抵消，不是兼容契约。
- `tests/audit-cultivation*.js`若保留相同旧期望，原文件不改；新增专项纠正复测并记录冲突。不能删除旧失败输出后继续声称全部历史独审通过。
- 压力现有F1/F2继续reward10；reserve三个独立释放reward60继续；legacy50/10fixture继续。当前已读的压力49/39/transaction52没有覆盖“本轮由1注到3再被塔取”的正确新顺序，应新增，不必为了新测试臆造旧case迁移。
- 更严格快照/parent验证可能揭露旧日志不是合法树；先修根ON_END parent=null，再检查旧合法已保存日志兼容，不把所有旧存档无条件判损坏。
- 修正式语义后总数不再能只展示“475/475”。新的manifest需同时列：原357/G118逐名执行结果、被主审批准迁移的正式case名单、legacy未变证明、新跨机制case及独审结果。
- 不重生成旧 `route-g-freeze.json`、不覆盖baseline357/suite-manifest或独审产物。新的证据使用`mechanics-v1-*`文件名，新冻结记录旧hash与本轮差异。任何旧正式测试改动应在独立迁移说明中可定位，不由advisor代写旧测试。

## 9. 回归命令与证据路径

安全复跑旧runner（PowerShell5.1；拦截写出）：

```powershell
@'
const fs=require('fs');
fs.writeFileSync=(p,...args)=>{
  if(String(p).endsWith('suite-manifest.json')) return;
  throw Error('read-only regression blocked write: '+p);
};
require('./tests/run.js');
'@ | node -
node tests/audit-pressure-transaction-retest.js
node tests/audit-pressure-retest.js
node tests/audit-pressure.js
```

其余旧审计逐文件独立进程运行（避免某脚本测试修改定义后未恢复污染下一份）：

```powershell
Get-ChildItem tests/audit-*.js | Sort-Object Name | ForEach-Object { node $_.FullName }
```

worker新增`tests/mechanics-contract.js`（名称建议，尚不存在）做上述固定盘面/异常注入，Node和浏览器显式调用同一suite；不要仅新增文件却未被runner加载。如果要保存新manifest，写新命名路径，不执行旧freeze生成器。浏览器旧harness可能写冻结结果路径，先读源码、把输出重定向为新的mechanics-v1-*或新增只读校验入口，再跑：

- 新profile Edge `file://`：核心+G+机制新suite、UI真实spin/save/continue/choose、坏导入与主写异常；严格DOM pass属性和实际JSON每项结果。
- 新profile HTTP同样执行，确认file/HTTP全部case名/顺序/结果一致；pending现金时点一致。
- 不用Edge exit0或报告字符串包含PASS代替case级对照；不把自动浏览器验收说成人工完整run或美术审查。

只读hash核验模式：读取freeze.sources/evidence每个path计算SHA-256与记录比较；本咨询已实测全匹配。实现后sources当然会有授权差异，不能因此改旧freeze来“消除差异”。

## 10. 必须现在修 / 可后续 / 停止条件

**必须现在修**：formal倍率所有入口限源、skip可审计；统一生成软限额与真实归因；formal死亡监听资格；source/target事件快照；年龄与压力必要检查点；pending现有修复零回退；schema拒绝未实现限额字段/关键坏状态；强导入原子提交。上述均为继续H/道具扩展前的机制地基，不是数值平衡。

**可后续但须明示未完成**：完整perStage/item bus、32道具真持续执行、8事件稳定选择与P10付款modifier、抽样权重/候选保底、日志贡献归因、A–F剩余selector/row条件逐项复核、视觉/模拟。已有32道具ID集还缺矩阵`item_low_balance_tab`而多`item_salvage_pump`（不是缺margin_lantern，现代码已有后者）；不得沿用旧MECHANICS_GAPS的过时ID结论。

H边界：cleared_stub的+1未来可copy，与目前G测试“只有两正式模板/H占位不可复制”冲突，须在H接线时按内容版本显式迁移，不在本次悄悄加第三白名单。advance_stamp READY接受设置、阶段首次/配额+8/生成欠条必须等阶段状态schema和事务钩子完成；不得在结算后补弹窗或把普通候选当已实现。

停止条件：provider配额受限如实回报，不换provider；任何需要降低矩阵要求/更改legacy手算的提议先回主审；新日志或schema导致合法pending不可恢复先停；某个来源限额实现仍靠符号ID特判则退回通用API；旧证据被覆盖必须先恢复可追溯性再继续。

**冻结结论**：本文件提供可分批实施的最小机制方案与已证实反例；它既不撤销前六路线历史审查事实，也不把其未覆盖的跨机制缺口说成正确。后续仅由主协调授权worker落地，修复后另行独审G及本批机制，不在咨询阶段宣布验收。
