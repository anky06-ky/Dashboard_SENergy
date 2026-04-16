/* ===================================
   BGC PROTOTYPE – JAVASCRIPT
   Living Graph + Passport Scanner + Confetti
   =================================== */

// ==================== UTILITY ====================
const qs = (s, p = document) => p.querySelector(s);
const qsa = (s, p = document) => [...p.querySelectorAll(s)];

// ==================== BACKGROUND PARTICLE ANIMATION ====================
(function initBgCanvas() {
  const canvas = qs('#bgCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles = [];

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * W;
      this.y = Math.random() * H;
      this.r = Math.random() * 1.5 + 0.3;
      this.vx = (Math.random() - 0.5) * 0.3;
      this.vy = (Math.random() - 0.5) * 0.3;
      this.alpha = Math.random() * 0.5 + 0.1;
      this.color = Math.random() > 0.7 ? '#f472b6' : '#10b981';
    }
    update() {
      this.x += this.vx; this.y += this.vy;
      if (this.x < 0 || this.x > W || this.y < 0 || this.y > H) this.reset();
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.globalAlpha = this.alpha;
      ctx.fill();
    }
  }

  function init() {
    resize();
    particles = Array.from({ length: 120 }, () => new Particle());
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    // Draw connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 120) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = '#10b981';
          ctx.globalAlpha = (1 - d / 120) * 0.08;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
    particles.forEach(p => { p.update(); p.draw(); });
    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  init();
  draw();
})();

// ==================== DATA STREAM BG ====================
(function initDataStream() {
  const container = qs('#dataStream');
  if (!container) return;
  const chars = '01アイウエオカキ∑∇λπΩ∞≈{}[]<>|/\\'.split('');
  for (let i = 0; i < 40; i++) {
    const span = document.createElement('span');
    span.className = 'data-char';
    span.textContent = chars[Math.floor(Math.random() * chars.length)];
    span.style.left = Math.random() * 100 + 'vw';
    span.style.animationDuration = (Math.random() * 12 + 8) + 's';
    span.style.animationDelay = (Math.random() * 12) + 's';
    span.style.fontSize = (Math.random() * 8 + 9) + 'px';
    container.appendChild(span);
  }
})();

// ==================== INTERSECTION OBSERVER ====================
(function initAnimations() {
  const items = qsa('.animate-in');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });
  items.forEach(el => obs.observe(el));
})();

// ==================== NAV ACTIVE STATE ====================
(function initNav() {
  const sections = qsa('.section');
  const links = qsa('.nav-link');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        links.forEach(l => l.classList.remove('active'));
        const id = e.target.id;
        const active = qs(`.nav-link[href="#${id}"]`);
        if (active) active.classList.add('active');
      }
    });
  }, { threshold: 0.4 });
  sections.forEach(s => obs.observe(s));
})();

// ==================== KPI COUNTER ANIMATION ====================
(function initKPICounters() {
  const kpis = qsa('.kpi-value[data-target]');
  if (!kpis.length) return;

  function animateCounter(el) {
    const target = parseInt(el.dataset.target);
    const suffix = el.dataset.suffix || '';
    const duration = 2000;
    const start = performance.now();
    function step(now) {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      const val = Math.floor(ease * target);
      el.textContent = val.toLocaleString('vi-VN') + suffix;
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        animateCounter(e.target);
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.5 });
  kpis.forEach(el => obs.observe(el));
})();

// ==================== CARBON BAR ANIMATION ====================
(function initCarbonBars() {
  const bars = qsa('.cc-bar[data-w]');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.width = e.target.dataset.w + '%';
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.3 });
  bars.forEach(b => obs.observe(b));
})();

