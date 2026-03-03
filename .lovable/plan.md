

## Plano: Cápsula orgânica estilo referência

O problema atual é que o SVG usa três formas separadas (dois círculos + retângulo) com `fillRule="evenodd"`, que não cria a curva orgânica de "cintura" visível na referência. A referência mostra uma forma contínua com curvas Bézier suaves que se estreitam no centro.

### Mudança

Substituir o `path` atual (linha 390) por um **path único contínuo** que desenha toda a forma de osso com curvas cúbicas de Bézier, criando a cintura orgânica:

```
M36,36 C36,16 36,0 56,0 C68,0 72,16 90,20
C108,16 112,0 124,0 C144,0 144,16 144,36
C144,56 144,72 124,72 C112,72 108,56 90,52
C72,56 68,72 56,72 C36,72 36,56 36,36 Z
```

Este path único cria dois "lobos" conectados por uma cintura suave que se estreita naturalmente no centro, exatamente como na imagem de referência.

Arquivo: `src/pages/Explorar.tsx`, linhas 389-395 — apenas o `<path>` e atributos do SVG mudam. Nenhuma animação é alterada.

