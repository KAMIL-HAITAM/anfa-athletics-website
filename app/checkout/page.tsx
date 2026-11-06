
"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { sdk } from "../../lib/medusa";
import Link from "next/link";
import { MEDUSA_CART_SYNC_ENABLED, MEDUSA_REGION_ID, useCart } from "../../components/CartProvider";
import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";

type CatalogVariant = {
  id: string;
  priceMad: number | null;
  color?: string;
  size?: string;
};
type StoreShippingOption = {
  id: string;
  name: string;
  price_type?: string;
  amount?: number | string | null;
  calculated_price?: {
    calculated_amount?: number | string | null;
    currency_code?: string | null;
  } | null;
};

type StorePaymentProvider = {
  id: string;
};

type MedusaCartSnapshot = {
  id: string;
  items?: Array<{
    id: string;
    variant_id?: string | null;
    quantity?: number;
  }>;
  shipping_methods?: Array<{
    id?: string;
    shipping_option_id?: string | null;
  }>;
  promotions?: Array<{
    id: string;
    code?: string | null;
  }>;
  subtotal?: number | null;
  discount_total?: number | null;
  shipping_total?: number | null;
  tax_total?: number | null;
  total?: number | null;
  currency_code?: string | null;
};
type SavedAddress = {
  id: string;
  address_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  address_1?: string | null;
  address_2?: string | null;
  city?: string | null;
  province?: string | null;
  postal_code?: string | null;
  country_code?: string | null;
};

type CatalogProduct = {
  id: string;
  medusaProductId?: string;
  slug: string;
  name: string;
  collection: string;
  color?: string;
  image: string;
  priceMad: number | null;
  status: string;
  sizes: string[];
  commerceVariants?: CatalogVariant[];
};

type CheckoutConfirmationItem = {
  key: string;
  name: string;
  image: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
};

type CheckoutConfirmation = {
  orderId: string;
  displayId: string;
  createdAt: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  address1: string;
  address2: string;
  city: string;
  province: string;
  postalCode: string;
  shippingLabel: string;
  promotionCode: string;
  items: CheckoutConfirmationItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  trackingToken?: string;
};

const CHECKOUT_CONFIRMATION_STORAGE_KEY = "anfa-athletics-order-confirmation";
const GLOVO_TRACKING_TOKEN_METADATA_KEY = "anfa_glovo_tracking_token_hash";

function createGlovoTrackingToken(): string {
  const bytes = new Uint8Array(32);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
}

async function hashGlovoTrackingToken(token: string): Promise<string> {
  const digest = await window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, "0")).join("");
}

export default function CheckoutPage() {
  const { items, itemCount, clearCart } = useCart();

  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [catalogError, setCatalogError] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressFeedback, setAddressFeedback] = useState("");
  const [addressSaved, setAddressSaved] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [customerEmail, setCustomerEmail] = useState("");
  const [loadingSavedAddresses, setLoadingSavedAddresses] = useState(true);
  const [customerAuthenticated, setCustomerAuthenticated] = useState(false);
  const [selectedSavedAddressId, setSelectedSavedAddressId] = useState("");
  const [saveAddressToAccount, setSaveAddressToAccount] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoBusy, setPromoBusy] = useState(false);
  const [promoFeedback, setPromoFeedback] = useState("");
  const [medusaCartSnapshot, setMedusaCartSnapshot] =
    useState<MedusaCartSnapshot | null>(null);

const checkoutFormRef = useRef<HTMLFormElement>(null);
  const [showOrderItems, setShowOrderItems] = useState(false);
  const [shippingOptions, setShippingOptions] =
  useState<StoreShippingOption[]>([]);
const [loadingShippingOptions, setLoadingShippingOptions] =
  useState(false);
const [shippingOptionsMessage, setShippingOptionsMessage] =
  useState("");
const [selectedShippingOptionId, setSelectedShippingOptionId] =
  useState("");
const [loadingPaymentProviders, setLoadingPaymentProviders] =
  useState(false);
const [manualPaymentProviderId, setManualPaymentProviderId] =
  useState("");
const [paymentProviderMessage, setPaymentProviderMessage] =
  useState("");
const [placingOrder, setPlacingOrder] = useState(false);
const [orderFeedback, setOrderFeedback] = useState("");
const [completedOrderSummary, setCompletedOrderSummary] =
  useState<CheckoutConfirmation | null>(null);
