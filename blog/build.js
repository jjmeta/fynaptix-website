#!/usr/bin/env node
// Fynaptix Blog Builder
// Reads blog/posts/*.md → generates blog/index.html + blog/[slug].html
// Run: node blog/build.js

const fs   = require('fs')
const path = require('path')
const matter = require('gray-matter')
const { marked } = require('marked')

const POSTS_DIR  = path.join(__dirname, 'posts')
const BLOG_DIR   = __dirname
const OUTPUT_DIR = path.join(__dirname, 'posts-html')

// ── Shared brand styles ──────────────────────────────────────────────────────
const BRAND_CSS = `
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{
    --bg:#05070f;--bg2:#080d1a;--bg3:#0d1526;
    --gs:#ff5f1f;--gm:#c025e8;--ge:#2ed0f5;
    --text:#e8edf8;--muted:#6b7a99;
    --border:rgba(255,255,255,0.07);
    --fd:'Outfit',sans-serif;--fb:'DM Sans',sans-serif;
  }
  html,body{background:var(--bg);color:var(--text);font-family:var(--fb);line-height:1.6}
  a{color:inherit;text-decoration:none}
  nav{
    position:sticky;top:0;z-index:50;
    background:rgba(5,7,15,0.92);backdrop-filter:blur(12px);
    border-bottom:1px solid var(--border);
    display:flex;align-items:center;justify-content:space-between;
    padding:.9rem 2rem;
  }
  .nav-logo{display:flex;align-items:center;gap:.5rem;font-family:var(--fd);font-weight:700;font-size:1rem}
  .logo-mark{width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,var(--gs),var(--gm),var(--ge));display:flex;align-items:center;justify-content:center;font-size:.7rem}
  .nav-links{display:flex;align-items:center;gap:1.5rem;list-style:none}
  .nav-links a{color:var(--muted);font-size:.875rem;transition:color .2s}
  .nav-links a:hover{color:var(--text)}
  .nav-cta{background:linear-gradient(135deg,var(--gs),var(--gm));color:#fff!important;padding:.4rem 1rem;border-radius:8px;font-weight:600}
  footer{border-top:1px solid var(--border);padding:2rem;text-align:center;color:var(--muted);font-size:.8rem;margin-top:4rem}
`

const NAV_HTML = `
<nav>
  <a class="nav-logo" href="/">
    <div class="logo-mark">∞</div>
    Fynaptix
  </a>
  <ul class="nav-links">
    <li><a href="/#how">How It Works</a></li>
    <li><a href="/#services">Services</a></li>
    <li><a href="/#usecases">Use Cases</a></li>
    <li><a href="/blog">Blog</a></li>
    <li><a href="/assessment.html" style="color:#ff5f1f;font-weight:600">Free Assessment</a></li>
    <li><a class="nav-cta" href="/#contact">Get Started</a></li>
  </ul>
</nav>`

const FOOTER_HTML = `
<footer>
  <p>© ${new Date().getFullYear()} Fynaptix · Enterprise Claude AI Architecture & Deployment · <a href="mailto:hello@fynaptix.com" style="color:var(--ge)">hello@fynaptix.com</a></p>
</footer>`

const FONTS = `<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet"/>`

// ── Read all posts ────────────────────────────────────────────────────────────
function readPosts() {
  if (!fs.existsSync(POSTS_DIR)) return []

  return fs.readdirSync(POSTS_DIR)
    .filter(f => f.endsWith('.md'))
    .map(file => {
      const raw = fs.readFileSync(path.join(POSTS_DIR, file), 'utf8')
      const { data, content } = matter(raw)
      const slug = data.slug || file.replace(/\.md$/, '')
      return {
        slug,
        title:   data.title   || 'Untitled',
        date:    data.date    ? new Date(data.date) : new Date(),
        excerpt: data.excerpt || '',
        tags:    data.tags    || [],
        author:  data.author  || 'Fynaptix',
        cover:   data.cover   || null,
        content,
        html: marked(content),
        file,
      }
    })
    .filter(p => p.title !== 'Untitled' || p.content.trim())
    .sort((a, b) => b.date - a.date) // newest first
}

// ── Format date ───────────────────────────────────────────────────────────────
function fmtDate(d) {
  return d.toLocaleDateString('en-AU', { day:'numeric', month:'long', year:'numeric' })
}

