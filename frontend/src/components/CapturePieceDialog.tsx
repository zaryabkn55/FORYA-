import { FormEvent, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { capturePiece, liftSupported, type CapturedPhoto } from '../lib/subjectLift';
import { Icon } from './Icon';
import { Modal } from './Overlay';

const CATEGORIES = ['Tops', 'Knitwear', 'Jacket', 'Outerwear', 'Trousers', 'Bottoms', 'Dresses', 'Shoes', 'Bags', 'Accessories'] as const;

/**
 * Photograph a piece you already own and put it in your wardrobe.
 *
 * App only. The background is lifted on the device, so the piece arrives looking like the rest of
 * the catalogue — on paper, not on a bedroom floor. Where the device can't manage the cut-out the
 * photo is kept as-is and the dialog says so, rather than refusing the piece.
 */
export function CapturePieceDialog({ onClose, onAdded }: { onClose: () => void; onAdded: (name: string) => void }) {
  const [shot, setShot] = useState<CapturedPhoto | null>(null);
  const [busy, setBusy] = useState<'camera' | 'library' | 'saving' | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('Tops');
  const [colorName, setColorName] = useState('');
  const [error, setError] = useState('');
  const [canLift, setCanLift] = useState(true);

  useEffect(() => {
    liftSupported().then(setCanLift);
  }, []);

  const take = async (source: 'camera' | 'library') => {
    setError('');
    setBusy(source);
    try {
      const photo = await capturePiece(source);
      if (photo) setShot(photo);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!shot) return;
    if (!name.trim()) return setError('Give the piece a name.');
    setBusy('saving');
    setError('');
    try {
      await api.capturePiece({
        name: name.trim(),
        category,
        colorName: colorName.trim() || undefined,
        image: shot.image,
        backgroundRemoved: shot.backgroundRemoved,
      });
      onAdded(name.trim());
      onClose();
    } catch (err) {
      setError((err as Error).message);
      setBusy(null);
    }
  };

  return (
    <Modal title="Add a piece" wink="you own." onClose={onClose}>
      <form className="stack" style={{ gap: 18 }} onSubmit={save}>
        {!shot ? (
          <>
            <div className="capture-intro">
              <Icon name="camera" size={28} />
              <p className="small">
                Lay the piece on a plain surface and fill the frame.
                {canLift ? ' We’ll lift it off the background for you.' : ' We’ll keep the photo as it is on this device.'}
              </p>
            </div>
            <div className="row wrap" style={{ gap: 10 }}>
              <button type="button" className="btn btn-primary" disabled={!!busy} onClick={() => take('camera')}>
                <Icon name="camera" size={18} /> {busy === 'camera' ? 'Opening…' : 'Take a photo'}
              </button>
              <button type="button" className="btn btn-quiet" disabled={!!busy} onClick={() => take('library')}>
                <Icon name="plus" size={18} /> {busy === 'library' ? 'Opening…' : 'Choose one'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="capture-preview">
              <img src={`data:image/png;base64,${shot.image}`} alt="The piece you photographed" />
            </div>
            <div className="row between wrap" style={{ gap: 8 }}>
              <span className="small">
                {shot.backgroundRemoved ? 'Background removed.' : 'Kept as photographed — the background couldn’t be lifted.'}
              </span>
              <button type="button" className="btn btn-quiet btn-sm" onClick={() => setShot(null)} disabled={busy === 'saving'}>
                Retake
              </button>
            </div>

            <div className="field">
              <label className="label" htmlFor="piece-name">
                What is it?
              </label>
              <input
                id="piece-name"
                className="input"
                placeholder="Black biker jacket"
                value={name}
                autoFocus
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="field">
              <span className="label">Where it sits</span>
              <div className="row wrap" style={{ gap: 8 }}>
                {CATEGORIES.map((c) => (
                  <button type="button" key={c} className={`chip ${c === category ? 'is-active' : ''}`} onClick={() => setCategory(c)}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label className="label" htmlFor="piece-colour">
                Colour <span className="hint">(optional)</span>
              </label>
              <input id="piece-colour" className="input" placeholder="Black" value={colorName} onChange={(e) => setColorName(e.target.value)} />
            </div>

            {error && <div className="form-error">{error}</div>}

            <div className="row" style={{ justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
              <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy === 'saving'}>
                Cancel
              </button>
              <button className="btn btn-primary" disabled={busy === 'saving'}>
                {busy === 'saving' ? 'Adding…' : 'Add to wardrobe'} <Icon name="arrowRight" size={18} />
              </button>
            </div>
          </>
        )}

        {!shot && error && <div className="form-error">{error}</div>}
      </form>
    </Modal>
  );
}
