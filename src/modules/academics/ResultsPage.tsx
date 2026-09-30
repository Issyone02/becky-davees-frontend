import { fetchReportCardsBulk, fetchClassRoster } from '../../api/results';
import { assetUrl } from '../../utils/assetUrl';
import * as XLSX from 'xlsx';
import { UploadButton } from '../../components/ui/UploadButton';
import { updateMySignature } from '../../api/results';
import { useAuthStore } from '../../store/auth.store';
import { fetchTeachers, TeacherItem } from '../../api/people';
import { updateClass } from '../../api/academic';
import { getEntrySheet, saveScores, setLock, getClassSheet, getReportCard, generateReportCards, saveConduct, saveRemarks, fetchSettings, updateSettings, saveStudentScores, saveClassScores, EntrySheet, ClassSheet, EntryStudent, EntryResult } from '../../api/results';
import { ReportCardTemplate } from './ReportCardTemplate';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAcademicContext } from '../../hooks/useAcademicContext';
import { fetchMyClasses } from '../../api/attendance';
import { fetchClassesFull, fetchTerms, fetchClassSubjects, TermItem } from '../../api/academic';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { StatusBadge } from '../../components/ui/Badge';
import { Lock, Unlock, Save, Printer, FileText, Download, Upload, Search } from 'lucide-react';
import { Pagination } from '../../components/ui/Pagination';


const tabs = ['Score Entry', 'Class Results', 'Report Card'] as const;
type Tab = (typeof tabs)[number];

export function ResultsPage({ initialTab = 'Score Entry' }: { initialTab?: Tab }) {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const ctx = useAcademicContext();

  const [tab, setTab] = useState<Tab>(initialTab);
  const [classOptions, setClassOptions] = useState<{ value: string; label: string }[]>([]);
  const [terms, setTerms] = useState<TermItem[]>([]);
  const [classId, setClassId] = useState('');
  const [termId, setTermId] = useState('');

  useEffect(() => {
    if (ctx.loading) return;
    if (isAdmin) {
      fetchClassesFull().then((l) => { setClassOptions(l.map((c) => ({ value: c.id, label: c.name }))); if (l.length && !classId) setClassId(l[0].id); }).catch(console.error);
    } else {
      fetchMyClasses().then((l) => { setClassOptions(l.map((c) => ({ value: c.classId, label: c.className }))); if (l.length && !classId) setClassId(l[0].classId); }).catch(console.error);
    }
    fetchTerms().then((t) => { setTerms(t); if (!termId && ctx.termId) setTermId(ctx.termId); }).catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx.loading]);

  const termOptions = terms.map((t) => ({ value: t.id, label: `${t.session?.name ?? ''} — ${t.name}` }));

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Academics</h1>
          <p className="text-text-secondary">Score entry, result sheets and report cards.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-input text-sm font-medium ${tab === t ? 'bg-primary text-white shadow-elevated' : 'bg-surface text-text-secondary hover:bg-primary-light'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <Card className="mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select label="Class" value={classId} onChange={(e) => setClassId(e.target.value)} options={classOptions} placeholder="Select class" />
          <Select label="Term" value={termId} onChange={(e) => setTermId(e.target.value)} options={termOptions} placeholder="Select term" />
        </div>
      </Card>

      {tab === 'Score Entry' && <EntryTab classId={classId} termId={termId} isAdmin={isAdmin} />}
      {tab === 'Class Results' && <SheetTab classId={classId} termId={termId} />}
      {tab === 'Report Card' && <ReportTab classId={classId} termId={termId} isAdmin={isAdmin} />}
    </div>
  );
}

