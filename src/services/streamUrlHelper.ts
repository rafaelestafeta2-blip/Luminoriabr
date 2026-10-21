/**
 * Curated list of verified live HLS broadcast streams (Red Bull TV Live HD,
 * Unified Streaming Tears of Steel Live Action Sci-Fi, Akamai Live HD)
 * for live TV channels when an external IPTV channel is temporarily offline.
 * Zero 1-minute cartoon demo clips.
 */
export const REAL_HD_MP4_STREAMS = [
  'https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8',
  'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
  'https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8',
  'https://demo.unified-streaming.com/k8s/live/stable/scte35.isml/.m3u8',
];

export const REAL_HD_WEBM_STREAMS = [
  'https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8',
  'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
];

/**
 * Detects whether the current browser natively decodes H.264 MP4 or prefers WebM VP8/VP9.
 */
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
 * Picks a deterministic, verified live HLS stream based on title or ID string.
 */
export function getDeterministicHdStream(seed: string = ''): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const pool = REAL_HD_MP4_STREAMS;
  return pool[hash % pool.length];
}

/**
 * Checks if a URL is a non-existent mock/demo placeholder domain or 1-minute demo cartoon clip.
 */
export function isPlaceholderStreamUrl(url?: string): boolean {
  if (!url || !url.trim()) return true;
  const lower = url.toLowerCase();
  return (
    lower.startsWith('lumin://') ||
    lower.includes('luminoria.pro') ||
    lower.includes('example.com') ||
    lower.includes('placeholder') ||
    lower.includes('commondatastorage.googleapis.com/gtv-videos-bucket') ||
    lower.includes('media.w3.org') ||
    lower.includes('w3schools.com') ||
    lower.includes('interactive-examples.mdn')
  );
}

/**
 * Resolves a playable video stream URL, routing insecure HTTP IPTV links through
 * our local backend HTTPS stream proxy and replacing fake placeholder domains
 * with verified HTTP 200 HD cinema streams.
 */
export function resolveSafeStreamUrl(rawUrl?: string, seedTitle?: string): string {
  if (isPlaceholderStreamUrl(rawUrl)) {
    return getDeterministicHdStream(seedTitle || rawUrl || 'default');
  }

  const clean = rawUrl!.trim();

  if (clean.startsWith('/api/stream-proxy')) {
    return clean;
  }

  // Route HTTP or non-standard port IPTV streams through backend proxy
  if (
    clean.startsWith('http://') ||
    clean.includes(':80/') ||
    clean.includes(':8080/') ||
    clean.includes(':2086/') ||
    clean.includes(':2095/') ||
    clean.includes('elitedns.xyz') ||
    clean.includes('securitycloudflare.online')
  ) {
    return `/api/stream-proxy?url=${encodeURIComponent(clean)}`;
  }

  return clean;
}

/**
 * Converts an Xtream/XUI raw .ts live channel URL into its .m3u8 HLS equivalent
 */
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

/**
 * Generates platform-aware native player deep links for iOS (AVPlayer, VLC iOS, Infuse),
 * Android (MediaCodec ExoPlayer intent://, VLC Android, MX Player), and Desktop.
 */
export function buildDeviceNativeStreamUrls(
  rawUrl?: string,
  title: string = 'Filme HD'
): AndroidNativeIntentLinks {
  const effectiveUrl = isPlaceholderStreamUrl(rawUrl)
    ? REAL_HD_MP4_STREAMS[0]
    : rawUrl!.trim();

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

    // iOS schemes:
    // 1. Direct stream in Safari triggers native iOS AVPlayer fullscreen with AirPlay & PiP
    // 2. VLC for iOS: vlc-x-callback://x-callback-url/stream?url=...
    // 3. Infuse iOS: infuse://x-callback-url/play?url=...
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

    // Desktop / other
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
      primaryNativeLabel: platform === 'ios' ? 'Player Nativo iPhone' : 'Player Nativo',
      primaryNativeUrl: effectiveUrl,
      vlcUrl: effectiveUrl,
      vlcLabel: 'Abrir no VLC',
      secondaryPlayerUrl: effectiveUrl,
      secondaryPlayerLabel: 'Abrir Stream Direto',
    };
  }
}

/** Backwards compatibility alias for buildDeviceNativeStreamUrls */
export const buildAndroidNativeIntentUrls = buildDeviceNativeStreamUrls;
