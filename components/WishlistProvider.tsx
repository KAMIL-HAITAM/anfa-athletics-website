
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { products } from "../data/products";
import { sdk } from "../lib/medusa";

export type WishlistEntry = {
  productId: string;
  variantId: string;
};

type WishlistContextValue = {
  entries: WishlistEntry[];
  productIds: string[];
  count: number;
  isSaved: (productId: string, variantId?: string) => boolean;
  toggleSaved: (productId: string, variantId?: string) => void;
  removeSaved: (productId: string, variantId?: string) => void;
  clearWishlist: () => void;
};

type CustomerWithMetadata = {
  id: string;
  metadata?: Record<string, unknown> | null;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

const STORAGE_KEY = "anfa-athletics-wishlist";
const REMOTE_KEY = "anfa_wishlist";

function resolveVariantId(
  productId: string,
  variantId?: string
): string | undefined {
  if (typeof variantId === "string" && variantId.trim()) {
    return variantId;
  }

  const product = products.find(
    (candidate) => candidate.id === productId
  );

  return product?.variants[0]?.id ?? "default";
}

function entryKey(entry: WishlistEntry): string {
  return `${entry.productId}::${entry.variantId}`;
}

function normalizeEntries(value: unknown): WishlistEntry[] {
  if (!Array.isArray(value)) return [];

  const unique = new Map<string, WishlistEntry>();

  for (const savedEntry of value) {
    let entry: WishlistEntry | undefined;

    // Support the older format, which stored only product IDs.
    if (typeof savedEntry === "string") {
      const variantId = resolveVariantId(savedEntry);

      if (variantId) {
        entry = {
          productId: savedEntry,
          variantId,
        };
      }
    } else if (
      savedEntry !== null &&
      typeof savedEntry === "object"
    ) {
      const record = savedEntry as Record<string, unknown>;

      if (typeof record.productId !== "string") continue;

      const variantId =
        typeof record.variantId === "string"
          ? resolveVariantId(record.productId, record.variantId)
          : resolveVariantId(record.productId);

      if (variantId) {
        entry = {
          productId: record.productId,
          variantId,
        };
      }
    }

    if (entry) {
      unique.set(entryKey(entry), entry);
    }
  }

  return [...unique.values()];
}

function mergeEntries(
  current: WishlistEntry[],
  incoming: WishlistEntry[]
): WishlistEntry[] {
  const unique = new Map<string, WishlistEntry>();

  // Keep existing local selections first, then add missing account entries.
  [...current, ...incoming].forEach((entry) => {
    unique.set(entryKey(entry), entry);
  });

  return [...unique.values()];
}

function hasSameEntries(
  first: WishlistEntry[],
  second: WishlistEntry[]
): boolean {
  return (
    first.length === second.length &&
    first.every((entry, index) => entryKey(entry) === entryKey(second[index]))
  );
}

export function WishlistProvider({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();

  const [entries, setEntries] = useState<WishlistEntry[]>([]);
  const [ready, setReady] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [accountReadyId, setAccountReadyId] = useState<string | null>(
    null
  );

  // Avoid repeatedly merging the same account's server data on every route.
  const loadedCustomerIds = useRef(new Set<string>());

  // Serialize writes so a slower, older request cannot overwrite a newer list.
  const syncQueueRef = useRef<Promise<void>>(Promise.resolve());

  // Restore the existing guest/browser wishlist.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        // Browser-only localStorage hydration; initial state must remain SSR-safe.
        // eslint-disable-next-line react-hooks/set-state-in-effect -- Required to restore the persisted wishlist after mount.
        setEntries(normalizeEntries(parsed));
      }
    } catch (error) {
      console.warn(
        "[ANFA wishlist] Could not restore local wishlist:",
        error
      );

      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Browser storage may be unavailable.
      }
    }

    setReady(true);
  }, []);

  // Load account data on entry and after navigation, including after login.
  useEffect(() => {
    if (!ready) return;

    let active = true;

    async function loadAccountWishlist() {
      try {
        const result = await sdk.store.customer.retrieve({
          fields: "+metadata",
        });

        if (!active) return;

        const customer = result.customer as CustomerWithMetadata;

        if (!loadedCustomerIds.current.has(customer.id)) {
          const remoteEntries = normalizeEntries(
            customer.metadata?.[REMOTE_KEY]
          );

          loadedCustomerIds.current.add(customer.id);

          setEntries((current) => {
            const merged = mergeEntries(current, remoteEntries);

            return hasSameEntries(current, merged)
              ? current
              : merged;
          });
        }

        setCustomerId(customer.id);
        setAccountReadyId(customer.id);
      } catch {
        // Signed-out visitors keep using the local wishlist.
        if (active) {
          loadedCustomerIds.current.clear();
          setCustomerId(null);
          setAccountReadyId(null);
        }
      }
    }

    void loadAccountWishlist();

    return () => {
      active = false;
    };
  }, [pathname, ready]);

  // Always preserve the current wishlist locally for guests and signed-in users.
  useEffect(() => {
    if (!ready) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
      // Keep the in-memory wishlist usable if storage is unavailable.
    }
  }, [entries, ready]);

  // Persist the current list to the authenticated customer's metadata.
  useEffect(() => {
    if (
      !ready ||
      !customerId ||
      accountReadyId !== customerId
    ) {
      return;
    }

    const snapshot = entries.map((entry) => ({ ...entry }));
    const targetCustomerId = customerId;

    syncQueueRef.current = syncQueueRef.current
      .catch(() => undefined)
      .then(async () => {
        const result = await sdk.store.customer.retrieve({
          fields: "+metadata",
        });

        const customer = result.customer as CustomerWithMetadata;

        // Never write one account's wishlist into another account.
        if (customer.id !== targetCustomerId) return;

        await sdk.store.customer.update({
          metadata: {
            ...(customer.metadata ?? {}),
            [REMOTE_KEY]: snapshot,
          },
        });
      })
      .catch((error) => {
        console.error(
          "[ANFA wishlist] Account sync failed:",
          error
        );
      });
  }, [entries, ready, customerId, accountReadyId]);

  const isSaved = useCallback(
    (productId: string, variantId?: string) => {
      const resolvedVariantId = resolveVariantId(productId, variantId);

      return (
        resolvedVariantId !== undefined &&
        entries.some(
          (entry) =>
            entry.productId === productId &&
            entry.variantId === resolvedVariantId
        )
      );
    },
    [entries]
  );

  const toggleSaved = useCallback(
    (productId: string, variantId?: string) => {
      const resolvedVariantId = resolveVariantId(productId, variantId);

      if (!resolvedVariantId) return;

      setEntries((current) => {
        const exists = current.some(
          (entry) =>
            entry.productId === productId &&
            entry.variantId === resolvedVariantId
        );

        return exists
          ? current.filter(
              (entry) =>
                !(
                  entry.productId === productId &&
                  entry.variantId === resolvedVariantId
                )
            )
          : [
              ...current,
              {
                productId,
                variantId: resolvedVariantId,
              },
            ];
      });
    },
    []
  );

  const removeSaved = useCallback(
    (productId: string, variantId?: string) => {
      if (variantId === undefined) {
        setEntries((current) =>
          current.filter((entry) => entry.productId !== productId)
        );
        return;
      }

      const resolvedVariantId = resolveVariantId(productId, variantId);

      setEntries((current) =>
        current.filter(
          (entry) =>
            !(
              entry.productId === productId &&
              entry.variantId === resolvedVariantId
            )
        )
      );
    },
    []
  );

  const clearWishlist = useCallback(() => {
    setEntries([]);
  }, []);

  const productIds = useMemo(
    () => [...new Set(entries.map((entry) => entry.productId))],
    [entries]
  );

  const count = entries.length;

  const value = useMemo(
    () => ({
      entries,
      productIds,
      count,
      isSaved,
      toggleSaved,
      removeSaved,
      clearWishlist,
    }),
    [
      entries,
      productIds,
      count,
      isSaved,
      toggleSaved,
      removeSaved,
      clearWishlist,
    ]
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);

  if (!context) {
    throw new Error(
      "useWishlist must be used inside WishlistProvider."
    );
  }

  return context;
}
