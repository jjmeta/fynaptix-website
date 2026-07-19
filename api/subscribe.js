export const config = { runtime: 'edge' };

// Newsletter signup: adds a contact to the selected Resend audiences.
// Requires RESEND_API_KEY env var in Vercel. Audiences are created by name on demand.
const RESEND = 'https://api.resend.com';
const ALLOWED = [
  'Weekly Brief', 'AI & Compute', 'Robotics', 'Defense Tech', 'Nuclear & SMRs',
  'Critical Minerals', 'Space Economy', 'Energy Storage', 'AI Biotech', 'Quantum',
];

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', ...cors } });

export default async function handler(req) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const key = process.env.RESEND_API_KEY;
  if (!key) return json({ error: 'Newsletter signup is not configured yet — check back soon.' }, 503);

  let body;
  try { body = await req.json(); } catch { return json({ error: 'Invalid request' }, 400); }

  const email = (body.email || '').trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 254) {
    return json({ error: 'Please enter a valid email address' }, 400);
  }

  let lists = Array.isArray(body.lists) ? body.lists.filter((l) => ALLOWED.includes(l)) : [];
  if (!lists.length) lists = ['Weekly Brief'];

  const h = { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' };

  // Fetch existing audiences once
  const ar = await fetch(RESEND + '/audiences', { headers: h });
  if (!ar.ok) return json({ error: 'Subscription service unavailable — try again later.' }, 502);
  const existing = ((await ar.json()).data) || [];

  const subscribed = [];
  for (const name of lists) {
    let aud = existing.find((a) => a.name === name);
    if (!aud) {
      const cr = await fetch(RESEND + '/audiences', { method: 'POST', headers: h, body: JSON.stringify({ name }) });
      if (!cr.ok) continue;
      aud = await cr.json();
    }
    const add = await fetch(RESEND + '/audiences/' + aud.id + '/contacts', {
      method: 'POST', headers: h,
      body: JSON.stringify({ email, unsubscribed: false }),
    });
    if (add.ok) subscribed.push(name);
  }

  if (!subscribed.length) return json({ error: 'Could not subscribe right now — try again later.' }, 502);
  return json({ ok: true, subscribed });
}
