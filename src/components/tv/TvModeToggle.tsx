import React from 'react';
import { Tv } from 'lucide-react';
import { useTvRemoteNavigation } from '../../hooks/useTvRemoteNavigation';

export const TvModeToggle: React.FC = () => {
  const { isTvMode, toggleTvMode } = useTvRemoteNavigation();

  return (
    <button
      type="button"
      onClick={toggleTvMode}
      title={
        isTvMode
          ? 'Modo Smart TV: ATIVO (Controle Remoto / D-Pad ativado). Clique para desativar.'
          : 'Ativar Modo Smart TV (Controle Remoto / D-Pad 10-foot)'
      }
      aria-label="Alternar Modo Smart TV"
      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
        isTvMode
          ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_16px_rgba(6,182,212,0.6)]'
          : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border-white/10'
      }`}
    >
      <Tv className="w-3.5 h-3.5 shrink-0" />
      <span className="hidden sm:inline">
        {isTvMode ? 'Modo TV: Ativo' : 'Modo TV'}
      </span>
      {isTvMode && (
        <span className="w-2 h-2 rounded-full bg-black animate-pulse" />
      )}
    </button>
  );
};
