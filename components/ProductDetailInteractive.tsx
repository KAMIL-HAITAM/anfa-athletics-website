"use client";

import { useState, type CSSProperties } from "react";
import Link from "next/link";
import AddToCartButton from "./AddToCartButton";
import WishlistButton from "./WishlistButton";
import type { Product, ProductVariant } from "../data/products";

export default function ProductDetailInteractive({
  product,
  allowCart = true,
  initialVariantId,
}: {
  product: Product;
  allowCart?: boolean;
  initialVariantId?: string;
}) {
  const fallbackVariant: ProductVariant = {
    id: "default",
    name: product.color,
    hex: "#171818",
    images: [{ id: "default-image", src: product.image, alt: product.name }],
    sizes: product.sizes,
    prototypeSizes: product.prototypeSizes,
  };
  const variants = product.variants.length > 0 ? product.variants : [fallbackVariant];
  const initialVariant = variants[0];
  const [selectedVariantId, setSelectedVariantId] = useState(
    variants.some((variant) => variant.id === initialVariantId) ? initialVariantId! : initialVariant.id
  );
  const [activeImageId, setActiveImageId] = useState(initialVariant.images[0]?.id ?? "");

  const selectedVariant: ProductVariant =
    variants.find((variant) => variant.id === selectedVariantId) ?? initialVariant;
  const images = selectedVariant.images.length
    ? selectedVariant.images
    : [{ id: "fallback", src: product.image, alt: product.name }];
  const activeImage = images.find((image) => image.id === activeImageId) ?? images[0];
  const activeImageIndex = Math.max(
    0,
    images.findIndex((image) => image.id === activeImage.id)
  );

  function showPreviousImage() {
    if (images.length < 2) return;
    const previous = images[(activeImageIndex - 1 + images.length) % images.length];
    setActiveImageId(previous.id);
  }

  function showNextImage() {
    if (images.length < 2) return;
    const next = images[(activeImageIndex + 1) % images.length];
    setActiveImageId(next.id);
  }

  const price =
    product.priceMad === null
      ? "Prix bientôt dévoilé"
      : new Intl.NumberFormat("fr-MA", {
          style: "currency",
          currency: "MAD",
          maximumFractionDigits: 0,
        }).format(product.priceMad);

  function selectVariant(variant: ProductVariant) {
    setSelectedVariantId(variant.id);
    setActiveImageId(variant.images[0]?.id ?? "");
  }

  const statusNotice = {
    concept: {
      title: "FORGED 01 · CONCEPT",
      description: "Ce produit est encore en développement. Prix, tailles et disponibilité seront confirmés avant l'ouverture des ventes.",
    },
    upcoming: {
      title: "BIENTÔT DISPONIBLE",
      description: "Ce produit n'est pas encore disponible à l'achat. Les détails seront confirmés avant sa sortie.",
    },
    available: {
      title: "APERÇU AVANT LANCEMENT",
      description: "Les ventes ne sont pas encore ouvertes. Explorez les couleurs et tailles, puis ajoutez cette pièce à votre sac d'aperçu. Aucune commande n'est transmise pour le moment.",
    },
    "sold-out": {
      title: "ACTUELLEMENT ÉPUISÉ",
      description: "Ce produit n'est actuellement pas disponible. Consultez la collection pour découvrir les autres pièces.",
    },
  }[product.status];

  const sizeLabel = product.status === "available" ? "TAILLES PROPOSÉES" : "TAILLES ENVISAGÉES";
  const specificationSections = [
    { key: "fit", label: "COUPE & AJUSTEMENT", value: product.specifications.fit },
    { key: "material", label: "MATIÈRES", value: product.specifications.material },
    { key: "construction", label: "CONSTRUCTION", value: product.specifications.construction },
    { key: "care", label: "ENTRETIEN", value: product.specifications.care },
  ].filter((section) => Boolean(section.value));
  const commerceSizesForColor = (product.commerceVariants ?? [])
    .filter((item) => item.color === selectedVariant.name)
    .map((item) => item.size);
  const displayedSizes = product.status === "available"
    ? (selectedVariant.sizes.length > 0 ? selectedVariant.sizes : commerceSizesForColor)
    : selectedVariant.prototypeSizes;

  return (
    <div className="product-detail-layout">
      <div className="product-gallery">
        <div className="product-gallery-main">
          <div
            key={activeImage.id}
            className="product-gallery-main-image"
            role="img"
            aria-label={activeImage.alt}
            style={activeImage.src ? { backgroundImage: `url("${activeImage.src}")` } : undefined}
          >
            {!activeImage.src && <span className="product-image-placeholder">VISUELS EN PRÉPARATION</span>}
          </div>

          {images.length > 1 && (
            <>
              <button
                type="button"
                className="product-gallery-arrow product-gallery-arrow-prev"
                onClick={showPreviousImage}
                aria-label="Afficher l’image précédente"
                title="Image précédente"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M15 18 9 12l6-6" />
                </svg>
              </button>
              <button
                type="button"
                className="product-gallery-arrow product-gallery-arrow-next"
                onClick={showNextImage}
                aria-label="Afficher l’image suivante"
                title="Image suivante"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </>
          )}

          <span className="product-label">{product.label}</span>
          <span className="product-detail-index">
            {String(images.findIndex((image) => image.id === activeImage.id) + 1).padStart(2, "0")}
            {" / "}
            {String(images.length).padStart(2, "0")}
          </span>
        </div>

        {images.length > 1 && (
          <div className="product-gallery-thumbnails" aria-label="Galerie du produit">
            {images.map((image, index) => (
              <button
                key={image.id}
                type="button"
                className={`product-gallery-thumbnail ${activeImage.id === image.id ? "is-active" : ""}`}
                onClick={() => setActiveImageId(image.id)}
                aria-label={`Afficher l'image ${index + 1} : ${image.alt}`}
                aria-pressed={activeImage.id === image.id}
              >
                <span
                  className="product-gallery-thumbnail-image"
                  aria-hidden="true"
                  style={{ backgroundImage: `url("${image.src}")` }}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="product-detail-copy">
        <p className="eyebrow">{product.collection}</p>
        <h1>{product.name}</h1>
        <p className="product-detail-price">{price}</p>
        <div className="product-detail-divider" />
        <p className="product-detail-description">{product.description}</p>

        <div className="product-color-picker">
          <div className="product-color-picker-heading">
            <span className="product-color-picker-label">COULEUR</span>
            <span className="product-color-name">{selectedVariant.name}</span>
          </div>
          <div className="product-color-options" role="group" aria-label="Choisir une couleur">
            {variants.map((variant) => (
              <button
                key={variant.id}
                type="button"
                className={`product-color-option ${selectedVariant.id === variant.id ? "is-active" : ""}`}
                style={{ "--variant-color": variant.hex } as CSSProperties}
                onClick={() => selectVariant(variant)}
                title={variant.name}
                aria-label={`Choisir la couleur ${variant.name}`}
                aria-pressed={selectedVariant.id === variant.id}
              >
                <span className="product-color-swatch" />
              </button>
            ))}
          </div>
        </div>

        <div className="product-detail-info">
          <span>{sizeLabel}</span>
          <strong>{displayedSizes.length > 0 ? displayedSizes.join(" / ") : "À CONFIRMER"}</strong>
        </div>

        <div className="product-detail-notice" data-product-status={product.status}>
          <p>{statusNotice.title}</p>
          <span>{statusNotice.description}</span>
        </div>

        {allowCart ? (
          <AddToCartButton
             key={selectedVariant.id}
             product={product}
             variantId={selectedVariant.id}
           />
        ) : (
          <p className="add-to-cart-note">
            Cette fiche est synchronisée depuis le catalogue. L’achat sera activé après la configuration des prix et du stock.
          </p>
        )}

        {specificationSections.length > 0 && (
          <div className="product-specification-accordions">
            {specificationSections.map((section) => (
              <details className="product-specification" key={section.key}>
                <summary>{section.label}</summary>
                <p>{section.value}</p>
              </details>
            ))}
          </div>
        )}

        <WishlistButton
          productId={product.id}
          variantId={selectedVariant.id}
          variantName={selectedVariant.name}
        />
        <Link className="button button-dark product-back-button" href="/collections">
          EXPLORER LA COLLECTION <span>↗</span>
        </Link>
      </div>
    </div>
  );
}
