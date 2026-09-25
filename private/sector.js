/* Research Hub — sector page renderer */
(function(){
'use strict';

var NAV_SECTORS=[
  {id:'ai',    n:'01',name:'AI & Compute',   href:'/private/ai.html'},
  {id:'robotics',n:'02',name:'Robotics',     href:'/private/robotics.html'},
  {id:'defense', n:'03',name:'Defense Tech', href:'/private/defense.html'},
  {id:'nuclear', n:'04',name:'Nuclear & SMRs',href:'/private/nuclear.html'},
  {id:'minerals',n:'05',name:'Critical Minerals',href:'/private/minerals.html'},
  {id:'space',   n:'06',name:'Space Economy',href:'/private/space.html'},
  {id:'storage', n:'07',name:'Energy Storage',href:'/private/storage.html'},
  {id:'biotech', n:'08',name:'AI Biotech',   href:'/private/biotech.html'},
  {id:'quantum', n:'09',name:'Quantum',      href:'/private/quantum.html'}
];
var OTHER_NAV=[
  {group:'Markets',items:[{l:'Live Watchlist',h:'/private/watchlist.html'},{l:'Catalyst Calendar',h:'/private/calendar.html'},{l:'IPO Pipeline',h:'/private/ipo.html'},{l:'ETF Compare',h:'/private/etfs.html'},{l:'Macro',h:'/private/macro.html'}]},
  {group:'Crypto',items:[{l:'Crypto Scanner',h:'/crypto-scanner/'},{l:'Trading Bots',h:'/aibot/'}]},
  {group:'Track record',items:[{l:'Research Archive',h:'/private/archive.html'},{l:'Calibration',h:'/private/calibration.html'}]},
  {group:'Strategy',items:[{l:'Portfolio Strategy',h:'/private/strategy.html'},{l:'Decision Journal',h:'/private/journal.html'},{l:'Paper Portfolio',h:'/private/paper.html'}]},
  {group:'Fund watch',items:[{l:'ARK Invest',h:'/private/ark.html'},{l:'Baillie Gifford',h:'/private/bailliegifford.html'},{l:'Investor Voices',h:'/private/investors.html'}]}
];

function x(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

function momentumDot(tag){
  var t=(tag||'').toLowerCase();
  if(t==='constructive')return 'var(--color-text)';
  if(t==='extreme spec')return 'var(--color-accent)';
  if(t==='bifurcated'||t==='crosscurrents')return 'var(--n600)';
  return 'var(--n400)';
}
function toneStyle(tag){
  var t=(tag||'').toLowerCase();
  if(t==='constructive')return 'background:var(--color-text);color:var(--color-bg);box-shadow:inset 0 0 0 1px var(--color-text);';
  if(t==='extreme spec')return 'background:var(--color-accent);color:var(--color-bg);box-shadow:inset 0 0 0 1px var(--color-accent);';
  if(t==='bifurcated'||t==='crosscurrents')return 'background:transparent;color:var(--color-text);box-shadow:inset 0 0 0 1px var(--color-text);';
  return 'background:var(--n200);color:var(--color-text);box-shadow:inset 0 0 0 1px var(--n400);';
}
function stanceStyle(s){
  if(s==='Core')return 'background:var(--color-text);color:var(--color-bg);box-shadow:inset 0 0 0 1px var(--color-text);';
  if(s==='Hold')return 'background:var(--n200);color:var(--color-text);box-shadow:inset 0 0 0 1px var(--n400);';
  return 'background:transparent;color:var(--color-accent-700);box-shadow:inset 0 0 0 1px var(--color-accent);';
}

function sidebar(activeId){
  var F=window.FYN_SECTORS||{};
  var sItems=NAV_SECTORS.map(function(s){
    var d=F[s.id]||{};
    var act=s.id===activeId;
    return '<a class="hub-nav-item'+(act?' active':'')+'" href="'+s.href+'">'
      +'<span class="hub-nav-num">'+s.n+'</span><span>'+x(s.name)+'</span>'
      +'<span class="hub-nav-dot" style="background:'+momentumDot(d.momentum)+';"></span></a>';
  }).join('');
  var oGroups=OTHER_NAV.map(function(g){
    return '<div class="hub-nav-group-label">'+x(g.group)+'</div>'
      +g.items.map(function(it){
        return '<a class="hub-nav-item" href="'+it.h+'">'
          +'<span class="hub-nav-num"></span><span>'+x(it.l)+'</span><span></span></a>';
      }).join('');
  }).join('');
  return '<aside class="hub-sidebar"><div class="hub-sidebar-inner">'
    +'<div class="hub-brand"><div class="hub-brand-kicker"><span class="hub-brand-kicker-dot"></span>Fynaptix · Private</div>'
    +'<div class="hub-brand-name">Research<br>Hub</div></div>'
    +'<div class="hub-nav-groups">'
    +'<div class="hub-nav-group-label">Research</div>'
    +'<a class="hub-nav-item" href="/private/"><span class="hub-nav-num"></span><span>Home</span><span></span></a>'
    +'<a class="hub-nav-item" href="/private/overview.html"><span class="hub-nav-num">★</span><span>Weekly Brief</span><span></span></a>'
    +sItems+oGroups+'</div>'
    +'<div class="hub-sidebar-footer"><a href="https://fynaptix.com/">← Public site</a></div>'
    +'</div></aside>';
}

function strip(){
  var S=(window.FYN_BRIEF&&window.FYN_BRIEF.strip)||[
    ['S&P 500','5,738','+0.21%'],['Nasdaq','18,210','+0.40%'],['VIX','16.2','−3.1%'],
    ['US 10Y','4.18%','−0.02'],['BTC','$112,480','+1.12%'],['ETH','$4,182','+0.86%'],['Fed funds','3.75–4.00%','Held']
  ];
  return '<div class="hub-strip">'
    +S.map(function(s){
      return '<div class="hub-strip-cell"><div class="hub-strip-label">'+x(s[0])+'</div>'
        +'<div style="display:flex;align-items:baseline;gap:6px;flex-wrap:wrap;">'
        +'<span class="hub-strip-val" id="sv-'+x(s[0]).replace(/\W/g,'')+'">'+x(s[1])+'</span>'
        +'<span class="hub-strip-chg" style="color:var(--n700);">'+x(s[2])+'</span>'
        +'</div></div>';
    }).join('')+'</div>';
}

var SLEEVE_BG=['var(--color-text)','var(--n700)','var(--n400)','var(--n300)'];
var SLEEVE_FG=['var(--color-bg)','var(--color-bg)','var(--color-text)','var(--color-text)'];

function buildStatBand(D){
  return '<div class="hub-stat-band">'
    +D.stats.map(function(s){
      return '<div class="hub-stat-cell"><span class="hub-stat-label">'+x(s[0])+'</span>'
        +'<span class="hub-stat-val">'+x(s[1])+'</span>'
        +'<span class="hub-stat-note">'+x(s[2])+'</span></div>';
    }).join('')+'</div>';
}

function buildAtAGlance(D){
  var segs=D.tiers.map(function(t,i){
    return '<div class="hub-sleeve-seg" style="width:'+t[2]+'%;background:'+SLEEVE_BG[i]+';color:'+SLEEVE_FG[i]+';">'
      +'<span style="min-width:0;overflow:hidden;text-overflow:ellipsis;">'+x(t[1])+'</span><span style="flex:none;">'+t[2]+'%</span></div>';
  }).join('');
  var cards=D.tiers.map(function(t){
    var rows=D.watch.filter(function(w){return w[0]===t[0];}).map(function(w){
      return '<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;font-size:13px;">'
        +'<b>'+x(w[1])+'</b><span class="tag" style="'+stanceStyle(w[3])+'">'+x(w[3])+'</span></div>';
    }).join('');
    return '<div class="hub-cell"><div style="font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--n700);margin-bottom:10px;">Tier '+t[0]+' · '+x(t[1])+'</div>'+rows+'</div>';
  }).join('');
  return '<section class="hub-section"><div class="hub-section-label">'
    +'<div class="hub-section-num">00</div><h2 class="hub-section-h2">At a glance</h2>'
    +'<p class="hub-section-desc">Research stance and sleeve split.</p></div>'
    +'<div class="hub-section-content"><div class="hub-sleeve">'+segs+'</div>'
    +'<div class="hub-cell-grid" style="margin-top:16px;">'+cards+'</div></div></section>';
}

function buildWatchlist(D){
  var btns='<button class="hub-tier-btn active" data-tier="0">All tiers <span>'+D.watch.length+'</span></button>'
    +D.tiers.map(function(t){
      var cnt=D.watch.filter(function(w){return w[0]===t[0];}).length;
      return '<button class="hub-tier-btn" data-tier="'+t[0]+'">'+x(t[0]+' · '+t[1])+' <span>'+cnt+'</span></button>';
    }).join('');
  var rows=D.watch.map(function(w){
    return '<div class="hub-watch-row" data-tier="'+w[0]+'">'
      +'<b class="hub-watch-ticker">'+x(w[1])+'</b>'
      +'<div><span>'+x(w[2])+'</span><br><span style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--n700);">Tier '+w[0]+'</span></div>'
      +'<span style="text-wrap:pretty;">'+x(w[4])+'</span>'
      +'<span style="text-wrap:pretty;color:var(--n800);">'+x(w[5])+'</span>'
      +'<span class="tag" style="'+stanceStyle(w[3])+'">'+x(w[3])+'</span></div>';
  }).join('');
  return '<section class="hub-section"><div class="hub-section-label">'
    +'<div class="hub-section-num">01</div><h2 class="hub-section-h2">Public watchlist</h2>'
    +'<p class="hub-section-desc">Tiered by maturity and role — not a ranked buy list.</p>'
    +'<div class="hub-tier-filter">'+btns+'</div></div>'
    +'<div class="hub-section-content"><div class="hub-watch-wrap"><div class="hub-watch-table" id="watch-tbl">'
    +'<div class="hub-watch-head"><span>Ticker</span><span>Company</span><span>Angle</span><span>Watch for</span><span>Stance</span></div>'
    +rows+'</div></div></div></section>';
}

function buildPrivate(D){
  if(!D.privates||!D.privates.length)return '';
  var cells=D.privates.map(function(p){
    return '<div class="hub-priv-cell"><b style="font-size:18px;">'+x(p[0])+'</b>'
      +'<span style="font-size:40px;font-weight:800;letter-spacing:-.04em;line-height:1;">'+x(p[1])+'</span>'
      +'<span style="font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--color-accent-700);">'+x(p[2])+'</span>'
      +'<span style="font-size:13px;line-height:1.45;color:var(--n800);text-wrap:pretty;">'+x(p[3])+'</span></div>';
  }).join('');
  return '<section class="hub-section"><div class="hub-section-label">'
    +'<div class="hub-section-num">02</div><h2 class="hub-section-h2">Private market</h2></div>'
    +'<div class="hub-section-content"><div class="hub-priv-grid">'+cells+'</div></div></section>';
}

function buildBear(D){
  var cells=D.bear.map(function(b,i){
    var n=String(i+1).padStart(2,'0');
    var ctr=b[2]?'<span style="font-size:12px;line-height:1.4;color:var(--n700);padding-top:6px;border-top:1px dashed var(--n400);display:block;"><b style="color:var(--color-text);">Counter · </b>'+x(b[2])+'</span>':'';
    return '<div class="hub-bear-cell"><span style="font-size:22px;font-weight:800;color:var(--color-accent);">'+n+'</span>'
      +'<div style="display:flex;flex-direction:column;gap:6px;">'
      +'<b style="font-size:16px;line-height:1.2;">'+x(b[0])+'</b>'
      +'<span style="font-size:13px;line-height:1.45;text-wrap:pretty;">'+x(b[1])+'</span>'+ctr+'</div></div>';
  }).join('');
  return '<section class="hub-section"><div class="hub-section-label">'
    +'<div class="hub-section-num">03</div><h2 class="hub-section-h2">The bear case</h2>'
    +'<p class="hub-section-desc">Arguments against, with the counterpoint where one exists.</p></div>'
    +'<div class="hub-section-content"><div class="hub-bear-grid">'+cells+'</div></div></section>';
}

function buildCatalysts(D){
  var rows=D.catalysts.map(function(c){
    return '<div class="hub-catalyst-row"><b style="font-size:13px;">'+x(c[0])+'</b>'
      +'<div><b style="font-size:15px;line-height:1.3;text-wrap:pretty;">'+x(c[1])+'</b>'
      +'<br><span style="font-size:13px;color:var(--n800);text-wrap:pretty;">'+x(c[2])+'</span></div></div>';
  }).join('');
  return '<section class="hub-section"><div class="hub-section-label">'
    +'<div class="hub-section-num">04</div><h2 class="hub-section-h2">Catalysts</h2>'
    +'<p class="hub-section-desc">News and upcoming events.</p></div>'
    +'<div class="hub-section-content" style="border-top:2px solid var(--color-text);">'+rows+'</div></section>';
}

function buildETFs(D){
  var vals=D.etfs.map(function(e){return Math.abs(e[3]||0);});
  var eMax=Math.max(10,Math.max.apply(null,vals));
  var rows=D.etfs.map(function(e){
    var y=e[3];
    var ytd=y==null?'—':(y>=0?'+':'−')+Math.abs(y).toFixed(1)+'%';
    var bw=y==null?0:(Math.abs(y)/eMax*100).toFixed(1);
    var bc=y==null?'transparent':y<0?'var(--color-accent)':y>40?'var(--color-text)':'var(--n600)';
    var vc=y==null?'var(--n600)':y>=0?'var(--color-text)':'var(--color-accent-700)';
    return '<div class="hub-etf-row"><b style="font-size:16px;">'+x(e[0])+'</b>'
      +'<div><span>'+x(e[1])+'</span><br><span style="font-size:11px;color:var(--n700);">'+x(e[2])+'</span></div>'
      +'<div class="hub-etf-bar-bg"><div class="hub-etf-bar" style="width:'+bw+'%;background:'+bc+';"></div></div>'
      +'<b style="text-align:right;font-size:16px;color:'+vc+';">'+ytd+'</b></div>';
  }).join('');
  return '<section class="hub-section"><div class="hub-section-label">'
    +'<div class="hub-section-num">05</div><h2 class="hub-section-h2">ETFs</h2>'
    +'<p class="hub-section-desc">Diversified exposure · '+x(D.etfLabel)+'.</p></div>'
    +'<div class="hub-section-content" style="border-top:2px solid var(--color-text);">'+rows+'</div></section>';
}

function buildSources(D){
  var tags=(D.sources||[]).map(function(s){return '<span class="tag tag-neutral">'+x(s)+'</span>';}).join('');
  return '<section class="hub-section"><div class="hub-section-label">'
    +'<div class="hub-section-num">Sources</div><h2 class="hub-section-h2">'+x(D.srcCount)+' this edition</h2></div>'
    +'<div class="hub-section-content" style="display:flex;flex-direction:column;gap:10px;">'
    +'<div style="display:flex;flex-wrap:wrap;gap:6px;">'+tags+'</div>'
    +'<span style="font-size:12px;color:var(--n700);">Figures approximate, from public reporting as of Sep 21, 2026. Always confirm independently.</span>'
    +'</div></section>';
}

function buildMain(D){
  var hc=D.heat>=8?'var(--color-accent-700)':'var(--color-text)';
  return '<main class="hub-main">'
    +strip()
    +'<div class="hub-content">'
    +'<div class="hub-page-header">'
    +'<div><div class="hub-kicker">'+x(D.n)+' · '+x(D.kicker)+' · Sep 2026</div>'
    +'<h1 class="hub-h1">'+x(D.title)+'</h1>'
    +'<p style="margin:14px 0 0;font-size:16px;max-width:560px;color:var(--n800);text-wrap:pretty;">'+x(D.sub)+'</p></div>'
    +'<div class="hub-readout">'
    +'<div class="hub-readout-cell"><div class="hub-readout-label">Momentum</div><b class="hub-readout-val">'+x(D.momentum)+'</b></div>'
    +'<div class="hub-readout-cell"><div class="hub-readout-label">Valuation heat</div><b class="hub-readout-val" style="color:'+hc+';">'+D.heat.toFixed(1)+' / 10</b></div>'
    +'<div class="hub-readout-cell"><div class="hub-readout-label">Generated</div><b class="hub-readout-val">Sep 21 · Mon</b></div>'
    +'</div></div>'
    +buildStatBand(D)
    +buildAtAGlance(D)
    +buildWatchlist(D)
    +buildPrivate(D)
    +buildBear(D)
    +buildCatalysts(D)
    +buildETFs(D)
    +buildSources(D)
    +'<div class="hub-footer"><span>© 2026 Fynaptix · Personal research hub</span><span>Not financial advice · do your own due diligence</span></div>'
    +'</div></main>';
}

function initInteractions(){
  document.addEventListener('click',function(ev){
    var btn=ev.target.closest('.hub-tier-btn');
    if(!btn)return;
    var tier=parseInt(btn.dataset.tier,10);
    document.querySelectorAll('.hub-tier-btn').forEach(function(b){b.classList.remove('active');});
    btn.classList.add('active');
    document.querySelectorAll('.hub-watch-row[data-tier]').forEach(function(r){
      r.style.display=(tier===0||parseInt(r.dataset.tier,10)===tier)?'':'none';
    });
  });
}

window.renderSector=function(id){
  var D=(window.FYN_SECTORS||{})[id];
  if(!D){document.body.innerHTML='<p style="padding:32px;">Sector "'+id+'" not found in sectors-data.js.</p>';return;}
  document.title='Fynaptix · '+D.title;
  var app=document.getElementById('hub');
  app.className='hub-layout';
  app.innerHTML=sidebar(id)+buildMain(D);
  initInteractions();
  // live BTC/ETH price tick
  if(window.FYN_BRIEF&&window.FYN_BRIEF.strip){
    var btcEl=document.getElementById('svBTC'),ethEl=document.getElementById('svETH');
    if(btcEl&&ethEl){
      var px={BTC:parseFloat(String(window.FYN_BRIEF.strip[4][1]).replace(/[$,]/g,'')),ETH:parseFloat(String(window.FYN_BRIEF.strip[5][1]).replace(/[$,]/g,''))};
      setInterval(function(){
        for(var k in px){
          var nv=px[k]*(1+(Math.random()-.5)*.0012);
          var up=nv>=px[k];px[k]=nv;
          var el=k==='BTC'?btcEl:ethEl;
          if(el){
            el.textContent='$'+Math.round(nv).toLocaleString('en-US');
            el.className='hub-strip-val '+(up?'flash-up':'flash-dn');
            setTimeout(function(e){e.className='hub-strip-val';},700,el);
          }
        }
      },2500);
    }
  }
};
})();
