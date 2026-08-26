/**
 * Centralized commodity configuration for CropCast.
 * Prevents accidental assignment of incorrect images or metadata across
 * dashboard commodity cards, market listings, selectors, and terminal views.
 */

export interface Commodity {
  id: string;
  name: string;
  image: string;
  altText: string;
  price: number;
  bestPrice: number;
  day: string;
  markets: string[];
}

export const COMMODITIES: Commodity[] = [
  {
    id: "rice",
    name: "Rice",
    image: "/images/crops/rice.jpg",
    altText: "Paddy and polished rice grains",
    price: 2360,
    bestPrice: 2430,
    day: "Thursday",
    markets: ["Guntur", "Tenali", "Vijayawada"],
  },
  {
    id: "maize",
    name: "Maize",
    image: "/images/crops/maize.jpg",
    altText: "Harvested golden yellow maize grain",
    price: 2240,
    bestPrice: 2360,
    day: "Thursday",
    markets: ["Narasaraopet", "Guntur", "Chilakaluripet"],
  },
  {
    id: "tomato",
    name: "Tomato",
    image: "/images/crops/tomato.jpg",
    altText: "Fresh ripe red mandi tomatoes",
    price: 2850,
    bestPrice: 3150,
    day: "Thursday",
    markets: ["Guntur", "Tenali", "Vijayawada"],
  },
  {
    id: "chilli",
    name: "Chilli",
    image: "/images/crops/chilli.jpg",
    altText: "Dried red Guntur chilli",
    price: 11200,
    bestPrice: 11600,
    day: "Thursday",
    markets: ["Guntur", "Khammam", "Warangal"],
  },
  {
    id: "onion",
    name: "Onion",
    image: "/images/crops/onion.jpg",
    altText: "Fresh red wholesale onions",
    price: 2490,
    bestPrice: 2630,
    day: "Thursday",
    markets: ["Kurnool", "Guntur", "Nandyal"],
  },
  {
    id: "potato",
    name: "Potato",
    image: "/images/crops/potato.jpg",
    altText: "Fresh harvested potatoes",
    price: 1760,
    bestPrice: 1890,
    day: "Thursday",
    markets: ["Vijayawada", "Guntur", "Eluru"],
  },
  {
    id: "cotton",
    name: "Cotton",
    image: "/images/crops/cotton.jpg",
    altText: "Raw cotton bolls",
    price: 7280,
    bestPrice: 7420,
    day: "Thursday",
    markets: ["Adoni", "Guntur", "Warangal"],
  },
  {
    id: "turmeric",
    name: "Turmeric",
    image: "/images/crops/turmeric.jpg",
    altText: "Turmeric",
    price: 12800,
    bestPrice: 13250,
    day: "Thursday",
    markets: ["Duggirala", "Nizamabad", "Erode"],
  },
];

export const COMMODITY_MAP: Record<string, Commodity> = COMMODITIES.reduce(
  (acc, crop) => {
    acc[crop.id.toLowerCase()] = crop;
    acc[crop.name.toLowerCase()] = crop;
    return acc;
  },
  {} as Record<string, Commodity>
);

export function getCommodity(nameOrId: string): Commodity {
  const key = (nameOrId || "").trim().toLowerCase();
  return COMMODITY_MAP[key] || COMMODITIES[0];
}

export function getCommodityImage(nameOrId: string): string {
  return getCommodity(nameOrId).image;
}

export function getCommodityAlt(nameOrId: string): string {
  return getCommodity(nameOrId).altText;
}
