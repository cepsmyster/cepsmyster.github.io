(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Dubai clock in the header ----------
  var clocks = document.querySelectorAll('[data-clock]');
  if (clocks.length) {
    var fmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Dubai' });
    var tick = function () { var t = fmt.format(new Date()); clocks.forEach(function (c) { c.textContent = t; }); };
    tick();
    setInterval(tick, 20000);
  }

  // ---------- Email set to one line across the column ----------
  var mail = document.querySelector('.mail');
  if (mail) {
    var fitMail = function () {
      mail.style.fontSize = '100px';
      var w = mail.getBoundingClientRect().width, avail = mail.parentNode.clientWidth;
      if (w) mail.style.fontSize = Math.min(120, 100 * avail / w * 0.98) + 'px';
    };
    fitMail();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitMail);
    window.addEventListener('resize', fitMail);
  }

  // ---------- Hero: four plates printing the name ----------
  var press = document.querySelector('.press');
  if (press) {
    var plates = {
      y: press.querySelector('.p-y'), m: press.querySelector('.p-m'),
      c: press.querySelector('.p-c'), k: press.querySelector('.p-k')
    };

    // Size the type so the longer line ("Serafin") fills the column exactly.
    var fit = function () {
      var line = plates.k.querySelector('.l2');
      var avail = press.clientWidth;
      press.style.fontSize = '100px';
      var w = line.getBoundingClientRect().width;
      if (w) press.style.fontSize = (100 * avail / w) + 'px';
    };
    fit();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
    var rt;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(fit, 100); });

    var set = function (el, dx, dy) { el.style.setProperty('--dx', dx.toFixed(4)); el.style.setProperty('--dy', dy.toFixed(4)); };

    if (reduce) {
      press.classList.add('inked');
    } else {
      // Each colour plate starts out of register and springs into place, in press order: Y, M, C, then K.
      var state = {
        y: { x: -0.05, y: 0.035, vx: 0, vy: 0, at: 80 },
        m: { x: 0.06, y: -0.03, vx: 0, vy: 0, at: 330 },
        c: { x: -0.035, y: -0.05, vx: 0, vy: 0, at: 580 },
        k: { x: 0.02, y: 0.02, vx: 0, vy: 0, at: 900 }
      };
      // How strongly each plate lags behind the pointer once printed, so fast moves fringe the edges.
      var lag = { y: 0.9, m: -0.7, c: 0.5, k: 0 };
      var t0 = performance.now();
      Object.keys(state).forEach(function (k) {
        plates[k].style.opacity = '0';
        set(plates[k], state[k].x, state[k].y);
      });
      press.classList.add('inked');

      var push = { x: 0, y: 0 }, last = null, frames = 0;
      window.addEventListener('pointermove', function (e) {
        if (last) {
          push.x += Math.max(-60, Math.min(60, e.clientX - last.x)) / 6000;
          push.y += Math.max(-60, Math.min(60, e.clientY - last.y)) / 6000;
        }
        last = { x: e.clientX, y: e.clientY };
      }, { passive: true });

      var visible = true;
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) loop(); }).observe(press);
      }

      var running = false;
      var step = function (now) {
        var t = now - t0, moving = false;
        Object.keys(state).forEach(function (k) {
          var s = state[k];
          if (t < s.at) return;
          var tx = push.x * lag[k], ty = push.y * lag[k];
          // critically damped-ish spring towards register
          s.vx += (tx - s.x) * 0.09; s.vy += (ty - s.y) * 0.09;
          s.vx *= 0.72; s.vy *= 0.72;
          s.x += s.vx; s.y += s.vy;
          if (Math.abs(s.x - tx) > 0.0004 || Math.abs(s.y - ty) > 0.0004 || Math.abs(s.vx) > 0.0002) moving = true;
          set(plates[k], s.x, s.y);
          // Colour plates fade out once in register so no fringe is left around the black.
          var d = Math.sqrt(s.x * s.x + s.y * s.y);
          plates[k].style.opacity = (k === 'k' || t < 1500) ? '1' : Math.min(1, d / 0.004).toFixed(3);
        });
        push.x *= 0.9; push.y *= 0.9;
        if (Math.abs(push.x) > 0.0005 || Math.abs(push.y) > 0.0005) moving = true;
        if (t < 1700) moving = true;
        frames++;
        if (moving && visible) requestAnimationFrame(step); else running = false;
      };
      var loop = function () { if (!running) { running = true; requestAnimationFrame(step); } };
      loop();
      window.addEventListener('pointermove', loop, { passive: true });
    }
  }

  // ---------- Work index: image follows the cursor ----------
  var peek = document.querySelector('.peek');
  if (peek && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var pimg = peek.querySelector('img');
    var pos = { x: 0, y: 0 }, cur = { x: 0, y: 0 }, on = false, raf = 0;
    var move = function () {
      cur.x += (pos.x - cur.x) * (reduce ? 1 : 0.2);
      cur.y += (pos.y - cur.y) * (reduce ? 1 : 0.2);
      peek.style.transform = 'translate(' + (cur.x + 28) + 'px,' + (cur.y - peek.offsetHeight / 2) + 'px)';
      if (on && (Math.abs(pos.x - cur.x) > 0.5 || Math.abs(pos.y - cur.y) > 0.5)) raf = requestAnimationFrame(move); else raf = 0;
    };
    document.querySelectorAll('[data-peek]').forEach(function (a) {
      a.addEventListener('pointerenter', function (e) {
        pimg.src = a.getAttribute('data-peek');
        if (!on) { cur.x = pos.x = e.clientX; cur.y = pos.y = e.clientY; }
        on = true; peek.classList.add('on');
        if (!raf) raf = requestAnimationFrame(move);
      });
      a.addEventListener('pointerleave', function () { on = false; peek.classList.remove('on'); });
      a.addEventListener('pointermove', function (e) {
        pos.x = e.clientX; pos.y = e.clientY;
        if (!raf) raf = requestAnimationFrame(move);
      });
    });
  }

  // ---------- Clips play while on screen ----------
  var clips = document.querySelectorAll('video[data-autoplay]');
  clips.forEach(function (v) {
    if (reduce || !('IntersectionObserver' in window)) { v.controls = true; v.preload = 'metadata'; return; }
    new IntersectionObserver(function (en) {
      en.forEach(function (x) {
        if (x.isIntersecting) { var p = v.play(); if (p && p.catch) p.catch(function () { v.controls = true; }); }
        else v.pause();
      });
    }, { threshold: 0.25 }).observe(v);
  });
})();
