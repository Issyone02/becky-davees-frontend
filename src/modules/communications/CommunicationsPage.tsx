import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '../../store/auth.store';
import * as comms from '../../api/comms';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/Badge';
import { Plus, Pencil, X, Send, CalendarDays, EyeOff } from 'lucide-react';

const AUDIENCE_LABELS: Record<string, string> = { all: 'Everyone', teachers: 'Teachers', parents: 'Parents' };
const AUDIENCE_OPTIONS = [
  { value: 'all', label: 'Everyone' },
  { value: 'teachers', label: 'Teachers' },
  { value: 'parents', label: 'Parents' },
];

export function CommunicationsPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const [tab, setTab] = useState<'news' | 'events'>('news');

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">News & Events</h1>
          <p className="text-text-secondary">School announcements, events and notifications.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setTab('news')}
            className={`px-4 py-2 rounded-input text-sm font-medium ${tab === 'news' ? 'bg-primary text-white shadow-elevated' : 'bg-surface text-text-secondary hover:bg-primary-light'}`}>
            Announcements
          </button>
          <button onClick={() => setTab('events')}
            className={`px-4 py-2 rounded-input text-sm font-medium ${tab === 'events' ? 'bg-primary text-white shadow-elevated' : 'bg-surface text-text-secondary hover:bg-primary-light'}`}>
            Events
          </button>
        </div>
      </div>
      {tab === 'news' ? <NewsTab isAdmin={isAdmin} /> : <EventsTab isAdmin={isAdmin} />}
    </div>
  );
}

function NewsTab({ isAdmin }: { isAdmin: boolean }) {
  const [items, setItems] = useState<comms.NewsItem[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<comms.NewsItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    (isAdmin ? comms.fetchNewsManage() : comms.fetchNewsFeed())
      .then(setItems)
      .catch((e) => setError(e?.response?.data?.error?.message ?? 'Failed'));
  }, [isAdmin]);
  useEffect(() => { load(); }, [load]);

  async function publish(id: string) {
    setError(null);
    try { await comms.publishNews(id); load(); }
    catch (e: any) { setError(e?.response?.data?.error?.message ?? 'Failed'); }
  }

    async function unpublish(id: string) {
    setError(null);
    try { await comms.unpublishNews(id); load(); }
    catch (e: any) { setError(e?.response?.data?.error?.message ?? 'Failed'); }
  }

  async function remove(id: string) {
    if (!window.confirm('Delete this announcement?')) return;
    try { await comms.deleteNews(id); load(); }
    catch (e: any) { setError(e?.response?.data?.error?.message ?? 'Failed'); }
  }

  return (
    <div>
      {isAdmin && (
        <div className="flex justify-end mb-4">
          <Button onClick={() => { setEditing(null); setOpen(true); }} leftIcon={<Plus className="h-4 w-4" />}>New Announcement</Button>
        </div>
      )}
      {error && <div className="mb-4 text-sm text-red-500 bg-red-50 p-3 rounded-input">{error}</div>}
      <div className="space-y-4">
        {items.map((n) => (
          <Card key={n.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-text-primary">{n.title}</h3>
                  <span className="badge badge-info">{AUDIENCE_LABELS[n.audience] ?? n.audience}</span>
                  {n.status === 'draft' && <StatusBadge status="warning" label="Draft" />}
                </div>
                <div className="text-xs text-text-muted mt-1">
                  By {n.author.fullName} · {new Date(n.publishedAt ?? n.createdAt).toLocaleDateString()}
                </div>
              </div>
              {isAdmin && (
                <div className="flex gap-1 shrink-0">
                  {n.status === 'draft' ? (
                    <button title="Publish now (notifies audience)" onClick={() => publish(n.id)}
                      className="p-2 rounded-input hover:bg-green-50 text-green-600"><Send className="h-4 w-4" /></button>
                  ) : (
                    <button title="Unpublish (revert to draft)" onClick={() => unpublish(n.id)}
                      className="p-2 rounded-input hover:bg-amber-50 text-amber-600"><EyeOff className="h-4 w-4" /></button>
                  )}
                  <button title="Edit" onClick={() => { setEditing(n); setOpen(true); }}
                    className="p-2 rounded-input hover:bg-gray-100 text-text-secondary"><Pencil className="h-4 w-4" /></button>
                  <button title="Delete" onClick={() => remove(n.id)}
                    className="p-2 rounded-input hover:bg-red-50 text-red-500"><X className="h-4 w-4" /></button>
                </div>
              )}
            </div>
            <p className="text-sm text-text-secondary whitespace-pre-line mt-3">{n.body}</p>
          </Card>
        ))}
        {items.length === 0 && (
          <Card><p className="text-sm text-text-muted text-center py-8">No announcements yet.</p></Card>
        )}
      </div>
      <NewsModal open={open} onClose={() => setOpen(false)} onSaved={load} initial={editing} />
    </div>
  );
}

