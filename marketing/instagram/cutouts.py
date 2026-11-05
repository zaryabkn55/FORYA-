"""Lift the garment out of its white studio background.

The product shots sit on near-white. Multiplying them onto a coloured ground leaves a faint box
wherever the studio white isn't pure, and on a dark ground they show as a white card. This removes
only the background *connected to the frame edge*, so whites inside the garment (a white shirt,
a cream bag) survive, then feathers the edge so it doesn't look cut with scissors.

    python3 marketing/instagram/cutouts.py
"""
import pathlib
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

ROOT = pathlib.Path(__file__).resolve().parents[2]
SRC  = ROOT / "frontend/public/images"
OUT  = pathlib.Path(__file__).parent / "cutouts"
OUT.mkdir(exist_ok=True)

PIECES = ["cashmereCrew", "tuxedoBlazer", "slipDress", "shoulderBag", "suedeHeelBoots",
          "navyBlazer", "stoneChinos", "suedeLoafers", "oxfordShirt", "suedeChelsea", "cashmereScarf"]

HOLES = {"shoulderBag", "cashmereScarf"}

def cut(name, tol=18):
    im = Image.open(SRC / f"{name}.webp").convert("RGB")
    a = np.asarray(im).astype(np.int16)
    # how far each pixel is from white, by its darkest channel
    dist = 255 - a.min(axis=2)
    near_white = dist <= tol
    lab, _ = ndimage.label(near_white)
    edge = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    bg = np.isin(lab, edge[edge > 0])
    if name in HOLES:
        pure, n = ndimage.label(dist <= 6)
        sizes = ndimage.sum(np.ones_like(dist), pure, range(1, n + 1))
        big = [i + 1 for i, sz in enumerate(sizes) if sz > 0.004 * dist.size]
        bg |= np.isin(pure, big)
    # Close pinholes in the background. Padding with background first matters: scipy treats
    # outside the array as foreground, so an unpadded closing leaves a 1px frame at the edge.
    P = 4
    bg = np.pad(bg, P, constant_values=True)
    bg = ndimage.binary_closing(bg, iterations=2)[P:-P, P:-P]
    # Pull the edge in by a pixel: the outermost garment pixels are half studio-white.
    bg = ndimage.binary_dilation(bg, iterations=1)
    alpha = np.asarray(Image.fromarray(((~bg) * 255).astype(np.uint8))
                       .filter(ImageFilter.GaussianBlur(0.9))).astype(np.float32) / 255
    # Remove the white the soft edge still carries, so it sits clean on a dark ground too.
    rgb = a.astype(np.float32)
    soft = (alpha > 0.02) & (alpha < 0.98)
    k = alpha[soft][:, None]
    rgb[soft] = np.clip((rgb[soft] - (1 - k) * 255) / k, 0, 255)
    out = np.dstack([rgb, alpha * 255]).astype(np.uint8)
    rgba = Image.fromarray(out, "RGBA")
    rgba = rgba.crop(rgba.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox())
    rgba.save(OUT / f"{name}.png", optimize=True)
    kept = 1 - bg.mean()
    return rgba.size, kept

for n in PIECES:
    size, kept = cut(n)
    print(f"  {n:<16} {size[0]}x{size[1]}  garment {kept:.0%} of frame")