// ── Generate blog index ───────────────────────────────────────────────────────
function buildIndex(posts) {
  const cards = posts.length === 0
    ? `<div class="empty">
        <div class="empty-icon">✍️</div>
        <h3>First post coming soon</h3>
        <p>We're working on enterprise AI insights, Claude deployment guides, and practical frameworks for your organisation.</p>
      </div>`
    : posts.map((p, i) => `
      <article class="post-card ${i === 0 ? 'featured' : ''}">
        <div class="post-meta">
          <time>${fmtDate(p.date)}</time>
          ${p.tags.slice(0,2).map(t => `<span class="tag">${t}</span>`).join('')}
        </div>
        <h2 class="post-title"><a href="/blog/${p.slug}.html">${p.title}</a></h2>
        ${p.excerpt ? `<p class="post-excerpt">${p.excerpt}</p>` : ''}
        <a class="read-more" href="/blog/${p.slug}.html">Read article →</a>
      </article>`).join('\n')

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Blog · Fynaptix</title>
<meta name="description" content="Enterprise AI insights, Claude deployment guides, and practical frameworks from Fynaptix."/>
${FONTS}
<style>
${BRAND_CSS}
.hero{
  padding:5rem 2rem 3rem;text-align:center;
  background:radial-gradient(ellipse at 50% 0%,rgba(192,37,232,0.1) 0%,transparent 60%);
}
.eyebrow{display:inline-flex;align-items:center;gap:.4rem;background:rgba(192,37,232,0.1);border:1px solid rgba(192,37,232,0.2);border-radius:99px;padding:.3rem .9rem;font-size:.75rem;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--gm);margin-bottom:1.5rem}
.hero h1{font-family:var(--fd);font-size:clamp(2rem,5vw,3.5rem);font-weight:800;margin-bottom:1rem}
.grad{background:linear-gradient(135deg,var(--gs),var(--gm),var(--ge));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.hero p{color:var(--muted);font-size:1.1rem;max-width:560px;margin:0 auto}
.posts-wrap{max-width:800px;margin:0 auto;padding:2rem}
.post-card{padding:2rem 0;border-bottom:1px solid var(--border)}
.post-card:last-child{border-bottom:none}
.post-card.featured{padding:2rem;background:var(--bg2);border:1px solid var(--border);border-radius:16px;margin-bottom:2rem}
.post-meta{display:flex;align-items:center;gap:.75rem;margin-bottom:.75rem;flex-wrap:wrap}
.post-meta time{font-size:.8rem;color:var(--muted)}
.tag{display:inline-block;padding:.15rem .6rem;border-radius:99px;background:rgba(46,208,245,0.1);border:1px solid rgba(46,208,245,0.2);color:var(--ge);font-size:.7rem;font-weight:600}
.post-title{font-family:var(--fd);font-size:1.4rem;font-weight:700;margin-bottom:.75rem;line-height:1.3}
.post-title a:hover{background:linear-gradient(135deg,var(--gs),var(--gm));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.post-excerpt{color:var(--muted);font-size:.95rem;margin-bottom:1rem;line-height:1.6}
.read-more{color:var(--ge);font-size:.875rem;font-weight:600;transition:opacity .2s}
.read-more:hover{opacity:.7}
.empty{text-align:center;padding:4rem 2rem;background:var(--bg2);border:1px dashed rgba(255,255,255,0.1);border-radius:16px}
.empty-icon{font-size:3rem;margin-bottom:1rem}
.empty h3{font-family:var(--fd);font-size:1.2rem;font-weight:700;margin-bottom:.5rem}
.empty p{color:var(--muted);max-width:400px;margin:0 auto}
</style>
</head>
<body>
${NAV_HTML}
<div class="hero">
  <div class="eyebrow">● Enterprise AI Insights</div>
  <h1>The <span class="grad">Fynaptix</span> Blog</h1>
  <p>Practical guides, deployment frameworks, and enterprise AI insights from practitioners in the field.</p>
</div>
<div class="posts-wrap">
  ${cards}
</div>
${FOOTER_HTML}
</body>
</html>`

  fs.writeFileSync(path.join(BLOG_DIR, 'index.html'), html, 'utf8')
  console.log(`✓ blog/index.html — ${posts.length} post(s)`)
}

// ── Generate individual post pages ────────────────────────────────────────────
function buildPost(post) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${post.title} · Fynaptix Blog</title>
<meta name="description" content="${post.excerpt}"/>
<meta property="og:title" content="${post.title}"/>
<meta property="og:description" content="${post.excerpt}"/>
<meta property="og:type" content="article"/>
${FONTS}
<style>
${BRAND_CSS}
.hero{
  padding:4rem 2rem 2rem;text-align:center;
  background:radial-gradient(ellipse at 50% 0%,rgba(192,37,232,0.08) 0%,transparent 60%);
  border-bottom:1px solid var(--border);
}
.back{display:inline-flex;align-items:center;gap:.4rem;color:var(--muted);font-size:.875rem;margin-bottom:2rem;transition:color .2s}
.back:hover{color:var(--text)}
.post-meta{display:flex;align-items:center;gap:.75rem;justify-content:center;margin-bottom:1.5rem;flex-wrap:wrap}
.post-meta time{font-size:.85rem;color:var(--muted)}
.post-meta .author{font-size:.85rem;color:var(--muted)}
.tag{display:inline-block;padding:.15rem .6rem;border-radius:99px;background:rgba(46,208,245,0.1);border:1px solid rgba(46,208,245,0.2);color:var(--ge);font-size:.7rem;font-weight:600}
h1{font-family:var(--fd);font-size:clamp(1.75rem,4vw,2.75rem);font-weight:800;max-width:720px;margin:0 auto 1rem;line-height:1.2}
.excerpt{color:var(--muted);font-size:1.1rem;max-width:620px;margin:0 auto}
.content{max-width:720px;margin:3rem auto;padding:0 2rem}
.content h2{font-family:var(--fd);font-size:1.5rem;font-weight:700;margin:2.5rem 0 1rem;color:var(--text)}
.content h3{font-family:var(--fd);font-size:1.15rem;font-weight:600;margin:2rem 0 .75rem;color:var(--text)}
.content h4{font-family:var(--fd);font-size:1rem;font-weight:600;margin:1.5rem 0 .5rem;color:var(--muted)}
.content p{color:#c8d0e0;margin-bottom:1.25rem;line-height:1.8;font-size:.975rem}
.content ul,.content ol{padding-left:1.5rem;margin-bottom:1.25rem}
.content li{color:#c8d0e0;margin-bottom:.4rem;line-height:1.7;font-size:.975rem}
.content strong{color:var(--text);font-weight:600}
.content em{color:var(--muted)}
.content a{color:var(--ge);text-decoration:underline;text-underline-offset:3px}
.content a:hover{opacity:.8}
.content blockquote{border-left:3px solid var(--gm);padding:.75rem 1.25rem;margin:1.5rem 0;background:rgba(192,37,232,0.05);border-radius:0 8px 8px 0}
.content blockquote p{color:var(--muted);margin:0;font-style:italic}
.content code{background:var(--bg3);border:1px solid var(--border);border-radius:4px;padding:.1rem .4rem;font-size:.85rem;color:var(--ge);font-family:'Courier New',monospace}
.content pre{background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:1.25rem;overflow-x:auto;margin:1.5rem 0}
.content pre code{background:none;border:none;padding:0;font-size:.85rem}
.content hr{border:none;border-top:1px solid var(--border);margin:2.5rem 0}
.content table{width:100%;border-collapse:collapse;margin:1.5rem 0;font-size:.875rem}
.content th{background:var(--bg2);padding:.6rem 1rem;text-align:left;font-family:var(--fd);font-weight:600;border-bottom:2px solid var(--border)}
.content td{padding:.6rem 1rem;border-bottom:1px solid var(--border);color:#c8d0e0}
.content tr:last-child td{border-bottom:none}
.cta-box{background:var(--bg2);border:1px solid var(--border);border-radius:16px;padding:2.5rem;text-align:center;margin:3rem 0}
.cta-box h3{font-family:var(--fd);font-size:1.3rem;font-weight:700;margin-bottom:.75rem}
.cta-box p{color:var(--muted);margin-bottom:1.5rem}
.cta-btn{display:inline-block;padding:.75rem 2rem;border-radius:10px;background:linear-gradient(135deg,var(--gs),var(--gm));color:#fff;font-family:var(--fd);font-weight:600;font-size:.95rem;transition:opacity .2s}
.cta-btn:hover{opacity:.9}
</style>
</head>
<body>
${NAV_HTML}
<div class="hero">
  <a class="back" href="/blog">← Back to Blog</a>
  <div class="post-meta">
    <time>${fmtDate(post.date)}</time>
    <span class="author">by ${post.author}</span>
    ${post.tags.map(t => `<span class="tag">${t}</span>`).join('')}
  </div>
  <h1>${post.title}</h1>
  ${post.excerpt ? `<p class="excerpt">${post.excerpt}</p>` : ''}
</div>

<div class="content">
  ${post.html}

  <div class="cta-box">
    <h3>Ready to build your Claude AI layer?</h3>
    <p>Take our free readiness assessment and get a personalised roadmap for your organisation.</p>
    <a class="cta-btn" href="/assessment.html">Take the Free Assessment →</a>
  </div>
</div>

${FOOTER_HTML}
</body>
</html>`

  fs.writeFileSync(path.join(BLOG_DIR, `${post.slug}.html`), html, 'utf8')
  console.log(`✓ blog/${post.slug}.html`)
}

// ── Run ───────────────────────────────────────────────────────────────────────
console.log('Building Fynaptix blog...')
const posts = readPosts()
buildIndex(posts)
posts.forEach(buildPost)
console.log(`\nDone — ${posts.length} post(s) built.`)
