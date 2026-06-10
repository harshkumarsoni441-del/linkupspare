import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/Layout";
import { ProductCard, type ProductLite } from "@/components/site/ProductCard";

const opts = (slug: string, sub: string) =>
  queryOptions({
    queryKey: ["category", slug, sub],
    queryFn: async () => {
      const { data: parent } = await supabase.from("categories").select("*").eq("slug", slug).is("parent_id", null).maybeSingle();
      if (!parent) return { parent: null, sub: null, products: [] as ProductLite[] };
      const { data: subCat } = await supabase.from("categories").select("*").eq("slug", sub).eq("parent_id", parent.id).maybeSingle();
      if (!subCat) return { parent, sub: null, products: [] };
      const { data: products } = await supabase
        .from("products")
        .select("id,name,part_no,price_paise,discount_pct,images,stock_qty")
        .eq("subcategory_id", subCat.id)
        .eq("status", "active")
        .limit(60);
      return { parent, sub: subCat, products: (products ?? []) as ProductLite[] };
    },
  });

export const Route = createFileRoute("/category/$slug/$sub")({
  head: ({ params }) => ({ meta: [{ title: `${params.sub.replace(/-/g, " ")} — Maruti Genuine Parts` }] }),
  loader: async ({ context, params }) => {
    const d = await context.queryClient.ensureQueryData(opts(params.slug, params.sub));
    if (!d.parent || !d.sub) throw notFound();
  },
  component: SubCategoryPage,
  notFoundComponent: () => <SiteLayout><div className="p-20 text-center"><h1 className="text-2xl font-bold">Not found</h1></div></SiteLayout>,
  errorComponent: ({ error }) => <SiteLayout><div className="p-10 text-center">{error.message}</div></SiteLayout>,
});

function SubCategoryPage() {
  const { slug, sub } = Route.useParams();
  const { data } = useSuspenseQuery(opts(slug, sub));
  return (
    <SiteLayout>
      <div className="container mx-auto px-4 py-10">
        <nav className="text-xs text-muted-foreground">
          <Link to="/categories" className="hover:text-primary">Categories</Link> /{" "}
          <Link to="/category/$slug" params={{ slug }} className="hover:text-primary">{data.parent!.name}</Link> /{" "}
          <span>{data.sub!.name}</span>
        </nav>
        <h1 className="mt-2 text-3xl font-bold md:text-4xl">{data.sub!.name}</h1>
        <div className="mt-8">
          {data.products.length === 0 ? (
            <p className="text-muted-foreground">No products listed yet.</p>
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
