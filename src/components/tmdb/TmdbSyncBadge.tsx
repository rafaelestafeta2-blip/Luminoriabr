import React from 'react';
import { Database, RefreshCw, Sparkles } from 'lucide-react';
import { useLuminoria } from '../../context/LuminoriaContext';

interface TmdbSyncBadgeProps {
  onOpenSyncModal: () => void;
  isSyncing?: boolean;
}

export const TmdbSyncBadge: React.FC<TmdbSyncBadgeProps> = ({
  onOpenSyncModal,
  isSyncing = false,
}) => {
  const { tmdbSyncMeta } = useLuminoria();

  const formattedDate = tmdbSyncMeta?.lastSyncedAt
    ? new Date(tmdbSyncMeta.lastSyncedAt).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Hoje';

  return (
    <button
      onClick={onOpenSyncModal}
      type="button"
      className="group flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-[#12121A]/90 hover:bg-[#1A1A26] border border-cyan-500/30 hover:border-cyan-400 transition-all text-xs font-medium text-white shadow-[0_0_15px_rgba(6,182,212,0.15)] cursor-pointer"
      title="Gerenciar cache do TMDB e economia de tokens no Firebase"
    >
      <div className="relative flex items-center justify-center">
        {isSyncing ? (
          <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
        ) : (
          <Database className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
        )}
        <span className="absolute -top-1 -right-1 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
      </div>

      <div className="flex flex-col text-left">
        <span className="font-semibold text-[11px] text-cyan-300 flex items-center gap-1">
          TMDB Cache
          <Sparkles className="w-2.5 h-2.5 text-amber-300" />
        </span>
        <span className="text-[9px] text-white/50 -mt-0.5">
          {tmdbSyncMeta ? `Firebase • ${formattedDate}` : 'Economia ativa'}
        </span>
      </div>
    </button>
  );
};
