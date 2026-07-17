/**
 * Seed the real SunEra catalog (Ayurvedic wellness + women's ethnic wear) into MongoDB.
 *
 * Run:  npx tsx scripts/seed-catalog.ts
 *
 * - Requires a reachable MongoDB (see MONGODB_URI in .env). If Atlas rejects the
 *   connection, whitelist your IP: Atlas → Network Access → Add IP Address.
 * - Idempotent: upserts categories and products by slug, so it's safe to re-run.
 * - After seeding, manage everything from the admin panel (/admin/products).
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import mongoose from "mongoose";
import { Category } from "../src/models/category.model";
import { Product } from "../src/models/product.model";
import { MOCK_PRODUCTS } from "../src/data/mock/homepage";

// ── Load .env manually (avoids a hard dotenv dependency) ──────────────────────
function loadEnv() {
  try {
    const txt = readFileSync(path.resolve(process.cwd(), ".env"), "utf8");
    for (const line of txt.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && process.env[m[1]] === undefined) {
        process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    /* .env optional if vars already in environment */
  }
}
loadEnv();

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌  MONGODB_URI is not set in .env");
  process.exit(1);
}

const CATEGORY_ORDER = [
  "immunity", "digestive-care", "weight-management", "detox",
  "womens-care", "mens-wellness", "ayurvedic-medicine", "kurtis", "suits",
];

function skuFor(id: string) {
  return `SE-${id.padStart(3, "0")}`;
}

async function seed() {
  await mongoose.connect(MONGODB_URI as string);
  console.log("✅  Connected to MongoDB");

  // 1. Build the unique category set from the catalog
  const catMap = new Map<string, { name: string; image?: string }>();
  for (const p of MOCK_PRODUCTS) {
    if (!catMap.has(p.category)) {
      catMap.set(p.category, { name: p.categoryName, image: p.image });
    }
  }

  const slugToId = new Map<string, mongoose.Types.ObjectId>();
  for (const [slug, info] of catMap) {
    const order = CATEGORY_ORDER.indexOf(slug);
    const doc = await Category.findOneAndUpdate(
      { slug },
      {
        $set: {
          name: info.name,
          slug,
          image: info.image,
          isActive: true,
          order: order === -1 ? 99 : order,
          deletedAt: null,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    slugToId.set(slug, doc._id as mongoose.Types.ObjectId);
  }
  console.log(`✅  Upserted ${slugToId.size} categories`);

  // 2. Upsert products
  let count = 0;
  for (const p of MOCK_PRODUCTS) {
    const categoryId = slugToId.get(p.category);
    if (!categoryId) continue;

    const isClothing = "sizes" in p && Array.isArray(p.sizes);
    const variants = isClothing
      ? (p.sizes as string[]).map((size) => ({
          sku: `${skuFor(p.id)}-${size}`,
          size,
          price: p.price,
          compareAtPrice: p.compareAtPrice,
          stock: 25,
          images: [p.image],
        }))
      : [];

    await Product.findOneAndUpdate(
      { slug: p.slug },
      {
        $set: {
          name: p.name,
          slug: p.slug,
          description: p.description,
          shortDescription: p.shortDescription,
          category: categoryId,
          brand: "SunEra Lifestyle",
          sku: skuFor(p.id),
          images: p.images?.length ? p.images : [p.image],
          variants,
          basePrice: p.price,
          compareAtPrice: p.compareAtPrice,
          stock: 100,
          isActive: true,
          isFeatured: p.badge === "bestseller",
          isNewArrival: p.badge === "new",
          isBestSeller: p.badge === "bestseller",
          tags: [p.category, p.categoryName.toLowerCase()],
          benefits: p.highlights ?? [],
          ingredients: p.ingredients ?? [],
          directions: p.directions ?? undefined,
          warnings: p.warnings || undefined,
          manufacturingDetails: "Manufactured by Sweta Enterprises, Surat, Gujarat-394221. Marketed by SunEra Lifestyle.",
          gender: isClothing ? "women" : undefined,
          reviewSummary: {
            average: p.rating,
            count: p.reviewCount,
            distribution: [
              { star: 5, count: Math.round(p.reviewCount * 0.78) },
              { star: 4, count: Math.round(p.reviewCount * 0.15) },
              { star: 3, count: Math.round(p.reviewCount * 0.05) },
              { star: 2, count: Math.round(p.reviewCount * 0.01) },
              { star: 1, count: Math.round(p.reviewCount * 0.01) },
            ],
          },
          deletedAt: null,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    count++;
  }
  console.log(`✅  Upserted ${count} products`);

  // 3. Refresh productCount on each category
  for (const [slug, id] of slugToId) {
    const n = await Product.countDocuments({ category: id, deletedAt: null });
    await Category.updateOne({ _id: id }, { $set: { productCount: n } });
  }
  console.log("✅  Updated category product counts");

  console.log("\n🌿  SunEra catalog seeded successfully.");
  console.log("   Storefront : http://localhost:3000/shop");
  console.log("   Admin      : http://localhost:3000/admin/products\n");

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌  Seed failed:", err.message ?? err);
  process.exit(1);
});
