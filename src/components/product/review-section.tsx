"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Star,
  ThumbsUp,
  Flag,
  Check,
  Upload,
  X,
  ChevronDown,
  Loader2,
  Edit2,
  Trash2,
  AlertCircle,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRequireAuth } from "@/hooks/use-auth";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ReviewSectionProps {
  productId: string;
  productSlug: string;
  initialSummary: {
    average: number;
    count: number;
    distribution: { star: number; count: number }[];
  };
}

interface ReviewItem {
  _id: string;
  rating: number;
  title?: string;
  body: string;
  images: string[];
  video?: string;
  verifiedPurchase: boolean;
  adminAdded: boolean;
  adminAddedName?: string;
  helpfulCount: number;
  status: "pending" | "approved" | "rejected" | "hidden";
  rejectionReason?: string;
  createdAt: string;
  customerId?: { name: string } | null;
}

interface ReviewWithProduct extends ReviewItem {
  productId?: string;
}

interface SummaryData {
  average: number;
  count: number;
  distribution: { star: number; count: number }[];
}

type SortOption = "newest" | "oldest" | "highest" | "lowest" | "helpful";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function StarDisplay({ rating, size = "md" }: { rating: number; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "h-3 w-3", md: "h-4 w-4", lg: "h-6 w-6" };
  const cls = sizes[size];
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            cls,
            i <= Math.round(rating)
              ? "fill-amber-400 text-amber-400"
              : "fill-muted text-muted-foreground/30"
          )}
        />
      ))}
    </div>
  );
}

