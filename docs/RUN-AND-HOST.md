# Run, test and host Movefield

Status: local only. Nothing in this guide deploys, shares or publishes the app. Publishing needs your explicit approval first (see HANDOFF.md, "Publication boundary").

## 1. Run on the desktop (web version)

Requirements: Node 24 (the project was last checked on Node 22.22 in this environment; Node 24 is the target in CLAUDE.md), and pnpm 11.25.0.

```sh
# one time: install the pinned pnpm
corepack enable
corepack prepare pnpm@11.25.0 --activate

# from the project root
pnpm install --frozen-lockfile --prod=false
pnpm dev
```

Open the address that `pnpm dev` prints. It is normally http://127.0.0.1:5173. Use the printed address if the port differs.

Do not run `npm ci` in the project root. The root has no npm lockfile. The `mobile/` folder uses npm (see section 2).

Checks before you rely on a change:

```sh
pnpm exec tsc --noEmit
pnpm build
node scripts/check-preferences.cjs
node scripts/check-audit.cjs
node scripts/check-native-storage.cjs
node scripts/check-tools.cjs
node scripts/check-goals.cjs
node scripts/check-transfer.cjs
node scripts/check-browser-vault.cjs
```

Some scripts rewrite tracked report files (for example `docs/revision-13-validation.json` and `tsconfig.tsbuildinfo`). Inspect the diff and restore them with `git checkout --` before committing.

## 2. Run on your phone (native version)

The phone app is an Expo project in `mobile/`. It uses npm.

```sh
cd mobile
npm ci
npm run check          # type check
npm run test:engine    # training engine, encryption and transfer-file checks
npm start              # starts the development server and shows a QR code
```

1. Install **Expo Go** from the App Store or Google Play.
2. Put the phone and the computer on the same Wi-Fi network.
3. Scan the QR code from `npm start` with the phone camera (iPhone) or with Expo Go (Android).

Expo Go runs the current starter app. It does not run an on-device language model. The first planned model is Qwen3 0.6B (`docs/ai-feedback-plan.md`, section 3). Model features need a **native development build**, which the project is set up for with EAS Build (Expo's hosted build service). The profiles are in `mobile/eas.json`:

- `development`: a debug build with the development client, for your own phone. Start it with `npm run start:dev`.
- `preview`: an internal build for testers.
- `production`: a store build. It increments the build number.

Nothing has been built yet. The first build needs your Expo account, which this repository does not contain:

```sh
cd mobile
npx eas-cli@latest login                                              # your Expo account
npx eas-cli@latest init                                               # creates the project ID and writes it to app.json
npx eas-cli@latest build --profile development --platform android    # or --platform ios
```

Before the first build, EAS asks for an iOS bundle identifier and an Android package name. Choose them yourself. They identify the app in stores and should not change after release. They are not set in this repository. Building for an iPhone needs an Apple developer account.

`mobile/START-HERE.md` has the phone-specific notes, including what to check on a real device.

### What still needs a real phone

- Lock-screen rest alerts (iOS and Android).
- Restoring a transfer file on a second phone, including the password prompt.
- Screen-reader behaviour (VoiceOver, TalkBack) and the largest system text size.
- How long Argon2id takes on the phone. The desktop check takes about 0.35 s; the phone has not been timed.

## 3. Hosting

Two routes exist. Neither has been used for a live release.

**Web version.** The project was built for the existing Cloudflare Sites project named in `.openai/hosting.json`. That file is non-secret and must stay in the repository. The build (`pnpm build`) produces a Worker bundle and static assets. Publishing this build changes what people can open on the internet, so it needs your explicit approval each time. Until then, use section 1 locally.

Before any public release, read `docs/security-review.md` and `docs/deep-audit-2026-10-07.md`, and check:

- the account and two-factor screens are clearly marked as previews (they are not real accounts yet);
- the privacy statement matches what the app stores (on this device, encrypted, nothing sent out);
- the AI disclaimer appears wherever generated text appears.

**Phone version.** Store distribution needs an Expo account and EAS Build. The build profiles are in `mobile/eas.json`. The Expo project ID is not in `mobile/app.json` yet, because `eas init` creates it with your account. Apple and Google developer accounts are needed for store listings.

## 4. Moving your data to a new phone

Use Settings, "Transfer and backup", on the old phone: make a transfer file, set a password of at least 12 characters, and share the file to yourself. On the new phone, open the same screen, restore the file, and enter the password. Nothing is replaced until the file opens and you confirm.

Keep the password somewhere safe. A forgotten password cannot be recovered, and the file cannot be opened without it.

## 5. What is sent and stored

- Training data is stored on the device. Web data is encrypted in the browser with a key kept in IndexedDB. Phone data is encrypted with a key kept in the device's secure storage.
- Nothing leaves the device unless you share a transfer or backup file yourself.
- Plain (unencrypted) backups are still available and are labelled as not encrypted. Keep them private.
