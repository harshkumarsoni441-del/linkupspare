import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border bg-surface/50">
      <div className="container mx-auto grid gap-8 px-4 py-12 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 font-semibold">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground font-bold">M</span>
            <span>Maruti Genuine Parts</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">Authorised dealer · 100% genuine OEM parts · Pan-India shipping.</p>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Shop</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/models" className="hover:text-foreground">Models</Link></li>
            <li><Link to="/categories" className="hover:text-foreground">Categories</Link></li>
            <li><Link to="/search" className="hover:text-foreground">Search</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Help</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>Shipping & Returns</li>
            <li>Warranty</li>
            <li>Contact Support</li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Legal</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>Terms</li>
            <li>Privacy</li>
            <li>GST: 22AAAAA0000A1Z5</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Maruti Genuine Parts Dealer. All trademarks belong to their respective owners.
      </div>
    </footer>
  );
}
