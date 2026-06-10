
DROP POLICY "anyone create orders" ON public.orders;
CREATE POLICY "create orders" ON public.orders FOR INSERT
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

DROP POLICY "insert order items" ON public.order_items;
CREATE POLICY "insert order items" ON public.order_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_id
      AND (o.user_id IS NULL OR o.user_id = auth.uid())
  ));

REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon, authenticated;
