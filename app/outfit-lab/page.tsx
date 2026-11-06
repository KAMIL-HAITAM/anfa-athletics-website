import type { Metadata } from "next";
import { connection } from "next/server";
import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import OutfitLabBuilder from "../../components/OutfitLabBuilder";
import { products as localProducts, type Product } from "../../data/products";
import { getStorefrontProducts } from "../../lib/medusa-products";

export const instant = false;

export const metadata: Metadata = {
  title: "Outfit Lab",
  description:
    "Composez votre look ANFA ATHLETICS avec les pièces FORGED 01.",
};

export default async function OutfitLabPage() {
  await connection();

  const catalogue = new Map<string, Product>(
    localProducts.map((product) => [product.id, product])
  );

  try {
    const liveProducts = await getStorefrontProducts();

    for (const product of liveProducts) {
      catalogue.set(product.id, product);
    }
  } catch (error) {
    console.error("[Outfit Lab] Catalogue loading failed:", error);
  }

  return (
    <main className="site-shell">
      <SiteHeader />
      <OutfitLabBuilder products={[...catalogue.values()]} />
      <SiteFooter />
    </main>
  );
}