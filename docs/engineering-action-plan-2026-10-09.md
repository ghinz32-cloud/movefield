# Engineering Action Plan for Pull Request Review

- Date: 2026-10-09
- Branch: `review-fixes`. Setup and plan-flow fixes are committed as `9840be6`. This document is the only change in its commit.
- Scope: whole repository, checked against the seven use cases in the audit brief (custom workout creator, offline storage, AI feedback, mid-set interruption, multi-device writes, third-party data model, multi-platform UI and assets).
- Method: every finding was read in the current tree and cited by file and line. Measurements are marked as measured. Anything not run on a device or browser is marked untested.
- Status legend: **OPEN** = not changed in this pass. **FIXED** = changed and verified. **DECISION** = needs an owner choice before a code change.

## Summary

| # | Finding | Use case | Severity | Status |
|---|---|---|---|---|
| C1 | Saved training stops accepting changes at about 1,000 to 1,300 workouts | 2, 6 | Critical | DECISION (storage layout) |
| C2 | Fields the schema does not list are deleted on the next save | 2, 6 | Critical | OPEN |
| C3 | A failed phone save says "retry" but never retries | 2 | High | OPEN |
| C4 | Web rest alarm is silenced when it fires late, even with notifications allowed | 4 | High | OPEN |
| C5 | Phone-edited rep ranges are saved as single targets; phone and web limits differ | 1 | High | OPEN |
| C6 | Superset pairs are read from free text in notes | 1 | High | OPEN |
| C7 | Finish Workout writes back a render-time snapshot | 4, 5 | Medium | OPEN |
| C8 | Set changes address array positions, not set identity | 1, 5 | Medium (latent) | OPEN |
| C9 | No device sync; the phone-at-gym to browser-at-home flow cannot pass | 2, 5 | Critical (by design) | DECISION |
| C10 | The AI daily feedback pipeline does not exist | 3 | Critical (absent) | DECISION |
| C11 | Image cache grows without limit; image loads have no timeout | 7 | Medium | OPEN |
| C12 | Touch targets below 44 px on desktop-density controls | 7 | Medium | FIXED for touch screens (9840be6); desktop xs buttons remain |
| C13 | Heavy data on cold start: 2.5 MB guide file, 100 MB of photos, duplicate JSON in the phone bundle | 7 | Medium | OPEN |
| C14 | Rigid schema points: mixed timestamps, local dates, non-UUID IDs, no migrator | 6 | Medium | DECISION (v3 migration) |

---

## [CRITICAL FAILS]

### C1. Saved training stops accepting changes at about 1,000 to 1,300 workouts (Use cases 2, 6)

- **Where:** `lib/saved-data.ts:15` (`history:z.array(workout).max(5000)`), `lib/saved-data.ts:16` (`parseSafeJson(raw, max=5_000_000)`), `app/page.tsx:110` (`setS` runs `readSavedState(JSON.stringify(next))` on every change), `mobile/src/storage.ts:95` (validated before every save), `mobile/src/local-crypto.ts:78` (phone stores ciphertext as hex, 2x size), `lib/browser-vault.ts:55` (web stores base64, 1.33x size).
- **Measured:** the bundled sample history (`lib/experienced-demo.ts`) is 34 workouts and 371 sets, 129,419 characters in total. That is about 3,806 characters per workout.
- **Failure:** the schema alone caps plaintext at 5,000,000 characters, about 1,313 workouts. Storage limits bind sooner. Web localStorage (commonly about 5 MB per origin, unverified on target browsers) at 1.33x base64 fills near 3.75 MB of plaintext, about 985 workouts. On Android, hex encoding doubles the stored size; AsyncStorage has historically had a default total limit of about 6 MB (confirm for the installed package), which fills near 3 MB of plaintext, about 790 workouts. After that point each change is refused with "That change could not be saved" (web) or "Save failed" (phone). The export file is capped by the same check.
- **Fix (decision required):** store each workout as its own record keyed by ID and keep only an ID list in the state record. Until that lands, warn at 80% so the person can export.

```diff
--- a/lib/saved-data.ts
+++ b/lib/saved-data.ts
@@ line 16
 export function parseSafeJson(raw:string,max=5_000_000):unknown{
+// Storage-size notice. Shown before the hard limit so the person can export a transfer file.
+export const SAVED_WARN_CHARS=4_000_000;
+export function savedSizeNotice(json:string):string|null{
+ return json.length>SAVED_WARN_CHARS?'Saved training is close to this app’s size limit. Export a transfer file now.':null;
+}
```