function EntryTab({ classId, termId, isAdmin }: { classId: string; termId: string; isAdmin: boolean }) {
  const [mode, setMode] = useState<'subject' | 'student' | 'bulk'>('subject');
  const [subjectOptions, setSubjectOptions] = useState<{ value: string; label: string }[]>([]);
  const [subjectId, setSubjectId] = useState('');
  const [sheet, setSheet] = useState<EntrySheet | null>(null);
  const [scores, setScores] = useState<Record<string, { testScore: string; examScore: string }>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setSubjectId('');
    if (!classId) return;
    if (isAdmin) {
      fetchClassSubjects(classId).then((l) => setSubjectOptions(l.map((cs) => ({ value: cs.subjectId, label: cs.subject.name })))).catch(console.error);
    } else {
      fetchMyClasses().then((l) => {
        const mine = l.find((c) => c.classId === classId);
        setSubjectOptions((mine?.subjects ?? []).map((s) => ({ value: s.id, label: s.name })));
      }).catch(console.error);
    }
  }, [classId, isAdmin]);

  const load = useCallback(() => {
    if (!classId || !subjectId || !termId) return;
    setError(null);
    getEntrySheet({ classId, subjectId, termId })
      .then((d) => {
        setSheet(d);
        const map: Record<string, { testScore: string; examScore: string }> = {};
        for (const s of d.students) {
          const r = d.results.find((x) => x.studentId === s.id);
          map[s.id] = { testScore: r ? String(r.testScore) : '', examScore: r ? String(r.examScore) : '' };
        }
        setScores(map);
      })
      .catch((e) => setError(e?.response?.data?.error?.message ?? 'Failed to load entry sheet'));
  }, [classId, subjectId, termId]);

  useEffect(() => { load(); }, [load]);

    useEffect(() => { setPage(1); }, [search]);

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = sheet?.students ?? [];
    if (!q) return list;
    return list.filter((s) => s.fullName.toLowerCase().includes(q) || s.studentId.toLowerCase().includes(q));
  }, [sheet, search]);
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / 10));
  const safePage = Math.min(page, totalPages);
  const pageStudents = filteredStudents.slice((safePage - 1) * 10, safePage * 10);


  async function save() {
    const bad = Object.entries(scores).find(([, v]) =>
      (v.testScore !== '' && (Number(v.testScore) < 0 || Number(v.testScore) > 30)) ||
      (v.examScore !== '' && (Number(v.examScore) < 0 || Number(v.examScore) > 70)),
    );
    if (bad) {
      setError('Invalid score: CA must be 0–30 and Exam must be 0–70. Please correct the values before saving.');
      return;
    }
    setSaving(true); setError(null); setInfo(null);
    try {
      await saveScores({
        classId, subjectId, termId,
        entries: Object.entries(scores)
          .filter(([, v]) => v.testScore !== '' && v.examScore !== '')
          .map(([studentId, v]) => ({ studentId, testScore: Number(v.testScore), examScore: Number(v.examScore) })),
      });
      setInfo('Scores saved and graded successfully.');
      load();
    } catch (e: any) { setError(e?.response?.data?.error?.message ?? 'Failed to save scores'); }
    finally { setSaving(false); }
  }

  async function toggleLock(locked: boolean) {
    setError(null);
    try { await setLock({ classId, subjectId, termId, locked }); load(); }
    catch (e: any) { setError(e?.response?.data?.error?.message ?? 'Failed'); }
  }

  if (!classId || !termId) return <Card><p className="text-sm text-text-muted">Select a class and term.</p></Card>;

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={() => setMode('subject')}
          className={`px-4 py-2 rounded-input text-sm font-medium ${mode === 'subject' ? 'bg-primary text-white shadow-elevated' : 'bg-surface text-text-secondary hover:bg-primary-light'}`}>
          By Subject (whole class grid)
        </button>
        <button onClick={() => setMode('student')}
          className={`px-4 py-2 rounded-input text-sm font-medium ${mode === 'student' ? 'bg-primary text-white shadow-elevated' : 'bg-surface text-text-secondary hover:bg-primary-light'}`}>
          By Student (all subjects at once)
        </button>
        <button onClick={() => setMode('bulk')}
          className={`px-4 py-2 rounded-input text-sm font-medium ${mode === 'bulk' ? 'bg-primary text-white shadow-elevated' : 'bg-surface text-text-secondary hover:bg-primary-light'}`}>
          Bulk Sheet (Download / Upload)
        </button>
      </div>

      {mode === 'student' ? (
        <StudentEntryView classId={classId} termId={termId} isAdmin={isAdmin} />
      ) : mode === 'bulk' ? (
        <BulkTools classId={classId} termId={termId} isAdmin={isAdmin} />
      ) : (
        <>
          <Card className="mb-4">
            <div className="flex flex-col md:flex-row gap-4 md:items-end">
              <Select label="Subject" value={subjectId} onChange={(e) => setSubjectId(e.target.value)} options={subjectOptions} placeholder="Select subject" />
              {isAdmin && subjectId && (
                <Button variant={sheet?.locked ? 'secondary' : 'danger'} onClick={() => toggleLock(!sheet?.locked)}
                  leftIcon={sheet?.locked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}>
                  {sheet?.locked ? 'Unlock Results' : 'Lock Results'}
                </Button>
              )}
              {subjectId && (
                <Button onClick={save} loading={saving} disabled={!sheet?.students.length || (sheet?.locked && !isAdmin)}
                  leftIcon={<Save className="h-4 w-4" />}>Save Scores</Button>
              )}
            </div>
          </Card>

          {sheet?.locked && (
            <div className="mb-4 flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 p-3 rounded-input">
              <Lock className="h-4 w-4" /> Results are locked. {isAdmin ? 'Unlock to allow edits.' : 'Only an administrator can unlock.'}
            </div>
          )}
          {error && <div className="mb-4 text-sm text-red-500 bg-red-50 p-3 rounded-input">{error}</div>}
          {info && <div className="mb-4 text-sm text-green-700 bg-green-50 p-3 rounded-input">{info}</div>}

          {subjectId && sheet && (
            <Card className="p-0 overflow-hidden">
              <div className="p-4 border-b border-border">
                <Input placeholder="Search student by name or ID..." value={search}
                  onChange={(e) => setSearch(e.target.value)} leftIcon={<Search className="h-4 w-4" />} className="md:max-w-xs" />
              </div>
              <Table headers={['Student', 'CA (0–30)', 'Exam (0–70)', 'Total', 'Grade', 'Position']}>
                {pageStudents.map((s) => {
                  const r = sheet.results.find((x) => x.studentId === s.id);
                  const test = scores[s.id]?.testScore ?? '';
                  const exam = scores[s.id]?.examScore ?? '';
                  const liveTotal = test !== '' && exam !== '' ? Number(test) + Number(exam) : r?.totalScore;
                  return (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-text-primary">{s.fullName}</td>
                      <td className="px-4 py-3">
                        <input type="number" min={0} max={30} className="input-field w-24" value={test}
                          disabled={sheet.locked}
                          onChange={(e) => setScores({ ...scores, [s.id]: { ...scores[s.id], testScore: e.target.value } })} />
                      </td>
                      <td className="px-4 py-3">
                        <input type="number" min={0} max={70} className="input-field w-24" value={exam}
                          disabled={sheet.locked}
                          onChange={(e) => setScores({ ...scores, [s.id]: { ...scores[s.id], examScore: e.target.value } })} />
                      </td>
                      <td className="px-4 py-3 font-semibold text-text-primary">{liveTotal ?? '—'}</td>
                      <td className="px-4 py-3">{r?.grade ? <StatusBadge status="info" label={r.grade} /> : '—'}</td>
                      <td className="px-4 py-3 text-text-secondary">{r?.position ?? '—'}</td>
                    </tr>
                  );
                })}
                {sheet.students.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-text-muted">No active students in this class.</td></tr>
                )}
                {sheet.students.length > 0 && pageStudents.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-text-muted">No students match your search.</td></tr>
                )}
              </Table>
              <Pagination page={safePage} totalPages={totalPages} total={filteredStudents.length} onChange={setPage} />
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function StudentEntryView({ classId, termId, isAdmin }: { classId: string; termId: string; isAdmin: boolean }) {
  const [sheet, setSheet] = useState<ClassSheet | null>(null);
  const [mySubjects, setMySubjects] = useState<{ id: string; name: string; code?: string }[] | null>(null);
  const [target, setTarget] = useState<EntryStudent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const load = useCallback(() => {
    if (!classId || !termId) return;
    getClassSheet({ classId, termId }).then(setSheet).catch((e) => setError(e?.response?.data?.error?.message ?? 'Failed'));
  }, [classId, termId]);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (isAdmin) { setMySubjects(null); return; }
    fetchMyClasses().then((list) => {
      const mine = list.find((c) => c.classId === classId);
      setMySubjects(mine?.subjects ?? []);
    }).catch(console.error);
  }, [classId, isAdmin]);

  useEffect(() => { setPage(1); }, [search]);

  const subjects = isAdmin ? (sheet?.subjects ?? []) : (mySubjects ?? []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = sheet?.students ?? [];
    if (!q) return list;
    return list.filter((s) => s.fullName.toLowerCase().includes(q) || s.studentId.toLowerCase().includes(q));
  }, [sheet, search]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / 10));
  const safePage = Math.min(page, totalPages);
  const pageStudents = filtered.slice((safePage - 1) * 10, safePage * 10);

  return (
    <div>
      {error && <div className="mb-4 text-sm text-red-500 bg-red-50 p-3 rounded-input">{error}</div>}
      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-border">
          <Input placeholder="Search student by name or ID..." value={search}
            onChange={(e) => setSearch(e.target.value)} leftIcon={<Search className="h-4 w-4" />} className="md:max-w-xs" />
        </div>
        <Table headers={['Student', 'Subjects Entered', 'Actions']}>
          {pageStudents.map((st) => {
            const entered = new Set((sheet?.results ?? []).filter((r) => r.studentId === st.id).map((r) => r.subjectId)).size;
            return (
              <tr key={st.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-text-primary">{st.fullName}</td>
                <td className="px-4 py-3 text-text-secondary">{entered} of {sheet?.subjects.length ?? 0} subjects</td>
                <td className="px-4 py-3">
                  <Button size="sm" variant="secondary" onClick={() => setTarget(st)}>Enter / Edit Scores</Button>
                </td>
              </tr>
            );
          })}
          {(sheet?.students.length ?? 0) === 0 && (
            <tr><td colSpan={3} className="px-4 py-10 text-center text-text-muted">No active students in this class.</td></tr>
          )}
          {(sheet?.students.length ?? 0) > 0 && pageStudents.length === 0 && (
            <tr><td colSpan={3} className="px-4 py-10 text-center text-text-muted">No students match your search.</td></tr>
          )}
        </Table>
        <Pagination page={safePage} totalPages={totalPages} total={filtered.length} onChange={setPage} />
      </Card>
      <StudentScoresModal student={target} onClose={() => setTarget(null)} onSaved={load}
        classId={classId} termId={termId} subjects={subjects} results={sheet?.results ?? []} />
    </div>
  );
}

