# HYPOU - Plano de correcao dos testes de 05/07/2026

## Objetivo

Corrigir os 17 problemas consolidados em `tester-feedback-2026-07-05.md` sem reescrever o app e sem misturar mudancas de comportamento com refatoracoes amplas. O plano prioriza integridade de dados, previsibilidade dos estados e funcionamento real em iOS/Android.

## Diretrizes de execucao

- Usar Node `>=22 <25` em todos os comandos.
- Usar somente Supabase CLI para schema, migrations, functions e validacao remota.
- Tratar o banco como fonte de verdade para troca, conversa, bloqueio, avaliacao e chamada.
- Fazer migrations retrocompativeis antes de publicar o cliente que depende delas.
- Preservar conversas e evidencias; bloquear, arquivar, concluir e apagar sao acoes independentes.
- Entregar em lotes pequenos e testaveis. Nao juntar os 17 problemas em um unico build.
- Nao limpar nem sobrescrever as alteracoes atuais do worktree sem uma revisao explicita.

## Diagnostico inicial do codigo atual

Os recursos abaixo ja existem parcialmente e devem ser estabilizados, nao recriados:

- `conversation_archives` e botoes de arquivar/desarquivar ja existem.
- `blocked_users` e a tela de usuarios bloqueados ja existem.
- `call_sessions`, push para chamada, registro de token e LiveKit ja existem.
- `ratings` e `get_user_ratings_with_items` ja existem.
- o editor de ponto focal e as colunas `focal_x`/`focal_y` ja existem.
- o Explorar ja possui trava de swipe e invalidacao realtime, mas ainda combina indice local com refetch assincrono.

Isso indica que parte dos erros vem de divergencia entre cliente, migrations aplicadas, RLS e estado remoto.

## Fase 0 - Criar uma linha de base confiavel

**Problemas cobertos:** pre-requisito para todos.

### Trabalho

1. Registrar o estado atual do worktree e separar as mudancas ja feitas por area, sem descartar arquivos.
2. Conferir o projeto remoto com o perfil Supabase CLI do Hypou:
   - `supabase migration list`
   - `supabase db dump`
   - `supabase db diff --schema public`
   - `npm run db:contracts`
3. Regenerar os tipos somente depois de confirmar o schema remoto.
4. Rodar a linha de base com Node 22:
   - testes atuais;
   - `npx tsc --noEmit`;
   - lint;
   - build mobile;
   - `npm run mobile:doctor`.
5. Criar duas contas de QA com dados controlados e uma matriz de trocas em cada estado.
6. Registrar IDs de correlacao seguros para eventos de auth, push, chamada e troca, sem gravar tokens ou dados sensiveis.

### Saida obrigatoria

- schema local e remoto sem drift desconhecido;
- lista de migrations realmente aplicadas;
- falhas preexistentes registradas antes de qualquer correcao;
- dados de QA reproduziveis.

## Fase 1 - Cadastro e entrega de e-mail

**Problemas:** AUTH-01 e AUTH-02.

### 1.1 Entrega em Gmail, Outlook/Hotmail e Yahoo

1. Confirmar se o Auth Hook `send-auth-email` e chamado em cada tentativa.
2. Conferir no Resend o resultado por provedor: aceito, entregue, bounce, complaint ou suppression.
3. Validar `hypou.app` com SPF, DKIM e DMARC, alem do remetente `no-reply@hypou.app` e Return-Path.
4. Corrigir template/assunto se houver classificacao de spam e manter o codigo OTP visivel em texto e HTML.
5. Registrar apenas o ID do envio, dominio de destino e status; nunca o codigo OTP.
6. Melhorar o reenvio para diferenciar limite, bloqueio temporario e falha do provedor.

### 1.2 E-mail ja cadastrado

