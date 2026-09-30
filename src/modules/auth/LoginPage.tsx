import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { login } from '../../api/auth';
import { useAuthStore } from '../../store/auth.store';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

export function LoginPage() {
  const nav = useNavigate();
  const { user } = useAuthStore();
  const [form, setForm] = useState({ emailOrUsername: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (user) {
    nav('/', { replace: true });
    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const u = await login(form.emailOrUsername, form.password);
      if (u.mustChangePassword) nav('/change-password', { replace: true });
      else nav('/', { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? 'Login failed');
    } finally { setLoading(false); }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-text-primary mb-1">Welcome Back</h2>
      <p className="text-text-secondary mb-6">Log in to your account to continue</p>
      <form onSubmit={onSubmit} className="space-y-4">
        <Input
          label="Email or Username"
          placeholder="Enter your email"
          value={form.emailOrUsername}
          onChange={(e) => setForm({ ...form, emailOrUsername: e.target.value })}
          leftIcon={<Mail className="h-4 w-4" />}
          required
        />
        <Input
          label="Password"
          type={showPw ? 'text' : 'password'}
          placeholder="Enter your password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          leftIcon={<Lock className="h-4 w-4" />}
          rightIcon={<button type="button" onClick={() => setShowPw(!showPw)} className="text-text-muted">{showPw ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}</button>}
          required
        />
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-text-secondary">
            <input type="checkbox" className="rounded border-border text-primary focus:ring-primary" />
            Remember me
          </label>
          <Link to="/forgot-password" className="text-primary font-medium hover:underline">Forgot password?</Link>
        </div>
        {error && <div className="text-sm text-red-500 bg-red-50 p-3 rounded-input">{error}</div>}
        <Button type="submit" className="w-full h-12" loading={loading}>Log in</Button>
      </form>
      <div className="mt-6 text-center text-sm text-text-secondary">
        Don't have an account?{' '}
        <Link to="/register" className="text-primary font-semibold hover:underline">Sign Up →</Link>
      </div>
    </div>
  );
}