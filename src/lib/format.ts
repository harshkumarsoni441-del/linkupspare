export const inr = (paise: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(
    (paise || 0) / 100,
  );

export const discounted = (priceP: number, pct: number) =>
  Math.round(priceP * (1 - (pct || 0) / 100));

export function placeholderImg(seed: string) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/600/400`;
}
