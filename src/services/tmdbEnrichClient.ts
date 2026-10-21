import type { Channel, SeriesEpisodeItem, VodItem } from '../types/luminoria.ts';
import { buildApiUrl, isNativeAppRuntime } from './apiConfig';
import {
  fetchClientXtreamDetails,
  getClientXtreamCatalog,
} from './xtreamClientEngine';

const FALLBACK_TRAILERS: Record<string, string> = {
  'gladiador ii': '4rgYUipGJNo',
  'gladiador 2': '4rgYUipGJNo',
  'venom: a última rodada': '__2bjWbetsA',
  'venom': '__2bjWbetsA',
  'robô selvagem': '67vbA5ZJdKQ',
  'coringa: delírio a dois': '_OKAwz2MsJs',
  'coringa': '_OKAwz2MsJs',
  'sorria 2': '0HY6QFlBzUY',
  'os fantasmas ainda se divertem': 'CoZqL9N6Rx4',
  'transformers: o início': 'u2NuUWuwPCM',
  'transformers': 'u2NuUWuwPCM',
  'a substância': 'LNlrGhBpYjc',
  'duna: parte dois': 'Way9Dexny3w',
  'duna': 'Way9Dexny3w',
  'tulsa king': 'aaQSScwZPbA',
  'reacher': 'GSycMV-_Csw',
  'origem': 'pDHqAj4eJcM',
  'the boys': 'M1bhOaLV4FU',
  'breaking bad': 'HhesaQXLuRY',
  'arcane': 'fXmAurh012s',
};

export function getFallbackYoutubeTrailerId(title: string): string {
  const key = title.toLowerCase().trim();
  for (const [k, v] of Object.entries(FALLBACK_TRAILERS)) {
    if (key.includes(k)) return v;
  }
  return '4rgYUipGJNo';
}

export interface FullXtreamSyncResponse {
  ok: boolean;
  channels: Channel[];
  movies: VodItem[];
  series: VodItem[];
  stats: {
    totalStreamsFound: number;
    totalChannelsFound: number;
    totalMoviesFound: number;
    totalSeriesFound: number;
    importedChannels: number;
    importedMovies: number;
    importedSeries: number;
  };
}

export async function fetchOfficialEliteDnsCatalog(
  host: string = 'https://elitedns.xyz',
  username: string = 'Rafalaila',
  password: string = '1662167'
): Promise<FullXtreamSyncResponse | null> {
  // If running inside native Android APK, use direct native client engine
  if (isNativeAppRuntime()) {
    try {
      const cat = await getClientXtreamCatalog(host, username, password);
      return {
        ok: true,
        channels: cat.allChannels.slice(0, 1200),
        movies: cat.allMovies.slice(0, 2600),
        series: cat.allSeries.slice(0, 1800),
        stats: {
          totalStreamsFound: cat.totalStreamsCount,
          totalChannelsFound: cat.allChannels.length,
          totalMoviesFound: cat.allMovies.length,
          totalSeriesFound: cat.allSeries.length,
          importedChannels: Math.min(1200, cat.allChannels.length),
          importedMovies: Math.min(2600, cat.allMovies.length),
          importedSeries: Math.min(1800, cat.allSeries.length),
        },
      };
    } catch (err) {
      console.warn('Native client catalog sync error:', err);
    }
  }

  // Web backend route fallback
  try {
    const res = await fetch(
      buildApiUrl(
        `/api/xtream-connect?host=${encodeURIComponent(host)}&username=${encodeURIComponent(
          username
        )}&password=${encodeURIComponent(password)}`
      )
    );
    if (res.ok) {
      const data = await res.json();
      if (data && data.ok) return data as FullXtreamSyncResponse;
    }
  } catch {}

  // Fallback to client engine if backend fails
  try {
    const cat = await getClientXtreamCatalog(host, username, password);
    return {
      ok: true,
      channels: cat.allChannels.slice(0, 1200),
      movies: cat.allMovies.slice(0, 2600),
      series: cat.allSeries.slice(0, 1800),
      stats: {
        totalStreamsFound: cat.totalStreamsCount,
        totalChannelsFound: cat.allChannels.length,
        totalMoviesFound: cat.allMovies.length,
        totalSeriesFound: cat.allSeries.length,
        importedChannels: Math.min(1200, cat.allChannels.length),
        importedMovies: Math.min(2600, cat.allMovies.length),
        importedSeries: Math.min(1800, cat.allSeries.length),
      },
    };
  } catch {
    return null;
  }
}

