import { ColorSchemeId, ColorSchemePreset } from '../types/luminoria';
import { COLOR_SCHEME_PRESETS } from '../data/seedData';

const THEME_STORAGE_KEY = 'luminoria_active_theme_id';

export function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '');
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return `${r}, ${g}, ${b}`;
  }
  const num = parseInt(clean, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `${r}, ${g}, ${b}`;
}

export function applyThemeToDom(scheme: ColorSchemePreset): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const rgb = hexToRgb(scheme.primaryHex);
  const secRgb = hexToRgb(scheme.secondaryHex);

  root.style.setProperty('--theme-primary', scheme.primaryHex);
  root.style.setProperty('--theme-secondary', scheme.secondaryHex);
  root.style.setProperty('--theme-primary-rgb', rgb);
  root.style.setProperty('--theme-secondary-rgb', secRgb);
  root.style.setProperty('--theme-glow', `rgba(${rgb}, 0.45)`);
  root.style.setProperty('--theme-subtle', `rgba(${rgb}, 0.12)`);
}

export function getSavedThemeId(): ColorSchemeId {
  if (typeof window === 'undefined') return 'lotus';
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as ColorSchemeId | null;
    if (saved && COLOR_SCHEME_PRESETS.some((s) => s.id === saved)) {
      return saved;
    }
  } catch {}
  return 'lotus';
}

export function saveThemeId(id: ColorSchemeId): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, id);
  } catch {}
}

export function getPresetById(id: ColorSchemeId): ColorSchemePreset {
  return COLOR_SCHEME_PRESETS.find((s) => s.id === id) || COLOR_SCHEME_PRESETS[0];
}
