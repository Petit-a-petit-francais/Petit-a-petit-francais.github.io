# Cloud sync with Google and iCloud: design

Issue #22 · 6 November 2026 · revised after review (PR #23)

## Intent

Parsa studies on a phone and a laptop, and progress made on one doesn't show up on the other. Today everything (SRS cards, daily log, finished lessons, settings) is one JSON blob in `localStorage` under `cahier-fr-v1` ([app.js](../../../app.js) `load`/`save`).

This feature adds optional sign-in so that progress syncs through **the learner's own** Google Drive or iCloud. There is no server and no database of ours, and the developer can never see anyone's data.

## Goals

- Progress follows the learner between devices with as little effort as possible.
- Sign in with **Google**, **Apple**, or **both linked at once**.
- Nothing is ever lost or double-counted when devices practice offline and sync later.
- It survives app updates. Data saved by any older version still loads, and an older cached version never damages data written by a newer one.
- Import/export keep working, and import now **merges** instead of replacing.

## Non-goals

- Any server, backend, or database we run. GitHub Pages stays the only host.
- Accounts, profiles, sharing, leaderboards, or anything social.
- Real-time sync between two devices open at the same moment.
- Syncing voice choice (`voice`, `voiceQc`) and speech speed (`rate`). Those depend on the device.

## Anti-goals (a failure even if it "works")

- **Corrupted or lost progress**, from any combination of offline use, two clouds, imports, erasing, clock differences or version skew.
- A visitor who never signs in contacting Google or Apple. Today's no-third-party-request promise holds for them.
- Breaking offline use, or making the site feel slower.
- "Keep this copy or that one?" prompts that throw away the side not picked. This is Anki's best-known sync complaint.
- Nagging.

## Decisions made with Parsa

| Topic | Decision |
|---|---|
| Sign-in required? | No. It's optional, and recommended with a dismissible card on Home after the learner's **first finished session** (Duolingo does the same). Sign-in also lives in Settings. |
| Conflicts | **Merge both sides automatically.** Nothing from either device is lost. |
| When to sync | Automatically: on open, when the tab regains focus or comes back online, and after each finished session or settings change. |
| What syncs | All progress (`srs`, daily log, `lessons`), plus the settings `newPerDay`, `sessionSize`, `tenses`, `theme`, `accent`, `autoplay`. `voice`, `voiceQc` and `rate` stay on each device. |
| Third-party scripts | Loaded **only when needed**: on tapping sign-in, or on start for a device already signed in. Privacy page gets a new section. |
| Accounts | Google and Apple **can both be linked at once**. Each cloud holds a full merged copy. |
| A different account signs in on a device that already has progress, with nothing linked | **Ask first**: "Add this device's progress to this account, or start from this account's cloud progress only?" The dialog says that neither choice loses anything: the old account keeps its copy, and this device's copy is backed up first. |
| Sign out | Deletes nothing. It keeps local data and warns that this device will no longer sync. |
| Delete cloud data | Available, with a warning. |
| Erase local data while signed out | Allowed, with a note that signing in again loads the cloud copy back. |
| Import | Merges into local progress (never replaces). If signed in, the merged result then syncs. |
| Export | Stays. Exports the full local state. |

## How it works

### Providers

**Google**: Google Identity Services token client (`accounts.google.com/gsi/client`) with the `drive.appdata` scope. One file, `progress.json`, in the hidden `appDataFolder`, read and written with Drive v3 REST and `fetch`.

- **Tokens:** a browser-only app gets a token that lasts about an hour, with no refresh token, and a renewal opens Google's popup, which needs a tap. To keep this out of the way:
  - Keep the token **in memory only**, never in `localStorage`.
  - When it has expired, renew it on the learner's **first tap after opening** the site (for example on Start), with `prompt: ""` and the account as `login_hint`. Once consent has been given, Google usually closes the popup without asking anything.
  - Changes made while the token is expired wait and push after the next renewal.
  - Show "Reconnect Google" only if a renewal actually needs the learner's input.
  - Be honest that Google sync usually means one quick popup per visit. Don't promise "fully automatic" in the UI copy.
