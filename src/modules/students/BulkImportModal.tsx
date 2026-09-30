import { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Download, Upload } from 'lucide-react';
import { downloadBulkTemplate, bulkImportStudents } from '../../api/people';

interface BulkSummary {
  status: 'success' | 'error';
  created?: number;
  guardiansLinked?: number;
  errors: string[];
}

export function BulkImportModal({ open, onClose, onSaved, classFilter }: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  classFilter: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<BulkSummary | null>(null);

  async function downloadTemplate() {
    try {
      const blob = await downloadBulkTemplate(classFilter || undefined);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'student-import-template.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e?.response?.data?.error?.message ?? 'Failed to download template');
    }
  }

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    setSummary(null);
    try {
      const result = await bulkImportStudents(file);
      setSummary(result);
      if (result.status === 'success') {
        onSaved();
      }
    } catch (e: any) {
      setError(e?.response?.data?.error?.message ?? 'Upload failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Bulk Add Students" wide>
      <div className="space-y-4">
        <div className="text-sm text-text-secondary">
          Download the template, fill it with student data (one row per student), then upload the completed file.
          All rows are validated before anything is saved — if any row fails, nothing is imported and you receive a full error report.
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={downloadTemplate} leftIcon={<Download className="h-4 w-4" />}>
            Download Template (.xlsx)
          </Button>
          <label className="inline-block">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              disabled={busy}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) upload(f);
                e.target.value = '';
              }}
            />
            <span className="btn-primary inline-flex items-center gap-2 cursor-pointer text-sm">
              <Upload className="h-4 w-4" /> {busy ? 'Processing...' : 'Upload Completed File'}
            </span>
          </label>
        </div>

        {error && <div className="text-sm text-red-500 bg-red-50 p-3 rounded-input">{error}</div>}

        {summary && summary.status === 'success' && (
          <div className="space-y-2">
            <div className="text-green-700 bg-green-50 p-3 rounded-input text-sm font-medium">
              All rows validated and imported successfully.
            </div>
            <div className="text-text-secondary text-sm">Students created: <strong>{summary.created}</strong></div>
            <div className="text-text-secondary text-sm">Guardians linked: <strong>{summary.guardiansLinked}</strong></div>
            <div className="text-xs text-text-muted">
              Enrollment records for the current session were created automatically. Students now appear in rosters, report cards and promotions.
            </div>
          </div>
        )}

        {summary && summary.status === 'error' && (
          <div className="space-y-2">
            <div className="text-red-600 bg-red-50 p-3 rounded-input text-sm font-medium">
              {summary.errors.length} error(s) found. Nothing was imported — fix the file and upload again.
            </div>
            <div className="max-h-[50vh] overflow-y-auto space-y-1">
              {summary.errors.map((e, i) => (
                <div key={i} className="text-xs text-red-600 bg-red-50/60 px-2 py-1 rounded">{e}</div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  );
}