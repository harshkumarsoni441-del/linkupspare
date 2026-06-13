
-- 1. Remove public coupon read
DROP POLICY IF EXISTS "public read active coupons" ON public.coupons;

-- Add safe validator that returns only the computed discount
CREATE OR REPLACE FUNCTION public.validate_coupon(_code text, _subtotal_paise bigint)
RETURNS TABLE(code text, discount_paise bigint)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE c public.coupons%ROWTYPE;
BEGIN
  SELECT * INTO c FROM public.coupons
   WHERE lower(coupons.code) = lower(_code)
     AND active = true
     AND (expiry IS NULL OR expiry > now())
     AND (usage_limit IS NULL OR used_count < usage_limit)
   LIMIT 1;
  IF NOT FOUND THEN RETURN; END IF;
  IF _subtotal_paise < c.min_order_paise THEN RETURN; END IF;
  code := c.code;
  IF c.type = 'percent' THEN
    discount_paise := (_subtotal_paise * c.value) / 100;
  ELSE
    discount_paise := c.value * 100;
  END IF;
  RETURN NEXT;
END $$;

REVOKE ALL ON FUNCTION public.validate_coupon(text, bigint) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_coupon(text, bigint) TO anon, authenticated;

-- 2. Tighten order_items insert: require ownership
DROP POLICY IF EXISTS "insert order items" ON public.order_items;
CREATE POLICY "insert order items" ON public.order_items
FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.orders o
  WHERE o.id = order_items.order_id AND o.user_id = auth.uid()
));

-- 3. Lock down admin helper functions from anon
REVOKE EXECUTE ON FUNCTION public.promote_admin_by_email(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.claim_first_admin() FROM PUBLIC, anon;
