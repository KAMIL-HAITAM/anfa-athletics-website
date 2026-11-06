import {
  products as localProducts,
  type Product,
  type ProductImage,
  type ProductVariant,
  type CommerceVariantReference,
} from "../data/products";

type MedusaOption = {
  value?: string | null;
  title?: string | null;
  option?: { title?: string | null } | null;
};

type MedusaImage = {
  id?: string | null;
  url?: string | null;
  rank?: number | null;
};

type MedusaVariant = {
  id: string;
  title?: string | null;
  sku?: string | null;
  options?: MedusaOption[] | null;
  calculated_price?: {
    calculated_amount?: number | string | null;
    currency_code?: string | null;
  } | null;
  thumbnail?: string | null;
  images?: MedusaImage[] | null;
};

type MedusaCategory = { name?: string | null; handle?: string | null };
type MedusaTag = { name?: string | null; value?: string | null; handle?: string | null };

type MedusaProductRecord = {
  id: string;
  title: string;
  handle: string;
  subtitle?: string | null;
  description?: string | null;
  thumbnail?: string | null;
  images?: MedusaImage[] | null;
  variants?: MedusaVariant[] | null;
  categories?: MedusaCategory[] | null;
  tags?: MedusaTag[] | null;
  collection?: { title?: string | null; handle?: string | null } | null;
  type?: { value?: string | null; title?: string | null } | null;
  metadata?: Record<string, unknown> | null;
};

const KNOWN_COLORS = [
  { name: "Noir mat furtif", hex: "#171818", aliases: ["noir mat furtif", "noir", "black", "stealth black", "matte black"] },
  { name: "Gris béton", hex: "#777B79", aliases: ["gris beton", "gris", "grey", "gray", "concrete grey", "concrete gray"] },
  { name: "Olive tactique", hex: "#545B42", aliases: ["olive tactique", "olive", "tactical olive", "washed olive"] },
  { name: "Taupe industriel", hex: "#A69A87", aliases: ["taupe industriel", "taupe", "industrial taupe"] },
];

const SIZES = new Set(["xxs", "xs", "s", "m", "l", "xl", "xxl", "xxxl", "2xl", "3xl"]);
const SIZE_ORDER = [
  "XXS",
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "2XL",
  "XXXL",
  "3XL",
];

const SIZE_RANK = new Map(
  SIZE_ORDER.map((size, index) => [size, index])
);

function compareSizes(a: string, b: string): number {
  const aRank = SIZE_RANK.get(a.trim().toUpperCase());
  const bRank = SIZE_RANK.get(b.trim().toUpperCase());

  if (aRank === undefined && bRank === undefined) {
    return a.localeCompare(b);
  }

  if (aRank === undefined) return 1;
  if (bRank === undefined) return -1;

  return aRank - bRank;
}