Sketch of the storage change (design, not a patch): `lib/saved-data.ts:15` drops `history` in favour of `historyIds:z.array(id).max(20000)`; `mobile/src/storage.ts` and `lib/browser-vault.ts` read and write `training-studio-workout:<id>` records; `app/page.tsx:110` validates the changed workout instead of the whole state.

### C2. Fields the schema does not list are deleted on the next save (Use cases 2, 6)

- **Where:** `lib/saved-data.ts:5`, `:6`, `:11`, `:15` (zod `z.object` strips unknown keys by default); `lib/saved-data.ts:17` (`readSavedState` returns the stripped value); `mobile/src/storage.ts:88` (read) followed by `:98` (write of the stripped in-memory state).
- **Failure:** any field a newer build, a future health or sync import, or a hand-edited transfer file adds is removed the first time the app saves. Nothing warns. This is silent data loss on the normal path, not an edge case.
- **Fix:** keep unknown keys on every object that is saved.

```diff
--- a/lib/saved-data.ts
+++ b/lib/saved-data.ts
@@ line 5 (profile)
-const profile=z.object({ …fields… });
+const profile=z.object({ …fields… }).passthrough();
@@ line 6 (item)
-const item=z.object({ …fields… });
+const item=z.object({ …fields… }).passthrough();
@@ line 11 (workout)
-const workout=z.object({ …fields… });
+const workout=z.object({ …fields… }).passthrough();
@@ line 15 (stateSchema)
-const stateSchema=z.object({ …fields… });
+const stateSchema=z.object({ …fields… }).passthrough();
```

Add a round-trip check to `scripts/check-native-storage.cjs`: a state with an extra top-level key and an extra key on one workout must survive `readSavedState` followed by `JSON.stringify`.

### C3. A failed phone save says "retry" but never retries (Use case 2)

- **Where:** `mobile/App.tsx:191-192`.
- **Failure:** a write error sets "Save failed · keep the app open and retry". Nothing retries until the next state change. If the app is closed or suspended first, the last change is lost, and the message told the person to keep the app open.
- **Fix:**

```diff
--- a/mobile/App.tsx
+++ b/mobile/App.tsx
@@ line 192
-    saveLocalState(state).then(() => { if (version === writeVersion.current) setSaveStatus('Saved on this device'); }).catch(() => { if (version === writeVersion.current) setSaveStatus('Save failed · keep the app open and retry'); });
+    const attempt = (n: number): void => {
+      saveLocalState(state)
+        .then(() => { if (version === writeVersion.current) setSaveStatus('Saved on this device'); })
+        .catch(() => {
+          if (version !== writeVersion.current) return;
+          if (n < 3) setTimeout(() => attempt(n + 1), 1000 * n);
+          else setSaveStatus('Save failed. Export a transfer file from Settings before closing the app.');
+        });
+    };
+    attempt(1);
```

The retry timers should also be cleared on unmount. Add that in the same change.

### C4. Web rest alarm is silenced when it fires late (Use case 4)

- **Where:** `components/rest-timer.tsx:28`.
- **Failure:** the guard `if(Date.now()-timer.endAt>10000)return;` runs before the browser notification. Browsers throttle hidden tabs, so a rest that ends while the tab is backgrounded can run more than 10 seconds late. The timer is then marked as alerted with no chime and no notification, even when notification permission is granted. The phone path is not affected: it schedules an absolute-time notification (`mobile/src/rest-alerts.ts:15`).
- **Fix:**

```diff
--- a/components/rest-timer.tsx
+++ b/components/rest-timer.tsx
@@ line 28
-onTimer({...timer,alerted:true});if(Date.now()-timer.endAt>10000)return;if(sound)chime();if(alerts&&document.hidden&&'Notification'in window&&Notification.permission==='granted')try{…}catch{}
+onTimer({...timer,alerted:true});const late=Date.now()-timer.endAt>10000;if(!late&&sound)chime();if(alerts&&(document.hidden||late)&&'Notification'in window&&Notification.permission==='granted')try{…}catch{}
```

### C5. Phone-edited rep ranges are saved as single targets; phone and web limits differ (Use case 1)

