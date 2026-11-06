
"use client";

import Link from "next/link";
import { useCart } from "./CartProvider";

export default function CartIndicator() {
  const { itemCount } = useCart();

  return (
    <Link
      href="/cart"
      aria-label={`Mon sac : ${itemCount} article${itemCount === 1 ? "" : "s"}`}
      className="icon-link"
    >
      SAC <span className="bag-count">{itemCount}</span>
    </Link>
  );
}
