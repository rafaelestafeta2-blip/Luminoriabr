import { useEffect, useState } from 'react';
import {
  findNextSpatialElement,
  getVisibleInteractiveElements,
  isSmartTvUserAgent,
  matchesKey,
  TV_KEY_CODES,
} from '../services/tvRemoteNavigation';

const TV_STORAGE_KEY = 'luminoria_tv_mode_active';

export function useTvRemoteNavigation() {
  const [isTvMode, setIsTvMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem(TV_STORAGE_KEY);
    if (saved !== null) return saved === 'true';
    return isSmartTvUserAgent();
  });

  const toggleTvMode = () => {
    setIsTvMode((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem(TV_STORAGE_KEY, String(next));
      }
      return next;
    });
  };

  useEffect(() => {
    if (typeof document === 'undefined') return;

    if (isTvMode) {
      document.body.classList.add('tv-mode-active');
    } else {
      document.body.classList.remove('tv-mode-active');
    }
  }, [isTvMode]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is actively typing in an input or textarea
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      // Handle Back Button (Escape, Android Back, Samsung/LG Return)
      if (matchesKey(e, TV_KEY_CODES.BACK)) {
        if (!isInput) {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent('tv-remote-back'));
          return;
        }
      }

      // Handle Play / Pause Remote Keys
      if (
        matchesKey(e, TV_KEY_CODES.PLAY_PAUSE) ||
        matchesKey(e, TV_KEY_CODES.PLAY) ||
        matchesKey(e, TV_KEY_CODES.PAUSE)
      ) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('tv-remote-playpause'));
        return;
      }

      // Determine D-Pad direction
      let direction: 'up' | 'down' | 'left' | 'right' | null = null;
      if (matchesKey(e, TV_KEY_CODES.UP)) direction = 'up';
      else if (matchesKey(e, TV_KEY_CODES.DOWN)) direction = 'down';
      else if (matchesKey(e, TV_KEY_CODES.LEFT)) direction = 'left';
      else if (matchesKey(e, TV_KEY_CODES.RIGHT)) direction = 'right';

      if (!direction) return;

      // If user is inside an input, allow default arrow navigation inside text unless it's Up/Down
      if (isInput && (direction === 'left' || direction === 'right')) {
        return;
      }

      e.preventDefault();

      // If TV mode wasn't explicitly active, turn it on upon first D-Pad arrow press!
      if (!isTvMode) {
        setIsTvMode(true);
      }

      const activeEl = document.activeElement as HTMLElement | null;
      const visible = getVisibleInteractiveElements();

      if (
        !activeEl ||
        activeEl === document.body ||
        !visible.includes(activeEl)
      ) {
        // Focus the first interactive element
        const first = visible[0];
        if (first) {
          first.focus();
          first.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }

      const next = findNextSpatialElement(activeEl, direction);
      if (next) {
        next.focus();
        next.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [isTvMode]);

  return { isTvMode, toggleTvMode };
}
