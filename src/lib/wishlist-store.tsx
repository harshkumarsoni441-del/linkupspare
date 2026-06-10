import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const Ctx = createContext<{
  ids: string[];
  toggle: (id: string) => void;
  has: (id: string) => boolean;
} | null>(null);
const KEY = "msgp_wishlist_v1";

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => { try { const r = localStorage.getItem(KEY); if (r) setIds(JSON.parse(r)); } catch {} }, []);
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(ids)); } catch {} }, [ids]);
  const value = useMemo(() => ({
    ids,
    toggle: (id: string) => setIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]),
    has: (id: string) => ids.includes(id),
  }), [ids]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWishlist() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useWishlist must be used inside WishlistProvider");
  return c;
}
