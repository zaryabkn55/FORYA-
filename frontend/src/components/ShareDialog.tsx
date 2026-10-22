import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { award, getPoints, levelFor } from '../lib/points';
import { lookUrl, snapshot } from '../lib/share';
import { renderLookImage, type ImageFormat } from '../lib/shareImage';
import { useSession } from '../lib/session';
import { useStore } from '../lib/store';
import type { Moment } from '../lib/types';
import { Icon } from './Icon';
import { Modal } from './Overlay';

type Network = 'whatsapp' | 'x' | 'facebook' | 'pinterest' | 'email';

/** Share a look: a link friends can react to, ready-made posts for socials, and an image sized for Instagram. */
export function ShareDialog({ moment, onClose }: { moment: Moment; onClose: () => void }) {
  const { user } = useSession();
  const { product, toast } = useStore();
  const [link, setLink] = useState('');
  const [path, setPath] = useState('');
  const navigate = useNavigate();
  const [format, setFormat] = useState<ImageFormat>('post');
  const [image, setImage] = useState<{ url: string; blob: Blob } | null>(null);
  const [imageError, setImageError] = useState('');
  const [points, setPoints] = useState(() => getPoints(user?.id).total);
  const [earned, setEarned] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const by = user?.name ?? 'Me';

  // Create the link once.
  useEffect(() => {
    api
      .shareLook(moment.id, snapshot(moment, by))
      .then(({ path }) => {
        setPath(path);
        setLink(lookUrl(path));
      })
      .catch((e) => toast((e as Error).message));
  }, [moment, by, toast]);

  // (Re)draw the Instagram image when the format changes.
  useEffect(() => {
    let url = '';
    setImage(null);
    setImageError('');
    renderLookImage(moment, product, by.split(' ')[0], format)
      .then((blob) => {
        url = URL.createObjectURL(blob);
        setImage({ url, blob });
      })
      .catch(() => setImageError('The image preview needs the photos served from your own site. Run `npm run images` and it will work. Link sharing works already.'));
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [moment, product, by, format]);

  const earn = (e: 'shared' | 'shared-social') => {
    const add = award(user?.id, e, moment.id);
    if (add) {
      setEarned((n) => n + add);
      setPoints(getPoints(user?.id).total);
    }
  };

  const text = `My look for ${moment.title}. Would you wear it?`;

  const copy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      toast('Link copied.', 'Send it over.');
    } catch {
      inputRef.current?.select();
      toast('Press ⌘C to copy the link');
    }
    earn('shared');
  };

  const open = (n: Network) => {
    const u = encodeURIComponent(link);
    const t = encodeURIComponent(text);
    const urls: Record<Network, string> = {
      whatsapp: `https://wa.me/?text=${t}%20${u}`,
      x: `https://twitter.com/intent/tweet?text=${t}&url=${u}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
      pinterest: `https://www.pinterest.com/pin/create/button/?url=${u}&description=${t}`,
      email: `mailto:?subject=${encodeURIComponent(`Would you wear this to ${moment.title}?`)}&body=${t}%0A%0A${u}`,
    };
    window.open(urls[n], '_blank', 'noopener');
    earn('shared-social');
  };

  const fileName = `forya-${moment.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${format}.png`;

  const download = () => {
    if (!image) return;
    const a = document.createElement('a');
    a.href = image.url;
    a.download = fileName;
    a.click();
  };

  // On phones this opens the share sheet with the image attached, so Instagram can be picked directly.
  const instagram = async () => {
    if (!image) return;
    const file = new File([image.blob], fileName, { type: 'image/png' });
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: text, text: `${text} ${link}` });
        earn('shared-social');
        return;
      }
    } catch {
      return; // cancelled
    }
    download();
    earn('shared-social');
    toast('Image saved. Post it to your story and add the link sticker.');
  };

  const nativeShare = async () => {
    try {
      await navigator.share({ title: text, text, url: link });
      earn('shared-social');
    } catch {
      /* cancelled */
    }
  };

  const { level, next, progress, toNext } = levelFor(points);

  return (
    <Modal title="Share your" wink="look." onClose={onClose} width={860}>
      <div className="share-grid">
        <div className="share-preview">
          <div className="tabs" role="tablist" style={{ alignSelf: 'center' }}>
            <button role="tab" aria-selected={format === 'post'} onClick={() => setFormat('post')}>
              Post 4:5
            </button>
            <button role="tab" aria-selected={format === 'story'} onClick={() => setFormat('story')}>
              Story 9:16
            </button>
          </div>
          <div className={`share-image ${format}`}>
            {image ? <img src={image.url} alt={`Your look for ${moment.title}`} /> : imageError ? <p className="small" style={{ padding: 20, textAlign: 'center' }}>{imageError}</p> : <div className="skeleton" style={{ width: '100%', height: '100%' }} />}
          </div>
        </div>

        <div className="stack" style={{ gap: 22 }}>
          <div className="field">
            <label className="label" htmlFor="share-link">
              Link for friends <span className="hint">(they can react without an account)</span>
            </label>
            <div className="row" style={{ gap: 8 }}>
              <input id="share-link" ref={inputRef} className="input" readOnly value={link || 'Creating your link…'} onFocus={(e) => e.target.select()} />
              <button className="btn btn-primary" onClick={copy} disabled={!link}>
                <Icon name="copy" size={17} /> Copy
              </button>
              <button className="btn btn-quiet" onClick={() => navigate(path)} disabled={!path} title="See what your friends will see">
                <Icon name="eye" size={17} /> View
              </button>
            </div>
          </div>

          <div className="field">
            <span className="label">Post it</span>
            <button className="btn btn-instagram btn-block" onClick={instagram} disabled={!image}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
              </svg>
              Share to Instagram
            </button>
            <div className="share-socials">
              <button className="chip" onClick={() => open('whatsapp')} disabled={!link}>
                WhatsApp
              </button>
              <button className="chip" onClick={() => open('x')} disabled={!link}>
                X
              </button>
              <button className="chip" onClick={() => open('facebook')} disabled={!link}>
                Facebook
              </button>
              <button className="chip" onClick={() => open('pinterest')} disabled={!link}>
                Pinterest
              </button>
              <button className="chip" onClick={() => open('email')} disabled={!link}>
                Email
              </button>
              {typeof navigator.share === 'function' && (
                <button className="chip" onClick={nativeShare} disabled={!link}>
                  More…
                </button>
              )}
            </div>
            <button className="link small" style={{ alignSelf: 'flex-start' }} onClick={download} disabled={!image}>
              Download the image
            </button>
          </div>

          <div className="points-card">
            <div className="row between">
              <span className="eyebrow">Style points</span>
              {earned > 0 && <span className="badge badge-good">+{earned} for sharing</span>}
            </div>
            <div className="row" style={{ gap: 10, alignItems: 'baseline' }}>
              <span className="h2">{points}</span>
              <span className="body">
                {level.name}
                {next ? (
                  <>
                    {' '}
                    · {toNext} to <span className="wink" style={{ color: 'var(--ink)' }}>{next.name}</span>
                  </>
                ) : null}
              </span>
            </div>
            <div className="points-bar">
              <span style={{ width: `${Math.round(progress * 100)}%` }} />
            </div>
            <span className="small">Share a look +15 · post it +20 · finish a look +10. Friends vote on your link.</span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
