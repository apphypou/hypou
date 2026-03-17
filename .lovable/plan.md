## Audit Completo do Hypou — Gaps e Inconsistencias

Depois de analisar todo o frontend, backend, serviços e fluxos de navegação, identifiquei os seguintes problemas organizados por criticidade.

---

### CRITICO — Bugs que quebram funcionalidade

**1. Unused `emailSent` state in Cadastro.tsx**

- Linha 15: `const [emailSent, setEmailSent] = useState(false);` ainda existe mas nunca e usada (dead code). Importação de `CheckCircle` também e unused.
- **Fix**: Remover state e import mortos.

**2. NeonButton não suporta `ref` — warnings no console**

- Console mostra: "Function components cannot be given refs" para Login e Cadastro. O React Router pode tentar passar refs.
- **Fix**: Envolver NeonButton com `React.forwardRef`.
-   


**4. Delete account não deleta todos os dados relacionados**

- `handleDeleteAccount` em Configuracoes.tsx não deleta: `blocked_users`, `reports`, `ratings`, `notifications`, `messages`, `item_videos`, `video_likes`, `matches`, `conversations`.
- Itens do user que estão em matches/conversations de outros users ficam órfãos.
- **Fix**: Deletar todas as tabelas relacionadas na ordem correta de dependência, ou melhor, usar uma edge function com service_role para cascade delete.

**5. Perfil (onboarding) não usa LocationSearch**

- O onboarding usa um input de texto simples para localização, enquanto o app tem um componente `LocationSearch` com autocomplete via API Photon. Sem geocoding, o `latitude`/`longitude` do profile ficam `null`, quebrando o filtro de distância.
- **Fix**: Substituir input por `LocationSearch` e salvar lat/lng no profile durante onboarding.

**6. Onboarding categories lista incompleta**

- O onboarding (Perfil.tsx) tem 10 categorias, mas Explorar.tsx tem 12 (faltam "Animais" e "Outros").
- **Fix**: Sincronizar listas de categorias em um único arquivo shared.

---

### ALTO — Inconsistencias de UX e dados

**7. Login.tsx não mostra logo do Hypou**

- Cadastro.tsx mostra o logo, mas Login.tsx removeu/perdeu. Inconsistência visual.
- **Fix**: Adicionar `<img src={logoHypou}>` no Login.
  &nbsp;

**9. Swipe duplicado não é prevenido no backend**

- `swipes` table não tem unique constraint em `(swiper_id, item_id)`. O código trata "duplicate" no catch mas o DB não garante isso.
- **Fix**: Adicionar unique constraint `(swiper_id, item_id)` via migration.

**10. Match/proposal duplicado não é prevenido**

- `matches` não tem unique constraint. Um user pode enviar múltiplas propostas para o mesmo item. O catch trata "duplicate" mas sem constraint no DB.
- **Fix**: Adicionar unique constraint em `(user_a_id, item_b_id)` ou `(item_a_id, item_b_id)`.

**11. ResetPassword.tsx não tem eye toggle para senha**

- Login e Cadastro tem, mas ResetPassword e o dialog de alterar senha em Configuracoes não tem.
- **Fix**: Adicionar toggle de visibilidade em ambos.

---

### MEDIO — Melhorias de robustez

**12. Profile update service aceita `any**`

- `updateProfile` aceita campos tipados mas o onboarding usa `as any` para bypass. Sem type safety.
- **Fix**: Expandir o tipo do `updateProfile` para incluir `bio`, `onboarding_completed`, `latitude`, `longitude`.

**13. Explore items refetch com `staleTime: Infinity**`

- O feed nunca atualiza automaticamente. Se outro user cadastra um item, o user atual não vê até refresh manual.
- **Fix**: Mudar para `staleTime: 5 * 60 * 1000` (5 min).

**14. Categories duplicadas em 3+ arquivos**

- Mesma lista de categorias está em: Explorar.tsx, Perfil.tsx, NovoItem.tsx, Shorts.tsx, Busca.tsx.
- **Fix**: Criar `src/constants/categories.ts` e importar de lá.

---

## Plano de Implementação

### Mudança 1: Fix NeonButton ref warning

- Envolver componente com `React.forwardRef` em `NeonButton.tsx`

### Mudança 2: Limpar dead code em Cadastro.tsx

- Remover `emailSent` state e import `CheckCircle`

### Mudança 4: Adicionar logo no Login.tsx

- Importar e renderizar logo igual ao Cadastro

### Mudança 5: Adicionar eye toggle no ResetPassword.tsx

- Mesmo padrão do Login/Cadastro para os dois campos de senha

### Mudança 6: Criar constantes compartilhadas

- `src/constants/categories.ts` — lista unica de categorias com emoji e label
- Atualizar Explorar, Perfil, NovoItem, Shorts, Busca para importar de lá

### Mudança 7: Sincronizar categorias do onboarding

- Adicionar "Animais" e "Outros" que faltam no onboarding

### Mudança 8: Tipar updateProfile corretamente

- Expandir interface em `profileService.ts` para todos os campos usados, remover `as any`

### Mudança 9: Migrations de banco

- Adicionar `UNIQUE(swiper_id, item_id)` na tabela `swipes`
- Adicionar `UNIQUE(user_a_id, item_b_id)` na tabela `matches` (status pending)

### Mudança 10: LocationSearch no onboarding

- Substituir input de texto por componente `LocationSearch` no Step 1 do Perfil.tsx
- Salvar `latitude` e `longitude` junto com o `location` text

### Mudança 12: Melhorar staleTime do explore

- Mudar de `Infinity` para 5 minutos

### Mudança 13: Delete account completo

- Atualizar `handleDeleteAccount` para limpar todas as tabelas relacionadas na ordem correta

Total: 13 mudanças cirurgicas que cobrem todos os gaps identificados. Nenhuma reestruturação — apenas correções pontuais.