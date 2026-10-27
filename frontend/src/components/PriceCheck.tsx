import { money } from '../lib/format';
import type { PriceCheck as Check, Product } from '../lib/types';
import { VerdictChip } from './Bits';
import { BuyLink } from './BuyLink';
import { Icon } from './Icon';

const COPY = {
  good: 'Below what this usually sells for. Nice timing.',
  typical: 'Right in the usual range. No rush, no regret.',
  high: 'Above the usual range. Worth checking the options below.',
};

/** Phia-style price verdict + every offer we could find, new and pre-owned. */
export function PriceCheck({ product, check }: { product: Product; check: Check }) {
  const lo = Math.min(check.typicalLow, check.best.price) * 0.9;
  const hi = Math.max(check.typicalHigh, product.price) * 1.08;
  const pos = (n: number) => `${((n - lo) / (hi - lo)) * 100}%`;
  const saving = product.price - check.best.price;

  return (
    <div className="pricecheck">
      <div className="pricecheck-head">
        <div className="stack" style={{ gap: 8 }}>
          <span className="eyebrow">Price check</span>
          <VerdictChip verdict={check.verdict} />
          <p className="small" style={{ margin: 0 }}>
            {COPY[check.verdict]}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="small">Usually</div>
          <div className="price">
            {money(check.typicalLow)}–{money(check.typicalHigh)}
          </div>
        </div>
      </div>

      <div style={{ padding: '6px 20px 16px' }}>
        <div className="price-range" aria-hidden>
          <div className="price-range-band" style={{ left: pos(check.typicalLow), width: `calc(${pos(check.typicalHigh)} - ${pos(check.typicalLow)})` }} />
          <div className="price-range-pin" style={{ left: pos(product.price) }} />
        </div>
        <div className="row between small">
          <span>{money(lo)}</span>
          <span>This price · {money(product.price)}</span>
          <span>{money(hi)}</span>
        </div>
      </div>

      {saving > 1 && (
        <div className="row" style={{ padding: '12px 20px', background: 'var(--surface)', gap: 10 }}>
          <Icon name="tag" size={18} />
          <span style={{ fontSize: 14 }}>
            <strong>Save {money(saving)}</strong> at {check.best.retailer}
            {check.best.kind === 'resale' ? ' (pre-owned)' : ''}.
          </span>
        </div>
      )}

      <div>
        {check.offers.map((o, i) => (
          <BuyLink product={product} store={o.retailer} className={`offer ${o === check.best ? 'is-best' : ''}`} key={o.retailer + i}>
            <div className="row" style={{ gap: 10 }}>
              <Icon name={o.kind === 'resale' ? 'recycle' : 'bag'} size={18} />
              <div>
                <div className="h4" style={{ fontSize: 15 }}>
                  {o.retailer} {o === check.best && <span className="badge badge-ink" style={{ marginLeft: 6 }}>Best price</span>}
                </div>
                <div className="small">
                  {o.condition} · {o.delivery}
                </div>
              </div>
            </div>
            <div className="row" style={{ gap: 10 }}>
              <span className="price">{money(o.price)}</span>
              <span className="icon-btn icon-btn-sm" aria-hidden>
                <Icon name="arrowUpRight" size={16} />
              </span>
            </div>
          </BuyLink>
        ))}
      </div>
      {check.illustrative && (
        <div className="row small" style={{ padding: '12px 20px', borderTop: '1.5px solid var(--haze)', gap: 8 }}>
          <Icon name="info" size={15} /> Illustrative prices until live retailer feeds are connected.
        </div>
      )}
    </div>
  );
}
