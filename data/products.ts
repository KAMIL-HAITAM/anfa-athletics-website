export type ProductStatus = "concept" | "upcoming" | "available" | "sold-out";

export type ProductImage = {
  id: string;
  src: string;
  alt: string;
};

/** A color-specific version of a product. Images stay in display order. */
export type ProductVariant = {
  id: string;
  name: string;
  hex: string;
  images: ProductImage[];
  /** Sizes customers can actually buy for this color. */
  sizes: string[];
  /** Proposed sizes shown for concepts only. */
  prototypeSizes: string[];
};

export type SizeGuideMeasurement = {
  label: string;
  values: Partial<Record<string, string>>;
};

export type ProductSizeGuideData = {
  sizes: string[];
  measurements: SizeGuideMeasurement[];
  note: string | null;
};

/** Optional factual details; keep values null until the product is confirmed. */
export type ProductSpecifications = {
  fit: string | null;
  material: string | null;
  construction: string | null;
  care: string | null;
  sizeGuide: ProductSizeGuideData | null;
};

export type CommerceVariantReference = {
  /** Real Medusa Product Variant ID for this exact color + size combination. */
  id: string;
  title: string;
  sku: string | null;
  color: string;
  size: string;
  priceMad: number | null;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  collection: string;
  category: "tops" | "bottoms" | "accessories";
  collections: ("homme" | "femme" | "nouveautes")[];
  /**
   * Compatibility fields used by existing collection and wishlist cards.
   * Keep these equal to the first variant's first image/name until those cards
   * are migrated to read variants directly.
   */
  image: string;
  color: string;
  label: string;
  priceMad: number | null;
  /** Compatibility fields for older components; variants own size availability. */
  sizes: string[];
  prototypeSizes: string[];
  status: ProductStatus;
  specifications: ProductSpecifications;
  variants: ProductVariant[];
  /** Real Medusa product ID. Missing on local fallback products. */
  medusaProductId?: string;
  /** Real, purchasable Medusa variants, one entry per color + size combination. */
  commerceVariants?: CommerceVariantReference[];

};

