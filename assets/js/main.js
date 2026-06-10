/* ============================================================
   NAVBAR — scroll shadow + mobile toggle
   ============================================================ */
const header = document.querySelector('.header');
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');

window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 20);
});

navToggle?.addEventListener('click', () => {
  navLinks.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', navLinks.classList.contains('open'));
});

/* ============================================================
   ACTIVE NAV LINK
   ============================================================ */
const currentPage = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-links a').forEach(link => {
  if (link.getAttribute('href') === currentPage || link.getAttribute('href') === './' + currentPage) {
    link.classList.add('active');
  }
});

/* ============================================================
   SCROLL PROGRESS BAR — injetada dinamicamente
   ============================================================ */
const progressBar = document.createElement('div');
progressBar.className = 'scroll-progress';
document.body.appendChild(progressBar);

window.addEventListener('scroll', () => {
  const total = document.documentElement.scrollHeight - window.innerHeight;
  const pct = total > 0 ? (window.scrollY / total) * 100 : 0;
  progressBar.style.width = pct + '%';
}, { passive: true });

/* ============================================================
   PARTÍCULAS — constelação no hero (canvas injetado)
   ============================================================ */
(function initParticles() {
  const host = document.querySelector('.hero') || document.querySelector('.page-hero');
  if (!host) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return;

  const canvas = document.createElement('canvas');
  canvas.className = 'particles-canvas';
  host.prepend(canvas);

  const ctx = canvas.getContext('2d');
  let particles = [];
  let raf;

  function resize() {
    canvas.width = host.offsetWidth;
    canvas.height = host.offsetHeight;
    const count = Math.min(70, Math.floor(canvas.width / 22));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.6 + 0.4
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(189, 217, 215, 0.45)';
      ctx.fill();
    });

    // Linhas de conexão entre partículas próximas
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.hypot(dx, dy);
        if (dist < 130) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(189, 217, 215, ${0.12 * (1 - dist / 130)})`;
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

  // Pausa quando o hero sai da tela — economia de CPU
  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      if (!raf) draw();
    } else {
      cancelAnimationFrame(raf);
      raf = null;
    }
  }).observe(host);
})();

/* ============================================================
   TILT 3D — cards seguem o mouse
   ============================================================ */
document.querySelectorAll('.card').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `rotateY(${x * 7}deg) rotateX(${-y * 7}deg) translateY(-6px)`;
  });

  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
});

/* ============================================================
   CONTADORES ANIMADOS — stats do hero
   ============================================================ */
const counters = document.querySelectorAll('.stat-num[data-count]');

if (counters.length) {
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.count, 10);
      const duration = 1600;
      const start = performance.now();

      function tick(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        el.textContent = Math.round(eased * target);
        if (progress < 1) requestAnimationFrame(tick);
      }

      requestAnimationFrame(tick);
      counterObserver.unobserve(el);
    });
  }, { threshold: 0.4 });

  counters.forEach(el => counterObserver.observe(el));
}

/* ============================================================
   CONTACT FORM — Formspree
   ============================================================ */
const contactForm = document.getElementById('contact-form');
const formSuccess = document.getElementById('form-success');

contactForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = contactForm.querySelector('[type="submit"]');
  const originalText = btn.innerHTML;

  btn.innerHTML = 'Enviando…';
  btn.disabled = true;

  const formData = new FormData(contactForm);

  try {
    const response = await fetch(contactForm.action, {
      method: 'POST',
      body: formData,
      headers: { 'Accept': 'application/json' }
    });

    if (response.ok) {
      contactForm.style.display = 'none';
      formSuccess.style.display = 'block';
    } else {
      throw new Error('Erro no envio');
    }
  } catch {
    btn.innerHTML = originalText;
    btn.disabled = false;
    alert('Erro ao enviar. Tente novamente ou entre em contato diretamente.');
  }
});

/* ============================================================
   SCROLL REVEAL — fade-in com stagger
   ============================================================ */
const revealElements = document.querySelectorAll('.card, .section-header, .contact-wrapper, .iframe-wrapper, .hero-stats .stat');

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
      // Libera o transform inline após a animação — necessário para o tilt 3D
      setTimeout(() => {
        el.style.transition = '';
        el.style.transform = '';
        el.style.transitionDelay = '';
      }, 700 + parseFloat(el.style.transitionDelay || 0) * 1000);
      revealObserver.unobserve(el);
    }
  });
}, { threshold: 0.1 });

revealElements.forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(24px)';
  el.style.transition = 'opacity 0.6s cubic-bezier(.4,0,.2,1), transform 0.6s cubic-bezier(.4,0,.2,1)';
  revealObserver.observe(el);
});

document.querySelectorAll('.card, .hero-stats .stat').forEach((el, i) => {
  el.style.transitionDelay = `${(i % 6) * 0.08}s`;
});