function sortSizes(sizes: string[]): string[] {
  return [...new Set(sizes)].sort(compareSizes);
}
type CollectionKey = "homme" | "femme" | "nouveautes";
function normalize(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function slugify(value: string): string {
  return normalize(value).replace(/\s+/g, "-");
}


function findLocalMatch(record: MedusaProductRecord): Product | undefined {
  const handle = normalize(record.handle);
  const title = normalize(record.title).replace(/ design 0?[23]$/, "").trim();

  const exact = localProducts.find((product) => normalize(product.slug) === handle);
  if (exact) return exact;

  return [...localProducts]
    .sort((a, b) => b.name.length - a.name.length)
    .find((product) => {
      const localName = normalize(product.name);
      return title === localName || title.startsWith(`${localName} `);
    });
}

function isAnfaProduct(record: MedusaProductRecord): boolean {
  const titleAndHandle = normalize(`${record.title} ${record.handle}`);
  if (/\btest\b|demo|medusa/.test(titleAndHandle)) return false;

  const tags = (record.tags ?? []).map((tag) => normalize(tag.name ?? tag.value ?? tag.handle));
  if (tags.some((tag) => tag.includes("forged 01") || tag === "forged 01" || tag === "anfa")) return true;
  if ((record.variants ?? []).some((variant) => (variant.sku ?? "").toUpperCase().startsWith("ANFA-"))) return true;
  const collectionIdentity = normalize(`${record.collection?.handle ?? ""} ${record.collection?.title ?? ""}`);
  if (collectionIdentity.includes("forged 01")) return true;

  // Compatibility for ANFA products created before the FORGED-01 tag/collection was assigned.
  return /t shirt|hoodie|jogger|legging|brassiere|crop top|short|debardeur|marcel|tank top/.test(titleAndHandle);
}

function colorFromValue(value: string | undefined): (typeof KNOWN_COLORS)[number] | undefined {
  const key = normalize(value);
  return KNOWN_COLORS.find((color) => color.aliases.some((alias) => normalize(alias) === key));
}

function optionTitle(option: MedusaOption): string {
  return option.option?.title ?? option.title ?? "";
}

function findSize(variant: MedusaVariant): string | undefined {
  const options = variant.options ?? [];
  const option = options.find((item) => /size|taille/.test(normalize(optionTitle(item))));
  const optionValue = option?.value?.trim();
  if (optionValue && SIZES.has(normalize(optionValue))) return optionValue.toUpperCase();

  for (const item of options) {
    const value = item.value?.trim();
    if (value && SIZES.has(normalize(value))) return value.toUpperCase();
  }

  const titleMatch = (variant.title ?? "").match(/(?:^|[\s/|_-])(XXS|XXXL|XXL|XS|XL|S|M|L|2XL|3XL)(?:$|[\s/|_-])/i);
  return titleMatch?.[1]?.toUpperCase();
}

function findColor(variant: MedusaVariant): string | undefined {
  const options = variant.options ?? [];
  const colorOption = options.find((item) => /color|colour|couleur|coloris/.test(normalize(optionTitle(item))));
  const namedColor = colorOption?.value?.trim();
  if (namedColor) return colorFromValue(namedColor)?.name ?? namedColor;

  for (const option of options) {
    const value = option.value?.trim();
    const known = colorFromValue(value);
    if (known) return known.name;
  }

  const title = variant.title ?? "";
  const match = KNOWN_COLORS.find((color) => color.aliases.some((alias) => normalize(title).includes(normalize(alias))));
  if (match) return match.name;

  const nonSize = options.find((item) => item.value && !SIZES.has(normalize(item.value)));
  return nonSize?.value?.trim() || undefined;
}


function productImages(record: MedusaProductRecord): ProductImage[] {
  const images = [...(record.images ?? [])]
    .filter(
      (image): image is MedusaImage & { url: string } =>
        Boolean(image.url)
    )
    .sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999));

  if (
    record.thumbnail &&
    !images.some((image) => image.url === record.thumbnail)
  ) {
    images.unshift({
      id: "thumbnail",
      url: record.thumbnail,
      rank: -1,
    });
  }

  // Images must come from Medusa. No local image fallback.
  return images.map((image, index) => ({
    id: image.id || `medusa-image-${index + 1}`,
    src: image.url,
    alt: `${record.title} — image ${index + 1}`,
  }));
}


function productCollections(record: MedusaProductRecord, localMatch?: Product): CollectionKey[] {
  const categoryText = (record.categories ?? [])
    .map((category) => normalize(`${category.name ?? ""} ${category.handle ?? ""}`))
    .join(" | ");
  const mapped = new Set<CollectionKey>();

  if (/\bhomme\b|\bmen\b|\bmens\b|\bman\b/.test(categoryText)) mapped.add("homme");
  if (/\bfemme\b|\bwomen\b|\bwomens\b|\bwoman\b/.test(categoryText)) mapped.add("femme");
  if (/nouveaute|new arrivals?|new arrivals|new collection/.test(categoryText)) mapped.add("nouveautes");
  if (mapped.size > 0) return [...mapped];

  if (localMatch) return localMatch.collections;

  const words = normalize(`${record.title} ${record.handle}`);
  if (/legging|brassiere|crop top/.test(words)) return ["femme", "nouveautes"];
  if (/t shirt|hoodie|jogger|short|debardeur|marcel|tank top/.test(words)) return ["homme", "nouveautes"];
  return ["nouveautes"];
}

function productCategory(record: MedusaProductRecord, localMatch?: Product): Product["category"] {
  if (localMatch) return localMatch.category;
  const text = normalize(`${record.title} ${record.handle} ${record.type?.value ?? ""} ${record.type?.title ?? ""}`);
  if (/jogger|legging|short|pants|trouser/.test(text)) return "bottoms";
  if (/bag|bottle|towel|accessory|accessories|sac|gourde|serviette/.test(text)) return "accessories";
  return "tops";
}

