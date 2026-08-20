# Rotas e superfícies

| Superfície | Acesso | Rotas |
| --- | --- | --- |
| Site institucional | Público | `/teste`, `/termos`, `/privacidade` |
| Painel administrativo | Login administrativo separado | `/admin`, `/admin/login` |
| Aplicativo | Apenas Capacitor iOS/Android | rotas de autenticação, itens, trocas e chat |

No navegador, qualquer rota que não seja administrativa deve permanecer no site
público. O shell Capacitor carrega as rotas do aplicativo e não inclui o painel
administrativo no build móvel.

Alterações nesta separação exigem teste de `src/lib/domainRouting.ts`, build web
e build móvel.
