// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2026 Parsa Kamalipour
// Google token helper: swaps a sign-in code or a refresh token for an access token, so the client secret stays off the site.
// Stores nothing, logs nothing, never sees progress. Deploy: see README ("Cloud sync setup").
const TOKEN = "https://oauth2.googleapis.com/token";

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowed = env.ALLOWED_ORIGIN.split(",").map((s) => s.trim()).includes(origin);
    const cors = allowed ? { "Access-Control-Allow-Origin": origin, Vary: "Origin" } : {};
    const reply = (status, body) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
    if (!allowed) return reply(403, { error: "origin" });
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { ...cors,
      "Access-Control-Allow-Methods": "POST", "Access-Control-Allow-Headers": "Content-Type, X-Requested-With", "Access-Control-Max-Age": "86400" } });
    const path = new URL(request.url).pathname;
    if (path !== "/exchange" && path !== "/refresh") return reply(404, { error: "not_found" });
    if (request.method !== "POST") return reply(405, { error: "method" });
    // request-forgery check from Google's popup code-flow guide
    if (request.headers.get("X-Requested-With") !== "XmlHttpRequest") return reply(403, { error: "forbidden" });
    const { success } = await env.LIMITER.limit({ key: request.headers.get("CF-Connecting-IP") || "unknown" });
    if (!success) return reply(429, { error: "rate_limited" });

    let body = null;
    try { body = await request.json(); } catch (e) { /* not JSON */ }
    const value = path === "/exchange" ? body?.code : body?.refresh_token;
    if (typeof value !== "string" || !value || value.length > 2048) return reply(400, { error: "bad_request" });
    const form = new URLSearchParams(path === "/exchange"
      ? { code: value, client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, redirect_uri: "postmessage", grant_type: "authorization_code" }
      : { refresh_token: value, client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, grant_type: "refresh_token" });

    let res, data;
    try {
      res = await fetch(TOKEN, { method: "POST", body: form });
      data = await res.json();
    } catch (e) { return reply(502, { error: "upstream" }); }
    if (!res.ok) return reply(res.status, { error: typeof data?.error === "string" ? data.error : "google_error" });
    const out = { access_token: data.access_token, expires_in: data.expires_in };
    if (path === "/exchange" && data.refresh_token) out.refresh_token = data.refresh_token;
    return reply(200, out);
  },
};
