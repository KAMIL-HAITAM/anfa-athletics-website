import Link from "next/link";
import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import ProductCard from "../../components/ProductCard";
import { getStorefrontProducts } from "../../lib/medusa-products";
import type { Product } from "../../data/products";
import { connection } from "next/server";

export const instant = false;

type ShopCategory = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  familyOrder: string[];
  imagePath: string;
};

const shopCategories: ShopCategory[] = [
  {
    id: "t-shirts",
    title: "T-Shirts",
    subtitle: "OVERSIZE / COMPRESSION",
    description: "Deux approches. Une même exigence de mouvement.",
    familyOrder: ["t shirt oversize", "t shirt compression"],
    imagePath: "/images/categories/01-t-shirts.png",
  },
  {
    id: "hoodies",
    title: "Hoodies",
    subtitle: "VOLUME STRUCTURÉ",
    description: "Des volumes généreux, une présence affirmée.",
    familyOrder: ["hoodie"],
    imagePath: "/images/categories/02-hoodies.png",
  },
  {
    id: "debardeurs",
    title: "Débardeurs",
    subtitle: "MARCEL HOMME",
    description: "Une pièce essentielle, conçue pour le mouvement.",
    familyOrder: ["marcel", "debardeur", "tank top"],
    imagePath: "/images/categories/03-debardeurs.png",
  },
  {
    id: "bas",
    title: "Joggers & Leggings",
    subtitle: "JOGGERS / LEGGINGS",
    description: "Des coupes faites pour l’entraînement et le quotidien.",
    familyOrder: ["jogger", "legging"],
    imagePath: "/images/categories/04-bas.png",
  },
  {
    id: "shorts",
    title: "Shorts",
    subtitle: "MOBILITÉ / PERFORMANCE",
    description: "Une liberté de mouvement sans superflu.",
    familyOrder: ["training short", "short"],
    imagePath: "/images/categories/05-training-shorts.png",
  },
  {
    id: "tops-femme",
    title: "Tops Femme",
    subtitle: "CROP TOPS / BRASSIÈRES",
    description: "Des silhouettes sculptées, pensées pour l’intensité.",
    familyOrder: ["crop top", "brassiere"],
    imagePath: "/images/categories/06-tops-femme.png",
  },
];

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function belongsToCategory(product: Product, categoryId: string): boolean {
  const words = normalize(`${product.name} ${product.slug}`);

  switch (categoryId) {
    case "t-shirts":
      return /\bt shirt\b/.test(words);
    case "hoodies":
      return /\bhoodie\b/.test(words);
    case "debardeurs":
      return /\bmarcel\b|\bdebardeur\b|\btank top\b/.test(words);
    case "bas":
      return /\bjogger\b|\blegging\b|\bpants?\b|\btrousers?\b/.test(words);
    case "shorts":
      return /\btraining shorts?\b|\bshorts?\b/.test(words);
    case "tops-femme":
      return /\bcrop top\b|\bbrassiere\b/.test(words);
    default:
      return false;
  }
}

function productDesignNumber(product: Product): number {
  const match = normalize(`${product.name} ${product.slug}`).match(/design\s*0?([1-3])/);
  return match ? Number(match[1]) : 1;
}

function sortForCategory(products: Product[], category: ShopCategory): Product[] {
  const familyRank = (product: Product) => {
    const words = normalize(`${product.name} ${product.slug}`);
    const rank = category.familyOrder.findIndex((family) => words.includes(family));
    return rank < 0 ? 999 : rank;
  };

  return [...products].sort((a, b) =>
    familyRank(a) - familyRank(b) ||
    productDesignNumber(a) - productDesignNumber(b) ||
    a.name.localeCompare(b.name)
  );
}

function formatCount(count: number): string {
  return `${String(count).padStart(2, "0")} ${count > 1 ? "PIÈCES" : "PIÈCE"}`;
}

type CollectionsPageProps = {
  searchParams?: Promise<{ category?: string }>;
};

