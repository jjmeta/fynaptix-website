// Server-side proxy for CoinGecko's fear & greed ETL endpoint.
// The ETL URL (www.coingecko.com/etl2/...) doesn't have CORS headers,
// so the browser can't fetch it directly — this route does it server-side.

module.exports = async function handler(req, res) {
  try {
    const r = await fetch(
      'https://www.coingecko.com/etl2/fear_and_greed_index/max?locale=en',
      { headers: { accept: 'application/json' } }
    );
    const body = await r.text();
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    res.status(r.ok ? 200 : r.status).send(body);
  } catch (e) {
    res.setHeader('Cache-Control', 'no-store');
    res.status(502).json({ error: 'upstream failure' });
  }
};
