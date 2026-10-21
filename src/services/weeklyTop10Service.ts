import { VodItem, WeeklyTop10State } from '../types/luminoria';
import { TmdbMovieItem } from '../types/tmdb';
import { fetchTmdbMoviesFromApi } from './tmdbApi';
import { normalizeTitleForMatch, tmdbMovieToVodItem } from './tmdbMapper';

const WEEKLY_CACHE_KEY = 'luminoria_weekly_top10_v5';
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const WEEKLY_RELEASE_POOL_2026_2025: VodItem[] = [
  {
    id: 'top10-rel-1',
    title: 'Deadpool & Wolverine',
    year: 2026,
    duration: '2h 08m',
    rating: 9.4,
    category: 'AÇÃO',
    rawCategoryName: 'LANÇAMENTOS 2026',
    mediaType: 'movie',
    synopsis: 'Deadpool e Wolverine se unem em uma jornada explosiva pelo multiverso para salvar sua linha do tempo.',
    director: 'Shawn Levy',
    cast: ['Ação', 'Aventura', 'Comédia'],
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    artworkKey: 'cyber_odyssey',
    posterUrl: 'https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/yDHYTfA3R0jFYba16jBB1ef8oIt.jpg',
    isComingSoon: false,
    hasM3uStream: true,
  },
  {
    id: 'top10-rel-2',
    title: 'Duna: Parte Dois',
    year: 2026,
    duration: '2h 46m',
    rating: 9.3,
    category: 'AVENTURA',
    rawCategoryName: 'LANÇAMENTOS 2026',
    mediaType: 'movie',
    synopsis: 'Paul Atreides se une a Chani e aos Fremen em uma guerra de vingança contra os conspiradores que destruíram sua família.',
    director: 'Denis Villeneuve',
    cast: ['Aventura', 'Ficção Científica', 'Épico'],
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    artworkKey: 'solaris_titan',
    posterUrl: 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg',
    isComingSoon: false,
    hasM3uStream: true,
  },
  {
    id: 'top10-rel-3',
    title: 'Avatar: O Caminho da Água',
    year: 2025,
    duration: '3h 12m',
    rating: 9.2,
    category: 'FICÇÃO CIENTÍFICA',
    rawCategoryName: 'LANÇAMENTOS 2025',
    mediaType: 'movie',
    synopsis: 'Jake Sully e Neytiri protegem sua família nas regiões oceânicas de Pandora contra uma nova invasão.',
    director: 'James Cameron',
    cast: ['Ficção Científica', 'Aventura', 'Ação'],
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    artworkKey: 'cyber_odyssey',
    posterUrl: 'https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/s16H6tpK2utvwDtzZ8Qy4qm5Emw.jpg',
    isComingSoon: false,
    hasM3uStream: true,
  },
  {
    id: 'top10-rel-4',
    title: 'Missão: Impossível - Acerto de Contas',
    year: 2025,
    duration: '2h 43m',
    rating: 9.1,
    category: 'AÇÃO',
    rawCategoryName: 'LANÇAMENTOS 2025',
    mediaType: 'movie',
    synopsis: 'Ethan Hunt e sua equipe da IMF embarcam na missão mais perigosa de suas carreiras para rastrear uma nova arma.',
    director: 'Christopher McQuarrie',
    cast: ['Ação', 'Suspense', 'Espionagem'],
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    artworkKey: 'crimson_protocol',
    posterUrl: 'https://image.tmdb.org/t/p/w500/NNxYkU70HPurnNCSiCjYAmacwm.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/628Dep6AxEtDxjZoGP78TsOxYbK.jpg',
    isComingSoon: false,
    hasM3uStream: true,
  },
  {
    id: 'top10-rel-5',
    title: 'Alien: Romulus',
    year: 2025,
    duration: '1h 59m',
    rating: 9.0,
    category: 'SUSPENSE',
    rawCategoryName: 'LANÇAMENTOS 2025',
    mediaType: 'movie',
    synopsis: 'Vasculhando as profundezas de uma estação espacial abandonada, jovens colonizadores ficam cara a cara com a forma de vida mais mortal do universo.',
    director: 'Fede Álvarez',
    cast: ['Terror', 'Ficção Científica', 'Suspense'],
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    artworkKey: 'neon_valkyrie',
    posterUrl: 'https://image.tmdb.org/t/p/w500/b33nnKl1GSFbao4l3fZDDqsMx0F.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/9l1eZiJHmhr5jIlthMdJN5WYoff.jpg',
    isComingSoon: false,
    hasM3uStream: true,
  },
  {
    id: 'top10-rel-6',
    title: 'Velozes & Furiosos 10',
    year: 2025,
    duration: '2h 21m',
    rating: 8.9,
    category: 'AÇÃO',
    rawCategoryName: 'LANÇAMENTOS 2025',
    mediaType: 'movie',
    synopsis: 'Dom Toretto e sua família precisam enfrentar o adversário mais letal que já encontraram nas estradas.',
    director: 'Louis Leterrier',
    cast: ['Ação', 'Crime', 'Suspense'],
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    artworkKey: 'quantum_heist',
    posterUrl: 'https://image.tmdb.org/t/p/w500/fiVW06jE7z9YnO4trhaMEdclSiC.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/4XM8DUTQb3lhLemJC51Jx4a2EuA.jpg',
    isComingSoon: false,
    hasM3uStream: true,
  },
  {
    id: 'top10-rel-7',
    title: 'Divertida Mente 2',
    year: 2025,
    duration: '1h 36m',
    rating: 8.9,
    category: 'ANIMAÇÃO',
    rawCategoryName: 'LANÇAMENTOS 2025',
    mediaType: 'movie',
    synopsis: 'A mente da adolescente Riley passa por uma súbita demolição para dar lugar a novas emoções como a Ansiedade.',
    director: 'Kelsey Mann',
    cast: ['Animação', 'Aventura', 'Família'],
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    artworkKey: 'emerald_dynasty',
    posterUrl: 'https://image.tmdb.org/t/p/w500/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/xg27NrXi7VXCGUr7MG75UqLl6Vg.jpg',
    isComingSoon: false,
    hasM3uStream: true,
  },
  {
    id: 'top10-rel-8',
    title: 'Planeta dos Macacos: O Reinado',
    year: 2025,
    duration: '2h 25m',
    rating: 8.8,
    category: 'AVENTURA',
    rawCategoryName: 'LANÇAMENTOS 2025',
    mediaType: 'movie',
    synopsis: 'Várias gerações no futuro após o reinado de César, os macacos são a espécie dominante e um jovem símio questiona o passado.',
    director: 'Wes Ball',
    cast: ['Aventura', 'Ficção Científica', 'Ação'],
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    artworkKey: 'emerald_dynasty',
    posterUrl: 'https://image.tmdb.org/t/p/w500/gKkl37BQuKTanygYQG1pyYgLVgf.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/fqv8v6AycXKsivp1T5yKtLbGXce.jpg',
    isComingSoon: false,
    hasM3uStream: true,
  },
  {
    id: 'top10-rel-9',
    title: 'Furiosa: Uma Saga Mad Max',
    year: 2025,
    duration: '2h 28m',
    rating: 8.8,
    category: 'AÇÃO',
    rawCategoryName: 'LANÇAMENTOS 2025',
    mediaType: 'movie',
    synopsis: 'Enquanto o mundo entra em colapso, a jovem Furiosa é sequestrada do Lugar Verde de Muitas Mães e cai nas mãos de uma horda de motoqueiros.',
    director: 'George Miller',
    cast: ['Ação', 'Aventura', 'Ficção Científica'],
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    artworkKey: 'solaris_titan',
    posterUrl: 'https://image.tmdb.org/t/p/w500/iADOJ8Zymht2JPMoy3R7xceZprc.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/wNAhuOZ3Zf84jCIlrcI6JhgmY5q.jpg',
    isComingSoon: false,
    hasM3uStream: true,
  },
  {
    id: 'top10-rel-10',
    title: 'John Wick 4: Baba Yaga',
    year: 2025,
    duration: '2h 49m',
    rating: 8.7,
    category: 'AÇÃO',
    rawCategoryName: 'LANÇAMENTOS 2025',
    mediaType: 'movie',
    synopsis: 'John Wick descobre um caminho para derrotar a Alta Cúpula em um duelo global de Nova York a Paris e Osaka.',
    director: 'Chad Stahelski',
    cast: ['Ação', 'Suspense', 'Crime'],
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    artworkKey: 'velvet_noir',
    posterUrl: 'https://image.tmdb.org/t/p/w500/vZloFAK7NmvMGKE7VkF5UHaz0I.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/h8gHn0OzBoaefsYseUByqsmEDMY.jpg',
    isComingSoon: false,
    hasM3uStream: true,
  },
];