function StudentScoresModal({ student, onClose, onSaved, classId, termId, subjects, results }: {
  student: EntryStudent | null; onClose: () => void; onSaved: () => void;
  classId: string; termId: string;
  subjects: { id: string; name: string; code?: string }[];
  results: (EntryResult & { subject: { id: string; name: string } })[];
}) {
  const [entries, setEntries] = useState<Record<string, { ca: string; exam: string }>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!student) return;
    setError(null);
    const map: Record<string, { ca: string; exam: string }> = {};
    for (const s of subjects) {
      const r = results.find((x) => x.studentId === student.id && x.subjectId === s.id);
      map[s.id] = { ca: r ? String(r.testScore) : '', exam: r ? String(r.examScore) : '' };
    }
    setEntries(map);
  }, [student, subjects, results]);

  async function save() {
    if (!student) return;
    const filled = Object.entries(entries).filter(([, v]) => v.ca !== '' && v.exam !== '');
    if (!filled.length) { setError('Enter at least one subject (CA and Exam).'); return; }
    const bad = filled.find(([, v]) => Number(v.ca) < 0 || Number(v.ca) > 30 || Number(v.exam) < 0 || Number(v.exam) > 70);
    if (bad) { setError('Invalid score: CA must be 0–30 and Exam must be 0–70.'); return; }
    setSaving(true); setError(null);
    try {
      await saveStudentScores({
        studentId: student.id, classId, termId,
        entries: filled.map(([subjectId, v]) => ({ subjectId, testScore: Number(v.ca), examScore: Number(v.exam) })),
      });
      onSaved(); onClose();
    } catch (e: any) { setError(e?.response?.data?.error?.message ?? 'Failed to save'); }
    finally { setSaving(false); }
  }

  return (
    <Modal open={!!student} onClose={onClose} title={`Scores — ${student?.fullName ?? ''}`} wide>
      <div className="space-y-2 max-h-[60vh] overflow-y-auto">
        {subjects.map((s) => {
          const v = entries[s.id] ?? { ca: '', exam: '' };
          const total = v.ca !== '' && v.exam !== '' ? Number(v.ca) + Number(v.exam) : null;
          return (
            <div key={s.id} className="flex items-center gap-3 bg-gray-50 rounded-input px-3 py-2">
              <div className="flex-1 min-w-0 text-sm font-medium text-text-primary truncate">
                {s.name}{s.code ? ` (${s.code})` : ''}
              </div>
              <input type="number" min={0} max={30} placeholder="CA" className="input-field w-20 h-9"
                value={v.ca} onChange={(e) => setEntries({ ...entries, [s.id]: { ...v, ca: e.target.value } })} />
              <input type="number" min={0} max={70} placeholder="Exam" className="input-field w-20 h-9"
                value={v.exam} onChange={(e) => setEntries({ ...entries, [s.id]: { ...v, exam: e.target.value } })} />
              <div className="w-16 text-right text-sm font-semibold text-text-primary">{total ?? '—'}</div>
            </div>
          );
        })}
        {subjects.length === 0 && (
          <p className="text-sm text-text-muted">No subjects available for entry (check class subjects / your teaching assignments).</p>
        )}
      </div>
      {error && <div className="mt-3 text-sm text-red-500 bg-red-50 p-3 rounded-input">{error}</div>}
      <div className="flex justify-end gap-2 mt-4">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={save} loading={saving} leftIcon={<Save className="h-4 w-4" />}>Save All Subjects</Button>
      </div>
    </Modal>
  );
}

