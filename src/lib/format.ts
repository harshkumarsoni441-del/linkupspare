import maruti from "@/assets/maruti-genuine.png.asset.json";

export const inr = (paise: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(
    (paise || 0) / 100,
  );

export const discounted = (priceP: number, pct: number) =>
  Math.round(priceP * (1 - (pct || 0) / 100));

export function placeholderImg(_seed?: string) {
  return maruti.url;
}

function marutiPartFromUrl(url: string): string | null {
  const decoded = url.includes("images.weserv.nl") || url.includes("wsrv.nl")
    ? decodeURIComponent(new URL(url).searchParams.get("url") ?? url)
    : url;
  const match = decoded.match(/parts-image\/(?:\d{4}\/\d{2}\/\d{2}\/)?([^/]+)\//i);
  return match?.[1]?.toUpperCase() ?? null;
}

// The old Maruti Azure image host now returns a maintenance/403 page.
// Resolve those legacy image URLs through our API, which redirects to the
// current official uploaded product image asset.
export function proxiedImg(url?: string | null): string {
  if (!url) return maruti.url;
  if (url.includes("azurefd.net") || url.includes("msgp") || url.includes("images.weserv.nl") || url.includes("wsrv.nl")) {
    const sku = marutiPartFromUrl(url);
    return sku ? `/api/public/product-image?sku=${encodeURIComponent(sku)}` : maruti.url;
  }
  return url;
}
