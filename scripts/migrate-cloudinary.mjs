/**
 * Migrate every image from the OLD Cloudinary account to a NEW one, and rewrite
 * all image URLs stored in MongoDB (across every collection/field).
 *
 * Modes:
 *   node --env-file=.env scripts/migrate-cloudinary.mjs --scan   # read-only: list what would move
 *   node --env-file=.env scripts/migrate-cloudinary.mjs --dry    # plan uploads+DB edits, no writes
 *   node --env-file=.env scripts/migrate-cloudinary.mjs          # LIVE: upload + rewrite DB
 *
 * Env (OLD account = your existing CLOUDINARY_* vars):
 *   CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET
 * Env (NEW account — add these to .env):
 *   CLOUDINARY_NEW_CLOUD_NAME / CLOUDINARY_NEW_API_KEY / CLOUDINARY_NEW_API_SECRET
 *
 * DB is taken from MONGODB_URI (currently your new cluster, which holds the data).
 */
import { MongoClient } from "mongodb";
import { v2 as cloudinary } from "cloudinary";

const MODE = process.argv.includes("--scan") ? "scan"
           : process.argv.includes("--dry")  ? "dry"
           : "live";

const OLD_CLOUD = process.env.CLOUDINARY_CLOUD_NAME;
const NEW_CLOUD = process.env.CLOUDINARY_NEW_CLOUD_NAME;
const MONGODB_URI = process.env.MONGODB_URI;

function die(msg) { console.error(`\n❌ ${msg}\n`); process.exit(1); }
if (!MONGODB_URI) die("MONGODB_URI is not set.");
if (!OLD_CLOUD) die("CLOUDINARY_CLOUD_NAME (old account) is not set.");

const OLD_MARKER = `res.cloudinary.com/${OLD_CLOUD}/`;

// Configure the NEW account for uploads (not needed for --scan).
if (MODE !== "scan") {
  if (!NEW_CLOUD || !process.env.CLOUDINARY_NEW_API_KEY || !process.env.CLOUDINARY_NEW_API_SECRET) {
    die("New account creds missing. Set CLOUDINARY_NEW_CLOUD_NAME / CLOUDINARY_NEW_API_KEY / CLOUDINARY_NEW_API_SECRET in .env.");
  }
  cloudinary.config({
    cloud_name: NEW_CLOUD,
    api_key: process.env.CLOUDINARY_NEW_API_KEY,
    api_secret: process.env.CLOUDINARY_NEW_API_SECRET,
    secure: true,
  });
}

const isOldUrl = (v) => typeof v === "string" && v.includes(OLD_MARKER);

/** public_id (folder path, no extension) from a Cloudinary delivery URL. */
function publicIdFromUrl(url) {
  const after = url.split("/upload/")[1];
  if (!after) return null;
  const clean = after.split("?")[0].split("#")[0];
  const parts = clean.split("/");
  const vIdx = parts.findIndex((p) => /^v\d+$/.test(p));
  const idParts = vIdx >= 0 ? parts.slice(vIdx + 1) : parts;
  return idParts.join("/").replace(/\.[^./]+$/, "");
}

/** Walk any JSON-ish value; call fn(str) on every string. Returns replaced clone if map given. */
function transform(value, fn) {
  if (typeof value === "string") return fn(value);
  if (Array.isArray(value)) return value.map((v) => transform(v, fn));
  if (value && typeof value === "object" && value.constructor === Object) {
    const out = {};
    for (const k of Object.keys(value)) out[k] = transform(value[k], fn);
    return out;
  }
  return value; // leave ObjectId, Date, Buffer, primitives untouched
}

async function main() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db();
  console.log(`\n🖼  Cloudinary migration — mode: ${MODE.toUpperCase()}`);
  console.log(`   DB: ${db.databaseName}`);
  console.log(`   old cloud: ${OLD_CLOUD}${MODE !== "scan" ? `  →  new cloud: ${NEW_CLOUD}` : ""}\n`);

  const collections = (await db.listCollections().toArray())
    .filter((c) => c.type !== "view" && !c.name.startsWith("system."));

  // Pass 1: find every unique old URL + which docs contain them.
  const urlSet = new Set();
  const perColl = {};
  const docsWithUrls = []; // { coll, _id }

  for (const { name } of collections) {
    const docs = await db.collection(name).find({}).toArray();
    for (const doc of docs) {
      const found = [];
      transform(doc, (s) => { if (isOldUrl(s)) { found.push(s); urlSet.add(s); } return s; });
      if (found.length) {
        perColl[name] = (perColl[name] || 0) + found.length;
        docsWithUrls.push({ coll: name, _id: doc._id });
      }
    }
  }

  console.log(`Found ${urlSet.size} unique image(s) across ${docsWithUrls.length} document(s):`);
  for (const [coll, n] of Object.entries(perColl)) console.log(`  • ${coll}: ${n} URL reference(s)`);
  if (urlSet.size === 0) { console.log("\nNothing to migrate."); await client.close(); return; }

  if (MODE === "scan") {
    console.log("\n(sample URLs)");
    [...urlSet].slice(0, 5).forEach((u) => console.log("  -", u));
    console.log("\nScan only — no uploads or DB changes made.\n");
    await client.close();
    return;
  }

  // Pass 2: upload each unique image to the new account, build old→new map.
  const map = new Map();
  let i = 0;
  for (const oldUrl of urlSet) {
    i++;
    const publicId = publicIdFromUrl(oldUrl);
    if (MODE === "dry") {
      console.log(`  [${i}/${urlSet.size}] would upload → public_id: ${publicId}`);
      map.set(oldUrl, `https://res.cloudinary.com/${NEW_CLOUD}/image/upload/<new>/${publicId}`);
      continue;
    }
    try {
      const res = await cloudinary.uploader.upload(oldUrl, {
        public_id: publicId,       // keep the same folder/name
        overwrite: true,
        resource_type: "image",
        invalidate: true,
      });
      map.set(oldUrl, res.secure_url);
      process.stdout.write(`\r  uploaded ${i}/${urlSet.size}`);
    } catch (e) {
      console.error(`\n  ⚠ failed to upload ${oldUrl}: ${e.message}`);
    }
  }
  process.stdout.write("\n");

  // Pass 3: rewrite DB documents using the map.
  let updated = 0;
  for (const { coll, _id } of docsWithUrls) {
    const doc = await db.collection(coll).findOne({ _id });
    if (!doc) continue;
    const newDoc = transform(doc, (s) => (map.get(s) ?? s));
    if (MODE === "dry") { updated++; continue; }
    delete newDoc._id;
    await db.collection(coll).replaceOne({ _id }, newDoc);
    updated++;
  }

  console.log(
    MODE === "dry"
      ? `\n✅ Dry run: would upload ${urlSet.size} image(s) and update ${updated} document(s).\n`
      : `\n✅ Done: uploaded ${map.size} image(s), updated ${updated} document(s) to the new cloud.\n`
  );
  await client.close();
}

main().catch((e) => { console.error("\n❌ Migration failed:", e); process.exit(1); });