function NewsModal({ open, onClose, onSaved, initial }: {
  open: boolean; onClose: () => void; onSaved: () => void; initial: comms.NewsItem | null;
}) {
  const [form, setForm] = useState({ title: '', body: '', audience: 'all', publish: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(initial
      ? { title: initial.title, body: initial.body, audience: initial.audience, publish: false }
      : { title: '', body: '', audience: 'all', publish: false });
  }, [open, initial]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      if (initial) await comms.updateNews(initial.id, { title: form.title, body: form.body, audience: form.audience });
      else await comms.createNews(form);
      onSaved(); onClose();
    } catch (err: any) { setError(err?.response?.data?.error?.message ?? 'Failed'); }
    finally { setLoading(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit Announcement' : 'New Announcement'} wide>
      <form onSubmit={submit} className="space-y-4">
        <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <div>
          <label className="label">Message</label>
          <textarea className="input-field min-h-[140px]" value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })} required />
        </div>
        <Select label="Audience" value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}
          options={AUDIENCE_OPTIONS} />
        {!initial && (
          <label className="flex items-center gap-2 text-sm text-text-secondary">
            <input type="checkbox" checked={form.publish} onChange={(e) => setForm({ ...form, publish: e.target.checked })} />
            Publish immediately (sends notifications to the audience)
          </label>
        )}
        {error && <div className="text-sm text-red-500 bg-red-50 p-3 rounded-input">{error}</div>}
        <Button type="submit" className="w-full" loading={loading}>{initial ? 'Save Changes' : 'Create Announcement'}</Button>
      </form>
    </Modal>
  );
}

function EventsTab({ isAdmin }: { isAdmin: boolean }) {
  const [items, setItems] = useState<comms.EventItem[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<comms.EventItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    comms.fetchEvents().then(setItems).catch((e) => setError(e?.response?.data?.error?.message ?? 'Failed'));
  }, []);
  useEffect(() => { load(); }, [load]);

  async function remove(id: string) {
    if (!window.confirm('Delete this event?')) return;
    try { await comms.deleteEvent(id); load(); }
    catch (e: any) { setError(e?.response?.data?.error?.message ?? 'Failed'); }
  }

  return (
    <div>
      {isAdmin && (
        <div className="flex justify-end mb-4">
          <Button onClick={() => { setEditing(null); setOpen(true); }} leftIcon={<Plus className="h-4 w-4" />}>New Event</Button>
        </div>
      )}
      {error && <div className="mb-4 text-sm text-red-500 bg-red-50 p-3 rounded-input">{error}</div>}
      <div className="space-y-4">
        {items.map((ev) => (
          <Card key={ev.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="h-10 w-10 rounded-input bg-primary-light text-primary flex items-center justify-center shrink-0">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-text-primary">{ev.title}</h3>
                    <span className="badge badge-info">{AUDIENCE_LABELS[ev.audience] ?? ev.audience}</span>
                  </div>
                  <div className="text-xs text-text-muted mt-1">
                    {new Date(ev.startDate).toLocaleDateString()}
                    {ev.endDate ? ` – ${new Date(ev.endDate).toLocaleDateString()}` : ''}
                    {ev.location ? ` · ${ev.location}` : ''}
                  </div>
                  {ev.description && <p className="text-sm text-text-secondary mt-2 whitespace-pre-line">{ev.description}</p>}
                </div>
              </div>
              {isAdmin && (
                <div className="flex gap-1 shrink-0">
                  <button title="Edit" onClick={() => { setEditing(ev); setOpen(true); }}
                    className="p-2 rounded-input hover:bg-gray-100 text-text-secondary"><Pencil className="h-4 w-4" /></button>
                  <button title="Delete" onClick={() => remove(ev.id)}
                    className="p-2 rounded-input hover:bg-red-50 text-red-500"><X className="h-4 w-4" /></button>
                </div>
              )}
            </div>
          </Card>
        ))}
        {items.length === 0 && (
          <Card><p className="text-sm text-text-muted text-center py-8">No events scheduled.</p></Card>
        )}
      </div>
      <EventModal open={open} onClose={() => setOpen(false)} onSaved={load} initial={editing} />
    </div>
  );
}

function EventModal({ open, onClose, onSaved, initial }: {
  open: boolean; onClose: () => void; onSaved: () => void; initial: comms.EventItem | null;
}) {
  const [form, setForm] = useState({ title: '', description: '', location: '', startDate: '', endDate: '', audience: 'all' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(initial
      ? {
          title: initial.title, description: initial.description ?? '', location: initial.location ?? '',
          startDate: initial.startDate.slice(0, 10), endDate: initial.endDate ? initial.endDate.slice(0, 10) : '',
          audience: initial.audience,
        }
      : { title: '', description: '', location: '', startDate: '', endDate: '', audience: 'all' });
  }, [open, initial]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const payload = { ...form, endDate: form.endDate || null };
      if (initial) await comms.updateEvent(initial.id, payload);
      else await comms.createEvent(payload);
      onSaved(); onClose();
    } catch (err: any) { setError(err?.response?.data?.error?.message ?? 'Failed'); }
    finally { setLoading(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit Event' : 'New Event'}>
      <form onSubmit={submit} className="space-y-4">
        <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <Input label="Location (optional)" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Start Date" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
          <Input label="End Date (optional)" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
        </div>
        <div>
          <label className="label">Description (optional)</label>
          <textarea className="input-field min-h-[90px]" value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <Select label="Audience" value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}
          options={AUDIENCE_OPTIONS} />
        {error && <div className="text-sm text-red-500 bg-red-50 p-3 rounded-input">{error}</div>}
        <Button type="submit" className="w-full" loading={loading}>{initial ? 'Save Changes' : 'Create Event'}</Button>
      </form>
    </Modal>
  );
}