"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import {
  Plus, Pencil, Trash2, X, Upload, Loader2,
  Eye, EyeOff, Star, ImageIcon, Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CollectionType = "ethnic-wear" | "ayurvedic" | "mixed";
type ProductAssignment = "manual" | "auto-tags" | "auto-category";

interface CollectionData {
  _id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  thumbnail: string;
  banner: string;
  badge: string;
  type: CollectionType;
  displayOrder: number;
  isActive: boolean;
  isFeatured: boolean;
  productAssignment: ProductAssignment;
  manualProductIds: string[];
  autoTags: string[];
  autoCategorySlug: string;
}

type FormState = Omit<CollectionData, "_id" | "slug">;

const EMPTY: FormState = {
  name: "",
  shortDescription: "",
  description: "",
  thumbnail: "",
  banner: "",
  badge: "",
  type: "mixed",
  displayOrder: 0,
  isActive: true,
  isFeatured: false,
  productAssignment: "auto-tags",
  manualProductIds: [],
  autoTags: [],
  autoCategorySlug: "",
};

const TYPE_OPTIONS: { value: CollectionType; label: string }[] = [
  { value: "ethnic-wear", label: "👗 Ethnic Wear" },
  { value: "ayurvedic",   label: "🌿 Ayurvedic" },
  { value: "mixed",       label: "✨ Mixed / Both" },
];

const ASSIGNMENT_OPTIONS: { value: ProductAssignment; label: string; hint: string }[] = [
  { value: "auto-tags",     label: "By Tags",     hint: "Products matching any of the listed tags" },
  { value: "auto-category", label: "By Category", hint: "All products in a specific category" },
  { value: "manual",        label: "Manual",       hint: "You pick products by their IDs" },
];

const BADGE_PRESETS = [
  "🌸 New Arrivals", "✨ Best Sellers", "🌿 Cotton Collection",
  "🎉 Festive Collection", "🌱 Daily Wellness", "💪 Immunity Boosters",
  "👗 Office Wear", "🛍️ Sale Collection", "🎁 Gift Sets",
];

// ---------------------------------------------------------------------------
// Shared field wrapper
// ---------------------------------------------------------------------------

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1.5">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-gray-400">{hint}</p>}
    </div>
  );
}

function TextInput({
  value, onChange, placeholder, className,
}: {
  value: string; onChange: (v: string) => void; placeholder?: string; className?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        "w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none",
        "focus:border-[#1a5c14] focus:ring-1 focus:ring-[#1a5c14]",
        className
      )}
    />
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 rounded-full transition-colors shrink-0",
        checked ? "bg-[#1a5c14]" : "bg-gray-200"
      )}
    >
      <span className={cn(
        "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
        checked ? "translate-x-5" : "translate-x-0.5"
      )} />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Image uploader (single)
// ---------------------------------------------------------------------------

