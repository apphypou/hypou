# Hypou Mobile Release

## Before Every iOS TestFlight Build

1. Use Node from `.nvmrc`.
2. Run `npm run mobile:doctor`.
3. Run `npm run mobile:ios`.
4. In Xcode, increment Build number.
5. Run on iOS Simulator.
6. Smoke-test:
   - Login
   - Explorar card layout
   - Swipe/pass/like
   - Detalhes do produto
   - Propostas
   - Chat header
   - Enviar texto no chat
   - Perfil
7. Archive with `Any iOS Device (arm64)`.
8. Upload archive to App Store Connect.
9. Attach build in TestFlight.

## Before Android Internal Testing

1. Run `npm run mobile:doctor`.
2. Run `npm run mobile:android`.
3. Run app on Android Emulator.
4. Smoke-test the same flows as iOS.
5. Build signed release in Android Studio.

## Never Do This

- Do not edit `ios/App/App/public` by hand.
- Do not copy `dist` into iOS manually except emergency simulator testing.
- Do not ship if `npm run build:mobile` fails.
- Do not mix UI commits with release pipeline commits.
- Do not use `npx cap` if it hangs; use `npm run mobile:ios` or `npm run mobile:android`.
