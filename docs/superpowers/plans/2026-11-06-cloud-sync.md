# Cloud Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Optional Google/Apple sign-in that merges and syncs learning progress between a learner's devices through their own Google Drive app folder or iCloud private database.

**Architecture:**
- **Pure state logic** goes in `core.js`: v2 format, cleaning, stamping and merging, unit-tested in `test.mjs`.
- **The sync loop** goes in `sync.js`. It works against a small provider interface, and its tests use fake providers.
- **Two providers:** `sync-google.js` (GIS code client, Drive REST and the token helper) and `sync-apple.js` (CloudKit JS).
- **Lazy loading:** a provider's file and SDK load only on sign-in, or on start for a linked device.
- **The token helper:** a stateless Cloudflare Worker in `token-helper/` holds the Google client secret.

**Tech Stack:** Vanilla JS (no build, no dependencies), Node `test.mjs` with `node:vm` and `node:assert`, Google Identity Services + Drive v3 REST, CloudKit JS 2, Cloudflare Workers (`wrangler`).

**Spec:** `docs/superpowers/specs/2026-11-06-cloud-sync-design.md`. Read it first. This plan doesn't repeat its reasoning.

## Global Constraints

- No dependencies, no build step. Every file is plain browser JS loaded by `<script>` or by the lazy loader.
- Visitors who never sign in make **no** request to Google, Apple or Cloudflare.
- Storage keys:
  - `cahier-fr-v2` holds the state, with `v: 2`.
  - `cahier-fr-v1` is the old state. Read it, never write it.
  - `cahier-fr-v1-merged` holds the hash of the last merged v1.
  - `cahier-fr-v1-retired` is the flag set by any erase.
  - `cahier-fr-device` holds the device ID.
  - `cahier-fr-backup` holds the previous state.
  - `cahier-fr-google` holds the refresh token.
  - `cahier-fr-sync` holds linked providers and nudge state.
  - `cahier-fr-ck` is the CloudKit `authTokenStore`.
- Synced settings: exactly `newPerDay, sessionSize, tenses, theme, accent, autoplay`. Device-only: `voice, voiceQc, rate`.
- The Google access token stays in memory only. The Google client secret is never committed.
- Signing out of Google never revokes. Only "Disconnect Google on all devices" calls `https://oauth2.googleapis.com/revoke`.
- Every value from a provider (account label, error text) goes through `esc` before it reaches the page.
- Every new control is a real `<button>`/`<input>` with a visible focus state. Status text goes to an `aria-live` region.
- Copy strings fixed by the spec are used verbatim:
  - "Keep your progress on all your devices: sign in with Google or Apple."
  - "A newer version of the site saved your progress. Reload to update."
  - "Your progress was erased from another device. Erase it here too, or keep this device's progress and upload it again?"
  - "Add this device's progress to this account, or start from this account's cloud progress only?"
- After every task, `node test.mjs` passes. Each commit message ends with `(#22)`. Work happens on branch `feat/22-cloud-sync`.

## Review Focus

1. **Sign-in tap → SDK still loading → popup blocked.** Browsers block a popup that opens after an `await`, because it's no longer part of the tap. Expected: the first tap loads the SDK, the button turns into "Continue with Google"/"Continue with Apple", and a second tap opens the popup. A blocked popup is never a silent failure. *(Task 8 test)*
2. **Two tabs of the new version open on one device.** A stale tab must not overwrite progress the other tab just saved. Expected: a `storage` event on `cahier-fr-v2` merges the other tab's state into this tab's `S`. *(Task 3 test)*
3. **`localStorage` full or blocked** during a save after a merge. Expected: nothing is pushed from a state that couldn't be saved locally, and the status shows "Couldn't save on this device". *(Task 4 test)*
4. **Token helper down, slow or rate-limited (429).** Expected: Google shows "Reconnect Google" only on a 400/401 `invalid_grant`. For network errors, 5xx and 429 it shows "Offline, will sync later" and retries with backoff. Progress keeps saving locally. *(Task 6 test)*
5. **A large state** (every card seen, months of logs) close to CloudKit's 1 MB record limit. Expected: the Apple provider stores the JSON as an asset once it passes 700 000 bytes, and reads either form. *(Task 7 test)*

---

