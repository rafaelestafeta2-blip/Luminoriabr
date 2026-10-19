import React from 'react';
import { Info, Play, Star } from 'lucide-react';
import { VodItem } from '../../types/luminoria';
import { PosterArtwork } from '../ui/PosterArtwork';

interface HomeHeroFanProps {
  movies: VodItem[];
  featuredIndex: number;
  onSelectFeatured: (index: number) => void;
  onPlayMovie: (movie: VodItem) => void;
}

export const HomeHeroFan: React.FC<HomeHeroFanProps> = ({
  movies,
  featuredIndex,
  onSelectFeatured,
  onPlayMovie,
}) => {
  const featuredMovie = movies[featuredIndex % movies.length] || movies[0];

  if (!featuredMovie) return null;

  return (
    <section className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-[#151828] via-[#0B0C14] to-[#050508] border border-white/10 p-5 sm:p-8">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
        {/* Diagonal Fanned Movie Posters */}
        <div className="relative flex items-center justify-center h-72 sm:h-80 w-full lg:w-1/2 overflow-hidden py-2">
          {movies.slice(0, 5).map((movie, idx) => {
            const offset = idx - 2;
            const isCenter = idx === featuredIndex % 5;
            return (
              <button
                key={movie.id}
                type="button"
                onClick={() => (isCenter ? onPlayMovie(movie) : onSelectFeatured(idx))}
                aria-label={isCenter ? `Assistir ${movie.title}` : `Destacar filme ${movie.title}`}
                style={{
                  transform: `translateX(${offset * 52}px) rotate(${offset * 9}deg) skewY(${
                    offset * -2
                  }deg) scale(${isCenter ? 1.12 : 0.92})`,
                  zIndex: isCenter ? 20 : 10 - Math.abs(offset),
                }}
                className={`absolute w-40 sm:w-48 aspect-[2/3] rounded-2xl overflow-hidden border-2 transition-all duration-300 shadow-2xl cursor-pointer ${
                  isCenter ? 'border-[#0EA5E9]' : 'border-white/25 opacity-85 hover:opacity-100'
                }`}
              >
                <PosterArtwork
                  variant={movie.posterUrl || movie.artworkKey}
                  imageUrl={movie.posterUrl}
                  title={movie.title}
                  className="w-full h-full"
                />
              </button>
            );
          })}
        </div>

        {/* Selected Movie Details & Actions */}
        <div className="w-full lg:w-1/2 space-y-3 text-center lg:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-black/60 border border-white/15 text-xs font-mono text-white">
            <Star className="w-3.5 h-3.5 fill-current text-amber-400" />
            <span>{featuredMovie.rating > 0 ? featuredMovie.rating : 8.4}</span>
            <span aria-hidden="true">·</span>
            <span>{featuredMovie.category}</span>
            <span aria-hidden="true">·</span>
            <span>{featuredMovie.year}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold font-display text-white tracking-tight">
            {featuredMovie.title}
          </h1>

          <p className="text-xs sm:text-sm text-[#A0A0B0] leading-relaxed max-w-xl mx-auto lg:mx-0">
            {featuredMovie.synopsis}
          </p>

          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
            <button
              type="button"
              onClick={() => onPlayMovie(featuredMovie)}
              className="min-h-[44px] px-7 py-2.5 rounded-full bg-white text-black font-bold text-sm flex items-center gap-2 hover:bg-white/90 transition-transform active:scale-95 cursor-pointer shadow-lg"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Assistir</span>
            </button>

            <button
              type="button"
              onClick={() => onPlayMovie(featuredMovie)}
              className="min-h-[44px] px-7 py-2.5 rounded-full bg-black/70 hover:bg-white/10 border border-white/40 text-white font-bold text-sm flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Info className="w-4 h-4" />
              <span>Detalhes</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
