# HYPOU - Triagem dos testes de 05/07/2026

## Escopo

Triagem consolidada dos relatos de testadores, 12 capturas de tela e 3 videos enviados em 05/07/2026. Itens repetidos foram agrupados. Esta triagem registra o comportamento observado e o resultado esperado; a causa tecnica ainda precisa ser confirmada durante a implementacao.

## Prioridades

- **P0 - Bloqueador:** impede cadastro, perde um item do fluxo principal ou deixa uma troca sem saida segura.
- **P1 - Alto:** quebra um recurso importante, causa perda aparente de dados ou deixa estados inconsistentes.
- **P2 - Medio:** prejudica clareza, acessibilidade ou previsibilidade, mas existe alternativa de uso.

## Backlog consolidado

### P0 - Bloqueadores

#### AUTH-01 - Confirmacao de e-mail nao chega no Gmail e Hotmail

- **Fluxo:** cadastro com e-mail.
- **Observado:** o codigo chega no Yahoo, mas nao chega em contas Gmail e Hotmail testadas.
- **Risco:** novos usuarios nao conseguem concluir o cadastro.
- **Investigar:** entrega do provedor de e-mail, logs de envio, SPF/DKIM/DMARC, reputacao do remetente, bloqueios e limites do Supabase Auth.
- **Aceite:** codigo recebido em Gmail, Outlook/Hotmail e Yahoo; reenvio tem retorno claro; falhas ficam registradas para diagnostico.
- **Evidencia:** relato 1 e print 3.

#### EXPLORE-01 - Swipe pode pular o proximo produto

- **Fluxo:** Explorar.
- **Observado:** ao dispensar a televisao, o computador aparece brevemente e e pulado para outro item.
- **Risco:** produtos deixam de ser vistos e o feed perde confiabilidade.
- **Investigar:** concorrencia entre gesto, animacao, indice do card e atualizacao do buffer do feed.
- **Aceite:** cada gesto avanca exatamente um produto; swipes rapidos nao pulam cards; a ordem permanece estavel.
- **Evidencia:** video `WhatsApp Video 2026-07-05 at 10.54.12.mp4`.

#### CALL-01 - Chamada nao alcanca usuario fora do app

- **Fluxo:** chamada de audio e video.
- **Observado:** a chamada funciona apenas quando os dois usuarios estao online no Hypou.
- **Risco:** recurso de chamada fica inutil em grande parte dos cenarios reais.
- **Resultado esperado:** ao receber chamada em segundo plano ou com o app fechado, o usuario deve ser avisado; se nao atender ou estiver indisponivel, deve receber notificacao de chamada perdida.
- **Aceite:** validar app aberto, em segundo plano, tela bloqueada e app encerrado; chamada atendida nao gera aviso de perdida; chamada sem resposta gera um unico aviso com tipo, contato e horario.
- **Evidencia:** relato 5.

#### TRADE-01 - Falta opcao de desistir antes da confirmacao bilateral

- **Fluxo:** proposta aceita e confirmacao de entrega.
- **Observado:** depois que uma pessoa confirma digitalmente, a outra recebe apenas a opcao de confirmar, mesmo que a troca fisica nao tenha ocorrido e ela queira desistir.
- **Risco:** usuario fica preso em uma troca que nao deseja concluir.
- **Resultado esperado:** enquanto os dois lados nao confirmarem a entrega, deve existir `Desistir da troca`, com confirmacao, motivo opcional e registro do evento.
- **Aceite:** qualquer lado pode desistir antes da confirmacao bilateral; a troca passa para cancelada com motivo correto; o outro usuario e avisado; historico e conversa sao preservados.
- **Evidencia:** relato 14 e print 12.

### P1 - Problemas de alta prioridade

#### AUTH-02 - Cadastro com e-mail existente envia novo codigo

- **Fluxo:** cadastro com e-mail.
- **Observado:** um e-mail ja cadastrado recebe codigo como se fosse uma conta nova.
- **Resultado esperado:** informar `Este e-mail ja possui uma conta` e oferecer `Entrar` ou `Recuperar senha`.
- **Aceite:** nenhuma segunda conta e criada; o usuario e conduzido para login/recuperacao; definir conscientemente o risco de enumeracao de contas.
- **Evidencia:** relato 4.

#### CALL-02 - Falta retorno sonoro ao iniciar e receber chamada

