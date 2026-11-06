// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2026 Parsa Kamalipour
// Network first so updates show up as soon as you're online; the cache is the offline fallback.
// Bump CACHE when files are removed so old copies are dropped.
const CACHE = "petit-a-petit-v3";
const APP = ["./", "index.html", "style.css", "core.js", "data.js", "grammar_extra.js", "vocab_extra.js", "app.js", "sync.js", "logo.svg", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/maskable-512.png", "icons/apple-touch-icon.png", "fonts/inter-latin.woff2", "fonts/inter-latin-ext.woff2", "privacy.html"];

self.addEventListener("install", (e) => e.waitUntil(
  caches.open(CACHE).then((c) => c.addAll(APP.map((u) => new Request(u, { cache: "reload" })))).then(() => self.skipWaiting())));
self.addEventListener("activate", (e) => e.waitUntil(
  caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener("fetch", (e) => {
  // only the app's own files; fonts and anything cross-origin go straight to the network
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(fetch(e.request, { cache: "no-cache" }).then((res) => {
    if (res.status === 200) { const copy = res.clone(); e.waitUntil(caches.open(CACHE).then((c) => c.put(e.request, copy))); }
    return res;
  }).catch(() => caches.match(e.request, { ignoreSearch: true })
    .then((r) => r || (e.request.mode === "navigate" ? caches.match("index.html") : Response.error()))));
});
