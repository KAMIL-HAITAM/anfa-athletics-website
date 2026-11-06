import SiteHeader from "../components/SiteHeader";
import { getStorefrontProducts } from "../lib/medusa-products";
import SiteFooter from "../components/SiteFooter";
import Link from "next/link";
import { connection } from "next/server";

export const instant = false;
const categories = [
  {
    name: "HOMME",
    sub: "Luxe brut. Performance d'ingénierie.",
    image: "/images/campaigns/category-homme-anfa.png",
    className: "category-men",
    slug: "homme",
  },
  {
    name: "FEMME",
    sub: "Performance sculptée.",
    image: "/images/campaigns/category-femme-anfa.png",
    className: "category-women",
    slug: "femme",
  },
  {
    name: "NOUVEAUTÉS",
    sub: "Découvrez FORGED 01.",
    image: "/images/campaigns/category-nouveautes-anfa.png",
    className: "category-new",
    slug: "nouveautes",
  },
];

export default async function Home() {
  await connection();

  const products = await getStorefrontProducts();

  return (
    <main className="site-shell">
      <div className="announcement-bar">
        <span>ENGINEERED FOR MOVEMENT</span>
        <span className="announcement-center">
          ANFA ATHLETICS · CASABLANCA
        </span>
        <a href="#collections">DISCOVER FORGED 01 ↗</a>
      </div>

      <SiteHeader />

      <section className="hero" id="home">
        <div className="hero-image" />

        <div className="hero-content">
          <p className="eyebrow">
            DISCIPLINE <span>/</span> PROGRESSION <span>/</span> IDENTITÉ
          </p>

          <h1>
            MORE THAN
            <br />
            ATHLETICS<span className="hero-period">.</span>
          </h1>

          <p className="hero-description">
            Des vêtements conçus pour ceux qui avancent.
            <br />
            Performance, confort et style, réunis dans une seule vision.
          </p>

          <div className="hero-buttons">
            <a className="button button-light" href="#collections">
              DÉCOUVRIR FORGED 01 <span>↗</span>
            </a>
            <a className="button button-outline" href="#studio">
              EXPLORER ANFA ID <span>↗</span>
            </a>
          </div>

          <div className="hero-caption">
            <span>01 — A NEW STANDARD</span>
            <span>CASABLANCA, MOROCCO</span>
          </div>
        </div>

        <a className="scroll-cue" href="#collections">
          SCROLL TO EXPLORE <span>↓</span>
        </a>

        <div className="hero-index">
          <span className="index-active">01</span>
          <span>02</span>
          <span>03</span>
        </div>
      </section>

      <div className="brand-strip" aria-label="Brand values">
        <span>BUILT WITH INTENTION</span>
        <span>✳</span>
        <span>DESIGNED FOR MOVEMENT</span>
        <span>✳</span>
        <span>MADE TO MOVE FORWARD</span>
        <span>✳</span>
        <span>BUILT WITH INTENTION</span>
      </div>

      <section className="section collections-section" id="collections">
        <div className="section-heading">
          <div>
            <p className="eyebrow">EXPLORE THE WORLD OF ANFA</p>
            <h2>
              FIND YOUR <span>UNIFORM.</span>
            </h2>
          </div>
          <Link className="text-link" href="/collections">
            VIEW ALL PRODUCTS ↗
          </Link>
        </div>

        <div className="category-grid">
          {categories.map((category, index) => (
            <a
              className={`category-card ${category.className}`}
              href={`/collections/${category.slug}`}
              key={category.name}
              style={{ backgroundImage: `url("${category.image}")` }}
            >
              <span className="category-number">0{index + 1}</span>
              <div className="category-info">
                <p>{category.sub}</p>
                <h3>{category.name}</h3>
                <span className="category-link">EXPLORER LA COLLECTION ↗</span>
              </div>
            </a>
          ))}

          <a className="category-card outfit-card" href="#studio">
            <div className="outfit-orbit orbit-one" />
            <div className="outfit-orbit orbit-two" />
            <div className="outfit-copy">
              <p className="eyebrow">YOUR LOOK. YOUR RULES.</p>
              <h3>
                OUTFIT
                <br />
                <span>LAB.</span>
              </h3>
              <p>Composez votre prochain look.</p>
              <span className="category-link">EXPLORER OUTFIT LAB ↗</span>
            </div>
            <span className="outfit-mark">A / 01</span>
          </a>
        </div>
      </section>

      <section className="section products-section" id="products">
        <div className="section-heading">
          <div>
            <p className="eyebrow">THE FIRST CHAPTER</p>
            <h2>
              FORGED <span>01.</span>
            </h2>
          </div>
          <p className="section-description">
            Des essentiels techniques.
            <br />
            Une approche différente du mouvement.
          </p>
        </div>

        <div className="product-grid">
          {products.slice(0, 4).map((product, index) => (
            <article className="product-card" key={product.id}>
              <a
                className="product-image"
                href={`/products/${product.slug}`}
                style={{ backgroundImage: `url("${product.image}")` }}
                aria-label={`Découvrir ${product.name}`}
              >
                {product.label && (
                  <span className="product-label">{product.label}</span>
                )}
                <span className="product-number">0{index + 1}</span>
                <span className="product-quick-view">↗</span>
              </a>

              <div className="product-details">
                <div>
                  <p className="product-collection">{product.collection}</p>
                  <h3><a href={`/products/${product.slug}`}>{product.name}</a></h3>
                  <p className="product-color">{product.color}</p>
                </div>
                <p className="product-price">{product.priceMad === null ? "À CONFIRMER" : new Intl.NumberFormat("fr-MA", { style: "currency", currency: "MAD", maximumFractionDigits: 0 }).format(product.priceMad)}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="center-action">
          <a className="button button-dark" href="#collections">
            EXPLORER LA COLLECTION <span>↗</span>
          </a>
        </div>
      </section>

      <section className="studio-section" id="studio">
        <div className="studio-visual">
          <div className="studio-topline">
            <span>ANFA ID / PERSONAL EXPERIENCE</span>
            <span>COMING INTO FOCUS</span>
          </div>
          <div className="studio-graphic" aria-hidden="true">
            <span className="graphic-ring ring-one" />
            <span className="graphic-ring ring-two" />
            <span className="graphic-letter">A</span>
            <span className="graphic-label">YOUR DIGITAL IDENTITY</span>
          </div>
          <span className="studio-visual-bottom">DESIGNED AROUND YOU</span>
        </div>

        <div className="studio-content">
          <p className="eyebrow">THE NEXT SIDE OF ANFA</p>
          <h2>
            YOUR BODY.
            <br />
            YOUR STYLE.
            <br />
            <span>YOUR ANFA.</span>
          </h2>
          <p>
            Découvrez une nouvelle manière d’explorer vos tenues.
            ANFA ID est notre vision d’une expérience plus personnelle :
            un espace pour retrouver vos looks et imaginer vos prochaines
            associations.
          </p>
          <a className="button button-light" href="#about">
            DÉCOUVRIR LE CONCEPT <span>↗</span>
          </a>
          <p className="coming-soon">ANFA ID · CONCEPT EN DÉVELOPPEMENT</p>
        </div>
      </section>

      <section className="philosophy-section" id="about">
        <p className="eyebrow">OUR PHILOSOPHY</p>
        <h2>
          BUILT FOR THE
          <br />
          <span>WORK YOU PUT IN.</span>
        </h2>
        <p>
          La progression n’est pas un moment. C’est une discipline.
          ANFA ATHLETICS accompagne ceux qui avancent, à l’entraînement
          comme au quotidien.
        </p>
        <a href="#home" className="text-link">
          BACK TO THE TOP ↑
        </a>
      </section>

      <SiteFooter />
    </main>
  );
}
