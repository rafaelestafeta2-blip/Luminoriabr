import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Database, Info, Loader2, Play, Search, Sparkles, Star, Tv } from 'lucide-react';
import { useLuminoria } from '../context/LuminoriaContext';
import { VodItem } from '../types/luminoria';
import { searchFullServerCatalog } from '../services/tmdbEnrichClient';
import {
  extractMediaReleaseYear,
  normalizeSeriesGenre,
  sortVodChronologically,
} from '../services/genreNormalizer';
import { PosterArtwork } from '../components/ui/PosterArtwork';
import { MoviePosterRow } from '../components/home/MoviePosterRow';

const SERIES_GENRE_TABS = [
  { id: 'Todas', label: 'Todas as Séries' },
  { id: 'LANÇAMENTOS', label: '🔥 Lançamentos' },
  { id: 'AÇÃO & AVENTURA', label: '💥 Ação & Aventura' },
  { id: 'SUSPENSE & CRIME', label: '🕵️ Suspense & Crime' },
  { id: 'DRAMA', label: '🎭 Drama' },
  { id: 'FICÇÃO & FANTASIA', label: '🛸 Ficção & Fantasia' },
  { id: 'DORAMAS', label: '🇰🇷 Doramas & K-Drama' },
  { id: 'ANIMES & ANIMAÇÃO', label: '🎌 Animes & Animação' },
  { id: 'TERROR & MISTÉRIO', label: '👻 Terror & Mistério' },
  { id: 'COMÉDIA', label: '😂 Comédia' },
  { id: 'DOCUMENTÁRIOS', label: '🎬 Documentários' },
  { id: 'NETFLIX', label: '🔴 Netflix' },
  { id: 'MAX / HBO', label: '🟣 HBO / Max' },
  { id: 'PRIME VIDEO', label: '🔵 Prime Video' },
  { id: 'DISNEY+', label: '✨ Disney+' },
  { id: 'GLOBOPLAY', label: '🇧🇷 Globoplay' },
];

