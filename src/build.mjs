// Builds the static site: index.html, work/<slug>.html and 404.html.
// Run from the repo root:  node src/build.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SITE, ABOUT, PROJECTS } from './data.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SIZES = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/images.json'), 'utf8'));
const VERSION = Date.now().toString(36);

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Plain descriptions for image alt text, keyed by image name.
const ALT = {
  home: 'Home page hero with the blueprint and render split by a draggable line',
  mobile: 'Home page on a phone', projects: 'Projects page hero', expertise: 'Expertise page',
  cover: 'Cover', divider: 'Section divider page', interiors: 'Interiors divider page', interiors2: 'Interiors divider page',
  azizi: 'Project spread', hospitality: 'Project spread', rox: 'Showroom project spread', lobby: 'Mall interior spread',
  landscape: 'Landscape divider page', towers: 'Towers divider page',
  marks: 'Logo, colour palette, pattern and typefaces', identity: 'Business cards, wall sign, folder, pens, bag and mug',
  logo: 'Logo on white and on black', mark: 'Fingerprint brand mark', pattern: 'Striped brand pattern',
  cards: 'Business cards', signage: 'Building signage', cars: 'Company car livery', bus: 'Bus livery', mug: 'Mug',
  vest: 'Safety vest', tid: 'TID brand identity cover', tidcolors: 'TID brand colours', tidcards: 'TID business cards',
  tidbus: 'TID bus livery', tidshirt: 'TID polo shirts', tidoveralls: 'TID overalls', tidhelmet: 'TID helmet', tidid: 'TID staff ID cards',
  countdown: 'Instagram story counting down two days to IPS 2026',
  reception: 'Reception concept render', ward: 'Twin patient room', room: 'Patient room', lounge: 'Patient room with lounge chair',
  bed: 'Bed area detail', detail: 'Bed control and call button details', door: 'Room door and signage',
  navy: 'Navy opening soon hoarding', navy2: 'Navy opening soon hoarding, second version', grand: 'Grand opening sign',
  soon: 'Light opening soon sign', site: 'Storefront mockup',
  emails: 'Eight email designs', stories: 'Instagram stories', phone: 'Social post shown on a phone',
  books: 'Magazine and booklet spreads', ramadan: 'Ramadan Games banner', earthday: 'Earth Day poster',
  posts: 'Instagram posts', ads: 'Social media ads', profiles: 'Company profile spreads', renova: 'ReNova360 print and phone mockup',
  brochures: 'Brochures and flyers', standee: 'Roll-up standee with a QR code', inside: 'Brochure page', mockup: 'Folded brochures on a table',
};

function img(slug, name, { sizes = '100vw', eager = false, alt, cls = '' } = {}, pre = '') {
  const key = `${slug}/${name}`;
  const s = SIZES[key];
  if (!s) throw new Error('missing image ' + key);
  const base = `${pre}assets/img/${slug}/${name}`;
  const w = Math.min(1600, s.w), h = Math.round(s.h * w / s.w);
  return `<img${cls ? ` class="${cls}"` : ''} src="${base}-1600.webp" srcset="${base}-800.webp 800w, ${base}-1600.webp ${w}w" sizes="${sizes}" width="${w}" height="${h}" alt="${esc(alt ?? ALT[name] ?? '')}"${eager ? ' fetchpriority="high"' : ' loading="lazy" decoding="async"'}>`;
}

function video(name, ratio, pre) {
  return `<video class="clip" style="aspect-ratio:${ratio}" src="${pre}assets/video/${name}.mp4" poster="${pre}assets/video/${name}.jpg" muted loop playsinline preload="none" data-autoplay aria-label="Video clip"></video>`;
}

const pad = n => String(n).padStart(2, '0');

// Split a heading into words so each can rise out of its own mask.
const words = t => esc(t).split(' ').map(w => `<span class="w"><span>${w}</span></span>`).join(' ');

