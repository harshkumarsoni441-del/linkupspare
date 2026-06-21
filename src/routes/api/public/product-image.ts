import { createFileRoute } from "@tanstack/react-router";

const fallback = "/__l5e/assets-v1/ac995ce2-2064-460b-b83d-efa65777c506/maruti-genuine.png";

const headers = {
  "Magento-Environment-Id": "f965c128-4aa4-4044-aaf9-3dcae2ad92b9",
  "Magento-Website-Code": "genuine_parts",
  "Magento-Store-View-Code": "parts",
  "Magento-Store-Code": "genuine_parts_store",
  "Magento-Customer-Group": "b6589fc6ab0dc82cf12099d1c2d40ab994e8410c",
  "Content-Type": "application/json",
  Accept: "application/json",
};

const imageQuery = `
  query ProductImage($phrase: String!) {
    productSearch(phrase: $phrase, page_size: 1) {
      items {
        productView {
          images { url label }
        }
      }
    }
  }
`;

export const Route = createFileRoute("/api/public/product-image")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const sku = new URL(request.url).searchParams.get("sku")?.trim();
        if (!sku) return Response.redirect(new URL(fallback, request.url), 302);

        try {
          const res = await fetch("https://www.marutisuzuki.com/genuine-parts/api/graphql", {
            method: "POST",
            headers,
            body: JSON.stringify({ query: imageQuery, variables: { phrase: sku } }),
          });
          const json = await res.json() as {
            data?: { productSearch?: { items?: Array<{ productView?: { images?: Array<{ url?: string }> } }> } };
          };
          const img = json.data?.productSearch?.items?.[0]?.productView?.images?.find((i) => i.url)?.url;
          return Response.redirect(img ?? new URL(fallback, request.url), 302);
        } catch {
          return Response.redirect(new URL(fallback, request.url), 302);
        }
      },
    },
  },
});