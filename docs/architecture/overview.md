# Arquitetura

O Hypou usa React/Vite no cliente, Supabase para autenticação, banco, storage,
realtime e Edge Functions, e Capacitor para o shell nativo iOS/Android.

O código de interface fica em `src/`; regras de domínio e adaptação de plataforma
ficam em módulos próximos ao domínio que atendem. O Supabase é uma seam externa:
clientes chamam módulos de domínio, que concentram contratos de dados e regras de
erro, em vez de espalhar consultas pelas páginas.

O `App.tsx` é o ponto de composição de providers e das três superfícies:

- site público e cadastro do beta;
- painel administrativo autenticado;
- aplicativo nativo protegido.

Migrations em `supabase/migrations` são apêndices históricos. Para qualquer
mudança de banco, adicione uma nova migration, gere tipos e execute os contratos
remotos.