- **Where:** `mobile/src/session-editor.tsx:14` (item built with `reps` only, no `repMin`/`repMax`; sets up to 20; rest up to 3,600 s). Web: `lib/customize.ts:8` (sets up to 8; rest up to 600 s) and `lib/customize.ts:20` (writes `repMin`/`repMax` for reps metric). Schema: `lib/saved-data.ts:6` accepts rest up to 3,600.
- **Failure:** a rep range edited on the phone loses its range, and the web reads one number. The same plan can be valid on one device and rejected on the other.
- **Fix (range):**

```diff
--- a/mobile/src/session-editor.tsx
+++ b/mobile/src/session-editor.tsx
@@ line 14
-const item:Item={exerciseId:exercise,sets:Number(sets),reps:Number(amount),rest:Number(rest),kg:null};
+const item:Item={exerciseId:exercise,sets:Number(sets),reps:Number(amount),...(selected.metric==='reps'?{repMin:Number(amount),repMax:Number(amount)}:{}),rest:Number(rest),kg:null};
```

- **Decision (limits):** pick one set limit and one rest limit for additions and use them in both places. This plan does not choose the values.

### C6. Superset pairs are read from free text in notes (Use case 1; imported data is data, not instructions)

- **Where:** `lib/training-focus.ts:91-93` writes the pair into note text. `lib/substitutions.ts:21` reads it back with a regex. `lib/saved-data.ts:6` has no superset field.
- **Failure:** a note that is edited, or imported with the same wording, changes which exercises pair, how their sets and rest are computed, and how a substitution is applied. Structure is being driven by text.
- **Fix:** add a structured `supersetGroup` field. Keep the note text for display only.

```diff
--- a/lib/saved-data.ts
+++ b/lib/saved-data.ts
@@ line 6 (item)
-const item=z.object({ …fields…, note:text.optional() });
+const item=z.object({ …fields…, note:text.optional(), supersetGroup:short.optional() }).passthrough();
--- a/lib/training-focus.ts
+++ b/lib/training-focus.ts
@@ line 92
-addNote(a,'A1. '+instruction);addNote(b,'A2. '+instruction);
+addNote(a,'A1. '+instruction);addNote(b,'A2. '+instruction);a.supersetGroup='A';b.supersetGroup='A';
--- a/lib/substitutions.ts
+++ b/lib/substitutions.ts
@@ line 21
-const pair=item.note?.match(/A[12]\. \[Focus\] Assistance superset A:.*$/)?.[0];
+const pair=item.supersetGroup==='A'?item.note?.match(/A[12]\. \[Focus\] Assistance superset A:.*$/)?.[0]:undefined;
@@ line 22 (replacementItem return)
-return {exerciseId:to, …};
+return {exerciseId:to, supersetGroup:item.supersetGroup, …};
```

Also add `supersetGroup?:string` to `Item` in `lib/training.ts`. Existing saved pairs need a one-time migration that sets `supersetGroup` from the current note text. That migration is part of the change, not a follow-up.

### C7. Finish Workout writes back a render-time snapshot (Use cases 4, 5)

- **Where:** `app/page.tsx:141` (`finishWorkout` reads `s`, the render-time state) and `:144` (`setS(next)` writes the whole snapshot). Compare `logSet` at `:139`, which reads `currentState.current`.
- **Failure:** any update applied after the last render and before Finish is overwritten. One example is the rest alarm's `alerted` flag (`components/rest-timer.tsx:28`, wired at `app/page.tsx:118`). React normally re-renders first, so the window is narrow.
- **Fix:**

```diff
--- a/app/page.tsx
+++ b/app/page.tsx
@@ line 141
-const finishWorkout=(skip=false)=>{const w=s.active;if(!w)return;
+const finishWorkout=(skip=false)=>{const latest=currentState.current;const w=latest.active;if(!w)return;
```

Then, on lines 141–144, replace every `s.` with `latest.` and use `latest.plan` in place of `plan`.

### C8. Set changes address array positions, not set identity (Use cases 1, 5)

- **Where:** `lib/workout-log.ts:7-8` and `:13` (`index===j`), `:15-16`. `lib/substitutions.ts:60` rebuilds `active.sets` in target order, so positions move after a substitution.
- **Failure:** a caller that still holds an index from an earlier render can change a different exercise's set. Today this is covered by per-render updates and the cross-tab conflict check (`app/page.tsx:115`, `:121`), so the failure is latent.
- **Fix:** address sets by `exerciseId:set`.

