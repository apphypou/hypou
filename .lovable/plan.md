

# Plano UX: Simplificar Tela de Cadastro de Item

## Problema

Os blocos "Valorização" e "Desvalorização" sao confusos ate para o proprio dono do produto. O usuario nao entende o que significa "+15%" ou "-10%", nao sabe o impacto real, e o jargao tecnico afasta. Alem disso, o formulario e longo demais com tudo em uma unica rolagem.

## Solucao: Substituir margens por "Faixa de Troca"

Em vez de dois sliders separados com termos tecnicos, mostrar **um unico bloco visual** que traduz a margem em valores reais em reais (R$).

### Antes (confuso)
```text
ACIMA DO VALOR
Valorização    +15%
[====o=========] 0%..50%

ABAIXO DO VALOR  
Desvalorização  -10%
[===o==========] 0%..50%
```

### Depois (intuitivo)
```text
FAIXA DE TROCA
Aceito trocar por itens entre:
R$ 900,00  ←——●————●——→  R$ 1.150,00
             mínimo    máximo

Valor do seu item: R$ 1.000,00
```

## Mudancas detalhadas

### 1. Substituir os dois blocos de margem por "Faixa de Troca"

- Remover os dois cards separados (Valorização / Desvalorização)
- Criar um unico card "Faixa de Troca" com:
  - Titulo: "Faixa de troca"
  - Subtitulo: "Aceito trocar por itens que valem entre:"
  - **Dois valores calculados em R$** (min e max) mostrados de forma clara
  - Um **range slider duplo** (dois thumbs) que o usuario arrasta
  - O slider vai de -50% a +50% mas o usuario **so ve os valores em reais**
  - Abaixo, texto discreto: "De X% abaixo até Y% acima do valor"
- Internamente, os valores `margin_up` e `margin_down` continuam sendo salvos como antes

### 2. Reordenar campos do formulario

Nova ordem mais logica:
1. Fotos (ja esta primeiro -- bom)
2. Nome do item
3. Categoria
4. Condicao
5. Valor de mercado
6. **Faixa de troca** (aparece so depois de preencher valor, com animacao)
7. Localizacao
8. Descricao (opcional, por ultimo)

Mover descricao e localizacao para baixo pois sao opcionais e menos importantes.

### 3. Mostrar faixa de troca somente apos preencher valor

- A secao "Faixa de troca" aparece com fade-in so quando o usuario digita um valor > R$ 0
- Isso reduz a carga cognitiva inicial

### 4. Atualizar o texto de ajuda

Substituir o texto atual:
> "A margem ajuda nosso algoritmo a encontrar trocas com valores compatíveis ao seu item."

Por algo mais direto:
> "Você receberá propostas de troca apenas de itens dentro desta faixa de valor."

### 5. Aplicar mesmas mudancas em EditarItem.tsx

Sincronizar a mesma UX no formulario de edicao.

## Arquivos afetados

| Arquivo | Acao |
|---|---|
| `src/pages/NovoItem.tsx` | Reordenar campos, substituir margens por faixa de troca com range slider duplo, condicional de exibicao |
| `src/pages/EditarItem.tsx` | Mesmas mudancas |
| `src/components/ui/slider.tsx` | Ajustar para suportar dois thumbs (range mode) -- Radix Slider ja suporta nativamente com array de valores |

