import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Database, Loader2, Search } from 'lucide-react';
import { useLuminoria } from '../context/LuminoriaContext';
import { VodItem } from '../types/luminoria';
import { searchFullServerCatalog } from '../services/tmdbEnrichClient';
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
  'DISNEY+',
  'NETFLIX',
];

const YEAR_FILTERS = ['Todos os Anos', '2025/2026', '2024', '2023', 'Clássicos (<2010)'];

export const HomeScreen: React.FC = () => {
  const { vodItems, favoriteIds, toggleFavorite, setActiveModalVod, serverCatalogStats } =
    useLuminoria();

  const [selectedCategory, setSelectedCategory] = useState<string>('TODOS');
  const [selectedYearFilter, setSelectedYearFilter] = useState<string>('Todos os Anos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSearchInput, setShowSearchInput] = useState<boolean>(false);
  const [featuredIndex, setFeaturedIndex] = useState<number>(0);
  const [serverMovies, setServerMovies] = useState<VodItem[] | null>(null);
  const [isSearchingServer, setIsSearchingServer] = useState<boolean>(false);

  // Strictly Movies only on HomeScreen
  const moviesOnly = useMemo(
    () => vodItems.filter((item) => item.mediaType !== 'series'),
    [vodItems]
  );

  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
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
        limit: 160,
      })
        .then((res) => {
          if (!cancelled && res?.movies) {
            setServerMovies(res.movies);
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
  }, [searchQuery, selectedCategory]);

  const featuredMovie = moviesOnly[featuredIndex % moviesOnly.length] || moviesOnly[0];

  const matchesMovieCategory = (m: (typeof moviesOnly)[number], cat: string): boolean => {
    if (m.category === cat) return true;
    const rawCat = (m.rawCategoryName || '').toUpperCase();
    const tags = (m.cast || []).map((t) => t.toUpperCase());
    if (cat === 'LANÇAMENTOS') return m.year >= 2024 || rawCat.includes('LANÇAMENTO');
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
    if (cat === 'NETFLIX') return rawCat.includes('NETFLIX') || tags.includes('NETFLIX');
    if (cat === 'DISNEY+') return rawCat.includes('DISNEY') || tags.includes('DISNEY+');
    return tags.includes(cat);
  };

  const newReleases = useMemo(
    () => moviesOnly.filter((m) => matchesMovieCategory(m, 'LANÇAMENTOS')),
    [moviesOnly]
  );
  const actionMovies = useMemo(
    () => moviesOnly.filter((m) => matchesMovieCategory(m, 'AÇÃO')),
    [moviesOnly]
  );
  const comedyMovies = useMemo(
    () => moviesOnly.filter((m) => matchesMovieCategory(m, 'COMÉDIA')),
    [moviesOnly]
  );
  const terrorMovies = useMemo(
    () => moviesOnly.filter((m) => matchesMovieCategory(m, 'TERROR')),
    [moviesOnly]
  );
  const scifiMovies = useMemo(
    () => moviesOnly.filter((m) => matchesMovieCategory(m, 'FICÇÃO CIENTÍFICA')),
    [moviesOnly]
  );
  const warMovies = useMemo(
    () => moviesOnly.filter((m) => matchesMovieCategory(m, 'GUERRA')),
    [moviesOnly]
  );
  const adventureMovies = useMemo(
    () => moviesOnly.filter((m) => matchesMovieCategory(m, 'AVENTURA')),
    [moviesOnly]
  );
  const suspenseMovies = useMemo(
    () => moviesOnly.filter((m) => matchesMovieCategory(m, 'SUSPENSE')),
    [moviesOnly]
  );
  const animationMovies = useMemo(
    () => moviesOnly.filter((m) => matchesMovieCategory(m, 'ANIMAÇÃO')),
    [moviesOnly]
  );

  const filteredMovies = useMemo(() => {
    const baseList =
      serverMovies && searchQuery.trim().length >= 2 ? serverMovies : moviesOnly;

    return baseList.filter((item) => {
      const matchesSearch =
        !searchQuery.trim() ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.director.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      if (selectedCategory !== 'TODOS' && !matchesMovieCategory(item, selectedCategory)) {
        return false;
      }

      if (selectedYearFilter === '2025/2026') return item.year >= 2025;
      if (selectedYearFilter === '2024') return item.year === 2024;
      if (selectedYearFilter === '2023') return item.year === 2023;
      if (selectedYearFilter === 'Clássicos (<2010)') return item.year < 2010;

      return true;
    });
  }, [moviesOnly, serverMovies, searchQuery, selectedCategory, selectedYearFilter]);

  const top10Movies = useMemo(() => {
    return [...moviesOnly]
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 10)
      .map((m, idx) => ({ ...m, rankPosition: idx + 1 }));
  }, [moviesOnly]);

  const ultraHd4kMovies = useMemo(() => {
    return [...moviesOnly].filter((m) => Boolean(m.posterUrl)).slice(0, 24);
  }, [moviesOnly]);

  return (
    <div className="space-y-8 pb-32">
      <HomeTopBar
        showSearchInput={showSearchInput}
        onToggleSearch={() => setShowSearchInput((v) => !v)}
        featuredMovieId={featuredMovie?.id}
      />

      {/* Category Pills & Year Filter */}
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

            <span className="hidden md:inline-flex items-center gap-1.5 ml-3 text-[11px] font-mono text-white/55 tabular-nums">
              <Database className="w-3 h-3 text-cyan-400" />
              {serverCatalogStats.totalMovies.toLocaleString('pt-BR')} filmes TMDB na lista oficial
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

      {/* 3D Fan Showcase */}
      <HomeHeroFan
        movies={filteredMovies.length > 0 ? filteredMovies : moviesOnly}
        featuredIndex={featuredIndex}
        onSelectFeatured={setFeaturedIndex}
        onPlayMovie={setActiveModalVod}
      />

      {/* Filtered view or Multi-Genre Rows */}
      {selectedCategory !== 'TODOS' ||
      selectedYearFilter !== 'Todos os Anos' ||
      searchQuery.trim().length > 0 ? (
        <div className="space-y-6">
          <MoviePosterRow
            title={`Catálogo Filtrado (${filteredMovies.length} Filmes Encontrados)`}
            items={filteredMovies}
            favoriteIds={favoriteIds}
            onToggleFavorite={toggleFavorite}
            onSelectMovie={setActiveModalVod}
            diagonalTilt
          />
        </div>
      ) : (
        <div className="space-y-8">
          {newReleases.length > 0 && (
            <MoviePosterRow
              title="Lançamentos Recentes (Sincronizados TMDB)"
              items={newReleases}
              favoriteIds={favoriteIds}
              onToggleFavorite={toggleFavorite}
              onSelectMovie={setActiveModalVod}
              diagonalTilt
            />
          )}

          <MoviePosterRow
            title="Top 10 Filmes da Semana"
            items={top10Movies}
            favoriteIds={favoriteIds}
            onToggleFavorite={toggleFavorite}
            onSelectMovie={setActiveModalVod}
            showRankNumbers
            diagonalTilt
          />

          {actionMovies.length > 0 && (
            <MoviePosterRow
              title="Filmes de Ação & Adrenalina"
              items={actionMovies}
              favoriteIds={favoriteIds}
              onToggleFavorite={toggleFavorite}
              onSelectMovie={setActiveModalVod}
              diagonalTilt
            />
          )}

          {terrorMovies.length > 0 && (
            <MoviePosterRow
              title="Filmes de Terror & Horror"
              items={terrorMovies}
              favoriteIds={favoriteIds}
              onToggleFavorite={toggleFavorite}
              onSelectMovie={setActiveModalVod}
              diagonalTilt
            />
          )}

          {comedyMovies.length > 0 && (
            <MoviePosterRow
              title="Comédia & Diversão"
              items={comedyMovies}
              favoriteIds={favoriteIds}
              onToggleFavorite={toggleFavorite}
              onSelectMovie={setActiveModalVod}
              diagonalTilt
            />
          )}

          {scifiMovies.length > 0 && (
            <MoviePosterRow
              title="Ficção Científica & Espaço"
              items={scifiMovies}
              favoriteIds={favoriteIds}
              onToggleFavorite={toggleFavorite}
              onSelectMovie={setActiveModalVod}
              diagonalTilt
            />
          )}

          {warMovies.length > 0 && (
            <MoviePosterRow
              title="Filmes de Guerra & História"
              items={warMovies}
              favoriteIds={favoriteIds}
              onToggleFavorite={toggleFavorite}
              onSelectMovie={setActiveModalVod}
              diagonalTilt
            />
          )}

          {adventureMovies.length > 0 && (
            <MoviePosterRow
              title="Aventura & Exploração"
              items={adventureMovies}
              favoriteIds={favoriteIds}
              onToggleFavorite={toggleFavorite}
              onSelectMovie={setActiveModalVod}
              diagonalTilt
            />
          )}

          {suspenseMovies.length > 0 && (
            <MoviePosterRow
              title="Suspense & Mistério"
              items={suspenseMovies}
              favoriteIds={favoriteIds}
              onToggleFavorite={toggleFavorite}
              onSelectMovie={setActiveModalVod}
              diagonalTilt
            />
          )}

          {animationMovies.length > 0 && (
            <MoviePosterRow
              title="Animação & Desenhos"
              items={animationMovies}
              favoriteIds={favoriteIds}
              onToggleFavorite={toggleFavorite}
              onSelectMovie={setActiveModalVod}
              diagonalTilt
            />
          )}

          <MoviePosterRow
            title="Cinema 4K Ultra HD"
            items={ultraHd4kMovies}
            favoriteIds={favoriteIds}
            onToggleFavorite={toggleFavorite}
            onSelectMovie={setActiveModalVod}
            show4kBadge
            diagonalTilt
          />
        </div>
      )}
    </div>
  );
};
