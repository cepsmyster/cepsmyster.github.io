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
  <p class="foot-kicker">Have a project in mind?</p>
  <h2 class="foot-big"><a href="mailto:${SITE.email}" data-cursor="Email me">Let’s <em>make</em><br>something</a></h2>
  <div class="foot-row">
    <p><span class="lbl">Email</span><a href="mailto:${SITE.email}">${SITE.email}</a></p>
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
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wdth,wght@0,75..100,400..700;1,75..100,400..700&family=Instrument+Serif:ital@0;1&display=swap">
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
<section class="hero" aria-labelledby="hero-name">
  <div class="hero-top">
    <p>Portfolio <em>©2024—2026</em></p>
    <p>Brand identity, print, social,<br>signage, presentations and web</p>
    <p class="hero-avail"><i></i>Open to new projects</p>
  </div>
  <h1 class="hero-name" id="hero-name" aria-label="${SITE.name}">
    <span class="hn-line hn-1" aria-hidden="true"><span class="hn-word">Carl</span><span class="hn-reel">${covers.slice(0, 8).map((c, i) => `<img src="${c}" alt="" style="--i:${i}">`).join('')}</span></span>
    <span class="hn-line hn-2" aria-hidden="true"><span class="hn-word">Serafin</span></span>
    <span class="hn-path" aria-hidden="true">
      <svg viewBox="0 0 1000 400" preserveAspectRatio="none"><path d="M20 330 C 180 120, 330 380, 500 210 S 820 40, 980 150"/><line x1="500" y1="210" x2="390" y2="330"/><line x1="500" y1="210" x2="610" y2="90"/></svg>
      <i class="hn-a" style="left:2%;top:82.5%"></i><i class="hn-a" style="left:50%;top:52.5%"></i><i class="hn-a" style="left:98%;top:37.5%"></i>
      <i class="hn-h" style="left:39%;top:82.5%"></i><i class="hn-h" style="left:61%;top:22.5%"></i>
    </span>
  </h1>
  <div class="hero-foot">
    <p class="hero-lead">Graphic designer in Dubai, making <em>brands</em>, <em>books</em>, <em>campaigns</em> and now <em>websites</em> for architecture, construction and real estate companies.</p>
    <a class="hero-scroll" href="#work">Scroll <span>↓</span></a>
  </div>
</section>

<div class="marquee" aria-hidden="true"><div class="mq-track">${Array(2).fill(`<span>${ABOUT.fields.map(f => `${esc(f)} <i>✦</i>`).join(' ')}</span>`).join('')}</div></div>

<section class="work" id="work" aria-labelledby="work-h">
  <div class="sec-head">
    <h2 id="work-h" data-split>Selected <em>work</em><sup>(${PROJECTS.length})</sup></h2>
    <p>A selection of brand, print, digital and presentation work made in Dubai between 2024 and 2026.</p>
  </div>
  <ul class="grid">
${PROJECTS.map((p, i) => {
    const shape = SHAPES[i % SHAPES.length];
    const [kind, side = ''] = shape.split(' ');
    return `    <li class="tile tile-${kind}${side ? ' ' + side : ''}">
      <a href="work/${p.slug}.html" data-cursor="View project">
        <span class="tile-img" data-reveal>${img(p.slug, p.cover, { sizes: TILE_SIZES[kind], alt: '' })}</span>
        <span class="tile-cap">
          <span class="tile-no">${pad(i + 1)}</span>
          <span class="tile-title">${esc(p.title)}</span>
          <span class="tile-field">${esc(p.field)}</span>
          <span class="tile-year">${esc(p.year)}</span>
        </span>
      </a>
    </li>`;
  }).join('\n')}
  </ul>
</section>

<section class="feature" aria-labelledby="feature-h">
  <a class="feature-img" href="work/top-concept-website.html" data-cursor="View project" data-reveal>${img('top-concept-website', 'home', { sizes: '100vw', alt: 'Top Concept International website home page' })}</a>
  <div class="feature-text">
    <p class="kicker">New direction</p>
    <h2 id="feature-h" data-split>Now designing <em>for the web</em></h2>
    <p>The Top Concept International website is the first site I designed and built with Claude Code: a blueprint-to-render hero you can drag, a project archive, and a light and dark theme, in plain HTML, CSS and JavaScript.</p>
    <p class="links"><a class="btn" href="work/top-concept-website.html">See the project</a> <a class="btn btn-ghost" href="https://cepsmyster.github.io/top-concept-website/" rel="noopener">Visit the live site ↗</a></p>
  </div>
</section>

<section class="about" id="about" aria-labelledby="about-h">
  <p class="kicker">About</p>
  <h2 id="about-h" class="about-big" data-split>I turn ideas into <em>brands</em>, <em>pages</em> and <em>places</em> people actually use.</h2>
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
      ${p.link ? `<p class="links"><a class="btn" href="${p.link.href}" rel="noopener">${esc(p.link.label)} ↗</a></p>` : ''}
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
  body: `<section class="nf-body"><h1 data-split>Lost the <em>path</em></h1><p>The link may be old or mistyped. <a href="/">Go to the home page</a> to see all work.</p></section>`,
});
fs.writeFileSync(path.join(ROOT, '404.html'), notFound);

// Sitemap
const urls = ['', ...PROJECTS.map(p => `work/${p.slug}.html`)];
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url><loc>${SITE.url}${u}</loc></url>`).join('\n')}\n</urlset>\n`);
console.log('built', PROJECTS.length + 2, 'pages');
