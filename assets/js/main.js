
const nav = document.getElementById('main-nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 60);
});

// ── Nav dropdowns (supports multiple) ──
function toggleDropdown(e) {
  e.stopPropagation()
  const dropdown = e.currentTarget.closest('.nav-dropdown')
  const isOpen = dropdown.classList.contains('open')
  // Close all dropdowns first
  document.querySelectorAll('.nav-dropdown').forEach(d => d.classList.remove('open'))
  // Re-open this one if it wasn't already open
  if (!isOpen) dropdown.classList.add('open')
}
document.addEventListener('click', () => {
  document.querySelectorAll('.nav-dropdown').forEach(d => d.classList.remove('open'))
})

// ── Mobile Free Tools submenu ──
function toggleMobileTools() {
  const sub = document.getElementById('mob-tools-sub')
  const arrow = document.getElementById('mob-tools-arrow')
  const open = sub.classList.toggle('open')
  arrow.style.transform = open ? 'rotate(180deg)' : ''
}

// ── Mobile M365 Tenant Tools submenu ──
function toggleMobileM365() {
  const sub = document.getElementById('mob-m365-sub')
  const arrow = document.getElementById('mob-m365-arrow')
  if (!sub) return
  const open = sub.classList.toggle('open')
  arrow.style.transform = open ? 'rotate(180deg)' : ''
}

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
