// ── Mobile nav ──
(function () {
  const burger = document.getElementById('lp-burger');
  const mobileNav = document.getElementById('lp-mobile-nav');
  const scrim = document.getElementById('lp-scrim');
  const closeBtn = document.getElementById('lp-mobile-close');
  if (!burger || !mobileNav || !scrim) return;
  const open = () => { mobileNav.classList.add('open'); scrim.classList.add('open'); burger.setAttribute('aria-expanded', 'true'); };
  const close = () => { mobileNav.classList.remove('open'); scrim.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); };
  burger.addEventListener('click', open);
  closeBtn?.addEventListener('click', close);
  scrim.addEventListener('click', close);
  mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
})();

// ── Stat strip drop-downs: hover on desktop, tap or keyboard everywhere ──
(function () {
  const wraps = Array.from(document.querySelectorAll('.lp-stat-wrap'));
  if (!wraps.length) return;
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const IDS = ['ai', 'robotics', 'defense', 'nuclear', 'minerals', 'space', 'storage', 'biotech', 'quantum'];
  const cache = {};
  const getJSON = url => cache[url] || (cache[url] = fetch(url).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); }));
  const fmt = iso => new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  // each loader runs once, the first time its panel opens; a failed load just leaves the static text in place
  const loaders = {
    sectors: () => getJSON('/private/data/overview.json').then(o => {
      const m = {}; (o.sector_scoreboard || []).forEach(x => { m[x.sector] = x.momentum; });
      document.querySelectorAll('[data-mom]').forEach(el => { if (m[el.dataset.mom]) el.textContent = m[el.dataset.mom]; });
    }),
    tickers: () => Promise.all(IDS.map(id => getJSON('/private/data/' + id + '.json').then(d => ({ id, pos: (d.stance && d.stance.positions) || [] })))).then(list => {
      const uniq = new Set(); let total = 0;
      list.forEach(x => {
        total += x.pos.length; x.pos.forEach(p => uniq.add(p.ticker));
        const el = document.querySelector('[data-count="' + x.id + '"]');
        if (el) el.textContent = x.pos.length + (x.pos.length === 1 ? ' name' : ' names');
      });
      const head = document.getElementById('lp-dd-tk-head'), big = document.getElementById('lp-ticker-count');
      if (head) head.textContent = uniq.size + ' UNIQUE TICKERS · ' + total + ' POSITIONS';
      if (big) big.textContent = String(uniq.size);
    }),
    briefs: () => Promise.all([getJSON('/private/data/overview.json'), getJSON('/private/archive/index.json')]).then(r => {
      const o = r[0], weeks = ((r[1] && r[1].weeks) || []).map(w => w.date).sort().reverse();
      const latest = document.getElementById('lp-dd-latest');
      if (latest && o.week_of) latest.textContent = 'Latest brief: week of ' + o.week_of + '.';
      const box = document.getElementById('lp-dd-weeks'), head = document.getElementById('lp-dd-weeks-head');
      if (box && weeks.length) {
        weeks.slice(0, 5).forEach(d => {
          const a = document.createElement('a'); a.className = 'lp-dd-row lp-dd-row-strong'; a.href = '/private/archive.html';
          const n = document.createElement('span'); n.className = 'lp-dd-name'; n.textContent = fmt(d);
          const m = document.createElement('span'); m.className = 'lp-dd-meta'; m.textContent = '→';
          a.append(n, m); box.appendChild(a);
        });
        if (head) { head.hidden = false; head.textContent = 'RECENT WEEKS IN THE ARCHIVE · ' + weeks.length + ' IN ALL'; }
      }
    })
  };
  const loaded = {};
  let current = null;

  function setOpen(w, on) {
    w.querySelector('.lp-stat').setAttribute('aria-expanded', String(on));
    w.querySelector('.lp-dd').hidden = !on;
    const k = w.dataset.dd;
    if (on && loaders[k] && !loaded[k]) { loaded[k] = true; loaders[k]().catch(() => {}); }
  }
  function open(w) { if (current && current !== w) close(current); clearTimeout(w._t); setOpen(w, true); current = w; }
  function close(w) { clearTimeout(w._t); setOpen(w, false); w._pinned = false; if (current === w) current = null; }

  wraps.forEach(w => {
    const btn = w.querySelector('.lp-stat');
    if (canHover) {
      w.addEventListener('mouseenter', () => open(w));
      w.addEventListener('mouseleave', () => { if (!w._pinned) w._t = setTimeout(() => close(w), 160); });
    }
    btn.addEventListener('click', () => {
      const isOpen = btn.getAttribute('aria-expanded') === 'true';
      if (!isOpen) { open(w); w._pinned = true; }
      else if (canHover && !w._pinned) { w._pinned = true; }   // opened by hover: a click keeps it open
      else close(w);
    });
    w.addEventListener('focusout', e => { if (e.relatedTarget && !w.contains(e.relatedTarget)) close(w); });
  });
  document.addEventListener('click', e => { if (current && !current.contains(e.target)) close(current); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && current) { const w = current; close(w); w.querySelector('.lp-stat').focus(); }
  });
})();