```diff
--- a/lib/workout-log.ts
+++ b/lib/workout-log.ts
@@ line 7
-export function changeWorkoutSet(s:State,index:number,patch:Partial<SetLog>):State{
- if(!s.active||!s.active.sets[index])throw Error('That set is no longer open.');
+export function changeWorkoutSet(s:State,key:string,patch:Partial<SetLog>):State{
+ const index=s.active?s.active.sets.findIndex(x=>x.exerciseId+':'+x.set===key):-1;
+ if(!s.active||index<0)throw Error('That set is no longer open.');
```

Update the callers in `app/page.tsx:138-139` and the phone equivalents in `mobile/src/mobile-engine.ts:42` (`editSet`) to pass the key. Add a test where a substitution happens between two edits.

### C9. No device sync; the stated flows cannot pass (Use cases 2, 5) — DECISION

- **Where:** by design. The web uses `training-studio-v2` in localStorage (`app/page.tsx:114-115`). The phone uses `training-studio:mobile-local-demo:v1` in AsyncStorage (`mobile/src/storage.ts:15`). There is no network code for training data (see the backend answer in the handoff notes).
- **Failure:** a set logged at the gym does not appear in the browser at home. The two copies never converge and nothing reconciles them. A stale browser tab cannot overwrite the phone because the stores are separate, but the copies diverge silently. The `simulatedOffline` branch that "queues" proposals (`lib/training.ts:258`) has no release path, so it is not a real offline queue.
- **Needed:** a sync backend, a conflict rule (version vector or server-assigned revisions), and a migration story. No code change in this plan.

### C10. The AI daily feedback pipeline does not exist (Use case 3) — DECISION

- **Where:** no `app/api`, no edge function, no LLM call. `db/schema.ts:1` is an empty placeholder. `db/index.ts:6` throws if called, and nothing calls it. `lib/workout-review.ts:5-7` and `mobile/src/shared/workout-review.ts:29-33` are tested gates for a model that is not installed.
- **Failure:** the feature cannot be exercised as described. There is no blocking risk because nothing is sent.
- **Design note for when it is built:** send one completed `Workout` (about 3.8 KB on the sample, `lib/saved-data.ts:11`), not the whole state. The whole state grows toward the 5 MB ceiling in C1.

### C11. Image cache grows without limit; image loads have no timeout (Use case 7)

- **Where:** `public/sw.js:25-30` (`remember` stores every successful response, with no size or count limit). `public/sw.js:58-63` (static files, including JPEG photos, go network-first with no timeout).
- **Failure:** every photo viewed is stored in Cache Storage with no eviction, and the photo set is 100 MB (C13). On a spotty gym connection a photo request can hang until the TCP timeout before the cache fallback runs.
- **Fix:**

```diff
--- a/public/sw.js
+++ b/public/sw.js
@@ line 58-63
-    fetch(request)
-      .then(response => remember(request, response))
-      .catch(() => caches.match(request).then(cached => cached || Response.error()))
+    Promise.race([
+      fetch(request).then(response => remember(request, response)),
+      new Promise((_, reject) => setTimeout(() => reject(new Error('slow')), 3000))
+    ]).catch(() => caches.match(request).then(cached => cached || Response.error()))
```

Also trim the static cache after each `put`, keeping the newest 300 entries. Use `cache.keys()` in the `remember` path.

### C12. Touch targets below 44 px on desktop-density controls (Use case 7)

- **Where:** `components/ui/button.tsx:24-26` (default 36 px, sm 32 px, xs 24 px). `components/ui/input.tsx:11` (36 px). The phone `Pressable` components in `mobile/src/session-editor.tsx:7` use 48 px and are fine.
- **Status:** FIXED for touch screens in `9840be6`. `app/globals.css` sets `min-height: 44px` on `[data-slot=button]`, `[data-slot=input]`, `[data-slot=select-trigger]` under `pointer:coarse`. Measured 44 px at 390 px width. Desktop xs buttons (24 px) remain by design and are a DECISION if the owner wants them larger everywhere.

### C13. Heavy data on cold start (Use case 7)

