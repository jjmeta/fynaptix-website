export const config = { runtime: 'edge' };

// Fetches TechCrunch RSS feeds server-side (no CORS issues) and returns merged JSON.
// Cached at the edge for 15 minutes.
export default async function handler() {
  const feeds = [
    ['AI', 'https://techcrunch.com/category/artificial-intelligence/feed/'],
    ['Robotics', 'https://techcrunch.com/category/robotics/feed/'],
    ['Tech', 'https://techcrunch.com/feed/'],
  ];

  const items = [];
  await Promise.all(
    feeds.map(async ([tag, url]) => {
      try {
        const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FynaptixHub/1.0)' } });
        if (!r.ok) return;
        const xml = await r.text();
        const blocks = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 10);
        for (const m of blocks) {
          const block = m[1];
          const get = (t) => {
            const mm = block.match(new RegExp('<' + t + '[^>]*>([\\s\\S]*?)<\\/' + t + '>'));
            return mm ? mm[1].replace(/<!\[CDATA\[/g, '').replace(/\]\]>/g, '').trim() : '';
          };
          const link = get('link');
          const title = get('title');
          if (title && link && link.startsWith('https://techcrunch.com')) {
            items.push({ tag, title, link, date: get('pubDate') });
          }
        }
      } catch (e) { /* feed failure is non-fatal */ }
    })
  );

  const seen = new Set();
  const out = items
    .filter((i) => !seen.has(i.link) && seen.add(i.link))
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 18);

  return new Response(JSON.stringify({ items: out, fetched: new Date().toISOString() }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 's-maxage=900, stale-while-revalidate=3600',
    },
  });
}
