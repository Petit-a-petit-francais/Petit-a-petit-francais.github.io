// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2026 Parsa Kamalipour
// Run: node token-helper/test.mjs — checks the token helper with a fake Google and a fake rate limiter.
import assert from "node:assert/strict";

for (const k of ["log", "info", "error", "warn"]) console[k] = () => { throw new Error(`token helper must not log (console.${k})`); };
const say = (t) => process.stdout.write(t + "\n");

const { default: worker } = await import("./worker.js");
const SITE = "https://petit-a-petit-francais.github.io";
let limited = false, calls = [], google = () => ({ status: 200, body: { access_token: "at", expires_in: 3599, refresh_token: "rt", id_token: "secret-extra", scope: "x" } });
const env = {
  GOOGLE_CLIENT_ID: "cid", GOOGLE_CLIENT_SECRET: "csecret", ALLOWED_ORIGIN: `${SITE}, https://petitfrench.parsakp.com`,
  LIMITER: { limit: async ({ key }) => (calls.push({ limitKey: key }), { success: !limited }) },
};
globalThis.fetch = async (url, init) => {
  calls.push({ url, form: Object.fromEntries(new URLSearchParams(init.body.toString())) });
  const r = google();
  return new Response(JSON.stringify(r.body), { status: r.status, headers: { "Content-Type": "application/json" } });
};
const req = (path, { method = "POST", origin = SITE, xrw = true, body } = {}) => worker.fetch(new Request("https://helper.example" + path, {
  method,
  headers: { ...(origin ? { Origin: origin } : {}), ...(xrw ? { "X-Requested-With": "XmlHttpRequest" } : {}), "Content-Type": "application/json", "CF-Connecting-IP": "203.0.113.9" },
  ...(method === "POST" ? { body: JSON.stringify(body ?? { code: "c1" }) } : {}),
}), env);
const json = async (r) => r.json();

assert.equal((await req("/exchange", { origin: "https://evil.example" })).status, 403, "wrong origin");
assert.equal((await req("/exchange", { origin: null })).status, 403, "no origin");
assert.equal((await req("/exchange", { xrw: false })).status, 403, "missing X-Requested-With");
assert.equal((await req("/exchange", { method: "GET" })).status, 405);
assert.equal((await req("/nope")).status, 404);
const pre = await req("/exchange", { method: "OPTIONS" });
assert.equal(pre.status, 204);
assert.equal(pre.headers.get("Access-Control-Allow-Origin"), SITE);
assert.match(pre.headers.get("Access-Control-Allow-Headers"), /Content-Type/);
assert.match(pre.headers.get("Access-Control-Allow-Headers"), /X-Requested-With/);
assert.equal((await req("/exchange", { method: "OPTIONS", origin: "https://petitfrench.parsakp.com" })).headers.get("Access-Control-Allow-Origin"), "https://petitfrench.parsakp.com");
assert.equal(calls.length, 0, "nothing reaches Google before the checks pass");

// exchange
let r = await req("/exchange");
assert.equal(r.status, 200);
assert.equal(r.headers.get("Access-Control-Allow-Origin"), SITE);
assert.deepEqual(await json(r), { access_token: "at", expires_in: 3599, refresh_token: "rt" });
const g = calls.find((c) => c.url);
assert.equal(g.url, "https://oauth2.googleapis.com/token");
assert.deepEqual(g.form, { code: "c1", client_id: "cid", client_secret: "csecret", redirect_uri: "postmessage", grant_type: "authorization_code" });
assert.equal(calls.find((c) => c.limitKey).limitKey, "203.0.113.9");

// refresh
calls = [];
r = await req("/refresh", { body: { refresh_token: "rt" } });
assert.deepEqual(await json(r), { access_token: "at", expires_in: 3599 });
assert.deepEqual(calls.find((c) => c.url).form, { refresh_token: "rt", client_id: "cid", client_secret: "csecret", grant_type: "refresh_token" });

// bad input never reaches Google
calls = [];
assert.equal((await req("/exchange", { body: { code: 5 } })).status, 400);
assert.equal((await req("/refresh", { body: {} })).status, 400);
assert.equal(calls.filter((c) => c.url).length, 0);

// Google errors pass through by status, with only the error code
google = () => ({ status: 400, body: { error: "invalid_grant", error_description: "Token has been expired or revoked." } });
r = await req("/refresh", { body: { refresh_token: "old" } });
assert.equal(r.status, 400);
assert.deepEqual(await json(r), { error: "invalid_grant" });
google = () => ({ status: 503, body: { error: "backend" } });
assert.equal((await req("/refresh", { body: { refresh_token: "rt" } })).status, 503);

// rate limit
limited = true;
assert.equal((await req("/exchange")).status, 429);
say("ok — token helper");
