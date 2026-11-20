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


// ── Hero backdrop — logarithmic spiral, ×3 per whorl like the nautilus shell ──
(function () {
  const path = document.getElementById('lp-spiral-path');
  if (!path) return;
  const cx = 380, cy = 350, r0 = 15, b = Math.log(3) / (2 * Math.PI), end = 6 * Math.PI;
  let d = '', th = 0;
  while (th <= end) {
    const r = r0 * Math.exp(b * th);
    d += (d ? 'L' : 'M') + (cx + r * Math.cos(th)).toFixed(1) + ' ' + (cy + r * Math.sin(th)).toFixed(1);
    th += Math.min(0.12, 4 / r);
  }
  path.setAttribute('d', d);
})();

// ── Hero 3D — translucent chambered nautilus swimming a slow loop ──
// Built entirely from code (Three.js r128, no image or model files). Safeguards: skips without
// WebGL, draws a single still frame under prefers-reduced-motion, pauses when off-screen or the
// tab is hidden, caps pixel ratio at 2 and uses a lighter shell texture on small screens.
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

    function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
    const rand = rng(1119);

    // ---- studio lighting and a generated reflection environment ----
    scene.add(new THREE.HemisphereLight(0xffffff, 0xd9dce4, 0.6));
    const key = new THREE.DirectionalLight(0xfff3e6, 1.5); key.position.set(5, 7, 6); scene.add(key);
    const rimL = new THREE.DirectionalLight(0xdbe6ff, 0.55); rimL.position.set(-6, 3, -5); scene.add(rimL);
    (function () {
      const env = new THREE.Scene();
      env.add(new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), new THREE.MeshBasicMaterial({ color: 0xdfe3ea, side: THREE.BackSide })));
      const softbox = function (w, h, pos, v) {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(v, v, v), side: THREE.DoubleSide }));
        m.position.set(pos[0], pos[1], pos[2]); m.lookAt(0, 0, 0); env.add(m);
      };
      softbox(6, 4, [5, 6, 4], 7); softbox(4, 6, [-6, 2, 3], 3); softbox(8, 2, [0, 8, -2], 4);
      const pm = new THREE.PMREMGenerator(renderer);
      scene.environment = pm.fromScene(env, 0.04).texture;
      pm.dispose();
    })();

    // ---- shell: logarithmic spiral with tiger stripes and ink hairlines ----
    const GROW = Math.log(3) / (2 * Math.PI);
    const TURNS = 2, TH1 = 1.5 * Math.PI, TH0 = TH1 - TURNS * 2 * Math.PI;
    const C1 = 1.0, RR = 0.58, RZ = 0.80;
    function shellPt(th, ph, out) {
      const c = C1 * Math.exp(GROW * (th - TH1));
      const k = Math.sqrt(Math.max(0, Math.min(1, (th - TH0) / 1.0)));
      const rr = RR * c * k, rz = RZ * c * k;
      const cp = Math.cos(ph), sp = Math.sin(ph);
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
        const cc = C1 * Math.exp(GROW * (th - TH1));
        const ox = a[0] - Math.cos(th) * cc, oy = a[1] - Math.sin(th) * cc, oz = a[2];
        if (nx * ox + ny * oy + nz * oz < 0) { nx = -nx; ny = -ny; nz = -nz; }
        nor.push(nx, ny, nz); uv.push(i / TS, j / PS);
      }
      for (let i = 0; i < TS; i++) for (let j = 0; j < PS; j++) {
        const p = i * (PS + 1) + j, q = p + PS + 1;
        idx.push(p, q, p + 1, p + 1, q, q + 1);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      g.setIndex(idx);
      return g;
    }
    function shellTexture() {
      const W = small ? 1024 : 2048, H = small ? 256 : 512, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
      const ctx = cv.getContext('2d'), img = ctx.createImageData(W, H), px = img.data, K = 26;
      const sm = function (a, b, x) { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
      for (let y = 0; y < H; y++) {
        const ph = (1 - y / H) * Math.PI * 2, dist = Math.min(ph, Math.PI * 2 - ph);
        for (let x = 0; x < W; x++) {
          const th = x / W * TURNS * 2 * Math.PI;
          const wob = 0.45 * Math.sin(dist * 2.6 + th * 0.9) + 0.25 * Math.sin(dist * 6.1 - th * 0.5);
          const st = Math.sin(K * th + wob * 2.4 + dist * 1.3);
          let stripe = sm(-0.1, 0.55, st) * (1 - sm(1.5, 2.4, dist));
          stripe *= 0.55 + 0.45 * sm(0.0, 0.5, dist);
          const n = (Math.random() - 0.5) * 7, pearl = sm(2.3, 3.0, dist);
          let r = 246, g = 238, b = 222;
          r = r + (158 - r) * stripe * 0.97; g = g + (62 - g) * stripe * 0.97; b = b + (24 - b) * stripe * 0.97;
          r = r + (255 - r) * pearl * 0.6; g = g + (252 - g) * pearl * 0.6; b = b + (246 - b) * pearl * 0.6;
          const fl = Math.abs(dist / (Math.PI / 9) - Math.round(dist / (Math.PI / 9)));
          const x2 = th * K / Math.PI, fg = Math.abs(x2 - Math.round(x2));
          const ln = Math.max(1 - sm(0, 0.04, fl), 1 - sm(0, 0.03, fg)) * 0.24;
          r += (24 - r) * ln; g += (26 - g) * ln; b += (34 - b) * ln;
          const o = (y * W + x) * 4;
          px[o] = r + n; px[o + 1] = g + n; px[o + 2] = b + n; px[o + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
      const t = new THREE.CanvasTexture(cv);
      t.encoding = THREE.sRGBEncoding; t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      return t;
    }
    const nautilus = new THREE.Group();
    const shellGeo = buildShell();
    const shellOut = new THREE.Mesh(shellGeo, new THREE.MeshPhysicalMaterial({
      map: shellTexture(), roughness: 0.32, metalness: 0, clearcoat: 0.7, clearcoatRoughness: 0.18, envMapIntensity: 0.9,
      side: THREE.FrontSide, transparent: true, opacity: 0.58, depthWrite: false
    }));
    const shellIn = new THREE.Mesh(shellGeo, new THREE.MeshStandardMaterial({
      color: 0xf6efe4, roughness: 0.22, envMapIntensity: 1.0, side: THREE.BackSide, transparent: true, opacity: 0.45, depthWrite: false
    }));
    shellIn.renderOrder = 2; shellOut.renderOrder = 3;
    nautilus.add(shellOut, shellIn);

    (function () {
      const pts = [];
      for (let i = 0; i < 48; i++) { const o = [0, 0, 0]; shellPt(TH1, i / 48 * Math.PI * 2, o); pts.push(new THREE.Vector3(o[0], o[1], o[2])); }
      nautilus.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 96, 0.028, 8, true),
        new THREE.MeshStandardMaterial({ color: 0xf8f1e6, roughness: 0.3, envMapIntensity: 0.9 })));
    })();

    // ---- body, eyes, funnel ----
    const body = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 28), new THREE.MeshStandardMaterial({ color: 0xf0d3c2, roughness: 0.5, envMapIntensity: 0.6, transparent: true, opacity: 0.55, depthWrite: false }));
    body.scale.set(0.62, 0.5, 0.72); body.position.set(0.12, -1.0, 0); body.renderOrder = 1;
    nautilus.add(body);
    [-1, 1].forEach(function (s) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.13, 20, 14), new THREE.MeshStandardMaterial({ color: 0xd69870, roughness: 0.4 }));
      eye.scale.set(1, 1, 0.55); eye.position.set(0.32, -0.9, s * 0.67); eye.rotation.y = s * 0.2;
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.05, 14, 10), new THREE.MeshBasicMaterial({ color: 0x1a0d08 }));
      pupil.position.set(0.0, 0, s * 0.07); eye.add(pupil); nautilus.add(eye);
    });
    const funnel = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.18, 0.55, 20, 1, true), new THREE.MeshStandardMaterial({ color: 0xedcdb9, roughness: 0.5, side: THREE.DoubleSide, transparent: true, opacity: 0.6, depthWrite: false }));
    funnel.geometry.translate(0, 0.275, 0); funnel.rotation.z = -Math.PI / 2 - 0.2; funnel.position.set(0.28, -1.3, 0); funnel.renderOrder = 1;
    nautilus.add(funnel);

    // ---- tentacles ----
    const TN = small ? 44 : 64, TP = 22, TS_ = 5;
    const tent = [];
    for (let k = 0; k < TN; k++) {
      const a = 0.75 + rand() * (Math.PI * 2 - 1.5), r = 0.45 + rand() * 0.5;
      tent.push({ a: a, r: r, len: 0.85 + rand() * 0.75, ph: rand() * 6.283, rad: 0.04 + rand() * 0.018 });
    }
    const tPos = new Float32Array(TN * TP * TS_ * 3), tCol = new Float32Array(TN * TP * TS_ * 3), tIdx = [];
    for (let k = 0; k < TN; k++) {
      for (let i = 0; i < TP; i++) for (let j = 0; j < TS_; j++) {
        const s = i / (TP - 1), q = ((k * TP + i) * TS_ + j) * 3;
        tCol[q] = 0.62 + 0.16 * s; tCol[q + 1] = 0.20 + 0.26 * s; tCol[q + 2] = 0.12 + 0.28 * s;
      }
      for (let i = 0; i < TP - 1; i++) for (let j = 0; j < TS_; j++) {
        const a = (k * TP + i) * TS_ + j, b = (k * TP + i) * TS_ + (j + 1) % TS_, c = (k * TP + i + 1) * TS_ + j, d = (k * TP + i + 1) * TS_ + (j + 1) % TS_;
        tIdx.push(a, c, b, b, c, d);
      }
    }
    const tGeo = new THREE.BufferGeometry();
    tGeo.setAttribute('position', new THREE.BufferAttribute(tPos, 3).setUsage(THREE.DynamicDrawUsage));
    tGeo.setAttribute('color', new THREE.BufferAttribute(tCol, 3));
    tGeo.setIndex(tIdx);
    const tentacles = new THREE.Mesh(tGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, envMapIntensity: 0.5, side: THREE.DoubleSide, transparent: true, opacity: 0.72, depthWrite: false }));
    tentacles.renderOrder = 1; tentacles.frustumCulled = false; nautilus.add(tentacles);
    const P = [], Tn = new THREE.Vector3(), N1 = new THREE.Vector3(), N2 = new THREE.Vector3(), Zv = new THREE.Vector3(0, 0, 1), Yv = new THREE.Vector3(0, 1, 0);
    for (let i = 0; i < TP; i++) P.push(new THREE.Vector3());
    function updateTentacles(t, c) {
      const amp = 0.17 * (1 - 0.55 * c);
      for (let k = 0; k < TN; k++) {
        const o = tent[k];
        const bx = 0.38, by = -1.0 + 0.5 * o.r * Math.cos(o.a), bz = 0.68 * o.r * Math.sin(o.a);
        let dx = 1, dy = 0.5 * o.r * Math.cos(o.a) * 0.8 - 0.05, dz = 0.9 * o.r * Math.sin(o.a);
        const dl = Math.hypot(dx, dy, dz); dx /= dl; dy /= dl; dz /= dl;
        for (let i = 0; i < TP; i++) {
          const s = i / (TP - 1), w = Math.pow(s, 1.4);
          P[i].set(
            bx + dx * o.len * s * (1 + 0.08 * c),
            by + dy * o.len * s - 0.22 * s * s * (1 - 0.5 * c) + amp * w * Math.sin(t * 1.8 - s * 5.2 + o.ph),
            bz + dz * o.len * s + amp * w * Math.cos(t * 1.5 - s * 4.3 + o.ph * 1.3)
          );
        }
        for (let i = 0; i < TP; i++) {
          const a = P[Math.max(i - 1, 0)], b = P[Math.min(i + 1, TP - 1)];
          Tn.subVectors(b, a).normalize();
          N1.crossVectors(Tn, Math.abs(Tn.z) < 0.9 ? Zv : Yv).normalize(); N2.crossVectors(Tn, N1);
          const rad = o.rad * (1 - 0.85 * i / (TP - 1)) + 0.004;
          for (let j = 0; j < TS_; j++) {
            const ang = j / TS_ * Math.PI * 2, ca = Math.cos(ang) * rad, sa = Math.sin(ang) * rad, q = ((k * TP + i) * TS_ + j) * 3;
            tPos[q] = P[i].x + N1.x * ca + N2.x * sa; tPos[q + 1] = P[i].y + N1.y * ca + N2.y * sa; tPos[q + 2] = P[i].z + N1.z * ca + N2.z * sa;
          }
        }
      }
      tGeo.attributes.position.needsUpdate = true; tGeo.computeVertexNormals();
    }

    nautilus.scale.setScalar(0.98);
    nautilus.position.set(-0.25 * 0.98, 0.55 * 0.98, 0);
    const swimmer = new THREE.Group(); swimmer.add(nautilus); world.add(swimmer);

    // ---- drifting specks for depth ----
    const PN = small ? 80 : 130, pPos = new Float32Array(PN * 3), pCol = new Float32Array(PN * 3), pSeed = [];
    const cgrey = new THREE.Color(0xb7bfcc), cor = new THREE.Color(0xff5a1f);
    for (let i = 0; i < PN; i++) {
      pPos[i * 3] = (rand() - 0.5) * 16; pPos[i * 3 + 1] = (rand() - 0.5) * 8; pPos[i * 3 + 2] = (rand() - 0.5) * 12;
      const c = rand() < 0.07 ? cor : cgrey; pCol[i * 3] = c.r; pCol[i * 3 + 1] = c.g; pCol[i * 3 + 2] = c.b; pSeed.push(rand());
    }
    const dotC = document.createElement('canvas'); dotC.width = dotC.height = 32;
    const dctx = dotC.getContext('2d'), dg = dctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    dg.addColorStop(0, 'rgba(255,255,255,1)'); dg.addColorStop(1, 'rgba(255,255,255,0)'); dctx.fillStyle = dg; dctx.fillRect(0, 0, 32, 32);
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3).setUsage(THREE.DynamicDrawUsage));
    pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
    const parts = new THREE.Points(pGeo, new THREE.PointsMaterial({ size: 0.12, map: new THREE.CanvasTexture(dotC), vertexColors: true, transparent: true, opacity: 0.8, depthWrite: false, sizeAttenuation: true }));
    parts.frustumCulled = false; world.add(parts);

    // ---- motion: jet pulses drive speed, a lazy 3D loop drives position ----
    const PERIOD = 3.4;
    function contraction(t) {
      const p = (((t / PERIOD) % 1) + 1) % 1;
      if (p < 0.22) return Math.sin(p / 0.22 * Math.PI / 2);
      return Math.pow(Math.cos((p - 0.22) / 0.78 * Math.PI / 2), 1.8);
    }
    let pathScale = 1;
    function pathAt(s, out) { out.set(1.7 * pathScale * Math.cos(s), 0.5 * Math.sin(1.7 * s + 0.6), 1.5 * pathScale * Math.sin(s)); return out; }
    const pa = new THREE.Vector3(), pb = new THREE.Vector3(), pc = new THREE.Vector3(), T0 = new THREE.Vector3(), T1 = new THREE.Vector3();
    const ex = new THREE.Vector3(), ey = new THREE.Vector3(), ez = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), zAxis = new THREE.Vector3(0, 0, 1);
    const mBasis = new THREE.Matrix4(), qBase = new THREE.Quaternion(), qRoll = new THREE.Quaternion(), qPitch = new THREE.Quaternion();
    let roll = 0;
    function placeSwimmer(s, c, dt) {
      pathAt(s, pa); pathAt(s + 0.02, pb); pathAt(s + 0.04, pc);
      T0.subVectors(pb, pa).normalize(); T1.subVectors(pc, pb).normalize();
      const turn = T0.clone().cross(T1).y / 0.02;
      roll += (-0.18 * Math.max(-2, Math.min(2, turn)) - roll) * Math.min(1, dt * 2);
      ex.copy(T0).negate();
      ez.crossVectors(ex, up).normalize(); ey.crossVectors(ez, ex);
      mBasis.makeBasis(ex, ey, ez); qBase.setFromRotationMatrix(mBasis);
      qRoll.setFromAxisAngle(T0, roll);
      qPitch.setFromAxisAngle(zAxis, -0.07 * c);
      swimmer.quaternion.copy(qRoll).multiply(qBase).multiply(qPitch);
      swimmer.position.copy(pa);
    }

    // ---- sizing, mouse parallax, loop ----
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

    const mouse = { x: 0, y: 0 }, ease = { x: 0, y: 0 };
    function onMove(e) { mouse.x = (e.clientX / window.innerWidth - 0.5) * 2; mouse.y = (e.clientY / window.innerHeight - 0.5) * 2; }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('resize', resize);

    let t = reduceMotion ? 1.0 : 0, s = 0.6 + t * 0.2, prev = performance.now(), auto = 0, raf = 0, visible = true;
    function draw(dt) {
      if (!reduceMotion) { t += dt; auto += dt; }
      const c = contraction(t);
      if (!reduceMotion) s += (0.09 + 0.26 * c) * dt;
      placeSwimmer(s, c, dt);
      updateTentacles(t, c);
      funnel.scale.set(1 + 0.2 * c, 1 - 0.3 * c, 1 - 0.3 * c);
      body.scale.y = 0.5 * (1 - 0.06 * c);
      if (!reduceMotion) {
        for (let i = 0; i < PN; i++) {
          pPos[i * 3 + 1] += (0.05 + 0.1 * pSeed[i]) * dt;
          pPos[i * 3] += Math.sin(t * 0.3 + pSeed[i] * 20) * 0.1 * dt;
          if (pPos[i * 3 + 1] > 4) pPos[i * 3 + 1] = -4;
        }
        pGeo.attributes.position.needsUpdate = true;
      }
      ease.x += (mouse.x - ease.x) * Math.min(1, dt * 2); ease.y += (mouse.y - ease.y) * Math.min(1, dt * 2);
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
