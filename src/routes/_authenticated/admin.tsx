import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-store";
import { Package, ShoppingBag, Car, FolderTree, Tag, LayoutDashboard, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — Maruti Genuine Parts" }] }),
  component: AdminLayout,
});

const nav = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { to: "/admin/models", label: "Models", icon: Car },
  { to: "/admin/categories", label: "Categories", icon: FolderTree },
  { to: "/admin/coupons", label: "Coupons", icon: Tag },
];

function AdminLayout() {
  const { user, isAdmin, loading } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const qc = useQueryClient();
  const { data: anyAdmin, isLoading: checkLoading } = useQuery({
    queryKey: ["any-admin"],
    queryFn: async () => {
      const { count } = await supabase.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "admin");
      return (count ?? 0) > 0;
    },
    enabled: !!user && !isAdmin,
  });

  if (loading || checkLoading) {
    return <div className="p-20 text-center text-muted-foreground">Loading…</div>;
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto max-w-xl px-4 py-20">
        <div className="glass-card p-8 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-primary" />
          <h1 className="mt-4 text-2xl font-bold">Admin access required</h1>
          {!anyAdmin ? (
            <>
              <p className="mt-2 text-sm text-muted-foreground">
                No admin exists yet. Claim the admin role for this dealership now (one-time bootstrap).
              </p>
              <button
                className="mt-6 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
                onClick={async () => {
                  const { data, error } = await supabase.rpc("claim_first_admin");
                  if (error) return toast.error(error.message);
                  if (data) {
                    toast.success("You are now admin. Reloading…");
                    qc.invalidateQueries();
                    setTimeout(() => window.location.reload(), 600);
                  } else toast.error("Admin already exists.");
                }}
              >
                Claim admin role
              </button>
            </>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">Your account does not have admin privileges. Contact the dealership owner.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <aside className="sticky top-0 hidden h-screen w-56 shrink-0 border-r border-border bg-surface/40 md:block">
          <div className="border-b border-border p-4">
            <Link to="/" className="text-sm font-bold text-primary">⚙ Maruti Admin</Link>
          </div>
          <nav className="p-2">
            {nav.map((n) => {
              const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
              return (
                <Link key={n.to} to={n.to} className={`mb-1 flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-surface hover:text-foreground"}`}>
                  <n.icon className="h-4 w-4" />
                  {n.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="min-w-0 flex-1">
          <div className="border-b border-border bg-surface/30 px-4 py-3 md:hidden">
            <div className="flex gap-2 overflow-x-auto">
              {nav.map((n) => {
                const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
                return (
                  <Link key={n.to} to={n.to} className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs ${active ? "bg-primary text-primary-foreground" : "border border-border"}`}>
                    {n.label}
                  </Link>
                );
              })}
            </div>
          </div>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
