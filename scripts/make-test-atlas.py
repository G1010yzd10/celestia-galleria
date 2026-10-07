#!/usr/bin/env python3
"""Synthetic 9-frame atlas for E2E-testing the Sprite Forge API.
Draws a 'test relic' whose front face color shifts per angle so frame
switching is verifiable in-engine. Emits JSON for curl."""
import base64, io, json, sys
from PIL import Image, ImageDraw

CELL = 320
N = 9
img = Image.new("RGBA", (CELL * N, CELL), (0, 0, 0, 0))
for k in range(N):
    d = ImageDraw.Draw(img)
    x0 = k * CELL
    hue = int(255 * k / (N - 1))
    # pedestal-shadow ellipse + relic body, hue-coded per angle
    body = (255 - hue, 120, hue, 255)
    d.ellipse([x0 + 40, 236, x0 + 280, 268], fill=(20, 14, 6, 90))
    d.rectangle([x0 + 80, 60, x0 + 240, 240], fill=body, outline=(255, 220, 140, 255), width=6)
    # front marker: a notch that moves with the angle (rotation illusion)
    notch_x = x0 + 80 + int(160 * k / (N - 1))
    d.rectangle([notch_x, 60, notch_x + 24, 84], fill=(255, 233, 176, 255))
    # big angle digit drawn as tally marks (no font issues)
    for i in range(k + 1):
        d.line([x0 + 100 + i * 18, 210, x0 + 100 + i * 18, 236], fill=(255, 233, 176, 255), width=5)

buf = io.BytesIO()
img.save(buf, "PNG")
b64 = base64.b64encode(buf.getvalue()).decode()
out = {
    "name": "ECHO RELIC",
    "category": "CURATED",
    "price": 77,
    "blurb": "E2E test relic — a hue-coded box uploaded through the Forge API.",
    "accent": "#2dd4bf",
    "spriteW": 0.6,
    "spriteH": 0.5,
    "atlasDataUrl": f"data:image/png;base64,{b64}",
}
with open("/home/z/my-project/scripts/test-product.json", "w") as f:
    json.dump(out, f)
img.save("/home/z/my-project/scripts/test-atlas.png")
print("bytes:", len(buf.getvalue()), "-> scripts/test-product.json")
