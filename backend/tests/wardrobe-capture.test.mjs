/**
 * Exercises the capture routes against a stubbed Prisma client.
 *
 * The real client cannot be generated in this container (its engine CDN is blocked), so this
 * checks everything above the database: routing, auth, validation, PNG sniffing, size limits,
 * ownership checks and status codes.
 */
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import Module from 'node:module';

const require = createRequire(import.meta.url);
const BACKEND = new URL('..', import.meta.url).pathname.replace(/\/$/, '');

/* ── in-memory stand-in for the database ─────────────────────────────────── */
const db = { products: new Map(), images: new Map(), wardrobe: new Map() };
const clone = (o) => (o === undefined ? o : JSON.parse(JSON.stringify(o, (k, v) => (v?.type === 'Buffer' ? v : v))));

const match = (row, where) =>
  Object.entries(where).every(([k, v]) => (v === null ? row[k] == null : typeof v === 'object' && v !== null ? true : row[k] === v));

const fake = {
  product: {
    findMany: async ({ where = {} } = {}) => [...db.products.values()].filter((p) => match(p, where)),
    findFirst: async ({ where = {} } = {}) => [...db.products.values()].find((p) => match(p, where)) ?? null,
    findUnique: async ({ where }) => db.products.get(where.id) ?? null,
    count: async ({ where = {} } = {}) => [...db.products.values()].filter((p) => match(p, where)).length,
    create: async ({ data }) => {
      const { image, ...rest } = data;
      const row = { ...rest, createdAt: new Date(), updatedAt: new Date() };
      db.products.set(row.id, row);
      if (image?.create) db.images.set(row.id, { ...image.create, productId: row.id, product: row });
      return row;
    },
    delete: async ({ where }) => {
      const row = db.products.get(where.id);
      db.products.delete(where.id);
      db.images.delete(where.id);
      for (const [k, w] of db.wardrobe) if (w.productId === where.id) db.wardrobe.delete(k);
      return row;
    },
  },
  productImage: {
    findUnique: async ({ where }) => {
      const r = db.images.get(where.productId);
      return r ? { ...r, product: { ownerId: db.products.get(where.productId)?.ownerId ?? null } } : null;
    },
  },
  wardrobeItem: {
    findMany: async ({ where }) => [...db.wardrobe.values()].filter((w) => w.userId === where.userId),
    deleteMany: async ({ where }) => {
      for (const [k, w] of db.wardrobe) if (w.userId === where.userId && w.productId === where.productId) db.wardrobe.delete(k);
    },
    upsert: async ({ where, create }) => {
      const k = `${where.userId_productId.userId}:${where.userId_productId.productId}`;
      db.wardrobe.set(k, { ...(db.wardrobe.get(k) ?? create), createdAt: new Date(), timesWorn: 0, owned: true });
    },
  },
  $connect: async () => {},
  $queryRaw: async () => [{ 1: 1 }],
};

const origLoad = Module._load;
Module._load = function (req, ...rest) {
  if (req === '@prisma/client') return { PrismaClient: function () { return fake; }, Prisma: {} };
  return origLoad.call(this, req, ...rest);
};

/* ── env the app insists on ───────────────────────────────────────────────── */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'x'.repeat(48);
process.env.DATABASE_URL = 'postgresql://u:p@localhost:5432/d';
process.env.ALLOWED_ORIGINS = 'https://forya.onrender.com,capacitor://localhost';

require('tsx/cjs');
const { app } = require(`${BACKEND}/src/app.ts`);
const { signToken } = require(`${BACKEND}/src/middlewares/auth.ts`);

/* ── a real PNG with alpha, and a few invalid payloads ────────────────────── */
const here = new URL('.', import.meta.url).pathname;
const pngWithAlpha = readFileSync(process.argv[2] ?? `${here}fixtures/cutout.png`);

const tokenA = signToken({ id: 'userA', email: 'a@x.com' });
const tokenB = signToken({ id: 'userB', email: 'b@x.com' });

const server = app.listen(0);
await new Promise((r) => server.once('listening', r));
const base = `http://127.0.0.1:${server.address().port}`;

const call = async (method, path, { token, body } = {}) => {
  const res = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const ct = res.headers.get('content-type') ?? '';
  return { status: res.status, ct, body: ct.includes('json') ? await res.json().catch(() => null) : Buffer.from(await res.arrayBuffer()) };
};

let pass = 0, fail = 0;
const check = (name, cond, detail = '') => {
  if (cond) { pass++; console.log(`  ok    ${name}`); }
  else { fail++; console.log(`  FAIL  ${name}  ${detail}`); }
};

const b64 = pngWithAlpha.toString('base64');
const jpegBytes = readFileSync(process.argv[3] ?? `${here}fixtures/photo.jpg`);