### Task 1: Setup and spike (with Parsa, throwaway)

Nothing from this task is committed except the findings. It proves the two Google behaviours the spec marks as unverified, and records Apple's hosts for the security rule.

**Files:**
- Create (scratchpad only, not committed): `spike.html`, served locally on `http://localhost:8000`.
- Modify: `docs/superpowers/specs/2026-11-06-cloud-sync-design.md` (add a "Spike findings" section).

- [ ] **Step 1: Parsa creates the accounts and IDs.**
  - **Google Cloud:**
    - A project and an OAuth client of type Web.
    - Authorized JavaScript origins `https://petit-a-petit-francais.github.io` and `http://localhost:8000`.
    - A consent screen with the scope `drive.appdata`, in Testing for now, with Parsa added as a test user.
  - **Apple:** an iCloud container `iCloud.<bundle-like id>`, a CloudKit web API token (allowed origins: both of the above), and a record type `Progress` with fields `data` (String) and `blob` (Asset) in Development.
  - **Cloudflare:** a free account and `wrangler login`.
  - Parsa sends the client ID, the container ID and the API token. The client secret goes only into `wrangler secret put` (Task 5).
- [ ] **Step 2: Google spike.**
  - `spike.html` loads `https://accounts.google.com/gsi/client` and calls `google.accounts.oauth2.initCodeClient({ client_id, scope: "https://www.googleapis.com/auth/drive.appdata", ux_mode: "popup", callback })` on a button tap.
  - Exchange the code with `curl` against `https://oauth2.googleapis.com/token`, using `grant_type=authorization_code` and `redirect_uri=postmessage`.
  - Expected: a JSON response with `refresh_token` on first consent.
  - Repeat with the same account, then with `prompt: "consent"`, and record whether `refresh_token` comes back each time.
- [ ] **Step 3: Apple spike.**
  - `spike.html` loads `https://cdn.apple-cloudkit.com/ck/2/cloudkit.js` and configures `persist: true` and an `authTokenStore` backed by `localStorage`.
  - Sign in, save a `Progress` record, reload, and confirm you're still signed in. Do this in Safari and in Chrome.
  - Record every host in DevTools → Network (scripts, frames, XHR) for the security rule.
- [ ] **Step 4: Write the findings into the spec.**
  - Add a "Spike findings" section: `postmessage` works (yes/no), refresh-token behaviour, the Apple host list, and Chrome persistence (yes/no).
  - Commit: `docs: spike findings for cloud sync (#22)`.
  - **Stop and tell Parsa if `postmessage` or the refresh token fails.** The Google design changes in that case.

### Task 2: v2 state, stamping and merge in `core.js`

**Files:**
- Modify: `core.js` (replace `cleanState` at 260-281 and extend the export at 283).
- Test: `test.mjs` (the existing "progress validation" block keeps passing and checks v1 input; new merge blocks follow it).

**Interfaces:**
- Produces, all on `Core`:
  - `V = 2`; `SYNCED: string[]` (the six synced settings); `DEVICE_ONLY = ["voice","voiceQc","rate"]`.
  - `tooNew(raw: any) -> boolean`: true when `Number(raw?.v) > V`.
  - `cleanState(raw, defaults, tenses) -> State`. Takes v1 or v2 input and always returns v2. For v1 input:
    - `log` goes to `logs.legacy`.
    - Each card gets `m = last || 0`.
    - `setAt` is all 0.
    - `epoch = {id:"", t:0}`.
  - `State = { v:2, epoch:{id:string,t:number}, srs:{[id]:{r,i,e,l,n,d,last?,m}}, logs:{[slot]:{[day]:{n,ok,nw}}}, lessons:{[id]:number}, settings:{...}, setAt:{[name]:number} }`.
  - `stamp(state, now = Date.now()) -> number`: `max(now, highest of every srs m, setAt value, lesson timestamp and epoch.t + 1)`.
  - `merge(a: State, b: State) -> State`: synced fields follow the spec's rules, and `settings[DEVICE_ONLY]` come from `a` (the local side).
  - `syncView(state) -> State`: a copy without the `DEVICE_ONLY` settings. This is what gets pushed and compared.
  - `sumLogs(logs) -> {[day]:{n,ok,nw}}`.
  - `isEmpty(state) -> boolean`: no cards, no lessons, and every log count is 0.
  - `restamp(state, epoch, now) -> State`: moves the state into `epoch` and stamps every card and synced setting with `stamp`. It's used by "upload again".
  - `emptyState(defaults, epoch) -> State`.
  - `hash(str) -> string`: FNV-1a 32-bit as hex.

