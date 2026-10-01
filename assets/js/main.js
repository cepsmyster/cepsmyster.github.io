(function () {
  'use strict';
  var doc = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var raf = window.requestAnimationFrame.bind(window);

  // ---------- Dubai clock ----------
  var clocks = document.querySelectorAll('[data-clock]');
  if (clocks.length) {
    var fmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Dubai' });
    var tick = function () { var t = fmt.format(new Date()); clocks.forEach(function (c) { c.textContent = t; }); };
    tick();
    setInterval(tick, 20000);
  }

  // ---------- Split headings into words that rise out of a mask ----------
  // Text is split per word; an inline element (an <em> or <sup>) moves as one piece.
  document.querySelectorAll('[data-split]').forEach(function (el) {
    if (el.querySelector('.w')) { // already split at build time
      el.querySelectorAll('.w > span').forEach(function (s, i) { s.style.setProperty('--k', i); });
      return;
    }
    var k = 0, out = document.createDocumentFragment();
    var wrap = function (node) {
      var w = document.createElement('span'), inner = document.createElement('span');
      w.className = 'w'; inner.style.setProperty('--k', k++);
      inner.appendChild(node); w.appendChild(inner);
      return w;
    };
    Array.prototype.slice.call(el.childNodes).forEach(function (n) {
      if (n.nodeType === 3) {
        n.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          out.appendChild(/^\s+$/.test(part) ? document.createTextNode(' ') : wrap(document.createTextNode(part)));
        });
      } else if (n.nodeName === 'BR') {
        out.appendChild(n);
      } else {
        out.appendChild(wrap(n));
      }
    });
    el.textContent = '';
    el.appendChild(out);
  });

  // ---------- Pen-tool underlines under <em> ----------
  // Every emphasised word gets its own abstract Bezier stroke in one of four
  // colours, drawn in when it comes into view, with square anchor points at
  // both ends and handles that show on hover.
  var UL_COLOURS = ['#2f5bff', '#ff5a36', '#14b37d', '#f4b400'];
  document.querySelectorAll('em').forEach(function (em, n) {
    if (em.querySelector('.pen-ul')) return;
    var r = function (a, b) { return a + Math.random() * (b - a); };
    var y1 = r(9, 15), y2 = r(5, 13), c1x = r(18, 40), c1y = r(18, 26), c2x = r(55, 80), c2y = r(-6, 4);
    var d = 'M1 ' + y1.toFixed(1) + ' C ' + c1x.toFixed(1) + ' ' + c1y.toFixed(1) + ', ' + c2x.toFixed(1) + ' ' + c2y.toFixed(1) + ', 99 ' + y2.toFixed(1);
    var ul = document.createElement('span');
    ul.className = 'pen-ul';
    ul.setAttribute('aria-hidden', 'true');
    ul.innerHTML = '<svg viewBox="0 0 100 20" preserveAspectRatio="none"><path pathLength="1" d="' + d + '"/>' +
      '<line x1="1" y1="' + y1.toFixed(1) + '" x2="' + c1x.toFixed(1) + '" y2="' + c1y.toFixed(1) + '"/>' +
      '<line x1="99" y1="' + y2.toFixed(1) + '" x2="' + c2x.toFixed(1) + '" y2="' + c2y.toFixed(1) + '"/></svg>' +
      '<i style="left:1%;top:' + (y1 * 5) + '%"></i><i style="left:99%;top:' + (y2 * 5) + '%"></i>' +
      '<i class="h" style="left:' + c1x + '%;top:' + (c1y * 5) + '%"></i><i class="h" style="left:' + c2x + '%;top:' + (c2y * 5) + '%"></i>';
    em.style.setProperty('--ul', UL_COLOURS[n % UL_COLOURS.length]);
    em.appendChild(ul);
  });
  var ems = document.querySelectorAll('em');
  if ('IntersectionObserver' in window && !reduce) {
    var eio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        setTimeout(function () { e.target.classList.add('drawn'); }, 450);
        eio.unobserve(e.target);
      });
    }, { threshold: 1 });
    ems.forEach(function (em) { eio.observe(em); });
  } else {
    ems.forEach(function (em) { em.classList.add('drawn'); });
  }

  // ---------- Reveal on scroll ----------
  var revealables = document.querySelectorAll('[data-split], [data-reveal], [data-fade]');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.01 });
    revealables.forEach(function (el) { io.observe(el); });
  } else {
    revealables.forEach(function (el) { el.classList.add('is-in'); });
  }

  // ---------- Hero name: fit "Serafin" to the full width ----------
  var hero = document.querySelector('.hero');
  var heroName = document.querySelector('.hero-name');
  if (heroName) {
    var fitName = function () {
      var word = heroName.querySelector('.hn-2 .hn-word');
      heroName.style.fontSize = '100px';
      var w = word.getBoundingClientRect().width;
      if (!w) return;
      // Fill the width, but keep both lines and the intro on the first screen.
      var byWidth = 100 * heroName.clientWidth / w * 0.995;
      var cs = getComputedStyle(heroName);
      var rest = hero.querySelector('.hero-top').offsetHeight + hero.querySelector('.hero-foot').offsetHeight +
        parseFloat(getComputedStyle(hero).paddingTop) + parseFloat(getComputedStyle(hero).paddingBottom) +
        parseFloat(cs.marginTop) + parseFloat(cs.marginBottom);
      var byHeight = (window.innerHeight - rest) / 1.62;
      heroName.style.fontSize = Math.max(60, Math.min(byWidth, window.innerWidth > 760 ? byHeight : byWidth)) + 'px';
    };
    fitName();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitName);
    var rt;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(fitName, 100); });
    var path = heroName.querySelector('.hn-path path');
    if (path) path.setAttribute('pathLength', '1');
  }

  // ---------- Loader (first visit to the home page in a session) ----------
  var loader = document.querySelector('.loader');
  var start = function () { if (hero) hero.classList.add('is-ready'); };
  var seen = false;
  try { seen = sessionStorage.getItem('cs-loaded') === '1'; sessionStorage.setItem('cs-loaded', '1'); } catch (e) {}
  if (loader && !seen && !reduce) {
    document.body.style.overflow = 'hidden';
    var count = loader.querySelector('[data-count]'), t0 = performance.now(), dur = 2200;
    var step = function (now) {
      var p = Math.min(1, (now - t0) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      count.textContent = Math.round(eased * 100);
      if (p < 1) return raf(step);
      setTimeout(function () {
        loader.classList.add('is-done');
        document.body.style.overflow = '';
        setTimeout(start, 350);
        setTimeout(function () { loader.remove(); }, 1200);
      }, 250);
    };
    raf(step);
  } else {
    if (loader) loader.classList.add('is-skipped');
    raf(function () { raf(start); });
  }

  // ---------- Page wipe between internal pages ----------
  var wipe = document.querySelector('.wipe');
  var fromWipe = false;
  try { fromWipe = sessionStorage.getItem('cs-wipe') === '1'; sessionStorage.removeItem('cs-wipe'); } catch (e) {}
  if (wipe && fromWipe && !reduce) wipe.classList.add('is-out');
  window.addEventListener('pageshow', function (e) { if (e.persisted && wipe) wipe.className = 'wipe'; });
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a');
    if (!a || !wipe || reduce || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    var href = a.getAttribute('href');
    if (!href || a.target === '_blank' || a.hasAttribute('download') || /^(mailto:|tel:|#)/.test(href)) return;
    var url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.hash) return; // same-page anchor
    e.preventDefault();
    try { sessionStorage.setItem('cs-wipe', '1'); } catch (err) {}
    wipe.className = 'wipe is-in';
    setTimeout(function () { location.href = a.href; }, 520);
  });

  // ---------- Header hides on scroll down, returns on scroll up ----------
  var top = document.querySelector('.top'), lastY = window.scrollY;

  // ---------- Marquee: drifts on its own, speeds up with scroll ----------
  var track = document.querySelector('.mq-track');
  var mqX = 0, mqBoost = 0;

  // ---------- Parallax on the work tiles ----------
  var tiles = [].slice.call(document.querySelectorAll('.next-img img'));

  var onFrame = function () {
    var y = window.scrollY, dy = y - lastY;
    if (top) {
      if (y > 140 && dy > 2) top.classList.add('is-hidden');
      else if (dy < -2 || y < 140) top.classList.remove('is-hidden');
    }
    lastY = y;
    if (track && !reduce) {
      mqBoost += (Math.min(40, Math.abs(dy)) - mqBoost) * 0.1;
      mqX -= 0.6 + mqBoost * 0.35;
      var half = track.scrollWidth / 2;
      if (half && -mqX >= half) mqX += half;
      track.style.transform = 'translate3d(' + mqX.toFixed(2) + 'px,0,0)';
    }
    if (!reduce) {
      var vh = window.innerHeight;
      for (var i = 0; i < tiles.length; i++) {
        var box = tiles[i].parentNode.getBoundingClientRect();
        if (box.bottom < 0 || box.top > vh) continue;
        var prog = (box.top + box.height / 2 - vh / 2) / vh; // -1..1 around centre
        tiles[i].style.translate = '0 ' + (prog * -6).toFixed(2) + '%';
        tiles[i].style.scale = '1.12';
      }
    }
    raf(onFrame);
  };
  raf(onFrame);

  // ---------- Text scramble on hover ----------
  var glyphs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&*+/<>';
  document.querySelectorAll('[data-scramble]').forEach(function (el) {
    var node = el.firstChild;
    if (!node || node.nodeType !== 3) return;
    var original = node.textContent, running = false;
    el.addEventListener('mouseenter', function () {
      if (running || reduce) return;
      running = true;
      var frame = 0, total = original.length * 2 + 6;
      var run = function () {
        node.textContent = original.split('').map(function (ch, i) {
          if (ch === ' ' || i < (frame - 6) / 2) return ch;
          return glyphs[Math.floor(Math.random() * glyphs.length)];
        }).join('');
        if (++frame <= total) setTimeout(run, 28);
        else { node.textContent = original; running = false; }
      };
      run();
    });
  });

  // ---------- Pen-tool cursor ----------
  // A pen nib follows the pointer and lays down a Bézier path with square
  // anchor points as you move, the way the Pen tool does in Illustrator.
  if (finePointer && !reduce) {
    doc.classList.add('has-pen');
    var pen = document.createElement('div');
    pen.className = 'pen';
    pen.setAttribute('aria-hidden', 'true');
    pen.innerHTML = '<svg viewBox="0 0 30 30"><path class="pen-body" d="M1 1 L11 27 L15 21 L21 26 L26 21 L21 15 L27 11 Z"/><circle class="pen-body" cx="9" cy="9" r="2.2"/><path class="pen-mod" d="M20 4h8M24 0v8"/></svg><span class="pen-label"></span>';
    document.body.appendChild(pen);
    var label = pen.querySelector('.pen-label');

    var canvas = document.createElement('canvas');
    canvas.className = 'pen-trail';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);
    var ctx = canvas.getContext('2d'), dpr = 1;
    var size = function () {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;
      canvas.style.width = innerWidth + 'px'; canvas.style.height = innerHeight + 'px';
    };
    size();
    window.addEventListener('resize', size);

    var mx = -100, my = -100, px = -100, py = -100;
    var anchors = []; // {x, y, t}
    var lastAnchor = null;
    var LIFE = 900, GAP = 70;
    var accent = getComputedStyle(doc).getPropertyValue('--accent').trim() || '#2f5bff';

    window.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      pen.classList.remove('is-hidden');
      var now = performance.now();
      if (!lastAnchor || Math.hypot(mx - lastAnchor.x, my - lastAnchor.y) > GAP) {
        lastAnchor = { x: mx, y: my, t: now };
        anchors.push(lastAnchor);
        if (anchors.length > 12) anchors.shift();
      }
    }, { passive: true });
    document.addEventListener('mouseleave', function () { pen.classList.add('is-hidden'); });
    window.addEventListener('mousedown', function (e) {
      pen.classList.add('is-down');
      var dot = document.createElement('i');
      dot.className = 'pen-dot';
      dot.style.left = e.clientX + 'px'; dot.style.top = e.clientY + 'px';
      document.body.appendChild(dot);
      setTimeout(function () { dot.remove(); }, 1200);
    });
    window.addEventListener('mouseup', function () { pen.classList.remove('is-down'); });

    document.addEventListener('mouseover', function (e) {
      var t = e.target.closest('a, button, [data-cursor]');
      var text = t && t.getAttribute('data-cursor');
      pen.classList.toggle('is-link', !!t && !text);
      pen.classList.toggle('has-label', !!text);
      if (text) label.textContent = text;
    });

    var draw = function (now) {
      px += (mx - px) * 0.35; py += (my - py) * 0.35;
      pen.style.transform = 'translate3d(' + px + 'px,' + py + 'px,0)';

      while (anchors.length && now - anchors[0].t > LIFE) anchors.shift();
      if (!anchors.length || anchors[anchors.length - 1] !== lastAnchor) lastAnchor = anchors[anchors.length - 1] || null;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      var pts = anchors.concat([{ x: px, y: py, t: now }]);
      if (pts.length > 1) {
        // Catmull-Rom through the anchors, drawn as cubic Béziers.
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = accent;
        for (var i = 0; i < pts.length - 1; i++) {
          var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
          var c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6;
          var c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6;
          ctx.globalAlpha = Math.max(0, 1 - (now - p1.t) / LIFE);
          ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.bezierCurveTo(c1x, c1y, c2x, c2y, p2.x, p2.y); ctx.stroke();
        }
        // Handles on the newest anchor.
        var a = anchors[anchors.length - 1], b = anchors[anchors.length - 2];
        if (a && b) {
          var hx = (px - b.x) / 6, hy = (py - b.y) / 6;
          ctx.globalAlpha = Math.max(0, 1 - (now - a.t) / LIFE);
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(a.x - hx, a.y - hy); ctx.lineTo(a.x + hx, a.y + hy); ctx.stroke();
          ctx.fillStyle = accent;
          [[a.x - hx, a.y - hy], [a.x + hx, a.y + hy]].forEach(function (h) { ctx.beginPath(); ctx.arc(h[0], h[1], 2.5, 0, 6.3); ctx.fill(); });
        }
        // Square anchor points.
        anchors.forEach(function (p) {
          ctx.globalAlpha = Math.max(0, 1 - (now - p.t) / LIFE);
          ctx.fillStyle = '#fff'; ctx.fillRect(p.x - 3.5, p.y - 3.5, 7, 7);
          ctx.strokeStyle = accent; ctx.lineWidth = 1.5; ctx.strokeRect(p.x - 3.5, p.y - 3.5, 7, 7);
        });
        ctx.globalAlpha = 1;
      }
      raf(draw);
    };
    raf(draw);
  }

  // ---------- Videos play only while on screen, always muted ----------
  var clips = document.querySelectorAll('video[data-autoplay]');
  if (clips.length && 'IntersectionObserver' in window) {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting && !reduce) { v.preload = 'auto'; var p = v.play(); if (p && p.catch) p.catch(function () {}); }
        else v.pause();
      });
    }, { threshold: 0.25 });
    clips.forEach(function (v) { v.muted = true; vio.observe(v); });
  }
})();
