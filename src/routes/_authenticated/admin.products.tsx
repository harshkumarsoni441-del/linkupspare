import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useRef } from "react";
import { inr } from "@/lib/format";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, Upload, Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/products")({
  component: AdminProducts,
});

type ProductRow = any;

function AdminProducts() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [open, setOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["admin-products", q],
    queryFn: async () => {
      let query = supabase.from("products").select("*").order("created_at", { ascending: false }).limit(500);
      if (q) query = query.or(`name.ilike.%${q}%,part_no.ilike.%${q}%,oem_no.ilike.%${q}%`);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: cats = [] } = useQuery({
    queryKey: ["all-cats"],
    queryFn: async () => (await supabase.from("categories").select("id,name,parent_id").order("name")).data ?? [],
  });

  const { data: models = [] } = useQuery({
    queryKey: ["all-models"],
    queryFn: async () => (await supabase.from("models").select("id,name").order("name")).data ?? [],
  });

  const del = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["admin-products"] });
  };

  const handleCsv = async (file: File) => {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) return toast.error("Empty CSV");
    const headers = lines[0].split(",").map((s) => s.trim().toLowerCase());
    const rows = lines.slice(1).map((line) => {
      const cells = line.split(",").map((s) => s.trim());
      const obj: any = {};
      headers.forEach((h, i) => { obj[h] = cells[i]; });
      return obj;
    });
    const payload = rows.map((r) => ({
      name: r.name,
      part_no: r.part_no || r.partno,
      oem_no: r.oem_no || null,
      price_paise: Math.round(Number(r.price || r.mrp || 0) * 100),
      discount_pct: Number(r.discount_pct || 0),
      stock_qty: Number(r.stock_qty || r.stock || 0),
      description: r.description || null,
      warranty: r.warranty || null,
      images: r.image ? [r.image] : [],
      status: "active",
      featured: r.featured === "true" || r.featured === "1",
    })).filter((p) => p.name && p.part_no);
    if (payload.length === 0) return toast.error("No valid rows");
    const { error } = await supabase.from("products").insert(payload);
    if (error) return toast.error(error.message);
    toast.success(`Imported ${payload.length} products`);
    qc.invalidateQueries({ queryKey: ["admin-products"] });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Products</h1>
        <div className="flex gap-2">
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCsv(f); e.target.value = ""; }} />
          <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:border-primary">
            <Upload className="h-4 w-4" /> Import CSV
          </button>
          <button onClick={() => { setEditing(null); setOpen(true); }} className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
            <Plus className="h-4 w-4" /> Add product
          </button>
        </div>
      </div>

      <div className="mt-4 relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, part no, OEM…" className="w-full rounded-md border border-border bg-surface pl-9 pr-3 py-2 text-sm focus:border-primary focus:outline-none" />
      </div>

      <div className="glass-card mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3">Name</th><th className="p-3">Part No.</th><th className="p-3 text-right">Price</th><th className="p-3 text-right">Stock</th><th className="p-3">Status</th><th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Loading…</td></tr>}
            {!isLoading && products.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No products.</td></tr>}
            {products.map((p: any) => (
              <tr key={p.id} className="border-t border-border">
                <td className="p-3 max-w-xs truncate">{p.name} {p.featured && <span className="ml-1 rounded bg-primary/20 px-1.5 py-0.5 text-[10px] text-primary">FEATURED</span>}</td>
                <td className="p-3 font-mono text-xs">{p.part_no}</td>
                <td className="p-3 text-right tabular">{inr(p.price_paise)}</td>
                <td className={`p-3 text-right tabular ${p.stock_qty < 5 ? "text-destructive" : ""}`}>{p.stock_qty}</td>
                <td className="p-3"><span className="rounded bg-surface px-2 py-0.5 text-xs">{p.status}</span></td>
                <td className="p-3 text-right">
                  <button onClick={() => { setEditing(p); setOpen(true); }} className="mr-2 inline-grid h-8 w-8 place-items-center rounded-md border border-border hover:border-primary"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => del(p.id)} className="inline-grid h-8 w-8 place-items-center rounded-md border border-border hover:border-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">CSV columns: <code>name,part_no,oem_no,price,discount_pct,stock_qty,description,warranty,image,featured</code></p>

      {open && <ProductForm initial={editing} cats={cats} models={models} onClose={() => setOpen(false)} onSaved={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["admin-products"] }); }} />}
    </div>
  );
}

