// Server-side RSS aggregator for RWA news.
// Fetches dedicated RWA feeds + keyword-filtered mainstream crypto feeds.
// Uses CommonJS module.exports to match the project's Vercel serverless function pattern.

const RWA_KEYWORDS = [
  'real world asset', 'real-world asset', 'tokenized', 'tokenised',
  'tokenization', 'tokenisation', ' rwa ', 'rwa:', 'tokenized stock',
  'tokenized bond', 'tokenized fund', 'tokenized treasury', 'tokenized gold',
  'tokenized real estate', 'onchain asset', 'ondo finance', 'centrifuge',
  'maple finance', 'pre-ipo token', 'tokenized securities', 'tokenized asset',
  'security token',
];

function matchesRWA(text) {
  const lower = (' ' + text + ' ').toLowerCase();
  return RWA_KEYWORDS.some(k => lower.includes(k));
}

function getTag(block, tag) {
  const mm = block.match(new RegExp('<' + tag + '[^>]*>([\\s\\S]*?)<\\/' + tag + '>'));
  return mm ? mm[1].replace(/<!\[CDATA\[/g, '').replace(/\]\]>/g, '').replace(/<[^>]+>/g, '').trim() : '';
}

function parseItems(xml, source, color, filterFn) {
  const items = [];
  const blocks = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 40);
  for (const m of blocks) {
    const block = m[1];
    const title = getTag(block, 'title');
    const link  = getTag(block, 'link');
    const date  = getTag(block, 'pubDate');
    const desc  = getTag(block, 'description').slice(0, 240);
    if (!title || !link) continue;
    if (filterFn && !filterFn(title + ' ' + desc)) continue;
    items.push({ source, color, title, link, date, desc });
  }
  return items;
}

const FEEDS = [
  {
    source: 'RWA Week',
    color: '#0f4c81',
    url: 'https://rwaweek.com/journal/rss.xml',
    filter: null,
  },
  {
    source: 'CryptoSlate',
    color: '#1c2b4a',
    url: 'https://cryptoslate.com/rwa/feed/',
    filter: null,
  },
  {
    source: 'CoinDesk',
    color: '#2d5be3',
    url: 'https://www.coindesk.com/arc/outboundfeeds/rss/?outputType=xml',
    filter: matchesRWA,
  },
  {
    source: 'The Block',
    color: '#374151',
    url: 'https://www.theblock.co/rss.xml',
    filter: matchesRWA,
  },
];

module.exports = async function handler(req, res) {
  const all = [];

  await Promise.all(
    FEEDS.map(async ({ source, color, url, filter }) => {
      try {
        const r = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FynaptixRWA/1.0)' },
        });
        if (!r.ok) return;
        const xml = await r.text();
        all.push(...parseItems(xml, source, color, filter));
      } catch (e) { /* non-fatal — skip failing feed */ }
    })
  );

  const seen = new Set();
  const items = all
    .filter(i => !seen.has(i.link) && seen.add(i.link))
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 24);

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=1200, stale-while-revalidate=3600');
  res.status(200).json({ items, fetched: new Date().toISOString() });
};
