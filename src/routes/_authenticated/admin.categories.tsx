import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Trash2, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/categories")({
  component: AdminCategories,
});

function AdminCategories() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  const { data = [] } = useQuery({
    queryKey: ["admin-cats"],
    queryFn: async () => (await supabase.from("categories").select("*").order("sort_order")).data ?? [],
  });
  const tops = data.filter((c: any) => !c.parent_id);
  const subsOf = (id: string) => data.filter((c: any) => c.parent_id === id);

  const del = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-cats"] });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Categories</h1>
        <button onClick={() => { setEditing(null); setOpen(true); }} className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"><Plus className="h-4 w-4" /> Add category</button>
      </div>
      <div className="mt-4 space-y-3">
        {tops.map((t: any) => (
          <div key={t.id} className="glass-card p-4">
            <div className="flex items-center justify-between">
              <div className="font-semibold">{t.icon} {t.name} <span className="ml-2 text-xs text-muted-foreground">/{t.slug}</span></div>
              <div className="flex gap-1">
                <button onClick={() => { setEditing(t); setOpen(true); }} className="inline-grid h-8 w-8 place-items-center rounded-md border border-border"><Pencil className="h-3.5 w-3.5" /></button>
                <button onClick={() => del(t.id)} className="inline-grid h-8 w-8 place-items-center rounded-md border border-border hover:border-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 pl-4">
              {subsOf(t.id).map((s: any) => (
                <div key={s.id} className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs">
                  {s.name}
                  <button onClick={() => { setEditing(s); setOpen(true); }} className="ml-1 text-muted-foreground hover:text-primary"><Pencil className="h-3 w-3" /></button>
                  <button onClick={() => del(s.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {open && <CatForm initial={editing} tops={tops} onClose={() => setOpen(false)} onSaved={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["admin-cats"] }); }} />}
    </div>
  );
}

function CatForm({ initial, tops, onClose, onSaved }: { initial: any; tops: any[]; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({
    name: initial?.name ?? "", slug: initial?.slug ?? "", icon: initial?.icon ?? "",
    parent_id: initial?.parent_id ?? "", sort_order: initial?.sort_order?.toString() ?? "0", active: initial?.active ?? true,
  });
  const save = async () => {
    if (!f.name || !f.slug) return toast.error("Name and slug required");
    const payload: any = { name: f.name, slug: f.slug, icon: f.icon || null, parent_id: f.parent_id || null, sort_order: Number(f.sort_order), active: f.active };
    const op = initial ? supabase.from("categories").update(payload).eq("id", initial.id) : supabase.from("categories").insert(payload);
    const { error } = await op;
    if (error) return toast.error(error.message);
    toast.success("Saved"); onSaved();
  };
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={onClose}>
      <div className="glass-card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold">{initial ? "Edit category" : "New category"}</h2>
        <div className="mt-4 grid gap-3">
          <label className="block text-xs"><div className="mb-1 text-muted-foreground">Name</div><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className="w-full rounded-md border border-border bg-surface px-2 py-2 text-sm" /></label>
          <label className="block text-xs"><div className="mb-1 text-muted-foreground">Slug</div><input value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value })} className="w-full rounded-md border border-border bg-surface px-2 py-2 text-sm" /></label>
          <label className="block text-xs"><div className="mb-1 text-muted-foreground">Icon (emoji)</div><input value={f.icon} onChange={(e) => setF({ ...f, icon: e.target.value })} className="w-full rounded-md border border-border bg-surface px-2 py-2 text-sm" /></label>
          <label className="block text-xs"><div className="mb-1 text-muted-foreground">Parent (leave blank for top-level)</div>
            <select value={f.parent_id} onChange={(e) => setF({ ...f, parent_id: e.target.value })} className="w-full rounded-md border border-border bg-surface px-2 py-2 text-sm">
              <option value="">— Top level —</option>
              {tops.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </label>
          <label className="block text-xs"><div className="mb-1 text-muted-foreground">Sort order</div><input type="number" value={f.sort_order} onChange={(e) => setF({ ...f, sort_order: e.target.value })} className="w-full rounded-md border border-border bg-surface px-2 py-2 text-sm" /></label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} /> Active</label>
        </div>
        <div className="mt-6 flex justify-end gap-2"><button onClick={onClose} className="rounded-md border border-border px-4 py-2 text-sm">Cancel</button><button onClick={save} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Save</button></div>
      </div>
    </div>
  );
}
