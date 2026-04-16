/* BGC Landing Page – Script */

// --- Reveal on scroll ---
const reveals = document.querySelectorAll('.reveal');
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) {
      // Stagger children inside same parent
      const siblings = [...e.target.parentElement.querySelectorAll('.reveal')];
      const idx = siblings.indexOf(e.target);
      e.target.style.transitionDelay = (idx * 0.08) + 's';
      e.target.classList.add('visible');
      revealObs.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });
reveals.forEach(el => revealObs.observe(el));

// --- Dot nav active on scroll ---
const sections = document.querySelectorAll('section[id]');
const dots     = document.querySelectorAll('.dot-nav .dot');
const sectionObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      dots.forEach(d => d.classList.remove('active'));
      const active = document.querySelector(`.dot[href="#${e.target.id}"]`);
      if (active) active.classList.add('active');
    }
  });
}, { threshold: 0.45 });
sections.forEach(s => sectionObs.observe(s));

// --- Smooth scroll for dot nav ---
dots.forEach(dot => {
  dot.addEventListener('click', e => {
    e.preventDefault();
    const target = document.querySelector(dot.getAttribute('href'));
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  });
});

// --- Smooth scroll for CTA button ---
document.querySelector('.scroll-cta')?.addEventListener('click', e => {
  e.preventDefault();
  document.querySelector('#about')?.scrollIntoView({ behavior: 'smooth' });
});
