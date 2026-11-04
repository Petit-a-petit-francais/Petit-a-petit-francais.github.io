// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2026 Parsa Kamalipour
// Pure logic: conjugation engine, grading, diff, spaced repetition. No DOM here (tested in node by test.mjs).
(function (root) {
  const SUBJ = ["je", "tu", "il", "nous", "vous", "ils"];
  const REFL = ["me", "te", "se", "nous", "vous", "se"];
  const IMP_END = ["ais", "ais", "ait", "ions", "iez", "aient"];
  const FUT_END = ["ai", "as", "a", "ons", "ez", "ont"];
  const ETRE = ["suis", "es", "est", "sommes", "êtes", "sont"];
  const AVOIR = ["ai", "as", "a", "avons", "avez", "ont"];
  const ALLER = ["vais", "vas", "va", "allons", "allez", "vont"];
  const VENIR = ["viens", "viens", "vient", "venons", "venez", "viennent"];

  const TENSES = {
    pres: "présent",
    pc: "passé composé",
    imp: "imparfait",
    fut: "futur simple",
    cond: "conditionnel présent",
    fp: "futur proche",
    pr: "passé récent",
    impe: "impératif",
  };

  const vowelStart = (w) => /^[aeiouyàâäéèêëîïôöûùüœh]/i.test(w);
  const alts = (s) => String(s).split("|");
  // every combination of "a|b" alternatives across parts, joined
  function combos(parts) {
    return parts.reduce((acc, p) => acc.flatMap((a) => alts(p).map((b) => a + b)), [""]);
  }

  function parseVerb(v) {
    const [inf, en, pres, pp, aux, fut, imp] = v;
    const refl = /^(se |s')/.test(inf);
    const base = inf.replace(/^(se |s')/, "");
    const forms = pres.split(" ");
    const impersonal = forms.length === 1;
    let futStem = fut || (/re$/.test(base) ? base.slice(0, -1) : base);
    let impStem = imp || (impersonal ? "" : forms[3].split("|")[0].replace(/ons$/, ""));
    return { inf, base, en, forms, pp, aux: refl ? "e" : aux, futStem, impStem, refl, impersonal };
  }

  // imparfait stem tweak: mangeons→mange-, commençons→commenç-, but nous mangions / commencions
  function impForm(stem, end) {
    if (end[0] === "i") {
      if (stem.endsWith("ge")) stem = stem.slice(0, -1);
      if (stem.endsWith("ç")) stem = stem.slice(0, -1) + "c";
    }
    return stem + end;
  }

  function reflPron(i, next) {
    const r = REFL[i];
    return i < 3 || i === 5 ? (vowelStart(next) && r !== "nous" ? r[0] + "'" : r + " ") : r + " ";
  }

  // past participle with agreement; g = "m" | "f" | "?" (unknown → accept both)
  function ppForms(pp, i, g) {
    if (pp === "fallu" || pp === "plu") return [pp];
    const m = pp, f = pp + "e", mp = pp.endsWith("s") ? pp : pp + "s", fp = f + "s";
    if (i === 4) return g === "f" ? [f, fp] : [m, f, mp, fp]; // vous: polite singular or plural
    if (i < 3) return g === "f" ? [f] : g === "m" ? [m] : [m, f];
    return g === "f" ? [fp] : g === "m" ? [mp] : [mp, fp];
  }

  /**
   * Conjugate. person 0..5 (je..ils). g: subject gender for agreement ("m","f","?").
   * Returns { subject, answers[] } where answers exclude the subject pronoun.
   */
  function conjugate(v, tense, person, g = "?") {
    const V = typeof v.inf === "string" && v.forms ? v : parseVerb(v);
    const i = person;
    const withRefl = (w) => (V.refl ? reflPron(i, w) : "") + w;
    let answers;
    switch (tense) {
      case "pres":
        answers = alts(V.impersonal ? V.forms[0] : V.forms[i]).map(withRefl);
        break;
      case "imp":
        answers = (V.inf === "être" ? ["ét"] : alts(V.impStem)).map((s) => withRefl(impForm(s, IMP_END[i])));
        break;
      case "fut":
        answers = alts(V.futStem).map((s) => withRefl(s + FUT_END[i]));
        break;
      case "cond":
        answers = alts(V.futStem).map((s) => withRefl(s + IMP_END[i]));
        break;
      case "pc": {
        const aux = V.aux === "e" ? ETRE[i] : AVOIR[i];
        const parts = V.aux === "e" ? ppForms(V.pp, i, g) : alts(V.pp);
        answers = parts.map((p) => withRefl(aux) + " " + p);
        break;
      }
      case "fp":
        answers = [ALLER[i] + " " + (V.refl ? reflPron(i, V.base) : "") + V.base];
        break;
      case "pr": {
        const r = V.refl ? reflPron(i, V.base) : "";
        const de = vowelStart(r || V.base) ? "d'" : "de ";
        answers = [VENIR[i] + " " + de + r + V.base];
        break;
      }
      case "impe":
        answers = imperative(V, i);
        break;
    }
    // subject shown to the learner: elide je → j' when the answer starts with a vowel
    let subject = i === 2 ? (g === "f" ? "elle" : "il") : i === 5 ? (g === "f" ? "elles" : "ils") : SUBJ[i];
    if (V.impersonal) subject = "il";
    if (i === 0 && vowelStart(answers[0])) subject = "j'";
    if (tense === "impe") subject = "";
    return { subject, answers };
  }

  const IMPE_IRR = {
    être: ["sois", "soyons", "soyez"],
    avoir: ["aie", "ayons", "ayez"],
    savoir: ["sache", "sachons", "sachez"],
    aller: ["va", "allons", "allez"],
  };
  // imperative persons: 1 (tu) → 0, 3 (nous) → 1, 4 (vous) → 2
  function imperative(V, i) {
    const k = { 1: 0, 3: 1, 4: 2 }[i];
    let w = IMPE_IRR[V.base] ? IMPE_IRR[V.base][k] : alts(V.forms[i])[0];
    // -er verbs (and offrir/ouvrir type) drop the final s in the tu form
    if (k === 0 && /es$/.test(w) && (/er$/.test(V.base) || /rir$/.test(V.base))) w = w.slice(0, -1);
    if (V.refl) w += "-" + ["toi", "nous", "vous"][k];
    return [w];
  }

  // ---------- grading ----------
  const stripAccents = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");
  function norm(s) {
    return s
      .replace(/[’‘`´]/g, "'")
      .replace(/[«»"]/g, "")
      .replace(/\s+/g, " ")
      .replace(/\s*([?!:;,.])\s*/g, "$1 ")
      .replace(/\s*'\s*/g, "'")
      .trim()
      .replace(/[.!?;:,\s]+$/, "")
      .toLowerCase();
  }
  const loose = (s) => stripAccents(norm(s)).replace(/-/g, " ").replace(/[?!:;,.]/g, "").replace(/\s+/g, " ").trim();

  /** grade → 2 correct, 1 almost (accents / hyphens / punctuation), 0 wrong; best = closest expected answer */
  function grade(input, answers) {
    const n = norm(input);
    if (!n) return { score: 0, best: answers[0] };
    for (const a of answers) if (norm(a) === n) return { score: 2, best: a };
    for (const a of answers) if (loose(a) === loose(input)) return { score: 1, best: a };
    let best = answers[0], bd = Infinity;
    for (const a of answers) {
      const d = lev(norm(a), n);
      if (d < bd) (bd = d), (best = a);
    }
    return { score: 0, best };
  }

  function lev(a, b) {
    const dp = Array.from({ length: b.length + 1 }, (_, j) => j);
    for (let i = 1; i <= a.length; i++) {
      let prev = dp[0];
      dp[0] = i;
      for (let j = 1; j <= b.length; j++) {
        const tmp = dp[j];
        dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
        prev = tmp;
      }
    }
    return dp[b.length];
  }

  /** character diff of expected vs typed: [{t:"same"|"miss"|"extra", s}] (case-insensitive match) */
  function diff(expected, typed) {
    const a = [...expected], b = [...typed.trim()];
    const eq = (x, y) => x.toLowerCase() === y.toLowerCase();
    const L = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
    for (let i = a.length - 1; i >= 0; i--)
      for (let j = b.length - 1; j >= 0; j--)
        L[i][j] = eq(a[i], b[j]) ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    const out = [];
    const push = (t, s) => (out.length && out[out.length - 1].t === t ? (out[out.length - 1].s += s) : out.push({ t, s }));
    let i = 0, j = 0;
    while (i < a.length || j < b.length) {
      if (i < a.length && j < b.length && eq(a[i], b[j])) push("same", a[i++]), j++;
      else if (j < b.length && (i >= a.length || L[i][j + 1] >= L[i + 1][j])) push("extra", b[j++]);
      else push("miss", a[i++]);
    }
    return out;
  }

  // ---------- spaced repetition (SM-2 style) ----------
  // shortcut: SM-2 with fixed constants; upgrade to FSRS once there are months of review history to fit.
  const DAY = 864e5;
  function schedule(st, score, now = Date.now()) {
    const s = st ? { ...st } : { r: 0, i: 0, e: 2.5, l: 0, n: 0 };
    s.n = (s.n || 0) + 1;
    s.last = now;
    if (score === 0) {
      s.l++;
      s.r = 0;
      s.i = 0;
      s.e = Math.max(1.3, s.e - 0.2);
      s.d = now + 10 * 60e3;
      return s;
    }
    if (score === 1) {
      s.e = Math.max(1.3, s.e - 0.15);
      s.i = Math.max(1, Math.round(s.i * 1.2));
    } else {
      s.r++;
      s.i = s.r === 1 ? 1 : s.r === 2 ? 3 : Math.round(s.i * s.e);
      s.e = Math.min(3, s.e + 0.05);
    }
    const fuzz = s.i > 2 ? 1 + (Math.random() - 0.5) * 0.2 : 1;
    s.d = now + Math.round(s.i * fuzz) * DAY;
    return s;
  }

  /** interleave: round-robin across groups so consecutive items come from different topics */
  function interleave(items, key) {
    const groups = new Map();
    for (const it of items) {
      const k = key(it);
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(it);
    }
    const lists = [...groups.values()];
    const out = [];
    while (lists.some((l) => l.length)) for (const l of lists) if (l.length) out.push(l.shift());
    return out;
  }

  const shuffle = (a) => {
    a = [...a];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  // "[parle](parler)" style cloze parsing → parts: strings and {answers, hint}
  function parseCloze(s) {
    const parts = [];
    const re = /\[([^\]]+)\](?:\(([^)]+)\))?/g;
    let last = 0, m;
    while ((m = re.exec(s))) {
      if (m.index > last) parts.push(s.slice(last, m.index));
      parts.push({ answers: m[1].split("|"), hint: m[2] || "" });
      last = re.lastIndex;
    }
    if (last < s.length) parts.push(s.slice(last));
    return parts;
  }
  const fillCloze = (s) => s.replace(/\[([^\]|]+)[^\]]*\](\([^)]+\))?/g, "$1");

  // Saved or imported progress is untrusted: keep only known keys, finite numbers and allowed values.
  function cleanState(s, defaults, tenses) {
    const obj = (x) => (x && typeof x === "object" && !Array.isArray(x) ? x : {});
    const num = (x, lo, hi, d) => (Number.isFinite(+x) && x !== null && x !== "" ? Math.min(hi, Math.max(lo, +x)) : d);
    const srs = {}, log = {}, lessons = {};
    for (const [id, st] of Object.entries(obj(s.srs))) {
      const e = {};
      for (const [k, v] of Object.entries(obj(st))) if (/^[a-z]+$/.test(k) && Number.isFinite(+v) && v !== null) e[k] = +v;
      if (Object.keys(e).length && id !== "__proto__") srs[id] = { r: 0, i: 0, e: 2.5, l: 0, n: 0, d: 0, ...e };
    }
    for (const [day, d] of Object.entries(obj(s.log))) if (/^\d{4}-\d{2}-\d{2}$/.test(day))
      log[day] = { n: num(obj(d).n, 0, 1e6, 0), ok: num(obj(d).ok, 0, 1e6, 0), nw: num(obj(d).nw, 0, 1e6, 0) };
    for (const [id, t] of Object.entries(obj(s.lessons))) if (Number.isFinite(+t) && t && id !== "__proto__") lessons[id] = +t;
    const st = obj(s.settings), D = defaults;
    const ts = Array.isArray(st.tenses) ? tenses.filter((t) => st.tenses.includes(t)) : [];
    return { srs, log, lessons, settings: {
      newPerDay: num(st.newPerDay, 0, 100, D.newPerDay), sessionSize: num(st.sessionSize, 5, 100, D.sessionSize),
      voice: typeof st.voice === "string" ? st.voice : D.voice, voiceQc: typeof st.voiceQc === "string" ? st.voiceQc : D.voiceQc,
      accent: ["fr", "qc"].includes(st.accent) ? st.accent : D.accent, rate: num(st.rate, 0.5, 1.2, D.rate),
      autoplay: typeof st.autoplay === "boolean" ? st.autoplay : D.autoplay, tenses: ts.length ? ts : D.tenses,
      theme: ["auto", "light", "dark"].includes(st.theme) ? st.theme : D.theme,
    } };
  }

  root.Core = { cleanState, TENSES, SUBJ, parseVerb, conjugate, grade, diff, norm, loose, schedule, interleave, shuffle, parseCloze, fillCloze, stripAccents, DAY };
})(typeof window !== "undefined" ? window : globalThis);
