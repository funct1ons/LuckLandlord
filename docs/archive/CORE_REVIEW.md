# M0–M2 独立核心审核报告

## 范围、时间与证据边界

本报告记录本次独立审核时的实现快照；core-worker 已开始修复，**本文不是修复后复测结果**。行号对应审核时文件（代码大量压在单行），修复后可能变化。

完整阅读：`EXECUTION_PLAN.md`、全部 `prompt.txt`、`js/core/*`、`js/engine/*`、`js/data/*`、`tests/suite.js`、`tests/fixtures/combos.js`、`docs/RULES.md`；另外检查 `js/ui/main.js`、`docs/ARCHITECTURE.md`、测试运行器及模拟器。

审核期间未修改实现、未安装依赖、未另派 agent。经用户追加授权，仅写本报告。未实际执行浏览器交互：涉及 DOM 的结果明确标为静态代码路径推断。

**结论：审核快照不宜宣布 M0–M2 全部验收通过。现有测试 36/36 通过，但额外内存断言揭露存档、倍率、schema 等问题。**

严重度：P1 = 当前核心验收阻断；P2 = 应修复的恢复/契约缺口或验收不足；范围项 = 应说明边界，不自动作为 M2 阻断。

## 已执行测试

```powershell
node tests/run.js
```

实际：36/36 passed，包括 RNG 固定向量、抽样边界、十个 fixture、竞争消耗、转换、复制、临时标签、风险、回合结束、循环回滚、付款边界、重放和备份恢复。

额外检查使用 Node 内置 vm，在独立内存上下文加载相同脚本；没有改动内容文件。下面给出可重放脚本。注意这些是原审核输入：修复后输出可能不同，应以独立复测为准。

```powershell
@'
const fs=require('fs'),vm=require('vm');
const ctx={window:{},console};vm.createContext(ctx);
for(const f of ['js/core/rng.js','js/data/content.js','js/engine/resolver.js','js/core/game.js','js/core/save.js'])
  vm.runInContext(fs.readFileSync(f,'utf8'),ctx,{filename:f});
const G=ctx.window.Game;
function check(name,fn){try{console.log(name,JSON.stringify(fn()));}catch(e){console.log(name,'THREW',e.message);}}
check('missing_stats',()=>{
  let s=G.newRun('A');s.stats={};s=G.decode(JSON.stringify(s));
  const r=G.command(s,{type:'spin'});return {accepted:true,spinOk:r.ok,error:r.error};
});
check('corrupt_last',()=>{
  const s=G.newRun('A');s.last={board:[{type:'missing',uid:'u1',alive:true}],ledger:[]};
  return {decodeAccepted:!!G.decode(JSON.stringify(s)),renderDefinition:G.symbols[s.last.board[0].type]||null};
});
check('false_won',()=>{
  const s=G.newRun('A');s.phase='WON';
  return {decodeAccepted:!!G.decode(JSON.stringify(s)),stage:s.stage,spinsRemaining:s.spinsRemaining,cash:s.cash};
});
check('missing_primary_backup',()=>{
  const data={'fog-port.save.v1.backup':G.encode(G.newRun('B'))};
  return G.load({getItem:k=>data[k]||null});
});
check('fraction_precision',()=>{
  const oldBase=G.symbols.slag.baseValue,oldEffects=G.symbols.slag.effects;
  try{
    G.symbols.slag.baseValue=100;
    G.symbols.slag.effects=[{trigger:'ON_APPEAR',action:'multiply',scope:'self',target:'self',priority:20,ratio:[29,100]}];
    const s=G.newRun('A');s.symbols=[];s.symbols.push(G.instance(s,'slag'));
    const r=G.command(s,{type:'spin',board:[s.symbols[0].uid]});
    return {ok:r.ok,total:r.state.last.total,expected:29};
  }finally{G.symbols.slag.baseValue=oldBase;G.symbols.slag.effects=oldEffects;}
});
check('schema_invalid',()=>{
  const old=G.symbols.slag.effects;
  try{
    G.symbols.slag.effects=[{trigger:'ON_APPEAR',action:'multiply',target:'adj:NONEXISTENT',ratio:[1,0],priority:'bad',emit:'UNKNOWN'}];
    return {accepted:G.validateContent()};
  }finally{G.symbols.slag.effects=old;}
});
check('revision_optional',()=>{
  const first=G.command(G.newRun('A'),{type:'spin'});
  return {withoutRevisionAccepted:G.command(first.state,{type:'choose',index:0}).ok};
});
'@ | node
```

## 具体问题

### 1. P1：存档缺少必需统计字段仍通过校验，恢复后无法继续

位置：`js/core/game.js:13–16`、`js/core/save.js:2`。

输入：上面 `missing_stats`。