export async function enrichVodWithTmdbDetails(vod: VodItem): Promise<VodItem> {
  const fallbackTrailer = vod.youtubeTrailerId || getFallbackYoutubeTrailerId(vod.title);

  const applyDetails = (d: any): VodItem => {
    if (!d) return { ...vod, youtubeTrailerId: fallbackTrailer };
    const actors: string[] =
      Array.isArray(d.actorsList) && d.actorsList.length > 0 ? d.actorsList : vod.actorsList || vod.cast;
    const episodes: SeriesEpisodeItem[] | undefined =
      Array.isArray(d.episodes) && d.episodes.length > 0 ? d.episodes : vod.episodes;
    const nextStream = d.firstEpisodeStreamUrl || vod.streamUrl;
    const hasReal = Boolean(nextStream && !nextStream.startsWith('lumin://'));

    return {
      ...vod,
      tmdbId: d.tmdbId || vod.tmdbId,
      posterUrl: d.posterUrl || vod.posterUrl,
      backdropUrl: d.backdropUrl || vod.backdropUrl || d.posterUrl || vod.posterUrl,
      synopsis: d.synopsis && d.synopsis.length > 10 ? d.synopsis : vod.synopsis,
      director: d.director || vod.director,
      cast: actors.length > 0 ? actors : vod.cast,
      actorsList: actors,
      duration: d.duration || vod.duration,
      rating: d.rating || vod.rating,
      youtubeTrailerId: d.youtubeTrailerId || fallbackTrailer,
      episodes,
      streamUrl: nextStream,
      hasM3uStream: hasReal ? true : vod.hasM3uStream,
      isComingSoon: hasReal ? false : vod.isComingSoon,
    };
  };

  if (isNativeAppRuntime()) {
    try {
      const details = await fetchClientXtreamDetails(vod.xtreamStreamId, vod.xtreamSeriesId);
      if (details) return applyDetails(details);
    } catch {}
  }

  try {
    const params = new URLSearchParams({
      title: vod.title,
      mediaType: vod.mediaType === 'series' ? 'series' : 'movie',
    });
    if (vod.xtreamStreamId) params.set('vodId', String(vod.xtreamStreamId));
    if (vod.xtreamSeriesId) params.set('seriesId', String(vod.xtreamSeriesId));

    const res = await fetch(buildApiUrl(`/api/xtream-details?${params.toString()}`));
    if (res.ok) {
      const json = await res.json();
      if (json?.details) return applyDetails(json.details);
    }
  } catch {}

  try {
    const details = await fetchClientXtreamDetails(vod.xtreamStreamId, vod.xtreamSeriesId);
    if (details) return applyDetails(details);
  } catch {}

  return { ...vod, youtubeTrailerId: fallbackTrailer };
}

export async function searchFullServerCatalog(params: {
  q?: string;
  type?: 'all' | 'movie' | 'series' | 'live';
  category?: string;
  offset?: number;
  limit?: number;
}): Promise<any | null> {
  try {
    const sp = new URLSearchParams({
      q: params.q || '',
      type: params.type || 'all',
      category: params.category || 'TODOS',
      offset: String(params.offset || 0),
      limit: String(params.limit || 120),
    });
    const res = await fetch(buildApiUrl(`/api/xtream-search?${sp.toString()}`));
    if (res.ok) {
      const data = await res.json();
      if (data && data.ok) return data;
    }
  } catch {}

  try {
    const cat = await getClientXtreamCatalog();
    const query = (params.q || '').toLowerCase().trim();
    const isMov = params.type === 'all' || params.type === 'movie';
    const isSer = params.type === 'all' || params.type === 'series';
    const isLiv = params.type === 'all' || params.type === 'live';

    return {
      ok: true,
      movies: isMov ? cat.allMovies.filter((m) => !query || m.title.toLowerCase().includes(query)).slice(0, 120) : [],
      series: isSer ? cat.allSeries.filter((s) => !query || s.title.toLowerCase().includes(query)).slice(0, 120) : [],
      channels: isLiv ? cat.allChannels.filter((c) => !query || c.name.toLowerCase().includes(query)).slice(0, 120) : [],
      totals: {
        totalMovies: cat.allMovies.length,
        totalSeries: cat.allSeries.length,
        totalChannels: cat.allChannels.length,
        totalStreams: cat.totalStreamsCount,
      },
    };
  } catch {
    return null;
  }
}
