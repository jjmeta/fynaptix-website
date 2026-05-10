
const nav = document.getElementById('main-nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 60);
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
