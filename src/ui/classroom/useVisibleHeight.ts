import { useEffect, useState } from 'react';

/**
 * Keeps the screen exactly as tall as the part of the window that is visible. On phones the keyboard
 * covers the bottom; iPhone Safari does not shrink the page for it, so the visible height is measured.
 * Returns true while a keyboard (or anything else) hides a large part of the window.
 */
export function useVisibleHeight(): boolean {
  const [squeezed, setSqueezed] = useState(false);
  useEffect(() => {
    const vv = window.visualViewport;
    const root = document.documentElement;
    const update = () => {
      const h = vv ? vv.height : window.innerHeight;
      root.style.setProperty('--app-h', `${Math.round(h)}px`);
      setSqueezed(window.innerHeight - h > 150);
      // iPhone Safari slides the page up instead of shrinking it; put it back.
      if (window.scrollY !== 0) window.scrollTo(0, 0);
    };
    update();
    vv?.addEventListener('resize', update);
    vv?.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    return () => {
      vv?.removeEventListener('resize', update);
      vv?.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      root.style.removeProperty('--app-h');
    };
  }, []);
  return squeezed;
}
