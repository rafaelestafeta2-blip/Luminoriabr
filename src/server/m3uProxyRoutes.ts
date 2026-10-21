import { Router, Request, Response } from 'express';
import { fetchM3uStream } from './m3uFetcher';
import { handleResolveStream, handleStreamProxy } from './streamProxy';
import { getOrLoadXtreamCatalog } from './xtreamCatalogService';
import {
  fetchXtreamMediaDetails,
  selectBalancedMovies,
  selectBalancedSeries,
} from './xtreamEnrichService';

export const m3uRouter = Router();

// 1. Direct Video Stream Proxy & Redirect Resolver
m3uRouter.get('/stream-proxy', handleStreamProxy);
m3uRouter.get('/resolve-stream', handleResolveStream);

/**
 * 2. Proxy for downloading M3U lists (supports up to 90MB / 300,000+ items)
 */
m3uRouter.get('/m3u-proxy', async (req: Request, res: Response) => {
  const targetUrl = req.query.url as string;
  const limitMb = Number(req.query.limitMb) || 85;

  if (!targetUrl) {
    return res.status(400).json({ error: 'Parâmetro url é obrigatório' });
  }

  try {
    const maxBytes = Math.min(Math.max(limitMb, 1), 95) * 1024 * 1024;
    const text = await fetchM3uStream(targetUrl, { maxBytes, timeoutMs: 45000 });

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache');

    return res.send(text);
  } catch (err: any) {
    console.error('Erro no proxy M3U:', err?.message || err);
    return res.status(502).json({
      error:
        err?.message ||
        'Falha ao conectar ou baixar a lista M3U. Verifique a URL e credenciais.',
    });
  }
});

/**
 * 3. Direct Xtream Codes API connector: authenticates and fetches full Live TV, VOD, and Series catalog
 */
m3uRouter.get('/xtream-connect', async (req: Request, res: Response) => {
  const {
    host = 'https://elitedns.xyz',
    username = 'Rafalaila',
    password = '1662167',
  } = req.query as {
    host?: string;
    username?: string;
    password?: string;
  };

  try {
    const catalog = await getOrLoadXtreamCatalog(host, username, password);

    const channels = catalog.allChannels.slice(0, 1200);
    const movies = selectBalancedMovies(catalog.allMovies, 2600);
    const series = selectBalancedSeries(catalog.allSeries, 1800);

    return res.json({
      ok: true,
      serverInfo: catalog.serverInfo,
      userInfo: catalog.userInfo,
      channels,
      movies,
      series,
      stats: {
        totalStreamsFound: catalog.totalStreamsCount,
        totalChannelsFound: catalog.allChannels.length,
        totalMoviesFound: catalog.allMovies.length,
        totalSeriesFound: catalog.allSeries.length,
        importedChannels: channels.length,
        importedMovies: movies.length,
        importedSeries: series.length,
      },
    });
  } catch (err: any) {
    console.error('Erro no xtream-connect:', err);
    return res.status(502).json({
      error: err?.message || 'Falha ao conectar à API do servidor Xtream.',
    });
  }
});

/**
 * 4. Full-Catalog Search & Paginated Category Filter across all 28,100 Movies, 9,513 Series, and 3,584 Live Channels
 */