- **Where:** `app/page.tsx:114` fetches `/exercise-guides.json` (2.5 MB) and `/exercise-content.json` (0.5 MB) on every cold start. `mobile/src/content.ts:1-2` bundles the same two files into the phone's JavaScript. `public/exercise-photos/` is 100 MB across 1,726 JPEGs (for example `Cable_Judo_Flip/0.jpg`, 919 KB).
- **Duplicates:** `public/exercise-guides.json` and `mobile/assets/content/exercise-guides.json` are byte-identical. `public/exercise-content.json` and `mobile/assets/content/exercise-content.json` are byte-identical.
- **Fix (web):** `app/page.tsx:114` already has an on-demand loader in `showExercise` (`:132`). Remove the mount-time guide fetch after confirming nothing reads `guides` before a guide opens.

```diff
--- a/app/page.tsx
+++ b/app/page.tsx
@@ line 114
-…fetch('/exercise-guides.json').then(r=>r.ok?r.json():{}).then(setGuides).catch(()=>{});fetch('/exercise-content.json')…
+…fetch('/exercise-content.json')…
```

- **Fix (phone):** load the guide files on first use instead of importing them at module load.

```diff
--- a/mobile/src/content.ts
+++ b/mobile/src/content.ts
@@ lines 1-5
-import guideData from '../assets/content/exercise-guides.json';
-import mediaData from '../assets/content/exercise-content.json';
-export const guides = guideData as Record<string, Guide>;
-export const media = mediaData as Record<string, {…}>;
+let guideCache: Record<string, Guide> | null = null;
+let mediaCache: Record<string, {…}> | null = null;
+export function guides(): Record<string, Guide> { return (guideCache ??= require('../assets/content/exercise-guides.json') as Record<string, Guide>); }
+export function media(): Record<string, {…}> { return (mediaCache ??= require('../assets/content/exercise-content.json') as Record<string, {…}>); }
```

Callers must change from `guides[id]` to `guides()[id]`. Then delete the duplicate copies in `mobile/assets/content/` by generating them from `public/` in the sync step.

- **Fix (photos, operations):** convert to WebP at 800 px width, add `srcset`, and set long-lived `Cache-Control` (see the configuration section).

### C14. Rigid schema points for third-party data (Use case 6) — DECISION (v3 migration)

- **Mixed timestamps:** epoch milliseconds for `Workout.startedAt` and `finishedAt` (`lib/saved-data.ts:11`) and `restTimer.endAt` (`:14`). ISO strings for `plan.acceptedAt` (`:8`) and `audit.at` (`:15`).
- **Local dates with no timezone:** `day()` (`lib/training.ts:21`) produces device-local `YYYY-MM-DD`. A workout logged after travel can land on the wrong day in an external app. There is no `timeZone` field on `Workout`.
- **Non-UUID IDs:** `uid()` (`lib/training.ts:24`) is prefix + base36 time + 5 random characters. Parent-child links (`Workout.sessionId`, `Event.id`) depend on these strings. Existing IDs must stay stable (project rule), so new records get UUIDs and old ones keep their IDs.
- **Rigid versions:** `schema: z.literal(2)` (`lib/saved-data.ts:15`) and `z.literal(1)` for the setup draft (`:18`). No migrator exists (none found by search), so any v3 change is breaking.
- **RIR bound drift:** `lib/saved-data.ts:11` accepts RIR up to 10, but `lib/workout-log.ts:22` (`RIR_MAX=5`) is what the UI enforces.
- **Fix (v3):**

```diff
--- a/lib/saved-data.ts
+++ b/lib/saved-data.ts
@@ line 15
-const stateSchema=z.object({ …, schema:z.literal(2), … });
+const stateSchema=z.object({ …, schema:z.union([z.literal(2),z.literal(3)]), … }).passthrough();
```

Add `migrateV2ToV3` with the new fields: `Workout.timeZone` (IANA string), `Workout.startedAtIso` and `finishedAtIso` (UTC ISO 8601), and a UUID `Workout.uuid`. Keep the old fields until every reader is updated.

---

## [CONFIGURATION FLOPS]

### K1. Stale Expo slug (`mobile/app.json:4`)

- `"slug": "bigcheese3232"` does not match the app name `Movefield`. The slug is part of the Expo project identity. Confirm before changing it.

```diff
--- a/mobile/app.json
+++ b/mobile/app.json
@@ line 4
-    "slug": "bigcheese3232",
+    "slug": "movefield",
```

