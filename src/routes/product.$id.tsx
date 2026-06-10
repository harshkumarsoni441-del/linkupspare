import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/Layout";
import { inr, discounted, placeholderImg } from "@/lib/format";
import { useCart } from "@/lib/cart-store";
import { useWishlist } from "@/lib/wishlist-store";
import { useState } from "react";
import { toast } from "sonner";
import { Heart, ShieldCheck, Truck, Wrench } from "lucide-react";

const opts = (id: string) =>
  queryOptions({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data: p } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
      if (!p) return { product: null, models: [] as any[], category: null as any };
      const [models, category] = await Promise.all([
        p.model_ids?.length ? supabase.from("models").select("id,slug,name").in("id", p.model_ids) : Promise.resolve({ data: [] as any }),
        p.category_id ? supabase.from("categories").select("id,slug,name").eq("id", p.category_id).maybeSingle() : Promise.resolve({ data: null as any }),
      ]);
      return { product: p, models: models.data ?? [], category: category.data };
    },
  });

export const Route = createFileRoute("/product/$id")({
  head: ({ params }) => ({ meta: [{ title: `Product — Maruti Genuine Parts` }, { name: "description", content: `Genuine Maruti Suzuki part ${params.id}` }] }),
  loader: async ({ context, params }) => {
    const d = await context.queryClient.ensureQueryData(opts(params.id));
    if (!d.product) throw notFound();
  },
  component: ProductPage,
  notFoundComponent: () => <SiteLayout><div className="p-20 text-center"><h1 className="text-2xl font-bold">Product not found</h1></div></SiteLayout>,
  errorComponent: ({ error }) => <SiteLayout><div className="p-10 text-center">{error.message}</div></SiteLayout>,
});

function ProductPage() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(opts(id));
  const p = data.product!;
  const { add } = useCart();
  const { has, toggle } = useWishlist();
  const [qty, setQty] = useState(1);
  const [img, setImg] = useState(p.images?.[0] ?? placeholderImg(p.part_no));
  const finalP = discounted(p.price_paise, p.discount_pct);
  const wished = has(p.id);

  return (
    <SiteLayout>
      <div className="container mx-auto grid gap-10 px-4 py-10 md:grid-cols-2">
        <div>
          <div className="glass-card overflow-hidden">
            <img src={img} alt={p.name} className="aspect-square w-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).src = placeholderImg(p.part_no); }} />
          </div>
          {p.images?.length > 1 && (
            <div className="mt-3 flex gap-2">
              {p.images.map((u: string, i: number) => (
                <button key={i} onClick={() => setImg(u)} className={`h-16 w-16 overflow-hidden rounded border ${img === u ? "border-primary" : "border-border"}`}>
                  <img src={u} alt={`view ${i+1}`} className="h-full w-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).src = placeholderImg(p.part_no + i); }} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            {data.category && <Link to="/category/$slug" params={{ slug: data.category.slug }} className="hover:text-primary">{data.category.name}</Link>}
          </div>
          <h1 className="mt-1 text-3xl font-bold">{p.name}</h1>
          <div className="mt-1 text-sm text-muted-foreground">Part No. <span className="font-mono">{p.part_no}</span>{p.oem_no && <> · OEM <span className="font-mono">{p.oem_no}</span></>}</div>

          <div className="mt-5 flex items-baseline gap-3">
            <div className="text-3xl font-bold text-primary tabular">{inr(finalP)}</div>
            {p.discount_pct > 0 && <>
              <div className="text-base text-muted-foreground line-through tabular">{inr(p.price_paise)}</div>
              <span className="rounded bg-primary/20 px-2 py-0.5 text-xs font-bold text-primary">-{p.discount_pct}%</span>
            </>}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">Incl. all taxes</div>

          <div className="mt-6 flex items-center gap-3">
            <div className="flex items-center rounded-md border border-border">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-2">−</button>
              <span className="w-10 text-center text-sm tabular">{qty}</span>
              <button onClick={() => setQty(qty + 1)} className="px-3 py-2">+</button>
            </div>
            <button
              disabled={p.stock_qty === 0}
              onClick={() => { add({ productId: p.id, name: p.name, partNo: p.part_no, unitPricePaise: finalP, image: img, qty }); toast.success("Added to cart"); }}
              className="flex-1 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-40">
              {p.stock_qty === 0 ? "Out of stock" : "Add to cart"}
            </button>
            <button aria-label="Wishlist" onClick={() => toggle(p.id)} className={`grid h-11 w-11 place-items-center rounded-md border border-border hover:border-primary ${wished ? "text-primary" : ""}`}>
              <Heart className={`h-5 w-5 ${wished ? "fill-current" : ""}`} />
            </button>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3 text-center text-xs">
            <div className="glass-card p-3"><ShieldCheck className="mx-auto h-5 w-5 text-primary" /><div className="mt-1">{p.warranty ?? "Warranty"}</div></div>
            <div className="glass-card p-3"><Truck className="mx-auto h-5 w-5 text-primary" /><div className="mt-1">Pan-India delivery</div></div>
            <div className="glass-card p-3"><Wrench className="mx-auto h-5 w-5 text-primary" /><div className="mt-1">OEM fitment</div></div>
          </div>

          {p.description && <div className="prose prose-invert mt-8 max-w-none text-sm text-muted-foreground"><p>{p.description}</p></div>}

          {data.models.length > 0 && (
            <div className="mt-8">
              <h3 className="text-sm font-semibold">Compatible models</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {data.models.map((m: any) => (
                  <Link key={m.id} to="/models/$slug" params={{ slug: m.slug }} className="rounded-full border border-border px-3 py-1 text-xs hover:border-primary hover:text-primary">{m.name}</Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </SiteLayout>
  );
}
