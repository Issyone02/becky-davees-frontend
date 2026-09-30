import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER' | 'PARENT';

export interface User {
  id: string;
  email: string;
  username?: string;
  fullName: string;
  role: Role;
  mustChangePassword: boolean;
  profilePictureUrl?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  updateUser: (u: Partial<User>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setAuth: (user, accessToken, refreshToken) => set({ user, accessToken, refreshToken }),
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      updateUser: (u) => set((s) => ({ user: s.user ? { ...s.user, ...u } : null })),
      logout: () => set({ user: null, accessToken: null, refreshToken: null }),
    }),
    { name: 'sms-auth', partialize: (s) => ({ user: s.user, refreshToken: s.refreshToken }) },
  ),
);