function SheetTab({ classId, termId }: { classId: string; termId: string }) {
  const [sheet, setSheet] = useState<ClassSheet | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [className, setClassName] = useState('');

  useEffect(() => {
    fetchClassesFull().then((cs) => setClassName(cs.find((c) => c.id === classId)?.name ?? '')).catch(() => {});
  }, [classId]);

  useEffect(() => {
    if (!classId || !termId) return;
    getClassSheet({ classId, termId }).then(setSheet).catch((e) => setError(e?.response?.data?.error?.message ?? 'Failed'));
  }, [classId, termId]);

  useEffect(() => { setPage(1); }, [search]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = sheet?.students ?? [];
    if (!q) return list;
    return list.filter((s) => s.fullName.toLowerCase().includes(q) || s.studentId.toLowerCase().includes(q));
  }, [sheet, search]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / 10));
  const safePage = Math.min(page, totalPages);
  const pageStudents = filtered.slice((safePage - 1) * 10, safePage * 10);

  if (!classId || !termId) return <Card><p className="text-sm text-text-muted">Select a class and term.</p></Card>;

  return (
    <Card className="p-0 overflow-x-auto">
      <div className="flex gap-2 m-4 no-print">
        <Button variant="secondary" onClick={() => window.print()} leftIcon={<Printer className="h-4 w-4" />}>Print / Save as PDF</Button>
      </div>
      <div className="print-area bg-white text-black p-6 mx-4 mb-4">
        <div className="text-center mb-2">
          <div className="text-lg font-extrabold uppercase">{className || 'Class'} — Continuous Assessment Result Sheet</div>
          <div className="text-[11px]">Generated {new Date().toLocaleDateString()}</div>
        </div>
        <table className="w-full text-[11px] border-collapse">
          <thead>
            <tr>
              <th className="border border-black px-1 py-1 text-left">Student</th>
              {(sheet?.subjects ?? []).map((s) => (
                <th key={s.id} className="border border-black px-1 py-1">{s.code ?? s.name}</th>
              ))}
              <th className="border border-black px-1 py-1">Average</th>
            </tr>
          </thead>
          <tbody>
            {(sheet?.students ?? []).map((st) => {
              const rs = (sheet?.results ?? []).filter((r) => r.studentId === st.id);
              const avg = rs.length ? Math.round((rs.reduce((a, r) => a + r.totalScore, 0) / rs.length) * 10) / 10 : null;
              return (
                <tr key={st.id}>
                  <td className="border border-black px-1 py-1 text-left">{st.fullName}</td>
                  {(sheet?.subjects ?? []).map((sub) => {
                    const r = rs.find((x) => x.subjectId === sub.id);
                    return <td key={sub.id} className="border border-black px-1 py-1 text-center">{r ? r.totalScore : '—'}</td>;
                  })}
                  <td className="border border-black px-1 py-1 text-center font-semibold">{avg ?? '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {error && <div className="m-4 text-sm text-red-500 bg-red-50 p-3 rounded-input">{error}</div>}
      <div className="p-4 border-b border-border">
        <Input placeholder="Search student by name or ID..." value={search}
          onChange={(e) => setSearch(e.target.value)} leftIcon={<Search className="h-4 w-4" />} className="md:max-w-xs" />
      </div>
      <Table headers={['Student', ...(sheet?.subjects.map((s) => s.name) ?? []), 'Average']}>
        {pageStudents.map((st) => {
          const myResults = (sheet?.results ?? []).filter((r) => r.studentId === st.id);
          const avg = myResults.length
            ? Math.round((myResults.reduce((a, r) => a + r.totalScore, 0) / myResults.length) * 10) / 10
            : null;
          return (
            <tr key={st.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-text-primary">{st.fullName}</td>
              {(sheet?.subjects ?? []).map((sub) => {
                const r = myResults.find((x) => x.subjectId === sub.id);
                return (
                  <td key={sub.id} className="px-4 py-3 text-text-secondary">
                    {r ? `${r.totalScore} (${r.grade ?? '—'}) · ${r.position}${ordinal(r.position)}` : '—'}
                  </td>
                );
              })}
              <td className="px-4 py-3 font-semibold text-text-primary">{avg ?? '—'}</td>
            </tr>
          );
        })}
        {(sheet?.students.length ?? 0) === 0 && (
          <tr><td colSpan={(sheet?.subjects.length ?? 0) + 2} className="px-4 py-10 text-center text-text-muted">No results yet.</td></tr>
        )}
        {(sheet?.students.length ?? 0) > 0 && pageStudents.length === 0 && (
          <tr><td colSpan={(sheet?.subjects.length ?? 0) + 2} className="px-4 py-10 text-center text-text-muted">No students match your search.</td></tr>
        )}
      </Table>
      <Pagination page={safePage} totalPages={totalPages} total={filtered.length} onChange={setPage} />
    </Card>
  );
}

function ordinal(n: number | null) {
  if (!n) return '';
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

function ReportTab({ classId, termId, isAdmin }: { classId: string; termId: string; isAdmin: boolean }) {
  const { user } = useAuthStore();
  const [students, setStudents] = useState<{ value: string; label: string }[]>([]);
  const [studentId, setStudentId] = useState('');
  const [card, setCard] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [extrasOpen, setExtrasOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [classTeacherOpen, setClassTeacherOpen] = useState(false);
  const [bulkCards, setBulkCards] = useState<any[] | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const bulkRef = useRef<HTMLDivElement>(null);
  const pendingPrint = useRef(false);

  async function bulkPrint() {
    if (!classId || !termId) return;
    setBulkLoading(true);
    try {
      const cards = await fetchReportCardsBulk({ classId, termId });
      if (!cards.length) { setBulkLoading(false); return; }
      pendingPrint.current = true;
      setBulkCards(cards);
    } catch { setBulkLoading(false); }
  }

  useEffect(() => {
    if (!bulkCards || !pendingPrint.current) return;
    const t = setTimeout(() => {
      printBulkCards();
      pendingPrint.current = false;
      setBulkCards(null);
      setBulkLoading(false);
    }, 400);
    return () => clearTimeout(t);
  }, [bulkCards]);

  function printBulkCards() {
    const holder = bulkRef.current;
    if (!holder) return;
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument;
    if (!doc) return;
    doc.open();
    doc.write('<!DOCTYPE html><html><head><title>Report Cards</title></head><body></body></html>');
    doc.close();
    document.querySelectorAll('style, link[rel="stylesheet"]').forEach((n) => {
      doc.head.appendChild(n.cloneNode(true));
    });
    const extra = doc.createElement('style');
    extra.textContent = `
      @page { size: A4 portrait; margin: 8mm; }
      .print-area { position: static !important; inset: auto !important; width: 100% !important; border: none !important; }
      .bulk-card { break-after: page; page-break-after: always; }
      .bulk-card:last-child { break-after: auto; page-break-after: auto; }
    `;
    doc.head.appendChild(extra);
    Array.from(holder.children).forEach((wrap) => {
      const div = doc.createElement('div');
      div.className = 'bulk-card';
      div.innerHTML = wrap.innerHTML;
      doc.body.appendChild(div);
    });
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => document.body.removeChild(iframe), 1500);
    }, 300);
  }


  useEffect(() => {
    setStudentId(''); setCard(null);
    if (!classId || !termId) return;
    fetchClassRoster({ classId, termId }).then((list) => {
      setStudents(list.map((x) => ({ value: x.id, label: x.fullName })));
    }).catch(console.error);
  }, [classId, termId]);

  const loadCard = useCallback(() => {
    setCard(null); setError(null);
    if (!studentId || !termId) return;
    getReportCard({ studentId, termId }).then(setCard)
      .catch((e) => setError(e?.response?.data?.error?.message ?? 'No results yet for this student/term.'));
  }, [studentId, termId]);

  useEffect(() => { loadCard(); }, [loadCard]);

  async function generate() {
    setError(null); setInfo(null);
    try {
      const r = await generateReportCards({ classId, termId });
      setInfo(`Report cards generated for ${r.count} student(s).`);
    } catch (e: any) { setError(e?.response?.data?.error?.message ?? 'Failed'); }
  }

  if (!classId || !termId) return <Card><p className="text-sm text-text-muted">Select a class and term.</p></Card>;

  return (
    <div>
      <Card className="mb-4 no-print">
        <div className="flex flex-col md:flex-row gap-4 md:items-end flex-wrap">
          <Select label="Student" value={studentId} onChange={(e) => setStudentId(e.target.value)} options={students} placeholder="Select student" />
          <Button variant="secondary" onClick={() => setExtrasOpen(true)} disabled={!studentId}>Conduct & Comments</Button>
            {user?.role === 'TEACHER' && (
            <UploadButton label="Upload My Signature" onUploaded={(url) => {
              updateMySignature(url)
                .then(() => setInfo('Signature uploaded. It will appear on report cards you sign.'))
                .catch((e) => setError(e?.response?.data?.error?.message ?? 'Failed'));
            }} />
          )}
          {isAdmin && <Button variant="secondary" onClick={() => setClassTeacherOpen(true)}>Assign Class Teacher</Button>}
          {isAdmin && <Button variant="secondary" onClick={() => setSettingsOpen(true)}>School Settings</Button>}
          {isAdmin && <Button variant="secondary" onClick={generate}>Generate / Refresh All</Button>}
          {card && <Button onClick={() => window.print()} leftIcon={<Printer className="h-4 w-4" />}>Print / Save as PDF</Button>}
        </div>
        {error && <div className="mt-3 text-sm text-red-500 bg-red-50 p-3 rounded-input">{error}</div>}
        {info && <div className="mt-3 text-sm text-green-700 bg-green-50 p-3 rounded-input">{info}</div>}
      </Card>
      {card && isAdmin && !card.classTeacherName && (
        <div className="mb-4 flex items-center gap-2 flex-wrap text-sm text-amber-700 bg-amber-50 border border-amber-200 p-3 rounded-input no-print">
          No class teacher is assigned to this class — the Class Teacher's signature line will be blank.
          <Button size="sm" variant="secondary" onClick={() => setClassTeacherOpen(true)}>Assign Class Teacher</Button>
        </div>
      )}
      {card && (
        <div className={bulkCards ? 'no-print' : ''}>
          <ReportCardTemplate data={card} />
        </div>
      )}
      {card && (
        <div className="flex flex-wrap gap-2 mt-4 no-print">
          <Button variant="secondary" onClick={() => window.print()} leftIcon={<Printer className="h-4 w-4" />}>Print / Save as PDF</Button>
          <Button variant="secondary" onClick={bulkPrint} loading={bulkLoading} leftIcon={<FileText className="h-4 w-4" />}>Bulk Print / Save as PDF (Whole Class)</Button>
        </div>
      )}
      <div className="bulk-print-holder">
        <div ref={bulkRef}>
          {(bulkCards ?? []).map((c: any, i: number) => (
            <div key={i} className="pdf-page-break">
              <ReportCardTemplate data={c} />
            </div>
          ))}
        </div>
      </div>

      <ExtrasModal open={extrasOpen} onClose={() => setExtrasOpen(false)} studentId={studentId} termId={termId} card={card} onSaved={loadCard} />
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} onSaved={loadCard} />
      <ClassTeacherModal open={classTeacherOpen} onClose={() => setClassTeacherOpen(false)} classId={classId} />
    </div>
  );
}

const QUALITIES = ['Attentiveness', 'Cleanliness', 'Emotional Balance', 'Honesty', 'Leadership', 'Maturity', 'Politeness', 'Punctuality'];
const ACTIVITIES = ['Handwriting', 'Verbal Fluency', 'Debate/Quiz', 'Sports', 'Drawing & Painting', 'Musical Skills', 'Handling Tools'];

function ExtrasModal({ open, onClose, studentId, termId, card, onSaved }: {
  open: boolean; onClose: () => void; studentId: string; termId: string; card: any; onSaved: () => void;
}) {
  const { user } = useAuthStore();
  const isTeacher = user?.role === 'TEACHER';
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const [ratings, setRatings] = useState<Record<string, string>>({});
  const [comments, setComments] = useState({ teacherComment: '', healthComment: '', headTeacherComment: '', parentComment: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !card) return;
    setError(null);
    const map: Record<string, string> = {};
    for (const c of card.conduct ?? []) map[`${c.category}:${c.item}`] = c.rating;
    setRatings(map);
    setComments({
      teacherComment: card.remarks?.teacherComment ?? '',
      healthComment: card.remarks?.healthComment ?? '',
      headTeacherComment: card.remarks?.headTeacherComment ?? '',
      parentComment: card.remarks?.parentComment ?? '',
    });
  }, [open, card]);

  async function save() {
    setSaving(true); setError(null);
    try {
      if (isTeacher || isAdmin) {
        await saveConduct({
          studentId, termId,
          ratings: Object.entries(ratings).map(([k, rating]) => {
            const [category, ...rest] = k.split(':');
            return { category: category as 'quality' | 'activity', item: rest.join(':'), rating: rating as any };
          }).filter((r) => !!r.rating),
        });
      }
      const payload: any = { studentId, termId };
      if (isTeacher) { payload.teacherComment = comments.teacherComment; payload.healthComment = comments.healthComment; }
      if (isAdmin) { payload.headTeacherComment = comments.headTeacherComment; }
      await saveRemarks(payload);
      onSaved(); onClose();
    } catch (e: any) { setError(e?.response?.data?.error?.message ?? 'Failed to save'); }
    finally { setSaving(false); }
  }

  const ratingSelect = (key: string) => (
    <select
      className="h-9 w-28 shrink-0 rounded-input border border-border bg-surface px-2 text-xs font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60"
      value={ratings[key] ?? ''} disabled={!(isTeacher || isAdmin)}
      onChange={(e) => setRatings({ ...ratings, [key]: e.target.value })}>
      <option value="">— None —</option>
      <option value="exc">Excellent</option>
      <option value="good">Good</option>
      <option value="fair">Fair</option>
      <option value="poor">Poor</option>
    </select>
  );

  return (
    <Modal open={open} onClose={onClose} title="Conduct, Skills & Comments" wide>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="font-semibold text-sm mb-2">Qualities (2. Conduct)</div>
            <div className="space-y-1">{QUALITIES.map((q) => (
              <div key={q} className="flex items-center justify-between gap-2">
                <span className="text-sm text-text-secondary">{q}</span>{ratingSelect(`quality:${q}`)}
              </div>))}
            </div>
          </div>
          <div>
            <div className="font-semibold text-sm mb-2">Activities (3. Physical Skills)</div>
            <div className="space-y-1">{ACTIVITIES.map((a) => (
              <div key={a} className="flex items-center justify-between gap-2">
                <span className="text-sm text-text-secondary">{a}</span>{ratingSelect(`activity:${a}`)}
              </div>))}
            </div>
          </div>
        </div>

        {isTeacher && (
          <>
            <Input label="Class Teacher's Comment" value={comments.teacherComment}
              onChange={(e) => setComments({ ...comments, teacherComment: e.target.value })} />
            <Input label="General Comments on Health" value={comments.healthComment}
              onChange={(e) => setComments({ ...comments, healthComment: e.target.value })} />
          </>
        )}
        {isAdmin && (
          <Input label="Head Teacher's Comments" value={comments.headTeacherComment}
            onChange={(e) => setComments({ ...comments, headTeacherComment: e.target.value })} />
        )}
        {user?.role === 'PARENT' && (
          <Input label="Parent's Comment" value={comments.parentComment}
            onChange={(e) => setComments({ ...comments, parentComment: e.target.value })} />
        )}

        {error && <div className="text-sm text-red-500 bg-red-50 p-3 rounded-input">{error}</div>}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save} loading={saving}>Save</Button>
        </div>
      </div>
    </Modal>
  );
}

function SettingsModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    schoolName: '', motto: '', address: '', phone: '', email: '', headTeacherName: '',
    logoUrl: '', officialStampUrl: '', headTeacherSignatureUrl: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    fetchSettings().then((s: any) => {
      if (s) setForm({
        schoolName: s.schoolName ?? '', motto: s.motto ?? '', address: s.address ?? '',
        phone: s.phone ?? '', email: s.email ?? '', headTeacherName: s.headTeacherName ?? '',
        logoUrl: s.logoUrl ?? '', officialStampUrl: s.officialStampUrl ?? '',
        headTeacherSignatureUrl: s.headTeacherSignatureUrl ?? '',
      });
    }).catch(console.error);
  }, [open]);

  async function save() {
    setSaving(true); setError(null);
    try {
      const payload = Object.fromEntries(
        Object.entries(form).map(([k, v]) => [k, k === 'schoolName' ? v : (v === '' ? null : v)]),
      );
      await updateSettings(payload);
      onSaved(); onClose();
    } catch (e: any) { setError(e?.response?.data?.error?.message ?? 'Failed'); }
    finally { setSaving(false); }
  }

  function UploadRow({ label, value, onChange }: { label: string; value: string; onChange: (url: string) => void }) {
    return (
      <div className="flex items-center gap-3 flex-wrap">
        <div className="w-44 text-sm text-text-secondary">{label}</div>
        {value && <img src={assetUrl(value)!} alt={label} className="h-10 border border-border rounded p-0.5 bg-white" />}
        <UploadButton label={value ? 'Replace' : 'Upload'} onUploaded={onChange} />
        {value && <Button variant="ghost" size="sm" onClick={() => onChange('')}>Remove</Button>}
      </div>
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="School Settings (Header, Logo & Signatures)" wide>
      <div className="space-y-4">
        <Input label="School Name" value={form.schoolName} onChange={(e) => setForm({ ...form, schoolName: e.target.value })} />
        <Input label="Motto" value={form.motto} onChange={(e) => setForm({ ...form, motto: e.target.value })} />
        <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        <Input label="Phone Numbers (comma separated)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Input label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Input label="Head Teacher's Name" value={form.headTeacherName} onChange={(e) => setForm({ ...form, headTeacherName: e.target.value })} />
        <div className="space-y-3 border-t border-border pt-4">
          <UploadRow label="School Logo" value={form.logoUrl} onChange={(url) => setForm({ ...form, logoUrl: url })} />
          <UploadRow label="Official Stamp" value={form.officialStampUrl} onChange={(url) => setForm({ ...form, officialStampUrl: url })} />
          <UploadRow label="Head Teacher Signature" value={form.headTeacherSignatureUrl} onChange={(url) => setForm({ ...form, headTeacherSignatureUrl: url })} />
        </div>
        {error && <div className="text-sm text-red-500 bg-red-50 p-3 rounded-input">{error}</div>}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save} loading={saving}>Save Settings</Button>
        </div>
      </div>
    </Modal>
  );
}