export const SeriesScreen: React.FC = () => {
  const { vodItems, favoriteIds, toggleFavorite, setActiveModalVod, serverCatalogStats } =
    useLuminoria();

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('Todas');
  const [selectedYear, setSelectedYear] = useState<string>('Todos');
  const [serverSearchResults, setServerSearchResults] = useState<VodItem[] | null>(null);
  const [categoryServerSeries, setCategoryServerSeries] = useState<VodItem[]>([]);
  const [isSearchingServer, setIsSearchingServer] = useState(false);

  // Normalize all client series so none are stuck in a generic "SÉRIES" or "TMDB" bucket
  const seriesOnly = useMemo(() => {
    const rawSeries = vodItems
      .filter((item) => item.mediaType === 'series')
      .map((s) => {
        if (!s.category || s.category === 'SÉRIES' || s.category === 'TMDB') {
          const cat = normalizeSeriesGenre(s.rawCategoryName || s.category || '', s.title);
          const yr = extractMediaReleaseYear(s.title, s.rawCategoryName || '', s.year);
          return { ...s, category: cat, year: yr };
        }
        return s;
      });
    return sortVodChronologically(rawSeries);
  }, [vodItems]);

  const featuredSeries = useMemo(
    () =>
      seriesOnly.find((s) => Boolean(s.backdropUrl && s.posterUrl)) ||
      seriesOnly.find((s) => Boolean(s.posterUrl)) ||
      seriesOnly[0],
    [seriesOnly]
  );

  // Server search when typing in search bar
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setServerSearchResults(null);
      return;
    }

    let cancelled = false;
    setIsSearchingServer(true);
    const timer = setTimeout(() => {
      searchFullServerCatalog({ q, type: 'series', limit: 160 })
        .then((res) => {
          if (!cancelled && res?.series) {
            setServerSearchResults(sortVodChronologically(res.series));
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

  // Fetch deep server series when user clicks a specific genre tab
  useEffect(() => {
    if (selectedGenre === 'Todas') {
      setCategoryServerSeries([]);
      return;
    }

    let cancelled = false;
    setIsSearchingServer(true);
    searchFullServerCatalog({
      type: 'series',
      category: selectedGenre,
      offset: 0,
      limit: 200,
    })
      .then((res) => {
        if (!cancelled && res?.series) {
          setCategoryServerSeries(sortVodChronologically(res.series));
        }
      })
      .finally(() => {
        if (!cancelled) setIsSearchingServer(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedGenre]);

  const matchesYear = (s: VodItem) => {
    if (selectedYear === 'Todos') return true;
    if (selectedYear === '<=2022') return (s.year || 2024) <= 2022;
    return String(s.year) === selectedYear;
  };

  const getSeriesForGenre = (keywords: string[], fallbackStart = 0) => {
    const matches = seriesOnly.filter(
      (s) =>
        matchesYear(s) &&
        keywords.some(
          (kw) =>
            s.category.toUpperCase().includes(kw) || s.title.toUpperCase().includes(kw)
        )
    );
    const sorted = sortVodChronologically(matches);
    if (sorted.length >= 6) return sorted;
    const extras = seriesOnly.filter((s) => matchesYear(s) && !sorted.some((m) => m.id === s.id));
    return sortVodChronologically([
      ...sorted,
      ...extras.slice(fallbackStart, fallbackStart + 18),
    ]);
  };

  const topTenSeries = useMemo(
    () =>
      sortVodChronologically(
        seriesOnly.filter((s) => matchesYear(s) && Boolean(s.posterUrl))
      ).slice(0, 15),
    [seriesOnly, selectedYear]
  );

  const releaseSeries = useMemo(
    () =>
      sortVodChronologically(
        seriesOnly.filter(
          (s) =>
            matchesYear(s) &&
            (s.year >= 2024 || s.category.toUpperCase().includes('LANÇAMENTO'))
        )
      ),
    [seriesOnly, selectedYear]
  );

  const actionCrimeSeries = useMemo(
    () => getSeriesForGenre(['AÇÃO', 'CRIME', 'POLICIAL', 'GUERRA', 'AVENTURA'], 0),
    [seriesOnly, selectedYear]
  );
  const dramaSuspenseSeries = useMemo(
    () => getSeriesForGenre(['DRAMA', 'SUSPENSE', 'MISTÉRIO', 'THRILLER'], 10),
    [seriesOnly, selectedYear]
  );
  const scifiFantasySeries = useMemo(
    () => getSeriesForGenre(['FICÇÃO', 'FANTASIA', 'SCI-FI', 'HERO'], 20),
    [seriesOnly, selectedYear]
  );
  const doramaSeries = useMemo(
    () => getSeriesForGenre(['DORAMA', 'ASIÁTICA', 'K-DRAMA', 'COREIA'], 30),
    [seriesOnly, selectedYear]
  );
  const animeSeries = useMemo(
    () => getSeriesForGenre(['ANIME', 'ANIMAÇÃO', 'CARTOON', 'KIDS'], 40),
    [seriesOnly, selectedYear]
  );
  const horrorSeries = useMemo(
    () => getSeriesForGenre(['TERROR', 'HORROR', 'SOBRENATURAL', 'ZUMBI'], 50),
    [seriesOnly, selectedYear]
  );
  const comedySeries = useMemo(
    () => getSeriesForGenre(['COMÉDIA', 'SITCOM', 'HUMOR', 'ROMANCE'], 60),
    [seriesOnly, selectedYear]
  );
  const docsRealitySeries = useMemo(
    () => getSeriesForGenre(['DOCUMENTÁRIO', 'REALITY', 'HISTÓRIA', 'BIOGRAFIA'], 70),
    [seriesOnly, selectedYear]
  );
  const netflixSeries = useMemo(
    () => getSeriesForGenre(['NETFLIX'], 15),
    [seriesOnly, selectedYear]
  );
  const hboMaxSeries = useMemo(
    () => getSeriesForGenre(['HBO', 'MAX'], 25),
    [seriesOnly, selectedYear]
  );
  const primeSeries = useMemo(
    () => getSeriesForGenre(['PRIME', 'AMAZON', 'PARAMOUNT', 'APPLE'], 35),
    [seriesOnly, selectedYear]
  );
  const disneySeries = useMemo(
    () => getSeriesForGenre(['DISNEY', 'MARVEL', 'STAR'], 45),
    [seriesOnly, selectedYear]
  );
  const globoplaySeries = useMemo(
    () => getSeriesForGenre(['GLOBOPLAY', 'NOVELA', 'BRASIL'], 55),
    [seriesOnly, selectedYear]
  );

  const filteredSeries = useMemo(() => {
    if (serverSearchResults && searchQuery.trim().length >= 2) {
      return serverSearchResults.filter(matchesYear);
    }
    const pool =
      selectedGenre !== 'Todas' && categoryServerSeries.length > 0
        ? [...categoryServerSeries, ...seriesOnly]
        : seriesOnly;

    const seen = new Set<string>();
    return sortVodChronologically(
      pool.filter((s) => {
        if (seen.has(s.id)) return false;
        seen.add(s.id);
        if (!matchesYear(s)) return false;
        if (
          searchQuery.trim() &&
          !s.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !s.category.toLowerCase().includes(searchQuery.toLowerCase())
        ) {
          return false;
        }
        if (selectedGenre === 'Todas') return true;
        return (
          s.category.toUpperCase().includes(selectedGenre.toUpperCase()) ||
          s.title.toUpperCase().includes(selectedGenre.toUpperCase())
        );
      })
    );
  }, [
    serverSearchResults,
    searchQuery,
    selectedGenre,
    selectedYear,
    categoryServerSeries,
    seriesOnly,
  ]);

  const continueWatchingSeries = useMemo(
    () => seriesOnly.filter((s) => Boolean(s.posterUrl)).slice(0, 12),
    [seriesOnly]
  );

  if (!featuredSeries) return null;

  return (
    <div className="space-y-8 pb-32">
      {/* Full-Bleed Hero Section */}
      <section className="relative -mx-4 sm:mx-0 rounded-none sm:rounded-3xl overflow-hidden border-b sm:border border-white/10 min-h-[500px] sm:min-h-[550px] flex flex-col justify-between bg-[#07070B]">
        <PosterArtwork
          variant={featuredSeries.artworkKey}
          imageUrl={featuredSeries.backdropUrl || featuredSeries.posterUrl}
          title={featuredSeries.title}
          hideBottomLabel
          className="absolute inset-0 w-full h-full"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-[#050508]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050508]/90 via-[#050508]/35 to-transparent" />

        {/* Top-Right Search Trigger & Total Series Counter */}
        <div className="relative z-20 flex flex-wrap items-center justify-between p-5 gap-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-black/70 backdrop-blur-md border border-cyan-500/30 text-xs text-white/90 font-mono tabular-nums">
            <Tv className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              {serverCatalogStats.totalSeries.toLocaleString('pt-BR')} Séries por Gênero · 2026 → Clássicos
            </span>
          </div>

          <div className="flex items-center">
            {searchOpen && (
              <div className="relative mr-3">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Buscar entre ${serverCatalogStats.totalSeries.toLocaleString('pt-BR')} séries...`}
                  aria-label="Buscar série no catálogo"
                  className="px-4 py-2 rounded-full bg-black/80 border border-white/25 text-xs text-white placeholder-white/60 focus:outline-none focus:border-[#0EA5E9] w-56 sm:w-72"
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
              className="w-11 h-11 rounded-full bg-black/55 backdrop-blur-md border border-white/15 flex items-center justify-center text-white hover:bg-black/80 transition-colors cursor-pointer"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Hero Content Overlay */}
        <div className="relative z-20 px-6 pb-8 pt-16 max-w-2xl space-y-3.5">
          <div className="inline-flex flex-wrap items-center gap-2 px-3 py-1 rounded-lg bg-black/75 border border-white/20 text-xs font-bold text-white">
            <span className="text-cyan-400 uppercase tracking-wider">{featuredSeries.category}</span>
            <span>·</span>
            <span className="font-mono text-amber-300">{featuredSeries.year || 2026}</span>
            <span>·</span>
            <span className="inline-flex items-center gap-1 text-amber-400 font-mono tabular-nums">
              <Star className="w-3.5 h-3.5 fill-current" />
              {featuredSeries.rating}
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold font-display text-white tracking-tight">
            {featuredSeries.title}
          </h1>

          <p className="text-sm sm:text-base text-[#D4D4E0] line-clamp-2 leading-relaxed">
            {featuredSeries.synopsis}
          </p>

          <div className="grid grid-cols-2 gap-3.5 pt-2 max-w-md">
            <button
              type="button"
              onClick={() => setActiveModalVod(featuredSeries)}
              className="min-h-[50px] px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black font-black text-sm flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer shadow-[0_0_25px_rgba(6,182,212,0.35)]"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Assistir Série</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveModalVod(featuredSeries)}
              className="min-h-[50px] px-6 py-3 rounded-xl bg-black/80 hover:bg-white/10 border border-white/25 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Info className="w-4 h-4 text-cyan-400" />
              <span>Episódios & Trailer</span>
            </button>
          </div>
        </div>
      </section>

      {/* Series Genre Hub & Chronological Year Filter Bar */}
      <section className="space-y-3 bg-[#090B12]/90 border border-white/10 rounded-2xl p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
            <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-white">
              Explorar Séries por Gênero & Plataforma
            </h2>
          </div>

          {/* Year Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 [scrollbar-width:none]">
            <span className="text-[11px] text-white/50 font-mono flex items-center gap-1 mr-1 shrink-0">
              <Calendar className="w-3 h-3 text-cyan-400" /> Ano:
            </span>
            {['Todos', '2026', '2025', '2024', '2023', '<=2022'].map((yr) => (
              <button
                key={yr}
                type="button"
                onClick={() => setSelectedYear(yr)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer shrink-0 ${
                  selectedYear === yr
                    ? 'bg-amber-400 text-black shadow-[0_0_12px_rgba(251,191,36,0.4)]'
                    : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
                }`}
              >
                {yr === '<=2022' ? 'Clássicas ≤2022' : yr}
              </button>
            ))}
          </div>
        </div>

        {/* Horizontal Genre Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {SERIES_GENRE_TABS.map((tab) => {
            const active = selectedGenre === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedGenre(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  active
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black shadow-[0_0_18px_rgba(6,182,212,0.4)]'
                    : 'bg-white/[0.05] text-white/75 hover:bg-white/[0.12] hover:text-white border border-white/10'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Continuar Assistindo */}
      {selectedGenre === 'Todas' && !searchQuery.trim() && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-extrabold font-display text-white">
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
                className="group relative shrink-0 w-36 sm:w-44 aspect-[2/3] rounded-xl overflow-hidden bg-[#11131C] border border-white/15 cursor-pointer hover:border-[#0EA5E9] transition-all"
              >
                <PosterArtwork
                  variant={ser.artworkKey}
                  imageUrl={ser.posterUrl}
                  title={ser.title}
                  hideBottomLabel={ser.artworkKey === 'reacher_series'}
                  className="w-full h-full"
                />
                <div className="absolute top-2 left-2 z-20 px-2 py-0.5 rounded bg-black/80 border border-white/15 text-[10px] font-mono font-bold text-amber-300">
                  {ser.year || 2025}
                </div>
                <div className="absolute bottom-0 inset-x-0 h-1.5 bg-white/20 z-20">
                  <div
                    className="h-full bg-[#0EA5E9]"
                    style={{ width: `${ser.watchProgress || 55}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Search or Selected Genre View vs Complete Multi-Genre Series Catalog */}
      {searchQuery.trim() || selectedGenre !== 'Todas' ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-xs text-cyan-200">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>
                Exibindo <strong>{filteredSeries.length}</strong> séries em{' '}
                <strong>{selectedGenre}</strong> (ordenadas de 2026 → 2025 → 2024 → Clássicas). Arraste para o lado para carregar mais!
              </span>
            </div>
            {isSearchingServer && <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />}
          </div>

          <MoviePosterRow
            title={
              searchQuery.trim()
                ? `Resultados para "${searchQuery}" (${filteredSeries.length})`
                : `Catálogo de Séries · ${selectedGenre}`
            }
            items={filteredSeries}
            favoriteIds={favoriteIds}
            onToggleFavorite={toggleFavorite}
            onSelectMovie={setActiveModalVod}
            categoryKey={selectedGenre !== 'Todas' ? selectedGenre : undefined}
            mediaType="series"
          />
        </div>
      ) : (
        <div className="space-y-10">
          <MoviePosterRow
            title="🔥 Top 10 Séries em Alta (2026 → 2023)"
            items={topTenSeries}
            favoriteIds={favoriteIds}
            onToggleFavorite={toggleFavorite}
            onSelectMovie={setActiveModalVod}
            showTopTenBadge
            mediaType="series"
          />

          <MoviePosterRow
            title="🚀 Lançamentos & Novas Temporadas (2026 · 2025 · 2024)"
            items={releaseSeries}
            favoriteIds={favoriteIds}
            onToggleFavorite={toggleFavorite}
            onSelectMovie={setActiveModalVod}
            categoryKey="LANÇAMENTOS"
            mediaType="series"
          />

          <MoviePosterRow
            title="💥 Séries de Ação, Crime & Investigação"
            items={actionCrimeSeries}
            favoriteIds={favoriteIds}
            onToggleFavorite={toggleFavorite}
            onSelectMovie={setActiveModalVod}
            categoryKey="SÉRIES DE AÇÃO"
            mediaType="series"
          />

          <MoviePosterRow
            title="🎭 Drama, Suspense & Mistério"
            items={dramaSuspenseSeries}
            favoriteIds={favoriteIds}
            onToggleFavorite={toggleFavorite}
            onSelectMovie={setActiveModalVod}
            categoryKey="DRAMA & SUSPENSE"
            mediaType="series"
          />

          <MoviePosterRow
            title="🛸 Ficção Científica & Fantasia Épica"
            items={scifiFantasySeries}
            favoriteIds={favoriteIds}
            onToggleFavorite={toggleFavorite}
            onSelectMovie={setActiveModalVod}
            categoryKey="FICÇÃO & FANTASIA"
            mediaType="series"
          />

          <MoviePosterRow
            title="🇰🇷 Doramas, K-Dramas & Séries Asiáticas"
            items={doramaSeries}
            favoriteIds={favoriteIds}
            onToggleFavorite={toggleFavorite}
            onSelectMovie={setActiveModalVod}
            categoryKey="DORAMAS & ASIÁTICAS"
            mediaType="series"
          />

          <MoviePosterRow
            title="🎌 Animes & Animação"
            items={animeSeries}
            favoriteIds={favoriteIds}
            onToggleFavorite={toggleFavorite}
            onSelectMovie={setActiveModalVod}
            categoryKey="ANIMES & ANIMAÇÃO"
            mediaType="series"
          />

          <MoviePosterRow
            title="👻 Terror, Sobrenatural & Thriller"
            items={horrorSeries}
            favoriteIds={favoriteIds}
            onToggleFavorite={toggleFavorite}
            onSelectMovie={setActiveModalVod}
            categoryKey="SÉRIES DE TERROR"
            mediaType="series"
          />

          <MoviePosterRow
            title="😂 Comédia & Sitcoms"
            items={comedySeries}
            favoriteIds={favoriteIds}
            onToggleFavorite={toggleFavorite}
            onSelectMovie={setActiveModalVod}
            categoryKey="COMÉDIA"
            mediaType="series"
          />

          <MoviePosterRow
            title="🎬 Documentários, Crime Real & Reality"
            items={docsRealitySeries}
            favoriteIds={favoriteIds}
            onToggleFavorite={toggleFavorite}
            onSelectMovie={setActiveModalVod}
            categoryKey="DOCUMENTÁRIOS & REALITY"
            mediaType="series"
          />

          <MoviePosterRow
            title="🔴 Originais Netflix"
            items={netflixSeries}
            favoriteIds={favoriteIds}
            onToggleFavorite={toggleFavorite}
            onSelectMovie={setActiveModalVod}
            categoryKey="NETFLIX"
            mediaType="series"
          />

          <MoviePosterRow
            title="🟣 Exclusivos HBO / Max"
            items={hboMaxSeries}
            favoriteIds={favoriteIds}
            onToggleFavorite={toggleFavorite}
            onSelectMovie={setActiveModalVod}
            categoryKey="HBO / MAX"
            mediaType="series"
          />

          <MoviePosterRow
            title="🔵 Prime Video & Apple TV+"
            items={primeSeries}
            favoriteIds={favoriteIds}
            onToggleFavorite={toggleFavorite}
            onSelectMovie={setActiveModalVod}
            categoryKey="PRIME VIDEO"
            mediaType="series"
          />

          <MoviePosterRow
            title="✨ Disney+ · Marvel & Star Wars"
            items={disneySeries}
            favoriteIds={favoriteIds}
            onToggleFavorite={toggleFavorite}
            onSelectMovie={setActiveModalVod}
            categoryKey="DISNEY+"
            mediaType="series"
          />

          <MoviePosterRow
            title="🇧🇷 Globoplay & Novelas"
            items={globoplaySeries}
            favoriteIds={favoriteIds}
            onToggleFavorite={toggleFavorite}
            onSelectMovie={setActiveModalVod}
            categoryKey="GLOBOPLAY"
            mediaType="series"
          />
        </div>
      )}
    </div>
  );
};

