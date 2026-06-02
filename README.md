# Hypou — Troque o que tá parado

> Plataforma de trocas inteligentes baseada em swipe + match.
> Dê match, negocie e troque com segurança.

**URL:** [https://hypou.lovable.app](https://hypou.lovable.app)

---

## Visão Geral

Hypou é uma plataforma brasileira de troca de itens do dia a dia. A mecânica é simples: os usuários navegam por um feed de itens com swipe (à la Tinder), curtem os que interessam e, quando há interesse mútuo, um **match** é formado. A partir daí, os usuários conversam via chat integrado para combinar a troca.

### Principais recursos
- **Feed de swipe** com recomendações inteligentes baseadas em valor e proximidade geográfica
- **Match + Chat** para negociar trocas diretamente
- **Avaliação de confiança** entre usuários após cada troca
- **Painel administrativo** com KPIs, moderação e assistente IA
- **Chamada de vídeo** integrada via LiveKit
- **100% gratuito** — sem taxas, sem pagamentos

---

## Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Framework | React 18 + TypeScript |
| Build | Vite 5 |
| Estilos | Tailwind CSS 3 + shadcn/ui |
| Animações | Framer Motion |
| Estado servidor | TanStack React Query |
| Backend | Supabase (Auth, Postgres, Storage, Realtime, Edge Functions) |
| Mobile | Capacitor (iOS/Android) |
| Testes | Vitest + Testing Library |

---

## Estrutura do Projeto

```
src/
├── components/          # UI reutilizável + shadcn/ui
│   ├── admin/           # Componentes do painel admin
│   ├── landing/         # Seções da landing page
│   └── ui/              # 40+ componentes Radix/shadcn
├── pages/               # Telas da aplicação
│   └── admin/           # Telas do painel admin
├── hooks/               # Lógica de estado e queries
├── services/            # Acesso a dados (Supabase SDK)
├── lib/                 # Utilitários e helpers
├── constants/           # Dados estáticos (categorias, etc.)
├── integrations/
│   └── supabase/        # Cliente SDK + tipos gerados
└── test/                # Testes unitários e e2e
```

---

## Scripts disponíveis

```bash
# Ambiente de desenvolvimento
bun dev

# Build para produção
bun build

# Preview do build
bun preview

# Lint
bun lint

# Testes
bun test
bun test:watch
```

---

## Principais fluxos

1. **Explorar** — Swipe cards de itens, curta os que interessam
2. **Propor troca** — Selecione um item seu para oferecer em troca
3. **Match** — Quando o dono aceita, abre-se o chat
4. **Negociar** — Chat com mídia, chamada de vídeo e banner de contexto da troca
5. **Confirmar** — Ambos confirmam a entrega; troca finalizada
6. **Avaliar** — Rating de 1-5 estrelas para construir reputação

---

## Arquitetura de Dados

- **Supabase Postgres** com RLS (Row Level Security) em todas as tabelas
- **Supabase Realtime** para atualizações ao vivo (matches, mensagens, notificações)
- **Supabase Storage** para fotos de itens, avatares e mídia de chat
- **Edge Functions** para validação de preços com IA, push notifications e exclusão de conta

---

## Mobile (Capacitor)

O app é empacotado como PWA e também como app nativo via Capacitor:

```bash
# Sincronizar plataformas nativas
npx cap sync

# Rodar no Android
npx cap run android

# Rodar no iOS
npx cap run ios
```

---

## Licença

Projeto privado. Todos os direitos reservados.

---

> Desenvolvido com ❤️ no Brasil.
