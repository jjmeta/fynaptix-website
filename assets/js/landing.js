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
