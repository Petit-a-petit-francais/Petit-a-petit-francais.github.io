# Contributing

Thanks for helping make Petit à petit français better. The most useful help is reporting mistakes in the French, bugs, and voices that sound wrong on your device.

## Report a mistake or a bug

[Open an issue](../../issues/new/choose) and pick a template:

- **Content mistake:** a wrong translation, conjugation, accent or explanation. Quote the sentence and say where you saw it.
- **Bug:** something broken. Say your device, browser and what you expected.
- **Idea:** a feature or a topic you'd like covered.

Questions go in [Discussions](../../discussions).

## Learning content

The sentences, translations, grammar sheets, vocabulary and course structure (`data.js`, `grammar_extra.js`, `vocab_extra.js`) and the logo are **not** open source (see the [Licence](README.md#licence) section). Please report content fixes as issues instead of pull requests, and I'll make the change.

## Code changes

The code is GPL-3.0-or-later. By opening a pull request you agree your change is released under that licence.

1. Open an issue first for anything bigger than a small fix, so we can agree on the approach.
2. Fork, then create a branch: `fix/<issue>-short-name` or `feat/<issue>-short-name`.
3. There is no build step. Serve the folder (`python3 -m http.server 8000`) and try your change in a browser, in light and dark mode and at phone width.
4. Run the tests and make sure they pass:

   ```sh
   node test.mjs
   node token-helper/test.mjs
   ```

5. Use [Conventional Commits](https://www.conventionalcommits.org/) with the issue number, e.g. `fix: keep the voice after reload (#42)`.
6. Open a pull request, fill in the template and link the issue with `Closes #<number>`.

### Guidelines

- No new dependencies, frameworks or build tools. The app is plain HTML, CSS and JavaScript.
- Keep it accessible: keyboard use, visible focus, labels, enough contrast (WCAG 2.2 AA).
- Nothing leaves the learner's device except sync to their own Google Drive or iCloud. Don't add analytics or third-party requests.
- If you add a file the app loads, add it to the list in `sw.js` so it works offline.

## Code of conduct

Everyone taking part agrees to the [Code of Conduct](CODE_OF_CONDUCT.md).
