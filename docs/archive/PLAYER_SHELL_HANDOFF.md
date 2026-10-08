# 玩家外壳收口 · 交接（归档）

> 本文保留已完成工作的交接与验证记录，不作为当前任务入口。归档后音乐默认值已调整为20%，下表的默认0为当时记录。

现行 `gdd1.html` / `js/gdd1UI/` 已完成玩家外壳接入。设计入口为 [GAME_DESIGN_V1.md](../GAME_DESIGN_V1.md)，玩家语言与视觉边界分别见 [GAME_IDENTITY.md](../GAME_IDENTITY.md)、[VISUAL_SPEC.md](../VISUAL_SPEC.md)。问题冻结与后续状态见 [PLAYER_SHELL_ISSUES.md](PLAYER_SHELL_ISSUES.md)。

## 现行实现

| 模块 | 已接入职责 |
|---|---|
| `main.js` / `copy.js` / `tutorial.js` | 欢迎故事、新局/继续、可跳过六步教程；每次启动均进入欢迎页，由玩家主动继续存档；`开场`、`?menu=1`、`#menu` 可回欢迎 |
| `prefs.js` / `codex.js` / `details.js` | 完整模式104项（64生产牌/32升级/8事件），按当前模式显示；发现遮蔽、筛选、盘面与牌库及候选详情 |
| `playerText.js` / `help.js` | 中文名称、用途、完整效果与事件动作；先支邮戳短开关/查看代价；玩法、15标签和8工作线帮助 |
| `overlay.js` / `confirm.js` | 层栈、焦点循环与返回、Esc；新局覆盖/移除/刷新保底的自定义确认 |
| `settings.js` / `keys.js` | 总音量、音效、音乐、速度、减少动态、屏震、对比增强、自动保存与快捷键；输入框/教程/确认层防误触 |
| `logView.js` / `end.js` / `anim.js` | 中文因果账本、入账/付款反馈、独立结局、复盘统计、最终构筑、复制Seed、再来一局、返回开场 |
| `icons.js` / `scene.js` / `audio.js` | 96幅原创本地SVG、工坊与机器场景；离线短音效与32秒合成音乐，音乐默认0 |

教程只从欢迎页开始新局时启动，继续、导入以及工具区新局不重启教程。候选与事件弹层不能用 Esc 绕过，查阅详情可单独关闭。生产牌列表隐藏 UID，详情保留技术编号。存档、导入导出与测试入口收进「存档与工具」，保留 `#new`、`#seed`、`#import` 等测试 DOM。

## 存储与统计边界

保持规则、内容 ID、RNG、付款表和游戏存档 schema 不变，不修改 `js/gdd1/**`。表现层使用经典脚本、完全离线，无框架、CDN 或运行时素材下载。

独立 UI 键：`fog-port.ui.gdd1.tutorial`、`fog-port.ui.gdd1.discovery`、`fog-port.ui.gdd1.settings`、`fog-port.ui.gdd1.telemetry`；兼容音效键 `fog-port.audio.v1`。游戏 JSON 导入导出不携带这些记录。恢复或导入后，只对当前已提交状态补发现；统计按当前模式、Seed、轮次与 revision 排除不属于当前进度的记录，缺失历史不推算。

结局显示近五轮范围内已记录净额均值、按来源归因的 MVP、最终构筑数量主副路线及关键牌上盘记录。同数并列；MVP 不是整局总收入或反事实收益，主副路线不是收益占比，缺失上盘记录不表示从未上盘。最终构筑和现金/应付来自实际状态。

## 验证与交付

最终回归均通过：

- `node tests/gdd1/welcome-shot.js`：无存档、完整/精简存档均先显示欢迎，主动继续恢复相同状态；隐藏测试入口可用。
- `node tests/gdd1/tutorial-shot.js`：六步真实操作、跳过、勾选、继续不重启和重看。
- `node tests/gdd1/codex-shot.js`：64/32/8目录、发现遮蔽、详情、Esc及焦点恢复。
- `node tests/gdd1/shell-shot.js`：独立设置不改存档、候选快捷键、取消移除、390px五列盘面、真实失败、导入高现金测试局通关、无外部请求及 `file://` 离线开局入账。通关夹具不用于证明平衡。
- `node tests/gdd1/animation-shell.js`：1366×768运行按钮可见，普通动画跳过不改已提交结果，键盘详情及入账演出可跳过。
- `node tests/tools/run-all.js`：11/11，通过新增104项文案、音频生命周期、独立设置/快捷键与原有机制/隔离检查。
- `git diff --check`：通过；`js/gdd1/**` 无修改。

浏览器截图已逐页检查并更新。真实设备音乐听感尚未人工试听；这些验证不证明平衡或真人理解度。

已更新下列截图，手册引用同步：

- `docs/images/01-start.png`：欢迎页。
- `docs/images/02-choice.png`：候选弹层。
- `docs/images/03-board.png`：盘面。
- `docs/images/04-pool.png`：生产牌库。
- `docs/images/05-end.png`：结局与复盘。
- `docs/images/06-codex.png`：图鉴。
- `docs/images/07-settings.png`：设置。

素材来源和生成技术见 [ASSET_LICENSES.md](../ASSET_LICENSES.md)。没有引入第三方素材文件，不据此臆造 CC0、MIT、公共领域或商业授权声明。

## 2026-10-07 暂停交接历史（冻结事实）

当时第0批欢迎门、第1批教程已落地；其后新增 `prefs.js`、`overlay.js`、`confirm.js`、`playerText.js`、`details.js`、`codex.js`，并修改 `main.js`、`copy.js`、HTML 与 CSS，但新增部分尚未测试验收。原 `playerText.js` 当时只有分温夹、和音框、先支邮戳、公用节拍器四份完整稿，其余使用脱敏合同句；`codex-shot.js` 当时尚未补齐。该状态属于历史，不再是现行待做清单。

冻结前欢迎/教程检查使用 `welcome-shot.js`、`tutorial-shot.js`；教程测试曾以 `window.confirm=()=>true` 接管确认，确认模块保留测试桩兼容。原交接还要求保留已有未提交的欢迎、教程与音效改动，不可回退。原批准方案分第0–5波推进，后续波次现已接入；不得把后来完成改写成冻结时已通过。
