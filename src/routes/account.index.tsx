import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/Layout";
import { useAuth } from "@/lib/auth-store";
import { useEffect } from "react";

export const Route = createFileRoute("/account/")({
  head: () => ({ meta: [{ title: "My Account — Maruti Genuine Parts" }] }),
  component: AccountPage,
});

function AccountPage() {
  const { user, signOut, loading } = useAuth();
  const nav = useNavigate();
  useEffect(() => { if (!loading && !user) nav({ to: "/auth" }); }, [user, loading, nav]);
  if (!user) return null;
  return (
    <SiteLayout>
      <div className="container mx-auto max-w-2xl px-4 py-10">
        <h1 className="text-2xl font-bold">My Account</h1>
        <div className="mt-4 glass-card p-5">
          <div className="text-sm text-muted-foreground">Signed in as</div>
          <div className="font-medium">{user.email}</div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Link to="/account/orders" className="glass-card p-5 hover:border-primary">
            <div className="font-semibold">My Orders</div>
            <div className="text-xs text-muted-foreground">View order history & status</div>
          </Link>
          <Link to="/wishlist" className="glass-card p-5 hover:border-primary">
            <div className="font-semibold">Wishlist</div>
            <div className="text-xs text-muted-foreground">Saved parts</div>
          </Link>
        </div>
        <button onClick={() => signOut()} className="mt-6 rounded-md border border-border px-4 py-2 text-sm hover:border-destructive hover:text-destructive">Sign out</button>
      </div>
    </SiteLayout>
  );
}
