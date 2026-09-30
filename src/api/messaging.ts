import client from './client';
export async function fetchMessagingConfig() { const { data } = await client.get('/messaging/config'); return data.data; }
export async function saveMessagingConfig(input: Record<string, unknown>) { const { data } = await client.put('/messaging/config', input); return data.data; }
export async function testEmail(email: string) { const { data } = await client.post('/messaging/test-email', { email }); return data.data; }
export async function testSms(phone: string) { const { data } = await client.post('/messaging/test-sms', { phone }); return data.data; }
export async function fetchMessagingLogs() { const { data } = await client.get('/messaging/logs'); return data.data as any[]; }
export async function sendSessionNotice(input: { title: string; body: string; audience: string }) { const { data } = await client.post('/messaging/session-notice', input); return data.data; }