1. Tratar respostas explicitas de `already registered` e o retorno ofuscado do Supabase.
2. Exibir uma tela segura com `Entrar` e `Recuperar senha`.
3. Para evitar enumeracao de contas, usar texto neutro quando o Supabase nao confirmar explicitamente a existencia: `Este e-mail pode ja ter uma conta`.
4. Nao criar perfil, onboarding ou codigo duplicado para uma identidade existente.

### Aceite

- novo cadastro recebe OTP em Gmail, Outlook/Hotmail e Yahoo;
- reenvio funciona e respeita cooldown;
- conta existente nao entra em onboarding duplicado;
- mensagens tecnicas em ingles nao chegam ao usuario.

## Fase 2 - Estabilizar o feed Explorar

**Problema:** EXPLORE-01.

### Trabalho

1. Tornar o `item.id` atual, e nao o indice, a referencia do swipe em andamento.
2. Garantir que gesto, botao, animacao e callback de conclusao passem por uma unica funcao idempotente.
3. Bloquear um segundo avanco ate a animacao atual terminar, inclusive em eventos duplicados do Framer Motion.
4. Remover localmente apenas o item efetivamente processado e reconciliar o refetch sem resetar/pular o proximo ID.
5. Preservar o card atual durante INSERT/UPDATE realtime quando ele ainda for valido.
6. Quando restar um item, buscar o proximo lote antes de mostrar estado vazio; pull-to-refresh continua como contingencia, nao como requisito.

### Testes

- swipe lento, rapido e repetido;
- gesto e botao alternados;
- refetch e INSERT realtime durante animacao;
- lista com 1, 2 e muitos itens;
- cada acao avanca exatamente um ID.

## Fase 3 - Unificar a maquina de estados da troca

**Problemas:** TRADE-01, TRADE-02, REVIEW-01 e CHAT-05.

### Contrato de estados

Manter os estados existentes para reduzir o impacto, adicionando metadados de cancelamento:

- `proposal -> accepted | rejected | cancelled`
- `accepted -> completed | cancelled`
- `rejected`, `cancelled` e `completed` sao terminais.

Adicionar de forma retrocompativel:

- `cancelled_by`;
- `cancel_reason` (`withdrawn`, `item_unavailable`, `item_deleted`, `expired`, `other`);
- `cancelled_at`.

### Trabalho

1. Centralizar aceitar, recusar, desistir e confirmar entrega em RPCs transacionais no banco.
2. Permitir `Desistir da troca` enquanto somente um lado, ou nenhum, confirmou a entrega.
3. Ao desistir, preservar conversa, mensagens, proposta e itens de evidencia.
4. Enviar notificacao ao outro participante com motivo amigavel.
5. Mapear visualmente:
   - `rejected` = `Recusada pela outra pessoa`;
   - `cancelled/withdrawn` = `Cancelada por um participante`;
   - `cancelled/item_unavailable` = `Item indisponivel`;
   - `cancelled/item_deleted` = `Item removido`;
   - `cancelled/expired` = `Expirada`.
6. Mostrar o carimbo visual apenas como reforco; manter o texto acessivel no detalhe.
7. Habilitar avaliacao somente quando o match remoto estiver `completed`.
8. Corrigir a UI para nunca oferecer `Avaliar` em `accepted` e traduzir erros residuais.
9. Manter o composer do chat ativo depois de `completed`; conclusao da troca nao conclui a conversa.

### Aceite

- qualquer lado pode desistir antes da confirmacao bilateral;
- duas confirmacoes concluem a troca uma unica vez;
- avaliacao aceita nota e comentario apenas apos conclusao;
- conversa continua aberta depois da troca concluida;
- cada cancelamento tem causa e autor auditaveis.

## Fase 4 - Chamadas em primeiro e segundo plano

**Problemas:** CALL-01 e CALL-02.

### Arquitetura

- `call_sessions` continua sendo a fonte de verdade.
- Realtime atende o app aberto.
- Push nativo atende app em segundo plano, tela bloqueada e app encerrado.
- Uma expiracao no banco transforma chamadas `ringing` antigas em `missed`, mesmo se o caller fechar o app.

