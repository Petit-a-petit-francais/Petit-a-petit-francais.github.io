// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2026 Parsa Kamalipour
/* global Core, DATA */
(() => {
  const { TENSES } = Core;
  const TENSE_ORDER = ["pres", "pc", "fp", "pr", "impe", "imp", "fut", "cond"];
  const TENSE_EN = { pres: "Present", pc: "Passé composé", fp: "Near future", pr: "Recent past", impe: "Imperative", imp: "Imparfait", fut: "Future", cond: "Conditional" };
  const KEY = "cahier-fr-v2", V1 = "cahier-fr-v1", V1_MERGED = "cahier-fr-v1-merged", V1_RETIRED = "cahier-fr-v1-retired", BACKUP = "cahier-fr-backup";
  const DEFAULTS = { newPerDay: 15, sessionSize: 20, voice: "", voiceQc: "", accent: "fr", rate: 0.9, autoplay: true, tenses: TENSE_ORDER, theme: "auto" };

  // ---------- storage ----------
  const ls = {
    get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }, // storage full or blocked
    del: (k) => { try { localStorage.removeItem(k); } catch (e) { /* blocked */ } },
  };
  const clean = (x) => Core.cleanState(x, DEFAULTS, TENSE_ORDER);
  const parse = (str) => { try { const x = JSON.parse(str); return x && typeof x === "object" ? x : null; } catch (e) { return null; } };
  const DEVICE = (() => {
    let d = ls.get("cahier-fr-device");
    if (!/^[a-z0-9]{16}$/.test(d || "")) {
      d = [...crypto.getRandomValues(new Uint8Array(16))].map((x) => "abcdefghijklmnopqrstuvwxyz0123456789"[x % 36]).join("");
      ls.set("cahier-fr-device", d);
    }
    return d;
  })();
  const App = { DEVICE, onSaved: null };
  const stored = (st) => JSON.stringify({ ...st, log: undefined });
  function load() {
    const raw = parse(ls.get(KEY));
    // shortcut: a v2 key written by a newer version is cleaned like any other (its unknown fields are dropped), upgrade when v3 exists
    let st = raw ? clean(raw) : null, changed = false;
    const rawV1 = ls.get(V1);
    // an old tab may still write v1: merge it again only when it changed, and never after an erase
    if (rawV1 && !ls.get(V1_RETIRED) && Core.hash(rawV1) !== ls.get(V1_MERGED)) {
      const v1 = parse(rawV1);
      if (v1) {
        if (st) ls.set(BACKUP, stored(st));
        st = st ? Core.merge(st, clean(v1)) : clean(v1);
        changed = true;
      }
      ls.set(V1_MERGED, Core.hash(rawV1));
    }
    st ||= Core.emptyState(DEFAULTS, { id: "", t: 0 });
    st.log = Core.sumLogs(st.logs);
    if (changed) ls.set(KEY, stored(st));
    return st;
  }
  let S = load();
  const save = () => {
    const ok = ls.set(KEY, stored(S));
    if (ok && App.onSaved) App.onSaved();
    return ok;
  };
  // Replace the whole state (sync, import, erase): back up the old one first. False if it couldn't be saved.
  const REPLACED = "cahier-fr-replaced"; // changes on every whole-state replace, so other tabs adopt it instead of merging
  let seenReplace = ls.get(REPLACED);
  function replaceState(next, why) {
    const prev = S;
    ls.set(BACKUP, stored(S));
    // a sync result is safe to merge in other tabs; an erase, import or "cloud only" must be adopted as is
    if (why !== "sync") ls.set(REPLACED, (seenReplace = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`));
    S = next;
    S.log = Core.sumLogs(S.logs);
    const ok = save();
    if (!ok) { S = prev; return false; } // never keep (or later push) a state this device couldn't save
    applyTheme();
    if (!session) route(); // never yank the learner out of a running session
    else renderNav();
    return ok;
  }
  // another tab of this site saved: take its progress in (it already saved, so don't save again).
  // After an erase or other whole-state replace there, adopt its state: merging would bring the erased progress back.
  function takeStored(str) {
    const o = parse(str);
    if (!o || Core.tooNew(o)) return;
    const r = ls.get(REPLACED);
    if (r !== seenReplace) {
      seenReplace = r;
      S = clean(o);
      S.log = Core.sumLogs(S.logs);
      applyTheme();
      if (!session) route(); else renderNav();
      return;
    }
    S = Core.merge(S, clean(o));
    S.log = Core.sumLogs(S.logs);
  }
  window.addEventListener("storage", (e) => { if (e.key === KEY) takeStored(e.newValue); });
  // back from the back/forward cache: this page missed the other tabs' storage events
  window.addEventListener("pageshow", (e) => { if (e.persisted) takeStored(ls.get(KEY)); });
  Object.assign(App, { getState: () => S, replaceState, clean, empty: (epoch) => Core.emptyState(DEFAULTS, epoch) });
  window.App = App;

  const today = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const main = document.getElementById("main");
  const tabbar = document.getElementById("tabbar");
  const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;

  // ---------- icons (Lucide-style strokes) ----------
  const P = {
    home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    learn: '<path d="M2 5.5A1.5 1.5 0 0 1 3.5 4H9a3 3 0 0 1 3 3v13a2.5 2.5 0 0 0-2.5-2.5H3.5A1.5 1.5 0 0 1 2 16z"/><path d="M22 5.5A1.5 1.5 0 0 0 20.5 4H15a3 3 0 0 0-3 3v13a2.5 2.5 0 0 1 2.5-2.5h6a1.5 1.5 0 0 0 1.5-1.5z"/>',
    practice: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
    sheets: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3.3.4 1.7 1.3 2.8 2.5 2.8z"/>',
    volume: '<path d="M11 5 6 9H3v6h3l5 4z" fill="currentColor"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    chev: '<path d="m9 18 6-6-6-6"/>',
    alert: '<circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/>',
    bulb: '<path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1V17h6v-.2c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2z"/>',
    headphones: '<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>',
    print: '<path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v7H6z"/>',
    cloud: '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9z"/>',
    refresh: '<path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5"/>',
  };
  const icon = (n, cls = "i") => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n]}</svg>`;

  // ---------- items ----------
  const VERBS = DATA.verbs.map(Core.parseVerb);
  const ITEMS = [];
  for (const tense of TENSE_ORDER)
    for (const v of VERBS) {
      if (v.impersonal && tense === "impe") continue;
      ITEMS.push({ id: `v:${v.inf}:${tense}`, type: "conj", group: TENSES[tense], v, tense });
    }
  for (const [topic, s, en, q] of DATA.cloze) ITEMS.push({ id: "c:" + s, type: "cloze", group: topic, s, en, q });
  for (const [fr, en, theme] of DATA.vocab) ITEMS.push({ id: "w:" + fr, type: "vocab", group: theme, fr, en });
  // several French words can share one English gloss; any of them is a correct answer
  const SAME_EN = new Map();
  for (const [fr, en] of DATA.vocab) { const k = en.toLowerCase().replace(/\s*\(.*?\)\s*/g, " ").trim(); SAME_EN.set(k, [...(SAME_EN.get(k) || []), fr]); }
  const active = (it) => it.type !== "conj" || S.settings.tenses.includes(it.tense);
  // new cards arrive in course order, alternating verbs / sentences / words
  const NEW_ORDER = Core.interleave(ITEMS, (it) => it.type);

  const GRAMMAR_TOPICS = [...new Set(DATA.cloze.map((c) => c[0]))];
  const topicName = (t) => (t === "examen" ? "Present tense test" : t[0].toUpperCase() + t.slice(1));
  const THEMES = [...new Set(DATA.vocab.map((w) => w[2]))];
  const FICHE = Object.fromEntries(DATA.fiches.map((f) => [f.id, f]));
  const TENSE_FICHE = { pres: "present", pc: "pc", fp: "proche", pr: "proche", impe: "impe", imp: "imp", fut: "fut", cond: "fut" };

  // lessons: grammar units from data + one vocabulary lesson per theme
  const UNITS = [...DATA.units, { title: "Vocabulary", lessons: THEMES.map((t) => ({ id: "v-" + t.toLowerCase().replace(/[^a-z]+/g, "-"), title: t, themes: [t] })) }];
  const LESSONS = UNITS.flatMap((u) => u.lessons.map((l) => ({ ...l, unit: u.title })));
  const LESSON = Object.fromEntries(LESSONS.map((l) => [l.id, l]));
  const lessonItems = (l) => ITEMS.filter((it) =>
    (it.type === "conj" && (l.tenses || []).includes(it.tense) && (!l.refl || it.v.refl)) ||
    (it.type === "cloze" && (l.topics || []).includes(it.group)) ||
    (it.type === "vocab" && (l.themes || []).includes(it.group)));
  const lessonFor = (it) =>
    LESSONS.find((l) => (it.type === "conj" ? (l.tenses || []).includes(it.tense) : it.type === "cloze" ? (l.topics || []).includes(it.group) : (l.themes || []).includes(it.group)));

  // ---------- speech ----------
  // Best-sounding voice first: neural/online voices (Edge, Chrome), then downloaded Premium/Enhanced system voices.
  // The novelty voices macOS ships (Grandma, Rocko…) are robotic, so they go last.
  const ACCENTS = { fr: { lang: "fr-FR", name: "France", key: "voice" }, qc: { lang: "fr-CA", name: "Québec", key: "voiceQc" } };
  const voiceRank = (v) =>
    (/natural|neural|online/i.test(v.name) ? 100 : 0) + (/premium/i.test(v.name) ? 80 : 0) + (/enhanced|amélioré/i.test(v.name) ? 60 : 0) +
    (/google/i.test(v.name) ? 50 : 0) + (/^(Thomas|Amélie|Audrey|Aurélie|Marie|Chantal|Nicolas)\b/.test(v.name) ? 20 : 0) +
    (/grandma|grandpa|rocko|eddy|flo\b|reed|sandy|shelley|jacques|bad news|bells|boing|bubbles|cellos|jester|organ|superstar|trinoids|whisper|wobble|zarvox/i.test(v.name) ? -200 : 0);
  let voices = [];
  const vLang = (v) => v.lang.replace("_", "-").toLowerCase();
  const loadVoices = () => (voices = speechSynthesis.getVoices().filter((v) => vLang(v).startsWith("fr")).sort((a, b) => voiceRank(b) - voiceRank(a)));
  if ("speechSynthesis" in window) {
    loadVoices();
    // Android Chrome reports voices late: refill the Settings list the first time they arrive
    speechSynthesis.onvoiceschanged = () => { const had = voices.length; loadVoices(); if (!had && voices.length && location.hash.startsWith("#/settings") && (document.activeElement === main || !main.contains(document.activeElement))) pageSettings(); };
  }
  // where to get better French voices, for the visitor's own system (Android's UA also says Linux, so it goes first)
  const OS = ((ua) => /Android/i.test(ua) ? "android" : /CrOS/.test(ua) ? "chromeos" : /Win/.test(ua) ? "windows" : /iPhone|iPad|iPod/.test(ua) || (/Mac/.test(ua) && navigator.maxTouchPoints > 1) ? "ios" : /Mac/.test(ua) ? "mac" : /Linux/i.test(ua) ? "linux" : "")(navigator.userAgent);
  const SAFARI = /Safari/.test(navigator.userAgent) && !/Chrome|Chromium|Edg|OPR|Firefox|FxiOS|CriOS|EdgiOS/.test(navigator.userAgent);
  const VOICE_HELP = {
    windows: "On Windows, Microsoft Edge has the most natural voices (Denise for France; Sylvie or Antoine for Québec). For other browsers, add voices in Settings › Time & language › Speech › Manage voices › Add voices › French (France) and French (Canada).",
    android: "On Android, install French voices in Settings › System › Languages (or Languages & input) › Text-to-speech output › Speech Services by Google › Install voice data › French (France and Canada). Menu names vary by phone maker.",
    linux: "On Linux, Chrome includes online Google French voices. Firefox uses your system speech engine: install speech-dispatcher with a French voice (espeak-ng, or a better-sounding engine such as RHVoice or Piper), then restart the browser.",
    chromeos: "On a Chromebook, add Google French voices in Settings › Accessibility › Text-to-Speech › Text-to-Speech engine settings.",
    mac: "On a Mac, download better voices: System Settings (System Preferences on older macOS) › Accessibility › Spoken Content › System voice › Manage Voices › French, and pick ones marked Premium or Enhanced (e.g. Thomas for France, Amélie or Nicolas for Canada). Microsoft Edge also has natural online voices.",
    "mac-safari": "Safari currently doesn't pass the Enhanced and Premium voices you download on your Mac to websites (a WebKit bug), so here you only get the built-in ones. For the better voices, open this site in Chrome or Microsoft Edge: Chrome uses the voices you've downloaded in System Settings › Accessibility › Spoken Content, and Edge adds its own natural online voices.",
    ios: "On iPhone and iPad, websites currently only get the built-in voices: the Enhanced and Premium voices you download in Settings aren't passed to them in any browser (a WebKit bug).",
  };
  // the Safari/iPhone notes only apply while WebKit hides downloaded voices; drop them once better voices show up
  const voiceHelp = () => {
    const better = voices.some((v) => /enhanced|premium|amélioré/i.test(v.name));
    let k = OS === "mac" && SAFARI ? "mac-safari" : OS;
    if (better && k === "mac-safari") k = "mac";
    if (better && k === "ios") return "";
    return (VOICE_HELP[k] || "For the most natural voices, open this site in Microsoft Edge.") + (k === "mac-safari" || k === "ios" ? "" : " Reload the page afterwards.");
  };
  const voicesFor = (acc) => voices.filter((v) => vLang(v) === ACCENTS[acc].lang.toLowerCase());
  const voiceFor = (acc) => voices.find((x) => x.voiceURI === S.settings[ACCENTS[acc].key]) || voicesFor(acc)[0] || (acc === "fr" ? voices[0] : null);
  function speak(text, rate = S.settings.rate, acc = S.settings.accent) {
    if (!("speechSynthesis" in window) || !text) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = ACCENTS[acc].lang;
    u.rate = rate;
    const v = voiceFor(acc);
    if (v) (u.voice = v), (u.lang = v.lang);
    speechSynthesis.speak(u);
  }
  const other = () => (S.settings.accent === "qc" ? "fr" : "qc");
  // pair: also offer the other accent, for the places you listen closely (feedback, examples, dictation)
  const sayBtn = (text, label = "Listen", pair = false) => `<button class="say" type="button" data-say="${esc(text)}" aria-label="${label}: ${esc(text)}" title="${label} (${ACCENTS[S.settings.accent].name})">${icon("volume")}</button>` +
    (pair ? `<button class="say alt" type="button" data-say="${esc(text)}" data-accent="${other()}" aria-label="${label} with a ${ACCENTS[other()].name} accent: ${esc(text)}" title="${label} (${ACCENTS[other()].name})">${other().toUpperCase()}</button>` : "");

  // ---------- progress & stats ----------
  const dayLog = () => ((S.logs[DEVICE] ||= {})[today()] ||= { n: 0, ok: 0, nw: 0 });
  const review = (id, prev, score) => (S.srs[id] = { ...Core.schedule(prev, score), m: Core.stamp(S) });
  function logResult(score, wasNew) {
    const d = dayLog();
    d.n++;
    if (score > 0) d.ok++;
    if (wasNew) d.nw++;
    S.log = Core.sumLogs(S.logs);
  }
  function streak() {
    let n = 0;
    const d = new Date();
    if (!S.log[today(d)]) d.setDate(d.getDate() - 1);
    while (S.log[today(d)]?.n) n++, d.setDate(d.getDate() - 1);
    return n;
  }
  const dueItems = (now = Date.now()) => ITEMS.filter((it) => active(it) && S.srs[it.id] && S.srs[it.id].d <= now).sort((a, b) => S.srs[a.id].d - S.srs[b.id].d);
  const newLeftToday = () => Math.max(0, S.settings.newPerDay - (S.log[today()]?.nw || 0));
  const unseen = () => NEW_ORDER.filter((it) => active(it) && !S.srs[it.id]);
  const mastered = (it) => (S.srs[it.id]?.i || 0) >= 21;
  // "forgotten" = currently failing (missed at the last attempt)
  const forgotten = (it) => S.srs[it.id] && S.srs[it.id].l > 0 && S.srs[it.id].r === 0;
  function lessonStatus(l) {
    const its = lessonItems(l).filter(active);
    const f = its.filter(forgotten).length;
    if (S.lessons[l.id] && f >= 2) return { key: "refresh", label: "Needs a refresher", forgot: f };
    if (S.lessons[l.id]) return { key: "done", label: "Learned", forgot: f };
    return { key: "new", label: "Not started", forgot: f };
  }
  const nextLesson = () => LESSONS.find((l) => !S.lessons[l.id]);
  const refreshLessons = () => LESSONS.map((l) => ({ l, st: lessonStatus(l) })).filter((x) => x.st.forgot >= 2).sort((a, b) => b.st.forgot - a.st.forgot);

  // ---------- session building ----------
  function dailyQueue(more = false) {
    const size = S.settings.sessionSize;
    const due = dueItems().slice(0, size);
    const fresh = unseen().slice(0, Math.min(more ? 10 : newLeftToday(), size - due.length));
    return Core.interleave(Core.shuffle([...due, ...fresh]), (it) => it.group);
  }
  function drillQueue(pool, size = S.settings.sessionSize) {
    const now = Date.now();
    const due = pool.filter((it) => S.srs[it.id] && S.srs[it.id].d <= now);
    // rotate unseen cards across tenses / topics so a short check samples the whole lesson
    const fresh = Core.interleave(pool.filter((it) => !S.srs[it.id]), (it) => it.group);
    const rest = pool.filter((it) => S.srs[it.id] && S.srs[it.id].d > now).sort((a, b) => S.srs[a.id].last - S.srs[b.id].last);
    const pick = [...Core.shuffle(due), ...fresh, ...rest].slice(0, size);
    return Core.interleave(Core.shuffle(pick), (it) => it.group);
  }
  const weakItems = () => ITEMS.filter((it) => active(it) && S.srs[it.id] && (S.srs[it.id].l >= 2 || forgotten(it))).sort((a, b) => S.srs[b.id].l - S.srs[a.id].l);

  // ---------- question cards ----------
  const label = (it) => (it.type === "conj" ? `${it.v.inf} · ${TENSES[it.tense]}` : it.type === "vocab" ? it.fr : Core.fillCloze(it.s));
  const inputAttrs = `autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="done"`;

  function makeCard(it) {
    if (it.type === "conj") {
      const persons = it.v.impersonal ? [2] : it.tense === "impe" ? [1, 3, 4] : [0, 1, 2, 3, 4, 5];
      const p = persons[Math.floor(Math.random() * persons.length)];
      const g = p === 2 || p === 5 ? (Math.random() < 0.5 ? "m" : "f") : "?";
      const c = Core.conjugate(it.v, it.tense, p, g);
      const subj = it.tense === "impe" ? `<span class="muted">(${["", "tu", "", "nous", "vous"][p]})</span> ` : esc(c.subject) + (c.subject.endsWith("'") ? "" : " ");
      return {
        label: "Conjugate the verb",
        body: `<p class="q-prompt" lang="fr">${subj}<span class="blank"><input class="ans" data-i="0" ${inputAttrs} aria-label="Conjugated form" size="13"></span>${it.tense === "impe" ? " !" : ""}</p>
          <div class="q-meta"><span class="badge blue">${esc(it.v.inf)}</span><span class="badge">${esc(TENSES[it.tense])}</span><span class="badge">${esc(it.v.en)}</span></div>`,
        blanks: [c.answers],
        full: (b) => (it.tense === "impe" ? b[0] + " !" : (c.subject.endsWith("'") ? c.subject : c.subject + " ") + b[0]),
        fiche: TENSE_FICHE[it.tense],
      };
    }
    if (it.type === "vocab") {
      const article = /^(le |la |l'|les |un |une )/.exec(it.fr);
      return {
        label: "Translate into French",
        body: `<p class="q-prompt">${esc(it.en)}</p><p class="q-sub">${article ? "Include the article (le, la, l', les)." : "Type the French word or phrase."}</p>
          <input class="ans wide" lang="fr" data-i="0" ${inputAttrs} aria-label="Answer in French" placeholder="En français…">`,
        blanks: [[it.fr, ...SAME_EN.get(it.en.toLowerCase().replace(/\s*\(.*?\)\s*/g, " ").trim()).filter((f) => f !== it.fr)]],
        noArticle: article ? it.fr.slice(article[0].length) : null,
        full: () => it.fr,
      };
    }
    const parts = Core.parseCloze(it.s);
    const blanks = [];
    const whole = parts.length === 1;
    const body = parts.map((p) => {
      if (typeof p === "string") return esc(p);
      const i = blanks.push(p.answers) - 1;
      const w = Math.max(4, ...p.answers.map((a) => a.length)) + 2;
      if (whole) return `<input class="ans wide" lang="fr" data-i="${i}" ${inputAttrs} aria-label="Your sentence" placeholder="Write the full sentence…">`;
      return `<span class="blank"><input class="ans" data-i="${i}" ${inputAttrs} size="${w}" aria-label="Blank ${i + 1}${p.hint ? ": " + esc(p.hint) : ""}">${p.hint ? `<span class="hint">${esc(p.hint)}</span>` : ""}</span>`;
    }).join("");
    return {
      label: it.q ? "Rewrite the sentence" : "Fill in the blank" + (blanks.length > 1 ? "s" : ""),
      body: it.q
        ? `<p class="q-prompt" lang="fr">${esc(it.q.replace(/^.*?:\s*/, ""))}</p><p class="q-sub" lang="fr">${esc(it.q.split(":")[0])}</p>${body}`
        : `<p class="q-prompt" lang="fr">${body}</p><div class="reveal-en"><button type="button" class="reveal">Show English translation</button><span hidden class="muted">${esc(it.en)}</span></div>`,
      blanks,
      full: (b) => { let k = 0; return parts.map((p) => (typeof p === "string" ? p : b[k++])).join(""); },
      en: it.en,
      fiche: lessonFor(it)?.fiche,
    };
  }

  const PRAISE = ["Correct!", "Nice work!", "Exactly!", "Well done!", "Perfect!"];
  // letter-level marks help with near-misses; for very different answers they're noise, so show the typed answer struck out
  function diffHtml(expected, typed) {
    const d = Core.diff(expected, typed);
    const same = d.filter((x) => x.t === "same").reduce((n, x) => n + x.s.length, 0);
    if (same < expected.length * 0.6) return `<span class="extra">${esc(typed.trim())}</span>`;
    return d.map((x) => (x.t === "same" ? esc(x.s) : `<span class="${x.t}">${esc(x.s)}</span>`)).join("");
  }

  // ---------- session runner ----------
  let session = null;

  function startSession(queue, opts) {
    if (!queue.length) {
      main.innerHTML = `<div class="page empty"><h1>Nothing to practise here right now</h1><p class="lead">Every card in this set is scheduled for later. Pick another topic, or learn new cards.</p><a class="btn primary" href="${opts.back}">Go back</a></div>`;
      return;
    }
    document.body.classList.add("focus");
    session = { queue, i: 0, results: [], requeued: {}, again: location.hash, ...opts };
    renderCard();
  }

  function renderCard() {
    const s = session, it = s.queue[s.i], card = makeCard(it);
    s.card = card;
    s.checked = false;
    const isNew = !S.srs[it.id];
    main.innerHTML = `<div class="session">
      <div class="session-top glass"><a class="icon-btn" href="${s.back}" aria-label="End session">${icon("x")}</a>
        <div class="track" role="progressbar" aria-valuemin="0" aria-valuemax="${s.queue.length}" aria-valuenow="${s.i}" aria-label="Session progress"><i style="width:${(s.i / s.queue.length) * 100}%"></i></div>
        <span class="count">${s.i + 1} / ${s.queue.length}</span>
        <a class="icon-btn" href="#/settings" aria-label="Settings (voice and accent)" title="Settings (voice and accent)">${icon("settings")}</a></div>
      <div class="session-body"><div class="sheet ruled">
        <div class="q-label">${esc(card.label)}${isNew ? ' <span class="badge blue">New</span>' : ""}</div>
        <form id="card" autocomplete="off">${card.body}</form>
        ${accentBar()}
      </div></div>
      <div class="bar" id="bar"><div class="bar-inner">
        <button class="btn ghost" id="idk" type="button">I don't know <kbd>Esc</kbd></button><span class="spacer"></span>
        <button class="btn primary lg" id="check" type="button">Check <kbd>Enter</kbd></button></div></div>
    </div>`;
    main.querySelector(".ans")?.focus();
    document.getElementById("check").onclick = () => check();
    document.getElementById("idk").onclick = () => check(true);
  }

  const accentBar = () => `<div class="accents" role="group" aria-label="Insert accented letter">${["é", "è", "ê", "à", "â", "ç", "ù", "û", "ô", "î", "ï", "ë", "œ"].map((k) => `<button type="button" data-ins="${k}" tabindex="-1" aria-label="Insert ${k}">${k}</button>`).join("")}</div>`;
  let lastInput = null;
  document.addEventListener("focusin", (e) => { if (e.target.matches?.(".ans")) lastInput = e.target; });
  document.addEventListener("mousedown", (e) => {
    const b = e.target.closest("[data-ins]");
    if (!b || !lastInput || lastInput.readOnly) return;
    e.preventDefault(); // keep focus in the answer field
    const el = lastInput, a = el.selectionStart, z = el.selectionEnd;
    el.value = el.value.slice(0, a) + b.dataset.ins + el.value.slice(z);
    el.selectionStart = el.selectionEnd = a + b.dataset.ins.length;
    el.focus();
  });

  function check(giveUp = false) {
    const s = session;
    if (s.checked) return;
    s.checked = true;
    const it = s.queue[s.i], card = s.card;
    const inputs = [...main.querySelectorAll("#card .ans")];
    const res = card.blanks.map((answers, i) => {
      const typed = giveUp ? "" : inputs[i].value;
      const g = Core.grade(typed, answers);
      if (g.score === 0 && card.noArticle && Core.loose(typed) === Core.loose(card.noArticle)) return { ...g, score: 1, typed, note: "Remember the article: the gender is part of the word." };
      return { ...g, typed };
    });
    const score = Math.min(...res.map((r) => r.score));
    inputs.forEach((el, i) => { el.readOnly = true; el.classList.add(["bad", "almost", "ok"][res[i].score]); });
    main.querySelector(".reveal-en")?.remove();

    const prev = S.srs[it.id];
    review(it.id, prev, score);
    logResult(score, !prev);
    save();
    const full = card.full(res.map((r) => r.best));
    s.results.push({ it, score, full });
    s.last = { it, prev, score };
    if (score === 0 && (s.requeued[it.id] || 0) < 2) {
      s.requeued[it.id] = (s.requeued[it.id] || 0) + 1;
      s.queue.splice(Math.min(s.i + 4, s.queue.length), 0, it);
    }

    const fiche = card.fiche && FICHE[card.fiche];
    const lesson = lessonFor(it);
    const title = score === 2 ? PRAISE[Math.floor(Math.random() * PRAISE.length)] : score === 1 ? "Almost, check the accents" : giveUp ? "Here's the answer" : "Not quite";
    const notes = res.map((r) => r.note).filter(Boolean);
    const typedWrong = res.filter((r) => r.score < 2 && r.typed.trim());
    const yours = score < 2 && typedWrong.length ? `<p class="yours">You wrote: <span lang="fr">${typedWrong.map((r) => diffHtml(r.best, r.typed)).join(" · ")}</span></p>` : "";
    const bar = document.getElementById("bar");
    bar.className = "bar slide-up " + ["bad", "almost", "ok"][score];
    bar.innerHTML = `<div class="bar-inner">
      <div class="verdict" role="status"><span class="badge-ico">${icon(score === 2 ? "check" : score === 1 ? "alert" : "x")}</span>
        <div><h2>${title}</h2>
          <p class="answer"><span>${score === 2 ? "" : "Answer: "}<span lang="fr">${esc(full)}</span></span> ${sayBtn(full, "Listen", true)}</p>
          ${yours}${notes.map((n) => `<p class="rule">${esc(n)}</p>`).join("")}
          ${card.en ? `<p class="en">${esc(card.en)}</p>` : ""}
          ${score < 2 && fiche && DATA.short[fiche.id] ? `<p class="rule">${icon("bulb")} ${esc(DATA.short[fiche.id])}</p>` : ""}
        </div></div>
      <div class="bar-actions">
        ${score < 2 && lesson ? `<button class="btn" id="teach" type="button">${icon("learn")} Teach me this</button>` : ""}
        ${score < 2 ? `<button class="btn ghost" id="override" type="button">I was right</button>` : ""}
        <button class="btn primary lg" id="next" type="button">Continue <kbd>Enter</kbd></button></div></div>`;
    document.getElementById("next").onclick = next;
    document.getElementById("override")?.addEventListener("click", override);
    document.getElementById("teach")?.addEventListener("click", () => openLessonDialog(lesson));
    document.getElementById("next").focus();
    if (S.settings.autoplay) speak(full);
  }

  // the grader was wrong (a valid alternative, a typo the learner disputes, etc.)
  function override() {
    const s = session, { it, prev } = s.last;
    review(it.id, prev, 2);
    if (s.last.score === 0) { dayLog().ok++; S.log = Core.sumLogs(S.logs); }
    s.results[s.results.length - 1].score = 2;
    if (s.requeued[it.id]) {
      const k = s.queue.indexOf(it, s.i + 1);
      if (k > -1) s.queue.splice(k, 1);
      s.requeued[it.id]--;
    }
    save();
    next();
  }

  function next() {
    session.i++;
    if (session.i >= session.queue.length) return renderSummary();
    renderCard();
  }

  function renderSummary() {
    const s = session;
    // ask once the learner has real progress, so the browser won't evict localStorage
    if (!renderSummary.asked) { renderSummary.asked = true; navigator.storage?.persisted?.().then((p) => p || navigator.storage.persist()).catch(() => {}); }
    const first = new Map();
    for (const r of s.results) if (!first.has(r.it.id)) first.set(r.it.id, r);
    const all = [...first.values()];
    const ok = all.filter((r) => r.score > 0).length;
    const missed = all.filter((r) => r.score === 0);
    if (s.lesson) { S.lessons[s.lesson] = Core.stamp(S); save(); }
    const nd = syncPrefs().nudge || {};
    syncPrefsSet({ nudge: { ...nd, sessions: (nd.sessions || 0) + 1 } });
    session = null;
    const pct = Math.round((ok / all.length) * 100);
    main.innerHTML = `<div class="done">
      <h1>${s.lesson ? "Lesson complete" : "Session complete"}</h1>
      <p class="score${pct < 60 ? " low" : ""}">${pct}%</p>
      <p class="lead" style="margin:0 auto">${ok} of ${all.length} right on the first try.${s.lesson ? " The new cards from this lesson are now in your daily review." : ""}</p>
      ${missed.length ? `<ul aria-label="To review">${missed.map((r) => `<li>${sayBtn(r.full)}<span lang="fr">${esc(r.full)}</span><span class="tiny">${esc(r.it.type === "conj" ? label(r.it) : r.it.group)}</span></li>`).join("")}</ul><p class="tiny">These come back first in your next review.</p>` : `<p class="muted" style="margin-top:16px">No mistakes. Excellent.</p>`}
      <p class="done-btns">
        <a class="btn primary lg" href="${s.back}" id="done">${s.back === "#/" ? "Back to home" : "Done"}</a>
        <button class="btn lg" type="button" id="again">Practise again</button></p></div>`;
    document.getElementById("done").focus();
    document.getElementById("again").onclick = route; // same hash, so re-running the router rebuilds the queue
  }

  document.addEventListener("keydown", (e) => {
    if (!session || document.getElementById("dialog").open) return;
    if (e.key === "Escape" && !session.checked) { e.preventDefault(); return check(true); }
    if (e.key !== "Enter" || e.isComposing) return;
    if (e.target.closest?.("button") && session.checked && e.target.id !== "next") return; // let Enter activate the focused button
    e.preventDefault();
    if (session.checked) return next();
    const inputs = [...main.querySelectorAll("#card .ans")];
    const k = inputs.indexOf(document.activeElement);
    const empty = inputs.find((el, j) => j > k && !el.value.trim());
    if (k > -1 && k < inputs.length - 1 && empty) return empty.focus();
    check();
  });

  // ---------- dictation (listening, not scheduled) ----------
  function startDictation() {
    const seen = DATA.cloze.filter((c) => S.srs["c:" + c[1]] && !c[3]);
    const pool = (seen.length >= 10 ? seen : DATA.cloze.filter((c) => !c[3])).map((c) => ({ text: Core.fillCloze(c[1]), en: c[2] }));
    const q = Core.shuffle(pool).filter((x) => x.text.split(" ").length <= 14).slice(0, 10);
    let i = 0, ok = 0;
    document.body.classList.add("focus");
    const show = () => {
      if (i >= q.length) {
        main.innerHTML = `<div class="done"><h1>Dictation complete</h1><p class="score">${ok} / ${q.length}</p><p class="lead" style="margin:0 auto">sentences written without a mistake.</p>
          <p class="done-btns"><a class="btn primary lg" href="#/practice">Done</a><button class="btn lg" id="again" type="button">Another dictation</button></p></div>`;
        document.getElementById("again").onclick = route;
        return;
      }
      const d = q[i];
      main.innerHTML = `<div class="session">
        <div class="session-top glass"><a class="icon-btn" href="#/practice" aria-label="End dictation">${icon("x")}</a><div class="track"><i style="width:${(i / q.length) * 100}%"></i></div><span class="count">${i + 1} / ${q.length}</span></div>
        <div class="session-body"><div class="sheet ruled"><div class="q-label">Type what you hear</div>
          <p class="dict-play"><button class="btn primary lg" type="button" data-say="${esc(d.text)}">${icon("volume")} Play</button>
          <button class="btn lg" type="button" data-say="${esc(d.text)}" data-rate="0.6">Play slowly</button>
          <button class="btn lg" type="button" data-say="${esc(d.text)}" data-accent="${other()}">Play with ${ACCENTS[other()].name} accent</button></p>
          <input class="ans wide" lang="fr" ${inputAttrs} placeholder="Écris ce que tu entends…" aria-label="What you hear">
          ${accentBar()}</div></div>
        <div class="bar" id="bar"><div class="bar-inner"><span class="spacer"></span><button class="btn primary lg" id="check" type="button">Check <kbd>Enter</kbd></button></div></div></div>`;
      const input = main.querySelector(".ans");
      input.focus();
      setTimeout(() => speak(d.text), 250);
      let done = false;
      const verify = () => {
        if (done) { i++; return show(); }
        done = true;
        const g = Core.grade(input.value, [d.text]);
        if (g.score > 0) ok++;
        logResult(g.score, false);
        save();
        input.readOnly = true;
        input.classList.add(["bad", "almost", "ok"][g.score]);
        const bar = document.getElementById("bar");
        bar.className = "bar slide-up " + ["bad", "almost", "ok"][g.score];
        bar.innerHTML = `<div class="bar-inner"><div class="verdict" role="status"><span class="badge-ico">${icon(g.score === 2 ? "check" : g.score === 1 ? "alert" : "x")}</span><div>
          <h2>${g.score === 2 ? "No mistakes!" : g.score === 1 ? "Almost, check the accents" : "A few mistakes"}</h2>
          <p class="answer"><span lang="fr">${esc(d.text)}</span> ${sayBtn(d.text, "Listen", true)}</p>
          ${g.score < 2 && input.value.trim() ? `<p class="yours">You wrote: <span lang="fr">${diffHtml(d.text, input.value)}</span></p>` : ""}<p class="en">${esc(d.en)}</p></div></div>
          <div class="bar-actions"><button class="btn primary lg" id="check" type="button">Continue <kbd>Enter</kbd></button></div></div>`;
        document.getElementById("check").onclick = verify;
        document.getElementById("check").focus();
      };
      document.getElementById("check").onclick = verify;
      main.querySelector(".session").addEventListener("keydown", (e) => { if (e.key === "Enter" && (e.target === input || done)) { e.preventDefault(); verify(); } });
    };
    show();
  }

  // ---------- shared page pieces ----------
  function meter(pool) {
    const n = pool.length || 1, m = pool.filter(mastered).length, s = pool.filter((it) => S.srs[it.id] && !mastered(it)).length;
    return `<div class="meter" role="img" aria-label="${m} mastered, ${s} in progress, of ${pool.length}"><i class="m" style="width:${(m / n) * 100}%"></i><i class="s" style="width:${(s / n) * 100}%"></i></div>`;
  }
  // one topic row in a practice list: French name, English gloss if any, cards seen, mastery meter
  const tile = (href, title, pool, sub = "", lang = "fr") => {
    const seen = pool.filter((it) => S.srs[it.id]).length;
    return `<a class="topic" href="${href}"><b lang="${lang}">${esc(title)}</b><span class="tiny"><span aria-hidden="true">${seen} / ${pool.length}</span><span class="sr-only">${seen} of ${pool.length} seen</span></span>${sub ? `<span class="tiny sub">${esc(sub)}</span>` : ""}${meter(pool)}</a>`;
  };
  const fillHtml = (s) => Core.parseCloze(s).map((p) => (typeof p === "string" ? esc(p) : `<b>${esc(p.answers[0])}</b>`)).join("");
  const plain = (s) => Core.fillCloze(s);

  function conjTable(V, tenses, named = false) {
    const cards = tenses.filter((t) => !(V.impersonal && t === "impe")).map((t) => {
      const persons = V.impersonal ? [2] : t === "impe" ? [1, 3, 4] : [0, 1, 2, 3, 4, 5];
      const rows = persons.map((p) => {
        const c = Core.conjugate(V, t, p, "?");
        const shown = t === "impe" ? "" : p === 2 ? (V.impersonal ? "il" : "il/elle") : p === 5 ? "ils/elles" : c.subject;
        const spoken = (t === "impe" ? "" : p === 2 ? "il " : p === 5 ? "ils " : c.subject + (c.subject.endsWith("'") ? "" : " ")) + c.answers[0];
        return `<li><span><span class="p${shown.endsWith("'") ? " el" : ""}">${esc(shown)}</span>${esc(c.answers.slice(0, 2).join(" / "))}</span>${sayBtn(spoken)}</li>`;
      }).join("");
      return `<div class="conj"><h3>${named ? `${esc(V.inf)} · ` : ""}${esc(TENSES[t])}</h3><ol lang="fr">${rows}</ol></div>`;
    }).join("");
    return named ? cards : `<div class="conj-grid">${cards}</div>`;
  }

  function examples(l, n = 8) {
    const rows = DATA.cloze.filter((c) => (l.topics || []).includes(c[0])).slice(0, n);
    return rows.map((c) => `<div class="example"><span class="say-pair">${sayBtn(plain(c[1]), "Listen", true)}</span><div><div class="fr" lang="fr">${fillHtml(c[1])}</div><div class="en">${esc(c[2])}</div></div></div>`).join("");
  }

  function lessonBody(l, compact = false) {
    const f = l.fiche && FICHE[l.fiche];
    let html = "";
    if (f) html += `${DATA.short[f.id] ? `<div class="callout">${icon("bulb")}<div><b>Key rule.</b> ${esc(DATA.short[f.id])}</div></div>` : ""}<div class="prose" style="margin-top:16px">${f.html}</div>`;
    if (l.models) html += `<h3 style="margin:24px 0 12px">Model verbs</h3><div class="conj-grid">${l.models.map((m) => conjTable(VERBS.find((v) => v.inf === m), l.tenses, true)).join("")}</div>`;
    if (l.themes) {
      const words = DATA.vocab.filter((w) => l.themes.includes(w[2]));
      html += `<div class="vocab-list">${words.map(([fr, en]) => `<div class="vocab-item">${sayBtn(fr)}<span class="fr" lang="fr">${esc(fr)}</span><span class="en">${esc(en)}</span></div>`).join("")}</div>`;
    }
    if (l.topics) html += `<h3 style="margin:24px 0 8px">Examples</h3>${examples(l, compact ? 4 : 8)}`;
    return html;
  }

  const dialog = document.getElementById("dialog");
  document.getElementById("dialog-close").innerHTML = icon("x");
  document.getElementById("dialog-close").onclick = () => dialog.close();
  dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });
  function openDialog(title, html) {
    document.getElementById("dialog-title").textContent = title;
    document.getElementById("dialog-body").innerHTML = html;
    dialog.showModal();
    document.getElementById("dialog-body").scrollTop = 0;
  }
  const openLessonDialog = (l) => openDialog(l.title, lessonBody(l, true) + `<p style="margin-top:20px"><button class="btn primary" type="button" data-close-dialog>Back to practice</button></p>`);

  // ---------- pages ----------
  function pageHome() {
    const due = dueItems().length, fresh = Math.min(newLeftToday(), unseen().length);
    const total = Math.min(S.settings.sessionSize, due + fresh);
    const t = S.log[today()] || { n: 0, ok: 0 };
    const goal = S.settings.sessionSize;
    const hour = new Date().getHours();
    const hello = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";
    const nl = nextLesson();
    const refresh = refreshLessons().slice(0, 4);
    const start = new Date();
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7) - 19 * 7);
    let cells = "", sum = 0, days = 0;
    for (let k = 0; k < 20 * 7; k++) {
      const d = new Date(start);
      d.setDate(start.getDate() + k);
      if (d > new Date()) break;
      const n = S.log[today(d)]?.n || 0;
      sum += n; days += n > 0;
      cells += `<i data-l="${n === 0 ? 0 : n < 15 ? 1 : n < 40 ? 2 : 3}" title="${today(d)}: ${n} answers"></i>`;
    }
    const area = (href, name, pool) => `<a class="area" href="${href}"><span>${name}</span><span class="tiny">${pool.filter((it) => S.srs[it.id]).length} / ${pool.length}</span>${meter(pool)}</a>`;
    main.innerHTML = `<div class="page">
      <div class="page-head home-head"><div><h1>${hello} !</h1><p class="lead">${esc(new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }))}</p></div></div>
      <div class="home-top">
        <section class="today-card ruled" aria-labelledby="today-h">
          <h2 class="label" id="today-h" style="margin:0">Today's review</h2>
          ${total ? `<span class="big">${plural(total, "card")}</span>
            <p>${due ? `${due} to review` : "Nothing due"}${fresh ? `, ${fresh} new` : ""}. About ${Math.max(3, Math.round(total * 0.35))} minutes of verbs, grammar and vocabulary, mixed together.</p>
            <a class="btn primary lg" href="#/review" id="go">Start review</a>`
          : `<span class="big">All done</span><p>You've finished today's review. Come back tomorrow, or learn a few more cards now.</p>
            <a class="btn primary lg" href="#/review?more" id="go">Learn 10 more cards</a>`}
          <div class="goal-wrap"><div class="goal" role="progressbar" aria-label="Daily goal" aria-valuemin="0" aria-valuemax="${goal}" aria-valuenow="${Math.min(goal, t.n)}"><i style="width:${Math.min(100, (t.n / goal) * 100)}%"></i></div>
          <p class="tiny" style="margin:6px 0 0">Daily goal: ${Math.min(goal, t.n)} of ${goal} answers</p></div>
        </section>
        <section class="card stats" aria-label="Your progress">
          <div class="streak"><span class="flame">${icon("flame")}</span><div><b>${plural(streak(), "day")}</b><span>in a row</span></div></div>
          <dl class="stat-list">
            <div><dt>accuracy today</dt><dd>${t.n ? Math.round((t.ok / t.n) * 100) + "%" : "–"}</dd></div>
            <div><dt>cards mastered</dt><dd>${ITEMS.filter(mastered).length}</dd></div>
            <div><dt>lessons learned</dt><dd>${Object.keys(S.lessons).length}<span class="tiny"> / ${LESSONS.length}</span></dd></div>
          </dl>
          <div class="areas">
            ${area("#/practice#verbs", "Verbs", ITEMS.filter((it) => it.type === "conj" && active(it)))}
            ${area("#/practice#grammar", "Grammar", ITEMS.filter((it) => it.type === "cloze"))}
            ${area("#/practice#vocab", "Vocabulary", ITEMS.filter((it) => it.type === "vocab"))}
          </div>
        </section>
      </div>
      ${nudgeHtml()}
      <div class="home-cols">
        ${nl ? `<section aria-labelledby="next-h"><h2 id="next-h">Up next</h2><a class="card next-card" href="#/learn/${nl.id}"><span class="tiny">Lesson ${LESSONS.indexOf(nl) + 1} of ${LESSONS.length}, ${esc(nl.unit)}</span><h3>${esc(nl.title)}</h3><span class="small muted">Read the rule, hear the examples, then a short check of ${Math.min(10, lessonItems(nl).length)} questions.</span><span class="btn">Open lesson</span></a></section>` : ""}
        ${refresh.length ? `<section aria-labelledby="refresh-h"><h2 id="refresh-h">Needs a refresher</h2>
          <div class="list">${refresh.map(({ l, st }) => `<a class="row-link" href="#/learn/${l.id}"><span class="status-dot refresh">${icon("refresh")}</span><span class="grow"><h3>${esc(l.title)}</h3><span class="tiny">${plural(st.forgot, "card")} forgotten</span></span>${icon("chev", "i chev")}</a>`).join("")}</div></section>` : ""}
      </div>
      <section class="card heat-card" aria-labelledby="heat-h">
        <div class="sec-head"><h2 id="heat-h">Last 20 weeks</h2><span class="tiny heat-legend" aria-hidden="true">Less <i></i><i></i><i></i><i></i> More</span></div>
        <div class="heat-body"><div class="heat" role="img" aria-label="Activity calendar: answers per day over the last 20 weeks">${cells}</div>
          <dl class="heat-sum"><div><dt>answers</dt><dd>${sum}</dd></div><div><dt>days practised</dt><dd>${days}</dd></div></dl></div>
      </section></div>`;
    document.getElementById("go")?.focus();
  }

  function pageLearn() {
    const nl = nextLesson(), learned = Object.keys(S.lessons).length;
    main.innerHTML = `<div class="page">
      <div class="page-head"><div><h1>Learn</h1><p class="lead">Each lesson explains one topic with examples and audio, then checks you with a few questions. Topics you keep missing are marked for a refresher.</p></div>
        <div class="overall"><span class="tiny">${learned} of ${LESSONS.length} learned</span><div class="meter" role="img" aria-label="${learned} of ${LESSONS.length} lessons learned"><i class="m" style="width:${(learned / LESSONS.length) * 100}%"></i></div></div></div>
      ${UNITS.map((u) => {
        const sts = u.lessons.map((l) => lessonStatus(LESSON[l.id]));
        const done = sts.filter((s) => s.key !== "new").length;
        // open the unit you're in, and any unit with a lesson to refresh; finished and later units stay folded
        const open = u.lessons.some((l) => l.id === nl?.id) || sts.some((s) => s.key === "refresh");
        return `<details class="unit"${open ? " open" : ""}><summary><h2>${esc(u.title)}</h2><span class="tiny">${done} / ${u.lessons.length}</span>
          <span class="meter" aria-hidden="true"><i class="m" style="width:${(done / u.lessons.length) * 100}%"></i></span>${icon("chev", "i chev")}</summary>
          <div class="list">${u.lessons.map((l, k) => {
            const st = sts[k], isNext = l.id === nl?.id;
            const n = LESSONS.indexOf(LESSON[l.id]) + 1;
            const dot = st.key === "done" ? `<span class="status-dot done">${icon("check")}</span>` : st.key === "refresh" ? `<span class="status-dot refresh">${icon("refresh")}</span>` : `<span class="status-dot${isNext ? " next" : ""}">${n}</span>`;
            const b = isNext ? `<span class="badge blue">Up next</span>` : st.key === "done" ? `<span class="badge green">Learned</span>` : st.key === "refresh" ? `<span class="badge orange">Needs a refresher</span>` : "";
            return `<a class="row-link${isNext ? " next" : ""}" href="#/learn/${l.id}">${dot}<span class="grow"><h3>${esc(l.title)}</h3><span class="tiny">${plural(lessonItems(LESSON[l.id]).length, "practice card")}${st.forgot ? `, ${st.forgot} forgotten` : ""}</span></span>${b}${icon("chev", "i chev")}</a>`;
          }).join("")}</div></details>`;
      }).join("")}</div>`;
  }

  function pageLesson(id) {
    const l = LESSON[id];
    if (!l) return pageLearn();
    const st = lessonStatus(l);
    const items = lessonItems(l).filter(active);
    const idx = LESSONS.indexOf(l), nxt = LESSONS[idx + 1];
    const f = l.fiche && FICHE[l.fiche];
    let step = 0;
    const stepH = (t) => `<div class="step"><span class="n">${++step}</span><h2>${t}</h2></div>`;
    let html = "";
    if (f) {
      html += stepH("Learn the rule") + `${DATA.short[f.id] ? `<div class="callout">${icon("bulb")}<div><b>Key rule.</b> ${esc(DATA.short[f.id])}</div></div>` : ""}<div class="card" style="margin-top:14px"><div class="prose">${f.html}</div></div>`;
    }
    if (l.models) html += stepH("See the pattern") + `<p class="muted small">Compare the model verbs side by side. Use the speaker buttons to hear each form.</p><div class="conj-grid">${l.models.map((m) => conjTable(VERBS.find((v) => v.inf === m), l.tenses, true)).join("")}</div>`;
    if (l.topics) html += stepH("See it in use") + `<div class="card">${examples(l, 10)}</div>`;
    if (l.themes) {
      const words = DATA.vocab.filter((w) => l.themes.includes(w[2]));
      html += stepH("Study the words") + `<p class="muted small">Listen to each word and say it out loud. Nouns come with their article, so learn the gender at the same time.</p><div class="card"><div class="vocab-list">${words.map(([fr, en]) => `<div class="vocab-item">${sayBtn(fr)}<span class="fr" lang="fr">${esc(fr)}</span><span class="en">${esc(en)}</span></div>`).join("")}</div></div>`;
    }
    html += stepH("Check yourself") + `<div class="card check-cta">
      <div><h3>Quick check: ${Math.min(10, items.length)} questions</h3><p class="tiny" style="margin:0">Cards you get wrong come back in your daily review until they stick.</p></div>
      <a class="btn primary lg" href="#/check/${l.id}">${st.key === "new" ? "Start quick check" : "Practise again"}</a></div>`;
    main.innerHTML = `<div class="page">
      <div class="crumbs"><a href="#/learn">Learn</a> › ${esc(l.unit)}</div>
      <div class="page-head"><div><h1>${esc(l.title)}</h1>
        <p class="lead">${st.key === "refresh" ? `You've forgotten ${st.forgot} cards from this lesson. Re-read it, then take the quick check.` : st.key === "done" ? "You've learned this. Read it again whenever you need a reminder." : `Lesson ${idx + 1} of ${LESSONS.length}.`}</p></div>
        ${st.key !== "new" ? `<span class="badge ${st.key === "done" ? "green" : "orange"}">${st.label}</span>` : ""}</div>
      ${html}
      ${nxt ? `<p style="margin-top:32px"><a class="btn ghost" href="#/learn/${nxt.id}">Next lesson: ${esc(nxt.title)} ${icon("chev")}</a></p>` : ""}</div>`;
  }

  function pagePractice() {
    const due = dueItems().length;
    const weak = weakItems();
    const mode = (href, ic, title, text, badge, cls = "") => `<a class="card mode${cls}" href="${href}"><span class="top"><span class="ico">${icon(ic)}</span>${badge}</span><h3>${title}</h3><span class="tiny">${text}</span></a>`;
    const section = (id, title, all, allLabel, rows) => `<div class="sec-head"><h2 id="${id}">${title}</h2><a class="btn" href="${all}">${allLabel}</a></div><div class="topics">${rows}</div>`;
    main.innerHTML = `<div class="page">
      <div class="page-head"><div><h1>Practice</h1><p class="lead">Your daily review mixes everything for you. Pick a topic below when you want to focus on one thing.</p></div></div>
      <div class="grid three">
        ${mode("#/review", "practice", "Daily review", "Spaced repetition across all areas", due ? `<span class="badge blue">${due} due</span>` : "", " main")}
        ${mode("#/dictation", "headphones", "Dictation", "Listen to a sentence and type it", "")}
        ${mode("#/drill?k=weak", "refresh", "Weak spots", "The cards you miss most", weak.length ? `<span class="badge red">${weak.length}</span>` : "")}
      </div>
      <nav class="jump" aria-label="Topics"><a href="#/practice#verbs">Verbs</a><a href="#/practice#grammar">Grammar</a><a href="#/practice#vocab">Vocabulary</a></nav>
      ${section("verbs", "Verbs by tense", `#/drill?k=conj&t=${S.settings.tenses.join(",")}`, "All tenses mixed", TENSE_ORDER.filter((t) => S.settings.tenses.includes(t)).map((t) => tile(`#/drill?k=conj&t=${t}`, topicName(TENSES[t]), ITEMS.filter((it) => it.type === "conj" && it.tense === t), TENSE_EN[t].toLowerCase() === TENSES[t] ? "" : TENSE_EN[t])).join(""))}
      ${section("grammar", "Grammar", "#/drill?k=type&g=cloze", "All grammar mixed", GRAMMAR_TOPICS.map((t) => tile(`#/drill?k=topic&g=${encodeURIComponent(t)}`, topicName(t), ITEMS.filter((it) => it.type === "cloze" && it.group === t), "", t === "examen" ? "en" : "fr")).join(""))}
      ${section("vocab", "Vocabulary", "#/drill?k=type&g=vocab", "All vocabulary mixed", THEMES.map((t) => tile(`#/drill?k=theme&g=${encodeURIComponent(t)}`, t, ITEMS.filter((it) => it.type === "vocab" && it.group === t))).join(""))}</div>`;
  }

  // ---------- cheatsheets ----------
  function pageSheets(tab = "grammar") {
    const tabs = [["grammar", "Grammar"], ["verbs", "Verb tables"], ["vocab", "Vocabulary"]];
    let body = "";
    if (tab === "grammar") {
      const order = LESSONS.filter((l) => l.fiche).map((l) => FICHE[l.fiche]);
      body = `<div class="sheet-layout"><nav class="toc" aria-label="Topics">${order.map((f) => `<button type="button" data-jump="s-${f.id}">${esc(f.title)}</button>`).join("")}</nav>
        <div>${order.map((f) => {
          const l = LESSONS.find((x) => x.fiche === f.id);
          return `<section class="card sheet-section" id="s-${f.id}" data-text="${esc((f.title + " " + f.html.replace(/<[^>]+>/g, " ")).toLowerCase())}">
            <h2>${esc(f.title)}</h2>${DATA.short[f.id] ? `<p class="rule">${esc(DATA.short[f.id])}</p>` : ""}<div class="prose">${f.html}</div>
            <p class="no-print" style="margin:8px 0 0"><a class="btn ghost" href="#/learn/${l.id}">Open lesson ${icon("chev")}</a></p></section>`;
        }).join("")}</div></div>`;
    }
    if (tab === "verbs") {
      body = `<div class="callout" style="margin-bottom:16px">${icon("bulb")}<div>Key forms for every verb. Select a verb for its full table in all 8 tenses. <b>*</b> = takes <b>être</b> in the passé composé.</div></div>
        <div class="table-wrap"><table class="ref-table" id="verbs"><thead><tr><th>Verb</th><th>Meaning</th><th>Présent (je · nous · ils)</th><th>Passé composé</th><th>Imparfait</th><th>Futur</th><th>Conditionnel</th></tr></thead><tbody>
        ${VERBS.map((V) => {
          const f = (t, p) => { const c = Core.conjugate(V, t, p, "m"); return (c.subject.endsWith("'") ? c.subject : c.subject + " ") + c.answers[0]; };
          const pres = V.impersonal ? esc(f("pres", 2)) : [0, 3, 5].map((p) => esc(f("pres", p))).join("<br>");
          const p0 = V.impersonal ? 2 : 0;
          return `<tr lang="fr" data-text="${esc((V.inf + " " + V.en).toLowerCase())}"><td><button class="verb-btn" type="button" data-verb="${esc(V.inf)}">${esc(V.inf)}</button>${V.aux === "e" ? " *" : ""}</td><td class="muted" lang="en">${esc(V.en)}</td><td>${pres}</td><td>${esc(f("pc", p0))}</td><td>${esc(f("imp", p0))}</td><td>${esc(f("fut", p0))}</td><td>${esc(f("cond", p0))}</td></tr>`;
        }).join("")}</tbody></table></div>`;
    }
    if (tab === "vocab") {
      body = THEMES.map((t) => {
        const words = DATA.vocab.filter((w) => w[2] === t);
        return `<section class="card vocab-group sheet-section" data-group><h3>${esc(t)} <span class="tiny">· <span class="count" data-total="${words.length}">${words.length}</span></span></h3><div class="vocab-list">${words.map(([fr, en]) => `<div class="vocab-item" data-text="${esc((fr + " " + en).toLowerCase())}">${sayBtn(fr)}<span class="fr" lang="fr">${esc(fr)}</span><span class="en">${esc(en)}</span></div>`).join("")}</div></section>`;
      }).join("");
    }
    main.innerHTML = `<div class="page">
      <div class="page-head"><div><h1>Cheatsheets</h1><p class="lead">Everything from your course on one page per area. Search it, or print it.</p></div>
        <button class="btn no-print" type="button" data-print>${icon("print")} Print</button></div>
      <nav class="tabs no-print" aria-label="Cheatsheet">${tabs.map(([k, n]) => `<a href="#/cheatsheets/${k}" ${k === tab ? 'aria-current="page"' : ""}>${n}</a>`).join("")}</nav>
      <div class="find-row no-print"><input type="search" id="find" placeholder="Search ${tab === "verbs" ? "verbs (e.g. prendre, to take)" : tab === "vocab" ? "words in French or English" : "rules (e.g. depuis, qui, au)"}" aria-label="Search this cheatsheet">
        <p class="tiny" id="found" role="status"></p></div>
      ${body}</div>`;
    const find = document.getElementById("find");
    // normalise once per tab, not on every keystroke
    const rows = [...main.querySelectorAll("[data-text]")].map((el) => ({ el, text: Core.stripAccents(el.dataset.text), group: el.closest("[data-group]") }));
    const groups = [...main.querySelectorAll("[data-group]")];
    // where matched text gets highlighted: the word and meaning, the verb and meaning, or the whole rule
    const scope = { vocab: ".fr, .en", verbs: "td:nth-child(-n+2)" }[tab];
    const marks = window.Highlight && CSS.highlights ? new Highlight() : null;
    if (marks) CSS.highlights.set("find", marks);
    const highlight = (el, q) => {
      for (const box of scope ? el.querySelectorAll(scope) : [el]) {
        const walk = document.createTreeWalker(box, NodeFilter.SHOW_TEXT);
        for (let node; (node = walk.nextNode()) && marks.size < 1500; ) { // shortcut: caps ranges for one-letter queries on huge sheets
          const hay = Core.stripAccents(node.data.toLowerCase());
          if (hay.length !== node.data.length) continue; // offsets only line up when normalising kept the length
          for (let i = hay.indexOf(q); i > -1; i = hay.indexOf(q, i + q.length)) {
            const r = new Range(); r.setStart(node, i); r.setEnd(node, i + q.length); marks.add(r);
          }
        }
      }
    };
    find.oninput = () => {
      const q = Core.stripAccents(find.value.trim().toLowerCase());
      const counts = new Map();
      let n = 0;
      marks?.clear();
      for (const r of rows) {
        const hit = !q || r.text.includes(q);
        if (r.el.hidden === hit) r.el.hidden = !hit; // touch the DOM only when visibility changes
        if (!hit) continue;
        n++;
        if (r.group) counts.set(r.group, (counts.get(r.group) || 0) + 1);
        if (q && marks && marks.size < 1500) highlight(r.el, q);
      }
      for (const g of groups) {
        const c = counts.get(g) || 0, count = g.querySelector(".count");
        g.hidden = !c;
        if (count) count.textContent = q ? `${c} of ${count.dataset.total}` : count.dataset.total;
      }
      document.getElementById("found").textContent = q ? `${n} match${n === 1 ? "" : "es"}` : "";
    };
    main.querySelectorAll("[data-jump]").forEach((b) => (b.onclick = () => document.getElementById(b.dataset.jump).scrollIntoView({ behavior: "smooth" })));
    main.querySelectorAll("[data-verb]").forEach((b) => (b.onclick = () => {
      const V = VERBS.find((v) => v.inf === b.dataset.verb);
      openDialog(`${V.inf} · ${V.en}`, `<p class="muted small">Auxiliary: ${V.aux === "e" ? "être" : "avoir"} · past participle: ${esc(V.pp)}</p>${conjTable(V, TENSE_ORDER)}
        <p style="margin-top:16px"><a class="btn primary" href="#/drill?k=verb&v=${encodeURIComponent(V.inf)}" data-close-dialog>Practise this verb</a></p>`);
    }));
  }

  function pageSettings() {
    const st = S.settings;
    main.innerHTML = `<div class="page narrow settings">
      <h1>Settings</h1>
      <h2>Daily review</h2>
      <div class="card">
        <div class="field"><label for="newPerDay">New cards per day<span class="tiny">How many unseen cards join your review each day</span></label><input type="number" id="newPerDay" min="0" max="100" value="${st.newPerDay}" style="width:96px"></div>
        <div class="field"><label for="sessionSize">Cards per session<span class="tiny">Also your daily goal</span></label><input type="number" id="sessionSize" min="5" max="100" value="${st.sessionSize}" style="width:96px"></div>
        <fieldset class="field col"><legend class="sr-only">Tenses you're studying</legend><span aria-hidden="true">Tenses you're studying<span class="tiny">Verb drills and your review only use these</span></span>
          <div class="checks">${TENSE_ORDER.map((t) => `<label class="check" lang="fr"><input type="checkbox" data-tense="${t}" ${st.tenses.includes(t) ? "checked" : ""}>${esc(TENSES[t])}</label>`).join("")}</div></fieldset>
        <div class="field"><span id="theme-l">Theme</span><span class="seg" role="radiogroup" aria-labelledby="theme-l">${[["auto", "Match system"], ["light", "Light"], ["dark", "Dark"]].map(([v, l]) => `<label><input type="radio" name="theme" value="${v}" ${st.theme === v ? "checked" : ""}>${l}</label>`).join("")}</span></div>
      </div>
      <h2>Audio</h2>
      <div class="card">
        <div class="field"><label for="accent">Main accent<span class="tiny">Used everywhere. The other one is a second button next to answers, examples and dictation.</span></label><select id="accent">${Object.entries(ACCENTS).map(([k, a]) => `<option value="${k}" ${st.accent === k ? "selected" : ""}>${a.name}</option>`).join("")}</select></div>
        ${Object.entries(ACCENTS).map(([k, a]) => `<div class="field"><label for="${a.key}">${a.name} voice</label><span class="voice-pick"><select id="${a.key}"><option value="">Best available${voiceFor(k) ? ` (${esc(voiceFor(k).name)})` : ""}</option>${voicesFor(k).map((v) => `<option value="${esc(v.voiceURI)}" ${v.voiceURI === st[a.key] ? "selected" : ""}>${esc(v.name)}</option>`).join("")}</select><button class="btn" type="button" data-test="${k}">Test</button></span></div>`).join("")}
        <div class="field"><label for="rate">Speed</label><input type="range" id="rate" min="0.5" max="1.2" step="0.05" value="${st.rate}"></div>
        <div class="field"><label for="autoplay">Read the answer aloud after each question</label><input type="checkbox" id="autoplay" ${st.autoplay ? "checked" : ""} style="width:22px;height:22px"></div>
        <p class="tiny" style="margin:8px 0 0">${!voices.length ? "No French voice found on this device, so audio may be silent or read with an English accent. " : !voicesFor("qc").length ? "No Québec voice found. " : ""}${voiceHelp()}</p>
      </div>
      <h2 id="sync">Your progress</h2>
      <div class="card"><div id="sync-card"></div>
        <div class="field" style="border-top:1px solid var(--border);border-bottom:0;margin-top:16px;padding:16px 0 0"><span>Backup file<span class="tiny">Save your progress to a file, or load one</span></span>
          <span style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" type="button" id="export">Export</button>
          <label class="btn" for="import">Import</label><input type="file" id="import" accept="application/json" hidden></span></div>
        <p id="msg" class="small" role="status" style="margin:10px 0 0"></p></div>
      <div class="card danger-zone" style="margin-top:16px"><p><b>Erase all progress</b><span class="tiny" style="display:block">Lessons, review schedule and statistics. Export a backup first if you want to keep them.</span></p>
        <button class="btn danger" type="button" id="reset">Erase progress</button></div></div>`;
    const set = (k, v) => {
      S.settings[k] = v;
      if (Core.SYNCED.includes(k)) S.setAt[k] = Core.stamp(S);
      save();
      renderNav();
    };
    const num = (id, lo, hi) => (document.getElementById(id).onchange = (e) => { const v = Math.min(hi, Math.max(lo, +e.target.value || lo)); e.target.value = v; set(id, v); });
    num("newPerDay", 0, 100);
    num("sessionSize", 5, 100);
    main.querySelectorAll("[data-tense]").forEach((cb) => (cb.onchange = () => {
      const ts = [...main.querySelectorAll("[data-tense]:checked")].map((x) => x.dataset.tense);
      if (!ts.length) return (cb.checked = true);
      set("tenses", ts);
    }));
    for (const id of ["voice", "voiceQc", "accent"]) document.getElementById(id).onchange = (e) => set(id, e.target.value);
    main.querySelectorAll("[data-test]").forEach((b) => (b.onclick = () => speak(b.dataset.test === "qc" ? "Bonjour ! Je m'appelle Léa et je reste à Montréal depuis deux ans." : "Bonjour ! Je m'appelle Léa et j'habite à Paris.", undefined, b.dataset.test)));
    document.getElementById("rate").onchange = (e) => set("rate", +e.target.value);
    document.getElementById("autoplay").onchange = (e) => set("autoplay", e.target.checked);
    main.querySelectorAll('[name="theme"]').forEach((r) => (r.onchange = () => { set("theme", r.value); applyTheme(); }));
    const msg = (t) => (document.getElementById("msg").textContent = t);
    renderSyncCard();
    document.getElementById("export").onclick = () => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([JSON.stringify({ ...S, log: undefined }, null, 1)], { type: "application/json" }));
      a.download = `french-progress-${today()}.json`;
      a.click();
      msg("Progress exported.");
    };
    document.getElementById("import").onchange = async (e) => {
      try {
        const data = JSON.parse(await e.target.files[0].text());
        if (Core.tooNew(data)) return msg("A newer version of the site saved your progress. Reload to update.");
        if (!data || typeof data.srs !== "object" || (typeof data.log !== "object" && typeof data.logs !== "object")) throw new Error("shape");
        const n = Object.keys(clean(data).srs).length;
        if (!replaceState(Core.merge(S, clean(data)), "import")) return msg("Couldn't save on this device.");
        msg(`Imported ${n} cards.`);
      } catch (err) {
        msg("That file isn't a progress export from this site. Nothing was changed.");
      }
    };
    const eraseHere = () => {
      if (!replaceState(Core.emptyState(DEFAULTS, S.epoch), "erase")) return msg("Couldn't save on this device, so nothing was erased."); // backs up first
      retireV1();
      msg("All progress erased.");
    };
    document.getElementById("reset").onclick = () => {
      if (!syncLinked().length) {
        if (confirm("Erase all progress, lessons and statistics on this device? Export a backup first if you want to keep them. If you've synced before, signing in again brings your cloud copy back.")) eraseHere();
        return;
      }
      openDialog("Erase all progress?", `<p>Export a backup first if you want to keep it.</p>
        <p class="stack-btns"><button class="btn" type="button" data-erase="here">This device only</button><span class="tiny">Your progress comes back from the cloud on the next sync.</span></p>
        <p class="stack-btns"><button class="btn" type="button" data-erase="all" style="color:var(--danger)">Everywhere</button><span class="tiny">Erases it on this device, in every cloud you're signed in to, and on your other devices when they next sync.</span></p>`);
      document.querySelectorAll("[data-erase]").forEach((b) => (b.onclick = async () => {
        dialog.close();
        if (b.dataset.erase === "here") return eraseHere();
        retireV1();
        msg(await syncEngine().eraseEverywhere() ? "All progress erased everywhere." : "Couldn't save on this device, so nothing was erased.");
      }));
    };
  }

  const retireV1 = () => { ls.del(V1); ls.set(V1_RETIRED, "1"); };

  // ---------- cloud sync (optional sign-in; nothing loads from Google or Apple until someone uses it) ----------
  const SYNC_KEY = "cahier-fr-sync";
  const PROVIDERS = { google: { name: "Google", cloud: "Google Drive", mod: "SyncGoogle" }, apple: { name: "Apple", cloud: "iCloud", mod: "SyncApple" } };
  const syncPrefs = () => parse(ls.get(SYNC_KEY)) || {};
  const syncPrefsSet = (patch) => ls.set(SYNC_KEY, JSON.stringify({ ...syncPrefs(), ...patch }));
  const accts = {}; // id -> { p, status, detail, at }
  const ready = {}; // ready.apple === "waiting": Apple sign-in in progress, so keep its hint and button state
  const dismissed = {}; // the epoch question, closed unanswered, isn't asked again until the learner taps "Decide"
  let engine = null;
  let appleBox = null; // CloudKit draws Apple's button into this node once; it's moved back in on every redraw
  const syncLinked = () => Object.keys(accts);
  const appleFirst = /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent);
  const loadScript = (src) => new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(Object.assign(new Error("offline"), { code: "offline" }));
    document.head.append(s);
  });
  async function providerModule(id) {
    const name = PROVIDERS[id].mod;
    if (!window[name]) await loadScript(`sync-${id}.js`);
    return window[name];
  }
  function syncEngine() {
    if (!engine) {
      engine = Sync.create({ app: App, core: Core, ask: askSync, onStatus: setSyncStatus });
      engine.start().catch(() => {}); // save, back online and tab-visible triggers
    }
    return engine;
  }
  const announce = (t) => { const el = document.getElementById("sync-live"); if (el) el.textContent = t; };
  const STATUS_TEXT = {
    syncing: () => "Syncing…",
    synced: (a) => (Date.now() - a.at < 60e3 ? "Synced just now" : `Synced at ${new Date(a.at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`),
    offline: () => "Offline, will sync later",
    reconnect: (a, id) => `Signed out of ${PROVIDERS[id].cloud}. Reconnect to keep syncing.`,
    unreadable: () => "The cloud copy can't be read, so it was left alone.",
    reload: () => "A newer version of the site saved your progress. Reload to update.",
    localfail: () => "Couldn't save on this device",
    attention: () => "Needs attention",
    other: (a) => `Couldn't sync${a.detail ? `: ${a.detail}` : ""}`,
  };
  const statusText = (id) => { const a = accts[id]; return (STATUS_TEXT[a.status] || STATUS_TEXT.other)(a, id); };
  // one word for the top bar
  function overall() {
    const st = syncLinked().map((id) => accts[id].status);
    if (st.some((x) => !["synced", "syncing", "offline"].includes(x))) return "Needs attention";
    if (st.includes("offline")) return "Offline";
    if (st.includes("syncing")) return "Syncing…";
    return "Synced";
  }
  function setSyncStatus(id, status, detail) {
    const a = (accts[id] ||= {});
    const changed = a.status !== status;
    Object.assign(a, { status, detail: detail || "" }, status === "synced" ? { at: Date.now() } : {});
    if (changed && status !== "syncing") announce(`${PROVIDERS[id].cloud}: ${statusText(id)}`);
    renderNav();
    renderSyncCard();
  }
  // the engine's questions, as dialogs; closing one unanswered leaves sync paused ("Needs attention")
  const QUESTIONS = {
    epoch: { title: "Progress erased elsewhere", text: "Your progress was erased from another device. Erase it here too, or keep this device's progress and upload it again?", answers: [["erase", "Erase it here too"], ["upload", "Keep and upload again"]] },
    account: { title: "Add this device's progress?", text: "Add this device's progress to this account, or start from this account's cloud progress only?", answers: [["add", "Add this device's progress"], ["cloud", "Use the cloud progress only"]] },
  };
  function askSync(kind) {
    if (dismissed[kind]) return Promise.resolve(null); // only the background (epoch) question stays quiet once closed
    const q = QUESTIONS[kind];
    return new Promise((resolve) => {
      let answer = null;
      openDialog(q.title, `<p>${q.text}</p><p class="tiny">Either way, a backup of this device's progress is kept.</p>
        <p style="display:flex;gap:8px;flex-wrap:wrap">${q.answers.map(([v, l], i) => `<button class="btn${i ? "" : " primary"}" type="button" data-answer="${v}">${l}</button>`).join("")}</p>`);
      document.querySelectorAll("[data-answer]").forEach((b) => (b.onclick = () => { answer = b.dataset.answer; dialog.close(); }));
      dialog.addEventListener("close", () => { if (!answer && kind === "epoch") dismissed.epoch = true; resolve(answer); }, { once: true });
    });
  }
  function confirmDialog(title, text, action, label, danger) {
    openDialog(title, `<p>${text}</p><p style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn primary" type="button" id="confirm-yes"${danger ? ' style="background:var(--danger);border-color:var(--danger)"' : ""}>${label}</button><button class="btn" type="button" id="confirm-no">Cancel</button></p>`);
    document.getElementById("confirm-no").onclick = () => dialog.close();
    document.getElementById("confirm-yes").onclick = async () => {
      dialog.close();
      try { await action(); } catch (e) { announce(`That didn't work: ${e.message || "network error"}. Try again later.`); renderSyncCard(); }
    };
  }
  async function linkAccount(p, fresh) {
    accts[p.id] = { ...accts[p.id], p, status: "syncing" };
    const ok = await syncEngine().link(p, { fresh });
    if (!ok) { if (!fresh) return; delete accts[p.id]; renderNav(); renderSyncCard(); return; }
    syncPrefsSet({ nudge: { ...syncPrefs().nudge, off: true } }); // signed in: no more reminders
    p.loadLabel?.().then(() => renderSyncCard());
    renderSyncCard();
  }
  function signInFailed(id, e) {
    const c = e && e.code;
    announce(c === "popup" ? "Your browser blocked the sign-in window. Tap the button again."
      : c === "cancelled" ? "Sign-in cancelled."
      : c === "offline" ? "You're offline. Try again when you're connected."
      : id === "apple" ? "Apple sign-in didn't work in this browser. Try Google instead."
      : `Sign-in didn't work${e && e.message ? `: ${e.message}` : ""}.`);
    renderSyncCard();
    document.querySelector(`[data-signin="${id}"]`)?.focus({ preventScroll: true }); // the tapped button was re-drawn: keep keyboard focus on it
  }
  // Sign-in windows. Browsers allow a pop-up only straight from a tap, but Google's and Apple's scripts (and Apple's
  // sign-in address) arrive later. So the tap opens a compact window at once, and when the provider calls window.open()
  // it's handed that window instead. If the browser blocks even this one, the provider opens its own as before.
  const POPUP = { w: 480, h: 640 };
  function openPopup() {
    const w = POPUP.w, h = Math.min(POPUP.h, (screen.availHeight || 800) - 40);
    const left = Math.round(screenX + Math.max(0, (outerWidth - w) / 2)), top = Math.round(screenY + Math.max(0, (outerHeight - h) / 3));
    const win = window.open("", "", `popup,width=${w},height=${h},left=${left},top=${top}`);
    if (!win) return null;
    try { win.document.title = "Signing in…"; win.document.body.textContent = "Opening sign-in…"; } catch (e) { /* not ours to write */ }
    return win;
  }
  // shortcut: swaps window.open while the provider opens its window (synchronously, inside fn); upgrade if Google or
  // Apple ever accept a window or size of our own
  function intoPopup(win, fn) {
    const open = window.open;
    if (win && !win.closed) window.open = (url) => { win.location.href = url; win.focus(); return win; };
    try { return fn(); } finally { window.open = open; }
  }
  // the learner closed the window without signing in: reset the button. The window also closes itself after a
  // successful sign-in, a moment before the sign-in finishes here, so wait a little before calling it cancelled.
  function watchClosed(win, done, onClose, grace = 4000) {
    if (!win) return;
    const t = setInterval(() => {
      if (done()) return clearInterval(t);
      if (win.closed) { clearInterval(t); setTimeout(() => { if (!done()) onClose(); }, grace); }
    }, 500);
  }
  const waitFor = (find, ms = 20000) => new Promise((resolve) => {
    const t0 = Date.now(), t = setInterval(() => { const el = find(); if (el || Date.now() - t0 > ms) { clearInterval(t); resolve(el || null); } }, 50);
  });

  function signInGoogle(btn) {
    const win = openPopup();
    let finished = false;
    btn.disabled = true;
    btn.textContent = "Opening Google…"; // Google's script reports a window closed without signing in (popup_closed)
    providerModule("google").then((M) => M.load())
      .then(() => intoPopup(win, () => window.SyncGoogle.signIn()))
      .then((p) => { finished = true; return linkAccount(p, !accts.google); })
      .catch((e) => { if (finished) return; finished = true; if (win && !win.closed) win.close(); signInFailed("google", e); });
  }
  // Apple: CloudKit draws Apple's own button into #apple-sign-in-button and opens its window from that button's click.
  // With our window open, the button stays hidden and is clicked for the learner; without one, they tap it themselves.
  function signInApple(btn) {
    const win = openPopup();
    let finished = false;
    btn.disabled = true;
    btn.textContent = "Opening Apple…";
    ready.apple = "waiting";
    if (win) appleBox.hidden = true;
    const reset = () => { ready.apple = false; appleBox.hidden = false; appleBox.replaceChildren(); };
    watchClosed(win, () => finished, () => { finished = true; reset(); signInFailed("apple", { code: "cancelled" }); });
    providerModule("apple").then(async (M) => {
      const done = M.signIn();
      const apple = await Promise.race([done.then(() => null, () => null), waitFor(() => appleBox.querySelector(".apple-auth-button"))]);
      if (apple && win && !win.closed) intoPopup(win, () => apple.click());
      else if (win && !win.closed) { win.close(); appleBox.hidden = false; } // already signed in, or no window: use Apple's button
      if (!win) btn.hidden = true;
      document.getElementById("apple-help").hidden = false;
      return done;
    }).then((p) => { finished = true; reset(); if (win && !win.closed) win.close(); return linkAccount(p, !accts.apple); })
      .catch((e) => { if (finished) return; finished = true; reset(); if (win && !win.closed) win.close(); signInFailed("apple", e); });
  }
  async function replaceCloud(id) {
    const p = accts[id].p;
    const { copies } = await p.pull();
    await p.push(JSON.stringify(Core.syncView(S)), copies.map((c) => c.ref));
    await syncEngine().run();
  }
  async function signOutOf(id) {
    await syncEngine().unlink(id);
    delete accts[id];
    renderNav();
    renderSyncCard();
  }
  function renderSyncCard() {
    const el = document.getElementById("sync-card");
    if (!el) return;
    const linked = syncLinked();
    const order = appleFirst ? ["apple", "google"] : ["google", "apple"];
    const acct = (id) => {
      const a = accts[id], P = PROVIDERS[id], st = a.status;
      const fix = st === "reconnect" ? `<button class="btn primary" type="button" data-signin="${id}">${id === "google" ? "Reconnect Google" : "Reconnect iCloud"}</button>`
        : st === "unreadable" ? `<button class="btn" type="button" data-act="replace" data-id="${id}">Replace cloud copy with this device's progress</button>`
        : st === "reload" ? `<button class="btn primary" type="button" data-act="reload">Reload</button>`
        : st === "attention" ? `<button class="btn primary" type="button" data-act="decide">Decide</button>` : "";
      return `<div class="sync-acct">
        <div class="grow"><b>${P.cloud}</b>${a.p && a.p.label && a.p.label !== P.cloud ? ` <span class="muted">· ${esc(a.p.label)}</span>` : ""}
          <span class="tiny sync-status" data-state="${esc(st || "")}">${esc(statusText(id))}</span></div>
        <div class="sync-btns">${fix}
          <button class="btn" type="button" data-act="signout" data-id="${id}">Sign out</button>
          <button class="btn ghost" type="button" data-act="delete" data-id="${id}" style="color:var(--danger)">Delete cloud copy</button>
          ${id === "google" ? `<button class="btn ghost" type="button" data-act="disconnect">Disconnect Google on all devices</button>` : ""}</div></div>`;
    };
    const signIn = (id) => id === "google"
      ? `<button class="btn" type="button" data-signin="google">Sign in with Google</button>`
      : `<button class="btn" type="button" data-signin="apple"${ready.apple === "waiting" ? " hidden" : ""}>Sign in with Apple</button>`;
    const free = order.filter((id) => !linked.includes(id));
    el.innerHTML = `<p class="muted small" style="margin-top:0">${linked.length
      ? "Your progress is kept in your own cloud and merged with your other signed-in devices."
      : "Progress is saved in this browser only. Sign in to keep it on all your devices, stored in your own Google Drive or iCloud. Or export a backup now and then."} <a href="privacy.html">Privacy policy</a></p>
      ${linked.map(acct).join("")}
      ${free.length ? `<div class="sync-signin">${free.map(signIn).join("")}</div>` : ""}
      <div id="apple-sign-in-button"></div><p class="tiny" id="apple-help" hidden>In Apple's sign-in window, tick <b>Keep me signed in</b>: otherwise Apple ends the session after 30 minutes. If no window opened, use Apple's button above. If Apple says "iCloud Data Web Access is Off", turn on Settings → your name → iCloud → Access iCloud Data on the Web on your iPhone, iPad or Mac, then try again. Or sign in with Google instead.</p>`;
    if (appleBox) document.getElementById("apple-sign-in-button").replaceWith(appleBox);
    else {
      appleBox = document.getElementById("apple-sign-in-button");
      // Apple draws its button as a plain div: make it reachable and usable from the keyboard
      new MutationObserver(() => {
        const d = appleBox.querySelector(".apple-auth-button:not([role])");
        if (!d) return;
        Object.assign(d, { tabIndex: 0, onkeydown: (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); d.click(); } } });
        d.setAttribute("role", "button");
        d.setAttribute("aria-label", "Sign in with Apple");
        d.focus();
      }).observe(appleBox, { childList: true, subtree: true });
    }
    if (ready.apple === "waiting") document.getElementById("apple-help").hidden = false;
    el.querySelectorAll("[data-signin]").forEach((b) => (b.onclick = () => (b.dataset.signin === "google" ? signInGoogle(b) : signInApple(b))));
    el.querySelectorAll("[data-act]").forEach((b) => (b.onclick = () => {
      const id = b.dataset.id, cloud = id && PROVIDERS[id].cloud;
      if (b.dataset.act === "reload") return location.reload();
      if (b.dataset.act === "decide") { delete dismissed.epoch; return syncEngine().run(); }
      if (b.dataset.act === "replace") return confirmDialog("Replace the cloud copy?", `The copy in your ${cloud} will be replaced with this device's progress. Its current content is kept as a backup there.`, () => replaceCloud(id), "Replace");
      if (b.dataset.act === "signout") return confirmDialog(`Sign out of ${cloud}?`, `This device stops syncing with this ${cloud} account. Nothing is deleted: your progress stays here and in the cloud.`, () => signOutOf(id), "Sign out");
      if (b.dataset.act === "delete") return confirmDialog(`Delete the ${cloud} copy?`, `This deletes everything this site stored in your ${cloud} and signs you out here. Other devices still signed in to this account will upload their copy again. To erase everywhere, use Erase all progress, then Everywhere.`, async () => { await syncEngine().deleteCloud(id); delete accts[id]; renderNav(); renderSyncCard(); }, "Delete", true);
      if (b.dataset.act === "disconnect") return confirmDialog("Disconnect Google on all devices?", "This signs out Google on every device, and they'll show Reconnect Google. Your progress stays on each device and in Drive.", async () => { await window.SyncGoogle.disconnectAll(); await signOutOf("google"); }, "Disconnect", true);
    }));
  }
  // linked devices: restore each remembered account, then keep syncing
  async function syncBoot() {
    if (!window.Sync) return;
    const ids = Sync.remembered().filter((id) => PROVIDERS[id]);
    if (!ids.length) return;
    const e = syncEngine();
    for (const id of ids) {
      e.hold(id);
      accts[id] = { status: "syncing" };
      try {
        const p = await (await providerModule(id)).restore();
        if (p) await linkAccount(p, false);
        else setSyncStatus(id, "reconnect");
      } catch (err) { setSyncStatus(id, ({ auth: "reconnect", other: "other" })[err && err.code] || "offline", err && err.message); }
    }
  }
  document.addEventListener("DOMContentLoaded", syncBoot);

  // reminders to sign in: after the 1st finished session, 7 and 30 practice days; per device
  function nudgeLevel() {
    const n = syncPrefs().nudge || {};
    if (n.off || syncLinked().length || (syncPrefs().linked || []).length) return 0;
    const days = Object.values(S.log).filter((d) => d.n > 0).length;
    const level = days >= 30 ? 3 : days >= 7 ? 2 : (n.sessions || 0) >= 1 ? 1 : 0;
    return level > (n.seen || 0) ? level : 0;
  }
  function nudgeHtml() {
    const level = nudgeLevel();
    if (!level) return "";
    return `<section class="card nudge" aria-label="Sync your progress">${icon("cloud")}
      <p class="grow">Keep your progress on all your devices: sign in with Google or Apple.</p>
      <span class="nudge-btns"><a class="btn primary" href="#/settings#sync">Sign in</a><button class="btn" type="button" data-nudge="later" data-level="${level}">Later</button>${level === 3 ? `<button class="btn ghost" type="button" data-nudge="off">Don't ask again</button>` : ""}</span></section>`;
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-nudge]");
    if (!b) return;
    const n = syncPrefs().nudge || {};
    syncPrefsSet({ nudge: b.dataset.nudge === "off" ? { ...n, off: true } : { ...n, seen: +b.dataset.level } });
    b.closest(".nudge").remove();
    main.focus();
  });

  function applyTheme() {
    if (S.settings.theme === "auto") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.dataset.theme = S.settings.theme;
    const bar = { light: "#fbfaf7", dark: "#10141d" };
    document.querySelectorAll('meta[name="theme-color"]').forEach((m) => { m.content = bar[S.settings.theme] || bar[m.media.includes("dark") ? "dark" : "light"]; });
  }

  // ---------- navigation ----------
  const NAV = [["home", "#/", "Home", "home"], ["learn", "#/learn", "Learn", "learn"], ["practice", "#/practice", "Practice", "practice"], ["cheatsheets", "#/cheatsheets", "Cheatsheets", "sheets"], ["settings", "#/settings", "Settings", "settings"]];
  function renderNav(current) {
    if (current !== undefined) renderNav.cur = current;
    const cur = renderNav.cur, due = dueItems().length;
    const link = (k, h, t, ic, short) => `<a href="${h}" ${k === cur ? 'aria-current="page"' : ""}>${icon(ic)}<span>${short ? t.replace("Cheatsheets", "Sheets") : t}</span>${!short && k === "practice" && due ? `<span class="badge blue">${due}</span>` : ""}</a>`;
    document.getElementById("nav").innerHTML = NAV.map((n) => link(...n)).join("");
    tabbar.innerHTML = NAV.map((n) => link(...n, true)).join("");
    const sync = syncLinked().length ? overall() : "";
    document.getElementById("sidebar-foot").innerHTML = (sync ? `<a class="sync-ind" href="#/settings#sync" data-state="${{ Synced: "ok", "Syncing…": "busy", Offline: "off" }[sync] || "warn"}" aria-label="${sync}" title="${sync}">${icon("cloud")}</a>` : "") + `<div class="streak-mini">${icon("flame")}<span><b>${streak()}</b><span class="streak-word"> day streak</span></span><span class="today">· ${plural(S.log[today()]?.n || 0, "answer")} today</span></div>`;
  }
  // the answer form only ever submits by Enter, which check() handles
  document.addEventListener("submit", (e) => { if (e.target.id === "card") e.preventDefault(); });
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-close-dialog]")) dialog.close();
    if (e.target.closest("[data-print]")) print();
    const b = e.target.closest("[data-say]");
    if (b) speak(b.dataset.say, b.dataset.rate ? +b.dataset.rate : undefined, b.dataset.accent);
    const r = e.target.closest(".reveal");
    if (r) { r.nextElementSibling.hidden = false; r.remove(); lastInput?.focus(); }
  });

  function route() {
    session = null;
    CSS.highlights?.delete("find");
    if (dialog.open) dialog.close();
    document.body.classList.remove("focus");
    if ("speechSynthesis" in window) speechSynthesis.cancel();
    const [path, qs] = location.hash.slice(1).split("?");
    const params = new URLSearchParams(qs || "");
    const parts = (path || "/").split("#")[0].split("/").filter(Boolean);
    const section = { learn: "learn", check: "learn", practice: "practice", review: "practice", drill: "practice", dictation: "practice", cheatsheets: "cheatsheets", settings: "settings" }[parts[0]] || "home";
    renderNav(section);
    window.scrollTo(0, 0);
    tabbar.classList.remove("min");
    main.focus({ preventScroll: true });
    switch (parts[0]) {
      case undefined: return pageHome();
      case "learn": return parts[1] ? pageLesson(decodeURIComponent(parts[1])) : pageLearn();
      case "check": {
        const l = LESSON[decodeURIComponent(parts[1])];
        if (!l) return pageLearn();
        return startSession(drillQueue(lessonItems(l).filter(active), 10), { back: `#/learn/${l.id}`, lesson: l.id });
      }
      case "practice": {
        pagePractice();
        const anchor = (path || "").split("#")[1];
        if (anchor) document.getElementById(anchor)?.scrollIntoView();
        return;
      }
      case "review": return startSession(dailyQueue(params.has("more")), { back: "#/" });
      case "dictation": return startDictation();
      case "cheatsheets": return pageSheets(parts[1]);
      case "settings": { pageSettings(); const a = location.hash.split("#")[2]; if (a) document.getElementById(a)?.scrollIntoView(); return; }
      case "drill": {
        const k = params.get("k"), g = params.get("g");
        const pools = {
          conj: () => { const ts = (params.get("t") || "").split(","); return ITEMS.filter((it) => it.type === "conj" && ts.includes(it.tense)); },
          verb: () => ITEMS.filter((it) => it.type === "conj" && active(it) && it.v.inf === params.get("v")),
          topic: () => ITEMS.filter((it) => it.type === "cloze" && it.group === g),
          theme: () => ITEMS.filter((it) => it.type === "vocab" && it.group === g),
          type: () => ITEMS.filter((it) => it.type === g && active(it)),
          weak: weakItems,
        };
        const pool = (pools[k] || pools.weak)();
        // weak-spot drills include everything weak, even if not due yet
        return startSession(k === "weak" ? Core.shuffle(pool).slice(0, S.settings.sessionSize) : drillQueue(pool), { back: "#/practice" });
      }
      default: return pageHome();
    }
  }
  window.addEventListener("hashchange", route);
  // the phone tab bar minimises while you scroll down and comes back when you scroll up (iOS 26 behaviour)
  let lastY = scrollY;
  window.addEventListener("scroll", () => {
    const y = scrollY, dy = y - lastY;
    if (Math.abs(dy) < 8 || session) return; // ignore jitter and tiny scrolls; no tab bar in a session
    tabbar.classList.toggle("min", dy > 0 && y > 120);
    lastY = y;
  }, { passive: true });
  applyTheme();
  route();
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js");
  window.__cahier = { ITEMS, VERBS, LESSONS, state: () => S, session: () => session }; // handle for automated checks
})();
