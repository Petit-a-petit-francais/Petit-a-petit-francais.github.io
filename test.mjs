// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2026 Parsa Kamalipour
// Run: node test.mjs — checks the conjugation engine, grader and scheduler against known-correct forms.
import { readFileSync, existsSync } from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

const ctx = {};
ctx.window = ctx; // like a browser: window is the global object
vm.createContext(ctx);
vm.runInContext(readFileSync(new URL("core.js", import.meta.url), "utf8"), ctx);
vm.runInContext(readFileSync(new URL("data.js", import.meta.url), "utf8"), ctx);
for (const f of ["grammar_extra.js", "vocab_extra.js"]) vm.runInContext(readFileSync(new URL(f, import.meta.url), "utf8"), ctx);
const { Core, DATA } = ctx;
const V = Object.fromEntries(DATA.verbs.map((v) => [v[0], Core.parseVerb(v)]));
const c = (inf, t, p, g = "?") => Core.conjugate(V[inf], t, p, g);
const has = (inf, t, p, form, g) => assert.ok(c(inf, t, p, g).answers.includes(form), `${inf} ${t} ${p}: ${form} not in ${c(inf, t, p, g).answers}`);

// présent
has("prendre", "pres", 5, "prennent");
has("se lever", "pres", 0, "me lève");
has("s'habiller", "pres", 0, "m'habille");
has("s'habiller", "pres", 3, "nous habillons");
has("payer", "pres", 0, "paye");
has("falloir", "pres", 2, "faut");
// imparfait
has("être", "imp", 0, "étais");
has("manger", "imp", 3, "mangions");
has("manger", "imp", 0, "mangeais");
has("commencer", "imp", 0, "commençais");
has("commencer", "imp", 4, "commenciez");
has("prendre", "imp", 5, "prenaient");
has("falloir", "imp", 2, "fallait");
has("se lever", "imp", 1, "te levais");
// futur / conditionnel
has("être", "fut", 0, "serai");
has("prendre", "fut", 3, "prendrons");
has("acheter", "fut", 0, "achèterai");
has("aller", "cond", 0, "irais");
has("pouvoir", "cond", 4, "pourriez");
has("falloir", "cond", 2, "faudrait");
has("payer", "fut", 0, "paierai");
// passé composé
has("aller", "pc", 2, "est allée", "f");
assert.ok(!c("aller", "pc", 2, "m").answers.includes("est allée"));
has("aller", "pc", 5, "sont allés", "m");
has("partir", "pc", 0, "suis partie");
has("prendre", "pc", 3, "avons pris");
has("se lever", "pc", 2, "s'est levée", "f");
has("s'habiller", "pc", 0, "me suis habillé");
has("se lever", "pc", 3, "nous sommes levés");
has("pleuvoir", "pc", 2, "a plu");
// futur proche / passé récent
has("se lever", "fp", 0, "vais me lever");
has("s'habiller", "fp", 3, "allons nous habiller");
has("apprendre", "pr", 0, "viens d'apprendre");
has("se réveiller", "pr", 0, "viens de me réveiller");
has("s'habiller", "pr", 1, "viens de t'habiller");
// impératif
has("parler", "impe", 1, "parle");
has("aller", "impe", 1, "va");
has("prendre", "impe", 1, "prends");
has("être", "impe", 4, "soyez");
has("se reposer", "impe", 1, "repose-toi");
has("offrir", "impe", 1, "offre");
// subject display
assert.equal(c("aimer", "pres", 0).subject, "j'");
assert.equal(c("parler", "pres", 0).subject, "je");
assert.equal(c("se lever", "pres", 0).subject, "je");
assert.equal(c("être", "imp", 0).subject, "j'");

// grading
assert.equal(Core.grade("prennent", ["prennent"]).score, 2);
assert.equal(Core.grade(" Prennent ", ["prennent"]).score, 2);
assert.equal(Core.grade("etais", ["étais"]).score, 1);
assert.equal(Core.grade("prenent", ["prennent"]).score, 0);
assert.equal(Core.grade("", ["x"]).score, 0);
assert.equal(Core.grade("Où habitez-vous", ["Où habitez-vous ?"]).score, 2);
assert.equal(Core.grade("ou habitez vous?", ["Où habitez-vous ?"]).score, 1);
assert.equal(Core.grade("n’a pas", ["n'a pas"]).score, 2);
assert.equal(Core.grade("connait", ["connaît", "connait"]).score, 2);
const d = Core.diff("prennent", "prenent");
assert.equal(d.map((x) => x.t).join(), "same,miss,same");

// scheduler
let s = Core.schedule(null, 2, 0);
assert.equal(s.i, 1);
s = Core.schedule(s, 2, 0);
assert.equal(s.i, 3);
s = Core.schedule(s, 0, 0);
assert.equal(s.i, 0);
assert.equal(s.l, 1);
assert.equal(s.d, 10 * 60e3);

// every cloze parses, and every blank has an answer
for (const [topic, sent] of DATA.cloze) {
  const blanks = Core.parseCloze(sent).filter((p) => typeof p !== "string");
  assert.ok(blanks.length > 0, `no blank: ${sent}`);
  assert.ok(blanks.every((b) => b.answers[0].trim()), `empty blank: ${sent}`);
}
// every verb conjugates in every tense without throwing or producing "undefined"
for (const v of Object.values(V))
  for (const t of Object.keys(Core.TENSES))
    for (const p of v.impersonal ? [2] : t === "impe" ? [1, 3, 4] : [0, 1, 2, 3, 4, 5]) {
      if (v.impersonal && t === "impe") continue;
      const r = Core.conjugate(v, t, p, "f");
      assert.ok(r.answers.length && r.answers.every((a) => a && !a.includes("undefined")), `${v.inf} ${t} ${p}`);
    }
