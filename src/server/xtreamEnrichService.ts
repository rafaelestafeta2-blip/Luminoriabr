import { fetchXtreamApiJson } from './m3uFetcher';
import {
  extractYoutubeId,
  getOrLoadXtreamCatalog,
  normalizeTmdbImageUrl,
} from './xtreamCatalogService';
import { SeriesEpisodeItem, VodItem } from '../types/luminoria';

const detailsCache = new Map<string, any>();

/**
 * Selects a balanced initial slice across all genres AND across multiple release years
 * (2026 -> 2025 -> 2024 -> 2023 -> 2022 -> <=2021) so every genre carousel on HomeScreen
 * seamlessly transitions from 2026 to 2025, 2024, 2023 and older classics.
 */
export function selectBalancedMovies(allMovies: VodItem[], maxTotal: number = 2600): VodItem[] {
  if (allMovies.length <= maxTotal) return allMovies;

  const pickedIds = new Set<string>();
  const result: VodItem[] = [];

  const targetCategories = [
    'LANÇAMENTOS',
    'AÇÃO',
    'COMÉDIA',
    'TERROR',
    'FICÇÃO CIENTÍFICA',
    'GUERRA',
    'AVENTURA',
    'SUSPENSE',
    'ANIMAÇÃO',
    'DRAMA',
    'ROMANCE',
    'DOCUMENTÁRIOS',
    'DISNEY+',
    'NETFLIX',
  ];

  const yearBuckets = [
    (y: number) => y >= 2026,
    (y: number) => y === 2025,
    (y: number) => y === 2024,
    (y: number) => y === 2023,
    (y: number) => y === 2022,
    (y: number) => y <= 2021,
  ];

  // For each genre, pick up to 32 movies from EACH year bucket (2026, 2025, 2024, 2023, 2022, <=2021)
  for (const cat of targetCategories) {
    for (const matchesYear of yearBuckets) {
      let bucketCount = 0;
      for (const m of allMovies) {
        if (pickedIds.has(m.id)) continue;
        const catMatch =
          m.category === cat ||
          Boolean(m.rawCategoryName && m.rawCategoryName.toUpperCase().includes(cat));
        if (catMatch && matchesYear(m.year || 2024)) {
          pickedIds.add(m.id);
          result.push(m);
          bucketCount++;
          if (bucketCount >= 32) break;
        }
      }
    }
  }

  // Fill remainder up to maxTotal
  for (const m of allMovies) {
    if (result.length >= maxTotal) break;
    if (!pickedIds.has(m.id)) {
      pickedIds.add(m.id);
      result.push(m);
    }
  }

  return result;
}

/**
 * Selects a balanced initial slice of Series across all series genres and platforms
 * ordered from 2026 -> 2025 -> 2024 -> 2023...
 */
export function selectBalancedSeries(allSeries: VodItem[], maxTotal: number = 1800): VodItem[] {
  if (allSeries.length <= maxTotal) return allSeries;

  const pickedIds = new Set<string>();
  const result: VodItem[] = [];

  const seriesCategories = [
    'AÇÃO & AVENTURA',
    'DRAMA',
    'SUSPENSE & CRIME',
    'FICÇÃO & FANTASIA',
    'COMÉDIA',
    'TERROR & MISTÉRIO',
    'ANIMES & ANIMAÇÃO',
    'DORAMAS',
    'DOCUMENTÁRIOS',
    'NOVELAS',
    'NETFLIX',
    'MAX / HBO',
    'PRIME VIDEO',
    'DISNEY+',
    'GLOBOPLAY',
  ];

  for (const cat of seriesCategories) {
    let count = 0;
    for (const s of allSeries) {
      if (pickedIds.has(s.id)) continue;
      const rawUp = (s.rawCategoryName || '').toUpperCase();
      if (s.category === cat || rawUp.includes(cat.split(' ')[0])) {
        pickedIds.add(s.id);
        result.push(s);
        count++;
        if (count >= 120) break;
      }
    }
  }

  for (const s of allSeries) {
    if (result.length >= maxTotal) break;
    if (!pickedIds.has(s.id)) {
      pickedIds.add(s.id);
      result.push(s);
    }
  }

  return result;
}

/**
 * Fetches rich TMDB metadata, Cast, Director, Backdrop, YouTube Trailer, and Series Episodes
 * from Xtream player_api (get_vod_info / get_series_info) or title match.
 */