### Trabalho

1. Auditar a cadeia completa: criacao de `call_sessions` -> trigger -> `notify_push` -> Edge Function -> token FCM/APNs -> dispositivo.
2. Parar de silenciar falhas de configuracao em `notify_push`; registrar tentativa, status e motivo sem expor credenciais.
3. Confirmar token por usuario/dispositivo, renovacao, remocao de token invalido e entitlements APNs do build iOS.
4. Incluir no payload `call_session_id`, `conversation_id`, `kind` e rota.
5. Ao tocar a notificacao:
   - abrir a chamada se ainda estiver `ringing`;
   - abrir Chamadas Perdidas se ja expirou.
6. Criar expiracao server-side para marcar `missed` uma unica vez e emitir uma unica notificacao de chamada perdida.
7. Adicionar som local de chamando para o caller e som de notificacao para o callee, respeitando silencioso e volume.
8. Parar sons em `accepted`, `declined`, `missed`, `ended`, cancelamento e timeout.
9. Manter o bot LiveKit para validar midia, mas testar push real com um navegador como caller e um unico iPhone fisico como callee.

### Matriz de aceite

- iPhone com app aberto;
- app em segundo plano;
- tela bloqueada;
- app encerrado;
- chamada atendida, recusada, cancelada e expirada;
- audio e video;
- nenhuma notificacao duplicada;
- chamada atendida nao aparece como perdida.

> CallKit/PushKit deve ser avaliado separadamente se o produto exigir a tela nativa de chamada do iOS. Para o requisito atual, push acionavel e chamada perdida resolvem o fluxo com menor risco.

## Fase 5 - Persistencia e organizacao do chat

**Problemas:** CHAT-01, CHAT-02, CHAT-03, CHAT-04 e parte de CHAT-05.

### Trabalho

1. Confirmar a migration e as policies de `conversation_archives` no remoto.
2. Tornar arquivo estritamente por usuario: arquivar de um lado nao altera a lista do outro.
3. Invalidar imediatamente as queries `main` e `archived` ao arquivar/desarquivar e manter o estado apos novo login.
4. Separar `bloqueado` de `invisivel`:
   - continuar filtrando bloqueados do Explorar e da busca;
   - manter conversas existentes visiveis como historico;
   - desabilitar envio e chamadas enquanto houver bloqueio.
5. Consultar perfis bloqueados por `public_profiles` ou RPC propria compativel com RLS.
6. Definir `Novos hypes` por estado por usuario, nao apenas por ausencia de mensagem.
7. Persistir `opened_at` por usuario/conversa e remover o destaque quando a conversa for aberta, arquivada, cancelada ou concluida.
8. Manter ordenacao por atividade e contagem de nao lidas em realtime.

### Aceite

- arquivar move para `Arquivadas` e desarquivar restaura;
- bloqueio preserva historico e aparece em Configuracoes;
- conversa concluida nao fica em `Novos hypes`;
- os dois usuarios podem ter estados de arquivo/leitura diferentes;
- reiniciar o app nao perde nenhum desses estados.

## Fase 6 - Avaliacoes e perfil

**Problemas:** REVIEW-02, PROFILE-01 e PROFILE-02.

### Trabalho

1. Tornar o card `Avaliacoes` do perfil acionavel.
2. Usar o RPC existente `get_user_ratings_with_items` como fonte unica da lista.
3. Exibir nota, comentario, data e contexto permitido da troca, com estados vazio/carregando/erro.
4. Recalcular a media a partir da mesma fonte para impedir divergencia.
5. Ao tocar na foto atual do perfil, abrir visualizacao em tela cheia sem iniciar troca automaticamente.
6. Na visualizacao, oferecer `Editar`: reenquadrar, substituir ou remover conforme regra atual do perfil.
7. Reaproveitar `MediaViewerDialog` e o picker existentes, evitando um segundo visualizador.
8. No editor de enquadramento, colocar a instrucao sobre scrim/gradiente escuro com contraste estavel em imagens claras e escuras.

