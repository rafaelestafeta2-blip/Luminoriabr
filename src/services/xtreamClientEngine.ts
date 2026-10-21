import { Channel, SeriesEpisodeItem, VodItem } from '../types/luminoria';
import {
  extractMediaReleaseYear,
  normalizeGenreAndMetadata,
  normalizeSeriesGenre,
} from './genreNormalizer';
import { buildApiUrl } from './apiConfig';

interface CachedClientCatalog {
  timestamp: number;
  allChannels: Channel[];
  allMovies: VodItem[];
  allSeries: VodItem[];
  totalStreamsCount: number;
}

let clientCatalogCache: CachedClientCatalog | null = null;
const CACHE_TTL_MS = 25 * 60 * 1000;

export async function fetchJsonViaProxy(targetUrl: string): Promise<any> {
  const proxyUrl = buildApiUrl(`/api/m3u-proxy?url=${encodeURIComponent(targetUrl)}`);
  const res = await fetch(proxyUrl);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export async function getClientXtreamCatalog(
  host: string = 'https://elitedns.xyz',
  username: string = 'Rafalaila',
  password: string = '1662167'
): Promise<CachedClientCatalog> {
  if (clientCatalogCache && Date.now() - clientCatalogCache.timestamp < CACHE_TTL_MS) {
    return clientCatalogCache;
  }

  const cleanHost = host.replace(/\/$/, '');
  const authUrl = `${cleanHost}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;

  const [liveCats, vodCats, seriesCats, liveList, vodList, seriesList] = await Promise.all([
    fetchJsonViaProxy(`${authUrl}&action=get_live_categories`).catch(() => []),
    fetchJsonViaProxy(`${authUrl}&action=get_vod_categories`).catch(() => []),
    fetchJsonViaProxy(`${authUrl}&action=get_series_categories`).catch(() => []),
    fetchJsonViaProxy(`${authUrl}&action=get_live_streams`).catch(() => []),
    fetchJsonViaProxy(`${authUrl}&action=get_vod_streams`).catch(() => []),
    fetchJsonViaProxy(`${authUrl}&action=get_series`).catch(() => []),
  ]);

  const liveCatMap = new Map<string, string>();
  if (Array.isArray(liveCats)) {
    liveCats.forEach((c: any) => liveCatMap.set(String(c.category_id), c.category_name || 'TV Ao Vivo'));
  }
  const vodCatMap = new Map<string, string>();
  if (Array.isArray(vodCats)) {
    vodCats.forEach((c: any) => vodCatMap.set(String(c.category_id), c.category_name || 'Filmes'));
  }
  const seriesCatMap = new Map<string, string>();
  if (Array.isArray(seriesCats)) {
    seriesCats.forEach((c: any) => seriesCatMap.set(String(c.category_id), c.category_name || 'Séries'));
  }

  const allChannels: Channel[] = (Array.isArray(liveList) ? liveList : []).map((item: any, idx: number) => {
    const groupName = liveCatMap.get(String(item.category_id)) || item.category_name || 'TV Ao Vivo';
    const tsUrl = `${cleanHost}/live/${username}/${password}/${item.stream_id}.ts`;
    const hlsUrl = `${cleanHost}/live/${username}/${password}/${item.stream_id}.m3u8`;
    return {
      id: `xt-live-${item.stream_id || idx}`,
      name: item.name || 'Canal Ao Vivo',
      epgId: item.epg_channel_id || item.name || `epg-${idx}`,
      groupName,
      url: tsUrl,
      sources: [tsUrl, hlsUrl],
      playlistId: `pl-xt-${username}`,
      logoUrl: item.stream_icon,
      artworkVariant: /esporte|sport|premier|futebol/i.test(groupName + item.name) ? 'sports' : 'cinema',
      quality: /4k|uhd/i.test(item.name) ? '4K UHD' : 'FHD 60fps',
      isLive: true,
      currentPrograms: [
        {
          id: `epg-${item.stream_id || idx}`,
          title: `Transmissão Ao Vivo · ${item.name}`,
          startTime: 'Agora',
          endTime: 'Ao Vivo',
          category: groupName,
          progress: 50,
        },
      ],
    };
  });

  const allMovies: VodItem[] = (Array.isArray(vodList) ? vodList : []).map((item: any, idx: number) => {
    const rawCat = vodCatMap.get(String(item.category_id)) || item.category_name || 'FILMES';
    const rawTitle = item.name || item.title || 'Filme HD';
    const meta = normalizeGenreAndMetadata(rawCat, rawTitle, item.year || item.releaseDate);
    const ext = item.container_extension || 'mp4';
    return {
      id: `xt-vod-${item.stream_id || idx}`,
      xtreamStreamId: Number(item.stream_id) || undefined,
      title: meta.cleanTitle || rawTitle,
      year: meta.year,
      duration: '1h 58m',
      rating: Number(item.rating || 8.2) > 0 ? Number(Number(item.rating).toFixed(1)) : 8.2,
      category: meta.category,
      rawCategoryName: rawCat,
      mediaType: 'movie',
      synopsis: item.plot || `Assista a ${meta.cleanTitle || rawTitle} em alta definição.`,
      director: rawCat || 'Cinema HD',
      cast: [meta.category, rawCat, 'M3U Oficial'].filter(Boolean),
      streamUrl: `${cleanHost}/movie/${username}/${password}/${item.stream_id}.${ext}`,
      artworkKey: 'cyber_odyssey',
      posterUrl: item.stream_icon,
      backdropUrl: item.stream_icon,
      hasM3uStream: true,
      isComingSoon: false,
    };
  });

  const allSeries: VodItem[] = (Array.isArray(seriesList) ? seriesList : []).map((item: any, idx: number) => {
    const rawCat = seriesCatMap.get(String(item.category_id)) || item.category_name || 'SÉRIES';
    const rawTitle = item.name || item.title || 'Série HD';
    const meta = normalizeGenreAndMetadata(rawCat, rawTitle, item.releaseDate || item.year);
    const seriesGenre = normalizeSeriesGenre(rawCat, rawTitle, item.genre || '');
    const year = extractMediaReleaseYear(rawTitle, rawCat, item.releaseDate || item.year);
    return {
      id: `xt-ser-${item.series_id || idx}`,
      xtreamSeriesId: Number(item.series_id) || undefined,
      title: meta.cleanTitle || rawTitle,
      year,
      duration: 'Temporadas Completas',
      rating: Number(item.rating || 8.5) > 0 ? Number(Number(item.rating).toFixed(1)) : 8.5,
      category: seriesGenre,
      rawCategoryName: rawCat,
      mediaType: 'series',
      synopsis: item.plot || `Série completa disponível no catálogo (${rawCat}).`,
      director: rawCat || 'Série Original',
      cast: [seriesGenre, rawCat].filter(Boolean),
      streamUrl: `${cleanHost}/series/${username}/${password}/${item.series_id}.mp4`,
      artworkKey: 'tulsa_king',
      posterUrl: item.cover,
      backdropUrl: item.cover,
      hasM3uStream: true,
      isComingSoon: false,
    };
  });

  clientCatalogCache = {
    timestamp: Date.now(),
    allChannels,
    allMovies,
    allSeries,
    totalStreamsCount: allChannels.length + allMovies.length + Math.round(allSeries.length * 28.4),
  };
  return clientCatalogCache;
}

export async function fetchClientXtreamDetails(
  vodId?: number,
  seriesId?: number,
  host: string = 'https://elitedns.xyz',
  username: string = 'Rafalaila',
  password: string = '1662167'
): Promise<any> {
  const cleanHost = host.replace(/\/$/, '');
  const authUrl = `${cleanHost}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;

  if (seriesId) {
    const data = await fetchJsonViaProxy(`${authUrl}&action=get_series_info&series_id=${seriesId}`);
    const info = data?.info || {};
    const episodesObj = data?.episodes || {};
    const episodes: SeriesEpisodeItem[] = [];

    for (const sKey of Object.keys(episodesObj)) {
      const epList = Array.isArray(episodesObj[sKey]) ? episodesObj[sKey] : [];
      for (const ep of epList) {
        const ext = ep.container_extension || 'mp4';
        episodes.push({
          id: `ep-${ep.id}`,
          seasonNumber: Number(ep.season || sKey || 1),
          episodeNumber: Number(ep.episode_num || 1),
          title: ep.title || `Episódio ${ep.episode_num || 1}`,
          duration: ep.info?.duration || '45 min',
          synopsis: ep.info?.plot,
          stillUrl: ep.info?.movie_image || ep.info?.cover_big,
          streamUrl: `${cleanHost}/series/${username}/${password}/${ep.id}.${ext}`,
        });
      }
    }
    return {
      tmdbId: Number(info.tmdb_id) || undefined,
      posterUrl: info.cover || info.cover_big,
      backdropUrl: info.cover_big || info.cover,
      synopsis: info.plot || info.description,
      director: info.director,
      actorsList: String(info.cast || '').split(',').map((s) => s.trim()).filter(Boolean),
      rating: Number(info.rating) || undefined,
      episodes,
      firstEpisodeStreamUrl: episodes[0]?.streamUrl,
    };
  }

  if (vodId) {
    const data = await fetchJsonViaProxy(`${authUrl}&action=get_vod_info&vod_id=${vodId}`);
    const info = data?.info || {};
    const movieData = data?.movie_data || {};
    const ext = movieData.container_extension || 'mp4';
    return {
      tmdbId: Number(info.tmdb_id) || undefined,
      posterUrl: info.movie_image || info.cover_big,
      backdropUrl: info.cover_big || info.movie_image,
      synopsis: info.plot || info.description,
      director: info.director,
      actorsList: String(info.actors || info.cast || '').split(',').map((s) => s.trim()).filter(Boolean),
      duration: info.duration,
      rating: Number(info.rating) || undefined,
      firstEpisodeStreamUrl: `${cleanHost}/movie/${username}/${password}/${vodId}.${ext}`,
    };
  }
  return null;
}
