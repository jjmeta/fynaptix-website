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


// ── Hero 3D — translucent chambered nautilus swimming a slow loop ──
// Built entirely from code (Three.js r128, no image or model files). Safeguards: skips without
// WebGL, draws a single still frame under prefers-reduced-motion, pauses when off-screen or the
// tab is hidden, caps pixel ratio at 2 and uses lighter geometry and textures on small screens.
(function () {
  const canvas = document.getElementById('lp-hero-canvas');
  if (!canvas) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let supportsWebGL = false;
  try {
    const test = document.createElement('canvas');
    supportsWebGL = !!(window.WebGLRenderingContext &&
      (test.getContext('webgl') || test.getContext('experimental-webgl')));
  } catch (e) { supportsWebGL = false; }
  if (!supportsWebGL) return;

  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js';
  script.onload = boot;
  document.head.appendChild(script);

  let dead = false;

  function boot() {
    const THREE = window.THREE;
    if (!THREE || dead) return;

    let renderer;
    try { renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true }); } catch (e) { return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.92;

    const small = window.innerWidth < 900;
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xffffff, 17, 42);
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 80);
    const world = new THREE.Group(); scene.add(world);
    const V3 = THREE.Vector3;
    function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
    const rand = rng(1119);
    const sm = function (a, b, x) { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
    const lerp = function (a, b, t) { return a + (b - a) * t; };

  // ---- studio lighting and a generated reflection environment ----
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd9dce4, 0.6));
  const key = new THREE.DirectionalLight(0xfff3e6, 1.5); key.position.set(5, 7, 6); scene.add(key);
  const rimL = new THREE.DirectionalLight(0xdbe6ff, 0.55); rimL.position.set(-6, 3, -5); scene.add(rimL);
  (function () {
    const env = new THREE.Scene();
    env.add(new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), new THREE.MeshBasicMaterial({ color: 0xdfe3ea, side: THREE.BackSide })));
    const softbox = function (w, h, pos, v) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(v, v, v), side: THREE.DoubleSide })); m.position.set(pos[0], pos[1], pos[2]); m.lookAt(0, 0, 0); env.add(m); };
    softbox(6, 4, [5, 6, 4], 7); softbox(4, 6, [-6, 2, 3], 3); softbox(8, 2, [0, 8, -2], 4);
    const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(env, 0.04).texture; pm.dispose();
  })();

  // ---- shell: logarithmic spiral with tiger stripes, fine secondary stripes and ink hairlines ----
  const GROW = Math.log(3) / (2 * Math.PI);
  const TURNS = 2, TH1 = 1.5 * Math.PI, TH0 = TH1 - TURNS * 2 * Math.PI;
  const C1 = 1.0, RR = 0.58, RZ = 0.80;
  function shellPt(th, ph, out) {
    const c = C1 * Math.exp(GROW * (th - TH1));
    const k = Math.sqrt(Math.max(0, Math.min(1, (th - TH0) / 1.0)));
    const rr = RR * c * k, rz = RZ * c * k, cp = Math.cos(ph), sp = Math.sin(ph);
    out[0] = Math.cos(th) * (c + rr * cp); out[1] = Math.sin(th) * (c + rr * cp); out[2] = rz * sp;
  }
  function buildShell() {
    const TS = small ? 280 : 420, PS = small ? 48 : 72, pos = [], nor = [], uv = [], idx = [];
    const a = [0, 0, 0], b = [0, 0, 0], d = [0, 0, 0], SPAN = TH1 - TH0;
    for (let i = 0; i <= TS; i++) for (let j = 0; j <= PS; j++) {
      const th = TH0 + SPAN * i / TS, ph = j / PS * Math.PI * 2;
      shellPt(th, ph, a); pos.push(a[0], a[1], a[2]);
      shellPt(th + 1e-3, ph, b); shellPt(th, ph + 1e-3, d);
      const tx = b[0] - a[0], ty = b[1] - a[1], tz = b[2] - a[2], px = d[0] - a[0], py = d[1] - a[1], pz = d[2] - a[2];
      let nx = ty * pz - tz * py, ny = tz * px - tx * pz, nz = tx * py - ty * px;
      const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
      const cc = C1 * Math.exp(GROW * (th - TH1)), ox = a[0] - Math.cos(th) * cc, oy = a[1] - Math.sin(th) * cc, oz = a[2];
      if (nx * ox + ny * oy + nz * oz < 0) { nx = -nx; ny = -ny; nz = -nz; }
      nor.push(nx, ny, nz); uv.push(i / TS, j / PS);
    }
    for (let i = 0; i < TS; i++) for (let j = 0; j < PS; j++) { const p = i * (PS + 1) + j, q = p + PS + 1; idx.push(p, q, p + 1, p + 1, q, q + 1); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
    return g;
  }
  function shellTexture() {
    const W = small ? 1024 : 2048, H = small ? 256 : 512, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d'), img = ctx.createImageData(W, H), px = img.data, K = 26;
    for (let y = 0; y < H; y++) {
      const ph = (1 - y / H) * Math.PI * 2, dist = Math.min(ph, Math.PI * 2 - ph);
      for (let x = 0; x < W; x++) {
        const th = x / W * TURNS * 2 * Math.PI;
        const wob = 0.45 * Math.sin(dist * 2.6 + th * 0.9) + 0.25 * Math.sin(dist * 6.1 - th * 0.5);
        const st = Math.sin(K * th + wob * 2.4 + dist * 1.3);
        let stripe = sm(-0.1, 0.55, st) * (1 - sm(1.5, 2.4, dist)); stripe *= 0.55 + 0.45 * sm(0.0, 0.5, dist);
        const st2 = Math.sin(K * 2 * th + wob * 3.1 + dist * 2.2 + 1.7), fine = sm(0.55, 0.95, st2) * 0.32 * (1 - sm(1.3, 2.2, dist)) * (1 - stripe);
        const n = (Math.random() - 0.5) * 7, pearl = sm(2.1, 3.0, dist);
        let r = 246, g = 238, b = 222;
        const sA = Math.min(1, stripe * 0.97 + fine);
        r = r + (158 - r) * sA; g = g + (62 - g) * sA; b = b + (24 - b) * sA;
        r = r + (255 - r) * pearl * 0.6; g = g + (240 - g) * pearl * 0.6; b = b + (236 - b) * pearl * 0.6;       // pearly, slightly pink umbilicus
        const rib = 0.5 + 0.5 * Math.sin(th * 140 + dist * 3), ribA = 0.05 * rib * sm(0.3, 1, dist) * (1 - stripe);     // growth ribbing
        r -= ribA * 80; g -= ribA * 80; b -= ribA * 70;
        const fl = Math.abs(dist / (Math.PI / 9) - Math.round(dist / (Math.PI / 9))), x2 = th * K / Math.PI, fg = Math.abs(x2 - Math.round(x2));
        const ln = Math.max(1 - sm(0, 0.04, fl), 1 - sm(0, 0.03, fg)) * 0.22;
        r += (24 - r) * ln; g += (26 - g) * ln; b += (34 - b) * ln;
        const o = (y * W + x) * 4; px[o] = r + n; px[o + 1] = g + n; px[o + 2] = b + n; px[o + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()); return t;
  }
  const nautilus = new THREE.Group();
  const shellGeo = buildShell();
  const shellOut = new THREE.Mesh(shellGeo, new THREE.MeshPhysicalMaterial({ map: shellTexture(), roughness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.15, envMapIntensity: 0.95, sheen: new THREE.Color(0xffd0bc), side: THREE.FrontSide, transparent: true, opacity: 0.58, depthWrite: false }));
  const shellIn = new THREE.Mesh(shellGeo, new THREE.MeshStandardMaterial({ color: 0xf6efe4, roughness: 0.22, envMapIntensity: 1.0, side: THREE.BackSide, transparent: true, opacity: 0.45, depthWrite: false }));
  shellIn.renderOrder = 2; shellOut.renderOrder = 3; nautilus.add(shellOut, shellIn);

  (function () {                                                       // pearly aperture lip
    const p = []; for (let i = 0; i < 48; i++) { const o = [0, 0, 0]; shellPt(TH1, i / 48 * Math.PI * 2, o); p.push(new V3(o[0], o[1], o[2])); }
    nautilus.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(p, true), 96, 0.03, 8, true), new THREE.MeshPhysicalMaterial({ color: 0xfbf1e8, roughness: 0.2, clearcoat: 1, sheen: new THREE.Color(0xffc9b0), envMapIntensity: 1 })));
  })();

  // ---- the chambers: curved septa and the siphuncle thread, seen through the translucent shell ----
  (function () {
    const th0 = TH0 + 2 * Math.PI * 0.78, th1 = TH1 - 0.8, STEP = 0.4, RINGS = 4, SEG = 28, pos = [], idx = [], lp = [];
    for (let th = th0; th <= th1; th += STEP) {
      const c = C1 * Math.exp(GROW * (th - TH1)), rr = RR * c * 0.95, rz = RZ * c * 0.95, ct = Math.cos(th), st = Math.sin(th), base = pos.length / 3;
      pos.push(st * 0.14 * c + ct * c, -ct * 0.14 * c + st * c, 0);
      for (let r = 1; r <= RINGS; r++) {
        const rad = r / RINGS, dome = 0.14 * c * (1 - rad * rad);
        for (let s = 0; s < SEG; s++) { const an = s / SEG * Math.PI * 2, radial = c + rr * Math.cos(an) * rad; pos.push(ct * radial + st * dome, st * radial - ct * dome, rz * Math.sin(an) * rad); }
      }
      for (let s = 0; s < SEG; s++) idx.push(base, base + 1 + s, base + 1 + (s + 1) % SEG);
      for (let r = 2; r <= RINGS; r++) for (let s = 0; s < SEG; s++) { const a0 = base + 1 + (r - 2) * SEG + s, a1 = base + 1 + (r - 2) * SEG + (s + 1) % SEG, b0 = base + 1 + (r - 1) * SEG + s, b1 = base + 1 + (r - 1) * SEG + (s + 1) % SEG; idx.push(a0, b0, a1, a1, b0, b1); }
      for (let s = 0; s < SEG; s++) { const i0 = base + 1 + (RINGS - 1) * SEG + s, i1 = base + 1 + (RINGS - 1) * SEG + (s + 1) % SEG; lp.push(pos[i0 * 3], pos[i0 * 3 + 1], pos[i0 * 3 + 2], pos[i1 * 3], pos[i1 * 3 + 1], pos[i1 * 3 + 2]); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
    const septa = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0xeac9b2, transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide })); septa.renderOrder = 2.5; nautilus.add(septa);
    const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3));
    const lines = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0xc98a68, transparent: true, opacity: 0.85, depthWrite: false })); lines.renderOrder = 2.6; nautilus.add(lines);
    // siphuncle: a thin orange thread through the middle of the chambers
    const P = [], N = 90; for (let i = 0; i <= N; i++) { const th = lerp(th0 - 0.4, th1 + 0.2, i / N), c = C1 * Math.exp(GROW * (th - TH1)); P.push(new V3(Math.cos(th) * c, Math.sin(th) * c, 0)); }
    const pp = [], pi = [], SS = 8, A = new V3(), B = new V3(), T = new V3(), Z = new V3(0, 0, 1);
    for (let i = 0; i <= N; i++) { T.subVectors(P[Math.min(i + 1, N)], P[Math.max(i - 1, 0)]).normalize(); A.crossVectors(T, Z).normalize(); B.crossVectors(T, A); const r = 0.04 * Math.exp(GROW * (lerp(th0 - 0.4, th1 + 0.2, i / N) - TH1)) / 0.4 + 0.008; for (let j = 0; j < SS; j++) { const an = j / SS * Math.PI * 2, ca = Math.cos(an) * r, sa = Math.sin(an) * r; pp.push(P[i].x + A.x * ca + B.x * sa, P[i].y + A.y * ca + B.y * sa, P[i].z + A.z * ca + B.z * sa); } }
    for (let i = 0; i < N; i++) for (let j = 0; j < SS; j++) { const a = i * SS + j, b = i * SS + (j + 1) % SS, c = (i + 1) * SS + j, d = (i + 1) * SS + (j + 1) % SS; pi.push(a, c, b, b, c, d); }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(pp, 3)); sg.setIndex(pi); sg.computeVertexNormals();
    const sip = new THREE.Mesh(sg, new THREE.MeshStandardMaterial({ color: 0xf07a4d, roughness: 0.4, transparent: true, opacity: 0.95, depthWrite: false })); sip.renderOrder = 2.7; nautilus.add(sip);
  })();

  // ---- body, eyes, funnel ----
  const bt = document.createElement('canvas'); bt.width = 512; bt.height = 256; const bx = bt.getContext('2d'), bgr = bx.createLinearGradient(0, 0, 0, 256); bgr.addColorStop(0, '#f6d9c8'); bgr.addColorStop(1, '#fbeee4'); bx.fillStyle = bgr; bx.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 260; i++) { bx.fillStyle = rand() < 0.5 ? 'rgba(240,122,77,' + (0.12 + rand() * 0.3).toFixed(2) + ')' : 'rgba(190,110,90,0.1)'; bx.beginPath(); bx.arc(rand() * 512, rand() * 256, 2 + rand() * 8, 0, 6.28); bx.fill(); }
  const bodyTex = new THREE.CanvasTexture(bt); bodyTex.encoding = THREE.sRGBEncoding;
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 28), new THREE.MeshPhysicalMaterial({ map: bodyTex, roughness: 0.45, clearcoat: 0.4, envMapIntensity: 0.7, transparent: true, opacity: 0.68, depthWrite: false }));
  body.scale.set(0.62, 0.5, 0.72); body.position.set(0.12, -1.0, 0); body.renderOrder = 1; nautilus.add(body);
  const eyes = [-1, 1].map(function (sg) {
    const g = new THREE.Group(); g.position.set(0.34, -0.88, sg * 0.67); g.rotation.y = sg * 0.2;
    const sock = new THREE.Mesh(new THREE.SphereGeometry(0.14, 22, 16), new THREE.MeshStandardMaterial({ color: 0xd69a68, roughness: 0.35, envMapIntensity: 0.8 })); sock.scale.set(1, 1, 0.55); g.add(sock);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.014, 8, 24), new THREE.MeshStandardMaterial({ color: 0xa86a3c, roughness: 0.4 })); ring.position.z = sg * 0.075; g.add(ring);
    const hole = new THREE.Mesh(new THREE.CircleGeometry(0.06, 16), new THREE.MeshBasicMaterial({ color: 0x140b08 })); hole.position.z = sg * 0.082; if (sg < 0) hole.rotation.y = Math.PI; g.add(hole);
    const hl = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff })); hl.position.set(0.025, 0.025, sg * 0.085); g.add(hl);
    nautilus.add(g); return g;
  });
  const funnel = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.18, 0.55, 20, 1, true), new THREE.MeshStandardMaterial({ color: 0xedcdb9, roughness: 0.5, side: THREE.DoubleSide, transparent: true, opacity: 0.65, depthWrite: false }));
  funnel.geometry.translate(0, 0.275, 0); funnel.rotation.z = -Math.PI / 2 - 0.2; funnel.position.set(0.28, -1.3, 0); funnel.renderOrder = 1; nautilus.add(funnel);

  // ---- tentacles: ridged cirri that curl and probe ----
  const TN = small ? 56 : 92, TP = 26, TS_ = 6, tent = [];
  for (let k = 0; k < TN; k++) {
    const inner = k % 3 === 0, a = 0.75 + rand() * (Math.PI * 2 - 1.5), r = inner ? 0.25 + rand() * 0.3 : 0.5 + rand() * 0.5;
    tent.push({ a: a, r: r, len: inner ? 0.5 + rand() * 0.5 : 0.9 + rand() * 0.85, ph: rand() * 6.283, rad: inner ? 0.03 + rand() * 0.012 : 0.04 + rand() * 0.018, curl: 0.6 + rand() * 1.0 });
  }
  const tPos = new Float32Array(TN * TP * TS_ * 3), tCol = new Float32Array(TN * TP * TS_ * 3), tIdx = [];
  for (let k = 0; k < TN; k++) {
    for (let i = 0; i < TP; i++) for (let j = 0; j < TS_; j++) { const s = i / (TP - 1), q = ((k * TP + i) * TS_ + j) * 3, band = Math.floor(i / 1.5) % 2 ? 0.07 : 0; tCol[q] = 0.62 + 0.16 * s - band; tCol[q + 1] = 0.20 + 0.26 * s - band * 0.9; tCol[q + 2] = 0.12 + 0.28 * s - band * 0.6; }
    for (let i = 0; i < TP - 1; i++) for (let j = 0; j < TS_; j++) { const a = (k * TP + i) * TS_ + j, b = (k * TP + i) * TS_ + (j + 1) % TS_, c = (k * TP + i + 1) * TS_ + j, d = (k * TP + i + 1) * TS_ + (j + 1) % TS_; tIdx.push(a, c, b, b, c, d); }
  }
  const tGeo = new THREE.BufferGeometry();
  tGeo.setAttribute('position', new THREE.BufferAttribute(tPos, 3).setUsage(THREE.DynamicDrawUsage)); tGeo.setAttribute('color', new THREE.BufferAttribute(tCol, 3)); tGeo.setIndex(tIdx);
  const tentacles = new THREE.Mesh(tGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, envMapIntensity: 0.55, side: THREE.DoubleSide, transparent: true, opacity: 0.74, depthWrite: false }));
  tentacles.renderOrder = 1; tentacles.frustumCulled = false; nautilus.add(tentacles);
  const P = [], Tn = new V3(), N1 = new V3(), N2 = new V3(), Zv = new V3(0, 0, 1), Yv = new V3(0, 1, 0);
  for (let i = 0; i < TP; i++) P.push(new V3());
  function updateTentacles(t, c, ptr) {
    const amp = 0.17 * (1 - 0.55 * c), bz = ptr.x * ptr.hover * 0.28, by = ptr.y * ptr.hover * 0.22;
    for (let k = 0; k < TN; k++) {
      const o = tent[k], baseX = 0.38, baseY = -1.0 + 0.5 * o.r * Math.cos(o.a), baseZ = 0.68 * o.r * Math.sin(o.a);
      let dx = 1, dy = 0.5 * o.r * Math.cos(o.a) * 0.8 - 0.05, dz = 0.9 * o.r * Math.sin(o.a);
      const dl = Math.hypot(dx, dy, dz); dx /= dl; dy /= dl; dz /= dl;
      for (let i = 0; i < TP; i++) {
        const s = i / (TP - 1), w = Math.pow(s, 1.4), cu = o.curl * Math.pow(s, 3) * (0.5 + 0.5 * Math.sin(t * 0.9 + o.ph)) * (1 - 0.7 * c);
        P[i].set(
          baseX + dx * o.len * s * (1 + 0.08 * c) - 0.18 * cu,
          baseY + dy * o.len * s - 0.22 * s * s * (1 - 0.5 * c) + amp * w * Math.sin(t * 1.8 - s * 5.2 + o.ph) + by * s * s + 0.3 * cu * Math.sin(o.ph),
          baseZ + dz * o.len * s + amp * w * Math.cos(t * 1.5 - s * 4.3 + o.ph * 1.3) + bz * s * s + 0.3 * cu * Math.cos(o.ph)
        );
      }
      for (let i = 0; i < TP; i++) {
        Tn.subVectors(P[Math.min(i + 1, TP - 1)], P[Math.max(i - 1, 0)]).normalize();
        N1.crossVectors(Tn, Math.abs(Tn.z) < 0.9 ? Zv : Yv).normalize(); N2.crossVectors(Tn, N1);
        const rad = o.rad * (1 - 0.85 * i / (TP - 1)) * (1 + 0.12 * Math.sin(i * 2.1)) + 0.004;     // slight ridges along each cirrus
        for (let j = 0; j < TS_; j++) { const an = j / TS_ * Math.PI * 2, ca = Math.cos(an) * rad, sa = Math.sin(an) * rad, q = ((k * TP + i) * TS_ + j) * 3; tPos[q] = P[i].x + N1.x * ca + N2.x * sa; tPos[q + 1] = P[i].y + N1.y * ca + N2.y * sa; tPos[q + 2] = P[i].z + N1.z * ca + N2.z * sa; }
      }
    }
    tGeo.attributes.position.needsUpdate = true; tGeo.computeVertexNormals();
  }

  nautilus.scale.setScalar(0.98); nautilus.position.set(-0.25 * 0.98, 0.55 * 0.98, 0); nautilus.updateMatrix();
  const swimmer = new THREE.Group(); swimmer.add(nautilus); world.add(swimmer);

  // ---- bubbles puffed from the funnel on each jet ----
  const BUB = 60, bubM = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 12, 8), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.04, transparent: true, opacity: 0.5, envMapIntensity: 1.3, depthWrite: false }), BUB);
  bubM.frustumCulled = false; bubM.renderOrder = 6; world.add(bubM);
  const bub = []; for (let i = 0; i < BUB; i++) bub.push({ p: new V3(), life: 9, max: 1, size: 0, ph: 0 });
  let bubN = 0; const dum = new THREE.Object3D(), zeroM = new THREE.Matrix4().makeScale(0, 0, 0), mAll = new THREE.Matrix4();
  function emitBubble(lp, size) { const b = bub[bubN++ % BUB]; mAll.multiplyMatrices(swimmer.matrix, nautilus.matrix); b.p.copy(lp).applyMatrix4(mAll); b.life = 0; b.max = 2.4 + rand() * 1.6; b.size = size * (0.6 + rand() * 0.8); b.ph = rand() * 6.28; }
  function stepBubbles(dt) {
    for (let i = 0; i < BUB; i++) { const b = bub[i];
      if (b.life < b.max) { b.life += dt; b.p.y += (0.4 + b.size * 2) * dt; b.p.x += Math.sin(b.life * 3 + b.ph) * 0.12 * dt; const f = b.life / b.max, s = b.size * (0.5 + 0.5 * Math.min(1, f * 4)) * (1 - Math.pow(f, 4)); dum.position.copy(b.p); dum.scale.setScalar(Math.max(s, 0.0001)); dum.quaternion.identity(); dum.updateMatrix(); bubM.setMatrixAt(i, dum.matrix); }
      else bubM.setMatrixAt(i, zeroM); }
    bubM.instanceMatrix.needsUpdate = true;
  }

  // ---- drifting specks for depth ----
  const PN = small ? 80 : 130, pPos = new Float32Array(PN * 3), pCol = new Float32Array(PN * 3), pSeed = [], cgrey = new THREE.Color(0xb7bfcc), cor = new THREE.Color(0xff5a1f);
  for (let i = 0; i < PN; i++) { pPos[i * 3] = (rand() - 0.5) * 16; pPos[i * 3 + 1] = (rand() - 0.5) * 8; pPos[i * 3 + 2] = (rand() - 0.5) * 12; const c = rand() < 0.07 ? cor : cgrey; pCol[i * 3] = c.r; pCol[i * 3 + 1] = c.g; pCol[i * 3 + 2] = c.b; pSeed.push(rand()); }
  const dotC = document.createElement('canvas'); dotC.width = dotC.height = 32; const dctx = dotC.getContext('2d'), dg = dctx.createRadialGradient(16, 16, 0, 16, 16, 16); dg.addColorStop(0, 'rgba(255,255,255,1)'); dg.addColorStop(1, 'rgba(255,255,255,0)'); dctx.fillStyle = dg; dctx.fillRect(0, 0, 32, 32);
  const pGeo = new THREE.BufferGeometry(); pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3).setUsage(THREE.DynamicDrawUsage)); pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
  const parts = new THREE.Points(pGeo, new THREE.PointsMaterial({ size: 0.12, map: new THREE.CanvasTexture(dotC), vertexColors: true, transparent: true, opacity: 0.8, depthWrite: false })); parts.frustumCulled = false; world.add(parts);

  // ---- motion: jet pulses drive speed, a lazy 3D loop drives position ----
  const PERIOD = 3.4;
  const contraction = function (t) { const p = (((t / PERIOD) % 1) + 1) % 1; return p < 0.22 ? Math.sin(p / 0.22 * Math.PI / 2) : Math.pow(Math.cos((p - 0.22) / 0.78 * Math.PI / 2), 1.8); };
  let pathScale = 1;
  const pathAt = function (s, out) { out.set(1.7 * pathScale * Math.cos(s), 0.5 * Math.sin(1.7 * s + 0.6), 1.5 * pathScale * Math.sin(s)); return out; };
  const pa = new V3(), pb = new V3(), pc = new V3(), T0 = new V3(), T1 = new V3(), ex = new V3(), ey = new V3(), ez = new V3(), up = new V3(0, 1, 0), zAxis = new V3(0, 0, 1);
  const mBasis = new THREE.Matrix4(), qBase = new THREE.Quaternion(), qRoll = new THREE.Quaternion(), qPitch = new THREE.Quaternion(); let roll = 0;
  function place(s, c, dt) {
    pathAt(s, pa); pathAt(s + 0.02, pb); pathAt(s + 0.04, pc);
    T0.subVectors(pb, pa).normalize(); T1.subVectors(pc, pb).normalize();
    const turn = T0.clone().cross(T1).y / 0.02; roll += (-0.18 * Math.max(-2, Math.min(2, turn)) - roll) * Math.min(1, dt * 2);
    ex.copy(T0).negate(); ez.crossVectors(ex, up).normalize(); ey.crossVectors(ez, ex);
    mBasis.makeBasis(ex, ey, ez); qBase.setFromRotationMatrix(mBasis); qRoll.setFromAxisAngle(T0, roll); qPitch.setFromAxisAngle(zAxis, -0.07 * c);
    swimmer.quaternion.copy(qRoll).multiply(qBase).multiply(qPitch); swimmer.position.copy(pa); swimmer.updateMatrix();
  }


    // ---- sizing, mouse tracking, loop ----
    let aspect = 1, compact = false;
    function layoutCamera() {
      const dist = compact ? 10 : Math.max(13, 10.5 / aspect);
      camera.position.set(dist * 0.42, dist * 0.27, dist * 0.86);
      camera.lookAt(0, -0.1, 0);
      camera.aspect = aspect; camera.updateProjectionMatrix();
    }
    function resize() {
      const w = canvas.clientWidth || 700, h = canvas.clientHeight || 700;
      renderer.setSize(w, h, false); aspect = w / h; compact = w < 560; pathScale = compact ? 0.55 : Math.min(1, aspect * 1.2); layoutCamera();
    }
    resize();

    const mouse = { x: 0, y: 0 }, ease = { x: 0, y: 0 }, ptr = { x: 0, y: 0, hover: 0.85 };
    function onMove(e) { mouse.x = (e.clientX / window.innerWidth - 0.5) * 2; mouse.y = (e.clientY / window.innerHeight - 0.5) * 2; }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('resize', resize);

    let t = reduceMotion ? 1.0 : 0, s = 0.6 + t * 0.2, prev = performance.now(), auto = 0, raf = 0, visible = true, prevC = 0;
    function draw(dt) {
      if (!reduceMotion) { t += dt; auto += dt; }
      const c = contraction(t);
      if (!reduceMotion) s += (0.09 + 0.26 * c) * dt;
      ease.x += (mouse.x - ease.x) * Math.min(1, dt * 2); ease.y += (mouse.y - ease.y) * Math.min(1, dt * 2);
      ptr.x = ease.x; ptr.y = -ease.y;
      place(s, c, dt); updateTentacles(t, c, ptr);
      funnel.scale.set(1 + 0.2 * c, 1 - 0.3 * c, 1 - 0.3 * c); body.scale.y = 0.5 * (1 - 0.06 * c);
      eyes.forEach(function (e) { e.rotation.x = -ptr.y * 0.3 * ptr.hover; });
      if (!reduceMotion) {
        if (c > 0.5 && prevC <= 0.5) for (let i = 0; i < 6; i++) emitBubble(new V3(0.78 + rand() * 0.2, -1.4 + rand() * 0.15, (rand() - 0.5) * 0.25), 0.05);
        stepBubbles(dt);
        for (let i = 0; i < PN; i++) {
          pPos[i * 3 + 1] += (0.05 + 0.1 * pSeed[i]) * dt;
          pPos[i * 3] += Math.sin(t * 0.3 + pSeed[i] * 20) * 0.1 * dt;
          if (pPos[i * 3 + 1] > 4) pPos[i * 3 + 1] = -4;
        }
        pGeo.attributes.position.needsUpdate = true;
      }
      prevC = c;
      world.rotation.y = 0.3 * Math.sin(auto * 0.09) + ease.x * 0.3;
      world.rotation.x = ease.y * 0.12;
      renderer.render(scene, camera);
    }
    function frame(now) {
      if (dead) return;
      const dt = Math.min((now - prev) / 1000, 0.05); prev = now;
      draw(dt);
      raf = visible && !document.hidden ? requestAnimationFrame(frame) : 0;
    }
    function start() { if (!raf && !dead && !reduceMotion) { prev = performance.now(); raf = requestAnimationFrame(frame); } }

    if (reduceMotion) { draw(0.016); return; }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; if (visible) start(); }).observe(canvas);
    }
    document.addEventListener('visibilitychange', function () { if (!document.hidden) start(); });
    start();

    window.addEventListener('beforeunload', function () {
      dead = true;
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('resize', resize);
    });
  }
})();
