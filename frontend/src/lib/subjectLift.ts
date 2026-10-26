/**
 * Photographing a piece you already own, and lifting it off its background.
 *
 * Mobile only. The cut-out runs on the phone — iOS 17's Vision subject lifting, ML Kit's subject
 * segmentation on Android — because it is instant and free there, while the same model on the
 * server peaked at over a gigabyte against a 512MB container.
 *
 * Every failure here is soft. If the device is too old, the model is still downloading, or Vision
 * simply can't find a subject in the photo, the original image is used instead. Nobody should lose
 * the piece they just photographed because the cut-out didn't work.
 */
import { registerPlugin } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { isNative } from './apiBase';

export interface SubjectLiftPlugin {
  isSupported(): Promise<{ supported: boolean }>;
  /** `image` is base64 with no data: prefix. */
  lift(options: { image: string }): Promise<{ supported: boolean; lifted: boolean; image?: string; width?: number; height?: number }>;
}

const SubjectLift = registerPlugin<SubjectLiftPlugin>('SubjectLift');

export type CapturedPhoto = {
  /** Base64 PNG, cut out where the device managed it. */
  image: string;
  backgroundRemoved: boolean;
};

/** Only the native shell can do any of this. */
export const canCapture = (): boolean => isNative();

/**
 * Re-encodes whatever the camera returned as a PNG, scaled so the longest side is `max`.
 *
 * Two reasons. The server only accepts PNG, because a cut-out needs an alpha channel and JPEG has
 * none. And a modern phone camera produces something far larger than a wardrobe tile needs — this
 * keeps the upload to a few hundred kilobytes rather than several megabytes.
 */
async function toPng(base64: string, max = 1400): Promise<{ data: string; width: number; height: number }> {
  const img = new Image();
  img.decoding = 'async';
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('That photo could not be read.'));
    img.src = `data:image/png;base64,${base64}`;
  });

  const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('That photo could not be prepared.');
  ctx.drawImage(img, 0, 0, width, height);

  const data = canvas.toDataURL('image/png').split(',')[1] ?? '';
  return { data, width, height };
}

/**
 * Take or choose a photo, then lift the piece out of it.
 * Resolves to null when the person backs out of the camera.
 */
export async function capturePiece(source: 'camera' | 'library'): Promise<CapturedPhoto | null> {
  let shot;
  try {
    shot = await Camera.getPhoto({
      quality: 92,
      allowEditing: false,
      resultType: CameraResultType.Base64,
      source: source === 'camera' ? CameraSource.Camera : CameraSource.Photos,
      // A wardrobe tile is portrait-ish; this keeps the file small before it reaches the canvas.
      width: 1600,
      correctOrientation: true,
    });
  } catch {
    return null; // cancelled, or permission declined — the caller shows nothing
  }

  const original = shot.base64String;
  if (!original) return null;

  try {
    const result = await SubjectLift.lift({ image: original });
    if (result.lifted && result.image) {
      // Already a cropped PNG from the native side; still normalise the size.
      const png = await toPng(result.image);
      return { image: png.data, backgroundRemoved: true };
    }
  } catch {
    // Plugin missing or threw — fall through to the original photo.
  }

  const png = await toPng(original);
  return { image: png.data, backgroundRemoved: false };
}

/** Whether this device can actually cut out backgrounds, for wording in the UI. */
export async function liftSupported(): Promise<boolean> {
  if (!isNative()) return false;
  try {
    return (await SubjectLift.isSupported()).supported;
  } catch {
    return false;
  }
}
