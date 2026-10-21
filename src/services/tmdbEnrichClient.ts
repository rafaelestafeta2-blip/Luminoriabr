import type { Channel, SeriesEpisodeItem, VodItem } from '../types/luminoria.ts';

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
  'capital humano': 'PJn01e2Qs00',
  'contra o relógio': '6ZfuNTqbHE8',
  'homem-aranha: um novo dia': 'JfVOs4VSpmA',
  'sully: o herói do rio hudson': 'mjKEXxO2KNE',
  'a hora do mal': 'b9EkMc79ZSU',
  'controle absoluto': '8hP9D6kZseM',
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
  return '4rgYUipGJNo'; // Official Cinema 4K Trailer fallback
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
  try {
    const res = await fetch(
      `/api/xtream-connect?host=${encodeURIComponent(host)}&username=${encodeURIComponent(
        username
      )}&password=${encodeURIComponent(password)}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.ok) {
      return data as FullXtreamSyncResponse;
    }
  } catch (err) {
    console.warn('Falha ao sincronizar catálogo Xtream completo:', err);
  }
  return null;
}

export async function enrichVodWithTmdbDetails(vod: VodItem): Promise<VodItem> {
  try {
    const params = new URLSearchParams({
      title: vod.title,
      mediaType: vod.mediaType === 'series' ? 'series' : 'movie',
    });
    if (vod.xtreamStreamId) params.set('vodId', String(vod.xtreamStreamId));
    if (vod.xtreamSeriesId) params.set('seriesId', String(vod.xtreamSeriesId));

    const res = await fetch(`/api/xtream-details?${params.toString()}`);
    if (!res.ok) {
      return {
        ...vod,
        youtubeTrailerId: vod.youtubeTrailerId || getFallbackYoutubeTrailerId(vod.title),
      };
    }

    const json = await res.json();
    const d = json?.details;
    if (!d) {
      return {
        ...vod,
        youtubeTrailerId: vod.youtubeTrailerId || getFallbackYoutubeTrailerId(vod.title),
      };
    }

    const actors: string[] =
      Array.isArray(d.actorsList) && d.actorsList.length > 0
        ? d.actorsList
        : vod.actorsList || vod.cast;

    const episodes: SeriesEpisodeItem[] | undefined =
      Array.isArray(d.episodes) && d.episodes.length > 0 ? d.episodes : vod.episodes;

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
      youtubeTrailerId:
        d.youtubeTrailerId || vod.youtubeTrailerId || getFallbackYoutubeTrailerId(vod.title),
      episodes,
      streamUrl: d.firstEpisodeStreamUrl || vod.streamUrl,
    };
  } catch {
    return {
      ...vod,
      youtubeTrailerId: vod.youtubeTrailerId || getFallbackYoutubeTrailerId(vod.title),
    };
  }
}

export async function searchFullServerCatalog(params: {
  q?: string;
  type?: 'all' | 'movie' | 'series' | 'live';
  category?: string;
  offset?: number;
  limit?: number;
}): Promise<{
  movies: VodItem[];
  series: VodItem[];
  channels: Channel[];
  hasMoreMovies?: boolean;
  hasMoreSeries?: boolean;
  totals?: {
    totalMovies: number;
    totalSeries: number;
    totalChannels: number;
    totalStreams: number;
    matchedMovies?: number;
    matchedSeries?: number;
  };
} | null> {
  try {
    const sp = new URLSearchParams({
      q: params.q || '',
      type: params.type || 'all',
      category: params.category || 'TODOS',
      offset: String(params.offset || 0),
      limit: String(params.limit || 120),
    });
    const res = await fetch(`/api/xtream-search?${sp.toString()}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.ok) return data;
  } catch {}
  return null;
}

