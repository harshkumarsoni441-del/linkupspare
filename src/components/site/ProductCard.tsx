import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { inr, discounted, placeholderImg } from "@/lib/format";
import { useWishlist } from "@/lib/wishlist-store";
import { useCart } from "@/lib/cart-store";
import { toast } from "sonner";

export type ProductLite = {
  id: string;
  name: string;
  part_no: string;
  price_paise: number;
  discount_pct: number;
  images: string[];
  stock_qty: number;
};

export function ProductCard({ p }: { p: ProductLite }) {
  const { has, toggle } = useWishlist();
  const { add, items, setQty, remove } = useCart();
  const img = p.images?.[0] || placeholderImg(p.part_no);
  const finalP = discounted(p.price_paise, p.discount_pct);
  const wished = has(p.id);
  const inCart = items.find((i) => i.productId === p.id);
  const max = p.stock_qty;

  return (
    <div className="group glass-card overflow-hidden glow-gold">
      <Link to="/product/$id" params={{ id: p.id }} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-surface-2">
          <img
            src={img}
            alt={p.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = placeholderImg(p.part_no); }}
          />
          {p.discount_pct > 0 && (
            <span className="absolute left-2 top-2 rounded bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">-{p.discount_pct}%</span>
          )}
          {p.stock_qty === 0 && (
            <span className="absolute right-2 top-2 rounded bg-destructive px-2 py-0.5 text-xs font-bold">Out of stock</span>
          )}
        </div>
      </Link>
      <div className="p-3">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Part No. {p.part_no}</div>
        <Link to="/product/$id" params={{ id: p.id }} className="line-clamp-2 mt-1 text-sm font-medium hover:text-primary">{p.name}</Link>
        <div className="mt-2 flex items-baseline gap-2">
          <div className="text-base font-bold text-primary tabular">{inr(finalP)}</div>
          {p.discount_pct > 0 && (
            <div className="text-xs text-muted-foreground line-through tabular">{inr(p.price_paise)}</div>
          )}
        </div>
        <div className="mt-3 flex gap-2">
          {inCart ? (
            <div className="flex flex-1 items-center justify-between rounded-md border border-primary/40 bg-primary/10 px-2 py-1">
              <button
                aria-label="Decrease"
                onClick={() => {
                  if (inCart.qty <= 1) { remove(p.id); toast.success("Removed from cart"); }
                  else setQty(p.id, inCart.qty - 1);
                }}
                className="grid h-7 w-7 place-items-center rounded text-primary hover:bg-primary/20"
              >−</button>
              <span className="text-sm font-bold text-primary tabular">{inCart.qty}</span>
              <button
                aria-label="Increase"
                disabled={inCart.qty >= max}
                onClick={() => {
                  if (inCart.qty >= max) { toast.error(`Only ${max} in stock`); return; }
                  setQty(p.id, inCart.qty + 1);
                }}
                className="grid h-7 w-7 place-items-center rounded text-primary hover:bg-primary/20 disabled:opacity-40"
              >+</button>
            </div>
          ) : (
            <button
              disabled={p.stock_qty === 0}
              onClick={() => {
                add({ productId: p.id, name: p.name, partNo: p.part_no, unitPricePaise: finalP, image: img, qty: 1 });
                toast.success("Added to cart");
              }}
              className="flex-1 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-40"
            >
              Add to cart
            </button>
          )}
          <button
            aria-label="Wishlist"
            onClick={() => toggle(p.id)}
            className={`grid h-9 w-9 place-items-center rounded-md border border-border hover:border-primary ${wished ? "text-primary" : "text-muted-foreground"}`}
          >
            <Heart className={`h-4 w-4 ${wished ? "fill-current" : ""}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
