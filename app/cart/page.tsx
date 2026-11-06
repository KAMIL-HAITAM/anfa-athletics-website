"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  products as localProducts,
  type Product,
} from "../../data/products";
import { useCart } from "../../components/CartProvider";
import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";

export default function CartPage() {
  const { items, itemCount, setQuantity, removeItem, clearCart } = useCart();
  const [catalogProducts, setCatalogProducts] =
  useState<Product[]>(localProducts);

useEffect(() => {
  let cancelled = false;

  async function loadCatalog() {
    try {
      const response = await fetch("/api/catalog", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Catalogue request failed: ${response.status}`);
      }

      const data = (await response.json()) as {
        products?: Product[];
      };

      if (cancelled || !Array.isArray(data.products)) return;

      const merged = [...data.products];

      // Preserve local fallback products not returned by Medusa.
      for (const localProduct of localProducts) {
        if (!merged.some((product) => product.id === localProduct.id)) {
          merged.push(localProduct);
        }
      }

      setCatalogProducts(merged);
    } catch (error) {
      console.error("[ANFA cart] Could not load catalogue:", error);
    }
  }

  void loadCatalog();

  return () => {
    cancelled = true;
  };
}, []);

function resolveCartItem(item: (typeof items)[number]) {
  const product =
    catalogProducts.find(
      (candidate) =>
        candidate.id === item.productId ||
        candidate.medusaProductId === item.productId
    ) ??
    localProducts.find((candidate) => candidate.id === item.productId);

  if (!product) return null;

  // A Medusa variant ID identifies the actual colour + size combination.
  const commerceVariant = product.commerceVariants?.find(
    (candidate) => candidate.id === item.variantId
  );

  const variant = commerceVariant
    ? product.variants.find(
        (candidate) => candidate.name === commerceVariant.color
      ) ?? product.variants[0]
    : product.variants.find(
        (candidate) => candidate.id === item.variantId
      ) ?? product.variants[0];

  return {
    product,
    variant,
    colorName: commerceVariant?.color ?? variant?.name ?? product.color,
    priceMad: commerceVariant
      ? commerceVariant.priceMad
      : product.priceMad,
    commerceVariant,
  };
}

const resolvedItems = items.map((item) => ({
  item,
  details: resolveCartItem(item),
}));

  const subtotal = resolvedItems.reduce((total, { item, details }) => {
  if (!details || details.priceMad === null) return total;

  return total + details.priceMad * item.quantity;
}, 0);

const allPricesConfirmed =
  resolvedItems.length > 0 &&
  resolvedItems.every(({ item, details }) => {
    if (!details || details.product.status !== "available") {
      return false;
    }

    if (details.commerceVariant) {
      return (
        details.commerceVariant.size === item.size &&
        details.priceMad !== null
      );
    }

    return Boolean(
      details.variant &&
      details.priceMad !== null &&
      details.variant.sizes.includes(item.size)
    );
  });

  const formatPrice = (price: number) => new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: "MAD",
    maximumFractionDigits: 0,
  }).format(price);

  return (
    <main className="site-shell">
      <SiteHeader />
      <section className="section cart-page">
        <p className="eyebrow">ANFA ATHLETICS / VOTRE SÉLECTION</p>
        <h1 className="cart-heading">MON SAC.</h1>

        {items.length === 0 ? (
          <div className="cart-empty">
            <p>Votre sélection est encore vide.</p>
            <Link className="button button-dark" href="/collections">
              EXPLORER LA COLLECTION <span>↗</span>
            </Link>
          </div>
        ) : (
          <div className="cart-layout">
            <div className="cart-items">
              {resolvedItems.map(({ item, details }) => {
                if (!details) return null;

                const { product, variant, colorName, priceMad } = details;
                const cartImage = variant?.images[0]?.src ?? product.image;

                 return (
                  <article className="cart-item" key={`${item.productId}-${item.variantId}-${item.size}`}>
                    <Link
                      className="cart-item-image"
                      href={`/products/${product.slug}`}
                      style={{ backgroundImage: `url("${cartImage}")` }}
                      aria-label={`Voir ${product.name}`}
                    />
                    <div className="cart-item-info">
                      <p className="product-collection">{product.collection}</p>
                      <h2><Link href={`/products/${product.slug}`}>{product.name}</Link></h2>
                      <p className="product-color">{colorName}</p>
                      <p className="product-color">Taille : {item.size}</p>
                      <label className="cart-quantity-label">
                        Quantité
                        <select
                          value={item.quantity}
                          onChange={(event) => setQuantity(item.productId, item.variantId, item.size, Number(event.target.value))}
                          aria-label={`Quantité pour ${product.name}, ${colorName}, taille ${item.size}`}
                        >
                          {[1, 2, 3, 4, 5, 6].map((quantity) => (
                            <option key={quantity} value={quantity}>{quantity}</option>
                          ))}
                        </select>
                      </label>
                      <button
                        className="cart-remove"
                        type="button"
                        onClick={() => removeItem(item.productId, item.variantId, item.size)}
                      >
                        SUPPRIMER
                      </button>
                    </div>
                    <p className="cart-item-price">
                      {priceMad === null ? "Prix à confirmer" : formatPrice(priceMad * item.quantity)}
                    </p>
                  </article>
                );
              })}

              <button className="cart-clear" type="button" onClick={clearCart}>VIDER LE PANIER</button>
            </div>

            <aside className="cart-summary">
              <p className="eyebrow">RÉCAPITULATIF DE COMMANDE</p>
              <h2>RÉCAPITULATIF</h2>
              <div className="cart-summary-row"><span>Articles</span><span>{itemCount}</span></div>
              <div className="cart-summary-row">
                <span>Sous-total</span>
                <strong>{allPricesConfirmed ? formatPrice(subtotal) : "À CONFIRMER"}</strong>
              </div>
              {!allPricesConfirmed && (
                <p className="cart-notice">
                  Les prix et disponibilités doivent être confirmés avant l&apos;ouverture des ventes.
                </p>
              )}
              <Link
                className="button button-dark cart-continue"
                href="/checkout"
                onClick={() => {
                  // A previous order confirmation should not replace a new checkout.
                  try {
                    window.sessionStorage.removeItem("anfa-athletics-order-confirmation");
                  } catch {
                    // Checkout can still open if storage is unavailable.
                  }
                }}
              >
                PASSER AU RÉCAPITULATIF <span>↗</span>
              </Link>
              <Link className="text-link" href="/collections" style={{ marginTop: "18px" }}>
                CONTINUER MES ACHATS ↗
              </Link>
            </aside>
          </div>
        )}
      </section>
      <SiteFooter />
    </main>
  );
}