function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={value === i}
          aria-label={`${i} star${i !== 1 ? "s" : ""}`}
          onClick={() => onChange(i)}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(0)}
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded"
        >
          <Star
            className={cn(
              "h-7 w-7 transition-colors",
              i <= (hovered || value)
                ? "fill-amber-400 text-amber-400"
                : "fill-muted text-muted-foreground/30"
            )}
          />
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function ReviewSection({ productId, initialSummary }: ReviewSectionProps) {
  const { user, requireAuth } = useRequireAuth();

  // Reviews list state
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [summary, setSummary] = useState<SummaryData>(initialSummary);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Filters
  const [sort, setSort] = useState<SortOption>("newest");
  const [starFilter, setStarFilter] = useState<number | null>(null);
  const [withImages, setWithImages] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  // Write form state
  const [showWriteForm, setShowWriteForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [formRating, setFormRating] = useState(0);
  const [formTitle, setFormTitle] = useState("");
  const [formBody, setFormBody] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [eligibilityError, setEligibilityError] = useState("");

  // My review state
  const [myReview, setMyReview] = useState<ReviewItem | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editRating, setEditRating] = useState(0);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Helpful state
  const [helpfulState, setHelpfulState] = useState<
    Record<string, { count: number; voted: boolean }>
  >({});

  // Report modal
  const [reportModalId, setReportModalId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---------------------------------------------------------------------------
  // Fetch reviews
  // ---------------------------------------------------------------------------

  const fetchReviews = useCallback(
    async (reset = false) => {
      const targetPage = reset ? 1 : page;
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const params = new URLSearchParams();
        params.set("productId", productId);
        params.set("page", String(targetPage));
        params.set("sort", sort);
        if (starFilter !== null) params.set("star", String(starFilter));
        if (withImages) params.set("withImages", "true");
        if (verifiedOnly) params.set("verifiedOnly", "true");

        const res = await fetch(`/api/reviews?${params.toString()}`);
        const json = await res.json();

        if (res.ok) {
          const payload = json.data ?? json;
          const fetched: ReviewItem[] = payload.reviews ?? [];
          if (reset) {
            setReviews(fetched);
            setPage(1);
          } else {
            setReviews((prev) => [...prev, ...fetched]);
          }
          setHasMore(payload.hasNext ?? false);

          // Seed helpful state from fetched reviews
          const newHelpful: Record<string, { count: number; voted: boolean }> = {};
          for (const r of fetched) {
            newHelpful[r._id] = { count: r.helpfulCount, voted: false };
          }
          setHelpfulState((prev) => ({ ...newHelpful, ...prev }));

          // Refresh summary if provided
          if (payload.summary) setSummary(payload.summary);
        }
      } catch {
        // silent — reviews failing shouldn't break the page
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [productId, page, sort, starFilter, withImages, verifiedOnly]
  );

  // Fetch my review
  const fetchMyReview = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/reviews?mine=true");
      const json = await res.json();
      if (res.ok) {
        const allMine: ReviewWithProduct[] = (json.data?.reviews ?? json.reviews ?? []);
        const found = allMine.find((r) => {
          const pid = (r as unknown as Record<string, unknown>)["productId"];
          return typeof pid === "string" ? pid === productId : (pid as { _id?: string })?._id === productId;
        }) ?? null;
        if (found) setMyReview(found as ReviewItem);
      }
    } catch {
      // silent
    }
  }, [user, productId]);

  // On mount / filter change: reset and fetch
  useEffect(() => {
    fetchReviews(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort, starFilter, withImages, verifiedOnly, productId]);

  useEffect(() => {
    fetchMyReview();
  }, [fetchMyReview]);

  // ---------------------------------------------------------------------------
  // Load more
  // ---------------------------------------------------------------------------

  function loadMore() {
    const nextPage = page + 1;
    setPage(nextPage);
    // fetchReviews will pick up the new page via the page dep, but we call imperatively:
    (async () => {
      setLoadingMore(true);
      try {
        const params = new URLSearchParams();
        params.set("productId", productId);
        params.set("page", String(nextPage));
        params.set("sort", sort);
        if (starFilter !== null) params.set("star", String(starFilter));
        if (withImages) params.set("withImages", "true");
        if (verifiedOnly) params.set("verifiedOnly", "true");

        const res = await fetch(`/api/reviews?${params.toString()}`);
        const json = await res.json();
        if (res.ok) {
          const payload = json.data ?? json;
          const fetched: ReviewItem[] = payload.reviews ?? [];
          setReviews((prev) => [...prev, ...fetched]);
          setHasMore(payload.hasNext ?? false);
          const newHelpful: Record<string, { count: number; voted: boolean }> = {};
          for (const r of fetched) {
            newHelpful[r._id] = { count: r.helpfulCount, voted: false };
          }
          setHelpfulState((prev) => ({ ...newHelpful, ...prev }));
        }
      } finally {
        setLoadingMore(false);
      }
    })();
  }

  // ---------------------------------------------------------------------------
  // Image handling
  // ---------------------------------------------------------------------------

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const remaining = 5 - imageFiles.length;
    const toAdd = files.slice(0, remaining);
    if (toAdd.length === 0) return;

    setImageFiles((prev) => [...prev, ...toAdd]);
    toAdd.forEach((file) => {
      const url = URL.createObjectURL(file);
      setImagePreviews((prev) => [...prev, url]);
    });
    // Reset input value so same file can be re-selected if removed
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeImage(idx: number) {
    setImageFiles((prev) => prev.filter((_, i) => i !== idx));
    setImagePreviews((prev) => {
      URL.revokeObjectURL(prev[idx]);
      return prev.filter((_, i) => i !== idx);
    });
  }

  // ---------------------------------------------------------------------------
  // Submit new review
  // ---------------------------------------------------------------------------

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (formRating === 0) {
      setFormError("Please select a star rating.");
      return;
    }
    if (formBody.trim().length < 10) {
      setFormError("Review body must be at least 10 characters.");
      return;
    }

    setSubmitting(true);

    // Upload images
    const uploadedUrls: string[] = [];
    if (imageFiles.length > 0) {
      setUploadingImages(true);
      for (const file of imageFiles) {
        const fd = new FormData();
        fd.append("file", file);
        try {
          const res = await fetch("/api/upload", { method: "POST", body: fd });
          const json = await res.json();
          if (json.success) uploadedUrls.push(json.url);
        } catch {
          // skip failed uploads
        }
      }
      setUploadingImages(false);
    }

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          rating: formRating,
          title: formTitle.trim() || undefined,
          body: formBody.trim(),
          images: uploadedUrls,
        }),
      });

      if (res.status === 403) {
        setEligibilityError(
          "Only verified buyers can leave a review. Purchase this product first."
        );
        setSubmitting(false);
        return;
      }
      if (res.status === 409) {
        setEligibilityError("You have already reviewed this product.");
        setSubmitting(false);
        return;
      }

      const json = await res.json();
      if (res.status === 201 || res.ok) {
        setMyReview(json.data ?? json);
        setFormSuccess(
          "Your review has been submitted and is pending approval. Thank you!"
        );
        setShowWriteForm(false);
        setFormRating(0);
        setFormTitle("");
        setFormBody("");
        setImageFiles([]);
        setImagePreviews([]);
        // Refresh public list
        fetchReviews(true);
      } else {
        setFormError(json.error ?? json.message ?? "Something went wrong. Please try again.");
      }
    } catch {
      setFormError("Network error. Please check your connection.");
    } finally {
      setSubmitting(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Edit review
  // ---------------------------------------------------------------------------

  function startEdit() {
    if (!myReview) return;
    setEditRating(myReview.rating);
    setEditTitle(myReview.title ?? "");
    setEditBody(myReview.body);
    setEditMode(true);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!myReview) return;
    if (editRating === 0) return;
    setEditSubmitting(true);
    try {
      const res = await fetch(`/api/reviews/${myReview._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: editRating,
          title: editTitle.trim() || undefined,
          body: editBody.trim(),
        }),
      });
      const json = await res.json();
      if (res.ok) {
        setMyReview(json.data ?? json);
        setEditMode(false);
        fetchReviews(true);
      }
    } catch {
      // silent
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleDeleteMyReview() {
    if (!myReview) return;
    if (!window.confirm("Delete your review? This cannot be undone.")) return;
    try {
      await fetch(`/api/reviews/${myReview._id}`, { method: "DELETE" });
      setMyReview(null);
      setFormSuccess("");
      setEligibilityError("");
      fetchReviews(true);
    } catch {
      // silent
    }
  }

  // ---------------------------------------------------------------------------
  // Helpful
  // ---------------------------------------------------------------------------

  async function handleHelpful(reviewId: string) {
    requireAuth(async () => {
      // Optimistic update
      setHelpfulState((prev) => {
        const current = prev[reviewId] ?? { count: 0, voted: false };
        return {
          ...prev,
          [reviewId]: {
            count: current.voted ? current.count - 1 : current.count + 1,
            voted: !current.voted,
          },
        };
      });
      try {
        const res = await fetch(`/api/reviews/${reviewId}/helpful`, { method: "POST" });
        const json = await res.json();
        if (res.ok) {
          const payload = json.data ?? json;
          setHelpfulState((prev) => ({
            ...prev,
            [reviewId]: { count: payload.helpfulCount, voted: payload.helpful },
          }));
        } else {
          // Revert
          setHelpfulState((prev) => {
            const current = prev[reviewId] ?? { count: 0, voted: false };
            return {
              ...prev,
              [reviewId]: {
                count: current.voted ? current.count - 1 : current.count + 1,
                voted: !current.voted,
              },
            };
          });
        }
      } catch {
        // Revert on error
        setHelpfulState((prev) => {
          const current = prev[reviewId] ?? { count: 0, voted: false };
          return {
            ...prev,
            [reviewId]: {
              count: current.voted ? current.count - 1 : current.count + 1,
              voted: !current.voted,
            },
          };
        });
      }
    });
  }

  function handleReport(reviewId: string) {
    requireAuth(() => {
      setReportReason("");
      setReportModalId(reviewId);
    });
  }

  async function submitReport() {
    if (!reportModalId || !reportReason) return;
    setReportSubmitting(true);
    try {
      await fetch(`/api/reviews/${reportModalId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reportReason }),
      });
    } catch {
      // silent
    } finally {
      setReportSubmitting(false);
      setReportModalId(null);
      setReportReason("");
    }
  }

  // ---------------------------------------------------------------------------
  // Derived
  // ---------------------------------------------------------------------------

  const totalReviewCount = summary.count;

  function getDistCount(star: number) {
    return summary.distribution.find((d) => d.star === star)?.count ?? 0;
  }

  function getDistPct(star: number) {
    if (totalReviewCount === 0) return 0;
    return Math.round((getDistCount(star) / totalReviewCount) * 100);
  }

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: "newest", label: "Newest" },
    { value: "oldest", label: "Oldest" },
    { value: "highest", label: "Highest Rated" },
    { value: "lowest", label: "Lowest Rated" },
    { value: "helpful", label: "Most Helpful" },
  ];

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (!loading && summary.count === 0 && reviews.length === 0) {
    return null;
  }

  return (
    <div className="mt-14 space-y-8">
      <h2 className="text-2xl font-black tracking-tight">Customer Reviews</h2>
      {/* ------------------------------------------------------------------ */}
      {/* Summary Card                                                        */}
      {/* ------------------------------------------------------------------ */}
      <div className="rounded-2xl border border-border bg-background p-6">
        <div className="flex flex-wrap items-start gap-6">
          {/* Big average */}
          <div className="flex flex-col items-center gap-1 text-center min-w-20">
            <p className="text-5xl font-black leading-none">{summary.average.toFixed(1)}</p>
            <StarDisplay rating={summary.average} size="lg" />
            <p className="mt-1 text-xs text-muted-foreground">
              {totalReviewCount.toLocaleString()} review{totalReviewCount !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Distribution bars */}
          <div className="flex-1 min-w-45 space-y-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const pct = getDistPct(star);
              const cnt = getDistCount(star);
              const isActive = starFilter === star;
              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => setStarFilter(isActive ? null : star)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-2 py-1 text-xs transition-colors",
                    isActive
                      ? "bg-amber-50 ring-1 ring-amber-300"
                      : "hover:bg-muted"
                  )}
                >
                  <span className="w-3 shrink-0 text-right font-medium">{star}</span>
                  <Star className="h-3 w-3 shrink-0 fill-amber-400 text-amber-400" />
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-amber-400 transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-6 shrink-0 text-right text-muted-foreground">{cnt}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Filter row                                                          */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Sort select */}
        <div className="relative">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="appearance-none rounded-xl border border-border bg-background py-2 pl-3 pr-8 text-sm font-medium shadow-sm transition-colors hover:border-foreground/30 focus:outline-none focus:ring-2 focus:ring-[#1a5c14]/40 cursor-pointer"
          >
            {sortOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        </div>

        {/* Star chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setStarFilter(null)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
              starFilter === null
                ? "border-[#1a5c14] bg-[#1a5c14] text-white"
                : "border-border hover:border-foreground/30"
            )}
          >
            All
          </button>
          {[5, 4, 3, 2, 1].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setStarFilter(starFilter === star ? null : star)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                starFilter === star
                  ? "border-amber-500 bg-amber-400 text-white"
                  : "border-border hover:border-foreground/30"
              )}
            >
              {star}★
            </button>
          ))}
        </div>

        {/* Toggle buttons */}
        <button
          type="button"
          onClick={() => setWithImages((v) => !v)}
          className={cn(
            "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
            withImages
              ? "border-[#1a5c14] bg-[#1a5c14]/10 text-[#1a5c14]"
              : "border-border hover:border-foreground/30"
          )}
        >
          <span>📷</span> With Images
        </button>
        <button
          type="button"
          onClick={() => setVerifiedOnly((v) => !v)}
          className={cn(
            "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
            verifiedOnly
              ? "border-[#1a5c14] bg-[#1a5c14]/10 text-[#1a5c14]"
              : "border-border hover:border-foreground/30"
          )}
        >
          <Check className="h-3 w-3" /> Verified Only
        </button>

        {/* Reset filters */}
        {(starFilter !== null || withImages || verifiedOnly || sort !== "newest") && (
          <button
            type="button"
            onClick={() => {
              setSort("newest");
              setStarFilter(null);
              setWithImages(false);
              setVerifiedOnly(false);
            }}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Reviews list                                                        */}
      {/* ------------------------------------------------------------------ */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="rounded-2xl border border-border bg-background py-12 text-center">
            <p className="text-sm font-medium text-muted-foreground">No reviews found.</p>
            {(starFilter !== null || withImages || verifiedOnly) && (
              <p className="mt-1 text-xs text-muted-foreground">Try adjusting your filters.</p>
            )}
          </div>
        ) : (
          <div className="flex gap-3.5 sm:gap-4 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scrollbar-none scroll-smooth">
            {reviews.map((review) => {
              const helpful = helpfulState[review._id] ?? {
                count: review.helpfulCount,
                voted: false,
              };
              const rawName = review.adminAdded
                ? (review.adminAddedName ?? "Verified Customer")
                : (review.customerId?.name ?? "Verified Customer");
              const nameParts = rawName.trim().split(" ");
              const displayName = nameParts.length > 1
                ? `${nameParts[0]} ${nameParts[1][0]}.`
                : nameParts[0] || "Verified Customer";
              const initials = displayName.charAt(0).toUpperCase();

              return (
                <div
                  key={review._id}
                  className="w-[260px] sm:w-[300px] shrink-0 snap-start rounded-2xl border border-border bg-background p-4 flex flex-col justify-between space-y-3 shadow-xs hover:shadow-md transition-shadow"
                >
                  <div className="space-y-2.5">
                    {/* Header: Avatar, name, date, stars */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1a5c14]/10 text-xs font-bold text-[#1a5c14]">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-foreground truncate max-w-[110px]">{displayName}</span>
                            {review.verifiedPurchase && (
                              <span className="inline-flex items-center gap-0.5 rounded-full bg-[#1a5c14]/10 px-1.5 py-0.5 text-[9px] font-bold text-[#1a5c14] shrink-0">
                                <ShieldCheck className="h-2.5 w-2.5" /> Verified
                              </span>
                            )}
                          </div>
                          <StarDisplay rating={review.rating} size="sm" />
                        </div>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0">{fmtDate(review.createdAt)}</span>
                    </div>

                    {/* Title */}
                    {review.title && (
                      <p className="text-xs font-bold leading-snug line-clamp-1 text-foreground">{review.title}</p>
                    )}

                    {/* Body */}
                    <p className="text-xs leading-relaxed text-muted-foreground line-clamp-3">{review.body}</p>

                    {/* Image thumbnails */}
                    {review.images.length > 0 && (
                      <div className="flex items-center gap-1.5 pt-1">
                        {review.images.map((src, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => window.open(src, "_blank", "noopener,noreferrer")}
                            className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border bg-muted hover:opacity-80 transition-opacity"
                            aria-label={`View image ${idx + 1}`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={src}
                              alt={`Review thumbnail ${idx + 1}`}
                              className="h-full w-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Helpful + report */}
                  <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[11px]">
                    <button
                      type="button"
                      onClick={() => handleHelpful(review._id)}
                      className={cn(
                        "flex items-center gap-1 rounded-full border px-2.5 py-1 font-semibold transition-colors",
                        helpful.voted
                          ? "border-amber-400 bg-amber-50 text-amber-600"
                          : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                      )}
                    >
                      <ThumbsUp className={cn("h-3 w-3", helpful.voted && "fill-amber-400")} />
                      Helpful{helpful.count > 0 ? ` (${helpful.count})` : ""}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReport(review._id)}
                      className="flex items-center gap-1 text-muted-foreground hover:text-destructive transition-colors"
                      aria-label="Report review"
                    >
                      <Flag className="h-3 w-3" />
                      Report
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Load More */}
        {hasMore && !loading && (
          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={loadMore}
              disabled={loadingMore}
              className="flex items-center gap-2 rounded-xl border border-border bg-background px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-muted disabled:opacity-60"
            >
              {loadingMore ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Loading...</>
              ) : (
                "Load More Reviews"
              )}
            </button>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Report Modal                                                        */}
      {/* ------------------------------------------------------------------ */}
      {reportModalId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Report review"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setReportModalId(null);
              setReportReason("");
            }
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-base font-bold">Report Review</h4>
              <button
                type="button"
                onClick={() => {
                  setReportModalId(null);
                  setReportReason("");
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              Help us keep reviews trustworthy. Select a reason for your report.
            </p>

            <div className="relative mb-4">
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full appearance-none rounded-xl border border-border bg-background py-2.5 pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c14]/40"
              >
                <option value="" disabled>
                  Select a reason...
                </option>
                <option value="spam">Spam</option>
                <option value="offensive_language">Offensive Language</option>
                <option value="fake_review">Fake Review</option>
                <option value="misleading">Misleading</option>
                <option value="harassment">Harassment</option>
                <option value="other">Other</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={submitReport}
                disabled={!reportReason || reportSubmitting}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#1a5c14] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#155010] disabled:opacity-60"
              >
                {reportSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Submit Report
              </button>
              <button
                type="button"
                onClick={() => {
                  setReportModalId(null);
                  setReportReason("");
                }}
                className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-muted"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
