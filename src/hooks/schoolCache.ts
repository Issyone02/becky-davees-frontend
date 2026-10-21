export type PublicInfo = {
  schoolName?: string | null;
  motto?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  logoUrl?: string | null;
  brandColor?: string | null;
};

const KEY = 'schoolms:public-info';

export function getCachedInfo(): PublicInfo | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as PublicInfo) : null;
  } catch {
    return null;
  }
}

export function setCachedInfo(info: PublicInfo) {
  try {
    localStorage.setItem(KEY, JSON.stringify(info));
  } catch {
    /* storage unavailable — ignore */
  }
}

export function applyBrandColor(color?: string | null) {
  document.documentElement.style.setProperty('--brand-color', color || '#4f46e5');
}

// One shared request, kicked off as early as possible (at module load, before React paints).
let prefetch: Promise<PublicInfo | null> | null = null;
export function prefetchInfo(): Promise<PublicInfo | null> {
  if (!prefetch) {
    prefetch = fetch(`${import.meta.env.VITE_API_URL}/settings/public-info`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        const data = j ? ((j.data ?? j) as PublicInfo) : null;
        if (data) setCachedInfo(data);
        return data;
      })
      .catch(() => null);
  }
  return prefetch;
}

if (typeof window !== 'undefined') prefetchInfo();