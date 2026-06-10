import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/Layout";
import { ProductCard, type ProductLite } from "@/components/site/ProductCard";

const opts = (slug: string) =>
  queryOptions({
    queryKey: ["category", slug],
    queryFn: async () => {
      const { data: cat } = await supabase.from("categories").select("*").eq("slug", slug).is("parent_id", null).maybeSingle();
      if (!cat) return { cat: null, subs: [] as any[], products: [] as ProductLite[] };
      const [subs, products] = await Promise.all([
        supabase.from("categories").select("*").eq("parent_id", cat.id).eq("active", true).order("sort_order"),
        supabase.from("products").select("id,name,part_no,price_paise,discount_pct,images,stock_qty").eq("category_id", cat.id).eq("status", "active").limit(60),
      ]);
      return { cat, subs: subs.data ?? [], products: (products.data ?? []) as ProductLite[] };
    },
  });

export const Route = createFileRoute("/category/$slug/")({
  head: ({ params }) => ({ meta: [{ title: `${params.slug.replace(/-/g, " ")} — Maruti Genuine Parts` }] }),
  loader: async ({ context, params }) => {
    const d = await context.queryClient.ensureQueryData(opts(params.slug));
    if (!d.cat) throw notFound();
  },
  component: CategoryPage,
  notFoundComponent: () => <SiteLayout><div className="container mx-auto px-4 py-20 text-center"><h1 className="text-2xl font-bold">Category not found</h1></div></SiteLayout>,
  errorComponent: ({ error }) => <SiteLayout><div className="p-10 text-center">{error.message}</div></SiteLayout>,
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(opts(slug));
  const c = data.cat!;
  return (
    <SiteLayout>
      <div className="container mx-auto px-4 py-10">
        <nav className="text-xs text-muted-foreground"><Link to="/categories" className="hover:text-primary">Categories</Link> / <span>{c.name}</span></nav>
        <h1 className="mt-2 text-3xl font-bold md:text-4xl">{c.name}</h1>
        {data.subs.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {data.subs.map((s) => (
              <Link key={s.id} to="/category/$slug/$sub" params={{ slug: c.slug, sub: s.slug }} className="rounded-full border border-border px-3 py-1.5 text-xs hover:border-primary hover:text-primary">
                {s.name}
              </Link>
            ))}
          </div>
        )}
        <div className="mt-8">
          {data.products.length === 0 ? (
            <p className="text-muted-foreground">No products in this category yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {data.products.map((p) => <ProductCard key={p.id} p={p} />)}
            </div>
          )}
        </div>
      </div>
    </SiteLayout>
  );
}
