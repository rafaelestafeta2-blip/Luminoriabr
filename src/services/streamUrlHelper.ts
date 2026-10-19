/**
 * Curated list of verified HTTP 200 HD cinema streams (MP4 H.264 + WebM VP9)
 * for instant browser playback when an item uses a demo placeholder or when an
 * external IPTV server blocks browser playback via Cloudflare ASN rules.
 */
export const REAL_HD_MP4_STREAMS = [
  'https://media.w3.org/2010/05/sintel/trailer.mp4',
  'https://media.w3.org/2010/05/bunny/movie.mp4',
  'https://media.w3.org/2010/05/bunny/trailer.mp4',
  'https://media.w3.org/2010/05/video/movie_300.mp4',
  'https://www.w3schools.com/html/mov_bbb.mp4',
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
];

export const REAL_HD_WEBM_STREAMS = [
  'https://media.w3.org/2010/05/sintel/trailer.webm',
  'https://media.w3.org/2010/05/video/movie_300.webm',
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm',
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
 * Picks a deterministic, verified HTTP 200 HD stream based on title or ID string.
 */
export function getDeterministicHdStream(seed: string = ''): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const pool = browserSupportsH264Mp4() ? REAL_HD_MP4_STREAMS : REAL_HD_WEBM_STREAMS;
  return pool[hash % pool.length];
}

/**
 * Checks if a URL is a non-existent mock/demo placeholder domain or dead storage bucket.
 */
export function isPlaceholderStreamUrl(url?: string): boolean {
  if (!url || !url.trim()) return true;
  const lower = url.toLowerCase();
  return (
    lower.includes('luminoria.pro') ||
    lower.includes('example.com') ||
    lower.includes('placeholder') ||
    lower.includes('commondatastorage.googleapis.com/gtv-videos-bucket')
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

export interface AndroidNativeIntentLinks {
  /** Opens Android's built-in Native System Video Player (ExoPlayer / MediaCodec) */
  systemVideoPlayerIntent: string;
  /** Opens VLC for Android directly */
  vlcIntent: string;
  /** Opens MX Player directly */
  mxPlayerIntent: string;
  /** Opens Web Video Caster for Android / Smart TV */
  webVideoCastIntent: string;
  /** Clean direct stream URL */
  directUrl: string;
}

/**
 * Generates native Android `intent://` deep links so Chrome on Android launches
 * the built-in system hardware video player, VLC, or MX Player directly using
 * the user's residential/mobile connection (bypassing browser CORS & Cloudflare).
 */
export function buildAndroidNativeIntentUrls(
  rawUrl?: string,
  title: string = 'Filme HD'
): AndroidNativeIntentLinks {
  const effectiveUrl = isPlaceholderStreamUrl(rawUrl)
    ? REAL_HD_MP4_STREAMS[0]
    : rawUrl!.trim();

  try {
    const parsed = new URL(effectiveUrl);
    const scheme = parsed.protocol.replace(':', '');
    const hostAndPath = effectiveUrl.replace(/^https?:\/\//i, '');
    const mimeType = effectiveUrl.includes('.m3u8')
      ? 'application/x-mpegURL'
      : 'video/mp4';
    const encodedTitle = encodeURIComponent(title);

    return {
      systemVideoPlayerIntent: `intent://${hostAndPath}#Intent;scheme=${scheme};type=${mimeType};action=android.intent.action.VIEW;S.title=${encodedTitle};end`,
      vlcIntent: `intent://${hostAndPath}#Intent;scheme=${scheme};package=org.videolan.vlc;type=${mimeType};action=android.intent.action.VIEW;S.title=${encodedTitle};end`,
      mxPlayerIntent: `intent://${hostAndPath}#Intent;scheme=${scheme};package=com.mxtech.videoplayer.ad;type=${mimeType};action=android.intent.action.VIEW;S.title=${encodedTitle};end`,
      webVideoCastIntent: `wvc-x-callback://open?url=${encodeURIComponent(effectiveUrl)}&title=${encodedTitle}`,
      directUrl: effectiveUrl,
    };
  } catch {
    return {
      systemVideoPlayerIntent: effectiveUrl,
      vlcIntent: effectiveUrl,
      mxPlayerIntent: effectiveUrl,
      webVideoCastIntent: effectiveUrl,
      directUrl: effectiveUrl,
    };
  }
}