m3uRouter.get('/xtream-search', async (req: Request, res: Response) => {
  const {
    host = 'https://elitedns.xyz',
    username = 'Rafalaila',
    password = '1662167',
    q = '',
    type = 'all',
    category = 'TODOS',
    offset = '0',
    limit = '120',
  } = req.query as Record<string, string>;

  try {
    const catalog = await getOrLoadXtreamCatalog(host, username, password);
    const query = q.trim().toLowerCase();
    const startOffset = Math.max(0, Number(offset) || 0);
    const maxItems = Math.min(Number(limit) || 120, 400);

    const matchCategory = (itemCat: string, rawCat?: string, year?: number) => {
      if (!category || category === 'TODOS') return true;
      const up = category.toUpperCase();
      if (up === 'LANÇAMENTOS' || up === 'NOVAS TEMPORADAS') {
        return (year && year >= 2025) || Boolean(rawCat && rawCat.toUpperCase().includes('LANÇAMENTO'));
      }
      return (
        itemCat.toUpperCase() === up ||
        itemCat.toUpperCase().includes(up) ||
        Boolean(rawCat && rawCat.toUpperCase().includes(up.split(' ')[0]))
      );
    };

    const filteredMoviesAll =
      type === 'all' || type === 'movie'
        ? catalog.allMovies
            .filter(
              (m) =>
                matchCategory(m.category, m.rawCategoryName, m.year) &&
                (!query ||
                  m.title.toLowerCase().includes(query) ||
                  (m.rawCategoryName && m.rawCategoryName.toLowerCase().includes(query)))
            )
            .sort((a, b) => (b.year || 2024) - (a.year || 2024))
        : [];

    const filteredSeriesAll =
      type === 'all' || type === 'series'
        ? catalog.allSeries
            .filter(
              (s) =>
                matchCategory(s.category, s.rawCategoryName, s.year) &&
                (!query ||
                  s.title.toLowerCase().includes(query) ||
                  (s.rawCategoryName && s.rawCategoryName.toLowerCase().includes(query)))
            )
            .sort((a, b) => (b.year || 2024) - (a.year || 2024))
        : [];

    const filteredChannelsAll =
      type === 'all' || type === 'live'
        ? catalog.allChannels.filter(
            (c) =>
              !query ||
              c.name.toLowerCase().includes(query) ||
              c.groupName.toLowerCase().includes(query)
          )
        : [];

    return res.json({
      ok: true,
      movies: filteredMoviesAll.slice(startOffset, startOffset + maxItems),
      series: filteredSeriesAll.slice(startOffset, startOffset + maxItems),
      channels: filteredChannelsAll.slice(startOffset, startOffset + maxItems),
      hasMoreMovies: startOffset + maxItems < filteredMoviesAll.length,
      hasMoreSeries: startOffset + maxItems < filteredSeriesAll.length,
      totals: {
        totalMovies: catalog.allMovies.length,
        totalSeries: catalog.allSeries.length,
        totalChannels: catalog.allChannels.length,
        totalStreams: catalog.totalStreamsCount,
        matchedMovies: filteredMoviesAll.length,
        matchedSeries: filteredSeriesAll.length,
      },
    });
  } catch (err: any) {
    return res.status(502).json({ error: err?.message || 'Erro na busca do catálogo.' });
  }
});

/**
 * 5. On-Demand TMDB Details, Cast, Synopsis, Trailer & Series Episodes Resolver
 */
m3uRouter.get('/xtream-details', async (req: Request, res: Response) => {
  const {
    host = 'https://elitedns.xyz',
    username = 'Rafalaila',
    password = '1662167',
    vodId,
    seriesId,
    title,
    mediaType,
  } = req.query as Record<string, string>;

  try {
    const details = await fetchXtreamMediaDetails({
      host,
      username,
      password,
      vodId: vodId ? Number(vodId) : undefined,
      seriesId: seriesId ? Number(seriesId) : undefined,
      title,
      mediaType: mediaType === 'series' ? 'series' : 'movie',
    });
    return res.json({ ok: true, details });
  } catch (err: any) {
    return res.status(200).json({ ok: false, details: null, error: err?.message });
  }
});

/**
 * 6. Live Channel EPG Resolver (fetches get_short_epg from Xtream server & decodes Base64 titles)
 */
m3uRouter.get('/xtream-epg', async (req: Request, res: Response) => {
  const {
    host = 'https://elitedns.xyz',
    username = 'Rafalaila',
    password = '1662167',
    streamId,
  } = req.query as Record<string, string>;

  if (!streamId) {
    return res.json({ ok: false, programs: [] });
  }

  try {
    const cleanHost = host.replace(/\/$/, '');
    const url = `${cleanHost}/player_api.php?username=${encodeURIComponent(
      username
    )}&password=${encodeURIComponent(password)}&action=get_short_epg&stream_id=${encodeURIComponent(
      streamId
    )}&limit=6`;

    const text = await fetchM3uStream(url, { maxBytes: 2 * 1024 * 1024, timeoutMs: 8000 });
    const data = JSON.parse(text);
    const listings = Array.isArray(data?.epg_listings) ? data.epg_listings : [];

    const decodeB64 = (val?: string) => {
      if (!val) return '';
      try {
        return Buffer.from(val, 'base64').toString('utf-8') || val;
      } catch {
        return val;
      }
    };

    const programs = listings.slice(0, 5).map((item: any, idx: number) => {
      const startStr = item.start ? String(item.start).slice(11, 16) : 'Ao Vivo';
      const endStr = item.end ? String(item.end).slice(11, 16) : 'Contínuo';
      return {
        id: `xt-epg-${streamId}-${idx}`,
        title: decodeB64(item.title) || 'Transmissão Ao Vivo',
        description: decodeB64(item.description) || 'Programação em tempo real via guia XMLTV.',
        startTime: startStr,
        endTime: endStr,
        category: 'Guia EPG Oficial',
        progress: idx === 0 ? 55 : 0,
        isLiveNow: idx === 0,
      };
    });

    return res.json({ ok: true, programs });
  } catch {
    return res.json({ ok: false, programs: [] });
  }
});