const ids = new Set();
for (const [, s] of DATA.cloze) assert.ok(!ids.has(s), `duplicate cloze ${s}`), ids.add(s);
console.log(`ok — ${DATA.verbs.length} verbs, ${DATA.cloze.length} sentences, ${DATA.vocab.length} words`);
// every lesson points at a real sheet, topic and model verb; vocab has no duplicate French entries
const fiches = new Set(DATA.fiches.map((f) => f.id)), topics = new Set(DATA.cloze.map((c) => c[0])), verbs = new Set(DATA.verbs.map((v) => v[0]));
for (const u of DATA.units) for (const l of u.lessons) {
  assert.ok(!l.fiche || fiches.has(l.fiche), `lesson ${l.id}: no fiche ${l.fiche}`);
  for (const t of l.topics || []) assert.ok(topics.has(t), `lesson ${l.id}: no sentences for topic ${t}`);
  for (const m of l.models || []) assert.ok(verbs.has(m), `lesson ${l.id}: unknown model verb ${m}`);
  assert.ok(!l.fiche || DATA.short[l.fiche], `lesson ${l.id}: no key rule`);
}
const vkeys = new Map();
for (const w of DATA.vocab) { const k = w[0].toLowerCase(); assert.ok(!vkeys.has(k), `duplicate vocab ${w[0]}`); vkeys.set(k, 1); assert.ok(!/[\/()]/.test(w[0]), `bad vocab ${w[0]}`); }
assert.equal(new Set(DATA.verbs.map((v) => v[0])).size, DATA.verbs.length, "duplicate verb");
console.log(`ok — ${DATA.units.reduce((n, u) => n + u.lessons.length, 0)} grammar lessons, ${DATA.fiches.length} sheets`);

// offline install: every file the service worker caches and every manifest icon exists
const here = (f) => new URL(f, import.meta.url);
const sw = readFileSync(here("sw.js"), "utf8");
const cached = JSON.parse(sw.match(/const APP = (\[[^\]]*\])/)[1]);
for (const f of cached.filter((f) => f !== "./")) assert.ok(existsSync(here(f)), `sw.js caches missing file ${f}`);
for (const i of JSON.parse(readFileSync(here("manifest.webmanifest"), "utf8")).icons) assert.ok(existsSync(here(i.src)), `manifest icon missing ${i.src}`);
console.log(`ok — ${cached.length} offline files`);

// saved/imported progress is untrusted: markup and bad values are dropped
{
  const D = { newPerDay: 15, sessionSize: 20, voice: "", voiceQc: "", accent: "fr", rate: 0.9, autoplay: true, tenses: ["pres", "pc"], theme: "auto" };
  const c = Core.cleanState({
    srs: JSON.parse('{"a":{"r":1,"e":"2.5","x":"<img onerror=alert(1)>"},"b":"junk","__proto__":{"r":1}}'),
    log: { "2026-11-04": { n: "<b>1</b>", ok: 3 }, "<script>": { n: 1 } },
    lessons: { l1: 123, l2: "<i>" },
    settings: { newPerDay: "<svg>", sessionSize: 999, accent: "<x>", theme: "dark", tenses: ["pc", "<y>"], rate: 3, autoplay: "yes", voice: 5 },
  }, D, ["pres", "pc", "fut"]);
  assert.equal(JSON.stringify(c.srs), '{"a":{"r":1,"i":0,"e":2.5,"l":0,"n":0,"d":0,"m":0}}');
  assert.equal(JSON.stringify(c.logs.legacy), '{"2026-11-04":{"n":0,"ok":3,"nw":0}}');
  assert.equal(JSON.stringify(c.lessons), '{"l1":123}');
  assert.equal(c.srs.r, undefined, "__proto__ id must not change the prototype");
  assert.equal(JSON.stringify(c.settings), '{"newPerDay":15,"sessionSize":100,"voice":"","voiceQc":"","accent":"fr","rate":1.2,"autoplay":true,"tenses":["pc"],"theme":"dark"}');
  assert.equal(JSON.stringify(Core.cleanState({}, D, ["pres"]).settings.tenses), '["pres","pc"]');
}
console.log("ok — progress validation");

