

## Auditoria Critica da Tela Explorar — Visao de Senior UX/Design/Comportamental

---

### PROBLEMAS IDENTIFICADOS

#### 1. Botoes obstruem conteudo critico do card
Na screenshot, os botoes Passar e Hypou estao **por cima** do conteudo do card (condition "USED", descricao e valor de mercado ficam parcialmente cobertos). O usuario nao consegue ler as informacoes mais importantes antes de tomar a decisao. Isso e gravissimo: **a decisao e tomada sem informacao completa**, o que gera arrependimento e reduz confianca.

#### 2. Hierarquia visual invertida
O valor de mercado — a informacao mais importante para decisao de troca — esta na parte mais baixa do card, com menor visibilidade e parcialmente coberto. Deveria ser a informacao mais destacada apos o nome.

#### 3. Nenhum indicador de progresso ou escassez
O usuario nao sabe quantos itens restam. Sem feedback de progresso, nao ha urgencia nem senso de recompensa. **Vies de completude** completamente ignorado (as pessoas querem completar tarefas — mostrar "12 de 47" cria engajamento).

#### 4. Sem galeria de imagens navegavel
O badge mostra "2 fotos" mas o usuario nao consegue ver a segunda. Em uma plataforma de troca de bens fisicos, **ver o produto de multiplos angulos e essencial** para a decisao. A taxa de "like" cego sem ver todas as fotos gera matches de baixa qualidade.

#### 5. Nenhuma informacao do dono do item
Quem e o dono? Tem foto? Tem reputacao? Em plataformas de troca, **confianca no outro usuario** e tao importante quanto o item. Nao mostrar nada sobre o dono cria fricao psicologica.

#### 6. Header desperdicando espaco vertical
O header "Encontre Trocas / Explorar Trocas" ocupa ~80px de espaco vertical precioso sem adicionar valor funcional. O usuario ja sabe onde esta (o BottomNav indica). Isso e redundancia que rouba espaco do card.

#### 7. Sem feedback haptico/visual claro pos-acao
Apos swipe, o proximo card aparece sem nenhuma celebracao ou micro-interacao. Em apps de swipe de sucesso (Tinder, Bumble), ha **micro-recompensas** constantes que mantem o loop de dopamina ativo.

#### 8. Sem possibilidade de desfazer (undo)
O usuario fez swipe errado? Perdeu. Nao ha botao de "voltar". Isso gera **ansiedade de perda** (loss aversion) que faz o usuario swipear mais devagar ou desistir.

#### 9. Label "USED" em ingles
O campo `condition` esta vindo do banco como "USED" em vez de traduzido. Quebra a experiencia em portugues.

#### 10. Botoes de acao sem area de toque segura
Os botoes de 64x64px estao adequados, mas a area entre eles e o card e minima. Em uso real com polegar, o risco de tap acidental no card em vez do botao e alto.

---

### PLANO DE ACAO COMPLETO

#### Fase 1 — Correcoes criticas de layout (prioridade maxima)

**Arquivo: `src/pages/Explorar.tsx`**
- Reduzir o header: remover o subtitulo "Encontre Trocas", manter apenas "Explorar" em uma linha compacta (~40px total). Recuperar ~40px para o card.
- Adicionar contador de progresso discreto no header: "12/47" ou barra de progresso sutil.
- Garantir que os botoes fixos tenham `backdrop-blur` e um fundo semi-transparente com gradiente para nao obstruir conteudo — criar uma "zona de fade" entre o card e os botoes.

**Arquivo: `src/components/SwipeCard.tsx`**
- Reorganizar hierarquia do conteudo na area de texto:
  1. Categoria (badge) + contador de fotos
  2. Nome do item (h2, tamanho atual)
  3. **Valor de mercado** (subir para logo abaixo do nome — e a info mais importante)
  4. Localizacao + condition na mesma linha (compactar)
  5. Descricao (line-clamp-2)
- Traduzir `condition` com um mapa: `{ "USED": "Usado", "NEW": "Novo", "LIKE_NEW": "Semi-novo" }`.
- Adicionar avatar + nome do dono do item (mini-perfil) no topo do card, sobre a imagem, com um badge discreto.

#### Fase 2 — Galeria de imagens swipavel

**Arquivo: `src/components/SwipeCard.tsx`**
- Substituir a imagem unica por um carrossel horizontal de dots (nao setas).
- Tap no lado esquerdo/direito da imagem avanca/retrocede foto.
- Indicador de dots na parte superior da imagem.
- Isso nao interfere com o drag horizontal do card porque o tap e distinto do drag.

#### Fase 3 — Micro-interacoes e retencao

**Arquivo: `src/pages/Explorar.tsx`**
- Adicionar botao de "undo" (seta para tras) menor, entre os dois botoes principais.
- Ao dar "Hypou", adicionar um pulso/ripple sutil no botao + haptic feedback via `navigator.vibrate(50)`.

#### Fase 4 — Zona de fade nos botoes

**Arquivo: `src/pages/Explorar.tsx`**
- Os botoes fixos devem ter um gradiente `from-background to-transparent` acima deles (~40px) para que o conteudo do card "desapareca" suavemente atras dos botoes em vez de ser cortado abruptamente.

---

### RESUMO DAS ALTERACOES POR ARQUIVO

| Arquivo | Alteracoes |
|---|---|
| `src/components/SwipeCard.tsx` | Reorganizar hierarquia (valor sobe), traduzir condition, adicionar mini-perfil do dono, preparar para galeria de imagens |
| `src/pages/Explorar.tsx` | Compactar header, adicionar contador de progresso, adicionar gradiente de fade nos botoes fixos, adicionar botao undo |

### RESULTADO ESPERADO

```text
┌─────────────────────────┐
│ Explorar          12/47 │  ← header compacto
├─────────────────────────┤
│ 👤 João • ⭐ 4.8        │  ← mini-perfil dono
│  ● ● ○                  │  ← dots galeria
│                         │
│      [  IMAGEM  ]       │
│                         │
│  VIDEOGAMES      📷 2   │
│  PC Gamer RTX 4060      │
│  R$ 3.500,00            │  ← valor SUBIU
│  📍 Goiânia • 📦 Usado  │  ← compactado
│  Descricao curta...     │
│ ▓▓▓░░░░░░░░ fade ░░░░░ │  ← gradiente fade
│   (↩)   (X)    (❤️)     │  ← undo + acoes
│  VOLTAR PASSAR  HYPOU   │
├─────────────────────────┤
│ EXPLORAR TROCAS CHAT... │
└─────────────────────────┘
```

