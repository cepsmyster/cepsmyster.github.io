#!/usr/bin/env python3
"""Edit an existing image with a hosted model on fal.ai.

Usage:
  python3 edit_image.py --image photo.jpg --action replace_bg --prompt "plain ivory studio wall"

Needs FAL_KEY in the environment (https://fal.ai/dashboard/keys).
Only uses the Python standard library.
"""

import argparse
import base64
import json
import mimetypes
import os
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime
from pathlib import Path

QUEUE = "https://queue.fal.run"

MODELS = {
    # key: (fal endpoint, timeout seconds, poll seconds, note)
    "nano2": ("fal-ai/gemini-3.1-flash-image-preview/edit", 120, 2, "fastest, cheapest; drafts"),
    "nanopro": ("fal-ai/gemini-3-pro-image-preview/edit", 180, 3, "default; strong instruction following"),
    "gpt": ("openai/gpt-image-2/edit", 600, 5, "highest fidelity, slow (~2 min)"),
    "rmbg": ("fal-ai/bria/background/remove", 90, 2, "background removal only, transparent PNG"),
}
DEFAULT_MODEL = "nanopro"

ASPECTS = ["21:9", "16:9", "3:2", "4:3", "5:4", "1:1", "4:5", "3:4", "2:3", "9:16"]
GPT_SIZES = {
    "1:1": "square_hd", "4:3": "landscape_4_3", "3:2": "landscape_4_3", "5:4": "landscape_4_3",
    "16:9": "landscape_16_9", "21:9": "landscape_16_9",
    "3:4": "portrait_4_3", "2:3": "portrait_4_3", "4:5": "portrait_4_3", "9:16": "portrait_16_9",
}
FORMATS = ["png", "jpeg", "webp"]
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}
MAX_BYTES = 10 * 1024 * 1024

# Each action wraps the user's instruction ({p}) in guidance for the model.
# The second string is used when no instruction is given.
ACTIONS = {
    # general
    "edit": (
        "Edit this image as follows: {p}. Apply the change precisely and leave every unrelated area "
        "as it is. If the instruction asks for a different layout or structure, follow the instruction "
        "rather than the original composition.",
        "improve the image while keeping its character"),
    "restructure": (
        "Rebuild the layout of this image: {p}. The structure must change as described (grid, rows, "
        "columns, arrangement). Keep the style, palette and subject matter, but do not keep the old layout.",
        "simplify the layout"),
    "blend": (
        "Place the subject of this image into the following scene: {p}. Match light direction, "
        "perspective, colour temperature, shadows and reflections so it reads as one photograph.",
        "a softly lit studio set"),
    "extend": (
        "Extend this image past its edges: {p}. Continue the scene with the same perspective, light, "
        "texture and palette, with no visible seam where old meets new.",
        "continue the scene naturally on all sides"),
    "local_edit": (
        "Change only this part of the image: {p}. Every other pixel stays as in the original; blend "
        "the edited area into its surroundings.",
        "tidy the central area"),
    "text_render": (
        "Add or change text in this image: {p}. Spell it exactly as given, keep it sharp and legible, "
        "and set it so it sits naturally in the image rather than looking pasted on.",
        "add a short, elegant title"),
    "multi_angle": (
        "Show the subject of this image from another viewpoint: {p}. Keep its identity, proportions "
        "and details; adjust perspective, light and shadow to suit the new angle.",
        "a three-quarter view"),
    "before_after": (
        "Make a side-by-side before and after image: {p}. Original on the left, result on the right, "
        "a clean divider between them and the same framing and scale in both halves.",
        "the image before and after enhancement"),
    "comparison": (
        "Make a transformation comparison: {p}. Before and after in a clean, aligned layout with "
        "consistent scale, so the change is easy to read.",
        "a before and after transformation"),
    # professional
    "replace_bg": (
        "Replace the background of this image with: {p}. Keep the foreground subject untouched with "
        "clean edges, and match light direction, colour temperature and contact shadows to the new setting.",
        "a clean, neutral studio backdrop"),
    "upscale": (
        "Upscale this image and refine detail: {p}. Sharpen edges and textures, remove noise and "
        "compression artefacts, and do not invent detail that is not in the original.",
        "maximum clarity"),
    "restore": (
        "Restore this old or damaged photograph: {p}. Repair scratches, tears, creases, stains and "
        "fading, rebuild missing areas from context, correct colour casts and keep the photo's period character.",
        "repair all visible damage"),
    "colorize": (
        "Colourise this black-and-white photograph: {p}. Use believable, period-appropriate colours "
        "and natural skin tones while keeping the original detail and tonal range.",
        "natural, realistic colours"),
    "remove_person": (
        "Remove this person from the photo: {p}. Fill the space with background that continues the "
        "surroundings, with no ghosting or visible editing traces.",
        "the person indicated"),
    "remove_object": (
        "Remove this object from the photo: {p}. Fill the space with background that continues the "
        "surroundings, with no ghosting or visible editing traces.",
        "the distracting object"),
    # retouching
    "retouch": (
        "Retouch this portrait: {p}. Remove blemishes and even out skin tone while keeping pores and "
        "texture; keep the person's features and character, nothing plastic.",
        "light, natural retouching"),
    "slim": (
        "Adjust proportions in this portrait subtly: {p}. Keep the body realistic and do not warp the "
        "background or nearby straight lines.",
        "subtle, natural slimming"),
    "enhance": (
        "Enhance this image: {p}. Balance exposure, contrast and colour, reduce noise and keep detail, "
        "for a professionally edited but natural result.",
        "better colour, light and contrast"),
    "filter": (
        "Apply this look to the whole image: {p}. Keep the composition and subject recognisable and "
        "apply the effect evenly.",
        "a warm cinematic grade"),
    # automotive
    "car_color": (
        "Repaint the vehicle in this image: {p}. Keep reflections, highlights and shadows correct for "
        "the new paint and finish; leave wheels, glass, trim and background unchanged.",
        "deep metallic blue"),
    "car_wrap": (
        "Apply this wrap to the vehicle in this image: {p}. Follow the body contours and show the "
        "material correctly (matte, satin, gloss, chrome, carbon); leave wheels, glass and trim unchanged.",
        "matte black"),
    # background removal (dedicated model, prompt ignored)
    "remove_bg": ("", ""),
}


