import { useEffect, useState } from 'react';

export function useBrandColor() {
  const [brandColor, setBrandColor] = useState<string>('#4f46e5');

  useEffect(() => {
    let cancelled = false;
    fetch(`${import.meta.env.VITE_API_URL}/settings/public-info`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!cancelled && j) {
          const color = j.data?.brandColor || j.brandColor || '#4f46e5';
          setBrandColor(color);
          // Apply to CSS variable so all components can use it
          document.documentElement.style.setProperty('--brand-color', color);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  return brandColor;
}