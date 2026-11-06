import SiteHeader from "../../../components/SiteHeader";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteFooter from "../../../components/SiteFooter";
import ProductCard from "../../../components/ProductCard";
import { getStorefrontProducts } from "../../../lib/medusa-products";

export const instant = false;

const collectionInfo = {
  homme: {
    title: "HOMME",
    subtitle: "LUXE BRUT. PERFORMANCE D'INGÉNIERIE.",
    description: "Des essentiels structurés, conçus pour accompagner le mouvement.",
  },
  femme: {
    title: "FEMME",
    subtitle: "PERFORMANCE SCULPTÉE.",
    description: "Une collection pensée autour du mouvement et de la précision.",
  },
  nouveautes: {
    title: "NOUVEAUTÉS",
    subtitle: "DÉCOUVREZ FORGED 01.",
    description: "Découvrez les pièces de notre premier chapitre.",
  },
} as const;

type CollectionPageProps = {
  params: Promise<{ collection: string }>;
};

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { collection } = await params;

  if (!Object.prototype.hasOwnProperty.call(collectionInfo, collection)) {
    notFound();
  }

  const info = collectionInfo[collection as keyof typeof collectionInfo];
  const products = await getStorefrontProducts();
  const collectionProducts = products.filter((product) =>
    product.collections.includes(collection as "homme" | "femme" | "nouveautes")
  );

  return (
    <main className="site-shell">
      <SiteHeader />

      <section className="section products-section">
        <Link className="text-link" href="/collections">
          ← TOUTES LES COLLECTIONS
        </Link>

        <div className="section-heading" style={{ marginTop: "30px" }}>
          <div>
            <p className="eyebrow">{info.subtitle}</p>
            <h2>{info.title} <span>.</span></h2>
          </div>
          <p className="section-description">{info.description}</p>
        </div>

        {collectionProducts.length > 0 ? (
          <div className="product-grid">
            {collectionProducts.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                index={index}
                showConceptStatus={product.status !== "available"}
              />
            ))}
          </div>
        ) : (
          <div className="cart-empty">
            <p className="eyebrow">COLLECTION EN PRÉPARATION</p>
            <h2>BIENTÔT DISPONIBLE.</h2>
            <p>
              Nous préparons cette sélection. Vérifiez que vos produits sont
              affectés à la catégorie correspondante dans Medusa.
            </p>
            <Link className="button button-dark" href="/collections">
              EXPLORER LES AUTRES COLLECTIONS <span>↗</span>
            </Link>
          </div>
        )}
      </section>

      <SiteFooter />
    </main>
  );
}
