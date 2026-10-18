// Build the pages, then publish only the files visitors need.
import './build.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'dist');

fs.mkdirSync(output, { recursive: true });
for (const name of ['index.html', '404.html', 'sitemap.xml', 'assets', 'work']) {
  fs.cpSync(path.join(root, name), path.join(output, name), { recursive: true });
}
console.log('Prepared static website in dist/');