function getVariantImages(
  variants: MedusaVariant[],
  productTitle: string
): ProductImage[] {
  const seen = new Set<string>();
  const result: ProductImage[] = [];

  for (const variant of variants) {
    const images = [...(variant.images ?? [])]
      .filter(
        (image): image is MedusaImage & { url: string } =>
          Boolean(image.url)
      )
      .sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999));

    for (const image of images) {
      if (seen.has(image.url)) continue;

      seen.add(image.url);

      result.push({
        id: image.id || `variant-image-${result.length + 1}`,
        src: image.url,
        alt: `${productTitle} — image ${result.length + 1}`,
      });
    }
  }

  return result;
}
function mapMedusaProduct(record: MedusaProductRecord): Product {
  const localMatch = findLocalMatch(record);
  const images = productImages(record);
  const variantsFromApi = record.variants ?? [];
  const exactLocalProduct = localMatch && normalize(record.handle) === normalize(localMatch.slug)
    ? localMatch
    : undefined;
  const groups = new Map<string, { name: string; hex: string; variants: MedusaVariant[] }>();

  for (const variant of variantsFromApi) {
    const rawColor = findColor(variant) ?? localMatch?.color ?? "Couleur unique";
    const knownColor = colorFromValue(rawColor);
    const colorName = knownColor?.name ?? rawColor;
    const groupKey = slugify(colorName) || "couleur-unique";
    const existing = groups.get(groupKey);
    if (existing) existing.variants.push(variant);
    else groups.set(groupKey, {
      name: colorName,
      hex: knownColor?.hex ?? "#777B79",
      variants: [variant],
    });
  }

  const groupedVariants: ProductVariant[] = [...groups.entries()]
    .sort(([, a], [, b]) => {
      const ai = KNOWN_COLORS.findIndex((color) => normalize(color.name) === normalize(a.name));
      const bi = KNOWN_COLORS.findIndex((color) => normalize(color.name) === normalize(b.name));
      return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi);
    })
    .map(([id, group]) => {
      const sizes = sortSizes(
        group.variants
         .map(findSize)
         .filter((size): size is string => Boolean(size))
      );
      const matchingLocalVariant = exactLocalProduct?.variants.find(
        (variant) => normalize(variant.name) === normalize(group.name)
      );
      return {
        id: matchingLocalVariant?.id ?? `color-${id}`,
        name: group.name,
        hex: group.hex,
        // Until color-specific galleries are configured, every color reuses this product's images.
        images: getVariantImages(group.variants, record.title),
        sizes: [],
        prototypeSizes: sizes.length ? sizes : (localMatch?.prototypeSizes ?? ["S", "M", "L", "XL"]),
      };
    });

  if (!groupedVariants.length) {
    const name = localMatch?.color ?? "Couleur unique";
    const known = colorFromValue(name);
    groupedVariants.push({
      id: `color-${slugify(name) || "default"}`,
      name,
      hex: known?.hex ?? "#777B79",
      images,
      sizes: [],
      prototypeSizes: localMatch?.prototypeSizes ?? ["S", "M", "L", "XL"],
    });
  }

  const pricedVariant = variantsFromApi.find((variant) => {
    const calculatedPrice = variant.calculated_price;
    return calculatedPrice && normalize(calculatedPrice.currency_code) === "mad" && calculatedPrice.calculated_amount !== null && calculatedPrice.calculated_amount !== undefined;
  });
  const rawAmount = pricedVariant?.calculated_price?.calculated_amount;
  const priceMad = typeof rawAmount === "number" ? rawAmount : typeof rawAmount === "string" ? Number(rawAmount) : null;
  const validPriceMad = priceMad !== null && Number.isFinite(priceMad) ? priceMad : null;
    // Keep display colour IDs separate from real Medusa variant IDs.
  const commerceVariants: CommerceVariantReference[] = variantsFromApi.flatMap((variant) => {
    const size = findSize(variant);
    if (!size) return [];

    const color = findColor(variant) ?? localMatch?.color ?? groupedVariants[0]?.name ?? "Couleur unique";
    const calculatedPrice = variant.calculated_price;
    const rawVariantAmount = calculatedPrice && normalize(calculatedPrice.currency_code) === "mad"
      ? calculatedPrice.calculated_amount
      : null;
    const numericVariantAmount = typeof rawVariantAmount === "number"
      ? rawVariantAmount
      : typeof rawVariantAmount === "string"
        ? Number(rawVariantAmount)
        : null;

    return [{
      id: variant.id,
      title: variant.title?.trim() || `${color} / ${size}`,
      sku: variant.sku ?? null,
      color,
      size,
      priceMad: numericVariantAmount !== null && Number.isFinite(numericVariantAmount)
        ? numericVariantAmount
        : null,
    }];
  }).sort((a, b) => compareSizes(a.size, b.size));
  const metadata = record.metadata ?? {};
  const collectionTitle = record.collection?.title?.trim();
  const typeTitle = record.type?.value?.trim() || record.type?.title?.trim();
  const tagNames = (record.tags ?? []).map((tag) => tag.name ?? tag.value ?? "").filter(Boolean);
  const labelFromMetadata = typeof metadata.label === "string" ? metadata.label : null;

  return {
    // Preserve local IDs for the original seven handles so existing cart/wishlist entries remain compatible.
    id: exactLocalProduct?.id ?? record.id,
    slug: record.handle,
    name: record.title,
    description: record.description?.trim() || localMatch?.description || "Une pièce de la collection FORGED 01.",
    collection: collectionTitle || localMatch?.collection || (typeTitle ? `FORGED 01 · ${typeTitle.toUpperCase()}` : "FORGED 01 · COLLECTION"),
    category: productCategory(record, localMatch),
    collections: productCollections(record, localMatch),
    image: images[0]?.src ?? "",
    color: groupedVariants[0]?.name ?? localMatch?.color ?? "Couleur unique",
    label: labelFromMetadata || localMatch?.label || record.subtitle?.trim() || tagNames.find((tag) => normalize(tag) !== "forged 01") || "FORGED 01",
    priceMad: validPriceMad,
    sizes: validPriceMad === null
      ? []
      : sortSizes(
         groupedVariants.flatMap((variant) => variant.prototypeSizes)
       ),
    prototypeSizes: sortSizes(
      groupedVariants.flatMap((variant) => variant.prototypeSizes)
    ),
    status: validPriceMad === null ? "concept" : "available",
    specifications: {
      fit: typeof metadata.fit === "string" ? metadata.fit : null,
      material: typeof metadata.material === "string" ? metadata.material : null,
      construction: typeof metadata.construction === "string" ? metadata.construction : null,
      care: typeof metadata.care === "string" ? metadata.care : null,
      sizeGuide: null,
    },
    variants: groupedVariants,
    medusaProductId: record.id,
    commerceVariants,
  };
}
const CATALOG_FAMILY_ORDER = [
  "t shirt oversize",
  "hoodie lourd",
  "t shirt compression",
  "marcel",
  "jogger lourd",
  "training shorts",
  "crop top manches longues",
  "brassiere",
  "legging seamless",
];

