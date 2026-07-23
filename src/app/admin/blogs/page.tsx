"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import {
  Plus, ArrowLeft, Pencil, Trash2, Loader2, X, Check,
  Eye, Clock, BookOpen, Tag, ChevronDown, ChevronUp, ImageIcon,
  Search, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type BlogStatus = "draft" | "published" | "archived";

interface BlogSummary {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  status: BlogStatus;
  viewCount: number;
  readingTime: number;
  categories: string[];
  tags: string[];
  createdAt: string;
  publishedAt?: string;
}

interface BlogFull extends BlogSummary {
  content: string;
  seo: { title?: string; description?: string; keywords?: string[] };
}

interface Stats {
  total: number;
  published: number;
  draft: number;
  archived: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ADMIN_HEADERS = {
  "Content-Type": "application/json",
  "x-user-role": "admin",
  "x-admin-verified": "1",
};

const STATUS_STYLES: Record<BlogStatus, string> = {
  published: "bg-emerald-50 text-emerald-700 border-emerald-200",
  draft:     "bg-amber-50 text-amber-700 border-amber-200",
  archived:  "bg-gray-100 text-gray-500 border-gray-200",
};

const STATUS_LABELS: Record<BlogStatus, string> = {
  published: "Published",
  draft:     "Draft",
  archived:  "Archived",
};

const EMPTY_FORM = {
  title:       "",
  excerpt:     "",
  content:     "",
  coverImage:  "",
  categories:  [] as string[],
  tags:        [] as string[],
  status:      "draft" as BlogStatus,
  seo: { title: "", description: "", keywords: [] as string[] },
};

type EditorForm = typeof EMPTY_FORM;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </p>
  );
}

const inputCls =
  "w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a5c14]/30 focus:border-[#1a5c14] transition-colors";

function CoverImageUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setUploadError("Please select an image file."); return; }
    if (file.size > 5 * 1024 * 1024) { setUploadError("Image must be under 5 MB."); return; }
    setUploadError("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "sunera/blogs");
      const res  = await fetch("/api/admin/upload", { method: "POST", headers: { "x-user-role": "admin", "x-admin-verified": "1" }, body: fd });
      const json = await res.json();
      if (!res.ok || !json.success) { setUploadError(json.error ?? "Upload failed."); return; }
      onChange(json.data.url);
    } catch {
      setUploadError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      {value ? (
        <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
          <Image src={value} alt="Cover preview" fill className="object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 py-10 text-center transition-colors hover:border-[#1a5c14]/40 hover:bg-[#1a5c14]/5 disabled:opacity-60"
        >
          {uploading
            ? <Loader2 className="h-7 w-7 animate-spin text-[#1a5c14]" />
            : <ImageIcon className="h-7 w-7 text-gray-400" />
          }
          <span className="text-sm font-medium text-gray-500">
            {uploading ? "Uploading…" : "Click to upload cover image"}
          </span>
          <span className="text-xs text-gray-400">JPG, PNG, WebP — max 5 MB</span>
        </button>
      )}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}
    </div>
  );
}

