import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Database, Loader2, Search } from 'lucide-react';
import { useLuminoria } from '../context/LuminoriaContext';
import { VodItem } from '../types/luminoria';
import { searchFullServerCatalog } from '../services/tmdbEnrichClient';
import { sortVodByYearDesc } from '../services/genreNormalizer';
import { HomeTopBar } from '../components/home/HomeTopBar';
import { HomeHeroFan } from '../components/home/HomeHeroFan';
import { MoviePosterRow } from '../components/home/MoviePosterRow';

const MOVIE_CATEGORIES = [
  'TODOS',
  'LANÇAMENTOS',
  'AÇÃO',
  'COMÉDIA',
  'TERROR',
  'AVENTURA',
  'FICÇÃO CIENTÍFICA',
  'GUERRA',
  'SUSPENSE',
  'ANIMAÇÃO',
  'DRAMA',
  'ROMANCE',
  'DOCUMENTÁRIOS',
  'DISNEY+',
  'NETFLIX',
];

const YEAR_FILTERS = [
  'Todos os Anos (2026 → Anteriores)',
  '2026',
  '2025',
  '2024',
  '2023',
  '2022',
  'Clássicos (≤2021)',
];

export const HomeScreen: React.FC = () => {
  const {
    vodItems,
    favoriteIds,
    toggleFavorite,
    setActiveModalVod,
    serverCatalogStats,
    weeklyTop10,
    refreshWeeklyTop10,
  } = useLuminoria();

  const [selectedCategory, setSelectedCategory] = useState<string>('TODOS');
  const [selectedYearFilter, setSelectedYearFilter] = useState<string>(
    'Todos os Anos (2026 → Anteriores)'
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSearchInput, setShowSearchInput] = useState<boolean>(false);
  const [featuredIndex, setFeaturedIndex] = useState<number>(0);
  const [serverMovies, setServerMovies] = useState<VodItem[] | null>(null);
  const [isSearchingServer, setIsSearchingServer] = useState<boolean>(false);

  // Strictly Movies only on HomeScreen, sorted 2026 -> 2025 -> 2024 -> 2023...
  const moviesOnly = useMemo(
    () => sortVodByYearDesc(vodItems.filter((item) => item.mediaType !== 'series')),
    [vodItems]
  );

  // Fetch from full 28,100-movie server catalog when searching OR when selecting a specific genre pill
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2 && selectedCategory === 'TODOS') {
      setServerMovies(null);
      return;
    }

    let cancelled = false;
    setIsSearchingServer(true);
    const timer = setTimeout(() => {
      searchFullServerCatalog({
        q,
        type: 'movie',
        category: selectedCategory,
        offset: 0,
        limit: 240,
      })
        .then((res) => {
          if (!cancelled && res?.movies) {
            setServerMovies(res.movies);
          }
        })
        .finally(() => {
          if (!cancelled) setIsSearchingServer(false);
        });
    }, 200);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery, selectedCategory]);

  const featuredMovie = moviesOnly[featuredIndex % Math.max(moviesOnly.length, 1)] || moviesOnly[0];

  const matchesMovieCategory = (m: VodItem, cat: string): boolean => {
    if (m.category === cat) return true;
    const rawCat = (m.rawCategoryName || '').toUpperCase();
    const tags = (m.cast || []).map((t) => t.toUpperCase());
    if (cat === 'LANÇAMENTOS') return m.year >= 2025 || rawCat.includes('LANÇAMENTO');
    if (cat === 'TERROR')
      return rawCat.includes('TERROR') || tags.some((t) => t.includes('TERROR') || t.includes('HORROR'));
    if (cat === 'COMÉDIA')
      return rawCat.includes('COMÉDIA') || rawCat.includes('COMEDIA') || tags.some((t) => t.includes('COMÉDIA'));
    if (cat === 'FICÇÃO CIENTÍFICA')
      return rawCat.includes('FICÇÃO') || tags.some((t) => t.includes('FICÇÃO') || t.includes('SCI-FI'));
    if (cat === 'GUERRA')
      return rawCat.includes('GUERRA') || tags.some((t) => t.includes('GUERRA') || t.includes('HISTÓRIA'));
    if (cat === 'ANIMAÇÃO')
      return rawCat.includes('ANIMAÇÃO') || rawCat.includes('ANIMES') || tags.some((t) => t.includes('ANIMAÇÃO'));
    if (cat === 'DRAMA') return rawCat.includes('DRAMA') || tags.some((t) => t.includes('DRAMA'));
    if (cat === 'ROMANCE') return rawCat.includes('ROMANCE') || tags.some((t) => t.includes('ROMANCE'));
    if (cat === 'DOCUMENTÁRIOS') return rawCat.includes('DOC') || tags.some((t) => t.includes('DOC'));
    if (cat === 'NETFLIX') return rawCat.includes('NETFLIX') || tags.includes('NETFLIX');
    if (cat === 'DISNEY+') return rawCat.includes('DISNEY') || tags.includes('DISNEY+');
    return tags.includes(cat);
  };

  const getGenreMovies = (cat: string) =>
    sortVodByYearDesc(moviesOnly.filter((m) => matchesMovieCategory(m, cat)));

  const newReleases = useMemo(() => getGenreMovies('LANÇAMENTOS'), [moviesOnly]);
  const actionMovies = useMemo(() => getGenreMovies('AÇÃO'), [moviesOnly]);
  const comedyMovies = useMemo(() => getGenreMovies('COMÉDIA'), [moviesOnly]);
  const terrorMovies = useMemo(() => getGenreMovies('TERROR'), [moviesOnly]);
  const scifiMovies = useMemo(() => getGenreMovies('FICÇÃO CIENTÍFICA'), [moviesOnly]);
  const warMovies = useMemo(() => getGenreMovies('GUERRA'), [moviesOnly]);
  const adventureMovies = useMemo(() => getGenreMovies('AVENTURA'), [moviesOnly]);
  const suspenseMovies = useMemo(() => getGenreMovies('SUSPENSE'), [moviesOnly]);
  const animationMovies = useMemo(() => getGenreMovies('ANIMAÇÃO'), [moviesOnly]);
  const dramaMovies = useMemo(() => getGenreMovies('DRAMA'), [moviesOnly]);
  const romanceMovies = useMemo(() => getGenreMovies('ROMANCE'), [moviesOnly]);
  const disneyMovies = useMemo(() => getGenreMovies('DISNEY+'), [moviesOnly]);
  const netflixMovies = useMemo(() => getGenreMovies('NETFLIX'), [moviesOnly]);

  const filteredMovies = useMemo(() => {
    const mergedMap = new Map<string, VodItem>();
    if (serverMovies) {
      serverMovies.forEach((m) => mergedMap.set(m.id, m));
    }
    moviesOnly.forEach((m) => {
      if (!mergedMap.has(m.id)) mergedMap.set(m.id, m);
    });
    const baseList = Array.from(mergedMap.values());

    const filtered = baseList.filter((item) => {
      const matchesSearch =
        !searchQuery.trim() ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.director.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      if (selectedCategory !== 'TODOS' && !matchesMovieCategory(item, selectedCategory)) {
        return false;
      }

      if (selectedYearFilter === '2026') return item.year >= 2026;
      if (selectedYearFilter === '2025') return item.year === 2025;
      if (selectedYearFilter === '2024') return item.year === 2024;
      if (selectedYearFilter === '2023') return item.year === 2023;
      if (selectedYearFilter === '2022') return item.year === 2022;
      if (selectedYearFilter === 'Clássicos (≤2021)') return item.year <= 2021;

      return true;
    });

    return sortVodByYearDesc(filtered);
  }, [moviesOnly, serverMovies, searchQuery, selectedCategory, selectedYearFilter]);

  const top10Movies = useMemo(() => {
    if (weeklyTop10 && weeklyTop10.items.length >= 10) {
      return weeklyTop10.items;
    }
    const firstNewReleaseIds = new Set(newReleases.slice(0, 5).map((m) => m.id));
    const distinctPool = moviesOnly.filter(
      (m) => !firstNewReleaseIds.has(m.id) && Boolean(m.posterUrl)
    );
    const source = distinctPool.length >= 10 ? distinctPool : moviesOnly;
    return [...source]
      .sort((a, b) => (b.year || 2025) - (a.year || 2025) || (b.rating || 0) - (a.rating || 0))
      .slice(0, 10)
      .map((m, idx) => ({ ...m, rankPosition: idx + 1 }));
  }, [weeklyTop10, moviesOnly, newReleases]);

  const ultraHd4kMovies = useMemo(() => {
    return sortVodByYearDesc(moviesOnly.filter((m) => Boolean(m.posterUrl))).slice(0, 60);
  }, [moviesOnly]);

  const isFilteredView =
    selectedCategory !== 'TODOS' ||
    selectedYearFilter !== 'Todos os Anos (2026 → Anteriores)' ||
    searchQuery.trim().length > 0;

  return (
    <div className="space-y-8 pb-32">
      <HomeTopBar
        showSearchInput={showSearchInput}
        onToggleSearch={() => setShowSearchInput((v) => !v)}
        featuredMovieId={featuredMovie?.id}
      />

      {/* Category Pills & Chronological Year Filter */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {MOVIE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-full transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                  : 'bg-[#11131C] text-[#A0A0B0] border border-white/10 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <span className="text-[11px] font-bold text-white/50 flex items-center gap-1 shrink-0 mr-1">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" /> Ano:
            </span>
            {YEAR_FILTERS.map((yf) => (
              <button
                key={yf}
                type="button"
                onClick={() => setSelectedYearFilter(yf)}
                className={`px-3 py-1 text-[11px] font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedYearFilter === yf
                    ? 'bg-white/20 text-white border border-white/30 font-bold'
                    : 'bg-black/40 text-white/60 hover:text-white border border-white/10'
                }`}
              >
                {yf}
              </button>
            ))}

            <span className="hidden xl:inline-flex items-center gap-1.5 ml-3 text-[11px] font-mono text-white/55 tabular-nums">
              <Database className="w-3 h-3 text-cyan-400" />
              {serverCatalogStats.totalMovies.toLocaleString('pt-BR')} filmes M3U · Sincronia TMDB Ativa
            </span>
          </div>

          {showSearchInput && (
            <div className="relative">
              <Search className="w-4 h-4 text-[#A0A0B0] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar entre 28.100 filmes..."
                aria-label="Buscar filme no catálogo"
                className="w-full sm:w-72 pl-10 pr-8 py-2 rounded-full bg-[#11131C] border border-white/15 text-xs text-white placeholder-[#A0A0B0]/60 focus:outline-none focus:border-cyan-400"
              />
              {isSearchingServer && (
                <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Hero Fan Showcase */}
      <HomeHeroFan
        movies={filteredMovies.length > 0 ? filteredMovies : moviesOnly}
        featuredIndex={featuredIndex}
        onSelectFeatured={setFeaturedIndex}
        onPlayMovie={setActiveModalVod}
      />

      {/* Filtered view OR Complete Multi-Genre Catalog Rows with Infinite Scroll */}
      {isFilteredView ? (
        <div className="space-y-6">
          <MoviePosterRow
            title={`Catálogo ${selectedCategory} (${filteredMovies.length} Filmes · 2026 → Anteriores)`}
            items={filteredMovies}
            favoriteIds={favoriteIds}
            onToggleFavorite={toggleFavorite}
            onSelectMovie={setActiveModalVod}
            categoryKey={selectedCategory}
            mediaType="movie"
          />
        </div>
      ) : (
        <div className="space-y-8">
          {newReleases.length > 0 && (
            <MoviePosterRow
              title="Lançamentos & Estreias (2026 → 2025)"
              items={newReleases}
              favoriteIds={favoriteIds}
              onToggleFavorite={toggleFavorite}
              onSelectMovie={setActiveModalVod}
              categoryKey="LANÇAMENTOS"
              mediaType="movie"
            />
          )}

          <div className="space-y-1.5">
            {weeklyTop10 && (
              <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                <span className="text-xs font-sans text-zinc-400 tracking-wide flex items-center gap-1.5">
                  <span className="text-amber-400 font-semibold">Em Alta nesta Semana</span>
                  <span>•</span>
                  <span>Atualizado semanalmente com os maiores lançamentos</span>
                </span>
                <button
                  type="button"
                  onClick={() => refreshWeeklyTop10(true)}
                  className="text-xs font-sans font-semibold text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  Atualizar Ranking
                </button>
              </div>
            )}

            <MoviePosterRow
              title="🔥 Top 10 Filmes da Semana"
              items={top10Movies}
              favoriteIds={favoriteIds}
              onToggleFavorite={toggleFavorite}
              onSelectMovie={setActiveModalVod}
              showRankNumbers
              disableYearSort
            />
          </div>

          {actionMovies.length > 0 && (
            <MoviePosterRow
              title="Filmes de Ação & Adrenalina"
              items={actionMovies}
              favoriteIds={favoriteIds}
              onToggleFavorite={toggleFavorite}
              onSelectMovie={setActiveModalVod}
              categoryKey="AÇÃO"
              mediaType="movie"
            />
          )}

          {terrorMovies.length > 0 && (
            <MoviePosterRow
              title="Filmes de Terror & Horror"
              items={terrorMovies}
              favoriteIds={favoriteIds}
              onToggleFavorite={toggleFavorite}
              onSelectMovie={setActiveModalVod}
              categoryKey="TERROR"
              mediaType="movie"
            />
          )}

          {comedyMovies.length > 0 && (
            <MoviePosterRow
              title="Comédia & Diversão"
              items={comedyMovies}
              favoriteIds={favoriteIds}
              onToggleFavorite={toggleFavorite}
              onSelectMovie={setActiveModalVod}
              categoryKey="COMÉDIA"
              mediaType="movie"
            />
          )}

          {scifiMovies.length > 0 && (
            <MoviePosterRow
              title="Ficção Científica & Espaço"
              items={scifiMovies}
              favoriteIds={favoriteIds}
              onToggleFavorite={toggleFavorite}
              onSelectMovie={setActiveModalVod}
              categoryKey="FICÇÃO CIENTÍFICA"
              mediaType="movie"
            />
          )}

          {adventureMovies.length > 0 && (
            <MoviePosterRow
              title="Aventura & Exploração"
              items={adventureMovies}
              favoriteIds={favoriteIds}
              onToggleFavorite={toggleFavorite}
              onSelectMovie={setActiveModalVod}
              categoryKey="AVENTURA"
              mediaType="movie"
            />
          )}

          {suspenseMovies.length > 0 && (
            <MoviePosterRow
              title="Suspense, Crime & Mistério"
              items={suspenseMovies}
              favoriteIds={favoriteIds}
              onToggleFavorite={toggleFavorite}
              onSelectMovie={setActiveModalVod}
              categoryKey="SUSPENSE"
              mediaType="movie"
            />
          )}

          {warMovies.length > 0 && (
            <MoviePosterRow
              title="Filmes de Guerra & História"
              items={warMovies}
              favoriteIds={favoriteIds}
              onToggleFavorite={toggleFavorite}
              onSelectMovie={setActiveModalVod}
              categoryKey="GUERRA"
              mediaType="movie"
            />
          )}

          {animationMovies.length > 0 && (
            <MoviePosterRow
              title="Animação, Pixar & Família"
              items={animationMovies}
              favoriteIds={favoriteIds}
              onToggleFavorite={toggleFavorite}
              onSelectMovie={setActiveModalVod}
              categoryKey="ANIMAÇÃO"
              mediaType="movie"
            />
          )}

          {dramaMovies.length > 0 && (
            <MoviePosterRow
              title="Dramas & Grandes Histórias"
              items={dramaMovies}
              favoriteIds={favoriteIds}
              onToggleFavorite={toggleFavorite}
              onSelectMovie={setActiveModalVod}
              categoryKey="DRAMA"
              mediaType="movie"
            />
          )}

          {romanceMovies.length > 0 && (
            <MoviePosterRow
              title="Romance & Paixões"
              items={romanceMovies}
              favoriteIds={favoriteIds}
              onToggleFavorite={toggleFavorite}
              onSelectMovie={setActiveModalVod}
              categoryKey="ROMANCE"
              mediaType="movie"
            />
          )}

          {netflixMovies.length > 0 && (
            <MoviePosterRow
              title="Destaques Netflix"
              items={netflixMovies}
              favoriteIds={favoriteIds}
              onToggleFavorite={toggleFavorite}
              onSelectMovie={setActiveModalVod}
              categoryKey="NETFLIX"
              mediaType="movie"
            />
          )}

          {disneyMovies.length > 0 && (
            <MoviePosterRow
              title="Mundo Disney+ & Marvel"
              items={disneyMovies}
              favoriteIds={favoriteIds}
              onToggleFavorite={toggleFavorite}
              onSelectMovie={setActiveModalVod}
              categoryKey="DISNEY+"
              mediaType="movie"
            />
          )}

          <MoviePosterRow
            title="Cinema 4K Ultra HD"
            items={ultraHd4kMovies}
            favoriteIds={favoriteIds}
            onToggleFavorite={toggleFavorite}
            onSelectMovie={setActiveModalVod}
            show4kBadge
            categoryKey="TODOS"
            mediaType="movie"
          />
        </div>
      )}
    </div>
  );
};

