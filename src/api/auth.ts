import client from './client';
import { useAuthStore, User } from '../store/auth.store';

export async function login(emailOrUsername: string, password: string) {
  const { data } = await client.post('/auth/login', { emailOrUsername, password });
  const { accessToken, refreshToken, user } = data.data;
  useAuthStore.getState().setAuth(user, accessToken, refreshToken);
  return user;
}

export async function logout() {
  try { await client.post('/auth/logout'); } finally {
    useAuthStore.getState().logout();
  }
}

export async function fetchMe(): Promise<User> {
  const { data } = await client.get('/auth/me');
  useAuthStore.getState().updateUser(data.data);
  return data.data;
}

export async function register(input: {
  email: string; fullName: string; password: string; role: 'TEACHER' | 'PARENT';
  phone?: string; submittedData?: Record<string, unknown>;
}) {
  const { data } = await client.post('/auth/register', input);
  return data.data;
}

export async function requestPasswordReset(email: string) {
  const { data } = await client.post('/auth/forgot-password', { email });
  return data.data;
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const { data } = await client.post('/auth/change-password', { currentPassword, newPassword });
  return data.data;
}

export async function resetPasswordWithToken(token: string, newPassword: string) {
  const { data } = await client.post('/auth/reset-password', { token, newPassword });
  return data.data;
}