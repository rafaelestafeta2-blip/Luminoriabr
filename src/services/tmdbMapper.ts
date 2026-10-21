import type { TmdbMovieItem } from '../types/tmdb.ts';
import type { VodItem } from '../types/luminoria.ts';

export function normalizeTitleKey(title: string = ''): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\b(19\d\d|20[0-3]\d)\b/g, '')
    .replace(/[^a-z0-9]/g, '');
}

export const normalizeTitleForMatch = normalizeTitleKey;
export { convertTmdbToVodItem as tmdbMovieToVodItem };

export function hasRealM3uStreamUrl(url?: string): boolean {
  if (!url || !url.trim()) return false;
  const lower = url.toLowerCase();
  if (
    lower.includes('luminoria.pro') ||
    lower.includes('example.com') ||
    lower.includes('placeholder') ||
    lower.includes('w3.org') ||
    lower.includes('w3schools.com')
  ) {
    return false;
  }
  return true;
}

/**
 * Maps TMDB genres into the application's core categories:
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
 * Transforms a TMDB movie item into a standard Luminoria VodItem.
 * By default, standalone TMDB items without an M3U stream are marked `isComingSoon: true`.
 */
export function convertTmdbToVodItem(
  item: TmdbMovieItem,
  rankIndex?: number | { isComingSoon?: boolean },
  matchedM3uItem?: VodItem
): VodItem {
  const rankIdx = typeof rankIndex === 'number' ? rankIndex : undefined;
  const forceComingSoon =
    typeof rankIndex === 'object' && rankIndex !== null ? rankIndex.isComingSoon : undefined;

  const existingCategory = matchedM3uItem?.category || mapTmdbGenresToExistingCategory(item.genres);
  const releaseYear =
    matchedM3uItem?.year ||
    parseInt(item.releaseDate?.split('-')[0] || '2024', 10) ||
    2024;
  const hours = Math.floor((item.durationMinutes || 118) / 60);
  const minutes = (item.durationMinutes || 118) % 60;
  const hasRealStream =
    forceComingSoon === true
      ? false
      : Boolean(matchedM3uItem && hasRealM3uStreamUrl(matchedM3uItem.streamUrl));

  return {
    id: matchedM3uItem ? matchedM3uItem.id : item.id,
    title: matchedM3uItem ? matchedM3uItem.title : item.title,
    year: releaseYear,
    duration: matchedM3uItem?.duration || `${hours}h ${minutes.toString().padStart(2, '0')}m`,
    rating: item.voteAverage || matchedM3uItem?.rating || 7.5,
    category: existingCategory,
    rawCategoryName: matchedM3uItem?.rawCategoryName || item.genres.join(', '),
    mediaType: 'movie',
    synopsis: item.overview || matchedM3uItem?.synopsis || 'Sinopse oficial disponível via TMDB.',
    director: item.genres.slice(0, 2).join(' • ') || matchedM3uItem?.director || 'Cinema TMDB',
    cast: item.genres.length > 0 ? item.genres : matchedM3uItem?.cast || ['Filme', 'Cinema 4K'],
    streamUrl: hasRealStream ? matchedM3uItem!.streamUrl : `lumin://coming-soon/${item.id}`,
    artworkKey: matchedM3uItem?.artworkKey || 'cyber_odyssey',
    posterUrl: item.posterPath || matchedM3uItem?.posterUrl,
    backdropUrl: item.backdropPath || matchedM3uItem?.backdropUrl,
    tmdbId: item.tmdbId,
    xtreamStreamId: matchedM3uItem?.xtreamStreamId,
    rankPosition: rankIdx !== undefined ? rankIdx + 1 : matchedM3uItem?.rankPosition,
    watchProgress: (item.tmdbId % 65) + 15,
    hasM3uStream: hasRealStream,
    isComingSoon: !hasRealStream,
  };
}

/**
 * Merges TMDB movies into the M3U catalog without duplicates:
 * 1. Keeps all M3U catalog movies first (`isComingSoon: false`).
 * 2. Cross-matches TMDB movies against the M3U catalog by tmdbId or normalized title.
 *    - If found in M3U: enriches the M3U movie with TMDB metadata (`isComingSoon: false`).
 *    - If NOT found in M3U: appends the TMDB movie with `isComingSoon: true` ("EM BREVE").
 */
export function mergeTmdbIntoVodCatalog(
  existingVod: VodItem[],
  tmdbMovies: TmdbMovieItem[]
): VodItem[] {
  const seriesItems = existingVod
    .filter((item) => item.mediaType === 'series')
    .map((s) => ({
      ...s,
      hasM3uStream: true,
      isComingSoon: false,
    }));

  // Exclude any previously injected standalone tmdb-* items so we cleanly re-evaluate against current M3U list
  const m3uMovies = existingVod.filter(
    (item) => item.mediaType !== 'series' && !item.id.startsWith('tmdb-')
  );

  const m3uByTitle = new Map<string, VodItem>();
  const m3uByTmdbId = new Map<number, VodItem>();

  for (const m of m3uMovies) {
    const key = normalizeTitleKey(m.title);
    if (key && !m3uByTitle.has(key)) m3uByTitle.set(key, m);
    if (m.tmdbId && !m3uByTmdbId.has(m.tmdbId)) m3uByTmdbId.set(m.tmdbId, m);
  }

  const movieMap = new Map<string, VodItem>();

  // 1. Insert all M3U movies first so available movies lead every genre carousel
  for (const m of m3uMovies) {
    movieMap.set(m.id, {
      ...m,
      hasM3uStream: true,
      isComingSoon: false,
    });
  }

  // 2. Cross-match TMDB movies against the M3U catalog
  tmdbMovies.forEach((item, idx) => {
    const normTitle = normalizeTitleKey(item.title);
    const normOrig = item.originalTitle ? normalizeTitleKey(item.originalTitle) : '';

    let matchedM3u =
      m3uByTmdbId.get(item.tmdbId) ||
      (normTitle ? m3uByTitle.get(normTitle) : undefined) ||
      (normOrig ? m3uByTitle.get(normOrig) : undefined);

    // Also check prefix/substring title match for titles like "Duna: Parte 2" vs "Duna: Parte Dois"
    if (!matchedM3u && normTitle.length >= 5) {
      for (const [m3uKey, m3uVal] of m3uByTitle.entries()) {
        if (m3uKey.includes(normTitle) || normTitle.includes(m3uKey)) {
          matchedM3u = m3uVal;
          break;
        }
      }
    }

    if (matchedM3u) {
      // Enrich the existing M3U movie in-place and mark it available (`isComingSoon: false`)
      movieMap.set(matchedM3u.id, {
        ...matchedM3u,
        posterUrl: matchedM3u.posterUrl || item.posterPath,
        backdropUrl: matchedM3u.backdropUrl || item.backdropPath,
        tmdbId: item.tmdbId,
        hasM3uStream: true,
        isComingSoon: false,
      });
    } else {
      // Movie from TMDB does NOT exist in the M3U list -> mark as `isComingSoon: true` ("EM BREVE")
      const comingSoonItem = convertTmdbToVodItem(item, idx, undefined);
      movieMap.set(comingSoonItem.id, comingSoonItem);
    }
  });

  return [...movieMap.values(), ...seriesItems];
}


