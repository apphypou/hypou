

# Adicionar segunda fileira de cards + animacoes premium

## O que muda

Adicionar **2 cards extras** (PS5 e Notebook) em uma segunda fileira abaixo dos atuais, preenchendo o espaco vazio. Alem disso, adicionar animacoes que elevam a composicao visual.

```text
┌─────────────────────────┐
│     ┌──────┐ ┌──────┐   │  Fileira 1: Fone + Camiseta
│     │ 🎧   │ │ 👕   │   │  (existentes)
│     │Fone  │ │Camis │   │
│     └──────┘ └──────┘   │
│         ⇄               │
│     ┌──────┐ ┌──────┐   │  Fileira 2: PS5 + Notebook
│     │ 🎮   │ │ 💻   │   │  (novos, menores, mais sutis)
│     │PS5   │ │Note  │   │
│     └──────┘ └──────┘   │
│                         │
├─────────────────────────┤
│ ● TROQUE COM SEGURANÇA  │
│ Bem-vindo ao Hypou      │
│ ...                     │
└─────────────────────────┘
```

## Cards novos

1. **PS5** - icone `Gamepad2`, gradiente azul/indigo, preco "R$ 2.500", categoria "Games"
2. **Notebook Dell** - icone `Laptop`, gradiente verde-esmeralda/teal, preco "R$ 3.200", categoria "Eletrônicos"

Os cards da segunda fileira serao **ligeiramente menores** (140px largura vs 160px) e com **opacidade levemente reduzida** (0.85) para criar hierarquia visual e profundidade — a fileira de tras parecendo "mais distante".

## Ideias de animacao (frontend senior)

1. **Floating sutil nos cards** - Apos a animacao de entrada, os 4 cards ganham um micro-float continuo (`translateY: [0, -6, 0]`) com duracao e delay diferentes, criando um efeito "respirando" organico. Os cards nunca ficam estaticos.

2. **Stagger cascata** - Os cards da segunda fileira entram 0.3s depois dos primeiros, vindos de baixo com fade, criando uma cascata natural de cima pra baixo.

3. **Swap icon com rotacao** - O icone de swap ganha uma rotacao de 180° a cada 3s alem do pulse, simulando uma troca acontecendo.

4. **Glow que acompanha** - Intensificar o radial gradient para cobrir a area das 2 fileiras, nao so a primeira.

## Detalhes tecnicos

- **Arquivo**: `src/pages/Index.tsx`
- **Icones novos**: `Gamepad2` e `Laptop` do lucide-react
- **Container**: Aumentar altura do container de `h-[320px]` para `h-[440px]` para acomodar a segunda fileira
- **Segunda fileira**: Posicionada com `top: 220px`, cards com rotacao invertida em relacao a primeira fileira (direito -3°, esquerdo +3°) para variar
- **Floating animation**: `motion.div` com `animate={{ y: [0, -6, 0] }}` e `transition={{ duration: 3+i*0.5, repeat: Infinity }}`
- **Swap icon rotation**: Adicionar `animate={{ rotate: [0, 180, 180, 360], scale: [1, 1.15, 1] }}`

