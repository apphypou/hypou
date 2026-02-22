

# Hypou - Design System + Rebranding

## Resumo

Refatorar todo o projeto para criar um Design System reutilizavel (DRY) e atualizar a identidade do app de "Likefy" (luxo/elite) para "Hypou" (massa/democratico), mantendo o visual dark + ciano neon intacto.

---

## Parte 1: Design System - Componentes Reutilizaveis

### 1.1 `<BottomNav />` - Componente de navegacao inferior

O navbar flutuante esta duplicado em 3 telas (Explorar, Matches, MeuPerfil) com codigo quase identico. Sera extraido para um componente unico.

**Arquivo:** `src/components/BottomNav.tsx`

- Recebe `activeTab` como prop (ex: "explorar", "trocas", "chat", "perfil")
- Renderiza os 4 itens de navegacao com icones, labels e badge
- Aplica estilos ativos/inativos automaticamente
- Posicionamento absoluto + glass-panel ja embutido

### 1.2 `<NeonButton />` - Botao padrao com variantes

O botao com neon glow esta repetido em todas as telas com estilos inline longos. Sera um componente com variantes.

**Arquivo:** `src/components/NeonButton.tsx`

Variantes:
- `primary` - Fundo ciano, texto escuro, neon glow (CTAs principais)
- `outline` - Borda ciano, fundo transparente (CTAs secundarios)
- `ghost` - Sem borda, texto claro (acoes terciarias)
- `icon` - Circular, para botoes de icone (filtros, voltar, etc.)

Tamanhos: `sm`, `md`, `lg`

### 1.3 `<GlassCard />` - Card com efeito glass

O estilo glass-card esta sendo aplicado manualmente. Sera um componente wrapper.

**Arquivo:** `src/components/GlassCard.tsx`

- Aplica `glass-card` + `rounded-[2rem]` + hover glow
- Props: `hoverable`, `className`, `children`

### 1.4 `<ScreenLayout />` - Layout base das telas

Todas as telas internas seguem o mesmo padrao: container full-height + bg-black + overflow-hidden. Sera um wrapper.

**Arquivo:** `src/components/ScreenLayout.tsx`

- Container `h-[100dvh] bg-black text-foreground overflow-hidden`
- Slot para header, main e bottom nav
- Aplica `relative flex flex-col`

### 1.5 `<IconButton />` - Botao circular de icone

Os botoes redondos (filtro, busca, voltar) estao duplicados com classes identicas.

**Arquivo:** `src/components/IconButton.tsx`

- Wrapper circular `h-11 w-11 rounded-full bg-muted/50 border border-foreground/10`
- Recebe `icon` e `onClick`

---

## Parte 2: Rebranding - De "Likefy" para "Hypou"

### 2.1 Mudancas de nome e identidade

| Antes (Likefy) | Depois (Hypou) |
|---|---|
| "Likefy" | "Hypou" |
| "Exclusive Club" | "Plataforma de Trocas" |
| "Premium Marketplace" | "Encontre Trocas" |
| "Plano Elite" | "Conta Verificada" |

### 2.2 Mudancas de copy - Linguagem Democratica

**Tela Index (Landing):**
| Antes | Depois |
|---|---|
| "Exclusive Club" | "Troque com seguranca" |
| "Boas-Vindas a Likefy" | "Bem-vindo ao Hypou" |
| "faca rolo" | "faca trocas" |

**Tela Explorar:**
| Antes | Depois |
|---|---|
| "Premium Marketplace" | "Encontre Trocas" |
| "Explorar Permutas" | "Explorar Trocas" |
| "Imovel Premium" | "Imovel" |
| "Valor Estimado" | "Valor de mercado" |
| Botao Heart (curtir) | "Tenho Interesse" (semantica) |

**Tela Perfil (Onboarding):**
| Antes | Depois |
|---|---|
| "perfil premium" | "seu perfil" |
| "conectar com a elite" | "comecar a trocar" |
| "O que voce ta cacando hoje?" | "O que voce quer trocar?" |
| "O que voce vai desapegar?" | "Cadastre seu item" |
| "FINALIZAR E DAR MATCH" | "COMECAR A TROCAR" |
| "Ate 5 fotos de alta qualidade" | "Ate 5 fotos do item" |

