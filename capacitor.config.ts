import type { CapacitorConfig } from '@capacitor/cli';

/**
 * dorymo native wrapper. The SAME React build powers web + Android + iOS.
 * Hash routing (#/pay, #/chat-v2...) works inside the WebView without changes.
 */
const config: CapacitorConfig = {
  appId: 'com.dorymo.app',
  appName: 'dorymo',
  webDir: 'dist',
  loggingBehavior: 'production',
  server: {
    androidScheme: 'https',
    // Allow the bKash / Nagad / Supabase hosts to open in the WebView later.
    allowNavigation: ['*.supabase.co', '*.bka.sh', '*.sslcommerz.com'],
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: '#09090b',
      showSpinner: false,
    },
    StatusBar: {
      color: '#09090b',
      style: 'DARK',
    },
  },
};

export default config;
