# Android

- `app/build`, `.gradle`, `.kotlin`, assets Capacitor copiados e arquivos locais
  são gerados e não pertencem ao Git.
- `google-services*.json`, keystores e `local.properties` ficam fora do Git.
- Antes de alterações nativas, execute `npm run mobile:doctor:android`.
- A Play Store recebe AAB assinado; APK de debug serve apenas para teste local.
