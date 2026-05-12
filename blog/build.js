#!/usr/bin/env node
// Fynaptix Blog Builder
// Reads blog/posts/*.md → generates blog/index.html + blog/[slug].html
// Run: node blog/build.js

const fs     = require('fs')
const path   = require('path')
const matter = require('gray-matter')
const { marked } = require('marked')

const POSTS_DIR = path.join(__dirname, 'posts')
const BLOG_DIR  = __dirname

// ── Shared partials (matching main site exactly) ─────────────────────────────

const HEAD_COMMON = (title, desc) => `
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title}</title>
<meta name="description" content="${desc}"/>
<meta name="robots" content="index,follow"/>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet"/>
<link href="/assets/css/styles.css" rel="stylesheet"/>
`

const NAV = `
<nav id="main-nav">
  <a class="nav-logo" href="/">
    <img alt="Fynaptix" class="nav-logo-img" src="/assets/images/embedded-image-1.png"/>
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

const FOOTER = `
<footer>
  <div class="fi">
    <div>
      <div class="flogo-wrap">
        <img alt="Fynaptix" src="/assets/images/embedded-image-3.png" style="height:44px;width:auto;filter:drop-shadow(0 0 6px rgba(192,37,232,.4))"/>
      </div>
      <p class="ftag">Enterprise Claude AI Architecture &amp; Deployment. Design, build, and operationalise production-grade Claude systems across your organisation.</p>
    </div>
    <div class="fc"><h4>Services</h4><ul>
      <li><a href="/#services">Claude AI Architecture</a></li>
      <li><a href="/#services">CoWork Deployment</a></li>
      <li><a href="/#services">AI Governance</a></li>
      <li><a href="/#services">MCP Development</a></li>
    </ul></div>
    <div class="fc"><h4>Company</h4><ul>
      <li><a href="/#why">About</a></li>
      <li><a href="/#how">How It Works</a></li>
      <li><a href="/blog">Blog</a></li>
      <li><a href="/#contact">Contact</a></li>
    </ul></div>
    <div class="fc"><h4>Connect</h4><ul>
      <li><a href="mailto:hello@fynaptix.com">hello@fynaptix.com</a></li>
      <li><a href="https://linkedin.com/company/fynaptix" target="_blank">LinkedIn</a></li>
      <li><a href="https://twitter.com/fynaptix" target="_blank">X / Twitter</a></li>
    </ul></div>
  </div>
  <div class="fb">
    <span class="fcp">© ${new Date().getFullYear()} Fynaptix. All rights reserved.</span>
    <div class="fls"><a href="#">Privacy Policy</a><a href="#">Terms of Service</a></div>
  </div>
</footer>`

const NAV_JS = `
<script>
  const nav = document.getElementById('main-nav')
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 20)
    })
  }
  // Reveal animations
  const reveals = document.querySelectorAll('.reveal')
  if (reveals.length) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') })
    }, { threshold: 0.1 })
    reveals.forEach(el => io.observe(el))
  }
