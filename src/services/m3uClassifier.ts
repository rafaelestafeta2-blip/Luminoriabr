import type { Channel, VodItem } from '../types/luminoria.ts';
import { normalizeGenreAndMetadata } from './genreNormalizer.ts';

export interface RawM3UItem {
  name: string;
  url: string;
  epgId: string;
  groupName: string;
  logoUrl?: string;
}

export type M3UItemKind = 'live' | 'movie' | 'series';

/**
 * Classifies an M3U item into 'live' (TV ao vivo), 'movie' (Filme VOD) or 'series' (Série)
 * based on IPTV industry standards (Xtream codes, group-titles, extensions and regex).
 */
export function classifyM3UItem(item: RawM3UItem): M3UItemKind {
  const g = (item.groupName || '').toLowerCase();
  const n = (item.name || '').toLowerCase();
  const u = (item.url || '').toLowerCase();

  // 1. Series indicators
  const isSeriesUrl = u.includes('/series/');
  const isSeriesGroup =
    g.includes('série') ||
    g.includes('series') ||
    g.includes('temporada') ||
    g.includes('novela') ||
    g.includes('anime') ||
    g.includes('dorama');
  const isSeriesTitle =
    /s\d+e\d+/i.test(n) ||
    /t\d+e\d+/i.test(n) ||
    /\b(temp|temporada|ep|episodio)\b/i.test(n) ||
    /\b\d{1,2}x\d{1,2}\b/.test(n);

  if (isSeriesUrl || isSeriesGroup || isSeriesTitle) {
    return 'series';
  }

  // 2. Movie (VOD) indicators
  const isMovieUrl =
    u.includes('/movie/') ||
    u.endsWith('.mp4') ||
    u.endsWith('.mkv') ||
    u.endsWith('.avi');
  const isMovieGroup =
    g.includes('filme') ||
    g.includes('movie') ||
    g.includes('vod') ||
    g.includes('cinema') ||
    g.includes('lançamento') ||
    g.includes('4k uhd');

  if (isMovieUrl || isMovieGroup) {
    return 'movie';
  }

  // 3. Defaults to live TV (channels)
  return 'live';
}

/**
 * Converts a classified M3U movie or series into a rich VodItem
 */
export function convertM3UToVodItem(
  item: RawM3UItem,
  kind: 'movie' | 'series',
  index: number
): VodItem {
  const meta = normalizeGenreAndMetadata(item.groupName, item.name);
  const category = kind === 'series' ? 'SÉRIES' : meta.category;

  return {
    id: `m3u-${kind}-${index}-${Date.now().toString(36)}`,
    title: meta.cleanTitle || item.name,
    year: meta.year,
    duration: kind === 'series' ? 'Temporadas Completas' : '1h 55m',
    rating: 8.5,
    category,
    mediaType: kind,
    synopsis: `Conteúdo da lista M3U no grupo "${item.groupName}". Alta fidelidade de streaming.`,
    director: item.groupName || 'Streaming M3U',
    cast: [item.groupName, kind === 'series' ? 'Série' : 'Filme VOD'],
    streamUrl: item.url,
    artworkKey: 'cyber_odyssey',
    posterUrl: item.logoUrl,
    backdropUrl: item.logoUrl,
    rankPosition: index < 10 ? index + 1 : undefined,
  };
}

/**
 * Converts a classified M3U live item into a Channel
 */
export function convertM3UToChannel(
  item: RawM3UItem,
  playlistId: string,
  index: number
): Channel {
  return {
    id: `ch-m3u-${index}-${Date.now().toString(36)}`,
    name: item.name,
    epgId: item.epgId || item.name,
    groupName: item.groupName || 'Canais Gerais',
    url: item.url,
    sources: [item.url],
    playlistId,
    artworkVariant: item.groupName.toLowerCase().includes('esporte')
      ? 'sports'
      : item.groupName.toLowerCase().includes('notícia')
      ? 'news'
      : 'cinema',
    quality: item.name.toLowerCase().includes('4k')
      ? '4K UHD'
      : item.name.toLowerCase().includes('fhd')
      ? 'FHD 60fps'
      : 'HD',
    isLive: true,
    currentPrograms: [
      {
        id: `epg-live-${index}`,
        title: `Programação Ao Vivo: ${item.name}`,
        startTime: 'Ao Vivo',
        endTime: 'Contínuo',
        category: item.groupName,
        progress: 50,
      },
    ],
  };
}
