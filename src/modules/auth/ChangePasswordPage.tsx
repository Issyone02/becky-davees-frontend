import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { changePassword } from '../../api/auth';
import { useAuthStore } from '../../store/auth.store';
import { Lock } from 'lucide-react';

export function ChangePasswordPage() {
  const nav = useNavigate();
  const { updateUser } = useAuthStore();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.newPassword !== form.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await changePassword(form.currentPassword, form.newPassword);
      updateUser({ mustChangePassword: false });
      nav('/', { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? 'Failed to change password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10">
      <div className="card">
        <h2 className="text-2xl font-bold text-text-primary mb-1">Change Password</h2>
        <p className="text-text-secondary mb-6">
          For your security, you must set a new password before continuing.
        </p>
        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            label="Current Password" type="password"
            value={form.currentPassword}
            onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
            leftIcon={<Lock className="h-4 w-4" />} required
          />
          <Input
            label="New Password" type="password"
            placeholder="Min 8 chars, upper + lower + digit"
            value={form.newPassword}
            onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
            leftIcon={<Lock className="h-4 w-4" />} required
          />
          <Input
            label="Confirm New Password" type="password"
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            leftIcon={<Lock className="h-4 w-4" />} required
          />
          {error && <div className="text-sm text-red-500 bg-red-50 p-3 rounded-input">{error}</div>}
          <Button type="submit" className="w-full h-12" loading={loading}>Update Password</Button>
        </form>
      </div>
    </div>
  );
}