// One-off image pipeline: crops and converts the source artwork into web-ready WebP files.
// Sources live outside the repo (Behance downloads, the Work folder, rendered PDF pages),
// so this only needs to run again when artwork is added or changed.
//   SRC_BE   Behance "source" downloads      SRC_WORK  Desktop/Work folder
//   SRC_PDF  PDF pages rendered at 2000px    (see README)
// Output: assets/img/<project>/<name>-<w>.webp  +  src/images.json (sizes for width/height attributes)
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const BE = process.env.SRC_BE, WORK = process.env.SRC_WORK, PDF = process.env.SRC_PDF;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'assets/img');
const WIDTHS = [800, 1600];

// crop: [x, y, w, h] measured on an image displayed `dw` pixels wide
const be = (n, crop, dw = 1400) => ({ src: `${BE}/243935583_${n}.jpg`, crop, dw });
const hb = n => ({ src: `${BE}/244797281_${n}.jpg` });
const pdf = n => ({ src: `${PDF}/${n}.png` });
const tci = n => ({ src: `${WORK}/Company Profiles/TCI Company Profile Jpeg/${n}.jpg` });

export const IMAGES = {
  'top-concept-website': {
    home: pdf('web-desk'), mobile: pdf('web-mob'), projects: pdf('web-proj'), expertise: pdf('web-exp'),
  },
  'tci-company-profile': {
    cover: tci('1-01'), azizi: tci('1-03'), hospitality: tci('1-07'), divider: tci('1-16'), towers: tci('1-21'),
    interiors: tci('1-44'), lobby: tci('1-46'), rox: tci('2-17'), interiors2: tci('2-34'), landscape: tci('2-46'),
    identity: { ...pdf('top-01'), crop: [0, 1110, 913, 870], dw: 913 },
    marks: { ...pdf('top-01'), crop: [0, 0, 913, 1110], dw: 913 },
  },
  'touch-id-contracting': {
    cover: pdf('tic-01'), logo: pdf('tic-02'), mark: pdf('tic-03'), pattern: pdf('tic-04'), cards: pdf('tic-07'),
    signage: pdf('tic-10'), cars: pdf('tic-12'), bus: pdf('tic-13'), mug: pdf('tic-15'), vest: pdf('tic-16'),
    tid: pdf('tid-01'), tidcolors: pdf('tid-03'), tidcards: pdf('tid-05'), tidbus: pdf('tid-09'), tidshirt: pdf('tid-12'),
    tidoveralls: pdf('tid-13'), tidhelmet: pdf('tid-15'), tidid: pdf('tid-16'),
  },
  'ips-2026': {
    countdown: { src: `${WORK}/Social media/IPS 2026.png` },
  },
  'resort-concept': {
    cover: pdf('forest-01'), master: pdf('forest-04'), amenities: pdf('forest-12'), pool: pdf('forest-14'),
    reception: pdf('forest-21'), dining: pdf('forest-23'), plan: pdf('forest-29'), lobby: pdf('forest-36'),
    cards: pdf('forest-39'), arcade: pdf('forest-45'), jacuzzi: pdf('forest-57'), suiteboard: pdf('forest-70'), suites: pdf('forest-71'),
  },
  'villa-estate-presentation': {
    aerial: pdf('ohood-45'), mansion: pdf('ohood-46'), garden: pdf('ohood-47'), beach: pdf('ohood-50'),
    majlis: pdf('ohood-53'), bedroom: pdf('ohood-58'), bathroom: pdf('ohood-62'),
  },
  'fitout-company-profile': {
    cover: pdf('touchid-01'), about: pdf('touchid-03'), vision: pdf('touchid-05'), government: pdf('touchid-08'),
    residential: pdf('touchid-19'), office: pdf('touchid-26'), fnb: pdf('touchid-41'), retail: pdf('touchid-52'), landscape: pdf('touchid-74'),
  },
  'repc-signage': {
    grand: pdf('repc-01'), soon: pdf('repc-02'), navy: pdf('repc-03'), navy2: pdf('repc-04'),
    site: { src: `${WORK}/Prints/Signage/WhatsApp Image 2026-06-30 at 6.35.23 PM.jpeg` },
    logo: { src: `${WORK}/Prints/Signage/REPC logo.png` },
  },
  'abdulla-al-arif': {
    emails: be('03', [95, 1010, 1212, 806]),
    stories: be('04', [97, 178, 1206, 490]),
    phone: be('05'),
    books: be('06', [97, 178, 1205, 422]),
    ramadan: be('06', [97, 648, 789, 420]),
    earthday: be('06', [928, 648, 374, 420]),
  },
  naresco: {
    posts: be('07', [97, 493, 1206, 277]),
    phone: be('08'),
  },
  'proguard-renova360': {
    posts: be('09', [89, 452, 1102, 318], 1281),
    ads: be('09', [89, 978, 1102, 942], 1281),
    profiles: be('10', [97, 185, 1205, 420]),
    renova: be('11', [0, 50, 1400, 874]),
  },
  'daytona-properties': {
    ads: be('12', [97, 510, 1206, 316]),
    brochures: be('13', [97, 194, 1205, 420]),
    standee: be('14'),
  },
  'world-padel-academy': {
    posts: be('15', [408, 404, 894, 474]),
  },
  'homega-heights': {
    cover: hb('01'), inside: hb('02'), mockup: hb('03'),
  },
};

const manifest = {};
for (const [project, imgs] of Object.entries(IMAGES)) {
  fs.mkdirSync(path.join(OUT, project), { recursive: true });
  for (const [name, def] of Object.entries(imgs)) {
    let img = sharp(def.src, { failOn: 'none', limitInputPixels: false });
    const meta = await img.metadata();
    if (def.crop) {
      const k = meta.width / (def.dw || meta.width);
      const [x, y, w, h] = def.crop.map(v => Math.round(v * k));
      img = img.extract({ left: x, top: y, width: Math.min(w, meta.width - x), height: Math.min(h, meta.height - y) });
    }
    const buf = await img.toBuffer();
    const { width, height } = await sharp(buf).metadata();
    for (const w of WIDTHS) {
      await sharp(buf).resize({ width: Math.min(w, width), withoutEnlargement: true })
        .webp({ quality: 78 }).toFile(path.join(OUT, project, `${name}-${w}.webp`));
    }
    manifest[`${project}/${name}`] = { w: width, h: height };
    process.stdout.write('.');
  }
}
fs.writeFileSync(path.join(ROOT, 'src/images.json'), JSON.stringify(manifest, null, 1));
console.log('\n', Object.keys(manifest).length, 'images');
