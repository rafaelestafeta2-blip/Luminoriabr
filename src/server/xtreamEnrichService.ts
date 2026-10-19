import { fetchXtreamApiJson } from './m3uFetcher';
import {
  extractYoutubeId,
  getOrLoadXtreamCatalog,
  normalizeTmdbImageUrl,
} from './xtreamCatalogService';
import { SeriesEpisodeItem, VodItem } from '../types/luminoria';

const detailsCache = new Map<string, any>();

/**
 * Selects a balanced initial slice across all genres + newest releases so
 * every category row on HomeScreen and SeriesScreen is richly populated,
 * while keeping the DOM fast and responsive.
 */
export function selectBalancedMovies(allMovies: VodItem[], maxTotal: number = 1800): VodItem[] {
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
    'DISNEY+',
    'NETFLIX',
  ];

  // Pick up to 110 per category first so every filter and row has plenty of movies
  for (const cat of targetCategories) {
    let count = 0;
    for (const m of allMovies) {
      if (pickedIds.has(m.id)) continue;
      if (m.category === cat || (m.rawCategoryName && m.rawCategoryName.toUpperCase().includes(cat))) {
        pickedIds.add(m.id);
        result.push(m);
        count++;
        if (count >= 110) break;
      }
    }
  }

  // Fill remainder with newest releases
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

  // If no explicit ID was passed, try matching by title in the cached 37,613-item catalog
  if (!vodId && !seriesId && params.title) {
    try {
      const cat = await getOrLoadXtreamCatalog(cleanHost, params.username, params.password);
      const normTitle = params.title.toLowerCase().trim();
      if (params.mediaType === 'series') {
        const foundSer = cat.allSeries.find((s) => s.title.toLowerCase() === normTitle);
        if (foundSer?.xtreamSeriesId) seriesId = foundSer.xtreamSeriesId;
      } else {
        const foundMov = cat.allMovies.find((m) => m.title.toLowerCase() === normTitle);
        if (foundMov?.xtreamStreamId) vodId = foundMov.xtreamStreamId;
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
    };
    detailsCache.set(cacheKey, enriched);
    return enriched;
  }

  return null;
}
