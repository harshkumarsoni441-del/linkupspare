import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/Layout";
import { placeholderImg } from "@/lib/format";

const opts = queryOptions({
  queryKey: ["models"],
  queryFn: async () => (await supabase.from("models").select("*").eq("active", true).order("sort_order")).data ?? [],
});

export const Route = createFileRoute("/models/")({
  head: () => ({ meta: [{ title: "Maruti Suzuki Models — Parts Catalogue" }, { name: "description", content: "Browse spare parts for all 41 Maruti Suzuki car models." }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(opts),
  component: ModelsIndex,
});

function ModelsIndex() {
  const { data } = useSuspenseQuery(opts);
  return (
    <SiteLayout>
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold md:text-4xl">All Maruti Suzuki Models</h1>
        <p className="mt-2 text-muted-foreground">Find genuine parts for your exact model and variant.</p>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {data.map((m) => (
            <Link key={m.id} to="/models/$slug" params={{ slug: m.slug }} className="glass-card overflow-hidden glow-gold">
              <img src={m.image_url ?? placeholderImg(m.slug)} alt={m.name} loading="lazy" className="aspect-[4/3] w-full object-cover"
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = placeholderImg(m.slug); }} />
              <div className="p-3">
                <div className="text-sm font-semibold">{m.name}</div>
                <div className="text-[11px] text-muted-foreground">{m.year_from}{m.year_to ? `–${m.year_to}` : "+"}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </SiteLayout>
  );
}
