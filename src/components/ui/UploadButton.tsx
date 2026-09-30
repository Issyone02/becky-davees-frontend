import { useState } from 'react';
import client from '../../api/client';
import { Upload } from 'lucide-react';

export function UploadButton({ label, onUploaded }: { label: string; onUploaded: (url: string) => void }) {
  const [busy, setBusy] = useState(false);

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await client.post('/uploads', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      onUploaded(data.data.url);
    } catch (err: any) {
      alert(err?.response?.data?.error?.message ?? 'Upload failed');
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  }

  return (
    <label className="inline-block">
      <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={pick} disabled={busy} />
      <span className="btn-secondary inline-flex items-center gap-2 cursor-pointer text-sm">
        <Upload className="h-4 w-4" /> {busy ? 'Uploading...' : label}
      </span>
    </label>
  );
}