
-- Fix RLS function execute grants so anon/authenticated can call has_role()
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_first_admin() TO authenticated;

-- Public catalog tables must be readable by anonymous visitors
GRANT SELECT ON public.products   TO anon;
GRANT SELECT ON public.categories TO anon;
GRANT SELECT ON public.models     TO anon;
GRANT SELECT ON public.coupons    TO anon;

-- Promote the requested admin by email (no-op if user has not signed up yet)
DO $$
DECLARE uid uuid;
BEGIN
  SELECT id INTO uid FROM auth.users
   WHERE lower(email) IN ('harshkumarsoni441@gmail.com','gmailharshkumarsoni441@gmail.com')
   ORDER BY created_at LIMIT 1;
  IF uid IS NOT NULL THEN
    INSERT INTO public.user_roles(user_id, role) VALUES (uid, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;

-- Allow promoting an admin by email from the admin UI later
CREATE OR REPLACE FUNCTION public.promote_admin_by_email(_email text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid; caller uuid := auth.uid();
BEGIN
  IF caller IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT public.has_role(caller, 'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  SELECT id INTO uid FROM auth.users WHERE lower(email) = lower(_email) LIMIT 1;
  IF uid IS NULL THEN RETURN false; END IF;
  INSERT INTO public.user_roles(user_id, role) VALUES (uid, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  RETURN true;
END $$;
GRANT EXECUTE ON FUNCTION public.promote_admin_by_email(text) TO authenticated;
