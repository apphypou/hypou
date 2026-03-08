

## Plano: Aba de Shorts (Videos de Produtos)

### Visao do Produto

Adicionar uma aba "Shorts" na navegacao principal, inspirada no TikTok/Reels, onde usuarios postam videos curtos dos seus produtos. Objetivo: aumentar engajamento, melhorar a qualidade de apresentacao dos itens e criar um canal de descoberta mais imersivo.

### Escopo da Feature

**Experiencia do usuario:**
- Feed vertical full-screen com scroll snap (swipe up/down para navegar)
- Cada short mostra: video do produto, nome do item, perfil do dono, botao de "Quero trocar"
- Auto-play no video visivel, pause nos demais
- Upload de video vinculado a um item existente do usuario
- Duracao maxima: 30 segundos

**Navegacao:**
- Nova aba "Shorts" no BottomNav (icone `Play`/`Clapperboard` do lucide), posicionada entre "Explorar" e "Trocas"
- TabId atualizado para incluir `"shorts"`

### Mudancas Tecnicas

**1. Banco de Dados (migration)**
- Nova tabela `item_videos`:
  - `id` uuid PK
  - `item_id` uuid FK -> items.id
  - `user_id` uuid (para RLS)
  - `video_url` text
  - `thumbnail_url` text (nullable)
  - `duration_seconds` integer (nullable)
  - `created_at` timestamptz
- RLS: qualquer um pode SELECT, dono do item pode INSERT/DELETE

**2. Storage**
- Novo bucket `item-videos` (publico)
- RLS: usuario autenticado pode upload no proprio path

**3. Arquivos novos**
- `src/pages/Shorts.tsx` -- Feed vertical full-screen com scroll snap
- `src/components/ShortCard.tsx` -- Card individual do short (video player + overlay de info)
- `src/services/videoService.ts` -- CRUD de videos (upload, fetch feed, delete)

**4. Arquivos modificados**
- `src/components/BottomNav.tsx` -- Adicionar aba "Shorts" com icone `Clapperboard`
- `src/App.tsx` -- Nova rota `/shorts` protegida
- `src/pages/MeuPerfil.tsx` -- Opcao para adicionar video a um item existente

### Detalhes de Implementacao

**Feed de Shorts (`Shorts.tsx`):**
- Container `h-screen` com `snap-y snap-mandatory overflow-y-scroll`
- Cada `ShortCard` ocupa `h-screen snap-start`
- Intersection Observer para auto-play/pause
- Fetch paginado dos videos ordenados por `created_at DESC`
- Overlay com gradiente inferior mostrando: nome do item, valor, avatar do dono, botao "Propor troca"

**ShortCard (`ShortCard.tsx`):**
- `<video>` nativo com `playsInline`, `loop`, `muted` (unmute on tap)
- Tap para play/pause
- Sidebar com icones: curtir (swipe right no item), compartilhar, perfil do dono
- Info do produto no rodape com link para ver item completo

**Upload de Video:**
- No perfil do usuario, cada item ganha um botao "Adicionar video"
- Limite de 1 video por item
- Compressao/validacao client-side (max 30s, max 50MB)
- Upload para bucket `item-videos` via Supabase Storage
- Gerar thumbnail do primeiro frame (ou aceitar upload separado)

**BottomNav atualizado:**
- 5 abas: Explorar | Shorts | Trocas | Chat | Perfil
- Icone: `Clapperboard` do lucide-react

### Fases de Entrega

**Fase 1 (MVP):** Banco + storage + feed de visualizacao + upload basico
**Fase 2:** Thumbnail automatico, likes em shorts, contagem de views
**Fase 3:** Algoritmo de recomendacao, filtro por categoria, trending

### Riscos e Consideracoes

- **Custo de storage:** Videos consomem muito mais espaco que imagens. Limitar duracao (30s) e tamanho (50MB) e essencial
- **Performance:** Lazy loading de videos e crucial. Carregar apenas 2-3 videos por vez
- **Moderacao:** Sem moderacao automatica no MVP -- depende de reports manuais
- **Compatibilidade:** `<video>` nativo funciona bem em mobile browsers, sem necessidade de player externo

