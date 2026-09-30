import { useEffect } from 'react';
import client from '../api/client';

/**
 * Polls /auth/active every 45 seconds. If the account was deactivated or deleted
 * server-side, the endpoint answers 401 → the axios interceptor's refresh attempt
 * also fails (refresh verifies status) → the session logs out automatically.
 */
export function useSessionGuard() {
  useEffect(() => {
    const id = setInterval(() => {
      client.get('/auth/active').catch(() => {
        /* interceptor handles refresh-failure logout + redirect */
      });
    }, 45000);
    return () => clearInterval(id);
  }, []);
}