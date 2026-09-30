import client from './client';

export async function updateMyProfile(input: { fullName?: string; phone?: string | null; profilePictureUrl?: string | null }) {
  const { data } = await client.patch('/users/me/profile', input);
  return data.data;
}