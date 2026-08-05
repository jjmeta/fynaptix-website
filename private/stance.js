/* Fynaptix Hub — Research Stance renderer
   Reads the `stance` block from /private/data/<sector>.json and draws a
   summary view: sleeve donut, stance mix bar, and grouped weight bars.

   Mount with:  <div id="stance-mount" data-sector="robotics"></div>
   Cross-sector board:  <div id="stance-board"></div>
*/
(function () {
  var GROUPS = [
    { key: 'core',  name: 'CORE',        color: '#10b981', chip: 'st-c-core',
      desc: 'Highest conviction — proven revenue, defensible position, thesis already working' },
    { key: 'watch', name: 'WATCH',       color: '#3b82f6', chip: 'st-c-watch',
      desc: 'Good business, wrong price or unresolved question — waiting for a better entry or more evidence' },
    { key: 'spec',  name: 'SPECULATIVE', color: '#f59e0b', chip: 'st-c-spec',
      desc: 'Real optionality, real chance of zero — small size only, sized to be survivable' },
    { key: 'avoid', name: 'AVOID',       color: '#ef4444', chip: 'st-c-avoid',
      desc: 'Covered for completeness, but the research does not support owning it here' }
  ];
  var BY_KEY = {};
  GROUPS.forEach(function (g) { BY_KEY[g.key] = g; });

  var SECTORS = [
    ['ai', 'AI &amp; Compute'], ['robotics', 'Robotics'], ['defense', 'Defense Tech'],
    ['nuclear', 'Nuclear &amp; SMRs'], ['minerals', 'Critical Minerals'], ['space', 'Space Economy'],
    ['storage', 'Energy Storage'], ['biotech', 'AI Biotech'], ['quantum', 'Quantum']
  ];

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function flag(change) {
    if (change === 'up')   return '<span class="st-flag st-f-up">&#9650; UPGRADED</span>';
    if (change === 'down') return '<span class="st-flag st-f-down">&#9660; CUT</span>';
    if (change === 'new')  return '<span class="st-flag st-f-new">NEW</span>';
    return '';
  }

  /* SVG donut of sleeve weight, segmented by stance group */
  function donut(positions, size) {
    var R = size / 2, sw = 13, r = R - sw / 2 - 1, C = 2 * Math.PI * r;
    var total = positions.reduce(function (a, p) { return a + (+p.weight || 0); }, 0);
    var segs = '', offset = 0;
    GROUPS.forEach(function (g) {
      var w = positions.reduce(function (a, p) {
        return a + (p.stance === g.key ? (+p.weight || 0) : 0);
      }, 0);
      if (w <= 0) return;
      var frac = total ? w / total : 0;
      segs += '<circle cx="' + R + '" cy="' + R + '" r="' + r + '" fill="none" stroke="' + g.color +
        '" stroke-width="' + sw + '" stroke-dasharray="' + (frac * C) + ' ' + C +
        '" stroke-dashoffset="' + (-offset * C) + '"></circle>';
      offset += frac;
    });
    var coreW = positions.reduce(function (a, p) {
      return a + (p.stance === 'core' ? (+p.weight || 0) : 0);
    }, 0);
    return '<div class="st-donut"><svg width="' + size + '" height="' + size + '">' +
      '<circle cx="' + R + '" cy="' + R + '" r="' + r + '" fill="none" stroke="#111a2e" stroke-width="' + sw + '"></circle>' +
      segs + '</svg><div class="st-dcenter"><div class="v">' + Math.round(coreW) +
      '%</div><div class="l">IN CORE</div></div></div>';
  }

  function mixBar(positions) {
    var n = positions.length || 1, out = '';
    GROUPS.forEach(function (g) {
      var c = positions.filter(function (p) { return p.stance === g.key; }).length;
      if (!c) return;
      out += '<span style="width:' + (c / n * 100) + '%;background:' + g.color + '"></span>';
    });
    return '<div class="st-mix">' + out + '</div>';
  }

  function render(mount, data) {
    var st = data && data.stance;
    if (!st || !st.positions || !st.positions.length) { mount.style.display = 'none'; return; }
    var pos = st.positions.slice();
    var maxW = Math.max.apply(null, pos.map(function (p) { return +p.weight || 0; }).concat([1]));
    var total = pos.reduce(function (a, p) { return a + (+p.weight || 0); }, 0);

    var chips = GROUPS.map(function (g) {
      var c = pos.filter(function (p) { return p.stance === g.key; }).length;
      return '<div class="st-chip ' + g.chip + '"><span class="n">' + c + '</span>' + g.name + '</div>';
    }).join('');

    var groups = GROUPS.map(function (g) {
      var rows = pos.filter(function (p) { return p.stance === g.key; })
        .sort(function (a, b) { return (+b.weight || 0) - (+a.weight || 0); });
      if (!rows.length) return '';
      var body = rows.map(function (p) {
        var w = +p.weight || 0;
        return '<div class="st-row">' +
          '<div class="st-tk" style="color:' + g.color + '">' + esc(p.ticker) + '</div>' +
          '<div class="st-barcell"><div class="st-track">' +
          '<div class="st-bar" style="width:' + (w / maxW * 100) + '%;background:linear-gradient(90deg,' +
          g.color + '55,' + g.color + 'cc)"></div>' +
          '<div class="st-nm">' + esc(p.name || '') + flag(p.change) + '</div>' +
          '</div></div>' +
          '<div class="st-pct" style="color:' + (w ? g.color : 'var(--subtle)') + '">' +
          (w ? w + '%' : '&mdash;') + '</div></div>' +
          (p.note ? '<div class="st-note">' + esc(p.note) + '</div>' : '');
      }).join('');
      return '<div class="st-group"><div class="st-ghdr"><span class="st-dot" style="background:' + g.color +
        '"></span><span class="st-gname" style="color:' + g.color + '">' + g.name +
        '</span><span class="st-gdesc">' + g.desc + '</span></div>' + body + '</div>';
    }).join('');

    mount.innerHTML =
      '<div class="st-wrap">' +
        '<div class="st-top">' + donut(pos, 132) +
          '<div class="st-tally"><div class="st-chips">' + chips + '</div>' + mixBar(pos) +
          '<div class="st-mixlbl">' + esc(st.basis ||
            'Weights are a share of a hypothetical 100% sector sleeve — not a share of your portfolio. ' +
            'How large the sleeve itself should be is a separate decision, covered on Portfolio Strategy.') +
          '</div></div>' +
        '</div>' + groups +
        '<div class="st-foot"><strong>Read this as a research summary, not an instruction.</strong> ' +
          'Stances are our reading of the evidence set out further down this page — the reasoning below is ' +
          'the actual output; this chart is only a way in. Weights total ' + Math.round(total) +
          '% of a sector sleeve and assume you have already decided that sector deserves a place. ' +
          'Nothing here accounts for your capital, timeline, tax position or what you already own.' +
          (st.as_of ? ' Stances as of ' + esc(st.as_of) + ', refreshed Mondays.' : '') +
        '</div>' +
      '</div>';
  }

  function boot() {
    var mount = document.getElementById('stance-mount');
    if (mount) {
      var sector = mount.getAttribute('data-sector');
      fetch('/private/data/' + sector + '.json', { cache: 'no-cache' })
        .then(function (r) { return r.json(); })
        .then(function (d) { render(mount, d); })
        .catch(function () { mount.style.display = 'none'; });
    }
    var board = document.getElementById('stance-board');
    if (board) renderBoard(board);
  }

  /* ── Cross-sector board (Weekly Brief) ───────────────────────── */
  function renderBoard(board) {
    Promise.all(SECTORS.map(function (s) {
      return fetch('/private/data/' + s[0] + '.json', { cache: 'no-cache' })
        .then(function (r) { return r.json(); })
        .then(function (d) { return { key: s[0], label: s[1], stance: d.stance }; })
        .catch(function () { return { key: s[0], label: s[1], stance: null }; });
    })).then(function (all) {
      var live = all.filter(function (a) { return a.stance && a.stance.positions && a.stance.positions.length; });
      if (!live.length) { board.style.display = 'none'; return; }

      /* top conviction across every sector */
      var every = [];
      live.forEach(function (a) {
        a.stance.positions.forEach(function (p) {
          every.push({ t: p.ticker, n: p.name, w: +p.weight || 0, s: p.stance, sec: a.label, key: a.key, c: p.change });
        });
      });
      var core = every.filter(function (e) { return e.s === 'core'; })
        .sort(function (x, y) { return y.w - x.w; }).slice(0, 12);
      var maxC = Math.max.apply(null, core.map(function (e) { return e.w; }).concat([1]));

      var tally = { core: 0, watch: 0, spec: 0, avoid: 0 };
      every.forEach(function (e) { if (tally[e.s] != null) tally[e.s]++; });
      var chips = GROUPS.map(function (g) {
        return '<div class="st-chip ' + g.chip + '"><span class="n">' + tally[g.key] + '</span>' + g.name + '</div>';
      }).join('');

      var moved = every.filter(function (e) { return e.c === 'up' || e.c === 'down' || e.c === 'new'; });

      var lead = core.map(function (e) {
        return '<div class="st-lead"><span class="k" style="color:#10b981">' + esc(e.t) + '</span>' +
          '<span class="b"><i style="width:' + (e.w / maxC * 100) + '%;background:linear-gradient(90deg,#10b98155,#10b981cc)"></i></span>' +
          '<span class="p">' + e.w + '%</span></div>' +
          '<div style="font-size:.66rem;color:var(--subtle);padding:0 0 .35rem 58px;margin-top:-.2rem">' +
          esc(e.n) + ' · ' + e.sec + '</div>';
      }).join('');

      var cards = live.map(function (a) {
        var ps = a.stance.positions.slice()
          .sort(function (x, y) { return (+y.weight || 0) - (+x.weight || 0); }).slice(0, 4);
        var mx = Math.max.apply(null, ps.map(function (p) { return +p.weight || 0; }).concat([1]));
        var rows = ps.map(function (p) {
          var g = BY_KEY[p.stance] || BY_KEY.watch, w = +p.weight || 0;
          return '<div class="st-lead"><span class="k" style="color:' + g.color + '">' + esc(p.ticker) + '</span>' +
            '<span class="b"><i style="width:' + (w / mx * 100) + '%;background:' + g.color + 'aa"></i></span>' +
            '<span class="p">' + (w ? w + '%' : '&mdash;') + '</span></div>';
        }).join('');
        var n = a.stance.positions.length;
        return '<div class="st-sec"><div class="st-sechdr">' +
          '<a href="/private/' + a.key + '.html">' + a.label + '</a>' +
          '<span class="st-secmeta">' + n + ' NAMES</span></div>' +
          mixBar(a.stance.positions) + '<div style="height:.55rem"></div>' + rows + '</div>';
      }).join('');

      board.innerHTML =
        '<div class="st-wrap"><div class="st-chips">' + chips + '</div>' + mixBar(every) +
          '<div class="st-mixlbl">Every name the hub tracks, across all ' + live.length +
          ' sectors, sorted into one of four research stances. Each sector\'s weights are a share of ' +
          'that sector\'s own sleeve — they are not comparable across sectors and do not add up to a portfolio.' +
          (moved.length ? ' <strong style="color:var(--ge)">' + moved.length +
            ' stance change' + (moved.length === 1 ? '' : 's') + ' this week.</strong>' : '') +
          '</div>' +
          '<div class="st-group"><div class="st-ghdr"><span class="st-dot" style="background:#10b981"></span>' +
          '<span class="st-gname" style="color:#10b981">HIGHEST CONVICTION, ALL SECTORS</span>' +
          '<span class="st-gdesc">Core names by sleeve weight</span></div>' + lead + '</div>' +
        '</div>' +
        '<div style="height:1rem"></div><div class="st-board">' + cards + '</div>';
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
