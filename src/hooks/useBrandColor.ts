import { useEffect, useState } from 'react';
import { applyBrandColor, getCachedInfo, prefetchInfo } from './schoolCache';

export function useBrandColor() {
  // Paint instantly from cache; refresh in background.
  const [color, setColor] = useState<string>(() => getCachedInfo()?.brandColor || '#4f46e5');

  useEffect(() => {
    applyBrandColor(color);
  }, [color]);

  useEffect(() => {
    let cancelled = false;
    prefetchInfo().then((data) => {
      if (!cancelled && data?.brandColor) setColor(data.brandColor);
    });
    return () => { cancelled = true; };
  }, []);

  return color;
}