</script>`

// ── Blog-specific styles (layered on top of styles.css) ──────────────────────

const BLOG_CSS = `
<style>
/* ── Blog index ── */
.blog-hero{position:relative;padding:160px 48px 80px;text-align:center;overflow:hidden;background:radial-gradient(ellipse at 50% 0%,rgba(192,37,232,.12) 0%,transparent 60%)}
.blog-hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 70% 60%,rgba(255,95,31,.06) 0%,transparent 50%);pointer-events:none}
.blog-hero-inner{position:relative;z-index:2;max-width:700px;margin:0 auto}
.blog-grid{max-width:1200px;margin:0 auto;padding:0 48px 100px;display:grid;grid-template-columns:2fr 1fr;gap:48px;align-items:start}
.blog-main{}
.blog-sidebar{position:sticky;top:96px}
.blog-featured{background:var(--bg2);border:1px solid var(--border2);border-radius:20px;padding:40px;margin-bottom:32px;position:relative;overflow:hidden;transition:border-color .3s,transform .3s;text-decoration:none;display:block}
.blog-featured::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,var(--gs),var(--gm),var(--ge))}
.blog-featured:hover{border-color:rgba(192,37,232,.35);transform:translateY(-4px)}
.featured-label{display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:99px;background:rgba(255,95,31,.1);border:1px solid rgba(255,95,31,.2);font-family:var(--fd);font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--gs);margin-bottom:20px}
.blog-featured h2{font-family:var(--fd);font-size:clamp(20px,2.5vw,28px);font-weight:800;line-height:1.2;margin-bottom:14px;color:var(--text)}
.blog-featured p{font-size:15px;color:rgba(232,237,248,.65);line-height:1.75;margin-bottom:20px}
.post-card-row{display:flex;flex-direction:column;gap:0}
.post-card-item{padding:28px 0;border-bottom:1px solid var(--border);display:grid;grid-template-columns:1fr auto;gap:24px;align-items:start;text-decoration:none;transition:opacity .2s}
.post-card-item:last-child{border-bottom:none}
.post-card-item:hover{opacity:.8}
.pci-left h3{font-family:var(--fd);font-size:17px;font-weight:700;line-height:1.3;margin-bottom:8px;color:var(--text)}
.pci-left p{font-size:13px;color:rgba(232,237,248,.55);line-height:1.65}
.pci-right{text-align:right;flex-shrink:0}
.pci-date{font-size:11px;color:var(--muted);white-space:nowrap;margin-top:4px}
.post-meta-row{display:flex;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap}
.pmeta-date{font-size:11px;color:var(--muted)}
.tag{display:inline-block;padding:2px 8px;border-radius:4px;background:rgba(46,208,245,.08);border:1px solid rgba(46,208,245,.18);font-family:var(--fd);font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--ge)}
.tag-orange{background:rgba(255,95,31,.08);border-color:rgba(255,95,31,.2);color:var(--gs)}
.tag-purple{background:rgba(192,37,232,.08);border-color:rgba(192,37,232,.2);color:var(--gm)}
.read-arrow{display:inline-flex;align-items:center;gap:6px;font-family:var(--fd);font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--ge);margin-top:16px}
/* Sidebar */
.sidebar-card{background:var(--bg2);border:1px solid var(--border);border-radius:14px;padding:28px;margin-bottom:20px}
.sidebar-card h4{font-family:var(--fd);font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--gm);margin-bottom:16px}
.sidebar-cta-btn{display:block;width:100%;padding:12px;border-radius:8px;background:linear-gradient(135deg,var(--gs),var(--gm));color:#fff;font-family:var(--fd);font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;text-align:center;text-decoration:none;margin-bottom:10px;transition:opacity .2s}
.sidebar-cta-btn:hover{opacity:.9}
.sidebar-cta-ghost{display:block;width:100%;padding:12px;border-radius:8px;border:1px solid var(--border2);color:var(--text);font-family:var(--fd);font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;text-align:center;text-decoration:none;transition:all .2s}
.sidebar-cta-ghost:hover{border-color:rgba(255,255,255,.25);background:rgba(255,255,255,.03)}
.tag-list{display:flex;flex-wrap:wrap;gap:6px}
/* Empty */
.blog-empty{text-align:center;padding:60px 40px;background:var(--bg2);border:1px dashed rgba(255,255,255,.08);border-radius:20px}
.blog-empty .ei{font-size:3rem;margin-bottom:16px}
.blog-empty h3{font-family:var(--fd);font-size:1.2rem;font-weight:700;margin-bottom:8px}
.blog-empty p{color:var(--muted);font-size:.875rem}

/* ── Post page ── */
.post-hero{position:relative;padding:160px 48px 60px;text-align:center;border-bottom:1px solid var(--border);background:radial-gradient(ellipse at 50% 0%,rgba(192,37,232,.1) 0%,transparent 55%)}
.post-hero-inner{position:relative;z-index:2;max-width:760px;margin:0 auto}
.back-link{display:inline-flex;align-items:center;gap:6px;font-family:var(--fd);font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);text-decoration:none;margin-bottom:32px;transition:color .2s}
.back-link:hover{color:var(--text)}
.post-hero h1{font-family:var(--fd);font-size:clamp(26px,4vw,48px);font-weight:800;line-height:1.1;letter-spacing:-.02em;margin-bottom:20px}
.post-hero-excerpt{font-size:17px;color:rgba(232,237,248,.6);line-height:1.75;max-width:620px;margin:0 auto}
.post-body-wrap{max-width:760px;margin:0 auto;padding:60px 48px 0}
/* Article typography */
.post-body h2{font-family:var(--fd);font-size:clamp(20px,2.5vw,28px);font-weight:700;margin:2.5rem 0 1rem;letter-spacing:-.01em}
.post-body h3{font-family:var(--fd);font-size:clamp(16px,2vw,20px);font-weight:700;margin:2rem 0 .75rem}
.post-body h4{font-family:var(--fd);font-size:15px;font-weight:600;margin:1.5rem 0 .5rem;color:var(--muted)}
.post-body p{font-size:16px;color:rgba(232,237,248,.75);margin-bottom:1.4rem;line-height:1.85}
.post-body ul,.post-body ol{padding-left:1.5rem;margin-bottom:1.4rem}
.post-body li{font-size:15px;color:rgba(232,237,248,.7);margin-bottom:.5rem;line-height:1.75}
.post-body strong{color:var(--text);font-weight:600}
.post-body em{color:var(--muted)}
.post-body a{color:var(--ge);text-decoration:underline;text-underline-offset:3px}
.post-body a:hover{opacity:.75}
.post-body blockquote{border-left:3px solid var(--gm);padding:16px 24px;margin:2rem 0;background:rgba(192,37,232,.04);border-radius:0 10px 10px 0}
.post-body blockquote p{color:var(--muted);font-style:italic;margin:0}
.post-body code{background:var(--bg3);border:1px solid var(--border);border-radius:4px;padding:2px 7px;font-size:13px;color:var(--ge);font-family:'Courier New',monospace}
.post-body pre{background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:24px;overflow-x:auto;margin:1.5rem 0}
.post-body pre code{background:none;border:none;padding:0}
.post-body hr{border:none;border-top:1px solid var(--border);margin:3rem 0}
.post-body table{width:100%;border-collapse:collapse;margin:1.5rem 0;font-size:14px}
.post-body th{background:var(--bg2);padding:10px 16px;text-align:left;font-family:var(--fd);font-weight:600;border-bottom:2px solid var(--border);font-size:12px;letter-spacing:.04em}
.post-body td{padding:10px 16px;border-bottom:1px solid var(--border);color:rgba(232,237,248,.65)}
.post-body tr:last-child td{border-bottom:none}
/* Post CTA */
.post-cta{margin:60px 0;position:relative;overflow:hidden;border-radius:20px;background:var(--bg2);border:1px solid var(--border)}
.post-cta::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,var(--gs),var(--gm),var(--ge))}
.post-cta-inner{padding:48px;text-align:center}
.post-cta h3{font-family:var(--fd);font-size:clamp(20px,2.5vw,28px);font-weight:800;margin-bottom:12px}
.post-cta p{font-size:15px;color:rgba(232,237,248,.6);margin-bottom:32px;max-width:480px;margin-left:auto;margin-right:auto}
.post-cta .cta2{justify-content:center}