def fail(msg, **extra):
    print(json.dumps({"success": False, "error": msg, **extra}, indent=2))
    sys.exit(1)


def to_input(src):
    """Return a URL fal can read: http(s) URLs pass through, local files become data URIs."""
    if src.startswith(("http://", "https://")):
        return src
    p = Path(src).expanduser()
    if not p.is_file():
        fail(f"file not found: {src}")
    if p.suffix.lower() not in IMAGE_EXTS:
        fail(f"unsupported format {p.suffix}; use one of {', '.join(sorted(IMAGE_EXTS))}")
    if p.stat().st_size > MAX_BYTES:
        fail(f"{src} is {p.stat().st_size / 1048576:.1f} MB; the limit is 10 MB, resize it first")
    mime = mimetypes.guess_type(p.name)[0] or "image/jpeg"
    return f"data:{mime};base64,{base64.b64encode(p.read_bytes()).decode()}"


def build_prompt(action, prompt):
    template, default = ACTIONS[action]
    return template.format(p=(prompt or default).strip().rstrip("."))


def build_body(model, prompt, images, count, aspect, resolution, fmt):
    if model == "rmbg":
        return {"image_url": images[0]}
    body = {"prompt": prompt, "image_urls": images, "num_images": count, "output_format": fmt}
    if model == "gpt":
        body["quality"] = "high"
        body["image_size"] = GPT_SIZES[aspect] if aspect else "auto"
    else:
        if aspect:
            body["aspect_ratio"] = aspect
        if model == "nanopro" and resolution:
            body["resolution"] = resolution
    return body


