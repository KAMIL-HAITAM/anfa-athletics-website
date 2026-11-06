"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "./CartProvider";
import type { Product } from "../data/products";
import ProductSizeGuide from "./ProductSizeGuide";

export default function AddToCartButton({
  product,
  variantId,
}: {
  product: Product;
  variantId?: string;
}) {
  const { addItem } = useCart();

  const variant =
    product.variants.find((item) => item.id === variantId) ??
    product.variants[0];

  const commerceVariants = product.commerceVariants ?? [];

  const commerceVariantsForColor = commerceVariants.filter(
    (item) => item.color === variant?.name
  );

  const sizeOptions = commerceVariants.length > 0
    ? [...new Set(commerceVariantsForColor.map((item) => item.size))]
    : product.status === "available"
      ? variant?.sizes ?? []
      : product.status === "concept"
        ? variant?.prototypeSizes ?? []
        : [];

  const isPrototype = product.status === "concept";
  const [size, setSize] = useState("");
  const [added, setAdded] = useState(false);

  function handleAdd() {
  if (!size || !variant) return;

  const commerceVariant = commerceVariants.find(
    (item) =>
      item.color === variant.name &&
      item.size === size
  );

  if (commerceVariants.length > 0 && !commerceVariant) return;

  addItem(
    product.id,
    commerceVariant?.id ?? variant.id,
    size,
    1
  );

  setAdded(true);
}

  return (
    <div className="add-to-cart-action">
      <p id={`product-size-label-${product.id}`} className="size-selector-label">
        CHOISIR UNE TAILLE
      </p>

      <div
        className="size-options"
        role="group"
        aria-labelledby={`product-size-label-${product.id}`}
      >
        {sizeOptions.map((option) => (
          <button
            key={option}
            type="button"
            className={`size-option ${size === option ? "selected" : ""}`}
            aria-pressed={size === option}
            onClick={() => {
              setSize(option);
              setAdded(false);
            }}
          >
            {option}
          </button>
        ))}
      </div>

      {product && (
        <ProductSizeGuide
          productName={product.name}
          sizes={sizeOptions}
          guide={product.specifications.sizeGuide}
        />
      )}

      <p className="add-to-cart-note">
        {isPrototype
          ? "Tailles proposées à titre de prototype. Les ventes ne sont pas encore ouvertes."
          : product?.status === "available"
            ? "Pré-lancement : votre sélection est conservée dans ce navigateur. Les commandes ne sont pas encore ouvertes."
            : "Ce produit n'est pas disponible à l'achat pour le moment."}
      </p>

      <button
        type="button"
        className="button button-dark"
        onClick={handleAdd}
        disabled={!size || !product || !variant || (product.status !== "available" && product.status !== "concept")}
      >
        {added ? "AJOUTÉ À VOTRE SAC ✓" : "AJOUTER À MON SAC"}
      </button>

      {added && (
        <Link href="/cart" className="add-to-cart-cart-link">
          VOIR MON SAC ↗
        </Link>
      )}
    </div>
  );
}
