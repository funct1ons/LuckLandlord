(function () {
  "use strict";
  const G = window.Game,
    $ = (id) => document.getElementById(id),
    evidence = [];
  const check = (v, m) => {
    if (!v) throw Error(m);
  };
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  try {
    check(document.querySelectorAll(".cell").length === 20, "盘面未渲染");
    $("seed").value = "SIM-0";
    $("new").click();
    let count = 0;
    while (
      !["WON", "LOST"].includes(window.FogUI.getState().phase) &&
      count++ < 1000
    ) {
      let s = window.FogUI.getState();
      if (s.phase === "READY") {
        $("spin").click();
        const resolved = window.FogUI.getState();
        $("spin").click();
        check(same(resolved, window.FogUI.getState()), "重复spin提交");
      } else if (s.phase === "SYMBOL_CHOICE") {
        if (count === 2) {
          $("choices").lastElementChild.click();
          s = window.FogUI.getState();
          evidence.push("reroll token consumed");
        }
        const before = window.FogUI.getState();
        $("save").click();
        $("continue").click();
        check(same(before, window.FogUI.getState()), "恢复改变待选状态/RNG");
        const idx = s.choices.reduce(
          (best, id, i) =>
            G.symbols[id].baseValue > G.symbols[s.choices[best]].baseValue
              ? i
              : best,
          0,
        );
        $("choices").children[idx].click();
      } else if (s.phase === "ITEM_CHOICE") $("choices").children[2].click();
    }
    const win = window.FogUI.getState();
    check(["WON", "LOST"].includes(win.phase), "正常策略未走通终局");
    evidence.push({
      run: "normal value selections",
      phase: win.phase,
      spins: win.spin,
      stages: win.stats.stages,
      cash: win.cash,
    });
    $("seed").value = "SMOKE-SKIP";
    $("new").click();
    count = 0;
    while (
      !["WON", "LOST"].includes(window.FogUI.getState().phase) &&
      count++ < 1000
    ) {
      const s = window.FogUI.getState();
      if (s.phase === "READY") $("spin").click();
      else if (s.phase === "SYMBOL_CHOICE") $("choices").children[3].click();
      else $("choices").children[2].click();
    }
    const lost = window.FogUI.getState();
    const stored = localStorage.getItem("fog-port.save.v1");
    for (const alter of [
      (s) => (s.stats = {}),
      (s) => (s.last.board.find(Boolean).type = "missing"),
      (s) => (s.phase = "WON"),
    ]) {
      const bad = G.clone(lost);
      alter(bad);
      let rejected = false;
      try {
        window.FogUI.importText(JSON.stringify(bad));
      } catch (e) {
        rejected = true;
      }
      check(rejected, "坏档导入未拒绝");
      check(same(window.FogUI.getState(), lost), "坏档替换原状态");
      check(
        localStorage.getItem("fog-port.save.v1") === stored,
        "坏档覆盖原存档",
      );
    }
    evidence.push("invalid imports preserve state and storage");
    const pending = G.newRun('UI-PENDING-TRANSACTION');
    pending.symbols = [G.instance(pending, 'pressure_pouch')];
    window.FogUI.importText(JSON.stringify(pending));
    $("spin").click();
    const pendingBefore = window.FogUI.getState();
    const primaryBefore = localStorage.getItem('fog-port.save.v1');
    const backupBefore = localStorage.getItem('fog-port.save.v1.backup');
    for (const value of [null, '1', {amount: 1}, 1.5, 1000000001, -1000000001, 8]) {
      const bad = G.clone(pendingBefore);
      bad.pendingSettlement = value;
      let rejected = false;
      try { window.FogUI.importText(JSON.stringify(bad)); } catch (e) { rejected = true; }
      check(rejected, 'damaged pending accepted');
      check(same(window.FogUI.getState(), pendingBefore), 'pending import changed memory');
      check(localStorage.getItem('fog-port.save.v1') === primaryBefore, 'pending import changed primary');
      check(localStorage.getItem('fog-port.save.v1.backup') === backupBefore, 'pending import changed backup');
    }
    evidence.push('7 damaged pending imports preserve memory/primary/backup');
    // Faults exercise the real UI transaction; current B and backup A are deliberately different.
    const importFaults = [];
    for (const fault of ['validation','preview-render','getItem','serialization','capacity','setItem']) {
      const a = G.newRun('FAULT-A'), b = G.newRun('FAULT-B'), c = G.newRun('FAULT-C');
      window.FogUI.importText(G.encode(b));
      localStorage.setItem('fog-port.save.v1', G.encode(b));
      localStorage.setItem('fog-port.save.v1.backup', G.encode(a));
      const mem = window.FogUI.getState(), primary = localStorage.getItem('fog-port.save.v1'), backup = localStorage.getItem('fog-port.save.v1.backup');
      const originalCreate = document.createElement, originalGet = Storage.prototype.getItem,
        originalSet = Storage.prototype.setItem, originalStringify = JSON.stringify;
      let text = G.encode(c), rejected = false;
      try {
        if (fault === 'validation') { c.rngState = 0; text = JSON.stringify(c); }
        if (fault === 'preview-render') document.createElement = function () { throw Error('injected preview'); };
        if (fault === 'getItem') Storage.prototype.getItem = function () { throw Error('injected getItem'); };
        if (fault === 'serialization') JSON.stringify = function (value, ...args) {
          if (value && value.seed === 'FAULT-C') throw Error('injected serialization');
          return originalStringify.call(JSON, value, ...args);
        };
        if (fault === 'capacity') { c.activeModifiers = ['x'.repeat(1024 * 1024)]; text = originalStringify(c); }
        if (fault === 'setItem') Storage.prototype.setItem = function () { throw Error('injected setItem'); };
        try { window.FogUI.importText(text); } catch (e) { rejected = true; }
      } finally {
        document.createElement = originalCreate; Storage.prototype.getItem = originalGet;
        Storage.prototype.setItem = originalSet; JSON.stringify = originalStringify;
      }
      check(rejected, 'fault accepted: ' + fault);
      check(same(window.FogUI.getState(), mem), 'fault changed memory: ' + fault);
      check(localStorage.getItem('fog-port.save.v1') === primary, 'fault changed primary: ' + fault);
      check(localStorage.getItem('fog-port.save.v1.backup') === backup, 'fault changed backup: ' + fault);
      // A succeeding import proves finally released busy even when rollback rendering also threw.
      window.FogUI.importText(G.encode(c.seed === 'FAULT-C' ? G.newRun('FAULT-RECOVER') : c));
      check(window.FogUI.getState().seed === 'FAULT-RECOVER', 'busy stuck: ' + fault);
      importFaults.push({name:'mechanics-ui/import-' + fault, ok:true});
    }
    evidence.push({mechanicsImportFaults: importFaults});
    const hCases=[];
    const h=G.newRun('UI-H-CONTRACT');h.symbols=[G.instance(h,'advance_stamp')];
    window.FogUI.importText(G.encode(h));
    check($('advanceAccepted').checked===false && !$('advanceAccepted').disabled,'default reject READY setting');
    $('advanceAccepted').click();
    const configured=window.FogUI.getState();
    check(configured.settings.advanceAccepted===true,'READY setting not committed');
    $('save').click();$('continue').click();
    check(same(window.FogUI.getState(),configured),'READY persisted setting restore differs');
    hCases.push({name:'route-h-ui/READY-accept-setting-save-restore',ok:true});
    $('spin').click();
    const earned=window.FogUI.getState();
    check(earned.phase==='SYMBOL_CHOICE' && earned.cash===0 && earned.pendingSettlement===20 && earned.payment===38 && earned.stageState.claims.length===1,'stamp UI first run amounts');
    check($('advanceAccepted').disabled && $('hud').textContent.includes('配额 38'),'pending setting lock/public modified quota');
    const main=localStorage.getItem('fog-port.save.v1'),back=localStorage.getItem('fog-port.save.v1.backup');
    $('advanceAccepted').click();window.FogUI.send({type:'configureStage',accepted:false});
    check(same(window.FogUI.getState(),earned),'pending setting changed memory');
    check(localStorage.getItem('fog-port.save.v1')===main && localStorage.getItem('fog-port.save.v1.backup')===back,'pending setting changed storage');
    hCases.push({name:'route-h-ui/SYMBOL_CHOICE-setting-rejected-with-memory-and-bytes',ok:true});
    $('continue').click();check(same(window.FogUI.getState(),earned),'pending restore recomputed claim');
    $('choices').children[3].click();
    check(window.FogUI.getState().cash===20,'pending did not settle20');
    // Deleted junk leaves just the already-claimed stamp; the real next spin cannot claim twice.
    const junkRow=Array.from($('pool').children).find(row=>row.querySelector('span').textContent.startsWith('待核欠条 '));check(!!junkRow,'created arrears missing in UI');junkRow.querySelector('button').click();
    $('spin').click();const repeated=window.FogUI.getState();
    check(repeated.cash===20 && repeated.pendingSettlement===2 && repeated.payment===38 && repeated.stageState.claims.length===1,'pending reload double claim');
    hCases.push({name:'route-h-ui/pending-reload-choose-next-spin-no-repeat',ok:true});
    evidence.push({routeHUI:hCases});
    check(lost.phase === "LOST", "正常跳过策略没有失败");
    evidence.push({
      run: "normal skip selections",
      phase: lost.phase,
      spins: lost.spin,
      stage: lost.stage + 1,
      shortfall: lost.payment - lost.cash,
    });
    check($("debug").hidden, "调试默认可见");
    const p = document.createElement("pre");
    p.id = "smoke-result";
    p.textContent = JSON.stringify(
      {
        pass: true,
        evidence,
        note: "真实Edge DOM点击烟测；不等于人工试玩、视觉审查或关闭浏览器后恢复",
      },
      null,
      2,
    );
    document.body.append(p);
    document.body.dataset.smoke = "pass";
  } catch (e) {
    document.body.dataset.smoke = "fail";
    const p = document.createElement("pre");
    p.id = "smoke-result";
    p.textContent = JSON.stringify({ pass: false, error: e.message, evidence });
    document.body.append(p);
  }
})();
