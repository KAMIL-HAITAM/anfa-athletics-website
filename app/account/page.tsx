
"use client";

import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import Link from "next/link";
import { sdk } from "../../lib/medusa";
import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import Image from "next/image";
import "./order-history.css";

type Customer = {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  metadata?: Record<string, unknown>;
};

type AccountMode = "login" | "register";

type CustomerOrderItem = {
  id: string;
  title?: string | null;
  subtitle?: string | null;
  thumbnail?: string | null;
  variant_title?: string | null;
  quantity?: number | null;
};

type CustomerOrder = {
  id: string;
  display_id?: number | string | null;
  status?: string | null;
  payment_status?: string | null;
  fulfillment_status?: string | null;
  currency_code?: string | null;
  total?: number | null;
  created_at?: string | null;
  items?: CustomerOrderItem[] | null;
};

type CustomerOrderPage = {
  orders: CustomerOrder[];
  count: number;
  limit: number;
  offset: number;
};

const ORDER_HISTORY_PAGE_SIZE = 10;

async function getCustomerOrderPage(offset: number): Promise<CustomerOrderPage> {
  const response = await sdk.store.order.list({
    limit: ORDER_HISTORY_PAGE_SIZE,
    offset,
    order: "-created_at",
    fields:
      "id,display_id,status,payment_status,fulfillment_status,currency_code,total,created_at,*items",
  });

  return response as unknown as CustomerOrderPage;
}

async function getCustomerOrderTrackingPath(orderId: string): Promise<string | null> {
  try {
    const result = await sdk.client.fetch<{ tracking_path?: string }>(
      `/store/glovo/customer-orders/${encodeURIComponent(orderId)}`,
      { method: "GET" },
    );
    return typeof result.tracking_path === "string" ? result.tracking_path : null;
  } catch (error) {
    // A 404 simply means this order does not have a delivery record yet.
    // Other errors are logged for diagnosis without breaking order history.
    const message = error instanceof Error ? error.message : String(error);
    if (!/404|not found/i.test(message)) {
      console.warn(`[ANFA ID] Could not load tracking link for order ${orderId}:`, error);
    }
    return null;
  }
}

async function getCustomerOrderTrackingPaths(orderRows: CustomerOrder[]): Promise<Record<string, string>> {
  const entries = await Promise.all(orderRows.map(async (order) => {
    const path = await getCustomerOrderTrackingPath(order.id);
    return path ? ([order.id, path] as const) : null;
  }));

  return Object.fromEntries(entries.filter((entry): entry is readonly [string, string] => entry !== null));
}

function getCustomerOrderStatus(order: CustomerOrder) {
  const status = (order.status ?? "").toLowerCase();
  const paymentStatus = (order.payment_status ?? "").toLowerCase();

  if (["canceled", "cancelled"].includes(status) || ["canceled", "cancelled"].includes(paymentStatus)) {
    return { label: "Annulée", className: "is-cancelled" };
  }
  if (status === "completed") {
    return { label: "Terminée", className: "is-completed" };
  }
  if (status === "archived") {
    return { label: "Archivée", className: "is-archived" };
  }
  if (status === "requires_action") {
    return { label: "Action requise", className: "is-pending" };
  }
  if (status === "pending") {
    return { label: "Confirmée", className: "is-pending" };
  }

  return { label: "En cours", className: "is-pending" };
}