实际实测：

```json
{"accepted":true,"spinOk":false,"error":"非法统计"}
```

`validateState` 仅遍历现有 stats 值，不保证 `spins/total/best/removed/stages` 存在。空对象通过，后续运算产生非法统计，Spin 回滚。

期望：导入时拒绝缺少必需字段的状态；接受的稳定存档应能正常继续，不应在下一条正常命令才失败。

### 2. P1：last 未校验，非法显示引用可进入状态；导入异常不保证保留原档

位置：`js/core/game.js:13–16`、`js/core/save.js:2`、`js/ui/main.js:1–2`。

输入：上面 `corrupt_last`。

实际实测：

```json
{"decodeAccepted":true,"renderDefinition":null}
```

静态路径确认：`render()` 读取 `G.symbols[c.type]` 后直接访问 `def.name`，不存在定义会抛异常。导入顺序为 `state=next; persist(); render();`，所以渲染异常发生前已替换状态，开启自动保存时还可能已写入主档。catch 文案却是“导入失败，原状态保留”。**浏览器点击导入未在本次审核实测。**

期望：在替换和保存之前验证显示快照的结构与定义引用，或安全丢弃非权威显示快照；失败时原状态和有效存档必须保留，提示应真实。

### 3. P1：稳定终局状态缺乏流程一致性校验

位置：`js/core/game.js:14–16`。

输入：上面 `false_won`；将普通新局仅改为 `phase='WON'`。

实际实测：

```json
{"decodeAccepted":true,"stage":0,"spinsRemaining":6,"cash":0}
```

期望：终局应满足最终阶段、付款进度、剩余轮数等必要一致性条件。不是要求存档防作弊或密码学证明，而是不能把明显不可能的稳定状态当合法可恢复状态。其他付款/奖励状态的跨字段约束也应有针对性测试。

### 4. P1：有理倍率实际用浮点，导致错误整数收益

位置：`js/engine/resolver.js:11、25`。

输入：上面 `fraction_precision`，单实例基础值 100，倍率 `[29,100]`。

实际实测：

```json
{"ok":true,"total":28,"expected":29}
```

期望：100 × 29/100 = 29。当前先做浮点除法再乘、最后 floor，会将浮点误差固化成少一枚收益。当前自带 3/2、2/1 未暴露问题，但执行计划已要求有理数或定点，属于通用金额契约错误。

### 5. P1：内容 schema 接受非法效果定义

位置：`js/data/content.js:29`；声明对照 `docs/ARCHITECTURE.md`。

输入：上面 `schema_invalid`。

实际实测：`{"accepted":true}`。同时含未知 target 标签、零分母、字符串 priority、未知 emit 的定义仍通过。

期望：验证目标/事件引用、作用域、排序字段、各 action 必需参数及数值范围，在引擎运行前拒绝无效内容。审核快照还没有完整稀有度与定义 ID 一致性检查。架构文档对 schema 覆盖的声明强于实现。

### 6. P2：仅备份存在时不尝试恢复

位置：`js/core/save.js:4`。

输入：上面 `missing_primary_backup`，存储中仅存在有效 backup。

实际实测：`{"ok":false,"error":"没有存档"}`。

期望：主档缺失也应尝试有效备份；目前仅主档存在但 decode 失败时才走备份路径。

### 7. P2：revision 强制契约未落实

位置：`js/core/game.js:4`；契约 `docs/RULES.md`。

输入：上面 `revision_optional`。

实际实测：`{"withoutRevisionAccepted":true}`。条件仅在 cmd.revision 非 undefined 时检查。

期望：若规则要求选择必须携带 revision，应在核心校验层落实，或明确修改契约。当前 UI 正常 send 路径会携带 revision，现有测试也验证过期 revision 拒绝；**本项不等于已证明正常 UI 双击重复发奖。**

## 十个复杂 fixture：真实链存在，但多样性不足

位置：`tests/fixtures/combos.js:4–15`、`tests/suite.js:7`。

确认的通过项：

- 五个核心类型实际放在盘面，不是靠池外符号凑数量。
- 真正因果链为 hook consume(depth0) → echo add(depth1) → meter grow(depth2) → lens multiply(depth3)。
- 测试追溯 parent 并核对深度，不仅检查一个深度数字。
- fixture 含手工推导的期望值与解释。

质量问题：十个 fixture 全部复用相同五符号核心盘面，仅加一个外围符号。多个变体主要是独立基础/条件收益；部分确实增加销毁、转换、生成等机制，但满足三层的证据仍来自同一条链。

判定：**字面上的十例、四种符号、三层因果门槛成立；不能证明十种独立复杂交互。** 按本次用户特别要求的“不是复制同一测试改数值”质量标准，这是 M2 验收不足（P2／门禁补测项）。应增加不同拓扑，覆盖转换后的竞争、失效源取消、回合结束派生、复制与触发交互，而非再加同骨架数值变体。

