# M0–M2 实际测试报告

环境：Windows PowerShell 5.1，Node v24.14.1，已安装 Edge；无 npm 安装或玩家运行依赖。日期：2026-10-03。此报告是实现worker证据，仍待独立审核。

## 执行与结果

|命令|实际结果|证据|
|---|---|---|
|`node tests/run.js`|50/50 passed|tests/node-result.txt|
|`node tests/fixture-report.js`|10例均匹配人工期望，均≥4类型/最大因果深度3|tests/fixture-result.json|
|`powershell -NoProfile -ExecutionPolicy Bypass -File tests/browser-check.ps1`|4/4，Edge进程退出码全0|tests/browser-result.html、ui-smoke-result.html、storage-write-result.html、storage-read-result.html|
|`node tests/http-check.js`|Edge exit0/pass=true|tests/http-smoke-result.html|
|`node tests/run.js simulate 1000`|1000局无异常，value胜率100%，平均阶段10，平均单轮57.153，最高1100|tests/simulation-result.json|

最初直接PowerShell调用Edge将stderr的QQBrowser导入路径警告包装成NativeCommandError，工具报告exit1，但生成了完整测试DOM。后续不以该结果结项，改为Start-Process捕获真实进程码并重跑，均exit0。stderr见 tests/edge-stderr.txt（最终运行），HTTP stderr另存。

## 正常UI流程（实际Edge DOM按钮点击，不注资/不Debug）
- SIM-0：价值候选选择，有限刷新一次；69次Spin、10次付款、WON，最终现金821。
- SMOKE-SKIP：一直跳过；42次Spin，第6阶段LOST，差73。
- 每次符号待选点击手动保存/继续，逐字比对完整状态（候选、phase、RNG、计数、永久值）。第二次Spin点击无提交。
- 3种坏档导入调用同一UI导入事务：缺stats、未知快照type、伪WON；拒绝且原状态/原主档未变。文件选择器与实际下载动作未人工测试。
- 独立Edge进程先写待选状态/刷新候选，进程结束再启动读同一路径file档；全部字段一致，下一选择命令结果一致。
- HTTP另走相同正常胜败及坏档保护烟测。

## 十个手算fixture
通用回收链：hook消耗0 → echo加法1 → meter成长2 → lens倍率3。转换链：still转换0 → crystal加法1 → meter成长2 → lens倍率3。自毁链：spark销毁0 → warden加法1 → meter成长2 → lens倍率3。所有depth都是父子emit关系，不是三个独立阶段。

|名称|上盘类型|手算期望|最大深度|
|---|---|---:|---:|
|回收链|slag/hook/echo/meter/lens|1+3+2+2+5=13|3|
|复制接入链|上述5类+battery/mirror|13+4+3=20|3|
|竞争消耗链|上述5类（hook两个）|13+1=14，奖励仍5|3|
|邻接调频|上述5类+tuner|13+2+1=16|3|
|销毁哨增幅|上述5类+warden|13+4+1+2=20|3|
|转换后因果链|still/bloom/meter/lens/echo，bloom→crystal|1+6+2+2+1=12|3|
|永久成长双乘区|上述5类+press两个|13+2+2=17；表floor(2×1.5²)=4|3|
|雾芽成熟|上述5类+bud→bloom|13+3=16|3|
|自毁哨因果链|spark/warden/meter/lens/tuner|0+4+3+4+1=12|3|
|育匣新生|上述5类+seedbox|13+1=14；新bud下轮出现|3|

公式在fixture源文件独立写入；报告脚本只输出实际值对比，未用引擎生成期望。另有转换失效队列、自毁快照、END结算、负数取整与全局倍率专项回归。

## 门禁状态
- M0：抽样/空位/邻接/竞争/转换/倍率/付款/恢复契约已冻结。
- M1：纯逻辑完整胜败、Node重放、file/HTTP自动UI流程与跨进程恢复已验证。
- M2：20符号、通用作用域/动作队列、有理倍率、10复杂fixture、回滚、Debug/模拟已验证；待独立复测。
- 不宣称原提示词Gate A–I全通过：干净PC/Chrome、三个分辨率、正式视觉、人工3局与手感仍待验收。模拟胜率100%暴露原型曲线过易，正式Gate F不通过，M5处理。不因该问题扩M3内容。
