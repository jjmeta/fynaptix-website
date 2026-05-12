
const nav = document.getElementById('main-nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 60);
});

// ── Hamburger menu ──
const burger = document.getElementById('nav-burger');
const mobileMenu = document.getElementById('nav-mobile');
if (burger && mobileMenu) {
  burger.addEventListener('click', () => {
    const open = burger.classList.toggle('open');
    mobileMenu.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });
}
function closeMobile() {
  if (burger) burger.classList.remove('open');
  if (mobileMenu) mobileMenu.classList.remove('open');
  document.body.style.overflow = '';
}
// Close on outside tap
document.addEventListener('click', e => {
  if (mobileMenu && mobileMenu.classList.contains('open') &&
      !mobileMenu.contains(e.target) && !burger.contains(e.target)) {
    closeMobile();
  }
});
const obs = new IntersectionObserver(entries => {
  entries.forEach(el => {
    if (el.isIntersecting) {
      el.target.classList.add('visible');
      el.target.querySelectorAll('.sc2,.svc,.wc,.cc,.psc').forEach((c,i) => {
        c.style.transitionDelay = (i * 0.08) + 's';
        c.classList.add('reveal','visible');
      });
    }
  });
}, {threshold: 0.1});
document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
