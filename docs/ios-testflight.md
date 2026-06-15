# Hypou iOS TestFlight

Este projeto usa Capacitor para empacotar o app React/Vite como app iOS nativo.

## Estado atual

- Projeto iOS gerado em `ios/App/App.xcodeproj`.
- Bundle ID configurado: `app.hypou.mobile`.
- Nome do app: `Hypou`.
- Build web copiado para `ios/App/App/public`.
- Plugins iOS sincronizados:
  - App
  - Camera
  - Haptics
  - Keyboard
  - Push Notifications
  - Splash Screen
  - Status Bar
- Permissoes iOS configuradas em `ios/App/App/Info.plist`:
  - Camera
  - Galeria de fotos
  - Microfone
  - Localizacao

## Pre-requisitos para TestFlight

1. Instalar o Xcode completo pela App Store.
2. Configurar o Xcode como developer directory ativo:

```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
```

3. Ter uma conta Apple Developer paga.
4. Criar ou confirmar o App ID `app.hypou.mobile` no Apple Developer.
5. Criar o app no App Store Connect usando o mesmo Bundle ID.

## Build local antes do archive

Sempre que alterar o app web:

```bash
npm run build
npx cap sync ios
```

Depois abra o projeto nativo:

```bash
npx cap open ios
```

No Xcode:

1. Selecione o target `App`.
2. Em `Signing & Capabilities`, escolha seu Team.
3. Confirme o Bundle Identifier `app.hypou.mobile`.
4. Rode primeiro em um iPhone Simulator.
5. Rode em um iPhone fisico se possivel.

## Archive para TestFlight

No Xcode:

1. Selecione `Any iOS Device (arm64)` como destino.
2. Menu `Product > Archive`.
3. Quando abrir o Organizer, clique em `Distribute App`.
4. Escolha `App Store Connect`.
5. Escolha `Upload`.
6. Envie o build.

No App Store Connect:

1. Aguarde o processamento do build.
2. Abra a aba `TestFlight`.
3. Preencha as informacoes de teste quando solicitado.
4. Adicione testadores internos ou externos.
5. Para testadores externos, envie para Beta App Review.

## Observacoes importantes

- Push Notifications exigem capability no Xcode e configuracao APNs/Supabase antes de funcionar em dispositivos reais.
- O Simulator nao testa push notification remoto de ponta a ponta.
- Camera, galeria, microfone e localizacao devem ser testados em dispositivo fisico antes de convidar testadores externos.
- O app ainda depende do backend Supabase de producao configurado no cliente atual.
