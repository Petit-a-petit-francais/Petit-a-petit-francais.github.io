# Petit à petit français

A French practice app for A1–A2 learners: lessons, spaced-repetition review, verb drills in 8 tenses, dictation and cheatsheets, with France and Québec voices.

**Use it:** https://petit-a-petit-francais.github.io/

It is a static site with no build step and no server. Progress is saved in the browser (Settings › Export progress to back it up). See the [privacy policy](privacy.html).

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

## Licence

The code is under the [MIT License](LICENSE). The learning content (sentences, translations, grammar sheets, course structure) and the logo are © 2026 Parsa Kamalipour, all rights reserved. Third-party components are listed in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

Petit à petit français is an independent project. It is not affiliated with, endorsed by or sponsored by any publisher, school, course or podcast. The example sentences and explanations are written for this app.