// 1. unauthenticated capture is refused
let r = await call('POST', '/api/wardrobe/capture', { body: { name: 'x', category: 'Tops', image: b64 } });
check('capture requires sign-in', r.status === 401, `got ${r.status}`);

// 2. a valid capture
r = await call('POST', '/api/wardrobe/capture', { token: tokenA, body: { name: 'Black biker jacket', category: 'Outerwear', colorName: 'Black', image: b64 } });
check('valid capture returns 201', r.status === 201, `got ${r.status} ${JSON.stringify(r.body).slice(0, 120)}`);
const pid = r.body?.product?.id;
check('capture returns the new piece', !!pid && r.body.product.name === 'Black biker jacket');
check('piece points at the private image route', r.body?.product?.imageUrl === `/api/wardrobe/items/${pid}/image`, r.body?.product?.imageUrl);
check('piece lands in the wardrobe as owned', r.body?.wardrobe?.some((w) => w.productId === pid && w.kind === 'owned'));

// 3. rubbish that claims to be a PNG
r = await call('POST', '/api/wardrobe/capture', { token: tokenA, body: { name: 'x', category: 'Tops', image: Buffer.from('x'.repeat(400)).toString('base64') } });
check('non-PNG is rejected', r.status === 400 && /not a PNG/i.test(r.body?.error ?? ''), `${r.status} ${r.body?.error}`);

// 3b. a real JPEG — right family, wrong format for a cut-out (no alpha channel)
r = await call('POST', '/api/wardrobe/capture', { token: tokenA, body: { name: 'x', category: 'Tops', image: jpegBytes.toString('base64') } });
check('JPEG is rejected (no transparency)', r.status === 400 && /not a PNG/i.test(r.body?.error ?? ''), `${r.status} ${r.body?.error}`);

// 4. a category that isn't ours
r = await call('POST', '/api/wardrobe/capture', { token: tokenA, body: { name: 'x', category: 'Hats', image: b64 } });
check('unknown category is rejected', r.status === 400, `got ${r.status}`);

// 5. empty name
r = await call('POST', '/api/wardrobe/capture', { token: tokenA, body: { name: '   ', category: 'Tops', image: b64 } });
check('blank name is rejected', r.status === 400, `got ${r.status}`);

// 6. the owner can read the image back, and gets the real bytes
r = await call('GET', `/api/wardrobe/items/${pid}/image`, { token: tokenA });
check('owner can fetch the image', r.status === 200 && r.ct.startsWith('image/png'), `${r.status} ${r.ct}`);
check('bytes come back intact', Buffer.isBuffer(r.body) && r.body.equals(pngWithAlpha), `${r.body?.length} vs ${pngWithAlpha.length}`);

// 7. someone else cannot — and gets 404, not 403, so the route never admits the piece exists
r = await call('GET', `/api/wardrobe/items/${pid}/image`, { token: tokenB });
check('another member gets 404, not 403', r.status === 404, `got ${r.status}`);

// 8. signed-out request for the image
r = await call('GET', `/api/wardrobe/items/${pid}/image`);
check('image requires sign-in', r.status === 401, `got ${r.status}`);

// 9. the piece is listed under /pieces for its owner only
r = await call('GET', '/api/wardrobe/pieces', { token: tokenA });
check('owner sees their piece', Array.isArray(r.body) && r.body.length === 1 && r.body[0].id === pid);
r = await call('GET', '/api/wardrobe/pieces', { token: tokenB });
check('other member sees none', Array.isArray(r.body) && r.body.length === 0);

// 10. personal pieces must not appear in the public catalogue
r = await call('GET', '/api/products');
const ids = (Array.isArray(r.body) ? r.body : []).map((p) => p.id);
check('piece is absent from the public catalogue', !ids.includes(pid), `catalogue returned ${ids.length} rows`);
r = await call('GET', `/api/products/${pid}`);
check('piece is not readable as a catalogue product', r.status === 404, `got ${r.status}`);

// 11. another member cannot delete it
r = await call('DELETE', `/api/wardrobe/items/${pid}`, { token: tokenB });
check('other member cannot delete it', r.status === 404, `got ${r.status}`);

// 12. the owner can
r = await call('DELETE', `/api/wardrobe/items/${pid}`, { token: tokenA });
check('owner can delete it', r.status === 200, `got ${r.status}`);
r = await call('GET', `/api/wardrobe/items/${pid}/image`, { token: tokenA });
check('image is gone afterwards', r.status === 404, `got ${r.status}`);

console.log(`\n  ${pass} passed, ${fail} failed`);
server.close();
process.exit(fail ? 1 : 0);
