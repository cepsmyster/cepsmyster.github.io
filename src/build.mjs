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
  portrait: 'Portrait of Carl Serafin',
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

const header = pre => `
<a class="skip" href="#main">Skip to content</a>
<header class="top">
  <a class="top-name" href="${pre || './'}">${SITE.name}</a>
  <p class="top-role">${SITE.role}, ${SITE.city} <span class="clock" data-clock aria-label="Local time in Dubai"></span></p>
  <nav class="top-nav" aria-label="Main">
    <a href="${pre}index.html#work">Work</a>
    <a href="${pre}index.html#about">About</a>
    <a href="${pre}index.html#contact">Contact</a>
  </nav>
</header>`;

const colourBar = `<div class="colourbar" aria-hidden="true"><i class="cb-c"></i><i class="cb-m"></i><i class="cb-y"></i><i class="cb-k"></i><svg class="reg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="6.5"/><path d="M12 0v24M0 12h24"/></svg></div>`;

const footer = pre => `
<footer class="foot">
  ${colourBar}
  <p>© 2026 ${SITE.fullName}</p>
  <p><a href="mailto:${SITE.email}">${SITE.email}</a></p>
  <p><a href="${SITE.behance}" rel="me noopener">Behance</a></p>
</footer>
<script src="${pre}assets/js/main.js?v=${VERSION}" defer></script>`;

