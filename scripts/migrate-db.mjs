/**
 * One-off database copy: SOURCE cluster  ➜  TARGET cluster.
 *
 * Copies every collection (all documents + indexes) from the database in
 * MONGODB_URI into the database in MONGODB_URI_TARGET. Existing collections on
 * the target are DROPPED first, so the target becomes an exact mirror of the
 * source. Safe to re-run.
 *
 * Usage (PowerShell, from the project root):
 *   node --env-file=.env scripts/migrate-db.mjs
 *
 * Required env vars (put them in .env):
 *   MONGODB_URI          → current/source connection string (already set)
 *   MONGODB_URI_TARGET   → the NEW connection string to copy into
 *
 * Optional:
 *   SRC_DB_NAME / TGT_DB_NAME → override the DB name if it's not in the URI
 *   --dry (or DRY_RUN=1)      → list what would be copied, change nothing
 */
import { MongoClient } from "mongodb";

// Dedicated migration vars keep this fully separate from the app's runtime
// MONGODB_URI, so the copy can never overwrite the wrong cluster.
const SOURCE_URI = process.env.MONGODB_SOURCE_URI || process.env.MONGODB_URI;
const TARGET_URI = process.env.MONGODB_TARGET_URI || process.env.MONGODB_URI_TARGET;
const DRY_RUN = process.env.DRY_RUN === "1" || process.argv.includes("--dry");
const BATCH = 1000;

function dbNameFromUri(uri, override) {
  if (override) return override;
  try {
    const path = new URL(uri).pathname.replace(/^\//, "").split("/")[0];
    return path || null;
  } catch {
    return null;
  }
}

function assert(cond, msg) {
  if (!cond) {
    console.error(`\n❌ ${msg}\n`);
    process.exit(1);
  }
}

async function main() {
  assert(SOURCE_URI, "MONGODB_SOURCE_URI (source, has the data) is not set in your .env");
  assert(TARGET_URI, "MONGODB_TARGET_URI (new/destination cluster) is not set in your .env");
  assert(
    SOURCE_URI.trim() !== TARGET_URI.trim(),
    "Source and target URIs are identical — refusing to run."
  );

  const srcDbName = dbNameFromUri(SOURCE_URI, process.env.SRC_DB_NAME);
  const tgtDbName = dbNameFromUri(TARGET_URI, process.env.TGT_DB_NAME);
  assert(srcDbName, "Could not determine source DB name. Set SRC_DB_NAME in .env.");
  assert(tgtDbName, "Could not determine target DB name. Set TGT_DB_NAME in .env.");

  console.log(`\n📦 Copying database`);
  console.log(`   source DB: ${srcDbName}`);
  console.log(`   target DB: ${tgtDbName}`);
  console.log(DRY_RUN ? "   mode: DRY RUN (no writes)\n" : "   mode: LIVE (target collections will be overwritten)\n");

  const srcClient = new MongoClient(SOURCE_URI);
  const tgtClient = new MongoClient(TARGET_URI);

  try {
    await srcClient.connect();
    await tgtClient.connect();
    const srcDb = srcClient.db(srcDbName);
    const tgtDb = tgtClient.db(tgtDbName);

    const collections = (await srcDb.listCollections().toArray())
      .filter((c) => c.type !== "view" && !c.name.startsWith("system."));

    assert(collections.length > 0, "No collections found in the source database.");
    console.log(`Found ${collections.length} collection(s): ${collections.map((c) => c.name).join(", ")}\n`);

    let grandTotal = 0;

    for (const { name } of collections) {
      const srcColl = srcDb.collection(name);
      const count = await srcColl.countDocuments();

      if (DRY_RUN) {
        console.log(`  • ${name}: ${count} document(s) — would copy`);
        grandTotal += count;
        continue;
      }

      const tgtColl = tgtDb.collection(name);

      // Make the target an exact mirror: drop any existing data first.
      await tgtColl.drop().catch(() => {}); // ignore "namespace not found"

      // Copy documents in batches.
      let copied = 0;
      if (count > 0) {
        const cursor = srcColl.find({}, { noCursorTimeout: false });
        let batch = [];
        for await (const doc of cursor) {
          batch.push(doc);
          if (batch.length >= BATCH) {
            await tgtColl.insertMany(batch, { ordered: false });
            copied += batch.length;
            batch = [];
            process.stdout.write(`\r  • ${name}: ${copied}/${count} copied`);
          }
        }
        if (batch.length) {
          await tgtColl.insertMany(batch, { ordered: false });
          copied += batch.length;
        }
      }
      process.stdout.write(`\r  • ${name}: ${copied}/${count} copied`);

      // Recreate indexes (skip the automatic _id_ index).
      const indexes = await srcColl.indexes();
      let idxCount = 0;
      for (const idx of indexes) {
        if (idx.name === "_id_") continue;
        const { key, name: idxName, v, ns, background, ...options } = idx;
        try {
          await tgtColl.createIndex(key, { name: idxName, ...options });
          idxCount++;
        } catch (e) {
          console.warn(`\n    ⚠ index "${idxName}" on ${name} skipped: ${e.message}`);
        }
      }
      console.log(`  (+${idxCount} index${idxCount === 1 ? "" : "es"})`);
      grandTotal += copied;
    }

    console.log(
      DRY_RUN
        ? `\n✅ Dry run complete. ${grandTotal} document(s) would be copied.\n`
        : `\n✅ Migration complete. ${grandTotal} document(s) copied to the new cluster.\n`
    );
  } finally {
    await srcClient.close().catch(() => {});
    await tgtClient.close().catch(() => {});
  }
}

main().catch((err) => {
  console.error("\n❌ Migration failed:", err.message);
  process.exit(1);
});
