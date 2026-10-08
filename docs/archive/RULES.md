# 规则 v0.3 / 雾港余热局

## 状态与抽样
READY → 原子 RESOLVING → SYMBOL_CHOICE → READY 或自动 PAYMENT → ITEM_CHOICE → READY / WON / LOST。
RESOLVING/PAYMENT 是命令内部过渡，不写入存档。选择候选必须携带 revision；旧 UI 命令不能重复提交。最后一轮先选择再付款。奖励占位是维修券（删除 +1）或校准券（刷新 +2）或凭证（现金 +8），不属于 M3 正式道具。
池最多 200 实例；每轮 Fisher–Yates 后取前 20，补空格。八邻接无跨行。新生成实例仅下轮可出现。成长只按上盘次数。

## 解析
初始化基础收益与 permanent。ON_SPIN单次广播 → ON_APPEAR → ON_ADJACENT 按位置及效果序号收集；临时标签 priority -10，固定/邻接加法优先于结构修改，再倍率（priority 0/10/20）。初始队列统一排序，派生队列不重开已执行根效果。派生事件追加后会重新排序剩余队列（不是严格 FIFO）；稳定按 priority、位置、定义序号及入队序号执行。formal 自然 age 在额外加龄之前统一推进，刚转换的定义本轮不再 appear/age。formal 压力结构/注入和轮末销毁先完成，随后塔按稳定顺序重新筛选目标，最后每目标一次自身阈值检查；达到自身阈值者不可被塔选择。每次动作产生日志。
事件深度：根为 0，每次动作 emit 加 1。监听器作用域 event（全盘）或 self（事件 subject）；事件使用不可变 source/target UID、type、position、tags、cause 快照。formal 死亡监听仅允许显式 allowDeadSource，且事件归属由 eventSourceSelf/eventTargetSelf 单独判定；legacy 保留原死亡监听语义。其他已失效源取消；目标每次执行重新校验。
consume 移除目标且支付独立奖励；destroy 无奖励。成功销毁仅一次，竞争失败不 emit。transform 保留 ID/permanent、清空 counters，更新基础值（保留本轮已累加加法与倍率），不 ON_APPEAR，只 emit ON_TRANSFORM。grow 增加 permanent 且立即影响本轮。spawn 进入池不补位。copy 只复制邻居可复制 ON_APPEAR add 模板，不复制 copy/身份/历史。临时 tag 在基础阶段添加，回合后消失。risk 使用本局 RNG。condition 使用轮初现金快照。
ON_SPIN/ON_END_SPIN各单次广播到本轮监听器，不随盘面格数重复。ON_END_SPIN在最终ledger之前执行，其加法、倍率与销毁影响本轮最终产出；其派生事件仍受相同预算。ON_GAIN只是显式emit的通知事件，不自动支付现金、更不会再次派发本轮总收益。
所有存活格 (base + permanent + add) × 局部有理倍率 × 全局有理倍率，逐项 floor；内部使用BigInt分子/分母，不经浮点计算金额，负数亦精确向下取整。显示用近似multiplier，存档另有精确ratio字符串。独立奖励不吃倍率。负值允许，现金最低 0。账本包含每格总额与奖励，无重复贡献声明。

