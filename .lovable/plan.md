

## Plano: Knob neutro com ícone direcional sutil

### Problema
No estado neutro (centro), o knob é um círculo branco vazio sobre fundo cinza — parece um elemento "morto", sem affordance. Não comunica que é arrastável nem indica as direções possíveis.

### Solução de design

Substituir o círculo vazio por um knob com **duas setas horizontais sutis** (← →) em cinza claro (~15% opacidade) que indicam "arraste para os lados". Conforme o usuário arrasta:

1. **Estado neutro (centro):** Knob branco com ícone de setas `⟨ ⟩` em cinza claro (opacidade 0.2) — comunica "arraste-me"
2. **Arrastando para direita:** As setas fazem fade-out, o check verde faz fade-in
3. **Arrastando para esquerda:** As setas fazem fade-out, o X vermelho faz fade-in

A opacidade das setas neutras será `Math.max(0, 1 - (leftProgress + rightProgress) * 3)` — desaparecem rapidamente assim que o arraste começa, dando lugar ao ícone de ação.

### Mudança em `src/components/SwipeToggle.tsx`

Adicionar dentro do `<g>` do knob (após o `<circle>`, antes dos ícones X e Check) um terceiro grupo `<g>` com:
- Duas chevrons horizontais (`‹` e `›`) usando paths SVG simples
- Cor `#999999`, strokeWidth 3, opacidade calculada pelo `neutralOpacity`
- Mesmo `transitionStyle` dos outros ícones

Nenhum outro arquivo muda.

