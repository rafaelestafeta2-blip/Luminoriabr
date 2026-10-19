import React from 'react';
import { Loader2, Play, Smartphone, X } from 'lucide-react';
import { useVideoPlayer } from './useVideoPlayer';
import { PlayerControlsOverlay } from './PlayerControlsOverlay';
import { VideoPlayerProps } from './playerTypes';
import { buildAndroidNativeIntentUrls } from '../../services/streamUrlHelper';

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
  } = useVideoPlayer(streamUrl, onWatchProgress, title);

  const displayPoster = backdropUrl || posterUrl;
  const androidIntents = buildAndroidNativeIntentUrls(rawStreamUrl || streamUrl, title);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleUserActivity}
      onClick={handleUserActivity}
      className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-white/10 group select-none"
    >
      {/* Ambient background glow */}
      <div className="absolute inset-0 bg-radial from-cyan-500/10 via-transparent to-black pointer-events-none" />

      {/* Real HTML5 / Android WebView Hardware Video Element */}
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
          setCurrentTime(ct);
          if (onWatchProgress) onWatchProgress(ct);
        }}
        onLoadedMetadata={(e) => {
          setDuration(e.currentTarget.duration);
          setIsBuffering(false);
        }}
        onCanPlay={() => {
          setIsBuffering(false);
        }}
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

      {/* Top Close Button when in Native Android OS Controls Mode */}
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

      {/* Center Loading / Buffering Overlay */}
      {isBuffering && (
        <div className="absolute inset-0 z-15 flex flex-col items-center justify-center bg-black/50 backdrop-blur-xs pointer-events-none">
          <div className="p-4 rounded-2xl bg-black/80 border border-cyan-500/30 flex flex-col items-center gap-2 shadow-2xl">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            <span className="text-xs font-bold text-white tracking-wide">
              Carregando Transmissão HD...
            </span>
            <span className="text-[10px] text-cyan-300/80 font-mono">
              Sincronizando decodificador de vídeo e áudio
            </span>
          </div>
        </div>
      )}

      {/* Center Big Play Button when Paused and not Buffering */}
      {!isAndroidNativeMode && !isPlaying && !isBuffering && (
        <button
          type="button"
          onClick={togglePlay}
          aria-label="Iniciar reprodução"
          className="absolute inset-0 z-15 m-auto w-16 h-16 rounded-full bg-cyan-500 hover:bg-cyan-400 text-black flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.6)] transition-transform hover:scale-110 cursor-pointer"
        >
          <Play className="w-7 h-7 fill-current ml-1" />
        </button>
      )}

      {/* Native Android Intent Quick-Launch Pill if IPTV server blocked browser */}
      {hasError && (
        <a
          href={androidIntents.systemVideoPlayerIntent}
          className="absolute top-4 right-16 z-25 px-3 py-1.5 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-[11px] font-bold text-emerald-300 hidden sm:flex items-center gap-2 shadow-lg backdrop-blur-md hover:bg-emerald-900 transition-colors"
        >
          <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
          <span>Abrir no Player Nativo Android</span>
        </a>
      )}

      {/* Custom Cinema Controls Overlay (hidden when using pure Android OS native controls) */}
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