// ==================== THE LIVING GRAPH ====================
const Graph = (function() {
  const canvas = qs('#graphCanvas');
  if (!canvas) return {};
  const ctx = canvas.getContext('2d');
  let W, H, nodes = [], edges = [], hoveredNode = null;
  let filter = 'all';
  let animFrame;
  let time = 0;

  const NODE_TYPES = {
    farmer:  { color: '#10b981', label: 'Farmer/Farm',  size: 14 },
    lab:     { color: '#6366f1', label: 'Lab',          size: 11 },
    product: { color: '#f472b6', label: 'Product',      size: 12 },
    carbon:  { color: '#f59e0b', label: 'Carbon',       size: 10 },
    passport:{ color: '#06b6d4', label: 'Passport',     size: 9  },
  };

  const NODE_DATA = [
    { id: 0,  type: 'farmer',  label: 'Nguyễn Văn A', x: 0.15, y: 0.25,
      detail: 'Nông dân · Đồng Tháp\n48 ha sen · 2.4 tấn/vụ\nCO₂e: 8.4 kg/kg sp' },
    { id: 1,  type: 'farmer',  label: 'Trần Thị B',   x: 0.12, y: 0.55,
      detail: 'Nông dân · Long An\n32 ha lục bình\nCO₂e: 9.1 kg/kg sp' },
    { id: 2,  type: 'farmer',  label: 'Lê Văn C',     x: 0.10, y: 0.80,
      detail: 'Nông dân · Tiền Giang\n21 ha hỗn hợp\nCO₂e: 11.5 kg/kg sp' },
    { id: 3,  type: 'farmer',  label: 'Farm ĐT-01',   x: 0.20, y: 0.40,
      detail: 'Nông trại · Đồng Tháp\nDiện tích: 15 ha\nCertified organic' },
    { id: 4,  type: 'lab',     label: 'LabResult ISO', x: 0.42, y: 0.20,
      detail: 'Phòng Lab ISO 17025\nKim loại nặng: 0 ppm ✓\nVi sinh: Pass ✓' },
    { id: 5,  type: 'lab',     label: 'LabSample #12', x: 0.40, y: 0.45,
      detail: 'Mẫu kiểm nghiệm\nBatch: HB-2026-001\nNgày: 2026-03-10' },
    { id: 6,  type: 'lab',     label: 'Extraction',   x: 0.38, y: 0.70,
      detail: 'Chiết xuất xanh\nDung môi: EtOH 70%\nChelating: Sodium Phytate' },
    { id: 7,  type: 'product', label: 'VELA Serum', x: 0.65, y: 0.22,
      detail: 'Mỹ phẩm · VELA\n30ml · CGMP-ASEAN\nBatch: VELA-2026-001' },
    { id: 8,  type: 'product', label: 'LUCine Capsule', x: 0.68, y: 0.48,
      detail: 'TPCN · LUCine\nViên nang 500mg\nGiải độc gan · thận' },
    { id: 9,  type: 'product', label: 'VELA Toner', x: 0.63, y: 0.72,
      detail: 'VELA Nước hoa hồng\n200ml · Vegan\nBatch: VELA-2026-003' },
    { id: 10, type: 'carbon',  label: 'CarbonRec #1',  x: 0.52, y: 0.30,
      detail: 'Carbon Record\nStage: Cultivation\nCO₂e: 8.4 kg' },
    { id: 11, type: 'carbon',  label: 'CarbonRec #2',  x: 0.50, y: 0.60,
      detail: 'Carbon Record\nStage: Extraction\nCO₂e: 3.2 kg' },
    { id: 12, type: 'passport',label: 'Passport QR-1', x: 0.82, y: 0.30,
      detail: 'Green Passport\nQR: BGC-LP-001\nVerified: SGS ✓' },
    { id: 13, type: 'passport',label: 'Passport QR-2', x: 0.85, y: 0.60,
      detail: 'Green Passport\nQR: BGC-TB-001\nVerified: TÜV ✓' },
  ];

  const EDGE_DATA = [
    [0,3],[0,4],[3,5],[5,4],[5,6],[6,7],[6,8],[6,9],
    [1,5],[2,5],[4,10],[6,11],[7,10],[7,12],[8,11],[9,13],
    [10,11],[12,13],[3,10],
  ];

  function init() {
    resize();
    nodes = NODE_DATA.map(d => ({
      ...d,
      px: d.x * W, py: d.y * H,
      vx: 0, vy: 0,
      pulsePhase: Math.random() * Math.PI * 2,
    }));
    edges = EDGE_DATA.map(([a, b]) => ({ from: a, to: b }));
  }

  function resize() {
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = W * window.devicePixelRatio;
    canvas.height = H * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  function isVisible(node) {
    if (filter === 'all') return true;
    return node.type === filter;
  }

  function drawFrame() {
    time += 0.016;
    ctx.clearRect(0, 0, W, H);

    // Draw edges
    edges.forEach(({ from, to }) => {
      const a = nodes[from], b = nodes[to];
      if (!isVisible(a) || !isVisible(b)) return;

      const grad = ctx.createLinearGradient(a.px, a.py, b.px, b.py);
      const ca = NODE_TYPES[a.type].color;
      const cb = NODE_TYPES[b.type].color;

      // Flowing particle on edge
      const t = (Math.sin(time * 1.5 + from * 0.7) + 1) / 2;
      const px = a.px + (b.px - a.px) * t;
      const py = a.py + (b.py - a.py) * t;

      grad.addColorStop(0, ca + '22');
      grad.addColorStop(0.5, ca + '44');
      grad.addColorStop(1, cb + '22');

      ctx.beginPath();
      ctx.moveTo(a.px, a.py);
      ctx.lineTo(b.px, b.py);
      ctx.strokeStyle = grad;
      ctx.lineWidth = hoveredNode && (hoveredNode.id === from || hoveredNode.id === to) ? 2 : 1;
      ctx.stroke();

      // Flow particle
      ctx.beginPath();
      ctx.arc(px, py, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = ca;
      ctx.globalAlpha = 0.8;
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    // Draw nodes
    nodes.forEach(node => {
      if (!isVisible(node)) return;
      const typ = NODE_TYPES[node.type];
      const isHovered = hoveredNode && hoveredNode.id === node.id;
      const pulse = Math.sin(time * 1.8 + node.pulsePhase) * 0.3 + 0.7;
      const r = typ.size * (isHovered ? 1.5 : 1) * pulse;

      // Glow
      if (isHovered || node.type === 'farmer') {
        const glow = ctx.createRadialGradient(node.px, node.py, 0, node.px, node.py, r * 3);
        glow.addColorStop(0, typ.color + '40');
        glow.addColorStop(1, typ.color + '00');
        ctx.beginPath();
        ctx.arc(node.px, node.py, r * 3, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
      }

      // Node circle
      ctx.beginPath();
      ctx.arc(node.px, node.py, r, 0, Math.PI * 2);
      const cGrad = ctx.createRadialGradient(node.px - r * 0.3, node.py - r * 0.3, 0, node.px, node.py, r);
      cGrad.addColorStop(0, typ.color + 'ff');
      cGrad.addColorStop(1, typ.color + 'aa');
      ctx.fillStyle = cGrad;
      ctx.fill();

      // Border
      ctx.strokeStyle = typ.color;
      ctx.lineWidth = isHovered ? 2 : 1;
      ctx.globalAlpha = 0.7;
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Label
      if (isHovered || r > 10) {
        ctx.font = `${isHovered ? 600 : 400} ${isHovered ? 12 : 9}px Outfit, sans-serif`;
        ctx.fillStyle = '#f0fdf4';
        ctx.textAlign = 'center';
        ctx.fillText(node.label, node.px, node.py + r + 14);
      }
    });

    animFrame = requestAnimationFrame(drawFrame);
  }

  // Mouse hover
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    hoveredNode = null;
    for (const node of nodes) {
      if (!isVisible(node)) continue;
      const dx = node.px - mx, dy = node.py - my;
      if (Math.sqrt(dx * dx + dy * dy) < 20) {
        hoveredNode = node;
        break;
      }
    }
    updateInfoPanel();
    canvas.style.cursor = hoveredNode ? 'pointer' : 'crosshair';
  });

  canvas.addEventListener('mouseleave', () => {
    hoveredNode = null;
    updateInfoPanel();
  });

  function updateInfoPanel() {
    const panel = qs('#graphInfo');
    if (!panel) return;
    if (hoveredNode) {
      const typ = NODE_TYPES[hoveredNode.type];
      panel.querySelector('.gip-title').textContent = hoveredNode.label;
      panel.querySelector('.gip-title').style.color = typ.color;
      panel.querySelector('.gip-body').textContent = hoveredNode.detail;
    } else {
      panel.querySelector('.gip-title').textContent = 'Hover vào Node để xem chi tiết';
      panel.querySelector('.gip-title').style.color = '#10b981';
      panel.querySelector('.gip-body').textContent = 'Chọn một node trong mạng lưới để xem thông tin chi tiết về nút đó trong chuỗi cung ứng BGC.';
    }
  }

  // Filter buttons
  qsa('.graph-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      qsa('.graph-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filter = btn.dataset.filter;
    });
  });

  // Start
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { init(); drawFrame(); obs.unobserve(e.target); }
    });
  }, { threshold: 0.3 });
  obs.observe(canvas);

  window.addEventListener('resize', () => { resize(); init(); });

  return { nodes, edges };
})();

