import { ReactNode } from 'react';
import { brandUrl, storeUrl } from '../lib/shop';
import { useStore } from '../lib/store';
import type { Product } from '../lib/types';

/** Opens the product on the brand's (or a retailer's) own site in a new tab. */
export function BuyLink({ product, store, className = 'btn btn-primary', children, onBought }: { product: Product; store?: string; className?: string; children: ReactNode; onBought?: () => void }) {
  const { toast } = useStore();
  const name = store ?? product.brand;
  return (
    <a
      className={className}
      href={store ? storeUrl(store, product) : brandUrl(product)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        toast(`Taking you to ${name}…`, 'Enjoy.');
        onBought?.();
      }}
    >
      {children}
    </a>
  );
}
