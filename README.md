# Petit à petit français

A French practice app for A1–A2 learners: lessons, spaced-repetition review, verb drills in 8 tenses, dictation and cheatsheets, with France and Québec voices.

**Use it:** https://petitfrench.parsakp.com/ (the old github.io address forwards there)

## What's inside

- **Course:** units of short lessons that build from greetings to everyday conversations.
- **Review:** spaced repetition that schedules each sentence, verb and word for when you're about to forget it.
- **Verb drills** in 8 tenses: présent, passé composé, futur proche, passé récent, impératif, imparfait, futur simple and conditionnel présent.
- **Dictation and listening** with a France voice and a Québec voice, side by side.
- **Cheatsheets** for grammar and vocabulary, with search.
- **Works offline** and installs as an app (PWA). Light and dark themes.

## How it works

It is a static site with no build step and no server. Progress is saved in the browser (Settings › Export progress to back it up). Learners can optionally sign in with Google or Apple to sync it across devices, through their own Google Drive or iCloud. See the [privacy policy](privacy.html).

## Run locally

Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 8000
```

## Tests

```sh
node test.mjs
node token-helper/test.mjs
```

The first checks the conjugation engine, grading, the scheduler, saved-progress merging, the sync engine, and that every sentence, verb, word and lesson in the data is valid. The second checks the Google token helper.

## Files

| File | What it is |
|---|---|
| `core.js` | Conjugation engine, grading, spaced-repetition scheduler |
| `data.js`, `grammar_extra.js`, `vocab_extra.js` | Verbs, sentences, words, grammar sheets and the course units |
| `app.js` | The app: routes, lessons, practice sessions, cheatsheets, settings (including About and the version number), the sync screens |
| `sync.js` | Sync engine: pulls each linked cloud, merges, saves, pushes |
| `sync-config.js` | Public sign-in IDs (Google client ID, CloudKit container and API token, token helper URL) |
| `sync-google.js`, `sync-apple.js` | Google Drive and iCloud providers, loaded only when someone signs in |
| `token-helper/` | A small Cloudflare Worker that holds the Google client secret and swaps sign-in codes for tokens |

## Cloud sync setup

Sync is optional for learners and needs these accounts, set up once:

1. **Google Cloud:** a project with the Drive API enabled, and an OAuth client of type **Web** whose JavaScript origins are `https://petit-a-petit-francais.github.io` and `https://petitfrench.parsakp.com`. The consent screen asks only for the `drive.appdata` scope. Put the client ID in `sync-config.js` and `token-helper/wrangler.toml`.
2. **Apple:** an iCloud container (`iCloud.com.parsakp.petitfrench`) with a record type `Progress` that has the fields `data` (String) and `blob` (Asset). Add a CloudKit web API token with the "postMessage" sign-in callback, allowed for the same two origins, and put it in `sync-config.js`. CloudKit rejects `http://localhost`, so test Apple sign-in on an allowed `https` origin.
3. **Token helper:** `cd token-helper && npx wrangler deploy`, then `npx wrangler secret put GOOGLE_CLIENT_SECRET`. The secret is never committed. Put the Worker's URL in `sync-config.js` and in the `connect-src` of the security rule in `index.html`.
4. **Before inviting learners:**
   - Deploy the CloudKit schema to **Production** and set `CK_ENV` to `"production"` in `sync-config.js`.
   - Publish the Google consent screen **In production**. While it's in Testing, Google expires refresh tokens after 7 days, so everyone would have to reconnect weekly.

## Licence

The code (every file in this repo except the learning content, the logo and the third-party files: `fonts/`, `licenses/` and the Lucide icon paths in `app.js`) is © 2026 Parsa Kamalipour, licensed under the [GNU General Public License v3.0 or later](LICENSE). You may use, study, change and share it, but if you distribute a modified version, you must release its source under the same licence.

The learning content (the practice sentences, translations, grammar sheets, vocabulary lists and course structure in `data.js`, `grammar_extra.js` and `vocab_extra.js`) and the logo (`logo.svg`, `icons/`) are © 2026 Parsa Kamalipour, all rights reserved. They are not covered by the GPL and may not be copied or reused without permission.

Third-party components keep their own licences; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

Petit à petit français is an independent project. It is not affiliated with, endorsed by or sponsored by any publisher, school, course or podcast. The example sentences and explanations are written for this app.

## Feedback

Found a wrong translation or a bug? [Open an issue](https://github.com/Petit-a-petit-francais/Petit-a-petit-francais.github.io/issues/new). The app links here from Settings › About.
