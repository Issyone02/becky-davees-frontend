const API_BASE: string = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:4000/api';
export const API_ORIGIN = API_BASE.replace(/\/api\/?$/, '');

export function assetUrl(path?: string | null): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path; // already absolute
  return `${API_ORIGIN}${path.startsWith('/') ? '' : '/'}${path}`;
}