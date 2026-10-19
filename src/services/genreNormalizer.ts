export interface ExtractedMetadata {
  category: string;
  year: number;
  cleanTitle: string;
}

/**
 * Normalizes IPTV group titles and movie titles into standard, rich genres:
 * Terror, Ação, Comédia, Ficção Científica, Guerra, Aventura, Animação, Drama, Suspense, Lançamentos, etc.
 */
export function normalizeGenreAndMetadata(
  groupName: string = '',
  title: string = ''
): ExtractedMetadata {
  const combined = `${groupName} ${title}`.toLowerCase();

  // Extract year e.g. (2024), [2023], 2022
  const yearMatch = title.match(/\b(19\d\d|20[0-3]\d)\b/) || groupName.match(/\b(19\d\d|20[0-3]\d)\b/);
  const year = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear();

  // Clean title by removing year and standard bracket tags
  const cleanTitle = title
    .replace(/\s*[\(\[]?(19\d\d|20[0-3]\d)[\)\]]?\s*/g, ' ')
    .replace(/\s*[\(\[]?(4k|fhd|hd|legendado|dublado|dual)[\)\]]?\s*/gi, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim() || title;

  let category = 'AÇÃO';

  if (combined.includes('terror') || combined.includes('horror') || combined.includes('assombração') || combined.includes('slasher')) {
    category = 'TERROR';
  } else if (combined.includes('comédia') || combined.includes('comedia') || combined.includes('comedy') || combined.includes('humor') || combined.includes('stand-up')) {
    category = 'COMÉDIA';
  } else if (combined.includes('ficção') || combined.includes('ficcao') || combined.includes('sci-fi') || combined.includes('alien') || combined.includes('apocalipse')) {
    category = 'FICÇÃO CIENTÍFICA';
  } else if (combined.includes('guerra') || combined.includes('war') || combined.includes('militar') || combined.includes('batalha')) {
    category = 'GUERRA';
  } else if (combined.includes('animação') || combined.includes('animacao') || combined.includes('desenho') || combined.includes('anime') || combined.includes('pixar') || combined.includes('dreamworks')) {
    category = 'ANIMAÇÃO';
  } else if (combined.includes('aventura') || combined.includes('adventure') || combined.includes('expedição')) {
    category = 'AVENTURA';
  } else if (combined.includes('romance') || combined.includes('romântico') || combined.includes('romantico')) {
    category = 'ROMANCE';
  } else if (combined.includes('fantasia') || combined.includes('fantasy') || combined.includes('mágico') || combined.includes('medieval')) {
    category = 'FANTASIA';
  } else if (combined.includes('drama') || combined.includes('biografia') || combined.includes('fatos reais')) {
    category = 'DRAMA';
  } else if (combined.includes('suspense') || combined.includes('thriller') || combined.includes('mistério') || combined.includes('crime') || combined.includes('policial')) {
    category = 'SUSPENSE';
  } else if (combined.includes('lançamento') || combined.includes('lancamento') || combined.includes('cinema') || year >= 2025) {
    category = 'LANÇAMENTOS';
  } else if (combined.includes('disney')) {
    category = 'DISNEY+';
  } else if (combined.includes('netflix')) {
    category = 'NETFLIX';
  } else if (combined.includes('hbo')) {
    category = 'HBO MAX';
  } else if (combined.includes('prime video') || combined.includes('amazon')) {
    category = 'PRIME VIDEO';
  } else if (combined.includes('ação') || combined.includes('acao') || combined.includes('action') || combined.includes('luta')) {
    category = 'AÇÃO';
  } else if (year < 2000) {
    category = 'CLÁSSICOS';
  } else if (groupName && groupName.length > 2 && !groupName.toLowerCase().includes('filme')) {
    category = groupName.toUpperCase().slice(0, 20);
  }

  return { category, year, cleanTitle };
}