- **Fluxo:** chamada de audio e video.
- **Observado:** a chamada conecta, mas o periodo de chamada fica totalmente silencioso.
- **Resultado esperado:** som de chamando para quem liga e toque de chamada para quem recebe, respeitando silencioso, volume e audio session do iOS.
- **Aceite:** som inicia e para nos eventos corretos; nao continua depois de atender, recusar, cancelar ou expirar; nao duplica em reconexoes.
- **Evidencia:** relato 5 (segundo item com essa numeracao).

#### CHAT-01 - Conversa finalizada permanece em `Novos hypes`

- **Fluxo:** lista de conversas.
- **Observado:** conversa ja finalizada continua destacada como nova.
- **Resultado esperado:** `Novos hypes` deve conter apenas matches/conversas realmente novas e pendentes de abertura.
- **Aceite:** abrir ou finalizar a negociacao remove o destaque em tempo real e apos reabrir o app.
- **Evidencia:** relato 6 e print 4.

#### CHAT-02 - Bloquear usuario remove imediatamente o historico

- **Fluxo:** bloqueio dentro da conversa.
- **Observado:** ao bloquear uma pessoa, as conversas somem da lista.
- **Risco:** perda aparente de evidencia e de historico de negociacao.
- **Resultado esperado:** bloquear impede novas interacoes, mas preserva o historico; usuario pode arquivar ou apagar a conversa separadamente.
- **Aceite:** conversa continua acessivel em modo adequado; envio/chamada ficam bloqueados; desbloquear restaura a relacao sem recriar dados.
- **Evidencia:** relato 8 e print 6.

#### CHAT-03 - Conversa arquivada desaparece em vez de ir para `Arquivadas`

- **Fluxo:** lista de conversas e arquivo.
- **Observado:** apos arquivar, a conversa some e nao e encontrada na area de arquivadas.
- **Resultado esperado:** mover da lista principal para `Arquivadas`, com opcao de desarquivar.
- **Aceite:** a conversa aparece imediatamente em `Arquivadas`, persiste apos reiniciar o app e retorna corretamente ao desarquivar.
- **Evidencia:** relato 9 e print 4.

#### CHAT-04 - Usuario bloqueado nao aparece em `Usuarios Bloqueados`

- **Fluxo:** Configuracoes > Usuarios Bloqueados.
- **Observado:** o bloqueio e executado, mas a lista mostra `Nenhum usuario bloqueado`.
- **Resultado esperado:** lista refletir a fonte real de bloqueios e permitir desbloquear.
- **Aceite:** usuario aparece sem recarregar manualmente, persiste apos novo login e some ao desbloquear.
- **Evidencia:** relato 10 e print 7.

#### CHAT-05 - Chat e desativado quando a troca e concluida

- **Fluxo:** conversa de uma troca concluida.
- **Observado:** o composer desaparece e a tela informa que a conversa foi finalizada.
- **Resultado esperado:** a troca pode ser concluida sem encerrar o canal de conversa.
- **Aceite:** mensagens continuam disponiveis depois da conclusao; o status `Troca concluida` permanece visivel; bloquear/arquivar/apagar continuam sendo acoes separadas.
- **Evidencia:** relato 12 e print 9.

#### REVIEW-01 - Avaliacao pelo chat falha por divergencia de estado

- **Fluxo:** Chat > Avaliar.
- **Observado:** a interface permite avaliar, mas o backend retorna `Match must be completed`.
- **Risco:** o app oferece uma acao que o estado da troca ainda nao permite.
- **Resultado esperado:** permitir avaliacao apenas quando o estado necessario estiver concluido, ou corrigir a transicao que deveria marcar o match como concluido.
- **Aceite:** nota e texto sao enviados uma unica vez; estado da UI e regra do banco concordam; erro tecnico em ingles nao e exibido ao usuario.
- **Evidencia:** relato 7 e print 5.

#### REVIEW-02 - Usuario nao consegue abrir as avaliacoes recebidas

- **Fluxo:** Perfil > Avaliacoes.
- **Observado:** a media aparece, mas nao ha acesso funcional a lista/detalhes das avaliacoes.
- **Resultado esperado:** tocar em `Avaliacoes` abre lista com nota, comentario, autor conforme regra de privacidade e data.
- **Aceite:** media corresponde aos registros exibidos; estados vazio, carregando e erro estao tratados.
- **Evidencia:** relato 11 e print 8.

