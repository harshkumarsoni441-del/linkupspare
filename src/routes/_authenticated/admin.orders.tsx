import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { inr } from "@/lib/format";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  component: AdminOrders,
});

const STATUSES = ["pending", "paid", "shipped", "delivered", "cancelled", "refunded"];

function AdminOrders() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string>("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<any | null>(null);

  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-orders", filter],
    queryFn: async () => {
      let qb = supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(500);
      if (filter !== "all") qb = qb.eq("status", filter);
      const { data } = await qb;
      return data ?? [];
    },
  });

  const term = q.trim().toLowerCase();
  const rows = term
    ? data.filter((o: any) =>
        [o.order_no, o.customer_name, o.customer_email, o.customer_phone]
          .filter(Boolean)
          .some((v: string) => v.toLowerCase().includes(term)),
      )
    : data;

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Updated");
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
  };

  const deleteOrder = async (id: string, orderNo: string) => {
    if (!confirm(`Delete order ${orderNo}? This cannot be undone.`)) return;
    await supabase.from("order_items").delete().eq("order_id", id);
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Order deleted");
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Orders</h1>
        <div className="flex flex-1 flex-wrap justify-end gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search order no, name, email, phone…"
            className="w-full max-w-xs rounded-md border border-border bg-surface px-3 py-2 text-sm"
          />
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-md border border-border bg-surface px-3 py-2 text-sm">
            <option value="all">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="glass-card mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface/50 text-left text-xs uppercase text-muted-foreground">
            <tr><th className="p-3">Order</th><th className="p-3">Customer</th><th className="p-3 text-right">Total</th><th className="p-3">Status</th><th className="p-3">Date</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Loading…</td></tr>}
            {!isLoading && rows.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No orders.</td></tr>}
            {rows.map((o: any) => (
              <tr key={o.id} className="border-t border-border">
                <td className="p-3 font-mono text-xs">{o.order_no}</td>
                <td className="p-3">{o.customer_name}<div className="text-xs text-muted-foreground">{o.customer_email}</div></td>
                <td className="p-3 text-right tabular">{inr(o.total_paise)}</td>
                <td className="p-3">
                  <select value={o.status} onChange={(e) => updateStatus(o.id, e.target.value)} className="rounded border border-border bg-surface px-2 py-1 text-xs">
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td className="p-3 text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</td>
                <td className="p-3 text-right">
                  <button onClick={() => setOpen(o)} className="text-xs text-primary hover:underline">View</button>
                  <button onClick={() => deleteOrder(o.id, o.order_no)} className="ml-3 text-xs text-destructive hover:underline">Delete</button>
                </td>
              </tr>
            ))}

          </tbody>
        </table>
      </div>
      {open && <OrderDetail order={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

function OrderDetail({ order, onClose }: { order: any; onClose: () => void }) {
  const { data: items = [] } = useQuery({
    queryKey: ["order-items", order.id],
    queryFn: async () => (await supabase.from("order_items").select("*").eq("order_id", order.id)).data ?? [],
  });
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={onClose}>
      <div className="glass-card max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-mono text-lg font-bold">{order.order_no}</h2>
        <p className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleString()} · {order.status}</p>
        <div className="mt-4 grid gap-2 text-sm md:grid-cols-2">
          <div><div className="text-xs text-muted-foreground">Customer</div>{order.customer_name}<br />{order.customer_email}<br />{order.customer_phone}</div>
          <div><div className="text-xs text-muted-foreground">Address</div>{order.address_line1}<br />{order.city}, {order.state} {order.pincode}</div>
        </div>
        <div className="mt-4">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground"><tr><th className="py-2">Item</th><th className="text-right">Qty</th><th className="text-right">Price</th><th className="text-right">Line</th></tr></thead>
            <tbody>
              {items.map((it: any) => (
                <tr key={it.id} className="border-t border-border">
                  <td className="py-2">{it.name}<div className="font-mono text-xs text-muted-foreground">{it.part_no}</div></td>
                  <td className="py-2 text-right tabular">{it.qty}</td>
                  <td className="py-2 text-right tabular">{inr(it.unit_price_paise)}</td>
                  <td className="py-2 text-right tabular">{inr(it.unit_price_paise * it.qty)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 space-y-1 text-right text-sm">
          <div>Subtotal: <span className="tabular">{inr(order.subtotal_paise)}</span></div>
          <div>GST: <span className="tabular">{inr(order.gst_paise ?? 0)}</span></div>
          <div>Shipping: <span className="tabular">{inr(order.shipping_paise)}</span></div>
          {order.discount_paise > 0 && <div>Discount: −<span className="tabular">{inr(order.discount_paise)}</span></div>}
          <div className="text-base font-bold">Total: <span className="tabular text-primary">{inr(order.total_paise)}</span></div>
        </div>
        <button onClick={onClose} className="mt-6 rounded-md border border-border px-4 py-2 text-sm">Close</button>
      </div>
    </div>
  );
}