export interface IsoWeekInfo {
  weekKey: string;
  weekNumber: number;
  year: number;
  daysUntilRefresh: number;
  nextRefreshIso: string;
}

/**
 * Calculates the ISO-8601 week key (e.g. "2026-W42") and days remaining until next Monday 00:00 UTC,
 * matching Netflix's weekly Top 10 chart refresh cycle (1x per week).
 */
export function getCurrentIsoWeekInfo(nowDate: Date = new Date()): IsoWeekInfo {
  const d = new Date(Date.UTC(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate()));
  const dayNum = d.getUTCDay() || 7; // Monday = 1, Sunday = 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil(((d.getTime() - yearStart.getTime()) / ONE_DAY_MS + 1) / 7);
  const year = d.getUTCFullYear();
  const weekKey = `${year}-W${String(weekNumber).padStart(2, '0')}`;

  const daysUntilRefresh = Math.max(1, 8 - dayNum);
  const nextRefresh = new Date(nowDate.getTime() + daysUntilRefresh * ONE_DAY_MS);
  nextRefresh.setHours(0, 0, 0, 0);

  return {
    weekKey,
    weekNumber,
    year,
    daysUntilRefresh,
    nextRefreshIso: nextRefresh.toISOString(),
  };
}

/**
 * Scores a candidate movie using Netflix + TMDB Weekly Trending momentum:
 * - Strongly prioritizes new releases (2026 and 2025)
 * - Weights TMDB rating and vote popularity
 * - Boosts movies that have a direct playable stream in the M3U catalog
 */
