"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Star, Check, X, Eye, EyeOff, Trash2, Flag, Search, Loader2,
  ShieldCheck, AlertCircle, MessageSquare, Plus, ThumbsUp, RotateCcw,
  Package, ChevronDown, ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminReview {
  _id: string;
  rating: number;
  title?: string;
  body: string;
  images: string[];
  status: string;
  verifiedPurchase: boolean;
  adminAdded: boolean;
  adminAddedName?: string;
  helpfulCount: number;
  reportCount: number;
  rejectionReason?: string;
  adminNote?: string;
  createdAt: string;
  customerId?: { name: string; email: string } | null;
  productId?: { name: string; slug: string; images: string[] } | null;
}

interface Stats {
  pending: number;
  approved: number;
  rejected: number;
  hidden: number;
}

// ─── Admin headers ────────────────────────────────────────────────────────────

const adminHeaders = {
  "Content-Type": "application/json",
  "x-user-role": "admin",
  "x-admin-verified": "1",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StarDisplay({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const cls = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(cls, i < rating ? "fill-amber-400 text-amber-400" : "text-gray-200")}
        />
      ))}
    </div>
  );
}

function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1">
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
                  : "text-gray-200"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    pending:  "bg-yellow-100 text-yellow-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
    hidden:   "bg-gray-100 text-gray-600",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase",
        map[status] ?? "bg-gray-100 text-gray-600"
      )}
    >
      {status}
    </span>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AdminReviewsPage() {
  // List state
  const [reviews,      setReviews]      = useState<AdminReview[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [stats,        setStats]        = useState<Stats>({ pending: 0, approved: 0, rejected: 0, hidden: 0 });
  const [total,        setTotal]        = useState(0);
  const [page,         setPage]         = useState(1);
  const [totalPages,   setTotalPages]   = useState(1);

  // Filters
  const [tab,          setTab]          = useState<"all" | "pending" | "approved" | "rejected" | "hidden">("pending");
  const [search,       setSearch]       = useState("");
  const [sort,         setSort]         = useState<"newest" | "oldest" | "highest" | "lowest">("newest");
  const [starFilter,   setStarFilter]   = useState<number | null>(null);

  // UI
  const [expandedId,   setExpandedId]   = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Reject modal
  const [rejectModal,      setRejectModal]      = useState<string | null>(null);
  const [rejectReason,     setRejectReason]     = useState("spam");
  const [rejectNote,       setRejectNote]       = useState("");
  const [rejectSubmitting, setRejectSubmitting] = useState(false);

  // Add review modal
  const [addModal,      setAddModal]      = useState(false);
  const [addProductId,  setAddProductId]  = useState("");
  const [addName,       setAddName]       = useState("");
  const [addRating,     setAddRating]     = useState(5);
  const [addTitle,      setAddTitle]      = useState("");
  const [addBody,       setAddBody]       = useState("");
  const [addSubmitting, setAddSubmitting] = useState(false);

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Fetch ──

  const fetchReviews = useCallback(
    async (overridePage?: number) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page:   String(overridePage ?? page),
          status: tab,
          sort,
          ...(starFilter != null && { star: String(starFilter) }),
          ...(search.trim() && { search: search.trim() }),
        });
        const res  = await fetch(`/api/admin/reviews?${params}`, { headers: adminHeaders });
        const json = await res.json();
        if (json.success) {
          setReviews(json.data.reviews ?? []);
          setStats(json.data.stats ?? { pending: 0, approved: 0, rejected: 0, hidden: 0 });
          setTotal(json.data.total ?? 0);
          setTotalPages(json.data.totalPages ?? 1);
        }
      } finally {
        setLoading(false);
      }
    },
    [page, tab, sort, starFilter, search]
  );

  // Fetch when tab/sort/star/page change
  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, sort, starFilter, page]);

  // Debounce search
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setPage(1);
      fetchReviews(1);
    }, 300);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // ── Actions ──

  async function performAction(
    reviewId: string,
    action: string,
    extra: Record<string, string> = {}
  ) {
    setActionLoading(reviewId);
    try {
      await fetch(`/api/admin/reviews/${reviewId}`, {
        method:  "PUT",
        headers: adminHeaders,
        body:    JSON.stringify({ action, ...extra }),
      });
      await fetchReviews();
    } finally {
      setActionLoading(null);
    }
  }

  async function submitReject() {
    if (!rejectModal) return;
    setRejectSubmitting(true);
    try {
      await performAction(rejectModal, "reject", {
        rejectionReason: rejectReason,
        adminNote:       rejectNote,
      });
    } finally {
      setRejectSubmitting(false);
      setRejectModal(null);
      setRejectReason("spam");
      setRejectNote("");
    }
  }

  async function submitAddReview() {
    if (!addProductId.trim()) return;
    if (!addRating) return;
    if (!addBody.trim()) return;
    setAddSubmitting(true);
    try {
      const res = await fetch("/api/admin/reviews", {
        method:  "POST",
        headers: adminHeaders,
        body:    JSON.stringify({
          productId:      addProductId.trim(),
          rating:         addRating,
          title:          addTitle.trim(),
          body:           addBody.trim(),
          adminAddedName: addName.trim() || "Anonymous",
        }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchReviews();
        setAddModal(false);
        setAddProductId("");
        setAddName("");
        setAddRating(5);
        setAddTitle("");
        setAddBody("");
      }
    } finally {
      setAddSubmitting(false);
    }
  }

  // ── Render ──

  const TABS = [
    { key: "all",      label: "All",      count: stats.pending + stats.approved + stats.rejected + stats.hidden },
    { key: "pending",  label: "Pending",  count: stats.pending },
    { key: "approved", label: "Approved", count: stats.approved },
    { key: "rejected", label: "Rejected", count: stats.rejected },
    { key: "hidden",   label: "Hidden",   count: stats.hidden },
  ] as const;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 min-h-screen bg-gray-50">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 shrink-0">
            <MessageSquare className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900">Reviews</h1>
            <p className="text-xs text-gray-500">{total} total</p>
          </div>
        </div>
        <button
          onClick={() => setAddModal(true)}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Review
        </button>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { key: "pending" as const,  label: "Pending",  icon: <RotateCcw className="h-4 w-4 text-yellow-500" />, bg: "bg-yellow-50",  num: stats.pending  },
          { key: "approved" as const, label: "Approved", icon: <Check className="h-4 w-4 text-green-600" />,      bg: "bg-green-50",   num: stats.approved },
          { key: "rejected" as const, label: "Rejected", icon: <X className="h-4 w-4 text-red-500" />,            bg: "bg-red-50",     num: stats.rejected },
          { key: "hidden" as const,   label: "Hidden",   icon: <EyeOff className="h-4 w-4 text-gray-400" />,      bg: "bg-gray-100",   num: stats.hidden   },
        ].map(({ key, label, icon, bg, num }) => (
          <button
            key={key}
            onClick={() => { setTab(key); setPage(1); }}
            className={cn(
              "rounded-2xl border border-gray-200 bg-white p-4 text-left transition-all hover:shadow-sm",
              tab === key && "ring-2 ring-[#1a5c14]"
            )}
          >
            <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg mb-3", bg)}>
              {icon}
            </div>
            <p className="text-2xl font-black text-gray-900">{num}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </button>
        ))}
      </div>

      {/* ── Status tabs ── */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
        {TABS.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => { setTab(key); setPage(1); }}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0",
              tab === key
                ? "bg-[#1a5c14] border-[#1a5c14] text-white"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            )}
          >
            {label}
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                tab === key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
              )}
            >
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Filter bar ── */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reviews…"
            className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#1a5c14] focus:ring-2 focus:ring-[#1a5c14]/20 focus:outline-none"
          />
        </div>

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#1a5c14] focus:outline-none"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="highest">Highest Rated</option>
          <option value="lowest">Lowest Rated</option>
        </select>

        {/* Star chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setStarFilter(null)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
              starFilter === null
                ? "bg-[#1a5c14] border-[#1a5c14] text-white"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            )}
          >
            All
          </button>
          {[5, 4, 3, 2, 1].map((s) => (
            <button
              key={s}
              onClick={() => setStarFilter(starFilter === s ? null : s)}
              className={cn(
                "flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors",
                starFilter === s
                  ? "bg-amber-500 border-amber-500 text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
              )}
            >
              {s}
              <Star className={cn("h-3 w-3", starFilter === s ? "fill-white text-white" : "fill-amber-400 text-amber-400")} />
            </button>
          ))}
        </div>
      </div>

      {/* ── Reviews list ── */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-gray-100" />
          ))
        ) : reviews.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mb-4">
              <MessageSquare className="h-8 w-8 text-gray-300" />
            </div>
            <p className="text-sm font-semibold text-gray-500">No reviews found</p>
          </div>
        ) : (
          reviews.map((review) => {
            const isExpanded    = expandedId === review._id;
            const isActioning   = actionLoading === review._id;

            return (
              <div
                key={review._id}
                className="rounded-2xl border border-gray-200 bg-white overflow-hidden"
              >
                {/* Card header — always visible, click toggles expand */}
                <div
                  role="button"
                  onClick={() => setExpandedId(isExpanded ? null : review._id)}
                  className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
                >
                  {/* Product thumbnail */}
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                    {review.productId?.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={review.productId.images[0]}
                        alt={review.productId.name ?? ""}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Package className="h-4 w-4 text-gray-300" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900 line-clamp-1">
                        {review.productId?.name ?? "Unknown Product"}
                      </p>
                      {statusBadge(review.status)}
                      {review.verifiedPurchase && (
                        <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">
                          <ShieldCheck className="h-3 w-3" /> Verified
                        </span>
                      )}
                      {review.adminAdded && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500">
                          Admin
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {review.adminAdded ? (
                        <p className="text-xs text-gray-400">
                          {review.adminAddedName ?? "Anonymous"}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500">
                          {review.customerId?.name ?? "Unknown"}{" "}
                          {review.customerId?.email && (
                            <span className="text-gray-400">· {review.customerId.email}</span>
                          )}
                        </p>
                      )}
                      <span className="text-gray-300">·</span>
                      <StarDisplay rating={review.rating} />
                      <span className="text-gray-300">·</span>
                      <span className="text-xs text-gray-400">
                        {new Date(review.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div
                    className="flex items-center gap-1.5 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Approve */}
                    <button
                      onClick={() => performAction(review._id, "approve")}
                      disabled={review.status === "approved" || isActioning}
                      title="Approve"
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg border transition-colors",
                        review.status === "approved"
                          ? "border-green-200 bg-green-50 text-green-400 opacity-50 cursor-not-allowed"
                          : "border-green-200 bg-green-50 text-green-600 hover:bg-green-100"
                      )}
                    >
                      {isActioning ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      )}
                    </button>

                    {/* Reject */}
                    <button
                      onClick={() => { setRejectModal(review._id); setRejectReason("spam"); setRejectNote(""); }}
                      disabled={isActioning}
                      title="Reject"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>

                    {/* Hide / Restore */}
                    {review.status === "hidden" ? (
                      <button
                        onClick={() => performAction(review._id, "restore")}
                        disabled={isActioning}
                        title="Restore"
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-50"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => performAction(review._id, "hide")}
                        disabled={isActioning}
                        title="Hide"
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-50"
                      >
                        <EyeOff className="h-3.5 w-3.5" />
                      </button>
                    )}

                    {/* Delete */}
                    <button
                      onClick={() => performAction(review._id, "delete")}
                      disabled={isActioning}
                      title="Delete"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>

                    {/* Expand chevron */}
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Expanded body */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-3">
                    {review.title && (
                      <p className="text-sm font-bold text-gray-900">{review.title}</p>
                    )}
                    <p className="text-sm text-gray-600 leading-relaxed">{review.body}</p>

                    {/* Images */}
                    {review.images.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {review.images.map((src, i) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            key={i}
                            src={src}
                            alt={`Review image ${i + 1}`}
                            onClick={() => window.open(src, "_blank")}
                            className="h-16 w-16 rounded-xl object-cover border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                          />
                        ))}
                      </div>
                    )}

                    {/* Rejection reason */}
                    {review.rejectionReason && (
                      <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2.5">
                        <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-red-700">Rejection Reason</p>
                          <p className="text-xs text-red-600 capitalize mt-0.5">
                            {review.rejectionReason.replace(/_/g, " ")}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Admin note */}
                    {review.adminNote && (
                      <div className="rounded-xl bg-gray-50 border border-gray-200 px-3 py-2.5">
                        <p className="text-xs font-semibold text-gray-500">Admin Note</p>
                        <p className="text-xs text-gray-600 mt-0.5">{review.adminNote}</p>
                      </div>
                    )}

                    {/* Meta badges */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-500">
                        <ThumbsUp className="h-3.5 w-3.5" />
                        {review.helpfulCount} helpful
                      </span>
                      {review.reportCount > 0 && (
                        <span className="flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs text-red-500">
                          <Flag className="h-3.5 w-3.5" />
                          {review.reportCount} report{review.reportCount !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 1}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-40"
            >
              &#8249;
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page === totalPages}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-40"
            >
              &#8250;
            </button>
          </div>
        </div>
      )}

      {/* ── Reject Modal ── */}
      {rejectModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setRejectModal(null)}
        >
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <X className="h-5 w-5 text-red-500" />
                <h2 className="text-base font-bold text-gray-900">Reject Review</h2>
              </div>
              <button
                onClick={() => setRejectModal(null)}
                className="rounded-lg p-1.5 hover:bg-gray-100 transition-colors"
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Reason */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                  Reason <span className="text-red-500">*</span>
                </label>
                <select
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-[#1a5c14] focus:ring-2 focus:ring-[#1a5c14]/20 focus:outline-none"
                >
                  <option value="spam">Spam</option>
                  <option value="offensive_language">Offensive Language</option>
                  <option value="fake_review">Fake Review</option>
                  <option value="duplicate_review">Duplicate Review</option>
                  <option value="irrelevant_content">Irrelevant Content</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Admin note */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                  Admin Note{" "}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  placeholder="Internal note about rejection…"
                  rows={3}
                  maxLength={500}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 resize-none focus:border-[#1a5c14] focus:ring-2 focus:ring-[#1a5c14]/20 focus:outline-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setRejectModal(null)}
                  className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={submitReject}
                  disabled={rejectSubmitting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-600 transition-colors disabled:opacity-60"
                >
                  {rejectSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Reject Review
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Review Modal ── */}
      {addModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setAddModal(false)}
        >
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-emerald-500" />
                <h2 className="text-base font-bold text-gray-900">Add Review</h2>
              </div>
              <button
                onClick={() => setAddModal(false)}
                className="rounded-lg p-1.5 hover:bg-gray-100 transition-colors"
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Product ID */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                  Product ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={addProductId}
                  onChange={(e) => setAddProductId(e.target.value)}
                  placeholder="Enter MongoDB product ID"
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 font-mono placeholder:font-sans placeholder:text-gray-400 focus:border-[#1a5c14] focus:ring-2 focus:ring-[#1a5c14]/20 focus:outline-none"
                />
              </div>

              {/* Reviewer name */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                  Reviewer Name{" "}
                  <span className="text-gray-400 font-normal">(optional, defaults to &ldquo;Anonymous&rdquo;)</span>
                </label>
                <input
                  type="text"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="Anonymous"
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#1a5c14] focus:ring-2 focus:ring-[#1a5c14]/20 focus:outline-none"
                />
              </div>

              {/* Rating */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Rating <span className="text-red-500">*</span>
                </label>
                <StarInput value={addRating} onChange={setAddRating} />
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                  Title{" "}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={addTitle}
                  onChange={(e) => setAddTitle(e.target.value)}
                  placeholder="Review title"
                  maxLength={120}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#1a5c14] focus:ring-2 focus:ring-[#1a5c14]/20 focus:outline-none"
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                  Review Body <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={addBody}
                  onChange={(e) => setAddBody(e.target.value)}
                  placeholder="Write the review content…"
                  rows={4}
                  maxLength={2000}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 resize-none placeholder:text-gray-400 focus:border-[#1a5c14] focus:ring-2 focus:ring-[#1a5c14]/20 focus:outline-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setAddModal(false)}
                  className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={submitAddReview}
                  disabled={addSubmitting || !addProductId.trim() || !addBody.trim() || !addRating}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors disabled:opacity-60"
                >
                  {addSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Submit Review
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
