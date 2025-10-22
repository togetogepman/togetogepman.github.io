// Floating outline circles overlay (non-interactive)
// - Fullscreen fixed SVG overlay
// - 32 circles with transparent fill and semi-transparent #d8d8d8 stroke
// - Gentle drifting with sine-based wobble; no mouse interaction

(function () {
  const CIRCLE_COUNT = 32;
  const STROKE_COLOR = '#d8d8d8'; // brightness 216
  const STROKE_OPACITY = 0.45; // semi-transparent
  const STROKE_WIDTH = 1.5;
  const MIN_RADIUS = 8;
  const MAX_RADIUS = 16;
  const BASE_SPEED_MIN = 2;  // px/sec
  const BASE_SPEED_MAX = 4;  // px/sec (max speed set to 6)
  const WOBBLE_AMP_MIN = 8;  // px
  const WOBBLE_AMP_MAX = 32; // px
  const WOBBLE_FREQ_MIN = 0.02; // Hz
  const WOBBLE_FREQ_MAX = 0.15; // Hz
  const PULSE_AMP = 0.08;      // ±percentage of radius
  const PULSE_FREQ_MIN = 0.05; // Hz
  const PULSE_FREQ_MAX = 0.15; // Hz

  function onReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  }

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function rand(min, max) { return min + Math.random() * (max - min); }
  function randInt(min, max) { return Math.floor(rand(min, max + 1)); }
  function pick(arr) { return arr[randInt(0, arr.length - 1)]; }

  onReady(() => {
    try {
      // Respect reduced motion preference
      const prm = (typeof window !== 'undefined' && window.matchMedia)
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null;
      let motionScale = prm && prm.matches ? 0.35 : 1; // slow down if reduced
      // Create container
      const container = document.createElement('div');
      container.setAttribute('data-overlay', 'floating-circles');
      Object.assign(container.style, {
        position: 'fixed',
        inset: '0',
        zIndex: '0',
        pointerEvents: 'none',
        overflow: 'hidden',
        background: 'transparent',
        mixBlendMode: 'normal'
      });

      // Create SVG full-viewport
      const svgNS = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(svgNS, 'svg');
      svg.setAttribute('xmlns', svgNS);
      svg.setAttribute('version', '1.1');
      svg.setAttribute('width', '100%');
      svg.setAttribute('height', '100%');
      svg.setAttribute('preserveAspectRatio', 'none');
      svg.style.display = 'block';
      svg.style.width = '100%';
      svg.style.height = '100%';
      svg.style.opacity = '1';

      // Layers so that lines sit under circles
      const gLines = document.createElementNS(svgNS, 'g');
      const gCircles = document.createElementNS(svgNS, 'g');
      svg.appendChild(gLines);
      svg.appendChild(gCircles);

      container.appendChild(svg);
      document.body.appendChild(container);

      // Track viewport size
      let vw = container.clientWidth || window.innerWidth;
      let vh = container.clientHeight || window.innerHeight;
      svg.setAttribute('viewBox', `0 0 ${vw} ${vh}`);

      const doResize = () => {
        vw = container.clientWidth || window.innerWidth;
        vh = container.clientHeight || window.innerHeight;
        svg.setAttribute('viewBox', `0 0 ${vw} ${vh}`);
      };
      let resizeScheduled = false;
      const onResize = () => {
        if (resizeScheduled) return;
        resizeScheduled = true;
        requestAnimationFrame(() => {
          resizeScheduled = false;
          doResize();
        });
      };
      window.addEventListener('resize', onResize, { passive: true });

      // Circle state
      const circles = [];
      const lines = [];

      for (let i = 0; i < CIRCLE_COUNT; i++) {
        const r0 = rand(MIN_RADIUS, MAX_RADIUS);
        const x0 = rand(0, vw);
        const y0 = rand(0, vh);
        const angle = rand(0, Math.PI * 2);
        const speed = rand(BASE_SPEED_MIN, BASE_SPEED_MAX);
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        const wobbleAmpX = rand(WOBBLE_AMP_MIN, WOBBLE_AMP_MAX);
        const wobbleAmpY = rand(WOBBLE_AMP_MIN, WOBBLE_AMP_MAX);
        const wobbleFx = rand(WOBBLE_FREQ_MIN, WOBBLE_FREQ_MAX);
        const wobbleFy = rand(WOBBLE_FREQ_MIN, WOBBLE_FREQ_MAX);
        const wobblePhaseX = rand(0, Math.PI * 2);
        const wobblePhaseY = rand(0, Math.PI * 2);
        const pulseFreq = rand(PULSE_FREQ_MIN, PULSE_FREQ_MAX);
        const pulsePhase = rand(0, Math.PI * 2);

        const el = document.createElementNS(svgNS, 'circle');
        el.setAttribute('fill', 'none');
        el.setAttribute('stroke', STROKE_COLOR);
        el.setAttribute('stroke-opacity', String(STROKE_OPACITY));
        el.setAttribute('stroke-width', String(STROKE_WIDTH));
        el.setAttribute('cx', String(x0));
        el.setAttribute('cy', String(y0));
        el.setAttribute('r', String(r0));
        gCircles.appendChild(el);

        // Create a line element for this circle (nearest-neighbor connection)
        const ln = document.createElementNS(svgNS, 'line');
        ln.setAttribute('stroke', STROKE_COLOR);
        ln.setAttribute('stroke-opacity', String(STROKE_OPACITY));
        ln.setAttribute('stroke-width', String(STROKE_WIDTH));
        ln.setAttribute('x1', String(x0));
        ln.setAttribute('y1', String(y0));
        ln.setAttribute('x2', String(x0));
        ln.setAttribute('y2', String(y0));
        gLines.appendChild(ln);

        circles.push({
          el,
          x: x0,
          y: y0,
          r0,
          vx,
          vy,
          wobbleAmpX,
          wobbleAmpY,
          wobbleFx,
          wobbleFy,
          wobblePhaseX,
          wobblePhaseY,
          pulseFreq,
          pulsePhase,
          px: x0,
          py: y0
        });
        lines.push(ln);
      }

      // Animation loop
      let rafId = 0;
      let last = performance.now();
      const TWO_PI = Math.PI * 2;
      let frame = 0;

      // Visibility handling to save resources when tab is hidden
      let paused = false;
      const pause = () => {
        if (paused) return;
        paused = true;
        cancelAnimationFrame(rafId);
      };
      const resume = () => {
        if (!paused) return;
        paused = false;
        last = performance.now();
        rafId = requestAnimationFrame(step);
      };
      const onVisibility = () => {
        if (document.visibilityState === 'hidden') pause();
        else resume();
      };
      document.addEventListener('visibilitychange', onVisibility);

      // Watch reduced-motion changes
      const onPRMChange = (e) => { motionScale = e.matches ? 0.35 : 1; };
      if (prm) {
        if (typeof prm.addEventListener === 'function') prm.addEventListener('change', onPRMChange);
        else if (typeof prm.addListener === 'function') prm.addListener(onPRMChange);
      }

      function step(now) {
        const dtMs = now - last;
        last = now;
        const dt = (dtMs / 1000) * motionScale;
        frame++;

        // Pass 1: update circle positions and attributes
        for (let i = 0; i < circles.length; i++) {
          const c = circles[i];

          c.x += c.vx * dt;
          c.y += c.vy * dt;

          const margin = MAX_RADIUS + 8;
          if (c.x < -margin) c.x = vw + margin;
          if (c.x > vw + margin) c.x = -margin;
          if (c.y < -margin) c.y = vh + margin;
          if (c.y > vh + margin) c.y = -margin;

          const t = (now / 1000) * motionScale;
          const ox = Math.sin(TWO_PI * c.wobbleFx * t + c.wobblePhaseX) * c.wobbleAmpX;
          const oy = Math.cos(TWO_PI * c.wobbleFy * t + c.wobblePhaseY) * c.wobbleAmpY;

          const pulse = 1 + PULSE_AMP * Math.sin(TWO_PI * c.pulseFreq * t + c.pulsePhase);
          const r = clamp(c.r0 * pulse, MIN_RADIUS * 0.9, MAX_RADIUS * 1.1);

          c.px = c.x + ox;
          c.py = c.y + oy;
          c.el.setAttribute('cx', String(c.px));
          c.el.setAttribute('cy', String(c.py));
          c.el.setAttribute('r', String(r));
        }

        // Pass 2: connect each circle to its nearest neighbor (every other frame)
        if ((frame & 1) === 0) {
          for (let i = 0; i < circles.length; i++) {
            const ci = circles[i];
            let nearest = -1;
            let bestD2 = Infinity;
            for (let j = 0; j < circles.length; j++) {
              if (i === j) continue;
              const cj = circles[j];
              const dx = ci.px - cj.px;
              const dy = ci.py - cj.py;
              const d2 = dx * dx + dy * dy;
              if (d2 < bestD2) { bestD2 = d2; nearest = j; }
            }
            if (nearest >= 0) {
              const cj = circles[nearest];
              const ln = lines[i];
              ln.setAttribute('x1', String(ci.px));
              ln.setAttribute('y1', String(ci.py));
              ln.setAttribute('x2', String(cj.px));
              ln.setAttribute('y2', String(cj.py));
            }
          }
        }

        rafId = requestAnimationFrame(step);
      }

      rafId = requestAnimationFrame(step);

      const cleanup = () => {
        cancelAnimationFrame(rafId);
        window.removeEventListener('resize', onResize);
        document.removeEventListener('visibilitychange', onVisibility);
        if (prm) {
          if (typeof prm.removeEventListener === 'function') prm.removeEventListener('change', onPRMChange);
          else if (typeof prm.removeListener === 'function') prm.removeListener(onPRMChange);
        }
        if (container.parentNode) container.parentNode.removeChild(container);
      };
      window.addEventListener('beforeunload', cleanup, { once: true });
    } catch (e) {
      console && console.warn && console.warn('[bubbles.js] init failed:', e);
    }
  });
})();
