import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/Layout";
import { ProductCard, type ProductLite } from "@/components/site/ProductCard";
import { ShieldCheck, Truck, Award, Wrench, ArrowRight, Phone } from "lucide-react";
import heroVideo from "@/assets/hero.mp4.asset.json";
import { GenuineCompare } from "@/components/site/GenuineCompare";

const homeData = queryOptions({
  queryKey: ["home"],
  queryFn: async () => {
    const [prodCats, allCats, featured] = await Promise.all([
      supabase.from("products").select("category_id").eq("status", "active").not("category_id", "is", null),
      supabase.from("categories").select("id,slug,name,icon,image_url,sort_order").is("parent_id", null).eq("active", true).order("sort_order"),
      supabase.from("products").select("id,name,part_no,price_paise,discount_pct,images,stock_qty").eq("status", "active").eq("featured", true).limit(8),
    ]);
    const activeIds = new Set((prodCats.data ?? []).map((p: { category_id: string | null }) => p.category_id).filter(Boolean) as string[]);
    const categories = (allCats.data ?? []).filter((c) => activeIds.has(c.id));
    return {
      categories,
      featured: (featured.data ?? []) as ProductLite[],
    };
  },
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Linkup Spares — Genuine Maruti Suzuki Spare Parts Online" },
      { name: "description", content: "Shop 100% genuine Maruti Suzuki spare parts at Linkup Spares. OEM-certified filters, brakes, AC, engine & more. Warranty backed, pan-India delivery." },
      { property: "og:title", content: "Linkup Spares — Genuine Maruti Suzuki Spare Parts" },
      { property: "og:description", content: "Authorised Maruti Suzuki spare parts. Search by part number, model or category." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(homeData),
  component: HomePage,
});

function HomePage() {
  const { data } = useSuspenseQuery(homeData);
  return (
    <SiteLayout>
      {/* Hero with video background */}
      <section className="relative overflow-hidden border-b border-border">
        <video
          src={heroVideo.url}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Color-graded overlays to blend video into brand */}
        <div className="absolute inset-0 bg-gradient-to-br from-background/90 via-background/70 to-background/95" />
        <div className="absolute inset-0" style={{ background: "radial-gradient(70% 60% at 80% 20%, color-mix(in oklab, var(--gold) 28%, transparent), transparent 65%)" }} />
        <div className="absolute inset-0" style={{ background: "radial-gradient(60% 60% at 10% 90%, color-mix(in oklab, var(--accent) 22%, transparent), transparent 60%)" }} />

        <div className="container relative mx-auto px-4 py-20 md:py-32">
          <div className="max-w-2xl animate-fade-in">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium text-primary backdrop-blur">
              <ShieldCheck className="h-3.5 w-3.5" /> Authorised Maruti Suzuki Spares Dealer
            </span>
            <h1 className="mt-5 text-5xl font-black leading-[1.05] tracking-tight md:text-7xl">
              <span className="bg-gradient-to-r from-primary via-amber-200 to-primary bg-clip-text text-transparent drop-shadow-[0_2px_20px_rgba(245,166,35,0.25)]">
                LINKUP
              </span>{" "}
              <span className="text-foreground">SPARES</span>
            </h1>
            <p className="mt-3 text-lg font-medium text-foreground/90 md:text-xl">
              Maruti Suzuki Spare Parts — Engineered. Genuine. Delivered.
            </p>
            <p className="mt-4 max-w-xl text-sm text-muted-foreground md:text-base">
              Every part OEM-certified, fitment-guaranteed and backed by manufacturer warranty.
              Search by part number, browse by category, and get pan-India shipping straight to your door.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/categories" className="group inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:opacity-90 hover:shadow-primary/40">
                Browse Catalogue <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link to="/search" className="rounded-md border border-border bg-background/40 px-6 py-3 text-sm font-semibold backdrop-blur hover:border-primary hover:text-primary">
                Search by Part No.
              </Link>
              <a href="tel:+918228001887" className="inline-flex items-center gap-2 rounded-md border border-border bg-background/40 px-6 py-3 text-sm font-semibold backdrop-blur hover:border-primary hover:text-primary">
                <Phone className="h-4 w-4" /> Call us
              </a>
            </div>
            <div className="mt-10 grid max-w-md grid-cols-3 gap-3 text-center">
              {[{i:Award,l:"100% Genuine"},{i:Truck,l:"Pan-India Ship"},{i:Wrench,l:"OEM Warranty"}].map(({i:Icon,l}) => (
                <div key={l} className="glass-card p-3">
                  <Icon className="mx-auto h-5 w-5 text-primary" />
                  <div className="mt-1 text-xs font-medium">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom fade into page */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-background" />
      </section>

      <GenuineCompare />

      {/* Categories */}
      <section className="container mx-auto px-4 py-14">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold md:text-3xl">Shop by Category</h2>
            <p className="mt-1 text-sm text-muted-foreground">Engine, brakes, electricals, AC and more — all OEM.</p>
          </div>
          <Link to="/categories" className="text-sm text-primary hover:underline">View all →</Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {data.categories.map((c) => (
            <Link key={c.id} to="/category/$slug" params={{ slug: c.slug }} className="glass-card group flex flex-col items-center gap-2 p-5 text-center glow-gold animate-fade-in">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-primary/25 to-accent/20 text-primary text-2xl transition-transform group-hover:scale-110">{c.icon ?? "⚙️"}</div>
              <span className="text-sm font-semibold">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      {data.featured.length > 0 && (
        <section className="container mx-auto px-4 py-14">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold md:text-3xl">Featured Parts</h2>
              <p className="mt-1 text-sm text-muted-foreground">Hand-picked premium parts in stock now.</p>
            </div>
            <Link to="/search" className="text-sm text-primary hover:underline">See more →</Link>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {data.featured.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        </section>
      )}

      <GenuineCompare />



      {/* Trust strip */}
      <section className="border-y border-border bg-gradient-to-r from-surface via-background to-surface">
        <div className="container mx-auto grid grid-cols-2 gap-6 px-4 py-10 md:grid-cols-4">
          {[
            {i:ShieldCheck, t:"OEM Certified", s:"Direct from MSGP supply chain"},
            {i:Truck, t:"Fast Dispatch", s:"Same-day for in-stock items"},
            {i:Award, t:"Warranty Backed", s:"Manufacturer warranty on every part"},
            {i:Wrench, t:"Fitment Help", s:"Talk to our parts specialists"},
          ].map(({i:Icon,t,s}) => (
            <div key={t} className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-primary/15 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold">{t}</div>
                <div className="text-xs text-muted-foreground">{s}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}