### P2 - Clareza, acessibilidade e consistencia

#### PROFILE-01 - Foto de perfil nao possui visualizacao e edicao clara

- **Fluxo:** onboarding/perfil > foto.
- **Observado:** tocar na foto abre apenas opcoes para tirar ou escolher outra foto; nao e possivel abrir a foto atual em tela cheia e depois escolher editar.
- **Resultado esperado:** toque na foto abre a visualizacao completa; acao `Editar` permite reenquadrar/trocar/remover conforme as regras do produto.
- **Aceite:** visualizar nao altera a imagem; editar exige confirmacao; cancelar preserva a foto anterior.
- **Evidencia:** videos `10.38.10` e `10.41.33`.

#### PROFILE-02 - Texto ilegivel no editor de enquadramento

- **Fluxo:** Ajustar foto.
- **Observado:** instrucao inferior branca fica sobre area clara da foto/blur e perde contraste.
- **Resultado esperado:** usar scrim/gradiente escuro ou painel escuro translucido na area do texto.
- **Aceite:** texto legivel em fotos claras, escuras e muito coloridas; contraste visual consistente; camada nao encobre o ponto de interesse.
- **Evidencia:** relato 2 e print 1.

#### ITEM-01 - Busca de localizacao mistura enderecos com estabelecimentos/servicos

- **Fluxo:** cadastrar item > localizacao.
- **Observado:** a busca sugere `Massoterapeuta e Depilacao` e `Massoterapia` como localizacao.
- **Resultado esperado:** priorizar cidade, bairro, endereco e regiao; remover categorias de negocios/servicos do autocomplete.
- **Aceite:** consultas de localizacao retornam apenas tipos permitidos, priorizam Brasil/proximidade e continuam rolaveis com o teclado aberto.
- **Evidencia:** relato 3 e print 2.

#### TRADE-02 - Status de propostas canceladas sao pouco claros

- **Fluxo:** Propostas > Canceladas.
- **Observado:** aparecem `Recusada` e `Indisponivel` sem explicar a diferenca; o tratamento visual e discreto.
- **Resultado esperado:** definir e exibir estados distintos: recusada pela outra pessoa, cancelada pelo autor, item indisponivel/excluido e expirada, quando aplicavel.
- **Aceite:** cada status tem texto e motivo coerentes; detalhe explica o que ocorreu; carimbo visual nao reduz a leitura da foto nem substitui acessibilidade textual.
- **Evidencia:** relato 13 e prints 10 e 11.

## Ordem recomendada de execucao

1. **Cadastro e integridade do feed:** AUTH-01, AUTH-02 e EXPLORE-01.
2. **Estados criticos de troca:** TRADE-01, REVIEW-01 e CHAT-05.
3. **Chamadas fora do app:** CALL-01 e CALL-02.
4. **Persistencia do chat:** CHAT-01, CHAT-02, CHAT-03 e CHAT-04.
5. **Perfil e reputacao:** REVIEW-02, PROFILE-01 e PROFILE-02.
6. **Cadastro de item e clareza de propostas:** ITEM-01 e TRADE-02.

## Matriz minima de regressao

- iPhone fisico com app aberto, em segundo plano, tela bloqueada e encerrado.
- Cadastro com Gmail, Hotmail/Outlook e Yahoo, incluindo e-mail novo e existente.
- Dois usuarios em estados diferentes da mesma troca: proposta, aceita, confirmada por um lado, confirmada pelos dois, desistida e concluida.
- Conversa normal, nova, arquivada, bloqueada e vinculada a troca concluida.
- Feed Explorar com swipes lentos, rapidos e repetidos, incluindo buffer pequeno e atualizacao realtime.
- Fotos claras e escuras no editor e perfil.
- Busca de localizacao por cidade, bairro, rua e termos que tambem sejam nomes de empresas.

## Limites desta triagem

- As capturas confirmam os estados visuais, mas nao identificam sozinhas a causa no codigo ou no banco.
- O problema de entrega de e-mail exige logs do provedor/Supabase e testes reais de recebimento.
- Chamadas em segundo plano/encerradas exigem dois usuarios, dispositivo fisico e validacao de push no ambiente usado pelos testadores.
- Acessibilidade foi avaliada apenas visualmente; VoiceOver, Dynamic Type, foco e alvos de toque ainda precisam de teste dedicado.
