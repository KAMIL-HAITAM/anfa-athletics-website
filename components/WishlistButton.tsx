"use client";

import { useWishlist } from "./WishlistProvider";

export default function WishlistButton({
  productId,
  variantId,
  variantName,
}: {
  productId: string;
  variantId?: string;
  variantName?: string;
}) {
  const { isSaved, toggleSaved } = useWishlist();
  const saved = isSaved(productId, variantId);
  const colorLabel = variantName ? ` — ${variantName}` : "";

  return (
    <button
      type="button"
      className={`wishlist-toggle ${saved ? "is-saved" : ""}`}
      aria-pressed={saved}
      aria-label={`${saved ? "Retirer" : "Ajouter"}${colorLabel} ${saved ? "de" : "à"} ma liste d’envies`}
      onClick={() => toggleSaved(productId, variantId)}
    >
      {saved ? "♥ AJOUTÉ À MA WISHLIST" : "♡ AJOUTER À MA WISHLIST"}
    </button>
  );
}
