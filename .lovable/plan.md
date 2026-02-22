
# Plano: Injetar 10 Usuarios Bot de Teste com Produtos

## Objetivo

Criar uma Edge Function que, ao ser chamada, cria 10 usuarios ficticios no Supabase Auth, cada um com perfil completo, categorias de interesse e 1-2 itens cadastrados com valores variados. Isso simula um ambiente real para testar swipes, matches e chat.

## Dados dos Bots

| # | Nome | Cidade | Categorias | Item 1 | Valor | Item 2 | Valor |
|---|------|--------|------------|--------|-------|--------|-------|
| 1 | Ana Silva | Sao Paulo, SP | Celulares, Moda | iPhone 14 Pro Max | R$ 5.500 | Bolsa Louis Vuitton | R$ 8.000 |
| 2 | Carlos Santos | Rio de Janeiro, RJ | Carros & Motos | Honda CB 500F 2022 | R$ 28.000 | -- | -- |
| 3 | Juliana Costa | Belo Horizonte, MG | Casa, Moda | Sofa Retratil 3 Lugares | R$ 3.200 | Vestido Gucci | R$ 4.500 |
| 4 | Pedro Oliveira | Curitiba, PR | Videogames | PlayStation 5 + 3 Jogos | R$ 3.800 | Nintendo Switch OLED | R$ 2.200 |
| 5 | Mariana Lima | Brasilia, DF | Celulares | Samsung Galaxy S24 Ultra | R$ 6.000 | -- | -- |
| 6 | Rafael Mendes | Porto Alegre, RS | Carros & Motos, Videogames | Xbox Series X | R$ 3.500 | Capacete AGV K3 | R$ 1.800 |
| 7 | Fernanda Souza | Salvador, BA | Moda | Tenis Nike Air Jordan 1 | R$ 1.500 | Relogio Casio G-Shock | R$ 900 |
| 8 | Lucas Rocha | Florianopolis, SC | Casa | Smart TV LG 55" 4K | R$ 2.800 | Aspirador Robo Xiaomi | R$ 1.600 |
| 9 | Camila Alves | Recife, PE | Celulares, Casa | MacBook Air M2 | R$ 7.500 | Echo Dot 5a Geracao | R$ 350 |
| 10 | Bruno Ferreira | Goiania, GO | Videogames, Moda | PC Gamer RTX 4060 | R$ 5.000 | Jaqueta North Face | R$ 1.200 |

- Cada item tera margens de negociacao variadas (margin_up: 10-20%, margin_down: 5-15%)
- Todos os bots terao `onboarding_completed = true`
- Avatares serao gerados via `ui-avatars.com` (servico gratuito de avatar por iniciais)

## Implementacao Tecnica

### 1. Criar Edge Function `seed-test-users`

Uma unica Edge Function (`supabase/functions/seed-test-users/index.ts`) que:

1. Usa o `SUPABASE_SERVICE_ROLE_KEY` para criar usuarios no Auth via `admin.createUser()`
2. Atualiza o perfil de cada usuario (display_name, location, avatar_url, onboarding_completed)
3. Insere categorias de interesse na tabela `user_categories`
4. Cria itens na tabela `items` com valores e margens variados
5. Nao insere imagens reais (sem upload de storage), mas os itens ficam disponiveis para swipe

Todos os bots usarao emails no formato `bot1@hypou.test` ate `bot10@hypou.test` com senha `teste123`.

### 2. Executar a Edge Function

Apos deploy, chamar a funcao uma unica vez para popular o banco.

### 3. Limpar apos uso

A funcao tambem aceitara um parametro `action=cleanup` para remover todos os bots quando nao forem mais necessarios.

### 4. Deletar a Edge Function

Apos execucao bem-sucedida, a funcao sera removida do projeto para manter o codigo limpo.

## Arquivos

- **Criar**: `supabase/functions/seed-test-users/index.ts`
- **Editar**: `supabase/config.toml` (adicionar `verify_jwt = false` para a funcao)
- **Deletar apos uso**: a propria Edge Function
