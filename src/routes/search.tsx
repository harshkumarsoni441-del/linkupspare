import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/Layout";
import { ProductCard, type ProductLite } from "@/components/site/ProductCard";
import { useState } from "react";
import { z } from "zod";

const searchSchema = z.object({ q: z.string().optional().default("") });

export const Route = createFileRoute("/search")({
  head: () => ({ meta: [{ title: "Search — Maruti Genuine Parts" }] }),
  validateSearch: searchSchema,
  component: SearchPage,
});

function SearchPage() {
  const { q: initial } = Route.useSearch();
  const [q, setQ] = useState(initial);
  const { data, isLoading } = useQuery({
    queryKey: ["search", q],
    queryFn: async () => {
      if (!q) return [] as ProductLite[];
      const { data } = await supabase.from("products")
        .select("id,name,part_no,price_paise,discount_pct,images,stock_qty")
        .or(`name.ilike.%${q}%,part_no.ilike.%${q}%,oem_no.ilike.%${q}%`)
        .eq("status", "active").limit(60);
      return (data ?? []) as ProductLite[];
    },
  });
  return (
    <SiteLayout>
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold">Search parts</h1>
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Try 'brake pad' or part no…"
          className="mt-4 w-full max-w-xl rounded-md border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-primary" />
        <div className="mt-8">
          {isLoading ? <p className="text-muted-foreground">Searching…</p> :
            !q ? <p className="text-muted-foreground">Type to search the catalogue.</p> :
            data && data.length === 0 ? <p className="text-muted-foreground">No matches for "{q}".</p> :
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {(data ?? []).map((p) => <ProductCard key={p.id} p={p} />)}
            </div>}
        </div>
      </div>
    </SiteLayout>
  );
}
