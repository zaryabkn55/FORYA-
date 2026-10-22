/**
 * Shared app data: the catalogue, the wardrobe (saved / owned) and toasts. Pages read from here so a
 * piece saved on Discover shows as saved on the canvas without a reload.
 */
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api, apiMode, ApiMode } from './api';
import { forDepartment } from './catalogue';
import { useSession } from './session';
import type { Product, ShopsFor, WardrobeEntry, WardrobeKind } from './types';

const DEPT_KEY = 'forya.department';
const readDept = (): ShopsFor => {
  try {
    return localStorage.getItem(DEPT_KEY) === 'men' ? 'men' : 'women';
  } catch {
    return 'women';
  }
};

interface Toast {
  id: number;
  text: string;
  wink?: string;
}

interface Store {
  mode: ApiMode | null;
  /** The pieces for this account's department (womenswear or menswear, plus unisex). */
  products: Product[];
  /** Every piece, for looking up shared looks and old canvases. */
  allProducts: Product[];
  department: ShopsFor;
  /** Whether the signed-in account still needs to pick a department. */
  needsDepartment: boolean;
  setDepartment: (d: ShopsFor) => Promise<void>;
  productsLoading: boolean;
  product: (id: string) => Product | undefined;
  wardrobe: WardrobeEntry[];
  kindOf: (productId: string) => WardrobeKind | null;
  setKind: (productId: string, kind: WardrobeKind | null) => Promise<void>;
  toast: (text: string, wink?: string) => void;
  toasts: Toast[];
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user, updateUser } = useSession();
  const [mode, setMode] = useState<ApiMode | null>(null);
  const [allProducts, setProducts] = useState<Product[]>([]);
  const [guestDept, setGuestDept] = useState<ShopsFor>(readDept);
  const department: ShopsFor = user?.shopsFor ?? guestDept;
  const products = useMemo(() => allProducts.filter((p) => forDepartment(p, department)), [allProducts, department]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [wardrobe, setWardrobe] = useState<WardrobeEntry[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seq = useRef(0);

  useEffect(() => {
    apiMode().then(setMode);
    api
      .products()
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setProductsLoading(false));
  }, []);

  useEffect(() => {
    if (!user) {
      setWardrobe([]);
      return;
    }
    api.wardrobe().then(setWardrobe).catch(() => setWardrobe([]));
  }, [user]);

  const toast = useCallback((text: string, wink?: string) => {
    const id = ++seq.current;
    setToasts((t) => [...t, { id, text, wink }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800);
  }, []);

  const setDepartment = useCallback(
    async (d: ShopsFor) => {
      try {
        localStorage.setItem(DEPT_KEY, d);
      } catch {
        /* ignore */
      }
      setGuestDept(d);
      if (!user) return;
      updateUser({ shopsFor: d });
      try {
        await api.updateProfile({ shopsFor: d });
      } catch {
        /* kept locally; the server catches up next time */
      }
    },
    [user, updateUser],
  );

  const byId = useMemo(() => new Map(allProducts.map((p) => [p.id, p])), [allProducts]);
  const product = useCallback((id: string) => byId.get(id), [byId]);
  const kindOf = useCallback((id: string) => wardrobe.find((e) => e.productId === id)?.kind ?? null, [wardrobe]);

  const setKind = useCallback(
    async (productId: string, kind: WardrobeKind | null) => {
      const previous = wardrobe;
      // Optimistic: reflect the change straight away, roll back if the server says no.
      setWardrobe((w) => {
        const rest = w.filter((e) => e.productId !== productId);
        return kind ? [{ productId, kind, addedAt: new Date().toISOString() }, ...rest] : rest;
      });
      try {
        setWardrobe(await api.setWardrobe(productId, kind));
      } catch (e) {
        setWardrobe(previous);
        toast((e as Error).message);
      }
    },
    [wardrobe, toast],
  );

  const value = useMemo(
    () => ({ mode, products, allProducts, department, needsDepartment: !!user && !user.shopsFor, setDepartment, productsLoading, product, wardrobe, kindOf, setKind, toast, toasts }),
    [mode, products, allProducts, department, user, setDepartment, productsLoading, product, wardrobe, kindOf, setKind, toast, toasts],
  );
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>');
  return ctx;
}
