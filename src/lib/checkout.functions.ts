import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const addressSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().regex(/^[0-9+\-\s]{7,15}$/, "Invalid phone number"),
  email: z.string().trim().email().max(255),
  line1: z.string().trim().min(3).max(200),
  city: z.string().trim().max(100).default(""),
  state: z.string().trim().max(100).default(""),
  pincode: z.string().trim().regex(/^[0-9]{6}$/, "PIN code must be 6 digits"),
});

const inputSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        qty: z.number().int().min(1).max(99),
      }),
    )
    .min(1)
    .max(50),
  couponCode: z.string().trim().max(40).nullable().optional(),
  address: addressSchema,
});

export type PlaceOrderInput = z.infer<typeof inputSchema>;

/**
 * Creates an order entirely server-side.
 * Prices, discounts and totals are recomputed from the database — anything
 * the browser sends about money is ignored.
 */
export const placeOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const ids = [...new Set(data.items.map((i) => i.productId))];
    const { data: products, error: pErr } = await supabase
      .from("products")
      .select("id, name, part_no, price_paise, discount_pct, stock_qty, status")
      .in("id", ids);
    if (pErr) throw new Error(pErr.message);
    if (!products || products.length !== ids.length) throw new Error("One or more products are no longer available.");

    const lines = data.items.map((i) => {
      const p = products.find((x) => x.id === i.productId)!;
      if (p.status !== "active") throw new Error(`${p.name} is no longer available.`);
      if (p.stock_qty < i.qty) throw new Error(`Only ${p.stock_qty} left of ${p.name}.`);
      const unit = Math.round(p.price_paise * (1 - (p.discount_pct ?? 0) / 100));
      return { product_id: p.id, name: p.name, part_no: p.part_no, qty: i.qty, unit_price_paise: unit };
    });

    const subtotal = lines.reduce((s, l) => s + l.unit_price_paise * l.qty, 0);
    if (subtotal <= 0) throw new Error("Cart total is invalid.");

    let discount = 0;
    let couponCode: string | null = null;
    if (data.couponCode) {
      const { data: c } = await supabase.rpc("validate_coupon", {
        _code: data.couponCode.toUpperCase(),
        _subtotal_paise: subtotal,
      });
      const row = (c ?? [])[0];
      if (row) {
        discount = Math.min(Number(row.discount_paise), subtotal);
        couponCode = row.code;
      }
    }

    const total = Math.max(0, subtotal - discount);
    const orderNo = `MGP-${Date.now().toString(36).toUpperCase()}`;

    const { data: order, error: oErr } = await supabaseAdmin
      .from("orders")
      .insert({
        order_no: orderNo,
        user_id: userId,
        customer_name: data.address.name,
        customer_email: data.address.email,
        customer_phone: data.address.phone,
        address: data.address,
        coupon_code: couponCode,
        subtotal_paise: subtotal,
        discount_paise: discount,
        gst_paise: 0,
        shipping_paise: 0,
        total_paise: total,
        status: "pending",
      })
      .select("id, order_no")
      .single();
    if (oErr || !order) throw new Error(oErr?.message ?? "Could not create the order.");

    const { error: iErr } = await supabaseAdmin
      .from("order_items")
      .insert(lines.map((l) => ({ ...l, order_id: order.id })));
    if (iErr) {
      await supabaseAdmin.from("orders").delete().eq("id", order.id);
      throw new Error(iErr.message);
    }

    if (couponCode) {
      const { data: cur } = await supabaseAdmin.from("coupons").select("id, used_count").eq("code", couponCode).maybeSingle();
      if (cur) await supabaseAdmin.from("coupons").update({ used_count: (cur.used_count ?? 0) + 1 }).eq("id", cur.id);
    }

    return { orderId: order.id, orderNo: order.order_no, totalPaise: total };
  });
