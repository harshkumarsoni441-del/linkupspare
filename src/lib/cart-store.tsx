import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CartItem = {
  productId: string;
  name: string;
  partNo: string;
  unitPricePaise: number;
  image?: string;
  qty: number;
  modelLabel?: string;
};

type CartCtx = {
  items: CartItem[];
  add: (i: CartItem) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  subtotalPaise: number;
  count: number;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = "msgp_cart_v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
  }, [items]);

  const value = useMemo<CartCtx>(() => ({
    items,
    add: (i) =>
      setItems((prev) => {
        const ex = prev.find((p) => p.productId === i.productId);
        if (ex) return prev.map((p) => p.productId === i.productId ? { ...p, qty: p.qty + i.qty } : p);
        return [...prev, i];
      }),
    remove: (id) => setItems((p) => p.filter((x) => x.productId !== id)),
    setQty: (id, qty) => setItems((p) => p.map((x) => x.productId === id ? { ...x, qty: Math.max(1, qty) } : x)),
    clear: () => setItems([]),
    subtotalPaise: items.reduce((s, i) => s + i.unitPricePaise * i.qty, 0),
    count: items.reduce((s, i) => s + i.qty, 0),
  }), [items]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be used inside CartProvider");
  return c;
}
