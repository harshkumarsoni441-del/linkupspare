export const inr = (paise: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(
    (paise || 0) / 100,
  );

export const discounted = (priceP: number, pct: number) =>
  Math.round(priceP * (1 - (pct || 0) / 100));

import maruti from "@/assets/maruti-genuine.png.asset.json";

export function placeholderImg(_seed?: string) {
  return maruti.url;
}

// Maruti's Azure CDN blocks hotlinking (returns 403). Route those through
// images.weserv.nl which fetches server-side and re-serves with proper CORS.
export function proxiedImg(url?: string | null): string {
  if (!url) return maruti.url;
  if (url.includes("azurefd.net") || url.includes("msgp")) {
    const stripped = url.replace(/^https?:\/\//, "");
    return `https://images.weserv.nl/?url=${encodeURIComponent(stripped)}`;
  }
  return url;
}
