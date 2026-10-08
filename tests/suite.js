(function (G) {
  "use strict";
  G.runTests = function () {
    const results = [];
    const exec = (s, c) =>
      G.command(s, Object.assign({ revision: s.revision }, c));
    const assert = (v, m = "断言失败") => {
      if (!v) throw Error(m);
    };
    const eq = (a, b) =>
      assert(
        JSON.stringify(a) === JSON.stringify(b),
        JSON.stringify(a) + " != " + JSON.stringify(b),
      );
    function test(name, fn) {
      try {
        fn();
        results.push({ name, ok: true });
      } catch (e) {
        results.push({ name, ok: false, error: e.message });
      }
    }
    function spin(s, board) {
      const r = exec(s, { type: "spin", board });
      assert(r.ok, r.error);
      return r.state;
    }
    function cmd(s, c) {
      const r = exec(s, c);
      assert(r.ok, r.error);
      return r.state;
    }
    test("schema 20 legacy+正式定义", () => {
      assert(G.validateContent());
      eq(G.prototypeSymbolIds.length, 20);
      assert(G.formalSymbolIds.length >= 60);
      eq(
        Object.keys(G.symbols).length,
        G.prototypeSymbolIds.length + G.formalSymbolIds.length,
      );
    });
    test("RNG固定向量", () => {
      const s = { rngState: 1 };
      const values = [];
      for (let i = 0; i < 5; i++) {
        G.random(s);
        values.push(s.rngState);
      }
      eq(values, [270369, 67634689, 2647435461, 307599695, 2398689233]);
    });
    test("八邻接无跨行", () => {
      assert(!G.adjacent(4, 5));
      assert(G.adjacent(0, 6));
      assert(!G.adjacent(0, 7));
    });
    for (const n of [0, 1, 19, 20, 21, 200])
      test("抽样 " + n, () => {
        let s = G.newRun("POOL");
        s.symbols = [];
        for (let i = 0; i < n; i++) s.symbols.push(G.instance(s, "slag"));
        s = spin(s);
        const ids = s.last.board.filter(Boolean).map((x) => x.uid);
        eq(ids.length, Math.min(n, 20));
        eq(new Set(ids).size, ids.length);
      });
    for (const f of G.fixtures)
      test("复杂fixture " + f.name, () => {
        const { s, board } = G.fixtureState(f);
        const out = spin(s, board);
        eq(out.last.total, f.expected);
        assert(new Set(s.symbols.map((x) => x.type)).size >= 4);
        const deep = out.last.log.find(
          (x) => x.type === "multiply" && x.depth === 3,
        );
        assert(deep, "缺少第三层");
        let node = deep;
        for (let d = 3; d > 0; d--) {
          assert(node.parent !== null);
          node = out.last.log[node.parent];
          eq(node.depth, d - 1);
        }
        assert(
          ["consume", "transform", "destroy"].includes(node.type),
          "根事件无效",
        );
      });
    test("竞争消耗仅一次", () => {
      const f = G.fixtureState(G.fixtures[0]);
      const x = G.instance(f.s, "hook");
      f.s.symbols.push(x);
      f.board[5] = x.uid;
      const s = spin(f.s, f.board);
      eq(s.last.reward, 5);
      eq(s.last.log.filter((x) => x.type === "consume").length, 1);
      eq(s.last.total, 14);
    });
    test("转换ID 永久继承 专属清零 不重现", () => {
      const s = G.newRun("TRANS");
      s.symbols = [];
      const a = G.instance(s, "bud");
      a.counters.age = 1;
      a.permanent = 2;
      s.symbols.push(a);
      const out = spin(s, [a.uid]);
      eq(out.symbols[0], {
        uid: a.uid,
        type: "bloom",
        permanent: 2,
        counters: {},
      });
      eq(out.last.total, 5);
    });
    test("转换链新定义监听", () => {
      const s = G.newRun("TRANS2");
      s.symbols = [];
      ["still", "bloom", "meter", "lens"].forEach((t) =>
        s.symbols.push(G.instance(s, t)),
      );
      const out = spin(
        s,
        s.symbols.map((x) => x.uid),
      );
      eq(out.last.total, 11);
      assert(out.last.log.some((x) => x.event === "ON_TRANSFORM"));
    });
    test("多个倍率与负数取整", () => {
      const s = G.newRun("MULT");
      s.symbols = [];
      ["battery", "press", "press"].forEach((t) =>
        s.symbols.push(G.instance(s, t)),
      );
      const board = Array(20).fill(null);
      [0, 1, 5].forEach((pos, i) => (board[pos] = s.symbols[i].uid));
      const out = spin(s, board);
      eq(out.last.total, 11);
    });
    test("复制仅add模板", () => {
      const s = G.newRun("COPY");
      s.symbols = [];
      ["mirror", "battery"].forEach((t) => s.symbols.push(G.instance(s, t)));
      eq(
        spin(
          s,
          s.symbols.map((x) => x.uid),
        ).last.total,
        7,
      );
    });
    test("临时tag不持久", () => {
      const s = G.newRun("TAG");
      s.symbols = [];
      ["wild", "tuner"].forEach((t) => s.symbols.push(G.instance(s, t)));
      const out = spin(
        s,
        s.symbols.map((x) => x.uid),
      );
      eq(out.last.total, 4);
      assert(!("tags" in out.symbols[0]));
    });
    test("risk确定性和余额下限", () => {
      let s = G.newRun("RISK");
      s.symbols = [];
      s.symbols.push(G.instance(s, "gambit"));
      eq(spin(s), spin(s));
      s.symbols[0].type = "rust";
      eq(spin(s).cash, 0);
    });
    test("自毁无普通收益，监听链", () => {
      const s = G.newRun("DEST");
      s.symbols = [];
      ["spark", "warden", "meter", "lens"].forEach((t) =>
        s.symbols.push(G.instance(s, t)),
      );
      const out = spin(
        s,
        s.symbols.map((x) => x.uid),
      );
      eq(out.last.total, 11);
      assert(!out.symbols.some((x) => x.type === "spark"));
    });
    test("END_SPIN修改在最终结算前且ON_GAIN不支付现金", () => {
      const d = G.symbols.battery;
      const old = d.effects;
      try {
        d.effects = [
          {
            trigger: "ON_END_SPIN",
            action: "add",
            scope: "self",
            target: "self",
            priority: 0,
            amount: 3,
            emit: "ON_GAIN",
          },
        ];
        const s = G.newRun("END");
        s.symbols = [];
        ["battery", "meter"].forEach((t) => s.symbols.push(G.instance(s, t)));
        const out = spin(
          s,
          s.symbols.map((x) => x.uid),
        );
        eq(out.last.total, 7);
        eq(out.last.reward, 0);
      } finally {
        d.effects = old;
      }
    });
    test("故意循环：全状态/RNG/ID/成长原子回滚", () => {
      const d = G.symbols.meter,
        old = d.effects;
      try {
        d.effects = [
          ...old,
          {
            trigger: "ON_GROW",
            scope: "self",
            target: "self",
            priority: 0,
            action: "grow",
            amount: 1,
            emit: "ON_GAIN",
          },
        ];
        const f = G.fixtureState(G.fixtures[9]);
        f.s.symbols.push(G.instance(f.s, "gambit"));
        f.board[3] = f.s.symbols.at(-1).uid;
        const snapshot = G.encode(f.s);
        const r = exec(f.s, { type: "spin", board: f.board });
        assert(!r.ok);
        eq(G.encode(f.s), snapshot);
        assert(r.state === f.s);
      } finally {
        d.effects = old;
      }
    });
    test("最后spin先选，恰好/差1付款", () => {
      for (const delta of [0, -1]) {
        let s = G.newRun("PAY");
        s.symbols = [];
        s.spinsRemaining = 1;
        s.cash = s.payment + delta;
        s = spin(s);
        eq(s.phase, "SYMBOL_CHOICE");
        s = cmd(s, { type: "choose", index: null });
        eq(s.phase, delta === 0 ? "ITEM_CHOICE" : "LOST");
        if (delta === 0) eq(s.cash, 0);
      }
    });
    test("最终阶段胜利", () => {
      let s = G.newRun("WIN");
      s = cmd(s, { type: "debug", stage: 9, cash: 10000 });
      s.spinsRemaining = 1;
      s = spin(s);
      s = cmd(s, { type: "choose", index: null });
      eq(s.phase, "WON");
    });
    test("连续快速spin/过期选择拒绝", () => {
      const s = spin(G.newRun("DOUBLE"));
      assert(!exec(s, { type: "spin" }).ok);
      const next = cmd(s, {
        type: "choose",
        index: null,
        revision: s.revision,
      });
      assert(
        !exec(next, { type: "choose", index: null, revision: s.revision }).ok,
      );
    });
    test("每稳定节点存读档 与连续完整run完全一致", () => {
      let a = G.newRun("REPLAY"),
        b = G.decode(G.encode(a));
      for (let i = 0; i < 1000 && !["WON", "LOST"].includes(a.phase); i++) {
        const c =
          a.phase === "READY"
            ? { type: "spin" }
            : a.phase === "ITEM_CHOICE"
              ? { type: "reward", index: 2 }
              : { type: "choose", index: 0 };
        a = cmd(a, c);
        b = G.decode(G.encode(cmd(b, c)));
        eq(a, b);
      }
      assert(["WON", "LOST"].includes(a.phase));
    });
    test("刷新/删除保存不刷候选", () => {
      let s = spin(G.newRun("SAVE"));
      s = cmd(s, { type: "reroll" });
      eq(G.decode(G.encode(s)), s);
      s = cmd(s, { type: "remove", uid: s.symbols[0].uid });
      eq(G.decode(G.encode(s)), s);
    });
    test("损坏/未来/重复/未知/phase/RNG/金额/候选拒绝", () => {
      for (const mutate of [
        (s) => s.version++,
        (s) => s.symbols.push(s.symbols[0]),
        (s) => (s.symbols[0].type = "missing"),
        (s) => (s.phase = "RESOLVING"),
        (s) => (s.rngState = 0),
        (s) => (s.cash = Infinity),
        (s) => (s.choices = ["slag"]),
      ]) {
        const s = G.newRun("BAD");
        mutate(s);
        let failed = false;
        try {
          G.decode(JSON.stringify(s));
        } catch (e) {
          failed = true;
        }
        assert(failed);
      }
      let bad = false;
      try {
        G.decode("{");
      } catch (e) {
        bad = true;
      }
      assert(bad);
    });
    test("存储禁用和备份恢复", () => {
      const data = {};
      const storage = {
        getItem: (k) => data[k] || null,
        setItem: (k, v) => (data[k] = v),
      };
      const a = G.newRun("A"),
        b = G.newRun("B");
      assert(G.store(storage, a).ok);
      assert(G.store(storage, b).ok);
      data["fog-port.save.v1"] = "broken";
      eq(G.load(storage).state, a);
      assert(
        !G.store(
          {
            getItem() {
              throw Error("blocked");
            },
          },
          a,
        ).ok,
      );
    });
    test("负数倍率向下取整与账本守恒", () => {
      const d = G.symbols.press,
        old = d.effects;
      try {
        d.effects = [
          {
            trigger: "ON_ADJACENT",
            scope: "self",
            target: "adj:scrap",
            priority: 20,
            action: "multiply",
            ratio: [3, 2],
          },
        ];
        const s = G.newRun("NEG");
        s.symbols = [];
        ["rust", "press"].forEach((t) => s.symbols.push(G.instance(s, t)));
        const out = spin(
          s,
          s.symbols.map((x) => x.uid),
        );
        eq(out.last.ledger[0].amount, -2);
        eq(out.last.total, -1);
        eq(out.cash, 0);
        eq(
          out.last.total,
          out.last.ledger.reduce((n, x) => n + x.amount, 0) + out.last.reward,
        );
      } finally {
        d.effects = old;
      }
    });
    test("转换取消旧类型已排队效果，不双发基础", () => {
      const d = G.symbols.bloom,
        old = d.effects;
      try {
        d.effects = [
          {
            trigger: "ON_ADJACENT",
            scope: "self",
            target: "self",
            priority: 20,
            action: "add",
            amount: 100,
          },
        ];
        const s = G.newRun("OLDQUEUE");
        s.symbols = [];
        ["still", "bloom"].forEach((t) => s.symbols.push(G.instance(s, t)));
        eq(
          spin(
            s,
            s.symbols.map((x) => x.uid),
          ).last.total,
          7,
        );
      } finally {
        d.effects = old;
      }
    });
    test("销毁self快照监听仍可emit，不复活普通产出", () => {
      const d = G.symbols.spark,
        old = d.effects;
      try {
        d.effects = [
          ...old,
          {
            trigger: "ON_DESTROY",
            scope: "self",
            target: "self",
            priority: 0,
            action: "add",
            amount: 10,
            emit: "ON_GAIN",
          },
        ];
        const s = G.newRun("SNAP");
        s.symbols = [];
        ["spark", "meter"].forEach((t) => s.symbols.push(G.instance(s, t)));
        const out = spin(
          s,
          s.symbols.map((x) => x.uid),
        );
        eq(out.last.total, 3);
        assert(
          out.last.log.some(
            (x) => x.event === "ON_DESTROY" && x.source === s.symbols[0].uid,
          ),
        );
      } finally {
        d.effects = old;
      }
    });
    test("END_SPIN销毁取消普通收益", () => {
      const d = G.symbols.battery,
        old = d.effects;
      try {
        d.effects = [
          {
            trigger: "ON_END_SPIN",
            scope: "self",
            target: "self",
            priority: 0,
            action: "destroy",
          },
        ];
        const s = G.newRun("ENDDEST");
        s.symbols = [];
        s.symbols.push(G.instance(s, "battery"));
        eq(spin(s).last.total, 0);
      } finally {
        d.effects = old;
      }
    });
    test("生成预算超限原子回滚", () => {
      const d = G.symbols.seedbox,
        old = d.effects;
      try {
        d.effects = [...old, ...old, ...old];
        const s = G.newRun("SPAWNLIMIT");
        s.symbols = [];
        for (let i = 0; i < 20; i++) s.symbols.push(G.instance(s, "seedbox"));
        const snapshot = G.encode(s),
          r = exec(s, { type: "spin" });
        assert(!r.ok);
        eq(G.encode(r.state), snapshot);
      } finally {
        d.effects = old;
      }
    });
    test("备份写入失败不提交新档", () => {
      let current = G.encode(G.newRun("OLD"));
      const store = {
        getItem: () => current,
        setItem: (key, value) => {
          if (key.endsWith(".backup")) throw Error("quota");
          current = value;
        },
      };
      const r = G.store(store, G.newRun("NEW"));
      assert(!r.ok);
      eq(G.decode(current).seed, "OLD");
    });
    test("精确有理数29/100及多倍率正负边界", () => {
      const d = G.symbols.slag,
        base = d.baseValue,
        old = d.effects;
      try {
        for (const value of [100, -100, 101, -101]) {
          d.baseValue = value;
          d.effects = [
            {
              trigger: "ON_APPEAR",
              action: "multiply",
              scope: "self",
              target: "self",
              priority: 20,
              ratio: [29, 100],
            },
            {
              trigger: "ON_APPEAR",
              action: "multiply",
              scope: "self",
              target: "self",
              priority: 20,
              ratio: [2, 1],
            },
          ];
          const s = G.newRun("RATIONAL");
          s.symbols = [];
          s.symbols.push(G.instance(s, "slag"));
          eq(
            spin(s).last.total,
            value === 100
              ? 58
              : value === -100
                ? -58
                : value === 101
                  ? 58
                  : -59,
          );
        }
        d.baseValue = 100;
        d.effects = d.effects.slice(0, 1);
        const s = G.newRun("29");
        s.symbols = [];
        s.symbols.push(G.instance(s, "slag"));
        eq(spin(s).last.total, 29);
      } finally {
        d.baseValue = base;
        d.effects = old;
      }
    });
    test("全局有理倍率不乘独立奖励", () => {
      const d = G.symbols.lens,
        old = d.effects;
      try {
        d.effects = [
          {
            trigger: "ON_GROW",
            scope: "event",
            target: "self",
            priority: 20,
            action: "globalMultiply",
            ratio: [3, 2],
          },
        ];
        const f = G.fixtureState(G.fixtures[0]);
        const out = spin(f.s, f.board);
        eq(out.last.total, 14);
        eq(out.last.reward, 5);
      } finally {
        d.effects = old;
      }
    });
    test("同排/同列/全盘目标范围", () => {
      const d = G.symbols.tuner,
        old = d.effects;
      try {
        for (const [target, expected] of [
          ["row:*", 8],
          ["column:*", 8],
          ["board:*", 12],
        ]) {
          d.effects = [
            {
              trigger: "ON_ADJACENT",
              scope: "self",
              target,
              priority: 0,
              action: "add",
              amount: 2,
            },
          ];
          const s = G.newRun("SCOPE");
          s.symbols = [];
          ["tuner", "slag", "slag", "slag"].forEach((t) =>
            s.symbols.push(G.instance(s, t)),
          );
          const b = Array(20).fill(null);
          [0, 4, 15, 19].forEach((p, i) => (b[p] = s.symbols[i].uid));
          eq(spin(s, b).last.total, expected);
        }
      } finally {
        d.effects = old;
      }
    });
    test("schema逐项拒绝零分母/未知target/emit/缺必需值", () => {
      const d = G.symbols.press,
        old = d.effects;
      try {
        for (const change of [
          { ratio: [1, 0] },
          { target: "adj:missing" },
          { emit: "UNKNOWN" },
          { priority: "bad" },
          { scope: "bad" },
          { ratio: undefined },
        ]) {
          d.effects = [Object.assign({}, old[0], change)];
          let failed = false;
          try {
            G.validateContent();
          } catch (e) {
            failed = true;
          }
          assert(failed, JSON.stringify(change));
        }
      } finally {
        d.effects = old;
      }
    });
    test("缺stats/假终局/last嵌套损坏全部在decode拒绝", () => {
      const valid = spin(G.newRun("VALID"));
      for (const mutate of [
        (s) => (s.stats = {}),
        (s) => {
          s.phase = "WON";
          s.choices = [];
        },
        (s) => (s.last.board[0].type = "missing"),
        (s) => (s.last.ledger[0].ratio = ["1", "0"]),
        (s) => (s.last.log[0].parent = 999),
        (s) => (s.last.log[0].type = "missing"),
        (s) => (s.history = [{ spin: 1, total: null }]),
        (s) => (s.symbols[0].locked = 999),
        (s) => (s.last.board[0].uid = "u999999999"),
        (s) => s.last.ledger[0].amount++,
      ]) {
        const s = G.clone(valid);
        mutate(s);
        let failed = false;
        try {
          G.decode(JSON.stringify(s));
        } catch (e) {
          failed = true;
        }
        assert(failed);
      }
      const s = G.newRun("FALSEWON");
      s.phase = "WON";
      let failed = false;
      try {
        G.decode(JSON.stringify(s));
      } catch (e) {
        failed = true;
      }
      assert(failed);
    });
    test("仅备份存在时恢复", () => {
      const expected = G.newRun("BACKONLY");
      const r = G.load({
        getItem: (k) => (k.endsWith(".backup") ? G.encode(expected) : null),
      });
      assert(r.ok);
      eq(r.state, expected);
    });
    test("revision缺失与过期均拒绝", () => {
      const s = G.newRun("REV");
      assert(!G.command(s, { type: "spin" }).ok);
      assert(!G.command(s, { type: "spin", revision: 999 }).ok);
      assert(G.command(s, { type: "spin", revision: s.revision }).ok);
    });
    test("ON_SPIN/ON_END_SPIN广播各一次，不随格数重复", () => {
      const d = G.symbols.battery,
        old = d.effects;
      try {
        d.effects = [
          {
            trigger: "ON_SPIN",
            scope: "event",
            target: "self",
            priority: 0,
            action: "add",
            amount: 2,
          },
          {
            trigger: "ON_END_SPIN",
            scope: "event",
            target: "self",
            priority: 0,
            action: "add",
            amount: 3,
          },
        ];
        const s = G.newRun("BROADCAST");
        s.symbols = [];
        ["battery", "slag", "slag"].forEach((t) =>
          s.symbols.push(G.instance(s, t)),
        );
        const out = spin(s);
        eq(out.last.total, 9);
        eq(out.last.log.length, 2);
      } finally {
        d.effects = old;
      }
    });
    return results;
  };
})(window.Game);