### K2. Missing iOS bundle identifier (`mobile/app.json:8-10`)

- The `ios` block has no `bundleIdentifier`, so an EAS iOS build cannot be created. Android is `com.ghinz32.movefield`. Confirm that the iOS identifier should match.

```diff
--- a/mobile/app.json
+++ b/mobile/app.json
@@ line 8-10
     "ios": {
+      "bundleIdentifier": "com.ghinz32.movefield",
       "supportsTablet": true
     },
```

### K3. Android auto-backup restores a record without its key (`mobile/app.json`, android block)

- `allowBackup` is not set, so it defaults to true. Android backup can restore the encrypted AsyncStorage record without the Keystore key. The app handles this state (`KEY_MISSING_MESSAGE`, `mobile/src/storage.ts:20`), but the person gets a confusing restore. DECISION: disable backup, or keep it and rely on the transfer file.

```diff
--- a/mobile/app.json
+++ b/mobile/app.json
@@ android block
     "android": {
       "package": "com.ghinz32.movefield",
+      "allowBackup": false,
```

### K4. Empty production submit profile (`mobile/eas.json:24-25`)

- `"production": {}` has no App Store Connect app ID and no Play service-account path, so submission fails. Use placeholders; do not commit credentials.

```diff
--- a/mobile/eas.json
+++ b/mobile/eas.json
@@ line 24-25
   "submit": {
-    "production": {}
+    "production": {
+      "ios": { "ascAppId": "<App Store Connect app ID>" },
+      "android": { "serviceAccountKeyPath": "<path to Play service-account JSON, kept out of git>", "track": "internal" }
+    }
   }
```

### K5. Hosting headers: no cache policy, no CSP (`public/_headers`)

- No `Cache-Control` for hashed bundles (`/_next/static/*`), which should be immutable, or for photos. No `Content-Security-Policy`, although the app renders imported text. Test the CSP against the built HTML first, since inline styles and scripts may need hashes. Confirm that the host applies `_headers` for the Worker shell (`build/sites-worker.ts`).

```diff
--- a/public/_headers
+++ b/public/_headers
@@ /*
   Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), bluetooth=()
+  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
+
+/_next/static/*
+  Cache-Control: public, max-age=31536000, immutable
+
+/exercise-photos/*
+  Cache-Control: public, max-age=604800
```

### K6. Unbound database and dead connector module

- `.openai/hosting.json` sets `"d1": null` and `"r2": null`, so there is no data store. `db/index.ts:6` throws when `DB` is missing, and it has no callers. `lib/connectors.ts:1` imports `./connector-contract.mjs`, which does not exist. Nothing imports `lib/connectors.ts`. Delete `db/`, `lib/connectors.ts`, and `lib/connector-context.ts` unless the owner wants D1 next.

### K7. Mock sign-in default in the dev plugin (`build/sites-vite-plugin.ts:32`)

- `mockAuth = true` is the default. `vite.config.ts:65` passes `!managedLinux`, and the middleware only runs in `configureServer`, so production builds are unaffected. Change the default so a new caller must opt in.

```diff
--- a/build/sites-vite-plugin.ts
+++ b/build/sites-vite-plugin.ts
@@ line 32
-export function sites({ mockAuth = true } = {}): Plugin {
+export function sites({ mockAuth = false } = {}): Plugin {
```

---

## [AI DEBRIS & BLOAT]

Checked: zero `TODO`, `FIXME`, `XXX`, or `HACK` in `app`, `components`, `lib`, `mobile/src`, `mobile/App.tsx`, `build`, and `public`. No social-feed boilerplate was found: a search for feed, follower, leaderboard, kudos, friend, and social returned no product code. The items below are real leftovers.

