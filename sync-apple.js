// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2026 Parsa Kamalipour
// iCloud provider for sync.js: records "progress" and "progress-prev" (type Progress) in the learner's private CloudKit database.
// Loaded only when someone signs in with Apple, or on start for a device that already did.
(function (root) {
  const KEY = "cahier-fr-ck"; // CloudKit's session token, kept on our origin so Chrome remembers the sign-in
  const MAX_STRING = 700000; // CloudKit records cap at 1 MB; larger states go into the asset field
  const conf = () => root.SYNC_CONFIG;
  const fail = (code, message) => Object.assign(new Error(message || code), { code });
  const ls = {
    get: (k) => { try { return root.localStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { root.localStorage.setItem(k, v); } catch (e) { /* blocked */ } },
    del: (k) => { try { root.localStorage.removeItem(k); } catch (e) { /* blocked */ } },
  };
  const TRANSIENT = ["NETWORK_ERROR", "THROTTLED", "TRY_AGAIN_LATER", "SERVICE_UNAVAILABLE", "ZONE_BUSY", "INTERNAL_ERROR"];
  function mapError(e) {
    const c = e && (e.ckErrorCode || e.serverErrorCode);
    if (c === "AUTHENTICATION_REQUIRED" || c === "AUTHENTICATION_FAILED") return fail("auth", c);
    if (c === "CONFLICT") return fail("conflict", c);
    if (!c || TRANSIENT.includes(c)) return fail("offline", c || (e && e.message) || "network error");
    return fail("other", c);
  }
  // CloudKit web tokens are single-use: every reply carries a new one and the old one stops working. Two requests sent
  // with the same token (from two tabs, or two calls at once) leave a dead token stored, and the learner is signed out.
  // So CloudKit calls run one at a time across all tabs (Web Locks), or at least within this tab.
  let chain = Promise.resolve();
  // shortcut: a request that hangs gives up after 45 s (and lets the other tabs go on); if it then lands late, its token
  // may be lost and the learner reconnects once. Upgrade if CloudKit JS ever exposes request cancellation.
  const timed = (fn) => () => {
    let t;
    const late = new Promise((_, no) => { t = setTimeout(() => no(fail("offline", "iCloud didn't answer")), 45000); });
    return Promise.race([Promise.resolve().then(fn), late]).finally(() => clearTimeout(t));
  };
  const serial = (f) => {
    const fn = timed(f);
    const locks = root.navigator && root.navigator.locks;
    if (locks) return locks.request("petitfrench-cloudkit", fn);
    const r = chain.then(fn, fn);
    chain = r.catch(() => {});
    return r;
  };
  // run a CloudKit call; returns the records, treating NOT_FOUND as "not there"
  async function ck(fn) {
    let res;
    try { res = await serial(fn); } catch (e) {
      if (e && e.ckErrorCode === "NOT_FOUND") return [];
      throw mapError(e);
    }
    const bad = ((res && res.hasErrors && res.errors) || []).find((e) => e.ckErrorCode !== "NOT_FOUND");
    if (bad) throw mapError(bad);
    return (res && res.records) || [];
  }

  // A CloudKit web session ends 30 minutes after its last token was issued (2 weeks with "Keep me signed in"), and every
  // request issues a new token, so a lookup of a record that doesn't exist (always a real request, nothing downloaded)
  // every 20 minutes keeps the session going while the app is open. Tab-visible and back-online syncs refresh it too.
  // shortcut: only while a tab is open; a browser closed for 30+ minutes still needs one Reconnect (Apple's limit).
  let alive = null;
  const keepAlive = (c) => {
    root.clearInterval(alive);
    alive = root.setInterval(() => { if (ls.get(KEY)) ck(() => c.privateCloudDatabase.fetchRecords(["keep-alive"])).catch(() => {}); }, 20 * 60 * 1000);
  };

  function provider(container) {
    const db = container.privateCloudDatabase;
    keepAlive(container);
    const fetchAll = async () => {
      const recs = await ck(() => db.fetchRecords(["progress", "progress-prev"]));
      return { main: recs.find((r) => r.recordName === "progress"), prev: recs.find((r) => r.recordName === "progress-prev") };
    };
    async function textOf(rec) {
      const f = rec.fields || {};
      if (f.data && f.data.value) return f.data.value; // a later small save leaves an old asset behind: data wins
      const url = f.blob && f.blob.value && f.blob.value.downloadURL;
      if (!url) return "";
      let r;
      try { r = await root.fetch(url); } catch (e) { throw fail("offline", "network error"); }
      if (!r.ok) throw fail("offline", `asset ${r.status}`);
      return r.text();
    }
    const fieldsFor = (text) => (new TextEncoder().encode(text).length > MAX_STRING
      ? { data: { value: "" }, blob: { value: new Blob([text], { type: "application/json" }) } }
      : { data: { value: text } });
    const save = (recordName, text, recordChangeTag) =>
      ck(() => db.saveRecords([{ recordType: "Progress", recordName, ...(recordChangeTag ? { recordChangeTag } : {}), fields: fieldsFor(text) }]));

    return {
      id: "apple",
      label: "iCloud",
      async pull() {
        const recs = await ck(() => db.fetchRecords(["progress"]));
        const main = recs.find((r) => r.recordName === "progress");
        return { copies: main ? [{ text: await textOf(main), ref: main.recordChangeTag }] : [] };
      },
      async push(text, refs) {
        const { main, prev } = await fetchAll();
        // someone wrote since our pull: let the engine re-pull and re-merge
        if ((main ? main.recordChangeTag : undefined) !== refs[0]) throw fail("conflict", "changed since pull");
        if (main) await save("progress-prev", await textOf(main), prev && prev.recordChangeTag);
        await save("progress", text, main && main.recordChangeTag); // CloudKit refuses this if the tag moved meanwhile
      },
      async removeAll() {
        await ck(() => db.deleteRecords(["progress", "progress-prev"]));
      },
      async signOut() {
        root.clearInterval(alive);
        ls.del(KEY);
        try { container.signOut(); } catch (e) { /* already signed out */ }
      },
    };
  }

  let loading = null;
  function load() {
    return (loading ||= new Promise((resolve, reject) => {
      const configure = () => {
        root.CloudKit.configure({
          services: { authTokenStore: { getToken: () => ls.get(KEY), putToken: (c, t) => (t ? ls.set(KEY, t) : ls.del(KEY)) } },
          containers: [{
            containerIdentifier: conf().CK_CONTAINER, environment: conf().CK_ENV,
            apiTokenAuth: { apiToken: conf().CK_API_TOKEN, persist: true, signInButton: { id: "apple-sign-in-button", theme: "black" }, signOutButton: { id: "apple-sign-out-button" } },
          }],
        });
        resolve();
      };
      if (root.CloudKit) return configure();
      root.addEventListener("cloudkitloaded", configure, { once: true });
      const s = root.document.createElement("script");
      s.src = "https://cdn.apple-cloudkit.com/ck/2/cloudkit.js";
      s.async = true;
      s.onerror = () => { loading = null; reject(fail("offline", "Couldn't load iCloud sign-in")); };
      root.document.head.append(s);
    }));
  }
  // CloudKit checks who's signed in on its own too (inside setUpAuth, after Apple's window, and 14 minutes after showing
  // its button), spending the token outside our calls: route that check through serial() as well
  const container = () => {
    const c = root.CloudKit.getDefaultContainer();
    if (!c.petitfrenchSerial) {
      const who = c.fetchCurrentUserIdentity.bind(c);
      Object.assign(c, { fetchCurrentUserIdentity: () => serial(who), petitfrenchSerial: true });
    }
    return c;
  };
  // Apple's own button (rendered into #apple-sign-in-button) opens the sign-in window; this resolves once it's done.
  async function signIn() {
    await load();
    // signing in (or reconnecting) starts a new session: a stored token that expired or was used twice would only make
    // setUpAuth fail instead of showing Apple's sign-in button
    const c = container();
    let user;
    try { await serial(() => ls.del(KEY)); user = await c.setUpAuth(); } catch (e) { throw mapError(e); }
    if (!user) user = await c.whenUserSignsIn();
    return provider(c);
  }
  async function restore() {
    if (!ls.get(KEY)) return null; // never signed in here: don't load anything
    await load();
    const c = container();
    let user = null;
    try { user = await c.setUpAuth(); } catch (e) { throw mapError(e); }
    return user ? provider(c) : null;
  }

  root.SyncApple = { load, signIn, restore };
})(typeof window !== "undefined" ? window : globalThis);