## 结算与通用机制审查

### 已实现且不应误报

- 基础值、加法、竞争消耗、销毁后无普通收益、转换、局部倍率、永久成长、风险、临时标签均有实际 handler。
- transform 保留旧 add/mul、保留 ID/permanent、清 counters 是 `docs/RULES.md` 明示选择，不应因与其他游戏不同就判 bug。
- 初始队列排序、派生 FIFO、同批排序符合当前规则；后续未对全队列重新按 priority 排序并非自动等于错误。
- 死亡 source 的 scope:event 监听在当前规则中明确允许，不单独认定生命周期缺陷。
- copy 只复制邻居 ON_APPEAR/add 的 amount；自带 mirror/battery 案例符合该窄契约。

### 契约缺口与范围

- `ON_GAIN` 只在效果显式 emit 时触发，不自动支付现金；现有测试证实 reward 仍为 0。不能把名字当成隐含到账规则。
- `ON_END_SPIN` 在最终 ledger 前执行，因此能改变本轮收益；测试证实此行为。`docs/RULES.md` 未清楚冻结该时点及 ON_GAIN 的语义，应补齐 M0 契约。
- target 仅 self 或邻接单标签；没有通用同排/同列/全盘目标。
- 没有全局倍率累加器；`activeModifiers` 在校验中只能为空。
- copy 直接相加量，不复制完整模板的目标、emit 等语义。若继续限定为 ON_APPEAR add，应明确可复制模板限制，而非宣称一般复制已经实现。
- action 是局部 handler 映射；trigger 是事件字符串集合和扫描匹配。已经数据驱动，但公开可扩展注册机制及通用范围有限。

以上最后几项需根据执行计划核心契约明确补齐或声明收窄，不能一方面只实现窄特例、一方面宣称通用机制完整覆盖。

## 事务、输入与 UI

### 已有通过项

- `G.command` 克隆状态，运行后验证再返回新状态，异常返回原对象。
- 已有循环测试实际核对完整状态/RNG/ID/成长回滚，不应说事务保护不存在。
- 连续 Spin 被 phase 拒绝；明确过期 revision 的选择被拒绝。
- 最后 Spin 先选符号/跳过，再付款；恰好付款成功、差 1 失败、最终付款胜利均通过测试。
- UI 代码有符号候选、跳过、付款后资源奖励、WON/LOST 显示、重开，不是只有 Spin 的空壳。
- 普通稳定节点序列化/恢复与连续运行重放一致测试通过。

### 尚需实机证据

本审核没有浏览器交互，不声称 file/http、真实付款全流程、浏览器关闭恢复或快速键鼠已实测。主 worker 的浏览器烟测应独立记录正常胜败、选择状态恢复及坏档导入行为。Debug 资金直接跳胜仅证明流程，不证明正常经济可玩性。

实例锁定没有实现，也缺少资源/持续时间契约。但执行计划 M3 包含概率控制，**不将缺少锁定单独当 M2 阻断**；应明确延期范围。

## M0–M2 漏项汇总

| 范围 | 审核时状态 | 严重度/处理 |
|---|---|---|
| M0 `docs/CONTENT_MATRIX.md` | 文件缺失 | 交付漏项 |
| M0 事件和金额契约 | ON_END_SPIN/ON_GAIN 未明确；有理倍率声明与实现不符 | 契约补齐；金额 P1 |
| M1 存档结构与稳定节点 | 缺字段、显示引用、终局一致性校验不足 | P1 |
| M1 导入事务 | render 失败前已换状态并可能保存 | P1，静态路径待浏览器复测 |
| M1 备份恢复 | 主档缺失不读备份 | P2 |
| M2 schema | 非法效果参数和引用仍通过 | P1 |
| M2 复杂 fixture | 真三层但十例复用同一骨架 | 门禁质量不足 |
| M2 通用效果范围 | 无全局倍率；复制和目标语义狭窄 | 补齐或明确收窄 |
| M2 Debug | 有固定盘面、注入符号、现金、阶段、RNG和执行日志 | 已有；显示的是执行后日志，不是实时待执行队列 |
| M2 无 UI 模拟原型 | 已有，策略范围有诚实备注 | 符合原型方向，不等于正式平衡验收 |

## 不作为当前阻断的后续工作

正式道具、事件、60+ 符号、8 条完整构筑、正式 SVG、美术、音效、动画、完整胜利统计、Greedy Bot 与正式平衡是后续阶段内容；本报告不以这些未完成为由否定 M2。后续应先对上述实际缺陷独立复测，再更新里程碑结论。
