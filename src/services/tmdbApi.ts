import { TmdbApiResponse, TmdbMovieItem } from '../types/tmdb';
import { INITIAL_TMDB_SEED_MOVIES } from '../data/tmdbSeed';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
export const TMDB_IMAGE_BASE_500 = 'https://image.tmdb.org/t/p/w500';
export const TMDB_IMAGE_BASE_ORIGINAL = 'https://image.tmdb.org/t/p/w1280';

const GENRE_MAP: Record<number, string> = {
  28: 'Ação',
  12: 'Aventura',
  16: 'Animação',
  35: 'Comédia',
  80: 'Crime',
  99: 'Documentário',
  18: 'Drama',
  10751: 'Família',
  14: 'Fantasia',
  36: 'História',
  27: 'Terror',
  10402: 'Música',
  9648: 'Mistério',
  10749: 'Romance',
  878: 'Ficção Científica',
  10770: 'Cinema TV',
  53: 'Suspense',
  10752: 'Guerra',
  37: 'Faroeste',
};

export function mapGenreIdsToNames(genreIds?: number[]): string[] {
  if (!genreIds || genreIds.length === 0) return ['Cinema'];
  return genreIds.map((id) => GENRE_MAP[id] || 'Filme').slice(0, 3);
}

export function buildImageUrl(path: string | null, size: 'poster' | 'backdrop' = 'poster'): string {
  if (!path) {
    return 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80';
  }
  const base = size === 'poster' ? TMDB_IMAGE_BASE_500 : TMDB_IMAGE_BASE_ORIGINAL;
  return `${base}${path}`;
}

export async function fetchTmdbMoviesFromApi(
  category: 'trending' | 'popular' | 'top_rated' | 'now_playing',
  customApiKey?: string
): Promise<TmdbMovieItem[]> {
  const apiKey =
    customApiKey?.trim() ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_TMDB_API_KEY) ||
    '';

  if (!apiKey) {
    return INITIAL_TMDB_SEED_MOVIES;
  }

  let endpoint = `${TMDB_BASE_URL}/movie/popular?api_key=${apiKey}&language=pt-BR&page=1`;
  if (category === 'trending') {
    endpoint = `${TMDB_BASE_URL}/trending/movie/week?api_key=${apiKey}&language=pt-BR`;
  } else if (category === 'top_rated') {
    endpoint = `${TMDB_BASE_URL}/movie/top_rated?api_key=${apiKey}&language=pt-BR&page=1`;
  } else if (category === 'now_playing') {
    endpoint = `${TMDB_BASE_URL}/movie/now_playing?api_key=${apiKey}&language=pt-BR&page=1`;
  }

  const response = await fetch(endpoint);
  if (!response.ok) {
    return INITIAL_TMDB_SEED_MOVIES;
  }

  const data: TmdbApiResponse = await response.json();
  const now = new Date().toISOString();

  return (data.results || []).map((item) => ({
    id: `tmdb-${item.id}`,
    tmdbId: item.id,
    title: item.title || item.original_title,
    originalTitle: item.original_title || item.title,
    overview: item.overview || 'Sem sinopse disponível em português.',
    posterPath: buildImageUrl(item.poster_path, 'poster'),
    backdropPath: buildImageUrl(item.backdrop_path || item.poster_path, 'backdrop'),
    releaseDate: item.release_date || '2024',
    voteAverage: Number((item.vote_average || 7.0).toFixed(1)),
    voteCount: item.vote_count || 0,
    genres: mapGenreIdsToNames(item.genre_ids),
    category,
    mediaType: 'movie' as const,
    durationMinutes: 110 + (item.id % 35),
    syncedAt: now,
  }));
}

export async function searchTmdbMoviesFromApi(
  query: string,
  customApiKey?: string
): Promise<TmdbMovieItem[]> {
  if (!query.trim()) return [];
  const apiKey =
    customApiKey?.trim() ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_TMDB_API_KEY) ||
    '';

  if (!apiKey) {
    const q = query.trim().toLowerCase();
    return INITIAL_TMDB_SEED_MOVIES.filter((m) => m.title.toLowerCase().includes(q));
  }

  const endpoint = `${TMDB_BASE_URL}/search/movie?api_key=${apiKey}&language=pt-BR&query=${encodeURIComponent(
    query
  )}&page=1`;

  const response = await fetch(endpoint);
  if (!response.ok) {
    return [];
  }

  const data: TmdbApiResponse = await response.json();
  const now = new Date().toISOString();

  return (data.results || []).map((item) => ({
    id: `tmdb-${item.id}`,
    tmdbId: item.id,
    title: item.title || item.original_title,
    originalTitle: item.original_title || item.title,
    overview: item.overview || 'Sem sinopse disponível.',
    posterPath: buildImageUrl(item.poster_path, 'poster'),
    backdropPath: buildImageUrl(item.backdrop_path || item.poster_path, 'backdrop'),
    releaseDate: item.release_date || '2024',
    voteAverage: Number((item.vote_average || 7.0).toFixed(1)),
    voteCount: item.vote_count || 0,
    genres: mapGenreIdsToNames(item.genre_ids),
    category: 'popular',
    mediaType: 'movie' as const,
    durationMinutes: 115,
    syncedAt: now,
  }));
}