export default async function CollectionsPage({ searchParams }: CollectionsPageProps) {
  await connection();

  const params = await searchParams;
  const activeCategoryId = params?.category;
  const products = await getStorefrontProducts();
  const activeCategory = shopCategories.find((category) => category.id === activeCategoryId);
  const showAllProducts = activeCategoryId === "tout";
  const showingGrid = Boolean(activeCategory || showAllProducts);

  const visibleProducts = activeCategory
    ? sortForCategory(products.filter((product) => belongsToCategory(product, activeCategory.id)), activeCategory)
    : showAllProducts
      ? [...products]
      : [];

  const categoryCards = shopCategories.map((category) => {
    const matching = sortForCategory(
      products.filter((product) => belongsToCategory(product, category.id)),
      category
    );
    return {
      ...category,
      products: matching,
      image: category.imagePath,
    };
  });

  return (
    <main className="site-shell">
      <SiteHeader />

      <section className="section shop-catalog-section">
        <div className="shop-catalog-topline">
          <p className="eyebrow">ANFA ATHLETICS / FORGED 01</p>
          <p className="shop-catalog-edition">CHAPITRE 01 — CASABLANCA</p>
        </div>

        {showingGrid ? (
          <>
            <Link className="shop-back-link" href="/collections">
              <span aria-hidden="true">←</span> TOUTES LES SOUS-CATÉGORIES
            </Link>

            <div className="shop-catalog-heading">
              <div>
                <p className="eyebrow">{activeCategory?.subtitle ?? "LA COLLECTION COMPLÈTE"}</p>
                <h1>{activeCategory?.title ?? "Toutes les pièces"}<span>.</span></h1>
              </div>
              <p className="shop-catalog-description">
                {activeCategory?.description ?? "Explorez les 27 designs FORGED 01, réunis dans une vue d’ensemble."}
              </p>
            </div>

            <nav className="shop-category-pills" aria-label="Filtrer par sous-catégorie">
              {shopCategories.map((category) => (
                <Link
                  key={category.id}
                  href={`/collections?category=${category.id}`}
                  className={`shop-category-pill${activeCategory?.id === category.id ? " is-active" : ""}`}
                >
                  {category.title}
                  <span>{String(products.filter((product) => belongsToCategory(product, category.id)).length).padStart(2, "0")}</span>
                </Link>
              ))}
              <Link href="/collections?category=tout" className={`shop-category-pill${showAllProducts ? " is-active" : ""}`}>
                Tout voir <span>{String(products.length).padStart(2, "0")}</span>
              </Link>
            </nav>

            <div className="shop-grid-meta">
              <span>{formatCount(visibleProducts.length)}</span>
              <span>FORGED 01 / ANFA ATHLETICS</span>
            </div>

            {visibleProducts.length > 0 ? (
              <div className="product-grid">
                {visibleProducts.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    index={index}
                    showConceptStatus={product.status !== "available"}
                  />
                ))}
              </div>
            ) : (
              <div className="cart-empty">
                <p className="eyebrow">SÉLECTION EN PRÉPARATION</p>
                <h2>BIENTÔT DISPONIBLE.</h2>
                <p>Cette sous-catégorie sera enrichie dès que les pièces seront prêtes.</p>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="shop-catalog-heading shop-catalog-heading-home">
              <div>
                <p className="eyebrow">L’ESSENTIEL, SANS LE SUPERFLU</p>
                <h1>Shop by category<span>.</span></h1>
              </div>
              <div className="shop-catalog-heading-side">
                <p className="shop-catalog-description">
                  Explorez FORGED 01 par type de pièce.
                </p>
                <p className="shop-catalog-total">
                  {formatCount(products.length)} <span>— {shopCategories.length} catégories</span>
                </p>
              </div>
            </div>

            <div className="shop-category-grid">
              {categoryCards.map((category, index) => (
                <Link
                  key={category.id}
                  href={`/collections?category=${category.id}`}
                  className="shop-category-card"
                  aria-label={`Explorer ${category.title}, ${category.products.length} pièces`}
                >
                  <div className="shop-category-art">
                    {category.image ? (
                      <span className="shop-category-art-image" style={{ backgroundImage: `url("${category.image}")` }} />
                    ) : (
                      <span className="shop-category-art-placeholder">ANFA / FORGED 01</span>
                    )}
                    <span className="shop-category-art-arrow" aria-hidden="true">↗</span>
                  </div>
                  <div className="shop-category-card-meta">
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <span>{formatCount(category.products.length)}</span>
                  </div>
                  <div className="shop-category-card-details">
                    <div>
                      <p>{category.subtitle}</p>
                      <h2>{category.title}</h2>
                      <span>{category.description}</span>
                    </div>
                    <span className="shop-category-card-cta" aria-hidden="true">↗</span>
                  </div>
                </Link>
              ))}
            </div>

            <div className="shop-all-products-row">
              <p><strong>Vous savez déjà ce que vous cherchez ?</strong><br />Parcourez tous les designs FORGED 01 en une seule vue.</p>
              <Link className="button button-dark" href="/collections?category=tout">VOIR LES {products.length} PIÈCES <span>↗</span></Link>
            </div>
          </>
        )}
      </section>

      <SiteFooter />
    </main>
  );
}
