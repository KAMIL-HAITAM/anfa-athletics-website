"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { ProductSizeGuideData } from "../data/products";

type ProductSizeGuideProps = {
  productName: string;
  sizes: string[];
  guide: ProductSizeGuideData | null;
};

export default function ProductSizeGuide({
  productName,
  sizes,
  guide,
}: ProductSizeGuideProps) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, [open]);

  const guideSizes = guide?.sizes.length ? guide.sizes : sizes;
  const hasMeasurements = Boolean(guide?.measurements.length);

  return (
    <>
      <button
        type="button"
        className="size-guide-trigger"
        onClick={() => setOpen(true)}
      >
        GUIDE DES TAILLES <span aria-hidden="true">↗</span>
      </button>

      {open && (
        <div
          className="size-guide-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <section
            className="size-guide-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
          >
            <div className="size-guide-dialog-header">
              <p className="eyebrow">ANFA ATHLETICS / GUIDE PRODUIT</p>
              <button
                ref={closeButtonRef}
                type="button"
                className="size-guide-close"
                onClick={() => setOpen(false)}
                aria-label="Fermer le guide des tailles"
              >
                ×
              </button>
            </div>

            <h2 id={titleId}>Guide des tailles</h2>
            <p className="size-guide-product-name">{productName}</p>

            {hasMeasurements && guide ? (
              <div className="size-guide-table-wrap">
                <table className="size-guide-table">
                  <thead>
                    <tr>
                      <th scope="col">MESURE</th>
                      {guideSizes.map((size) => (
                        <th scope="col" key={size}>{size}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {guide.measurements.map((measurement) => (
                      <tr key={measurement.label}>
                        <th scope="row">{measurement.label}</th>
                        {guideSizes.map((size) => (
                          <td key={size}>{measurement.values[size] ?? "—"}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="size-guide-unit-note">Les unités et les notes de mesure seront précisées avec les données du produit.</p>
              </div>
            ) : (
              <div className="size-guide-pending">
                <p className="eyebrow">MESURES EN COURS DE VALIDATION</p>
                <p>
                  Le tableau des mesures exactes sera publié après validation des prototypes et des tailles de ce produit.
                </p>
                <p>
                  Les tailles affichées actuellement sont indicatives et ne constituent pas encore une grille de tailles définitive.
                </p>
              </div>
            )}

            {guide?.note && <p className="size-guide-note">{guide.note}</p>}
          </section>
        </div>
      )}
    </>
  );
}
