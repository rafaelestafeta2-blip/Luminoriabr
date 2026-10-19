import type { Channel, PlaylistSource, VodItem } from '../types/luminoria.ts';

const PLAYLISTS_STORAGE_KEY = 'luminoria_playlists_v2';
const IDB_NAME = 'luminoria_iptv_catalog_db';
const IDB_VERSION = 1;
const STORE_CATALOG = 'catalog_blobs';

export const OFFICIAL_ELITEDNS_M3U_URL =
  'https://elitedns.xyz/get.php?username=Rafalaila&password=1662167&type=m3u_plus&output=mpegts';

export const OFFICIAL_ELITEDNS_PLAYLIST: PlaylistSource = {
  id: 'pl-elitedns-rafalaila',
  name: 'EliteDNS Oficial · Rafalaila (M3U Plus Completo)',
  type: 'xtream',
  urlOrHost: 'https://elitedns.xyz',
  m3uUrl: OFFICIAL_ELITEDNS_M3U_URL,
  username: 'Rafalaila',
  password: '1662167',
  channelCount: 302408,
  totalServerItems: 302408,
  liveCount: 3584,
  moviesCount: 28100,
  seriesCount: 9513,
  epgUrl: 'https://elitedns.xyz/xmltv.php?username=Rafalaila&password=1662167',
  updatedAt: 'Sincronizado automaticamente',
  isActive: true,
};

function isLegacyDummyPlaylist(pl: PlaylistSource): boolean {
  if (pl.id === 'pl-1' || pl.id === 'pl-2' || pl.id === 'pl-main' || pl.id === 'pl-sports') {
    return true;
  }
  if (
    pl.urlOrHost.includes('luminoria.tv') ||
    pl.urlOrHost.includes('luminoria.pro')
  ) {
    return true;
  }
  return false;
}

export function loadPersistedPlaylists(): PlaylistSource[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [OFFICIAL_ELITEDNS_PLAYLIST];
  }
  try {
    const raw = window.localStorage.getItem(PLAYLISTS_STORAGE_KEY);
    if (!raw) return [OFFICIAL_ELITEDNS_PLAYLIST];
    const parsed = JSON.parse(raw) as PlaylistSource[];
    if (!Array.isArray(parsed)) return [OFFICIAL_ELITEDNS_PLAYLIST];

    // Filter out any old test/dummy playlists so only real user playlists remain
    const cleaned = parsed.filter((p) => !isLegacyDummyPlaylist(p));
    if (cleaned.length === 0) {
      return [OFFICIAL_ELITEDNS_PLAYLIST];
    }
    return cleaned;
  } catch {
    return [OFFICIAL_ELITEDNS_PLAYLIST];
  }
}

export function savePersistedPlaylists(playlists: PlaylistSource[]): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const cleaned = playlists.filter((p) => !isLegacyDummyPlaylist(p));
    window.localStorage.setItem(PLAYLISTS_STORAGE_KEY, JSON.stringify(cleaned));
  } catch (err) {
    console.warn('Falha ao salvar listas M3U no localStorage:', err);
  }
}

function openCatalogIdb(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    try {
      const req = window.indexedDB.open(IDB_NAME, IDB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_CATALOG)) {
          db.createObjectStore(STORE_CATALOG);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function saveCatalogToIdb(data: {
  channels: Channel[];
  vodItems: VodItem[];
}): Promise<void> {
  const db = await openCatalogIdb();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_CATALOG, 'readwrite');
      const store = tx.objectStore(STORE_CATALOG);
      store.put(
        {
          savedAt: Date.now(),
          channels: data.channels.slice(0, 1500),
          vodItems: data.vodItems.slice(0, 3000),
        },
        'active_catalog'
      );
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

export async function loadCatalogFromIdb(): Promise<{
  channels: Channel[];
  vodItems: VodItem[];
} | null> {
  const db = await openCatalogIdb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_CATALOG, 'readonly');
      const store = tx.objectStore(STORE_CATALOG);
      const req = store.get('active_catalog');
      req.onsuccess = () => {
        if (req.result && Array.isArray(req.result.vodItems)) {
          resolve({
            channels: req.result.channels || [],
            vodItems: req.result.vodItems || [],
          });
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}
