# Release

Use uma cópia de trabalho limpa e um commit identificável. Estes comandos
validam; publicação e upload exigem autorização explícita.

```bash
npm run release:status
npm run release -- web --check
npm run release -- ios --check
npm run release -- android --check
```

## Web e painel

O site público e o painel são publicados juntos pela Vercel. Envie uma branch,
valide a preview em `/teste` e `/admin`, e só então promova a preview aprovada.
Use o rollback da Vercel se necessário.

## TestFlight

```bash
npm run release:ios
```

O envio requer `APP_STORE_CONNECT_API_KEY_ID`,
`APP_STORE_CONNECT_ISSUER_ID` e `APP_STORE_CONNECT_API_KEY_CONTENT` fora do
Git, além de:

```bash
npm run release -- ios --publish --confirm-testflight
```

Antes do archive, rode no Simulator e valide login, feed, proposta, chat, perfil
e permissões em um aparelho físico.

## Android

```bash
npm run release:android
```

Google Play exige AAB assinado, Play App Signing, uma conta de serviço e o
`google-services.json` oficial mantido fora do Git. Nunca publique APK de debug.
Use [o checklist móvel](../qa/mobile-smoke.md) antes de teste interno.