function sortCatalogProducts(a: Product, b: Product): number {
  const getKey = (product: Product) => {
    const text = normalize(`${product.slug} ${product.name}`);

    const familyIndex = CATALOG_FAMILY_ORDER.findIndex(
      (family) => text.includes(family)
    );

    const designMatch = text.match(/\bdesign\s*0?([1-3])\b/i);
    const designNumber = designMatch ? Number(designMatch[1]) : 1;

    return {
      family: familyIndex === -1 ? 999 : familyIndex,
      design: designNumber,
    };
  };

  const first = getKey(a);
  const second = getKey(b);

  return (
    first.family - second.family ||
    first.design - second.design ||
    a.name.localeCompare(b.name)
  );
}
/** Fetch published ANFA products from Medusa, while keeping the local catalogue as a safe fallback. */
export async function getStorefrontProducts(): Promise<Product[]> {
  const backendUrl = (
    process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
    "http://localhost:9000"
  ).replace(/\/+$/, "");

  const publishableKey =
    process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;

  if (!publishableKey) {
    console.error("[ANFA catalog] Medusa publishable key is missing.");
    return [];
  }

  const fields = [
    "*variants.options",
    "*variants.calculated_price",
    "*images",
    "*categories",
    "*collection",
    "*type",
    "*tags",
    "+metadata",
    "*variants.images",
  ].join(",");

  const query = new URLSearchParams({
     limit: "100",
     region_id: "reg_01M5ZS40Q027QDGECE9TRSJBBH",
     fields,
   });

  try {
    const response = await fetch(
      `${backendUrl}/store/products?${query.toString()}`,
      {
        headers: {
          "x-publishable-api-key": publishableKey,
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const details = await response.text();
      throw new Error(
        `Medusa returned HTTP ${response.status}: ${details}`
      );
    }

    const data = (await response.json()) as {
      products?: MedusaProductRecord[];
    };

    const records = data.products ?? [];
    const anfaRecords = records.filter(isAnfaProduct);

    console.info(
      `[ANFA catalog] Medusa returned ${records.length} products; ` +
      `${anfaRecords.length} matched as ANFA products.`
    );

    if (anfaRecords.length > 0) {
      return anfaRecords
       .map(mapMedusaProduct)
       .sort(sortCatalogProducts);
    }

    console.error(
      "[ANFA catalog] No ANFA products matched. Products received:",
      records.map((product) => ({
        title: product.title,
        handle: product.handle,
      }))
    );

    return localProducts;
  } catch (error) {
    console.error("[ANFA catalog] Medusa request failed:", error);
    return localProducts;
  }
}
