import type { TmdbMovieItem, TmdbSyncMetadata } from '../types/tmdb.ts';

const DB_NAME = 'luminoria_tmdb_db';
const DB_VERSION = 1;
const STORE_MOVIES = 'movies';
const STORE_META = 'metadata';
const FALLBACK_KEY_MOVIES = 'luminoria_tmdb_local_movies';
const FALLBACK_KEY_META = 'luminoria_tmdb_local_meta';

export const LOCAL_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function hasIndexedDB(): boolean {
  return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!hasIndexedDB()) {
      return reject(new Error('IndexedDB indisponível'));
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_MOVIES)) {
        const store = db.createObjectStore(STORE_MOVIES, { keyPath: 'id' });
        store.createIndex('category', 'category', { unique: false });
        store.createIndex('tmdbId', 'tmdbId', { unique: true });
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function isLocalCacheValid(
  lastSyncedAt?: string,
  ttlMs: number = LOCAL_CACHE_TTL_MS
): boolean {
  if (!lastSyncedAt) return false;
  const time = new Date(lastSyncedAt).getTime();
  if (isNaN(time)) return false;
  return Date.now() - time < ttlMs;
}

export async function saveMoviesToLocalDb(
  movies: TmdbMovieItem[]
): Promise<void> {
  if (!movies || movies.length === 0) return;

  if (hasIndexedDB()) {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_MOVIES, 'readwrite');
      const store = tx.objectStore(STORE_MOVIES);
      for (const movie of movies) {
        store.put(movie);
      }
      return new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      console.warn('Falha no IndexedDB, usando localStorage como fallback:', e);
    }
  }

  // Fallback to localStorage
  try {
    const existing = await getMoviesFromLocalDb();
    const map = new Map<string, TmdbMovieItem>();
    existing.forEach((m) => map.set(m.id, m));
    movies.forEach((m) => map.set(m.id, m));
    localStorage.setItem(
      FALLBACK_KEY_MOVIES,
      JSON.stringify(Array.from(map.values()))
    );
  } catch (err) {
    console.warn('Falha ao salvar no localStorage:', err);
  }
}

export async function getMoviesFromLocalDb(
  category?: string
): Promise<TmdbMovieItem[]> {
  if (hasIndexedDB()) {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_MOVIES, 'readonly');
        const store = tx.objectStore(STORE_MOVIES);
        const req = store.getAll();
        req.onsuccess = () => {
          const all: TmdbMovieItem[] = req.result || [];
          if (!category) {
            resolve(all);
          } else {
            resolve(all.filter((m) => m.category === category));
          }
        };
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('Falha ao ler IndexedDB, tentando localStorage:', e);
    }
  }

  // Fallback to localStorage
  try {
    const raw = localStorage.getItem(FALLBACK_KEY_MOVIES);
    if (!raw) return [];
    const list: TmdbMovieItem[] = JSON.parse(raw);
    if (!category) return list;
    return list.filter((m) => m.category === category);
  } catch {
    return [];
  }
}

export async function saveLocalDbMetadata(
  meta: TmdbSyncMetadata
): Promise<void> {
  if (hasIndexedDB()) {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_META, 'readwrite');
      tx.objectStore(STORE_META).put(meta);
      return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      console.warn('Falha ao salvar meta no IndexedDB:', e);
    }
  }

  try {
    localStorage.setItem(FALLBACK_KEY_META, JSON.stringify(meta));
  } catch {}
}

export async function getLocalDbMetadata(): Promise<TmdbSyncMetadata | null> {
  if (hasIndexedDB()) {
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_META, 'readonly');
        const req = tx.objectStore(STORE_META).get('catalog_status');
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    } catch {
      // fallback
    }
  }

  try {
    const raw = localStorage.getItem(FALLBACK_KEY_META);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function clearLocalDb(): Promise<void> {
  if (hasIndexedDB()) {
    try {
      const db = await openDB();
      const tx = db.transaction([STORE_MOVIES, STORE_META], 'readwrite');
      tx.objectStore(STORE_MOVIES).clear();
      tx.objectStore(STORE_META).clear();
    } catch {}
  }
  try {
    localStorage.removeItem(FALLBACK_KEY_MOVIES);
    localStorage.removeItem(FALLBACK_KEY_META);
  } catch {}
}