@media(max-width:960px){
  .blog-grid{grid-template-columns:1fr;padding:0 20px 60px}
  .blog-sidebar{display:none}
  .blog-hero{padding:120px 20px 60px}
  .post-hero{padding:120px 20px 40px}
  .post-body-wrap{padding:40px 20px 0}
  .post-cta-inner{padding:32px 20px}
}
</style>`

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(d) {
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
}

function fmtShort(d) {
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

function tagHtml(tags) {
  const colours = ['', 'tag-orange', 'tag-purple']
  return (tags || []).map((t, i) => `<span class="tag ${colours[i % colours.length]}">${t}</span>`).join(' ')
}

// ── Read all posts ────────────────────────────────────────────────────────────

function readPosts() {
  if (!fs.existsSync(POSTS_DIR)) return []

  return fs.readdirSync(POSTS_DIR)
    .filter(f => f.endsWith('.md'))
    .map(file => {
      const raw  = fs.readFileSync(path.join(POSTS_DIR, file), 'utf8')
      const { data, content } = matter(raw)
      const slug = data.slug || file.replace(/\.md$/, '')
      return {
        slug,
        title:   data.title   || 'Untitled',
        date:    data.date    ? new Date(data.date) : new Date(),
        excerpt: data.excerpt || '',
        tags:    Array.isArray(data.tags) ? data.tags : (data.tags ? [data.tags] : []),
        author:  data.author  || 'Fynaptix',
        content,
        html:    marked(content),
      }
    })
    .sort((a, b) => b.date - a.date)
}

// ── Build index page ──────────────────────────────────────────────────────────

function buildIndex(posts) {
  const allTags = [...new Set(posts.flatMap(p => p.tags))].slice(0, 12)

  const mainContent = posts.length === 0
    ? `<div class="blog-empty"><div class="ei">✍️</div><h3>First post coming soon</h3><p>Enterprise AI insights, Claude deployment guides, and practical frameworks — launching shortly.</p></div>`
    : (() => {
        const [featured, ...rest] = posts
        const featuredHtml = `
          <a class="blog-featured reveal" href="/blog/${featured.slug}.html">
            <div class="featured-label">⭐ Featured</div>
            <div class="post-meta-row">
              <span class="pmeta-date">${fmtDate(featured.date)}</span>
              ${tagHtml(featured.tags)}
            </div>
            <h2>${featured.title}</h2>
            ${featured.excerpt ? `<p>${featured.excerpt}</p>` : ''}
            <div class="read-arrow">Read article <span>→</span></div>
          </a>`

        const restHtml = rest.length === 0 ? '' : `
          <div class="post-card-row">
            ${rest.map(p => `
              <a class="post-card-item reveal" href="/blog/${p.slug}.html">
                <div class="pci-left">
                  <div class="post-meta-row">${tagHtml(p.tags)}</div>
                  <h3>${p.title}</h3>
                  ${p.excerpt ? `<p>${p.excerpt}</p>` : ''}
                </div>
                <div class="pci-right">
                  <div class="pci-date">${fmtShort(p.date)}</div>
                </div>
              </a>`).join('\n')}
          </div>`

        return featuredHtml + restHtml
      })()

  const sidebar = `
    <div class="blog-sidebar">
      <div class="sidebar-card">
        <h4>Ready to deploy Claude?</h4>
        <a class="sidebar-cta-btn" href="/assessment.html">Free Readiness Assessment</a>
        <a class="sidebar-cta-ghost" href="/#contact">Talk to Us</a>
      </div>
      ${allTags.length ? `
      <div class="sidebar-card">
        <h4>Topics</h4>
        <div class="tag-list">${allTags.map(t => `<a href="#" class="tag">${t}</a>`).join('')}</div>
      </div>` : ''}
      <div class="sidebar-card">
        <h4>What We Build</h4>
        <ul style="list-style:none;display:flex;flex-direction:column;gap:10px">
          <li><a href="/#services" style="font-size:13px;color:var(--muted);text-decoration:none;transition:color .2s" onmouseover="this.style.color='var(--text)'" onmouseout="this.style.color='var(--muted)'">Claude AI Architecture</a></li>
          <li><a href="/#services" style="font-size:13px;color:var(--muted);text-decoration:none;transition:color .2s" onmouseover="this.style.color='var(--text)'" onmouseout="this.style.color='var(--muted)'">CoWork Deployment</a></li>
          <li><a href="/#services" style="font-size:13px;color:var(--muted);text-decoration:none;transition:color .2s" onmouseover="this.style.color='var(--text)'" onmouseout="this.style.color='var(--muted)'">AI Governance Frameworks</a></li>
          <li><a href="/#services" style="font-size:13px;color:var(--muted);text-decoration:none;transition:color .2s" onmouseover="this.style.color='var(--text)'" onmouseout="this.style.color='var(--muted)'">MCP Integration</a></li>
        </ul>
      </div>
    </div>`

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
${HEAD_COMMON('Blog · Fynaptix — Enterprise Claude AI Insights', 'Practical enterprise AI guides, Claude deployment frameworks, and insights from Fynaptix practitioners.')}
${BLOG_CSS}
</head>
<body>
${NAV}

<div class="blog-hero">
  <div class="blog-hero-inner">
    <div class="hero-eyebrow"><div class="ey-dot"></div>Enterprise AI Insights</div>
    <h1 class="sh2" style="font-size:clamp(32px,4vw,56px);font-weight:800;letter-spacing:-.02em;margin-bottom:16px">
      The <span class="gt">Fynaptix</span> Blog
    </h1>
    <p class="slead" style="margin:0 auto;text-align:center">
      Practical guides, deployment frameworks, and enterprise AI insights from practitioners in the field.
    </p>
  </div>
</div>

<div class="blog-grid">
  <div class="blog-main">${mainContent}</div>
  ${sidebar}
</div>

${FOOTER}
${NAV_JS}
</body>
</html>`

  fs.writeFileSync(path.join(BLOG_DIR, 'index.html'), html, 'utf8')
  console.log(`✓ blog/index.html — ${posts.length} post(s)`)
}

