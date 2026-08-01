-- 1. Remove client-side order creation (server-only via service role now)
DROP POLICY IF EXISTS "create orders" ON public.orders;
DROP POLICY IF EXISTS "insert order items" ON public.order_items;
REVOKE INSERT ON public.orders FROM anon, authenticated;
REVOKE INSERT ON public.order_items FROM anon, authenticated;

-- 2. Admins can delete orders
CREATE POLICY "admins delete orders" ON public.orders FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins delete order items" ON public.order_items FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND public.has_role(auth.uid(), 'admin')));
GRANT DELETE ON public.orders TO authenticated;
GRANT DELETE ON public.order_items TO authenticated;

-- 3. Lock down the one-time bootstrap function (an admin already exists)
REVOKE EXECUTE ON FUNCTION public.claim_first_admin() FROM anon, authenticated, public;

-- 4. Attach the stock-decrement trigger (function existed but was never wired up)
DROP TRIGGER IF EXISTS trg_decrement_stock ON public.order_items;
CREATE TRIGGER trg_decrement_stock
  AFTER INSERT ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.decrement_product_stock_from_order_item();