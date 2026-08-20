# Hypou Android APK Smoke Test

## Artifact

- Package: `app.hypou.mobile`
- Minimum Android: API 24 / Android 7
- Target Android: API 36 / Android 16
- Artifact under test: signed release APK

## Automated Gate

- [ ] Targeted Android unit tests pass.
- [ ] Full Vitest suite passes.
- [ ] TypeScript project build passes.
- [ ] ESLint passes.
- [ ] Mobile web build passes with source maps disabled.
- [ ] Android mobile doctor passes.
- [ ] Gradle unit tests pass.
- [ ] Android Lint passes.
- [ ] Release APK signature verification passes.

## Emulator Gate

- [ ] Cold launch shows Hypou splash and login without a development server.
- [ ] Email login, Google login, cancellation, logout, and session restore work.
- [ ] Explore card layout and approved swipe animation match iOS.
- [ ] Like/pass, item detail, matches, and proposals work.
- [ ] Chat sends text and media and opens notification targets correctly.
- [ ] Item creation/editing handles photo, multiple photos, video, retry, and removal.
- [ ] Profile/avatar, settings, sharing, and account-deletion entry points work.
- [ ] Keyboard, bottom navigation, dialogs, system back, and app relaunch work.
- [ ] Audio/video LiveKit calls connect and release media after hang-up.

## Direct APK Gate

- [ ] APK installs outside Android Studio.
- [ ] APK launches with the Mac disconnected.
- [ ] APK is non-debuggable and signed by the expected certificate.
- [ ] Reinstall/update with the same certificate preserves application data.
- [ ] No development URL, source map, key, token, or credential is packaged.

## Physical Device Gate

- [ ] Camera capture and gallery selection use real device media.
- [ ] Video recording/upload works on real hardware.
- [ ] Google native login works with the release certificate.
- [ ] FCM works foregrounded, backgrounded, and terminated.
- [ ] Notification taps open message, proposal/match, missed call, and incoming call targets.
- [ ] LiveKit audio/video works with real microphone, speaker, and cameras.
- [ ] Poor-network recovery and process termination do not corrupt user state.

## Result

The APK milestone can be accepted with physical-device rows recorded as pending. Android/iOS parity cannot be accepted until every physical-device row passes.