// ── Build individual post pages ───────────────────────────────────────────────

function buildPost(post, allPosts) {
  // Related posts: other posts sharing a tag, up to 2
  const related = allPosts
    .filter(p => p.slug !== post.slug && p.tags.some(t => post.tags.includes(t)))
    .slice(0, 2)

  const relatedHtml = related.length === 0 ? '' : `
    <div style="border-top:1px solid var(--border);margin-top:0;padding-top:60px;padding-bottom:60px;max-width:760px;margin-left:auto;margin-right:auto;padding-left:48px;padding-right:48px">
      <p class="se">More Articles</p>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:20px">
        ${related.map(p => `
          <a href="/blog/${p.slug}.html" class="sc2" style="text-decoration:none">
            <div class="post-meta-row">${tagHtml(p.tags)}</div>
            <h3 style="font-family:var(--fd);font-size:16px;font-weight:700;margin:10px 0 8px;line-height:1.3">${p.title}</h3>
            ${p.excerpt ? `<p style="font-size:13px;color:rgba(232,237,248,.55);line-height:1.65">${p.excerpt}</p>` : ''}
            <div class="read-arrow" style="margin-top:12px">Read →</div>
          </a>`).join('')}
      </div>
    </div>`

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
${HEAD_COMMON(`${post.title} · Fynaptix Blog`, post.excerpt || post.title)}
<meta property="og:title" content="${post.title}"/>
<meta property="og:description" content="${post.excerpt}"/>
<meta property="og:type" content="article"/>
<meta property="article:published_time" content="${post.date.toISOString()}"/>
<meta property="article:author" content="${post.author}"/>
${BLOG_CSS}
</head>
<body>
${NAV}

<div class="post-hero">
  <div class="post-hero-inner">
    <a class="back-link" href="/blog">← Back to Blog</a>
    <div class="post-meta-row" style="justify-content:center;margin-bottom:20px">
      <span class="pmeta-date">${fmtDate(post.date)}</span>
      <span style="color:var(--muted);font-size:11px">by ${post.author}</span>
      ${tagHtml(post.tags)}
    </div>
    <h1>${post.title}</h1>
    ${post.excerpt ? `<p class="post-hero-excerpt">${post.excerpt}</p>` : ''}
  </div>
</div>

<div class="post-body-wrap">
  <div class="post-body">
    ${post.html}
  </div>

  <div class="post-cta">
    <div class="post-cta-inner">
      <p class="se">Work With Fynaptix</p>
      <h3>Ready to build your Claude AI layer?</h3>
      <p>Take our free readiness assessment and get a personalised roadmap — or talk directly to our team.</p>
      <div class="cta2">
        <a class="btn-primary" href="/assessment.html">Free Readiness Assessment</a>
        <a class="btn-ghost" href="/#contact">Talk to Us</a>
      </div>
    </div>
  </div>
</div>

${relatedHtml}

${FOOTER}
${NAV_JS}
</body>
</html>`

  fs.writeFileSync(path.join(BLOG_DIR, `${post.slug}.html`), html, 'utf8')
  console.log(`✓ blog/${post.slug}.html`)
}

// ── Run ───────────────────────────────────────────────────────────────────────
console.log('Building Fynaptix blog...')
const posts = readPosts()
buildIndex(posts)
posts.forEach(p => buildPost(p, posts))
console.log(`\nDone — ${posts.length} post(s) built.`)
