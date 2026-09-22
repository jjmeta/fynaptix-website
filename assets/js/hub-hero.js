// Research hub hero — same wireframe torus-knot treatment as the landing page hero, smaller and quieter.
(function () {
  const canvas = document.getElementById('hub-hero-canvas');
  if (!canvas) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

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

  let renderer, scene, camera, group, raf;
  let dead = false;
  const mouse = { x: 0, y: 0 };

  function onMove(e) {
    mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
    mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
  }

  function boot() {
    const THREE = window.THREE;
    if (!THREE || dead) return;

    const w = canvas.clientWidth || 460, h = canvas.clientHeight || 420;
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 200);
    camera.position.z = 6.4;

    group = new THREE.Group();
    scene.add(group);

    const geo = new THREE.TorusKnotGeometry(1.3, 0.38, 140, 18, 2, 3);
    group.add(new THREE.LineSegments(
      new THREE.WireframeGeometry(geo),
      new THREE.LineBasicMaterial({ color: 0x18181b, transparent: true, opacity: 0.1 })
    ));
    group.add(new THREE.Points(
      geo,
      new THREE.PointsMaterial({ color: 0xff5a1f, size: 0.022, transparent: true, opacity: 0.55 })
    ));

    window.addEventListener('mousemove', onMove);
    window.addEventListener('resize', onResize);

    tick();
  }

  function onResize() {
    if (!renderer || !camera) return;
    const w = canvas.clientWidth || 460, h = canvas.clientHeight || 420;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function tick() {
    if (dead) return;
    const t = performance.now() / 1000;
    group.rotation.y = t * 0.12 + mouse.x * 0.2;
    group.rotation.x = Math.sin(t * 0.18) * 0.25 + mouse.y * 0.12;
    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  }

  window.addEventListener('beforeunload', () => {
    dead = true;
    if (raf) cancelAnimationFrame(raf);
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('resize', onResize);
  });
})();
