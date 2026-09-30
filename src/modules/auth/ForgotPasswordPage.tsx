import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { requestPasswordReset } from '../../api/auth';
import { Mail } from 'lucide-react';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setLoading(true);
    try { await requestPasswordReset(email); setSent(true); }
    catch (err: any) { setError(err?.response?.data?.error?.message ?? 'Failed'); }
    finally { setLoading(false); }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-text-primary mb-1">Forgot Password</h2>
      <p className="text-text-secondary mb-6">Enter your email to receive a reset link</p>
      {sent ? (
        <div className="text-sm text-green-600 bg-green-50 p-4 rounded-input">
          If an account exists for that email, a reset link has been sent.
          <div className="mt-4"><Link to="/login" className="text-primary font-semibold">← Back to login</Link></div>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} leftIcon={<Mail className="h-4 w-4" />} required />
          {error && <div className="text-sm text-red-500 bg-red-50 p-3 rounded-input">{error}</div>}
          <Button type="submit" className="w-full h-12" loading={loading}>Send Reset Link</Button>
          <div className="text-center text-sm"><Link to="/login" className="text-primary">← Back to login</Link></div>
        </form>
      )}
    </div>
  );
}