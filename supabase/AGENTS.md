# Supabase

- Nunca edite ou renomeie migrations já aplicadas. Crie uma migration nova.
- Toda tabela pública precisa de RLS e políticas explícitas.
- Atualize `src/integrations/supabase/types.ts` após mudanças de schema.
- Execute `npm run db:contracts` quando uma alteração tocar banco, RPC, storage
  ou Edge Function.
- Segredos de Edge Functions pertencem ao ambiente remoto, nunca ao cliente.
