import mongoose from "mongoose";

// Read lazily inside connectDB() — do NOT throw at import time, otherwise any
// page importing this module (home, shop) would fail to build/render when the
// env var is absent (e.g. a fresh Vercel deploy before secrets are set).
const MONGODB_URI = process.env.MONGODB_URI;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var __mongooseCache: MongooseCache | undefined;
}

const cache: MongooseCache = globalThis.__mongooseCache ?? { conn: null, promise: null };

if (!globalThis.__mongooseCache) {
  globalThis.__mongooseCache = cache;
}

export async function connectDB(): Promise<typeof mongoose> {
  // 1 = connected. Ensure connection is active before returning
  if (cache.conn && cache.conn.connection.readyState === 1) return cache.conn;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set — database features are unavailable.");
  }

  if (!cache.promise || mongoose.connection.readyState === 0) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      maxPoolSize: 10,
      minPoolSize: 1,
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 30000,
      family: 4,
    };

    cache.promise = mongoose
      .connect(uri, opts)
      .then((m) => {
        return m;
      })
      .catch((err) => {
        cache.promise = null;
        cache.conn = null;
        console.error("[MongoDB] Connection failed:", err.message);
        throw err;
      });
  }

  cache.conn = await cache.promise;
  return cache.conn;
}

export async function disconnectDB(): Promise<void> {
  if (cache.conn) {
    await mongoose.disconnect();
    cache.conn = null;
    cache.promise = null;
  }
}

// Only register connection events in Node.js (server). In the browser
// mongoose is bundled but mongoose.connection is undefined, causing a crash.
if (typeof window === "undefined" && mongoose.connection) {
  mongoose.connection.on("disconnected", () => {
    console.warn("[MongoDB] Disconnected");
    cache.conn = null;
    cache.promise = null;
  });

  mongoose.connection.on("error", (err: Error) => {
    console.error("[MongoDB] Error:", err.message);
  });
}
