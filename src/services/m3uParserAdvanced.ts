import type { Channel, VodItem } from '../types/luminoria.ts';
import {
  classifyM3UItem,
  convertM3UToChannel,
  convertM3UToVodItem,
  type RawM3UItem,
} from './m3uClassifier.ts';
import { buildApiUrl } from './apiConfig';

export interface UnifiedM3UResult {
  playlistName: string;
  epgUrl?: string;
  channels: Channel[];
  movies: VodItem[];
  series: VodItem[];
  stats: {
    totalParsed: number;
    liveChannelsCount: number;
    moviesCount: number;
    seriesCount: number;
    uniqueGroups: string[];
  };
}

/**
 * High-performance parser that parses M3U playlists and automatically
 * separates them into Live TV, Movies and Series.
 */
export function parseUnifiedM3U(
  content: string,
  playlistName: string = 'Lista M3U Importada',
  playlistId?: string
): UnifiedM3UResult {
  const plId = playlistId || `pl-${Date.now()}`;
  const lines = content.split(/\r?\n/);

  let epgUrl: string | undefined;
  const rawItems: RawM3UItem[] = [];
  const groupsSet = new Set<string>();

  let pendingMeta: {
    name: string;
    epgId: string;
    groupName: string;
    logoUrl?: string;
  } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.toUpperCase().startsWith('#EXTM3U')) {
      const match = line.match(/(?:x-tvg-url|url-tvg)=["']([^"']+)["']/i);
      if (match && match[1]) {
        epgUrl = match[1].split(',')[0].trim();
      }
      continue;
    }

    if (line.startsWith('#EXTINF:')) {
      const commaIdx = line.lastIndexOf(',');
      const name = commaIdx !== -1 ? line.slice(commaIdx + 1).trim() : 'Canal Sem Nome';
      const attrPart = commaIdx !== -1 ? line.slice(8, commaIdx) : line.slice(8);

      const getAttr = (key: string): string | undefined => {
        const regex = new RegExp(`${key}=["']([^"']+)["']`, 'i');
        const m = attrPart.match(regex);
        return m ? m[1].trim() : undefined;
      };

      const epgId = getAttr('tvg-id') || getAttr('tvg-name') || name;
      const groupName = getAttr('group-title') || getAttr('tvg-group') || 'Geral';
      const logoUrl = getAttr('tvg-logo') || getAttr('logo');

      groupsSet.add(groupName);
      pendingMeta = { name, epgId, groupName, logoUrl };
      continue;
    }

    if (!line.startsWith('#') && /^(https?|rtmp|rtsp|mms):\/\//i.test(line)) {
      const meta = pendingMeta || {
        name: `Transmissão ${rawItems.length + 1}`,
        epgId: `stream-${rawItems.length + 1}`,
        groupName: 'Geral',
      };
      rawItems.push({
        name: meta.name,
        epgId: meta.epgId,
        groupName: meta.groupName,
        logoUrl: meta.logoUrl,
        url: line,
      });
      pendingMeta = null;
    }
  }

  const channels: Channel[] = [];
  const movies: VodItem[] = [];
  const series: VodItem[] = [];

  rawItems.forEach((raw, idx) => {
    const kind = classifyM3UItem(raw);
    if (kind === 'live') {
      channels.push(convertM3UToChannel(raw, plId, idx));
    } else if (kind === 'movie') {
      movies.push(convertM3UToVodItem(raw, 'movie', idx));
    } else {
      series.push(convertM3UToVodItem(raw, 'series', idx));
    }
  });

  return {
    playlistName,
    epgUrl,
    channels,
    movies,
    series,
    stats: {
      totalParsed: rawItems.length,
      liveChannelsCount: channels.length,
      moviesCount: movies.length,
      seriesCount: series.length,
      uniqueGroups: Array.from(groupsSet),
    },
  };
}

/**
 * Extracts Xtream Codes credentials (host, username, password) from standard IPTV URLs
 */
export function extractXtreamCredentials(url: string): {
  host: string;
  username: string;
  password: string;
} | null {
  try {
    const parsed = new URL(url.trim());
    const username = parsed.searchParams.get('username');
    const password = parsed.searchParams.get('password');
    if (username && password) {
      return {
        host: `${parsed.protocol}//${parsed.host}`,
        username,
        password,
      };
    }
  } catch {}
  return null;
}

/**
 * Fetches an M3U playlist using backend proxy to bypass CORS & self-signed SSL certs
 */
export async function fetchM3UFromUrl(url: string): Promise<string> {
  const proxyUrl = buildApiUrl(`/api/m3u-proxy?url=${encodeURIComponent(url.trim())}`);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 40000);

  try {
    const res = await fetch(proxyUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      let serverErr = '';
      try {
        const json = await res.json();
        serverErr = json?.error;
      } catch {}
      throw new Error(
        serverErr || `Servidor IPTV retornou status ${res.status}. Verifique se o link está ativo.`
      );
    }
    return await res.text();
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error(
        'Tempo limite excedido ao baixar a lista M3U (servidor IPTV demorou mais de 40s para responder).'
      );
    }
    throw new Error(err.message || 'Erro ao conectar à URL da lista M3U.');
  }
}

/**
 * Connects directly to Xtream API if link contains username and password
 */
export async function tryXtreamConnectFromUrl(url: string): Promise<any | null> {
  const creds = extractXtreamCredentials(url);
  if (!creds) return null;

  try {
    const res = await fetch(
      buildApiUrl(
        `/api/xtream-connect?host=${encodeURIComponent(creds.host)}&username=${encodeURIComponent(
          creds.username
        )}&password=${encodeURIComponent(creds.password)}`
      )
    );
    if (res.ok) {
      return await res.json();
    }
  } catch {}
  return null;
}

/**
 * Reads an M3U file using FileReader without blocking the UI
 */
export function readM3UFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Erro ao ler arquivo da lista M3U.'));
    reader.readAsText(file);
  });
}
