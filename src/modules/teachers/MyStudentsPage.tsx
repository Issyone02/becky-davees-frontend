import { useEffect, useMemo, useState } from 'react';
import client from '../../api/client';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Input } from '../../components/ui/Input';
import { Pagination } from '../../components/ui/Pagination';
import { Search } from 'lucide-react';

interface MyStudent { id: string; studentId: string; fullName: string; gender: string; class: { name: string } }

export function MyStudentsPage() {
  const [rows, setRows] = useState<MyStudent[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    client.get('/teachers/my-students')
      .then(({ data }) => setRows(data.data))
      .catch((e) => setError(e?.response?.data?.error?.message ?? 'Failed'));
  }, []);

  useEffect(() => { setPage(1); }, [search]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((s) =>
      s.fullName.toLowerCase().includes(q) ||
      s.studentId.toLowerCase().includes(q) ||
      s.class.name.toLowerCase().includes(q));
  }, [rows, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / 10));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * 10, safePage * 10);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">My Students</h1>
        <p className="text-text-secondary">All students across the classes you teach this term.</p>
      </div>
      {error && <div className="mb-4 text-sm text-red-500 bg-red-50 p-3 rounded-input">{error}</div>}
      <Card className="mb-4">
        <Input placeholder="Search by name, ID or class..." value={search} onChange={(e) => setSearch(e.target.value)} leftIcon={<Search className="h-4 w-4" />} />
      </Card>
      <Card className="p-0 overflow-hidden">
        <Table headers={['Student ID', 'Name', 'Class', 'Gender']}>
          {pageRows.map((s) => (
            <tr key={s.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-text-secondary">{s.studentId}</td>
              <td className="px-4 py-3 font-medium text-text-primary">{s.fullName}</td>
              <td className="px-4 py-3"><span className="badge badge-info">{s.class.name}</span></td>
              <td className="px-4 py-3 text-text-secondary capitalize">{s.gender.toLowerCase()}</td>
            </tr>
          ))}
          {pageRows.length === 0 && (
            <tr><td colSpan={4} className="px-4 py-10 text-center text-text-muted">No students found.</td></tr>
          )}
        </Table>
        <Pagination page={safePage} totalPages={totalPages} total={filtered.length} onChange={setPage} />
      </Card>
    </div>
  );
}