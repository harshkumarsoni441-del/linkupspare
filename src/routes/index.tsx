import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/Layout";
import { ProductCard, type ProductLite } from "@/components/site/ProductCard";
import { placeholderImg } from "@/lib/format";
import { ShieldCheck, Truck, Award, Wrench } from "lucide-react";

const homeData = queryOptions({
  queryKey: ["home"],
  queryFn: async () => {
    const [models, cats, featured] = await Promise.all([
      supabase.from("models").select("id,slug,name,image_url").eq("active", true).order("sort_order").limit(12),
      supabase.from("categories").select("id,slug,name,icon,image_url").is("parent_id", null).eq("active", true).order("sort_order"),
      supabase.from("products").select("id,name,part_no,price_paise,discount_pct,images,stock_qty").eq("status", "active").eq("featured", true).limit(8),
    ]);
    return {
      models: models.data ?? [],
      categories: cats.data ?? [],
      featured: (featured.data ?? []) as ProductLite[],
    };
  },
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Maruti Suzuki Genuine Parts — Authorised Dealer" },
      { name: "description", content: "Shop 100% genuine Maruti Suzuki spare parts online. Filters, brakes, AC, engine & more — with warranty and pan-India delivery." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(homeData),
  component: HomePage,
});

function HomePage() {
  const { data } = useSuspenseQuery(homeData);
  return (
    <SiteLayout>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-surface via-background to-background">
        <div className="absolute inset-0 opacity-30" style={{ background: "radial-gradient(60% 60% at 70% 30%, color-mix(in oklab, var(--gold) 35%, transparent), transparent 70%)" }} />
        <div className="container relative mx-auto grid gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <ShieldCheck className="h-3.5 w-3.5" /> Authorised Maruti Suzuki Dealer
            </span>
            <h1 className="mt-4 text-4xl font-bold leading-tight md:text-6xl">
              100% Genuine <span className="text-primary">Maruti Suzuki</span> Parts
            </h1>
            <p className="mt-4 max-w-lg text-base text-muted-foreground md:text-lg">
              Every part OEM-certified, fitment-guaranteed, and backed by manufacturer warranty. Shop by your model or category and get it delivered across India.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/models" className="rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90">Shop by Model</Link>
              <Link to="/categories" className="rounded-md border border-border px-5 py-3 text-sm font-semibold hover:border-primary">Browse Categories</Link>
            </div>
            <div className="mt-8 grid grid-cols-3 gap-4 text-center">
              {[{i:Award,l:"Genuine"},{i:Truck,l:"Fast Ship"},{i:Wrench,l:"Warranty"}].map(({i:Icon,l}) => (
                <div key={l} className="glass-card p-3">
                  <Icon className="mx-auto h-5 w-5 text-primary" />
                  <div className="mt-1 text-xs">{l}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative hidden md:block">
            <img src="https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=900&q=70" alt="Genuine Maruti parts" className="rounded-2xl border border-border shadow-2xl" />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container mx-auto px-4 py-12">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-bold md:text-3xl">Shop by Category</h2>
          <Link to="/categories" className="text-sm text-primary hover:underline">View all →</Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
          {data.categories.slice(0, 14).map((c) => (
            <Link key={c.id} to="/category/$slug" params={{ slug: c.slug }} className="glass-card flex flex-col items-center gap-2 p-4 text-center glow-gold">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/15 text-primary text-xl">{c.icon ?? "⚙️"}</div>
              <span className="text-xs font-medium">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Models */}
      <section className="container mx-auto px-4 py-12">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-bold md:text-3xl">Shop by Model</h2>
          <Link to="/models" className="text-sm text-primary hover:underline">View all 41 models →</Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {data.models.map((m) => (
            <Link key={m.id} to="/models/$slug" params={{ slug: m.slug }} className="glass-card overflow-hidden glow-gold">
              <img src={m.image_url ?? placeholderImg(m.slug)} alt={m.name} loading="lazy" className="aspect-[4/3] w-full object-cover"
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = placeholderImg(m.slug); }} />
              <div className="p-3 text-center text-sm font-medium">{m.name}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      {data.featured.length > 0 && (
        <section className="container mx-auto px-4 py-12">
          <h2 className="mb-6 text-2xl font-bold md:text-3xl">Featured Parts</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {data.featured.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        </section>
      )}
    </SiteLayout>
  );
}
