export const config = { runtime: 'edge' };

// Fetches RWA news from dedicated RWA sources + filtered mainstream crypto feeds.
// Cached at the edge for 20 minutes.

const RWA_KEYWORDS = [
  'real world asset', 'real-world asset', 'tokenized', 'tokenised',
  'tokenization', 'tokenisation', ' rwa ', 'rwa:', 'tokenized stock',
  'tokenized bond', 'tokenized fund', 'tokenized treasury', 'tokenized gold',
  'tokenized real estate', 'onchain asset', 'ondo finance', 'centrifuge',
  'maple finance', 'openedge', 'pre-ipo token', 'tokenized securities',
  'tokenized asset', 'security token',
];

function matchesRWA(text) {
  const lower = (' ' + text + ' ').toLowerCase();
  return RWA_KEYWORDS.some(k => lower.includes(k));
}

function getAttr(block, tag) {
  const mm = block.match(new RegExp('<' + tag + '[^>]*>([\\s\\S]*?)<\\/' + tag + '>'));
  return mm ? mm[1].replace(/<!\[CDATA\[/g, '').replace(/\]\]>/g, '').replace(/<[^>]+>/g, '').trim() : '';
}

function parseItems(xml, source, color, filterFn) {
  const items = [];
  const blocks = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 40);
  for (const m of blocks) {
    const block = m[1];
    const title = getAttr(block, 'title');
    const link  = getAttr(block, 'link');
    const date  = getAttr(block, 'pubDate');
    const desc  = getAttr(block, 'description').slice(0, 220);
    if (!title || !link) continue;
    if (filterFn && !filterFn(title + ' ' + desc)) continue;
    items.push({ source, color, title, link, date, desc });
  }
  return items;
}

export default async function handler() {
  const feeds = [
    {
      source: 'RWA Week',
      color: '#0f4c81',
      url: 'https://rwaweek.com/journal/rss.xml',
      filter: null, // dedicated RWA feed — take all items
    },
    {
      source: 'CryptoSlate',
      color: '#1c2b4a',
      url: 'https://cryptoslate.com/rwa/feed/',
      filter: null, // RWA category feed — take all items
    },
    {
      source: 'CoinDesk',
      color: '#2d5be3',
      url: 'https://www.coindesk.com/arc/outboundfeeds/rss/?outputType=xml',
      filter: matchesRWA, // general feed — filter for RWA relevance
    },
    {
      source: 'The Block',
      color: '#111827',
      url: 'https://www.theblock.co/rss.xml',
      filter: matchesRWA,
    },
  ];

  const all = [];
  await Promise.all(
    feeds.map(async ({ source, color, url, filter }) => {
      try {
        const r = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FynaptixRWA/1.0)' },
        });
        if (!r.ok) return;
        const xml = await r.text();
        all.push(...parseItems(xml, source, color, filter));
      } catch (e) { /* non-fatal */ }
    })
  );

  const seen = new Set();
  const out = all
    .filter(i => !seen.has(i.link) && seen.add(i.link))
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 24);

  return new Response(JSON.stringify({ items: out, fetched: new Date().toISOString() }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 's-maxage=1200, stale-while-revalidate=3600',
    },
  });
}
