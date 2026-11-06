"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import SiteHeader from "../../../components/SiteHeader";
import SiteFooter from "../../../components/SiteFooter";
import styles from "./tracking.module.css";

type TrackingDelivery = {
  order_display_id: string | null;
  status: string;
  provider_status: string | null;
  status_reason: string | null;
  provider_tracking_url: string | null;
  courier_name: string | null;
  courier_phone: string | null;
  courier_latitude: number | null;
  courier_longitude: number | null;
  eta_pickup: string | null;
  eta_delivery: string | null;
  last_event_at: string | null;
  live_tracking: boolean;
};

type TrackingStatusKey = {
  title: string;
  description: string;
  stage: number;
  terminal?: boolean;
};

const STATUS: Record<string, TrackingStatusKey> = {
  PREPARING: { title: "Préparation de votre commande", description: "Votre commande est enregistrée. Nous préparons le colis avant sa remise au coursier.", stage: 0 },
  CREATED: { title: "Livraison enregistrée", description: "La demande de livraison a été créée auprès de Glovo.", stage: 0 },
  SCHEDULED: { title: "Livraison planifiée", description: "La livraison est planifiée et sera activée à l'heure prévue.", stage: 0 },
  ACTIVATED: { title: "Recherche d'un coursier", description: "Glovo recherche un coursier disponible pour votre livraison.", stage: 1 },
  READY_FOR_PREPARATION: { title: "Colis à préparer", description: "Glovo indique que le moment optimal de préparation est arrivé.", stage: 0 },
  ACCEPTED: { title: "Coursier assigné", description: "Un coursier a accepté la livraison.", stage: 1 },
  WAITING_FOR_PICKUP: { title: "Coursier proche du dépôt", description: "Le coursier approche du point d'enlèvement.", stage: 1 },
  PICKED: { title: "Colis récupéré", description: "Le colis a été récupéré et se dirige vers votre adresse.", stage: 2 },
  WAITING_FOR_DELIVERY: { title: "Arrivée imminente", description: "Le coursier approche de l'adresse de livraison.", stage: 2 },
  DELIVERED: { title: "Commande livrée", description: "Votre colis a été livré. Merci d'avoir choisi ANFA ATHLETICS.", stage: 3, terminal: true },
  CANCELLED: { title: "Livraison annulée", description: "La livraison a été annulée. Contactez ANFA ATHLETICS si vous avez besoin d'aide.", stage: -1, terminal: true },
  REJECTED: { title: "Livraison non confirmée", description: "Glovo n'a pas pu accepter la demande de livraison. Notre équipe doit vérifier la commande.", stage: -1, terminal: true },
  RETURNED: { title: "Colis retourné", description: "Le colis a été retourné au point de départ. Notre équipe reviendra vers vous.", stage: -1, terminal: true },
  ORDER_CANCELLED: { title: "Commande annulée", description: "La commande ANFA a été annulée. Si une livraison Glovo avait déjà été créée, notre équipe doit également vérifier son annulation.", stage: -1, terminal: true },
};

const TIMELINE = [
  { title: "Commande enregistrée", hint: "Votre commande est confirmée chez ANFA." },
  { title: "Coursier en route vers le dépôt", hint: "Glovo recherche ou assigne un coursier." },
  { title: "En cours de livraison", hint: "Le colis est en route vers votre adresse." },
  { title: "Livrée", hint: "Votre colis est arrivé à destination." },
];

function parseDuration(value: string | null): string | null {
  if (!value) return null;
  const match = value.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i);
  if (!match) return null;
  const hours = Number(match[1] || 0);
  const minutes = Number(match[2] || 0);
  const totalMinutes = hours * 60 + minutes;
  if (totalMinutes <= 0) return "moins d'une minute";
  if (hours > 0 && minutes > 0) return `environ ${hours} h ${minutes} min`;
  if (hours > 0) return `environ ${hours} h`;
  return `environ ${totalMinutes} min`;
}

