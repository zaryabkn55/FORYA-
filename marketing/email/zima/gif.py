# Assemble rendered frames into looping, palette-shared GIFs.
#   python3 gif.py <frames-dir> <name> <out.gif>
import json, sys, glob
from PIL import Image
d, name, out = sys.argv[1:4]
ms = json.load(open(f'{d}/{name}.json'))
frames = [Image.open(f).convert('RGB') for f in sorted(glob.glob(f'{d}/{name}-*.png'))]
assert len(frames) == len(ms), (len(frames), len(ms))
# One palette for the whole loop, so photos don't shimmer between frames.
w, h = frames[0].size
sample = Image.new('RGB', (w, h * min(len(frames), 6)))
for i, f in enumerate(frames[:: max(1, len(frames) // 6)][:6]):
    sample.paste(f, (0, i * h))
pal = sample.quantize(colors=int(sys.argv[4]) if len(sys.argv)>4 else 255, method=Image.Quantize.MEDIANCUT)
q = [f.quantize(palette=pal, dither=Image.Dither.FLOYDSTEINBERG) for f in frames]
q[0].save(out, save_all=True, append_images=q[1:], duration=ms, loop=0, optimize=True, disposal=1)
import os; print(out, f'{os.path.getsize(out)/1e6:.2f} MB', f'{w}x{h}', len(frames), 'frames')
