"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { sdk } from "../lib/medusa";
import { products } from "../data/products";

export type CartItem = {
  productId: string;
  variantId: string;
  size: string;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  addItem: (productId: string, variantId: string, size: string, quantity?: number) => void;
  setQuantity: (productId: string, variantId: string, size: string, quantity: number) => void;
  removeItem: (productId: string, variantId: string, size: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "anfa-athletics-cart";

const MEDUSA_CART_STORAGE_KEY = "anfa-athletics-medusa-cart-id";
export const MEDUSA_REGION_ID = "reg_01M5ZS40Q027QDGECE9TRSJBBH";

// Keep the bag in local preview mode until real inventory and checkout are configured.
// Enable only later by setting NEXT_PUBLIC_ENABLE_MEDUSA_CART_SYNC=true.
export const MEDUSA_CART_SYNC_ENABLED: boolean =
  process.env.NEXT_PUBLIC_ENABLE_MEDUSA_CART_SYNC === "true";

type MedusaCartSnapshot = {
  id: string;
  items?: Array<{
    id: string;
    variant_id?: string | null;
    quantity: number;
  }>;
};

async function getOrCreateMedusaCart(): Promise<MedusaCartSnapshot> {
  const savedCartId = localStorage.getItem(MEDUSA_CART_STORAGE_KEY);

  if (savedCartId) {
    try {
      const { cart } = await sdk.store.cart.retrieve(savedCartId, {
        fields: "*items",
      });

      return cart as unknown as MedusaCartSnapshot;
    } catch {
      // The saved cart may have expired or become unavailable.
      localStorage.removeItem(MEDUSA_CART_STORAGE_KEY);
    }
  }

  const { cart } = await sdk.store.cart.create({
    region_id: MEDUSA_REGION_ID,
  });

  localStorage.setItem(MEDUSA_CART_STORAGE_KEY, cart.id);

  return cart as unknown as MedusaCartSnapshot;
}

async function syncMedusaCart(items: CartItem[]): Promise<void> {
  // Pre-launch: keep product selections in localStorage and never submit variant lines
  // without configured inventory. Retain an empty Medusa cart for address-form testing.
  if (!MEDUSA_CART_SYNC_ENABLED) {
    const savedCartId = localStorage.getItem(MEDUSA_CART_STORAGE_KEY);
    const hasCommerceVariants = items.some((item) => item.variantId.startsWith("variant_"));
    if (!hasCommerceVariants && !savedCartId) return;

    const cart = await getOrCreateMedusaCart();
    for (const line of cart.items ?? []) {
      await sdk.store.cart.deleteLineItem(cart.id, line.id);
    }
    return;
  }

  // Standard generated Medusa variant IDs start with "variant_".
  // Ignore local prototype/display IDs instead of sending fake variants.
  const desiredQuantities = new Map<string, number>();

  for (const item of items) {
    if (!item.variantId.startsWith("variant_")) continue;

    desiredQuantities.set(
      item.variantId,
      (desiredQuantities.get(item.variantId) ?? 0) + item.quantity
    );
  }

  const savedCartId = localStorage.getItem(MEDUSA_CART_STORAGE_KEY);

  // Do not create an empty Medusa cart unnecessarily.
  if (desiredQuantities.size === 0 && !savedCartId) return;

  const cart = await getOrCreateMedusaCart();
  const existingItems = cart.items ?? [];
  const syncedVariantIds = new Set<string>();

  for (const line of existingItems) {
    const variantId = line.variant_id ?? "";
    const desiredQuantity = desiredQuantities.get(variantId);

    if (
      !variantId ||
      desiredQuantity === undefined ||
      syncedVariantIds.has(variantId)
    ) {
      await sdk.store.cart.deleteLineItem(cart.id, line.id);
      continue;
    }

    if (line.quantity !== desiredQuantity) {
      await sdk.store.cart.updateLineItem(cart.id, line.id, {
        quantity: desiredQuantity,
      });
    }

    syncedVariantIds.add(variantId);
  }

  for (const [variantId, quantity] of desiredQuantities) {
    if (syncedVariantIds.has(variantId)) continue;

    await sdk.store.cart.createLineItem(cart.id, {
      variant_id: variantId,
      quantity,
    });
  }
}


export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const normalized: CartItem[] = parsed.flatMap((item) => {
            if (item === null || typeof item !== "object") return [];
            const savedItem = item as Record<string, unknown>;
            if (
              typeof savedItem.productId !== "string" ||
              typeof savedItem.quantity !== "number" ||
              !Number.isInteger(savedItem.quantity) ||
              savedItem.quantity < 1
            ) return [];

            // Older cart entries did not store color variant IDs. Map them to the product's first variant.
            const product = products.find((candidate) => candidate.id === savedItem.productId);
            const variantId = typeof savedItem.variantId === "string"
              ? savedItem.variantId
              : product?.variants[0]?.id ?? "default";

            return [{
              productId: savedItem.productId,
              variantId,
              size: typeof savedItem.size === "string" ? savedItem.size : "À CHOISIR",
              quantity: savedItem.quantity,
            }];
          });
          // Browser-only localStorage hydration; initial state must remain SSR-safe.
          // eslint-disable-next-line react-hooks/set-state-in-effect -- Required to restore the persisted cart after mount.
          setItems(normalized);
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    setReady(true);
  }, []);

  const syncQueueRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    if (!ready) return;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));

    const itemsSnapshot = items;

   // Run synchronisations in order to avoid overlapping cart updates.
    syncQueueRef.current = syncQueueRef.current
      .catch(() => undefined)
      .then(() => syncMedusaCart(itemsSnapshot))
      .catch((error) => {
        console.error("[ANFA cart] Medusa synchronisation failed:", error);
    });
}, [items, ready]);

  const addItem = (productId: string, variantId: string, size: string, quantity = 1) => {
    if (!productId || !variantId || !size.trim() || !Number.isInteger(quantity) || quantity < 1) return;

    setItems((current) => {
      const existing = current.find(
        (item) => item.productId === productId && item.variantId === variantId && item.size === size
      );
      if (existing) {
        return current.map((item) =>
          item.productId === productId && item.variantId === variantId && item.size === size
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...current, { productId, variantId, size, quantity }];
    });
  };

  const setQuantity = (productId: string, variantId: string, size: string, quantity: number) => {
    if (!Number.isInteger(quantity)) return;
    if (quantity < 1) {
      setItems((current) => current.filter(
        (item) => !(item.productId === productId && item.variantId === variantId && item.size === size)
      ));
      return;
    }
    setItems((current) => current.map((item) =>
      item.productId === productId && item.variantId === variantId && item.size === size
        ? { ...item, quantity }
        : item
    ));
  };

  const removeItem = (productId: string, variantId: string, size: string) => {
    setItems((current) => current.filter(
      (item) => !(item.productId === productId && item.variantId === variantId && item.size === size)
    ));
  };

  const clearCart = () => setItems([]);
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const value = useMemo(
    () => ({ items, itemCount, addItem, setQuantity, removeItem, clearCart }),
    [items, itemCount]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider.");
  return context;
}
