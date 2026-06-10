
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'customer');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Models
CREATE TABLE public.models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  year_from INT NOT NULL,
  year_to INT,
  variants TEXT[] NOT NULL DEFAULT '{}',
  image_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.models TO anon, authenticated;
GRANT ALL ON public.models TO service_role;
ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read active models" ON public.models FOR SELECT USING (active = true OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins manage models" ON public.models FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Categories (3-level)
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  parent_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  image_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.categories(parent_id);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read active categories" ON public.categories FOR SELECT USING (active = true OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins manage categories" ON public.categories FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Products
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  part_no TEXT NOT NULL UNIQUE,
  oem_no TEXT,
  description TEXT,
  category_id UUID REFERENCES public.categories(id),
  subcategory_id UUID REFERENCES public.categories(id),
  model_ids UUID[] NOT NULL DEFAULT '{}',
  variants TEXT[] NOT NULL DEFAULT '{}',
  price_paise BIGINT NOT NULL DEFAULT 0,
  discount_pct INT NOT NULL DEFAULT 0,
  stock_qty INT NOT NULL DEFAULT 0,
  weight_grams INT,
  warranty TEXT,
  images TEXT[] NOT NULL DEFAULT '{}',
  featured BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.products(category_id);
CREATE INDEX ON public.products USING GIN(model_ids);
GRANT SELECT ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read active products" ON public.products FOR SELECT USING (status = 'active' OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins manage products" ON public.products FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Coupons
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('percent','flat')),
  value INT NOT NULL,
  min_order_paise BIGINT NOT NULL DEFAULT 0,
  expiry TIMESTAMPTZ,
  usage_limit INT,
  used_count INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.coupons TO anon, authenticated;
GRANT ALL ON public.coupons TO service_role;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read active coupons" ON public.coupons FOR SELECT USING (active = true);
CREATE POLICY "admins manage coupons" ON public.coupons FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Orders
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_no TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  address JSONB NOT NULL,
  subtotal_paise BIGINT NOT NULL,
  shipping_paise BIGINT NOT NULL,
  gst_paise BIGINT NOT NULL,
  discount_paise BIGINT NOT NULL DEFAULT 0,
  total_paise BIGINT NOT NULL,
  coupon_code TEXT,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT SELECT, INSERT ON public.orders TO anon;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "anyone create orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "admins update orders" ON public.orders FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  name TEXT NOT NULL,
  part_no TEXT NOT NULL,
  model_label TEXT,
  unit_price_paise BIGINT NOT NULL,
  qty INT NOT NULL
);
CREATE INDEX ON public.order_items(order_id);
GRANT SELECT, INSERT ON public.order_items TO anon, authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view own order items" ON public.order_items FOR SELECT USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY "insert order items" ON public.order_items FOR INSERT WITH CHECK (true);
