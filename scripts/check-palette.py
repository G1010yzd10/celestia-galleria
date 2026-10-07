#!/usr/bin/env python3
"""Quick palette sanity check on the Celestia Galleria verification shots."""
import struct, zlib, sys

def png_pixels(path):
    """Minimal PNG reader: returns (w, h, rows[bytes]) for RGBA/RGB 8-bit."""
    with open(path, "rb") as f:
        data = f.read()
    assert data[:8] == b"\x89PNG\r\n\x1a\n", "not a PNG"
    pos = 8
    w = h = None
    bitdepth = coltype = None
    idat = b""
    while pos < len(data):
        ln = struct.unpack(">I", data[pos:pos+4])[0]
        typ = data[pos+4:pos+8]
        chunk = data[pos+8:pos+8+ln]
        if typ == b"IHDR":
            w, h, bitdepth, coltype = struct.unpack(">IIBB", chunk[:10])
        elif typ == b"IDAT":
            idat += chunk
        pos += 12 + ln
    raw = zlib.decompress(idat)
    ch = 4 if coltype == 6 else 3
    stride = w * ch
    # un-filter (paeth) — handle filter types 0-4 per row
    def paeth(a, b, c):
        p = a + b - c
        pa, pb, pc = abs(p-a), abs(p-b), abs(p-c)
        return a if pa <= pb and pa <= pc else (b if pb <= pc else c)
    rows = []
    prev = bytearray(stride)
    i = 0
    for y in range(h):
        ftype = raw[i]; i += 1
        line = bytearray(raw[i:i+stride]); i += stride
        if ftype == 0:
            pass
        elif ftype == 1:
            for x in range(ch, stride):
                line[x] = (line[x] + line[x-ch]) & 0xFF
        elif ftype == 2:
            for x in range(stride):
                line[x] = (line[x] + prev[x]) & 0xFF
        elif ftype == 3:
            for x in range(stride):
                a = line[x-ch] if x >= ch else 0
                line[x] = (line[x] + (a + prev[x]) // 2) & 0xFF
        elif ftype == 4:
            for x in range(stride):
                a = line[x-ch] if x >= ch else 0
                c = prev[x-ch] if x >= ch else 0
                line[x] = (line[x] + paeth(a, prev[x], c)) & 0xFF
        rows.append(bytes(line))
        prev = line
    return w, h, ch, rows

def analyze(path):
    STEP = 32
    w, h, ch, rows = png_pixels(path)
    n = 0
    rs = gs = bs = 0
    gold = aqua = pearl = 0
    for y in range(0, h, STEP):
        line = rows[y]
        for x in range(0, w, STEP):
            o = x * ch
            r, g, b = line[o], line[o+1], line[o+2]
            rs += r; gs += g; bs += b; n += 1
            if r > 150 and g > 110 and b < 130 and r > b + 60:
                gold += 1          # golden light / gold trim / amber HUD
            elif g > 130 and b > 110 and r < g:
                aqua += 1          # lagoon / teal accents
            elif r > 200 and g > 200 and b > 185:
                pearl += 1         # pearl sky / marble
    print(f"{path.split('/')[-1]}: {w}x{h}  avg RGB ({rs//n},{gs//n},{bs//n})  "
          f"gold {(gold*100)//n}%  aqua {(aqua*100)//n}%  pearl {(pearl*100)//n}%")

for p in sys.argv[1:]:
    analyze(p)
