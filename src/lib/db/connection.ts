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
  if (cache.conn) return cache.conn;

  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not set — database features are unavailable.");
  }
  const uri = MONGODB_URI;

  if (!cache.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4,
    };

    cache.promise = mongoose
      .connect(uri, opts)
      .then((m) => {
        console.warn("[MongoDB] Connected successfully");
        return m;
      })
      .catch((err) => {
        cache.promise = null;
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
