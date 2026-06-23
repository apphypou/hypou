import type { CapacitorConfig } from '@capacitor/cli';

const devServerUrl = process.env.HYPOU_CAP_SERVER_URL;

const config: CapacitorConfig = {
  appId: 'app.hypou.mobile',
  appName: 'Hypou',
  webDir: 'dist',
  ...(devServerUrl
    ? {
        server: {
          url: devServerUrl,
          cleartext: true,
        },
      }
    : {}),
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      launchShowDuration: 3000,
      backgroundColor: '#1C1C1C',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#1C1C1C',
    },
    Keyboard: {
      resize: 'none',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
