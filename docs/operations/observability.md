# Observabilidade do Hypou

## Dados registrados

Erros e avisos relevantes do app e das Edge Functions são registrados em
`public.observability_events`. Cada evento inclui `trace_id`, origem, ação,
versão, plataforma, duração, código HTTP e código de erro. Dados inseridos pelo
usuário, credenciais, tokens, URLs, e-mails, telefones e mensagens não entram
na telemetria.

Os eventos do navegador são enviados apenas para uma sessão autenticada. Falhas
do próprio envio de telemetria não interrompem o fluxo do usuário.

## Investigação rápida

Use o horário aproximado, a tela e a ação relatada. No SQL Editor do Supabase,
execute uma das consultas abaixo. Nunca compartilhe resultados contendo
identificadores de usuário fora da equipe autorizada.

```sql
-- Erros recentes, agrupados pela causa. Primeiro comando para qualquer incidente.
select
  event,
  source,
  action,
  coalesce(error_code, 'SEM_CODIGO') as error_code,
  count(*) as total,
  max(created_at) as ultima_ocorrencia
from public.observability_events
where level = 'error'
  and created_at >= now() - interval '24 hours'
group by 1, 2, 3, 4
order by total desc, ultima_ocorrencia desc;
```

```sql
-- Linha do tempo de uma reclamação específica. O traceId pode ser visto no console
-- de desenvolvimento ou informado no suporte quando a tela expõe esse diagnóstico.
select
  created_at,
  source,
  level,
  event,
  action,
  function_name,
  duration_ms,
  http_status,
  error_code,
  metadata
from public.observability_events
where trace_id = 'COLE_O_TRACE_ID_AQUI'
order by created_at;
```

```sql
-- Erros que começaram depois de uma versão do app.
select
  coalesce(app_version, 'edge') as versao,
  platform,
  event,
  count(*) as total
from public.observability_events
where level in ('warn', 'error')
  and created_at >= now() - interval '7 days'
group by 1, 2, 3
order by total desc;
```

```sql
-- Fluxo de sugestão de preço: permite separar modelo, limite, rede e resposta inválida.
select
  event,
  coalesce(http_status::text, '-') as http_status,
  coalesce(error_code, '-') as error_code,
  count(*) as total,
  percentile_cont(0.95) within group (order by duration_ms) as p95_ms
from public.observability_events
where action = 'price_suggestion'
  and created_at >= now() - interval '7 days'
group by 1, 2, 3
order by total desc;
```

## Retenção

Manter 30 dias de telemetria em produção. Executar mensalmente pelo SQL Editor:

```sql
delete from public.observability_events
where created_at < now() - interval '30 days';
```

## Convenção de eventos

- `*.started` e `*.completed`: contexto de execução no console/runtime.
- `*.failed`: erro persistido para investigação.
- `*.unavailable`: dependência externa indisponível.
- `*.rate_limited`: bloqueio intencional de frequência.
- `client.console_error`: fallback deduplicado para um erro tratado por uma tela
  que ainda não possui evento específico. Migrar para um evento de domínio quando
  ele aparecer com frequência.

Para um novo fluxo, gere um `traceId` no cliente com `createTraceId`, envie-o
no cabeçalho `x-hypou-trace-id` para a função remota e use `edgeLog` com o mesmo
identificador no backend.
