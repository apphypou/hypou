# HYPOU Mobile Release

## Node

Use Node `>=22 <25`. This repository has `.nvmrc`, `.node-version`, `.npmrc`, and `package.json` engines to keep mobile builds away from Node 25.

## Workspace Location

Do not run mobile builds from `~/Documents/HYPOU`. This machine has produced `ECANCELED: operation canceled, read` and extremely slow Vite builds from that location.

Use a local non-synced path instead:

```bash
mkdir -p /Users/will/Developer
git clone https://github.com/apphypou/hypou.git /Users/will/Developer/HYPOU
cd /Users/will/Developer/HYPOU
```

Also keep at least 15GB free disk before iOS/TestFlight builds. With less than that, Xcode/Vite/Capacitor can become unstable or very slow.

If your shell is on Node 25, run mobile commands with:

```bash
PATH="/Users/will/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH" npm run mobile:doctor
```

## Fast Simulator Loop

Use this while designing or debugging iOS:

```bash
npm run ios:dev
```

This starts/reuses Vite on port `8081`, installs the iOS app in the booted Simulator, and points Capacitor to `http://localhost:8081`.

Keep the terminal open. Most React/CSS changes refresh through Vite without rebuilding the iOS shell.

## Release-like Simulator Build

Use this only when you need to test the packaged `dist` build:

```bash
npm run ios:sim:static
```

## TestFlight Preparation

Use this before archiving in Xcode:

```bash
npm run ios:testflight
```

It runs the mobile doctor, builds the mobile web bundle with `vite.mobile.config.ts`, syncs iOS, and opens Xcode.

The normal sync path does not call `npx cap copy ios`/`npx cap update ios` because those commands were unreliable on this machine. It copies `dist` into `ios/App/App/public` and writes `ios/App/App/capacitor.config.json` directly.

Only run Capacitor's native update manually after adding/removing native plugins:

```bash
npx cap update ios
```

## Optional Fastlane Upload

After configuring App Store Connect API credentials, use:

```bash
npm run ios:testflight:upload
```

Required environment variables:

```bash
APP_STORE_CONNECT_API_KEY_ID=
APP_STORE_CONNECT_ISSUER_ID=
APP_STORE_CONNECT_API_KEY_CONTENT=
```

`APP_STORE_CONNECT_API_KEY_CONTENT` must be base64-encoded `.p8` content.

## Native Social Login

The app now prefers native Google login on Capacitor iOS/Android and native Apple login on iOS. It falls back to the existing Supabase OAuth browser flow when native login is unavailable or missing provider config.

Required public env vars for native Google login:

```bash
VITE_GOOGLE_WEB_CLIENT_ID=
VITE_GOOGLE_IOS_CLIENT_ID=
VITE_GOOGLE_IOS_REVERSED_CLIENT_ID=
```

Optional Apple override:

```bash
VITE_APPLE_CLIENT_ID=app.hypou.mobile
```

Notes:

- Google native login is skipped unless the required Google client IDs exist. Without them, the existing OAuth browser flow is used.
- `VITE_GOOGLE_IOS_REVERSED_CLIENT_ID` is injected into `ios/App/App/Info.plist` by `npm run mobile:sync-ios`, `npm run ios:sim:static`, and `npm run ios:testflight`.
- iOS Google login uses the local `NativeGoogleSignInPlugin` in `ios/App/CapApp-SPM` with GoogleSignIn-iOS 9.2.0 so Hypou controls the Supabase nonce: hashed nonce goes to Google, raw nonce goes to `signInWithIdToken`.
- iOS Sign in with Apple requires the App ID and provisioning profile to include the Sign in with Apple capability.
- iOS Simulator Sign in with Apple requires an Apple account configured in the Simulator Settings. Without that, native Apple returns `AuthorizationError 1000`; the app falls back to the existing Supabase OAuth browser flow.
- Apple login on Android currently uses the existing OAuth browser fallback.
- Supabase must have Google and Apple providers enabled.
- Do not add all-in-one social login plugins that bundle Facebook SDKs. Hypou only ships Google and Apple login.

After changing native social login config or dependencies:

```bash
PATH="/opt/homebrew/opt/node@22/bin:$PATH" node node_modules/@capacitor/cli/bin/capacitor update ios
PATH="/opt/homebrew/opt/node@22/bin:$PATH" npm run ios:sim:static
```
