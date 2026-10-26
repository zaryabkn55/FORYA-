/**
 * Just enough PNG parsing to trust an upload.
 *
 * The cut-out arrives from the phone as a PNG with an alpha channel. Before it goes anywhere near
 * the database we want to know it really is a PNG and how big it is — a client-declared
 * content-type proves nothing, and a 20-megapixel image would sit in Postgres forever.
 *
 * There is no image library on the server on purpose: the only thing that needs decoding is the
 * 25-byte header, and pulling in sharp for that would add a native build step to the deploy.
 */

const MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // a 2000px cut-out lands well under this
export const MAX_DIMENSION = 2400;

export type PngInfo = { width: number; height: number; hasAlpha: boolean };

/**
 * Returns the image's dimensions, or a reason it was rejected. Never throws: a bad upload is an
 * ordinary 400, not a server fault.
 */
export function readPng(buf: Buffer): { ok: true; info: PngInfo } | { ok: false; reason: string } {
  if (buf.length < 33) return { ok: false, reason: 'That file is too small to be an image.' };
  if (buf.length > MAX_IMAGE_BYTES) return { ok: false, reason: 'That photo is too large.' };
  if (!buf.subarray(0, 8).equals(MAGIC)) return { ok: false, reason: 'That is not a PNG image.' };

  // The IHDR chunk must come first: [length:4][type:4]["IHDR"][width:4][height:4][depth][colour]
  if (buf.subarray(12, 16).toString('ascii') !== 'IHDR') return { ok: false, reason: 'That PNG header is malformed.' };

  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  const colourType = buf.readUInt8(25);

  if (!width || !height) return { ok: false, reason: 'That image has no size.' };
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    return { ok: false, reason: `Please send an image no larger than ${MAX_DIMENSION}px on its longest side.` };
  }

  // Colour types 4 and 6 carry an alpha channel; 3 is a palette, which may carry one via tRNS.
  const hasAlpha = colourType === 4 || colourType === 6 || colourType === 3;
  return { ok: true, info: { width, height, hasAlpha } };
}