- [ ] **Step 1: Write failing tests** in `test.mjs` after the "progress validation" block, under `console.log("ok — merge")`:
  - `merge(a,a)` deep-equals `a`, and `syncView(merge(a,b))` deep-equals `syncView(merge(b,a))`. Associativity holds for `a,b,c`. Check all three on 200 states from a small seeded generator built from the existing `Core.shuffle`/seeded pattern, with random cards, logs in 2 device slots, lessons, settings with `setAt`, and epochs drawn from 2 values.
  - Two devices go offline: device A reviews card `x` at `m=100`, device B reviews `y` at `m=101` and logs `{n:3}` in its own slot. Both cards and both slots survive the merge, and `sumLogs` gives that day's `n` as A's count plus 3.
  - Same (slot, day) with `{n:5,ok:2,nw:1}` and `{n:3,ok:4,nw:0}` merges to `{n:5,ok:4,nw:1}`.
  - Skewed clock: `stamp({srs:{a:{m:9e12}}}, 1000) === 9e12 + 1`.
  - Card tie on `m`: the larger `n` wins. On a full tie the result is the same in both orders.
  - A setting with both `setAt` 0 is resolved by the larger `JSON.stringify` value, in both orders.
  - Epoch: a state with epoch `{id:"b",t:5}` merged with a fuller state with epoch `{id:"a",t:5}` gives exactly the `"b"` state.
  - v1 input: `cleanState({srs:{a:{last:7,r:1}}, log:{"2026-11-01":{n:2}}, settings:{}})` gives `srs.a.m === 7`, `logs.legacy["2026-11-01"].n === 2`, and `epoch` equal to `{id:"",t:0}`.
  - The same old export imported twice is still `n === 2`.
  - `tooNew({v:3}) === true`; `tooNew({v:2}) === false`; `tooNew({}) === false`.
  - Garbage (`{logs:{"<x>":{"bad":{n:1}}}, epoch:{id:"<s>",t:"x"}, v:"2"}`) cleans to valid shapes. Slot IDs must match `/^(legacy|[a-z0-9]{8,32})$/`, epoch IDs `/^[a-z0-9]{0,32}$/`, and a bad epoch becomes `{id:"",t:0}`.
- [ ] **Step 2: Run** `node test.mjs`. Expected: FAIL at the first merge assertion (`Core.merge is not a function`).
- [ ] **Step 3: Implement** the interfaces above in `core.js`. `cleanState` keeps its existing whitelist rules for cards and settings, and adds `m` to the card fields it keeps.
- [ ] **Step 4: Run** `node test.mjs`. Expected: every `ok —` line, including `ok — merge`.
- [ ] **Step 5: Commit** `feat: v2 progress format with mergeable state (#22)`.

### Task 3: App storage on v2 (local only, no sync yet)

**Files:**
- Modify: `app.js` (storage block 11-20; `logResult` 137; `check` around 313; `override` 352-355; `renderSummary` lesson stamp around 383; `pageSettings` `set` 752 and the data card handlers 767-790).
- Test: `test.mjs` (pure helpers only), plus a headless-Chrome check.

**Interfaces:**
- Consumes: Task 2's `Core.*`.
- Produces (inside the `app.js` closure, exposed for `sync.js` as `window.App`):
  - `App.getState() -> State`, which returns the live `S`.
  - `App.replaceState(next: State, why: string) -> boolean`. It writes the current state to `cahier-fr-backup`, sets `S`, recomputes `S.log = Core.sumLogs(S.logs)`, saves and re-renders the current route. It returns false if the save threw.
  - `App.DEVICE: string`.
  - `App.onSaved: (() => void) | null`. `save()` calls it after a successful write, and sync sets it.

