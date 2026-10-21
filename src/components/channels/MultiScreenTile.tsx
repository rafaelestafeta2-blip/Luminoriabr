import React from 'react';
import { Volume2, VolumeX, Maximize2, Minimize2, Loader2, RefreshCw, Replace } from 'lucide-react';
import { Channel } from '../../types/luminoria';
import { useMultiScreenStream } from './useMultiScreenStream';

interface MultiScreenTileProps {
  channel: Channel;
  slotIndex: number;
  isAudioActive: boolean;
  isSolo: boolean;
  onFocus: () => void;
  onToggleSolo: () => void;
  onRequestChangeChannel: () => void;
  activeColor: string;
}

export const MultiScreenTile: React.FC<MultiScreenTileProps> = ({
  channel,
  slotIndex,
  isAudioActive,
  isSolo,
  onFocus,
  onToggleSolo,
  onRequestChangeChannel,
  activeColor,
}) => {
  const { videoRef, isBuffering, hasError, reload, setIsBuffering } = useMultiScreenStream({
    channel,
    isAudioActive,
  });

  const currentProgram = channel.currentPrograms[0];

  return (
    <div
      onClick={onFocus}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onFocus();
      }}
      className={`group relative rounded-2xl overflow-hidden bg-black border-2 transition-all cursor-pointer flex flex-col justify-between ${
        isSolo ? 'w-full h-[520px]' : 'h-64 sm:h-72 w-full'
      }`}
      style={{
        borderColor: isAudioActive ? activeColor : 'rgba(255, 255, 255, 0.12)',
        boxShadow: isAudioActive ? `0 0 24px ${activeColor}55` : 'none',
      }}
    >
      {/* Real Video Element */}
      <video
        ref={videoRef}
        playsInline
        autoPlay
        muted={!isAudioActive}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => setIsBuffering(false)}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      />

      {/* Buffering Spinner */}
      {isBuffering && !hasError && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-10 pointer-events-none">
          <Loader2 className="w-8 h-8 animate-spin text-white/80" />
        </div>
      )}

      {/* Error Fallback Overlay */}
      {hasError && (
        <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-4 z-10 space-y-2.5">
          <p className="text-xs text-rose-300 font-medium">Reconectando sinal desta tela...</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={reload}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] text-white flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reconectar</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRequestChangeChannel();
              }}
              className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-[11px] flex items-center gap-1.5 cursor-pointer"
            >
              <Replace className="w-3 h-3" />
              <span>Trocar Canal</span>
            </button>
          </div>
        </div>
      )}

      {/* Top Header Controls Bar */}
      <div className="relative z-20 p-3 bg-gradient-to-b from-black/90 via-black/50 to-transparent flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="px-2 py-0.5 rounded-md text-[10px] font-mono font-black uppercase text-white shadow"
            style={{ backgroundColor: isAudioActive ? activeColor : '#2A2D3E' }}
          >
            TELA {String(slotIndex + 1).padStart(2, '0')}
          </span>
          <span className="text-xs font-bold text-white truncate max-w-[120px] sm:max-w-[200px]">
            {channel.name}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Change Channel for this slot */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRequestChangeChannel();
            }}
            title="Trocar canal desta tela"
            className="p-1.5 rounded-lg bg-black/60 hover:bg-black/90 text-white/70 hover:text-white transition-all cursor-pointer flex items-center gap-1 text-[11px]"
          >
            <Replace className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[10px]">Trocar</span>
          </button>

          {/* Audio State Badge & Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onFocus();
            }}
            title={isAudioActive ? 'Áudio Principal Ativo' : 'Ativar Áudio nesta Tela'}
            className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-all cursor-pointer ${
              isAudioActive
                ? 'bg-emerald-500/25 border border-emerald-400 text-emerald-300'
                : 'bg-black/60 text-white/60 hover:text-white'
            }`}
          >
            {isAudioActive ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="text-[10px] font-mono font-bold hidden sm:inline">
              {isAudioActive ? 'ÁUDIO' : 'MUDO'}
            </span>
          </button>

          {/* Solo / Expand Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSolo();
            }}
            title={isSolo ? 'Restaurar 2x2' : 'Maximizar Tela'}
            className="p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white/80 hover:text-white transition-all cursor-pointer"
          >
            {isSolo ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Bottom Information Scrim */}
      <div className="relative z-20 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-mono text-emerald-400 font-semibold">
            {channel.quality || 'FHD'} · {channel.groupName}
          </span>
          {isAudioActive && (
            <span
              className="text-[10px] font-mono font-bold uppercase tracking-wider"
              style={{ color: activeColor }}
            >
              ● ÁUDIO ATIVO
            </span>
          )}
        </div>
        <p className="text-xs font-semibold text-white/90 truncate mt-0.5">
          {currentProgram?.title || 'Transmissão Ao Vivo 24/7'}
        </p>
      </div>
    </div>
  );
};
