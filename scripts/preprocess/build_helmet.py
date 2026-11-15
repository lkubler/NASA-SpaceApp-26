#!/usr/bin/env python3
"""Helmet frame for the Walk (specs/feedback-1.md "Helmet frame"):
docs/design/helm-source.webp (AI-generated, green screen, RGB) -> app/src/steps/4-walk/helmet-frame.webp (RGBA)
1. green keyed out: alpha from the green excess G - max(R, B), ramped between LO and HI; edge pixels despilled
   (green clamped to max(R, B)) so no green fringe remains on the rim;
2. "AI-generated image" drawn into the pixels on the opaque frame, bottom left (the frame is shown with
   object-fit: fill at 16:9, so nothing is cropped).
Run from repo root: python3 scripts/preprocess/build_helmet.py [source.webp]
(the source was removed from the repository in the cleanup; get it with
 git show 8af4355^:docs/design/helm-source.webp > helm-source.webp)
"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

SRC = Path(sys.argv[1] if len(sys.argv) > 1 else "docs/design/helm-source.webp")
OUT = Path("app/src/steps/4-walk/helmet-frame.webp")
LO, HI = 24, 150          # green excess: below LO opaque, above HI fully keyed
FONTS = ["/usr/share/fonts/opentype/inter/Inter-SemiBold.otf", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
         "/System/Library/Fonts/Supplemental/Arial Bold.ttf"]

im = np.asarray(Image.open(SRC).convert("RGB")).astype(np.float32)
r, g, b = im[..., 0], im[..., 1], im[..., 2]
spill = g - np.maximum(r, b)
alpha = 1.0 - np.clip((spill - LO) / (HI - LO), 0, 1)
# remove the green from what stays (edges and any tint on the rim)
g2 = np.minimum(g, np.maximum(r, b))
# semi-transparent edge pixels: darken towards the frame colour instead of keeping the key's brightness
rgb = np.stack([r, g2, b], -1)
out = np.dstack([rgb, alpha * 255]).clip(0, 255).astype(np.uint8)
img = Image.fromarray(out, "RGBA")
# soften the keyed edge by one pixel (alpha only), so the rim is not jagged
a = img.getchannel("A").filter(ImageFilter.GaussianBlur(0.6))
a = Image.fromarray(np.minimum(np.asarray(a), np.asarray(img.getchannel("A"))))
img.putalpha(a)

# the AI mark, bottom left on the opaque frame: small and quiet, but readable (team feedback, Sun 15.11.)
W, H = img.size
font = next((ImageFont.truetype(f, round(H * 0.015)) for f in FONTS if Path(f).exists()), ImageFont.load_default())
text = "AI-generated image"
d = ImageDraw.Draw(img)
x0, y0 = round(W * 0.016), round(H * 0.952)
bb = d.textbbox((x0, y0), text, font=font, anchor="ls")
pad = round(H * 0.005)
d.rounded_rectangle((bb[0] - pad, bb[1] - pad, bb[2] + pad, bb[3] + pad), radius=pad, fill=(0, 0, 0, 150))
d.text((x0, y0), text, font=font, fill=(255, 255, 255, 200), anchor="ls")

OUT.parent.mkdir(parents=True, exist_ok=True)
img.save(OUT, "WEBP", quality=88, method=6)
print(OUT, img.size, OUT.stat().st_size)
