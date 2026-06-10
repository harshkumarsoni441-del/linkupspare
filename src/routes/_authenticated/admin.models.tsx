import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Trash2, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/models")({
  component: AdminModels,
});

function AdminModels() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  const { data = [] } = useQuery({
    queryKey: ["admin-models"],
    queryFn: async () => (await supabase.from("models").select("*").order("sort_order")).data ?? [],
  });

  const del = async (id: string) => {
    if (!confirm("Delete this model?")) return;
    const { error } = await supabase.from("models").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-models"] });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Models</h1>
        <button onClick={() => { setEditing(null); setOpen(true); }} className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"><Plus className="h-4 w-4" /> Add model</button>
      </div>
      <div className="glass-card mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface/50 text-left text-xs uppercase text-muted-foreground">
            <tr><th className="p-3">Name</th><th className="p-3">Slug</th><th className="p-3">Years</th><th className="p-3">Active</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {data.map((m: any) => (
              <tr key={m.id} className="border-t border-border">
                <td className="p-3">{m.name}</td>
                <td className="p-3 font-mono text-xs">{m.slug}</td>
                <td className="p-3 text-xs">{m.year_from}{m.year_to ? `–${m.year_to}` : "+"}</td>
                <td className="p-3">{m.active ? "✓" : "—"}</td>
                <td className="p-3 text-right">
                  <button onClick={() => { setEditing(m); setOpen(true); }} className="mr-2 inline-grid h-8 w-8 place-items-center rounded-md border border-border hover:border-primary"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => del(m.id)} className="inline-grid h-8 w-8 place-items-center rounded-md border border-border hover:border-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {open && <ModelForm initial={editing} onClose={() => setOpen(false)} onSaved={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["admin-models"] }); }} />}
    </div>
  );
}

function ModelForm({ initial, onClose, onSaved }: { initial: any; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({
    name: initial?.name ?? "",
    slug: initial?.slug ?? "",
    image_url: initial?.image_url ?? "",
    year_from: initial?.year_from?.toString() ?? "2020",
    year_to: initial?.year_to?.toString() ?? "",
    variants: (initial?.variants ?? []).join(", "),
    sort_order: initial?.sort_order?.toString() ?? "0",
    active: initial?.active ?? true,
  });
  const save = async () => {
    if (!f.name || !f.slug) return toast.error("Name and slug required");
    const payload: any = {
      name: f.name, slug: f.slug, image_url: f.image_url || null,
      year_from: Number(f.year_from), year_to: f.year_to ? Number(f.year_to) : null,
      variants: f.variants.split(",").map((s: string) => s.trim()).filter(Boolean),
      sort_order: Number(f.sort_order), active: f.active,
    };
    const op = initial ? supabase.from("models").update(payload).eq("id", initial.id) : supabase.from("models").insert(payload);
    const { error } = await op;
    if (error) return toast.error(error.message);
    toast.success("Saved"); onSaved();
  };
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={onClose}>
      <div className="glass-card w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold">{initial ? "Edit model" : "New model"}</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <FL label="Name"><FI v={f.name} on={(v) => setF({ ...f, name: v })} /></FL>
          <FL label="Slug"><FI v={f.slug} on={(v) => setF({ ...f, slug: v })} /></FL>
          <FL label="Image URL" full><FI v={f.image_url} on={(v) => setF({ ...f, image_url: v })} /></FL>
          <FL label="Year from"><FI v={f.year_from} on={(v) => setF({ ...f, year_from: v })} type="number" /></FL>
          <FL label="Year to"><FI v={f.year_to} on={(v) => setF({ ...f, year_to: v })} type="number" /></FL>
          <FL label="Variants (comma)" full><FI v={f.variants} on={(v) => setF({ ...f, variants: v })} /></FL>
          <FL label="Sort order"><FI v={f.sort_order} on={(v) => setF({ ...f, sort_order: v })} type="number" /></FL>
          <FL label="Active"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} />Enabled</label></FL>
        </div>
        <div className="mt-6 flex justify-end gap-2"><button onClick={onClose} className="rounded-md border border-border px-4 py-2 text-sm">Cancel</button><button onClick={save} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Save</button></div>
      </div>
    </div>
  );
}
function FL({ label, children, full }: { label: string; children: any; full?: boolean }) { return <label className={`block text-xs ${full ? "md:col-span-2" : ""}`}><div className="mb-1 text-muted-foreground">{label}</div>{children}</label>; }
function FI({ v, on, type = "text" }: { v: string; on: (v: string) => void; type?: string }) { return <input type={type} value={v} onChange={(e) => on(e.target.value)} className="w-full rounded-md border border-border bg-surface px-2 py-2 text-sm focus:border-primary focus:outline-none" />; }
