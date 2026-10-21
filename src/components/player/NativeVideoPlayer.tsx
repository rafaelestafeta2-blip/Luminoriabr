import React, { useEffect } from 'react';
import { Loader2, Play, RotateCcw, Smartphone, X } from 'lucide-react';
import { useVideoPlayer } from './useVideoPlayer';
import { PlayerControlsOverlay } from './PlayerControlsOverlay';
import { VideoPlayerProps } from './playerTypes';
import { buildAndroidNativeIntentUrls } from '../../services/streamUrlHelper';
import {
  openInAppNativeAndroidPlayer,
  openNativeAndroidPlayer,
} from '../../services/apiConfig';

export const NativeVideoPlayer: React.FC<VideoPlayerProps> = ({
  title,
  streamUrl,
  rawStreamUrl,
  posterUrl,
  backdropUrl,
  category,
  year,
  isAndroidNativeMode = false,
  onClose,
  onWatchProgress,
}) => {
  const effectiveRaw = rawStreamUrl || streamUrl;

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
    retryAndPlayStream,
    setDuration,
    setCurrentTime,
    setIsBuffering,
    setBuffered,
    setIsPlaying,
  } = useVideoPlayer(streamUrl, undefined, title);

  const displayPoster = backdropUrl || posterUrl;
  const androidIntents = buildAndroidNativeIntentUrls(effectiveRaw, title);

  useEffect(() => {
    if (isAndroidNativeMode) {
      retryAndPlayStream(false);
    }
  }, [isAndroidNativeMode]);

  const handleOpenNativePlayer = (e: React.MouseEvent) => {
    e.stopPropagation();
    const openedInApp = openInAppNativeAndroidPlayer(effectiveRaw, title);
    if (!openedInApp) {
      const openedExt = openNativeAndroidPlayer(androidIntents.directUrl, title, '');
      if (!openedExt) {
        retryAndPlayStream(false);
      }
    }
  };

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

      {isAndroidNativeMode && (
        <div className="absolute bottom-4 left-4 z-30 pointer-events-none">
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/90 text-black text-[10px] font-black uppercase tracking-wider shadow-md">
            Modo Nativo Android Ativo
          </span>
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
              Sinal Alternativo Disponível
            </span>
            <h3 className="text-lg sm:text-xl font-black text-white">{title}</h3>
            <p className="text-xs text-white/70 leading-relaxed">
              Inicie a reprodução direta no Player Interno ou abra no Player Nativo do sistema Android.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  retryAndPlayStream(false);
                }}
                className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs flex items-center gap-2 cursor-pointer shadow-lg"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reproduzir no Player Interno</span>
              </button>
              <button
                type="button"
                onClick={handleOpenNativePlayer}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs flex items-center gap-2 shadow-lg cursor-pointer"
              >
                <Smartphone className="w-4 h-4" />
                <span>Player Nativo Android</span>
              </button>
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
