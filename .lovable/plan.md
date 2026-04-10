

# Plano: Configuração Completa do Capacitor para Build Nativo

## Resumo

Instalar e configurar o Capacitor no projeto Hypou para gerar builds nativos Android e iOS, incluindo splash screen, ícones adaptativos, safe areas e ajustes de navegação.

---

## Estado Atual

- **Capacitor NÃO está instalado** (sem dependências no package.json, sem `capacitor.config.ts`, sem pastas `android/` ou `ios/`)
- PWA já configurada com `vite-plugin-pwa`
- App usa `100dvh`, bottom nav fixa, e navegação SPA com React Router

---

## Etapas de Implementação

### 1. Instalar dependências do Capacitor

Adicionar ao `package.json`:
- `@capacitor/core` (dependency)
- `@capacitor/cli` (devDependency)
- `@capacitor/ios` (dependency)
- `@capacitor/android` (dependency)
- `@capacitor/splash-screen` (dependency)
- `@capacitor/status-bar` (dependency)
- `@capacitor/keyboard` (dependency)

### 2. Criar `capacitor.config.ts`

```typescript
import type { CapacitorConfig } from '@capacitor/core';

const config: CapacitorConfig = {
  appId: 'app.lovable.acb982366bad48cfa029a44082a5c548',
  appName: 'Hypou',
  webDir: 'dist',
  server: {
    url: 'https://acb98236-6bad-48cf-a029-a44082a5c548.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 2000,
      backgroundColor: '#0a0a0a',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0a0a0a',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
```

### 3. Ajustar safe areas (status bar e notch)

Atualizar `index.css` para adicionar padding seguro em dispositivos com notch:

```css
:root {
  --safe-area-top: env(safe-area-inset-top);
  --safe-area-bottom: env(safe-area-inset-bottom);
}
```

Atualizar `ScreenLayout.tsx` para respeitar safe areas:
```tsx
padding-top: env(safe-area-inset-top)
padding-bottom: env(safe-area-inset-bottom)
```

Atualizar `BottomNav.tsx` para ajustar posição considerando o safe area inferior.

### 4. Inicializar StatusBar e Keyboard no `main.tsx`

```typescript
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';

if (Capacitor.isNativePlatform()) {
  StatusBar.setStyle({ style: Style.Dark });
  StatusBar.setBackgroundColor({ color: '#0a0a0a' });
  Keyboard.setResizeMode({ mode: 'body' });
}
```

### 5. Criar assets de Splash Screen e Ícones

Adicionar instruções no `documentacao.md` para que, localmente, o dev gere os assets com:

```bash
npx @capacitor/assets generate --iconBackgroundColor '#0a0a0a' --splashBackgroundColor '#0a0a0a'
```

Requer que `resources/icon.png` (1024x1024) e `resources/splash.png` (2732x2732) existam. Vou criar a pasta `resources/` com instrução de onde colocar o logo.

### 6. Atualizar `documentacao.md`

Adicionar seção "Build Nativo (Capacitor)" com instruções completas:
- Como exportar para GitHub
- `npm install` → `npx cap add android` / `npx cap add ios`
- `npm run build` → `npx cap sync`
- `npx cap run android` / `npx cap run ios`
- Requisitos (Android Studio / Xcode)
- Como gerar ícones e splash screen

---

## Arquivos Modificados/Criados

| Arquivo | Ação |
|---------|------|
| `package.json` | Adicionar dependências Capacitor |
| `capacitor.config.ts` | Criar configuração |
| `src/main.tsx` | Inicializar plugins nativos |
| `src/index.css` | Safe area CSS variables |
| `src/components/ScreenLayout.tsx` | Safe area padding |
| `src/components/BottomNav.tsx` | Safe area bottom |
| `documentacao.md` | Seção de build nativo |

---

## Pós-implementação (manual pelo dev)

1. Exportar projeto para GitHub
2. `git pull` → `npm install`
3. Colocar `logo-hypou.png` em `resources/icon.png` (1024x1024) e criar `resources/splash.png`
4. `npx cap add android && npx cap add ios`
5. `npx @capacitor/assets generate`
6. `npx cap sync`
7. `npx cap run android` ou `npx cap run ios`

Referência: [Blog post Lovable sobre Capacitor](https://docs.lovable.dev/tips-tricks/mobile-development)

