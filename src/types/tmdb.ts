export interface TmdbMovieItem {
  id: string; // e.g. "tmdb-550"
  tmdbId: number;
  title: string;
  originalTitle: string;
  overview: string;
  posterPath: string; // full URL or path
  backdropPath: string;
  releaseDate: string;
  voteAverage: number;
  voteCount: number;
  genres: string[];
  category: 'trending' | 'popular' | 'top_rated' | 'now_playing';
  mediaType: 'movie';
  durationMinutes?: number;
  syncedAt?: string;
}

export interface TmdbApiResponseItem {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  vote_average: number;
  vote_count: number;
  genre_ids?: number[];
}

export interface TmdbApiResponse {
  page: number;
  results: TmdbApiResponseItem[];
  total_pages: number;
  total_results: number;
}

export interface TmdbSyncMetadata {
  id: string;
  lastSyncedAt: string;
  totalMovies: number;
  categoriesSynced: string[];
  syncedBy?: string;
  cachedInFirestore: boolean;
  cachedInIndexedDB?: boolean;
  tokensSavedEstimate: number;
}