- **Duplicate files:** Drive allows several files with the same name, so two devices syncing for the first time at once can each create `progress.json`. On every pull, list all files with that name, merge them all, keep the oldest one, and delete the extras after a successful write.
- **Account label:** use Drive `about.get` (`user.emailAddress` / `displayName`) if the `drive.appdata` scope allows it. Otherwise label it just "Google Drive". Don't add scopes just for the label.

**Apple**: CloudKit JS (`cdn.apple-cloudkit.com/ck/2/cloudkit.js`), a container in Parsa's Apple Developer account, the **private** database, and one record (type `Progress`, fixed record name) holding the JSON. Apple's sign-in button is rendered into a container that we place ourselves. Set `persist: true`. Saves are conditional on the record change tag, and a conflict is handled by re-pulling, merging and retrying.

- Developers report CloudKit/Apple sign-in hanging or failing in non-Safari browsers. Show the **Apple button first on Apple devices and Google first elsewhere**. If Apple sign-in fails, say so plainly and suggest Google.

**Setup Parsa does once** (the builder writes a checklist in the README):
- Google Cloud OAuth client ID (Web) for origin `https://petit-a-petit-francais.github.io`, with consent screen and publishing. The builder confirms what `drive.appdata` verification needs and tells Parsa if it costs money or takes review time.
- CloudKit container, web API token with that allowed origin, and the `Progress` schema deployed to production.

The client ID, container ID and API token are public identifiers, so committing them is fine.

### Loading only when needed

Neither SDK appears in `index.html`. A loader injects the script on demand: when a sign-in button is tapped, or on start if `localStorage` remembers a linked provider. The service worker already ignores cross-origin requests. Offline, sync waits and retries when the device is back online.

### Data format

New storage key **`cahier-fr-v2`**, schema `v: 2`. `Core.cleanState` is extended to understand and validate every new field below. It stays a strict whitelist, because the data is untrusted, and unknown fields are dropped as they are today.

```
{ v: 2,
  epoch: { id, t },                     // see "Erasing everywhere"
  srs: { [cardId]: { r,i,e,l,n,d,last, m } },
  logs: { [deviceId | "legacy"]: { [day]: { n, ok, nw } } },
  lessons: { [lessonId]: timestamp },
  settings: { ...all settings },
  setAt: { [syncedSettingName]: m } }  // changed-at stamp per synced setting
```

The device ID is random and kept in its own local key (`cahier-fr-device`), which isn't part of the synced state.

### Merging (the core of this feature)

`Core.merge(a, b)` is a pure function in [core.js](../../../core.js) that runs on cleaned states. It must be **idempotent, commutative and associative**: merging the same copies in any order, any number of times, from any number of devices or clouds gives the same result. That property covers two devices, two clouds, re-imports and retries.

- **Stamps (`m`) use a clock that can't go backwards:** `m = max(Date.now(), highest m in the state + 1)`. A device whose clock runs fast can't make newer edits elsewhere lose for long, because the next edit anywhere jumps past it. Tests cover skewed clocks.
- **`srs`, per card:** the larger `m` wins. Ties go to the larger `n`, then the larger JSON string, so the result is deterministic. Old cards without `m` use `last` (or 0).
- **Daily log, per (device, day):** take the **larger value of each count** (`n`, `ok`, `nw`). This works because counts only ever go up: answering and "I was right" both add, and nothing subtracts. No stamps are needed. The app shows the daily log as the sum over all devices.
- **`lessons`:** the larger timestamp per lesson wins.
- **Synced settings:** the larger `setAt` stamp wins. When both stamps are 0 (freshly migrated data), the larger JSON string wins. That only matters the first time two devices that were already in use sync, and it doesn't depend on any version's defaults, so different app versions can't keep flipping a value. *My call.*
- **Clock limit (documented, accepted):** a card stamped by a device whose clock is fast still beats a newer offline review made on a device that hasn't seen that stamp yet. It only affects that one card's schedule, and the next review fixes it.
- **Device-only settings** (`voice`, `voiceQc`, `rate`) always keep this device's values and are never pushed.