- [ ] **Step 1: Write the failing headless test** in the scratchpad: `storage-check.mjs`, driving headless Chrome over CDP, never the user's browser. Serve the folder on `:8000`, then:
  - **Migration:** seed `cahier-fr-v1` with a v1 state of 3 cards and log `{n:4}` for today, then load. Expected:
    - `cahier-fr-v2` exists with those 3 cards and `logs.legacy`.
    - Home shows today's 4.
    - `cahier-fr-v1` is unchanged, and `cahier-fr-v1-merged` is set.
  - **Answering a card:** it increments `logs[DEVICE][today].n`, and the card's `m` equals `Core.stamp` at that moment.
  - **Settings:** changing the theme sets `setAt.theme`. Changing the speed sets no `setAt` value.
  - **Import:** the same v1 file imported twice leaves today at `n === 4`. A file with `{v:3}` shows "A newer version of the site saved your progress. Reload to update." and changes nothing.
  - **Export:** the file has `v:2`, has `logs`, and has no `log`.
  - **Erase while signed out:** it removes `cahier-fr-v1`, sets `cahier-fr-v1-retired`, and a re-seeded v1 is ignored on reload.
  - **Two tabs** (Review Focus 2): tab B answers a card, then tab A answers another card. Both cards are in `cahier-fr-v2`.
- [ ] **Step 2: Run** `node storage-check.mjs`. Expected: FAIL on the migration check.
- [ ] **Step 3: Implement.**
  - `load()` reads v2. If v1 isn't retired and `Core.hash(rawV1)` differs from `cahier-fr-v1-merged`, it merges `cleanState(v1)` in and stores the hash.
  - `save()` writes `JSON.stringify({...S, log: undefined})`.
  - The device ID is 16 random `[a-z0-9]` characters, created once.
  - After every `Core.schedule` result: `S.srs[id].m = Core.stamp(S)`.
  - `logResult` and `override` write to `S.logs[DEVICE][day]`, then recompute `S.log`.
  - `set(k,v)` stamps `setAt[k]` when `Core.SYNCED.includes(k)`.
  - Import: `Core.tooNew` rejects. Otherwise it requires `srs` plus `log` or `logs`, and calls `replaceState(Core.merge(S, Core.cleanState(data)))`.
  - A `window` `storage` event for `cahier-fr-v2` merges `cleanState(JSON.parse(e.newValue))` into `S`. It doesn't save, because the other tab already did.
  - Erase: retire v1, then `replaceState(Core.emptyState(DEFAULTS, S.epoch))`. Task 8 adds the signed-in options.
- [ ] **Step 4: Run** `node storage-check.mjs` and `node test.mjs`. Expected: all checks pass.
- [ ] **Step 5: Commit** `feat: store progress in mergeable v2 format (#22)`.

### Task 4: Sync engine `sync.js` with fake providers

**Files:**
- Create: `sync.js` (loaded by `index.html` after `app.js`, and added to `sw.js` `APP`).
- Test: `test.mjs` (loads `sync.js` in the vm and uses fake providers).

**Interfaces:**
- Consumes: `Core.*`, plus `App.getState`, `App.replaceState`, `App.onSaved`.
- Provider contract (implemented by Tasks 6 and 7):

```js
{ id: "google" | "apple", label: string,            // label is untrusted
  pull(): Promise<{ copies: { text: string, ref: any }[] }>,   // [] when nothing stored
  push(text: string, refs: any[]): Promise<void>,     // keep previous main as backup copy, write main, delete extra refs
  removeAll(): Promise<void>,                          // main + backup + duplicates
  signOut(): Promise<void> }
// failures throw Error with .code in "auth" | "offline" | "conflict" | "other"
```

- Produces, on `window.Sync`:
  - `Sync.create({ app, core, ask, onStatus, now }) -> engine`.
    - `ask(kind: "epoch" | "account", provider) -> Promise<"erase" | "upload" | "add" | "cloud" | null>`. `null` means not answered yet: write nothing and set the status to "Needs attention".
    - `onStatus(providerId, status, detail?)`.
    - The engine has `link(provider, {fresh: boolean})`, `unlink(id)`, `run() -> Promise<void>`, `schedule()` (3 s debounce), `eraseEverywhere()` and `deleteCloud(id)`.
  - Statuses: `"syncing" | "synced" | "offline" | "reconnect" | "reload" | "unreadable" | "attention" | "localfail"`.