const [restoringConfirmation, setRestoringConfirmation] = useState(true);

  useEffect(() => {
    try {
      const saved = window.sessionStorage.getItem(CHECKOUT_CONFIRMATION_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as CheckoutConfirmation;
        if (parsed?.orderId && Array.isArray(parsed.items)) {
          setCompletedOrderSummary(parsed);
        }
      }
    } catch (error) {
      console.warn("[ANFA checkout] Could not restore order confirmation:", error);
    } finally {
      setRestoringConfirmation(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function loadCatalog() {
      try {
        const response = await fetch("/api/catalog", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Catalogue request failed: ${response.status}`);
        }

        const data: { products?: CatalogProduct[] } =
          await response.json();

        if (!Array.isArray(data.products)) {
          throw new Error("The catalogue response has no products array.");
        }

        if (active) {
          setCatalog(data.products);
          setCatalogError(false);
        }
      } catch (error) {
        console.error("[Checkout] Could not load catalogue:", error);

        if (active) {
          setCatalogError(true);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadCatalog();

    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
  let active = true;

  async function loadSavedAddresses() {
    try {
      const [customerResult, addressResult] = await Promise.all([
       sdk.store.customer.retrieve(),
       sdk.store.customer.listAddress({
         limit: 50,
         offset: 0,
      }),
    ]);

      if (active) {
        setCustomerEmail(customerResult.customer.email ?? "");
        setSavedAddresses(addressResult.addresses as SavedAddress[]);
        setCustomerAuthenticated(true);
     }

    } catch {
      // A signed-out customer cannot access saved addresses.
      if (active) {
        setSavedAddresses([]);
        setCustomerAuthenticated(false);
      }
    } finally {
      if (active) {
        setLoadingSavedAddresses(false);
      }
    }
  }

  void loadSavedAddresses();

  return () => {
    active = false;
  };
}, []);

  // Restore promotion state and server-calculated totals when the real cart is enabled.
  useEffect(() => {
    if (!MEDUSA_CART_SYNC_ENABLED || items.length === 0) return;

    let active = true;
    const cartId = localStorage.getItem("anfa-athletics-medusa-cart-id");
    if (!cartId) return;

    sdk.store.cart
      .retrieve(cartId, { fields: "+items.*, +promotions.*" })
      .then(({ cart }) => {
        if (active) {
          setMedusaCartSnapshot(cart as unknown as MedusaCartSnapshot);
        }
      })
      .catch((error) => {
        console.warn("[ANFA checkout] Could not restore Medusa cart totals:", error);
      });

    return () => {
      active = false;
    };
  }, [items]);

  const cartProducts = useMemo(() => {
    return items.flatMap((item) => {
      const product = catalog.find(
        (candidate) =>
          candidate.id === item.productId ||
          candidate.medusaProductId === item.productId
      );

      if (!product) {
        return [];
      }

      const commerceVariant = product.commerceVariants?.find(
        (variant) => variant.id === item.variantId
      );

      const priceMad = commerceVariant
        ? commerceVariant.priceMad
        : product.priceMad;

      return [
        {
          ...item,
          product,
          commerceVariant,
          priceMad,
        },
      ];
    });
  }, [items, catalog]);

  const subtotal = cartProducts.reduce((total, item) => {
    if (item.priceMad === null) {
      return total;
    }

    return total + item.priceMad * item.quantity;
  }, 0);

  const allPricesConfirmed =
    items.length > 0 &&
    cartProducts.length === items.length &&
    cartProducts.every((item) => {
      const hasValidPrice =
        item.priceMad !== null &&
        Number.isFinite(item.priceMad) &&
        item.priceMad >= 0;

      const hasValidSize = item.product.sizes.includes(item.size);

      const variantMatches =
        !item.product.commerceVariants ||
        Boolean(item.commerceVariant);

      return (
        hasValidPrice &&
        item.product.status === "available" &&
        hasValidSize &&
        variantMatches
      );
    });

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("fr-MA", {
      style: "currency",
      currency: "MAD",
      maximumFractionDigits: 0,
    }).format(price);

  const formatConfirmationPrice = (price: number) =>
    new Intl.NumberFormat("fr-MA", {
      style: "currency",
      currency: "MAD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price);


  async function retrieveMedusaCart(): Promise<MedusaCartSnapshot> {
    const cartId = localStorage.getItem("anfa-athletics-medusa-cart-id");
    if (!cartId) {
      throw new Error(
        "Votre panier n’est pas encore synchronisé avec Medusa. Réessayez après la synchronisation du panier."
      );
    }

    const { cart } = await sdk.store.cart.retrieve(cartId, {
      fields: "+items.*, +promotions.*",
    });
    const snapshot = cart as unknown as MedusaCartSnapshot;
    setMedusaCartSnapshot(snapshot);
    return snapshot;
  }

  function cartContainsAllSelectedVariants(cart: MedusaCartSnapshot): boolean {
    if (
      items.length === 0 ||
      items.some((item) => !item.variantId.startsWith("variant_"))
    ) {
      return false;
    }

    const expectedQuantities = new Map<string, number>();
    for (const item of items) {
      expectedQuantities.set(
        item.variantId,
        (expectedQuantities.get(item.variantId) ?? 0) + item.quantity
      );
    }

    const cartQuantities = new Map<string, number>();
    for (const line of cart.items ?? []) {
      if (!line.variant_id) return false;
      cartQuantities.set(
        line.variant_id,
        (cartQuantities.get(line.variant_id) ?? 0) + (line.quantity ?? 0)
      );
    }

    return (
      expectedQuantities.size > 0 &&
      expectedQuantities.size === cartQuantities.size &&
      Array.from(expectedQuantities).every(
        ([variantId, quantity]) => cartQuantities.get(variantId) === quantity
      )
    );
  }

  function getErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message) return error.message;
    if (
      error &&
      typeof error === "object" &&
      "message" in error &&
      typeof error.message === "string"
    ) {
      return error.message;
    }
    return "Impossible de mettre à jour le code promotionnel. Veuillez réessayer.";
  }

  function getCheckoutErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message) return error.message;
    if (
      error &&
      typeof error === "object" &&
      "message" in error &&
      typeof error.message === "string"
    ) {
      return error.message;
    }
    return "Impossible de valider la commande. Vérifiez votre panier puis réessayez.";
  }

  function getShippingPrice(option: StoreShippingOption): number | null {
    const rawAmount = option.calculated_price?.calculated_amount ?? option.amount;
    if (rawAmount === null || rawAmount === undefined) return null;
    const amount = typeof rawAmount === "number" ? rawAmount : Number(rawAmount);
    return Number.isFinite(amount) && amount >= 0 ? amount : null;
  }

  async function applyPromotion() {
    const code = promoCode.trim().toUpperCase();
    if (!code) {
      setPromoFeedback("Saisissez un code promotionnel.");
      return;
    }

    if (!MEDUSA_CART_SYNC_ENABLED) {
      setPromoFeedback(
        "Les codes promotionnels seront disponibles lorsque la synchronisation du panier Medusa sera activée et que les variantes réelles seront configurées. Aucun prix n’a été modifié."
      );
      return;
    }

    setPromoBusy(true);
    setPromoFeedback("");
    try {
      const cart = await retrieveMedusaCart();
      if (!cartContainsAllSelectedVariants(cart)) {
        setPromoFeedback(
          "Le panier Medusa ne correspond pas encore à tous les articles sélectionnés. Aucun code n’a été appliqué."
        );
        return;
      }

      const promotions = cart.promotions ?? [];
      const existingPromotion = promotions.find(
        (promotion) => (promotion.code ?? "").toUpperCase() === code
      );
      if (existingPromotion) {
        setPromoFeedback("Ce code est déjà appliqué à votre panier.");
        setPromoCode(code);
        return;
      }

      if (promotions.some((promotion) => Boolean(promotion.code))) {
        setPromoFeedback(
          "Une promotion est déjà appliquée. Retirez-la avant d’utiliser un autre code."
        );
        return;
      }

      const { cart: updatedCart } = await sdk.store.cart.addPromotions(cart.id, {
        promo_codes: [code],
      });
      let updatedSnapshot = updatedCart as unknown as MedusaCartSnapshot;
      // Re-fetch expanded item/promotion fields and server-calculated totals when available.
      try {
        const { cart: refreshedCart } = await sdk.store.cart.retrieve(cart.id, {
          fields: "+items.*, +promotions.*",
        });
        updatedSnapshot = refreshedCart as unknown as MedusaCartSnapshot;
      } catch (refreshError) {
        console.warn("[ANFA checkout] Could not refresh cart totals after applying code:", refreshError);
      }
      setMedusaCartSnapshot(updatedSnapshot);
      const wasApplied = (updatedSnapshot.promotions ?? []).some(
        (promotion) => (promotion.code ?? "").toUpperCase() === code
      );
      setPromoFeedback(
        wasApplied
          ? `Code ${code} appliqué par Medusa. Le montant affiché provient du panier commerce.`
          : "Medusa n’a pas confirmé l’application de ce code. Vérifiez qu’il est actif et applicable à ces articles."
      );
      if (wasApplied) setPromoCode(code);
    } catch (error) {
      setPromoFeedback(getErrorMessage(error));
    } finally {
      setPromoBusy(false);
    }
  }

  async function removePromotion(code: string) {
    if (!MEDUSA_CART_SYNC_ENABLED) {
      setPromoFeedback(
        "La gestion des codes sera disponible lorsque la synchronisation du panier Medusa sera activée."
      );
      return;
    }

    setPromoBusy(true);
    setPromoFeedback("");
    try {
      const cart = await retrieveMedusaCart();
      const { cart: updatedCart } = await sdk.store.cart.removePromotions(cart.id, {
        promo_codes: [code],
      });
      let updatedSnapshot = updatedCart as unknown as MedusaCartSnapshot;
      try {
        const { cart: refreshedCart } = await sdk.store.cart.retrieve(cart.id, {
          fields: "+items.*, +promotions.*",
        });
        updatedSnapshot = refreshedCart as unknown as MedusaCartSnapshot;
      } catch (refreshError) {
        console.warn("[ANFA checkout] Could not refresh cart totals after removing code:", refreshError);
      }
      setMedusaCartSnapshot(updatedSnapshot);
      setPromoCode("");
      setPromoFeedback(`Code ${code} retiré du panier.`);
    } catch (error) {
      setPromoFeedback(getErrorMessage(error));
    } finally {
      setPromoBusy(false);
    }
  }
  
function selectSavedAddress(addressId: string) {
  setSelectedSavedAddressId(addressId);
  setAddressSaved(false);
  setAddressFeedback("");
  setSaveAddressToAccount(false);

  if (!addressId) return;

  const address = savedAddresses.find(
    (candidate) => candidate.id === addressId
  );

  if (!address || !checkoutFormRef.current) return;

  const fields: Record<string, string> = {
    first_name: address.first_name ?? "",
    last_name: address.last_name ?? "",
    address_1: address.address_1 ?? "",
    address_2: address.address_2 ?? "",
    city: address.city ?? "",
    province: address.province ?? "",
    postal_code: address.postal_code ?? "",
    phone: address.phone ?? "",
  };

  for (const [name, value] of Object.entries(fields)) {
    const field = checkoutFormRef.current.elements.namedItem(name);

    if (field instanceof HTMLInputElement) {
      field.value = value;
    }
  }

  setAddressFeedback(
    "Adresse préremplie. Vérifiez les coordonnées puis enregistrez-les."
  );
}
    
async function handleAddressSubmit(
  event: FormEvent<HTMLFormElement>
) {
  event.preventDefault();

  const formData = new FormData(event.currentTarget);
  const cartId = localStorage.getItem(
    "anfa-athletics-medusa-cart-id"
  );

  if (!cartId) {
    setAddressFeedback(
      "Votre panier n’a pas encore été synchronisé avec Medusa. Ajoutez à nouveau votre article et réessayez."
    );
    setAddressSaved(false);
    return;
  }

  const value = (name: string) =>
    String(formData.get(name) ?? "").trim();

  const email = value("email");

  const address = {
    first_name: value("first_name"),
    last_name: value("last_name"),
    address_1: value("address_1"),
    address_2: value("address_2"),
    city: value("city"),
    province: value("province"),
    postal_code: value("postal_code"),
    country_code: "ma",
    phone: value("phone"),
  };

  setSavingAddress(true);
  setAddressSaved(false);
  setAddressFeedback("");
  setSelectedShippingOptionId("");
  setShippingOptions([]);
  setManualPaymentProviderId("");
  setPaymentProviderMessage("");

  try {
    await sdk.store.cart.update(cartId, {
      email,
      shipping_address: address,
      billing_address: address,
    });

    setAddressSaved(true);

if (saveAddressToAccount && customerAuthenticated) {
  try {
    const addressName =
      value("address_name") || `Adresse ${value("city")}`;

    await sdk.store.customer.createAddress({
      address_name: addressName,
      first_name: address.first_name,
      last_name: address.last_name,
      address_1: address.address_1,
      address_2: address.address_2,
      city: address.city,
      province: address.province,
      postal_code: address.postal_code,
      country_code: "ma",
      phone: address.phone,
    });

    setAddressFeedback(
      "Coordonnées enregistrées dans votre panier et votre ANFA ID."
    );

    setSaveAddressToAccount(false);
    setSelectedSavedAddressId("");

    // Refresh the address book without invalidating the saved cart address
    // if refreshing the list itself fails.
    try {
      const result = await sdk.store.customer.listAddress({
        limit: 50,
        offset: 0,
      });

      setSavedAddresses(result.addresses as SavedAddress[]);
    } catch (refreshError) {
      console.warn(
        "[ANFA checkout] Address saved, but the address list could not refresh:",
        refreshError
      );
    }
  } catch (saveError) {
    console.error(
      "[ANFA checkout] Could not save address to ANFA ID:",
      saveError
    );

    setAddressFeedback(
      "Coordonnées enregistrées dans votre panier, mais impossible de les sauvegarder dans votre ANFA ID."
    );
  }
} else {
  setAddressFeedback(
    "Coordonnées enregistrées dans votre panier."
  );
}
    
setLoadingShippingOptions(true);
setShippingOptionsMessage("");

try {
  const { shipping_options } =
    await sdk.store.fulfillment.listCartOptions({
      cart_id: cartId,
    });

  const listedOptions = (
    shipping_options ?? []
  ) as StoreShippingOption[];
  const options = await Promise.all(
    listedOptions.map(async (option) => {
      if (option.price_type !== "calculated") return option;

      try {
        const { shipping_option } = await sdk.store.fulfillment.calculate(
          option.id,
          { cart_id: cartId, data: {} }
        );
        return shipping_option as unknown as StoreShippingOption;
      } catch (calculateError) {
        console.warn(
          `[ANFA checkout] Could not calculate shipping option ${option.id}:`,
          calculateError
        );
        // A calculated rate without a valid price should not be selectable.
        return {
          ...option,
          calculated_price: {
            calculated_amount: null,
            currency_code: "mad",
          },
        };
      }
    })
  );

  setShippingOptions(options);

  setShippingOptionsMessage(
    options.length === 0
      ? "Aucune option de livraison n’est encore configurée pour le Maroc. Les frais seront affichés lorsque les modalités de livraison seront finalisées."
      : options.some((option) => getShippingPrice(option) === null)
        ? "Options récupérées depuis Medusa. Les tarifs indisponibles ne peuvent pas être sélectionnés ; vérifiez les réglages du transporteur."
        : "Options et tarifs récupérés depuis Medusa. Vérifiez-les avant l’ouverture des ventes."
  );
} catch (shippingError) {
  console.error(
    "[ANFA checkout] Could not load shipping options:",
    shippingError
  );

  setShippingOptions([]);
  setShippingOptionsMessage(
    "Impossible de récupérer les options de livraison. Veuillez réessayer."
  );
} finally {
  setLoadingShippingOptions(false);
}

setLoadingPaymentProviders(true);
setPaymentProviderMessage("");
try {
  const { payment_providers } = await sdk.store.payment.listPaymentProviders({
    region_id: MEDUSA_REGION_ID,
  });
  const manualProvider = ((payment_providers ?? []) as StorePaymentProvider[]).find(
    (provider) => provider.id === "pp_system_default" || provider.id.startsWith("pp_system")
  );
  setManualPaymentProviderId(manualProvider?.id ?? "");
  setPaymentProviderMessage(
    manualProvider
      ? ""
      : "Le paiement à la livraison n’est pas activé pour la région Maroc. Activez le fournisseur System dans les paramètres de région Medusa."
  );
} catch (paymentError) {
  console.error("[ANFA checkout] Could not load payment providers:", paymentError);
  setManualPaymentProviderId("");
  setPaymentProviderMessage(
    "Impossible de récupérer les moyens de paiement. Vérifiez la configuration de la région Medusa puis réessayez."
  );
} finally {
  setLoadingPaymentProviders(false);
}

  } catch (error) {
    console.error(
      "[ANFA checkout] Address update failed:",
      error
    );

    setAddressFeedback(
      "Impossible d’enregistrer vos coordonnées. Vérifiez votre connexion et réessayez."
    );
  } finally {
    setSavingAddress(false);
  }
}

async function handlePlaceOrder() {
  if (placingOrder) return;
  setOrderFeedback("");

  if (!MEDUSA_CART_SYNC_ENABLED) {
    setOrderFeedback(
      "Les commandes sont encore désactivées. Gardez la synchronisation du panier désactivée jusqu’à ce que le stock, la livraison et le fournisseur de paiement aient été vérifiés."
    );
    return;
  }

  if (!addressSaved) {
    setOrderFeedback("Enregistrez d’abord vos coordonnées de livraison.");
    return;
  }

  if (!selectedShippingOptionId) {
    setOrderFeedback("Sélectionnez une option de livraison avant de commander.");
    return;
  }

  if (!allPricesConfirmed) {
    setOrderFeedback(
      "Un ou plusieurs articles doivent encore être vérifiés. Aucun ordre n’a été créé."
    );
    return;
  }

  if (!manualPaymentProviderId) {
    setOrderFeedback(
      "Le paiement en espèces à la livraison n’est pas configuré dans la région Medusa."
    );
    return;
  }

  const cartId = localStorage.getItem("anfa-athletics-medusa-cart-id");
  if (!cartId) {
    setOrderFeedback(
      "Votre panier n’est pas synchronisé avec Medusa. Retournez au sac puis réessayez."
    );
    return;
  }

  setPlacingOrder(true);
  let glovoTrackingToken: string | undefined;

  try {
    let { cart } = await sdk.store.cart.retrieve(cartId, {
      fields: "+items.*, +promotions.*, +shipping_methods.*",
    });

    if (!cartContainsAllSelectedVariants(cart as unknown as MedusaCartSnapshot)) {
      throw new Error(
        "Le panier Medusa ne correspond pas aux articles sélectionnés. Retournez au sac, vérifiez les variantes puis réessayez."
      );
    }

    // Add the selected method on each attempt. Medusa replaces conflicting
    // methods for the same shipping profile, so retrying with another choice
    // cannot silently leave the customer with the previous option as well.
    await sdk.store.cart.addShippingMethod(cartId, {
      option_id: selectedShippingOptionId,
    });

    const refreshed = await sdk.store.cart.retrieve(cartId, {
      fields: "+items.*, +promotions.*, +shipping_methods.*",
    });
    cart = refreshed.cart;
    const readyCartSnapshot = cart as unknown as MedusaCartSnapshot;
    setMedusaCartSnapshot(readyCartSnapshot);
    if (!cartContainsAllSelectedVariants(readyCartSnapshot)) {
      throw new Error(
        "Le panier a changé pendant la validation. Actualisez la page et vérifiez vos articles."
      );
    }

    const { payment_providers } = await sdk.store.payment.listPaymentProviders({
      region_id: MEDUSA_REGION_ID,
    });
    const manualProvider = ((payment_providers ?? []) as StorePaymentProvider[]).find(
      (provider) => provider.id === manualPaymentProviderId && provider.id.startsWith("pp_system")
    );
    if (!manualProvider) {
      throw new Error(
        "Le fournisseur de paiement manuel n’est plus disponible dans cette région. Vérifiez les paramètres Medusa."
      );
    }

    // Prepare an unguessable, customer-specific tracking link. If this optional
    // metadata update fails, COD checkout can still proceed without tracking.
    try {
      const candidateToken = createGlovoTrackingToken();
      const tokenHash = await hashGlovoTrackingToken(candidateToken);
      const existingMetadata = cart.metadata && typeof cart.metadata === "object"
        ? cart.metadata as Record<string, unknown>
        : {};
      await sdk.store.cart.update(cartId, {
        metadata: {
          ...existingMetadata,
          [GLOVO_TRACKING_TOKEN_METADATA_KEY]: tokenHash,
        },
      });
      glovoTrackingToken = candidateToken;
      const trackingCart = await sdk.store.cart.retrieve(cartId, {
        fields: "+items.*, +promotions.*, +shipping_methods.*",
      });
      cart = trackingCart.cart;
    } catch (trackingPreparationError) {
      glovoTrackingToken = undefined;
      console.warn(
        "[ANFA checkout] Tracking-link preparation failed; the order can proceed without online tracking.",
        trackingPreparationError,
      );
    }

    await sdk.store.payment.initiatePaymentSession(cart, {
      provider_id: manualProvider.id,
    });

    const completion = await sdk.store.cart.complete(cartId);
    if (completion.type !== "order") {
      const completionError = (completion as unknown as {
        error?: string | { message?: string };
      }).error;
      const message = typeof completionError === "string"
        ? completionError
        : completionError?.message;
      throw new Error(
        message || "Medusa n’a pas confirmé la commande. Vérifiez la disponibilité et les options de livraison."
      );
    }

    const orderId = completion.order?.id;
    if (!orderId) {
      throw new Error(
        "Medusa a répondu sans identifiant de commande. Vérifiez les commandes dans Medusa Admin avant de réessayer."
      );
    }

    let trackingTokenForConfirmation: string | undefined;
    if (glovoTrackingToken) {
      try {
        const backendUrl = (
          process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
        ).replace(/\/+$/, "");
        const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;
        if (publishableKey) {
          const trackingResponse = await fetch(`${backendUrl}/store/glovo/deliveries/register`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-publishable-api-key": publishableKey,
            },
            body: JSON.stringify({ order_id: orderId, tracking_token: glovoTrackingToken }),
            cache: "no-store",
          });
          if (trackingResponse.ok) {
            trackingTokenForConfirmation = glovoTrackingToken;
          } else {
            console.warn(
              `[ANFA checkout] Tracking record registration returned HTTP ${trackingResponse.status}; order placement remains successful.`,
            );
          }
        }
      } catch (trackingRegistrationError) {
        console.warn(
          "[ANFA checkout] Tracking record registration failed; order placement remains successful.",
          trackingRegistrationError,
        );
      }
    }

    const orderRecord = completion.order as unknown as Record<string, unknown>;
    const cartRecord = cart as unknown as Record<string, unknown>;
    const formData = checkoutFormRef.current
      ? new FormData(checkoutFormRef.current)
      : null;
    const field = (name: string) => String(formData?.get(name) ?? "").trim();
    const numberValue = (value: unknown, fallback: number) => {
      if (typeof value === "number" && Number.isFinite(value)) return value;
      if (typeof value === "string" && value.trim() !== "") {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return parsed;
      }
      return fallback;
    };
    const subtotalValue = numberValue(cartRecord.subtotal, subtotal);
    const discountValue = numberValue(cartRecord.discount_total, 0);
    const shippingValue = numberValue(
      cartRecord.shipping_total,
      selectedShippingPrice ?? 0
    );
    const fallbackTotal = subtotalValue - discountValue + shippingValue +
      numberValue(cartRecord.tax_total, 0);
    const displayIdValue = orderRecord.display_id;
    const promotions = Array.isArray(cartRecord.promotions)
      ? cartRecord.promotions as Array<{ code?: string | null }>
      : [];
    const confirmation: CheckoutConfirmation = {
      orderId,
      displayId: displayIdValue !== undefined && displayIdValue !== null
        ? `#${String(displayIdValue)}`
        : orderId,
      createdAt: typeof orderRecord.created_at === "string"
        ? orderRecord.created_at
        : new Date().toISOString(),
      email: field("email") || customerEmail,
      firstName: field("first_name"),
      lastName: field("last_name"),
      phone: field("phone"),
      address1: field("address_1"),
      address2: field("address_2"),
      city: field("city"),
      province: field("province"),
      postalCode: field("postal_code"),
      shippingLabel: selectedShippingOption?.name || "Livraison standard — Maroc",
      promotionCode: promoCode.trim().toUpperCase() || promotions.find((promotion) => promotion.code)?.code || "",
      items: cartProducts.map((item, index) => ({
        key: `${item.productId}-${item.variantId}-${item.size}-${index}`,
        name: item.product.name,
        image: item.product.image || "",
        size: item.size,
        color: item.commerceVariant?.color || item.product.color || "",
        quantity: item.quantity,
        unitPrice: item.priceMad ?? 0,
      })),
      subtotal: subtotalValue,
      discount: discountValue,
      shipping: shippingValue,
      tax: numberValue(cartRecord.tax_total, 0),
      total: numberValue(orderRecord.total, numberValue(cartRecord.total, fallbackTotal)),
      trackingToken: trackingTokenForConfirmation,
    };

    localStorage.removeItem("anfa-athletics-medusa-cart-id");
    try {
      window.sessionStorage.setItem(
        CHECKOUT_CONFIRMATION_STORAGE_KEY,
        JSON.stringify(confirmation)
      );
    } catch (storageError) {
      console.warn("[ANFA checkout] Could not save order confirmation for refresh:", storageError);
    }
    setCompletedOrderSummary(confirmation);
    setOrderFeedback("");
    clearCart();
  } catch (error) {
    console.error("[ANFA checkout] Order placement failed:", error);
    setOrderFeedback(getCheckoutErrorMessage(error));
  } finally {
    setPlacingOrder(false);
  }
}


  const selectedShippingOption = shippingOptions.find(
    (option) => option.id === selectedShippingOptionId
  );
  const selectedShippingPrice = selectedShippingOption
    ? getShippingPrice(selectedShippingOption)
    : null;
  const medusaCartHasSelectedShipping = Boolean(
    selectedShippingOptionId &&
    (medusaCartSnapshot?.shipping_methods ?? []).some(
      (method) => method.shipping_option_id === selectedShippingOptionId
    )
  );

  return (
    <main className="site-shell">
      <SiteHeader />

      <section className="section cart-page">
        <p className="eyebrow">
          {completedOrderSummary ? "ANFA ATHLETICS / COMMANDE CONFIRMÉE" : "ANFA ATHLETICS / RÉCAPITULATIF"}
        </p>
        <h1 className={`cart-heading${completedOrderSummary ? " checkout-success-page-heading" : ""}`}>
          {completedOrderSummary ? "COMMANDE CONFIRMÉE" : "RÉCAPITULATIF"}
        </h1>

        {restoringConfirmation ? (
          <div className="checkout-confirmation-loading" aria-live="polite">
            <span className="checkout-confirmation-loading-mark" />
            <p>Récupération de votre confirmation...</p>
          </div>
        ) : completedOrderSummary ? (
          <div className="checkout-success-page">
            <section className="checkout-success-hero">
              <div className="checkout-success-check" aria-hidden="true">
                <svg viewBox="0 0 28 28" fill="none">
                  <path d="m6.5 14.2 5 5 10-10.4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="checkout-success-hero-copy">
                <p className="eyebrow">CONFIRMATION / {completedOrderSummary.displayId}</p>
                <h2>MERCI DE FAIRE PARTIE DU <span>MOUVEMENT.</span></h2>
                <p className="checkout-success-lead">
                  Votre commande a bien été enregistrée. Nous préparons la suite ; vous réglerez en espèces à la réception.
                </p>
                <div className="checkout-success-meta">
                  <div>
                    <span>RÉFÉRENCE DE COMMANDE</span>
                    <strong>{completedOrderSummary.displayId}</strong>
                  </div>
                  <div>
                    <span>DATE DE COMMANDE</span>
                    <strong>{new Intl.DateTimeFormat("fr-MA", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(completedOrderSummary.createdAt))}</strong>
                  </div>
                  <div>
                    <span>PAIEMENT</span>
                    <strong>Espèces à la livraison</strong>
                  </div>
                </div>
              </div>
              <div className="checkout-success-stamp" aria-hidden="true">
                <span>ANFA</span>
                <span>ATHLETICS</span>
                <span>FORGED / 01</span>
              </div>
            </section>

            <div className="checkout-success-grid">
              <div className="checkout-success-main-column">
                <section className="checkout-success-card checkout-success-items-card">
                  <div className="checkout-success-card-heading">
                    <div>
                      <p className="eyebrow">01 / VOTRE SÉLECTION</p>
                      <h3>Les pièces commandées</h3>
                    </div>
                    <span className="checkout-success-count">{completedOrderSummary.items.reduce((count, item) => count + item.quantity, 0).toString().padStart(2, "0")} ARTICLES</span>
                  </div>
                  <div className="checkout-success-items">
                    {completedOrderSummary.items.map((item) => (
                      <article className="checkout-success-item" key={item.key}>
                        <div
                          className="checkout-success-item-image"
                          role="img"
                          aria-label={item.name}
                          style={item.image ? { backgroundImage: `url("${item.image}")` } : undefined}
                        >
                          {!item.image && <span>ANFA / 01</span>}
                          <span className="checkout-success-item-quantity">{item.quantity}</span>
                        </div>
                        <div className="checkout-success-item-copy">
                          <h4>{item.name}</h4>
                          <p>{[item.color, item.size ? `Taille ${item.size}` : ""].filter(Boolean).join(" / ") || "Collection FORGED 01"}</p>
                          <span>Quantité : {item.quantity}</span>
                        </div>
                        <strong className="checkout-success-item-price">{formatConfirmationPrice(item.unitPrice * item.quantity)}</strong>
                      </article>
                    ))}
                  </div>
                  <div className="checkout-success-totals">
                    <div><span>Sous-total</span><strong>{formatConfirmationPrice(completedOrderSummary.subtotal)}</strong></div>
                    {completedOrderSummary.discount > 0 && (
                      <div className="checkout-success-discount-row">
                        <span>Réduction{completedOrderSummary.promotionCode ? ` · ${completedOrderSummary.promotionCode}` : " promotionnelle"}</span>
                        <strong>−{formatConfirmationPrice(completedOrderSummary.discount)}</strong>
                      </div>
                    )}
                    <div><span>Livraison · {completedOrderSummary.shippingLabel}</span><strong>{formatConfirmationPrice(completedOrderSummary.shipping)}</strong></div>
                    {completedOrderSummary.tax > 0 && <div><span>Taxes</span><strong>{formatConfirmationPrice(completedOrderSummary.tax)}</strong></div>}
                    <div className="checkout-success-grand-total"><span>Total à régler à la livraison</span><strong>{formatConfirmationPrice(completedOrderSummary.total)}</strong></div>
                  </div>
                </section>

                <section className="checkout-success-card checkout-success-delivery-card">
                  <div className="checkout-success-card-heading">
                    <div>
                      <p className="eyebrow">02 / DESTINATION</p>
                      <h3>Adresse de livraison</h3>
                    </div>
                    <span className="checkout-success-outline-icon" aria-hidden="true">↗</span>
                  </div>
                  <div className="checkout-success-address-grid">
                    <div className="checkout-success-address-block">
                      <span>DESTINATAIRE</span>
                      <strong>{[completedOrderSummary.firstName, completedOrderSummary.lastName].filter(Boolean).join(" ") || "Client ANFA ATHLETICS"}</strong>
                      {completedOrderSummary.email && <p>{completedOrderSummary.email}</p>}
                      {completedOrderSummary.phone && <p>{completedOrderSummary.phone}</p>}
                    </div>
                    <div className="checkout-success-address-block">
                      <span>ADRESSE</span>
                      <strong>{completedOrderSummary.address1 || "Adresse enregistrée"}</strong>
                      {completedOrderSummary.address2 && <p>{completedOrderSummary.address2}</p>}
                      <p>{[completedOrderSummary.city, completedOrderSummary.province, completedOrderSummary.postalCode].filter(Boolean).join(", ")}</p>
                      <p>Maroc</p>
                    </div>
                  </div>
                </section>
              </div>

              <aside className="checkout-success-side-column">
                <section className="checkout-success-payment-card">
                  <p className="eyebrow">MONTANT À PRÉPARER</p>
                  <h3>{formatConfirmationPrice(completedOrderSummary.total)}</h3>
                  <div className="checkout-success-payment-divider" />
                  <div className="checkout-success-cod-label">
                    <span className="checkout-success-cod-icon" aria-hidden="true">MAD</span>
                    <div>
                      <strong>Paiement à la livraison</strong>
                      <p>Réglez le livreur en espèces, en dirhams marocains, à la réception de votre colis.</p>
                    </div>
                  </div>
                  <p className="checkout-success-payment-note">Aucun paiement en ligne n’a été effectué sur ce site.</p>
                </section>

                <section className="checkout-success-next-card">
                  <p className="eyebrow">03 / LA SUITE</p>
                  <h3>Et maintenant ?</h3>
                  <ol className="checkout-success-steps">
                    <li>
                      <span>01</span>
                      <div><strong>Commande confirmée</strong><p>Votre commande est enregistrée dans notre système.</p></div>
                    </li>
                    <li>
                      <span>02</span>
                      <div><strong>Préparation</strong><p>Les articles seront préparés avant leur expédition.</p></div>
                    </li>
                    <li>
                      <span>03</span>
                      <div><strong>Livraison & règlement</strong><p>Réglez en espèces au livreur à la réception.</p></div>
                    </li>
                  </ol>
                </section>
                <div className="checkout-success-actions">
                  {completedOrderSummary.trackingToken ? (
                    <Link
                      className="button button-dark checkout-success-primary-action"
                      href={`/track/${completedOrderSummary.trackingToken}`}
                    >
                      SUIVRE MA LIVRAISON <span aria-hidden="true">↗</span>
                    </Link>
                  ) : (
                    <p className="checkout-success-footnote">
                      Le suivi en ligne sera disponible dès que l'enregistrement de livraison sera prêt.
                    </p>
                  )}
                  <Link
                    className="button button-dark checkout-success-primary-action"
                    href="/collections"
                    onClick={() => {
                      try { window.sessionStorage.removeItem(CHECKOUT_CONFIRMATION_STORAGE_KEY); } catch {}
                    }}
                  >
                    CONTINUER À DÉCOUVRIR <span aria-hidden="true">↗</span>
                  </Link>
                  <Link
                    className="checkout-success-home-link"
                    href="/"
                    onClick={() => {
                      try { window.sessionStorage.removeItem(CHECKOUT_CONFIRMATION_STORAGE_KEY); } catch {}
                    }}
                  >
                    RETOUR À L’ACCUEIL
                  </Link>
                </div>
              </aside>
            </div>
            <p className="checkout-success-footnote">Conservez votre référence de commande pour toute question concernant votre achat.</p>
          </div>
        ) : loading ? (
          <p>Chargement de votre sélection...</p>
        ) : catalogError ? (
          <div className="cart-empty">
            <p>
              Impossible de charger le catalogue. Vérifiez que le site
              et Medusa sont en cours d’exécution, puis réessayez.
            </p>
            <button
              className="button button-dark"
              type="button"
              onClick={() => window.location.reload()}
            >
              RÉESSAYER
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="cart-empty">
            <p>Votre sac est vide.</p>
            <Link className="button button-dark" href="/collections">
              DISCOVER THE COLLECTION <span>↗</span>
            </Link>
          </div>
        ) : (
          
          
<div className="checkout-layout">
  <div className="checkout-main">
    <form
      ref={checkoutFormRef}
      className="checkout-form"
      onSubmit={handleAddressSubmit}
    >
      <section className="checkout-form-section">
        <div className="checkout-section-heading">
          <h2>Contact</h2>
          <span>01</span>
        </div>

        <label className="checkout-field-full">
          E-mail
          <input
            name="email"
            type="email"
            autoComplete="email"
            placeholder="vous@exemple.com"
            value={customerEmail}
            onChange={(event) => setCustomerEmail(event.target.value)}
          required
          />
        </label>
      </section>

      <section className="checkout-form-section">
        <div className="checkout-section-heading">
          <h2>Livraison</h2>
          <span>02</span>
        </div>
        {loadingSavedAddresses ? (
  <p className="checkout-saved-address-note">
    Vérification de vos adresses enregistrées...
  </p>
) : customerAuthenticated ? (
  <div className="checkout-saved-addresses">
    <label htmlFor="checkout-saved-address">
      UTILISER UNE ADRESSE ENREGISTRÉE
    </label>

    <select
      id="checkout-saved-address"
      value={selectedSavedAddressId}
      onChange={(event) =>
        selectSavedAddress(event.target.value)
      }
    >
      <option value="">Saisir ou modifier une adresse</option>

      {savedAddresses.map((address) => (
        <option key={address.id} value={address.id}>
          {address.address_name ||
            `${address.address_1 ?? ""}, ${address.city ?? ""}`}
        </option>
      ))}
    </select>

    <p>
      La sélection préremplit les coordonnées ci-dessous.
      Vérifiez-les avant de les enregistrer.
    </p>
  </div>
) : (
  <p className="checkout-saved-address-note">
    Vous avez un ANFA ID ?{" "}
    <Link href="/account">Connectez-vous</Link> pour retrouver
    vos adresses enregistrées.
  </p>
)}


        <label className="checkout-field-full">
          Pays / Région
          <input value="Maroc" readOnly aria-readonly="true" />
        </label>

        <div className="checkout-fields-grid">
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

          <label className="checkout-field-full">
            Adresse
            <input
              name="address_1"
              autoComplete="address-line1"
              required
            />
          </label>

          <label className="checkout-field-full">
            Complément d’adresse
            <input
              name="address_2"
              autoComplete="address-line2"
              placeholder="Appartement, étage… (facultatif)"
            />
          </label>

          <label>
            Code postal
            <input
              name="postal_code"
              autoComplete="postal-code"
            />
          </label>

          <label>
            Ville
            <input
              name="city"
              autoComplete="address-level2"
              required
            />
          </label>

          <label className="checkout-field-full">
            Région / Province
            <input
              name="province"
              autoComplete="address-level1"
            />
          </label>

          <label className="checkout-field-full">
            Téléphone
            <input
              name="phone"
              type="tel"
              autoComplete="tel"
              required
            />
          </label>
        </div>
        {customerAuthenticated && (
  <div className="checkout-save-address-control">
    <label>
      <input
        type="checkbox"
        checked={saveAddressToAccount}
        onChange={(event) =>
          setSaveAddressToAccount(event.target.checked)
        }
      />
      <span>
        Enregistrer cette adresse dans mon ANFA ID pour mes
        prochains achats.
      </span>
    </label>

    {saveAddressToAccount && (
      <label className="checkout-field-full checkout-address-name">
        Nom de cette adresse
        <input
          name="address_name"
          placeholder="Maison, Travail..."
          defaultValue="Maison"
          required
        />
      </label>
    )}
  </div>
)}
      </section>

      <button
        className="button button-dark checkout-save-button"
        type="submit"
        disabled={savingAddress}
      >
        {savingAddress
          ? "ENREGISTREMENT..."
          : "ENREGISTRER MES COORDONNÉES"}
      </button>

      {addressFeedback && (
        <p
          className="cart-notice"
          role="status"
          aria-live="polite"
        >
          {addressFeedback}
        </p>
      )}
      
<section className="checkout-shipping-section" aria-live="polite">
  <div className="checkout-section-heading">
    <h2>Livraison</h2>
    <span>03</span>
  </div>

  {!addressSaved ? (
    <p className="cart-notice">
      Enregistrez vos coordonnées pour vérifier les options de livraison.
    </p>
  ) : loadingShippingOptions ? (
    <p className="cart-notice">
      Recherche des options de livraison...
    </p>
  ) : (
    <>
      <p className="cart-notice">
        {shippingOptionsMessage}
      </p>

      {shippingOptions.length > 0 && (
        <div className="checkout-shipping-options">
          {shippingOptions.map((option) => {
            const shippingPrice = getShippingPrice(option);
            return (
              <div key={option.id} className="checkout-shipping-option">
                <label className="checkout-option-label">
                  <input
                    className="checkout-option-radio"
                    type="radio"
                    name="shipping_option"
                    value={option.id}
                    checked={selectedShippingOptionId === option.id}
                    disabled={shippingPrice === null || placingOrder}
                    onChange={() => {
                      setSelectedShippingOptionId(option.id);
                      setOrderFeedback("");
                    }}
                  />
                  <span>{option.name}</span>
                </label>
                <span>
                  {shippingPrice === null ? "Tarif indisponible" : formatPrice(shippingPrice)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </>
  )}
</section>

<section className="checkout-payment-section" aria-live="polite">
  <div className="checkout-section-heading">
    <h2>Paiement</h2>
    <span>04</span>
  </div>

  {!addressSaved ? (
    <p className="cart-notice">
      Enregistrez vos coordonnées et sélectionnez la livraison pour continuer.
    </p>
  ) : loadingPaymentProviders ? (
    <p className="cart-notice">Vérification des moyens de paiement...</p>
  ) : manualPaymentProviderId ? (
    <label className="checkout-payment-option">
      <input type="radio" name="payment_provider" checked readOnly />
      <span className="checkout-payment-option-copy">
        <strong>PAIEMENT EN ESPÈCES À LA LIVRAISON</strong>
        <span>Payez le livreur en dirhams marocains à la réception de votre commande.</span>
      </span>
      <span className="checkout-payment-badge">COD</span>
    </label>
  ) : (
    <p className="cart-notice">
      {paymentProviderMessage || "Le paiement à la livraison n’est pas disponible pour cette région."}
    </p>
  )}

  {manualPaymentProviderId && paymentProviderMessage && (
    <p className="checkout-shipping-note">{paymentProviderMessage}</p>
  )}
  {!MEDUSA_CART_SYNC_ENABLED && (
    <p className="checkout-development-note">
      Le mode commande est désactivé pour le moment. La commande ne sera pas créée tant que la synchronisation du panier n’aura pas été activée après vérification du stock et de la livraison.
    </p>
  )}
  {orderFeedback && (
    <p className="cart-notice checkout-order-feedback" role="alert" aria-live="assertive">
      {orderFeedback}
    </p>
  )}
</section>

      <p className="checkout-development-note">
        L’enregistrement des coordonnées ne valide pas de commande à lui seul.
      </p>
    </form>
  </div>

  <aside className="checkout-summary">
    <div className="checkout-summary-heading">
      <div>
        <p className="eyebrow">ANFA ATHLETICS / FORGED 01</p>
        <h2>Votre commande</h2>
      </div>

      <button
        type="button"
        className="checkout-items-toggle"
        aria-expanded={showOrderItems}
        onClick={() => setShowOrderItems((shown) => !shown)}
      >
        {showOrderItems ? "Masquer" : "Afficher les articles"}
        <span>{itemCount}</span>
        <span aria-hidden="true">
          {showOrderItems ? "−" : "+"}
        </span>
      </button>
    </div>

    <div
      className={`checkout-order-items ${
        showOrderItems ? "is-expanded" : ""
      }`}
    >
      {cartProducts.map((item) => (
        <article
          className="checkout-order-item"
          key={`${item.productId}-${item.variantId}-${item.size}`}
        >
          <div
            className="checkout-order-image"
            role="img"
            aria-label={item.product.name}
            style={{
              backgroundImage: item.product.image
                ? `url("${item.product.image}")`
                : "none",
            }}
          >
            <span className="checkout-order-quantity">
              {item.quantity}
            </span>
          </div>

          <div className="checkout-order-copy">
            <h3>{item.product.name}</h3>
            <p>
              {item.commerceVariant?.color ?? item.product.color}
              {" / "}
              {item.size}
            </p>
          </div>

          <strong className="checkout-order-price">
            {item.priceMad === null
              ? "À confirmer"
              : formatPrice(item.priceMad * item.quantity)}
          </strong>
        </article>
      ))}
    </div>

    {cartProducts.length !== items.length && (
      <p className="cart-notice">
        Certains articles doivent encore être vérifiés dans le catalogue.
      </p>
    )}

    <section className="checkout-promo-section" aria-labelledby="checkout-promo-title">
      <h3 id="checkout-promo-title">Code promotionnel</h3>
      <form
        className="checkout-promo-form"
        onSubmit={(event) => {
          event.preventDefault();
          void applyPromotion();
        }}
      >
        <label className="checkout-field-full">
          Saisissez votre code ambassadeur
          <input
            name="promo_code"
            type="text"
            autoComplete="off"
            value={promoCode}
            onChange={(event) => setPromoCode(event.target.value)}
            placeholder="Ex. ANFA..."
            disabled={!MEDUSA_CART_SYNC_ENABLED || promoBusy}
            aria-describedby="checkout-promo-help"
          />
        </label>
        <button
          className="button button-dark"
          type="submit"
          disabled={!MEDUSA_CART_SYNC_ENABLED || promoBusy || !promoCode.trim()}
        >
          {promoBusy ? "VÉRIFICATION..." : "APPLIQUER LE CODE"}
        </button>
      </form>
      <p id="checkout-promo-help" className="checkout-shipping-note">
        {!MEDUSA_CART_SYNC_ENABLED
          ? "Le panier est encore en mode prévisualisation. Les codes seront activés après la configuration des variantes et de la synchronisation Medusa."
          : "Le code doit être actif et applicable aux articles de votre panier. La remise est calculée par Medusa."}
      </p>
      {(medusaCartSnapshot?.promotions ?? []).filter((promotion) => promotion.code).map((promotion) => (
        <div className="cart-summary-row" key={promotion.id}>
          <span>{promotion.code}</span>
          <button
            className="text-link"
            type="button"
            disabled={!MEDUSA_CART_SYNC_ENABLED || promoBusy}
            onClick={() => void removePromotion(promotion.code as string)}
          >
            Retirer
          </button>
        </div>
      ))}
      {promoFeedback && (
        <p className="cart-notice" role="status" aria-live="polite">
          {promoFeedback}
        </p>
      )}
    </section>

    <div className="checkout-totals">
      <div className="cart-summary-row">
        <span>Articles</span>
        <span>{itemCount}</span>
      </div>

      <div className="cart-summary-row">
        <span>Sous-total</span>
        <strong>
          {medusaCartSnapshot &&
          cartContainsAllSelectedVariants(medusaCartSnapshot) &&
          typeof medusaCartSnapshot.subtotal === "number"
            ? formatPrice(medusaCartSnapshot.subtotal)
            : allPricesConfirmed
              ? formatPrice(subtotal)
              : "À confirmer"}
        </strong>
      </div>

      {medusaCartSnapshot &&
        cartContainsAllSelectedVariants(medusaCartSnapshot) &&
        typeof medusaCartSnapshot.discount_total === "number" &&
        medusaCartSnapshot.discount_total > 0 && (
          <div className="cart-summary-row">
            <span>Réduction</span>
            <strong>-{formatPrice(medusaCartSnapshot.discount_total)}</strong>
          </div>
        )}

      {medusaCartSnapshot &&
        cartContainsAllSelectedVariants(medusaCartSnapshot) &&
        typeof medusaCartSnapshot.total === "number" && (
          <div className="cart-summary-row">
            <span>
              {medusaCartHasSelectedShipping
                ? "Total actuel Medusa"
                : "Total articles Medusa (livraison à confirmer)"}
            </span>
            <strong>{formatPrice(medusaCartSnapshot.total)}</strong>
          </div>
        )}

      <div className="cart-summary-row">
        <span>Livraison</span>
        <strong>
          {medusaCartHasSelectedShipping && typeof medusaCartSnapshot?.shipping_total === "number"
            ? formatPrice(medusaCartSnapshot.shipping_total)
            : selectedShippingPrice !== null
              ? formatPrice(selectedShippingPrice)
              : "À confirmer"}
        </strong>
      </div>
    </div>

    <p className="checkout-shipping-note">
      {shippingOptions.length > 0
        ? "Le mode et le tarif de livraison sont fournis par Medusa ; vérifiez-les avant de confirmer votre commande."
        : "Les frais de livraison seront affichés lorsque les options de livraison au Maroc seront configurées."}
    </p>

    <button
      className="button button-dark cart-continue"
      type="button"
      onClick={() => void handlePlaceOrder()}
      disabled={
        !MEDUSA_CART_SYNC_ENABLED ||
        !addressSaved ||
        !selectedShippingOptionId ||
        !manualPaymentProviderId ||
        !allPricesConfirmed ||
        placingOrder ||
        loadingShippingOptions ||
        loadingPaymentProviders
      }
    >
      {placingOrder
        ? "VALIDATION DE LA COMMANDE..."
        : MEDUSA_CART_SYNC_ENABLED
          ? "COMMANDER · PAIEMENT À LA LIVRAISON"
          : "VENTES BIENTÔT DISPONIBLES"}
    </button>

    <Link
      className="text-link checkout-edit-bag"
      href="/cart"
    >
      ← MODIFIER MON SAC
    </Link>
  </aside>
</div>

        )}
      </section>

      <SiteFooter />
    </main>
  );
}
