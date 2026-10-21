import React, { useEffect, useState } from 'react';
import { Clapperboard, Loader2, Play, Smartphone, Tv, X } from 'lucide-react';
import { useVideoPlayer } from './useVideoPlayer';
import { PlayerControlsOverlay } from './PlayerControlsOverlay';
import { VideoPlayerProps } from './playerTypes';
import {
  buildAndroidNativeIntentUrls,
  isPlaceholderStreamUrl,
} from '../../services/streamUrlHelper';
import { getFallbackYoutubeTrailerId } from '../../services/tmdbEnrichClient';

export const NativeVideoPlayer: React.FC<VideoPlayerProps> = ({
  title,
  streamUrl,
  rawStreamUrl,
  youtubeTrailerId,
  posterUrl,
  backdropUrl,
  category,
  year,
  isAndroidNativeMode = false,
  onClose,
  onWatchProgress,
}) => {
  const effectiveRaw = rawStreamUrl || streamUrl;
  const isCatalogPlaceholder = isPlaceholderStreamUrl(effectiveRaw);
  const [showOfficialTrailer, setShowOfficialTrailer] = useState<boolean>(isCatalogPlaceholder);
  const [trailerElapsedSec, setTrailerElapsedSec] = useState<number>(0);

  useEffect(() => {
    setShowOfficialTrailer(isPlaceholderStreamUrl(rawStreamUrl || streamUrl));
    setTrailerElapsedSec(0);
  }, [rawStreamUrl, streamUrl, title]);

  const {
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
    setDuration,
    setCurrentTime,
    setIsBuffering,
    setBuffered,
    setIsPlaying,
  } = useVideoPlayer(streamUrl, undefined, title);

  const displayPoster = backdropUrl || posterUrl;
  const androidIntents = buildAndroidNativeIntentUrls(effectiveRaw, title);
  const trailerId = youtubeTrailerId || getFallbackYoutubeTrailerId(title);

  // Track watch progress while in Official TMDB Trailer mode (standard trailer duration ~120s, so 20% = 24s)
  useEffect(() => {
    if (!showOfficialTrailer || !onWatchProgress) return;
    const timer = setInterval(() => {
      setTrailerElapsedSec((prev) => {
        const next = prev + 2;
        onWatchProgress(next, 120);
        return next;
      });
    }, 2000);
    return () => clearInterval(timer);
  }, [showOfficialTrailer, onWatchProgress]);

  if (showOfficialTrailer) {
    const pctWatched = Math.min(100, Math.round((trailerElapsedSec / 120) * 100));
    return (
      <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-white/15">
        <iframe
          src={`https://www.youtube.com/embed/${trailerId}?autoplay=1&rel=0&modestbranding=1`}
          title={`Trailer Oficial TMDB HD - ${title}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full border-0"
        />
        <div className="absolute top-3 left-3 z-30 px-3 py-1 rounded-xl bg-black/80 border border-white/15 text-[11px] font-mono text-emerald-400 tabular-nums">
          Trailer Oficial TMDB HD · Progresso: {pctWatched}%
        </div>
        {!isCatalogPlaceholder && (
          <button
            type="button"
            onClick={() => setShowOfficialTrailer(false)}
            className="absolute top-3 right-3 z-30 px-3 py-1.5 rounded-xl bg-black/85 hover:bg-black text-white border border-white/20 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Tentar Stream M3U Direto</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleUserActivity}
      onClick={handleUserActivity}
      className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-white/10 group select-none"
    >
      <div className="absolute inset-0 bg-radial from-cyan-500/10 via-transparent to-black pointer-events-none" />

      <video
        ref={videoRef}
        src={currentSrc}
        poster={displayPoster}
        playsInline
        autoPlay
        preload="auto"
        controls={isAndroidNativeMode}
        onClick={!isAndroidNativeMode ? togglePlay : undefined}
        onTimeUpdate={(e) => {
          const ct = e.currentTarget.currentTime;
          const dur = e.currentTarget.duration;
          setCurrentTime(ct);
          if (onWatchProgress) {
            onWatchProgress(ct, Number.isFinite(dur) && dur > 0 ? dur : duration || 120);
          }
        }}
        onLoadedMetadata={(e) => {
          setDuration(e.currentTarget.duration);
          setIsBuffering(false);
        }}
        onCanPlay={() => setIsBuffering(false)}
        onProgress={(e) => {
          const v = e.currentTarget;
          if (v.buffered.length > 0 && v.duration > 0) {
            const bufferedEnd = v.buffered.end(v.buffered.length - 1);
            setBuffered((bufferedEnd / v.duration) * 100);
          }
        }}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => {
          setIsBuffering(false);
          setIsPlaying(true);
        }}
        onPause={() => setIsPlaying(false)}
        onError={handleVideoError}
        className="w-full h-full object-contain bg-black cursor-pointer"
      />

      {isAndroidNativeMode && onClose && (
        <div className="absolute top-3 right-3 z-30 flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/90 text-black text-[10px] font-black uppercase tracking-wider">
            Modo Nativo Android Ativo
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-black/80 hover:bg-black text-white border border-white/20 cursor-pointer"
            aria-label="Fechar player"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {isBuffering && !hasError && (
        <div className="absolute inset-0 z-15 flex flex-col items-center justify-center bg-black/50 backdrop-blur-xs pointer-events-none">
          <div className="p-4 rounded-2xl bg-black/80 border border-cyan-500/30 flex flex-col items-center gap-2 shadow-2xl">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            <span className="text-xs font-bold text-white tracking-wide">
              Conectando ao Servidor M3U HD...
            </span>
          </div>
        </div>
      )}

      {hasError && (
        <div className="absolute inset-0 z-25 flex flex-col items-center justify-center p-6 bg-black/85 backdrop-blur-md text-center">
          <div className="max-w-md space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[11px] font-extrabold uppercase tracking-wider">
              Codec Nativo M3U ou Trailer Oficial TMDB Disponível
            </span>
            <h3 className="text-lg sm:text-xl font-black text-white">{title}</h3>
            <p className="text-xs text-white/70 leading-relaxed">
              Reproduza o Trailer Oficial HD do TMDB agora mesmo ou abra o stream M3U diretamente no Player Nativo.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowOfficialTrailer(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-white/90 text-black font-extrabold text-xs flex items-center gap-2 cursor-pointer shadow-lg"
              >
                <Clapperboard className="w-4 h-4" />
                <span>Assistir Trailer Oficial TMDB</span>
              </button>
              <a
                href={androidIntents.primaryNativeUrl}
                target={androidIntents.platform === 'ios' ? '_blank' : undefined}
                rel={androidIntents.platform === 'ios' ? 'noopener noreferrer' : undefined}
                onClick={(e) => e.stopPropagation()}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs flex items-center gap-2 shadow-lg cursor-pointer"
              >
                <Smartphone className="w-4 h-4" />
                <span>{androidIntents.primaryNativeLabel}</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {!isAndroidNativeMode && !isPlaying && !isBuffering && !hasError && (
        <button
          type="button"
          onClick={togglePlay}
          aria-label="Iniciar reprodução"
          className="absolute inset-0 z-15 m-auto w-16 h-16 rounded-full bg-cyan-500 hover:bg-cyan-400 text-black flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.6)] transition-transform hover:scale-110 cursor-pointer"
        >
          <Play className="w-7 h-7 fill-current ml-1" />
        </button>
      )}

      {!isAndroidNativeMode && (
        <PlayerControlsOverlay
          title={title}
          category={category}
          year={year}
          isPlaying={isPlaying}
          isBuffering={isBuffering}
          currentTime={currentTime}
          duration={duration}
          buffered={buffered}
          volume={volume}
          isMuted={isMuted}
          isFullscreen={isFullscreen}
          showControls={showControls}
          quality={quality}
          playbackRate={playbackRate}
          onTogglePlay={togglePlay}
          onSeek={seek}
          onRewind10={rewind10}
          onForward10={forward10}
          onVolumeChange={handleVolumeChange}
          onToggleMute={toggleMute}
          onToggleFullscreen={toggleFullscreen}
          onTogglePiP={togglePiP}
          onSelectQuality={setQuality}
          onSelectRate={changeRate}
          onClose={onClose}
        />
      )}
    </div>
  );
};
