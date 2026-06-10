import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Trash2, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/coupons")({
  component: AdminCoupons,
});

function AdminCoupons() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const { data = [] } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: async () => (await supabase.from("coupons").select("*").order("code")).data ?? [],
  });
  const del = async (id: string) => {
    if (!confirm("Delete coupon?")) return;
    const { error } = await supabase.from("coupons").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-coupons"] });
  };
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Coupons</h1>
        <button onClick={() => { setEditing(null); setOpen(true); }} className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"><Plus className="h-4 w-4" /> Add coupon</button>
      </div>
      <div className="glass-card mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface/50 text-left text-xs uppercase text-muted-foreground">
            <tr><th className="p-3">Code</th><th className="p-3">Type</th><th className="p-3 text-right">Value</th><th className="p-3 text-right">Min order</th><th className="p-3">Active</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {data.map((c: any) => (
              <tr key={c.id} className="border-t border-border">
                <td className="p-3 font-mono">{c.code}</td>
                <td className="p-3 text-xs">{c.discount_type}</td>
                <td className="p-3 text-right tabular">{c.discount_type === "percent" ? `${c.discount_value}%` : `₹${(c.discount_value/100).toFixed(2)}`}</td>
                <td className="p-3 text-right tabular">{c.min_order_paise ? `₹${(c.min_order_paise/100).toFixed(0)}` : "—"}</td>
                <td className="p-3">{c.active ? "✓" : "—"}</td>
                <td className="p-3 text-right">
                  <button onClick={() => { setEditing(c); setOpen(true); }} className="mr-2 inline-grid h-8 w-8 place-items-center rounded-md border border-border"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => del(c.id)} className="inline-grid h-8 w-8 place-items-center rounded-md border border-border hover:border-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {open && <CouponForm initial={editing} onClose={() => setOpen(false)} onSaved={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["admin-coupons"] }); }} />}
    </div>
  );
}

function CouponForm({ initial, onClose, onSaved }: { initial: any; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({
    code: initial?.code ?? "",
    discount_type: initial?.discount_type ?? "percent",
    discount_value: initial?.discount_value?.toString() ?? "10",
    min_order_rupees: initial?.min_order_paise ? (initial.min_order_paise / 100).toString() : "",
    max_discount_rupees: initial?.max_discount_paise ? (initial.max_discount_paise / 100).toString() : "",
    usage_limit: initial?.usage_limit?.toString() ?? "",
    active: initial?.active ?? true,
  });
  const save = async () => {
    if (!f.code) return toast.error("Code required");
    const payload: any = {
      code: f.code.toUpperCase(),
      discount_type: f.discount_type,
      discount_value: Number(f.discount_value),
      min_order_paise: f.min_order_rupees ? Math.round(Number(f.min_order_rupees) * 100) : null,
      max_discount_paise: f.max_discount_rupees ? Math.round(Number(f.max_discount_rupees) * 100) : null,
      usage_limit: f.usage_limit ? Number(f.usage_limit) : null,
      active: f.active,
    };
    const op = initial ? supabase.from("coupons").update(payload).eq("id", initial.id) : supabase.from("coupons").insert(payload);
    const { error } = await op;
    if (error) return toast.error(error.message);
    toast.success("Saved"); onSaved();
  };
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={onClose}>
      <div className="glass-card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold">{initial ? "Edit coupon" : "New coupon"}</h2>
        <div className="mt-4 grid gap-3">
          <label className="block text-xs"><div className="mb-1 text-muted-foreground">Code</div><input value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} className="w-full rounded-md border border-border bg-surface px-2 py-2 text-sm font-mono uppercase" /></label>
          <label className="block text-xs"><div className="mb-1 text-muted-foreground">Type</div>
            <select value={f.discount_type} onChange={(e) => setF({ ...f, discount_type: e.target.value })} className="w-full rounded-md border border-border bg-surface px-2 py-2 text-sm">
              <option value="percent">Percent (%)</option><option value="flat">Flat (₹)</option>
            </select>
          </label>
          <label className="block text-xs"><div className="mb-1 text-muted-foreground">Value</div><input type="number" value={f.discount_value} onChange={(e) => setF({ ...f, discount_value: e.target.value })} className="w-full rounded-md border border-border bg-surface px-2 py-2 text-sm" /></label>
          <label className="block text-xs"><div className="mb-1 text-muted-foreground">Min order (₹)</div><input type="number" value={f.min_order_rupees} onChange={(e) => setF({ ...f, min_order_rupees: e.target.value })} className="w-full rounded-md border border-border bg-surface px-2 py-2 text-sm" /></label>
          <label className="block text-xs"><div className="mb-1 text-muted-foreground">Max discount (₹, percent only)</div><input type="number" value={f.max_discount_rupees} onChange={(e) => setF({ ...f, max_discount_rupees: e.target.value })} className="w-full rounded-md border border-border bg-surface px-2 py-2 text-sm" /></label>
          <label className="block text-xs"><div className="mb-1 text-muted-foreground">Usage limit (blank = unlimited)</div><input type="number" value={f.usage_limit} onChange={(e) => setF({ ...f, usage_limit: e.target.value })} className="w-full rounded-md border border-border bg-surface px-2 py-2 text-sm" /></label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} /> Active</label>
        </div>
        <div className="mt-6 flex justify-end gap-2"><button onClick={onClose} className="rounded-md border border-border px-4 py-2 text-sm">Cancel</button><button onClick={save} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Save</button></div>
      </div>
    </div>
  );
}
