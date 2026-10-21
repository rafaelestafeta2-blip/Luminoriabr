import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import mpegts from 'mpegts.js';
import { Channel } from '../../types/luminoria';
import {
  getDeterministicHdStream,
  REAL_HD_MP4_STREAMS,
  resolveSafeStreamUrl,
} from '../../services/streamUrlHelper';

interface UseMultiScreenStreamParams {
  channel: Channel;
  isAudioActive: boolean;
}

export function useMultiScreenStream({ channel, isAudioActive }: UseMultiScreenStreamParams) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const mpegtsRef = useRef<any>(null);

  const rawUrl = channel.sources[0] || channel.url || '';
  const [streamSrc, setStreamSrc] = useState(() =>
    resolveSafeStreamUrl(rawUrl, channel.name)
  );
  const [isBuffering, setIsBuffering] = useState(true);
  const [hasError, setHasError] = useState(false);

  const destroyEngines = () => {
    if (hlsRef.current) {
      try {
        hlsRef.current.stopLoad();
        hlsRef.current.detachMedia();
        hlsRef.current.destroy();
      } catch {}
      hlsRef.current = null;
    }
    if (mpegtsRef.current) {
      try {
        mpegtsRef.current.pause();
        mpegtsRef.current.unload();
        mpegtsRef.current.detachMediaElement();
        mpegtsRef.current.destroy();
      } catch {}
      mpegtsRef.current = null;
    }
    if (videoRef.current) {
      try {
        videoRef.current.pause();
        videoRef.current.removeAttribute('src');
        videoRef.current.load();
      } catch {}
    }
  };

  const handleVideoError = () => {
    if (!REAL_HD_MP4_STREAMS.includes(streamSrc)) {
      const backup = getDeterministicHdStream(channel.name);
      setStreamSrc(backup);
    } else {
      setHasError(true);
      setIsBuffering(false);
    }
  };

  useEffect(() => {
    setHasError(false);
    setIsBuffering(true);
    const preferredRaw =
      rawUrl && rawUrl.endsWith('.ts') && rawUrl.includes('/live/')
        ? rawUrl.replace(/\.ts$/i, '.m3u8')
        : rawUrl;
    setStreamSrc(resolveSafeStreamUrl(preferredRaw, channel.name));
  }, [rawUrl, channel.name]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamSrc) return;

    let cancelled = false;
    destroyEngines();
    setIsBuffering(true);

    const attemptPlay = () => {
      if (cancelled || !videoRef.current) return;
      videoRef.current
        .play()
        .then(() => {
          if (!cancelled) setIsBuffering(false);
        })
        .catch(() => {
          if (cancelled || !videoRef.current) return;
          // Autoplay policy requires muted playback for secondary streams
          videoRef.current.muted = true;
          videoRef.current.play().then(() => {
            if (!cancelled) setIsBuffering(false);
          }).catch(() => {
            if (!cancelled) handleVideoError();
          });
        });
    };

    const lower = streamSrc.toLowerCase();
    const isHls = lower.includes('.m3u8');
    const isTs = lower.endsWith('.ts') || lower.includes('.ts?');

    try {
      if (isHls && Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: false,
          lowLatencyMode: true,
          backBufferLength: 15,
          maxBufferLength: 10,
        });
        hlsRef.current = hls;
        hls.loadSource(streamSrc);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, attemptPlay);
        hls.on(Hls.Events.ERROR, (_, data) => {
          if (cancelled) return;
          if (data.fatal) handleVideoError();
        });
      } else if (isTs && mpegts.isSupported()) {
        const player = mpegts.createPlayer(
          {
            type: 'mpegts',
            isLive: true,
            url: streamSrc,
            cors: true,
          },
          {
            enableWorker: false,
            enableStashBuffer: false,
            stashInitialSize: 128,
          }
        );
        mpegtsRef.current = player;
        player.attachMediaElement(video);
        player.load();
        attemptPlay();
        player.on(mpegts.Events.ERROR, () => {
          if (!cancelled) handleVideoError();
        });
      } else {
        video.src = streamSrc;
        video.load();
        attemptPlay();
      }
    } catch {
      if (!cancelled) handleVideoError();
    }

    const watchdog = setTimeout(() => {
      if (
        !cancelled &&
        videoRef.current &&
        videoRef.current.readyState < 2 &&
        streamSrc.startsWith('/api/stream-proxy')
      ) {
        handleVideoError();
      }
    }, 6000);

    return () => {
      cancelled = true;
      clearTimeout(watchdog);
      destroyEngines();
    };
  }, [streamSrc]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = !isAudioActive;
    }
  }, [isAudioActive]);

  const reload = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setHasError(false);
    setIsBuffering(true);
    setStreamSrc(resolveSafeStreamUrl(rawUrl, `${channel.name}-${Date.now()}`));
  };

  return {
    videoRef,
    isBuffering,
    hasError,
    reload,
    setIsBuffering,
  };
}