1. **`simulatedOffline` flag with no way to clear it.** Declared in `lib/training.ts:19` and required by `lib/saved-data.ts:15`. Checked in `lib/customize.ts:7`, `lib/substitutions.ts:30`, `lib/tracking.ts:10`, `lib/onboarding.ts:56`, and `lib/training.ts:258`. The only UI is an icon at `app/page.tsx:157`. No control sets it to true or back to false. A transfer file that sets it locks every plan change. Remove it, or connect it to a real network check.
2. **Half-built AI review gates.** `lib/workout-review.ts:5-7` (`REVIEW_PROMPT`, `reviewRequest`) and `mobile/src/shared/workout-review.ts:29-33` (`aiReviewSchema`, `validateAiReview`) are tested only. No model is installed. Keep them until the on-device plan is decided, and say so in the file header.
3. **Validation by side effect.** `mobile/src/mobile-engine.ts:57` calls `editSet` for every set only to trigger its throws, and discards the return value. Replace it with a validator function.
4. **Three intervals for one timer.** `components/rest-timer.tsx:12` (500 ms), `:20` (250 ms), and `:27` (250 ms) each tick the same deadline. Merge them into one hook.
5. **Unused scaffolding.** `db/schema.ts:1` (empty placeholder), `db/index.ts`, `lib/connectors.ts`, `lib/connector-context.ts`, and `next.config.ts`. Also 42 of 61 `components/ui` primitives have no importers.
6. **Duplicated static content.** `mobile/assets/content/exercise-guides.json` and `exercise-content.json` are byte-identical to their `public/` copies (C13).
7. **Non-null assertions.** `mobile/src/rest-alerts.ts:15` (`t.endAt!`) is guarded by `mobile/src/shared/rest-timer.ts:30`, so it is safe today. `mobile/src/session-editor.tsx:10` (`state.plan!…!`) would throw if the plan changed while the editor was open. Not reproduced.
8. **Bound mismatch.** `lib/saved-data.ts:11` accepts RIR up to 10. `lib/workout-log.ts:22` allows 5 (C14).
9. **Tracked generated files.** `tsconfig.tsbuildinfo` is tracked and is rewritten by every `tsc` run. `docs/revision-13-validation.json` is rewritten by the check scripts. Both were restored after each run in this pass. Untrack the first, and have the check scripts write to a temp path.

---

## Strengths confirmed (no action)

- Rest timers store an absolute `endAt` (`lib/rest-timer.ts:6`, `:3`). They survive backgrounding and pause correctly.
- Phone rest alerts are scheduled as absolute-time notifications, so the OS fires them while the app is suspended (`mobile/src/rest-alerts.ts:15`).
- Web conflict detection compares the raw stored value under `navigator.locks` before each save (`app/page.tsx:115`), and a `storage` event pauses saving in other tabs (`app/page.tsx:121`).
- Phone storage is encrypted with a per-device key that is not in AsyncStorage (`mobile/src/storage.ts:8-12`), with a clear path when the key is missing.
- Set keys are stable `exerciseId:set` strings, so logged sets keep their identity across reordering in the data model.
- Web runs without phone-only hooks; there is no native API call in the browser bundle path.

## Not checked

- No run on a physical iPhone or Android device. Phone results come from unit-style engine tests and the Expo web preview.
- No measured browser storage quota. The 5 MB and 6 MB figures are typical values and need confirmation on target devices.
- No CSP, cache, or header test against the deployed host.
- No timing measurements for `setS` (`app/page.tsx:110`), which re-validates the whole state on every change. It is expected to slow down with large histories; not measured.
- Layout breakage at very wide widths and the full premium UX pass (Today, Plans, Calendar, Progress, Settings, logging) remain open.

## Decisions needed (owner)

1. C1: storage layout for history (per-workout records).
2. C9: whether device sync is in scope, and the conflict rule.
3. C10: whether the AI daily summary is built now, and where it runs.
4. C14: v3 schema migration and timestamp standard.
5. C5: the set and rest limits for added exercises.
6. K2/K3/K4: iOS bundle identifier, Android backup policy, store submission accounts.
7. C12: desktop button size.

## Verification run for this pass

- `pnpm exec tsc --noEmit` (web): exit 0.
- `npx tsc --noEmit` (mobile): exit 0.
- `node scripts/check-preferences.cjs`, `check-audit.cjs`, `check-native-storage.cjs`: exit 0.
- `npm run test:engine` (mobile): all listed checks PASS, including plan generation across 7 start weekdays, validated save and reload, sealed record tamper rejection, and transfer-file round trip.
- `node mobile/scripts/sync-shared.mjs`: copied 29 shared files. `mobile/docs/shared-snapshot.json` updated for `lib/onboarding.ts`. Generated report files were restored.
- Measured: saved-workout size on the bundled sample (C1).

Not re-run in this pass: `pnpm build` and the Expo export. Both passed earlier in the session, and no code changed after that run apart from the setup and plan-flow fixes, which were covered by the Playwright checks on web and the phone preview.
