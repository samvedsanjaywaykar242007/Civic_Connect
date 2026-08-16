/**
 * CivicConnect Environment Configuration and Runtime Mode
 *
 * Automatically detects whether live Firebase credentials exist.
 * Allows programmatic inspection of runtime mode for College Demo presentations.
 */
import { isFirebaseConfigValid } from './firebase';

export interface AppConfig {
  isDemoMode: boolean;
  firebaseConfigured: boolean;
  googleMapsConfigured: boolean;
  geminiConfigured: boolean;
  appName: string;
  version: string;
  defaultRegion: string;
  defaultCoordinates: {
    lat: number;
    lng: number;
  };
}

const getEnv = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env;
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env;
  }
  return {};
};

const env = getEnv();
const googleMapsApiKey = env.VITE_GOOGLE_MAPS_API_KEY;
const isGoogleMapsConfigured = Boolean(googleMapsApiKey && googleMapsApiKey.trim() !== '');

// Allow runtime override for presentation testing via sessionStorage
const getStoredMode = (): boolean => {
  try {
    if (typeof sessionStorage !== 'undefined') {
      const override = sessionStorage.getItem('civicconnect_demo_override');
      if (override !== null) {
        return override === 'true';
      }
    }
  } catch {
    // sessionStorage unavailable
  }
  const envAppMode = env.VITE_APP_ENV;
  return envAppMode === 'demo' || !isFirebaseConfigValid;
};

let currentDemoMode = getStoredMode();

export const appConfig: AppConfig = {
  get isDemoMode() {
    return currentDemoMode;
  },
  firebaseConfigured: isFirebaseConfigValid,
  googleMapsConfigured: isGoogleMapsConfigured,
  geminiConfigured: !currentDemoMode,
  appName: 'CivicConnect',
  version: '1.0.0',
  defaultRegion: 'Maharashtra & Uttar Pradesh, India',
  defaultCoordinates: {
    lat: 18.5204, // Pune, Maharashtra
    lng: 73.8567,
  },
};

export function setDemoModeOverride(enableDemo: boolean): void {
  currentDemoMode = enableDemo;
  try {
    sessionStorage.setItem('civicconnect_demo_override', String(enableDemo));
  } catch {
    // Ignore storage errors
  }
  window.dispatchEvent(new CustomEvent('civicconnect:mode_change', { detail: { isDemoMode: enableDemo } }));
}