### Migration and version safety

- **v1 → v2:** on load, if `cahier-fr-v1` exists, clean it and convert it. Its whole `log` goes into the **`"legacy"`** slot. Cards get `m` from `last`, and settings get `setAt = 0`. Then merge it into v2.
  - The v1 key stays, so an old tab still open somewhere that keeps saving to v1 loses nothing. It's merged in again **only when its content has changed** since the last merge (store a hash of it in `cahier-fr-v1-merged`).
  - Converted v1 data always gets epoch `{ id: "", t: 0 }`, so it loses to any erase.
  - **Every erase** (this device, everywhere, or while signed out) deletes `cahier-fr-v1` after the backup is saved, and sets a local flag `cahier-fr-v1-retired`. From then on v1 is ignored, even if an old tab writes it again, so erased progress can't come back from it.
- **The trade-off of the legacy slot:** on a day *before sync existed* when two devices both practiced, the stats show the larger device's count, not the sum. Undercounting a few old days is accepted, because double counting would be worse. *My call:* reviews and schedules are not affected, only the daily totals.
- **Old exports** (no `v`) import into the `"legacy"` slot the same way. Importing the same file twice, or several old exports, never double-counts.
- **v2 exports** have no `log` field, only `logs`. Today's app rejects an import with no `log` ("That file isn't a progress export…"), so already-released versions can't import v2 files and mangle them.
- **A cloud copy with `v` higher than this app knows:** don't merge it and don't write to that cloud. Show "A newer version of the site saved your progress. Reload to update." The service worker is network-first, so one reload fixes it.
- **Importing a file with `v` too high:** reject it with the same message.

### Writes and corruption safeguards

- **A sync is:** pull every linked cloud → clean and merge each with local → save locally → push to each cloud whose copy differs.
- **Never write anything that didn't parse and clean.** If a cloud copy is unreadable, leave that cloud alone, keep syncing the others, and show an error in its status. "Replace cloud copy with this device's progress" is offered as an explicit action, never done automatically.
- **Conditional writes:** CloudKit uses its change tag. Drive has no reliable precondition, so re-read after writing and re-merge if the copy changed. Merge is idempotent, so races still converge.
- **Backups:**
  - Before replacing local state for any reason (sync, "start from cloud only", import, migration), save the previous state to `cahier-fr-backup`.
  - Each cloud keeps one previous copy (`progress.prev.json` / a second record).
  - Neither backup appears in the UI for now; they exist for recovery.
- **Pushes run in the background:** debounced after a finished session or settings change, never per card.

### Erasing everywhere, signing out, deleting a cloud copy

Deleting needs care, because every other device and the other cloud still hold full copies. Without a marker, they would bring the data straight back.

- **The `epoch`:** `epoch = { id: random, t: stamp }`. When two states have different epochs, merge keeps **only the state with the larger `(t, id)`** and discards the other entirely. This stays commutative, associative and idempotent.
- **"Erase all progress" while signed in** offers two options:
  - **This device only.** It reloads from the cloud on the next sync, which the dialog says.
  - **Everywhere.** It starts a new epoch with empty progress and pushes it to **every linked cloud**. *My call.*
- **A device whose epoch is older than the cloud's:**
  - Sync checks epochs **before** calling `Core.merge`, because merge would silently drop the older side.
  - If this device has no progress (no cards, no finished lessons, and every log count zero: a brand-new device, or one just erased), it adopts the cloud copy with no prompt.
  - Otherwise sync **pauses for this device**, writing nothing anywhere, and the status shows "Needs attention" until the learner answers. Before discarding anything, it saves its state to the backup.
  - It asks: "Your progress was erased from another device. Erase it here too, or keep this device's progress and upload it again?"
  - "Upload again" re-stamps this device's data into the new epoch.
  - This is the only prompt of its kind, and either answer keeps a backup.
  - A linked **cloud** still on an older epoch (for example, linked on another device during the erase) has no one to ask. It is overwritten by the newer epoch, and its old copy goes to that cloud's backup copy first. That's intended, because an "Everywhere" erase means everywhere.
