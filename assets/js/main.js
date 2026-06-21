/* ============================================================
   PORTFÓLIO — Aço Fundido & Platina
   Vanilla JS · three.js (hero metal líquido) · sem build
   ============================================================ */
(function () {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ----------------------------------------------------------
     NAVBAR — sombra no scroll + toggle mobile
     ---------------------------------------------------------- */
  const header = document.querySelector('.header');
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (header) {
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  navToggle?.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(open));
  });
  navLinks?.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => {
      navLinks.classList.remove('open');
      navToggle?.setAttribute('aria-expanded', 'false');
    })
  );

  /* ----------------------------------------------------------
     LINK ATIVO (sub-páginas)
     ---------------------------------------------------------- */
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    const href = link.getAttribute('href') || '';
    if (href === page || href === './' + page) link.classList.add('active');
  });

  /* ----------------------------------------------------------
     BARRA DE PROGRESSO
     ---------------------------------------------------------- */
  const progress = document.createElement('div');
  progress.className = 'scroll-progress';
  document.body.appendChild(progress);
  const updateProgress = () => {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = (total > 0 ? (window.scrollY / total) * 100 : 0) + '%';
  };
  updateProgress();
  window.addEventListener('scroll', updateProgress, { passive: true });

  /* ----------------------------------------------------------
     HERO — METAL LÍQUIDO (three.js, com fallback)
     ---------------------------------------------------------- */
  (function liquidMetal() {
    const canvas = document.getElementById('metal-canvas');
    if (!canvas || reduced || typeof THREE === 'undefined') return; // fallback CSS no .hero-bg
    const host = canvas.closest('.hero-bg') || canvas.parentElement;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
    } catch (e) { return; } // sem WebGL → fallback CSS

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const uniforms = {
      u_time: { value: 0 },
      u_res: { value: new THREE.Vector2(1, 1) },
      u_mouse: { value: new THREE.Vector2(0.5, 0.55) }
    };

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: `
        varying vec2 vUv;
        void main(){ vUv = uv; gl_Position = vec4(position, 1.0); }
      `,
      fragmentShader: `
        precision highp float;
        uniform float u_time;
        uniform vec2 u_res;
        uniform vec2 u_mouse;
        varying vec2 vUv;

        vec2 hash22(vec2 p){
          p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
          return fract(sin(p) * 43758.5453) * 2.0 - 1.0;
        }
        float noise(vec2 p){
          vec2 i = floor(p), f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(mix(dot(hash22(i + vec2(0,0)), f - vec2(0,0)),
                         dot(hash22(i + vec2(1,0)), f - vec2(1,0)), u.x),
                     mix(dot(hash22(i + vec2(0,1)), f - vec2(0,1)),
                         dot(hash22(i + vec2(1,1)), f - vec2(1,1)), u.x), u.y);
        }
        float fbm(vec2 p){
          float v = 0.0, a = 0.5;
          for(int i = 0; i < 5; i++){ v += a * noise(p); p *= 2.0; a *= 0.5; }
          return v;
        }
        void main(){
          vec2 uv = vUv;
          vec2 p = uv;
          p.x *= u_res.x / u_res.y;
          float t = u_time * 0.045;

          // domain warping → fluxo de metal líquido
          vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, 1.3 - t)));
          vec2 r = vec2(fbm(p + 3.5 * q + vec2(1.7, 9.2) + t),
                        fbm(p + 3.5 * q + vec2(8.3, 2.8) - t));
          float f = fbm(p + 3.5 * r);
          f = f * 0.5 + 0.5;

          vec3 obsidian = vec3(0.052, 0.064, 0.073);
          vec3 graphite = vec3(0.102, 0.122, 0.141);
          vec3 steel    = vec3(0.357, 0.769, 0.839);
          vec3 platinum = vec3(0.910, 0.925, 0.937);

          vec3 col = mix(obsidian, graphite, smoothstep(0.05, 0.9, f));
          float spec = pow(smoothstep(0.45, 0.96, f), 3.0);
          col = mix(col, platinum, spec * 0.45);
          float vein = smoothstep(0.46, 0.6, f) - smoothstep(0.6, 0.8, f);
          col = mix(col, steel, clamp(vein, 0.0, 1.0) * 0.30);

          float d = distance(uv, u_mouse);
          col += steel * 0.10 * smoothstep(0.45, 0.0, d);

          col *= 0.62 + 0.38 * smoothstep(1.15, 0.15, length(uv - 0.5));
          gl_FragColor = vec4(col, 1.0);
        }
      `
    });

    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

    function resize() {
      const w = host.offsetWidth, h = host.offsetHeight;
      renderer.setSize(w, h, false);
      uniforms.u_res.value.set(w, h);
    }
    resize();
    window.addEventListener('resize', resize);

    host.addEventListener('pointermove', e => {
      const rect = host.getBoundingClientRect();
      uniforms.u_mouse.value.set(
        (e.clientX - rect.left) / rect.width,
        1.0 - (e.clientY - rect.top) / rect.height
      );
    });

    let raf = null, running = false;
    const clock = new THREE.Clock();
    function loop() {
      uniforms.u_time.value += clock.getDelta();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    }
    function start() { if (!running) { running = true; clock.start(); loop(); } }
    function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = null; }

    new IntersectionObserver(([en]) => (en.isIntersecting ? start() : stop()))
      .observe(host);
  })();

  /* ----------------------------------------------------------
     PARTÍCULAS — poeira metálica sobre o hero
     ---------------------------------------------------------- */
  (function particles() {
    if (reduced) return;
    const host = document.querySelector('.hero .hero-bg') || document.querySelector('.page-hero');
    if (!host) return;

    const canvas = document.createElement('canvas');
    canvas.className = 'particles-canvas';
    host.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    let pts = [], raf = null;

    function resize() {
      canvas.width = host.offsetWidth;
      canvas.height = host.offsetHeight;
      const n = Math.min(56, Math.floor(canvas.width / 28));
      pts = Array.from({ length: n }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        r: Math.random() * 1.5 + 0.4
      }));
    }
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(198, 206, 212, 0.55)';
        ctx.fill();
      }
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          const dist = Math.hypot(dx, dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = 'rgba(91, 196, 214, ' + (0.10 * (1 - dist / 120)) + ')';
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    }
    resize();
    draw();
    window.addEventListener('resize', resize);
    new IntersectionObserver(([en]) => {
      if (en.isIntersecting) { if (!raf) draw(); }
      else { cancelAnimationFrame(raf); raf = null; }
    }).observe(host);
  })();

  /* ----------------------------------------------------------
     ROTADOR DE PALAVRA (hero)
     ---------------------------------------------------------- */
  (function rotator() {
    const rot = document.querySelector('.rotator');
    if (!rot) return;
    const words = [...rot.querySelectorAll('.rotator-word')];
    if (words.length < 2 || reduced) return;
    let i = 0;
    setInterval(() => {
      const cur = words[i];
      cur.classList.remove('is-active');
      cur.classList.add('is-out');
      i = (i + 1) % words.length;
      const next = words[i];
      next.classList.remove('is-out');
      next.classList.add('is-active');
      setTimeout(() => cur.classList.remove('is-out'), 750);
    }, 2400);
  })();

  /* ----------------------------------------------------------
     CONTADORES (spec bar)
     ---------------------------------------------------------- */
  (function counters() {
    const els = document.querySelectorAll('.spec-value[data-count]');
    if (!els.length) return;
    if (reduced) { els.forEach(el => (el.textContent = el.dataset.count)); return; }

    const obs = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        const el = en.target;
        const target = parseInt(el.dataset.count, 10);
        const dur = 1500, t0 = performance.now();
        const tick = now => {
          const prog = Math.min((now - t0) / dur, 1);
          const eased = 1 - Math.pow(1 - prog, 3);
          el.textContent = Math.round(eased * target);
          if (prog < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        obs.unobserve(el);
      });
    }, { threshold: 0.5 });
    els.forEach(el => obs.observe(el));
  })();

  /* ----------------------------------------------------------
     CARROSSÉIS (categorias)
     ---------------------------------------------------------- */
  document.querySelectorAll('[data-carousel]').forEach(carousel => {
    const track = carousel.querySelector('.carousel-track');
    const section = carousel.closest('section');
    const prev = section.querySelector('.carousel-btn[data-dir="prev"]');
    const next = section.querySelector('.carousel-btn[data-dir="next"]');
    const dotsBox = section.querySelector('.carousel-dots');
    const cards = [...track.querySelectorAll('.work-card')];
    if (!cards.length) return;

    const step = () => {
      const cw = cards[0].getBoundingClientRect().width;
      const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || 32) || 32;
      return cw + gap;
    };

    // dots
    if (dotsBox) {
      cards.forEach((_, idx) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', 'Ir para item ' + (idx + 1));
        b.addEventListener('click', () => track.scrollTo({ left: idx * step(), behavior: 'smooth' }));
        dotsBox.appendChild(b);
      });
    }
    const dots = dotsBox ? [...dotsBox.children] : [];

    const sync = () => {
      const max = track.scrollWidth - track.clientWidth - 2;
      if (prev) prev.disabled = track.scrollLeft <= 2;
      if (next) next.disabled = track.scrollLeft >= max;
      if (dots.length) {
        const idx = Math.round(track.scrollLeft / step());
        dots.forEach((d, i) => d.classList.toggle('active', i === idx));
      }
    };
    sync();

    prev?.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
    next?.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));

    let ticking = false;
    track.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { sync(); ticking = false; });
    }, { passive: true });
    window.addEventListener('resize', sync);

    // arrastar para rolar
    let down = false, startX = 0, startScroll = 0, moved = false;
    track.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      down = true; moved = false;
      startX = e.clientX; startScroll = track.scrollLeft;
      track.classList.add('dragging');
    });
    track.addEventListener('pointermove', e => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 6) moved = true;
      track.scrollLeft = startScroll - dx;
    });
    const release = () => { down = false; track.classList.remove('dragging'); };
    track.addEventListener('pointerup', release);
    track.addEventListener('pointercancel', release);
    track.addEventListener('pointerleave', release);
    // impede navegação acidental ao arrastar
    track.addEventListener('click', e => { if (moved) { e.preventDefault(); moved = false; } }, true);
  });

  /* ----------------------------------------------------------
     SCROLL REVEAL — enriquece um padrão já visível
     ---------------------------------------------------------- */
  (function reveal() {
    const targets = document.querySelectorAll(
      '.section-head, .step, .work-card, .spec, .sector-pill, .contact-wrapper, .iframe-wrapper'
    );
    if (!targets.length) return;

    if (reduced || !('IntersectionObserver' in window)) {
      targets.forEach(el => el.classList.add('in'));
      return;
    }
    targets.forEach(el => el.classList.add('reveal'));

    const obs = new IntersectionObserver((entries, o) => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        const el = en.target;
        // stagger entre irmãos do mesmo grupo
        const group = el.parentElement ? [...el.parentElement.children].filter(c => c.classList.contains('reveal')) : [el];
        const idx = Math.max(0, group.indexOf(el));
        el.style.transitionDelay = (Math.min(idx, 6) * 0.07) + 's';
        el.classList.add('in');
        o.unobserve(el);
      });
    }, { threshold: 0.12 });
    targets.forEach(el => obs.observe(el));
  })();

  /* ----------------------------------------------------------
     LOADER ORBITAL — estados de carregamento de iframes
     (forward-compatible: ativa quando houver <iframe> real)
     ---------------------------------------------------------- */
  document.querySelectorAll('.iframe-wrapper iframe').forEach(frame => {
    const wrap = frame.closest('.iframe-wrapper');
    const loader = document.createElement('div');
    loader.className = 'orbital';
    loader.style.cssText = 'position:absolute;inset:0;margin:auto;z-index:2';
    loader.innerHTML = '<span></span><span></span><span></span>';
    wrap.style.position = 'relative';
    wrap.appendChild(loader);
    frame.addEventListener('load', () => loader.remove());
  });

  /* ----------------------------------------------------------
     CONTATO — Formspree
     ---------------------------------------------------------- */
  const form = document.getElementById('contact-form');
  const success = document.getElementById('form-success');
  form?.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = form.querySelector('[type="submit"]');
    const original = btn.innerHTML;
    btn.innerHTML = 'Enviando…';
    btn.disabled = true;
    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      });
      if (!res.ok) throw new Error('fail');
      form.style.display = 'none';
      if (success) success.style.display = 'block';
    } catch {
      btn.innerHTML = original;
      btn.disabled = false;
      alert('Erro ao enviar. Tente novamente ou entre em contato diretamente.');
    }
  });

})();
