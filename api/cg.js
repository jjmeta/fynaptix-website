// Server-side proxy for the CoinGecko Pro API.
// API key lives ONLY in COINGECKO_API_KEY env var — never exposed to the browser.
// Usage: /api/cg?path=/coins/markets&vs_currency=usd&...

const BASE = 'https://pro-api.coingecko.com/api/v3';

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

module.exports = async function handler(req, res) {
  const key = process.env.COINGECKO_API_KEY;
  if (!key) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(500).json({ error: 'proxy not configured' });
  }

  const url = new URL(req.url, 'http://localhost');
  const path = url.searchParams.get('path') || '';

  if (!ALLOWED.some((re) => re.test(path))) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(400).json({ error: 'path not allowed' });
  }

  const params = new URLSearchParams(url.searchParams);
  params.delete('path');
  const qs = params.toString();
  const upstream = BASE + path + (qs ? '?' + qs : '');

  try {
    const r = await fetch(upstream, {
      headers: { 'x-cg-pro-api-key': key, accept: 'application/json' },
    });
    const body = await r.text();
    const t = ttl(path);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader(
      'Cache-Control',
      r.ok ? `public, s-maxage=${t}, stale-while-revalidate=${t * 2}` : 'no-store'
    );
    res.status(r.status).send(body);
  } catch (e) {
    res.setHeader('Cache-Control', 'no-store');
    res.status(502).json({ error: 'upstream failure' });
  }
};