function ProductForm({ initial, cats, models, onClose, onSaved }: { initial: ProductRow | null; cats: any[]; models: any[]; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({
    name: initial?.name ?? "",
    part_no: initial?.part_no ?? "",
    oem_no: initial?.oem_no ?? "",
    price_rupees: initial ? (initial.price_paise / 100).toString() : "",
    discount_pct: initial?.discount_pct?.toString() ?? "0",
    stock_qty: initial?.stock_qty?.toString() ?? "0",
    description: initial?.description ?? "",
    warranty: initial?.warranty ?? "",
    image: initial?.images?.[0] ?? "",
    category_id: initial?.category_id ?? "",
    subcategory_id: initial?.subcategory_id ?? "",
    status: initial?.status ?? "active",
    featured: !!initial?.featured,
    model_ids: (initial?.model_ids ?? []) as string[],
  });

  const topCats = cats.filter((c) => !c.parent_id);
  const subCats = cats.filter((c) => c.parent_id === f.category_id);

  const save = async () => {
    if (!f.name || !f.part_no) return toast.error("Name and part no. required");
    const payload: any = {
      name: f.name,
      part_no: f.part_no,
      oem_no: f.oem_no || null,
      price_paise: Math.round(Number(f.price_rupees) * 100),
      discount_pct: Number(f.discount_pct),
      stock_qty: Number(f.stock_qty),
      description: f.description || null,
      warranty: f.warranty || null,
      images: f.image ? [f.image] : [],
      category_id: f.category_id || null,
      subcategory_id: f.subcategory_id || null,
      status: f.status,
      featured: f.featured,
      model_ids: f.model_ids,
    };
    const op = initial ? supabase.from("products").update(payload).eq("id", initial.id) : supabase.from("products").insert(payload);
    const { error } = await op;
    if (error) return toast.error(error.message);
    toast.success(initial ? "Updated" : "Created");
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={onClose}>
      <div className="glass-card max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold">{initial ? "Edit product" : "New product"}</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <L label="Name *"><I v={f.name} on={(v) => setF({ ...f, name: v })} /></L>
          <L label="Part No. *"><I v={f.part_no} on={(v) => setF({ ...f, part_no: v })} /></L>
          <L label="OEM No."><I v={f.oem_no} on={(v) => setF({ ...f, oem_no: v })} /></L>
          <L label="Image URL"><I v={f.image} on={(v) => setF({ ...f, image: v })} /></L>
          <L label="Price (₹)"><I v={f.price_rupees} on={(v) => setF({ ...f, price_rupees: v })} type="number" /></L>
          <L label="Discount %"><I v={f.discount_pct} on={(v) => setF({ ...f, discount_pct: v })} type="number" /></L>
          <L label="Stock"><I v={f.stock_qty} on={(v) => setF({ ...f, stock_qty: v })} type="number" /></L>
          <L label="Warranty"><I v={f.warranty} on={(v) => setF({ ...f, warranty: v })} /></L>
          <L label="Category">
            <select className="w-full rounded-md border border-border bg-surface px-2 py-2 text-sm" value={f.category_id} onChange={(e) => setF({ ...f, category_id: e.target.value, subcategory_id: "" })}>
              <option value="">— None —</option>
              {topCats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </L>
          <L label="Subcategory">
            <select className="w-full rounded-md border border-border bg-surface px-2 py-2 text-sm" value={f.subcategory_id} onChange={(e) => setF({ ...f, subcategory_id: e.target.value })}>
              <option value="">— None —</option>
              {subCats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </L>
          <L label="Status">
            <select className="w-full rounded-md border border-border bg-surface px-2 py-2 text-sm" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
              <option value="active">Active</option><option value="draft">Draft</option><option value="archived">Archived</option>
            </select>
          </L>
          <L label="Featured">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.featured} onChange={(e) => setF({ ...f, featured: e.target.checked })} /> Show on home</label>
          </L>
          <L label="Description" full>
            <textarea className="w-full rounded-md border border-border bg-surface px-2 py-2 text-sm" rows={3} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
          </L>
          <L label="Compatible models" full>
            <div className="flex max-h-32 flex-wrap gap-1 overflow-y-auto rounded-md border border-border bg-surface p-2">
              {models.map((m) => {
                const on = f.model_ids.includes(m.id);
                return (
                  <button type="button" key={m.id} onClick={() => setF({ ...f, model_ids: on ? f.model_ids.filter((x) => x !== m.id) : [...f.model_ids, m.id] })}
                    className={`rounded px-2 py-1 text-xs ${on ? "bg-primary text-primary-foreground" : "border border-border"}`}>{m.name}</button>
                );
              })}
            </div>
          </L>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-md border border-border px-4 py-2 text-sm">Cancel</button>
          <button onClick={save} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Save</button>
        </div>
      </div>
    </div>
  );
}

function L({ label, children, full }: { label: string; children: any; full?: boolean }) {
  return <label className={`block text-xs ${full ? "md:col-span-2" : ""}`}><div className="mb-1 text-muted-foreground">{label}</div>{children}</label>;
}
function I({ v, on, type = "text" }: { v: string; on: (v: string) => void; type?: string }) {
  return <input type={type} value={v} onChange={(e) => on(e.target.value)} className="w-full rounded-md border border-border bg-surface px-2 py-2 text-sm focus:border-primary focus:outline-none" />;
}
