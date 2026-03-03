

## Redesign da Tela de Boas-Vindas do Hypou

### Analise da tela atual (screenshot do usuario)
A tela atual ja tem uma estrutura solida: hero image com overlay, badge "Troque com seguranca", titulo com gradient, descricao e dois CTAs. O principal pedido e:
1. **Remover a logo PNG** atual
2. **Criar uma logo tipografica** direto em codigo (SVG/CSS)
3. **Modernizar** o layout geral

### Visao de Produto (PM)
A landing page e o primeiro contato. Precisa comunicar em 3 segundos: "troque coisas de forma divertida". A tela atual e boa mas pode ser mais impactante com:
- Logo tipografica propria (nao depender de imagem)
- Hierarquia visual mais clara
- Micro-interacoes sutis (fade-in dos elementos)
- Hero image melhor posicionada

### Plano de Design

**1. Nova logo tipografica em codigo**
- Criar um componente `HypouLogo` que renderiza "Hyp**ou**" com tipografia estilizada
- "Hyp" em foreground bold, "ou" em primary (cyan) -- reforça a marca sem precisar de PNG
- Usar no header da landing e reutilizar em outras telas futuramente

**2. Redesign do Index.tsx**
- Remover import da logo PNG
- Header: usar `HypouLogo` no canto superior esquerdo
- Hero: manter a imagem de fundo mas melhorar o gradient overlay para transicao mais suave
- Conteudo: adicionar animacoes de entrada com framer-motion (fade-up escalonado)
- Badge: manter o estilo atual (ja esta bom)
- Botoes: manter NeonButton (consistencia com design system)
- Footer: melhorar espacamento

**3. Arquivos afetados**
- `src/components/HypouLogo.tsx` -- novo componente
- `src/pages/Index.tsx` -- redesign completo

