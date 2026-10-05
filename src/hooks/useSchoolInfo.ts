import { useEffect, useState } from 'react';

export type SchoolInfo = {
  schoolName?: string | null;
  motto?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  logoUrl?: string | null;
};

export function useSchoolInfo() {
  const [info, setInfo] = useState<SchoolInfo | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch(`${import.meta.env.VITE_API_URL}/settings/public-info`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (!cancelled && j) setInfo(j.data ?? j); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);
  return info;
}