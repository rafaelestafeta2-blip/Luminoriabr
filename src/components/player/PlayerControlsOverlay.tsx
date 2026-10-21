import React, { useState } from 'react';
import {
  Cast,
  Maximize2,
  Minimize2,
  Pause,
  PictureInPicture2,
  Play,
  RotateCcw,
  RotateCw,
  Settings,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { PlayerSettingsMenu } from './PlayerSettingsMenu';
import { PlaybackRate, VideoQuality } from './playerTypes';

interface PlayerControlsOverlayProps {
  title: string;
  category?: string;
  year?: number;
  isPlaying: boolean;
  isBuffering: boolean;
  currentTime: number;
  duration: number;
  buffered: number;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  showControls: boolean;
  quality: VideoQuality;
  playbackRate: PlaybackRate;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onRewind10: () => void;
  onForward10: () => void;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
  onToggleFullscreen: () => void;
  onTogglePiP: () => void;
  onSelectQuality: (q: VideoQuality) => void;
  onSelectRate: (r: PlaybackRate) => void;
  onClose?: () => void;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds <= 0) return '00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export const PlayerControlsOverlay: React.FC<PlayerControlsOverlayProps> = ({
  title,
  category,
  year,
  isPlaying,
  isBuffering,
  currentTime,
  duration,
  buffered,
  volume,
  isMuted,
  isFullscreen,
  showControls,
  quality,
  playbackRate,
  onTogglePlay,
  onSeek,
  onRewind10,
  onForward10,
  onVolumeChange,
  onToggleMute,
  onToggleFullscreen,
  onTogglePiP,
  onSelectQuality,
  onSelectRate,
  onClose,
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className={`absolute inset-0 z-20 flex flex-col justify-between p-4 sm:p-6 bg-gradient-to-t from-black/90 via-black/20 to-black/80 transition-opacity duration-300 ${
        showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-2.5">
          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-cyan-500 text-black uppercase tracking-wider">
            {quality}
          </span>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white leading-tight drop-shadow">
              {title}
            </h3>
            <p className="text-[11px] text-white/60 font-mono">
              {category || 'Cinema'} · {year || 2024} · Dolby Atmos 5.1
            </p>
          </div>
        </div>
        {isFullscreen && onClose && (
          <button
            onClick={onClose}
            type="button"
            className="p-2 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/10 transition-colors cursor-pointer"
            aria-label="Fechar player tela cheia"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Center Buffering / Play indicator */}
      {isBuffering && (
        <div className="my-auto self-center flex items-center gap-2 px-4 py-2 rounded-full bg-black/75 border border-cyan-500/40 text-cyan-300 text-xs font-mono animate-pulse">
          <div className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <span>Otimizando buffer ABR...</span>
        </div>
      )}

      {/* Bottom Bar Controls */}
      <div className="space-y-3 pointer-events-auto">
        {/* Scrubbable Timeline */}
        <div className="relative group cursor-pointer py-1">
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={(e) => onSeek(Number(e.target.value))}
            aria-label="Barra de progresso do vídeo"
            className="w-full h-1.5 bg-white/20 rounded-full appearance-none accent-cyan-400 cursor-pointer focus:outline-none"
          />
          {/* Buffered track */}
          <div
            className="absolute top-1.5 left-0 h-1.5 bg-white/30 rounded-full pointer-events-none -z-10"
            style={{ width: `${Math.min(buffered, 100)}%` }}
          />
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={onTogglePlay}
              type="button"
              className="p-2 rounded-full bg-white text-black hover:bg-cyan-300 transition-colors cursor-pointer"
              aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>

            <button
              onClick={onRewind10}
              type="button"
              className="text-white/80 hover:text-white p-1 cursor-pointer"
              title="Voltar 10s"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <button
              onClick={onForward10}
              type="button"
              className="text-white/80 hover:text-white p-1 cursor-pointer"
              title="Avançar 10s"
            >
              <RotateCw className="w-5 h-5" />
            </button>

            {/* Volume control */}
            <div className="hidden sm:flex items-center gap-2 group">
              <button onClick={onToggleMute} type="button" className="text-white/80 hover:text-white cursor-pointer">
                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={(e) => onVolumeChange(Number(e.target.value))}
                aria-label="Volume"
                className="w-16 h-1 bg-white/30 accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Time display */}
            <span className="text-xs font-mono text-white/80 tabular-nums">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-3 relative">
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              type="button"
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
              title="Configurações & Qualidade"
            >
              <Settings className="w-5 h-5" />
            </button>

            <button
              onClick={onTogglePiP}
              type="button"
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
              title="Picture-in-Picture"
            >
              <PictureInPicture2 className="w-5 h-5" />
            </button>

            <button
              onClick={onToggleFullscreen}
              type="button"
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
              title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Settings Menu Popup */}
      <PlayerSettingsMenu
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        quality={quality}
        onSelectQuality={(q) => {
          onSelectQuality(q);
          setIsSettingsOpen(false);
        }}
        playbackRate={playbackRate}
        onSelectRate={(r) => {
          onSelectRate(r);
          setIsSettingsOpen(false);
        }}
      />
    </div>
  );
};
