# RECYCLING_PROOF

本批次实现并测试废热回收 8 个正式符号：`ash_felt`、`sorting_tong`、`copper_burr`、`spent_gasket`、`sieve_drum`、`heat_clerk`、`clinker_router`、`furnace_auditor`。

- ash_felt：保留既有培育行为；三次上盘自毁奖励 3，消费路径只保留消费奖励/生成语义，测试覆盖消费与自毁互斥。
- sorting_tong：稳定位置单目标消费 scrap，奖励 6；无合法目标保底 1。
- copper_burr：邻接 machine 时自身加 2，machine 不被错误加值。
- spent_gasket：负基础值、排除正常候选。
- sieve_drum：每轮一次把邻接 junk 转为 copper_burr，保留 UID/permanent 并清空 counters，不重触发 ON_APPEAR。
- heat_clerk：每轮首次成功消费 scrap 永久成长 1，软上限 30；非 scrap 不触发。
- clinker_router：每轮最多销毁一个邻接 junk，销毁不发消费奖励；消费原因与销毁原因分开记录。
- furnace_auditor：数据使用通用 `uniqueTypeCount` 谓词与全盘 machine 倍率结构；同 type 重复不满足异类条件。

通用修复点包括结构化事件原因/目标标签过滤、稳定 selector、转换目标排除标签、消费类型集合与严格 content schema。新增 [tests/recycling-behavior.js](/C:/files/code/LuckLandlord/tests/recycling-behavior.js) 实际包含 **23 个**回收行为 case，并接入 Node/browser。逐 case 清单见 [recycling-case-manifest.json](/C:/files/code/LuckLandlord/tests/recycling-case-manifest.json)。

实测命令：

- `node tests/run.js`：172/172 passed；其中原有非回收套件 149 个、回收行为脚本实际 23 个。
- 培育独立审核脚本与 retest 脚本保持未修改

本批次以真实 23 个回收行为 case 验收；数量纠正记录见 [RECYCLING_CLOSEOUT.md](RECYCLING_CLOSEOUT.md)。