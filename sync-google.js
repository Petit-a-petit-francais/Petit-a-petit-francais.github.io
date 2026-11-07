// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2026 Parsa Kamalipour
// Google Drive provider for sync.js: one progress.json (plus progress.prev.json as a backup) in the app's hidden Drive folder.
// Loaded only when someone signs in with Google, or on start for a device that already did.
(function (root) {
  const KEY = "cahier-fr-google"; // the refresh token; the access token stays in memory only
  const SCOPE = "https://www.googleapis.com/auth/drive.appdata";
  const DRIVE = "https://www.googleapis.com/drive/v3", UPLOAD = "https://www.googleapis.com/upload/drive/v3";
  const conf = () => root.SYNC_CONFIG;
  const fail = (code, message) => Object.assign(new Error(message || code), { code });
  const ls = {
    get: (k) => { try { return root.localStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { root.localStorage.setItem(k, v); } catch (e) { /* blocked: stays signed in for this visit only */ } },
    del: (k) => { try { root.localStorage.removeItem(k); } catch (e) { /* blocked */ } },
  };
  let needConsent = false; // an exchange came back without a refresh token: the next sign-in shows the consent screen

  async function net(url, init) {
    try { return await root.fetch(url, init); } catch (e) { throw fail("offline", "network error"); }
  }
  // token helper: Reconnect only when Google says the grant is gone; anything transient is "offline" and retried
  async function helper(path, body) {
    const r = await net(conf().TOKEN_HELPER_URL + path, { method: "POST", headers: { "Content-Type": "application/json", "X-Requested-With": "XmlHttpRequest" }, body: JSON.stringify(body) });
    let data = {};
    try { data = await r.json(); } catch (e) { /* empty body */ }
    if (r.ok) return data;
    if ((r.status === 400 || r.status === 401) && data.error === "invalid_grant") throw fail("auth", "Google sign-in expired");
    if (r.status === 429 || r.status >= 500) throw fail("offline", `token helper ${r.status}`);
    throw fail("other", `token helper ${r.status}`);
  }
  const q = (names) => `${DRIVE}/files?spaces=appDataFolder&q=${encodeURIComponent(names.map((n) => `name='${n}'`).join(" or "))}&fields=files(id,createdTime)&orderBy=createdTime`;

  function provider(refresh, access = null, expiresIn = 0) {
    let exp = access ? Date.now() + expiresIn * 1000 : 0;
    async function token() {
      if (access && Date.now() < exp - 5 * 60e3) return access;
      const t = await helper("/refresh", { refresh_token: refresh });
      access = t.access_token;
      exp = Date.now() + t.expires_in * 1000;
      return access;
    }
    async function api(url, init = {}, retried = false) {
      const r = await net(url, { ...init, headers: { ...init.headers, Authorization: `Bearer ${await token()}` } });
      if (r.status === 401) {
        if (retried) throw fail("auth", "Google refused the access token");
        access = null;
        return api(url, init, true);
      }
      if (r.ok) return r;
      let reason = "";
      try { reason = JSON.stringify(await r.json()); } catch (e) { /* no body */ }
      if (r.status === 429 || r.status >= 500 || /rateLimitExceeded/.test(reason)) throw fail("offline", `Drive ${r.status}`);
      if (r.status === 403) throw fail("auth", "Drive permission missing");
      throw fail("other", `Drive ${r.status}`);
    }
    const list = async (...names) => ((await (await api(q(names))).json()).files || []).map((f) => f.id);
    const read = async (id) => (await api(`${DRIVE}/files/${encodeURIComponent(id)}?alt=media`)).text();
    const write = (id, text) => api(`${UPLOAD}/files/${encodeURIComponent(id)}?uploadType=media`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: text });
    const remove = (id) => api(`${DRIVE}/files/${encodeURIComponent(id)}`, { method: "DELETE" });
    function create(name, text) {
      const b = "cahier" + Math.random().toString(36).slice(2);
      const body = `--${b}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify({ name, parents: ["appDataFolder"] })}\r\n` +
        `--${b}\r\nContent-Type: application/json\r\n\r\n${text}\r\n--${b}--\r\n`;
      return api(`${UPLOAD}/files?uploadType=multipart`, { method: "POST", headers: { "Content-Type": `multipart/related; boundary=${b}` }, body });
    }

    const p = {
      id: "google",
      label: "Google Drive", // untrusted once loadLabel() runs: escape before display
      async pull() {
        const copies = [];
        for (const id of await list("progress.json")) copies.push({ text: await read(id), ref: id });
        return { copies };
      },
      async push(text, refs) {
        if (!refs.length) { await create("progress.json", text); return; }
        const [main, ...extra] = refs; // refs arrive oldest first
        const prev = await read(main);
        const [backup] = await list("progress.prev.json");
        if (backup) await write(backup, prev);
        else await create("progress.prev.json", prev);
        await write(main, text);
        // Drive has no conditional write: re-read, and let the engine re-merge if another device wrote meanwhile
        if ((await read(main)) !== text) throw fail("conflict", "changed during write");
        for (const id of extra) await remove(id);
      },
      async removeAll() {
        for (const id of await list("progress.json", "progress.prev.json")) await remove(id);
      },
      async signOut() { // this device only: revoking would sign out every device
        access = null;
        ls.del(KEY);
      },
      async loadLabel() {
        try {
          const u = (await (await api(`${DRIVE}/about?fields=user(displayName,emailAddress)`)).json()).user || {};
          const name = [u.displayName, u.emailAddress && `(${u.emailAddress})`].filter(Boolean).join(" ");
          if (name) p.label = name;
        } catch (e) { /* keep "Google Drive" */ }
        return p.label;
      },
    };
    return p;
  }

  let loading = null;
  function load() {
    return (loading ||= new Promise((resolve, reject) => {
      if (root.google?.accounts?.oauth2) return resolve();
      const s = root.document.createElement("script");
      s.src = "https://accounts.google.com/gsi/client";
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => { loading = null; reject(fail("offline", "Couldn't load Google sign-in")); };
      root.document.head.append(s);
    }));
  }
  // Opens Google's window synchronously: call it straight from a tap, or (as app.js does) with a window the tap opened.
  function signIn() {
    return new Promise((resolve, reject) => {
      const ask = (prompt) => root.google.accounts.oauth2.initCodeClient({
        client_id: conf().GOOGLE_CLIENT_ID, scope: SCOPE, ux_mode: "popup", ...(prompt ? { prompt } : {}),
        callback: async (r) => {
          if (!r.code) return reject(fail("cancelled", r.error || "no code"));
          try {
            const t = await helper("/exchange", { code: r.code });
            if (!t.refresh_token) {
              needConsent = true;
              if (prompt) return reject(fail("auth", "Google gave no refresh token"));
              return ask("consent"); // not in a tap any more; if this popup is blocked, the next tap asks with consent directly
            }
            needConsent = false;
            ls.set(KEY, t.refresh_token);
            resolve(provider(t.refresh_token, t.access_token, t.expires_in));
          } catch (e) { reject(e); }
        },
        error_callback: (e) => reject(fail(e && e.type === "popup_failed_to_open" ? "popup" : "cancelled", e && e.type)),
      }).requestCode();
      ask(needConsent ? "consent" : undefined);
    });
  }
  function restore() {
    const t = ls.get(KEY);
    return t ? provider(t) : null;
  }
  // Signs out every device: revokes the grant itself.
  async function disconnectAll() {
    const t = ls.get(KEY);
    if (t) {
      const r = await net("https://oauth2.googleapis.com/revoke", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: `token=${encodeURIComponent(t)}` });
      if (!r.ok && r.status !== 400) throw fail("offline", `revoke ${r.status}`); // 400: already revoked
    }
    ls.del(KEY);
  }

  root.SyncGoogle = { load, signIn, restore, disconnectAll };
})(typeof window !== "undefined" ? window : globalThis);
