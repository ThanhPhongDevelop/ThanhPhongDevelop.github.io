'use strict';

clearTimeout(window.__loaderFailsafe);

document.addEventListener('DOMContentLoaded', () => {
  const root = document.documentElement;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouchDevice = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  const safe = (fn) => {
    try { fn(); } catch (err) { console.error('[portfolio]', fn.name || 'init', err); }
  };

  safe(initThemeToggle);
  safe(initCursor);
  safe(initParticles);
  safe(initScrollEffects);
  safe(initMobileMenu);
  safe(initPlaceholderLinks);
  safe(initTilt);
  safe(initContactForm);
  safe(initImageFallbacks);
  safe(setFooterYear);
  safe(prepareHeroName);
  safe(initWorkTime);
  safe(prepareCounters);

  runLoader(() => {
    root.classList.add('is-loaded');
    safe(playHeroName);
    safe(startTyping);
    safe(initReveal);
    safe(initCounters);
    safe(initSkillBars);
  });

  function runLoader(onDone){
    const loader = document.getElementById('loader');
    const bar = document.getElementById('loaderBar');
    const label = document.getElementById('loaderPercent');
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      document.body.style.overflow = '';
      if (loader){
        loader.classList.add('hidden');
        loader.addEventListener('transitionend', () => loader.remove(), { once: true });
      }
      onDone();
    };

    if (!loader || !root.classList.contains('js')){ finish(); return; }

    try {
      const MIN_TIME = prefersReducedMotion ? 300 : 900;
      const MAX_TIME = 6000;
      let start = null;
      let last = null;
      let progress = 0;
      let ready = false;

      const pageLoaded = document.readyState === 'complete'
        ? Promise.resolve()
        : new Promise((resolve) => window.addEventListener('load', resolve, { once: true }));
      pageLoaded
        .then(() => (document.fonts ? document.fonts.ready : null))
        .then(() => { ready = true; }, () => { ready = true; });

      document.body.style.overflow = 'hidden';

      const frame = (now) => {
        if (start === null){ start = now; last = now; }
        const dt = now - last;
        last = now;
        const elapsed = now - start;
        const done = (ready && elapsed >= MIN_TIME) || elapsed >= MAX_TIME;
        const target = done ? 100 : 90;
        const rate = done ? 0.012 : 0.003;
        progress += (target - progress) * Math.min(1, rate * dt);
        if (done && progress > 99.5) progress = 100;

        if (bar) bar.style.width = progress.toFixed(1) + '%';
        if (label) label.textContent = Math.floor(progress) + '%';

        if (progress >= 100) setTimeout(finish, 250);
        else requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    } catch (err){
      console.error('[portfolio] loader', err);
      finish();
    }
  }

  function initThemeToggle(){
    const btn = document.getElementById('themeToggle');
    if (!btn) return;
    const meta = document.querySelector('meta[name="theme-color"]');
    const STORAGE_KEY = 'portfolio-theme';

    const apply = (theme) => {
      const isLight = theme === 'light';
      if (isLight) root.setAttribute('data-theme', 'light');
      else root.removeAttribute('data-theme');
      const label = isLight ? 'Chuyển sang chế độ tối' : 'Chuyển sang chế độ sáng';
      btn.setAttribute('aria-label', label);
      btn.setAttribute('title', label);
      if (meta) meta.setAttribute('content', isLight ? '#f3f4f9' : '#06070d');
    };

    let theme = root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    apply(theme);

    btn.addEventListener('click', () => {
      theme = theme === 'light' ? 'dark' : 'light';
      apply(theme);
      try { localStorage.setItem(STORAGE_KEY, theme); } catch (e) {}
    });
  }

  function initCursor(){
    const dot = document.getElementById('cursorDot');
    const ring = document.getElementById('cursorRing');
    if (!dot || !ring || isTouchDevice) return;

    const HOVER_TARGETS = 'a, button, .tilt-card, input, textarea, .tool-chip';
    let mouseX = 0, mouseY = 0, ringX = 0, ringY = 0;
    let hasMoved = false, rafId = 0;

    const setVisible = (visible) => {
      dot.classList.toggle('is-visible', visible);
      ring.classList.toggle('is-visible', visible);
    };

    const followRing = () => {
      ringX += (mouseX - ringX) * 0.16;
      ringY += (mouseY - ringY) * 0.16;
      ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
      const moving = Math.abs(mouseX - ringX) + Math.abs(mouseY - ringY) > 0.2;
      rafId = moving ? requestAnimationFrame(followRing) : 0;
    };

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
      if (!hasMoved){ hasMoved = true; ringX = mouseX; ringY = mouseY; }
      setVisible(true);
      if (!rafId) rafId = requestAnimationFrame(followRing);
    }, { passive: true });

    document.addEventListener('mouseover', (e) => {
      const target = e.target;
      ring.classList.toggle('hover', !!(target && target.closest && target.closest(HOVER_TARGETS)));
    });

    document.addEventListener('mouseout', (e) => { if (!e.relatedTarget) setVisible(false); });
  }

  function initParticles(){
    const canvas = document.getElementById('particleCanvas');
    const ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;
    if (!ctx) return;

    const LINK_DIST = 130;
    const LINK_DIST_SQ = LINK_DIST * LINK_DIST;
    const COLORS = ['79,216,255', '155,107,255'];
    let W = 0, H = 0;
    let particles = [];

    const makeParticle = () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.6 + 0.4,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      alpha: Math.random() * 0.5 + 0.15,
      rgb: COLORS[Math.random() > 0.5 ? 0 : 1],
    });

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.min(70, Math.floor((W * H) / 22000));
      while (particles.length < count) particles.push(makeParticle());
      particles.length = count;
      particles.forEach((p) => { p.x = Math.min(p.x, W); p.y = Math.min(p.y, H); });
    };

    const draw = (move) => {
      ctx.clearRect(0, 0, W, H);

      if (move){
        for (const p of particles){
          p.x += p.vx; p.y += p.vy;
          if (p.x < 0) p.x = W; else if (p.x > W) p.x = 0;
          if (p.y < 0) p.y = H; else if (p.y > H) p.y = 0;
        }
      }

      ctx.lineWidth = 1;
      for (let i = 0; i < particles.length; i++){
        const p = particles[i];
        for (let j = i + 1; j < particles.length; j++){
          const q = particles[j];
          const dx = p.x - q.x, dy = p.y - q.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < LINK_DIST_SQ){
            const alpha = 0.08 * (1 - Math.sqrt(distSq) / LINK_DIST);
            ctx.strokeStyle = `rgba(${p.rgb}, ${alpha.toFixed(3)})`;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }
      }

      for (const p of particles){
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.rgb}, ${p.alpha})`;
        ctx.fill();
      }
    };

    const loop = () => { draw(true); requestAnimationFrame(loop); };

    resize();
    if (prefersReducedMotion) draw(false);
    else requestAnimationFrame(loop);

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resize();
        if (prefersReducedMotion) draw(false);
      }, 150);
    });
  }

  function initScrollEffects(){
    const navbar = document.getElementById('navbar');
    const backToTop = document.getElementById('backToTop');
    const ringCircle = document.querySelector('.back-to-top-ring circle');
    const navLinks = Array.from(document.querySelectorAll('.nav-link[data-section]'));
    const sections = navLinks.map((link) => document.getElementById(link.dataset.section)).filter(Boolean);
    const parallaxEls = Array.from(document.querySelectorAll('[data-parallax]'));
    const parallaxQuery = window.matchMedia('(min-width: 1025px)');
    const parallaxEnabled = () => !prefersReducedMotion && parallaxQuery.matches;
    const CIRC = 2 * Math.PI * 20;
    let ticking = false;

    if (ringCircle){
      ringCircle.style.strokeDasharray = String(CIRC);
      ringCircle.style.strokeDashoffset = String(CIRC);
    }

    const update = () => {
      ticking = false;

      const y = window.scrollY;
      const viewH = window.innerHeight;
      const maxScroll = document.documentElement.scrollHeight - viewH;
      const activeLine = Math.max(120, viewH * 0.35);

      let current = sections.length ? sections[0].id : '';
      for (const sec of sections){
        if (sec.getBoundingClientRect().top <= activeLine) current = sec.id;
      }
      if (sections.length && maxScroll > 0 && y >= maxScroll - 4) current = sections[sections.length - 1].id;

      if (navbar) navbar.classList.toggle('scrolled', y > 40);
      if (backToTop) backToTop.classList.toggle('show', y > 600);
      if (ringCircle){
        const progress = maxScroll > 0 ? Math.min(y / maxScroll, 1) : 0;
        ringCircle.style.strokeDashoffset = String(CIRC * (1 - progress));
      }
      navLinks.forEach((link) => {
        const active = link.dataset.section === current;
        link.classList.toggle('active', active);
        if (active) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });

      if (parallaxEnabled()){
        const py = Math.min(y, viewH * 1.2);
        parallaxEls.forEach((el) => {
          const speed = parseFloat(el.dataset.parallax) || 0;
          el.style.translate = `0 ${(py * speed).toFixed(1)}px`;
        });
      }
    };

    const requestUpdate = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    if (parallaxQuery.addEventListener){
      parallaxQuery.addEventListener('change', () => {
        if (!parallaxEnabled()) parallaxEls.forEach((el) => { el.style.translate = ''; });
        requestUpdate();
      });
    }
    update();

    if (backToTop){
      backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
        const logo = document.querySelector('.nav-logo');
        if (logo) logo.focus({ preventScroll: true });
      });
    }
  }

  function initMobileMenu(){
    const hamburger = document.getElementById('hamburger');
    const menu = document.getElementById('mobileMenu');
    if (!hamburger || !menu) return;

    const isOpen = () => menu.classList.contains('open');
    const setOpen = (open) => {
      menu.classList.toggle('open', open);
      hamburger.classList.toggle('open', open);
      hamburger.setAttribute('aria-expanded', String(open));
      hamburger.setAttribute('aria-label', open ? 'Đóng menu' : 'Mở menu');
      document.body.classList.toggle('menu-open', open);
    };

    hamburger.addEventListener('click', () => setOpen(!isOpen()));

    menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setOpen(false)));

    menu.addEventListener('click', (e) => { if (e.target === menu) setOpen(false); });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen()){
        setOpen(false);
        hamburger.focus();
      }
    });

    const desktopQuery = window.matchMedia('(min-width: 861px)');
    if (desktopQuery.addEventListener){
      desktopQuery.addEventListener('change', (e) => { if (e.matches) setOpen(false); });
    }
  }

  function initPlaceholderLinks(){
    document.addEventListener('click', (e) => {
      const link = e.target && e.target.closest ? e.target.closest('a[href="#"]') : null;
      if (link) e.preventDefault();
    });
  }

  function prepareHeroName(){
    const el = document.getElementById('heroName');
    if (!el) return;
    const text = (el.textContent || '').trim().replace(/\s+/g, ' ').normalize('NFC');
    if (!text) return;

    const srText = document.createElement('span');
    srText.className = 'sr-only';
    srText.textContent = text;
    const wrapper = document.createElement('span');
    wrapper.setAttribute('aria-hidden', 'true');

    let index = 0;
    const words = text.split(' ');
    words.forEach((word, w) => {
      const wordEl = document.createElement('span');
      wordEl.className = 'word';
      Array.from(word).forEach((ch) => {
        const charEl = document.createElement('span');
        charEl.className = 'char';
        charEl.textContent = ch;
        charEl.style.transitionDelay = `${(0.4 + index * 0.045).toFixed(3)}s`;
        wordEl.appendChild(charEl);
        index++;
      });
      wrapper.appendChild(wordEl);
      if (w < words.length - 1){
        wrapper.appendChild(document.createTextNode(' '));
        index++;
      }
    });

    el.replaceChildren(srText, wrapper);
  }

  function playHeroName(){
    const el = document.getElementById('heroName');
    if (!el) return;
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('is-animated')));
  }

  function startTyping(){
    const el = document.getElementById('typedRole');
    if (!el) return;
    const roles = (el.dataset.roles || el.textContent).split('|').map((s) => s.trim()).filter(Boolean);
    if (!roles.length) return;
    if (prefersReducedMotion || roles.length === 1){ el.textContent = roles[0]; return; }

    let roleIndex = 0;
    let charIndex = 0;
    let deleting = false;
    let chars = Array.from(roles[0]);
    el.textContent = '';

    const tick = () => {
      let delay;
      if (!deleting){
        charIndex++;
        delay = 62;
        if (charIndex >= chars.length){ deleting = true; delay = 1600; }
      } else {
        charIndex--;
        delay = 32;
        if (charIndex <= 0){
          deleting = false;
          roleIndex = (roleIndex + 1) % roles.length;
          chars = Array.from(roles[roleIndex]);
          delay = 350;
        }
      }
      el.textContent = chars.slice(0, charIndex).join('');
      setTimeout(tick, delay);
    };
    setTimeout(tick, 1600);
  }

  function observeOnce(elements, callback, options){
    if (!('IntersectionObserver' in window)){
      elements.forEach((el) => callback(el));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        callback(entry.target);
      });
    }, options);
    elements.forEach((el) => observer.observe(el));
  }

  function initReveal(){
    observeOnce(document.querySelectorAll('.reveal'), (el) => {
      const delay = parseInt(el.dataset.delay, 10);
      if (delay > 0) el.style.setProperty('--reveal-delay', delay + 'ms');
      el.classList.add('in-view');
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
  }

  function prepareCounters(){
    if (prefersReducedMotion) return;
    document.querySelectorAll('[data-count]').forEach((el) => { el.textContent = '0'; });
  }

  function initCounters(){
    if (prefersReducedMotion) return;
    const DURATION = 1800;

    observeOnce(document.querySelectorAll('[data-count]'), (el) => {
      const target = parseInt(el.dataset.count, 10) || 0;
      const startDelay = el.closest('.hero') ? 1200 : 0;

      setTimeout(() => {
        const t0 = performance.now();
        const tick = (now) => {
          const p = Math.min((now - t0) / DURATION, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = p < 1 ? Math.floor(eased * target) : target;
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }, startDelay);
    }, { threshold: 0.5 });
  }

  function initSkillBars(){
    observeOnce(document.querySelectorAll('.skill-bar-fill[data-width]'), (bar) => {
      const value = Math.max(0, Math.min(100, parseFloat(bar.dataset.width) || 0));
      bar.style.width = value + '%';
    }, { threshold: 0.4 });
  }

  function initTilt(){
    if (isTouchDevice || prefersReducedMotion) return;

    document.querySelectorAll('.tilt-card').forEach((card) => {
      let rafId = 0;

      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const rotateX = ((e.clientY - rect.top) / rect.height - 0.5) * -12;
        const rotateY = ((e.clientX - rect.left) / rect.width - 0.5) * 12;
        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          card.style.transform =
            `perspective(900px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-4px) scale(1.015)`;
        });
      });

      card.addEventListener('mouseleave', () => {
        cancelAnimationFrame(rafId);
        card.style.transform = '';
      });
    });
  }

  function initContactForm(){
    const form = document.getElementById('contactForm');
    if (!form) return;
    const submitBtn = document.getElementById('submitBtn');
    const status = document.getElementById('formStatus');
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    const fields = [
      { el: document.getElementById('cfName'),    hint: 'họ tên (ít nhất 2 ký tự)',    isValid: (v) => v.length >= 2 },
      { el: document.getElementById('cfEmail'),   hint: 'email hợp lệ',                isValid: (v) => EMAIL_RE.test(v) },
      { el: document.getElementById('cfSubject'), hint: 'chủ đề (ít nhất 2 ký tự)',    isValid: (v) => v.length >= 2 },
      { el: document.getElementById('cfMessage'), hint: 'nội dung (ít nhất 10 ký tự)', isValid: (v) => v.length >= 10 },
    ].filter((f) => f.el);

    const setFieldError = (field, hasError) => {
      const group = field.el.closest('.form-group');
      if (group) group.classList.toggle('error', hasError);
      if (hasError) field.el.setAttribute('aria-invalid', 'true');
      else field.el.removeAttribute('aria-invalid');
    };

    const showStatus = (message, type) => {
      if (!status) return;
      status.textContent = message;
      status.classList.remove('success', 'error');
      status.classList.add('show', type);
    };

    const setLoading = (loading) => {
      if (!submitBtn) return;
      submitBtn.classList.toggle('loading', loading);
      submitBtn.disabled = loading;
      submitBtn.setAttribute('aria-busy', String(loading));
    };

    const getOwnerEmail = () => {
      const link = document.querySelector('#contact a[href^="mailto:"]');
      if (!link) return '';
      return decodeURIComponent(link.getAttribute('href').slice('mailto:'.length).split('?')[0]);
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (status) status.classList.remove('show');

      const data = {};
      const invalid = [];
      fields.forEach((field) => {
        const value = field.el.value.trim();
        data[field.el.name] = value;
        const hasError = !field.isValid(value);
        setFieldError(field, hasError);
        if (hasError) invalid.push(field);
      });

      if (invalid.length){
        showStatus(`Vui lòng nhập ${invalid.map((f) => f.hint).join(', ')}.`, 'error');
        invalid[0].el.focus();
        return;
      }

      const endpoint = (form.dataset.endpoint || '').trim();
      setLoading(true);
      try {
        if (endpoint){
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(data),
          });
          if (!res.ok) throw new Error('HTTP ' + res.status);
          form.reset();
          showStatus(`Cảm ơn ${data.name}! Tin nhắn đã được gửi, tôi sẽ phản hồi sớm nhất.`, 'success');
        } else {
          const body = `${data.message}\n\n—\n${data.name}\n${data.email}`;
          const mailto = `mailto:${getOwnerEmail()}?subject=${encodeURIComponent(data.subject)}&body=${encodeURIComponent(body)}`;
          window.location.href = mailto;
          showStatus(`Cảm ơn ${data.name}! Ứng dụng email của bạn đang mở với nội dung đã soạn sẵn — chỉ cần bấm Gửi.`, 'success');
        }
      } catch (err){
        console.error('[portfolio] contact form', err);
        showStatus('Chưa gửi được tin nhắn. Vui lòng thử lại hoặc email trực tiếp cho tôi.', 'error');
      } finally {
        setLoading(false);
      }
    });

    fields.forEach((field) => {
      field.el.addEventListener('input', () => setFieldError(field, false));
    });
  }

  function initImageFallbacks(){
    const makeFallback = (text) => {
      const safeText = String(text).replace(/[<>&"']/g, '');
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">' +
          '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
            '<stop offset="0" stop-color="#4fd8ff"/><stop offset=".55" stop-color="#9b6bff"/><stop offset="1" stop-color="#ff5fa2"/>' +
          '</linearGradient></defs>' +
          '<rect width="600" height="600" fill="#0a0d18"/>' +
          '<text x="50%" y="50%" dy=".35em" text-anchor="middle" font-family="Arial, sans-serif" font-size="200" font-weight="700" fill="url(#g)">' + safeText + '</text>' +
        '</svg>';
      return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    };

    document.querySelectorAll('img[data-fallback]').forEach((img) => {
      const swap = () => {
        const fallback = makeFallback(img.dataset.fallback);
        if (img.src !== fallback) img.src = fallback;
      };
      img.addEventListener('error', swap, { once: true });
      if (img.complete && img.naturalWidth === 0) swap();
    });
  }

  function initWorkTime(){
    const now = new Date();

    const parseMonth = (value) => {
      const match = String(value || '').trim().match(/^(\d{4})(?:-(\d{1,2}))?$/);
      if (!match) return null;
      const month = match[2] ? Math.min(12, Math.max(1, parseInt(match[2], 10))) : 1;
      return { year: parseInt(match[1], 10), month };
    };

    const monthsSince = (start) =>
      Math.max(1, (now.getFullYear() - start.year) * 12 + (now.getMonth() + 1 - start.month) + 1);

    const formatDuration = (totalMonths) => {
      const years = Math.floor(totalMonths / 12);
      const months = totalMonths % 12;
      return [years ? `${years} năm` : '', months ? `${months} tháng` : ''].filter(Boolean).join(' ');
    };

    document.querySelectorAll('[data-since]').forEach((el) => {
      const start = parseMonth(el.dataset.since);
      if (!start) return;
      const years = Math.floor(monthsSince(start) / 12);
      el.textContent = years;
      if (el.hasAttribute('data-count')) el.dataset.count = years;
    });

    document.querySelectorAll('.timeline-date[data-start]').forEach((el) => {
      const start = parseMonth(el.dataset.start);
      if (!start) return;
      let duration = el.querySelector('.timeline-duration');
      if (!duration){
        duration = document.createElement('span');
        duration.className = 'timeline-duration';
        el.appendChild(duration);
      }
      duration.textContent = ' · ' + formatDuration(monthsSince(start));
    });
  }

  function setFooterYear(){
    const el = document.getElementById('footerYear');
    if (el) el.textContent = new Date().getFullYear();
  }
});
