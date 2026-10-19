import React from 'react';
import { Check, CheckCircle2, Sliders, Volume2, X } from 'lucide-react';
import { PlaybackRate, VideoQuality } from './playerTypes';

interface PlayerSettingsMenuProps {
  isOpen: boolean;
  onClose: () => void;
  quality: VideoQuality;
  onSelectQuality: (q: VideoQuality) => void;
  playbackRate: PlaybackRate;
  onSelectRate: (r: PlaybackRate) => void;
}

const QUALITIES: VideoQuality[] = ['Auto', '4K UHD', '1080p FHD', '720p HD'];
const RATES: PlaybackRate[] = [0.5, 0.75, 1, 1.25, 1.5, 2];

export const PlayerSettingsMenu: React.FC<PlayerSettingsMenuProps> = ({
  isOpen,
  onClose,
  quality,
  onSelectQuality,
  playbackRate,
  onSelectRate,
}) => {
  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="absolute bottom-16 right-4 z-40 w-72 rounded-2xl bg-[#0C0D14]/95 backdrop-blur-xl border border-white/15 p-4 shadow-2xl text-white space-y-4 animate-in fade-in zoom-in-95 duration-150"
    >
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5" /> Ajustes do Player
        </span>
        <button
          onClick={onClose}
          type="button"
          className="text-white/60 hover:text-white p-1 rounded cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Quality Picker */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold text-white/70 block">
          Resolução & Bitrate Adaptativo
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {QUALITIES.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => onSelectQuality(q)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium text-left flex items-center justify-between border cursor-pointer transition-colors ${
                quality === q
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                  : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
              }`}
            >
              <span>{q}</span>
              {quality === q && <Check className="w-3 h-3 text-cyan-400" />}
            </button>
          ))}
        </div>
      </div>

      {/* Speed Picker */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold text-white/70 block">
          Velocidade de Reprodução
        </label>
        <div className="flex items-center gap-1 overflow-x-auto pb-1 [scrollbar-width:none]">
          {RATES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => onSelectRate(r)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-mono border cursor-pointer whitespace-nowrap shrink-0 transition-colors ${
                playbackRate === r
                  ? 'bg-amber-400 text-black font-bold border-amber-300'
                  : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
              }`}
            >
              {r === 1 ? 'Normal' : `${r}x`}
            </button>
          ))}
        </div>
      </div>

      {/* Audio Track Simulation */}
      <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-white/70">
        <span className="flex items-center gap-1.5">
          <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
          Áudio: Português (Dolby 5.1)
        </span>
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
      </div>
    </div>
  );
};
