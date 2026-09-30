import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { register } from '../../api/auth';
import { Mail, Lock, User, Phone } from 'lucide-react';


export function RegisterPage() {
  const nav = useNavigate();
  const [role, setRole] = useState<'TEACHER' | 'PARENT'>('TEACHER');
  const [form, setForm] = useState({ email: '', fullName: '', phone: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setSuccess(null); setLoading(true);
    try {
      await register({ ...form, role });
      setSuccess('Registration submitted. Please check your email for verification code. An admin will review your account.');
      setForm({ email: '', fullName: '', phone: '', password: '' });
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? 'Registration failed');
    } finally { setLoading(false); }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-text-primary mb-1">Create Your Account</h2>
      <p className="text-text-secondary mb-6">Fill in your details to get started</p>

      <div className="flex gap-2 mb-6">
        {(['TEACHER', 'PARENT'] as const).map((r) => (
          <button key={r} onClick={() => setRole(r)}
            className={`flex-1 py-2.5 rounded-input text-sm font-semibold transition-colors ${role === r ? 'bg-primary text-white' : 'bg-white border border-border text-text-secondary hover:bg-primary-light'}`}>
            {r === 'TEACHER' ? 'Teacher' : 'Parent/Guardian'}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <Input label="Full Name" placeholder="Enter your full name" value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })} leftIcon={<User className="h-4 w-4" />} required />
        <Input label="Email Address" type="email" placeholder="Enter your email" value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })} leftIcon={<Mail className="h-4 w-4" />} required />
        <Input label="Phone Number" placeholder="Enter your phone" value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })} leftIcon={<Phone className="h-4 w-4" />} />
        <Input label="Password" type="password" placeholder="Min 8 characters" value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })} leftIcon={<Lock className="h-4 w-4" />} required />
        <label className="flex items-start gap-2 text-sm text-text-secondary">
          <input type="checkbox" required className="mt-1 rounded border-border text-primary focus:ring-primary" />
          <span>
            I agree to the{' '}
            <Link to="/terms" target="_blank" rel="noreferrer" className="text-primary hover:underline">
              Terms & Conditions
            </Link>{' '}
            and{' '}
            <Link to="/privacy" target="_blank" rel="noreferrer" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </span>
        </label>
        {error && <div className="text-sm text-red-500 bg-red-50 p-3 rounded-input">{error}</div>}
        {success && <div className="text-sm text-green-600 bg-green-50 p-3 rounded-input">{success}</div>}
        <Button type="submit" className="w-full h-12" loading={loading}>Create Account →</Button>
      </form>
      <div className="mt-6 text-center text-sm text-text-secondary">
        Already have an account?{' '}
        <Link to="/login" className="text-primary font-semibold hover:underline">Log in →</Link>
      </div>
    </div>
  );
}