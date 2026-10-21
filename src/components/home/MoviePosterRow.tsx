import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, Calendar, ChevronLeft, ChevronRight, Heart, Loader2, Play } from 'lucide-react';
import { VodItem } from '../../types/luminoria';
import { searchFullServerCatalog } from '../../services/tmdbEnrichClient';
import { sortVodByYearDesc } from '../../services/genreNormalizer';
import { PosterArtwork } from '../ui/PosterArtwork';

interface MoviePosterRowProps {
  title: string;
  items: VodItem[];
  favoriteIds: string[];
  onToggleFavorite: (id: string) => void;
  onSelectMovie: (vod: VodItem) => void;
  showRankNumbers?: boolean;
  showTopTenBadge?: boolean;
  show4kBadge?: boolean;
  diagonalTilt?: boolean;
  categoryKey?: string;
  mediaType?: 'movie' | 'series';
  disableYearSort?: boolean;
}

export const MoviePosterRow: React.FC<MoviePosterRowProps> = ({
  title,
  items,
  favoriteIds,
  onToggleFavorite,
  onSelectMovie,
  showRankNumbers = false,
  showTopTenBadge = false,
  show4kBadge = false,
  diagonalTilt = false,
  categoryKey,
  mediaType = 'movie',
  disableYearSort = false,
}) => {
  const isRankingActive = showRankNumbers || showTopTenBadge;
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState<number>(24);
  const [extraServerItems, setExtraServerItems] = useState<VodItem[]>([]);
  const [serverOffset, setServerOffset] = useState<number>(0);
  const [hasMoreOnServer, setHasMoreOnServer] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  // Reset pagination when category or base items change significantly
  useEffect(() => {
    setVisibleCount(24);
    setExtraServerItems([]);
    setServerOffset(0);
    setHasMoreOnServer(true);
  }, [categoryKey, mediaType]);

  // Combine initial items + lazy-loaded server pages without duplicates, sorted 2026 -> 2025 -> 2024 -> 2023...
  const combinedItems = useMemo(() => {
    const map = new Map<string, VodItem>();
    for (const item of items) map.set(item.id, item);
    for (const item of extraServerItems) {
      if (!map.has(item.id)) map.set(item.id, item);
    }
    const merged = Array.from(map.values());
    if (showRankNumbers || disableYearSort) return merged;
    return sortVodByYearDesc(merged);
  }, [items, extraServerItems, showRankNumbers, disableYearSort]);

  const fetchNextServerBatch = async () => {
    if (!categoryKey || isLoadingMore || !hasMoreOnServer) return;
    setIsLoadingMore(true);
    try {
      const res = await searchFullServerCatalog({
        type: mediaType,
        category: categoryKey,
        offset: serverOffset,
        limit: 120,
      });
      const fetched = mediaType === 'series' ? res?.series || [] : res?.movies || [];
      if (fetched.length > 0) {
        setExtraServerItems((prev) => [...prev, ...fetched]);
        setServerOffset((prev) => prev + 120);
        const more = mediaType === 'series' ? res?.hasMoreSeries : res?.hasMoreMovies;
        if (more === false || fetched.length < 120) setHasMoreOnServer(false);
      } else {
        setHasMoreOnServer(false);
      }
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleLoadMoreIfNeeded = (el: HTMLDivElement) => {
    const remainingScroll = el.scrollWidth - el.scrollLeft - el.clientWidth;
    if (remainingScroll < 750) {
      if (visibleCount < combinedItems.length) {
        setVisibleCount((prev) => Math.min(prev + 24, combinedItems.length + 24));
      }
      if (visibleCount + 24 >= combinedItems.length && categoryKey && hasMoreOnServer && !isLoadingMore) {
        fetchNextServerBatch();
      }
    }
  };

  const handleScroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const delta = direction === 'left' ? -580 : 580;
    el.scrollBy({ left: delta, behavior: 'smooth' });
    if (direction === 'right') {
      handleLoadMoreIfNeeded(el);
    }
  };

  const displayedItems = combinedItems.slice(0, visibleCount);

  return (
    <section className="space-y-2.5">
      <div className="flex items-center justify-between px-1 gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <h2 className="text-lg sm:text-2xl font-extrabold font-display text-white tracking-tight truncate">
            {title}
          </h2>
          {!showRankNumbers && combinedItems.length > 0 && (
            <span className="hidden md:inline-flex items-center gap-1 text-xs font-medium text-zinc-400 shrink-0">
              • {combinedItems.length} títulos
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {isLoadingMore && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-cyan-400 mr-1">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span className="hidden sm:inline">Carregando</span>
            </span>
          )}
          <button
            type="button"
            onClick={() => handleScroll('left')}
            aria-label={`Deslizar carrossel ${title} para a esquerda`}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleScroll('right')}
            aria-label={`Deslizar carrossel ${title} para a direita`}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Poster Carousel with Infinite Scroll */}
      <div
        ref={scrollContainerRef}
        onScroll={(e) => handleLoadMoreIfNeeded(e.currentTarget)}
        className="flex items-center gap-4 sm:gap-5 overflow-x-auto snap-x snap-mandatory py-3 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {displayedItems.map((vod, idx) => {
          const isFav = favoriteIds.includes(vod.id);
          const rankNum = vod.rankPosition || idx + 1;
          const isComingSoon = Boolean(vod.isComingSoon);

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
                      transform: 'perspective(850px) rotateY(-6deg) rotateZ(-1.5deg)',
                    }
                  : undefined
              }
              className="group relative shrink-0 w-[154px] sm:w-[190px] aspect-[2/3] snap-start rounded-2xl overflow-hidden bg-[#0E0E15] border border-white/15 cursor-pointer transition-all duration-200 hover:!transform-none hover:scale-105 hover:border-[#0EA5E9] shadow-[0_14px_30px_rgba(0,0,0,0.85)]"
            >
              <PosterArtwork
                variant={vod.posterUrl || vod.artworkKey}
                imageUrl={vod.posterUrl}
                title={vod.title}
                subtitle={`${vod.year} · ${vod.category}`}
                badge4k={show4kBadge && !isComingSoon}
                className="w-full h-full"
              />

              {/* Top-Left Badge: EM BREVE (if not in M3U) OR TOP 10 Rank Badge OR Year Badge */}
              <div className="absolute top-2.5 left-2.5 z-20 flex flex-col items-start gap-1.5 pointer-events-none">
                {isRankingActive && (
                  <div className="px-2.5 py-1 rounded-xl bg-gradient-to-br from-[#E91E8C] to-rose-700 text-white font-display font-black text-xs tracking-wider shadow-[0_6px_18px_rgba(233,30,140,0.55)] border border-white/25 flex items-center gap-1">
                    <span className="text-[9px] uppercase opacity-90">TOP</span>
                    <span className="text-sm leading-none">#{rankNum}</span>
                  </div>
                )}
                {isComingSoon ? (
                  <span className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-rose-600 text-black font-extrabold text-[10px] tracking-wider uppercase shadow-lg flex items-center gap-1 border border-white/30">
                    <Bell className="w-3 h-3 fill-current" />
                    <span>EM BREVE</span>
                  </span>
                ) : (
                  !isRankingActive && (
                    <span className="px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md border border-white/15 text-[10px] font-bold text-cyan-300 tabular-nums">
                      {vod.year}
                    </span>
                  )
                )}
              </div>

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
                className="absolute top-2.5 right-2.5 z-20 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/15 flex items-center justify-center text-white hover:bg-black/85 transition-colors"
              >
                <Heart
                  className={`w-4 h-4 ${
                    isFav ? 'fill-current text-rose-500' : 'text-white'
                  }`}
                />
              </button>

              {/* Subtle Watermark Rank Number Above Bottom Title Bar (Zero Collision) */}
              {showRankNumbers && (
                <div
                  className="absolute bottom-14 right-2.5 z-10 pointer-events-none select-none font-display font-black leading-none opacity-85"
                  style={{
                    fontSize: '3.25rem',
                    color: 'rgba(5,5,8,0.75)',
                    WebkitTextStroke: '2px rgba(255,255,255,0.9)',
                    textShadow: '0 6px 18px rgba(0,0,0,0.95)',
                  }}
                >
                  {rankNum}
                </div>
              )}

              {/* Hover Play / Coming Soon Scrim */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 z-10 p-3 text-center">
                <span className="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center shadow-xl">
                  {isComingSoon ? (
                    <Bell className="w-5 h-5 fill-current" />
                  ) : (
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  )}
                </span>
                <span className="text-[11px] font-bold text-white bg-black/75 px-2.5 py-0.5 rounded-full border border-white/15">
                  {isComingSoon ? 'Ver Trailer · Em Breve' : `Assistir · ${vod.year}`}
                </span>
              </div>
            </div>
          );
        })}

        {/* Load More Card at the end of the row when more items exist */}
        {(visibleCount < combinedItems.length || (categoryKey && hasMoreOnServer)) && (
          <button
            type="button"
            onClick={() => {
              setVisibleCount((prev) => prev + 24);
              if (visibleCount + 24 >= combinedItems.length && categoryKey) {
                fetchNextServerBatch();
              }
            }}
            className="shrink-0 w-[140px] sm:w-[165px] aspect-[2/3] rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-dashed border-white/20 flex flex-col items-center justify-center gap-2 text-white/80 hover:text-white transition-all cursor-pointer p-4 text-center"
          >
            {isLoadingMore ? (
              <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
            ) : (
              <ChevronRight className="w-7 h-7 text-cyan-400" />
            )}
            <span className="text-xs font-bold">Carregar Mais</span>
            <span className="text-[10px] text-white/50 font-mono">
              2026 → 2025 → 2024...
            </span>
          </button>
        )}
      </div>
    </section>
  );
};