const header = pre => `
<a class="skip" href="#main">Skip to content</a>
<header class="top">
  <a class="top-name" href="${pre || './'}" data-scramble>Carl Serafin<sup>©</sup></a>
  <p class="top-role"><span>${SITE.role}</span><span>${SITE.city} <span class="clock" data-clock aria-label="Local time in Dubai"></span></span></p>
  <nav class="top-nav" aria-label="Main">
    <a href="${pre}index.html#work" data-scramble>Work</a>
    <a href="${pre}index.html#about" data-scramble>About</a>
    <a href="${pre}index.html#contact" data-scramble>Contact</a>
  </nav>
</header>`;

const footer = pre => `
<footer class="foot" id="contact">
  <p class="foot-kicker">Got a brief, a deadline or just an idea?</p>
  <h2 class="foot-big"><a href="mailto:${SITE.email}" data-cursor="Email me">Let’s <em>make</em><br>something</a></h2>
  <p class="links"><a class="btn btn-dark" href="mailto:${SITE.email}">Email me</a> <a class="btn btn-dark" href="${SITE.whatsappLink}" rel="noopener">WhatsApp me</a></p>
  <div class="foot-row">
    <p><span class="lbl">Email</span><a href="mailto:${SITE.email}">${SITE.email}</a></p>
    <p><span class="lbl">WhatsApp</span><a href="${SITE.whatsappLink}" rel="noopener">${SITE.whatsapp}</a></p>
    <p><span class="lbl">Elsewhere</span><a href="${SITE.behance}" rel="me noopener">Behance</a></p>
    <p><span class="lbl">Based in</span>Dubai, UAE <span class="clock" data-clock></span></p>
    <p><span class="lbl">©</span>2026 ${SITE.fullName}</p>
    <p><a class="totop" href="#main">Back to top ↑</a></p>
  </div>
</footer>
<div class="wipe" aria-hidden="true"></div>
<script src="${pre}assets/js/main.js?v=${VERSION}" defer></script>`;

