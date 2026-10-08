# 独立审核修复回应（待独立复测）

依据 docs/CORE_REVIEW.md。只修改 M0–M2，不扩正式道具/事件内容。

|审核项|修复与实际回归|
|---|---|
|1 缺 stats|新增 core/validation.js；必需字段、进度与付款状态交叉校验；缺stats/假终局测试|
|2 last/导入事务|盘面、类型、UID、分项、比例、日志parent/depth、历史逐项校验；导入先decode，再尝试渲染，成功后保存；渲染/保存失败回到原状态；Edge坏档导入保持状态及主档|
|3 假终局|WON必须stage9/remaining0/已付10阶段；ITEM必须非最终stage/remaining0/付款进度stage+1；LOST现金不足|
|4 浮点倍率|内部BigInt分子分母；金额整数×有理数后精确floor（负数亦floor）；100×29/100=29，多倍率100/-100/101/-101回归；同样适用于全局倍率|
|5 schema|逐项拒绝零分母、未知标签/emit、非法priority/scope、必需参数缺失；定义ID一致及稀有度检查|
|6 备份缺主档|主档缺失时尝试备份；备份写入失败不得继续写新主档|
|7 revision|全部核心命令必须携带当前revision；UI、Bot、测试调用统一携带；缺失/过期拒绝|
|fixture多样性|转换后新定义链、自毁哨链、竞争消耗、复制接入、双倍率成长加入十fixture；每例人工公式、真实parent回溯及≥4类型|
|时序缺口|规则明确END在ledger之前，GAIN仅显式事件不隐含现金；END加法/销毁均测试|
|范围与倍率|增加可注册目标作用域映射self/adj/row/column/board；增加globalMultiply，奖励不乘全局倍率；复制明确只拷贝ON_APPEAR/add数值，不宣称复制所有模板|

## 实际执行
- `node tests/run.js`：50/50 passed（最终重跑结果见 tests/node-result.txt）。
- `powershell -NoProfile -ExecutionPolicy Bypass -File tests/browser-check.ps1`：Edge四项file://检查退出码均0；测试页、真实UI点击正常胜败、坏档保护、进程关闭后存档精确恢复。
- `node tests/http-check.js`：Edge HTTP UI烟测 exit=0/pass=true。
- `node tests/run.js simulate 1000`：1000真实流程局，无异常；value胜率100%，明确不通过正式平衡门禁。

浏览器自动点击不是人工试玩；无三分辨率视觉验收、Chrome或干净PC验收。首次直接PowerShell调用Edge向stderr输出QQBrowser路径警告，工具报exit1；改Start-Process -PassThru分离stderr后实际Edge进程exit0，结果日志保留。并非忽略非零退出码。
