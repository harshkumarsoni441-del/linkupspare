import { Link } from "@tanstack/react-router";
import { ShoppingCart, Heart, User, Search, Menu } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { useWishlist } from "@/lib/wishlist-store";
import { useAuth } from "@/lib/auth-store";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/categories", label: "Categories" },
  { to: "/search", label: "Search" },
];

export function Header() {
  const { count } = useCart();
  const { ids } = useWishlist();
  const { user, isAdmin } = useAuth();
  const [q, setQ] = useState("");

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="container mx-auto flex items-center gap-3 px-4 py-3">
        <Sheet>
          <SheetTrigger className="md:hidden p-2"><Menu className="h-5 w-5" /></SheetTrigger>
          <SheetContent side="left" className="bg-surface">
            <nav className="mt-8 flex flex-col gap-3">
              {NAV.map((n) => (
                <Link key={n.to} to={n.to} className="text-base font-medium hover:text-primary">{n.label}</Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-gradient-to-br from-primary to-amber-500 text-primary-foreground font-black shadow-md shadow-primary/30">L</span>
          <span className="hidden sm:block">
            <span className="block text-sm font-bold leading-tight tracking-wide">LINKUP SPARES</span>
            <span className="block text-[10px] uppercase leading-tight text-muted-foreground tracking-wider">Maruti Suzuki Genuine Parts</span>
          </span>
        </Link>

        <nav className="ml-6 hidden gap-5 md:flex">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {n.label}
            </Link>
          ))}
        </nav>

        <form
          className="ml-auto hidden flex-1 max-w-md md:flex"
          onSubmit={(e) => { e.preventDefault(); if (q) window.location.assign(`/search?q=${encodeURIComponent(q)}`); }}
        >
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search parts, OEM no, model…"
              className="h-10 w-full rounded-md border border-border bg-surface pl-9 pr-3 text-sm outline-none focus:border-primary"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <Link to="/wishlist" className="relative p-2 hover:text-primary" aria-label="Wishlist">
            <Heart className="h-5 w-5" />
            {ids.length > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">{ids.length}</span>
            )}
          </Link>
          <Link to="/cart" className="relative p-2 hover:text-primary" aria-label="Cart">
            <ShoppingCart className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">{count}</span>
            )}
          </Link>
          <Link to={user ? "/account" : "/auth"} className="p-2 hover:text-primary" aria-label="Account">
            <User className="h-5 w-5" />
          </Link>
          {isAdmin && (
            <Link to="/admin" className="ml-2 rounded-md border border-primary/40 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10">Admin</Link>
          )}
        </div>
      </div>

      {/* Mobile search bar — always visible */}
      <form
        className="container mx-auto px-4 pb-3 md:hidden"
        onSubmit={(e) => { e.preventDefault(); if (q) window.location.assign(`/search?q=${encodeURIComponent(q)}`); }}
      >
        <div className="relative w-full">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search parts, OEM no, model…"
            className="h-10 w-full rounded-md border border-border bg-surface pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>
      </form>
    </header>
  );
}