function ClassTeacherModal({ open, onClose, classId }: { open: boolean; onClose: () => void; classId: string }) {
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [teacherId, setTeacherId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) fetchTeachers({ pageSize: 100 }).then((r) => setTeachers(r.items)).catch(console.error);
  }, [open]);

  async function save() {
    setSaving(true); setError(null);
    try { await updateClass(classId, { classTeacherId: teacherId || null }); onClose(); }
    catch (e: any) { setError(e?.response?.data?.error?.message ?? 'Failed'); }
    finally { setSaving(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title="Assign Class Teacher">
      <div className="space-y-4">
        <Select label="Class Teacher" placeholder="Select teacher" value={teacherId}
          onChange={(e) => setTeacherId(e.target.value)}
          options={teachers.map((t) => ({ value: t.id, label: `${t.user.fullName} (${t.teacherCode})` }))} />
        {error && <div className="text-sm text-red-500 bg-red-50 p-3 rounded-input">{error}</div>}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save} loading={saving}>Save</Button>
        </div>
      </div>
    </Modal>
  );
}

interface BulkSummary {
  status: 'success' | 'error';
  students?: number;
  scores?: number;
  errors: string[];
}

function BulkTools({ classId, termId, isAdmin }: { classId: string; termId: string; isAdmin: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<BulkSummary | null>(null);

  const loadContext = useCallback(async () => {
    const sheet = await getClassSheet({ classId, termId });
    let subjects = sheet.subjects;
    if (!isAdmin) {
      const mine = await fetchMyClasses();
      const m = mine.find((c) => c.classId === classId);
      const ids = new Set((m?.subjects ?? []).map((s) => s.id));
      subjects = subjects.filter((s) => ids.has(s.id));
    }
    return { sheet, subjects };
  }, [classId, termId, isAdmin]);

  async function download(bookType: 'xlsx' | 'csv') {
    setBusy(true); setError(null);
    try {
      const { sheet, subjects } = await loadContext();
      const aoa: (string | number)[][] = [];
      const header: (string | number)[] = ['Student ID', 'Student Name'];
      for (const s of subjects) header.push(`${s.code} CA`, `${s.code} Exam`);
      aoa.push(header);
      for (const st of sheet.students) {
        const row: (string | number)[] = [st.studentId, st.fullName];
        for (const s of subjects) {
          const r = sheet.results.find((x) => x.studentId === st.id && x.subjectId === s.id);
          row.push(r ? r.testScore : '', r ? r.examScore : '');
        }
        aoa.push(row);
      }
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Scores');
      XLSX.writeFile(wb, `score-sheet.${bookType}`, { bookType });
    } catch (e: any) { setError(e?.message ?? 'Download failed'); }
    finally { setBusy(false); }
  }

  async function upload(file: File) {
    setBusy(true); setError(null); setSummary(null);
    const errors: string[] = [];
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as (string | number)[][];
      const { sheet, subjects } = await loadContext();

      const header = aoa[0] ?? [];
      if (String(header[0]).trim() !== 'Student ID' || String(header[1]).trim() !== 'Student Name') {
        errors.push('Header row: column 1 must be "Student ID" and column 2 must be "Student Name". Do not rearrange or rename columns.');
      }
      const idByCode = new Map(subjects.map((s) => [s.code.toUpperCase(), s.id]));
      const codeBySubject = new Map(subjects.map((s) => [s.id, s.code]));
      const colMap: { idx: number; subjectId: string; kind: 'ca' | 'exam' }[] = [];
      for (let i = 2; i < header.length; i++) {
        const h = String(header[i] ?? '').trim();
        if (!h) continue;
        const m = h.match(/^(.+)\s+(CA|Exam)$/i);
        if (!m) { errors.push(`Header column ${i + 1}: "${h}" is invalid — expected "CODE CA" or "CODE Exam" (e.g. "MATH CA").`); continue; }
        const sid = idByCode.get(m[1].trim().toUpperCase());
        if (!sid) { errors.push(`Header column ${i + 1}: subject code "${m[1].trim()}" is not offered by this class (or not assigned to you).`); continue; }
        colMap.push({ idx: i, subjectId: sid, kind: m[2].toLowerCase() as 'ca' | 'exam' });
      }

      const studentByCode = new Map(sheet.students.map((s) => [s.studentId, s]));
      const buckets = new Map<string, { code: string; entries: Map<string, { ca?: number; exam?: number }> }>();

      for (let r = 1; r < aoa.length; r++) {
        const row = aoa[r];
        if (!row || row.every((c) => String(c).trim() === '')) continue;
        const code = String(row[0] ?? '').trim();
        const st = studentByCode.get(code);
        if (!st) { errors.push(`Row ${r + 1}: student ID "${code}" does not exist in this class.`); continue; }
        if (!buckets.has(st.id)) buckets.set(st.id, { code, entries: new Map() });
        const bucket = buckets.get(st.id)!;
        for (const c of colMap) {
          const txt = String(row[c.idx] ?? '').trim();
          if (txt === '') continue;
          const num = Number(txt);
          if (!isFinite(num)) { errors.push(`Row ${r + 1} (${code}), column ${c.idx + 1}: "${txt}" is not a number.`); continue; }
          if (c.kind === 'ca' && (num < 0 || num > 30)) { errors.push(`Row ${r + 1} (${code}): ${codeBySubject.get(c.subjectId)} CA must be 0–30 (got ${num}).`); continue; }
          if (c.kind === 'exam' && (num < 0 || num > 70)) { errors.push(`Row ${r + 1} (${code}): ${codeBySubject.get(c.subjectId)} Exam must be 0–70 (got ${num}).`); continue; }
          const ent = bucket.entries.get(c.subjectId) ?? {};
          if (c.kind === 'ca') ent.ca = num; else ent.exam = num;
          bucket.entries.set(c.subjectId, ent);
        }
      }

      const studentsPayload: { studentId: string; entries: { subjectId: string; testScore: number; examScore: number }[] }[] = [];
      let scoreCount = 0;
      for (const [studentId, b] of buckets) {
        const entries: { subjectId: string; testScore: number; examScore: number }[] = [];
        for (const [subjectId, ent] of b.entries) {
          if (ent.ca == null || ent.exam == null) {
            errors.push(`Student ${b.code}: ${codeBySubject.get(subjectId)} has only one of CA/Exam — both are required.`);
            continue;
          }
          entries.push({ subjectId, testScore: ent.ca, examScore: ent.exam });
          scoreCount++;
        }
        if (entries.length) studentsPayload.push({ studentId, entries });
      }

      if (errors.length) { setSummary({ status: 'error', errors }); return; }
      if (!studentsPayload.length) { setSummary({ status: 'error', errors: ['No score rows found in the file.'] }); return; }

      const res = await saveClassScores({ classId, termId, students: studentsPayload });
      setSummary({ status: 'success', students: res.students, scores: res.scores, errors: [] });
    } catch (e: any) {
      setError(e?.response?.data?.error?.message ?? e?.message ?? 'Upload failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <div className="text-sm text-text-secondary mb-4">
        Download the score sheet for this class & term (subjects as column pairs, students as rows, existing scores pre-filled).
        Compute in Excel offline, then upload the filled file. Everything is validated first — if any cell fails,
        <strong> nothing is saved</strong> and you receive a full error report.
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <Button onClick={() => download('xlsx')} loading={busy} leftIcon={<Download className="h-4 w-4" />}>Download Excel (.xlsx)</Button>
        <Button variant="secondary" onClick={() => download('csv')} loading={busy} leftIcon={<Download className="h-4 w-4" />}>Download CSV</Button>
        <label className="inline-block">
          <input type="file" accept=".xlsx,.xls,.csv" className="hidden" disabled={busy}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ''; }} />
          <span className="btn-primary inline-flex items-center gap-2 cursor-pointer text-sm">
            <Upload className="h-4 w-4" /> {busy ? 'Processing...' : 'Upload Filled Sheet'}
          </span>
        </label>
      </div>
      {error && <div className="mt-4 text-sm text-red-500 bg-red-50 p-3 rounded-input">{error}</div>}
      <BulkSummaryModal summary={summary} onClose={() => setSummary(null)} />
    </Card>
  );
}

