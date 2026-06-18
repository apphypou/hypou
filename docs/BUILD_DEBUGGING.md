# Build Debugging

## Current Root Cause

`npm run build:mobile` was stalling during Vite transform because the local install/runtime was dirty: shell Node was `v25.5.0`, and `node_modules` had been installed/run through that environment.

Fix applied:

```bash
rm -rf node_modules dist
PATH="/Users/will/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH" npm ci
```

Trace command:

```bash
PATH="/Users/will/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH" npm run build:mobile:trace
```

Trace result:

```text
3138 modules transformed
✓ built in 23.20s
```

Decision:

- Keep Node locked to `>=22 <25`.
- Do not run mobile releases from Node 25.
- If build stalls again, run `npm run build:mobile:trace` before changing source code.
