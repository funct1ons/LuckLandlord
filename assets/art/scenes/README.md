# 雾港工作台原创场景（A方向）

本目录为本项目新制作的原创程序化 SVG 插画；没有第三方图像、外部游戏截图、字体或联网依赖。不是实体手绘作品，也不宣称由真人手绘。

## 权属说明

本目录为本项目原创资产，没有使用参考游戏的截图或授权素材。项目尚未选择统一开源许可证，本目录不另行替用户授予 MIT 或其他许可；权属与项目政策见 [ASSET_LICENSES](../../../docs/ASSET_LICENSES.md)。

## 资产与接入

- `welcome-workshop.svg`: 1920×1080源稿，左约42%低反差暗部；右为冷港窗、主暖铜工作灯、珐琅回收机、旧木台及无文字物件。
- `room-workshop.svg`: 1920×1080，不含欢迎机器，整体压暗，供局内整屏背景使用。
- `machine-frame.svg`: 1000×700，透明中心 x=72..928、y=62..640；顶灯罩、侧导管、底盘仅占边缘。
- `welcome-preview.png`: 1366×768，本地 Edge 对独立场景的实际截图，仅供审核，不是运行时资产。

`GDD1SCENE.welcome()` / `machine()` / 新增 `room()` 均返回装饰图片HTML字符串；常规img引用本地资产，URL 相对 scene.js 解析。欢迎和环境使用居中object-fit:cover，机身允许适配容器比例。无文字、交互或动画，不含能源等虚构系统。`room()` 已接入主界面背景；所有场景层 pointer-events:none。欢迎与房间运行时读取同名PNG，保留SVG源稿。

中心机身空白范围沿用既有合同，不压住5×4真实盘面。支持多个实例，外部SVG的内部定义不污染宿主文档ID。大窗口对背景使用采样回退以避开Edge栅格化阻塞；物件和文字仍保持矢量。

## 重建与审核

仓库根目录执行 `python tools/art/build-workshop.py`，再以 Node22+ 和 Windows Edge 执行 `node tools/art/bake-scenes.js`，生成1920×1080本地PNG。栅格化保留纹理与光照，避免2560像素窗口每次绘制全屏SVG噪声滤镜。脚本固定随机种子，只写本目录三份 SVG。打开 `tools/art/scene-preview.html` 审核 cover 构图。欢迎、局内、候选与查阅的实际UI叠加由 `tests/gdd1/visual-shot.js` 验收并截图；自动检查不能替代玩家审美判断。
