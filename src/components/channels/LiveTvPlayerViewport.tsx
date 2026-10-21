import React, { useRef, useState, useEffect } from 'react';
import Hls from 'hls.js';
import mpegts from 'mpegts.js';
import { Volume2, VolumeX, Maximize, Radio, Heart, Loader2, Smartphone } from 'lucide-react';
import { Channel } from '../../types/luminoria';
import {
  buildAndroidNativeIntentUrls,
  getDeterministicHdStream,
  REAL_HD_WEBM_STREAMS,
  resolveSafeStreamUrl,
} from '../../services/streamUrlHelper';

interface LiveTvPlayerViewportProps {
  channel: Channel;
  activeSourceIndex: number;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onSelectSourceIndex: (index: number) => void;
}

export const LiveTvPlayerViewport: React.FC<LiveTvPlayerViewportProps> = ({
  channel,
  activeSourceIndex,
  isFavorite,
  onToggleFavorite,
  onSelectSourceIndex,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const mpegtsRef = useRef<any>(null);

  const rawUrl = channel.sources[activeSourceIndex] || channel.url;
  const [currentSrc, setCurrentSrc] = useState(() =>
    resolveSafeStreamUrl(rawUrl, channel.name)
  );
  const [isMuted, setIsMuted] = useState(false);
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

  useEffect(() => {
    setHasError(false);
    setIsBuffering(true);
    // Prefer HLS (.m3u8) over raw .ts when available on Xtream servers to avoid MSE worker freezes
    const preferredRaw =
      rawUrl && rawUrl.endsWith('.ts') && rawUrl.includes('/live/')
        ? rawUrl.replace(/\.ts$/i, '.m3u8')
        : rawUrl;
    setCurrentSrc(resolveSafeStreamUrl(preferredRaw, channel.name));
  }, [rawUrl, channel.name]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentSrc) return;

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
          videoRef.current.muted = true;
          setIsMuted(true);
          videoRef.current
            .play()
            .then(() => {
              if (!cancelled) setIsBuffering(false);
            })
            .catch(() => {
              if (!cancelled) setIsBuffering(false);
            });
        });
    };

    const lower = currentSrc.toLowerCase();
    const isHls = lower.includes('.m3u8');
    const isTs = lower.endsWith('.ts') || lower.includes('.ts?');

    try {
      if (isHls && Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 30,
          maxBufferLength: 15,
        });
        hlsRef.current = hls;
        hls.loadSource(currentSrc);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => attemptPlay());
        hls.on(Hls.Events.ERROR, (_, data) => {
          if (cancelled) return;
          if (data.fatal) {
            handleVideoError();
          }
        });
      } else if (isTs && mpegts.isSupported()) {
        const player = mpegts.createPlayer(
          {
            type: 'mpegts',
            isLive: true,
            url: currentSrc,
            cors: true,
          },
          {
            enableWorker: false, // Prevents worker thread deadlock on rapid channel switching
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
        video.src = currentSrc;
        video.load();
        attemptPlay();
      }
    } catch {
      if (!cancelled) handleVideoError();
    }

    // Watchdog: if live stream stalls >7s without decoding frames, switch safely to backup signal
    const watchdog = setTimeout(() => {
      if (
        !cancelled &&
        videoRef.current &&
        videoRef.current.readyState < 2 &&
        currentSrc.startsWith('/api/stream-proxy')
      ) {
        handleVideoError();
      }
    }, 7000);

    return () => {
      cancelled = true;
      clearTimeout(watchdog);
      destroyEngines();
    };
  }, [currentSrc]);

  const handleVideoError = () => {
    const fallback1 = getDeterministicHdStream(channel.name);
    const fallback2 = REAL_HD_WEBM_STREAMS[0];
    if (currentSrc !== fallback1 && currentSrc !== fallback2) {
      setHasError(true);
      setCurrentSrc(fallback1);
    } else if (currentSrc === fallback1 && currentSrc !== fallback2) {
      setHasError(true);
      setCurrentSrc(fallback2);
    } else {
      setIsBuffering(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const next = !isMuted;
    videoRef.current.muted = next;
    setIsMuted(next);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const androidIntents = buildAndroidNativeIntentUrls(rawUrl, channel.name);

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl group select-none"
    >
      {/* Live HTML5 / MSE Video Element */}
      <video
        ref={videoRef}
        playsInline
        autoPlay
        preload="auto"
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => setIsBuffering(false)}
        onCanPlay={() => setIsBuffering(false)}
        onError={handleVideoError}
        className="w-full h-full object-contain bg-black cursor-pointer"
      />

      {/* Buffering Spinner */}
      {isBuffering && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs pointer-events-none">
          <div className="p-4 rounded-2xl bg-black/85 border border-cyan-500/40 flex flex-col items-center gap-2 shadow-2xl">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            <span className="text-xs font-bold text-white">Sintonizando {channel.name}...</span>
            <span className="text-[10px] text-cyan-300 font-mono">Decodificador MPEG-TS / HLS Ativo</span>
          </div>
        </div>
      )}

      {/* Live Stream Status Bar & Controls Overlay */}
      <div className="absolute inset-0 z-10 flex flex-col justify-between p-4 sm:p-5 bg-gradient-to-t from-black/90 via-transparent to-black/70">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-mono text-white bg-black/60 px-3 py-1.5 rounded-full border border-white/15 backdrop-blur-md">
            <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
            <span className="font-bold">AO VIVO</span>
            <span aria-hidden="true">•</span>
            <span className="text-emerald-400">{channel.quality}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <a
              href={androidIntents.primaryNativeUrl}
              target={androidIntents.platform === 'ios' ? '_blank' : undefined}
              rel={androidIntents.platform === 'ios' ? 'noopener noreferrer' : undefined}
              className="px-3 py-1 rounded-lg bg-emerald-500/90 hover:bg-emerald-400 text-black text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{androidIntents.primaryNativeLabel}</span>
            </a>

            {channel.sources.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectSourceIndex(idx)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                  activeSourceIndex === idx
                    ? 'bg-cyan-500 text-black font-bold'
                    : 'bg-black/60 text-white/80 hover:text-white border border-white/15'
                }`}
              >
                Rota #{idx + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Channel Details & Action Buttons */}
        <div className="flex items-end justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <p className="text-xs text-white/70">
              {channel.groupName} • EPG ID: <span className="font-mono text-cyan-400">{channel.epgId}</span>
            </p>
            <h2 className="text-xl sm:text-2xl font-black text-white truncate drop-shadow-md">
              {channel.name}
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={toggleMute}
              className="p-2.5 rounded-xl bg-black/70 hover:bg-black/90 text-white border border-white/15 transition-colors cursor-pointer"
              title={isMuted ? 'Ativar áudio' : 'Mutar áudio'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>

            <button
              type="button"
              onClick={() => onToggleFavorite(channel.id)}
              className="p-2.5 rounded-xl bg-black/70 hover:bg-black/90 text-white border border-white/15 transition-colors cursor-pointer"
              title={isFavorite ? 'Remover dos favoritos' : 'Favoritar canal'}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current text-rose-500' : 'text-white'}`} />
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2.5 rounded-xl bg-black/70 hover:bg-black/90 text-white border border-white/15 transition-colors cursor-pointer"
              title="Tela cheia"
            >
              <Maximize className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
