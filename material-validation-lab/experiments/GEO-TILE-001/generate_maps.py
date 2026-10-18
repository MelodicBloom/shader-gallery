#!/usr/bin/env python3
"""GEO-TILE-001: original deterministic 2D material-field prototype (stdlib only)."""
from __future__ import annotations
import argparse
import hashlib
import json
import math
from pathlib import Path
import struct
import zlib

ALGORITHM = "geo-tile-field-v0.1"


def clamp(x, lo=0.0, hi=1.0):
    return max(lo, min(hi, x))


def smooth(a, b, x):
    t = clamp((x - a) / (b - a))
    return t * t * (3.0 - 2.0 * t)


def hash01(x, y, seed):
    # Explicit 32-bit integer arithmetic; no Python randomized hash().
    n = ((x * 374761393) ^ (y * 668265263) ^ (seed * 2246822519)) & 0xffffffff
    n = ((n ^ (n >> 13)) * 1274126177) & 0xffffffff
    return ((n ^ (n >> 16)) & 0xffffffff) / 4294967295.0


def noise(x, y, seed):
    ix, iy = math.floor(x), math.floor(y)
    fx, fy = smooth(0, 1, x - ix), smooth(0, 1, y - iy)
    a, b = hash01(ix, iy, seed), hash01(ix + 1, iy, seed)
    c, d = hash01(ix, iy + 1, seed), hash01(ix + 1, iy + 1, seed)
    return (a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy


def field(u, v, tiles, seed, wear_gain):
    gx, gy = u * tiles, v * tiles
    tx, ty = min(int(gx), tiles - 1), min(int(gy), tiles - 1)
    lx, ly = gx - tx, gy - ty
    if (tx + ty) % 2:
        lx, ly = 1 - lx, 1 - ly
    r0 = math.hypot(lx, ly)
    arc = max(math.exp(-((r0 - 0.54) / 0.075) ** 2),
              .82 * math.exp(-((r0 - 0.82) / 0.066) ** 2))
    # Concentric rings centered on one corner: 180-degree parity now changes layout.
    groove = math.exp(-((r0 - 0.69) / 0.033) ** 2)
    border = min(lx, 1 - lx, ly, 1 - ly)
    tile_mask = smooth(0.008, 0.045, border)
    local_seed = seed + tx * 197 + ty * 389
    grain = noise(gx * 23, gy * 23, seed + 1)
    chip = noise(lx * 17, ly * 17, local_seed + 7)
    wear = wear_gain * smooth(0.57, 0.86, chip) * (0.28 + 0.72 * (1 - smooth(.012, .12, border)))
    scratch_gate = smooth(.70, .85, noise(lx * 6, ly * 6, local_seed + 11))
    scratch = scratch_gate * (0.5 + 0.5 * math.cos((lx + ly) * 95)) * 0.025 * wear_gain
    height = clamp((0.22 + 0.55 * arc - 0.12 * groove + 0.025 * (grain - .5)
                    - wear - scratch) * tile_mask + 0.055 * (1 - tile_mask))
    roughness = clamp(0.36 + 0.25 * (1 - arc) + .36 * wear + .11 * (grain - .5), .08, .95)
    # Stylized cavity proxy, not measured/scanned ambient occlusion.
    ao = clamp(.66 + .34 * smooth(.06, .52, height))
    tone = clamp(.44 + .36 * arc + .14 * (grain - .5) - .45 * wear)
    color = (int(255 * clamp(.12 + .25 * tone)),
             int(255 * clamp(.26 + .46 * tone)),
             int(255 * clamp(.17 + .32 * tone)))
    return height, roughness, ao, color, int(255 * clamp(wear * 7))


def png_bytes(width, height, channels, bit_depth, pixels):
    color_type = {1: 0, 3: 2}[channels]
    stride = width * channels * (bit_depth // 8)
    assert len(pixels) == stride * height
    raw = b''.join(b'\x00' + pixels[row * stride:(row + 1) * stride] for row in range(height))

    def chunk(tag, data):
        return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff)

    return (b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, bit_depth, color_type, 0, 0, 0))
            + chunk(b'IDAT', zlib.compress(raw, level=9)) + chunk(b'IEND', b''))


