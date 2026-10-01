# Carl Serafin — portfolio

Live: **https://cepsmyster.github.io/**

A static site (plain HTML, CSS and JavaScript, no framework) hosted on GitHub Pages.

## Edit content

All text lives in `src/data.mjs`:

- `SITE` — name, email, Behance link
- `ABOUT` — the About me paragraphs, skills, tools and languages
- `PROJECTS` — one entry per project. `rows` sets the image layout on the project page:
  `'name'` = one full-width image, `['a', 'b']` = two side by side, `{ video, ratio }` = a looping clip.

After editing, rebuild the pages:

```
node src/build.mjs
```

then commit and push. GitHub Pages updates within a minute or two.

## Add or change images

Images are WebP files in `assets/img/<project>/<name>-800.webp` and `-1600.webp`.
`src/images.mjs` makes them from the original artwork (it reads the sources from the folders given in
`SRC_BE`, `SRC_WORK` and `SRC_PDF`, crops where needed and writes `src/images.json`):

```
npm install
SRC_BE=... SRC_WORK=... SRC_PDF=... node src/images.mjs
node src/build.mjs
```

For a one-off image you can also export two WebP files at 800 and 1600 px wide by hand, drop them into
`assets/img/<project>/`, and add the size to `src/images.json`.

## How the site works

- **Hero:** the name is printed from four plates (yellow, magenta, cyan, black). On load they come into
  register one after another; moving the mouse fast knocks them slightly out of register. Visitors who turn
  on "reduce motion" see the name in black with no animation. Code: `assets/js/main.js`, styles under
  "Hero: the press" in `assets/css/styles.css`.
- **Work index:** on desktop, hovering a project shows its cover next to the cursor. On phones each row has
  a thumbnail.
- **Crop marks:** any `<figure class="crop">` gets print crop marks at its corners.
- Videos play only while on screen and never with sound.
