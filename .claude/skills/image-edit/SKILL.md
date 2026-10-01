---
name: image-edit
description: Edit, enhance or transform an existing image with hosted AI models on fal.ai (Gemini Nano Banana, GPT Image 2, Bria). Covers general edits, background replacement or removal, upscaling, old-photo restoration, colourisation, removing people or objects, portrait retouching, colour grading and filters, outpainting, local edits, adding text, other viewing angles, before/after comparisons, layout changes, and car recolours or wraps. Use whenever the user wants to change a photo or image they already have rather than create one from nothing.
---

# Image edit

Edits an existing image by calling a model on fal.ai through `scripts/edit_image.py`. The script reads local files (sent as data URIs) or public URLs, wraps the instruction in a template for the chosen action, waits for the job and saves the results locally.

## Setup

The script needs a fal.ai API key in `FAL_KEY` (create one at https://fal.ai/dashboard/keys). Every call is billed to that account. If `FAL_KEY` is missing, say so and stop; do not try to work around it.

No packages are needed beyond Python 3.

## Run it

```bash
python3 .claude/skills/image-edit/scripts/edit_image.py \
  --image path/to/photo.jpg \
  --action replace_bg \
  --prompt "a plain ivory studio wall with a soft floor shadow"
```

Output is JSON: `{"success": true, "images": [{"local_path": ...}], "prompt": ..., "request_id": ...}`, or `{"success": false, "error": ...}`. Files go to `image-edit-output/` (override with `--out` or `IMAGE_EDIT_OUTPUT`); that folder is git-ignored. Show the user the saved file, never the raw fal.media URL.

| Flag | Default | Notes |
|---|---|---|
| `--image` | required | Path or https URL. Repeat up to 3 times; the first is the base, the rest are references. Name each one's role in the prompt ("image 2 is the logo"). Max 10 MB each. |
| `--prompt` | per-action default | What to change. Be specific. |
| `--action` | `edit` | See below. |
| `--model` | `nanopro` | `nano2`, `nanopro`, `gpt`, `rmbg` (`--list` prints them). |
| `--count` | 1 | 1 to 4 variations. |
| `--aspect-ratio` | source ratio | `21:9 16:9 3:2 4:3 5:4 1:1 4:5 3:4 2:3 9:16`. |
| `--resolution` | 1K | nanopro only: `1K 2K 4K`. Set 2K or 4K when the source is large, otherwise the output shrinks. |
| `--format` | `png` | `png jpeg webp`. |
| `--dry-run` | | Prints the endpoint and final prompt without spending anything. Use it when unsure what will be sent. |

## Actions

| Group | Action | Use for |
|---|---|---|
| General | `edit` | Any change described in the prompt |
| | `local_edit` | Change one region only ("only the sky") |
| | `restructure` | Change a layout: grid, columns, arrangement |
| | `blend` | Put the subject into a new scene |
| | `extend` | Outpaint past the edges (pair with `--aspect-ratio`) |
| | `text_render` | Add or change text |
| | `multi_angle` | Show the subject from another viewpoint |
| | `before_after`, `comparison` | Side-by-side before and after |
| Professional | `replace_bg` | New background, subject kept |
| | `remove_bg` | Transparent cut-out (uses the Bria model, prompt ignored) |
| | `upscale` | Sharper, cleaner, larger |
| | `restore` | Repair old or damaged photos |
| | `colorize` | Colour a black-and-white photo |
| | `remove_person`, `remove_object` | Remove something and fill the gap |
| Retouching | `retouch` | Skin, blemishes, natural portrait cleanup |
| | `slim` | Subtle proportion changes |
| | `enhance` | Exposure, contrast, colour |
| | `filter` | A look or style across the whole image |
| Automotive | `car_color`, `car_wrap` | Repaint or wrap a vehicle |

## Choosing a model

- **nanopro** (default, about 25 s): most edits, multiple references, instruction-heavy prompts.
- **nano2** (about 15 s, cheapest): quick drafts and trying options.
- **gpt** (about 2 min, most expensive): when the user asks for the best quality or the edit must keep fine detail. Tell the user it is slow.
- **rmbg**: only for `remove_bg`; chosen automatically.

## Writing good prompts

1. Before calling, state to yourself what changes and what must stay. Put both in the prompt: "change the shirt to navy; keep the fabric folds, face and background".
2. Be concrete about materials, colours and light: "deep metallic blue, glossy clear coat", not "make it blue".
3. Name a reference look for filters: "warm 1970s film grade, soft halation", not "make it artistic".
4. Give the era for restoration or colourisation.
5. Say how strong a retouch should be (subtle, professional, heavy).
6. Models are unreliable with exact logos and long text. For brand marks or precise typography, clear the area with an edit and then composite the real artwork with an image library, rather than asking the model to draw it.

## After each edit

Look at the saved image yourself (Read the file) before presenting it. If it missed the brief, adjust the prompt and retry once; after that, show the user what you have and ask how to proceed rather than looping.

## Troubleshooting

| Problem | Fix |
|---|---|
| `FAL_KEY is not set` | User needs to export a fal.ai key |
| HTTP 401 / 403 | Key is wrong or lacks access to that model |
| HTTP 402 or balance error | fal.ai account needs credit |
| `file not found` / `unsupported format` / over 10 MB | Check the path; convert to jpg/png/webp; resize |
| Output smaller than source | Use `--resolution 2K` or `4K` with nanopro, or `--model gpt` |
| Layout will not change | Use `--action restructure` and state the target structure exactly |
| Timed out | The job may still finish; the error includes `response_url` and `request_id` |
