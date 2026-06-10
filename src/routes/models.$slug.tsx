import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/Layout";
import { ProductCard, type ProductLite } from "@/components/site/ProductCard";
import { placeholderImg } from "@/lib/format";

const opts = (slug: string) =>
  queryOptions({
    queryKey: ["model", slug],
    queryFn: async () => {
      const { data: model } = await supabase.from("models").select("*").eq("slug", slug).maybeSingle();
      if (!model) return { model: null, products: [] as ProductLite[], categories: [] as any[] };
      const { data: products } = await supabase
        .from("products")
        .select("id,name,part_no,price_paise,discount_pct,images,stock_qty,category_id")
        .contains("model_ids", [model.id])
        .eq("status", "active")
        .limit(48);
      const { data: cats } = await supabase.from("categories").select("id,slug,name,icon").is("parent_id", null).eq("active", true).order("sort_order");
      return { model, products: (products ?? []) as ProductLite[], categories: cats ?? [] };
    },
  });

export const Route = createFileRoute("/models/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug.replace(/-/g, " ")} — Genuine Maruti Parts` },
      { name: "description", content: `Genuine Maruti Suzuki spare parts for ${params.slug.replace(/-/g, " ")}.` },
    ],
  }),
  loader: async ({ context, params }) => {
    const d = await context.queryClient.ensureQueryData(opts(params.slug));
    if (!d.model) throw notFound();
  },
  component: ModelPage,
  notFoundComponent: () => <SiteLayout><div className="container mx-auto px-4 py-20 text-center"><h1 className="text-2xl font-bold">Model not found</h1></div></SiteLayout>,
  errorComponent: ({ error }) => <SiteLayout><div className="container mx-auto px-4 py-20 text-center"><p>{error.message}</p></div></SiteLayout>,
});

function ModelPage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(opts(slug));
  const m = data.model!;
  return (
    <SiteLayout>
      <div className="border-b border-border bg-surface/40">
        <div className="container mx-auto grid gap-6 px-4 py-10 md:grid-cols-[1fr,1.2fr] md:items-center">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Maruti Suzuki</div>
            <h1 className="mt-1 text-4xl font-bold">{m.name}</h1>
            <p className="mt-2 text-sm text-muted-foreground">Variants: {(m.variants ?? []).join(", ") || "—"}</p>
            <p className="text-sm text-muted-foreground">Years: {m.year_from}{m.year_to ? `–${m.year_to}` : "+"}</p>
          </div>
          <img src={m.image_url ?? placeholderImg(m.slug)} alt={m.name} className="rounded-2xl border border-border"
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = placeholderImg(m.slug); }} />
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        <h2 className="mb-4 text-lg font-semibold">Shop categories for {m.name}</h2>
        <div className="mb-10 flex flex-wrap gap-2">
          {data.categories.map((c) => (
            <Link key={c.id} to="/category/$slug" params={{ slug: c.slug }} className="rounded-full border border-border px-3 py-1.5 text-xs hover:border-primary hover:text-primary">
              {c.icon ?? "•"} {c.name}
            </Link>
          ))}
        </div>

        <h2 className="mb-4 text-2xl font-bold">Parts for {m.name}</h2>
        {data.products.length === 0 ? (
          <p className="text-muted-foreground">No parts listed yet for this model.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {data.products.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
