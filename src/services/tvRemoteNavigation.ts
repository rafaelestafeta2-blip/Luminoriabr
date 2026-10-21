/**
 * Spatial Navigation and Remote Control Engine for Smart TVs.
 * Supports Android TV, Google TV, Samsung Tizen, LG webOS, Fire TV, and Keyboard D-Pads.
 */

export const TV_KEY_CODES = {
  // D-Pad Directional
  UP: ['ArrowUp', 'Up', 38],
  DOWN: ['ArrowDown', 'Down', 40],
  LEFT: ['ArrowLeft', 'Left', 37],
  RIGHT: ['ArrowRight', 'Right', 39],

  // Confirm / Select
  SELECT: ['Enter', 'Select', 'Ok', 13],

  // Back / Return (Android TV Back is 4, Samsung Return is 10009, LG webOS is 461)
  BACK: ['Escape', 'Backspace', 'GoBack', 27, 8, 4, 10009, 461],

  // Media Playback Controls
  PLAY_PAUSE: ['MediaPlayPause', 'PlayPause', 179],
  PLAY: ['MediaPlay', 'Play', 415],
  PAUSE: ['MediaPause', 'Pause', 19],
  FAST_FORWARD: ['MediaFastForward', 'FastForward', 417],
  REWIND: ['MediaRewind', 'Rewind', 412],
};

export function isSmartTvUserAgent(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = (navigator.userAgent || '').toLowerCase();
  return (
    ua.includes('smarttv') ||
    ua.includes('smart-tv') ||
    ua.includes('tizen') ||
    ua.includes('web0s') ||
    ua.includes('webos') ||
    ua.includes('android tv') ||
    ua.includes('googletv') ||
    ua.includes('appletv') ||
    ua.includes('aft') || // Amazon Fire TV
    ua.includes('hbbtv') ||
    ua.includes('crkey') || // Chromecast
    ua.includes('roku')
  );
}

export function matchesKey(e: KeyboardEvent, keyList: (string | number)[]): boolean {
  return keyList.some((k) => (typeof k === 'string' ? e.key === k : e.keyCode === k));
}

const INTERACTIVE_SELECTOR = [
  'button:not([disabled])',
  'a[href]',
  'input:not([disabled]):not([type="hidden"])',
  '[role="button"]:not([aria-disabled="true"])',
  '[tabindex="0"]',
].join(', ');

export function getVisibleInteractiveElements(): HTMLElement[] {
  if (typeof document === 'undefined') return [];
  const nodes = Array.from(document.querySelectorAll<HTMLElement>(INTERACTIVE_SELECTOR));
  return nodes.filter((el) => {
    if (!el.offsetParent && el.offsetWidth === 0 && el.offsetHeight === 0) return false;
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
      return false;
    }
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  });
}

type Direction = 'up' | 'down' | 'left' | 'right';

export function findNextSpatialElement(
  current: HTMLElement,
  direction: Direction
): HTMLElement | null {
  const elements = getVisibleInteractiveElements();
  if (elements.length === 0) return null;

  const curRect = current.getBoundingClientRect();
  const curCenter = {
    x: curRect.left + curRect.width / 2,
    y: curRect.top + curRect.height / 2,
  };

  let bestCandidate: HTMLElement | null = null;
  let minDistance = Infinity;

  for (const el of elements) {
    if (el === current || current.contains(el)) continue;

    const rect = el.getBoundingClientRect();
    const center = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };

    const dx = center.x - curCenter.x;
    const dy = center.y - curCenter.y;

    let isEligible = false;
    let primaryDist = 0;
    let secondaryDist = 0;

    switch (direction) {
      case 'up':
        isEligible = dy < -8;
        primaryDist = -dy;
        secondaryDist = Math.abs(dx);
        break;
      case 'down':
        isEligible = dy > 8;
        primaryDist = dy;
        secondaryDist = Math.abs(dx);
        break;
      case 'left':
        isEligible = dx < -8;
        primaryDist = -dx;
        secondaryDist = Math.abs(dy);
        break;
      case 'right':
        isEligible = dx > 8;
        primaryDist = dx;
        secondaryDist = Math.abs(dy);
        break;
    }

    if (!isEligible) continue;

    // Weight secondary distance to penalize diagonal jumps over direct alignment
    const score = primaryDist + secondaryDist * 2.2;
    if (score < minDistance) {
      minDistance = score;
      bestCandidate = el;
    }
  }

  return bestCandidate;
}
