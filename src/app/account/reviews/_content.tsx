"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Star, Edit2, Trash2, Check, X, Loader2, Package,
  MessageSquare, PenLine, AlertCircle, ShoppingBag, ArrowLeft, ChevronRight, Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReviewItem {
  _id: string;
  rating: number;
  title?: string;
  body: string;
  images: string[];
  status: "pending" | "approved" | "rejected" | "hidden";
  rejectionReason?: string;
  createdAt: string;
  productId?: { _id: string; name: string; slug: string; images: string[] };
}

interface OrderItem {
  productId: string;
  name: string;
  image: string;
  slug: string;
  quantity: number;
}

interface DeliveredOrder {
  _id: string;
  items: OrderItem[];
  status: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "h-4 w-4",
            i < rating ? "fill-amber-400 text-amber-400" : "text-gray-200"
          )}
        />
      ))}
    </div>
  );
}

function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => {
        const star = i + 1;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="p-0.5 transition-transform hover:scale-110"
          >
            <Star
              className={cn(
                "h-6 w-6 transition-colors",
                star <= (hover || value)
                  ? "fill-amber-400 text-amber-400"
                  : "text-gray-200 hover:text-amber-200"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const STATUS_BADGE: Record<string, string> = {
  pending:  "bg-yellow-100 text-yellow-700 border-yellow-200",
  approved: "bg-green-100 text-green-700 border-green-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
  hidden:   "bg-gray-100 text-gray-600 border-gray-200",
};

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ReviewsContent() {
  const [myReviews,      setMyReviews]      = useState<ReviewItem[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [orders,         setOrders]         = useState<DeliveredOrder[]>([]);
  const [ordersLoading,  setOrdersLoading]  = useState(true);
  const [editingId,      setEditingId]      = useState<string | null>(null);
  const [editForm,       setEditForm]       = useState<{ rating: number; title: string; body: string }>({
    rating: 5, title: "", body: "",
  });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [deletingId,     setDeletingId]     = useState<string | null>(null);

  // New review state
  const [writingProductId, setWritingProductId] = useState<string | null>(null);
  const [writeRating, setWriteRating] = useState(5);
  const [writeTitle, setWriteTitle] = useState("");
  const [writeBody, setWriteBody] = useState("");
  const [writeImages, setWriteImages] = useState<File[]>([]);
  const [writePreviews, setWritePreviews] = useState<string[]>([]);
  const [writeSubmitting, setWriteSubmitting] = useState(false);
  const [writeError, setWriteError] = useState("");
  const [writeSuccess, setWriteSuccess] = useState("");

  function startWritingReview(item: OrderItem) {
    const pId = item.productId || (item as unknown as { _id: string })._id;
    setWritingProductId(pId);
    setWriteRating(5);
    setWriteTitle("");
    setWriteBody("");
    setWriteImages([]);
    setWritePreviews([]);
    setWriteError("");
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    const files = Array.from(e.target.files).slice(0, 4 - writeImages.length);
    if (!files.length) return;
    setWriteImages((prev) => [...prev, ...files]);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setWritePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  }

  function removeImage(index: number) {
    setWriteImages((prev) => prev.filter((_, i) => i !== index));
    setWritePreviews((prev) => prev.filter((_, i) => i !== index));
  }

  async function submitNewReview(item: OrderItem) {
    if (writeRating === 0) { setWriteError("Please select a star rating."); return; }
    if (!writeBody.trim()) { setWriteError("Please write a review comment."); return; }
    setWriteSubmitting(true);
    setWriteError("");

    const uploadedUrls: string[] = [];
    if (writeImages.length > 0) {
      for (const file of writeImages) {
        const fd = new FormData();
        fd.append("file", file);
        try {
          const res = await fetch("/api/upload", { method: "POST", body: fd });
          const json = await res.json();
          if (json.success) uploadedUrls.push(json.url);
          else if (json.url) uploadedUrls.push(json.url);
        } catch {
          // silent fallback
        }
      }
    }

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: item.productId,
          slug:      item.slug,
          rating:    writeRating,
          title:     writeTitle.trim() || undefined,
          body:      writeBody.trim(),
          images:    uploadedUrls.length ? uploadedUrls : writePreviews,
        }),
      });

      const json = await res.json();
      if (res.ok || json.success) {
        setWriteSuccess("Review submitted! Thank you for your feedback.");
        setWritingProductId(null);
        // Refresh reviews
        fetch("/api/reviews?mine=true")
          .then((r) => r.json())
          .then((j) => setMyReviews(j.data?.reviews ?? []));
      } else {
        setWriteError(json.error ?? json.message ?? "Failed to submit review.");
      }
    } catch {
      setWriteError("Something went wrong. Please try again.");
    } finally {
      setWriteSubmitting(false);
    }
  }

  useEffect(() => {
    fetch("/api/reviews?mine=true")
      .then((r) => r.json())
      .then((j) => setMyReviews(j.data?.reviews ?? []))
      .finally(() => setLoading(false));

    fetch("/api/user/orders")
      .then((r) => r.json())
      .then((j) => {
        const all: DeliveredOrder[] = j.data ?? [];
        setOrders(all.filter((o) => o.status === "delivered"));
      })
      .finally(() => setOrdersLoading(false));
  }, []);

  // Deduplicated items from delivered orders not yet reviewed
  const reviewedProductIds = new Set<string>();
  const reviewedSlugs = new Set<string>();

  for (const r of myReviews) {
    if (r.productId) {
      if (typeof r.productId === "string") {
        reviewedProductIds.add(r.productId);
      } else {
        if (r.productId._id) reviewedProductIds.add(String(r.productId._id));
        if (r.productId.slug) reviewedSlugs.add(r.productId.slug);
      }
    }
  }

  const seenSlugs = new Set<string>();
  const toReview: OrderItem[] = [];
  for (const order of orders) {
    for (const item of order.items) {
      const pId = item.productId || (item as unknown as { _id: string })._id;
      const isAlreadyReviewed =
        (pId && reviewedProductIds.has(String(pId))) ||
        (item.slug && reviewedSlugs.has(item.slug));

      if (!isAlreadyReviewed && !seenSlugs.has(item.slug)) {
        seenSlugs.add(item.slug);
        toReview.push({ ...item, productId: pId });
      }
    }
  }

  function handleEdit(review: ReviewItem) {
    setEditingId(review._id);
    setEditForm({
      rating: review.rating,
      title:  review.title ?? "",
      body:   review.body,
    });
  }

  async function submitEdit(id: string) {
    setEditSubmitting(true);
    try {
      const res  = await fetch(`/api/reviews/${id}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(editForm),
      });
      const json = await res.json();
      if (json.success) {
        setMyReviews((prev) =>
          prev.map((r) =>
            r._id === id
              ? { ...r, ...editForm, status: "pending" as const }
              : r
          )
        );
        setEditingId(null);
      }
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res  = await fetch(`/api/reviews/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setMyReviews((prev) => prev.filter((r) => r._id !== id));
      }
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="container-padded pt-28 sm:pt-32 pb-16">
      <div className="max-w-3xl mx-auto">
        {/* Back link */}
        <Link
          href="/account"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Account
        </Link>

        {/* Page heading */}
        <div className="flex items-center gap-3 mb-8">

          <div>
            <h1 className="text-2xl font-black text-foreground">My Reviews</h1>
            {!loading && (
              <p className="text-xs text-muted-foreground">
                {myReviews.length} review{myReviews.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        </div>

        {/* ── Section 1: Your Reviews ── */}
        <div className="mb-10">
          <h2 className="text-base font-bold text-foreground mb-4">Your Reviews</h2>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />
              ))}
            </div>
          ) : myReviews.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-12 flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-50 mb-5">
                <PenLine className="h-8 w-8 text-purple-300" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-2">No reviews yet</h3>
              <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                You haven&apos;t written any reviews yet. Share your experience after receiving
                an order — your feedback helps others.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {myReviews.map((review) => (
                <div
                  key={review._id}
                  className="rounded-2xl border border-border bg-background overflow-hidden"
                >
                  {/* Card header */}
                  <div className="p-3.5 sm:p-4 flex items-start gap-3 sm:gap-4">
                    {/* Product thumbnail */}
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {review.productId?.images?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={review.productId.images[0]}
                          alt={review.productId.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <ShoppingBag className="h-4 w-4 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          {review.productId ? (
                            <Link
                              href={`/product/${review.productId.slug}`}
                              className="text-xs sm:text-sm font-semibold text-foreground hover:text-[#1a5c14] transition-colors line-clamp-1"
                            >
                              {review.productId.name}
                            </Link>
                          ) : (
                            <p className="text-xs sm:text-sm font-semibold text-muted-foreground">
                              Product unavailable
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <StarDisplay rating={review.rating} />
                            <span className="text-[11px] sm:text-xs text-muted-foreground">
                              {fmtDate(review.createdAt)}
                            </span>
                          </div>
                        </div>

                        <span
                          className={cn(
                            "shrink-0 rounded-full border px-2 py-0.5 text-[10px] sm:text-[11px] font-bold uppercase",
                            STATUS_BADGE[review.status] ?? "bg-gray-100 text-gray-600 border-gray-200"
                          )}
                        >
                          {review.status}
                        </span>
                      </div>

                      {/* Body preview */}
                      {review.title && (
                        <p className="mt-2 text-sm font-semibold text-foreground line-clamp-1">
                          {review.title}
                        </p>
                      )}
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                        {review.body}
                      </p>

                      {/* Rejection reason */}
                      {review.status === "rejected" && review.rejectionReason && (
                        <div className="mt-2 flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2">
                          <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                          <p className="text-xs text-red-700 capitalize">
                            {review.rejectionReason.replace(/_/g, " ")}
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          onClick={() =>
                            editingId === review._id
                              ? setEditingId(null)
                              : handleEdit(review)
                          }
                          className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(review._id)}
                          disabled={deletingId === review._id}
                          className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors disabled:opacity-60"
                        >
                          {deletingId === review._id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Inline edit form */}
                  {editingId === review._id && (
                    <div className="border-t border-border px-4 pb-4 pt-4 space-y-4 bg-muted/20">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Edit Review
                      </p>

                      {/* Star rating */}
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">
                          Rating
                        </label>
                        <StarInput
                          value={editForm.rating}
                          onChange={(v) => setEditForm((p) => ({ ...p, rating: v }))}
                        />
                      </div>

                      {/* Title */}
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-1.5">
                          Title{" "}
                          <span className="text-muted-foreground font-normal">(optional)</span>
                        </label>
                        <input
                          type="text"
                          value={editForm.title}
                          onChange={(e) =>
                            setEditForm((p) => ({ ...p, title: e.target.value }))
                          }
                          placeholder="Summarise your experience"
                          maxLength={120}
                          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:border-[#1a5c14] focus:ring-2 focus:ring-[#1a5c14]/20 focus:outline-none"
                        />
                      </div>

                      {/* Body */}
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-1.5">
                          Review <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={editForm.body}
                          onChange={(e) =>
                            setEditForm((p) => ({ ...p, body: e.target.value }))
                          }
                          placeholder="Share your experience with this product…"
                          rows={4}
                          maxLength={2000}
                          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm resize-none focus:border-[#1a5c14] focus:ring-2 focus:ring-[#1a5c14]/20 focus:outline-none"
                        />
                      </div>

                      {/* Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => submitEdit(review._id)}
                          disabled={editSubmitting || !editForm.body.trim()}
                          className="flex items-center gap-1.5 rounded-xl bg-[#1a5c14] px-4 py-2 text-sm font-semibold text-white hover:bg-[#15490f] transition-colors disabled:opacity-60"
                        >
                          {editSubmitting ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Check className="h-3.5 w-3.5" />
                          )}
                          Save Changes
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Section 2: Write a Review ── */}
        <div>
          <h2 className="text-base font-bold text-foreground mb-4">Write a Review</h2>

          {writeSuccess && (
            <div className="mb-4 flex items-center justify-between rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm font-medium text-[#1a5c14]">
              <span>{writeSuccess}</span>
              <button onClick={() => setWriteSuccess("")}><X className="h-4 w-4" /></button>
            </div>
          )}

          {ordersLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted" />
              ))}
            </div>
          ) : toReview.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-10 flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-50 mb-4">
                <Check className="h-7 w-7 text-green-500" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-1">
                You&apos;ve reviewed everything!
              </h3>
              <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                You&apos;ve reviewed all your delivered products. Shop more to leave new reviews.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {toReview.map((item) => (
                <div
                  key={item.slug}
                  className="rounded-2xl border border-border bg-background p-3.5 sm:p-4 space-y-3 sm:space-y-4 transition-all"
                >
                  {/* Product row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                        {item.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Package className="h-4 w-4 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-foreground line-clamp-1">
                          {item.name}
                        </p>
                        <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                          Qty purchased: {item.quantity}
                        </p>
                      </div>
                    </div>

                    {writingProductId !== item.productId ? (
                      <button
                        onClick={() => startWritingReview(item)}
                        className="self-start sm:self-auto flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-[#1a5c14]/40 bg-[#1a5c14]/5 px-3.5 py-2 text-xs font-semibold text-[#1a5c14] hover:bg-[#1a5c14]/10 transition-colors whitespace-nowrap"
                      >
                        <PenLine className="h-3.5 w-3.5" />
                        Write a Review
                      </button>
                    ) : (
                      <button
                        onClick={() => setWritingProductId(null)}
                        className="self-start sm:self-auto text-xs text-muted-foreground hover:text-foreground font-medium px-2 py-1"
                      >
                        Cancel
                      </button>
                    )}
                  </div>

                  {/* Inline Review Writing Card */}
                  {writingProductId === item.productId && (
                    <div className="border-t border-border pt-4 space-y-4 bg-muted/20 -mx-4 -mb-4 p-4 rounded-b-2xl">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Write Review for {item.name}
                      </p>

                      {writeError && (
                        <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-600">
                          <AlertCircle className="h-4 w-4 shrink-0" />
                          <span>{writeError}</span>
                        </div>
                      )}

                      {/* Star Rating */}
                      <div>
                        <label className="block text-xs font-semibold text-foreground mb-1.5">
                          Rating <span className="text-red-500">*</span>
                        </label>
                        <StarInput value={writeRating} onChange={setWriteRating} />
                      </div>

                      {/* Title */}
                      <div>
                        <label className="block text-xs font-semibold text-foreground mb-1">
                          Headline / Title <span className="text-muted-foreground font-normal">(optional)</span>
                        </label>
                        <input
                          type="text"
                          value={writeTitle}
                          onChange={(e) => setWriteTitle(e.target.value)}
                          placeholder="Summarise your experience (e.g. Excellent quality!)"
                          maxLength={120}
                          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-[#1a5c14] focus:ring-2 focus:ring-[#1a5c14]/20 focus:outline-none"
                        />
                      </div>

                      {/* Comment / Body */}
                      <div>
                        <label className="block text-xs font-semibold text-foreground mb-1">
                          Written Review <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={writeBody}
                          onChange={(e) => setWriteBody(e.target.value)}
                          placeholder="Tell us what you liked or disliked about this product..."
                          rows={3}
                          maxLength={2000}
                          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm resize-none focus:border-[#1a5c14] focus:ring-2 focus:ring-[#1a5c14]/20 focus:outline-none"
                        />
                      </div>

                      {/* Image Upload */}
                      <div>
                        <label className="block text-xs font-semibold text-foreground mb-1.5">
                          Add Photos <span className="text-muted-foreground font-normal">(optional, max 4)</span>
                        </label>

                        <div className="flex flex-wrap items-center gap-2">
                          {writePreviews.map((src, idx) => (
                            <div key={idx} className="relative h-16 w-16 overflow-hidden rounded-xl border border-border bg-muted">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={src} alt="Upload preview" className="h-full w-full object-cover" />
                              <button
                                type="button"
                                onClick={() => removeImage(idx)}
                                className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}

                          {writePreviews.length < 4 && (
                            <label className="flex h-16 w-16 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border bg-background hover:bg-muted/50 transition-colors">
                              <Upload className="h-4 w-4 text-muted-foreground mb-1" />
                              <span className="text-[10px] text-muted-foreground font-medium">Add</span>
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                multiple
                                onChange={handleImageSelect}
                                className="hidden"
                              />
                            </label>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => submitNewReview(item)}
                          disabled={writeSubmitting || !writeBody.trim()}
                          className="flex items-center gap-1.5 rounded-xl bg-[#1a5c14] px-4 py-2 text-xs font-semibold text-white hover:bg-[#15490f] transition-colors disabled:opacity-60"
                        >
                          {writeSubmitting ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Check className="h-3.5 w-3.5" />
                          )}
                          Submit Review
                        </button>
                        <button
                          type="button"
                          onClick={() => setWritingProductId(null)}
                          className="flex items-center gap-1 rounded-xl border border-border bg-background px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
