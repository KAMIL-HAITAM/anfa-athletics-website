"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { products as localProducts, type Product } from "../../data/products";
import { useWishlist } from "../../components/WishlistProvider";
import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import ProductCard from "../../components/ProductCard";

export default function WishlistPage() {
  const { entries, removeSaved, clearWishlist } = useWishlist();
  const [medusaProducts, setMedusaProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/catalog", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load the catalogue");
        return response.json() as Promise<{ products?: Product[] }>;
      })
      .then((data) => {
        if (!cancelled) setMedusaProducts(Array.isArray(data.products) ? data.products : []);
      })
      .catch((error) => {
        console.error("Could not load Medusa products for the wishlist.", error);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  const catalogue = useMemo(() => {
    const byId = new Map<string, Product>();
    localProducts.forEach((product) => byId.set(product.id, product));
    medusaProducts.forEach((product) => byId.set(product.id, product));
    return [...byId.values()];
  }, [medusaProducts]);

  const savedEntries = entries.flatMap((entry) => {
    const product = catalogue.find((candidate) => candidate.id === entry.productId);
    const variant = product?.variants.find((candidate) => candidate.id === entry.variantId);
    return product && variant ? [{ product, variant }] : [];
  });

  return (
    <main className="site-shell">
      <SiteHeader />
      <section className="section products-section wishlist-page">
        <p className="eyebrow">ANFA ATHLETICS / VOTRE SÉLECTION</p>
        <h1 className="cart-heading">MA LISTE D’ENVIES.</h1>

        {loading && savedEntries.length === 0 ? (
          <div className="cart-empty"><p>CHARGEMENT DE VOTRE SÉLECTION…</p></div>
        ) : savedEntries.length === 0 ? (
          <div className="cart-empty">
            <p>GARDEZ LES PIÈCES QUI VOUS INSPIRENT.</p>
            <p>Votre liste d’envies est actuellement vide.</p>
            <Link className="button button-dark" href="/collections">
              DÉCOUVRIR LA COLLECTION <span>↗</span>
            </Link>
          </div>
        ) : (
          <>
            <div className="wishlist-toolbar">
              <p>{savedEntries.length} {savedEntries.length === 1 ? "PIÈCE ENREGISTRÉE" : "PIÈCES ENREGISTRÉES"}</p>
              <button className="wishlist-remove" type="button" onClick={clearWishlist}>
                VIDER LA LISTE D’ENVIES
              </button>
            </div>
            <div className="product-grid">
              {savedEntries.map(({ product, variant }, index) => (
                <ProductCard
                  key={`${product.id}-${variant.id}`}
                  product={product}
                  index={index}
                  initialVariantId={variant.id}
                  variantDisplay="selected"
                  showWishlistButton={false}
                  onRemoveSaved={() => removeSaved(product.id, variant.id)}
                />
              ))}
            </div>
          </>
        )}
      </section>
      <SiteFooter />
    </main>
  );
}
