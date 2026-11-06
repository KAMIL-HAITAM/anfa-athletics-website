
import Link from "next/link";
export default function SiteFooter() {

  return (
    <footer className="site-footer">
      <div className="footer-main">
        <Link className="brand-logo footer-brand" href="/">
          <span className="brand-name">ANFA</span>
          <span className="brand-subtitle">ATHLETICS</span>
        </Link>

        <p>MORE THAN ATHLETICS.</p>

        <Link className="footer-top" href="/">
          RETOUR EN HAUT ↑
        </Link>
      </div>

      <div className="footer-bottom">
        <span>© 2026 ANFA ATHLETICS</span>
        <span>CASABLANCA, MOROCCO</span>
        <span>DISCIPLINE / PROGRESSION / IDENTITÉ</span>
      </div>
    </footer>
  );
}