// merging progress from several devices and clouds (v2 format)
{
  const D = { newPerDay: 15, sessionSize: 20, voice: "", voiceQc: "", accent: "fr", rate: 0.9, autoplay: true, tenses: ["pres", "pc"], theme: "auto" };
  const T = ["pres", "pc", "fut"];
  const clean = (x) => Core.cleanState(x, D, T);
  const same = (x, y, msg) => assert.deepEqual(JSON.parse(JSON.stringify(x)), JSON.parse(JSON.stringify(y)), msg);
  const sv = Core.syncView;
  // seeded random states (mulberry32)
  let seed = 42;
  const rnd = () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const gen = () => {
    const srs = {}, logs = {}, lessons = {}, setAt = {};
    for (const id of ["a", "b", "c", "d"]) if (rnd() < 0.6) srs[id] = { r: pick([0, 1, 2]), i: pick([0, 1, 3]), e: 2.5, l: 0, n: pick([1, 2, 3]), d: 0, m: pick([0, 5, 9]) };
    for (const slot of ["devaaaaa", "devbbbbb"]) if (rnd() < 0.7) logs[slot] = { "2026-11-01": { n: pick([0, 2, 5]), ok: pick([0, 1, 4]), nw: pick([0, 1]) } };
    for (const id of ["l1", "l2"]) if (rnd() < 0.5) lessons[id] = pick([10, 20]);
    const settings = { theme: pick(["auto", "light", "dark"]), sessionSize: pick([10, 20]), voice: pick(["x", "y"]) };
    for (const k of Core.SYNCED) setAt[k] = pick([0, 3, 7]);
    return clean({ v: 2, epoch: pick([{ id: "aaaa", t: 1 }, { id: "bbbb", t: 2 }]), srs, logs, lessons, settings, setAt });
  };
  for (let k = 0; k < 200; k++) {
    const a = gen(), b = gen(), c = gen();
    same(Core.merge(a, a), a, "idempotent");
    same(sv(Core.merge(a, b)), sv(Core.merge(b, a)), "commutative");
    same(sv(Core.merge(Core.merge(a, b), c)), sv(Core.merge(a, Core.merge(b, c))), "associative");
    assert.equal(Core.merge(a, b).settings.voice, a.settings.voice, "device-only settings stay local");
  }
  // two devices offline
  const day = "2026-11-01";
  const A = clean({ v: 2, srs: { x: { n: 1, m: 100 } }, logs: { devaaaaa: { [day]: { n: 4 } } } });
  const B = clean({ v: 2, srs: { y: { n: 1, m: 101 } }, logs: { devbbbbb: { [day]: { n: 3 } } } });
  const AB = Core.merge(A, B);
  assert.ok(AB.srs.x && AB.srs.y && AB.logs.devaaaaa && AB.logs.devbbbbb);
  assert.equal(Core.sumLogs(AB.logs)[day].n, 7);
  // same slot and day: larger count each
  const L1 = clean({ v: 2, logs: { devaaaaa: { [day]: { n: 5, ok: 2, nw: 1 } } } }), L2 = clean({ v: 2, logs: { devaaaaa: { [day]: { n: 3, ok: 4, nw: 0 } } } });
  same(Core.merge(L1, L2).logs.devaaaaa[day], { n: 5, ok: 4, nw: 1 });
  // skewed clock
  assert.equal(Core.stamp({ srs: { a: { m: 9e12 } } }, 1000), 9e12 + 1);
  assert.equal(Core.stamp(clean({}), 1000), 1000);
  // card ties
  const C1 = clean({ v: 2, srs: { a: { m: 5, n: 2 } } }), C2 = clean({ v: 2, srs: { a: { m: 5, n: 3 } } });
  assert.equal(Core.merge(C1, C2).srs.a.n, 3);
  assert.equal(Core.merge(C2, C1).srs.a.n, 3);
  const C3 = clean({ v: 2, srs: { a: { m: 5, n: 3, i: 1 } } }), C4 = clean({ v: 2, srs: { a: { m: 5, n: 3, i: 2 } } });
  same(Core.merge(C3, C4).srs.a, Core.merge(C4, C3).srs.a);
  // setting with both stamps 0: larger JSON string wins, both orders
  const S1 = clean({ settings: { theme: "dark" } }), S2 = clean({ settings: { theme: "light" } });
  assert.equal(Core.merge(S1, S2).settings.theme, "light");
  assert.equal(Core.merge(S2, S1).settings.theme, "light");
  const S3 = clean({ v: 2, settings: { theme: "dark" }, setAt: { theme: 9 } });
  assert.equal(Core.merge(S2, S3).settings.theme, "dark");
  assert.equal(Core.merge(S2, S3).setAt.theme, 9);
  // epochs: the later epoch wins outright
  const E1 = clean({ v: 2, epoch: { id: "b", t: 5 }, srs: { a: { m: 1 } } });
  const E2 = clean({ v: 2, epoch: { id: "a", t: 5 }, srs: { a: { m: 9 }, b: { m: 9 } }, lessons: { l1: 3 } });
  same(sv(Core.merge(E2, E1)), sv(E1));
  same(sv(Core.merge(E1, E2)), sv(E1));
  // v1 input
  const v1 = { srs: { a: { last: 7, r: 1 } }, log: { [day]: { n: 2 } }, settings: {} };
  const c1 = clean(v1);
  assert.equal(c1.v, 2);
  assert.equal(c1.srs.a.m, 7);
  assert.equal(c1.logs.legacy[day].n, 2);
  same(c1.epoch, { id: "", t: 0 });
  assert.ok(Core.SYNCED.every((k) => c1.setAt[k] === 0));
  assert.equal(Core.sumLogs(Core.merge(Core.merge(c1, clean(v1)), clean(v1)).logs)[day].n, 2, "re-import never double-counts");
  // versions
  assert.equal(Core.tooNew({ v: 3 }), true);
  assert.equal(Core.tooNew({ v: 2 }), false);
  assert.equal(Core.tooNew({}), false);
  // garbage cleans to valid shapes
  const g = clean({ logs: { "<x>": { bad: { n: 1 } }, devaaaaa: { bad: { n: 1 }, [day]: { n: "<b>" } } }, epoch: { id: "<s>", t: "x" }, v: "2", setAt: { theme: "<x>", voice: 5 } });
  assert.ok(Object.keys(g.logs).every((k) => /^(legacy|[a-z0-9]{8,32})$/.test(k)));
  same(g.logs, { devaaaaa: { [day]: { n: 0, ok: 0, nw: 0 } } });
  same(g.epoch, { id: "", t: 0 });
  same(Object.keys(g.setAt).sort(), [...Core.SYNCED].sort());
  assert.equal(g.setAt.theme, 0);
  assert.ok(/^[a-z0-9]{0,32}$/.test(clean({ epoch: { id: "ok1", t: 3 } }).epoch.id));
  // helpers
  assert.equal(Core.isEmpty(clean({})), true);
  assert.equal(Core.isEmpty(clean({ v: 2, logs: { devaaaaa: { [day]: { n: 0 } } } })), true);
  assert.equal(Core.isEmpty(c1), false);
  assert.equal(sv(c1).settings.voice, undefined);
  assert.equal(sv(c1).settings.theme, "auto");
  const ep = { id: "zz", t: 50 }, r = Core.restamp(c1, ep, 1000);
  same(r.epoch, ep);
  assert.ok(r.srs.a.m > 50 && Core.SYNCED.every((k) => r.setAt[k] === r.srs.a.m));
  same(sv(Core.merge(r, clean({ v: 2, epoch: ep }))).srs, sv(r).srs, "restamped data survives in the new epoch");
  const em = Core.emptyState(D, ep);
  assert.equal(Core.isEmpty(em), true);
  same(em.epoch, ep);
  same(clean(em), em, "empty state is already clean");
  assert.equal(Core.hash("hello"), "4f9f2cab");
  assert.equal(Core.hash(""), "811c9dc5");
}
console.log("ok — merge");

