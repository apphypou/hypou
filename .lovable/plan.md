

# Pagina de Lista de Espera — Pre-Lancamento Hypou

## Conceito de Marketing

Uma landing page de pre-lancamento que gera **FOMO e curiosidade**. A estrategia e criar uma atmosfera de **clube exclusivo** — quem entra na lista esta "por dentro" antes de todo mundo. Elementos-chave:

- **Contagem regressiva** com timer animado (gera urgencia)
- **Revelacao parcial** — mostrar fragments do app com blur/glitch, como se estivesse "vazando"
- **Contador social** — mostrar quantas pessoas ja estao na fila (prova social)
- **Posicao na fila** — apos cadastro, mostrar "Voce e o #247" (gamificacao)
- **Micro-animacoes** de particulas/glow que reforçam a estetica neon/cyberpunk da marca

## Estrutura da Pagina

```text
┌─────────────────────────────────┐
│  ✦ Algo grande esta chegando    │  ← badge animado com pulse
│                                 │
│      H Y P O U                  │  ← logo grande com glow intenso
│   A nova forma de trocar        │  ← tagline com typing effect
│                                 │
│  ┌─ 12 : 05 : 33 : 07 ──┐     │  ← countdown timer neon
│  │ dias  hrs  min  seg   │     │
│  └───────────────────────┘     │
│                                 │
│  ┌──────────────────────┐      │
│  │ 📧 Seu melhor email  │      │  ← input com glow on focus
│  └──────────────────────┘      │
│  [ GARANTIR MINHA VAGA →]      │  ← CTA neon pulsante
│                                 │
│  🔥 1.247 pessoas na fila      │  ← contador social animado
│                                 │
│  ┌─────┐ ┌─────┐ ┌─────┐      │  ← preview cards com blur
│  │░░░░░│ │░░░░░│ │░░░░░│      │     efeito "leak" do app
│  └─────┘ └─────┘ └─────┘      │
│                                 │
│  "Troque. Economize. Conquiste" │
│                                 │
│   IG  •  TT  •  X              │  ← redes sociais
└─────────────────────────────────┘
```

**Pos-cadastro**: a pagina transiciona (sem reload) para um estado de confirmacao mostrando posicao na fila, opcao de compartilhar para "subir na fila", e um teaser animado do app.

## Detalhes de UX/UI

1. **Background**: mesh gradient escuro com particulas flutuantes sutis (dots cyan com opacity baixa, animados com CSS)
2. **Logo**: versao oversized do HypouLogo com text-glow intensificado e animacao de "respiro" (scale pulse suave)
3. **Countdown**: 4 blocos glass-card com numeros grandes, separados por ":", cada digito faz flip animation ao mudar
4. **Input de email**: borda transparente que ganha glow cyan ao focar, estilo glassmorphism
5. **CTA**: NeonButton "primary" com texto "Garantir minha vaga" e shimmer effect continuo
6. **Contador social**: numero que incrementa com animacao (contagem falsa local que sobe lentamente para criar urgencia)
7. **Preview leak**: 3 mini-cards do app com heavy blur (backdrop-blur-xl) + overlay "Em breve", sugere o conteudo sem revelar
8. **Particulas**: 15-20 circulos pequenos com opacity 0.1-0.3 flutuando com CSS animation (sem lib extra)

## Detalhes Tecnicos

- **Nova pagina**: `src/pages/ListaEspera.tsx`
- **Nova rota**: `/lista-espera` em `App.tsx` (publica)
- **Rota index**: substituir temporariamente a rota `/` para apontar para ListaEspera (ou adicionar redirect)
- **Tabela Supabase**: `waitlist` com colunas `id`, `email`, `position`, `referral_code`, `referred_by`, `created_at`
- **Migracao**: criar tabela + RLS (insert publico, select apenas pelo proprio email)
- **Deps**: apenas framer-motion (ja instalado) + lucide-react
- **Countdown target**: data configuravel como constante (ex: 30 dias a partir de hoje)
- **Estado pos-registro**: useState local alterna entre formulario e tela de confirmacao
- **Animacoes**: framer-motion para entrada dos elementos, CSS keyframes para particulas e shimmer

## Fluxo do Usuario

1. Usuario acessa `/lista-espera`
2. Ve a contagem regressiva e o hype visual
3. Insere email e clica "Garantir minha vaga"
4. Email e salvo na tabela `waitlist` no Supabase
5. Tela transiciona para confirmacao com posicao na fila
6. Opcao de compartilhar link com referral code para "furar a fila"