function ImageUploader({
  label, hint, value, folder, onChange,
}: {
  label: string; hint: string; value: string; folder: string;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", folder);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json() as { success: boolean; data?: { url: string }; error?: string };
      if (data.success && data.data?.url) {
        onChange(data.data.url);
        toast.success("Image uploaded");
      } else {
        toast.error(data.error ?? "Upload failed");
      }
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <Field label={label} hint={hint}>
      <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-gray-200">
        {value ? (
          <div className="relative">
            <Image
              src={value}
              alt="Preview"
              width={640}
              height={180}
              className="w-full object-cover"
              style={{ maxHeight: 180 }}
            />
            <button
              onClick={() => onChange("")}
              className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex w-full flex-col items-center justify-center gap-2 py-8 hover:bg-gray-50 transition-colors disabled:opacity-60"
          >
            {uploading
              ? <Loader2 className="h-7 w-7 animate-spin text-gray-400" />
              : <><Upload className="h-7 w-7 text-gray-300" /><span className="text-sm text-gray-400">Click to upload</span></>
            }
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
      </div>
      {value && (
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-[#1a5c14] hover:underline disabled:opacity-50"
        >
          <Upload className="h-3 w-3" /> Replace
        </button>
      )}
    </Field>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AdminCollectionsPage() {
  const [collections, setCollections] = useState<CollectionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState("");

  const patch = (fields: Partial<FormState>) => setForm((f) => ({ ...f, ...fields }));

  const fetchCollections = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/collections");
      const data = await res.json() as { success: boolean; data?: CollectionData[] };
      if (data.success && data.data) setCollections(data.data);
      else toast.error("Failed to load collections");
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCollections(); }, [fetchCollections]);

  function openCreate() {
    setEditingId(null);
    setForm({ ...EMPTY, displayOrder: collections.length });
    setTagInput("");
    setModalOpen(true);
  }

  function openEdit(c: CollectionData) {
    setEditingId(c._id);
    setForm({
      name: c.name, shortDescription: c.shortDescription, description: c.description,
      thumbnail: c.thumbnail, banner: c.banner, badge: c.badge,
      type: c.type, displayOrder: c.displayOrder, isActive: c.isActive, isFeatured: c.isFeatured,
      productAssignment: c.productAssignment, manualProductIds: c.manualProductIds ?? [],
      autoTags: c.autoTags ?? [], autoCategorySlug: c.autoCategorySlug ?? "",
    });
    setTagInput("");
    setModalOpen(true);
  }

  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (t && !form.autoTags.includes(t)) {
      patch({ autoTags: [...form.autoTags, t] });
    }
    setTagInput("");
  }

  function removeTag(tag: string) {
    patch({ autoTags: form.autoTags.filter((t) => t !== tag) });
  }

  async function handleSave() {
    if (!form.name.trim()) return toast.error("Collection name is required");
    setSaving(true);
    try {
      const url = editingId ? `/api/admin/collections/${editingId}` : "/api/admin/collections";
      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json() as { success: boolean; error?: string };
      if (data.success) {
        toast.success(editingId ? "Collection updated" : "Collection created");
        setModalOpen(false);
        fetchCollections();
      } else {
        toast.error(data.error ?? "Save failed");
      }
    } catch {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(id: string, field: "isActive" | "isFeatured", current: boolean) {
    try {
      const res = await fetch(`/api/admin/collections/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: !current }),
      });
      const data = await res.json() as { success: boolean };
      if (data.success)
        setCollections((cs) => cs.map((c) => c._id === id ? { ...c, [field]: !current } : c));
    } catch {
      toast.error("Update failed");
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/admin/collections/${id}`, { method: "DELETE" });
      const data = await res.json() as { success: boolean };
      if (data.success) {
        toast.success("Collection deleted");
        setCollections((cs) => cs.filter((c) => c._id !== id));
        setDeleteId(null);
      }
    } catch {
      toast.error("Delete failed");
    }
  }

  const typeLabel: Record<CollectionType, string> = {
    "ethnic-wear": "👗 Ethnic",
    "ayurvedic":   "🌿 Ayurvedic",
    "mixed":       "✨ Mixed",
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900">Collections</h1>
          <p className="mt-1 text-sm text-gray-500">
            Curated shopping experiences shown on the Collections page.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-[#1a5c14] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#103a0c] shrink-0"
        >
          <Plus className="h-4 w-4" /> New Collection
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : collections.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-20 text-center">
          <Layers className="h-12 w-12 text-gray-300 mb-3" />
          <p className="text-sm font-semibold text-gray-500">No collections yet</p>
          <p className="mt-1 text-xs text-gray-400">Create your first collection to get started</p>
          <button
            onClick={openCreate}
            className="mt-5 flex items-center gap-2 rounded-lg bg-[#1a5c14] px-4 py-2 text-sm font-semibold text-white"
          >
            <Plus className="h-4 w-4" /> New Collection
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {collections.map((c, idx) => (
            <div
              key={c._id}
              className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm"
            >
              <span className="text-xs font-bold text-gray-300 shrink-0 w-4 text-center">{idx + 1}</span>

              {/* Thumbnail */}
              <div className="h-12 w-16 sm:h-14 sm:w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                {c.thumbnail ? (
                  <Image src={c.thumbnail} alt={c.name} width={80} height={56}
                    className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <ImageIcon className="h-4 w-4 text-gray-300" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-black text-gray-900 truncate">{c.name}</p>
                  {c.badge && <span className="text-xs text-gray-500">{c.badge}</span>}
                </div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-[11px] text-gray-400">{typeLabel[c.type]}</span>
                  <span className="text-[11px] text-gray-300">·</span>
                  <span className="text-[11px] text-gray-400 font-mono">/collections/{c.slug}</span>
                </div>
              </div>

              {/* Featured star */}
              <button
                onClick={() => handleToggle(c._id, "isFeatured", c.isFeatured)}
                title={c.isFeatured ? "Remove from Featured" : "Mark as Featured"}
                className={cn(
                  "hidden sm:flex shrink-0 rounded-lg p-1.5 transition-colors",
                  c.isFeatured ? "text-amber-400 hover:text-amber-500" : "text-gray-300 hover:text-amber-300"
                )}
              >
                <Star className="h-4 w-4" fill={c.isFeatured ? "currentColor" : "none"} />
              </button>

              {/* Active badge */}
              <span className={cn(
                "hidden sm:inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold",
                c.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
              )}>
                {c.isActive ? "Active" : "Inactive"}
              </span>

              {/* Actions */}
              <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
                <button
                  onClick={() => handleToggle(c._id, "isActive", c.isActive)}
                  title={c.isActive ? "Deactivate" : "Activate"}
                  className="rounded-lg p-1.5 sm:p-2 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-700"
                >
                  {c.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => openEdit(c)}
                  className="rounded-lg p-1.5 sm:p-2 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setDeleteId(c._id)}
                  className="rounded-lg p-1.5 sm:p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 shrink-0">
              <h2 className="text-lg font-black text-gray-900">
                {editingId ? "Edit Collection" : "New Collection"}
              </h2>
              <button onClick={() => setModalOpen(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {/* Name */}
              <Field label="Collection Name *">
                <TextInput value={form.name} onChange={(v) => patch({ name: v })} placeholder="e.g. Cotton Collection" />
              </Field>

              {/* Badge + Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Badge / Label" hint="Short label shown on the card (emoji + text)">
                  <div className="space-y-2">
                    <TextInput value={form.badge} onChange={(v) => patch({ badge: v })} placeholder="🌸 New Arrivals" />
                    <div className="flex flex-wrap gap-1.5">
                      {BADGE_PRESETS.map((b) => (
                        <button key={b} type="button" onClick={() => patch({ badge: b })}
                          className="rounded-full border border-gray-200 px-2 py-0.5 text-[11px] hover:border-[#1a5c14] hover:text-[#1a5c14] transition-colors">
                          {b}
                        </button>
                      ))}
                    </div>
                  </div>
                </Field>

                <Field label="Collection Type">
                  <div className="space-y-1.5">
                    {TYPE_OPTIONS.map((opt) => (
                      <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="type" value={opt.value} checked={form.type === opt.value}
                          onChange={() => patch({ type: opt.value })}
                          className="text-[#1a5c14] accent-[#1a5c14]" />
                        <span className="text-sm text-gray-700">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </Field>
              </div>

              {/* Short description */}
              <Field label="Short Description" hint="Shown on collection cards (max 200 chars)">
                <textarea
                  value={form.shortDescription}
                  onChange={(e) => patch({ shortDescription: e.target.value })}
                  placeholder="Premium handcrafted kurtis for every occasion"
                  rows={2}
                  maxLength={200}
                  className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#1a5c14] focus:ring-1 focus:ring-[#1a5c14]"
                />
              </Field>

              {/* Description */}
              <Field label="Full Description" hint="Shown on the individual collection page">
                <textarea
                  value={form.description}
                  onChange={(e) => patch({ description: e.target.value })}
                  placeholder="Detailed collection description..."
                  rows={3}
                  className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#1a5c14] focus:ring-1 focus:ring-[#1a5c14]"
                />
              </Field>

              {/* Images */}
              <ImageUploader label="Thumbnail Image" hint="Card image — 600 × 400 px recommended"
                value={form.thumbnail} folder="sunera/collections"
                onChange={(url) => patch({ thumbnail: url })} />

              <ImageUploader label="Banner Image" hint="Hero banner — 1400 × 500 px recommended"
                value={form.banner} folder="sunera/collections"
                onChange={(url) => patch({ banner: url })} />

              {/* Product Assignment */}
              <Field label="Product Assignment" hint="How products are added to this collection">
                <div className="space-y-2">
                  {ASSIGNMENT_OPTIONS.map((opt) => (
                    <label key={opt.value}
                      className={cn(
                        "flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
                        form.productAssignment === opt.value
                          ? "border-[#1a5c14] bg-[#1a5c14]/5"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <input type="radio" name="assignment" value={opt.value}
                        checked={form.productAssignment === opt.value}
                        onChange={() => patch({ productAssignment: opt.value })}
                        className="mt-0.5 accent-[#1a5c14]" />
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{opt.label}</p>
                        <p className="text-xs text-gray-400">{opt.hint}</p>
                      </div>
                    </label>
                  ))}
                </div>

                {/* Dynamic sub-fields */}
                {form.productAssignment === "auto-tags" && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tags</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                        placeholder="Type a tag and press Enter"
                        className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1a5c14] focus:ring-1 focus:ring-[#1a5c14]"
                      />
                      <button type="button" onClick={addTag}
                        className="rounded-lg bg-[#1a5c14] px-3 py-2 text-sm font-semibold text-white hover:bg-[#103a0c]">
                        Add
                      </button>
                    </div>
                    {form.autoTags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {form.autoTags.map((t) => (
                          <span key={t} className="inline-flex items-center gap-1 rounded-full bg-[#1a5c14]/10 px-2.5 py-1 text-xs font-medium text-[#1a5c14]">
                            {t}
                            <button type="button" onClick={() => removeTag(t)} className="hover:text-red-600">
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {form.productAssignment === "auto-category" && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Category Slug</p>
                    <TextInput value={form.autoCategorySlug}
                      onChange={(v) => patch({ autoCategorySlug: v.toLowerCase().trim() })}
                      placeholder="e.g. ethnic-wear or ayurvedic-products" />
                    <p className="mt-1 text-[11px] text-gray-400">Use the exact slug from the Categories admin page</p>
                  </div>
                )}

                {form.productAssignment === "manual" && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Product IDs</p>
                    <textarea
                      value={form.manualProductIds.join("\n")}
                      onChange={(e) => patch({ manualProductIds: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) })}
                      rows={4}
                      placeholder={"683abc...\n683def..."}
                      className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2.5 text-sm font-mono outline-none focus:border-[#1a5c14] focus:ring-1 focus:ring-[#1a5c14]"
                    />
                    <p className="mt-1 text-[11px] text-gray-400">One product ID per line (copy from Products admin page)</p>
                  </div>
                )}
              </Field>

              {/* Display options */}
              <div className="grid grid-cols-2 gap-4">
                <Field label="Display Order" hint="Lower number = shown first">
                  <input type="number" value={form.displayOrder} min={0}
                    onChange={(e) => patch({ displayOrder: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#1a5c14] focus:ring-1 focus:ring-[#1a5c14]"
                  />
                </Field>
              </div>

              <div className="flex gap-8">
                <div className="flex items-center gap-3">
                  <Toggle checked={form.isActive} onChange={(v) => patch({ isActive: v })} />
                  <span className="text-sm font-medium text-gray-700">Active</span>
                </div>
                <div className="flex items-center gap-3">
                  <Toggle checked={form.isFeatured} onChange={(v) => patch({ isFeatured: v })} />
                  <div>
                    <span className="text-sm font-medium text-gray-700">Featured</span>
                    <p className="text-[11px] text-gray-400">Shows in the Featured section on the Collections page</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4 shrink-0">
              <button onClick={() => setModalOpen(false)}
                className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-[#1a5c14] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#103a0c] disabled:opacity-60">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingId ? "Save Changes" : "Create Collection"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-black text-gray-900">Delete Collection?</h3>
            <p className="mt-2 text-sm text-gray-500">
              This collection will be permanently removed. Products are not affected.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)}
                className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteId)}
                className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
