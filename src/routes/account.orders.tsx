import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/Layout";
import { useAuth } from "@/lib/auth-store";
import { useEffect } from "react";
import { inr } from "@/lib/format";

export const Route = createFileRoute("/account/orders")({
  head: () => ({ meta: [{ title: "My Orders — Maruti Genuine Parts" }] }),
  component: OrdersPage,
});

function OrdersPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  useEffect(() => { if (!loading && !user) nav({ to: "/auth" }); }, [user, loading, nav]);

  const { data, isLoading } = useQuery({
    queryKey: ["my-orders", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("orders").select("*, order_items(*)").eq("user_id", user!.id).order("created_at", { ascending: false })).data ?? [],
  });

  if (!user) return null;
  return (
    <SiteLayout>
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold">My Orders</h1>
        {isLoading ? <p className="mt-4 text-muted-foreground">Loading…</p> :
          !data || data.length === 0 ? <p className="mt-4 text-muted-foreground">No orders yet. <Link to="/" className="text-primary">Start shopping →</Link></p> :
          <div className="mt-6 space-y-4">
            {data.map((o: any) => (
              <div key={o.id} className="glass-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-mono text-sm">{o.order_no}</div>
                    <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</div>
                  </div>
                  <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary uppercase">{o.status}</span>
                  <div className="text-base font-bold tabular text-primary">{inr(o.total_paise)}</div>
                </div>
                <ul className="mt-3 text-sm text-muted-foreground">
                  {o.order_items?.map((i: any) => (<li key={i.id}>{i.qty}× {i.name} <span className="text-xs">({i.part_no})</span></li>))}
                </ul>
              </div>
            ))}
          </div>}
      </div>
    </SiteLayout>
  );
}
