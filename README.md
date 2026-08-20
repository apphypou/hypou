# Hypou — troque o que está parado

Hypou é um aplicativo nativo para iOS e Android que conecta pessoas para trocar
itens. O navegador hospeda somente o site institucional, o cadastro do beta e o
painel administrativo; não há versão web do produto para clientes.

- Site e beta: [hypou.app](https://hypou.app)
- Painel: [hypou.app/admin](https://hypou.app/admin)
- Aplicativo: Capacitor para iOS e Android

## Início rápido

Use Node `>=22 <25` e npm. Em máquinas com Node 25 instalado, prefixe os
comandos móveis com `PATH="/opt/homebrew/opt/node@22/bin:$PATH"`.

```bash
npm ci
npm run dev
npm run typecheck
npm run lint
npm test
```

## Comandos principais

```bash
# Site institucional e painel
npm run build:web

# Aplicativo e ambientes nativos
npm run build:mobile
npm run mobile:doctor
npm run mobile:doctor:android

# Validação de release (não publica)
npm run release -- web --check
npm run release -- ios --check
npm run release -- android --check
```

Consulte [docs/README.md](docs/README.md) para arquitetura, banco, QA e release.

## Estrutura

```text
src/        Aplicação React, páginas, módulos de domínio e testes
supabase/   Migrations e Edge Functions
ios/        Projeto nativo iOS
android/    Projeto nativo Android
docs/       Documentação operacional atual
scripts/    Automação local de build, banco e release
```

Projeto privado. Todos os direitos reservados.
