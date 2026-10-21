import { useEffect, useState } from 'react';
import { getCachedInfo, prefetchInfo, PublicInfo } from './schoolCache';

export type SchoolInfo = PublicInfo;

export function useSchoolInfo() {
  // Paint instantly from cache; refresh in background.
  const [info, setInfo] = useState<SchoolInfo | null>(() => getCachedInfo());

  useEffect(() => {
    let cancelled = false;
    prefetchInfo().then((data) => {
      if (!cancelled && data) setInfo(data);
    });
    return () => { cancelled = true; };
  }, []);

  return info;
}