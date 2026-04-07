

# Plano: Assistente de IA no Painel Admin

## O que sera construido

Uma nova aba "Assistente IA" no painel admin com um chat interativo especializado no Hypou. Os donos do app poderao conversar com a IA para obter estrategias de marketing, analise de metricas, ideias de campanhas, copy para redes sociais, etc.

## Arquitetura

```text
Frontend (AdminAssistente.tsx)
    |
    v
Supabase Edge Function (admin-ai-chat)
    |
    v
Lovable AI Gateway (google/gemini-3-flash-preview)
```

## Etapas

### 1. Edge Function `admin-ai-chat`
- Recebe mensagens do chat e envia para o Lovable AI Gateway com streaming SSE
- System prompt especializado: contexto do Hypou (app de trocas, publico jovem, modelo freemium), instrucoes para atuar como consultor de marketing digital
- Validacao JWT para garantir que apenas admins autenticados usem
- Usa `LOVABLE_API_KEY` (ja configurado)
- Atualizar `config.toml` com a nova function

### 2. Pagina `AdminAssistente.tsx`
- Interface de chat com streaming token-by-token
- Renderizacao markdown das respostas (react-markdown)
- Historico de conversa em memoria (sem persistencia no banco)
- Sugestoes rapidas pre-definidas: "Crie um post para Instagram", "Estrategia de lancamento", "Analise de retencao", "Copy para email marketing"
- Design consistente com o painel admin (cards, glassmorphism)

### 3. Integracao no Admin
- Adicionar rota `/admin/assistente` em `App.tsx`
- Adicionar item "Assistente IA" com icone `Bot` no `AdminSidebar.tsx`
- Adicionar label no `AdminLayout.tsx` breadcrumbs

## System Prompt (resumo)
A IA sera instruida como especialista em marketing digital para um app de trocas chamado Hypou. Conhece o modelo de negocio (freemium, trocas por proximidade, publico 18-35), e fornece estrategias de growth hacking, copy, campanhas, analise de funil, etc.

## Dependencia
- Instalar `react-markdown` para renderizar respostas formatadas