function page({ title, description, pre = '', body, cls = '', image }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script>document.documentElement.classList.add('js');setTimeout(function(){var p=document.querySelector('.press');if(p)p.classList.add('inked')},3000)</script>
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="website">
${image ? `<meta property="og:image" content="${SITE.url}${image}">` : ''}
<meta name="theme-color" content="#f4f4f1">
<link rel="icon" href="${pre}assets/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:ital,wdth,wght@0,62..125,100..900;1,62..125,100..900&display=swap">
<link rel="stylesheet" href="${pre}assets/css/styles.css?v=${VERSION}">
</head>
<body class="${cls}">
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
const pressLines = '<span class="l1">Carl</span><span class="l2">Serafin</span>';
const home = page({
  title: `${SITE.fullName}, graphic designer in Dubai`,
  description: SITE.description,
  image: 'assets/img/top-concept-website/home-1600.webp',
  cls: 'home',
  body: `
<section class="hero" aria-labelledby="hero-name">
  <h1 class="press" id="hero-name" aria-label="${SITE.name}">
    <span class="plate p-y" aria-hidden="true">${pressLines}</span>
    <span class="plate p-m" aria-hidden="true">${pressLines}</span>
    <span class="plate p-c" aria-hidden="true">${pressLines}</span>
    <span class="plate p-k" aria-hidden="true">${pressLines}</span>
  </h1>
  <div class="hero-foot">
    <p class="hero-lead">Graphic designer in Dubai. I make brand identities, company profiles, social campaigns, signage and presentations, and I’ve started designing and building websites.</p>
    ${colourBar}
  </div>
</section>

<section class="work" id="work" aria-labelledby="work-h">
  <div class="sec-head">
    <h2 id="work-h">Selected work</h2>
    <p>${PROJECTS.length} projects, 2024–2026</p>
  </div>
  <ul class="index">
${PROJECTS.map(p => `    <li>
      <a href="work/${p.slug}.html" data-peek="assets/img/${p.slug}/${p.cover}-800.webp">
        <span class="ix-thumb">${img(p.slug, p.cover, { sizes: '96px', alt: '' })}</span>
        <span class="ix-title">${esc(p.title)}</span>
        <span class="ix-field">${esc(p.field)}</span>
        <span class="ix-year">${esc(p.year)}</span>
      </a>
    </li>`).join('\n')}
  </ul>
  <div class="peek" aria-hidden="true"><img alt=""></div>
</section>

<section class="feature" aria-labelledby="feature-h">
  <figure class="crop feature-img">${img('top-concept-website', 'home', { sizes: '(min-width: 900px) 62vw, 100vw' })}</figure>
  <div class="feature-text">
    <h2 id="feature-h">Now designing for the web</h2>
    <p>The Top Concept International website is the first site I designed and built myself: a blueprint-to-render hero you can drag, a project archive, and a light and dark theme, in plain HTML, CSS and JavaScript.</p>
    <p class="links"><a class="btn" href="work/top-concept-website.html">See the project</a> <a class="btn btn-ghost" href="https://cepsmyster.github.io/top-concept-website/" rel="noopener">Visit the live site</a></p>
  </div>
</section>

<section class="about" id="about" aria-labelledby="about-h">
  <div class="sec-head"><h2 id="about-h">About me</h2></div>
  <div class="about-grid">
    <figure class="crop about-photo">${img('about', 'portrait', { sizes: '(min-width: 900px) 30vw, 80vw' })}</figure>
    <div class="about-text">
      ${ABOUT.intro.map((t, i) => `<p${i === 0 ? ' class="lead"' : ''}>${esc(t)}</p>`).join('\n      ')}
    </div>
  </div>
  <div class="about-lists">
    <div><h3>What I do</h3><ul>${ABOUT.fields.map(f => `<li>${esc(f)}</li>`).join('')}</ul></div>
    <div><h3>Tools</h3><ul>${ABOUT.tools.map(f => `<li>${esc(f)}</li>`).join('')}</ul></div>
    <div><h3>Clients</h3><ul>${[...new Set(PROJECTS.flatMap(p => p.client.split(', ')))].map(f => `<li>${esc(f)}</li>`).join('')}</ul></div>
    <div><h3>Languages</h3><ul>${ABOUT.languages.map(f => `<li>${esc(f)}</li>`).join('')}</ul></div>
  </div>
</section>

<section class="contact" id="contact" aria-labelledby="contact-h">
  <h2 id="contact-h">Have a project in mind? Send me an email.</h2>
  <p><a class="mail" href="mailto:${SITE.email}">${SITE.email}</a></p>
  <p class="contact-more">More work on <a href="${SITE.behance}" rel="me noopener">Behance</a>. Based in Dubai, UAE.</p>
</section>`,
});

// ---------- Project pages ----------
function rowHtml(p, row) {
  const pre = '../';
  const cell = (r, sizes) => typeof r === 'object' && r.video
    ? `<figure class="crop">${video(r.video, r.ratio, pre)}</figure>`
    : `<figure class="crop">${img(p.slug, r, { sizes }, pre)}</figure>`;
  if (Array.isArray(row)) return `<div class="row pair">${row.map(r => cell(r, '(min-width: 800px) 45vw, 100vw')).join('')}</div>`;
  return `<div class="row">${cell(row, '(min-width: 1200px) 1200px, 100vw')}</div>`;
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
    <p class="back"><a href="../index.html#work">All work</a></p>
    <h1>${esc(p.title)}</h1>
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
  </header>
  <div class="plates">
    ${p.rows.map(r => rowHtml(p, r)).join('\n    ')}
  </div>
</article>
<nav class="next" aria-label="Next project">
  <a href="${next.slug}.html">
    <span class="next-label">Next project</span>
    <span class="next-title">${esc(next.title)}</span>
    <span class="next-img">${img(next.slug, next.cover, { sizes: '(min-width: 800px) 40vw, 100vw', alt: '' }, '../')}</span>
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
  body: `<section class="nf-body"><h1>This page isn’t here</h1><p>The link may be old or mistyped. <a href="/">Go to the home page</a> to see all work.</p></section>`,
});
fs.writeFileSync(path.join(ROOT, '404.html'), notFound);

// Sitemap
const urls = ['', ...PROJECTS.map(p => `work/${p.slug}.html`)];
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url><loc>${SITE.url}${u}</loc></url>`).join('\n')}\n</urlset>\n`);
console.log('built', PROJECTS.length + 2, 'pages');
