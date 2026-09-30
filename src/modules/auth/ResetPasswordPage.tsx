import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { resetPasswordWithToken } from '../../api/auth';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setBusy(true);
    try {
      await resetPasswordWithToken(token, password);
      setDone(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err: any) { setError(err?.response?.data?.error?.message ?? 'Failed to reset password'); }
    finally { setBusy(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        {done ? (
          <div className="text-center space-y-3">
            <div className="text-sm text-green-700 bg-green-50 p-3 rounded-input">
              Password changed successfully. Redirecting to login…
            </div>
            <Link to="/login" className="text-sm text-primary hover:underline">← Back to login</Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Set New Password</h1>
              <p className="text-sm text-text-secondary">Minimum 8 characters with upper, lower and a digit.</p>
            </div>
            {!token && (
              <div className="text-sm text-red-500 bg-red-50 p-3 rounded-input">
                Missing reset token. Open the link from your email instead.
              </div>
            )}
            <Input label="New Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <Input label="Confirm New Password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
            {error && <div className="text-sm text-red-500 bg-red-50 p-3 rounded-input">{error}</div>}
            <Button type="submit" className="w-full" loading={busy} disabled={!token}>Reset Password</Button>
            <Link to="/login" className="block text-sm text-primary hover:underline">← Back to login</Link>
          </form>
        )}
      </Card>
    </div>
  );
}