// ==================== GREEN PASSPORT SCANNER ====================
(function initPassportScanner() {
  const scanBtn = qs('#scanBtn');
  const resetBtn = qs('#resetBtn');
  const psReady = qs('#psReady');
  const psScanning = qs('#psScanning');
  const psResult = qs('#psResult');
  const co2Counter = qs('#co2Counter');

  if (!scanBtn) return;

  function animateCO2() {
    if (!co2Counter) return;
    const target = 12.7;
    const duration = 1800;
    const start = performance.now();
    function step(now) {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 2);
      co2Counter.textContent = (ease * target).toFixed(1);
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  scanBtn.addEventListener('click', () => {
    scanBtn.style.display = 'none';
    psReady.style.display = 'none';
    psScanning.style.display = 'flex';

    setTimeout(() => {
      psScanning.style.display = 'none';
      psResult.style.display = 'flex';
      resetBtn.style.display = 'inline-flex';
      animateCO2();
    }, 2800);
  });

  resetBtn.addEventListener('click', () => {
    psResult.style.display = 'none';
    psScanning.style.display = 'none';
    psReady.style.display = 'flex';
    scanBtn.style.display = 'inline-flex';
    resetBtn.style.display = 'none';
    if (co2Counter) co2Counter.textContent = '0.0';
  });

  // Make ps-state elements flex-column compatible
  [psReady, psScanning, psResult].forEach(el => {
    if (el) el.style.flexDirection = 'column';
  });
})();

// ==================== MAP INTERACTION ====================
(function initMap() {
  const dotDT = qs('#dongThap');
  const dotLA = qs('#longAn');
  const tooltip = qs('#mapTooltip');
  const zDT = qs('#zDongThap');
  const zLA = qs('#zLongAn');
  const mtTitle = qs('#mtTitle');

  const zoneData = {
    dongThap: {
      title: 'Đồng Tháp',
      stats: [['Diện tích', '48 ha'], ['Nông dân', '12 hộ'], ['Sản lượng', '2.4 tấn/vụ'], ['CO₂e', '8.4 kg/kg sp']],
    },
    longAn: {
      title: 'Long An',
      stats: [['Diện tích', '32 ha'], ['Nông dân', '8 hộ'], ['Sản lượng', '1.8 tấn/vụ'], ['CO₂e', '9.1 kg/kg sp']],
    },
  };

  function showTooltip(zone) {
    if (!tooltip || !mtTitle) return;
    const d = zoneData[zone];
    mtTitle.textContent = d.title;
    const rows = tooltip.querySelectorAll('.mt-stat');
    rows.forEach((r, i) => {
      if (d.stats[i]) {
        r.children[0].textContent = d.stats[i][0] + ':';
        r.children[1].textContent = d.stats[i][1];
      }
    });
    tooltip.style.display = 'block';
  }

  if (dotDT) {
    dotDT.addEventListener('mouseenter', () => { showTooltip('dongThap'); zDT && zDT.classList.add('active'); });
    dotDT.addEventListener('mouseleave', () => { tooltip && (tooltip.style.display = 'none'); zDT && zDT.classList.remove('active'); });
  }
  if (dotLA) {
    dotLA.addEventListener('mouseenter', () => { showTooltip('longAn'); zLA && zLA.classList.add('active'); });
    dotLA.addEventListener('mouseleave', () => { tooltip && (tooltip.style.display = 'none'); zLA && zLA.classList.remove('active'); });
  }
})();

// ==================== CONFETTI ====================
(function initConfetti() {
  const btn = qs('#confettiBtn');
  const canvas = qs('#confettiCanvas');
  if (!btn || !canvas) return;
  const ctx = canvas.getContext('2d');
  let pieces = [], running = false, animId;

  class Piece {
    constructor() { this.reset(true); }
    reset(fromTop = false) {
      this.x = Math.random() * canvas.width;
      this.y = fromTop ? -10 : Math.random() * canvas.height;
      this.w = Math.random() * 10 + 5;
      this.h = Math.random() * 6 + 3;
      this.vx = (Math.random() - 0.5) * 4;
      this.vy = Math.random() * 4 + 2;
      this.angle = Math.random() * Math.PI * 2;
      this.va = (Math.random() - 0.5) * 0.2;
      const colors = ['#10b981','#f472b6','#06b6d4','#f59e0b','#6366f1','#fff'];
      this.color = colors[Math.floor(Math.random() * colors.length)];
    }
    update() {
      this.x += this.vx; this.y += this.vy; this.angle += this.va;
      if (this.y > canvas.height + 20) this.reset(true);
    }
    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      ctx.fillStyle = this.color;
      ctx.globalAlpha = 0.85;
      ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
      ctx.restore();
    }
  }

  function resize() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  }

  function run() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => { p.update(); p.draw(); });
    ctx.globalAlpha = 1;
    animId = requestAnimationFrame(run);
  }

  btn.addEventListener('click', () => {
    if (running) return;
    running = true;
    resize();
    pieces = Array.from({ length: 120 }, () => new Piece());
    run();
    setTimeout(() => {
      cancelAnimationFrame(animId);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces = [];
      running = false;
    }, 5000);
  });
})();