- [ ] **Step 1: Write failing tests** (`console.log("ok — sync engine")`). Build fake providers over an in-memory array. Wrap them to fail on demand.
  - Two devices (two `App` fakes) with one shared fake Google and one shared fake Apple, offline edits on both, then `run()` on each twice. Both apps and both clouds end with equal `syncView` and no lost card.
  - Fake Google holds 2 copies (the duplicate files). After `run()` it holds 1, with the merged content.
  - A cloud copy with text `"{bad"` gives status `"unreadable"` for that provider. That provider's `push` is never called, and the other provider still syncs.
  - A cloud copy with `{v:3}` gives status `"reload"`, with no push to that provider and no merge of it.
  - **Epoch:** after `eraseEverywhere()` on device A, device B (non-empty, old epoch) calls `ask("epoch")`. With answer `null`, nothing is pushed anywhere and B's state is unchanged. With `"erase"`, B is empty and its backup holds the old state. With `"upload"`, B's cards come back in A's epoch on the next `run()` on A.
  - An empty device on an old epoch adopts the cloud copy without calling `ask`.
  - `link(p, {fresh:true})` with a non-empty local state and a non-empty remote, when no other provider is linked, calls `ask("account")`. `"cloud"` replaces local with remote (the backup is written first), and `"add"` merges. Linking a second provider never asks.
  - Push throws `{code:"conflict"}` once: `run()` re-pulls, re-merges and succeeds.
  - `deleteCloud("google")` calls `removeAll` and then `signOut`, and Google is no longer linked.
  - **Review Focus 3:** `App.replaceState` returns false. Status is `"localfail"` and no push happens.
- [ ] **Step 2: Run** `node test.mjs`. Expected: FAIL (`Sync is not defined`).
- [ ] **Step 3: Implement `sync.js`.** `run()` follows the spec's order:
  1. Pull every linked provider, and clean every copy.
  2. Check epochs **before** merging.
  3. Merge everything.
  4. Call `replaceState` if the result differs from local.
  5. Push to each provider whose copies differ or number more than 1.

  Triggers are set up by `Sync.start()`: page load, `visibilitychange` to visible, `online`, and `App.onSaved` → `schedule()`. Linked providers are remembered in `cahier-fr-sync` as `{linked:["google"], nudge:{...}}`.
- [ ] **Step 4: Run** `node test.mjs`. Expected: `ok — sync engine`.
- [ ] **Step 5: Commit** `feat: sync engine with merge, epochs and safeguards (#22)`.

### Task 5: Token helper Worker

**Files:**
- Create: `token-helper/worker.js`, `token-helper/wrangler.toml`, `token-helper/test.mjs`.

**Interfaces:**
- Produces HTTP endpoints, `POST` with a JSON body only:
  - `/exchange {code}` → `{access_token, expires_in, refresh_token?}`
  - `/refresh {refresh_token}` → `{access_token, expires_in}`
  - Errors return `{error}` with Google's status code, or 400/403/405/429.
- `env`:
  - `GOOGLE_CLIENT_ID` (var)
  - `GOOGLE_CLIENT_SECRET` (secret)
  - `ALLOWED_ORIGIN` (var, `https://petit-a-petit-francais.github.io`)
  - `LIMITER` (a Workers rate-limiting binding of 30 requests per 60 s per `CF-Connecting-IP`)

- [ ] **Step 1: Write failing tests** in `token-helper/test.mjs`. Import `worker.js` and stub `globalThis.fetch` to record the Google call.
  - **Wrong origin:** 403.
  - **Missing `X-Requested-With: XmlHttpRequest`:** 403.
  - **`GET`:** 405. An unknown path: 404.
  - **`OPTIONS` from the allowed origin:** 204, with `Access-Control-Allow-Origin` set to that origin, and `Allow-Headers` including `Content-Type, X-Requested-With`.
  - **`/exchange`:** the request goes to `https://oauth2.googleapis.com/token` with form fields `code`, `client_id`, `client_secret`, `redirect_uri=postmessage` and `grant_type=authorization_code`. The response passes through only `access_token`, `expires_in` and `refresh_token`.
  - **`/refresh`:** sends `grant_type=refresh_token`.
  - **Google's `invalid_grant` (400):** comes back as 400 `{error:"invalid_grant"}`.
  - **`LIMITER.limit` → `{success:false}`:** 429.
  - **No logging:** the test fails if `console.log`, `console.info` or `console.error` is called.