export const products: Product[] = [
  {
    id: "oversize-tshirt-black",
    slug: "t-shirt-oversize-noir",
    name: "T-shirt oversize",
    description: "Une silhouette ample et épurée, pensée pour un style urbain aux lignes structurées.",
    collection: "FORGED 01 · CORE STREETWEAR",
    category: "tops",
    collections: ["homme", "nouveautes"],
    image: "/images/products/homepage-oversize-tshirt-black-front.jpg",
    color: "Noir mat furtif",
    label: "ESSENTIEL",
    priceMad: null,
    sizes: [],
    prototypeSizes: ["S", "M", "L", "XL"],
    status: "concept",
    specifications: { fit: null, material: null, construction: null, care: null, sizeGuide: null },
    variants: [
      {
        id: "stealth-black",
        name: "Noir mat furtif",
        hex: "#171818",
        images: [{ id: "front", src: "/images/products/homepage-oversize-tshirt-black-front.jpg", alt: "T-shirt oversize noir mat furtif — vue de face" }],
        sizes: [],
        prototypeSizes: ["S", "M", "L", "XL"],
      },
    ],
  },
  {
    id: "heavy-hoodie-black",
    slug: "hoodie-lourd-noir",
    name: "Hoodie lourd structuré",
    description: "Un volume généreux et une esthétique affirmée, au cœur de l'identité brute de FORGED 01.",
    collection: "FORGED 01 · HEAVYWEIGHT",
    category: "tops",
    collections: ["homme", "nouveautes"],
    image: "/images/products/homepage-heavy-hoodie-stealth-black-front.jpg",
    color: "Noir mat furtif",
    label: "SIGNATURE",
    priceMad: null,
    sizes: [],
    prototypeSizes: ["S", "M", "L", "XL"],
    status: "concept",
    specifications: { fit: null, material: null, construction: null, care: null, sizeGuide: null },
    variants: [
      {
        id: "stealth-black",
        name: "Noir mat furtif",
        hex: "#171818",
        images: [{ id: "front", src: "/images/products/homepage-heavy-hoodie-stealth-black-front.jpg", alt: "Hoodie lourd noir mat furtif — vue de face" }],
        sizes: [],
        prototypeSizes: ["S", "M", "L", "XL"],
      },
    ],
  },
  {
    id: "heavy-jogger-black",
    slug: "jogger-lourd-noir",
    name: "Jogger lourd",
    description: "Une silhouette décontractée qui associe l'esprit streetwear à une approche minimaliste.",
    collection: "FORGED 01 · PERFORMANCE LIFESTYLE",
    category: "bottoms",
    collections: ["homme", "nouveautes"],
    image: "/images/products/homepage-heavy-jogger-matte-black-front.jpg",
    color: "Noir mat furtif",
    label: "MOVEMENT",
    priceMad: null,
    sizes: [],
    prototypeSizes: ["S", "M", "L", "XL"],
    status: "concept",
    specifications: { fit: null, material: null, construction: null, care: null, sizeGuide: null },
    variants: [
      {
        id: "stealth-black",
        name: "Noir mat furtif",
        hex: "#171818",
        images: [{ id: "front", src: "/images/products/homepage-heavy-jogger-matte-black-front.jpg", alt: "Jogger lourd noir mat furtif — vue de face" }],
        sizes: [],
        prototypeSizes: ["S", "M", "L", "XL"],
      },
    ],
  },
  {
    id: "compression-shirt-black",
    slug: "t-shirt-compression-noir",
    name: "T-shirt compression",
    description: "Une coupe près du corps et des lignes sobres, imaginées pour l'univers de l'entraînement.",
    collection: "FORGED 01 · PERFORMANCE TRAINING",
    category: "tops",
    collections: ["homme", "nouveautes"],
    image: "/images/products/homepage-compression-shirt-matte-black-front.jpg",
    color: "Noir mat furtif",
    label: "PERFORMANCE",
    priceMad: null,
    sizes: [],
    prototypeSizes: ["S", "M", "L", "XL"],
    status: "concept",
    specifications: { fit: null, material: null, construction: null, care: null, sizeGuide: null },
    variants: [
      {
        id: "stealth-black",
        name: "Noir mat furtif",
        hex: "#171818",
        images: [{ id: "front", src: "/images/products/homepage-compression-shirt-matte-black-front.jpg", alt: "T-shirt compression noir mat furtif — vue de face" }],
        sizes: [],
        prototypeSizes: ["S", "M", "L", "XL"],
      },
    ],
  },
  {
    id: "long-sleeve-crop-top-black",
    slug: "crop-top-manches-longues-noir",
    name: "Crop top manches longues",
    description: "Une coupe courte et des manches longues pour une silhouette sportive aux lignes nettes.",
    collection: "FORGED 01 · WOMENS TRAINING",
    category: "tops",
    collections: ["femme", "nouveautes"],
    image: "/images/products/homepage-long-sleeve-crop-top-matte-black-front.jpg",
    color: "Noir mat furtif",
    label: "SCULPT",
    priceMad: null,
    sizes: [],
    prototypeSizes: ["S", "M", "L", "XL"],
    status: "concept",
    specifications: { fit: null, material: null, construction: null, care: null, sizeGuide: null },
    variants: [
      {
        id: "stealth-black",
        name: "Noir mat furtif",
        hex: "#171818",
        images: [{ id: "front", src: "/images/products/homepage-long-sleeve-crop-top-matte-black-front.jpg", alt: "Crop top manches longues noir mat furtif — vue de face" }],
        sizes: [],
        prototypeSizes: ["S", "M", "L", "XL"],
      },
    ],
  },
  {
    id: "seamless-leggings-black",
    slug: "legging-seamless-noir",
    name: "Legging seamless",
    description: "Une silhouette près du corps et une esthétique épurée, pensée pour l'univers du training.",
    collection: "FORGED 01 · WOMENS TRAINING",
    category: "bottoms",
    collections: ["femme", "nouveautes"],
    image: "/images/products/homepage-seamless-leggings-matte-black-front.jpg",
    color: "Noir mat furtif",
    label: "PERFORMANCE",
    priceMad: null,
    sizes: [],
    prototypeSizes: ["S", "M", "L", "XL"],
    status: "concept",
    specifications: { fit: null, material: null, construction: null, care: null, sizeGuide: null },
    variants: [
      {
        id: "stealth-black",
        name: "Noir mat furtif",
        hex: "#171818",
        images: [{ id: "front", src: "/images/products/homepage-seamless-leggings-matte-black-front.jpg", alt: "Legging seamless noir mat furtif — vue de face" }],
        sizes: [],
        prototypeSizes: ["S", "M", "L", "XL"],
      },
    ],
  },
  {
    id: "seamless-sports-bra-black",
    slug: "brassiere-seamless-noir",
    name: "Brassière de sport seamless",
    description: "Un design minimaliste et une silhouette structurée, imaginés pour compléter la ligne training.",
    collection: "FORGED 01 · WOMENS TRAINING",
    category: "tops",
    collections: ["femme", "nouveautes"],
    image: "/images/products/homepage-seamless-sports-bra-matte-black-front.jpg",
    color: "Noir mat furtif",
    label: "SEAMLESS",
    priceMad: null,
    sizes: [],
    prototypeSizes: ["S", "M", "L", "XL"],
    status: "concept",
    specifications: { fit: null, material: null, construction: null, care: null, sizeGuide: null },
    variants: [
      {
        id: "stealth-black",
        name: "Noir mat furtif",
        hex: "#171818",
        images: [{ id: "front", src: "/images/products/homepage-seamless-sports-bra-matte-black-front.jpg", alt: "Brassière seamless noir mat furtif — vue de face" }],
        sizes: [],
        prototypeSizes: ["S", "M", "L", "XL"],
      },
    ],
  },
];