function formatOrderHistoryPrice(value: number | null | undefined, currencyCode?: string | null) {
  const currency = (currencyCode || "MAD").toUpperCase();
  try {
    return new Intl.NumberFormat("fr-MA", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(Number(value ?? 0));
  } catch {
    return `${Number(value ?? 0).toFixed(2)} ${currency}`;
  }
}

function formatOrderHistoryDate(value?: string | null) {
  if (!value) return "Date indisponible";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date indisponible";
  return new Intl.DateTimeFormat("fr-MA", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

export default function AccountPage() {
  const [mode, setMode] = useState<AccountMode>("login");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarFeedback, setAvatarFeedback] = useState("");
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [ordersCount, setOrdersCount] = useState(0);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");
  const [loadingMoreOrders, setLoadingMoreOrders] = useState(false);
  const [orderTrackingPaths, setOrderTrackingPaths] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;

    async function loadCustomer() {
      try {
        const result = await sdk.store.customer.retrieve({
          fields: "+metadata",
        });

        if (active) {
          setCustomer(result.customer as Customer);
          setOrdersLoading(true);
        }

        try {
          const orderPage = await getCustomerOrderPage(0);
          const orderRows = Array.isArray(orderPage.orders) ? orderPage.orders : [];
          if (active) {
            setOrders(orderRows);
            setOrdersCount(Number(orderPage.count ?? orderPage.orders?.length ?? 0));
            setOrdersError("");
          }
          const trackingPaths = await getCustomerOrderTrackingPaths(orderRows);
          if (active) setOrderTrackingPaths(trackingPaths);
        } catch (error) {
          console.error("[ANFA ID] Could not load customer orders:", error);
          if (active) {
            setOrders([]);
            setOrdersCount(0);
            setOrderTrackingPaths({});
            setOrdersError("Impossible de charger votre historique pour le moment.");
          }
        } finally {
          if (active) setOrdersLoading(false);
        }
      } catch {
        // No authenticated customer is currently available.
        if (active) {
          setCustomer(null);
          setOrders([]);
          setOrdersCount(0);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadCustomer();

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const password = String(form.get("password") ?? "");

    setSubmitting(true);
    setFeedback("");

    try {
      if (mode === "register") {
        const firstName = String(form.get("first_name") ?? "").trim();
        const lastName = String(form.get("last_name") ?? "").trim();
        const confirmPassword = String(
          form.get("confirm_password") ?? ""
        );

        if (password !== confirmPassword) {
          setFeedback("Les deux mots de passe ne correspondent pas.");
          return;
        }

        // Create the customer's authentication identity in Medusa.
        await sdk.auth.register("customer", "emailpass", {
          email,
          password,
        });

        // Create the associated customer profile.
        await sdk.store.customer.create({
          email,
          first_name: firstName,
          last_name: lastName,
        });
      }

      const loginResult = await sdk.auth.login(
        "customer",
        "emailpass",
        { email, password }
      );

      if (typeof loginResult !== "string") {
        setFeedback(
          "Une vérification supplémentaire est nécessaire. Consultez les instructions de votre compte ou contactez-nous."
        );
        return;
      }

      const result = await sdk.store.customer.retrieve();

      setCustomer(result.customer as Customer);
      setFeedback("");
      setOrdersLoading(true);
      setOrdersError("");
      try {
        const orderPage = await getCustomerOrderPage(0);
        const orderRows = Array.isArray(orderPage.orders) ? orderPage.orders : [];
        setOrders(orderRows);
        setOrdersCount(Number(orderPage.count ?? orderPage.orders?.length ?? 0));
        setOrderTrackingPaths(await getCustomerOrderTrackingPaths(orderRows));
      } catch (orderError) {
        console.error("[ANFA ID] Could not load customer orders:", orderError);
        setOrders([]);
        setOrdersCount(0);
        setOrdersError("Impossible de charger votre historique pour le moment.");
      } finally {
        setOrdersLoading(false);
      }
    } catch (error) {
      console.error("[ANFA ID] Authentication failed:", error);

      setFeedback(
        mode === "register"
          ? "Impossible de créer le compte. Cet e-mail est peut-être déjà utilisé, ou les informations doivent être vérifiées."
          : "Connexion impossible. Vérifiez votre e-mail et votre mot de passe."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    try {
      await sdk.auth.logout();
      setCustomer(null);
      setOrders([]);
      setOrdersCount(0);
      setOrderTrackingPaths({});
      setOrdersError("");
      setMode("login");
      setFeedback("Vous êtes déconnecté de votre ANFA ID.");
    } catch (error) {
      console.error("[ANFA ID] Logout failed:", error);
      setFeedback("La déconnexion a échoué. Veuillez réessayer.");
    }
  }
  
async function handleAvatarChange(
  event: ChangeEvent<HTMLInputElement>
) {
  const input = event.currentTarget;
  const file = input.files?.[0];
  input.value = "";

  if (!file || !customer) return;

  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    setAvatarFeedback("Choisissez une image JPG, PNG ou WebP.");
    return;
  }

  if (file.size > 8 * 1024 * 1024) {
    setAvatarFeedback("L’image doit faire moins de 8 Mo.");
    return;
  }

  setAvatarBusy(true);
  setAvatarFeedback("");

  let bitmap: ImageBitmap | null = null;

  try {
    bitmap = await createImageBitmap(file);

    // Crop and compress the image to keep the profile photo lightweight.
    const cropSize = Math.min(bitmap.width, bitmap.height);
    const sourceX = (bitmap.width - cropSize) / 2;
    const sourceY = (bitmap.height - cropSize) / 2;

    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 320;

    const context = canvas.getContext("2d");
    if (!context) throw new Error("Could not process profile image.");

    context.drawImage(
      bitmap,
      sourceX,
      sourceY,
      cropSize,
      cropSize,
      0,
      0,
      320,
      320
    );

    bitmap.close();
    bitmap = null;

    const avatarData = canvas.toDataURL("image/jpeg", 0.76);

    if (avatarData.length > 180_000) {
      throw new Error("Compressed avatar is too large.");
    }

    const result = await sdk.store.customer.update({
      metadata: {
        ...(customer.metadata ?? {}),
        anfa_avatar: avatarData,
      },
    });

    setCustomer(result.customer as Customer);
    setAvatarFeedback("Photo de profil mise à jour.");
  } catch (error) {
    console.error("[ANFA ID] Avatar upload failed:", error);
    setAvatarFeedback(
      "Impossible d’enregistrer la photo. Réessayez avec une autre image."
    );
  } finally {
    bitmap?.close();
    setAvatarBusy(false);
  }
}

async function handleAvatarRemove() {
  if (!customer) return;

  setAvatarBusy(true);
  setAvatarFeedback("");

  try {
    const result = await sdk.store.customer.update({
      metadata: {
        ...(customer.metadata ?? {}),
        anfa_avatar: null,
      },
    });

    setCustomer(result.customer as Customer);
    setAvatarFeedback("Photo de profil supprimée.");
  } catch (error) {
    console.error("[ANFA ID] Avatar removal failed:", error);
    setAvatarFeedback("Impossible de supprimer la photo. Réessayez.");
  } finally {
    setAvatarBusy(false);
  }
}


  function changeMode(nextMode: AccountMode) {
    setMode(nextMode);
    setFeedback("");
  }

  async function refreshOrderHistory() {
    setOrdersLoading(true);
    setOrdersError("");
    try {
      const orderPage = await getCustomerOrderPage(0);
      const orderRows = Array.isArray(orderPage.orders) ? orderPage.orders : [];
      setOrders(orderRows);
      setOrdersCount(Number(orderPage.count ?? orderPage.orders?.length ?? 0));
      setOrderTrackingPaths(await getCustomerOrderTrackingPaths(orderRows));
    } catch (error) {
      console.error("[ANFA ID] Order history refresh failed:", error);
      setOrdersError("Impossible d’actualiser votre historique. Réessayez.");
    } finally {
      setOrdersLoading(false);
    }
  }

  async function loadMoreOrders() {
    if (loadingMoreOrders || orders.length >= ordersCount) return;
    setLoadingMoreOrders(true);
    setOrdersError("");
    try {
      const orderPage = await getCustomerOrderPage(orders.length);
      const nextOrders = Array.isArray(orderPage.orders) ? orderPage.orders : [];
      const nextTrackingPaths = await getCustomerOrderTrackingPaths(nextOrders);
      setOrderTrackingPaths((current) => ({ ...current, ...nextTrackingPaths }));
      setOrders((current) => {
        const existingIds = new Set(current.map((order) => order.id));
        return [...current, ...nextOrders.filter((order) => !existingIds.has(order.id))];
      });
      setOrdersCount(Number(orderPage.count ?? ordersCount));
    } catch (error) {
      console.error("[ANFA ID] Could not load more customer orders:", error);
      setOrdersError("Impossible de charger les commandes précédentes.");
    } finally {
      setLoadingMoreOrders(false);
    }
  }

  const avatarUrl =
  typeof customer?.metadata?.anfa_avatar === "string"
    ? customer.metadata.anfa_avatar
    : "";

  return (
    <main className="site-shell">
      <SiteHeader />

      <section className="section anfa-id-page">
        <p className="eyebrow">ANFA ATHLETICS / ESPACE PERSONNEL</p>
        <h1 className="cart-heading">ANFA ID.</h1>

        {loading ? (
          <p className="anfa-id-status">Chargement de votre espace...</p>
        ) : customer ? (
          
<div className="anfa-id-dashboard">
  <aside className="anfa-id-profile-panel">
    
<div className="anfa-id-profile-topline">
  <span>ANFA ID</span>
  <span>CASABLANCA / MA</span>
</div>

<div className="anfa-id-avatar-wrap">
  {avatarUrl ? (
    <Image
      src={avatarUrl}
      alt="Votre photo de profil"
      width={100}
      height={100}
      unoptimized
    />
  ) : (
    <span className="anfa-id-monogram" aria-hidden="true">
      A.
    </span>
  )}

  <label
    className="anfa-id-avatar-edit"
    aria-label="Ajouter ou modifier votre photo de profil"
    title="Ajouter ou modifier la photo"
  >
    <input
      type="file"
      accept="image/jpeg,image/png,image/webp"
      onChange={handleAvatarChange}
      disabled={avatarBusy}
    />
    <span aria-hidden="true">
      {avatarBusy ? "…" : "↗"}
    </span>
  </label>
</div>

{avatarUrl && (
  <button
    type="button"
    className="anfa-id-remove-avatar"
    onClick={handleAvatarRemove}
    disabled={avatarBusy}
  >
    RETIRER LA PHOTO
  </button>
)}

{avatarFeedback && (
  <p className="anfa-id-avatar-feedback" role="status">
    {avatarFeedback}
  </p>
)}


    <p className="anfa-id-member-label">
      ANFA ID / MEMBER
    </p>

    <h2>
      BIENVENUE
      {customer.first_name
        ? `, ${customer.first_name.toUpperCase()}`
        : ""}
      .
    </h2>

    <p className="anfa-id-email">{customer.email}</p>

    <div className="anfa-id-member-status">
      <span />
      SESSION ACTIVE
    </div>
    <Link
  href="/account/profile"
  className="anfa-id-profile-button"
>
  <span>
    <strong>MON PROFIL</strong>
    <small>Modifier mes informations personnelles</small>
  </span>
  <span className="anfa-id-profile-button-arrow" aria-hidden="true">
    ↗
  </span>
</Link>

    <button
      className="anfa-id-logout"
      type="button"
      onClick={handleLogout}
    >
      SE DÉCONNECTER <span>↗</span>
    </button>
  </aside>

  <div className="anfa-id-dashboard-content">
    <p className="eyebrow">YOUR ANFA / YOUR SPACE</p>

    <h2 className="anfa-id-dashboard-title">
      Tout ce qui vous définit.
    </h2>

    <p className="anfa-id-dashboard-description">
      Retrouvez votre sélection et poursuivez votre expérience
      ANFA ATHLETICS.
    </p>

    <div className="anfa-id-links">
      <Link href="/cart" className="anfa-id-dashboard-link">
        <span className="anfa-id-link-number">01 / BAG</span>
        <span className="anfa-id-link-copy">
          <strong>Mon sac</strong>
          <span>Votre sélection actuelle</span>
        </span>
        <span className="anfa-id-link-arrow">↗</span>
      </Link>

      <Link href="/wishlist" className="anfa-id-dashboard-link">
        <span className="anfa-id-link-number">02 / SAVED</span>
        <span className="anfa-id-link-copy">
          <strong>Ma liste d’envies</strong>
          <span>Les pièces qui vous inspirent</span>
        </span>
        <span className="anfa-id-link-arrow">↗</span>
      </Link>

      <Link href="/collections" className="anfa-id-dashboard-link">
        <span className="anfa-id-link-number">03 / SHOP</span>
        <span className="anfa-id-link-copy">
          <strong>FORGED 01</strong>
          <span>Explorer la collection</span>
        </span>
        <span className="anfa-id-link-arrow">↗</span>
      </Link>
    </div>

    <div className="anfa-id-upcoming-grid anfa-id-address-only-grid">
      <Link
        href="/account/addresses"
        className="anfa-id-address-card"
      >
        <span>05 / ADDRESSES</span>
        <strong>Adresses enregistrées</strong>
        <p>Gérer mes coordonnées ↗</p>
      </Link>
    </div>

    <section className="anfa-id-orders-section" id="anfa-order-history">
      <div className="anfa-id-orders-heading">
        <div>
          <p className="eyebrow">04 / ORDERS</p>
          <h3>Historique des commandes<span>.</span></h3>
          <p className="anfa-id-orders-intro">
            Retrouvez vos achats, leurs montants et l’état actuel de chaque commande.
          </p>
        </div>
        <button
          type="button"
          className="anfa-id-orders-refresh"
          onClick={() => void refreshOrderHistory()}
          disabled={ordersLoading}
        >
          {ordersLoading ? "ACTUALISATION…" : "↻ ACTUALISER"}
        </button>
      </div>

      {ordersError && (
        <div className="anfa-id-orders-message is-error" role="alert">
          <span>{ordersError}</span>
          <button type="button" onClick={() => void refreshOrderHistory()} disabled={ordersLoading}>
            Réessayer
          </button>
        </div>
      )}

      {ordersLoading && orders.length === 0 ? (
        <div className="anfa-id-orders-empty">
          <span className="anfa-id-orders-empty-index">ANFA / 04</span>
          <strong>Chargement de vos commandes…</strong>
          <p>Nous récupérons votre historique depuis votre espace client sécurisé.</p>
        </div>
      ) : orders.length === 0 && !ordersError ? (
        <div className="anfa-id-orders-empty">
          <span className="anfa-id-orders-empty-index">ANFA / 04</span>
          <strong>Aucune commande pour le moment.</strong>
          <p>Vos achats apparaîtront ici dès votre première commande.</p>
          <Link href="/collections" className="anfa-id-orders-shop-link">
            DÉCOUVRIR LA COLLECTION ↗
          </Link>
        </div>
      ) : (
        <div className="anfa-id-orders-list">
          {orders.map((order) => {
            const orderStatus = getCustomerOrderStatus(order);
            const orderReference = order.display_id !== undefined && order.display_id !== null
              ? `#${order.display_id}`
              : `#${order.id.slice(-8).toUpperCase()}`;
            const items = Array.isArray(order.items) ? order.items : [];

            return (
              <article className="anfa-id-order-card" key={order.id}>
                <div className="anfa-id-order-topline">
                  <div>
                    <span className="anfa-id-order-reference">COMMANDE {orderReference}</span>
                    <time dateTime={order.created_at ?? undefined}>
                      {formatOrderHistoryDate(order.created_at)}
                    </time>
                  </div>
                  <span className={`anfa-id-order-status ${orderStatus.className}`}>
                    <span aria-hidden="true" />
                    {orderStatus.label}
                  </span>
                </div>

                <div className="anfa-id-order-items">
                  {items.length > 0 ? items.slice(0, 4).map((item, index) => {
                    const itemName = item.title || "Article ANFA ATHLETICS";
                    const itemVariant = item.variant_title || item.subtitle || "";
                    return (
                      <div className="anfa-id-order-item" key={item.id || `${order.id}-${index}`}>
                        {item.thumbnail ? (
                          <Image
                            src={item.thumbnail}
                            alt={itemName}
                            width={58}
                            height={70}
                            unoptimized
                          />
                        ) : (
                          <div className="anfa-id-order-item-placeholder" aria-hidden="true">ANFA</div>
                        )}
                        <div className="anfa-id-order-item-copy">
                          <strong>{itemName}</strong>
                          {itemVariant && <span>{itemVariant}</span>}
                          <small>Quantité : {item.quantity ?? 1}</small>
                        </div>
                      </div>
                    );
                  }) : (
                    <p className="anfa-id-order-no-items">Le détail des articles n’est pas disponible.</p>
                  )}
                  {items.length > 4 && (
                    <p className="anfa-id-order-more-items">+ {items.length - 4} autre(s) article(s)</p>
                  )}
                </div>

                <div className="anfa-id-order-bottomline">
                  <div>
                    <span>ÉTAT DE LA COMMANDE</span>
                    <strong>{orderStatus.label}</strong>
                  </div>
                  <div className="anfa-id-order-total">
                    <span>TOTAL</span>
                    <strong>{formatOrderHistoryPrice(order.total, order.currency_code)}</strong>
                  </div>
                </div>
                {(order.status === "canceled" || order.status === "cancelled" || order.payment_status === "canceled" || order.payment_status === "cancelled") && (
                  <p className="anfa-id-order-cancel-note">
                    Cette commande a été annulée. Si vous avez besoin d’aide, contactez notre équipe.
                  </p>
                )}
                {orderTrackingPaths[order.id] && (
                  <div className="anfa-id-order-actions">
                    <Link
                      href={orderTrackingPaths[order.id]}
                      className="anfa-id-order-track-link"
                    >
                      SUIVRE MA LIVRAISON <span aria-hidden="true">↗</span>
                    </Link>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {orders.length > 0 && orders.length < ordersCount && (
        <div className="anfa-id-orders-more-wrap">
          <button
            type="button"
            className="anfa-id-orders-more"
            onClick={() => void loadMoreOrders()}
            disabled={loadingMoreOrders}
          >
            {loadingMoreOrders ? "CHARGEMENT…" : "AFFICHER LES COMMANDES PRÉCÉDENTES"}
          </button>
          <span>{orders.length} / {ordersCount} commandes</span>
        </div>
      )}
    </section>
  </div>
</div>

        ) : (
          <div className="anfa-id-layout">
            <div className="anfa-id-intro">
              <p className="eyebrow">YOUR ANFA. YOUR JOURNEY.</p>
              <h2>
                UNE IDENTITÉ.
                <br />
                UN STANDARD.
              </h2>
              <p>
                Retrouvez votre espace personnel et préparez la suite
                de votre expérience ANFA ATHLETICS.
              </p>
            </div>

            <div className="anfa-id-card">
              <div className="anfa-id-tabs">
                <button
                  type="button"
                  className={mode === "login" ? "is-active" : ""}
                  aria-pressed={mode === "login"}
                  onClick={() => changeMode("login")}
                >
                  CONNEXION
                </button>

                <button
                  type="button"
                  className={mode === "register" ? "is-active" : ""}
                  aria-pressed={mode === "register"}
                  onClick={() => changeMode("register")}
                >
                  CRÉER UN COMPTE
                </button>
              </div>

              <h2>
                {mode === "login"
                  ? "RAVI DE VOUS REVOIR."
                  : "REJOIGNEZ ANFA."}
              </h2>

              <p className="anfa-id-card-description">
                {mode === "login"
                  ? "Connectez-vous à votre ANFA ID."
                  : "Créez votre espace personnel ANFA ID."}
              </p>

              <form className="anfa-id-form" onSubmit={handleSubmit}>
                {mode === "register" && (
                  <div className="anfa-id-name-fields">
                    <label>
                      Prénom
                      <input
                        name="first_name"
                        autoComplete="given-name"
                        required
                      />
                    </label>

                    <label>
                      Nom
                      <input
                        name="last_name"
                        autoComplete="family-name"
                        required
                      />
                    </label>
                  </div>
                )}

                <label>
                  Adresse e-mail
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="vous@exemple.com"
                    required
                  />
                </label>

                <label>
                  Mot de passe
                  <input
                    name="password"
                    type="password"
                    autoComplete={
                      mode === "login"
                        ? "current-password"
                        : "new-password"
                    }
                    minLength={8}
                    required
                  />
                </label>
                {mode === "login" && (
                  <div className="anfa-id-forgot-password">
                   <Link href="/account/forgot-password">
                     Mot de passe oublié ?
                   </Link>
                  </div>
)}

                {mode === "register" && (
                  <label>
                    Confirmer le mot de passe
                    <input
                      name="confirm_password"
                      type="password"
                      autoComplete="new-password"
                      minLength={8}
                      required
                    />
                  </label>
                )}

                {feedback && (
                  <p className="anfa-id-feedback" role="status">
                    {feedback}
                  </p>
                )}

                <button
                  className="button button-dark anfa-id-submit"
                  type="submit"
                  disabled={submitting}
                >
                  {submitting
                    ? "VEUILLEZ PATIENTER..."
                    : mode === "login"
                      ? "SE CONNECTER"
                      : "CRÉER MON ANFA ID"}
                </button>
              </form>

              <p className="anfa-id-privacy">
                Vos informations sont utilisées pour gérer votre compte
                et votre expérience ANFA.
              </p>
            </div>
          </div>
        )}
      </section>

      <SiteFooter />
    </main>
  );
}
