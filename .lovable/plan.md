

## Analise Completa do App Hypou — O que esta faltando

Apos revisar todos os arquivos do projeto (pages, services, hooks, types, DB schema, RLS, storage), segue a lista completa organizada por prioridade.

---

### PRIORIDADE CRITICA (Seguranca e Integridade)

**1. Confirmacao de E-mail Ausente**
O fluxo de cadastro (`Cadastro.tsx`) chama `signUp` mas nao ha nenhuma tela ou logica que informe ao usuario que ele precisa confirmar o e-mail antes de entrar. O usuario pode ficar preso sem feedback.

**2. Leaked Password Protection Desativada**
O linter do Supabase detectou que a protecao contra senhas vazadas esta desativada. Isso significa que usuarios podem usar senhas ja comprometidas em data breaches.

**3. Validacao de Input Fraca**
- `NovoItem.tsx`: o campo de valor aceita texto livre sem mascara. `replace(/\D/g, "")` pode causar bugs com valores como "1.500" (vira 1500 centavos = R$15,00 em vez de R$1.500).
- Nenhum campo tem validacao de comprimento maximo (nome do item, bio, mensagens).
- Sem sanitizacao de HTML/XSS no conteudo de mensagens.

**4. Deletar Item sem Confirmar**
`MeuPerfil.tsx` deleta o item direto ao clicar no icone de lixeira, sem dialog de confirmacao. Um toque acidental apaga permanentemente o item e suas imagens.

---

### PRIORIDADE ALTA (Funcionalidades Essenciais Faltando)

**5. Notificacoes Push / In-App**
Nao ha sistema de notificacoes. O usuario nao sabe quando recebe um match, uma mensagem ou uma proposta de troca a menos que abra o app e navegue manualmente.

**6. Filtros e Busca na Exploracao**
`Explorar.tsx` mostra todos os itens ativos de outros usuarios sem nenhum filtro. Falta:
- Filtro por categoria (o usuario ja seleciona categorias no onboarding via `user_categories`, mas isso nao e usado no feed).
- Filtro por localidade/distancia.
- Busca por nome de item.

**7. Editar Item Existente**
Nao existe tela de edicao de item. O usuario so pode criar ou deletar. Falta poder editar nome, valor, fotos, margens e descricao.

**8. Condicao do Item Nao e Preenchida**
A tabela `items` tem coluna `condition` (string | null), e o `SwipeCard` exibe "condition", mas `NovoItem.tsx` nao tem campo para preencher a condicao do item. Sempre fica `null`.

**9. Rejeitar/Recusar Proposta de Troca**
`Matches.tsx` permite "Confirmar Troca" mas nao tem botao para recusar/rejeitar uma proposta. O usuario nao consegue sinalizar desinteresse — a proposta fica pendente para sempre.

**10. Localidade do Item Nao e Preenchida**
`NovoItem.tsx` nao tem campo de localizacao. A coluna `location` do item sempre fica `null`, mesmo que o perfil tenha localizacao.

---

### PRIORIDADE MEDIA (UX e Polish)

**11. Pull-to-Refresh**
Nenhuma tela tem pull-to-refresh. Para ver novos itens, matches ou mensagens, o usuario precisa recarregar a pagina inteira.

**12. Paginacao / Infinite Scroll**
`getExploreItems` faz `limit(50)` e para. Nao ha paginacao. Quando houver mais de 50 itens, o usuario nunca vera os demais.

**13. Skeleton Loaders Inconsistentes**
`MeuPerfil.tsx` tem skeleton loaders, mas `Explorar.tsx`, `Chat.tsx`, `Matches.tsx` e `PerfilUsuario.tsx` usam apenas um spinner centralizado. A experiencia de loading deveria ser consistente.

**14. Empty State sem Call-to-Action**
A tela Explorar mostra "Sem itens por agora" mas nao oferece acao (ex: "Cadastrar seu primeiro item" ou "Convidar amigos"). O mesmo ocorre no Chat e Matches.

**15. Historico de Swipes / Desfazer Persistente**
O undo (`handleUndo`) so funciona para o ultimo card e se perde ao recarregar. Nao ha historico persistido de swipes visualizados.

**16. Logo Faltando em RecuperarSenha e ResetPassword**
As telas `RecuperarSenha.tsx` e `ResetPassword.tsx` ainda usam o icone `Diamond` em vez da logo do Hypou.

**17. Mascara de Moeda no Input de Valor**
O campo de valor em `NovoItem.tsx` e texto puro sem mascara. Deveria ter formatacao em tempo real (R$ 1.500,00).

---

### PRIORIDADE BAIXA (Melhorias Futuras)

**18. Sistema de Avaliacoes/Rating**
O perfil mostra "Rating: --" mas nao existe nenhuma tabela, logica ou UI para avaliacoes entre usuarios apos uma troca concluida.

**19. Denunciar Item ou Usuario**
Nao ha mecanismo para reportar conteudo inapropriado, golpes ou usuarios abusivos.

**20. Termos de Uso e Politica de Privacidade**
A landing page mostra links para "Termos de Uso" e "Politica de Privacidade" mas ambos sao `cursor-default` sem href — nao levam a lugar nenhum.

**21. Confirmacao de Entrega / Fluxo Pos-Match**
Apos "Confirmar Troca", o fluxo termina no chat. Nao ha etapa de confirmacao de entrega/recebimento por ambas as partes para fechar o ciclo da troca.

**22. Escolher Qual Item Trocar**
Quando o usuario da like em um item, o sistema assume que ele quer trocar qualquer item dele. O usuario nao escolhe qual dos seus itens oferece na troca.

**23. Contagem de Mensagens Nao Lidas no BottomNav**
O `BottomNav` tem suporte a `badge` mas nenhuma tab usa. Deveria mostrar contagem de mensagens nao lidas no icone de Chat.

**24. PWA / Instalacao no Celular**
Nao ha manifest.json, service worker ou configuracao PWA. O app nao pode ser "instalado" na home screen do celular.

**25. Testes Automatizados**
O unico teste e `example.test.ts` (provavelmente boilerplate). Nao ha testes para services, hooks ou componentes criticos.

---

### RESUMO POR AREA

```text
AREA                  | ITENS FALTANDO
----------------------|---------------
Seguranca             | 3 (e-mail, senha, validacao)
Funcionalidades Core  | 6 (filtros, editar item, rejeitar, condicao, localizacao, notificacoes)
UX / Polish           | 7 (pull-refresh, paginacao, skeletons, logo, mascara, empty states, undo)
Futuro / Crescimento  | 8 (rating, denuncia, termos, entrega, escolha item, badge, PWA, testes)
TOTAL                 | 24 itens identificados
```

---

### RECOMENDACAO DE ORDEM DE IMPLEMENTACAO

Sugiro atacar em 4 sprints:

1. **Sprint 1 — Seguranca**: Confirmacao de e-mail, leaked password, confirmacao de delete, validacao de inputs
2. **Sprint 2 — Core Features**: Filtros por categoria, editar item, campo de condicao/localizacao, rejeitar proposta
3. **Sprint 3 — UX Polish**: Mascara de moeda, skeletons consistentes, badge no BottomNav, logo nas telas restantes, pull-to-refresh
4. **Sprint 4 — Escala**: Notificacoes, paginacao, rating, PWA, testes

