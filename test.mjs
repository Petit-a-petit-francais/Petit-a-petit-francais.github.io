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
    srs: { a: { r: 1, e: "2.5", x: "<img onerror=alert(1)>" }, b: "junk" },
    log: { "2026-11-04": { n: "<b>1</b>", ok: 3 }, "<script>": { n: 1 } },
    lessons: { l1: 123, l2: "<i>" },
    settings: { newPerDay: "<svg>", sessionSize: 999, accent: "<x>", theme: "dark", tenses: ["pc", "<y>"], rate: 3, autoplay: "yes", voice: 5 },
  }, D, ["pres", "pc", "fut"]);
  assert.equal(JSON.stringify(c.srs), '{"a":{"r":1,"e":2.5}}');
  assert.equal(JSON.stringify(c.log), '{"2026-11-04":{"n":0,"ok":3,"nw":0}}');
  assert.equal(JSON.stringify(c.lessons), '{"l1":123}');
  assert.equal(JSON.stringify(c.settings), '{"newPerDay":15,"sessionSize":100,"voice":"","voiceQc":"","accent":"fr","rate":1.2,"autoplay":true,"tenses":["pc"],"theme":"dark"}');
  assert.equal(JSON.stringify(Core.cleanState({}, D, ["pres"]).settings.tenses), '["pres","pc"]');
}
console.log("ok — progress validation");
