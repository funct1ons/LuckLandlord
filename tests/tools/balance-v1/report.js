'use strict';
/**
 * tests/tools/balance-v1/report.js
 *
 * 生成聚合 JSON 与简短 Markdown。报告只陈述本次实际跑出的数字，
 * 并把「证据不足」显式写出，不把初步基线称为正式平衡验收。
 */
const fs = require('node:fs');
const path = require('node:path');

function pct(x, digits) {
  if (x === null || x === undefined) return 'n/a';
  return (x * 100).toFixed(digits === undefined ? 1 : digits) + '%';
}
function num(x, digits) {
  if (x === null || x === undefined) return 'n/a';
  return Number(x).toFixed(digits === undefined ? 1 : digits);
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

function writeJsonl(file, records) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const body = records.map(r => JSON.stringify(r)).join('\n');
  fs.writeFileSync(file, body + (body ? '\n' : ''), 'utf8');
}

function markdown(summary) {
  const L = [];
  const push = s => L.push(s);
  push('# 平衡工具 v1 · 初步基线报告（工作包A）');
  push('');
  push('> **这不是正式平衡验收。** 本轮只重建测量工具并跑训练集初筛；');
  push('> 未运行留出集、未改任何游戏数值、未开始调参。');
  push('');
  push('- 生成时间（UTC）：' + summary.generatedAt);
  push('- 配置：`' + summary.configId + '`');
  push('- 源码哈希（引擎 13 文件组合）：`' + summary.sourceHash + '`');
  push('- 配置哈希：`' + summary.configHash + '`');
  push('- seed 清单哈希：`' + summary.seedsHash + '`');
  push('- seed 数量：' + summary.seedCount + '（前缀 `' + summary.seedPrefix + '`）');
  push('- 策略版本：`' + summary.policyVersion + '`');
  push('- 每策略局数：' + summary.gamesPerPolicy);
  push('- 命令：`' + summary.commandLine + '`');
  push('');
  push('## 1. 逐策略结果');
  push('');
  push('| 策略 | 局数 | WON | LOST | ERROR | 胜率 | 95% Wilson | 胜率可用 |');
  push('|---|---:|---:|---:|---:|---:|---|---|');
  for (const p of summary.policies) {
    push('| ' + p.policy + ' | ' + p.games + ' | ' + p.won + ' | ' + p.lost + ' | ' + p.error + ' | ' +
      pct(p.winRate) + ' | [' + pct(p.winRateCI.lo) + ', ' + pct(p.winRateCI.hi) + '] | ' +
      (p.winRateUsable ? '是' : '**否（存在 ERROR）**') + ' |');
  }
  push('');
  push('## 2. 各期存活（累计存活 = 通过本期/全部开局；条件失败 = 本期失败/进入本期）');
  push('');
  const policyNames = summary.policies.map(p => p.policy);
  for (const name of policyNames) {
    const p = summary.policies.find(x => x.policy === name);
    push('### ' + name);
    push('');
    push('| 期 | 进入 | 通过 | 本期失败 | 累计存活 | 条件失败率 |');
    push('|---:|---:|---:|---:|---|---|');
    for (const s of summary.stageList) {
      const row = p.survival[s];
      push('| ' + s + ' | ' + row.entered + ' | ' + row.passed + ' | ' + row.failedHere + ' | ' +
        pct(row.cumulativeSurvival) + ' | ' + pct(row.conditionalFailure) + ' |');
    }
    push('');
  }
  push('## 3. 成型与路线');
  push('');
  push('| 策略 | 第4期前达成配合局数 | 比例 | 95% Wilson | 终局主路线胜局 | 混搭胜局 | 混搭占比 |');
  push('|---|---:|---|---:|---:|---:|---:|');
  for (const p of summary.policies) {
    push('| ' + p.policy + ' | ' + p.coop.gamesWithCoop + ' | ' + pct(p.coop.rate) + ' | [' +
      pct(p.coop.ci.lo) + ', ' + pct(p.coop.ci.hi) + '] | ' +
      Object.entries(p.routes.mainRouteWinCounts || {}).map(([k, v]) => k + ':' + v).join(' ') + ' | ' +
      p.routes.mixedWins + ' | ' + pct(p.routes.mixedWinShare) + ' |');
  }
  push('');
  push('## 4. 操作使用次数');
  push('');
  push('| 策略 | 决策 | 选择 | 跳过 | 移除 | 刷新 | 道具 | 跳过道具 | 事件接受 | 事件拒绝 |');
  push('|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|');
  for (const p of summary.policies) {
    const a = p.actions;
    push('| ' + p.policy + ' | ' + a.decisions + ' | ' + a.choose + ' | ' + a.skip + ' | ' + a.remove + ' | ' +
      a.reroll + ' | ' + a.item + ' | ' + a.skipItem + ' | ' + a.eventAccept + ' | ' + a.eventReject + ' |');
  }
  push('');
  push('## 5. 配对比较（同 seed）');
  push('');
  push('| 比较 | 有效配对 | 因 ERROR 剔除 | A独胜 | B独胜 | 均胜 | 均负 | 平均差 | bootstrap 95% 区间 |');
  push('|---|---:|---:|---:|---:|---:|---:|---|---|');
  for (const c of summary.paired) {
    push('| ' + c.policyA + ' vs ' + c.policyB + ' | ' + c.pairedUsableGames + ' | ' + c.excludedForError + ' | ' +
      c.aWinsOnly + ' | ' + c.bWinsOnly + ' | ' + c.bothWin + ' | ' + c.bothLose + ' | ' +
      num(c.meanDiff, 4) + ' | [' + num(c.bootstrap.lo, 4) + ', ' + num(c.bootstrap.hi, 4) + '] |');
  }
  push('');
  push('## 6. 收益与付款余量');
  push('');
  push('| 策略 | 单轮收益 P10/P50/P90 | 后期(7–10)单轮 P10/P50/P90 | 后期样本轮数 | 付款前余量 P10/P50/P90 | 后期余量 P10/P50/P90 | 后期到达局数 |');
  push('|---|---|---|---:|---|---|---:|');
  for (const p of summary.policies) {
    const i = p.income.perSpin, li = p.income.lateStagePerSpin, m = p.margin.all, lm = p.margin.late;
    push('| ' + p.policy + ' | ' + num(i.p10) + ' / ' + num(i.p50) + ' / ' + num(i.p90) + ' | ' +
      num(li.p10) + ' / ' + num(li.p50) + ' / ' + num(li.p90) + ' | ' + li.n + ' | ' +
      num(m.p10) + ' / ' + num(m.p50) + ' / ' + num(m.p90) + ' | ' +
      num(lm.p10) + ' / ' + num(lm.p50) + ' / ' + num(lm.p90) + ' | ' + p.margin.lateGamesReaching + ' |');
  }
  push('');
  push('## 7. 错误统计');
  push('');
  for (const p of summary.policies) {
    if (!p.error) { push('- ' + p.policy + '：0 个 ERROR'); continue; }
    push('- ' + p.policy + '：**' + p.error + ' 个 ERROR**');
    for (const e of p.errors.slice(0, 10)) push('  - seed `' + e.seed + '` phase=' + e.phase + ' stage=' + e.stage + '：' + e.reason);
    if (p.errors.length > 10) push('  - （其余 ' + (p.errors.length - 10) + ' 条见聚合 JSON）');
  }
  push('');
  return L.join('\n');
}

module.exports = { markdown, writeJson, writeJsonl, pct, num };