- [ ] **Step 2: Run** `node token-helper/test.mjs`. Expected: FAIL (module not found).
- [ ] **Step 3: Implement** `worker.js` (`export default { async fetch(request, env) }`). In `wrangler.toml` set `[observability] enabled = false` and a `[[ratelimits]]` binding named `LIMITER`, and put `GOOGLE_CLIENT_ID` and `ALLOWED_ORIGIN` under `[vars]`. Use the redirect URI that the spike in Task 1 confirmed.
- [ ] **Step 4: Run** `node token-helper/test.mjs`. Expected: all pass. Add `node token-helper/test.mjs` to the README's test section.
- [ ] **Step 5: Deploy (Parsa runs the secret step).** `cd token-helper && wrangler secret put GOOGLE_CLIENT_SECRET && wrangler deploy`. Record the Worker URL in `sync-config.js` (Task 6).
- [ ] **Step 6: Commit** `feat: stateless Google token helper (#22)`.

### Task 6: Google provider `sync-google.js`

**Files:**
- Create: `sync-config.js` (public IDs: `GOOGLE_CLIENT_ID`, `TOKEN_HELPER_URL`, `CK_CONTAINER`, `CK_API_TOKEN`, `CK_ENV`), loaded by `index.html` and added to `sw.js` `APP`.
- Create: `sync-google.js`. It's lazily loaded (not in `index.html`), but it is in `sw.js` `APP`, so it works offline once cached.
- Test: `test.mjs` (load it in the vm with a stubbed `fetch` and a stubbed `google.accounts.oauth2`).

**Interfaces:**
- Consumes: the provider contract from Task 4, `sync-config.js`, and the token helper from Task 5.
- Produces:
  - `window.SyncGoogle.load() -> Promise<void>` injects the GIS script once.
  - `window.SyncGoogle.signIn() -> Promise<provider>` must be called synchronously inside a tap. It needs a token-helper `/exchange`. If no `refresh_token` comes back, it asks again once with `prompt:"consent"`.
  - `window.SyncGoogle.restore() -> provider | null` uses the stored refresh token.
  - `window.SyncGoogle.disconnectAll() -> Promise<void>` revokes the token.

- [ ] **Step 1: Write failing tests** (`console.log("ok — google provider")`) with a stubbed `fetch`.
  - `pull()` lists `GET https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name%3D'progress.json'&fields=files(id,createdTime)&orderBy=createdTime`, then downloads each `files/{id}?alt=media`.
  - `push(text, refs)`:
    - Copies the oldest ref's current content to `progress.prev.json`, creating or updating it.
    - Writes `text` to the oldest ref with `PATCH https://www.googleapis.com/upload/drive/v3/files/{id}?uploadType=media`, or creates the file with `parents:["appDataFolder"]` when there are no refs.
    - Deletes the other refs.
  - The access token is renewed through `/refresh` when it's within 5 minutes of expiry. It's never written to `localStorage` (the test checks every `setItem` key).
  - **Review Focus 4:** errors map to codes.
    - `/refresh` returning 400 `invalid_grant` → `.code "auth"`.
    - A network `TypeError`, a 5xx or a 429 → `.code "offline"`.
    - Drive 401 → one refresh and one retry, then `"auth"`.
  - `signOut()` removes `cahier-fr-google` and makes no request to `/revoke`. `disconnectAll()` POSTs to `https://oauth2.googleapis.com/revoke`.
  - `removeAll()` deletes `progress.json` (every copy) and `progress.prev.json`.
  - `label` comes from `GET drive/v3/about?fields=user(displayName,emailAddress)`, falling back to `"Google Drive"` on any error.
- [ ] **Step 2: Run** `node test.mjs`. Expected: FAIL.
- [ ] **Step 3: Implement `sync-google.js`.**
- [ ] **Step 4: Run** `node test.mjs`. Expected: `ok — google provider`.
- [ ] **Step 5: Commit** `feat: Google Drive sync provider (#22)`.

### Task 7: Apple provider `sync-apple.js`

