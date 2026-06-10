import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/Layout";
import { useWishlist } from "@/lib/wishlist-store";
import { ProductCard, type ProductLite } from "@/components/site/ProductCard";

export const Route = createFileRoute("/wishlist")({
  head: () => ({ meta: [{ title: "Wishlist — Maruti Genuine Parts" }] }),
  component: WishlistPage,
});

function WishlistPage() {
  const { ids } = useWishlist();
  const { data, isLoading } = useQuery({
    queryKey: ["wishlist", ids],
    enabled: ids.length > 0,
    queryFn: async () => (await supabase.from("products").select("id,name,part_no,price_paise,discount_pct,images,stock_qty").in("id", ids)).data as ProductLite[],
  });
  return (
    <SiteLayout>
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold">Your Wishlist</h1>
        {ids.length === 0 ? (
          <p className="mt-4 text-muted-foreground">No saved items. <Link to="/" className="text-primary hover:underline">Browse parts →</Link></p>
        ) : isLoading ? (
          <p className="mt-4 text-muted-foreground">Loading…</p>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {(data ?? []).map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
