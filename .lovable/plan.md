

# Animacao de Swipe Automatico nos Cards da Welcome Screen

## Conceito

Transformar a area de cards estaticos em uma **vitrine animada** que simula swipes automaticos, mostrando diferentes produtos em loop. Dois cards empilhados fazem swipe simultaneo — o da frente sai pela lateral com rotacao enquanto o de tras sobe e assume a posicao principal, e um novo card entra por baixo. Isso comunica visualmente a mecanica core do app (trocar produtos) antes mesmo do usuario entrar.

```text
Estado 1:          Swipe:              Estado 2:
┌──────┐ ┌──────┐   ──────┐ ┌──────┐   ┌──────┐ ┌──────┐
│ PS5  │ │ Note │   │sai→ │ │ sobe │   │ Note │ │ Fone │
└──────┘ └──────┘   ──────┘ └──────┘   └──────┘ └──────┘
     🤝                  🤝                  🤝
                    ← novo entra
```

## Mecanica da Animacao

1. **Array expandido de produtos** — 4-5 pares de produtos (usando as 2 imagens reais + cards com icones/gradientes para os demais: Fone, Camiseta, Bicicleta, Camera)
2. **Ciclo a cada ~3.5s** — O par atual faz swipe out (card esquerdo sai pela esquerda com rotacao, card direito sai pela direita), enquanto o proximo par entra de baixo com fade+scale
3. **AnimatePresence** do Framer Motion para orquestrar exit/enter com transicoes suaves
4. **Handshake icon** faz um pulse + rotate sutil durante a transicao, reforçando a ideia de troca
5. **Loop infinito** — volta ao primeiro par apos o ultimo

## Detalhes Visuais Premium

- **Exit animation**: translateX(+-200) + rotateZ(+-15deg) + opacity 0, duração 0.6s com ease-out
- **Enter animation**: translateY(40) + scale(0.9) + opacity 0 → posicao final, duração 0.5s com spring
- **Cards sem imagem real**: usam gradiente colorido + icone Lucide centralizado (Headphones, Shirt, Bike, Camera) para manter variedade visual sem precisar de assets
- **Micro-interacao**: leve glow cyan pulsa no momento da transicao

## Detalhes Tecnicos

- **Arquivo**: `src/pages/Index.tsx`
- **Deps**: `framer-motion` (AnimatePresence, ja instalado), `lucide-react` (icones extras)
- **State**: `useState` para indice do par atual, `useEffect` com `setInterval` de 3500ms para ciclar
- **Estrutura**: Array de pares `[{left, right}, ...]`, cada item tem `image | icon + gradient`, nome, preco, categoria
- **AnimatePresence mode="wait"** envolvendo o par de cards, com key baseada no indice
- **Pausa ao sair da aba**: usar `document.hidden` para pausar o intervalo e evitar consumo desnecessario