// ==================== PARALLAX SCROLL ====================
(function initParallax() {
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    qsa('.parallax-leaf').forEach((el, i) => {
      const speed = 0.05 + i * 0.02;
      el.style.transform = `translateY(${scrollY * speed}px) rotate(${scrollY * 0.01}deg)`;
    });
  }, { passive: true });
})();

// ==================== PIPELINE NODE ANIMATION ====================
(function initPipeline() {
  const nodes = qsa('.pipe-node');
  let current = 0;
  setInterval(() => {
    nodes.forEach(n => n.classList.remove('active'));
    nodes[current].classList.add('active');
    current = (current + 1) % nodes.length;
  }, 1500);
})();

// ==================== SMOOTH SCROLL NAV ====================
qsa('.nav-link, .btn[href^="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    const href = link.getAttribute('href');
    if (href && href.startsWith('#')) {
      e.preventDefault();
      const target = qs(href);
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// ==================== ESG RINGS ANIMATION ====================
(function initESGRings() {
  const rings = [
    { el: qs('.ring-env'), full: 565.5, pct: 0.4 },
    { el: qs('.ring-soc'), full: 427.3, pct: 0.2 },
    { el: qs('.ring-gov'), full: 295.3, pct: 0.4 },
  ];
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        rings.forEach(({ el, full, pct }) => {
          if (!el) return;
          el.style.strokeDasharray = `${full * pct} ${full}`;
          el.style.transition = 'stroke-dasharray 1.5s cubic-bezier(0.4,0,0.2,1)';
        });
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.5 });
  const esgWrap = qs('.esg-chart-wrap');
  if (esgWrap) obs.observe(esgWrap);
})();

// ==================== TYPING EFFECT ================
(function initTyping() {
  const field = qs('#typingField');
  if (!field) return;
  const values = ['4.2', '4.8', '3.9', '5.1', '4.2'];
  let i = 0;
  setInterval(() => {
    i = (i + 1) % values.length;
    const cursor = field.querySelector('.cursor');
    field.textContent = values[i];
    if (cursor) field.appendChild(cursor);
    else { const c = document.createElement('span'); c.className = 'cursor'; c.textContent = '|'; field.appendChild(c); }
  }, 2000);
})();

console.log('%cBGC · BIO-GRAPH CIRCULAR', 'color:#10b981;font-size:18px;font-weight:bold');
console.log('%cNhóm SENergy · ĐH Văn Lang', 'color:#f472b6;font-size:12px');
