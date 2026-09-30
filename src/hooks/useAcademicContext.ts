import { useEffect, useState } from 'react';
import client from '../api/client';

export interface AcademicContext {
  sessionId: string | null;
  termId: string | null;
  sessionName: string | null;
  termName: string | null;
  source: 'date' | 'flag' | 'none';
}

export function useAcademicContext() {
  const [ctx, setCtx] = useState<AcademicContext>({
    sessionId: null, termId: null, sessionName: null, termName: null, source: 'none',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get('/academic/current')
      .then(({ data }) => setCtx(data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return { ...ctx, loading };
}