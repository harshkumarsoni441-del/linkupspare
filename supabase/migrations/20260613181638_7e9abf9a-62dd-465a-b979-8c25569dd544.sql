UPDATE public.products SET featured = false WHERE name ILIKE '%STRG GEAR%';
UPDATE public.products SET featured = true WHERE id IN (
  SELECT id FROM public.products
  WHERE status='active' AND stock_qty>0 AND price_paise>0
    AND array_length(images,1)>0 AND featured=false
    AND name NOT ILIKE '%STRG GEAR%'
  ORDER BY price_paise DESC LIMIT 8
);