## Objetivo

Refinar o card do `Explorar` para parecer mais próximo da referência (Yasmin Cardoso): remover o "card branco" de informações e deixar texto flutuando sobre um gradiente, e substituir o `SwipeToggle` por dois botões circulares Liquid Glass (Flopou / Hypou).

## Mudanças visuais

### 1. Painel de informações — gradiente em vez de card

Em `src/components/SwipeCard.tsx` (bloco "COMPACT INFO PANEL", linhas ~585-648):

- Remover o wrapper `rounded-2xl bg-white/15 backdrop-blur-2xl border ...`.
- O conteúdo (categoria, condição, local, nome, preço, "Compatível com…") fica direto sobre a imagem.
- Aumentar a altura do gradient de baixo (já existente em ~linha 518) para ~`h-72`, com paradas mais densas no fim:  
  `bg-gradient-to-t from-black/85 via-black/55 via-40% to-transparent`.
- Texto: nome em `text-2xl font-extrabold`, preço em chip discreto (sem fundo), categoria/condição/local viram chips Liquid Glass pequenos (`rounded-full bg-white/10 backdrop-blur-md border border-white/15`).
- Manter `cursor-pointer` + `onClick={toggleExpand}` no container, com seta `ChevronUp` discreta no canto direito.

### 2. Botões Hypou / Flopou — Liquid Glass circulares

Em `src/pages/Explorar.tsx` (linhas ~374-387):

- Remover o `SwipeToggle`.
- Inserir duas botões circulares fixas no rodapé (logo acima do `BottomNav`), centralizadas com `gap-6`:
  - **Flopou** (esquerda): `h-16 w-16 rounded-full bg-white/10 backdrop-blur-2xl border border-white/15` com ícone `X` (lucide) em `text-danger`.
  - **Hypou** (direita): mesmo estilo, ícone `Heart` em `text-success` (ou primary cyan), com `neon-glow` sutil.
- Ambos chamam `cardRef.current?.triggerSwipe("dislike" | "like")`, reaproveitando o handler já existente.
- Pressionar: `active:scale-90 transition-transform`. Desabilitar quando `swipingRef.current`.

### 3. Ajustes finos

- Aumentar `pb-36` da `main` para `pb-40` no Explorar para dar respiro aos novos botões.
- Garantir contraste do texto sobre imagens claras com `drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]` no nome e preço.
- Remover o `border` translúcido que existia no card antigo para evitar "moldura" visual.

## Fora de escopo

- Lógica de swipe por gesto continua funcionando normalmente.
- Tela expandida (overlay com detalhes completos) permanece igual.
- Tema, cores semânticas e tokens não mudam.
