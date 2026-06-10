import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/Layout";

const opts = queryOptions({
  queryKey: ["categories-tree"],
  queryFn: async () => {
    const { data } = await supabase.from("categories").select("*").eq("active", true).order("sort_order");
    const tops = (data ?? []).filter((c) => !c.parent_id);
    const subs = (data ?? []).filter((c) => c.parent_id);
    return tops.map((t) => ({ ...t, children: subs.filter((s) => s.parent_id === t.id) }));
  },
});

export const Route = createFileRoute("/categories/")({
  head: () => ({ meta: [{ title: "All Categories — Maruti Genuine Parts" }, { name: "description", content: "Browse all spare-part categories for Maruti Suzuki vehicles." }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(opts),
  component: CatIndex,
});

function CatIndex() {
  const { data } = useSuspenseQuery(opts);
  return (
    <SiteLayout>
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold md:text-4xl">All Categories</h1>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.map((c) => (
            <div key={c.id} className="glass-card p-5">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/15 text-primary text-lg">{c.icon ?? "⚙️"}</div>
                <Link to="/category/$slug" params={{ slug: c.slug }} className="text-lg font-semibold hover:text-primary">{c.name}</Link>
              </div>
              {c.children.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {c.children.map((s) => (
                    <li key={s.id}>
                      <Link to="/category/$slug/$sub" params={{ slug: c.slug, sub: s.slug }} className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:border-primary hover:text-primary">
                        {s.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </SiteLayout>
  );
}
