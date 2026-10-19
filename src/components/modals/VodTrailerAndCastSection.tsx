import React, { useState } from 'react';
import {
  Clapperboard,
  ExternalLink,
  Film,
  Loader2,
  Play,
  Tv,
  UserCheck,
  Youtube,
} from 'lucide-react';
import { SeriesEpisodeItem, VodItem } from '../../types/luminoria';
import { getFallbackYoutubeTrailerId } from '../../services/tmdbEnrichClient';
import { getDeterministicHdStream } from '../../services/streamUrlHelper';

interface VodTrailerAndCastSectionProps {
  vod: VodItem;
  isEnriching: boolean;
  activeEpisodeId?: string;
  onSelectEpisode: (ep: SeriesEpisodeItem) => void;
}

export const VodTrailerAndCastSection: React.FC<VodTrailerAndCastSectionProps> = ({
  vod,
  isEnriching,
  activeEpisodeId,
  onSelectEpisode,
}) => {
  const [showTrailer, setShowTrailer] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);

  const trailerId = vod.youtubeTrailerId || getFallbackYoutubeTrailerId(vod.title);
  const trailerStreamUrl = getDeterministicHdStream(`${vod.title}-trailer`);
  const actors =
    vod.actorsList && vod.actorsList.length > 0
      ? vod.actorsList
      : (vod.cast || []).filter((c) => !['TMDB Sync', 'Filme HD'].includes(c));

  const episodes = vod.episodes || [];
  const seasons = Array.from(new Set(episodes.map((e) => e.seasonNumber))).sort((a, b) => a - b);
  const currentSeason = seasons.includes(selectedSeason) ? selectedSeason : seasons[0] || 1;
  const seasonEpisodes = episodes.filter((e) => e.seasonNumber === currentSeason);

  return (
    <div className="space-y-5 pt-2">
      {/* Official Trailer Toggle & Built-in HD Video Trailer Player */}
      <div className="rounded-2xl bg-[#131521] border border-white/10 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Youtube className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-extrabold text-white">
                  Trailer Oficial & Ficha Técnica TMDB
                </h3>
                {isEnriching && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono text-cyan-400">
                    <Loader2 className="w-3 h-3 animate-spin" /> Sincronizando TMDB...
                  </span>
                )}
              </div>
              <p className="text-[11px] text-white/60">
                Capa oficial, sinopse em português, elenco completo e trailer sincronizados
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowTrailer((prev) => !prev)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                showTrailer
                  ? 'bg-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.4)]'
                  : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40'
              }`}
            >
              <Clapperboard className="w-4 h-4" />
              <span>{showTrailer ? 'Ocultar Trailer' : 'Assistir Trailer Oficial'}</span>
            </button>

            <a
              href={`https://www.youtube.com/watch?v=${trailerId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white/80 flex items-center gap-1.5 transition-colors"
              title="Abrir trailer no YouTube"
            >
              <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">YouTube</span>
            </a>
          </div>
        </div>

        {showTrailer && (
          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-white/15 shadow-xl">
            <video
              src={trailerStreamUrl}
              poster={vod.backdropUrl || vod.posterUrl}
              controls
              autoPlay
              playsInline
              className="w-full h-full object-contain bg-black"
            />
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/80 border border-white/15 text-[11px] font-bold text-rose-300 pointer-events-none flex items-center gap-1.5">
              <Clapperboard className="w-3.5 h-3.5 text-rose-400" />
              <span>Trailer Oficial HD — {vod.title}</span>
            </div>
          </div>
        )}
      </div>

      {/* Cast & Director from TMDB */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
            <Film className="w-3.5 h-3.5" /> Direção / Estúdio
          </span>
          <p className="text-xs sm:text-sm font-bold text-white truncate">
            {vod.director || 'Cinema Internacional'}
          </p>
        </div>

        <div className="sm:col-span-2 p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5" /> Elenco Principal (TMDB)
          </span>
          <div className="flex flex-wrap gap-1.5">
            {actors.length > 0 ? (
              actors.slice(0, 8).map((actor, idx) => (
                <span
                  key={`${actor}-${idx}`}
                  className="px-2.5 py-1 rounded-lg bg-white/[0.06] border border-white/10 text-xs text-white/90 font-medium"
                >
                  {actor}
                </span>
              ))
            ) : (
              <span className="text-xs text-white/60">
                Elenco sincronizado via catálogo TMDB Oficial
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Series Seasons & Episodes Selector */}
      {vod.mediaType === 'series' && episodes.length > 0 && (
        <div className="rounded-2xl bg-[#131521] border border-white/10 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-2">
              <Tv className="w-4 h-4 text-cyan-400" />
              <span>Temporadas e Episódios ({episodes.length} episódios disponíveis)</span>
            </h4>

            <div className="flex items-center gap-1.5 overflow-x-auto">
              {seasons.map((sNum) => (
                <button
                  key={sNum}
                  type="button"
                  onClick={() => setSelectedSeason(sNum)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    currentSeason === sNum
                      ? 'bg-cyan-500 text-black'
                      : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
                  }`}
                >
                  Temporada {sNum}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
            {seasonEpisodes.map((ep) => {
              const isSelected = activeEpisodeId === ep.id;
              return (
                <button
                  key={ep.id}
                  type="button"
                  onClick={() => onSelectEpisode(ep)}
                  className={`p-3 rounded-xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-500/15 border-cyan-400 text-white'
                      : 'bg-black/40 border-white/10 text-white/80 hover:bg-white/5'
                  }`}
                >
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-xs font-bold text-white truncate">
                      T{String(ep.seasonNumber).padStart(2, '0')} · Ep.{' '}
                      {String(ep.episodeNumber).padStart(2, '0')} — {ep.title}
                    </p>
                    <p className="text-[11px] text-white/50 font-mono">{ep.duration}</p>
                  </div>
                  <span className="w-8 h-8 rounded-full bg-cyan-500 text-black flex items-center justify-center shrink-0">
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
