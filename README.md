# Petit à petit français

A French practice app built from my A1/A2 course notes and textbooks: lessons, spaced-repetition review, verb drills in 8 tenses, dictation and cheatsheets, with France and Québec voices.

**Use it:** https://petit-a-petit-francais.github.io/

It is a static site with no build step and no server. Progress is saved in the browser (Settings › Export progress to back it up).

## Run locally

Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 8000
```

## Tests

```sh
node test.mjs
```

Checks the conjugation engine, grading, the scheduler, and that every sentence, verb, word and lesson in the data is valid.

## Files

| File | What it is |
|---|---|
| `core.js` | Conjugation engine, grading, spaced-repetition scheduler |
| `data.js`, `grammar_extra.js`, `vocab_extra.js` | Verbs, sentences, words, grammar sheets and the course units |
| `app.js` | The app: routes, lessons, practice sessions, cheatsheets, settings |
| `COVERAGE.md` | How the content maps to the source notes and books |
