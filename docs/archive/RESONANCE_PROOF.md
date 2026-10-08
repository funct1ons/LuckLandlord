# C 共振路线验收冻结

本批接入 `dock_chime`、`pitch_fork`、`fog_reed`、`beat_spool`、`chord_frame`、`prism_hum`、`silence_keeper`、`harbor_conductor` 八个矩阵 ID。效果全部写入 `content.js` 的通用 selector/predicate/action/counter schema：同排去重 type、八邻接单目标、周期计数、同排精确条件、有理倍率和全排倍率；没有按 ID 分支。

行为测试位于 [`tests/resonance-behavior.js`](../tests/resonance-behavior.js)，每个 ID 三个精确 case，覆盖正、负、边界、八邻接边界、同排范围、单目标、周期复位、倍率与转换不重触发。测试 helper 先固定原始 symbol state，再首次 `spin`，没有先 resolve 后布置。

本批通用修复：resolver 支持有界 `count` 数值表达式、`rowUniqueTypeCount` 谓词和 `cycle` action；selector 继续使用稳定位置顺序，倍率保持有理数。新增 schema 原语已通过 `validateContent()`，未知 action、未知标签和非法表达式仍拒绝。

验证命令：

```powershell
node tests/run.js
node -e "const fs=require('fs'),vm=require('vm');let c={window:{},console};vm.createContext(c);for(let f of ['js/core/rng.js','js/data/content.js','js/engine/resolver.js'])vm.runInContext(fs.readFileSync(f,'utf8'),c);console.log(c.window.Game.validateContent())"
```

Node 结果由 `tests/run.js` 机器生成 [`tests/suite-manifest.json`](../tests/suite-manifest.json)：总计 225，全部通过；原有 201 条保留，新增共振 24 条。浏览器加载入口 [`tests/index.html`](../tests/index.html) 已显式加载并调用共振 suite，覆盖真实页面的 spin/choose（settle）、save/restore 逻辑链；Edge file/HTTP 及旧独审脚本沿用原命令冻结复测。

## ID 对照

| ID | 实现语义 | 精确测试 |
|---|---|---|
| dock_chime | 同排其他 resonance 的不同 type 数，最多 +3 | row-distinct-types / row-boundary / cap-three |
| pitch_fork | 八邻接 resonance 位置优先单目标 +3 | one-target / diagonal-is-adjacent / no-wrap |
| fog_reed | 邻接 mist 时自身 +3 | self-add / no-mist / nonself-neighbor |
| beat_spool | 第三次上盘自身 +9，计数归零后重启 | cycle / reset / off-board |
| chord_frame | 同排至少两种其他 resonance 时一个邻居 ×2 | two-types-one-target / one-type-negative / ratio-exact |
| prism_hum | 邻接 crystal 时自身 +4；转换获得不重触发出现 | self-add / no-crystal / conversion-no-appear |
| silence_keeper | 所在排恰有一个 resonance 时自身 +10 | sparse-row / dense-row-negative / other-row-does-not-count |
| harbor_conductor | 同排至少三种 resonance 时该排 ×2，一次 | three-types-row / two-types-negative / one-application |
