import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebaseClient';
import { TmdbMovieItem, TmdbSyncMetadata } from '../types/tmdb';

const TMDB_COLLECTION = 'tmdb_movies';
const META_DOC_PATH = 'tmdb_sync_meta/catalog_status';
// TTL: 24 hours in milliseconds
export const TMDB_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export async function getCachedTmdbMoviesFromFirestore(
  category?: 'trending' | 'popular' | 'top_rated' | 'now_playing'
): Promise<TmdbMovieItem[]> {
  try {
    const colRef = collection(db, TMDB_COLLECTION);
    const q = category
      ? query(colRef, where('category', '==', category), limit(30))
      : query(colRef, limit(60));

    const snapshot = await getDocs(q);
    const movies: TmdbMovieItem[] = [];

    snapshot.forEach((snap) => {
      const d = snap.data();
      movies.push({
        id: snap.id,
        tmdbId: d.tmdbId,
        title: d.title,
        originalTitle: d.originalTitle || d.title,
        overview: d.overview || '',
        posterPath: d.posterPath,
        backdropPath: d.backdropPath,
        releaseDate: d.releaseDate || '',
        voteAverage: typeof d.voteAverage === 'number' ? d.voteAverage : 7.5,
        voteCount: typeof d.voteCount === 'number' ? d.voteCount : 100,
        genres: Array.isArray(d.genres) ? d.genres : ['Cinema'],
        category: d.category || 'popular',
        mediaType: 'movie',
        durationMinutes: d.durationMinutes || 120,
        syncedAt: d.syncedAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
      });
    });

    return movies;
  } catch {
    return [];
  }
}

export async function getTmdbSyncMetadata(): Promise<TmdbSyncMetadata | null> {
  try {
    const metaRef = doc(db, 'tmdb_sync_meta', 'catalog_status');
    const snap = await getDoc(metaRef);
    if (!snap.exists()) return null;
    const d = snap.data();
    return {
      id: snap.id,
      lastSyncedAt: d.lastSyncedAt?.toDate?.()?.toISOString?.() || d.lastSyncedAt || new Date().toISOString(),
      totalMovies: d.totalMovies || 0,
      categoriesSynced: d.categoriesSynced || [],
      syncedBy: d.syncedBy || 'Sistema',
      cachedInFirestore: true,
      tokensSavedEstimate: d.tokensSavedEstimate || 0,
    };
  } catch {
    return null;
  }
}

export async function saveTmdbMoviesToFirestore(
  movies: TmdbMovieItem[],
  category: string,
  syncedBy: string = 'Luminoria Pro Admin'
): Promise<void> {
  if (movies.length === 0) return;

  const batch = writeBatch(db);
  const now = serverTimestamp();

  movies.forEach((movie) => {
    const movieRef = doc(db, TMDB_COLLECTION, movie.id);
    batch.set(
      movieRef,
      {
        id: movie.id,
        tmdbId: movie.tmdbId,
        title: movie.title,
        originalTitle: movie.originalTitle,
        overview: movie.overview.slice(0, 1000),
        posterPath: movie.posterPath,
        backdropPath: movie.backdropPath,
        releaseDate: movie.releaseDate,
        voteAverage: movie.voteAverage,
        voteCount: movie.voteCount,
        genres: movie.genres.slice(0, 4),
        category: movie.category,
        mediaType: 'movie',
        durationMinutes: movie.durationMinutes || 115,
        syncedAt: now,
      },
      { merge: true }
    );
  });

  // Update sync metadata
  const metaRef = doc(db, 'tmdb_sync_meta', 'catalog_status');
  batch.set(
    metaRef,
    {
      id: 'catalog_status',
      lastSyncedAt: now,
      totalMovies: movies.length,
      categoriesSynced: [category],
      syncedBy,
      cachedInFirestore: true,
      tokensSavedEstimate: 120, // saves hundreds of individual TMDB API hits per user
      updatedAt: now,
    },
    { merge: true }
  );

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, TMDB_COLLECTION);
  }
}

export function isCacheFresh(lastSyncedAtStr?: string, ttlMs: number = TMDB_CACHE_TTL_MS): boolean {
  if (!lastSyncedAtStr) return false;
  const syncTime = new Date(lastSyncedAtStr).getTime();
  if (isNaN(syncTime)) return false;
  return Date.now() - syncTime < ttlMs;
}
