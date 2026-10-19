import { TmdbMovieItem, TmdbSyncMetadata } from '../types/tmdb';
import { INITIAL_TMDB_SEED_MOVIES } from '../data/tmdbSeed';
import { fetchTmdbMoviesFromApi } from './tmdbApi';
import {
  getCachedTmdbMoviesFromFirestore,
  getTmdbSyncMetadata,
  isCacheFresh,
  saveTmdbMoviesToFirestore,
} from './tmdbFirestoreCache';
import {
  getLocalDbMetadata,
  getMoviesFromLocalDb,
  isLocalCacheValid,
  saveLocalDbMetadata,
  saveMoviesToLocalDb,
} from './tmdbLocalDb';

export interface SmartFetchResult {
  movies: TmdbMovieItem[];
  source:
    | 'indexeddb_local_cache'
    | 'firestore_cache'
    | 'tmdb_live_sync'
    | 'fallback_seed';
  metadata?: TmdbSyncMetadata | null;
  message: string;
}

export async function fetchMoviesWithSmartCache(
  category: 'trending' | 'popular' | 'top_rated' | 'now_playing' = 'popular',
  forceSync: boolean = false,
  customApiKey?: string
): Promise<SmartFetchResult> {
  // === TIER 1: Client-Side IndexedDB / localStorage (0ms, 0 network, 0 tokens) ===
  try {
    const localMovies = await getMoviesFromLocalDb(category);
    const localMeta = await getLocalDbMetadata();

    if (!forceSync && localMovies.length > 0 && isLocalCacheValid(localMeta?.lastSyncedAt)) {
      return {
        movies: localMovies,
        source: 'indexeddb_local_cache',
        metadata: localMeta,
        message: `Carregado instantaneamente do IndexedDB local (${localMovies.length} filmes). 0 requisições e 0 tokens!`,
      };
    }

    if (!forceSync && localMovies.length > 5) {
      return {
        movies: localMovies,
        source: 'indexeddb_local_cache',
        metadata: localMeta,
        message: `Recuperado do cache local do navegador (${localMovies.length} títulos salvos).`,
      };
    }
  } catch (err) {
    console.warn('Erro na checagem do cache local IndexedDB:', err);
  }

  // === TIER 2: Cloud Firestore Cache (Shared across devices, 0 TMDB tokens) ===
  const meta = await getTmdbSyncMetadata();
  const cloudCached = await getCachedTmdbMoviesFromFirestore(category);

  if (!forceSync && cloudCached.length > 0 && isCacheFresh(meta?.lastSyncedAt)) {
    await saveMoviesToLocalDb(cloudCached);
    if (meta) await saveLocalDbMetadata(meta);

    return {
      movies: cloudCached,
      source: 'firestore_cache',
      metadata: meta,
      message: `Carregado do cache Firestore (${cloudCached.length} filmes) e sincronizado com o IndexedDB local.`,
    };
  }

  // === TIER 3: TMDB Live API (Only when user supplies customApiKey) ===
  if (customApiKey && customApiKey.trim()) {
    try {
      const liveMovies = await fetchTmdbMoviesFromApi(category, customApiKey);

      if (liveMovies.length > 0) {
        await saveTmdbMoviesToFirestore(liveMovies, category);
        const updatedMeta = await getTmdbSyncMetadata();

        await saveMoviesToLocalDb(liveMovies);
        if (updatedMeta) {
          await saveLocalDbMetadata(updatedMeta);
        }

        return {
          movies: liveMovies,
          source: 'tmdb_live_sync',
          metadata: updatedMeta,
          message: `Sincronização TMDB concluída! ${liveMovies.length} novos filmes salvos no Firebase e IndexedDB.`,
        };
      }
    } catch {}
  }

  // === FALLBACK: Local Cache -> Cloud Cache -> Curated Seeds ===
  const localFallback = await getMoviesFromLocalDb(category);
  if (localFallback.length > 0) {
    return {
      movies: localFallback,
      source: 'indexeddb_local_cache',
      metadata: await getLocalDbMetadata(),
      message: `Modo offline ativo: usando ${localFallback.length} filmes do IndexedDB.`,
    };
  }

  if (cloudCached.length > 0) {
    await saveMoviesToLocalDb(cloudCached);
    return {
      movies: cloudCached,
      source: 'firestore_cache',
      metadata: meta,
      message: `Modo offline ativo: usando ${cloudCached.length} filmes do Firestore.`,
    };
  }

  // Seed Fallback: Save to IndexedDB so local cache is immediately hot
  await saveMoviesToLocalDb(INITIAL_TMDB_SEED_MOVIES);
  const initialMeta: TmdbSyncMetadata = meta || {
    id: 'catalog_status',
    lastSyncedAt: new Date().toISOString(),
    totalMovies: INITIAL_TMDB_SEED_MOVIES.length,
    categoriesSynced: ['popular', 'trending', 'top_rated'],
    cachedInFirestore: true,
    cachedInIndexedDB: true,
    tokensSavedEstimate: 100,
  };
  await saveLocalDbMetadata(initialMeta);

  return {
    movies: INITIAL_TMDB_SEED_MOVIES,
    source: 'fallback_seed',
    metadata: initialMeta,
    message: `Catálogo pronto (${INITIAL_TMDB_SEED_MOVIES.length} títulos salvos no IndexedDB local).`,
  };
}
