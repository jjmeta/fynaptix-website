export const config = { runtime: 'edge' };

// Server-side proxy for the CoinGecko paid (Pro) API.
// The API key lives ONLY in the COINGECKO_API_KEY env var and never reaches the browser.
// Usage: /api/cg?path=/coins/markets&vs_currency=usd&...
// Responses are CDN-cached so many visitors share a small number of upstream calls.

const BASE = 'https://pro-api.coingecko.com/api/v3';

// Only read-only market-data paths the site actually needs.
const ALLOWED = [
  /^\/global$/,
  /^\/coins\/markets$/,
  /^\/coins\/categories$/,
  /^\/search\/trending$/,
  /^\/simple\/price$/,
  /^\/coins\/[a-z0-9-]+\/market_chart$/,
];

function ttl(path) {
  if (path === '/coins/categories') return 300;
  if (path === '/search/trending') return 300;
  if (path.endsWith('/market_chart')) return 600;
  return 60;
}

export default async function handler(req) {
  const key = process.env.COINGECKO_API_KEY;
  if (!key) return json({ error: 'proxy not configured' }, 500);

  const url = new URL(req.url);
  const path = url.searchParams.get('path') || '';
  if (!ALLOWED.some((re) => re.test(path))) return json({ error: 'path not allowed' }, 400);

  const params = new URLSearchParams(url.searchParams);
  params.delete('path');
  const qs = params.toString();
  const upstream = BASE + path + (qs ? '?' + qs : '');

  try {
    const r = await fetch(upstream, { headers: { 'x-cg-pro-api-key': key, accept: 'application/json' } });
    const body = await r.text();
    const t = ttl(path);
    return new Response(body, {
      status: r.status,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': r.ok ? `public, s-maxage=${t}, stale-while-revalidate=${t * 2}` : 'no-store',
      },
    });
  } catch (e) {
    return json({ error: 'upstream failure' }, 502);
  }
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}
