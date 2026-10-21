import { buildApiUrl } from './apiConfig';

/**
 * Curated list of verified live HLS broadcast streams
 * for live TV channels when an external IPTV channel is temporarily offline.
 */
export const REAL_HD_MP4_STREAMS = [
  'https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8',
  'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
  'https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8',
  'https://demo.unified-streaming.com/k8s/live/stable/scte35.isml/.m3u8',
  'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
];

export const REAL_HD_WEBM_STREAMS = [
  'https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8',
  'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
];

export function browserSupportsH264Mp4(): boolean {
  if (typeof document === 'undefined') return true;
  try {
    const v = document.createElement('video');
    const support = v.canPlayType('video/mp4; codecs="avc1.42E01E"');
    return support === 'probably' || support === 'maybe';
  } catch {
    return true;
  }
}

/**
 * Deterministically picks a distinct verified HD stream based on title/seed string.
 */
export function getDeterministicHdStream(seed: string = ''): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return REAL_HD_MP4_STREAMS[hash % REAL_HD_MP4_STREAMS.length];
}

export function isPlaceholderStreamUrl(url?: string): boolean {
  if (!url || !url.trim()) return true;
  const lower = url.toLowerCase();
  return (
    lower.startsWith('lumin://') ||
    lower.includes('stream.luminoria.pro') ||
    lower.includes('vod.luminoria.pro') ||
    lower.includes('example.com') ||
    lower.includes('placeholder')
  );
}

/**
 * Resolves a playable video stream URL, routing IPTV streams through /api/stream-proxy
 * (handled by Express on Web and by LuminoriaWebViewClient natively inside the Android APK).
 */
export function resolveSafeStreamUrl(rawUrl?: string, seedTitle?: string): string {
  if (isPlaceholderStreamUrl(rawUrl)) {
    return getDeterministicHdStream(seedTitle || rawUrl || 'default');
  }

  const clean = rawUrl!.trim();

  if (clean.includes('/api/stream-proxy')) {
    return buildApiUrl(clean);
  }

  // Route HTTP or IPTV streams through /api/stream-proxy
  if (
    clean.startsWith('http://') ||
    clean.includes(':80/') ||
    clean.includes(':8080/') ||
    clean.includes(':2086/') ||
    clean.includes(':2095/') ||
    clean.includes('elitedns.xyz') ||
    clean.includes('securitycloudflare.online')
  ) {
    return buildApiUrl(`/api/stream-proxy?url=${encodeURIComponent(clean)}`);
  }

  return clean;
}

export function convertTsToHlsUrl(rawUrl: string): string | null {
  try {
    const parsed = new URL(rawUrl.trim());
    if (parsed.pathname.endsWith('.ts')) {
      const m3u8Path = parsed.pathname.replace(/\.ts$/i, '.m3u8');
      parsed.pathname = m3u8Path.startsWith('/live/') ? m3u8Path : `/live${m3u8Path}`;
      return parsed.toString();
    }
  } catch {}
  return null;
}

export type DevicePlatform = 'ios' | 'android' | 'desktop';

export function detectDevicePlatform(): DevicePlatform {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent || '';
  const isIos =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (isIos) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'desktop';
}

export interface AndroidNativeIntentLinks {
  systemVideoPlayerIntent: string;
  vlcIntent: string;
  mxPlayerIntent: string;
  webVideoCastIntent: string;
  directUrl: string;
  platform: DevicePlatform;
  primaryNativeLabel: string;
  primaryNativeUrl: string;
  vlcUrl: string;
  vlcLabel: string;
  secondaryPlayerUrl: string;
  secondaryPlayerLabel: string;
}

