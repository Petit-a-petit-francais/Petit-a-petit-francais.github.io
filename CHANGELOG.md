# Changelog

All notable changes to this project are listed here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/). The version shown in Settings › About comes from `VERSION` in `app.js`.

## [Unreleased]

### Added

- Natural France and Québec voices (Azure Denise and Sylvie) in every browser, including Safari, iPhone, Firefox and Linux. Each phrase is made once and cached; the device voice is the fallback, and device voices can still be picked in Settings (#42).
- Support links (GitHub Sponsors, Buy Me a Coffee) in Settings › About, the README and the repo's Sponsor button (#46).

## [1.0.0] - 2026-11-07

First tagged release.

### Added

- Course units with lessons, spaced-repetition review, verb drills in 8 tenses, dictation and searchable cheatsheets, with France and Québec voices.
- Optional sync of progress through the learner's own Google Drive or iCloud (#23), with one-tap sign-in in a compact window (#37).
- Session 16 content: wishes with the conditionnel (#21).
- Cahier redesign with a new visual identity (#29) and a Liquid Glass navigation layer (#31).
- About section in Settings with version, links and a way to report problems (#39).

### Changed

- The site lives at https://petitfrench.parsakp.com/ (#24).
- Code relicensed under GPL-3.0-or-later; learning content and logo stay all rights reserved (#8).
- Accessibility to WCAG 2.2 (#15) and polish for Windows, Android and Linux (#14).

### Fixed

- Fast cheatsheet tabs and search with highlighted matches (#17).
- Accurate voice help for Safari, iPhone and iPad (#19).
- iCloud sign-in help (#27), staying signed in to iCloud and showing real sync errors (#33).
- No focus line around the page (#35).

[Unreleased]: https://github.com/Petit-a-petit-francais/Petit-a-petit-francais.github.io/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/Petit-a-petit-francais/Petit-a-petit-francais.github.io/releases/tag/v1.0.0
