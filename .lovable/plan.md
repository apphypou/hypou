# Landing Page Hypou — Download nas Lojas

## Objetivo
Criar uma landing page de apresentação do app Hypou com foco em conversão para download nas lojas (App Store e Google Play), substituindo (ou convivendo com) a tela atual de boas-vindas, mantendo a identidade visual Liquid Glass / cyan neon e usando Framer Motion para microinterações de alto padrão.

## Decisão de roteamento
- Nova rota pública: `/baixar` (Landing focada em conversão para lojas).
- A rota `/` (Index atual com botões "Criar conta / Entrar") permanece como app entry.
- Em `/baixar` os CTAs principais NÃO levam para cadastro/login — levam para as lojas (badges oficiais Apple/Google).
- Links das lojas configuráveis via constantes (placeholders agora; usuário troca quando publicar).

```
Constantes em src/config/storeLinks.ts
  APP_STORE_URL = "#" (placeholder)
  PLAY_STORE_URL = "#" (placeholder)
```

Detecção de plataforma com `navigator.userAgent`:
- iOS → destaca botão App Store
- Android → destaca botão Play Store
- Desktop → mostra ambos lado a lado + QR code para abrir no celular

## Estrutura da página (mobile-first, scroll vertical)

1. **Hero**
   - Logo Hypou (HypouLogo) + badge "Disponível agora"
   - H1: "Troque o que tá parado. **Hypou** o que você quer."
   - Subtítulo curto sobre trocas seguras e gratuitas
   - 2 botões store badges (SVG oficiais Apple/Google) com hover-scale
   - QR code (desktop) gerado client-side via biblioteca leve `qrcode` ou SVG estático apontando para `/baixar`
   - Mockup do app flutuando (reaproveita as imagens hero existentes: ps5, notebook, headphones) com parallax sutil em scroll (Framer `useScroll` + `useTransform`)

2. **Como funciona** (3 passos)
   - Cards Liquid Glass com ícones Lucide (Search, Heart, Handshake)
   - Stagger animation com `whileInView`
   - "Descubra → Hypou → Troque"

3. **Showcase de produtos**
   - Reaproveita o carrossel animado do Index.tsx (par de cards trocando) — já existe e é o destaque visual
   - Headline "Match de objetos, não de pessoas"

4. **Diferenciais** (grid 2x2)
   - 100% gratuito
   - IA valida preço justo
   - Chat seguro pós-match
   - Avaliações entre usuários
   - Cards glass com `motion.div` `whileHover={{ y: -4 }}`

5. **Prova social / números**
   - Contador animado (Framer `animate` em `motion.span`) — placeholders editáveis: "+10k trocas", "+5k usuários", "Nota 4.8"

6. **CTA final**
   - Repete badges das lojas + "Baixe grátis agora"
   - Background com gradient mesh cyan/purple (mesmo do Index)

7. **Footer**
   - Links: Termos, Privacidade, Suporte (mailto), Instagram (placeholder)
   - © Hypou 2026

## Animações (Framer Motion)
- Hero: fade-up stagger (mesma curva `[0.25, 0.46, 0.45, 0.94]` já usada)
- Mockup: `useScroll` + `useTransform` para parallax Y leve (-30px → +30px)
- Seções: `whileInView` com `viewport={{ once: true, margin: "-80px" }}`
- Botões store: `whileHover={{ scale: 1.04 }}` + `whileTap={{ scale: 0.96 }}`
- Números: `motion.span` com tween de 0 ao valor final em 1.5s `whileInView`
- Reduce motion: respeitar `prefers-reduced-motion` desabilitando parallax

## Componentes a criar
- `src/pages/Baixar.tsx` — página principal
- `src/components/landing/StoreBadge.tsx` — botão SVG App Store / Play Store
- `src/components/landing/HowItWorks.tsx`
- `src/components/landing/Differentials.tsx`
- `src/components/landing/StatsCounter.tsx`
- `src/components/landing/LandingFooter.tsx`
- `src/config/storeLinks.ts`

## Detalhes técnicos
- Adicionar rota lazy em `App.tsx`: `const Baixar = lazy(() => import("./pages/Baixar"))` em `/baixar`
- SEO: `<title>` e `<meta name="description">` setados via `useEffect` (padrão usado no projeto, sem react-helmet)
- Imagens já compactadas / `loading="lazy"`
- Sem dependências novas obrigatórias (QR code: gerar via `<img src="https://api.qrserver.com/v1/create-qr-code/?data=...&size=200x200">` para evitar pacote extra)
- Acessibilidade: `aria-label` nas badges, contraste AA, foco visível
- Responsivo: mobile-first; em ≥md vira layout 2 colunas no hero

## Identidade visual
- Mantém: bg `#1C1C1C`, primário cyan `#18FDF6`, Plus Jakarta Sans, glass-card existente, gradient mesh do Index
- Tom de voz: "Troca", "Hypou", "Flopou" conforme memory

## Documentação
- Atualizar `documentacao.md` com a nova rota `/baixar` e seu propósito (conforme regra do projeto)

## Fora de escopo
- Configuração real dos links das lojas (apps ainda não publicados — fica como placeholder `#`)
- Testes E2E da landing
- i18n (mantém PT-BR)

## Resultado esperado
Uma landing page de nível premium em `/baixar`, com animações fluidas Framer Motion, conversão clara para App Store e Google Play, totalmente alinhada à identidade visual Liquid Glass do Hypou.