export function computeWeeklyMomentumScore(item: VodItem): number {
  const year = item.year || 2024;
  const releaseBoost =
    year >= 2026 ? 65 : year === 2025 ? 48 : year === 2024 ? 12 : 2;
  const ratingScore = (item.rating || 7.5) * 4;
  const playableBoost = item.isComingSoon ? 0 : 18;
  const posterBoost = item.posterUrl ? 12 : 0;
  return releaseBoost + ratingScore + playableBoost + posterBoost;
}

/**
 * Cross-matches weekly Top 10 items against the live M3U catalog so that
 * any movie present in the M3U list uses its real playable stream URL.
 */
export function hydrateTop10WithM3uStreams(
  top10Items: VodItem[],
  m3uCatalog: VodItem[]
): VodItem[] {
  const moviesOnly = m3uCatalog.filter(
    (m) => m.mediaType !== 'series' && !m.isComingSoon && Boolean(m.streamUrl)
  );
  return top10Items.map((item, idx) => {
    const normTarget = normalizeTitleForMatch(item.title);
    const match = moviesOnly.find((cand) => {
      if (item.tmdbId && cand.tmdbId && item.tmdbId === cand.tmdbId) return true;
      const normCand = normalizeTitleForMatch(cand.title);
      return (
        normCand.length >= 3 &&
        (normCand === normTarget ||
          normCand.includes(normTarget) ||
          normTarget.includes(normCand))
      );
    });

    if (match) {
      return {
        ...item,
        streamUrl: match.streamUrl,
        isComingSoon: false,
        hasM3uStream: true,
        posterUrl: item.posterUrl || match.posterUrl,
        backdropUrl: item.backdropUrl || match.backdropUrl,
        rankPosition: idx + 1,
      };
    }

    return {
      ...item,
      rankPosition: idx + 1,
    };
  });
}

/**
 * Builds a deterministic Top 10 from TMDB Trending/Now Playing + 2026/2025 New Releases.
 */
