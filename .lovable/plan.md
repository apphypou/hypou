

## Critica Senior do Onboarding Atual + Plano de Reformulacao

### Problemas Criticos Identificados

**1. Fricção excessiva antes do valor (FATAL)**
O usuario precisa completar 4 steps antes de ver qualquer item. Cadastrar um item inteiro (nome, valor, fotos, descricao) + definir margem de troca no onboarding e absurdo. O usuario ainda nem entende como a plataforma funciona e ja tem que precificar margem de valorizacao/desvalorizacao. Isso mata a conversao.

**2. Step 3 (Cadastro de Item) e uma copia da tela NovoItem**
O onboarding repete logica que ja existe em `/novo-item`. Duplicacao de codigo, duplicacao de UX. O usuario vai cadastrar o primeiro item com pressa, sem fotos boas, sem descricao boa -- e depois vai ter que editar. Resultado: itens de baixa qualidade no feed.

**3. Step 4 (Margem de Troca) e incompreensivel para novos usuarios**
O conceito de "valorizacao +15%" e "desvalorizacao -10%" e abstrato demais para alguem que acabou de chegar. O usuario nao tem contexto para tomar essa decisao. Isso deveria ser configurado depois, quando o usuario ja entende o mecanismo de trocas.

**4. Botao "Pular" leva direto para `/explorar`**
Mas o onboarding nao foi marcado como completo. Isso pode causar loop infinito (redirect de volta ao onboarding) ou estado inconsistente.

**5. Apenas 5 categorias hardcoded**
"Celulares", "Carros & Motos", "Moda", "Casa", "Videogames" -- poucas e fixas. O botao "Outros" nao faz nada. Usuario de livros, instrumentos, eletrodomesticos nao se ve representado.

**6. UX do formulario de item no onboarding**
- Nao tem selecao de categoria do item (usa `selected[0]` da step 2 -- se o usuario selecionou "Moda" e "Celulares", o item vai para "Moda" automaticamente)
- Nao tem selecao de condicao (novo/usado)
- Valor sem mascara de moeda (aceita qualquer texto)
- Parsing do valor e fragil (`cleanValue * 100` pode dar errado)

**7. Sem animacoes de transicao entre steps**
Troca abrupta entre steps. Sem slide, sem fade. Parece quebrado.

**8. Indicador de progresso minimalista demais**
4 bolinhas no topo -- o usuario nao sabe quantos steps faltam nem o que cada um pede.

---

### Plano de Reformulacao

**Principio: reduzir o onboarding ao minimo para o usuario comecar a explorar.**

#### Novo fluxo (3 steps rapidos, ~60 segundos)

```text
Step 1: "Quem e voce?"
  → Nome (obrigatorio)
  → Foto (opcional, com skip claro)
  → Localizacao (opcional)

Step 2: "O que te interessa?"
  → Categorias expandidas (8-10 opcoes)
  → Multi-select com minimo 1
  → Adicionar "Outros" funcional

Step 3: "Tudo pronto!"
  → Tela de sucesso/celebracao
  → CTA principal: "Explorar trocas"
  → CTA secundario: "Cadastrar meu primeiro item"
  → Marca onboarding_completed = true
```

**O que SAI do onboarding:**
- Cadastro de item (Step 3 atual) → movido para CTA pos-onboarding e tela dedicada `/novo-item`
- Margem de troca (Step 4 atual) → movido para configuracoes do item em `/novo-item` e `/editar-item`

#### Mudancas tecnicas

**1. Reescrever `src/pages/Perfil.tsx`**
- Reduzir de 531 linhas para ~250
- 3 steps em vez de 4
- Remover toda logica de criacao de item e margem
- Adicionar animacoes de transicao entre steps (framer-motion)
- Adicionar labels descritivas no indicador de progresso

**2. Expandir categorias**
- Adicionar: "Eletronicos", "Esportes", "Livros", "Instrumentos", "Ferramentas"
- Tornar a lista dinamica (facil de adicionar no futuro)

**3. Step 3 de celebracao**
- Animacao de confetti ou check animado
- Dois CTAs claros: explorar vs cadastrar item
- Marcar `onboarding_completed = true`

**4. Corrigir botao "Pular"**
- No step 1: ocultar (nome e obrigatorio)
- No step 2: permitir pular mas com confirmacao
- Pular deve marcar `onboarding_completed = true` antes de redirecionar

**5. Animacoes entre steps**
- Slide horizontal com framer-motion `AnimatePresence`
- Fade nos elementos do formulario

#### Arquivos afetados
- `src/pages/Perfil.tsx` -- reescrita completa (simplificacao)
- Nenhum arquivo novo necessario
- Nenhuma mudanca de banco de dados