function page({ title, description, pre = '', body, cls = '', image, before = '' }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script>document.documentElement.classList.add('js')</script>
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="website">
${image ? `<meta property="og:image" content="${SITE.url}${image}">` : ''}
<meta name="theme-color" content="#eeece5">
<link rel="icon" href="${pre}assets/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..700;1,14..32,100..700&display=swap">
<link rel="stylesheet" href="${pre}assets/css/styles.css?v=${VERSION}">
</head>
<body class="${cls}">
${before}
${header(pre)}
<main id="main">
${body}
</main>
${footer(pre)}
</body>
</html>
`;
}

// ---------- Home ----------
// Tile shapes for the work grid, repeating: one wide, then pairs that swap sides.
const SHAPES = ['wide', 'big l', 'small r', 'small l', 'big r'];
const TILE_SIZES = { wide: '(min-width: 800px) 62vw, 100vw', big: '(min-width: 800px) 45vw, 100vw', small: '(min-width: 800px) 30vw, 100vw' };
const covers = PROJECTS.map(p => `assets/img/${p.slug}/${p.cover}-800.webp`);

// A small Mac Illustrator window: the Pen tool drawing a path on Artboard 1, on a loop (SVG/SMIL).
const AI_WINDOW = `
<span class="ai-bar"><i></i><i></i><i></i><span class="ai-tab">Portfolio.ai @ 100 % (RGB/Preview)</span></span>
<span class="ai-body">
  <span class="ai-tools">
    <svg viewBox="0 0 24 24"><path d="M7 3l11 10-5 .6 3 6-2 1-3-6-4 3z" fill="currentColor"/></svg>
    <svg viewBox="0 0 24 24"><path d="M7 3l11 10-5 .6 3 6-2 1-3-6-4 3z" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>
    <svg viewBox="0 0 24 24" class="on"><path d="M5 19l3-9 6-6 6 6-6 6-9 3zM8 10l6 6M11.5 12.5a1.5 1.5 0 1 0 0 .1" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>
    <svg viewBox="0 0 24 24"><path d="M5 5h14M12 5v15M9 20h6" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>
    <svg viewBox="0 0 24 24"><rect x="5" y="6" width="14" height="12" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>
    <svg viewBox="0 0 24 24"><path d="M4 20c5-1 6-6 9-9l4-4 2 2-4 4c-3 3-8 4-11 7z" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>
    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M12 5v14" stroke="currentColor"/></svg>
    <span class="ai-swatch"><i class="f"></i><i class="s"></i></span>
  </span>
  <span class="ai-canvas">
    <span class="ai-ab-label">01 - Artboard 1</span>
    <span class="ai-artboard">
      <svg viewBox="0 0 400 250">
        <path class="ai-guide" d="M40 190 C 90 40, 170 40, 200 125 S 310 210, 360 60"/>
        <path class="ai-stroke" pathLength="1" d="M40 190 C 90 40, 170 40, 200 125 S 310 210, 360 60">
          <animate attributeName="stroke-dashoffset" values="1;0;0" keyTimes="0;.55;1" dur="6s" repeatCount="indefinite"/>
        </path>
        <g class="ai-handles"><line x1="200" y1="125" x2="150" y2="50"/><line x1="200" y1="125" x2="250" y2="200"/><circle cx="150" cy="50" r="4"/><circle cx="250" cy="200" r="4"/>
          <animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;.25;.3;.9;1" dur="6s" repeatCount="indefinite"/></g>
        <rect class="ai-anchor" x="35" y="185" width="10" height="10"><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.02;.9;1" dur="6s" repeatCount="indefinite"/></rect>
        <rect class="ai-anchor" x="195" y="120" width="10" height="10"><animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;.27;.29;.9;1" dur="6s" repeatCount="indefinite"/></rect>
        <rect class="ai-anchor" x="355" y="55" width="10" height="10"><animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;.54;.56;.9;1" dur="6s" repeatCount="indefinite"/></rect>
        <g class="ai-pen">
          <path d="M0 0 L9 23 L12.5 18 L18 22.5 L22.5 18 L18 12.5 L23 9 Z" fill="#fff" stroke="#111" stroke-width="1.2" stroke-linejoin="round"/>
          <animateMotion dur="6s" repeatCount="indefinite" keyPoints="0;1;1" keyTimes="0;.55;1" calcMode="linear" path="M40 190 C 90 40, 170 40, 200 125 S 310 210, 360 60"/>
        </g>
      </svg>
    </span>
  </span>
  <span class="ai-panel">
    <b>Properties</b>
    <span class="ai-row"><em class="ai-k">Transform</em></span>
    <span class="ai-row"><span>X</span><span class="ai-field">402 px</span></span>
    <span class="ai-row"><span>Y</span><span class="ai-field">125 px</span></span>
    <span class="ai-row"><em class="ai-k">Appearance</em></span>
    <span class="ai-row"><span>Fill</span><i class="ai-chip none"></i></span>
    <span class="ai-row"><span>Stroke</span><i class="ai-chip blue"></i><span class="ai-field">2 pt</span></span>
    <span class="ai-row"><span>Opacity</span><span class="ai-field">100 %</span></span>
  </span>
</span>`;

// Mac Illustrator's Effect menu, opened on Blur > Gaussian Blur. Shown on cards whose
// photo doesn't fill the artboard, where the blurred copy fills the rest.
// Second hero window: the Type tool setting a word on an artboard, with the Character panel.
const AI_TYPE = `
<span class="ai-bar"><i></i><i></i><i></i><span class="ai-tab">Type.ai</span></span>
<span class="ai-type">
  <span class="ai-canvas">
    <span class="ai-ab-label">02 - Artboard 2</span>
    <span class="ai-artboard ai-type-board"><span class="ai-typed">Aa<i class="ai-caret"></i></span></span>
  </span>
  <span class="ai-panel ai-char">
    <b>Character</b>
    <span class="ai-row"><span class="ai-field wide">SF Pro Display</span></span>
    <span class="ai-row"><span class="ai-field wide">Thin</span></span>
    <span class="ai-row"><span>T</span><span class="ai-field">72 pt</span></span>
    <span class="ai-row"><span>VA</span><span class="ai-field">−20</span></span>
  </span>
</span>`;

const CARD_RATIO = 1.42;
const needsBlur = (slug, name) => { const z = SIZES[`${slug}/${name}`]; return Math.abs(z.w / z.h - CARD_RATIO) / CARD_RATIO > 0.04; };
const EFFECT_MENU = `<span class="fx" aria-hidden="true"><span class="fx-menu">
  <span class="fx-i">Apply Gaussian Blur<kbd>⇧⌘E</kbd></span>
  <span class="fx-i">Gaussian Blur…<kbd>⌥⇧⌘E</kbd></span>
  <span class="fx-sep"></span>
  <span class="fx-i">Document Raster Effects Settings…</span>
  <span class="fx-sep"></span>
  <span class="fx-h">Illustrator Effects</span>
  <span class="fx-i sub">3D and Materials</span>
  <span class="fx-i sub">Distort &amp; Transform</span>
  <span class="fx-i sub">Stylize</span>
  <span class="fx-sep"></span>
  <span class="fx-h">Photoshop Effects</span>
  <span class="fx-i">Effect Gallery…</span>
  <span class="fx-i sub">Artistic</span>
  <span class="fx-i sub on">Blur</span>
  <span class="fx-i sub">Brush Strokes</span>
  <span class="fx-i sub">Distort</span>
</span><span class="fx-menu fx-sub">
  <span class="fx-i on">Gaussian Blur…</span>
  <span class="fx-i">Radial Blur…</span>
  <span class="fx-i">Smart Blur…</span>
</span></span>`;

// One Mac Illustrator panel per row of cards, alternating left and right.
const PANEL_KINDS = ['effect', 'links', 'layers', 'swatches', 'pathfinder', 'align', 'character'];
const ICON = {
  link: '<svg viewBox="0 0 16 16"><path d="M6.5 9.5l3-3M5 7.5L3.5 9a2.1 2.1 0 0 0 3 3L8 10.5M8 5.5L9.5 4a2.1 2.1 0 0 1 3 3L11 8.5" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>',
  eye: '<svg viewBox="0 0 16 16"><path d="M1.5 8s2.5-4 6.5-4 6.5 4 6.5 4-2.5 4-6.5 4-6.5-4-6.5-4z" fill="none" stroke="currentColor" stroke-width="1.1"/><circle cx="8" cy="8" r="1.8" fill="currentColor"/></svg>',
};
const sq = (d) => `<svg viewBox="0 0 24 24">${d}</svg>`;
function panelFor(p, i) {
  const row = Math.floor(i / 2);
  if (i % 2 !== row % 2) return '';
  const kind = PANEL_KINDS[row % PANEL_KINDS.length];
  const side = i % 2 ? 'r' : 'l';
  const names = p.rows.flat().filter(r => typeof r === 'string').slice(0, 4);
  if (kind === 'effect') return `<span class="aip-wrap ${side}">${EFFECT_MENU}</span>`;
  const head = t => `<span class="aip-tabs"><b>${t}</b><span class="aip-x">≡</span></span>`;
  let body = '';
  if (kind === 'links') body = head('Links') + names.map((n, k) => `<span class="aip-row${k === 0 ? ' sel' : ''}"><img src="assets/img/${p.slug}/${n}-800.webp" alt="" loading="lazy"><span class="aip-name">${n}.psd</span>${ICON.link}</span>`).join('') + `<span class="aip-foot">${names.length} Links</span>`;
  if (kind === 'layers') body = head('Layers') + ['Headline', 'Images', 'Grid', 'Background'].map((n, k) => `<span class="aip-row${k === 1 ? ' sel' : ''}">${ICON.eye}<i class="aip-bar c${k}"></i><span class="aip-name">${n}</span><i class="aip-target"></i></span>`).join('') + `<span class="aip-foot">4 Layers</span>`;
  if (kind === 'swatches') body = head('Swatches') + `<span class="aip-swatches">${['#ffffff', '#0f0f0e', '#eeece5', '#2f5bff', '#ff5a36', '#14b37d', '#f4b400', '#8a8a8a', '#c9b79c', '#1d3557', '#a8dadc', '#e63946', '#6d6b64', '#ffd6a5', '#3a5a40', '#b5179e'].map(c => `<i style="background:${c}"></i>`).join('')}</span>`;
  if (kind === 'pathfinder') body = head('Pathfinder') + `<span class="aip-label">Shape Modes:</span><span class="aip-icons">${[
    '<rect x="3" y="3" width="11" height="11"/><rect x="10" y="10" width="11" height="11"/>',
    '<rect x="3" y="3" width="11" height="11"/><rect x="10" y="10" width="11" height="11" class="o"/>',
    '<rect x="3" y="3" width="11" height="11" class="o"/><rect x="10" y="10" width="11" height="11" class="o"/><rect x="10" y="10" width="4" height="4"/>',
    '<rect x="3" y="3" width="11" height="11"/><rect x="10" y="10" width="11" height="11"/><rect x="10" y="10" width="4" height="4" class="k"/>'].map(sq).join('')}<span class="aip-btn">Expand</span></span><span class="aip-label">Pathfinders:</span><span class="aip-icons">${Array.from({ length: 6 }, (_, k) => sq(`<rect x="3" y="3" width="11" height="11" class="${k % 2 ? 'o' : ''}"/><rect x="10" y="10" width="11" height="11" class="${k % 3 ? '' : 'o'}"/>`)).join('')}</span>`;
  if (kind === 'align') body = head('Align') + `<span class="aip-label">Align Objects:</span><span class="aip-icons">${[
    '<path d="M3 2v20"/><rect x="5" y="5" width="12" height="5"/><rect x="5" y="14" width="8" height="5"/>',
    '<path d="M12 2v20"/><rect x="5" y="5" width="14" height="5"/><rect x="7" y="14" width="10" height="5"/>',
    '<path d="M21 2v20"/><rect x="7" y="5" width="12" height="5"/><rect x="11" y="14" width="8" height="5"/>',
    '<path d="M2 3h20"/><rect x="5" y="5" width="5" height="12"/><rect x="14" y="5" width="5" height="8"/>',
    '<path d="M2 12h20"/><rect x="5" y="5" width="5" height="14"/><rect x="14" y="7" width="5" height="10"/>',
    '<path d="M2 21h20"/><rect x="5" y="7" width="5" height="12"/><rect x="14" y="11" width="5" height="8"/>'].map(sq).join('')}</span><span class="aip-label">Distribute Objects:</span><span class="aip-icons">${Array.from({ length: 6 }, (_, k) => sq(k < 3 ? `<path d="M2 ${5 + k * 5}h20"/><rect x="4" y="3" width="5" height="18"/><rect x="15" y="3" width="5" height="18"/>` : `<path d="M${5 + (k - 3) * 5} 2v20"/><rect x="3" y="4" width="18" height="5"/><rect x="3" y="15" width="18" height="5"/>`)).join('')}</span>`;
  if (kind === 'character') body = head('Character') + `<span class="aip-field">SF Pro Display</span><span class="aip-field">Thin</span><span class="aip-grid"><span><b>T</b> 72 pt</span><span><b>A</b> (86 pt)</span><span><b>VA</b> Auto</span><span><b>VA</b> −20</span></span>`;
  return `<span class="aip-wrap ${side}" aria-hidden="true"><span class="aip">${body}</span></span>`;
}

const loader = `
<div class="loader" aria-hidden="true">
  <div class="orbit">${covers.map((c, i) => `<img src="${c}" alt="" style="--i:${i}">`).join('')}</div>
  <p class="loader-name">Carl Serafin<sup>©</sup></p>
  <p class="loader-role">Portfolio 2024—2026</p>
  <p class="loader-count"><span data-count>0</span>%</p>
</div>`;

const home = page({
  title: `${SITE.fullName}, graphic designer in Dubai`,
  description: SITE.description,
  image: 'assets/img/top-concept-website/home-1600.webp',
  cls: 'home',
  before: loader,
  body: `
<section class="hero desk" aria-labelledby="hero-name">
  <svg width="0" height="0" style="position:absolute" aria-hidden="true">
    <symbol id="folder" viewBox="0 0 64 52"><path d="M3 9a5 5 0 0 1 5-5h15l5 5h28a5 5 0 0 1 5 5v2H3z" fill="#69b2ff"/><rect x="3" y="13" width="58" height="36" rx="5" fill="#8cc5ff"/><rect x="3" y="13" width="58" height="36" rx="5" fill="url(#fg)"/><linearGradient id="fg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a6d3ff"/><stop offset="1" stop-color="#6fb4fb"/></linearGradient></symbol>
  </svg>

  <div class="desk-bits" aria-hidden="true">
    ${[['Clients', 6, 22], ['Brand_Final', 13, 62], ['Renders', 84, 30], ['Decks_2026', 74, 78], ['Fonts', 30, 86], ['Archive', 58, 12]].map(([n, x, y]) => `<span class="folder" style="left:${x}%;top:${y}%" data-depth=".25"><svg><use href="#folder"/></svg><b>${n}</b></span>`).join('')}
    ${[['Ai', '#330000', '#ff9a00', 22, 10], ['Ps', '#001e36', '#31a8ff', 41, 80], ['Id', '#49021f', '#ff3366', 88, 52], ['Ae', '#00005b', '#9999ff', 66, 90], ['Pr', '#00005b', '#9999ff', 9, 48], ['Lr', '#001a36', '#31a8ff', 50, 6]].map(([t, bg, fg, x, y]) => `<span class="adobe" style="left:${x}%;top:${y}%;--bg:${bg};--fg:${fg}" data-depth=".35">${t}</span>`).join('')}
  </div>

  <svg class="desk-cable" viewBox="0 0 1400 900" preserveAspectRatio="none" aria-hidden="true"><path d="M240 470 C 280 700, 420 830, 520 790 S 620 650, 720 700 S 960 900, 1130 790"/></svg>

  <img class="obj obj-xm5" src="assets/hero/xm5.svg" alt="" data-depth="1.2">
  <img class="obj obj-kb" src="assets/hero/keyboard.svg" alt="" data-depth=".9">
  <img class="obj obj-watch" src="assets/hero/watch.svg" alt="" data-depth="1.4">
  <img class="obj obj-belkin" src="assets/hero/belkin.svg" alt="" data-depth="1">

  <div class="desk-title">
    <span class="dt-guide dt-gh dt-gh1" aria-hidden="true"></span><span class="dt-guide dt-gh dt-gh2" aria-hidden="true"></span><span class="dt-guide dt-gh dt-gh3" aria-hidden="true"></span>
    <span class="dt-guide dt-gv dt-gv1" aria-hidden="true"></span><span class="dt-guide dt-gv dt-gv2" aria-hidden="true"></span>
    <span class="dt-small" aria-hidden="true">Graphic</span>
    <h1 id="hero-name" aria-label="${SITE.name}, graphic design portfolio"><span class="dt-l1" aria-hidden="true">Design</span><span class="dt-l2" aria-hidden="true">Portfolio</span></h1>
    <span class="dt-tag" aria-hidden="true">${SITE.name}</span>
    <span class="dt-year" aria-hidden="true">2026</span>
    <span class="dt-box" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span>
    <span class="dt-measure" aria-hidden="true">W: 1240 px &nbsp; H: 486 px</span>
    <span class="dt-pen" aria-hidden="true">
      <svg viewBox="0 0 220 120"><path class="dt-pen-path" pathLength="1" d="M6 100 C 40 20, 110 20, 140 64"/><line x1="140" y1="64" x2="112" y2="30"/><line x1="140" y1="64" x2="168" y2="98"/><circle cx="112" cy="30" r="4"/><circle cx="168" cy="98" r="4"/><rect x="1" y="95" width="10" height="10"/><rect x="135" y="59" width="10" height="10"/>
      <g transform="translate(148 70) rotate(-12)"><path d="M0 0 L16 40 L22 31 L32 39 L39 31 L31 22 L40 16 Z" fill="#2f5bff" stroke="#fff" stroke-width="2" stroke-linejoin="round"/><circle cx="14" cy="14" r="3.4" fill="#fff"/></g></svg>
    </span>
  </div>

  <div class="desk-foot">
    <p class="hero-lead">I design <em>brands</em>, <em>company profiles</em> and <em>pitch decks</em> for the companies building Dubai. Now I build <em>websites</em> too.</p>
    <div class="desk-meta"><p class="hero-avail"><i></i>Open to new projects</p><a class="hero-scroll" href="#work">Scroll <span>↓</span></a></div>
  </div>
</section>

<div class="marquee" aria-hidden="true"><div class="mq-track">${Array(2).fill(`<span>${ABOUT.fields.map(f => `${esc(f)} <i>✦</i>`).join(' ')}</span>`).join('')}</div></div>

<section class="work" id="work" aria-labelledby="work-h">
  <div class="sec-head">
    <h2 id="work-h" class="work-title"><span data-split>Selected</span><span class="work-title-img" aria-hidden="true">${covers.slice(0, 4).map((c, i) => `<img src="${c}" alt="" style="--i:${i}">`).join('')}</span><span data-split><em>work</em><sup>(${PROJECTS.length})</sup></span></h2>
    <p>${PROJECTS.length} projects, one rule: every page, post and sign should look like the same company made it.</p>
  </div>
  <ul class="cards">
${PROJECTS.map((p, i) => `    <li class="card" data-fade>
      <a href="work/${p.slug}.html" data-cursor="View project">
        <span class="card-label">${pad(i + 1)} - Artboard ${i + 1}</span>
        <span class="card-box">${img(p.slug, p.cover, { sizes: '(min-width: 800px) 46vw, 100vw', alt: '' })}</span>
        ${panelFor(p, i)}
        <span class="card-cap">
          <span class="card-no">${pad(i + 1)}</span>
          <span class="card-title">${esc(p.title)}</span>
          <svg class="card-arrow" viewBox="0 0 24 12" aria-hidden="true"><path d="M0 6h22M17 1l5 5-5 5"/></svg>
          <span class="card-field">${esc(p.field)}</span>
        </span>
      </a>
    </li>`).join('\n')}
  </ul>
</section>

<section class="feature" aria-labelledby="feature-h">
  <a class="feature-img" href="work/top-concept-website.html" data-cursor="View project" data-reveal>${img('top-concept-website', 'home', { sizes: '100vw', alt: 'Top Concept International website home page' })}</a>
  <div class="feature-text">
    <p class="kicker">New direction</p>
    <h2 id="feature-h" data-split>From print to <em>pixels</em></h2>
    <p>My first website, designed and built with Claude Code. Drag one line and a blueprint turns into the finished tower.</p>
    <p>Behind it: a project archive, light and dark themes, and nothing but HTML, CSS and JavaScript.</p>
    <p class="links"><a class="btn" href="work/top-concept-website.html">See the case study</a> <a class="btn btn-ghost" href="https://cepsmyster.github.io/top-concept-website/" rel="noopener">Visit the live site</a></p>
  </div>
</section>

<section class="about" id="about" aria-labelledby="about-h">
  <p class="kicker">About</p>
  <h2 id="about-h" class="about-big" data-split>One idea, held together on a <em>phone</em>, a <em>page</em> and a <em>building</em>.</h2>
  <div class="about-cols">
    <div class="about-text">
      ${ABOUT.intro.map(t => `<p>${esc(t)}</p>`).join('\n      ')}
    </div>
    <ol class="services">
      ${ABOUT.fields.map((f, i) => `<li><span>${pad(i + 1)}</span>${esc(f)}</li>`).join('\n      ')}
    </ol>
  </div>
  <div class="about-lists">
    <div><h3>Tools</h3><ul>${ABOUT.tools.map(f => `<li>${esc(f)}</li>`).join('')}</ul></div>
    <div><h3>Clients</h3><ul>${[...new Set(PROJECTS.flatMap(p => p.client.split(', ')))].map(f => `<li>${esc(f)}</li>`).join('')}</ul></div>
    <div><h3>Languages</h3><ul>${ABOUT.languages.map(f => `<li>${esc(f)}</li>`).join('')}</ul></div>
  </div>
</section>`,
});

// ---------- Project pages ----------
function rowHtml(p, row) {
  const pre = '../';
  const cell = (r, sizes) => typeof r === 'object' && r.video
    ? `<figure data-reveal>${video(r.video, r.ratio, pre)}</figure>`
    : `<figure data-reveal>${img(p.slug, r, { sizes }, pre)}</figure>`;
  if (Array.isArray(row)) return `<div class="row pair">${row.map(r => cell(r, '(min-width: 800px) 50vw, 100vw')).join('')}</div>`;
  return `<div class="row">${cell(row, '100vw')}</div>`;
}

PROJECTS.forEach((p, i) => {
  const next = PROJECTS[(i + 1) % PROJECTS.length];
  const html = page({
    title: `${p.title}, ${SITE.fullName}`,
    description: p.summary,
    pre: '../',
    image: `assets/img/${p.slug}/${p.cover}-1600.webp`,
    cls: 'project',
    body: `
<article>
  <header class="p-head">
    <p class="p-crumb"><a href="../index.html#work">← All work</a><span>Project ${pad(i + 1)} / ${pad(PROJECTS.length)}</span></p>
    <h1 data-split>${words(p.title)}</h1>
  </header>
  <figure class="p-hero" data-reveal>${img(p.slug, p.cover, { sizes: '100vw', eager: true }, '../')}</figure>
  <section class="p-info">
    <dl class="meta">
      <div><dt>Client</dt><dd>${esc(p.client)}</dd></div>
      <div><dt>Work</dt><dd>${esc(p.field)}</dd></div>
      <div><dt>Sector</dt><dd>${esc(p.sector)}</dd></div>
      <div><dt>Year</dt><dd>${esc(p.year)}</dd></div>
    </dl>
    <div class="p-text">
      <p class="lead">${esc(p.summary)}</p>
      ${p.body.map(t => `<p>${esc(t)}</p>`).join('\n      ')}
      ${p.link ? `<p class="links"><a class="btn" href="${p.link.href}" rel="noopener">${esc(p.link.label)}</a></p>` : ''}
    </div>
  </section>
  <div class="plates">
    ${p.rows.filter((r, k) => !(k === 0 && r === p.cover)).map(r => rowHtml(p, r)).join('\n    ')}
  </div>
</article>
<nav class="next" aria-label="Next project">
  <a href="${next.slug}.html" data-cursor="Next project">
    <span class="next-img">${img(next.slug, next.cover, { sizes: '100vw', alt: '' }, '../')}</span>
    <span class="next-label">Next project — ${pad((i + 1) % PROJECTS.length + 1)}</span>
    <span class="next-title">${esc(next.title)}</span>
  </a>
</nav>`,
  });
  fs.mkdirSync(path.join(ROOT, 'work'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'work', `${p.slug}.html`), html);
});

fs.writeFileSync(path.join(ROOT, 'index.html'), home);

// 404 uses absolute paths so it works from any depth on GitHub Pages.
const notFound = page({
  title: `Page not found, ${SITE.fullName}`,
  description: 'This page does not exist.',
  pre: '/',
  cls: 'nf',
  body: `<section class="nf-body"><h1 data-split>Lost the <em>path</em></h1><p>This link leads nowhere. <a href="/">Head back home</a> to see the work.</p></section>`,
});
fs.writeFileSync(path.join(ROOT, '404.html'), notFound);

// Sitemap
const urls = ['', ...PROJECTS.map(p => `work/${p.slug}.html`)];
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url><loc>${SITE.url}${u}</loc></url>`).join('\n')}\n</urlset>\n`);
console.log('built', PROJECTS.length + 2, 'pages');
