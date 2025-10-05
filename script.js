// Helper: on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // Loader: hide when first hero video can play or after fallback timeout
  const loader = $('#loader');
  const firstVideo = $('.hero-video');
  const hideLoader = () => loader && loader.classList.add('hidden');
  if (firstVideo) {
    firstVideo.addEventListener('canplaythrough', hideLoader, { once: true });
    setTimeout(hideLoader, 3500);
  } else {
    setTimeout(hideLoader, 800);
  }

  // Mobile nav toggle
  const navToggle = $('.nav-toggle');
  const navList = $('.nav-list');
  if (navToggle && navList) {
    navToggle.addEventListener('click', () => navList.classList.toggle('open'));
  }

  // Theme toggle (dark mode)
  const themeToggle = document.getElementById('themeToggle');
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') document.body.classList.add('dark');
  themeToggle && themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
  });

  // Parallax: subtle on scroll transform
  const parallax = $('.parallax-video');
  if (parallax) {
    window.addEventListener('scroll', () => {
      const y = window.scrollY * 0.2;
      parallax.style.transform = `translateY(${y}px)`;
    }, { passive: true });
  }

  // IntersectionObserver for section reveal
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('in-view');
    });
  }, { threshold: 0.2 });
  $$('.section-observe').forEach(el => sectionObserver.observe(el));

  // Active nav highlight
  const sections = ['hero','services','cards','stats','carousel','testimonials','customers','portfolio','cta','contact']
    .map(id => document.getElementById(id)).filter(Boolean);
  const navLinks = $$('.nav-list a');
  const activeObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const id = entry.target.getAttribute('id');
      navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${id}`));
    });
  }, { threshold: 0.5 });
  sections.forEach(s => activeObs.observe(s));

  // Ripple effect for [data-ripple]
  $$("[data-ripple]").forEach(btn => {
    btn.addEventListener('click', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const el = document.createElement('span');
      el.className = 'ripple-el';
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      btn.appendChild(el);
      el.addEventListener('animationend', () => el.remove());
    });
  });

  // Hover-to-play videos (exclude hero/carousel/testimonials autoplay ones)
  const hoverVideos = $$('video[data-hover-play]');
  function playOnHover(v) {
    const start = () => { v.currentTime = 0; v.play().catch(() => {}); };
    const stop = () => { v.pause(); v.currentTime = 0; };
    v.addEventListener('mouseenter', start);
    v.addEventListener('focus', start);
    v.addEventListener('mouseleave', stop);
    v.addEventListener('blur', stop);
    // Touch: tap to toggle
    let playing = false;
    v.addEventListener('touchend', (e) => {
      e.preventDefault();
      playing ? stop() : start();
      playing = !playing;
    }, { passive: false });
  }
  hoverVideos.forEach(playOnHover);

  // Generic slider function (for carousel and testimonials)
  function initSlider(root, { autoplayMs = 0 } = {}) {
    const slidesWrap = $('.slides', root);
    const slides = $$('.slide', slidesWrap);
    let idx = 0;

    function goTo(i) {
      idx = (i + slides.length) % slides.length;
      slidesWrap.style.transform = `translateX(-${idx * 100}%)`;
      updateDots();
    }

    const prev = $('.prev', root);
    const next = $('.next', root);
    prev && prev.addEventListener('click', () => goTo(idx - 1));
    next && next.addEventListener('click', () => goTo(idx + 1));

    // Dots (for testimonials)
    const dotsWrap = $('.dots', root);
    let dots = [];
    if (dotsWrap) {
      dotsWrap.innerHTML = '';
      dots = slides.map((_, i) => {
        const b = document.createElement('button');
        b.addEventListener('click', () => goTo(i));
        dotsWrap.appendChild(b);
        return b;
      });
    }
    function updateDots() { dots.forEach((d, i) => d.classList.toggle('active', i === idx)); }
    updateDots();

    // Autoplay
    if (autoplayMs > 0) setInterval(() => goTo(idx + 1), autoplayMs);

    // Basic drag/swipe
    let startX = 0; let delta = 0; let dragging = false;
    slidesWrap.addEventListener('pointerdown', (e) => { dragging = true; startX = e.clientX; slidesWrap.style.transition = 'none'; });
    window.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      delta = e.clientX - startX;
      const pct = -idx * 100 + (delta / root.clientWidth) * 100;
      slidesWrap.style.transform = `translateX(${pct}%)`;
    });
    window.addEventListener('pointerup', () => {
      if (!dragging) return;
      dragging = false; slidesWrap.style.transition = '';
      if (Math.abs(delta) > root.clientWidth * 0.2) {
        goTo(idx + (delta < 0 ? 1 : -1));
      } else {
        goTo(idx);
      }
      delta = 0;
    });

    return { goTo };
  }

  // Initialize sliders
  const carousel = $('[data-slider].slider');
  if (carousel) initSlider(carousel);
  const testimonialSlider = $('.testimonials-slider');
  if (testimonialSlider) initSlider(testimonialSlider, { autoplayMs: Number(testimonialSlider.getAttribute('data-autoplay') || 0) });

  // Stats counter on view
  const counters = $$('.stat .num');
  if (counters.length) {
    const counterObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target; const target = Number(el.getAttribute('data-count') || 0);
        const start = performance.now(); const duration = 1200;
        function tick(now) {
          const p = Math.min(1, (now - start) / duration);
          el.textContent = Math.floor(target * (1 - Math.pow(1 - p, 3))).toString();
          if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        obs.unobserve(el);
      });
    }, { threshold: 0.4 });
    counters.forEach(el => counterObserver.observe(el));
  }

  // Portfolio filters
  const filterBtns = $$('.filter-btn');
  const items = $$('.portfolio .item');
  filterBtns.forEach(btn => btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const type = btn.getAttribute('data-filter');
    items.forEach(it => {
      const match = type === 'all' || it.getAttribute('data-type') === type;
      it.style.display = match ? '' : 'none';
    });
  }));

  // Lightbox for portfolio/media preview
  const lightbox = document.getElementById('lightbox');
  const lightboxContent = document.getElementById('lightboxContent');
  const lightboxClose = lightbox ? lightbox.querySelector('.lightbox-close') : null;
  function openLightbox(node) {
    if (!lightbox || !lightboxContent) return;
    lightboxContent.innerHTML = '';
    const clone = node.cloneNode(true);
    clone.removeAttribute('data-hover-play');
    clone.controls = true;
    if (clone.tagName === 'VIDEO') { clone.muted = false; clone.play().catch(() => {}); }
    lightboxContent.appendChild(clone);
    lightbox.classList.add('show');
  }
  function closeLightbox() { lightbox && lightbox.classList.remove('show'); lightboxContent && (lightboxContent.innerHTML = ''); }
  lightboxClose && lightboxClose.addEventListener('click', closeLightbox);
  lightbox && lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
  $$('.portfolio .item video, .portfolio .item img').forEach(media => {
    media.addEventListener('click', () => openLightbox(media));
    media.style.cursor = 'zoom-in';
  });

  // Footer year
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear().toString();

  // Cursor glow on hero
  const glow = document.getElementById('cursorGlow');
  const hero = document.getElementById('hero');
  if (glow && hero) {
    hero.addEventListener('pointermove', (e) => {
      const rect = hero.getBoundingClientRect();
      glow.style.setProperty('--mx', `${e.clientX - rect.left}px`);
      glow.style.setProperty('--my', `${e.clientY - rect.top}px`);
    });
  }

  // Magnetic CTA
  $$('.magnetic').forEach(btn => {
    btn.addEventListener('pointermove', (e) => {
      const r = btn.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width/2)) * 0.1;
      const dy = (e.clientY - (r.top + r.height/2)) * 0.1;
      btn.style.setProperty('--mx', `${dx}px`);
      btn.style.setProperty('--my', `${dy}px`);
    });
    btn.addEventListener('pointerleave', () => {
      btn.style.setProperty('--mx', `0px`);
      btn.style.setProperty('--my', `0px`);
    });
  });

  // Tilt effect
  $$('.tilt').forEach(card => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width; // 0..1
      const y = (e.clientY - r.top) / r.height; // 0..1
      const rx = (0.5 - y) * 8; // deg
      const ry = (x - 0.5) * 10; // deg
      card.style.setProperty('--rx', `${rx}deg`);
      card.style.setProperty('--ry', `${ry}deg`);
    });
    card.addEventListener('pointerleave', () => {
      card.style.setProperty('--rx', `0deg`);
      card.style.setProperty('--ry', `0deg`);
    });
  });

  // Back to top
  const backToTop = document.getElementById('backToTop');
  if (backToTop) {
    backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    window.addEventListener('scroll', () => {
      const show = window.scrollY > 600;
      backToTop.classList.toggle('show', show);
    }, { passive: true });
  }

  // Contact button: smooth scroll to footer, full-width on small screens (via CSS)
  const contactBtn = document.getElementById('contactBtn');
  const contactSection = document.getElementById('contact');
  if (contactBtn && contactSection) {
    contactBtn.addEventListener('click', (e) => {
      e.preventDefault();
      contactSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
});


