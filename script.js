/* ============================================================
   Ismael Espinoza Jaramillo — site interactions
   Vanilla JS, no dependencies. The page works without it:
   videos have native controls and the menu stays visible.
   ============================================================ */
(function () {
  'use strict';

  document.documentElement.classList.remove('no-js');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Mobile menu ---------- */
  const toggle = document.getElementById('navToggle');
  const nav = document.getElementById('nav');
  const setMenu = open => {
    nav.classList.toggle('open', open);
    toggle.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  toggle.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));

  /* ---------- Active section in the top bar ---------- */
  const navLinks = Array.from(nav.querySelectorAll('a[href^="#"]'));
  const byId = {};
  navLinks.forEach(l => { byId[l.getAttribute('href').slice(1)] = l; });
  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navLinks.forEach(l => l.classList.remove('active'));
        const link = byId[entry.target.id];
        if (link) link.classList.add('active');
      });
    }, { rootMargin: '-30% 0px -60% 0px' });
    Object.keys(byId).forEach(id => {
      const el = document.getElementById(id);
      if (el) spy.observe(el);
    });
  }

  /* ---------- Videos: play only while visible ---------- */
  // Every video carries native controls, so visitors can always pause.
  const videos = Array.from(document.querySelectorAll('video.autoplay'));
  if (reduceMotion || !('IntersectionObserver' in window)) {
    // No autoplay: show the poster and let the visitor start the clip.
    videos.forEach(v => { v.preload = 'metadata'; });
  } else {
    const paused = new WeakSet();   // clips the visitor paused stay paused
    videos.forEach(v => {
      v.addEventListener('pause', () => { if (v.dataset.auto !== '1') paused.add(v); v.dataset.auto = ''; });
      v.addEventListener('play', () => paused.delete(v));
    });
    const watcher = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const v = entry.target;
        if (entry.isIntersecting) {
          if (paused.has(v)) return;
          if (v.preload === 'none') v.preload = 'auto';
          const p = v.play();
          if (p && p.catch) p.catch(() => {});
        } else if (!v.paused) {
          v.dataset.auto = '1';
          v.pause();
        }
      });
    }, { threshold: 0.35 });
    videos.forEach(v => watcher.observe(v));
  }

  /* ---------- Lightbox for figures ---------- */
  const box = document.getElementById('lightbox');
  const boxImg = document.getElementById('lightboxImg');
  const boxClose = document.getElementById('lightboxClose');
  let lastFocus = null;
  const openBox = (src, alt) => {
    lastFocus = document.activeElement;
    boxImg.src = src;
    boxImg.alt = alt || '';
    box.hidden = false;
    document.body.style.overflow = 'hidden';
    boxClose.focus();
  };
  const closeBox = () => {
    box.hidden = true;
    boxImg.removeAttribute('src');
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  };
  document.querySelectorAll('img[data-lightbox]').forEach(img => {
    img.tabIndex = 0;
    img.setAttribute('role', 'button');
    img.setAttribute('aria-label', 'Enlarge figure: ' + img.alt);
    const open = () => openBox(img.currentSrc || img.src, img.alt);
    img.addEventListener('click', open);
    img.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });
  });
  document.querySelectorAll('a[data-lightbox-link]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      openBox(a.getAttribute('href'), a.textContent);
    });
  });
  box.addEventListener('click', e => { if (e.target !== boxImg) closeBox(); });
  boxClose.addEventListener('click', closeBox);

  /* ---------- Keyboard: Escape and focus trap ---------- */
  document.addEventListener('keydown', e => {
    if (!box.hidden) {
      if (e.key === 'Escape') closeBox();
      else if (e.key === 'Tab') { e.preventDefault(); boxClose.focus(); }
      return;
    }
    if (e.key === 'Escape' && nav.classList.contains('open')) {
      setMenu(false);
      toggle.focus();
    }
  });
})();
