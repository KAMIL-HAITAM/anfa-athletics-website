"use client";

import Link from "next/link";
import { useMemo, useState, type CSSProperties } from "react";
import { useCart } from "./CartProvider";
import type { Product, ProductVariant } from "../data/products";
import styles from "./OutfitLabBuilder.module.css";
import dynamic from "next/dynamic";
import type {
  OutfitBottomStyle,
  OutfitTopStyle,
} from "./OutfitLab3DView";

const OutfitLab3DView = dynamic(
  () => import("./OutfitLab3DView"),
  {
    ssr: false,
    loading: () => (
      <div className={styles.viewerLoading}>
        PRÉPARATION DU STUDIO 3D…
      </div>
    ),
  }
);
function variantsFor(product?: Product): ProductVariant[] {
  if (!product) return [];

  if (product.variants.length > 0) {
    return product.variants;
  }

  return [{
    id: "default",
    name: product.color,
    hex: "#171818",
    images: [{ id: "default", src: product.image, alt: product.name }],
    sizes: product.sizes,
    prototypeSizes: product.prototypeSizes,
  }];
}

function sizesFor(
  product?: Product,
  variant?: ProductVariant
): string[] {
  if (!product || !variant) return [];

  const commerceVariants = product.commerceVariants ?? [];

  const realSizes = commerceVariants
    .filter((item) => item.color === variant.name)
    .map((item) => item.size);

  if (realSizes.length > 0) {
    return [...new Set(realSizes)];
  }

  // Do not show prototype sizes as buyable sizes when real variants exist.
  if (commerceVariants.length > 0) return [];

  if (product.status === "available") {
    return variant.sizes.length > 0
      ? variant.sizes
      : product.sizes;
  }

  if (product.status === "concept" || product.status === "upcoming") {
    return variant.prototypeSizes.length > 0
      ? variant.prototypeSizes
      : product.prototypeSizes;
  }

  return [];
}

function commerceVariantFor(
  product: Product,
  variant: ProductVariant,
  size: string
) {
  return (product.commerceVariants ?? []).find(
    (item) => item.color === variant.name && item.size === size
  );
}

function selectedPrice(
  product?: Product,
  variant?: ProductVariant,
  size?: string
): number | null {
  if (!product || !variant || !size) return null;

  const commerceVariants = product.commerceVariants ?? [];

  if (commerceVariants.length > 0) {
    return commerceVariantFor(product, variant, size)?.priceMad ?? null;
  }

  return product.priceMad;
}

function canAddSelection(
  product?: Product,
  variant?: ProductVariant,
  size?: string
): boolean {
  if (
    !product ||
    !variant ||
    !size ||
    (product.status !== "concept" && product.status !== "available")
  ) {
    return false;
  }

  const commerceVariants = product.commerceVariants ?? [];

  return commerceVariants.length === 0 ||
    Boolean(commerceVariantFor(product, variant, size));
}

function formatMAD(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return "À CONFIRMER";
  }

  return new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: "MAD",
    maximumFractionDigits: 0,
  }).format(value);
}

function productImage(
  product?: Product,
  variant?: ProductVariant
): string {
  return variant?.images[0]?.src || product?.image || "";
}
function getTopStyle(product?: Product): OutfitTopStyle {
  const name = `${product?.name ?? ""} ${product?.slug ?? ""}`.toLowerCase();

  if (name.includes("hoodie")) return "hoodie";
  if (name.includes("brassiere") || name.includes("bra")) return "bra";
  if (name.includes("crop")) return "crop";
  if (name.includes("compression")) return "compression";

  return "tee";
}