**Files:**
- Create: `sync-apple.js`. It's lazily loaded and listed in `sw.js` `APP`.
- Test: `test.mjs` (with a stubbed `CloudKit` global).

**Interfaces:**
- Consumes: the provider contract and `sync-config.js`.
- Produces:
  - `window.SyncApple.load() -> Promise<void>` injects `https://cdn.apple-cloudkit.com/ck/2/cloudkit.js` and calls `CloudKit.configure`:
    - `services: { authTokenStore }` backed by `cahier-fr-ck`.
    - `containers: [{ containerIdentifier: CK_CONTAINER, apiTokenAuth: { apiToken: CK_API_TOKEN, persist: true, signInButton: { id: "apple-sign-in-button", theme: "black" }, signOutButton: { id: "apple-sign-out-button" } }, environment: CK_ENV }]`.
  - `window.SyncApple.signIn() -> Promise<provider>`: `container.setUpAuth()`, then `whenUserSignsIn()`.
  - `window.SyncApple.restore() -> Promise<provider | null>`.
  - The records are `progress` and `progress-prev`, of type `Progress` with fields `data` (String) and `blob` (Asset).

- [ ] **Step 1: Write failing tests** (`console.log("ok — apple provider")`).
  - `pull()` fetches `progress` from `privateCloudDatabase` and returns `[]` on `NOT_FOUND`.
  - `push` saves `progress-prev` with the old content first, then saves `progress` with its `recordChangeTag`. A `CONFLICT` error (`ckErrorCode`) becomes `.code "conflict"`.
  - **Review Focus 5:** text of 700 001 bytes is saved in `blob` and `data` is empty. `pull` reads whichever field is set.
  - `removeAll()` deletes both records. `signOut()` clears `cahier-fr-ck`.
  - `AUTHENTICATION_REQUIRED` becomes `"auth"`, and a network failure becomes `"offline"`.
- [ ] **Step 2: Run** `node test.mjs`. Expected: FAIL.
- [ ] **Step 3: Implement `sync-apple.js`.**
- [ ] **Step 4: Run** `node test.mjs`. Expected: `ok — apple provider`.
- [ ] **Step 5: Commit** `feat: iCloud sync provider (#22)`.

### Task 8: Sync UI (Settings card, top-bar indicator, nudges, dialogs)

**Files:**
- Modify: `app.js` (the `pageSettings` "Your data" card at 746-750 becomes "Sync across devices"; `renderNav` gets the indicator; `pageHome` gets the nudge; `renderSummary` counts sessions).
- Modify: `style.css` (indicator and nudge card only, reusing the existing tokens).
- Test: a headless-Chrome check in the scratchpad (`ui-check.mjs`) with fake providers installed through `window.SyncGoogle`/`window.SyncApple` stubs.

**Interfaces:**
- Consumes: `Sync.create`, `SyncGoogle`, `SyncApple`, `App`.
- Produces: no new API.

- [ ] **Step 1: Write the failing UI check** `ui-check.mjs`:
  - **Button order:** on an iPhone user agent the order is Apple then Google. On the Windows user agent it's Google then Apple.
  - **Review Focus 1:** with a stub whose `load()` takes 500 ms, the first tap shows "Continue with Google", and only the second tap calls `signIn()`. `signIn()` is called synchronously in the click handler, with no `await` before it.
  - **Linked account:** shows the label escaped (`<img>` in a label renders as text), a status line, **Sign out**, and **Delete cloud copy**. Google also gets "Disconnect Google on all devices". Each one opens a confirm dialog with the spec's warning before acting.
  - **Problem statuses:**
    - `"reconnect"` shows a "Reconnect Google" button that calls `signIn()`.
    - `"unreadable"` shows "Replace cloud copy with this device's progress". It asks for confirmation, then calls `push` with this device's `syncView`.
    - `"reload"` shows the spec's reload copy with a Reload button.
  - **Erase while signed in:** offers "This device only" and "Everywhere". While signed out, it shows the note that signing in loads the cloud copy back.
  - **Epoch and account prompts:** both appear in `#dialog` with the exact spec copy. Closing without answering leaves the status at "Needs attention".
  - **Top-bar indicator:** appears only when something is linked. Its accessible name is one of "Synced", "Syncing…", "Offline" or "Needs attention", and tapping it goes to `#/settings`.
  - **Nudge:** shows with the exact copy after the 1st finished session, after 7 distinct days with `n > 0`, and after 30 such days. "Later" hides it until the next threshold. "Don't ask again" appears only on the 3rd. It never shows once signed in.
  - **Status announcements:** every status change is announced through the `role="status"` element.
  - **Keyboard:** every new control can be reached with Tab and has a visible focus ring.
