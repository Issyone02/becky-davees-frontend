import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchMyChildren, ParentChild } from '../../api/parent';
import { updateStudentPhoto } from '../../api/people';
import { UploadButton } from '../../components/ui/UploadButton';
import { assetUrl } from '../../utils/assetUrl';
import { Card } from '../../components/ui/Card';
import { ClipboardCheck, BookOpen, FileText, DollarSign } from 'lucide-react';

export function MyChildrenPage() {
  const [children, setChildren] = useState<ParentChild[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [savedFor, setSavedFor] = useState<string | null>(null);
  const [photoErr, setPhotoErr] = useState<string | null>(null);

  useEffect(() => {
    fetchMyChildren().then(setChildren).catch((e) => setError(e?.response?.data?.error?.message ?? 'Failed'));
  }, []);

  async function setPhoto(childId: string, url: string | null) {
    setPhotoErr(null);
    try {
      await updateStudentPhoto(childId, url);
      setChildren((prev) => prev.map((k) => (k.id === childId ? { ...k, photoUrl: url } : k)));
      setSavedFor(childId);
      setTimeout(() => setSavedFor(null), 2500);
    } catch (e: any) {
      setPhotoErr(e?.response?.data?.error?.message ?? 'Failed to update photo');
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">My Children</h1>
        <p className="text-text-secondary">Profiles, progress and fees for each linked child.</p>
      </div>
      {error && <div className="mb-4 text-sm text-red-500 bg-red-50 p-3 rounded-input">{error}</div>}
      {photoErr && <div className="mb-4 text-sm text-red-500 bg-red-50 p-3 rounded-input">{photoErr}</div>}
      {children.length === 0 ? (
        <Card><p className="text-sm text-text-muted text-center py-8">No children are linked to your account yet. Contact the school office.</p></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {children.map((c) => (
            <Card key={c.id}>
              <div className="flex items-center gap-3 mb-3">
                {c.photoUrl ? (
                  <img src={assetUrl(c.photoUrl)!} alt={c.fullName}
                    className="h-12 w-12 rounded-full object-cover border border-border bg-white shrink-0" />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-primary-light text-primary font-bold flex items-center justify-center text-lg shrink-0">
                    {c.fullName.charAt(0)}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="font-semibold text-text-primary truncate">{c.fullName}</div>
                  <div className="text-xs text-text-muted">{c.studentId} · {c.className}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <UploadButton label={c.photoUrl ? 'Replace Photo' : 'Upload Photo'} onUploaded={(url) => setPhoto(c.id, url)} />
                {c.photoUrl && (
                  <button onClick={() => setPhoto(c.id, null)} className="text-xs text-red-500 hover:underline">
                    Remove
                  </button>
                )}
                {savedFor === c.id && <span className="text-xs text-green-700 font-medium">Photo saved ✓</span>}
              </div>
              <div className="flex gap-2 mb-4 flex-wrap">
                <span className="badge badge-success">Attendance {c.attendanceRate ?? '—'}%</span>
                <span className="badge badge-info">Average {c.average ?? '—'}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <Link to={`/child/attendance?child=${c.id}`} className="btn-secondary inline-flex items-center justify-center gap-1"><ClipboardCheck className="h-3 w-3" /> Attendance</Link>
                <Link to={`/child/results?child=${c.id}`} className="btn-secondary inline-flex items-center justify-center gap-1"><BookOpen className="h-3 w-3" /> Results</Link>
                <Link to={`/child/report-cards?child=${c.id}`} className="btn-secondary inline-flex items-center justify-center gap-1"><FileText className="h-3 w-3" /> Report Card</Link>
                <Link to={`/fees?child=${c.id}`} className="btn-secondary inline-flex items-center justify-center gap-1"><DollarSign className="h-3 w-3" /> Fees</Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}