#!/bin/bash
# CELESTIA GALLERIA — Sprite Academy reference images (AI-generated)
cd /home/z/my-project
mkdir -p public/tutorial

echo "[1/3] turntable concept..."
z-ai image -p "Top-down technical illustration of a product photography turntable: a vintage camera stands at the center of a circular rotating platform, eight small camera icons placed evenly around the circle with curved arrows showing clockwise rotation steps, minimalist infographic vector style, cream and ivory background, warm gold and teal accent colors, soft studio lighting, clean elegant composition, no text, no labels" -o "./public/tutorial/ref-turntable.png" -s 1024x1024

echo "[2/3] 9-frame sheet example..."
z-ai image -p "Sprite sheet reference example: one single horizontal row of nine identical vintage film cameras side by side on a pure white background, each camera rotated exactly 40 degrees more than the previous one, starting with the front view and completing a full 360 degree turn, professional studio product photography, perfectly consistent scale, lighting and framing in every frame, sharp focus, catalog quality" -o "./public/tutorial/ref-sheet.png" -s 1344x768

echo "[3/3] size comparison lineup..."
z-ai image -p "Product size comparison lineup: a small coffee mug, a mirrorless camera, a game console, a dining chair and a large three-seat sofa all standing in one row on the same floor line at the same realistic scale, the mug is tiny and the sofa is huge, minimalist flat product illustration style with soft shadows, cream ivory background, warm gold and teal color palette, elegant premium e-commerce aesthetic, no text, no labels" -o "./public/tutorial/ref-sizes.png" -s 1344x768

echo "DONE"
ls -la public/tutorial/