function BulkSummaryModal({ summary, onClose }: { summary: BulkSummary | null; onClose: () => void }) {
  return (
    <Modal open={!!summary} onClose={onClose}
      title={summary?.status === 'success' ? 'Upload Successful' : 'Upload Failed — Validation Errors'} wide>
      {!summary ? null : summary.status === 'success' ? (
        <div className="space-y-2 text-sm">
          <div className="text-green-700 bg-green-50 p-3 rounded-input font-medium">
            All rows validated and saved successfully.
          </div>
          <div className="text-text-secondary">Students processed: <strong>{summary.students}</strong></div>
          <div className="text-text-secondary">Score pairs saved (CA + Exam): <strong>{summary.scores}</strong></div>
          <div className="text-xs text-text-muted">Grades, totals and subject positions were recomputed automatically.</div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="text-red-600 bg-red-50 p-3 rounded-input text-sm font-medium">
            {summary.errors.length} error(s) found. Nothing was saved — fix the file and upload again.
          </div>
          <div className="max-h-[50vh] overflow-y-auto space-y-1">
            {summary.errors.map((e, i) => (
              <div key={i} className="text-xs text-red-600 bg-red-50/60 px-2 py-1 rounded">{e}</div>
            ))}
          </div>
        </div>
      )}
      <div className="flex justify-end mt-4">
        <Button onClick={onClose}>Close</Button>
      </div>
    </Modal>
  );
}