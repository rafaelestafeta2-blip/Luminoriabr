export interface ProfileRankDef {
  id: string;
  name: string;
  xpRequired: number;
  level: number;
}

export const PROFILE_RANKS: ProfileRankDef[] = [
  { id: 'iniciante', name: 'INICIANTE', xpRequired: 0, level: 1 },
  { id: 'explorador', name: 'EXPLORADOR', xpRequired: 100, level: 2 },
  { id: 'fa', name: 'FÃ', xpRequired: 500, level: 3 },
  { id: 'viciado', name: 'VICIADO', xpRequired: 1000, level: 4 },
  { id: 'lendario', name: 'LENDÁRIO', xpRequired: 2000, level: 5 },
  { id: 'cinefilo', name: 'CINÉFILO', xpRequired: 3500, level: 6 },
  { id: 'maratoneiro', name: 'MARATONEIRO', xpRequired: 5000, level: 7 },
  { id: 'mestre', name: 'MESTRE', xpRequired: 7500, level: 8 },
  { id: 'lenda', name: 'LENDA', xpRequired: 10000, level: 9 },
  { id: 'luminaria', name: 'LUMINÁRIA', xpRequired: 15000, level: 10 },
];

export function getRankForXp(xp: number): ProfileRankDef {
  const safeXp = Math.max(0, xp);
  let current = PROFILE_RANKS[0];
  for (const rank of PROFILE_RANKS) {
    if (safeXp >= rank.xpRequired) {
      current = rank;
    }
  }
  return current;
}

export function levelFromXp(xp: number): number {
  return getRankForXp(xp).level;
}

export function getNextRankProgress(xp: number): {
  currentRank: ProfileRankDef;
  nextRank: ProfileRankDef | null;
  xpRemaining: number;
  progressPercent: number;
} {
  const safeXp = Math.max(0, xp);
  const currentRank = getRankForXp(safeXp);
  const nextIndex = PROFILE_RANKS.findIndex((r) => r.id === currentRank.id) + 1;
  const nextRank = nextIndex < PROFILE_RANKS.length ? PROFILE_RANKS[nextIndex] : null;

  if (!nextRank) {
    return { currentRank, nextRank: null, xpRemaining: 0, progressPercent: 100 };
  }

  const span = nextRank.xpRequired - currentRank.xpRequired;
  const gainedInTier = safeXp - currentRank.xpRequired;
  const progressPercent = Math.min(100, Math.max(0, Math.round((gainedInTier / span) * 100)));

  return {
    currentRank,
    nextRank,
    xpRemaining: Math.max(0, nextRank.xpRequired - safeXp),
    progressPercent,
  };
}

export function coinsForRank(rank: number): number {
  if (rank <= 0) return 0;
  switch (rank) {
    case 1: return 500;
    case 2: return 300;
    case 3: return 150;
    case 4: return 100;
    case 5: return 75;
    case 6: return 60;
    case 7: return 50;
    case 8: return 40;
    case 9: return 30;
    case 10: return 25;
    default: return rank <= 1000 ? 15 : 0;
  }
}

export interface ParsedM3UChannel {
  name: string;
  epgId: string;
  groupName: string;
  logoUrl?: string;
  url: string;
  sources: string[];
}

export interface M3UParseOutput {
  epgUrl: string | null;
  channels: ParsedM3UChannel[];
}