function formatTime(value: string | null): string {
  if (!value) return "En attente de mise à jour";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Récemment";
  return new Intl.DateTimeFormat("fr-MA", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export default function DeliveryTrackingPage() {
  const params = useParams<{ token: string }>();
  const token = Array.isArray(params.token) ? params.token[0] : params.token;
  const [delivery, setDelivery] = useState<TrackingDelivery | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [refreshError, setRefreshError] = useState(false);
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let active = true;

    async function loadTracking() {
      try {
        const backendUrl = (
          process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
        ).replace(/\/+$/, "");
        const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;
        if (!publishableKey) throw new Error("Medusa publishable key is missing.");

        const response = await fetch(
          `${backendUrl}/store/glovo/deliveries/${encodeURIComponent(token)}`,
          {
            headers: { "x-publishable-api-key": publishableKey },
            cache: "no-store",
          },
        );
        if (!response.ok) {
          if (response.status === 404 && active && !delivery) setNotFound(true);
          throw new Error(`Tracking request failed (${response.status}).`);
        }
        const data = await response.json() as { delivery?: TrackingDelivery };
        if (!data.delivery) throw new Error("Tracking data is unavailable.");
        if (active) {
          setDelivery(data.delivery);
          setNotFound(false);
          setRefreshError(false);
          setLastChecked(new Date().toISOString());
        }
      } catch {
        if (active) setRefreshError(true);
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadTracking();
    const interval = window.setInterval(() => void loadTracking(), 20_000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  // delivery intentionally omitted: keep a single poll loop while preserving last successful data.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const status = delivery ? (STATUS[delivery.status] ?? {
    title: delivery.status.replaceAll("_", " ").toLowerCase(),
    description: "Le statut de la livraison vient d'être mis à jour.",
    stage: 0,
  }) : STATUS.PREPARING;

  const mapUrl = useMemo(() => {
    if (!delivery || delivery.courier_latitude === null || delivery.courier_longitude === null) return null;
    const lat = delivery.courier_latitude;
    const lon = delivery.courier_longitude;
    const bbox = `${lon - 0.008},${lat - 0.008},${lon + 0.008},${lat + 0.008}`;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lon}`;
  }, [delivery]);

  return (
    <main className={`site-shell ${styles.page}`}>
      <SiteHeader />
      <section className={styles.wrap}>
        <p className={styles.eyebrow}>ANFA ATHLETICS / SUIVI DE LIVRAISON</p>
        <div className={styles.titleRow}>
          <div>
            <h1>VOTRE COMMANDE<span>.</span></h1>
            <p className={styles.intro}>Chaque étape, de notre atelier jusqu'à votre porte.</p>
          </div>
          <div className={styles.statusStamp} aria-label="Suivi de livraison">
            <span>ANFA</span><span>ATHLETICS</span><span>TRACK / 01</span>
          </div>
        </div>

        {loading && !delivery ? (
          <div className={styles.messageCard}><span className={styles.loadingDot} /> Chargement du suivi sécurisé…</div>
        ) : notFound && !delivery ? (
          <div className={styles.messageCard}>
            <h2>Suivi indisponible pour le moment.</h2>
            <p>Vérifiez que vous avez ouvert le lien de suivi de votre confirmation de commande. Si le problème persiste, contactez ANFA ATHLETICS en indiquant votre référence de commande.</p>
          </div>
        ) : delivery ? (
          <>
            <section className={styles.heroCard}>
              <div className={styles.heroIcon} aria-hidden="true">{status.stage === 3 ? "✓" : status.stage < 0 ? "!" : "↗"}</div>
              <div className={styles.heroCopy}>
                <p className={styles.sectionEyebrow}>STATUT ACTUEL · {delivery.order_display_id || "COMMANDE ANFA"}</p>
                <h2>{status.title}</h2>
                <p>{status.description}</p>
                {delivery.status_reason && <p className={styles.reason}>{delivery.status_reason}</p>}
              </div>
              <div className={styles.heroMeta}>
                <span>DERNIÈRE MISE À JOUR</span>
                <strong>{formatTime(delivery.last_event_at || lastChecked)}</strong>
                {delivery.live_tracking && <span className={styles.liveBadge}><i /> SUIVI ACTIF</span>}
              </div>
            </section>

            {refreshError && <p className={styles.subtleWarning}>La dernière actualisation n'a pas abouti. Les informations affichées correspondent à la dernière mise à jour reçue.</p>}

            <div className={styles.contentGrid}>
              <div className={styles.mainColumn}>
                <section className={styles.card}>
                  <div className={styles.cardHeading}>
                    <div><p className={styles.sectionEyebrow}>01 / PROGRESSION</p><h3>Le parcours de votre colis</h3></div>
                    <span>GLV / LIVE</span>
                  </div>
                  <div className={styles.timeline}>
                    {TIMELINE.map((step, index) => {
                      const complete = status.stage >= index && status.stage >= 0;
                      const current = status.stage === index;
                      return (
                        <div key={step.title} className={`${styles.timelineStep} ${complete ? styles.timelineComplete : ""} ${current ? styles.timelineCurrent : ""}`}>
                          <div className={styles.timelineMark}>{complete && !current ? "✓" : String(index + 1).padStart(2, "0")}</div>
                          <div><strong>{step.title}</strong><p>{step.hint}</p></div>
                        </div>
                      );
                    })}
                  </div>
                  {delivery.provider_tracking_url && (
                    <a className={styles.externalLink} href={delivery.provider_tracking_url} target="_blank" rel="noreferrer">Ouvrir aussi le suivi Glovo ↗</a>
                  )}
                </section>

                {mapUrl ? (
                  <section className={styles.card}>
                    <div className={styles.cardHeading}>
                      <div><p className={styles.sectionEyebrow}>02 / POSITION DU COURSier</p><h3>Position du livreur</h3></div>
                      <span>MISE À JOUR GLOVO</span>
                    </div>
                    <div className={styles.mapFrame}>
                      <iframe title="Position actuelle du coursier" src={mapUrl} loading="lazy" referrerPolicy="no-referrer" />
                    </div>
                    <p className={styles.mapDisclaimer}>La carte affiche la dernière position transmise par Glovo. Elle se met à jour lorsque de nouvelles positions sont reçues.</p>
                    <a className={styles.externalLink} href={`https://www.openstreetmap.org/?mlat=${delivery.courier_latitude}&mlon=${delivery.courier_longitude}#map=16/${delivery.courier_latitude}/${delivery.courier_longitude}`} target="_blank" rel="noreferrer">Afficher la carte en grand ↗</a>
                  </section>
                ) : (
                  <section className={`${styles.card} ${styles.locationPending}`}>
                    <div className={styles.locationIcon} aria-hidden="true">⌖</div>
                    <div><p className={styles.sectionEyebrow}>02 / POSITION DU COURSIER</p><h3>La carte apparaîtra ici</h3><p>La position en direct s'affichera dès qu'un coursier aura été assigné et que Glovo aura transmis ses coordonnées.</p></div>
                  </section>
                )}
              </div>

              <aside className={styles.sideColumn}>
                <section className={styles.card}>
                  <p className={styles.sectionEyebrow}>03 / INFORMATIONS COURSIER</p>
                  <h3 className={styles.sideHeading}>Votre livreur</h3>
                  {delivery.courier_name ? <p className={styles.courierName}>{delivery.courier_name}</p> : <p className={styles.sideMuted}>Le coursier sera affiché ici dès son assignation par Glovo.</p>}
                  {delivery.courier_phone && <a className={styles.phoneLink} href={`tel:${delivery.courier_phone}`}>Appeler le coursier ↗</a>}
                  {parseDuration(delivery.eta_delivery) && <div className={styles.etaBlock}><span>ARRIVÉE ESTIMÉE</span><strong>{parseDuration(delivery.eta_delivery)}</strong><p>Estimation fournie par Glovo, susceptible de changer.</p></div>}
                  {parseDuration(delivery.eta_pickup) && <div className={styles.etaSmall}><span>ARRIVÉE AU DÉPÔT</span><strong>{parseDuration(delivery.eta_pickup)}</strong></div>}
                </section>
                <section className={styles.cashCard}>
                  <p className={styles.sectionEyebrow}>PAIEMENT</p>
                  <span className={styles.cashMark}>MAD</span>
                  <h3>Espèces à la livraison</h3>
                  <p>Préparez le montant indiqué dans votre confirmation de commande et réglez-le au livreur à la réception de votre colis. Aucun paiement en ligne n'est effectué sur ce site.</p>
                </section>
                <section className={styles.supportCard}>
                  <p className={styles.sectionEyebrow}>BESOIN D'AIDE ?</p>
                  <h3>Nous sommes là.</h3>
                  <p>Pour toute question, indiquez votre référence de commande lorsque vous contactez notre équipe.</p>
                  <a href="mailto:contact@anfa-athletics.com">Contacter ANFA ↗</a>
                </section>
              </aside>
            </div>

            <div className={styles.refreshRow}>
              <span>{delivery.live_tracking ? "Les mises à jour sont synchronisées avec Glovo." : "Le suivi détaillé s'activera lorsque la livraison sera créée auprès de Glovo."}</span>
              <span>Actualisation automatique toutes les 20 secondes</span>
            </div>
          </>
        ) : null}
      </section>
      <SiteFooter />
    </main>
  );
}
