import { useState } from 'react';
import { useAuthStore } from '../../store/auth.store';
import { updateMyProfile } from '../../api/users';
import { changePassword } from '../../api/auth';
import { UploadButton } from '../../components/ui/UploadButton';
import { assetUrl } from '../../utils/assetUrl';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Lock } from 'lucide-react';

export function MyAccountPage() {
  const { user, updateUser } = useAuthStore();
  const isSuper = user?.role === 'SUPER_ADMIN';

  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [phone, setPhone] = useState((user as any)?.phone ?? '');
  const [saving, setSaving] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [pwBusy, setPwBusy] = useState(false);
  const [pwInfo, setPwInfo] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);

  async function saveProfile(patch: Parameters<typeof updateMyProfile>[0]) {
    setSaving(true); setError(null); setInfo(null);
    try {
      const updated = await updateMyProfile(patch);
      updateUser(updated);           // instant sync: topbar, headers, everywhere
      setInfo('Profile updated successfully.');
    } catch (e: any) { setError(e?.response?.data?.error?.message ?? 'Failed to update profile'); }
    finally { setSaving(false); }
  }

  async function onPhoto(url: string) {
    await saveProfile({ profilePictureUrl: url });
  }

  async function onPassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError(null); setPwInfo(null);
    if (pw.next !== pw.confirm) { setPwError('New passwords do not match.'); return; }
    setPwBusy(true);
    try {
      await changePassword(pw.current, pw.next);
      setPwInfo('Password changed. Other devices have been signed out.');
      setPw({ current: '', next: '', confirm: '' });
    } catch (e: any) { setPwError(e?.response?.data?.error?.message ?? 'Failed to change password'); }
    finally { setPwBusy(false); }
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">My Account</h1>
        <p className="text-text-secondary">Manage your photo, contact details and password. All changes are logged.</p>
      </div>

      <Card className="mb-4">
        <h2 className="font-semibold text-text-primary mb-3">Profile Picture</h2>
        <div className="flex items-center gap-4 flex-wrap">
          {user?.profilePictureUrl ? (
            <img src={assetUrl(user.profilePictureUrl)!} alt="Profile" className="h-16 w-16 rounded-full object-cover border border-border bg-white" />
          ) : (
            <div className="h-16 w-16 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-xl">
              {user?.fullName?.charAt(0)?.toUpperCase() ?? '?'}
            </div>
          )}
          <UploadButton label="Upload / Replace Photo" onUploaded={onPhoto} />
          {user?.profilePictureUrl && (
            <Button variant="ghost" size="sm" onClick={() => saveProfile({ profilePictureUrl: null })}>Remove</Button>
          )}
        </div>
      </Card>

      <Card className="mb-4">
        <h2 className="font-semibold text-text-primary mb-3">Personal Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <Input label="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 0803…" />
          <div className="md:col-span-2">
            <Input label="Email Address (cannot be changed)" value={user?.email ?? ''} disabled />
            <p className="text-xs text-text-muted mt-1 flex items-center gap-1">
              <Lock className="h-3 w-3" /> Email is your permanent login identity and is locked for security and audit integrity.
            </p>
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <Button onClick={() => saveProfile({ fullName: fullName.trim(), phone: phone.trim() || null })}
            loading={saving} disabled={!fullName.trim()}>Save Changes</Button>
        </div>
      </Card>

      {isSuper ? (
        <Card>
          <h2 className="font-semibold text-text-primary mb-2">Password</h2>
          <p className="text-sm text-text-secondary flex items-center gap-2">
            <Lock className="h-4 w-4" /> The Super Admin password is managed outside the portal and cannot be changed here.
          </p>
        </Card>
      ) : (
        <Card>
          <h2 className="font-semibold text-text-primary mb-3">Change Password</h2>
          <form onSubmit={onPassword} className="space-y-4">
            <Input label="Current Password" type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} required />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="New Password" type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })}
                placeholder="Min 8 chars, upper + lower + digit" required />
              <Input label="Confirm New Password" type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} required />
            </div>
            <p className="text-xs text-text-muted">Recently used passwords are rejected. Other devices are signed out on success.</p>
            <div className="flex justify-end">
              <Button type="submit" loading={pwBusy}>Change Password</Button>
            </div>
          </form>
        </Card>
      )}

      {info && <div className="mt-4 text-sm text-green-700 bg-green-50 p-3 rounded-input">{info}</div>}
      {pwInfo && <div className="mt-4 text-sm text-green-700 bg-green-50 p-3 rounded-input">{pwInfo}</div>}
      {error && <div className="mt-4 text-sm text-red-500 bg-red-50 p-3 rounded-input">{error}</div>}
      {pwError && <div className="mt-4 text-sm text-red-500 bg-red-50 p-3 rounded-input">{pwError}</div>}
    </div>
  );
}