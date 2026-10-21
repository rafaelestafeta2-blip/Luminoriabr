import { ArtworkVariantKey, TimelineEntry } from '../types/luminoria';

export interface TimelineStorageRecord {
  id: string;
  vodId: string;
  title: string;
  year: number;
  artworkKey: ArtworkVariantKey;
  category: string;
  watchPercent: number;
  createdAtIso: string;
}

const TIMELINE_STORAGE_PREFIX = 'luminoria_timeline_v2_';
export const MIN_TIMELINE_WATCH_PERCENT = 20;

export function formatTimeAgo(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'Agora mesmo';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `Há ${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `Há ${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Ontem';
  if (diffDays < 30) return `Há ${diffDays} d`;
  return new Date(isoDate).toLocaleDateString('pt-BR');
}

export function hasWatchedMinimum20Percent(
  currentTimeSec: number,
  durationSec: number
): { qualified: boolean; percent: number } {
  if (!Number.isFinite(currentTimeSec) || currentTimeSec <= 0) {
    return { qualified: false, percent: 0 };
  }
  const effectiveDuration =
    Number.isFinite(durationSec) && durationSec > 0 ? durationSec : 120;
  const pct = Math.min(100, Math.round((currentTimeSec / effectiveDuration) * 100));
  return {
    qualified: pct >= MIN_TIMELINE_WATCH_PERCENT,
    percent: pct,
  };
}

export function loadUserTimeline(userId: string = 'me'): TimelineEntry[] {
  if (typeof window === 'undefined' || !userId) return [];
  try {
    const raw = localStorage.getItem(`${TIMELINE_STORAGE_PREFIX}${userId}`);
    if (!raw) return [];
    const records = JSON.parse(raw) as TimelineStorageRecord[];
    if (!Array.isArray(records)) return [];
    return records
      .filter((r) => (r.watchPercent ?? 0) >= MIN_TIMELINE_WATCH_PERCENT)
      .map((r) => ({
        id: r.id,
        vodId: r.vodId,
        title: r.title,
        year: r.year,
        artworkKey: r.artworkKey,
        category: r.category,
        watchPercent: r.watchPercent,
        timeAgo: formatTimeAgo(r.createdAtIso),
      }));
  } catch {
    return [];
  }
}

export function recordTimelineActivity(
  userId: string,
  entry: {
    vodId: string;
    title: string;
    year: number;
    artworkKey: ArtworkVariantKey;
    category: string;
    watchPercent?: number;
  }
): TimelineEntry[] {
  const pct = Math.min(100, Math.round(entry.watchPercent ?? 20));
  if (pct < MIN_TIMELINE_WATCH_PERCENT) {
    return loadUserTimeline(userId);
  }
  if (typeof window === 'undefined') return [];
  const key = `${TIMELINE_STORAGE_PREFIX}${userId || 'me'}`;
  let records: TimelineStorageRecord[] = [];
  try {
    const raw = localStorage.getItem(key);
    if (raw) records = JSON.parse(raw);
  } catch {}

  const existingRecord = records.find((r) => r.vodId === entry.vodId);
  const bestPercent = existingRecord ? Math.max(existingRecord.watchPercent || 20, pct) : pct;

  const newRecord: TimelineStorageRecord = {
    id: existingRecord?.id || `tl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    vodId: entry.vodId,
    title: entry.title,
    year: entry.year || new Date().getFullYear(),
    artworkKey: entry.artworkKey || 'cyber_odyssey',
    category: entry.category || 'FILME',
    watchPercent: bestPercent,
    createdAtIso: new Date().toISOString(),
  };

  const filtered = records.filter((r) => r.vodId !== entry.vodId);
  const updated = [newRecord, ...filtered].slice(0, 40);

  try {
    localStorage.setItem(key, JSON.stringify(updated));
  } catch {}

  return updated.map((r) => ({
    id: r.id,
    vodId: r.vodId,
    title: r.title,
    year: r.year,
    artworkKey: r.artworkKey,
    category: r.category,
    watchPercent: r.watchPercent,
    timeAgo: formatTimeAgo(r.createdAtIso),
  }));
}