// sync engine, against fake clouds
if (existsSync(here("sync.js"))) vm.runInContext(readFileSync(here("sync.js"), "utf8"), ctx);
{
  const { Sync } = ctx;
  assert.ok(Sync, "Sync is not defined");
  const D = { newPerDay: 15, sessionSize: 20, voice: "", voiceQc: "", accent: "fr", rate: 0.9, autoplay: true, tenses: ["pres", "pc"], theme: "auto" };
  const clean = (x) => Core.cleanState(x, D, ["pres", "pc", "fut"]);
  const st = (o = {}) => clean({ v: 2, ...o });
  const sv = (x) => JSON.parse(JSON.stringify(Core.syncView(x)));
  const day = "2026-11-01";
  const cloud = (...states) => ({ copies: states.map((s, i) => ({ text: typeof s === "string" ? s : JSON.stringify(Core.syncView(s)), ref: i })), next: 9, backup: null });
  const fake = (id, c) => {
    const p = { id, label: id, calls: [], pushes: 0, failPush: null,
      async pull() { p.calls.push("pull"); return { copies: c.copies.map((x) => ({ ...x })) }; },
      async push(text, refs) { p.calls.push("push"); if (p.failPush) { const e = p.failPush; p.failPush = null; throw e; } p.pushes++; c.backup = c.copies[0]?.text ?? null; c.copies = [{ text, ref: c.next++ }]; },
      async removeAll() { p.calls.push("removeAll"); c.copies = []; c.backup = null; },
      async signOut() { p.calls.push("signOut"); } };
    return p;
  };
  const fakeApp = (state) => { const a = { state, backup: null, failSave: false, onSaved: null, DEVICE: "devaaaaa",
    getState: () => a.state, replaceState(n) { a.backup = a.state; a.state = n; return !a.failSave; }, clean, empty: (ep) => Core.emptyState(D, ep) }; return a; };
  const mem = () => { let v = null; return { get: () => v, set: (x) => (v = x) }; };
  const engine = (app, answer = null) => {
    const e = { asks: [], status: {} };
    e.sync = Sync.create({ app, core: Core, ask: async (kind) => (e.asks.push(kind), answer), onStatus: (id, s) => (e.status[id] = s), store: mem() });
    return e;
  };
  const cloudState = (c) => clean(JSON.parse(c.copies[0].text));

  // two devices, two clouds, offline edits on both
  {
    const g = cloud(), a = cloud();
    const A = fakeApp(st({ srs: { x: { m: 10, n: 1 } }, logs: { devaaaaa: { [day]: { n: 2 } } } }));
    const B = fakeApp(st({ srs: { y: { m: 11, n: 1 } }, logs: { devbbbbb: { [day]: { n: 3 } } } }));
    const eA = engine(A), eB = engine(B);
    await eA.sync.link(fake("google", g)); await eA.sync.link(fake("apple", a));
    await eB.sync.link(fake("google", g)); await eB.sync.link(fake("apple", a));
    for (let i = 0; i < 2; i++) { await eA.sync.run(); await eB.sync.run(); }
    assert.deepEqual(sv(A.state), sv(B.state));
    assert.deepEqual(sv(cloudState(g)), sv(A.state));
    assert.deepEqual(sv(cloudState(a)), sv(A.state));
    assert.ok(A.state.srs.x && A.state.srs.y);
    assert.equal(Core.sumLogs(A.state.logs)[day].n, 5);
    assert.equal(eA.status.google, "synced");
  }
  // duplicate Drive files collapse into one merged copy
  {
    const g = cloud(st({ srs: { p: { m: 1 } } }), st({ srs: { q: { m: 1 } } }));
    const A = fakeApp(st()), e = engine(A);
    await e.sync.link(fake("google", g));
    assert.equal(g.copies.length, 1);
    assert.ok(cloudState(g).srs.p && cloudState(g).srs.q);
  }
  // unreadable and too-new copies are left alone; the other cloud still syncs
  {
    const g = cloud("{bad"), a = cloud(), A = fakeApp(st({ srs: { x: { m: 1 } } })), e = engine(A);
    const pg = fake("google", g);
    await e.sync.link(pg); await e.sync.link(fake("apple", a));
    assert.equal(e.status.google, "unreadable");
    assert.equal(pg.pushes, 0);
    assert.equal(g.copies[0].text, "{bad");
    assert.ok(cloudState(a).srs.x);
    const n = cloud(JSON.stringify({ v: 3, srs: { z: { m: 1 } } })), pn = fake("google", n), e2 = engine(fakeApp(st({ srs: { x: { m: 1 } } })));
    await e2.sync.link(pn);
    assert.equal(e2.status.google, "reload");
    assert.equal(pn.pushes, 0);
  }
  // erase everywhere, then a device on the old epoch
  const epochCase = async (answer) => {
    const g = cloud(), A = fakeApp(st({ srs: { x: { m: 1 } } })), B = fakeApp(st({ srs: { y: { m: 2 } } }));
    const eA = engine(A), eB = engine(B, answer);
    await eA.sync.link(fake("google", g)); await eB.sync.link(fake("google", g)); await eA.sync.run();
    const old = B.state;
    await eA.sync.eraseEverywhere();
    assert.ok(Core.isEmpty(A.state) && A.state.epoch.t > 0);
    const before = g.copies[0].text;
    await eB.sync.run();
    assert.deepEqual(eB.asks, ["epoch"]);
    return { g, A, B, eA, eB, old, before };
  };
  {
    const { g, B, eB, old, before } = await epochCase(null);
    assert.equal(g.copies[0].text, before, "nothing pushed while unanswered");
    assert.equal(B.state, old, "device unchanged while unanswered");
    assert.equal(eB.status.google, "attention");
  }
  {
    const { B, old } = await epochCase("erase");
    assert.ok(Core.isEmpty(B.state));
    assert.equal(B.backup, old);
  }
  {
    const { A, B, eA, old } = await epochCase("upload");
    assert.ok(B.backup === old && B.state.srs.x && B.state.srs.y);
    await eA.sync.run();
    assert.ok(A.state.srs.x && A.state.srs.y, "uploaded cards reach the erasing device");
    assert.deepEqual(A.state.epoch, B.state.epoch);
  }
  // an empty device on an old epoch adopts the cloud without asking
  {
    const g = cloud(st({ epoch: { id: "x", t: 5 }, srs: { z: { m: 9 } } })), C = fakeApp(st()), e = engine(C, "upload");
    await e.sync.link(fake("google", g));
    assert.deepEqual(e.asks, []);
    assert.ok(C.state.srs.z);
  }
  // first sign-in with progress on both sides asks once
  for (const answer of ["cloud", "add", null]) {
    const g = cloud(st({ srs: { z: { m: 9 } } })), a = cloud(), A = fakeApp(st({ srs: { x: { m: 1 } } })), e = engine(A, answer);
    const old = A.state;
    const linked = await e.sync.link(fake("google", g), { fresh: true });
    assert.deepEqual(e.asks, ["account"]);
    if (answer === "cloud") assert.ok(A.state.srs.z && !A.state.srs.x && A.backup === old);
    if (answer === "add") assert.ok(A.state.srs.z && A.state.srs.x);
    if (answer === null) { assert.equal(linked, false); assert.equal(A.state, old); assert.equal(e.status.google, "attention"); assert.deepEqual([...e.sync.linked()], []); continue; }
    await e.sync.link(fake("apple", a), { fresh: true });
    assert.deepEqual(e.asks, ["account"], "a second provider never asks");
  }
  // a push conflict re-pulls and retries
  {
    const g = cloud(st({ srs: { z: { m: 9 } } })), A = fakeApp(st({ srs: { x: { m: 1 } } })), e = engine(A), p = fake("google", g);
    p.failPush = Object.assign(new Error("changed"), { code: "conflict" });
    await e.sync.link(p);
    assert.equal(p.pushes, 1);
    assert.ok(cloudState(g).srs.x && cloudState(g).srs.z);
    assert.equal(p.calls.filter((c) => c === "pull").length, 2);
    assert.equal(e.status.google, "synced");
  }
  // deleting a cloud copy removes everything there, then signs out
  {
    const g = cloud(), A = fakeApp(st({ srs: { x: { m: 1 } } })), e = engine(A), p = fake("google", g);
    await e.sync.link(p);
    await e.sync.deleteCloud("google");
    assert.deepEqual(p.calls.slice(-2), ["removeAll", "signOut"]);
    assert.equal(g.copies.length, 0);
    assert.deepEqual([...e.sync.linked()], []);
  }
  // an account that couldn't load (offline at start) stays remembered until linked or signed out
  {
    const g = cloud(), A = fakeApp(st()), m = mem(), e = Sync.create({ app: A, core: Core, ask: async () => null, store: m });
    e.hold("apple");
    await e.link(fake("google", g));
    assert.deepEqual([...m.get().linked].sort(), ["apple", "google"]);
    assert.deepEqual([...e.linked()], ["google"]);
    await e.unlink("apple");
    assert.deepEqual([...m.get().linked], ["google"]);
  }
  // Review Focus 3: never push a state this device couldn't save
  {
    const g = cloud(st({ srs: { z: { m: 9 } } })), A = fakeApp(st({ srs: { x: { m: 1 } } })), e = engine(A), p = fake("google", g);
    A.failSave = true;
    await e.sync.link(p);
    assert.equal(e.status.google, "localfail");
    assert.equal(p.pushes, 0);
  }
  // a failing cloud reports its status without stopping the other
  {
    const g = cloud(), a = cloud(), A = fakeApp(st({ srs: { x: { m: 1 } } })), e = engine(A), p = fake("google", g);
    p.pull = async () => { throw Object.assign(new Error("net"), { code: "offline" }); };
    await e.sync.link(p); await e.sync.link(fake("apple", a));
    assert.equal(e.status.google, "offline");
    assert.equal(e.status.apple, "synced");
    p.pull = async () => { throw Object.assign(new Error("expired"), { code: "auth" }); };
    await e.sync.run();
    assert.equal(e.status.google, "reconnect");
    // a cloud that keeps refusing a save is not "offline": show the real error so it isn't hidden forever
    p.pull = async () => { throw Object.assign(new Error("BAD_REQUEST"), { code: "other" }); };
    await e.sync.run();
    assert.equal(e.status.google, "other");
  }
}
console.log("ok — sync engine");

