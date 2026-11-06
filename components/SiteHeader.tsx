"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import CartIndicator from "./CartIndicator";

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header className={`site-header${menuOpen ? " mobile-menu-open" : ""}`}>
      <Link
        className="brand-logo"
        href="/"
        aria-label="ANFA Athletics home"
        onClick={closeMenu}
      >
        <span className="brand-name">ANFA</span>
        <span className="brand-subtitle">ATHLETICS</span>
      </Link>

      <nav className="desktop-nav" aria-label="Navigation principale">
        <Link href="/collections">COLLECTIONS</Link>
        <Link href="/collections">SHOP</Link>
        <Link href="/#studio">ANFA ID</Link>
        <Link href="/#about">NOTRE PHILOSOPHIE</Link>
        <Link href="/ambassadors">AMBASSADEURS</Link>
      </nav>

      <div className="header-actions">
        <Link href="/account" aria-label="Mon compte" className="icon-link">
          ♙
        </Link>
        <Link
          href="/wishlist"
          aria-label="Ma liste de souhaits"
          className="icon-link"
        >
          ♡
        </Link>
        <CartIndicator />
      </div>

      <button
        type="button"
        className="mobile-menu-toggle"
        aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
        aria-expanded={menuOpen}
        aria-controls="mobile-navigation"
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span aria-hidden="true" />
        <span aria-hidden="true" />
        <span aria-hidden="true" />
      </button>

      <nav
        className="mobile-nav"
        id="mobile-navigation"
        aria-label="Navigation mobile"
        hidden={!menuOpen}
      >
        <Link href="/ambassadors" onClick={closeMenu}>
          AMBASSADORS <span aria-hidden="true">↗</span>
        </Link>
        <Link href="/collections" onClick={closeMenu}>
          COLLECTIONS <span aria-hidden="true">↗</span>
        </Link>
        <Link href="/collections" onClick={closeMenu}>
          SHOP <span aria-hidden="true">↗</span>
        </Link>
        <Link href="/#studio" onClick={closeMenu}>
          ANFA ID <span aria-hidden="true">↗</span>
        </Link>
        <Link href="/#about" onClick={closeMenu}>
          NOTRE PHILOSOPHIE <span aria-hidden="true">↗</span>
        </Link>
        <Link href="/account" onClick={closeMenu}>
          MON COMPTE <span aria-hidden="true">↗</span>
        </Link>
      </nav>
    </header>
  );
}