function ChipInput({
  label,
  chips,
  onChange,
  placeholder,
}: {
  label: string;
  chips: string[];
  onChange: (chips: string[]) => void;
  placeholder: string;
}) {
  const [input, setInput] = useState("");

  function addChip() {
    const val = input.trim().toLowerCase();
    if (val && !chips.includes(val)) {
      onChange([...chips, val]);
    }
    setInput("");
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addChip();
    } else if (e.key === "Backspace" && !input && chips.length > 0) {
      onChange(chips.slice(0, -1));
    }
  }

  return (
    <div>
      <Label>{label}</Label>
      <div className="min-h-11 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 flex flex-wrap gap-1.5 focus-within:ring-2 focus-within:ring-[#1a5c14]/30 focus-within:border-[#1a5c14] transition-colors">
        {chips.map((chip) => (
          <span
            key={chip}
            className="inline-flex items-center gap-1 rounded-full bg-[#1a5c14]/10 px-2.5 py-0.5 text-xs font-medium text-[#1a5c14]"
          >
            {chip}
            <button
              type="button"
              onClick={() => onChange(chips.filter((c) => c !== chip))}
              className="hover:text-red-500 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          onBlur={addChip}
          placeholder={chips.length === 0 ? placeholder : ""}
          className="flex-1 min-w-30 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"
        />
      </div>
      <p className="mt-1 text-[11px] text-gray-400">Press Enter or comma to add</p>
    </div>
  );
}

// ─── Blog Card ────────────────────────────────────────────────────────────────

function BlogCard({
  blog,
  onEdit,
  onDelete,
  deleting,
}: {
  blog: BlogSummary;
  onEdit: (blog: BlogSummary) => void;
  onDelete: (id: string) => void;
  deleting: string | null;
}) {
  return (
    <div className="group relative flex flex-col rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Cover image */}
      <div className="relative aspect-video w-full bg-gray-100 overflow-hidden">
        {blog.coverImage ? (
          <Image
            src={blog.coverImage}
            alt={blog.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageIcon className="h-10 w-10 text-gray-300" />
          </div>
        )}
        {/* Status badge overlay */}
        <span
          className={cn(
            "absolute top-2 right-2 rounded-full border px-2.5 py-0.5 text-[11px] font-bold",
            STATUS_STYLES[blog.status]
          )}
        >
          {STATUS_LABELS[blog.status]}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4 gap-2">
        <h3 className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug">
          {blog.title}
        </h3>
        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed flex-1">
          {blog.excerpt}
        </p>

        {/* Meta row */}
        <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-1">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {fmtDate(blog.publishedAt ?? blog.createdAt)}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {blog.viewCount.toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            <BookOpen className="h-3 w-3" />
            {blog.readingTime} min
          </span>
        </div>

        {/* Category chips */}
        {blog.categories.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-0.5">
            {blog.categories.slice(0, 3).map((cat) => (
              <span
                key={cat}
                className="inline-flex items-center gap-0.5 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500"
              >
                <Tag className="h-2.5 w-2.5" />
                {cat}
              </span>
            ))}
            {blog.categories.length > 3 && (
              <span className="text-[10px] text-gray-400">
                +{blog.categories.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
          <button
            onClick={() => onEdit(blog)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>
          <button
            onClick={() => onDelete(blog._id)}
            disabled={deleting === blog._id}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-100 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 hover:border-red-200 transition-colors disabled:opacity-50"
          >
            {deleting === blog._id
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Trash2 className="h-3.5 w-3.5" />
            }
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Editor View ──────────────────────────────────────────────────────────────

function BlogEditor({
  editingBlog,
  onBack,
  onSaved,
}: {
  editingBlog: BlogSummary | null;
  onBack: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<EditorForm>(EMPTY_FORM);
  const [loading, setSaving] = useState(false);
  const [error,  setError]   = useState("");
  const [seoOpen, setSeoOpen] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    if (!editingBlog) {
      setForm(EMPTY_FORM);
      return;
    }

    // Fetch full blog to get content + seo
    fetch(`/api/admin/blogs/${editingBlog._id}`, { headers: ADMIN_HEADERS })
      .then((r) => r.json())
      .then((json) => {
        if (!json.success) return;
        const b: BlogFull = json.data.blog;
        setForm({
          title:      b.title,
          excerpt:    b.excerpt,
          content:    b.content,
          coverImage: b.coverImage,
          categories: b.categories,
          tags:       b.tags,
          status:     b.status,
          seo: {
            title:       b.seo?.title ?? "",
            description: b.seo?.description ?? "",
            keywords:    b.seo?.keywords ?? [],
          },
        });
      })
      .catch(() => setError("Failed to load blog data."));
  }, [editingBlog]);

  function patch(fields: Partial<EditorForm>) {
    setForm((f) => ({ ...f, ...fields }));
    setError("");
  }

  async function submit(overrideStatus?: BlogStatus) {
    const status = overrideStatus ?? form.status;
    if (!form.title.trim())   { setError("Title is required."); return; }
    if (!form.excerpt.trim()) { setError("Excerpt is required."); return; }
    if (!form.content.trim()) { setError("Content is required."); return; }

    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        status,
        seo: {
          title:       form.seo.title || undefined,
          description: form.seo.description || undefined,
          keywords:    form.seo.keywords.length ? form.seo.keywords : undefined,
        },
      };

      const url    = editingBlog ? `/api/admin/blogs/${editingBlog._id}` : "/api/admin/blogs";
      const method = editingBlog ? "PATCH" : "POST";

      const res  = await fetch(url, {
        method,
        headers: ADMIN_HEADERS,
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Failed to save blog.");
        return;
      }
      onSaved();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="sticky top-0 z-20 flex items-center gap-4 border-b border-gray-200 bg-white px-4 sm:px-6 lg:px-8 py-3.5">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <h2 className="flex-1 text-base font-black text-gray-900 truncate">
          {editingBlog ? "Edit Blog Post" : "New Blog Post"}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="hidden sm:block rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => submit("draft")}
            disabled={loading}
            className="rounded-xl border border-[#1a5c14] px-4 py-2 text-sm font-semibold text-[#1a5c14] hover:bg-[#1a5c14]/5 transition-colors disabled:opacity-60"
          >
            Save Draft
          </button>
          <button
            onClick={() => submit("published")}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-[#1a5c14] px-4 py-2 text-sm font-semibold text-white hover:bg-[#154a10] transition-colors disabled:opacity-60"
          >
            {loading
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Check className="h-4 w-4" />
            }
            Publish
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mx-4 sm:mx-6 lg:mx-8 mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Two-column layout */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">

        {/* ── Left: content form ── */}
        <div className="space-y-5">
          {/* Title */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <Label required>Title</Label>
            <input
              value={form.title}
              onChange={(e) => patch({ title: e.target.value })}
              placeholder="Write your blog title here…"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-xl font-bold text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1a5c14]/30 focus:border-[#1a5c14] focus:bg-white transition-colors"
            />
          </div>

          {/* Excerpt */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between mb-1.5">
              <Label required>Excerpt</Label>
              <span
                className={cn(
                  "text-[11px] font-medium tabular-nums",
                  form.excerpt.length > 280
                    ? "text-red-500"
                    : form.excerpt.length > 250
                    ? "text-amber-500"
                    : "text-gray-400"
                )}
              >
                {form.excerpt.length} / 300
              </span>
            </div>
            <textarea
              value={form.excerpt}
              onChange={(e) => patch({ excerpt: e.target.value.slice(0, 300) })}
              placeholder="A short summary shown in blog cards and search results…"
              rows={3}
              maxLength={300}
              className={cn(inputCls, "resize-none")}
            />
          </div>

          {/* Cover image */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <Label>Cover Image</Label>
            <CoverImageUpload
              value={form.coverImage}
              onChange={(url) => patch({ coverImage: url })}
            />
          </div>

          {/* Content */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <Label required>Content</Label>
            <textarea
              value={form.content}
              onChange={(e) => patch({ content: e.target.value })}
              placeholder="Write your blog content here…"
              className={cn(inputCls, "resize-y min-h-64 font-mono text-[13px] leading-relaxed")}
            />
            {form.content.trim() && (
              <p className="mt-1.5 text-[11px] text-gray-400">
                ~{Math.max(1, Math.round(form.content.trim().split(/\s+/).length / 200))} min read
                &nbsp;·&nbsp;
                {form.content.trim().split(/\s+/).length} words
              </p>
            )}
          </div>
        </div>

        {/* ── Right: settings panel ── */}
        <div className="space-y-4 lg:sticky lg:top-20">

          {/* Status */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <Label>Status</Label>
            <select
              value={form.status}
              onChange={(e) => patch({ status: e.target.value as BlogStatus })}
              className={inputCls}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Categories */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <ChipInput
              label="Categories"
              chips={form.categories}
              onChange={(cats) => patch({ categories: cats })}
              placeholder="e.g. health, fitness"
            />
          </div>

          {/* Tags */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <ChipInput
              label="Tags"
              chips={form.tags}
              onChange={(tags) => patch({ tags })}
              placeholder="e.g. nutrition, tips"
            />
          </div>

          {/* SEO — collapsible */}
          <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
            <button
              type="button"
              onClick={() => setSeoOpen((o) => !o)}
              className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
            >
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                SEO Settings
              </span>
              {seoOpen
                ? <ChevronUp className="h-4 w-4 text-gray-400" />
                : <ChevronDown className="h-4 w-4 text-gray-400" />
              }
            </button>
            {seoOpen && (
              <div className="px-5 pb-5 space-y-4 border-t border-gray-100">
                <div className="pt-4">
                  <Label>Meta Title</Label>
                  <input
                    value={form.seo.title}
                    onChange={(e) =>
                      patch({ seo: { ...form.seo, title: e.target.value } })
                    }
                    placeholder="SEO page title (max 70 chars)"
                    maxLength={70}
                    className={inputCls}
                  />
                  <p className="mt-1 text-[11px] text-gray-400">
                    {form.seo.title?.length ?? 0} / 70
                  </p>
                </div>
                <div>
                  <Label>Meta Description</Label>
                  <textarea
                    value={form.seo.description}
                    onChange={(e) =>
                      patch({ seo: { ...form.seo, description: e.target.value } })
                    }
                    placeholder="SEO description (max 160 chars)"
                    maxLength={160}
                    rows={3}
                    className={cn(inputCls, "resize-none")}
                  />
                  <p className="mt-1 text-[11px] text-gray-400">
                    {form.seo.description?.length ?? 0} / 160
                  </p>
                </div>
                <ChipInput
                  label="Meta Keywords"
                  chips={form.seo.keywords}
                  onChange={(kw) => patch({ seo: { ...form.seo, keywords: kw } })}
                  placeholder="e.g. supplements"
                />
              </div>
            )}
          </div>

          {/* Mobile action bar */}
          <div className="lg:hidden flex items-center gap-2">
            <button
              onClick={() => submit("draft")}
              disabled={loading}
              className="flex-1 rounded-xl border border-[#1a5c14] py-3 text-sm font-semibold text-[#1a5c14] hover:bg-[#1a5c14]/5 transition-colors disabled:opacity-60"
            >
              Save Draft
            </button>
            <button
              onClick={() => submit("published")}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#1a5c14] py-3 text-sm font-semibold text-white hover:bg-[#154a10] transition-colors disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Publish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── List View ────────────────────────────────────────────────────────────────

const FILTER_TABS: { key: string; label: string }[] = [
  { key: "all",       label: "All" },
  { key: "published", label: "Published" },
  { key: "draft",     label: "Drafts" },
  { key: "archived",  label: "Archived" },
];

function BlogList({
  onNew,
  onEdit,
}: {
  onNew: () => void;
  onEdit: (blog: BlogSummary) => void;
}) {
  const [blogs,     setBlogs]     = useState<BlogSummary[]>([]);
  const [stats,     setStats]     = useState<Stats>({ total: 0, published: 0, draft: 0, archived: 0 });
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState("all");
  const [search,    setSearch]    = useState("");
  const [query,     setQuery]     = useState("");
  const [deleting,  setDeleting]  = useState<string | null>(null);
  const [toast,     setToast]     = useState("");
  const [page,      setPage]      = useState(1);
  const [totalPages,setTotalPages]= useState(1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setQuery(search);
      setPage(1);
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  const fetchBlogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: filter,
        page:   String(page),
        limit:  "12",
        ...(query ? { q: query } : {}),
      });
      const res  = await fetch(`/api/admin/blogs?${params}`, { headers: ADMIN_HEADERS });
      const json = await res.json();
      if (!json.success) return;
      setBlogs(json.data.blogs);
      setTotalPages(json.data.totalPages);

      // Fetch stats from "all" for the badge counts (only when not filtered)
      if (filter === "all" && !query) {
        setStats({
          total:     json.data.total,
          published: json.data.blogs.filter((b: BlogSummary) => b.status === "published").length,
          draft:     json.data.blogs.filter((b: BlogSummary) => b.status === "draft").length,
          archived:  json.data.blogs.filter((b: BlogSummary) => b.status === "archived").length,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [filter, query, page]);

  useEffect(() => { fetchBlogs(); }, [fetchBlogs]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this blog post? This action cannot be undone.")) return;
    setDeleting(id);
    try {
      const res  = await fetch(`/api/admin/blogs/${id}`, {
        method: "DELETE",
        headers: ADMIN_HEADERS,
      });
      const json = await res.json();
      if (!res.ok) {
        showToast(json.error ?? "Failed to delete.");
        return;
      }
      setBlogs((prev) => prev.filter((b) => b._id !== id));
      showToast("Blog post deleted.");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-[#1a5c14] px-4 py-3 text-sm font-semibold text-white shadow-lg animate-in slide-in-from-top-2">
          <Check className="h-4 w-4" />
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1a5c14]/10">
            <BookOpen className="h-5 w-5 text-[#1a5c14]" />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900">Blog Posts</h1>
            <p className="text-xs text-gray-500">{stats.total} post{stats.total !== 1 ? "s" : ""} total</p>
          </div>
        </div>
        <button
          onClick={onNew}
          className="flex items-center gap-2 rounded-xl bg-[#1a5c14] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#154a10] transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Post
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Total",     count: stats.total,     color: "bg-gray-100 text-gray-700" },
          { label: "Published", count: stats.published, color: "bg-emerald-50 text-emerald-700" },
          { label: "Drafts",    count: stats.draft,     color: "bg-amber-50 text-amber-700" },
          { label: "Archived",  count: stats.archived,  color: "bg-gray-100 text-gray-500" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
            <p className="text-xs font-medium text-gray-500">{s.label}</p>
            <p className={cn("mt-1 text-2xl font-black", s.color.split(" ")[1])}>
              {s.count}
            </p>
          </div>
        ))}
      </div>

      {/* Filter tabs + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="flex rounded-xl border border-gray-200 bg-white p-1 gap-0.5 overflow-x-auto shrink-0">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setFilter(tab.key); setPage(1); }}
              className={cn(
                "rounded-lg px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors",
                filter === tab.key
                  ? "bg-[#1a5c14] text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search posts…"
            className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c14]/30 focus:border-[#1a5c14]"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-gray-200 bg-white overflow-hidden animate-pulse">
              <div className="aspect-video bg-gray-100" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-100 rounded-lg w-3/4" />
                <div className="h-3 bg-gray-100 rounded-lg w-full" />
                <div className="h-3 bg-gray-100 rounded-lg w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : blogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white py-24 text-center">
          <BookOpen className="h-12 w-12 text-gray-300 mb-3" />
          <p className="font-semibold text-gray-600">
            {search || filter !== "all" ? "No posts match your filters" : "No blog posts yet"}
          </p>
          {!search && filter === "all" && (
            <>
              <p className="text-sm text-gray-400 mt-1">Create your first blog post to get started.</p>
              <button
                onClick={onNew}
                className="mt-5 flex items-center gap-2 rounded-xl bg-[#1a5c14] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#154a10] transition-colors"
              >
                <Plus className="h-4 w-4" /> New Post
              </button>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {blogs.map((blog) => (
              <BlogCard
                key={blog._id}
                blog={blog}
                onEdit={onEdit}
                onDelete={handleDelete}
                deleting={deleting}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type View = "list" | "editor";

export default function AdminBlogsPage() {
  const [view,         setView]         = useState<View>("list");
  const [editingBlog,  setEditingBlog]  = useState<BlogSummary | null>(null);
  const [refreshKey,   setRefreshKey]   = useState(0);

  function openNew() {
    setEditingBlog(null);
    setView("editor");
  }

  function openEdit(blog: BlogSummary) {
    setEditingBlog(blog);
    setView("editor");
  }

  function backToList() {
    setView("list");
    setEditingBlog(null);
  }

  function onSaved() {
    setRefreshKey((k) => k + 1);
    backToList();
  }

  if (view === "editor") {
    return (
      <BlogEditor
        editingBlog={editingBlog}
        onBack={backToList}
        onSaved={onSaved}
      />
    );
  }

  return (
    <BlogList
      key={refreshKey}
      onNew={openNew}
      onEdit={openEdit}
    />
  );
}
