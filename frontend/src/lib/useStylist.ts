import { useEffect, useMemo, useState } from 'react';
import { aiSource, type AiSource } from './ai';
import type { StylistContext } from './aiStylist';
import { api } from './api';
import { TIER_BRANDS } from './catalogue';
import { daysUntil } from './format';
import { useSession } from './session';
import { useStore } from './store';
import type { Moment } from './types';

const BRANDS = Object.values(TIER_BRANDS).flat();

/** Everything the AI features need to know about this person, kept in one place. */
export function useStylistContext(momentsIn?: Moment[]): { ctx: StylistContext; source: AiSource | null; reloadMoments: () => void } {
  const { user } = useSession();
  const { products, wardrobe, department } = useStore();
  const [moments, setMoments] = useState<Moment[]>(momentsIn ?? []);
  const [source, setSource] = useState<AiSource | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    aiSource().then(setSource);
  }, []);

  useEffect(() => {
    if (momentsIn || !user) return;
    api
      .moments()
      .then((ms) => setMoments(ms.filter((m) => daysUntil(m.date) >= 0)))
      .catch(() => setMoments([]));
  }, [user, momentsIn, tick]);

  const ctx = useMemo<StylistContext>(
    () => ({
      name: user?.name,
      shopsFor: department,
      moments: momentsIn ?? moments,
      products,
      owned: new Set(wardrobe.filter((w) => w.kind === 'owned').map((w) => w.productId)),
      saved: new Set(wardrobe.filter((w) => w.kind === 'saved').map((w) => w.productId)),
      brands: BRANDS,
    }),
    [user, department, moments, momentsIn, products, wardrobe],
  );
  return { ctx, source, reloadMoments: () => setTick((t) => t + 1) };
}