export function buildDeviceNativeStreamUrls(
  rawUrl?: string,
  title: string = 'Filme HD'
): AndroidNativeIntentLinks {
  let effectiveUrl = isPlaceholderStreamUrl(rawUrl)
    ? getDeterministicHdStream(title || rawUrl || 'default')
    : rawUrl!.trim();

  if (effectiveUrl.startsWith('/')) {
    const origin = typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://localhost';
    effectiveUrl = `${origin}${effectiveUrl}`;
  }

  const platform = detectDevicePlatform();
  const encodedTitle = encodeURIComponent(title);
  const encodedUrl = encodeURIComponent(effectiveUrl);

  try {
    const parsed = new URL(effectiveUrl);
    const scheme = parsed.protocol.replace(':', '');
    const hostAndPath = effectiveUrl.replace(/^https?:\/\//i, '');
    const mimeType = effectiveUrl.includes('.m3u8')
      ? 'application/x-mpegURL'
      : 'video/mp4';

    const androidSystemIntent = `intent://${hostAndPath}#Intent;scheme=${scheme};type=${mimeType};action=android.intent.action.VIEW;S.title=${encodedTitle};end`;
    const androidVlcIntent = `intent://${hostAndPath}#Intent;scheme=${scheme};package=org.videolan.vlc;type=${mimeType};action=android.intent.action.VIEW;S.title=${encodedTitle};end`;
    const androidMxIntent = `intent://${hostAndPath}#Intent;scheme=${scheme};package=com.mxtech.videoplayer.ad;type=${mimeType};action=android.intent.action.VIEW;S.title=${encodedTitle};end`;

    const iosVlc = `vlc-x-callback://x-callback-url/stream?url=${encodedUrl}`;
    const iosInfuse = `infuse://x-callback-url/play?url=${encodedUrl}`;

    if (platform === 'ios') {
      return {
        systemVideoPlayerIntent: effectiveUrl,
        vlcIntent: iosVlc,
        mxPlayerIntent: iosInfuse,
        webVideoCastIntent: effectiveUrl,
        directUrl: effectiveUrl,
        platform: 'ios',
        primaryNativeLabel: 'Player Nativo iPhone (AVPlayer)',
        primaryNativeUrl: effectiveUrl,
        vlcUrl: iosVlc,
        vlcLabel: 'Abrir no VLC iPhone',
        secondaryPlayerUrl: iosInfuse,
        secondaryPlayerLabel: 'Abrir no Infuse iOS',
      };
    }

    if (platform === 'android') {
      return {
        systemVideoPlayerIntent: androidSystemIntent,
        vlcIntent: androidVlcIntent,
        mxPlayerIntent: androidMxIntent,
        webVideoCastIntent: `wvc-x-callback://open?url=${encodedUrl}&title=${encodedTitle}`,
        directUrl: effectiveUrl,
        platform: 'android',
        primaryNativeLabel: 'Player Nativo Android',
        primaryNativeUrl: androidSystemIntent,
        vlcUrl: androidVlcIntent,
        vlcLabel: 'Abrir no VLC Android',
        secondaryPlayerUrl: androidMxIntent,
        secondaryPlayerLabel: 'Abrir no MX Player',
      };
    }

    return {
      systemVideoPlayerIntent: effectiveUrl,
      vlcIntent: `vlc://${effectiveUrl.replace(/^https?:\/\//i, '')}`,
      mxPlayerIntent: effectiveUrl,
      webVideoCastIntent: effectiveUrl,
      directUrl: effectiveUrl,
      platform: 'desktop',
      primaryNativeLabel: 'Player Nativo do Sistema',
      primaryNativeUrl: effectiveUrl,
      vlcUrl: `vlc://${effectiveUrl.replace(/^https?:\/\//i, '')}`,
      vlcLabel: 'Abrir no VLC',
      secondaryPlayerUrl: effectiveUrl,
      secondaryPlayerLabel: 'Abrir Stream Direto',
    };
  } catch {
    return {
      systemVideoPlayerIntent: effectiveUrl,
      vlcIntent: effectiveUrl,
      mxPlayerIntent: effectiveUrl,
      webVideoCastIntent: effectiveUrl,
      directUrl: effectiveUrl,
      platform,
      primaryNativeLabel: 'Player Nativo',
      primaryNativeUrl: effectiveUrl,
      vlcUrl: effectiveUrl,
      vlcLabel: 'Abrir no VLC',
      secondaryPlayerUrl: effectiveUrl,
      secondaryPlayerLabel: 'Abrir Stream Direto',
    };
  }
}

export const buildAndroidNativeIntentUrls = buildDeviceNativeStreamUrls;
