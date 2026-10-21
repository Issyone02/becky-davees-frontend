import { useState } from 'react';
import { useSchoolInfo } from '../../hooks/useSchoolInfo';
import { useBrandColor } from '../../hooks/useBrandColor';

export function ContactPage() {
  const info = useSchoolInfo();
  const brandColor = useBrandColor();
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null); setDone(false);
    try {
      const r = await fetch(`${import.meta.env.VITE_API_URL}/public/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!r.ok) throw new Error('Failed');
      setDone(true);
      setForm({ name: '', email: '', message: '' });
    } catch {
      setError('Could not send your message. Please try again or call the school directly.');
    } finally { setBusy(false); }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-2 gap-10">
      <section>
        <h1 className="text-3xl font-extrabold mb-4">Contact Us</h1>
        <div className="space-y-2 text-text-secondary text-sm">
          {info?.address && <div><strong>Address:</strong> {info.address}</div>}
          {info?.phone && <div><strong>Phone:</strong> {info.phone}</div>}
          {info?.email && <div><strong>Email:</strong> {info.email}</div>}
        </div>
      </section>
      <form onSubmit={submit} className="space-y-4">
        <input className="input-field" placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input className="input-field" type="email" placeholder="Your email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <textarea className="input-field min-h-[120px]" placeholder="Your message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
        {error && <div className="text-sm text-red-500 bg-red-50 p-3 rounded-input">{error}</div>}
        {done && <div className="text-sm text-green-700 bg-green-50 p-3 rounded-input">Thank you — your message has been sent to the school office.</div>}
        <button type="submit" disabled={busy} className="px-6 py-3 rounded-input text-white font-semibold disabled:opacity-60" style={{ backgroundColor: brandColor }}>
          {busy ? 'Sending…' : 'Send Message'}
        </button>
      </form>
    </div>
  );
}