import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Heart, Play } from 'lucide-react';
import { VodItem } from '../../types/luminoria';
import { PosterArtwork } from '../ui/PosterArtwork';

interface MoviePosterRowProps {
  title: string;
  items: VodItem[];
  favoriteIds: string[];
  onToggleFavorite: (id: string) => void;
  onSelectMovie: (vod: VodItem) => void;
  showRankNumbers?: boolean;
  show4kBadge?: boolean;
  diagonalTilt?: boolean;
}

export const MoviePosterRow: React.FC<MoviePosterRowProps> = ({
  title,
  items,
  favoriteIds,
  onToggleFavorite,
  onSelectMovie,
  showRankNumbers = false,
  show4kBadge = false,
  diagonalTilt = true,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const delta = direction === 'left' ? -380 : 380;
    scrollContainerRef.current.scrollBy({ left: delta, behavior: 'smooth' });
  };

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xl sm:text-2xl font-extrabold font-display text-white tracking-tight">
          {title}
        </h2>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleScroll('left')}
            aria-label={`Deslizar carrossel ${title} para a esquerda`}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleScroll('right')}
            aria-label={`Deslizar carrossel ${title} para a direita`}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Diagonal Netflix-style Poster Carousel */}
      <div
        ref={scrollContainerRef}
        className="flex items-center gap-5 sm:gap-6 overflow-x-auto snap-x snap-mandatory py-4 px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.slice(0, 36).map((vod, idx) => {
          const isFav = favoriteIds.includes(vod.id);
          const rankNum = vod.rankPosition || idx + 1;

          return (
            <div
              key={`${title}-${vod.id}`}
              onClick={() => onSelectMovie(vod)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onSelectMovie(vod);
              }}
              style={
                diagonalTilt
                  ? {
                      transform: 'perspective(850px) rotateY(-9deg) rotateZ(-2.5deg) skewY(-1.5deg)',
                    }
                  : undefined
              }
              className="group relative shrink-0 w-[158px] sm:w-[196px] aspect-[2/3] snap-start rounded-2xl overflow-hidden bg-[#0E0E15] border border-white/15 cursor-pointer transition-all duration-200 hover:!transform-none hover:scale-105 hover:border-[#0EA5E9] shadow-[0_14px_30px_rgba(0,0,0,0.85)]"
            >
              <PosterArtwork
                variant={vod.posterUrl || vod.artworkKey}
                imageUrl={vod.posterUrl}
                title={vod.title}
                subtitle={`${vod.year} · ${vod.category}`}
                badge4k={show4kBadge}
                className="w-full h-full"
              />

              {/* Top-Right Translucent Circular Heart Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(vod.id);
                }}
                aria-label={
                  isFav
                    ? `Remover ${vod.title} dos favoritos`
                    : `Adicionar ${vod.title} aos favoritos`
                }
                className="absolute top-3 right-3 z-20 w-9 h-9 rounded-full bg-black/60 backdrop-blur-md border border-white/15 flex items-center justify-center text-white hover:bg-black/85 transition-colors"
              >
                <Heart
                  className={`w-4 h-4 ${
                    isFav ? 'fill-current text-rose-500' : 'text-white'
                  }`}
                />
              </button>

              {/* Giant Outlined Rank Number Overlay for Top 10 Row */}
              {showRankNumbers && (
                <div
                  className="absolute bottom-1 left-2 z-20 pointer-events-none select-none font-display font-black leading-none"
                  style={{
                    fontSize: '4.5rem',
                    color: '#050508',
                    WebkitTextStroke: '2.5px #FFFFFF',
                    textShadow: '0 8px 24px rgba(0,0,0,0.9)',
                  }}
                >
                  {rankNum}
                </div>
              )}

              {/* Hover Play Scrim */}
              <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                <span className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-xl">
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