### Aceite

- usuario visualiza as avaliacoes recebidas e a media confere;
- visualizar foto nao altera dados;
- cancelar edicao preserva a imagem anterior;
- instrucao do editor permanece legivel em qualquer foto.

## Fase 7 - Localizacao no cadastro de item

**Problema:** ITEM-01.

### Trabalho

1. Incluir no modelo Photon os campos de tipo OSM usados para classificar resultados.
2. Permitir apenas endereco, rua, bairro, cidade, municipio, estado e regiao.
3. Rejeitar `shop`, `office`, `craft`, `amenity`, servicos e estabelecimentos.
4. Priorizar Brasil e proximidade quando houver coordenada do usuario, sem fixar Brasilia para todos.
5. Remover duplicatas por rotulo e coordenada.
6. Manter a lista rolavel com teclado aberto e o botao de cadastro fora da area das sugestoes.
7. Exibir estado vazio claro quando nao houver endereco valido.

### Aceite

- `Massoterapia` nao retorna empresas;
- cidade, bairro, rua e CEP retornam resultados validos;
- usuario consegue rolar e tocar em qualquer sugestao no iPhone;
- localizacao selecionada salva rotulo e coordenadas coerentes.

## Fase 8 - Regressao integrada e releases

### Testes automatizados minimos

- Auth: novo e-mail, existente, reenvio e traducao de erros.
- Explorar: um gesto por item, refetch durante swipe e lista curta.
- Trade: todas as transicoes permitidas e proibidas.
- Rating: somente `completed`, uma avaliacao por usuario/match.
- Chat: main, archived, blocked, completed e new hype.
- Calls: payload, expiracao, missed idempotente e deep link.
- Location: filtro de tipos e deduplicacao.
- RLS: cada participante acessa apenas seus dados e historico permitido.

### Testes manuais

- iOS Simulator para regressao rapida.
- iPhone fisico para push, permissao, teclado, background e tela bloqueada.
- Android para garantir paridade de chat, feed e chamadas.
- Web como segundo usuario para chamadas e fluxos de troca.

### Ordem de builds

1. **Build A - Bloqueadores:** AUTH-01, AUTH-02, EXPLORE-01 e TRADE-01.
2. **Build B - Comunicacao:** CALL-01, CALL-02, CHAT-01, CHAT-02, CHAT-03, CHAT-04 e CHAT-05.
3. **Build C - Reputacao e acabamento:** REVIEW-01, REVIEW-02, PROFILE-01, PROFILE-02, ITEM-01 e TRADE-02.
4. **Release candidate:** regressao completa, `mobile:doctor`, build estatico iOS/Android e TestFlight interno.

Cada build so avanca depois dos criterios de aceite do lote anterior passarem.

## Estimativa de esforco

- Fase 0: 0,5-1 dia.
- Fase 1: 1-2 dias, dependendo de DNS/Resend.
- Fase 2: 1 dia.
- Fase 3: 2-3 dias.
- Fase 4: 2-4 dias, dependendo de APNs/FCM e teste fisico.
- Fase 5: 2-3 dias.
- Fases 6 e 7: 2-3 dias.
- Regressao e release candidate: 1-2 dias.

Estimativa total: 11,5-19 dias de engenharia e QA. As maiores incertezas sao entrega de e-mail e push de chamadas com o app encerrado.

## Definicao de pronto

Um item so e considerado corrigido quando:

1. a causa foi confirmada;
2. o teste automatizado relevante foi adicionado ou atualizado;
3. o criterio de aceite passou no ambiente remoto;
4. o fluxo foi validado em iOS e, quando aplicavel, Android/web;
5. nao houve regressao em auth, navegacao, troca, chat ou feed;
6. migrations, tipos e codigo foram versionados juntos;
7. nao existem logs temporarios, segredos ou mensagens tecnicas expostas ao usuario.
