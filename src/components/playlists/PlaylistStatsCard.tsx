import React from 'react';
import { Database, Film, Tv, Video } from 'lucide-react';
import { PlaylistSource } from '../../types/luminoria';

interface PlaylistStatsCardProps {
  playlists: PlaylistSource[];
  totalChannels: number;
  totalMovies: number;
  totalSeries: number;
  totalStreams?: number;
}

export const PlaylistStatsCard: React.FC<PlaylistStatsCardProps> = ({
  playlists,
  totalChannels,
  totalMovies,
  totalSeries,
  totalStreams = 302408,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="p-4 rounded-2xl bg-[#111118] border border-white/10 flex flex-col justify-between">
        <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5" /> Total na Lista M3U
        </span>
        <span className="text-xl sm:text-2xl font-black text-white mt-1 tabular-nums">
          {totalStreams.toLocaleString('pt-BR')}
        </span>
        <span className="text-[11px] text-white/50 mt-0.5">
          {playlists.length} {playlists.length === 1 ? 'Fonte Oficial Salva' : 'Fontes Salvas'}
        </span>
      </div>

      <div className="p-4 rounded-2xl bg-[#111118] border border-white/10 flex flex-col justify-between">
        <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1.5">
          <Tv className="w-3.5 h-3.5" /> TV Ao Vivo
        </span>
        <span className="text-xl sm:text-2xl font-black text-white mt-1 tabular-nums">
          {totalChannels.toLocaleString('pt-BR')}
        </span>
        <span className="text-[11px] text-white/50 mt-0.5">Canais na aba Canais</span>
      </div>

      <div className="p-4 rounded-2xl bg-[#111118] border border-white/10 flex flex-col justify-between">
        <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1.5">
          <Film className="w-3.5 h-3.5" /> Filmes VOD
        </span>
        <span className="text-xl sm:text-2xl font-black text-white mt-1 tabular-nums">
          {totalMovies.toLocaleString('pt-BR')}
        </span>
        <span className="text-[11px] text-white/50 mt-0.5">Sincronizados com TMDB</span>
      </div>

      <div className="p-4 rounded-2xl bg-[#111118] border border-white/10 flex flex-col justify-between">
        <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider flex items-center gap-1.5">
          <Video className="w-3.5 h-3.5" /> Séries Completas
        </span>
        <span className="text-xl sm:text-2xl font-black text-white mt-1 tabular-nums">
          {totalSeries.toLocaleString('pt-BR')}
        </span>
        <span className="text-[11px] text-white/50 mt-0.5">Temporadas & Episódios</span>
      </div>
    </div>
  );
};
