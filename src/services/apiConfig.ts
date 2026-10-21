/**
 * Centralized API & Native Runtime Configuration
 * Ensures the Android APK (Capacitor) and Windows EXE (Electron)
 * connect seamlessly to the native bridge and backend proxy routes.
 */

export const CLOUD_BACKEND_ORIGIN =
  (typeof import.meta !== 'undefined' &&
    (import.meta as any).env?.VITE_API_BASE_URL) ||
  'https://ais-pre-bzqd6vgkhawz6dw3mytbb3-370169561435.europe-west2.run.app';

/**
 * Detects if the app is running inside a packaged Native APK (Capacitor) or Desktop EXE (Electron)
 * where window.location.origin is https://localhost or file:// rather than the Node backend.
 */
export function isNativeAppRuntime(): boolean {
  if (typeof window === 'undefined') return false;

  const cap = (window as any).Capacitor;
  if (cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform()) {
    return true;
  }

  if ((window as any).AndroidNativeBridge) {
    return true;
  }

  const { protocol, hostname, port } = window.location;
  if (protocol === 'capacitor:' || protocol === 'file:' || protocol === 'app:') {
    return true;
  }

  // Capacitor Android serves assets on https://localhost or http://localhost with no port
  if ((hostname === 'localhost' || hostname === '127.0.0.1') && !port) {
    return true;
  }

  return false;
}

/**
 * Converts a relative backend path into a full URL.
 * Inside the Android APK, /api/stream-proxy, /api/m3u-proxy, and /api/resolve-stream
 * are intercepted locally by LuminoriaWebViewClient on https://localhost with zero latency.
 */
export function buildApiUrl(path: string): string {
  if (!path) return path;
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  if (isNativeAppRuntime()) {
    // These 3 routes are handled directly by LuminoriaWebViewClient inside the APK
    if (
      normalizedPath.startsWith('/api/stream-proxy') ||
      normalizedPath.startsWith('/api/m3u-proxy') ||
      normalizedPath.startsWith('/api/resolve-stream') ||
      normalizedPath.startsWith('/__native_proxy__')
    ) {
      return normalizedPath;
    }
    return `${CLOUD_BACKEND_ORIGIN}${normalizedPath}`;
  }

  return normalizedPath;
}

/**
 * Opens the 100% Native Fullscreen Android Hardware Player (VideoView + MediaController)
 * inside the APK via AndroidNativeBridge.
 */
export function openInAppNativeAndroidPlayer(
  streamUrl: string,
  title: string = 'Luminoria Pro'
): boolean {
  if (typeof window === 'undefined') return false;
  let fullUrl = streamUrl;
  if (fullUrl.startsWith('/')) {
    const origin = window.location?.origin || 'https://localhost';
    fullUrl = `${origin}${fullUrl}`;
  }
  const bridge = (window as any).AndroidNativeBridge;
  if (bridge && typeof bridge.openInAppNativePlayer === 'function') {
    try {
      bridge.openInAppNativePlayer(fullUrl, title);
      return true;
    } catch (err) {
      console.warn('Falha ao acionar openInAppNativePlayer:', err);
    }
  }
  return false;
}

/**
 * Launches a stream URL in VLC, MX Player, or the Android OS System Player Chooser
 * via AndroidNativeBridge in MainActivity.java.
 */
export function openNativeAndroidPlayer(
  streamUrl: string,
  title: string = 'Luminoria Pro',
  packageName: string = ''
): boolean {
  if (typeof window === 'undefined') return false;
  let fullUrl = streamUrl;
  if (fullUrl.startsWith('/')) {
    const origin = window.location?.origin || 'https://localhost';
    fullUrl = `${origin}${fullUrl}`;
  }
  const bridge = (window as any).AndroidNativeBridge;
  if (bridge && typeof bridge.openExternalPlayer === 'function') {
    try {
      bridge.openExternalPlayer(fullUrl, title, packageName);
      return true;
    } catch (err) {
      console.warn('Falha ao acionar openExternalPlayer:', err);
    }
  }
  return false;
}
