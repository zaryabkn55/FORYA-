// Downloads every FORYA image from the generation CDN into public/images and records them in
// src/lib/imagery.local.json, so the app serves its own copies. Run from /frontend: `npm run images`.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = await readFile(path.join(root, 'src/lib/imagery.ts'), 'utf8');
const cdn = source.match(/const CDN = '([^']+)'/)[1];
const entries = [...source.matchAll(/^\s+(\w+): '(hf_[^']+)'/gm)].map(([, key, file]) => ({ key, file }));

const outDir = path.join(root, 'public/images');
await mkdir(outDir, { recursive: true });
const manifest = {};

for (const { key, file } of entries) {
  const target = path.join(outDir, `${key}.png`);
  if (!existsSync(target)) {
    const res = await fetch(cdn + file);
    if (!res.ok) {
      console.warn(`  ✗ ${key} (${res.status}) — keeping the CDN URL`);
      continue;
    }
    await writeFile(target, Buffer.from(await res.arrayBuffer()));
    console.log(`  ✓ ${key}`);
  }
  manifest[key] = `/images/${key}.png`;
}

await writeFile(path.join(root, 'src/lib/imagery.local.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`Vendored ${Object.keys(manifest).length}/${entries.length} images into public/images.`);
