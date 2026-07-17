export const siteConfig = {
  name: "SunEra Lifestyle",
  tagline: "Way to Wellness",
  description:
    "100% natural Ayurvedic wellness products and women's ethnic wear. Trusted herbal formulas — Detox Tea, Immunity Kadha, Slim Fit Powder, Sanjivani Dravya and more — plus handpicked kurtis and suit sets. स्वस्थ जीवन, खुशहाल जीवन.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "https://sunera.in",
  ogImage: "/images/og-image.jpg",
  keywords: [
    "ayurvedic products",
    "herbal supplements",
    "immunity kadha",
    "detox tea",
    "slim fit powder",
    "digestive churna",
    "sanjivani dravya",
    "women care ayurvedic",
    "men's vitality",
    "kurtis",
    "salwar suit sets",
    "women ethnic wear",
    "sunera",
    "sunera lifestyle",
    "ayurveda india",
  ],
  authors: [{ name: "SunEra Lifestyle", url: "https://sunera.in" }],
  creator: "SunEra Lifestyle",
  social: {
    instagram: "https://instagram.com/sunera_lifestyle",
    twitter: "https://twitter.com/sunera_lifestyle",
    facebook: "https://facebook.com/suneralifestyle",
    youtube: "https://youtube.com/@suneralifestyle",
  },
  contact: {
    email: "suneralifestyle@gmail.com",
    phone: "+91 91355 64607",
    address: "Surat, Gujarat, India",
  },
  business: {
    gst: "27AXXXX1234X1ZX",
    cin: "U52100MH2024PTC000001",
  },
  currency: {
    code: "INR",
    symbol: "₹",
    locale: "en-IN",
  },
  shipping: {
    freeAbove: 999,
    standardFee: 99,
    expressFee: 199,
    estimatedDays: { standard: "5-7", express: "2-3" },
  },
  policies: {
    returnDays: 7,
    exchangeDays: 15,
  },
} as const;

export type SiteConfig = typeof siteConfig;