// Google Drive provider, against a fake Drive and token helper
{
  const files = {}; let nextId = 1, calls = [], refreshReply = () => ({ status: 200, body: { access_token: "at", expires_in: 3599 } }), down = null, drive401 = 0;
  const sets = [];
  const store = {};
  const g = { console, URLSearchParams, encodeURIComponent, setTimeout, Promise,
    localStorage: { getItem: (k) => store[k] ?? null, setItem: (k, v) => (sets.push(k), (store[k] = String(v))), removeItem: (k) => delete store[k] } };
  g.window = g;
  const res = (status, body) => ({ ok: status >= 200 && status < 300, status, json: async () => (typeof body === "string" ? JSON.parse(body) : body), text: async () => (typeof body === "string" ? body : JSON.stringify(body)) });
  g.fetch = async (url, init = {}) => {
    const method = init.method || "GET", h = init.headers || {};
    calls.push({ url, method, auth: h.Authorization, body: init.body });
    if (down) { const d = down; if (d === "net") throw new TypeError("Failed to fetch"); return res(d, { error: { message: "x" } }); }
    if (url.startsWith("https://helper.test/")) {
      assert.equal(h["X-Requested-With"], "XmlHttpRequest");
      const b = JSON.parse(init.body);
      if (url.endsWith("/exchange")) return res(200, b.code === "c-consent" ? { access_token: "at", expires_in: 3599, refresh_token: "rt2" } : { access_token: "at", expires_in: 3599 });
      const r = refreshReply(); return res(r.status, r.body);
    }
    if (url === "https://oauth2.googleapis.com/revoke") return res(200, {});
    if (url.includes("/about?")) return res(200, { user: { displayName: "Parsa", emailAddress: "p@example.com" } });
    if (drive401 > 0) { drive401--; return res(401, { error: { message: "expired" } }); }
    let m;
    if ((m = url.match(/^https:\/\/www\.googleapis\.com\/drive\/v3\/files\?spaces=appDataFolder&q=([^&]*)/))) {
      const names = [...decodeURIComponent(m[1]).matchAll(/name='([^']+)'/g)].map((x) => x[1]);
      return res(200, { files: Object.entries(files).filter(([, f]) => names.includes(f.name)).sort((a, b) => a[1].t - b[1].t).map(([id, f]) => ({ id, createdTime: String(f.t) })) });
    }
    if ((m = url.match(/^https:\/\/www\.googleapis\.com\/drive\/v3\/files\/([^?]+)\?alt=media$/))) return files[m[1]] ? res(200, files[m[1]].content) : res(404, {});
    if ((m = url.match(/^https:\/\/www\.googleapis\.com\/upload\/drive\/v3\/files\/([^?]+)\?uploadType=media$/)) && method === "PATCH") { files[m[1]].content = init.body; return res(200, { id: m[1] }); }
    if (url === "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart" && method === "POST") {
      const meta = JSON.parse(init.body.match(/\r\n\r\n(\{.*?\})\r\n/s)[1]), content = init.body.split(/\r\n\r\n/)[2].replace(/\r\n--[^\r\n]*--\r\n$/, "");
      assert.equal(JSON.stringify(meta.parents), JSON.stringify(["appDataFolder"]));
      const id = "f" + nextId++; files[id] = { name: meta.name, content, t: nextId }; return res(200, { id });
    }
    if ((m = url.match(/^https:\/\/www\.googleapis\.com\/drive\/v3\/files\/([^?]+)$/)) && method === "DELETE") { delete files[m[1]]; return res(204, ""); }
    throw new Error("unexpected request " + method + " " + url);
  };
  g.google = { accounts: { oauth2: { initCodeClient: (o) => ({ requestCode: () => { g.lastPrompt = o.prompt; setTimeout(() => o.callback({ code: o.prompt === "consent" ? "c-consent" : "c1" })); } }) } } };
  vm.createContext(g);
  for (const f of ["sync-config.js", "sync-google.js"]) if (existsSync(here(f))) vm.runInContext(readFileSync(here(f), "utf8"), g);
  if (g.SYNC_CONFIG) g.SYNC_CONFIG.TOKEN_HELPER_URL = "https://helper.test";
  const SG = g.SyncGoogle;
  assert.ok(SG, "SyncGoogle is not defined");
  assert.equal(SG.restore(), null);
  // sign in: no refresh token the first time, so it asks once more with the consent screen
  const p = await SG.signIn();
  assert.equal(g.lastPrompt, "consent");
  assert.equal(store["cahier-fr-google"], "rt2");
  assert.equal(p.id, "google");
  // first push creates progress.json in the app folder
  assert.equal((await p.pull()).copies.length, 0);
  await p.push('{"a":1}', []);
  let copies = (await p.pull()).copies;
  assert.equal(copies.length, 1);
  assert.equal(copies[0].text, '{"a":1}');
  assert.ok(calls.some((c) => c.url === "https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name%3D'progress.json'&fields=files(id,createdTime)&orderBy=createdTime"));
  // a duplicate from another device: push keeps the oldest, backs it up, deletes the rest
  files.dup = { name: "progress.json", content: '{"b":1}', t: 999 };
  copies = (await p.pull()).copies;
  assert.equal(copies.length, 2);
  await p.push('{"a":1,"b":1}', copies.map((c) => c.ref));
  const byName = (n) => Object.values(files).filter((f) => f.name === n);
  assert.equal(byName("progress.json").length, 1);
  assert.equal(byName("progress.json")[0].content, '{"a":1,"b":1}');
  assert.equal(byName("progress.prev.json")[0].content, '{"a":1}');
  await p.push('{"c":1}', [(await p.pull()).copies[0].ref]);
  assert.equal(byName("progress.prev.json").length, 1, "one backup, updated in place");
  assert.equal(byName("progress.prev.json")[0].content, '{"a":1,"b":1}');
  // the access token renews within 5 minutes of expiry and never reaches localStorage
  refreshReply = () => ({ status: 200, body: { access_token: "short", expires_in: 200 } });
  const p2 = SG.restore();
  calls = [];
  await p2.pull(); await p2.pull();
  assert.equal(calls.filter((c) => c.url.endsWith("/refresh")).length, calls.filter((c) => c.url.startsWith("https://www.googleapis.com/")).length, "a token this close to expiry is renewed before each call");
  assert.ok(sets.every((k) => k === "cahier-fr-google"), "only the refresh token is stored");
  assert.ok(!Object.values(store).includes("short") && !Object.values(store).includes("at"));
  // Review Focus 4: error codes
  const code = async (fn) => { try { await fn(); return "none"; } catch (e) { return e.code; } };
  refreshReply = () => ({ status: 400, body: { error: "invalid_grant" } });
  assert.equal(await code(() => SG.restore().pull()), "auth");
  refreshReply = () => ({ status: 429, body: { error: "rate_limited" } });
  assert.equal(await code(() => SG.restore().pull()), "offline");
  refreshReply = () => ({ status: 503, body: { error: "upstream" } });
  assert.equal(await code(() => SG.restore().pull()), "offline");
  refreshReply = () => ({ status: 200, body: { access_token: "at", expires_in: 3599 } });
  down = "net"; assert.equal(await code(() => SG.restore().pull()), "offline");
  down = null;
  const p3 = SG.restore(); await p3.pull();
  down = 500; assert.equal(await code(() => p3.pull()), "offline");
  down = 429; assert.equal(await code(() => p3.pull()), "offline");
  down = null;
  calls = []; drive401 = 1;
  assert.equal(await code(() => p3.pull()), "none", "one 401 refreshes and retries");
  assert.equal(calls.filter((c) => c.url.endsWith("/refresh")).length, 1);
  drive401 = 2;
  assert.equal(await code(() => p3.pull()), "auth");
  drive401 = 0;
  // label
  assert.equal(await p3.loadLabel(), "Parsa (p@example.com)");
  down = 500; assert.equal(await SG.restore().loadLabel(), "Google Drive"); down = null;
  // remove everything, sign out without revoking, disconnect revokes
  await p3.removeAll();
  assert.equal(byName("progress.json").length + byName("progress.prev.json").length, 0);
  calls = [];
  await p3.signOut();
  assert.equal(store["cahier-fr-google"], undefined);
  assert.ok(!calls.some((c) => c.url.includes("revoke")));
  store["cahier-fr-google"] = "rt2";
  await SG.disconnectAll();
  const rv = calls.find((c) => c.url === "https://oauth2.googleapis.com/revoke");
  assert.ok(rv && rv.method === "POST" && String(rv.body).includes("token=rt2"));
  assert.equal(store["cahier-fr-google"], undefined);
}
console.log("ok — google provider");

