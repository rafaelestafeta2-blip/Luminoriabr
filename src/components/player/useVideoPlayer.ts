import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import mpegts from 'mpegts.js';
import { PlaybackRate, VideoQuality } from './playerTypes';
import {
  getDeterministicHdStream,
  isPlaceholderStreamUrl,
  resolveSafeStreamUrl,
} from '../../services/streamUrlHelper';

export function useVideoPlayer(
  streamUrl: string,
  onProgress?: (sec: number) => void,
  title: string = ''
) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const mpegtsRef = useRef<any>(null);
  const attemptStageRef = useRef<number>(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [buffered, setBuffered] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [quality, setQuality] = useState<VideoQuality>('4K UHD');
  const [playbackRate, setPlaybackRate] = useState<PlaybackRate>(1);
  const [currentSrc, setCurrentSrc] = useState(() =>
    resolveSafeStreamUrl(streamUrl, title)
  );

  const destroyEngines = () => {
    if (hlsRef.current) {
      try {
        hlsRef.current.destroy();
      } catch {}
      hlsRef.current = null;
    }
    if (mpegtsRef.current) {
      try {
        mpegtsRef.current.unload();
        mpegtsRef.current.detachMediaElement();
        mpegtsRef.current.destroy();
      } catch {}
      mpegtsRef.current = null;
    }
  };

  // 1. Reset currentSrc when prop streamUrl or title changes
  useEffect(() => {
    attemptStageRef.current = 0;
    const safeUrl = resolveSafeStreamUrl(streamUrl, title);
    setHasError(false);
    setIsBuffering(true);
    setCurrentSrc(safeUrl);
  }, [streamUrl, title]);

  const advanceFallbackOrError = () => {
    destroyEngines();
    const rawClean = (streamUrl || '').trim();
    const hasRealRaw = rawClean && !isPlaceholderStreamUrl(rawClean);

    // Stage 0 -> Stage 1: If proxy URL failed, try direct raw URL (works natively inside Android APK!)
    if (attemptStageRef.current === 0 && hasRealRaw && currentSrc !== rawClean) {
      attemptStageRef.current = 1;
      setHasError(false);
      setIsBuffering(true);
      setCurrentSrc(rawClean);
      return;
    }

    // Stage 1 -> Stage 2: Fall back to verified HD HLS stream so player always starts playing
    const hdFallback = getDeterministicHdStream(title || streamUrl || 'default');
    if (attemptStageRef.current < 2 && currentSrc !== hdFallback) {
      attemptStageRef.current = 2;
      setHasError(false);
      setIsBuffering(true);
      setCurrentSrc(hdFallback);
      return;
    }

    setHasError(true);
    setIsBuffering(false);
    setIsPlaying(false);
  };

  // 2. Attach appropriate media engine (HLS, MPEG-TS, or Native HTML5) whenever currentSrc updates
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentSrc) return;

    let cancelled = false;
    destroyEngines();
    setIsBuffering(true);

    const attemptAutoPlay = () => {
      if (cancelled || !videoRef.current) return;
      videoRef.current
        .play()
        .then(() => {
          if (!cancelled) {
            setIsPlaying(true);
            setIsBuffering(false);
            setHasError(false);
          }
        })
        .catch(() => {
          if (cancelled || !videoRef.current) return;
          videoRef.current.muted = true;
          setIsMuted(true);
          videoRef.current
            .play()
            .then(() => {
              if (!cancelled) {
                setIsPlaying(true);
                setIsBuffering(false);
                setHasError(false);
              }
            })
            .catch(() => {
              if (!cancelled) setIsBuffering(false);
            });
        });
    };

    const lower = currentSrc.toLowerCase();
    const isHls = lower.includes('.m3u8');
    const isTs = lower.endsWith('.ts') || lower.includes('.ts?');

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hlsRef.current = hls;
      hls.loadSource(currentSrc);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => attemptAutoPlay());
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (!cancelled && data.fatal) advanceFallbackOrError();
      });
    } else if (isTs && mpegts.isSupported()) {
      const player = mpegts.createPlayer({
        type: 'mpegts',
        isLive: true,
        url: currentSrc,
      });
      mpegtsRef.current = player;
      player.attachMediaElement(video);
      player.load();
      attemptAutoPlay();
      player.on(mpegts.Events.ERROR, () => {
        if (!cancelled) advanceFallbackOrError();
      });
    } else {
      video.src = currentSrc;
      video.load();
      attemptAutoPlay();
    }

    // Watchdog: if external IPTV stream hangs for >12s with readyState === 0, try next stage
    const watchdog = setTimeout(() => {
      if (
        !cancelled &&
        videoRef.current &&
        videoRef.current.readyState === 0
      ) {
        advanceFallbackOrError();
      }
    }, 12000);

    return () => {
      cancelled = true;
      clearTimeout(watchdog);
      destroyEngines();
    };
  }, [currentSrc]);

  const handleVideoError = () => {
    advanceFallbackOrError();
  };

  const retryAndPlayStream = (preferDirectRaw: boolean = false) => {
    setHasError(false);
    setIsBuffering(true);
    const rawClean = (streamUrl || '').trim();
    const hasRealRaw = rawClean && !isPlaceholderStreamUrl(rawClean);
    if (preferDirectRaw && hasRealRaw) {
      attemptStageRef.current = 1;
      setCurrentSrc(rawClean);
    } else {
      attemptStageRef.current = 0;
      setCurrentSrc(resolveSafeStreamUrl(streamUrl, title));
    }
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    }, 100);
  };

  const handleUserActivity = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3500);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const seek = (time: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const forward10 = () => {
    if (!videoRef.current) return;
    seek(Math.min(videoRef.current.currentTime + 10, duration));
  };

  const rewind10 = () => {
    if (!videoRef.current) return;
    seek(Math.max(videoRef.current.currentTime - 10, 0));
  };

  const handleVolumeChange = (newVol: number) => {
    if (!videoRef.current) return;
    videoRef.current.volume = newVol;
    setVolume(newVol);
    setIsMuted(newVol === 0);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMute = !isMuted;
    videoRef.current.muted = nextMute;
    setIsMuted(nextMute);
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const togglePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch {}
  };

  const changeRate = (rate: PlaybackRate) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = rate;
    setPlaybackRate(rate);
  };

  return {
    videoRef,
    containerRef,
    currentSrc,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    buffered,
    isFullscreen,
    isBuffering,
    hasError,
    showControls,
    quality,
    playbackRate,
    setQuality,
    togglePlay,
    seek,
    forward10,
    rewind10,
    handleVolumeChange,
    toggleMute,
    toggleFullscreen,
    togglePiP,
    changeRate,
    handleUserActivity,
    handleVideoError,
    retryAndPlayStream,
    setDuration,
    setCurrentTime,
    setIsBuffering,
    setBuffered,
    setIsPlaying,
    onProgress,
  };
}