def http(method, url, key, body=None, timeout=90):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method, headers={
        "Authorization": f"Key {key}", "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, json.loads(r.read() or b"{}")
    except urllib.error.HTTPError as e:
        text = e.read().decode(errors="replace")[:400]
        try:
            return e.code, json.loads(text)
        except ValueError:
            return e.code, {"detail": text}
    except (urllib.error.URLError, OSError) as e:
        fail(f"could not reach {url.split('/')[2]}: {getattr(e, 'reason', e)}. "
             "Check the network or proxy allows fal.ai.")


def result_urls(res):
    urls = []
    for key in ("images", "outputs", "output", "data"):
        for item in res.get(key) or []:
            if isinstance(item, dict) and item.get("url"):
                urls.append(item["url"])
            elif isinstance(item, str) and item.startswith("http"):
                urls.append(item)
    for key in ("image", "output_image"):
        node = res.get(key)
        if isinstance(node, dict) and node.get("url"):
            urls.append(node["url"])
    return urls


def save(url, out_dir, stem, i):
    if url.startswith("data:"):
        header, b64 = url.split(",", 1)
        ext = mimetypes.guess_extension(header[5:].split(";")[0]) or ".png"
        content = base64.b64decode(b64)
    else:
        with urllib.request.urlopen(url, timeout=120) as r:
            content = r.read()
            ext = mimetypes.guess_extension(r.headers.get_content_type()) or ".png"
    path = out_dir / f"{stem}_{i}{'.jpg' if ext == '.jpe' else ext}"
    path.write_bytes(content)
    return str(path), len(content)


def main():
    ap = argparse.ArgumentParser(description="Edit an image with fal.ai models.")
    ap.add_argument("--image", action="append", required=False,
                    help="source image (path or URL); repeat up to 3 times, the first is the base")
    ap.add_argument("--prompt", default="", help="what to change")
    ap.add_argument("--action", default="edit", choices=sorted(ACTIONS))
    ap.add_argument("--model", default=None, choices=sorted(MODELS))
    ap.add_argument("--count", type=int, default=1, help="1-4 outputs")
    ap.add_argument("--aspect-ratio", choices=ASPECTS, help="omit to keep the source ratio")
    ap.add_argument("--resolution", choices=["1K", "2K", "4K"],
                    help="nanopro only; set 2K/4K for large sources or output is 1K")
    ap.add_argument("--format", default="png", choices=FORMATS)
    ap.add_argument("--out", default=os.environ.get("IMAGE_EDIT_OUTPUT", "image-edit-output"))
    ap.add_argument("--dry-run", action="store_true", help="print the request and stop")
    ap.add_argument("--list", action="store_true", help="list actions and models")
    a = ap.parse_args()

    if a.list:
        print(json.dumps({"models": {k: v[3] for k, v in MODELS.items()},
                          "actions": sorted(ACTIONS)}, indent=2))
        return
    if not a.image:
        fail("at least one --image is required")
    if len(a.image) > 3:
        fail("at most 3 images")

    model = a.model or ("rmbg" if a.action == "remove_bg" else DEFAULT_MODEL)
    if a.action == "remove_bg" and model != "rmbg":
        model = "rmbg"
    if model == "rmbg" and a.action != "remove_bg":
        fail("the rmbg model only does --action remove_bg")
    if a.resolution and model != "nanopro":
        fail(f"--resolution only works with nanopro, not {model}")
    count = max(1, min(4, a.count))

    prompt = build_prompt(a.action, a.prompt)
    endpoint, timeout, poll_s, _ = MODELS[model]
    images = [to_input(s) for s in a.image]
    body = build_body(model, prompt, images, count, a.aspect_ratio, a.resolution, a.format)

    if a.dry_run:
        shown = {k: (["<image>"] * len(v) if k == "image_urls" else ("<image>" if k == "image_url" else v))
                 for k, v in body.items()}
        print(json.dumps({"endpoint": f"{QUEUE}/{endpoint}", "body": shown}, indent=2))
        return

    key = os.environ.get("FAL_KEY")
    if not key:
        fail("FAL_KEY is not set. Create a key at https://fal.ai/dashboard/keys and export FAL_KEY=...")

    status, sub = http("POST", f"{QUEUE}/{endpoint}", key, body)
    if status != 200:
        fail(f"submit failed (HTTP {status}): {sub.get('detail', sub)}")
    request_id = sub.get("request_id")
    status_url = sub.get("status_url") or f"{QUEUE}/{endpoint}/requests/{request_id}/status"
    response_url = sub.get("response_url") or f"{QUEUE}/{endpoint}/requests/{request_id}"
    print(f"submitted {request_id} ({a.action}, {model})", file=sys.stderr)

    deadline = time.time() + timeout
    while True:
        code, st = http("GET", status_url, key)
        state = st.get("status")
        if state == "COMPLETED":
            break
        if state in ("FAILED", "CANCELLED") or code >= 400 and code != 429:
            fail(f"job {state or code}: {st.get('detail', st)}", request_id=request_id)
        if time.time() > deadline:
            fail(f"timed out after {timeout}s; the job may still finish", request_id=request_id,
                 response_url=response_url)
        time.sleep(poll_s)

    code, res = http("GET", response_url, key)
    if code != 200:
        fail(f"could not fetch result (HTTP {code}): {res.get('detail', res)}", request_id=request_id)
    urls = result_urls(res)
    if not urls:
        fail(f"no image in response; keys: {list(res)}", request_id=request_id)

    out_dir = Path(a.out)
    out_dir.mkdir(parents=True, exist_ok=True)
    stem = f"{datetime.now():%Y%m%d_%H%M%S}_{a.action}"
    saved = []
    for i, u in enumerate(urls):
        path, size = save(u, out_dir, stem, i)
        saved.append({"local_path": path, "size_bytes": size})

    print(json.dumps({"success": True, "model": model, "action": a.action, "prompt": prompt,
                      "request_id": request_id, "images": saved}, indent=2))


if __name__ == "__main__":
    main()
