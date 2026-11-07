// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2026 Parsa Kamalipour
// Voice helper: turns a French phrase into an MP3 with an Azure neural voice, so the Azure key stays off the site.
// Each clip is kept in Workers KV, so a phrase is only sent to Azure once. Logs nothing.
// Cost: Azure Free (F0) and Workers Free both refuse requests past their limits instead of billing; the app then uses the device voice.
const VOICES = { fr: ["fr-FR", "fr-FR-DeniseNeural"], qc: ["fr-CA", "fr-CA-SylvieNeural"] };
const MAX_LEN = 300;
const xml = (s) => s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]);
const sha = async (s) => [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)))].map((b) => b.toString(16).padStart(2, "0")).join("");

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get("Origin") || "";
    const allowed = env.ALLOWED_ORIGIN.split(",").map((s) => s.trim()).includes(origin);
    const cors = allowed ? { "Access-Control-Allow-Origin": origin, Vary: "Origin" } : {};
    const fail = (status, error) => new Response(JSON.stringify({ error }), { status, headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" } });
    if (!allowed) return fail(403, "origin");
    const url = new URL(request.url);
    if (url.pathname !== "/tts") return fail(404, "not_found");
    if (request.method !== "GET") return fail(405, "method");
    const voice = VOICES[url.searchParams.get("a")];
    const text = (url.searchParams.get("t") || "").normalize("NFC").replace(/\s+/g, " ").trim();
    if (!voice || !text || text.length > MAX_LEN) return fail(400, "bad_request");

    const audio = (body) => new Response(body, { headers: { ...cors, "Content-Type": "audio/mpeg", "Cache-Control": "public, max-age=31536000, immutable" } });
    const key = `${voice[1]}:${await sha(text)}`;
    // a KV error (e.g. the free daily read limit) counts as a miss
    const hit = await env.CLIPS.get(key, "arrayBuffer").catch(() => null);
    if (hit) return audio(hit);

    const { success } = await env.LIMITER.limit({ key: request.headers.get("CF-Connecting-IP") || "unknown" });
    if (!success) return fail(429, "rate_limited");
    let res;
    try {
      res = await fetch(`https://${env.AZURE_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": env.AZURE_SPEECH_KEY, "Content-Type": "application/ssml+xml",
          "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3", "User-Agent": "petitfrench-voice",
        },
        body: `<speak version="1.0" xml:lang="${voice[0]}"><voice name="${voice[1]}">${xml(text)}</voice></speak>`,
      });
    } catch (e) { return fail(502, "upstream"); }
    // 429/403 here = Azure's free monthly or per-minute limit; the app falls back to the device voice
    if (!res.ok) return fail(res.status === 429 || res.status === 403 ? 503 : 502, "azure_" + res.status);
    const clip = await res.arrayBuffer();
    // past the free daily write limit the put fails; the clip still plays, it just isn't kept
    ctx.waitUntil(env.CLIPS.put(key, clip).catch(() => {}));
    return audio(clip);
  },
};
