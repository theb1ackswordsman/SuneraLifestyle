import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { getServerSession } from "@/lib/auth/session";
import { RecentSearch } from "@/models/recent-search.model";
import { ok, badRequest, unauthorized, handleApiError } from "@/lib/api/response";

export const dynamic = "force-dynamic";

const MAX_RECENT = 10;

// ---------------------------------------------------------------------------
// GET /api/search/recent
// Returns the authenticated user's recent search queries (newest first).
// ---------------------------------------------------------------------------
export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session.isAuthenticated || !session.user) {
      return unauthorized();
    }

    await connectDB();

    const doc = await RecentSearch.findOne({ userId: session.user._id })
      .select("queries")
      .lean();

    const queries = (doc?.queries ?? []).map((entry) => entry.q);

    return ok({ queries });
  } catch (err) {
    return handleApiError(err);
  }
}

// ---------------------------------------------------------------------------
// POST /api/search/recent
// Adds a query to the user's recent searches (deduplicates, keeps newest 10).
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session.isAuthenticated || !session.user) {
      return unauthorized();
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return badRequest("Invalid JSON body");
    }

    if (
      typeof body !== "object" ||
      body === null ||
      typeof (body as Record<string, unknown>).q !== "string"
    ) {
      return badRequest("Body must contain a string field q");
    }

    const q = ((body as Record<string, unknown>).q as string)
      .replace(/[\x00-\x1F\x7F]/g, "")
      .trim();

    if (!q || q.length < 1) {
      return badRequest("q must not be empty");
    }
    if (q.length > 100) {
      return badRequest("q must not exceed 100 characters");
    }

    await connectDB();

    const userId = session.user._id;
    const now = new Date();

    // Fetch existing doc or create shell
    let doc = await RecentSearch.findOne({ userId });

    if (!doc) {
      doc = new RecentSearch({ userId, queries: [] });
    }

    // Remove existing entry with same q (case-insensitive)
    doc.queries = doc.queries.filter(
      (entry) => entry.q.toLowerCase() !== q.toLowerCase()
    );

    // Prepend new entry
    doc.queries.unshift({ q, searchedAt: now });

    // Trim to max
    if (doc.queries.length > MAX_RECENT) {
      doc.queries = doc.queries.slice(0, MAX_RECENT);
    }

    await doc.save();

    return ok({ queries: doc.queries.map((e) => e.q) });
  } catch (err) {
    return handleApiError(err);
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/search/recent
// Removes a specific query or clears all recent searches.
// ---------------------------------------------------------------------------
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session.isAuthenticated || !session.user) {
      return unauthorized();
    }

    await connectDB();

    const userId = session.user._id;

    let q: string | undefined;
    try {
      const body = await req.json();
      if (typeof body === "object" && body !== null && typeof (body as Record<string, unknown>).q === "string") {
        q = ((body as Record<string, unknown>).q as string).trim();
      }
    } catch {
      // Body is optional — missing/empty body is fine
    }

    if (q && q.length > 0) {
      // Remove specific query
      const doc = await RecentSearch.findOne({ userId });
      if (doc) {
        doc.queries = doc.queries.filter(
          (entry) => entry.q.toLowerCase() !== q!.toLowerCase()
        );
        await doc.save();
      }
    } else {
      // Clear all
      await RecentSearch.findOneAndUpdate(
        { userId },
        { $set: { queries: [] } }
      );
    }

    return ok({ message: "Recent searches updated" });
  } catch (err) {
    return handleApiError(err);
  }
}