// iCloud provider, against a fake CloudKit
{
  const recs = {}, assets = {}, store = {};
  let tag = 1, failNext = null, signedIn = false, signOuts = 0;
  let ticks = [];
  const g = { console, setTimeout, clearTimeout, Promise, Blob, TextEncoder, JSON,
    setInterval: (fn, ms) => ticks.push({ fn, ms }) - 1, clearInterval: (i) => { if (ticks[i]) ticks[i].fn = null; },
    localStorage: { getItem: (k) => store[k] ?? null, setItem: (k, v) => (store[k] = String(v)), removeItem: (k) => delete store[k] } };
  g.window = g;
  g.fetch = async (url) => { if (!assets[url]) throw new TypeError("Failed to fetch"); return { ok: true, status: 200, text: async () => assets[url] }; };
  const out = (records, errors = []) => ({ records, errors, hasErrors: errors.length > 0 });
  const trip = () => { const f = failNext; failNext = null; if (f) throw f; };
  const copy = (r) => JSON.parse(JSON.stringify(r));
  const db = {
    async fetchRecords(names) { trip(); const ok = names.filter((n) => recs[n]); return out(ok.map((n) => copy(recs[n])), names.filter((n) => !recs[n]).map((n) => ({ ckErrorCode: "NOT_FOUND", recordName: n }))); },
    async saveRecords([r]) {
      trip();
      const cur = recs[r.recordName];
      if ((cur ? cur.recordChangeTag : undefined) !== r.recordChangeTag) return out([], [{ ckErrorCode: "CONFLICT", recordName: r.recordName }]);
      const fields = { data: { value: r.fields.data.value } };
      if (r.fields.blob && r.fields.blob.value) { const url = "https://cvws.test/" + tag; assets[url] = await r.fields.blob.value.text(); fields.blob = { value: { downloadURL: url } }; }
      recs[r.recordName] = { recordName: r.recordName, recordType: r.recordType, recordChangeTag: "t" + tag++, fields };
      return out([copy(recs[r.recordName])]);
    },
    async deleteRecords(names) { trip(); names.forEach((n) => delete recs[n]); return out([]); },
  };
  // CloudKit tokens are single-use: a dead one in the store makes setUpAuth fail outright
  // whenUserSignsIn: Apple's popup stores the new session token through our token store
  // like CloudKit, setUpAuth asks fetchCurrentUserIdentity on the container
  let whoCalls = 0;
  const container = { privateCloudDatabase: db, async fetchCurrentUserIdentity() { whoCalls++; if (store["cahier-fr-ck"] === "dead") throw { ckErrorCode: "AUTHENTICATION_FAILED" }; return signedIn ? { userRecordName: "_u" } : null; },
    setUpAuth() { return this.fetchCurrentUserIdentity(); }, whenUserSignsIn: async () => ((signedIn = true), (store["cahier-fr-ck"] = "fresh"), { userRecordName: "_u" }), signOut: () => signOuts++ };
  g.CloudKit = { configure: (c) => (g.ckConfig = c), getDefaultContainer: () => container };
  vm.createContext(g);
  for (const f of ["sync-config.js", "sync-apple.js"]) if (existsSync(here(f))) vm.runInContext(readFileSync(here(f), "utf8"), g);
  const SA = g.SyncApple;
  assert.ok(SA, "SyncApple is not defined");
  await SA.load();
  const cfg = g.ckConfig, c0 = cfg.containers[0];
  assert.equal(c0.containerIdentifier, "iCloud.com.parsakp.petitfrench");
  assert.equal(c0.apiTokenAuth.persist, true);
  assert.equal(c0.apiTokenAuth.signInButton.id, "apple-sign-in-button");
  cfg.services.authTokenStore.putToken("iCloud.com.parsakp.petitfrench", "tok");
  assert.equal(store["cahier-fr-ck"], "tok");
  assert.equal(cfg.services.authTokenStore.getToken("iCloud.com.parsakp.petitfrench"), "tok");
  assert.equal(await SA.restore(), null, "not signed in yet");
  const p = await SA.signIn();
  assert.equal(p.id, "apple");
  assert.ok(await SA.restore(), "restores once signed in");
  // pull / push with change tags
  assert.equal((await p.pull()).copies.length, 0);
  await p.push('{"a":1}', []);
  let c = (await p.pull()).copies;
  assert.equal(c.length, 1);
  assert.equal(c[0].text, '{"a":1}');
  await p.push('{"b":1}', [c[0].ref]);
  assert.equal(recs["progress-prev"].fields.data.value, '{"a":1}');
  assert.equal(recs.progress.fields.data.value, '{"b":1}');
  const code = async (fn) => { try { await fn(); return "none"; } catch (e) { return e.code; } };
  assert.equal(await code(() => p.push('{"c":1}', [c[0].ref])), "conflict", "stale change tag");
  // Review Focus 5: large state goes into the asset
  const big = '"' + "x".repeat(699999) + '"';
  assert.equal(new TextEncoder().encode(big).length, 700001);
  c = (await p.pull()).copies;
  await p.push(big, [c[0].ref]);
  assert.equal(recs.progress.fields.data.value, "");
  assert.ok(recs.progress.fields.blob);
  c = (await p.pull()).copies;
  assert.equal(c[0].text, big);
  await p.push('{"small":1}', [c[0].ref]);
  assert.equal((await p.pull()).copies[0].text, '{"small":1}', "a later small save wins over the old asset");
  assert.equal(recs["progress-prev"].fields.data.value, "", "the large backup is kept as an asset too");
  // errors
  failNext = { ckErrorCode: "AUTHENTICATION_REQUIRED" };
  assert.equal(await code(() => p.pull()), "auth");
  failNext = { ckErrorCode: "NETWORK_ERROR" };
  assert.equal(await code(() => p.pull()), "offline");
  failNext = new TypeError("Failed to fetch");
  assert.equal(await code(() => p.pull()), "offline");
  failNext = { ckErrorCode: "THROTTLED" };
  assert.equal(await code(() => p.pull()), "offline");
  // two calls at once never share a token: CloudKit requests run one at a time
  let inFlight = 0, most = 0;
  const realFetch = db.fetchRecords;
  db.fetchRecords = async (n) => { inFlight++; most = Math.max(most, inFlight); await new Promise((r) => setTimeout(r, 5)); try { return await realFetch(n); } finally { inFlight--; } };
  await Promise.all([p.pull(), p.pull(), p.push('{"q":1}', [(await p.pull()).copies[0]?.ref])].map((x) => x.catch(() => {})));
  assert.equal(most, 1, "CloudKit calls overlapped");
  // CloudKit's own identity check (e.g. its 14-minute re-check) waits for our calls too
  const order = [];
  db.fetchRecords = async (n) => { order.push("start"); await new Promise((r) => setTimeout(r, 5)); order.push("end"); return realFetch(n); };
  const before = whoCalls;
  await Promise.all([p.pull(), container.fetchCurrentUserIdentity().then(() => order.push("who"))]);
  assert.deepEqual(order, ["start", "end", "who"], "CloudKit's identity check overlapped a call");
  assert.equal(whoCalls, before + 1);
  db.fetchRecords = realFetch;
  // keep-alive: one live 20-minute timer that spends the token through serial(), and none after sign-out
  const live = () => ticks.filter((t) => t.fn);
  assert.equal(live().length, 1, "one keep-alive timer per page");
  assert.equal(live()[0].ms, 20 * 60 * 1000);
  const w0 = whoCalls;
  live()[0].fn();
  await new Promise((r) => setTimeout(r, 0));
  assert.equal(whoCalls, w0 + 1, "keep-alive asks who's signed in");
  // reconnect after the stored token died (expired, or used twice): clear it so Apple shows its sign-in button
  store["cahier-fr-ck"] = "dead"; signedIn = false;
  assert.equal(await code(() => SA.restore()), "auth", "a dead token means reconnect");
  const again = await SA.signIn();
  assert.equal(again.id, "apple", "reconnect works with a dead token stored");
  // remove and sign out
  await p.removeAll();
  assert.equal(Object.keys(recs).length, 0);
  await p.signOut();
  assert.equal(store["cahier-fr-ck"], undefined);
  assert.equal(signOuts, 1);
  assert.equal(live().length, 0, "keep-alive stops on sign-out");
}
console.log("ok — apple provider");

// security rule: only our own scripts plus the two sign-in SDKs; no inline scripts or handlers to allow
{
  const html = readFileSync(here("index.html"), "utf8");
  const csp = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)">/)?.[1];
  assert.ok(csp, "index.html has no CSP meta");
  const dir = Object.fromEntries(csp.split(";").map((d) => d.trim().split(/\s+/)).filter((d) => d[0]).map(([k, ...v]) => [k, v.join(" ")]));
  assert.equal(dir["script-src"], "'self' https://accounts.google.com/gsi/ https://cdn.apple-cloudkit.com");
  assert.equal(dir["style-src"], undefined, "app.js writes inline styles");
  for (const h of ["https://www.googleapis.com", "https://oauth2.googleapis.com", "https://petitfrench-token-helper.token-helper.workers.dev", "https://api.apple-cloudkit.com"]) assert.ok(dir["connect-src"].includes(h), `connect-src misses ${h}`);
  assert.ok(!/<script>[^<]/.test(html), "inline <script> in index.html");
  assert.ok(!/ on[a-z]+="/.test(readFileSync(here("app.js"), "utf8")), "inline on…= handler in app.js");
}
console.log("ok — csp");
