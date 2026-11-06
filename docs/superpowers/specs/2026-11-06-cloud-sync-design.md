# Cloud sync with Google and iCloud: design

Issue #22 · 6 November 2026

## Intent

Parsa studies on a phone and a laptop, and progress made on one device doesn't show up on the other. Today everything (SRS cards, daily log, finished lessons, settings) is one JSON blob in `localStorage` under `cahier-fr-v1` ([app.js](../../../app.js) `load`/`save`).

This feature adds optional sign-in so that blob syncs through **the learner's own** Google Drive or iCloud. There is no server and no database of ours, and the developer can never see anyone's data.

## Goals

- Progress follows the learner between devices automatically.
- Sign in with **Google**, **Apple**, or **both linked at once**.
- Nothing is ever lost or double-counted when two devices practice offline and sync later.
- It survives app updates. Data saved by any older version still loads, and an older cached version never damages data written by a newer one.
- Import/export keep working, and import now **merges** instead of replacing.

## Non-goals

- Any server, backend, or database we run. GitHub Pages stays the only host.
- Accounts, profiles, sharing, leaderboards, or anything social.
- Real-time sync between two devices open at the same moment. Syncing on open, on focus and after changes is enough.
- Syncing voice choice (`voice`, `voiceQc`) and speech speed (`rate`). Those depend on the device.

## Anti-goals (a failure even if it "works")

- **Corrupted or lost progress**, from any combination of offline use, two clouds, imports, undo, erasing, or version skew.
- A visitor who never signs in contacting Google or Apple. Today's no-third-party-request promise holds for them.
- Breaking offline use, or making the site feel slower.
- Nagging. Sign-in is recommended once, then it stays out of the way.

## Decisions made with Parsa

| Topic | Decision |
|---|---|
| Sign-in required? | No. It's optional, and recommended with a dismissible card on Home after the learner's **first finished session**. Sign-in also lives in Settings. |
| Conflicts | **Merge both sides.** Nothing from either device is lost. |
| When to sync | Automatically: on open, when the tab regains focus or comes back online, and after each finished session or settings change. |
| What syncs | All progress (`srs`, `log`, `lessons`), plus the settings `newPerDay`, `sessionSize`, `tenses`, `theme`, `accent`, `autoplay`. `voice`, `voiceQc` and `rate` stay on each device. |
| Third-party scripts | Loaded **only when needed**: on tapping sign-in, or on start for a device already signed in. Privacy page gets a new section. |
| Accounts | Google and Apple **can both be linked at once**. Each cloud holds a full merged copy. |
| Different account signs in on a device that already has progress | **Ask first**: "Add this device's progress to this account, or start from this account's cloud progress only?" |
| Linking a second provider while one is already linked | *My call:* merge without asking, since it's the same person adding a second cloud. The "ask first" prompt only appears when a device with progress signs in and no provider is currently linked. |
| Sign out | Deletes nothing. It keeps local data and warns that this device will no longer sync. |
| Delete cloud copy | Available per linked account, with a warning. |
| Erase local data while signed out | Allowed, with a note that signing in again will load the cloud copy back. |
| Import | Merges into local progress (never replaces). If signed in, the merged result then syncs. |
| Export | Stays. Exports the full local state. |

## How it works

### Providers

**Google**: Google Identity Services token client (`accounts.google.com/gsi/client`) with the `https://www.googleapis.com/auth/drive.appdata` scope. One file, `progress.json`, in the hidden `appDataFolder`, read and written through the Drive v3 REST API with `fetch`. The learner doesn't see it among their Drive files, and our app can't see anything else in their Drive.
- Browser access tokens last about an hour, with no refresh token. When one expires, try a silent re-request. If the browser needs a user gesture, show a quiet "Reconnect Google" button in the sync status instead of a popup.

**Apple**: CloudKit JS (`cdn.apple-cloudkit.com/ck/2/cloudkit.js`), a container in Parsa's Apple Developer account, the **private** database, and one record (type `Progress`, fixed record name) holding the same JSON in a string or asset field. The learner signs in with Apple's own sign-in button. CloudKit record change tags give conditional saves (see "Writes" below).

**Setup Parsa does once** (the builder writes a short checklist in the README):
- Google Cloud project with an OAuth client ID (Web), authorized origin `https://petit-a-petit-francais.github.io`, a consent screen, and app verification/publishing (the builder confirms what `drive.appdata` requires).
- CloudKit container with a web API token, allowed origin as above, and the `Progress` schema deployed to production.

The client ID, container ID and API token are public identifiers, so committing them is fine.

### Loading only when needed

Neither SDK appears in `index.html`. A small loader injects the script tag on demand: when a sign-in button is tapped, or on start if `localStorage` remembers a linked provider. The service worker already ignores cross-origin requests, so no change is needed there. Offline, sync waits quietly and retries when the device is back online.

### Data format and merging (the core of this feature)

The merge must be **idempotent, commutative and associative**: merging the same copy twice, in any order, from any number of devices or clouds gives the same result. That property alone covers two devices, two clouds, re-imports and retries. The merge is a pure function in [core.js](../../../core.js) (`Core.merge(a, b)`) and runs on the output of `Core.cleanState`.

The stored state gains a schema version `v` (current blob = version 1, new format = 2) and a per-device ID (random, kept in its own local key, never synced as "this device").

