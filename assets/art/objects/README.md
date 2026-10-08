# 雾港夜班 · 物件插画交付

96件原创彩色 SVG：`production/` 64生产牌、`upgrades/` 32本局升级。所有形体重新在128单位网格绘制，不使用旧32单位路径、不使用外部图片或字体。透明背景，左上暖光、右下暗面、双层接触阴影；无统一徽章框。

## API

直接替换 `js/gdd1UI/icons.js`，无需新增加载脚本。

- `ICONS.svg(type, cls)` / `ICONS.itemSvg(id, cls)`：仍返回 SVG 字符串，根类包含 `.sym`，viewBox为 `0 0 128 128`。`item_`前缀兼容，未知ID返回纸档案占位。
- `ICONS.ROUTES / MAP / routeOf / routeLabel / symbolIds`：旧接口保留。ROUTES的frame仍为空、cores为各物件新绘制内容。
- `GDD1ART.svg / itemSvg / objectIds / upgradeIds / viewBox`：独立可选接口。
- 每次调用使用单调递增`fogobj-N-`前缀；同页多实例不会串渐变。每件只输出实际使用的材质定义，96件约198KB SVG文本，不加载网络。
- 静态SVG可以直接通过本地img引用；静态文件ID各自处于独立文档，不要把其文件内容重复拼到同一DOM，inline使用上述API。

## 画法与图集检查

先绘制软囊、育苗床、露灯、琥珀叶、分温夹、盐安瓿、账簿、邮戳、仪表、冷凝盘管、热料帮手11件材质样稿，再扩展其余物件。材质表现包括玻璃双层厚边与液面、织物缝线/包扎、植物叶脉、铜接缝氧化、铆钉与金属反光、木柄、账簿纸页、蜡印。帮手使用胸像，有职业帽、围裙、票据、工具或包件。

`atlas.html`离线展示全套120px和40px对照；`atlas.png`为Edge离线截图，已实际查看：大图材料色和结构清楚，小图玻璃瓶、叶片、剪钳、仪表、账簿与不同设备轮廓可辨。细缝线和纸页在40px会消失，依靠主轮廓和材料色辨识。帮手胸像身份依靠衣着与工具区分，不依赖小尺寸五官。这是克制的彩色体积插画，不是写实照片或光栅绘画。

已接入新版UI：桌面候选128px、详情144px、图鉴72px，盘面与构筑列表使用小图；窄窗按断点调整，详见现行VISUAL_SPEC。界面层已同步材质与布局；规则文件未改。视觉偏好仍需玩家审美反馈，不把自动唯一性测试当作美术质量证明。

## 离线复现与验证

```text
node tools/art/build-objects.js
node tools/art/check-objects.js
node tests/tools/icons-coverage.js
node tests/tools/icons-uniqueness.js
```

构建脚本可重复运行。检测结果：64/32完整覆盖、8路线每条8件、零重复。额外检测剥离动态ID后仍96种不同几何，329个渐变ID跨实例无冲突且引用均局部闭合；字符串、根类、类名转义、升级ID别名、路线与降级接口通过。

范围仅：icons.js、assets/art/objects/**、tools/art/**。无规则、RNG、文案或场景改动。
