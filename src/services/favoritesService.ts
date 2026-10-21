/**
 * Service to manage persistent user-scoped favorites in Luminoria Pro.
 * Prevents new accounts from inheriting shared legacy favorites from older test sessions.
 */

const LEGACY_GLOBAL_KEY = 'luminoria_favorites_ids_v2';
const USER_FAVORITES_PREFIX = 'luminoria_favorites_v3_';

export function purgeLegacyGlobalFavorites(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(LEGACY_GLOBAL_KEY);
  } catch {}
}

export function loadUserFavorites(userId?: string): string[] {
  if (typeof window === 'undefined') return [];
  purgeLegacyGlobalFavorites();
  if (!userId || userId === 'guest' || userId === 'u-me') return [];

  try {
    const raw = localStorage.getItem(`${USER_FAVORITES_PREFIX}${userId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string' && id.trim()) : [];
  } catch {
    return [];
  }
}

export function saveUserFavorites(userId: string | undefined, favorites: string[]): void {
  if (typeof window === 'undefined') return;
  if (!userId || userId === 'guest' || userId === 'u-me') return;

  try {
    const clean = Array.isArray(favorites)
      ? favorites.filter((id) => typeof id === 'string' && id.trim())
      : [];
    localStorage.setItem(`${USER_FAVORITES_PREFIX}${userId}`, JSON.stringify(clean));
  } catch {}
}

export function clearUserFavorites(userId?: string): void {
  if (typeof window === 'undefined' || !userId) return;
  try {
    localStorage.removeItem(`${USER_FAVORITES_PREFIX}${userId}`);
  } catch {}
}
