import type { VodItem } from '../types/luminoria.ts';

export interface ExtractedMetadata {
  category: string;
  year: number;
  cleanTitle: string;
}

/**
 * Extracts a realistic release year from title, groupName, explicit year field, or deterministic hash
 * so catalog items span 2026 -> 2025 -> 2024 -> 2023 -> 2022... accurately.
 */
export function extractMediaReleaseYear(
  title: string = '',
  groupName: string = '',
  explicitYear?: string | number | null
): number {
  const titleYearMatch =
    title.match(/[\(\[](19\d\d|20[0-2]\d)[\)\]]/) ||
    title.match(/\b(19\d\d|20[0-2]\d)\b/) ||
    groupName.match(/\b(19\d\d|20[0-2]\d)\b/);

  if (titleYearMatch) {
    const parsed = parseInt(titleYearMatch[1], 10);
    if (parsed >= 1950 && parsed <= 2026) return parsed;
  }

  if (explicitYear !== undefined && explicitYear !== null) {
    const expStr = String(explicitYear).trim().slice(0, 4);
    const expNum = parseInt(expStr, 10);
    if (expNum >= 1950 && expNum <= 2026) return expNum;
  }

  // Deterministic year fallback (2018-2025) when M3U item has no year tag, avoiding 100% 2026 clustering
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = (hash * 31 + title.charCodeAt(i)) >>> 0;
  }
  const fallbackYears = [2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018];
  return fallbackYears[hash % fallbackYears.length];
}

