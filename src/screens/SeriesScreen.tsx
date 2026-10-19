import React, { useEffect, useState } from 'react';
import { Info, Loader2, Play, Search, Star } from 'lucide-react';
import { useLuminoria } from '../context/LuminoriaContext';
import { VodItem } from '../types/luminoria';
import { searchFullServerCatalog } from '../services/tmdbEnrichClient';
import { PosterArtwork } from '../components/ui/PosterArtwork';
import { MoviePosterRow } from '../components/home/MoviePosterRow';

export const SeriesScreen: React.FC = () => {
  const { vodItems, favoriteIds, toggleFavorite, setActiveModalVod, serverCatalogStats } =
    useLuminoria();

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [serverSearchResults, setServerSearchResults] = useState<VodItem[] | null>(null);
  const [isSearchingServer, setIsSearchingServer] = useState(false);

  const seriesOnly = vodItems.filter((item) => item.mediaType === 'series');
  const featuredSeries =
    seriesOnly.find((s) => Boolean(s.backdropUrl && s.posterUrl)) ||
    seriesOnly.find((s) => Boolean(s.posterUrl)) ||
    seriesOnly[0];

  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setServerSearchResults(null);
      return;
    }

    let cancelled = false;
    setIsSearchingServer(true);
    const timer = setTimeout(() => {
      searchFullServerCatalog({ q, type: 'series', limit: 120 })
        .then((res) => {
          if (!cancelled && res?.series) {
            setServerSearchResults(res.series);
          }
        })
        .finally(() => {
          if (!cancelled) setIsSearchingServer(false);
        });
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const filteredSeries =
    serverSearchResults && searchQuery.trim().length >= 2
      ? serverSearchResults
      : seriesOnly.filter((s) =>
          !searchQuery.trim()
            ? true
            : s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              s.category.toLowerCase().includes(searchQuery.toLowerCase())
        );

  const continueWatchingSeries = [
    ...seriesOnly.filter((s) => Boolean(s.posterUrl)).slice(0, 12),
  ];

  if (!featuredSeries) return null;

  return (
    <div className="space-y-8 pb-32">
      {/* Full-Bleed Hero Section */}
      <section className="relative -mx-4 sm:mx-0 rounded-none sm:rounded-3xl overflow-hidden border-b sm:border border-white/10 min-h-[540px] sm:min-h-[580px] flex flex-col justify-between bg-[#07070B]">
        <PosterArtwork
          variant={featuredSeries.artworkKey}
          imageUrl={featuredSeries.backdropUrl || featuredSeries.posterUrl}
          title={featuredSeries.title}
          hideBottomLabel
          className="absolute inset-0 w-full h-full"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-[#050508]/55 to-transparent" />

        {/* Top-Right Search Trigger & Total Series Counter */}
        <div className="relative z-20 flex items-center justify-between p-5 gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-black/65 backdrop-blur-md border border-white/15 text-xs text-white/85 font-mono tabular-nums">
            {serverCatalogStats.totalSeries.toLocaleString('pt-BR')} Séries Completas · TMDB Sync
          </div>

          <div className="flex items-center">
            {searchOpen && (
              <div className="relative mr-3">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar entre 9.513 séries..."
                  aria-label="Buscar série no catálogo"
                  className="px-4 py-2 rounded-full bg-black/75 border border-white/25 text-xs text-white placeholder-white/60 focus:outline-none focus:border-[#0EA5E9] w-56 sm:w-72"
                />
                {isSearchingServer && (
                  <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
                )}
              </div>
            )}
            <button
              type="button"
              onClick={() => setSearchOpen((v) => !v)}
              aria-label="Buscar séries"
              className="w-11 h-11 rounded-full bg-black/45 backdrop-blur-md border border-white/15 flex items-center justify-center text-white hover:bg-black/75 transition-colors cursor-pointer"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Hero Content Overlay */}
        <div className="relative z-20 px-6 pb-8 pt-24 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/70 border border-white/25 text-xs font-bold text-white">
            <Star className="w-3.5 h-3.5 fill-current text-amber-400" />
            <span className="font-mono tabular-nums">{featuredSeries.rating}</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold font-display text-white tracking-tight">
            {featuredSeries.title}
          </h1>

          <p className="text-sm sm:text-base text-[#D4D4E0] line-clamp-2 leading-relaxed">
            {featuredSeries.synopsis}
          </p>

          <div className="grid grid-cols-2 gap-3.5 pt-2 max-w-md">
            <button
              type="button"
              onClick={() => setActiveModalVod(featuredSeries)}
              className="min-h-[52px] px-6 py-3 rounded-full bg-white hover:bg-white/90 text-black font-bold text-sm flex items-center justify-center gap-2.5 transition-transform active:scale-95 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Assistir</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveModalVod(featuredSeries)}
              className="min-h-[52px] px-6 py-3 rounded-full bg-black/80 hover:bg-white/10 border-2 border-white text-white font-bold text-sm flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
            >
              <Info className="w-4 h-4" />
              <span>Episódios & Trailer</span>
            </button>
          </div>
        </div>
      </section>

      {/* Continuar Assistindo */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-extrabold font-display text-white">
            Continuar Assistindo
          </h2>
        </div>

        <div className="flex items-center gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {continueWatchingSeries.map((ser) => (
            <div
              key={ser.id}
              onClick={() => setActiveModalVod(ser)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setActiveModalVod(ser);
              }}
              className="group relative shrink-0 w-36 sm:w-44 aspect-[3/4] rounded-2xl overflow-hidden bg-[#11131C] border border-white/15 cursor-pointer hover:border-[#0EA5E9] transition-all"
            >
              <PosterArtwork
                variant={ser.artworkKey}
                imageUrl={ser.posterUrl}
                title={ser.title}
                hideBottomLabel={ser.artworkKey === 'reacher_series'}
                className="w-full h-full"
              />
              <div className="absolute bottom-0 inset-x-0 h-1.5 bg-white/20 z-20">
                <div
                  className="h-full bg-[#0EA5E9]"
                  style={{ width: `${ser.watchProgress || 50}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Series Carousel */}
      <MoviePosterRow
        title={
          searchQuery.trim()
            ? `Resultados de Séries (${filteredSeries.length})`
            : `Séries Sincronizadas TMDB (${seriesOnly.length.toLocaleString('pt-BR')} carregadas de ${serverCatalogStats.totalSeries.toLocaleString('pt-BR')})`
        }
        items={filteredSeries.length > 0 ? filteredSeries : seriesOnly}
        favoriteIds={favoriteIds}
        onToggleFavorite={toggleFavorite}
        onSelectMovie={setActiveModalVod}
        diagonalTilt
      />
    </div>
  );
};