def produce(size, tiles, seed, wear_gain, output):
    output.mkdir(parents=True, exist_ok=True)
    heights, roughs, aos, colors, wears = [], [], [], [], []
    for y in range(size):
        for x in range(size):
            h, r, ao, rgb, w = field((x + .5) / size, (y + .5) / size, tiles, seed, wear_gain)
            heights.append(h)
            roughs.append(int(round(r * 255)))
            aos.append(int(round(ao * 255)))
            colors.extend(rgb)
            wears.append(w)

    def height_at(x, y):
        return heights[min(size-1, max(0, y)) * size + min(size-1, max(0, x))]

    normals, preview = bytearray(), bytearray()
    for y in range(size):
        for x in range(size):
            idx = y * size + x
            dx = (height_at(x+1,y) - height_at(x-1,y)) * 2.5
            dy = (height_at(x,y+1) - height_at(x,y-1)) * 2.5
            nx, ny, nz = -dx, -dy, 1.0
            mag = math.sqrt(nx * nx + ny * ny + nz * nz)
            nx, ny, nz = nx/mag, ny/mag, nz/mag
            normals.extend((int(round((nx*.5+.5)*255)), int(round((ny*.5+.5)*255)), int(round((nz*.5+.5)*255))))
            # Diagnostic only: directional response for inspecting shape/roughness.
            light = clamp(.18 + .75 * max(0, .45*nx + .35*ny + .82*nz))
            spec = (max(0, .22*nx + .28*ny + .93*nz) ** (3 + 55*(1-roughs[idx]/255))) * .32
            for c in colors[3*idx:3*idx+3]:
                preview.append(int(round(clamp(c/255 * light * aos[idx]/255 + spec) * 255)))

    filenames = {
        'height.png': png_bytes(size, size, 1, 16, b''.join(struct.pack('>H', int(round(h * 65535))) for h in heights)),
        'roughness.png': png_bytes(size, size, 1, 8, bytes(roughs)),
        'ambient_occlusion_proxy.png': png_bytes(size, size, 1, 8, bytes(aos)),
        'base_color.png': png_bytes(size, size, 3, 8, bytes(colors)),
        'normal_tangent_proxy.png': png_bytes(size, size, 3, 8, normals),
        'wear_mask.png': png_bytes(size, size, 1, 8, bytes(wears)),
        'metalness.png': png_bytes(size, size, 1, 8, bytes(size * size)),
        'diagnostic_preview.png': png_bytes(size, size, 3, 8, preview),
    }
    hashes = {}
    for filename, payload in filenames.items():
        (output / filename).write_bytes(payload)
        hashes[filename] = hashlib.sha256(payload).hexdigest()
    mean = sum(heights)/len(heights)
    receipt = {
        'specimen': 'GEO-TILE-001', 'algorithm': ALGORITHM, 'status': 'synthetic-field-generated-not-renderer-validated',
        'inputs': {'size': size, 'tiles': tiles, 'seed': seed, 'wear_gain': wear_gain},
        'map_semantics': {'height.png': '16-bit linear height normalized; relative units',
                          'normal_tangent_proxy.png': '8-bit tangent-space +Z, positive Y; normal strength proxy',
                          'roughness.png': '8-bit linear roughness', 'ambient_occlusion_proxy.png': '8-bit cavity proxy',
                          'base_color.png': '8-bit sRGB-styled base color', 'metalness.png': '8-bit zero/dielectric',
                          'wear_mask.png': '8-bit art-direction mask', 'diagnostic_preview.png': 'not physically based'},
        'metrics': {'height_min': round(min(heights),6), 'height_max': round(max(heights),6),
                    'height_stddev': round(math.sqrt(sum((h-mean)**2 for h in heights)/len(heights)),6)},
        'sha256': hashes, 'claims': ['deterministic synthetic map generator'],
        'non_claims': ['material faithfully matches referenced artist', 'measured material',
                       'InstaMAT graph exported', 'glTF-ready without normal/UV evaluation',
                       'validated grazing/light sweep', 'real-time GPU performance'],
    }
    (output / 'receipt.json').write_text(json.dumps(receipt, indent=2, sort_keys=True)+'\n', encoding='utf-8')
    return receipt


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--size', type=int, default=256, help='square map resolution 32..2048')
    parser.add_argument('--tiles', type=int, default=6, help='pattern repetitions per axis 2..16')
    parser.add_argument('--seed', type=int, default=42, help='integer 0..2147483647')
    parser.add_argument('--wear-gain', type=float, default=.4, help='bounded artistic wear multiplier 0..1')
    parser.add_argument('--output', type=Path, default=Path('out/geo-tile-001'))
    args = parser.parse_args()
    if not (32 <= args.size <= 2048 and 2 <= args.tiles <= 16 and 0 <= args.seed <= 2147483647
            and math.isfinite(args.wear_gain) and 0 <= args.wear_gain <= 1):
        parser.error('bounds: size=32..2048, tiles=2..16, seed=0..2147483647, wear-gain=0..1')
    receipt = produce(args.size, args.tiles, args.seed, args.wear_gain, args.output)
    print(json.dumps({'output': str(args.output), 'status': receipt['status'], 'metrics': receipt['metrics']}, indent=2))


if __name__ == '__main__':
    main()