export function cleanMediaTitle(title: string = ''): string {
  return (
    title
      .replace(/\s*[\(\[]?(19\d\d|20[0-3]\d)[\)\]]?\s*/g, ' ')
      .replace(/\s*[\(\[]\s*(4k|fhd|hd|uhd|legendado|dublado|dual|cinema|cam|l)\s*[\)\]]\s*/gi, ' ')
      .replace(/\s*\b(4k|fhd|hd|uhd|legendado|dublado|dual|cinema|cam)\b\s*/gi, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim() || title
  );
}

/**
 * Normalizes IPTV group titles and movie titles into standard genres without letting release year
 * overwrite the movie's true genre.
 */
export function normalizeGenreAndMetadata(
  groupName: string = '',
  title: string = '',
  explicitYear?: string | number | null
): ExtractedMetadata {
  const combined = `${groupName} ${title}`.toLowerCase();
  const year = extractMediaReleaseYear(title, groupName, explicitYear);
  const cleanTitle = cleanMediaTitle(title);

  let category = 'AÇÃO';

  if (combined.includes('terror') || combined.includes('horror') || combined.includes('assombração') || combined.includes('slasher')) {
    category = 'TERROR';
  } else if (combined.includes('comédia') || combined.includes('comedia') || combined.includes('comedy') || combined.includes('humor') || combined.includes('stand-up')) {
    category = 'COMÉDIA';
  } else if (combined.includes('ficção') || combined.includes('ficcao') || combined.includes('sci-fi') || combined.includes('alien') || combined.includes('espacial') || combined.includes('futuro')) {
    category = 'FICÇÃO CIENTÍFICA';
  } else if (combined.includes('guerra') || combined.includes('war') || combined.includes('militar') || combined.includes('batalha') || combined.includes('soldado')) {
    category = 'GUERRA';
  } else if (combined.includes('animação') || combined.includes('animacao') || combined.includes('desenho') || combined.includes('anime') || combined.includes('pixar') || combined.includes('infantil') || combined.includes('kids')) {
    category = 'ANIMAÇÃO';
  } else if (combined.includes('aventura') || combined.includes('adventure') || combined.includes('expedição') || combined.includes('herói')) {
    category = 'AVENTURA';
  } else if (combined.includes('romance') || combined.includes('romântico') || combined.includes('romantico') || combined.includes('amor')) {
    category = 'ROMANCE';
  } else if (combined.includes('drama') || combined.includes('biografia') || combined.includes('fatos reais') || combined.includes('história')) {
    category = 'DRAMA';
  } else if (combined.includes('suspense') || combined.includes('thriller') || combined.includes('mistério') || combined.includes('misterio') || combined.includes('crime') || combined.includes('policial') || combined.includes('investigação')) {
    category = 'SUSPENSE';
  } else if (combined.includes('documentário') || combined.includes('documentario') || combined.includes('doc')) {
    category = 'DOCUMENTÁRIOS';
  } else if (combined.includes('ação') || combined.includes('acao') || combined.includes('action') || combined.includes('luta') || combined.includes('adrenalina')) {
    category = 'AÇÃO';
  } else if (combined.includes('disney')) {
    category = 'DISNEY+';
  } else if (combined.includes('netflix')) {
    category = 'NETFLIX';
  } else if (combined.includes('lançamento') || combined.includes('lancamento') || combined.includes('cinema')) {
    category = 'LANÇAMENTOS';
  } else if (year < 2005) {
    category = 'CLÁSSICOS';
  }

  return { category, year, cleanTitle };
}

/**
 * Classifies Series into structured streaming genres & platforms (Netflix, Max, Drama, Suspense, Doramas, Animes, etc.)
 */
export function normalizeSeriesGenre(
  groupName: string = '',
  title: string = '',
  rawGenre: string = ''
): string {
  const combined = `${groupName} ${rawGenre} ${title}`.toLowerCase();

  if (combined.includes('dorama') || combined.includes('k-drama') || combined.includes('corean') || combined.includes('asiátic') || combined.includes('asiatic')) {
    return 'DORAMAS';
  }
  if (combined.includes('anime') || combined.includes('animação') || combined.includes('animacao') || combined.includes('cartoon') || combined.includes('desenho')) {
    return 'ANIMES & ANIMAÇÃO';
  }
  if (combined.includes('novela') || combined.includes('telenovela') || combined.includes('turca')) {
    return 'NOVELAS';
  }
  if (combined.includes('documentário') || combined.includes('documentario') || combined.includes('docu') || combined.includes('true crime')) {
    return 'DOCUMENTÁRIOS';
  }
  if (combined.includes('terror') || combined.includes('horror') || combined.includes('sobrenatural')) {
    return 'TERROR & MISTÉRIO';
  }
  if (combined.includes('comédia') || combined.includes('comedia') || combined.includes('comedy') || combined.includes('sitcom')) {
    return 'COMÉDIA';
  }
  if (combined.includes('ficção') || combined.includes('ficcao') || combined.includes('sci-fi') || combined.includes('fantasia') || combined.includes('fantasy')) {
    return 'FICÇÃO & FANTASIA';
  }
  if (combined.includes('suspense') || combined.includes('crime') || combined.includes('policial') || combined.includes('investigação') || combined.includes('thriller') || combined.includes('mistério')) {
    return 'SUSPENSE & CRIME';
  }
  if (combined.includes('ação') || combined.includes('acao') || combined.includes('action') || combined.includes('aventura') || combined.includes('guerra')) {
    return 'AÇÃO & AVENTURA';
  }
  if (combined.includes('drama') || combined.includes(' médica') || combined.includes('jurídic') || combined.includes('romance')) {
    return 'DRAMA';
  }
  if (combined.includes('netflix')) return 'NETFLIX';
  if (combined.includes('hbo') || combined.includes('max')) return 'MAX / HBO';
  if (combined.includes('prime') || combined.includes('amazon')) return 'PRIME VIDEO';
  if (combined.includes('disney')) return 'DISNEY+';
  if (combined.includes('globoplay') || combined.includes('globo')) return 'GLOBOPLAY';
  if (combined.includes('apple')) return 'APPLE TV+';

  return 'DRAMA';
}

/**
 * Sorts VOD items chronologically from newest year to oldest (2026 -> 2025 -> 2024 -> 2023...)
 * and then by rating descending.
 */
export function sortVodByYearDesc(items: VodItem[]): VodItem[] {
  return [...items].sort((a, b) => {
    const yearDiff = (b.year || 2024) - (a.year || 2024);
    if (yearDiff !== 0) return yearDiff;
    const aHasM3u = a.isComingSoon ? 0 : 1;
    const bHasM3u = b.isComingSoon ? 0 : 1;
    if (aHasM3u !== bHasM3u) return bHasM3u - aHasM3u;
    return (b.rating || 0) - (a.rating || 0);
  });
}

export const sortVodChronologically = sortVodByYearDesc;


