import { Suspense } from "react";
import DeliveryTrackingClient from "./DeliveryTrackingClient";

function TrackingFallback() {
  return (
    <main className="site-shell">
      <section className="section">
        <p className="eyebrow">
          ANFA ATHLETICS / DELIVERY
        </p>

        <h1 className="cart-heading">
          CHARGEMENT DU SUIVI.
        </h1>

        <p>
          Nous récupérons les informations de votre livraison.
        </p>
      </section>
    </main>
  );
}

export default function DeliveryTrackingPage() {
  return (
    <Suspense fallback={<TrackingFallback />}>
      <DeliveryTrackingClient />
    </Suspense>
  );
}