import { useCallback, useEffect, useState } from 'react';
import * as msg from '../../api/messaging';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { StatusBadge } from '../../components/ui/Badge';
import { Mail, MessageSquare, Send, HelpCircle } from 'lucide-react';

const SMS_EVENTS = [
  { key: 'payment.recorded', label: 'Fee payment recorded' },
  { key: 'reportcard.published', label: 'Report card published' },
  { key: 'session.notice', label: 'Session / term notices' },
  { key: 'feedback.urgent', label: 'Urgent feedback alerts' },
];

export function MessagingTab() {
  const [form, setForm] = useState<any>({ smtpHost: '', smtpPort: '587', smtpUser: '', smtpPass: '', mailFrom: '', smsEnabled: false, smsProvider: 'TERMII', smsApiKey: '', smsSenderId: '' });
  const [smsEvents, setSmsEvents] = useState<Record<string, boolean>>({});
  const [testMail, setTestMail] = useState('');
  const [testPhone, setTestPhone] = useState('');
  const [notice, setNotice] = useState({ title: '', body: '', audience: 'all' });
  const [logs, setLogs] = useState<any[]>([]);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    msg.fetchMessagingConfig().then((c: any) => {
      setForm({
        smtpHost: c.smtpHost ?? '', smtpPort: String(c.smtpPort ?? 587), smtpUser: c.smtpUser ?? '',
        smtpPass: c.smtpPass ?? '', mailFrom: c.mailFrom ?? '', smsEnabled: !!c.smsEnabled,
        smsProvider: c.smsProvider ?? 'TERMII', smsApiKey: c.smsApiKey ?? '', smsSenderId: c.smsSenderId ?? '',
      });
      try { setSmsEvents(JSON.parse(c.smsEvents || '{}')); } catch { setSmsEvents({}); }
    }).catch(console.error);
    msg.fetchMessagingLogs().then(setLogs).catch(console.error);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function save() {
    setBusy(true); setError(null); setInfo(null);
    try {
      await msg.saveMessagingConfig({ ...form, smtpPort: Number(form.smtpPort), smsEvents: JSON.stringify(smsEvents) });
      setInfo('Messaging settings saved.');
      load();
    } catch (e: any) { setError(e?.response?.data?.error?.message ?? 'Failed'); }
    finally { setBusy(false); }
  }

  async function runTest(kind: 'email' | 'sms') {
    setBusy(true); setError(null); setInfo(null);
    try {
      const r = kind === 'email' ? await msg.testEmail(testMail) : await msg.testSms(testPhone);
      setInfo(r?.skipped ? 'Sent to server log only (provider not configured).' : 'Test dispatched — check the delivery log below.');
      load();
    } catch (e: any) { setError(e?.response?.data?.error?.message ?? 'Failed'); }
    finally { setBusy(false); }
  }

  async function sendNotice() {
    setBusy(true); setError(null); setInfo(null);
    try {
      const r = await msg.sendSessionNotice(notice);
      setInfo(`Notice delivered to ${r.count} recipient(s) via bell + email${form.smsEnabled ? ' + SMS' : ''}.`);
      setNotice({ title: '', body: '', audience: 'all' });
      load();
    } catch (e: any) { setError(e?.response?.data?.error?.message ?? 'Failed'); }
    finally { setBusy(false); }
  }

  const emailConfigured = !!form.smtpHost;

  return (
    <div className="space-y-4 max-w-4xl">
      <details className="bg-primary-light/20 border border-primary/20 rounded-card p-4 cursor-pointer group">
        <summary className="font-semibold text-text-primary flex items-center gap-2 list-none">
          <HelpCircle className="h-4 w-4 text-primary" /> 
          Setup Help & Configuration Guide
          <span className="ml-auto text-xs font-normal text-text-muted group-open:hidden">(Click to expand)</span>
        </summary>
        <div className="mt-4 space-y-4 text-sm text-text-secondary border-t border-primary/10 pt-4">
          <div>
            <h4 className="font-bold text-text-primary mb-2">📧 Email (SMTP) Configuration</h4>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Gmail (Best for testing/demos):</strong> Host: <code className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono">smtp.gmail.com</code>, Port: <code className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono">587</code>. <em>Important:</em> You must use a 16-character <strong>App Password</strong> (generate in Google Account &gt; Security &gt; 2-Step Verification), not your regular Gmail password.</li>
              <li><strong>Zoho Mail (Professional/Free tier):</strong> Host: <code className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono">smtp.zoho.com</code>, Port: <code className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono">587</code> or <code className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono">465</code>. Use your full Zoho email and password.</li>
              <li><strong>cPanel / Web Hosting:</strong> Host: <code className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono">mail.yourdomain.com</code>, Port: <code className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono">465</code> or <code className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono">587</code>.</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-text-primary mb-2">📱 SMS (Termii) Configuration</h4>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Sign up at <a href="https://termii.com" target="_blank" rel="noreferrer" className="text-primary underline">termii.com</a> and fund your wallet (approx. ₦4.5 per SMS).</li>
              <li>Copy your <strong>API Key</strong> from Settings &gt; API Keys.</li>
              <li>Request a <strong>Sender ID</strong> (e.g., BDSCHOOL) under the Sender IDs tab (approval takes a few hours to 1 day).</li>
              <li>Toggle the master switch ON, paste your API key, and enable the specific events you want to trigger SMS.</li>
            </ul>
          </div>
          <p className="text-xs text-text-muted italic bg-white/50 p-2 rounded">
            💡 <strong>Safe Fallback:</strong> If credentials are not configured or are incorrect, the system safely logs messages as "SKIPPED" in the Delivery Log without breaking any core app functionality (payments, results, and bells still work perfectly).
          </p>
        </div>
      </details>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 font-semibold text-text-primary"><Mail className="h-4 w-4 text-primary" /> Email (SMTP)</div>
            {emailConfigured ? <StatusBadge status="success" label="Configured" /> : <StatusBadge status="warning" label="Log-only mode" />}
          </div>
          <div className="space-y-3">
            <Input label="SMTP Host" placeholder="e.g. smtp.zoho.com" value={form.smtpHost} onChange={(e) => setForm({ ...form, smtpHost: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Port" type="number" value={form.smtpPort} onChange={(e) => setForm({ ...form, smtpPort: e.target.value })} />
              <Input label="From Address" placeholder="info@yourschool.ng" value={form.mailFrom} onChange={(e) => setForm({ ...form, mailFrom: e.target.value })} />
            </div>
            <Input label="Username" value={form.smtpUser} onChange={(e) => setForm({ ...form, smtpUser: e.target.value })} />
            <Input label="Password" type="password" value={form.smtpPass} onChange={(e) => setForm({ ...form, smtpPass: e.target.value })} />
            <div className="flex gap-2">
              <Input placeholder="test address" value={testMail} onChange={(e) => setTestMail(e.target.value)} />
              <Button variant="secondary" onClick={() => runTest('email')} disabled={!testMail.includes('@')}>Test</Button>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 font-semibold text-text-primary"><MessageSquare className="h-4 w-4 text-primary" /> SMS (optional)</div>
            <label className="flex items-center gap-2 text-sm text-text-secondary">
              <input type="checkbox" checked={form.smsEnabled} onChange={(e) => setForm({ ...form, smsEnabled: e.target.checked })} />
              Enabled
            </label>
          </div>
          <div className="space-y-3">
            <Select label="Provider" value={form.smsProvider} onChange={(e) => setForm({ ...form, smsProvider: e.target.value })}
              options={[{ value: 'TERMII', label: 'Termii' }]} />
            <Input label="API Key" type="password" value={form.smsApiKey} onChange={(e) => setForm({ ...form, smsApiKey: e.target.value })} />
            <Input label="Sender ID" placeholder="e.g. BDSCHOOL" value={form.smsSenderId} onChange={(e) => setForm({ ...form, smsSenderId: e.target.value })} />
            <div className="space-y-1 border-t border-border pt-3">
              <div className="text-xs font-semibold text-text-muted uppercase mb-1">SMS alerts for:</div>
              {SMS_EVENTS.map((ev) => (
                <label key={ev.key} className="flex items-center gap-2 text-sm text-text-secondary">
                  <input type="checkbox" checked={smsEvents[ev.key] !== false}
                    onChange={(e) => setSmsEvents({ ...smsEvents, [ev.key]: e.target.checked })} />
                  {ev.label}
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <Input placeholder="test phone e.g. 0803..." value={testPhone} onChange={(e) => setTestPhone(e.target.value)} />
              <Button variant="secondary" onClick={() => runTest('sms')} disabled={testPhone.length < 10}>Test</Button>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center gap-2 font-semibold text-text-primary mb-3"><Send className="h-4 w-4 text-primary" /> Send Session / Term Notice</div>
        <div className="space-y-3">
          <Input label="Title" placeholder="e.g. Second Term Resumption" value={notice.title} onChange={(e) => setNotice({ ...notice, title: e.target.value })} />
          <div>
            <label className="label">Message</label>
            <textarea className="input-field min-h-[90px]" value={notice.body} onChange={(e) => setNotice({ ...notice, body: e.target.value })} />
          </div>
          <div className="flex gap-3 items-end">
            <Select label="Audience" value={notice.audience} onChange={(e) => setNotice({ ...notice, audience: e.target.value })}
              options={[{ value: 'all', label: 'Everyone' }, { value: 'teachers', label: 'Staff only' }, { value: 'parents', label: 'Parents only' }]} />
            <Button onClick={sendNotice} loading={busy} disabled={notice.title.trim().length < 3 || notice.body.trim().length < 10}>Send Notice</Button>
          </div>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="px-4 py-3 font-semibold text-text-primary">Delivery Log (last 25)</div>
        <Table headers={['Time', 'Channel', 'Event', 'Recipient', 'Status']}>
          {logs.map((l) => (
            <tr key={l.id} className="hover:bg-gray-50">
              <td className="px-4 py-2 text-xs text-text-secondary whitespace-nowrap">{new Date(l.createdAt).toLocaleString()}</td>
              <td className="px-4 py-2"><span className="badge badge-info">{l.channel}</span></td>
              <td className="px-4 py-2 text-sm text-text-primary">{l.event}</td>
              <td className="px-4 py-2 text-sm text-text-secondary">{l.recipient}</td>
              <td className="px-4 py-2">
                {l.status === 'SENT' ? <StatusBadge status="success" label="Sent" /> : l.status === 'SKIPPED' ? <StatusBadge status="neutral" label="Skipped" /> : <StatusBadge status="danger" label="Failed" />}
              </td>
            </tr>
          ))}
          {logs.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-text-muted">No messages dispatched yet.</td></tr>}
        </Table>
      </Card>

      {info && <div className="text-sm text-green-700 bg-green-50 p-3 rounded-input">{info}</div>}
      {error && <div className="text-sm text-red-500 bg-red-50 p-3 rounded-input">{error}</div>}
      <Button onClick={save} loading={busy}>Save Messaging Settings</Button>
    </div>
  );
}