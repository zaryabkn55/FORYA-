import type { CapacitorConfig } from '@capacitor/cli';

/**
 * The native shell around the FORYA web app.
 *
 * The web assets are bundled into the app rather than loaded from the server. That means the
 * app opens instantly and still renders without a connection, and — importantly for review — it
 * is a real application rather than a browser pointed at a website, which Apple rejects under
 * guideline 4.2 (minimum functionality).
 *
 * Because the bundle is local, the page's origin is capacitor://localhost on iOS and
 * https://localhost on Android. API calls therefore cross origins, which has two consequences:
 *   1. the build must set VITE_API_BASE to the deployed server (see MOBILE.md), and
 *   2. the server's ALLOWED_ORIGINS must list both shell origins, or every request is refused.
 *
 * appId is permanent once an app is published under it. Change it before the first submission
 * if FORYA ends up on a different domain.
 */
const config: CapacitorConfig = {
  appId: 'com.forya.app',
  appName: 'FORYA',
  webDir: 'dist',

  // Keeps the JWT in localStorage across launches; without a fixed scheme the webview origin
  // can change between releases and the user is silently signed out.
  android: {
    allowMixedContent: false,
  },
  ios: {
    contentInset: 'always',
    limitsNavigationsToAppBoundDomains: false,
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: '#F6F5F2',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      style: 'LIGHT', // dark text on the light brand background
      backgroundColor: '#F6F5F2',
    },
  },
};

export default config;