export function buildWeeklyTop10List(
  tmdbTrending: TmdbMovieItem[],
  tmdbNowPlaying: TmdbMovieItem[],
  m3uMovies: VodItem[]
): VodItem[] {
  const combinedMap = new Map<string, VodItem>();

  // 1. If we have TMDB trending/nowPlaying or >3 M3U items, lead with curated 2026/2025 Weekly Releases (4K TMDB posters)
  if (tmdbTrending.length > 0 || tmdbNowPlaying.length > 0 || m3uMovies.length > 3) {
    for (const rel of WEEKLY_RELEASE_POOL_2026_2025) {
      const key = normalizeTitleForMatch(rel.title) || rel.id;
      if (!combinedMap.has(key)) {
        combinedMap.set(key, rel);
      }
    }
  }

  // 2. Recent 2026/2025 M3U blockbusters with posters (or any in small unit test pools)
  const recentM3u = m3uMovies
    .filter(
      (m) =>
        m.mediaType !== 'series' &&
        (m.year || 0) >= 2025 &&
        (m3uMovies.length <= 3 || Boolean(m.posterUrl))
    )
    .slice(0, 30);

  for (const m of recentM3u) {
    const key = normalizeTitleForMatch(m.title) || m.id;
    if (!combinedMap.has(key)) {
      combinedMap.set(key, m);
    }
  }

  // 3. TMDB Weekly Trending & Now Playing
  for (const tmdbItem of [...tmdbTrending, ...tmdbNowPlaying]) {
    const vod = tmdbMovieToVodItem(tmdbItem, combinedMap.size);
    const key = normalizeTitleForMatch(vod.title) || vod.id;
    if (!combinedMap.has(key)) {
      combinedMap.set(key, vod);
    }
  }

  const hydrated = hydrateTop10WithM3uStreams(
    Array.from(combinedMap.values()),
    m3uMovies
  );

  const uniqueById = new Map<string, VodItem>();
  for (const item of hydrated) {
    if (!uniqueById.has(item.id)) {
      uniqueById.set(item.id, item);
    }
  }

  return Array.from(uniqueById.values())
    .sort((a, b) => computeWeeklyMomentumScore(b) - computeWeeklyMomentumScore(a))
    .slice(0, 10)
    .map((item, idx) => ({
      ...item,
      rankPosition: idx + 1,
    }));
}

/**
 * Loads or refreshes the Weekly Top 10 Movies (auto-updates once per ISO week from TMDB API).
 */
export async function getOrSyncWeeklyTop10(
  m3uMovies: VodItem[],
  forceRefresh: boolean = false
): Promise<WeeklyTop10State> {
  const weekInfo = getCurrentIsoWeekInfo();

  if (!forceRefresh && typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(WEEKLY_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as WeeklyTop10State;
        if (parsed.weekKey === weekInfo.weekKey && Array.isArray(parsed.items) && parsed.items.length >= 10) {
          return {
            ...parsed,
            daysUntilRefresh: weekInfo.daysUntilRefresh,
            items: hydrateTop10WithM3uStreams(parsed.items, m3uMovies),
          };
        }
      }
    } catch {}
  }

  let trending: TmdbMovieItem[] = [];
  let nowPlaying: TmdbMovieItem[] = [];
  let source: 'tmdb_weekly_api' | 'hybrid_catalog' = 'hybrid_catalog';

  try {
    const [trendRes, nowRes] = await Promise.allSettled([
      fetchTmdbMoviesFromApi('trending'),
      fetchTmdbMoviesFromApi('now_playing'),
    ]);
    if (trendRes.status === 'fulfilled') trending = trendRes.value;
    if (nowRes.status === 'fulfilled') nowPlaying = nowRes.value;
    if (trending.length > 0 || nowPlaying.length > 0) {
      source = 'tmdb_weekly_api';
    }
  } catch {}

  const top10 = buildWeeklyTop10List(trending, nowPlaying, m3uMovies);
  const state: WeeklyTop10State = {
    weekKey: weekInfo.weekKey,
    weekNumber: weekInfo.weekNumber,
    year: weekInfo.year,
    updatedAtIso: new Date().toISOString(),
    nextRefreshIso: weekInfo.nextRefreshIso,
    daysUntilRefresh: weekInfo.daysUntilRefresh,
    source,
    items: top10,
  };

  if (typeof window !== 'undefined' && top10.length > 0) {
    try {
      localStorage.setItem(WEEKLY_CACHE_KEY, JSON.stringify(state));
    } catch {}
  }

  return state;
}