## 安全与事务
深度 32、动作 5000、每源每定义 64 次、生成 40、池 200、金额绝对值 1e9；超限 throw，原状态/RNG/池/现金完整保留。命令返回错误，UI 允许导出原状态。所有命令先完整校验输入，再克隆执行、校验结果并提交。formal（或显式 policy=matrix-v1）统一倍率入口：每 sourceUID/effectKey/target 一次，同 effectKey/target 最多两个来源；不同定义和目标独立。tag 倍率拒绝不撤销新增标签，releasePressure 拒绝不扣压。formal 生成每源总一、每 effectKey 两次，成功才占预算；池满可选失败日志，不影响已成功消费/奖励/RNG。有效容量不含死亡墓碑。limit 只支持 perSpin 成功 invocation；未实现字段拒绝。每格 epoch 和 visitedTypes 阻止旧队列复活及 A→B→A 往返；成功 transform 清 reservation/counters，保留 UID/permanent。
目标作用域注册映射支持 self、adj:标签、row:标签、column:标签、board:标签；标签可为*。row/column/board含自身，adj不含自身。globalMultiply建议target:self，执行一次即叠乘全局，不进入池永久修饰。M2复制仅复制ON_APPEAR/add数值，不继承目标或emit；这是明确受限的复制原型，复杂模板复制/锁定/持久modifier留待M3契约。
存档 v1 / rules 0.3；包含候选、revision、rngState、nextId、永久值、计数、items、stats、history、settings。当前档写入前校验；上一有效档复制备份，再写当前。写入失败明确降级为会话模式。恢复仅稳定状态，不重算。拒绝缺统计字段、非法phase/付款进度、未知快照类型、重复UID、未知计数器/锁定、非法账本或因果日志。主档缺失或损坏均尝试有效备份。导入验证/渲染/保存失败保留原状态，非法导入不得覆盖原档。导入最大 1 MB，拒绝未知版本与非法引用。file 与 http 不共享存储，必须支持 JSON 备份。rules 0.2 合法稳定档迁移至 0.3，未决 pending 原样保留；历史 last 标记 resolvedRules=0.2，不重算账本。导入自动保存使用单主 key 封套 {storageVersion:1,current,previous}，最后仅一次 setItem，backup 不变；load 按 current→previous→backup 只读恢复。普通 store 识别封套有效 current 并轮转到 backup，仍保留 backup 成功/主写失败的原有非原子语义。导入验证、预渲染、读取、序列化/容量或最终写失败保持内存与两槽原始字符串；autosave=false 不触碰存储。

pressure_pouch 达4的额外10为独立 reward10（不乘倍率），普通产出仍为1；feed_valve 达6独立14，surge_vessel 达3独立16且普通收益始终抑制，reserve_facet 达6轮末独立18（不是付款时发放）。

## H-1 内容修订 / 有界阶段义务

schema1/rules0.3新增contentVersion=H-1。MA-1机制与G8固定专项已独审通过；H待独审，不能据此声称全64或M3–M5完成。
READY可用revision事务配置settings.advanceAccepted（默认false）；非READY拒绝。advance_stamp通用stageAdvance在自身首次上盘且接受时，每UID/effectKey/阶段独立reward18、实际payment加8、尝试生成arrears_slip。持久stageState.claims与paymentModifiers记录已领与义务，重载/离盘再上盘不重复领；拒绝只base2，不消耗未领取资格。池满/软生成失败仍保留接受的奖励与义务，createdUid=null并skip原因，不伪造创建；其他硬错误原子回滚。更改为拒绝不撤销旧义务。新阶段复位claims/modifiers和新阶段表payment，保留接受设置；付款读取实际payment。
现金条件读取轮初cash和payment快照；半配额严格交叉乘法，odd/payment0不取整猜测。配额边签只在差1..15；信标轮末检查全有效池junk=0（含未上盘与新生成，不含死亡墓碑）且盘面存活contract不同type>=3，盘面contract普通×2，服从通用来源限制。存根直接appear+1可复制，转换不重触发；copy仍读初始快照，blank+2/pause+1白名单保留。
旧0.2/0.3合法档无contentVersion迁移H字段为空阶段记录、默认拒绝，不猜已领取；旧pending/last金额/cash/RNG/choices保持，不重算。新H档缺字段/未知版本/未知stage或setting字段拒绝。完整32道具/8事件/P10任意modifier未实现，activeModifiers仍只接受空数组。详见ROUTE_H_PROOF.md。

## 测试例子
两个回收钩抢同一残片只有一个得 +5。残片被消耗没有基础收入；其 ON_DESTROY 事件可被回声监听。转换后新定义监听 ON_TRANSFORM，但不得重获 ON_APPEAR。3×3 倍率相乘；负 -1 ×3/2 向下取整 -2。费用刚好足够成功，差 1 失败。
