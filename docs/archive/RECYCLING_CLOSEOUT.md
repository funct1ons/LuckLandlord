# RECYCLING_CLOSEOUT

## 计数纠正

本批次最终采用实际脚本枚举，不增加无关 case：

- 原有完整非回收套件：149 个 case。
- `tests/recycling-behavior.js`：23 个 case。
- 合计：**149 + 23 = 172**，全部通过。

此前文档中的“24 个回收 case”“148 个非回收 case”以及“旧套件丢失 1 个 case”均为本 worker 的计数报告错误。当前证据不支持旧 case 丢失；原因是新增数量曾被多报 1。原有 50 个 core case 保持完整。

逐 case 机器清单：[tests/recycling-case-manifest.json](../tests/recycling-case-manifest.json)。来源脚本：[tests/recycling-behavior.js](../tests/recycling-behavior.js)。

## 23 个回收行为 case 与 8 ID 映射

| ID / 交叉范围 | Case |
|---|---|
| sorting_tong | `sorting_tong/single-target`、`sorting_tong/no-target-boundary`、`sorting_tong/negative-target` |
| copper_burr | `copper_burr/self-add`、`copper_burr/no-machine`、`copper_burr/machine-not-target` |
| spent_gasket | `spent_gasket/negative-ledger`、`spent_gasket/not-candidate` |
| sieve_drum | `sieve_drum/transform-junk`、`sieve_drum/once-per-spin`、`sieve_drum/does-not-consume` |
| heat_clerk | `heat_clerk/scrap-consume-growth`、`heat_clerk/once-per-spin`、`heat_clerk/non-scrap-no-growth` |
| clinker_router | `clinker_router/destroy-junk`、`clinker_router/pressure-counter`、`clinker_router/consume-cause-no-listen` |
| furnace_auditor | `furnace_auditor/two-scrap-types`、`furnace_auditor/same-type-negative`、`furnace_auditor/one-type-negative` |
| 交叉生命周期/存档 | `event-cause/consume-destroy-no-double`、`uid/permanent/clear-counter`、`save/restore-after-recycling` |
| ash_felt | 本脚本没有单独命名的 ash_felt case；其消费/自毁互斥由独立 `audit-recycling.js` 的 `ash-felt-consume-cause-is-exclusive` 覆盖。不可凭数量推断存在额外行为 case。 |

## 独立复测结果

依据独立复测 `RECYCLING_RETEST.md` 及既有审计结果：

- 回收独立审计：10/10
- 培育审计：7/7
- 培育复测：6/6
- Node：172/172
- Edge file：4/4
- fixture：10/10
- HTTP：通过

本次只纠正文档计数，不修改代码、不修改 `RECYCLING_AUDIT.md` 或独立 retest 结论。行为、Node、Edge 已通过；本批次以真实 23 个回收行为 case 验收。若未来要求 ash_felt 在行为脚本中拥有单独命名 case，应新增明确需求和独立测试，而不是通过修改数量满足覆盖声称。

状态：代码冻结，等待原审核员复核文档纠正。
