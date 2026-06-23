# HYPOU Agent Notes

- Use Node LTS for this project: `>=22 <25`.
- Do not run mobile/build/release commands with Node 25.
- If the shell is on Node 25, prefix commands with:
  `PATH="/opt/homebrew/opt/node@22/bin:$PATH" <command>`
- Before iOS/TestFlight work, run `npm run mobile:doctor`.
- For fast iOS Simulator iteration, use `npm run ios:dev` or `npm run ios:sim`; this installs a native shell that loads the local Vite server.
- For a release-like Simulator package, use `npm run ios:sim:static`.
- For TestFlight preparation, use `npm run ios:testflight`; for Fastlane upload, use `npm run ios:testflight:upload` after configuring App Store Connect API credentials.
- Main working copy is now `/Volumes/ADATA SC735/DEV/HYPOU`.
- Do not work from `~/Documents/HYPOU`; macOS/iCloud/FileProvider reads have produced `ECANCELED` and 20+ minute builds. Use `/Volumes/ADATA SC735/DEV/HYPOU`, `/Users/will/Developer/HYPOU`, or another non-synced local folder.
- Keep at least 15GB free disk before iOS/TestFlight builds.
