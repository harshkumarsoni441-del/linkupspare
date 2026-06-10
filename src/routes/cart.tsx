import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/Layout";
import { useCart } from "@/lib/cart-store";
import { inr, placeholderImg } from "@/lib/format";
import { Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-store";
import { toast } from "sonner";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Your Cart — Maruti Genuine Parts" }] }),
  component: CartPage,
});

function CartPage() {
  const { items, setQty, remove, subtotalPaise, clear } = useCart();
  const { user } = useAuth();
  const nav = useNavigate();
  const [coupon, setCoupon] = useState("");
  const [discountP, setDiscountP] = useState(0);
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [addr, setAddr] = useState({ name: "", phone: "", email: "", line1: "", city: "", state: "", pincode: "" });
  const [placing, setPlacing] = useState(false);

  const shippingP = subtotalPaise > 100000 || subtotalPaise === 0 ? 0 : 9900;
  const taxableP = Math.max(0, subtotalPaise - discountP);
  const gstP = Math.round(taxableP * 0.18);
  const totalP = taxableP + gstP + shippingP;

  const applyCoupon = async () => {
    if (!coupon) return;
    const { data } = await supabase.from("coupons").select("*").eq("code", coupon.toUpperCase()).eq("active", true).maybeSingle();
    if (!data) { toast.error("Invalid coupon"); return; }
    if (subtotalPaise < data.min_order_paise) { toast.error(`Min order ${inr(data.min_order_paise)}`); return; }
    const d = data.type === "percent" ? Math.round(subtotalPaise * (data.value / 100)) : Math.round(data.value * 100);
    setDiscountP(d); setCouponCode(data.code); toast.success(`Applied ${data.code}: -${inr(d)}`);
  };

  const placeOrder = async () => {
    if (!user) { nav({ to: "/auth", search: { next: "/cart" } as any }); return; }
    if (!addr.name || !addr.phone || !addr.email || !addr.line1 || !addr.pincode) { toast.error("Fill in shipping details"); return; }
    setPlacing(true);
    try {
      const orderNo = `MGP-${Date.now().toString(36).toUpperCase()}`;
      const { data: order, error } = await supabase.from("orders").insert({
        order_no: orderNo, user_id: user.id,
        customer_name: addr.name, customer_email: addr.email, customer_phone: addr.phone,
        address: addr, coupon_code: couponCode,
        subtotal_paise: subtotalPaise, discount_paise: discountP, gst_paise: gstP, shipping_paise: shippingP, total_paise: totalP,
        status: "pending",
      }).select().single();
      if (error) throw error;
      const rows = items.map((i) => ({
        order_id: order.id, product_id: i.productId, name: i.name, part_no: i.partNo,
        qty: i.qty, unit_price_paise: i.unitPricePaise,
      }));
      const { error: e2 } = await supabase.from("order_items").insert(rows);
      if (e2) throw e2;
      clear();
      toast.success("Order placed! Razorpay integration coming next.");
      nav({ to: "/account/orders" });
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    } finally { setPlacing(false); }
  };

  if (items.length === 0) {
    return <SiteLayout><div className="container mx-auto px-4 py-20 text-center">
      <h1 className="text-2xl font-bold">Your cart is empty</h1>
      <Link to="/" className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Continue shopping</Link>
    </div></SiteLayout>;
  }

  return (
    <SiteLayout>
      <div className="container mx-auto grid gap-8 px-4 py-10 lg:grid-cols-[1fr,380px]">
        <div>
          <h1 className="text-2xl font-bold">Cart ({items.length})</h1>
          <div className="mt-4 space-y-3">
            {items.map((i) => (
              <div key={i.productId} className="glass-card flex gap-3 p-3">
                <img src={i.image ?? placeholderImg(i.partNo)} alt={i.name} className="h-20 w-20 rounded object-cover" />
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground">Part {i.partNo}</div>
                  <Link to="/product/$id" params={{ id: i.productId }} className="font-medium hover:text-primary line-clamp-2">{i.name}</Link>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex items-center rounded border border-border text-sm">
                      <button onClick={() => setQty(i.productId, i.qty - 1)} className="px-2 py-1">−</button>
                      <span className="w-8 text-center tabular">{i.qty}</span>
                      <button onClick={() => setQty(i.productId, i.qty + 1)} className="px-2 py-1">+</button>
                    </div>
                    <button onClick={() => remove(i.productId)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
                <div className="text-right font-semibold tabular">{inr(i.unitPricePaise * i.qty)}</div>
              </div>
            ))}
          </div>

          <div className="mt-8 glass-card p-4">
            <h2 className="mb-3 text-base font-semibold">Shipping address</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["name","Full name"],["phone","Phone"],["email","Email"],["pincode","PIN code"],
                ["line1","Address line"],["city","City"],["state","State"],
              ].map(([k,l]) => (
                <input key={k} placeholder={l} value={(addr as any)[k]} onChange={(e) => setAddr({ ...addr, [k]: e.target.value })}
                  className="rounded-md border border-border bg-surface px-3 py-2 text-sm" />
              ))}
            </div>
          </div>
        </div>

        <aside className="glass-card h-fit p-5">
          <h2 className="text-base font-semibold">Order summary</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd className="tabular">{inr(subtotalPaise)}</dd></div>
            {discountP > 0 && <div className="flex justify-between text-success"><dt>Discount ({couponCode})</dt><dd className="tabular">-{inr(discountP)}</dd></div>}
            <div className="flex justify-between"><dt>GST 18%</dt><dd className="tabular">{inr(gstP)}</dd></div>
            <div className="flex justify-between"><dt>Shipping</dt><dd className="tabular">{shippingP === 0 ? "FREE" : inr(shippingP)}</dd></div>
            <div className="mt-2 border-t border-border pt-2 flex justify-between text-base font-bold"><dt>Total</dt><dd className="tabular text-primary">{inr(totalP)}</dd></div>
          </dl>
          <div className="mt-4 flex gap-2">
            <input value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder="Coupon code" className="flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm uppercase" />
            <button onClick={applyCoupon} className="rounded-md border border-primary/40 px-3 text-xs font-semibold text-primary hover:bg-primary/10">Apply</button>
          </div>
          <button onClick={placeOrder} disabled={placing}
            className="mt-4 w-full rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">
            {placing ? "Placing…" : "Place order"}
          </button>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">Razorpay payment will be enabled next.</p>
        </aside>
      </div>
    </SiteLayout>
  );
}
