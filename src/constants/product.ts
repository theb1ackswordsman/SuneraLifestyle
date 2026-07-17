export const PRODUCT_CATEGORIES = {
  SUPPLEMENTS: "supplements",
  CLOTHING: "clothing",
  ACCESSORIES: "accessories",
} as const;

export const SUPPLEMENT_SUBCATEGORIES = [
  { label: "Whey Protein", value: "whey-protein", icon: "🥛" },
  { label: "Mass Gainer", value: "mass-gainer", icon: "💪" },
  { label: "Creatine", value: "creatine", icon: "⚡" },
  { label: "BCAA", value: "bcaa", icon: "🔬" },
  { label: "Pre Workout", value: "pre-workout", icon: "🔥" },
  { label: "Post Workout", value: "post-workout", icon: "🧪" },
  { label: "Multivitamins", value: "multivitamins", icon: "💊" },
  { label: "Fish Oil", value: "fish-oil", icon: "🐟" },
  { label: "Omega 3", value: "omega-3", icon: "🫀" },
  { label: "Ashwagandha", value: "ashwagandha", icon: "🌿" },
  { label: "Fat Burner", value: "fat-burner", icon: "🔥" },
  { label: "Sleep Support", value: "sleep-support", icon: "😴" },
  { label: "Immunity", value: "immunity", icon: "🛡️" },
  { label: "Joint Support", value: "joint-support", icon: "🦴" },
  { label: "Energy", value: "energy", icon: "⚡" },
  { label: "Gut Health", value: "gut-health", icon: "🌱" },
  { label: "Recovery", value: "recovery", icon: "🔄" },
  { label: "Vitamin D", value: "vitamin-d", icon: "☀️" },
  { label: "Calcium", value: "calcium", icon: "🥛" },
] as const;

export const CLOTHING_SUBCATEGORIES = [
  { label: "Gym T-Shirts", value: "gym-tshirts", icon: "👕" },
  { label: "Oversized T-Shirts", value: "oversized-tshirts", icon: "👕" },
  { label: "Tank Tops", value: "tank-tops", icon: "🎽" },
  { label: "Joggers", value: "joggers", icon: "👖" },
  { label: "Shorts", value: "shorts", icon: "🩳" },
  { label: "Compression Wear", value: "compression-wear", icon: "🧤" },
  { label: "Sports Bra", value: "sports-bra", icon: "👙" },
  { label: "Leggings", value: "leggings", icon: "🩱" },
  { label: "Hoodies", value: "hoodies", icon: "🧥" },
  { label: "Jackets", value: "jackets", icon: "🧥" },
  { label: "Gym Bags", value: "gym-bags", icon: "🎒" },
  { label: "Caps", value: "caps", icon: "🧢" },
  { label: "Shakers", value: "shakers", icon: "🧃" },
  { label: "Water Bottles", value: "water-bottles", icon: "🍶" },
  { label: "Accessories", value: "accessories", icon: "⌚" },
] as const;

export const CLOTHING_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"] as const;
export type ClothingSize = (typeof CLOTHING_SIZES)[number];

export const SUPPLEMENT_WEIGHTS = [
  "100g", "200g", "250g", "300g", "500g",
  "1kg", "1.5kg", "2kg", "3kg", "4kg", "5kg",
  "30 servings", "60 servings", "90 servings", "120 servings",
] as const;

export const COMMON_COLORS = [
  { label: "Black", value: "black", hex: "#000000" },
  { label: "White", value: "white", hex: "#FFFFFF" },
  { label: "Navy", value: "navy", hex: "#1B2A4A" },
  { label: "Grey", value: "grey", hex: "#9CA3AF" },
  { label: "Charcoal", value: "charcoal", hex: "#374151" },
  { label: "Olive", value: "olive", hex: "#6B7280" },
  { label: "Maroon", value: "maroon", hex: "#7F1D1D" },
  { label: "Forest Green", value: "forest-green", hex: "#14532D" },
  { label: "Royal Blue", value: "royal-blue", hex: "#1D4ED8" },
  { label: "Red", value: "red", hex: "#DC2626" },
  { label: "Orange", value: "orange", hex: "#EA580C" },
  { label: "Yellow", value: "yellow", hex: "#CA8A04" },
  { label: "Purple", value: "purple", hex: "#7C3AED" },
  { label: "Pink", value: "pink", hex: "#DB2777" },
] as const;

export const SUPPLEMENT_FLAVORS = [
  "Chocolate",
  "Vanilla",
  "Strawberry",
  "Mango",
  "Butterscotch",
  "Cookies & Cream",
  "Rocky Road",
  "Unflavored",
  "Banana",
  "Blueberry",
  "Mixed Berry",
  "Pineapple",
  "Watermelon",
  "Kesar Pista",
  "Café Mocha",
] as const;

export const GENDER_OPTIONS = [
  { label: "Men", value: "men" },
  { label: "Women", value: "women" },
  { label: "Unisex", value: "unisex" },
] as const;