export async function fetchXtreamMediaDetails(params: {
  host: string;
  username: string;
  password: string;
  vodId?: number;
  seriesId?: number;
  title?: string;
  mediaType?: 'movie' | 'series';
}) {
  const cleanHost = params.host.replace(/\/$/, '');
  const authUrl = `${cleanHost}/player_api.php?username=${encodeURIComponent(
    params.username
  )}&password=${encodeURIComponent(params.password)}`;

  let vodId = params.vodId;
  let seriesId = params.seriesId;
  let matchedMovieStreamUrl: string | undefined;

  const normalizeTitleKey = (str: string) =>
    str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\biii\b/g, '3')
      .replace(/\bii\b/g, '2')
      .replace(/\biv\b/g, '4')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  // If no explicit ID was passed, try matching by title in the cached 37,613-item catalog
  if (!vodId && !seriesId && params.title) {
    try {
      const cat = await getOrLoadXtreamCatalog(cleanHost, params.username, params.password);
      const normTitle = normalizeTitleKey(params.title);
      if (params.mediaType === 'series') {
        const foundSer =
          cat.allSeries.find((s) => normalizeTitleKey(s.title) === normTitle) ||
          cat.allSeries.find((s) => normalizeTitleKey(s.title).includes(normTitle));
        if (foundSer?.xtreamSeriesId) seriesId = foundSer.xtreamSeriesId;
      } else {
        const foundMov =
          cat.allMovies.find((m) => normalizeTitleKey(m.title) === normTitle) ||
          cat.allMovies.find((m) => normalizeTitleKey(m.title).includes(normTitle));
        if (foundMov?.xtreamStreamId) {
          vodId = foundMov.xtreamStreamId;
          matchedMovieStreamUrl = foundMov.streamUrl;
        }
      }
    } catch {}
  }

  const cacheKey = `${cleanHost}|${vodId || ''}|${seriesId || ''}`;
  if (detailsCache.has(cacheKey)) {
    return detailsCache.get(cacheKey);
  }

  if (seriesId) {
    const data = await fetchXtreamApiJson(
      `${authUrl}&action=get_series_info&series_id=${seriesId}`
    );
    const info = data?.info || {};
    const episodesObj = data?.episodes || {};
    const episodes: SeriesEpisodeItem[] = [];

    for (const seasonKey of Object.keys(episodesObj)) {
      const epList = Array.isArray(episodesObj[seasonKey]) ? episodesObj[seasonKey] : [];
      for (const ep of epList) {
        const ext = ep.container_extension || 'mp4';
        episodes.push({
          id: `ep-${ep.id}`,
          seasonNumber: Number(ep.season || seasonKey || 1),
          episodeNumber: Number(ep.episode_num || 1),
          title: ep.title || `Episódio ${ep.episode_num || 1}`,
          duration: ep.info?.duration || `${ep.info?.episode_run_time || 45} min`,
          synopsis: ep.info?.plot || undefined,
          stillUrl: normalizeTmdbImageUrl(ep.info?.movie_image || ep.info?.cover_big),
          streamUrl: `${cleanHost}/series/${params.username}/${params.password}/${ep.id}.${ext}`,
        });
      }
    }

    const actors = String(info.cast || info.actors || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const rawBackdrop = Array.isArray(info.backdrop_path)
      ? info.backdrop_path[0]
      : info.backdrop_path;

    const enriched = {
      tmdbId: Number(info.tmdb_id) || undefined,
      posterUrl: normalizeTmdbImageUrl(info.cover || info.cover_big),
      backdropUrl: normalizeTmdbImageUrl(rawBackdrop || info.cover_big || info.cover),
      synopsis: info.plot || info.description || undefined,
      director: info.director || undefined,
      actorsList: actors,
      genre: info.genre || undefined,
      rating: Number(info.rating) > 0 ? Number(Number(info.rating).toFixed(1)) : undefined,
      youtubeTrailerId: extractYoutubeId(info.youtube_trailer),
      episodes,
      firstEpisodeStreamUrl: episodes[0]?.streamUrl,
    };
    detailsCache.set(cacheKey, enriched);
    return enriched;
  }

  if (vodId) {
    const data = await fetchXtreamApiJson(`${authUrl}&action=get_vod_info&vod_id=${vodId}`);
    const info = data?.info || {};
    const movieData = data?.movie_data || {};
    const ext = movieData.container_extension || 'mp4';
    const resolvedMovieStreamUrl =
      matchedMovieStreamUrl ||
      `${cleanHost}/movie/${params.username}/${params.password}/${vodId}.${ext}`;

    const actors = String(info.actors || info.cast || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const rawBackdrop = Array.isArray(info.backdrop_path)
      ? info.backdrop_path[0]
      : info.backdrop_path;

    const enriched = {
      tmdbId: Number(info.tmdb_id) || undefined,
      posterUrl: normalizeTmdbImageUrl(info.movie_image || info.cover_big),
      backdropUrl: normalizeTmdbImageUrl(rawBackdrop || info.cover_big || info.movie_image),
      synopsis: info.plot || info.description || undefined,
      director: info.director || undefined,
      actorsList: actors,
      genre: info.genre || undefined,
      duration: info.duration || (info.episode_run_time ? `${info.episode_run_time} min` : undefined),
      rating: Number(info.rating) > 0 ? Number(Number(info.rating).toFixed(1)) : undefined,
      youtubeTrailerId: extractYoutubeId(info.youtube_trailer),
      firstEpisodeStreamUrl: resolvedMovieStreamUrl,
    };
    detailsCache.set(cacheKey, enriched);
    return enriched;
  }

  return null;
}
