export const config = { runtime: 'edge' };

// Fetches RWA-relevant news from crypto RSS feeds server-side.
// Filters by keywords covering tokenized assets, RWA, and major issuers.
// Cached at the edge for 20 minutes.

const RWA_KEYWORDS = [
  'real world asset', 'real-world asset', 'tokenized', 'tokenised',
  'tokenization', 'tokenisation', 'rwa', 'tokenized stock', 'tokenized bond',
  'tokenized fund', 'tokenized treasury', 'tokenized gold', 'tokenized commodity',
  'tokenized real estate', 'onchain asset', 'blackrock', 'ondo', 'openai pre-ipo',
  'spacex pre-ipo', 'republic tokenize', 'pre-ipo token',
];

function matchesRWA(text) {
  const lower = text.toLowerCase();
  return RWA_KEYWORDS.some(k => lower.includes(k));
}

function parseItems(xml, source, sourceUrl) {
  const items = [];
  const blocks = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 30);
  for (const m of blocks) {
    const block = m[1];
    const get = (t) => {
      const mm = block.match(new RegExp('<' + t + '[^>]*>([\\s\\S]*?)<\\/' + t + '>'));
      return mm ? mm[1].replace(/<!\[CDATA\[/g, '').replace(/\]\]>/g, '').trim() : '';
    };
    const title = get('title');
    const link  = get('link');
    const date  = get('pubDate');
    const desc  = get('description').replace(/<[^>]+>/g, '').trim().slice(0, 200);
    if (title && link && matchesRWA(title + ' ' + desc)) {
      items.push({ source, sourceUrl, title, link, date, desc });
    }
  }
  return items;
}

export default async function handler() {
  const feeds = [
    ['CoinDesk',   'https://coindesk.com',   'https://www.coindesk.com/arc/outboundfeeds/rss/?outputType=xml'],
    ['The Block',  'https://theblock.co',    'https://www.theblock.co/rss.xml'],
    ['Decrypt',    'https://decrypt.co',     'https://decrypt.co/feed'],
  ];

  const all = [];
  await Promise.all(
    feeds.map(async ([source, sourceUrl, feedUrl]) => {
      try {
        const r = await fetch(feedUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FynaptixRWA/1.0)' },
        });
        if (!r.ok) return;
        const xml = await r.text();
        all.push(...parseItems(xml, source, sourceUrl));
      } catch (e) { /* non-fatal */ }
    })
  );

  const seen = new Set();
  const out = all
    .filter(i => !seen.has(i.link) && seen.add(i.link))
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 20);

  return new Response(JSON.stringify({ items: out, fetched: new Date().toISOString() }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 's-maxage=1200, stale-while-revalidate=3600',
    },
  });
}
