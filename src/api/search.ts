import client from './client';

export interface SearchItem { id: string; label: string; sub: string }
export interface SearchResults {
  students: SearchItem[]; teachers: SearchItem[]; parents: SearchItem[];
  classes: SearchItem[]; subjects: SearchItem[];
}

export async function fetchGlobalSearch(q: string) {
  const { data } = await client.get('/search', { params: { q } });
  return data.data as SearchResults;
}