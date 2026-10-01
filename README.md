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

- **Type and colour:** Instrument Sans with Instrument Serif italics for accents, on a warm paper background, with
  one accent colour (Illustrator path blue, `--accent` in `assets/css/styles.css`).
- **Loader:** on the first visit in a session the home page opens on a black screen where the project covers orbit
  while a counter runs to 100%, then the screen lifts away.
- **Hero:** the name fills the width (sized in `assets/js/main.js`), a strip of project covers plays next to
  "Carl", and a blue Bézier path with anchor points draws itself across the name.
- **Pen-tool cursor:** on computers with a mouse the pointer is a pen nib that leaves a fading path with square
  anchor points and handles. Links show the "+" of the Add Anchor Point tool; project images show a "View project"
  label (set with `data-cursor` on any element).
- **Motion:** headings rise word by word, images uncover as they scroll in, the services strip drifts and speeds up
  with scrolling, and a black panel wipes between pages.
- **Work grid:** full-width tiles in a repeating pattern of one wide, then pairs that swap sides.
- Videos play only while on screen and never with sound. Visitors who turn on "reduce motion" get no loader,
  cursor trail or animation.
