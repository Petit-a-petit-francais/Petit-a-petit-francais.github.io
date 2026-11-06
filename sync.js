// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2026 Parsa Kamalipour
// Sync engine: pull every linked cloud, merge with this device, save, push where a cloud differs. No DOM, no network:
// providers (sync-google.js, sync-apple.js) do the talking. Tested in node with fake providers by test.mjs.
(function (root) {
  // key-sorted JSON, so equal states compare equal whatever order their keys arrived in
  const canon = (x) => JSON.stringify(x, (k, v) => (v && typeof v === "object" && !Array.isArray(v) ? Object.fromEntries(Object.keys(v).sort().map((key) => [key, v[key]])) : v));
  const newId = () => Array.from({ length: 16 }, () => "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 36)]).join("");
  const epochCmp = (a, b) => a.t - b.t || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  const STATUS = { auth: "reconnect", offline: "offline" }; // anything else is retried later too
  const localStore = () => ({
    get: () => { try { return JSON.parse(localStorage.getItem("cahier-fr-sync")); } catch (e) { return null; } },
    set: (v) => { try { localStorage.setItem("cahier-fr-sync", JSON.stringify(v)); } catch (e) { /* blocked */ } },
  });

  function create({ app, core, ask, onStatus = () => {}, now = Date.now, store = localStore() }) {
    const providers = new Map(), held = new Set(); // held: remembered, but couldn't be loaded yet
    let busy = null, again = false, timer = null, selfSave = false;
    const remember = () => store.set({ ...(store.get() || {}), linked: [...new Set([...providers.keys(), ...held])] });
    const each = (status) => { for (const id of providers.keys()) onStatus(id, status); };
    const fail = (id, e) => onStatus(id, STATUS[e && e.code] || "offline", e && e.message);
    const replace = (next, why) => { selfSave = true; try { return app.replaceState(next, why); } finally { selfSave = false; } };

    // one provider's copies, parsed and cleaned; null (after reporting why) if this cloud must be left alone
    async function pull(p) {
      let copies;
      try { ({ copies } = await p.pull()); } catch (e) { fail(p.id, e); return null; }
      const states = [];
      for (const c of copies) {
        let raw = null;
        try { raw = JSON.parse(c.text); } catch (e) { /* unreadable */ }
        if (!raw || typeof raw !== "object") { onStatus(p.id, "unreadable"); return null; }
        if (core.tooNew(raw)) { onStatus(p.id, "reload"); return null; }
        states.push(app.clean(raw));
      }
      return { p, copies, states };
    }

    // one pass; false means a cloud changed under us and the pass should be repeated
    async function once() {
      const pulled = (await Promise.all([...providers.values()].map(pull))).filter(Boolean);
      const remote = pulled.flatMap((x) => x.states);
      const top = remote.reduce((e, s) => (epochCmp(s.epoch, e) > 0 ? s.epoch : e), app.getState().epoch);
      let answer = null;
      // erased elsewhere: check before merging, because merge would silently drop this device's progress
      if (epochCmp(top, app.getState().epoch) > 0 && !core.isEmpty(app.getState())) {
        const owner = pulled.find((x) => x.states.some((s) => !epochCmp(s.epoch, top))).p;
        answer = await ask("epoch", owner);
        if (answer !== "erase" && answer !== "upload") { each("attention"); return true; }
      }
      // no await from here to replace(): edits made meanwhile are in cur, so none is lost
      const cur = app.getState();
      const base = answer === "upload" ? core.restamp(cur, top, now()) : cur;
      const merged = remote.reduce((m, s) => core.merge(m, s), base);
      const view = core.syncView(merged);
      if (base !== cur || canon(view) !== canon(core.syncView(cur))) {
        if (!replace(merged, "sync")) { each("localfail"); return true; }
      }
      const text = JSON.stringify(view);
      let done = true;
      for (const x of pulled) {
        if (x.copies.length !== 1 || canon(core.syncView(x.states[0])) !== canon(view)) {
          try { await x.p.push(text, x.copies.map((c) => c.ref)); } catch (e) {
            if (e && e.code === "conflict") done = false;
            else fail(x.p.id, e);
            continue;
          }
        }
        onStatus(x.p.id, "synced");
      }
      return done;
    }

    function run() {
      if (busy) { again = true; return busy; }
      if (!providers.size) return Promise.resolve();
      busy = (async () => {
        try {
          for (let i = 0; i < 3; i++) { each("syncing"); if (await once()) break; }
        } finally { busy = null; }
        if (again) { again = false; return run(); }
      })();
      return busy;
    }
    function schedule() {
      if (selfSave) return; // our own save after a merge isn't a new edit
      clearTimeout(timer);
      timer = setTimeout(() => run().catch(() => {}), 3000);
    }

    async function link(p, { fresh = false } = {}) {
      // first account on this device, and both sides have progress: ask whether to keep this device's
      if (fresh && ![...providers.keys()].some((id) => id !== p.id)) {
        const x = await pull(p);
        if (!x) return false;
        const remote = x.states.length ? x.states.slice(1).reduce((m, s) => core.merge(m, s), x.states[0]) : null;
        if (remote && !core.isEmpty(app.getState()) && !core.isEmpty(remote)) {
          const answer = await ask("account", p);
          if (answer === "cloud") {
            const keep = {};
            for (const k of core.DEVICE_ONLY) keep[k] = app.getState().settings[k];
            if (!replace({ ...remote, settings: { ...remote.settings, ...keep } }, "cloud only")) { onStatus(p.id, "localfail"); return false; }
          } else if (answer !== "add") { onStatus(p.id, "attention"); return false; }
        }
      }
      held.delete(p.id);
      providers.set(p.id, p);
      remember();
      await run();
      return true;
    }
    async function unlink(id) {
      const p = providers.get(id);
      providers.delete(id);
      held.delete(id);
      remember();
      if (p) await p.signOut();
    }
    async function deleteCloud(id) {
      const p = providers.get(id);
      if (!p) return;
      await p.removeAll(); // throws (and stays linked) if the cloud couldn't be cleared
      await unlink(id);
    }
    async function eraseEverywhere() {
      const epoch = { id: newId(), t: core.stamp(app.getState(), now()) };
      if (!replace(app.empty(epoch), "erase everywhere")) { each("localfail"); return false; }
      await run();
      return true;
    }
    function start() {
      app.onSaved = schedule;
      if (typeof document !== "undefined") document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") run().catch(() => {}); });
      if (typeof addEventListener === "function") addEventListener("online", () => run().catch(() => {}));
      return run();
    }
    const hold = (id) => { held.add(id); remember(); };
    return { link, unlink, hold, run, schedule, eraseEverywhere, deleteCloud, start, linked: () => providers.keys() };
  }

  root.Sync = { create, remembered: () => (localStore().get() || {}).linked || [] };
})(typeof window !== "undefined" ? window : globalThis);
