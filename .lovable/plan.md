

# Plano: Preparar Hypou para aprovacao na Apple Store

## Resumo

Implementar features nativas reais, melhorar a percepcion de app nativo, adicionar suporte offline basico, e eliminar qualquer comportamento de navegador web.

---

## 1. Camera nativa para upload de fotos

**O que muda**: Ao cadastrar/editar item ou avatar, o app detecta se esta rodando no Capacitor e abre a camera nativa do dispositivo (ou galeria) em vez do file picker do browser.

**Arquivos**:
- Instalar `@capacitor/camera` no package.json
- Criar `src/lib/nativeCamera.ts` — helper que usa `Camera.getPhoto()` no nativo e fallback para `<input type="file">` na web
- Atualizar `NovoItem.tsx`, `EditarItem.tsx`, `MeuPerfil.tsx` — substituir os `<input type="file">` pelo helper de camera nativa

---

## 2. Tela "Sem internet" (offline basico)

**O que muda**: Componente global que detecta `navigator.onLine` e exibe uma tela fullscreen "Sem conexao" com botao "Tentar novamente". Tambem cacheia os ultimos itens explorados via React Query `gcTime`.

**Arquivos**:
- Criar `src/components/OfflineScreen.tsx` — tela com icone wifi-off, mensagem e botao retry
- Atualizar `App.tsx` — wrapper que monitora `online`/`offline` events e renderiza `OfflineScreen` quando offline
- Ajustar React Query `queryClient` — aumentar `gcTime` para manter dados em cache por mais tempo

---

## 3. Splash screen nativa real

**O que muda**: Remover o auto-hide do splash e controlar manualmente — o splash so desaparece quando o app terminou de carregar (auth resolvido). Elimina o "site carregando".

**Arquivos**:
- Atualizar `capacitor.config.ts` — `launchAutoHide: false`
- Atualizar `src/main.tsx` — importar `SplashScreen.hide()` e chamar apos o primeiro render
- Atualizar `src/hooks/useAuth.tsx` — expor um callback quando `loading` vira `false`, para o `App.tsx` saber quando esconder o splash

---

## 4. Transicoes de pagina fluidas

**O que muda**: Adicionar transicoes animadas entre rotas usando Framer Motion para eliminar "piscar de tela" tipico de web.

**Arquivos**:
- Criar `src/components/PageTransition.tsx` — wrapper com `motion.div` fade/slide
- Atualizar `App.tsx` — envolver as rotas com `AnimatePresence` e `PageTransition`

---

## 5. Esconder comportamento web

**O que muda**: Desabilitar text selection, long press context menu, pull-to-refresh do browser, overscroll bounce, e highlight de tap no Capacitor nativo.

**Arquivos**:
- Atualizar `src/index.css` — adicionar regras CSS que so aplicam no contexto nativo:
  - `-webkit-user-select: none`
  - `-webkit-touch-callout: none`
  - `-webkit-tap-highlight-color: transparent`
  - `overscroll-behavior: none`
- Atualizar `src/main.tsx` — adicionar `document.addEventListener('contextmenu', e => e.preventDefault())` no nativo

---

## 6. Remover conta de teste do login

**O que muda**: Remover o bloco "Conta de teste" da tela de login que expoe credenciais — a Apple rejeitaria isso.

**Arquivos**:
- Atualizar `src/pages/Login.tsx` — remover linhas 92-103 (bloco de teste)

---

## Detalhes tecnicos

| Dependencia nova | Tipo |
|---|---|
| `@capacitor/camera` | dependency |

| Arquivo | Acao |
|---|---|
| `package.json` | Adicionar `@capacitor/camera` |
| `capacitor.config.ts` | `launchAutoHide: false` |
| `src/main.tsx` | Splash hide manual + contextmenu block |
| `src/lib/nativeCamera.ts` | Criar helper camera nativa |
| `src/components/OfflineScreen.tsx` | Criar tela sem internet |
| `src/components/PageTransition.tsx` | Criar wrapper de transicao |
| `src/pages/NovoItem.tsx` | Usar camera nativa |
| `src/pages/EditarItem.tsx` | Usar camera nativa |
| `src/pages/MeuPerfil.tsx` | Usar camera nativa |
| `src/pages/Login.tsx` | Remover conta de teste |
| `src/index.css` | CSS anti-web behavior |
| `src/App.tsx` | Offline wrapper + AnimatePresence + QueryClient gcTime |
| `src/hooks/useAuth.tsx` | Splash hide callback |

Apos aprovar, implemento tudo em sequencia.

