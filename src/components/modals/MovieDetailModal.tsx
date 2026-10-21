import React, { useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  Clapperboard,
  Clock,
  ExternalLink,
  Heart,
  Play,
  Star,
  Users,
  X,
} from 'lucide-react';
import { useLuminoria } from '../../context/LuminoriaContext';
import { TmdbMovieItem } from '../../types/tmdb';
import { convertTmdbToVodItem } from '../../services/tmdbMapper';
import { getFallbackYoutubeTrailerId } from '../../services/tmdbEnrichClient';
import { getDeterministicHdStream } from '../../services/streamUrlHelper';

interface MovieDetailModalProps {
  movie: TmdbMovieItem | null;
  onClose: () => void;
}

export const MovieDetailModal: React.FC<MovieDetailModalProps> = ({ movie, onClose }) => {
  const { vodItems, favoriteIds, toggleFavorite, setActiveModalVod, setIsFriendsDrawerOpen } =
    useLuminoria();
  const [showTrailer, setShowTrailer] = useState(false);

  React.useEffect(() => {
    if (!movie) return;
    const handleRemoteBack = () => onClose();
    window.addEventListener('tv-remote-back', handleRemoteBack);
    return () => window.removeEventListener('tv-remote-back', handleRemoteBack);
  }, [movie, onClose]);

  if (!movie) return null;

  const isFav = favoriteIds.includes(movie.id);
  const trailerId = getFallbackYoutubeTrailerId(movie.title);
  const trailerVideoUrl = getDeterministicHdStream(`${movie.title}-trailer`);

  const matchedVod = vodItems.find(
    (v) =>
      v.tmdbId === movie.tmdbId ||
      v.id === movie.id ||
      v.title.toLowerCase().trim() === movie.title.toLowerCase().trim()
  );

  const handlePlay = () => {
    if (matchedVod) {
      setActiveModalVod(matchedVod);
    } else {
      setActiveModalVod(convertTmdbToVodItem(movie, undefined, undefined));
    }
    onClose();
  };

  const year = movie.releaseDate?.slice(0, 4) || '2024';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#09090E] border border-white/10 rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.9)] overflow-hidden my-2 sm:my-6">
        {/* Sticky Top Back Bar */}
        <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-2.5 bg-[#09090E]/95 border-b border-white/10">
          <button
            type="button"
            onClick={onClose}
            aria-label="Voltar para página anterior"
            className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            <span>Voltar para Página Anterior</span>
          </button>

          <button
            onClick={onClose}
            type="button"
            aria-label="Fechar detalhes"
            className="p-1.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Backdrop Banner or Official HTML5 Trailer Preview (No YouTube Error 153) */}
        <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-black">
          {showTrailer ? (
            <div className="relative w-full h-full bg-black">
              <video
                src={trailerVideoUrl}
                poster={movie.backdropPath || movie.posterPath}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain bg-black"
              />
              <div className="absolute top-2 left-2 z-10 flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-black/80 border border-white/15 text-[10px] font-bold text-rose-300">
                  Trailer Oficial HD
                </span>
                <a
                  href={`https://www.youtube.com/watch?v=${trailerId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-0.5 rounded bg-red-600/90 hover:bg-red-500 text-white text-[10px] font-bold flex items-center gap-1 shadow"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>App YouTube</span>
                </a>
              </div>
            </div>
          ) : (
            <>
              <img
                src={movie.backdropPath || movie.posterPath}
                alt={movie.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center filter brightness-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#09090E] via-[#09090E]/60 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#09090E]/80 via-transparent to-transparent" />

              <div className="absolute bottom-4 left-6 flex items-end gap-4">
                <div className="w-24 sm:w-28 aspect-[2/3] rounded-lg overflow-hidden shadow-2xl border-2 border-white/20 shrink-0 hidden xs:block">
                  <img
                    src={movie.posterPath}
                    alt={movie.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap text-xs text-white/80">
                    <span className="font-bold text-cyan-400">4K ULTRA HD</span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1 font-bold text-amber-300">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      {movie.voteAverage.toFixed(1)} TMDB
                    </span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {year}
                    </span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {movie.durationMinutes || 120} min
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                    {movie.title}
                  </h2>
                  {movie.originalTitle && movie.originalTitle !== movie.title && (
                    <p className="text-xs text-white/50 italic">{movie.originalTitle}</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 pt-3 space-y-4">
          <div className="flex flex-wrap gap-1.5">
            {movie.genres.map((g) => (
              <span
                key={g}
                className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white/[0.06] text-white/80 border border-white/10"
              >
                {g}
              </span>
            ))}
          </div>

          <div className="space-y-1">
            <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Sinopse</h4>
            <p className="text-sm text-white/75 leading-relaxed max-h-36 overflow-y-auto pr-2">
              {movie.overview || 'Sinopse oficial disponível via TMDB.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-white/10">
            <button
              onClick={handlePlay}
              type="button"
              className="flex-1 py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all cursor-pointer bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black shadow-[0_0_25px_rgba(6,182,212,0.4)]"
            >
              <Play className="w-5 h-5 fill-black text-black" />
              <span>Assistir Filme Completo</span>
            </button>

            <button
              onClick={() => setShowTrailer((v) => !v)}
              type="button"
              className="px-4 py-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Clapperboard className="w-4 h-4" />
              <span>{showTrailer ? 'Ocultar Trailer' : 'Ver Trailer'}</span>
            </button>

            <button
              onClick={() => toggleFavorite(movie.id)}
              type="button"
              className={`p-3 rounded-xl border transition-colors cursor-pointer flex items-center justify-center ${
                isFav
                  ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                  : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
              }`}
              title={isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            >
              <Heart className={`w-5 h-5 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
            </button>

            <button
              onClick={() => {
                onClose();
                setIsFriendsDrawerOpen(true);
              }}
              type="button"
              className="p-3 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition-colors cursor-pointer flex items-center justify-center"
              title="Convidar amigos para assistir"
            >
              <Users className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
