

## Plano: Cápsula formato haltere/osso com SVG

O conector atual é um retângulo simples entre os botões. Precisa virar uma forma orgânica de "osso/haltere" — dois círculos conectados por uma cintura estreita, como na imagem de referência.

### Abordagem

Substituir o `div` retângulo (linhas 382-393) por um **SVG inline** com um `path` que desenha a forma de osso/haltere corretamente. A falha anterior do SVG foi por dimensões e coordenadas erradas.

### Implementação (linhas 382-393 de `src/pages/Explorar.tsx`)

Remover o `div` conector e substituir por um SVG absoluto que:

1. **Viewbox `0 0 180 72`** — proporção que cobre os dois botões (`h-16 w-16` = 64px cada, ~180px total com gap)
2. **Path com curvas Bézier** formando dois círculos (raio 36) nas extremidades conectados por uma cintura estreita (~20px de altura) no centro
3. **Posicionamento absoluto** centralizado atrás dos botões com `z-0`
4. **Estilo**: `fill` usando `hsl(var(--card))`, `stroke` usando `hsl(var(--border))` com opacidade

O path será algo como:
```
M36,0 A36,36 0 1,1 36,72 A36,36 0 1,1 36,0 Z  (círculo esquerdo)
M144,0 A36,36 0 1,1 144,72 A36,36 0 1,1 144,0 Z  (círculo direito)
M60,26 C70,26 110,26 120,26 L120,46 C110,46 70,46 60,46 Z  (cintura com curvas)
```

Usando `fillRule="evenodd"` para unir as formas. Os botões continuam com `zIndex: 1` para ficarem acima do SVG.

### Todas as animações competitivas são preservadas
- `containerRotate`, scale/y/x/opacity/glow de ambos os botões permanecem inalterados.