**Tela Matches:**
| Antes | Depois |
|---|---|
| "Minhas Conexoes" | "Suas Trocas" |
| "Meus Matches" | "Propostas de Troca" |
| "Ofertas de Match" | "Interesses Recebidos" |
| "Novo Match" (badge) | "Nova Proposta" |
| "Hot" (badge) | "Popular" |
| "Valor estimado" | "Valor de mercado" |

**Tela Match (confirmacao):**
| Antes | Depois |
|---|---|
| "Conexao Estabelecida" | "Troca Confirmada" |
| "demonstraram interesse mutuo nos bens" | "tem interesse em trocar itens" |
| "Continuar buscando" | "Ver mais trocas" |

**Tela MeuPerfil:**
| Antes | Depois |
|---|---|
| "Permutas" (stat) | "Trocas" |
| "Plano Elite" | "Conta Verificada" |
| "Meus Ativos" | "Meus Itens" |
| "Avaliado em" | "Valor de mercado" |
| "Imovel" / "Joia" | "Imovel" / "Acessorio" |
| "Patek Philippe Nautilus" | Item mais acessivel (ex: "Apple Watch Series 9") |

**Tela Matches - Dados mockados atualizados:**

Os itens de luxo (Mansao R$18.5M, Porsche R$1.8M, Azimut R$4.2M, Rolex R$350k, Penthouse R$22M) serao substituidos por itens de massa:

1. iPhone 15 Pro Max - Sao Paulo, SP - R$ 6.500 - badge "Nova Proposta"
2. PlayStation 5 + Jogos - 2023, Seminovo - R$ 3.200
3. Honda CB 500F - Campinas, SP - R$ 28.000 - badge "Popular"
4. MacBook Air M2 - Usado, Excelente estado - R$ 5.800
5. Sofa Retratil 3 Lugares - Belo Horizonte, MG - R$ 2.400

**Tela Explorar - Card principal:**
- De "Mansao Morumbi / R$18.500.000 / Imovel Premium" para item acessivel como "iPhone 15 Pro Max / R$ 6.500 / Celular"

**Tela MeuPerfil - Ativos do usuario:**
1. "iPhone 14 Pro" - R$ 4.800 (em vez de Mansao R$18.5M)
2. "Honda CG 160" - R$ 12.000 (em vez de Porsche R$1.2M)
3. "Apple Watch Series 9" - R$ 2.500 (em vez de Patek Philippe R$850K)

### 2.3 Navegacao - Labels atualizados

| Antes | Depois |
|---|---|
| "Explorar" | "Explorar" (mantido) |
| "Matches" | "Trocas" |
| "Chat" | "Chat" (mantido) |
| "Perfil" | "Perfil" (mantido) |

---

## Parte 3: Detalhes Tecnicos

### Arquivos a criar (5):
1. `src/components/BottomNav.tsx`
2. `src/components/NeonButton.tsx`
3. `src/components/GlassCard.tsx`
4. `src/components/ScreenLayout.tsx`
5. `src/components/IconButton.tsx`

### Arquivos a editar (7):
1. `src/pages/Index.tsx` - Rebranding copy + usar NeonButton
2. `src/pages/Explorar.tsx` - Rebranding + usar BottomNav, ScreenLayout, IconButton, dados de massa
3. `src/pages/Matches.tsx` - Rebranding + usar BottomNav, ScreenLayout, GlassCard, IconButton, dados de massa
4. `src/pages/MeuPerfil.tsx` - Rebranding + usar BottomNav, ScreenLayout, GlassCard, IconButton, dados de massa
5. `src/pages/Perfil.tsx` - Rebranding copy + usar NeonButton
6. `src/pages/Match.tsx` - Rebranding copy + usar NeonButton
7. `src/pages/NotFound.tsx` - Copy em portugues

### Arquivos sem alteracao:
- `tailwind.config.ts` - Tokens de cor ja estao bem configurados
- `src/index.css` - Utilities glass-panel, glass-card, neon-glow ja estao corretos
- Componentes `src/components/ui/*` - Nao precisam mudar

### Ordem de execucao:
1. Criar os 5 componentes base
2. Refatorar as 7 telas para usar os componentes + nova copy
3. Tudo em um unico passo de implementacao