- [ ] **Step 2: Run** `node ui-check.mjs`. Expected: FAIL.
- [ ] **Step 3: Implement** in `app.js`, using the existing `openDialog`, `btn` classes and `icon()`.
- [ ] **Step 4: Run** `node ui-check.mjs`, then `node test.mjs`. Expected: all pass. Take screenshots of Settings (light and dark), Home with the nudge, and the top bar at 375 px and 1280 px, and check them.
- [ ] **Step 5: Commit** `feat: sync settings, indicator and sign-in nudges (#22)`.

### Task 9: Security rule, offline cache, privacy page and README

**Files:**
- Modify: `index.html` (move the inline service-worker registration on line 40 into `app.js`'s start-up; add the CSP `<meta>`).
- Modify: `app.js` (replace the inline handlers at 271, 516, 672 and 721 with listeners).
- Modify: `sw.js` (add `sync.js`, `sync-config.js`, `sync-google.js` and `sync-apple.js` to `APP`; set `CACHE = "petit-a-petit-v3"`).
- Modify: `privacy.html`, `README.md`.

- [ ] **Step 1: Write a failing check** in `test.mjs` (`console.log("ok — csp")`):
  - `index.html` contains a CSP `<meta>` whose `script-src` is exactly `'self' https://accounts.google.com/gsi/ https://cdn.apple-cloudkit.com`, and which has no `style-src`.
  - `index.html` has no inline `<script>` body.
  - `app.js` has no ` on[a-z]+="` attribute in its templates.
- [ ] **Step 2: Run** `node test.mjs`. Expected: FAIL at `ok — csp`.
- [ ] **Step 3: Implement.** `connect-src` and `frame-src` list:
  - `'self'`, `https://www.googleapis.com`, `https://oauth2.googleapis.com` and `https://accounts.google.com`
  - the token-helper URL
  - the Apple hosts recorded in Task 1's spike findings
- [ ] **Step 4: Privacy page and README.**
  - `privacy.html` gets the spec's "Syncing (optional)" section and a new "Last updated" date. The intro's "no accounts" line becomes "Accounts are optional: you can sign in with Google or Apple to sync your progress."
  - `README.md` gets the setup checklist from the spec, including the "publish to In production before inviting learners" step, and `node token-helper/test.mjs`.
- [ ] **Step 5: Verify.**
  - Run `node test.mjs`. Expected: all `ok —` lines.
  - In headless Chrome, load every route signed out. The console shows no CSP violation, and the network log shows **no** request to Google, Apple or Cloudflare.
- [ ] **Step 6: Commit** `feat: content security policy and sync privacy notes (#22)`.

### Task 10: End-to-end check and PR

- [ ] **Step 1: Two-device run** in headless Chrome over CDP, with two separate profiles as "phone" and "laptop", a test Google account and the CloudKit **Development** environment.
  1. Sign in on both.
  2. Go offline on both. Answer different cards.
  3. Go back online on both. Expected: both show both cards, and today's count is the sum.
  4. Use "Erase everywhere" on one. The other gets the epoch prompt.
  5. "Delete cloud copy" on Google: Drive's `appDataFolder` is empty, including `progress.prev.json`.
- [ ] **Step 2: Parsa's real-device checks.**
  - Safari on iPhone and Mac, and Chrome on Android and desktop: Apple sign-in works and survives a reload.
  - Google sign-in survives closing and reopening the browser the next day.
- [ ] **Step 3: Before inviting learners (Parsa).**
  - CloudKit schema deployed to Production, with `CK_ENV` set to `"production"`.
  - Google consent screen published "In production", with brand verification tried on github.io.
- [ ] **Step 4:** Mark PR #23 ready for review. Update its description with the summary, the test evidence and `Closes #22`. Run the `pr-reviewer` agent, fix the blocking findings, and check `gh pr checks 23`. Ask Parsa before merging.
