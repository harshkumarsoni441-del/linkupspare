DROP POLICY IF EXISTS "insert order items" ON public.order_items;
CREATE POLICY "insert order items" ON public.order_items FOR INSERT TO anon, authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND (o.user_id IS NULL OR o.user_id = auth.uid())));

DROP POLICY IF EXISTS "admins update orders" ON public.orders;
CREATE POLICY "admins update orders" ON public.orders FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));