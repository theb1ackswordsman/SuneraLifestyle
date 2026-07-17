import { STOCK, img } from "./images";

const W = STOCK.wellness;
const E = STOCK.ethnic;

// ─── Collections ───────────────────────────────────────────────────────────────
export const COLLECTIONS = [
  {
    slug: "immunity",
    title: "Immunity & Kadha",
    description: "Herbal kadha and boosters to strengthen your natural defences.",
    href: "/shop?category=immunity",
    image: img(W.herbs, 1000),
    count: 8,
  },
  {
    slug: "detox",
    title: "Detox & Cleanse",
    description: "Gentle herbal teas to cleanse the body and feel light.",
    href: "/shop?category=detox",
    image: img(W.tea, 1000),
    count: 6,
  },
  {
    slug: "weight-management",
    title: "Weight Management",
    description: "Slim Fit and metabolism-supporting Ayurvedic formulas.",
    href: "/shop?category=weight-management",
    image: img(W.powder, 1000),
    count: 5,
  },
  {
    slug: "digestive-care",
    title: "Digestive Care",
    description: "Churna remedies for digestion, gas and gut comfort.",
    href: "/shop?category=digestive-care",
    image: img(W.powderScoop, 1000),
    count: 6,
  },
  {
    slug: "womens-care",
    title: "Women's Care",
    description: "Ayurvedic wellness crafted for women's health.",
    href: "/shop?category=womens-care",
    image: img(W.spa, 1000),
    count: 5,
  },
  {
    slug: "ethnic-wear",
    title: "Kurtis & Suits",
    description: "Handpicked kurtis and suit sets in cotton and silk blends.",
    href: "/shop?category=kurtis",
    image: img(E.kurti, 1000),
    count: 24,
  },
];

// ─── Blog posts ────────────────────────────────────────────────────────────────
export const BLOG_POSTS = [
  {
    slug: "ayurvedic-herbs-for-immunity",
    title: "5 Ayurvedic Herbs to Boost Your Immunity Naturally",
    excerpt: "Tulsi, Giloy, Ashwagandha and more — the time-tested herbs that help your body defend itself, and how to use them.",
    category: "Immunity",
    author: "Vaidya Anjali Rao",
    date: "July 10, 2026",
    readTime: "6 min read",
    image: img(W.herbs, 1200),
  },
  {
    slug: "science-of-herbal-detox",
    title: "The Ancient Science of Detox: How Herbal Teas Cleanse the Body",
    excerpt: "Detox isn't a fad — Ayurveda has used gentle herbal cleansing for centuries. Here's how a daily detox tea helps.",
    category: "Detox",
    author: "Dr. Ramesh Iyer",
    date: "July 4, 2026",
    readTime: "5 min read",
    image: img(W.tea, 1200),
  },
  {
    slug: "ayurvedic-weight-management",
    title: "The Ayurvedic Approach to Healthy Weight Management",
    excerpt: "Sustainable weight balance is about digestion and metabolism, not crash diets. How herbs like Triphala and Giloy help.",
    category: "Wellness",
    author: "Vaidya Anjali Rao",
    date: "June 28, 2026",
    readTime: "7 min read",
    image: img(W.powder, 1200),
  },
  {
    slug: "churna-for-digestion",
    title: "Digestive Health: Simple Churna Remedies for Gut Comfort",
    excerpt: "Bloating, gas and acidity have gentle Ayurvedic answers. A guide to churnas and when to take them.",
    category: "Digestive Care",
    author: "Dr. Ramesh Iyer",
    date: "June 20, 2026",
    readTime: "5 min read",
    image: img(W.powderScoop, 1200),
  },
  {
    slug: "womens-wellness-ayurveda",
    title: "Women's Wellness: Balancing Health the Ayurvedic Way",
    excerpt: "From energy to hormonal balance, classical herbs like Shatavari and Ashoka have supported women for generations.",
    category: "Women's Care",
    author: "Vaidya Anjali Rao",
    date: "June 12, 2026",
    readTime: "6 min read",
    image: img(W.spa, 1200),
  },
  {
    slug: "styling-ethnic-wear",
    title: "Styling Ethnic Wear: Kurtis & Suits for Every Occasion",
    excerpt: "From breezy cotton kurtis for the office to silk-blend suit sets for festivities — a simple styling guide.",
    category: "Lifestyle",
    author: "Sneha Kulkarni",
    date: "June 5, 2026",
    readTime: "4 min read",
    image: img(E.kurti, 1200),
  },
];
