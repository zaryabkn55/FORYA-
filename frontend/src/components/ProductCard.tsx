import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { priceCheckFor } from '../lib/catalogue';
import { money } from '../lib/format';
import { useSession } from '../lib/session';
import { useStore } from '../lib/store';
import type { WeatherFit } from '../lib/stylist';
import type { Product } from '../lib/types';
import { VerdictChip } from './Bits';
import { Icon } from './Icon';
import { useProductDrawer } from './ProductDrawer';

export function ProductCard({ product, onAdd, added, fit }: { product: Product; onAdd?: () => void; added?: boolean; fit?: WeatherFit }) {
  const { kindOf, setKind, toast } = useStore();
  const { user } = useSession();
  const navigate = useNavigate();
  const drawer = useProductDrawer();
  const kind = kindOf(product.id);
  const check = useMemo(() => priceCheckFor(product), [product]);
  const resale = check.offers.find((o) => o.kind === 'resale');

  const toggleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return navigate('/login');
    if (kind === 'saved') {
      setKind(product.id, null);
      toast('Removed from saved');
    } else {
      setKind(product.id, 'saved');
      toast('Saved.', 'Good eye.');
    }
  };

  return (
    <div className="pcard" role="button" tabIndex={0} onClick={() => drawer.open(product.id)} onKeyDown={(e) => e.key === 'Enter' && drawer.open(product.id)}>
      <div className="pcard-media">
        <img src={product.imageUrl} alt={product.name} loading="lazy" />
        <div className="pcard-tags">
          {product.isNew && <span className="badge badge-white">New in</span>}
          {kind === 'owned' && <span className="badge badge-ink">Owned</span>}
        </div>
        {fit && (
          <span className={`fit-badge fit-${fit.verdict}`} title={fit.reason}>
            <Icon name="sparkle" size={12} /> {fit.score}% match
          </span>
        )}
        <button className={`icon-btn icon-btn-sm pcard-save ${kind === 'saved' ? 'is-on' : ''}`} onClick={toggleSave} aria-label={kind === 'saved' ? 'Unsave' : 'Save'}>
          <Icon name="heart" size={17} />
        </button>
        {onAdd && (
          <div className="pcard-quick">
            <button
              className={`btn btn-sm btn-block ${added ? 'btn-quiet' : 'btn-primary'}`}
              onClick={(e) => {
                e.stopPropagation();
                onAdd();
              }}
            >
              <Icon name={added ? 'check' : 'plus'} size={16} stroke={2} /> {added ? 'On the canvas' : 'Add to look'}
            </button>
          </div>
        )}
      </div>
      <div className="pcard-body">
        <span className="brand-label">{product.brand}</span>
        <span className="pcard-name">{product.name}</span>
        {fit?.reason && <span className="fit-reason">{fit.reason}</span>}
        <div className="pcard-price">
          <span className="price">{money(product.price)}</span>
          {resale && <span className="small">or {money(resale.price)} pre-owned</span>}
        </div>
        <div style={{ marginTop: 6 }}>
          <VerdictChip verdict={check.verdict} small />
        </div>
      </div>
    </div>
  );
}
