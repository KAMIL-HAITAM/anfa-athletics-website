"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import type { Product, ProductVariant } from "../data/products";
import { useWishlist } from "./WishlistProvider";

const formatPrice = (priceMad: number | null) => {
  if (priceMad === null) return "PRIX BIENTÔT DÉVOILÉ";

  return new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: "MAD",
    maximumFractionDigits: 0,
  }).format(priceMad);
};

type ProductCardProps = {
  product: Product;
  index: number;
  initialVariantId?: string;
  /** Show every color swatch on collection cards, or only the saved color on wishlist cards. */
  variantDisplay?: "all" | "selected" | "none";
  showWishlistButton?: boolean;
  showConceptStatus?: boolean;
  onRemoveSaved?: () => void;
};

export default function ProductCard({
  product,
  index,
  initialVariantId,
  variantDisplay = "all",
  showWishlistButton = true,
  showConceptStatus = false,
  onRemoveSaved,
}: ProductCardProps) {
  const variants = product.variants ?? [];
  const fallbackVariant: ProductVariant = {
    id: "default",
    name: product.color,
    hex: "#171818",
    images: [{ id: "default-image", src: product.image, alt: product.name }],
    sizes: product.sizes,
    prototypeSizes: product.prototypeSizes,
  };
  const availableVariants = variants.length > 0 ? variants : [fallbackVariant];
  const [selectedVariantId, setSelectedVariantId] = useState(
    initialVariantId ?? availableVariants[0].id
  );
  const selectedVariant =
    availableVariants.find((variant) => variant.id === selectedVariantId) ?? availableVariants[0];
  const selectedImage = selectedVariant.images[0]?.src || product.image || "";
  const selectedColorName = selectedVariant.name || product.color;
  const productHref = `/products/${product.slug}?color=${encodeURIComponent(selectedVariant.id)}`;
  const { isSaved, toggleSaved } = useWishlist();
  const saved = isSaved(product.id, selectedVariant.id);

  const swatchVariants = variantDisplay === "selected"
    ? [selectedVariant]
    : variantDisplay === "all"
      ? availableVariants
      : [];
  const shouldShowSwatches = variantDisplay === "selected"
    || (variantDisplay === "all" && availableVariants.length > 1);

  return (
    <article className="product-card">
      <div className="product-card-media">
        <Link
          className="product-image"
          href={productHref}
          style={selectedImage ? { backgroundImage: `url("${selectedImage}")` } : undefined}
          aria-label={`Découvrir ${product.name} — ${selectedColorName}`}
        >
          {!selectedImage && <span className="product-image-placeholder">VISUELS EN PRÉPARATION</span>}
          <span className="product-label">{product.label}</span>
          <span className="product-number">{String(index + 1).padStart(2, "0")}</span>
        </Link>

        {showWishlistButton && (
          <button
            type="button"
            className={`product-card-wishlist ${saved ? "is-saved" : ""}`}
            aria-label={`${saved ? "Retirer" : "Ajouter"} ${product.name}, coloris ${selectedColorName}, ${saved ? "de" : "à"} ma liste d’envies`}
            aria-pressed={saved}
            title={saved ? "Retirer de ma liste d’envies" : "Ajouter à ma liste d’envies"}
            onClick={() => toggleSaved(product.id, selectedVariant.id)}
          >
            {saved ? "♥" : "♡"}
          </button>
        )}
      </div>

      <div className="product-details">
        <div>
          <p className="product-collection">{product.collection}</p>
          <h3>
            <Link href={productHref}>
              {product.name}
            </Link>
          </h3>
          <p className="product-color">{selectedColorName}</p>
        </div>
        <p className="product-price">{formatPrice(product.priceMad)}</p>
      </div>

      {shouldShowSwatches && (
        <div className="product-variant-swatches" role="group" aria-label={`Coloris de ${product.name}`}>
          {swatchVariants.map((variant) => (
            <button
              key={variant.id}
              type="button"
              className={`product-variant-swatch ${variant.id === selectedVariant.id ? "is-active" : ""}`}
              style={{ "--variant-color": variant.hex } as CSSProperties}
              aria-label={`Afficher ${variant.name}`}
              aria-pressed={variant.id === selectedVariant.id}
              title={variant.name}
              onClick={() => setSelectedVariantId(variant.id)}
              disabled={variantDisplay === "selected"}
            >
              <span className="product-variant-swatch-color" />
            </button>
          ))}
        </div>
      )}

      {showConceptStatus && (
        <p className="product-color">CONCEPT · DISPONIBILITÉ À CONFIRMER</p>
      )}

      {onRemoveSaved && (
        <button
          className="wishlist-remove product-card-remove"
          type="button"
          onClick={onRemoveSaved}
        >
          RETIRER DE LA LISTE D’ENVIES ×
        </button>
      )}
    </article>
  );
}