export function parseM3U(content: string): M3UParseOutput {
  const lines = content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  let epgUrl: string | null = null;
  const mergedMap = new Map<string, ParsedM3UChannel>();
  const orderKeys: string[] = [];

  let pendingMeta: { name: string; epgId: string; groupName: string; logoUrl?: string } | null = null;

  for (const line of lines) {
    if (line.toUpperCase().startsWith('#EXTM3U')) {
      const epgMatch = line.match(/(?:x-tvg-url|url-tvg)=["']([^"']+)["']/i);
      if (epgMatch && epgMatch[1]) {
        epgUrl = epgMatch[1].split(',')[0].trim();
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

      pendingMeta = { name: name || 'Canal Sem Nome', epgId, groupName, logoUrl };
      continue;
    }

    if (!line.startsWith('#') && /^(https?|rtmp|rtsp|mms):\/\//i.test(line)) {
      const meta = pendingMeta || {
        name: `Stream ${orderKeys.length + 1}`,
        epgId: `stream-${orderKeys.length + 1}`,
        groupName: 'Geral',
      };
      const key = meta.epgId || meta.name;
      const existing = mergedMap.get(key);
      if (existing) {
        if (!existing.sources.includes(line)) {
          existing.sources.push(line);
        }
      } else {
        mergedMap.set(key, {
          name: meta.name,
          epgId: meta.epgId,
          groupName: meta.groupName,
          logoUrl: meta.logoUrl,
          url: line,
          sources: [line],
        });
        orderKeys.push(key);
      }
      pendingMeta = null;
    }
  }

  return {
    epgUrl,
    channels: orderKeys.map((k) => mergedMap.get(k)!),
  };
}

export function generateM3U(channels: ParsedM3UChannel[], playlistName?: string): string {
  const lines: string[] = ['#EXTM3U'];
  if (playlistName) {
    lines.push(`#PLAYLIST:${playlistName}`);
  }
  for (const ch of channels) {
    for (const src of ch.sources) {
      lines.push(
        `#EXTINF:-1 tvg-id="${ch.epgId}" group-title="${ch.groupName}",${ch.name}`
      );
      lines.push(src);
    }
  }
  return lines.join('\n');
}

export function validateCinemaCode(rawCode: string): {
  valid: boolean;
  normalized: string;
  error?: string;
} {
  const normalized = rawCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (normalized.length !== 6) {
    return {
      valid: false,
      normalized,
      error: 'Digite um código de 6 caracteres alfanuméricos.',
    };
  }
  return { valid: true, normalized };
}

export function processShopPurchase(
  currentCoins: number,
  priceCoins: number,
  quantity: number = 1
): { ok: boolean; remainingCoins: number; totalCost: number; error?: string } {
  if (quantity < 1) {
    return { ok: false, remainingCoins: currentCoins, totalCost: 0, error: 'Quantidade inválida.' };
  }
  const totalCost = priceCoins * quantity;
  if (currentCoins < totalCost) {
    return {
      ok: false,
      remainingCoins: currentCoins,
      totalCost,
      error: `Luminárias insuficientes: precisa de ${totalCost}, possui ${currentCoins}.`,
    };
  }
  return {
    ok: true,
    remainingCoins: currentCoins - totalCost,
    totalCost,
  };
}

export interface BlueprintSanitizedProfile {
  userId: string;
  username: string;
  bio: string;
  countryCode: string;
  maritalStatus: string;
  favoriteGenres: string[];
  xp: number;
  coins: number;
  watchHours: number;
  equippedBorderId: string;
  equippedThemeId: 'lotus' | 'ocean' | 'forest' | 'sunset' | 'lavender' | 'midnight';
  ownedProductIds: string[];
}

const ALLOWED_THEMES = ['lotus', 'ocean', 'forest', 'sunset', 'lavender', 'midnight'] as const;

export function sanitizeProfileForBlueprint(input: {
  userId: string;
  username: string;
  bio: string;
  countryCode: string;
  maritalStatus: string;
  favoriteGenres: string[];
  xp: number;
  coins: number;
  watchHours: number;
  equippedBorderId: string;
  equippedThemeId: string;
  ownedProductIds: string[];
}): BlueprintSanitizedProfile {
  const safeUserId = (input.userId || 'anon').replace(/[^a-zA-Z0-9_\-]/g, '').slice(0, 128) || 'anon';
  const trimmedName = (input.username || 'Utilizador').trim().slice(0, 40);
  const safeUsername = trimmedName.length >= 2 ? trimmedName : 'Utilizador';
  const safeBio = (input.bio || '').trim().slice(0, 240);
  const rawCountry = (input.countryCode || 'BR').toUpperCase().replace(/[^A-Z]/g, '');
  const safeCountry = rawCountry.length === 2 ? rawCountry : 'BR';
  const safeMarital = (input.maritalStatus || 'Solteiro(a)').trim().slice(0, 32) || 'Solteiro(a)';

  const safeGenres = (input.favoriteGenres || [])
    .filter((g) => typeof g === 'string' && g.trim().length > 0)
    .map((g) => g.trim().slice(0, 24))
    .slice(0, 4);

  const safeOwned = (input.ownedProductIds || [])
    .filter((p) => typeof p === 'string' && /^[a-zA-Z0-9_\-]+$/.test(p))
    .map((p) => p.slice(0, 64))
    .slice(0, 10);

  const safeXp = Math.min(1000000, Math.max(0, Math.floor(Number(input.xp) || 0)));
  const safeCoins = Math.min(1000000, Math.max(0, Math.floor(Number(input.coins) || 0)));
  const safeWatchHours = Math.min(100000, Math.max(0, Number((Number(input.watchHours) || 0).toFixed(1))));

  const rawBorder = (input.equippedBorderId || 'prod-border-lotus').replace(/[^a-zA-Z0-9_\-]/g, '').slice(0, 64);
  const safeBorder = rawBorder.length >= 1 ? rawBorder : 'prod-border-lotus';

  const safeTheme = (ALLOWED_THEMES as readonly string[]).includes(input.equippedThemeId)
    ? (input.equippedThemeId as BlueprintSanitizedProfile['equippedThemeId'])
    : 'lotus';

  return {
    userId: safeUserId,
    username: safeUsername,
    bio: safeBio,
    countryCode: safeCountry,
    maritalStatus: safeMarital,
    favoriteGenres: safeGenres,
    xp: safeXp,
    coins: safeCoins,
    watchHours: safeWatchHours,
    equippedBorderId: safeBorder,
    equippedThemeId: safeTheme,
    ownedProductIds: safeOwned.length > 0 ? safeOwned : ['prod-border-lotus'],
  };
}

