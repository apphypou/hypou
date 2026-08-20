# HYPOU — instruções para agentes

## Produto e rotas

- Hypou é um aplicativo nativo iOS/Android. Não recrie uma versão web do app.
- O navegador entrega somente o site institucional/beta, termos, privacidade e
  o painel administrativo em `/admin`.
- Preserve a separação entre site público, painel autenticado e shell nativo.

## Ambiente

- Use Node `>=22 <25`. Nunca faça build móvel com Node 25.
- A cópia de trabalho principal é `/Volumes/ADATA SC735/DEV/HYPOU`.
- Não execute builds em `~/Documents/HYPOU`; mantenha pelo menos 15 GB livres
  antes de archives iOS.
- Antes de iOS/TestFlight execute `npm run mobile:doctor`; para Android use
  `npm run mobile:doctor:android`.

## Verificação

- Código TypeScript: `npm run typecheck`, `npm run lint`, `npm test`.
- Web: `npm run build:web`.
- Mobile: `npm run mobile:preflight`; Android aceita `-- --android`.
- Não publique, envie ao TestFlight ou Play Store sem autorização explícita.

## Regras de repositório

- `.env`, credenciais de assinatura, chaves e `google-services*.json` nunca
  entram no Git. Use `.env.example` como modelo.
- `build/`, `dist/`, `*.tsbuildinfo`, caches de IDE e assets nativos copiados
  são gerados localmente.
- Migrations do Supabase já aplicadas são históricas e imutáveis.
- Não crie arquivos de plano ou relatório histórico no repositório. Registre
  decisões permanentes em `docs/`; use issues/tarefas para trabalho futuro.

Leia o `AGENTS.md` do diretório que estiver alterando para regras locais.