- **`srs` (per card):** each change stamps the card with a modified time `m`. Merge keeps the card with the larger `m`, breaking ties deterministically (larger `n`, then a stable comparison of the JSON). Old cards without `m` use `last` (or 0).
  - **Why `m` and not `last`:** undo ([app.js](../../../app.js) around line 353) restores the previous card state, which has an older `last`. With `last` as the key, a cloud copy synced before the undo would bring the undone review back. Undo must stamp a fresh `m`.
- **`log` (daily counts):** summing two devices' copies would double-count every time they sync. So the log is stored **per device**: `logs[deviceId][day] = {n, ok, nw, m}`. Merge keeps the entry with the larger `m` per (device, day), so a device's own latest write wins, and undo's decrement survives. The app displays `log` as the sum across devices. Migration moves the existing `log` into this device's slot.
- **`lessons`:** keep the larger timestamp per lesson.
- **Synced settings:** each synced setting gets its own changed-at time, and the newer value wins. Device-only settings are never sent.
- **Unknown fields:** merge and clean keep fields they don't recognise instead of dropping them, so a newer version's additions survive a round trip.

### Version safety

- Every load passes through `Core.cleanState` (already the case) plus a v1→v2 migration.
- If the cloud copy has a **higher `v` than this app understands**, the app does **not write** to that cloud. It shows "A newer version of the site saved your progress. Reload to update." The service worker is network-first, so one reload normally fixes it. This rule is what stops an old cached tab from damaging new data.
- Exports carry `v` and the device ID. Old exports with no device ID get a device ID derived from a hash of their log contents, so importing the same old file twice doesn't double-count.

### Writes and corruption safeguards

- A sync is: pull every linked cloud → merge each with local → save locally → push the merged result to each cloud that differs.
- **Never write anything that didn't parse and clean.** If a cloud copy fails to parse, leave that cloud untouched, keep syncing the others, and show an error in the sync status. Don't overwrite the bad copy automatically. Offer "Replace cloud copy with this device's progress" as an explicit action.
- **Conditional writes:** CloudKit uses its record change tag. Drive has no reliable precondition, so read, merge, write, then re-read and re-merge if the copy changed in between. Because merge is idempotent, any race still converges on the next sync.
- **Last-known-good backups:** before replacing local state, copy the previous state to `cahier-fr-v1-backup`. Each cloud keeps one previous copy (`progress.prev.json` / a second record). Neither is exposed in the UI for now, but both make recovery possible.
- Keep `save()` cheap. Push in the background after a session or settings change, debounced, never on every keystroke or card.

### Deleting

- **Delete cloud copy** (per account): the warning says that other signed-in devices still hold the progress locally. The cloud record is replaced with a small marker `{v, erasedAt}` rather than removed. *My call:* when another device later sees a marker newer than its last sync, it asks: "Your cloud progress was deleted from another device. Delete it here too, or upload this device's progress again?" Without this, the next sync from any other device would quietly bring the data back.
- **Erase all progress while signed out:** erases local only, noting that signing in again loads the cloud copy back.
- **Erase while signed in** — *my call:* the dialog offers "This device only (it will reload from the cloud on next sync)" or "This device and the cloud copy". The second uses the cloud marker above.

### UI

All in the existing visual language of [style.css](../../../style.css).

- **Settings → "Sync across devices" card** replaces the "Progress is saved in this browser only" note. It has a Google button and an Apple button. Each linked account shows the account name or email if available, a status line ("Synced just now" / "Offline, will sync later" / "Reconnect Google" / error), and **Sign out** and **Delete cloud copy** actions with their warnings. Export, Import and Erase stay in this card.
- **Home nudge:** after the first finished session, a dismissible card reads "Keep your progress on all your devices: sign in with Google or Apple." Dismissing it, or signing in, hides it for good on that device.
- Every new control meets the site's WCAG 2.2 bar: keyboard reachable, visible focus, real buttons, and status messages announced through an `aria-live` region (reuse `#msg`).

### Privacy page

Add a "Syncing (optional)" section. If you sign in, a copy of your progress is stored in your own Google Drive app folder or iCloud private database, under Google's or Apple's privacy policy. We can't read it. Google and Apple scripts load only if you use sign-in. Here's how to delete the cloud copy. Update "Last updated" and the "no accounts" line in the intro.

## Testing

- `test.mjs`: merge is idempotent, commutative and associative on generated states; an offline session on two devices merges without loss; re-importing the same file (old and new format) doesn't double-count; undo after a sync stays undone; v1→v2 migration; unknown fields survive; garbage input is rejected and nothing is written; higher-`v` cloud data blocks writes.
- Manual, in headless Chrome over CDP (never the user's own browser): sign-in flow with a test Google account and a CloudKit development container, two browser profiles as "two devices", offline toggle. Real Safari/iPhone is needed to check Apple sign-in. Parsa does that check.

## Left to the builder

- Exact module layout. Keep the sync code in its own file (e.g. `sync.js`), add it to the service worker's `APP` list, and bump `CACHE`.
- Debounce timing, retry/backoff details, and how status strings are worded beyond the ones above.
- Whether the CloudKit field is a string or an asset (state size decides).
- Confirming Google's verification requirements for `drive.appdata`, and telling Parsa if anything costs money or takes review time.