- **Sign out (per account)** deletes nothing, keeps the local data, warns that this device won't sync with that account anymore, and forgets the in-memory token.
- **Delete this account's cloud copy** (per account):
  - It deletes **everything this app stored in that cloud**: the main file or record, its backup copy (`progress.prev.json` / second record), and any duplicate Drive files. Then it **signs out of that account** on this device. Otherwise the next sync would re-create the copy from the other cloud or from local.
  - The warning says that other devices still signed in to that account will upload their copy again. To erase everywhere, use "Erase all progress → Everywhere".
- **Erase while signed out:** local only. The note says that signing in again loads the cloud copy back.

### UI

All of it uses the existing visual language of [style.css](../../../style.css).

- **Settings → "Sync across devices" card** replaces the "saved in this browser only" note:
  - The Google and Apple buttons appear in device-aware order.
  - Each linked account shows its label (escaped with `esc`), a status line ("Synced just now" / "Offline, will sync later" / "Reconnect Google" / "Reload to update" / error), and **Sign out** and **Delete cloud copy** buttons with their warnings.
  - Export, Import and Erase stay in this card.
- **Top bar sync indicator:** only for signed-in learners. A small icon with a tooltip and accessible name ("Synced", "Syncing…", "Offline", "Needs attention"). Tapping it opens the Settings card. People should see sync state where they study, without opening Settings.
- **Home nudge:** after the first finished session, a dismissible card reads "Keep your progress on all your devices: sign in with Google or Apple." It has a "Later" button. Parsa chose to show **more than one reminder**. *My call on timing:* it shows after the 1st finished session, again after 7 days of practice, and again after 30 days of practice, then never again. Signing in hides it for good, and so does "Don't ask again", which appears on the last reminder. Reminders are counted per device.
- **Accessibility:** every new control meets the site's WCAG 2.2 bar (keyboard, visible focus, real buttons). Status changes are announced through an `aria-live` region (reuse `#msg`). Apple's rendered button is checked for this, and wrapped or labelled if needed.

### Privacy page

Add a "Syncing (optional)" section:
- If you sign in, a copy of your progress is stored in your own Google Drive app folder or iCloud private database, under Google's or Apple's privacy policy, and we can't read it.
- Google and Apple scripts load only if you use sign-in.
- How to delete the cloud copy.

Also update "Last updated" and the "no accounts" line in the intro.

## Testing

- **`test.mjs`:**
  - Merge is idempotent, commutative and associative on generated states, including different epochs.
  - Offline sessions on two devices merge without loss.
  - Skewed clocks: one device's clock hours ahead.
  - Re-importing the same old or new file doesn't double-count.
  - v1→v2 migration, and an old v1 writer still saving after migration.
  - Higher-`v` data blocks merging and writing.
  - Garbage input is rejected and nothing is written.
  - Erase-everywhere followed by a stale device.
  - Drive duplicate-file merge.
- **Manual, in headless Chrome over CDP** (never the user's own browser):
  - Google sign-in with a test account and a CloudKit development container.
  - Two browser profiles as two devices, with an offline toggle.
- **Real devices (Parsa):** Safari on iPhone and Mac, and Chrome on Android/desktop for Apple sign-in. This is a must before launch, given the reports about Apple sign-in in other browsers.

## Left to the builder

- Module layout. Keep the sync code in its own `sync.js`, add it to the service worker's `APP` list, and bump `CACHE`.
- Debounce timing, retry/backoff, and status wording beyond the strings above.
- Whether the CloudKit field is a string or an asset (state size decides).
- Whether `about.get` returns an account label under `drive.appdata`.
