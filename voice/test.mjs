// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2026 Parsa Kamalipour
// Run: node voice/test.mjs — checks the voice helper with a fake Azure, a fake KV and a fake rate limiter.
import assert from "node:assert/strict";

for (const k of ["log", "info", "error", "warn"]) console[k] = () => { throw new Error(`voice helper must not log (console.${k})`); };

const { default: worker } = await import("./worker.js");
const SITE = "https://petitfrench.parsakp.com";
const kv = new Map();
let limited = false, kvBroken = false, azure = () => new Response(new Uint8Array([1, 2, 3]), { status: 200 }), calls = [];
const env = {
  AZURE_REGION: "canadacentral", AZURE_SPEECH_KEY: "k", ALLOWED_ORIGIN: `https://petit-a-petit-francais.github.io, ${SITE}`,
  LIMITER: { limit: async () => ({ success: !limited }) },
  CLIPS: {
    get: async (k) => { if (kvBroken) throw new Error("limit"); return kv.get(k) ?? null; },
    put: async (k, v) => { if (kvBroken) throw new Error("limit"); kv.set(k, v); },
  },
};
globalThis.fetch = async (url, init) => (calls.push({ url, init }), azure());
const pending = [];
const req = (q, { origin = SITE, method = "GET", path = "/tts" } = {}) =>
  worker.fetch(new Request(`https://voice.example${path}?${new URLSearchParams(q)}`, { method, headers: origin ? { Origin: origin, "CF-Connecting-IP": "203.0.113.9" } : {} }), env, { waitUntil: (p) => pending.push(p) });
const settle = () => Promise.all(pending.splice(0));

assert.equal((await req({ a: "fr", t: "Bonjour" }, { origin: "https://evil.example" })).status, 403, "wrong origin");
assert.equal((await req({ a: "fr", t: "Bonjour" }, { origin: null })).status, 403, "no origin");
assert.equal((await req({ a: "fr", t: "Bonjour" }, { path: "/nope" })).status, 404);
assert.equal((await req({ a: "fr", t: "Bonjour" }, { method: "POST" })).status, 405);
assert.equal((await req({ a: "de", t: "Bonjour" })).status, 400, "unknown accent");
assert.equal((await req({ a: "fr", t: "  " })).status, 400, "empty text");
assert.equal((await req({ a: "fr", t: "a".repeat(301) })).status, 400, "too long");
assert.equal(calls.length, 0, "nothing reaches Azure before the checks pass");

// first request goes to Azure with escaped SSML, and the clip is stored
let r = await req({ a: "qc", t: "Tom & <Léa>  vont   bien" });
assert.equal(r.status, 200);
assert.equal(r.headers.get("Content-Type"), "audio/mpeg");
assert.equal(r.headers.get("Access-Control-Allow-Origin"), SITE);
assert.match(r.headers.get("Cache-Control"), /immutable/);
assert.deepEqual([...new Uint8Array(await r.arrayBuffer())], [1, 2, 3]);
assert.equal(calls.length, 1);
assert.equal(calls[0].url, "https://canadacentral.tts.speech.microsoft.com/cognitiveservices/v1");
assert.equal(calls[0].init.headers["Ocp-Apim-Subscription-Key"], "k");
assert.match(calls[0].init.body, /<voice name="fr-CA-SylvieNeural">Tom &amp; &lt;Léa&gt; vont bien<\/voice>/);
await settle();
assert.equal(kv.size, 1);

// same phrase (extra spaces don't matter): served from KV, Azure not called, rate limit not spent
limited = true;
r = await req({ a: "qc", t: "Tom & <Léa> vont bien " });
assert.equal(r.status, 200);
assert.equal(calls.length, 1, "cached clip skips Azure");
// same phrase, other accent: a different clip
assert.equal((await req({ a: "fr", t: "Tom & <Léa> vont bien" })).status, 429, "rate limit applies to new clips");
limited = false;

// Azure out of free quota or throttled → 503 so the app uses the device voice; nothing stored
for (const s of [429, 403]) {
  azure = () => new Response("", { status: s });
  r = await req({ a: "fr", t: "Salut " + s });
  assert.equal(r.status, 503);
  assert.equal(r.headers.get("Cache-Control"), "no-store");
}
azure = () => new Response("", { status: 500 });
assert.equal((await req({ a: "fr", t: "Salut 500" })).status, 502);
azure = () => { throw new Error("down"); };
assert.equal((await req({ a: "fr", t: "Salut down" })).status, 502);
await settle();
assert.equal(kv.size, 1, "failed clips aren't stored");

// KV past its free limits: still plays (straight from Azure), no crash
azure = () => new Response(new Uint8Array([9]), { status: 200 });
kvBroken = true;
r = await req({ a: "fr", t: "Merci" });
assert.equal(r.status, 200);
await settle();

process.stdout.write("voice helper: all checks passed\n");
