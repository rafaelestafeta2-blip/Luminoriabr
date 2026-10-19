import type { TmdbMovieItem } from '../types/tmdb.ts';
import type { VodItem } from '../types/luminoria.ts';

/**
 * Maps TMDB genres into the application's existing core categories:
 * 'AÇÃO' | 'AVENTURA' | 'SUSPENSE'
 */
export function mapTmdbGenresToExistingCategory(
  genres: string[] = []
): 'AÇÃO' | 'AVENTURA' | 'SUSPENSE' {
  const normalized = genres.map((g) => g.toLowerCase());

  if (
    normalized.some(
      (g) =>
        (g.includes('ação') && !g.includes('animação')) ||
        (g.includes('action') && !g.includes('animation')) ||
        g.includes('guerra') ||
        g.includes('crime') ||
        g.includes('faroeste')
    )
  ) {
    return 'AÇÃO';
  }

  if (
    normalized.some(
      (g) =>
        g.includes('aventura') ||
        g.includes('adventure') ||
        g.includes('ficção') ||
        g.includes('fantasia') ||
        g.includes('animação') ||
        g.includes('comédia') ||
        g.includes('família')
    )
  ) {
    return 'AVENTURA';
  }

  return 'SUSPENSE';
}

/**
 * Transforms a TMDB movie item into a standard Luminoria VodItem
 * so that it seamlessly renders inside all existing carousels, lists and filters.
 */
export function convertTmdbToVodItem(
  item: TmdbMovieItem,
  rankIndex?: number
): VodItem {
  const existingCategory = mapTmdbGenresToExistingCategory(item.genres);
  const releaseYear =
    parseInt(item.releaseDate?.split('-')[0] || '2024', 10) || 2024;
  const hours = Math.floor((item.durationMinutes || 118) / 60);
  const minutes = (item.durationMinutes || 118) % 60;

  return {
    id: item.id,
    title: item.title,
    year: releaseYear,
    duration: `${hours}h ${minutes.toString().padStart(2, '0')}m`,
    rating: item.voteAverage || 7.5,
    category: existingCategory,
    mediaType: 'movie',
    synopsis: item.overview || 'Sinopse oficial disponível via TMDB.',
    director: item.genres.slice(0, 2).join(' • ') || 'Cinema TMDB',
    cast: item.genres.length > 0 ? item.genres : ['Filme', 'Cinema 4K'],
    streamUrl: `https://vod.luminoria.pro/movies/${item.id}.mp4`,
    artworkKey: 'cyber_odyssey',
    posterUrl: item.posterPath,
    backdropUrl: item.backdropPath,
    tmdbId: item.tmdbId,
    rankPosition: rankIndex !== undefined ? rankIndex + 1 : undefined,
    watchProgress: (item.tmdbId % 65) + 15,
  };
}

/**
 * Merges TMDB movies into the catalog without duplicates,
 * prioritizing real TMDB poster and backdrop art.
 */
export function mergeTmdbIntoVodCatalog(
  existingVod: VodItem[],
  tmdbMovies: TmdbMovieItem[]
): VodItem[] {
  const seriesItems = existingVod.filter((item) => item.mediaType === 'series');
  const existingMovies = existingVod.filter((item) => item.mediaType !== 'series');

  const tmdbVodItems = tmdbMovies.map((item, idx) =>
    convertTmdbToVodItem(item, idx)
  );

  const movieMap = new Map<string, VodItem>();

  // Prioritize authentic TMDB titles first so carousels showcase real posters immediately
  tmdbVodItems.forEach((m) => movieMap.set(m.id, m));
  existingMovies.forEach((m) => {
    if (!movieMap.has(m.id)) {
      movieMap.set(m.id, m);
    }
  });

  return [...movieMap.values(), ...seriesItems];
}
