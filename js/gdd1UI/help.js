/* 玩家帮助。只负责查阅，不执行游戏命令。 */
(function (root) {
  'use strict';
  const esc = x => String(x).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const tags = {
    plant:['植物','常与上盘成长、成熟和转换配合。'], fuel:['燃料','可供指定装置消耗。'],
    scrap:['废料','回收工作线的常见原料。'], junk:['垃圾','可能拖累收益，也能被特定牌清理。'],
    machine:['装置','处理材料或帮助其他牌的设备。'], resonance:['共鸣','常与邻接、同排和拍点配合。'],
    crystal:['晶体','蒸馏工作线的重要产物。'], magic:['异相','常与临时标签和复制配合。'],
    contract:['契据','常与现金、账单和清理垃圾配合。'], cargo:['货运','常与货物、牌库规模和保留配合。'],
    pressure:['蓄压类','部分牌拥有蓄压机制；有此标签不代表必定能蓄压。'],
    mist:['雾料','可供指定回收或蒸馏效果使用。'], feedstock:['原液','蒸馏与转换的材料。'],
    product:['成品','可与出货和成品奖励配合。'], support:['支援','协助其他牌的生产牌。']
  };
  const routes = [
    ['培育','积累上盘次数，成熟转换或永久成长。'], ['回收','消耗废料、清理垃圾，获得独立奖励。'],
    ['共鸣','让不同共鸣牌相邻，利用同排组合与拍点。'], ['蒸馏','把原液变成晶体，配合转换和保留。'],
    ['货运','围绕货物、成品和牌库规模组织出货。'], ['蓄压','积累压力再释放收益，留意风险和保护。'],
    ['异相','利用临时标签、可复制的固定加值及成长联动。'], ['契据','利用现金条件与账单效果，权衡预支和未来义务。']
  ];
  function open() {
    const O = root.GDD1OVERLAY;
    if (!O) return null;
    const text = root.GDD1TEXT, copy = root.GDD1COPY || {};
    const tagHtml = Object.keys(tags).map(id => '<dt>' + esc(text && text.tagLabel ? text.tagLabel(id) : tags[id][0])
      + '</dt><dd>' + esc(tags[id][1]) + '</dd>').join('');
    return O.open('help', { title: '工坊帮助', wide: true, html:
      '<section class="help-section"><h3>怎么玩</h3><p>'
      + esc(copy.start && copy.start.goal || '付清10期账单，保住工坊；到期现金不足则本局失败。')
      + '</p><ol><li>运行：从生产牌库无放回抽取至多20张，随机放入5×4盘面，不能手动摆牌。</li>'
      + '<li>结算：普通产出与独立奖励构成本轮净额。邻接包括上下、左右及斜角；同时上盘不保证相邻。</li>'
      + '<li>选牌或跳过并入账：本轮收益已经确定，新牌从未来运行起才可能上盘；本期最后一轮新拿的牌不能补救当期缺口。</li>'
      + '<li>按期付款：付清后可选本局升级；升级不占盘面。关注剩余运行次数、现金和应付。</li></ol>'
      + '<p>牌库不超过20张时，移除不会提高其他牌的上盘率；超过20张时，精简可能改善关键牌出现机会。抽取权重会影响机会。移除不触发销毁奖励。</p>'
      + '<p>先支邮戳默认拒绝。接受后，每张邮戳每期首次合格上盘带来待入账奖励18、本期应付增加12，并尝试生成待核欠条。生成失败、关闭或移除均不撤销已有义务。</p></section>'
      + '<section class="help-section"><h3>15种标签</h3><p>标签供效果识别目标；具体条件以牌的完整说明为准。</p><dl>' + tagHtml + '</dl></section>'
      + '<section class="help-section"><h3>8条工作线</h3><dl>' + routes.map(r => '<dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd>').join('')
      + '</dl><p>可混合路线；精简模式仅提供培育、回收与蒸馏的部分内容。</p></section>'
      + '<section class="help-section"><h3>快捷键</h3><dl><dt>Space</dt><dd>运行；演出中跳过演出。</dd>'
      + '<dt>1 / 2 / 3</dt><dd>选择对应候选。</dd><dt>S</dt><dd>跳过候选。</dd><dt>R</dt><dd>刷新生产牌候选。</dd>'
      + '<dt>Esc</dt><dd>关闭最上层可关闭的查阅层；必要选择不会被跳过。</dd><dt>Tab / Shift + Tab</dt><dd>向前或向后移动焦点。</dd></dl>'
      + '<p>输入框聚焦时不触发游戏快捷键；长按不会连续执行。快捷键仅在对应操作可用时生效。</p></section>' });
  }
  root.GDD1HELP = { open: open };
})(typeof window !== 'undefined' ? window : globalThis);
