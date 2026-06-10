import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { inr } from "@/lib/format";
import { Package, ShoppingBag, IndianRupee, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [products, lowStock, orders, revenue, recent] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("products").select("id", { count: "exact", head: true }).lt("stock_qty", 5),
        supabase.from("orders").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("total_paise").in("status", ["paid", "shipped", "delivered"]),
        supabase.from("orders").select("id,order_no,status,total_paise,created_at,customer_name").order("created_at", { ascending: false }).limit(8),
      ]);
      const totalRev = (revenue.data ?? []).reduce((s, r: any) => s + (r.total_paise ?? 0), 0);
      return {
        products: products.count ?? 0,
        lowStock: lowStock.count ?? 0,
        orders: orders.count ?? 0,
        revenuePaise: totalRev,
        recent: recent.data ?? [],
      };
    },
  });

  if (isLoading) return <div className="p-10 text-muted-foreground">Loading…</div>;

  const stats = [
    { l: "Products", v: data?.products ?? 0, i: Package, c: "text-primary" },
    { l: "Orders", v: data?.orders ?? 0, i: ShoppingBag, c: "text-accent" },
    { l: "Revenue", v: inr(data?.revenuePaise ?? 0), i: IndianRupee, c: "text-primary" },
    { l: "Low stock", v: data?.lowStock ?? 0, i: AlertTriangle, c: "text-destructive" },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.l} className="glass-card p-4">
            <s.i className={`h-5 w-5 ${s.c}`} />
            <div className="mt-3 text-xs uppercase tracking-wide text-muted-foreground">{s.l}</div>
            <div className="mt-1 text-2xl font-bold tabular">{s.v}</div>
          </div>
        ))}
      </div>

      <div className="mt-10">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-lg font-semibold">Recent orders</h2>
          <Link to="/admin/orders" className="text-sm text-primary hover:underline">View all →</Link>
        </div>
        <div className="glass-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface/50 text-left text-xs uppercase text-muted-foreground">
              <tr><th className="p-3">Order</th><th className="p-3">Customer</th><th className="p-3">Status</th><th className="p-3 text-right">Total</th><th className="p-3">Date</th></tr>
            </thead>
            <tbody>
              {(data?.recent ?? []).map((o: any) => (
                <tr key={o.id} className="border-t border-border">
                  <td className="p-3 font-mono text-xs">{o.order_no}</td>
                  <td className="p-3">{o.customer_name ?? "—"}</td>
                  <td className="p-3"><span className="rounded bg-surface px-2 py-0.5 text-xs">{o.status}</span></td>
                  <td className="p-3 text-right tabular">{inr(o.total_paise)}</td>
                  <td className="p-3 text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {(data?.recent ?? []).length === 0 && (
                <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No orders yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