function getBottomStyle(product?: Product): OutfitBottomStyle {
  const name = `${product?.name ?? ""} ${product?.slug ?? ""}`.toLowerCase();

  if (name.includes("short")) return "shorts";
  if (name.includes("legging")) return "leggings";

  return "jogger";
}
export default function OutfitLabBuilder({
  products,
}: {
  products: Product[];
}) {
  const { addItem } = useCart();

  const tops = useMemo(
    () => products.filter(
      (product) =>
        product.category === "tops" &&
        product.status !== "sold-out"
    ),
    [products]
  );

  const bottoms = useMemo(
    () => products.filter(
      (product) =>
        product.category === "bottoms" &&
        product.status !== "sold-out"
    ),
    [products]
  );

  const [topId, setTopId] = useState(tops[0]?.id ?? "");
  const [bottomId, setBottomId] = useState(bottoms[0]?.id ?? "");
  const [topVariantId, setTopVariantId] = useState(
    tops[0]?.variants[0]?.id ?? "default"
  );
  const [bottomVariantId, setBottomVariantId] = useState(
    bottoms[0]?.variants[0]?.id ?? "default"
  );
  const [topSize, setTopSize] = useState("");
  const [bottomSize, setBottomSize] = useState("");
  const [added, setAdded] = useState(false);

  const topProduct = tops.find((item) => item.id === topId);
  const bottomProduct = bottoms.find((item) => item.id === bottomId);

  const topVariants = variantsFor(topProduct);
  const bottomVariants = variantsFor(bottomProduct);

  const topVariant =
    topVariants.find((item) => item.id === topVariantId) ??
    topVariants[0];

  const bottomVariant =
    bottomVariants.find((item) => item.id === bottomVariantId) ??
    bottomVariants[0];

  const topSizes = sizesFor(topProduct, topVariant);
  const bottomSizes = sizesFor(bottomProduct, bottomVariant);

  const topPrice = selectedPrice(topProduct, topVariant, topSize);
  const bottomPrice = selectedPrice(
    bottomProduct,
    bottomVariant,
    bottomSize
  );

  const total =
    topPrice !== null && bottomPrice !== null
      ? topPrice + bottomPrice
      : null;

  const canAdd =
    canAddSelection(topProduct, topVariant, topSize) &&
    canAddSelection(bottomProduct, bottomVariant, bottomSize);

  function chooseTop(id: string) {
    const product = tops.find((item) => item.id === id);
    setTopId(id);
    setTopVariantId(product?.variants[0]?.id ?? "default");
    setTopSize("");
    setAdded(false);
  }

  function chooseBottom(id: string) {
    const product = bottoms.find((item) => item.id === id);
    setBottomId(id);
    setBottomVariantId(product?.variants[0]?.id ?? "default");
    setBottomSize("");
    setAdded(false);
  }

  function addOutfit() {
    if (
      !canAdd ||
      !topProduct ||
      !bottomProduct ||
      !topVariant ||
      !bottomVariant
    ) {
      return;
    }

    const topCommerceVariant = commerceVariantFor(
      topProduct,
      topVariant,
      topSize
    );

    const bottomCommerceVariant = commerceVariantFor(
      bottomProduct,
      bottomVariant,
      bottomSize
    );

    addItem(
      topProduct.id,
      topCommerceVariant?.id ?? topVariant.id,
      topSize
    );

    addItem(
      bottomProduct.id,
      bottomCommerceVariant?.id ?? bottomVariant.id,
      bottomSize
    );

    setAdded(true);
  }

  return (
    <section className={styles.page}>
      <div className={styles.heading}>
        <p className={styles.eyebrow}>
          ANFA ATHLETICS / FORGED 01 / STUDIO 01
        </p>

        <h1>
          OUTFIT <span>LAB.</span>
        </h1>

        <p className={styles.intro}>
          Composez votre look. Choisissez vos pièces, vos couleurs
          et vos tailles.
        </p>
      </div>

      <div className={styles.workspace}>
        <section className={styles.preview} aria-label="Aperçu du look">
          <div className={styles.previewHeader}>
            <span>VOTRE COMPOSITION</span>
            <span>ANFA / 01</span>
          </div>

          <div className={styles.viewer}>
  <OutfitLab3DView
    topColor={topVariant?.hex ?? "#171818"}
    bottomColor={bottomVariant?.hex ?? "#171818"}
    topStyle={getTopStyle(topProduct)}
    bottomStyle={getBottomStyle(bottomProduct)}
  />

  <span className={styles.viewerHint}>
    GLISSEZ POUR PIVOTER · UTILISEZ LA MOLETTE POUR ZOOMER
  </span>
</div>

<div className={styles.lookMeta}>
  <div className={styles.lookMetaItem}>
    <span className={styles.lookMetaLabel}>01 / HAUT</span>
    <strong>{topProduct?.name ?? "Choisissez un haut"}</strong>
    <small>{topVariant?.name ?? "—"}</small>
  </div>

  <div className={styles.lookMetaItem}>
    <span className={styles.lookMetaLabel}>02 / BAS</span>
    <strong>{bottomProduct?.name ?? "Choisissez un bas"}</strong>
    <small>{bottomVariant?.name ?? "—"}</small>
  </div>
</div>
        </section>

        <section className={styles.controls} aria-label="Personnaliser le look">
          <div className={styles.controlSection}>
            <p className={styles.step}>01 — CHOISIR LE HAUT</p>

            <div className={styles.productGrid}>
              {tops.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  className={`${styles.productOption} ${
                    topId === product.id ? styles.active : ""
                  }`}
                  onClick={() => chooseTop(product.id)}
                  aria-pressed={topId === product.id}
                >
                  <span
                    className={styles.optionImage}
                    style={{
                      backgroundImage: product.image
                        ? `url("${product.image}")`
                        : undefined,
                    }}
                  />
                  <span className={styles.optionName}>
                    {product.name}
                  </span>
                  <span className={styles.optionPrice}>
                    {formatMAD(product.priceMad)}
                  </span>
                </button>
              ))}
            </div>

            <p className={styles.label}>COULEUR</p>
            <div className={styles.swatches} role="group" aria-label="Couleur du haut">
              {topVariants.map((variant) => (
                <button
                  key={variant.id}
                  type="button"
                  className={`${styles.swatch} ${
                    topVariant?.id === variant.id ? styles.activeSwatch : ""
                  }`}
                  style={{ "--swatch": variant.hex } as CSSProperties}
                  title={variant.name}
                  aria-label={variant.name}
                  aria-pressed={topVariant?.id === variant.id}
                  onClick={() => {
                    setTopVariantId(variant.id);
                    setTopSize("");
                    setAdded(false);
                  }}
                />
              ))}
              <span>{topVariant?.name ?? "Couleur non sélectionnée"}</span>
            </div>

            <p className={styles.label}>TAILLE</p>
            <div className={styles.sizes} role="group" aria-label="Taille du haut">
              {topSizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  className={topSize === size ? styles.selectedSize : ""}
                  aria-pressed={topSize === size}
                  onClick={() => {
                    setTopSize(size);
                    setAdded(false);
                  }}
                >
                  {size}
                </button>
              ))}

              {topSizes.length === 0 && (
                <span className={styles.muted}>
                  Tailles à confirmer
                </span>
              )}
            </div>
          </div>

          <div className={styles.divider} />

          <div className={styles.controlSection}>
            <p className={styles.step}>02 — CHOISIR LE BAS</p>

            <div className={styles.productGrid}>
              {bottoms.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  className={`${styles.productOption} ${
                    bottomId === product.id ? styles.active : ""
                  }`}
                  onClick={() => chooseBottom(product.id)}
                  aria-pressed={bottomId === product.id}
                >
                  <span
                    className={styles.optionImage}
                    style={{
                      backgroundImage: product.image
                        ? `url("${product.image}")`
                        : undefined,
                    }}
                  />
                  <span className={styles.optionName}>
                    {product.name}
                  </span>
                  <span className={styles.optionPrice}>
                    {formatMAD(product.priceMad)}
                  </span>
                </button>
              ))}
            </div>

            <p className={styles.label}>COULEUR</p>
            <div className={styles.swatches} role="group" aria-label="Couleur du bas">
              {bottomVariants.map((variant) => (
                <button
                  key={variant.id}
                  type="button"
                  className={`${styles.swatch} ${
                    bottomVariant?.id === variant.id
                      ? styles.activeSwatch
                      : ""
                  }`}
                  style={{ "--swatch": variant.hex } as CSSProperties}
                  title={variant.name}
                  aria-label={variant.name}
                  aria-pressed={bottomVariant?.id === variant.id}
                  onClick={() => {
                    setBottomVariantId(variant.id);
                    setBottomSize("");
                    setAdded(false);
                  }}
                />
              ))}
              <span>{bottomVariant?.name ?? "Couleur non sélectionnée"}</span>
            </div>

            <p className={styles.label}>TAILLE</p>
            <div className={styles.sizes} role="group" aria-label="Taille du bas">
              {bottomSizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  className={bottomSize === size ? styles.selectedSize : ""}
                  aria-pressed={bottomSize === size}
                  onClick={() => {
                    setBottomSize(size);
                    setAdded(false);
                  }}
                >
                  {size}
                </button>
              ))}

              {bottomSizes.length === 0 && (
                <span className={styles.muted}>
                  Tailles à confirmer
                </span>
              )}
            </div>
          </div>

          <div className={styles.summary}>
            <div>
              <p className={styles.step}>03 — VOTRE LOOK</p>
              <p className={styles.summaryTotal}>{formatMAD(total)}</p>
              <p className={styles.muted}>
                {total === null
                  ? "Prix final selon les variantes confirmées."
                  : "Prix indicatif des deux pièces sélectionnées."}
              </p>
            </div>

            <button
              type="button"
              className={styles.addButton}
              onClick={addOutfit}
              disabled={!canAdd}
            >
              AJOUTER LES DEUX PIÈCES ↗
            </button>

            {added && (
              <p className={styles.success}>
                Les deux pièces ont été ajoutées à votre sac.
                <Link href="/cart"> Voir mon sac ↗</Link>
              </p>
            )}

            <p className={styles.disclaimer}>
              Aperçu pré-lancement : une sélection de prototype ne constitue
              pas une commande confirmée.
            </p>
          </div>
        </section>
      </div>
    </section>
  );
}