import Link from "next/link";
import { notFound } from "next/navigation";
import { getStorefrontProducts } from "../../../lib/medusa-products";
import SiteHeader from "../../../components/SiteHeader";
import SiteFooter from "../../../components/SiteFooter";
import ProductDetailInteractive from "../../../components/ProductDetailInteractive";

export const instant = false;

type ProductPageProps = {
  params: Promise<{ slugs: string }>;
  searchParams: Promise<{ color?: string }>;
};

export default async function ProductPage({ params, searchParams }: ProductPageProps) {
  const [{ slugs: slug }, query] = await Promise.all([params, searchParams]);
  const requestedVariantId = query.color;

  const product = (await getStorefrontProducts()).find(
   (item) => item.slug === slug
  );

  if (!product) notFound();

  const initialVariantId = product.variants.some((variant) => variant.id === requestedVariantId)
    ? requestedVariantId
    : undefined;

  return (
    <main className="site-shell">
      <SiteHeader />
      <section className="section product-detail-section">
        <Link className="product-back-link" href="/collections">
          ← RETOUR À LA COLLECTION
        </Link>
        <ProductDetailInteractive
          product={product}
          allowCart={Boolean(product.commerceVariants?.length)}
          initialVariantId={initialVariantId}
        />
      </section>
      <SiteFooter />
    </main>
  );
}
