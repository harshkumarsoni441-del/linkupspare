import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border bg-surface/50">
      <div className="container mx-auto grid gap-8 px-4 py-12 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 font-semibold">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-gradient-to-br from-primary to-amber-500 text-primary-foreground font-black shadow-md shadow-primary/30">L</span>
            <span className="text-base font-bold tracking-wide">LINKUP SPARES</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">Maruti Suzuki genuine spare parts. OEM-certified, warranty backed, pan-India shipping.</p>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Shop</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/categories" className="hover:text-foreground">Categories</Link></li>
            <li><Link to="/search" className="hover:text-foreground">Search Parts</Link></li>
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
