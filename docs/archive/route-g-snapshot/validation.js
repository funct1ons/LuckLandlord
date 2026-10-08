(function (G) {
  "use strict";
  G.validatePendingSettlement = function (s) {
    if (s.phase === "SYMBOL_CHOICE") {
      if (!Number.isSafeInteger(s.pendingSettlement) || Math.abs(s.pendingSettlement) > 1e9 ||
          !s.last || s.pendingSettlement !== s.last.total)
        throw Error("非法待提交结算");
    } else if (s.pendingSettlement !== null) {
      throw Error("非法待提交结算阶段");
    }
  };
  G.validateState = function (s) {
    const obj = (x) => x && typeof x === "object" && !Array.isArray(x),
      int = (x) => Number.isSafeInteger(x),
      finiteInt = (x) => int(x) && Math.abs(x) <= 1e9;
    if (!obj(s) || s.version !== G.VERSION || s.rules !== G.RULES)
      throw Error("存档版本不兼容");
    if (
      !int(s.stage) ||
      s.stage < 0 ||
      s.stage > 9 ||
      !finiteInt(s.cash) ||
      !int(s.nextId) ||
      s.nextId < 1 ||
      !Number.isInteger(s.rngState) ||
      s.rngState <= 0 ||
      !Array.isArray(s.symbols) ||
      s.symbols.length > 200
    )
      throw Error("非法存档数值");
    const seen = new Set();
    for (const x of s.symbols) {
      if (
        !x ||
        typeof x.uid !== "string" ||
        seen.has(x.uid) ||
        !G.symbols[x.type] ||
        !int(x.permanent) ||
        x.permanent < 0 ||
        !obj(x.counters) || Object.keys(x.counters).some(k=>!['age','beat','pressure'].includes(k)||!int(x.counters[k])||x.counters[k]<0||x.counters[k]>1e9) ||
        Object.keys(x).some(k=>!['uid','type','permanent','counters'].includes(k))
      )
        throw Error("非法实例");
      seen.add(x.uid);
    }
    if (
      !Array.isArray(s.choices) ||
      s.choices.length > 3 ||
      s.choices.some(
        (x) =>
          typeof x !== "string" ||
          (s.phase === "ITEM_CHOICE" ? !G.items[x] : !G.symbols[x]),
      )
    )
      throw Error("非法候选");
    if (["READY", "WON", "LOST"].includes(s.phase) && s.choices.length !== 0)
      throw Error("非法候选");
    if (
      !Array.isArray(s.items) ||
      s.items.some((x) => !G.items[x]) ||
      s.items.length > 9
    )
      throw Error("非法道具");
    if (!Array.isArray(s.reservations) || s.reservations.length > 2 || s.reservations.some((r) => !obj(r) || typeof r.uid !== "string" || !seen.has(r.uid) || !int(r.pos) || r.pos < 0 || r.pos >= 20 || typeof r.source !== "string")) throw Error("非法保留记录");
    if (
      !int(s.stats.spins) ||
      !int(s.stats.total) ||
      !int(s.stats.best) ||
      !int(s.stats.removed) ||
      !int(s.stats.stages) ||
      !int(s.stats.skipped) ||
      !int(s.stats.rerolls) ||
      !int(s.stats.events) ||
      !obj(s.stats.chosen)
    )
      throw Error("非法统计");
    if (
      !["READY", "SYMBOL_CHOICE", "ITEM_CHOICE", "WON", "LOST"].includes(
        s.phase,
      )
    )
      throw Error("非法流程阶段");
    G.validatePendingSettlement(s);
    const allowedLog = new Set(G.actions);
    if (
      s.phase === "WON" &&
      (s.stage !== 9 || s.spinsRemaining !== 0 || s.choices.length !== 0)
    )
      throw Error("非法付款状态");
    if (s.last !== null) {
      const snapIds = new Set(
        s.last.board
          .filter(Boolean)
          .map((x) => x.uid)
          .concat(s.last.ledger.map((x) => x.uid)),
      );
      if (
        !obj(s.last) ||
        !Array.isArray(s.last.board) ||
        s.last.board.length !== 20 ||
        !Array.isArray(s.last.ledger) ||
        !int(s.last.total) ||
        !int(s.last.reward) ||
        s.last.board.some(
          (c) =>
            c !== null &&
            (!obj(c) ||
              typeof c.uid !== "string" ||
              !G.symbols[c.type] ||
              !snapIds.has(c.uid) ||
              (!seen.has(c.uid) &&
                !s.last.ledger.some((x) => x.uid === c.uid))),
        ) ||
        s.last.ledger.some(
          (x) =>
            !obj(x) ||
            !snapIds.has(x.uid) ||
            (!seen.has(x.uid) &&
              !s.last.board.some((c) => c && c.uid === x.uid)) ||
            !G.symbols[x.type] ||
            !int(x.amount) ||
            !Array.isArray(x.ratio) ||
            x.ratio.length !== 2 ||
            !x.ratio.every(
              (v) => typeof v === "string" && /^[1-9]\d*$/.test(v),
            ) ||
            typeof x.alive !== "boolean",
        ) ||
        s.last.log.some(
          (x) =>
            !obj(x) ||
            !allowedLog.has(x.type) ||
            !int(x.depth) ||
            x.depth < 0 ||
            (x.parent !== null && !int(x.parent)),
        ) ||
        s.last.ledger.reduce((n, x) => n + x.amount, 0) + s.last.reward !==
          s.last.total
      )
        throw Error("非法结算快照");
      for (const x of s.last.log)
        if (
          x.parent !== null &&
          (x.parent < 0 || x.parent >= s.last.log.length)
        )
          throw Error("非法因果日志");
    }
    if (
      !Array.isArray(s.history) ||
      s.history.some((x) => !obj(x) || !int(x.spin) || !int(x.total))
    )
      throw Error("非法历史");
    return true;
  };
})(window.Game);
