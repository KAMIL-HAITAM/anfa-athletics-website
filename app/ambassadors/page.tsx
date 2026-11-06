import { connection } from "next/server";
import Link from "next/link";
import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import CreatorCodeButton from "../../components/CreatorCodeButton";
export const instant = false;
export const metadata = {
  title: "Ambassadeurs ANFA | ANFA ATHLETICS",
  description:
    "Découvrez les athlètes et créateurs qui représentent ANFA ATHLETICS.",
};

type Ambassador = {
  id: string;
  name: string;
  slug: string;
  code: string;
  photo_url: string | null;
  social_handle: string | null;
  bio: string | null;
  is_featured: boolean;
};

async function getAmbassadors(): Promise<Ambassador[]> {
  const backendUrl = (
    process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
    "http://localhost:9000"
  ).replace(/\/+$/, "");

  const publishableKey =
    process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;

  if (!publishableKey) {
    throw new Error("Medusa publishable key is missing.");
  }

  const response = await fetch(`${backendUrl}/store/creators`, {
    headers: {
      "x-publishable-api-key": publishableKey,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Could not load ambassadors: ${response.status}`
    );
  }

  const data = (await response.json()) as {
    ambassadors?: Ambassador[];
  };

  return Array.isArray(data.ambassadors)
    ? data.ambassadors
    : [];
}

export default async function AmbassadorsPage() {
  await connection();

  let ambassadors: Ambassador[] = [];
  let failed = false;

  try {
    ambassadors = await getAmbassadors();
  } catch (error) {
    console.error("[ANFA Ambassadors] Loading failed:", error);
    failed = true;
  }

  return (
    <main className="site-shell">
      <SiteHeader />

      <section className="section ambassadors-page">
        <div className="ambassadors-intro">
          <p className="eyebrow">
            ANFA ATHLETICS / NOTRE COMMUNAUTÉ
          </p>

          <h1 className="cart-heading">
            NOS AMBASSADEURS<span>.</span>
          </h1>

          <p>
            Conçue par des athlètes. Portée par des passionnés. Découvrez celles et ceux qui incarnent notre vision de la discipline, de la progression et de la performance.
          </p>
        </div>

        {failed ? (
          <div className="ambassadors-message">
            <h2>IMPOSSIBLE DE CHARGER LES AMBASSADEURS.</h2>
            <p>
              Le répertoire des créateurs est temporairement indisponible.
              Veuillez réessayer plus tard.
            </p>
          </div>
        ) : ambassadors.length === 0 ? (
          <div className="ambassadors-message">
            <p className="eyebrow">LE MOUVEMENT / 001</p>
            <h2>NOTRE ÉQUIPE PREND FORME.</h2>
            <p>
              Nos ambassadeurs arrivent bientôt. Découvrez prochainement les athlètes et créateurs qui représentent ANFA ATHLETICS.
            </p>
            <Link
              className="button button-dark"
              href="/collections"
            >
              DÉCOUVRIR FORGED 01 ↗
            </Link>
          </div>
        ) : (
          <div className="ambassadors-grid">
            {ambassadors.map((ambassador, index) => (
              <article
                className="ambassador-card"
                key={ambassador.id}
              >
                <div
                  className="ambassador-photo"
                  role="img"
                  aria-label={`Photo of ${ambassador.name}`}
                  style={
                    ambassador.photo_url
                      ? {
                          backgroundImage:
                            `url("${ambassador.photo_url}")`,
                        }
                      : undefined
                  }
                >
                  {!ambassador.photo_url && (
                    <span className="ambassador-photo-placeholder">
                      ANFA /{" "}
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  )}

                  {ambassador.is_featured && (
                    <span className="ambassador-featured">
                      AMBASSADEUR ANFA
                    </span>
                  )}
                </div>

                <div className="ambassador-details">
                  <p className="eyebrow">
                    ATHLÈTE /{" "}
                    {String(index + 1).padStart(2, "0")}
                  </p>

                  <h2>{ambassador.name}</h2>

                  {ambassador.social_handle && (
                    <p className="ambassador-handle">
                      {ambassador.social_handle}
                    </p>
                  )}

                  {ambassador.bio && (
                    <p className="ambassador-bio">
                      {ambassador.bio}
                    </p>
                  )}

                  <CreatorCodeButton code={ambassador.code} />

                  <Link
                    className="ambassador-shop-link"
                    href="/collections"
                  >
                    DÉCOUVRIR LA COLLECTION ↗
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <SiteFooter />
    </main>
  );
}