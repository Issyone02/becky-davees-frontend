import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, GraduationCap, UserCheck, Users, BookOpen, Library } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { fetchGlobalSearch, SearchResults, SearchItem } from '../../api/search';

const GROUPS: { key: keyof SearchResults; title: string; icon: any }[] = [
  { key: 'students', title: 'Students', icon: GraduationCap },
  { key: 'teachers', title: 'Teachers', icon: UserCheck },
  { key: 'parents', title: 'Parents', icon: Users },
  { key: 'classes', title: 'Classes', icon: BookOpen },
  { key: 'subjects', title: 'Subjects', icon: Library },
];

export function GlobalSearch() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const role = user?.role;

  useEffect(() => {
    if (q.trim().length < 2) { setResults(null); setOpen(false); return; }
    const t = setTimeout(() => {
      fetchGlobalSearch(q.trim())
        .then((r) => { setResults(r); setOpen(true); })
        .catch(() => setResults(null));
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // Parents: no global search at all (their portal is child-scoped elsewhere)
  if (role === 'PARENT') return null;

  const placeholder = role === 'TEACHER'
    ? 'Search your students, classes and subjects...'
    : 'Search students, teachers, parents, classes...';

  // Teachers never see teacher/parent groups
  const visibleGroups = role === 'TEACHER'
    ? GROUPS.filter((g) => g.key === 'students' || g.key === 'classes' || g.key === 'subjects')
    : GROUPS;

  function go(group: string, item: SearchItem) {
    setOpen(false); setQ('');
    if (group === 'students') navigate('/students', { state: { search: item.label } });
    else if (group === 'teachers') navigate('/teachers', { state: { search: item.label } });
    else if (group === 'parents') navigate('/parents', { state: { search: item.label } });
    else navigate('/classes');
  }

  const total = results ? Object.values(results).reduce((a, l) => a + l.length, 0) : 0;

  return (
    <div className="relative flex-1 min-w-0" ref={boxRef}>
      <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
      <input
        className="input-field pl-9 h-10 w-full"
        placeholder={placeholder}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => { if (results) setOpen(true); }}
        onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false); }}
      />
      {open && results && (
        <div className="absolute left-0 right-0 mt-2 bg-surface border border-border rounded-card shadow-elevated z-50 max-h-96 overflow-y-auto">
          {total === 0 && <div className="px-4 py-6 text-sm text-text-muted text-center">No matches for "{q}".</div>}
          {visibleGroups.map((g) => {
            const items = results[g.key];
            if (!items?.length) return null;
            const Icon = g.icon;
            return (
              <div key={g.key}>
                <div className="px-4 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-text-muted">{g.title}</div>
                {items.map((it) => (
                  <button key={it.id} onClick={() => go(g.key, it)}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-primary-light/50 text-left">
                    <Icon className="h-4 w-4 text-primary shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-text-primary truncate">{it.label}</div>
                      <div className="text-xs text-text-muted truncate">{it.sub}</div>
                    </div>
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}