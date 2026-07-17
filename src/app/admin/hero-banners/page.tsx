"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import {
  Plus, Pencil, Trash2, GripVertical, X,
  Upload, Loader2, Eye, EyeOff, ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface BannerData {
  _id: string;
  eyebrow: string;
  headline: string;
  discount: string;
  sub: string;
  ctaLabel: string;
  ctaHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  image: string;
  bg: string;
  accentColor: string;
  order: number;
  isActive: boolean;
}

type FormState = Omit<BannerData, "_id">;

const EMPTY: FormState = {
  eyebrow: "",
  headline: "",
  discount: "",
  sub: "",
  ctaLabel: "SHOP NOW",
  ctaHref: "/shop",
  secondaryLabel: "READ MORE",
  secondaryHref: "/about",
  image: "",
  bg: "#f7f3ee",
  accentColor: "#1a5c14",
  order: 0,
  isActive: true,
};

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
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
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

export default function AdminHeroBannersPage() {
  const [banners, setBanners] = useState<BannerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const patch = (fields: Partial<FormState>) =>
    setForm((f) => ({ ...f, ...fields }));

  const fetchBanners = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/hero-banners");
      const data = await res.json();
      if (data.success) setBanners(data.data);
      else toast.error("Failed to load banners");
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBanners(); }, [fetchBanners]);

  function openCreate() {
    setEditingId(null);
    setForm({ ...EMPTY, order: banners.length });
    setModalOpen(true);
  }

  function openEdit(b: BannerData) {
    setEditingId(b._id);
    setForm({
      eyebrow: b.eyebrow,
      headline: b.headline,
      discount: b.discount,
      sub: b.sub,
      ctaLabel: b.ctaLabel,
      ctaHref: b.ctaHref,
      secondaryLabel: b.secondaryLabel,
      secondaryHref: b.secondaryHref,
      image: b.image,
      bg: b.bg,
      accentColor: b.accentColor,
      order: b.order,
      isActive: b.isActive,
    });
    setModalOpen(true);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "sunera/hero-banners");
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.success) {
        patch({ image: data.data.url });
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

  async function handleSave() {
    if (!form.eyebrow.trim()) return toast.error("Eyebrow text is required");
    if (!form.headline.trim()) return toast.error("Headline is required");
    setSaving(true);
    try {
      const url = editingId
        ? `/api/admin/hero-banners/${editingId}`
        : "/api/admin/hero-banners";
      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(editingId ? "Slide updated" : "Slide created");
        setModalOpen(false);
        fetchBanners();
      } else {
        toast.error(data.error ?? "Save failed");
      }
    } catch {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(id: string, active: boolean) {
    try {
      const res = await fetch(`/api/admin/hero-banners/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !active }),
      });
      const data = await res.json();
      if (data.success)
        setBanners((bs) =>
          bs.map((b) => (b._id === id ? { ...b, isActive: !active } : b))
        );
    } catch {
      toast.error("Update failed");
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/admin/hero-banners/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Slide deleted");
        setBanners((bs) => bs.filter((b) => b._id !== id));
        setDeleteId(null);
      }
    } catch {
      toast.error("Delete failed");
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Hero Banners</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage homepage hero slider — images and text per slide.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-[#1a5c14] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#103a0c]"
        >
          <Plus className="h-4 w-4" />
          Add Slide
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : banners.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-20 text-center">
          <ImageIcon className="h-12 w-12 text-gray-300 mb-3" />
          <p className="text-sm font-semibold text-gray-500">No slides yet</p>
          <p className="mt-1 text-xs text-gray-400">Add your first hero slide to get started</p>
          <button
            onClick={openCreate}
            className="mt-5 flex items-center gap-2 rounded-lg bg-[#1a5c14] px-4 py-2 text-sm font-semibold text-white"
          >
            <Plus className="h-4 w-4" />
            Add Slide
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map((b, idx) => (
            <div
              key={b._id}
              className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex shrink-0 items-center gap-1 text-gray-300">
                <GripVertical className="h-5 w-5" />
                <span className="text-xs font-bold text-gray-400">{idx + 1}</span>
              </div>

              {/* Thumbnail */}
              <div className="h-16 w-28 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                {b.image ? (
                  <Image
                    src={b.image}
                    alt={b.headline}
                    width={112}
                    height={64}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center"
                    style={{ backgroundColor: b.bg }}
                  >
                    <ImageIcon className="h-5 w-5 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="text-xs italic text-gray-400">{b.eyebrow}</p>
                <p className="truncate text-sm font-black text-gray-900">{b.headline}</p>
                {b.discount && (
                  <p className="text-xs text-gray-500">{b.discount}</p>
                )}
              </div>

              {/* Status badge */}
              <span
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold",
                  b.isActive
                    ? "bg-green-50 text-green-700"
                    : "bg-gray-100 text-gray-500"
                )}
              >
                {b.isActive ? "Active" : "Inactive"}
              </span>

              {/* Actions */}
              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => handleToggle(b._id, b.isActive)}
                  title={b.isActive ? "Deactivate" : "Activate"}
                  className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-700"
                >
                  {b.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => openEdit(b)}
                  className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setDeleteId(b._id)}
                  className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
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
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
          />
          <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-lg font-black text-gray-900">
                {editingId ? "Edit Slide" : "New Slide"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable form body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {/* Image upload */}
              <Field label="Banner Image" hint="Recommended: 1920 × 620 px · JPG, PNG, WebP">
                <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-gray-200">
                  {form.image ? (
                    <div className="relative">
                      <Image
                        src={form.image}
                        alt="Banner preview"
                        width={640}
                        height={200}
                        className="w-full object-cover"
                        style={{ maxHeight: 200 }}
                      />
                      <button
                        onClick={() => patch({ image: "" })}
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
                      className="flex w-full flex-col items-center justify-center gap-2 py-10 hover:bg-gray-50 transition-colors disabled:opacity-60"
                    >
                      {uploading ? (
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                      ) : (
                        <>
                          <Upload className="h-8 w-8 text-gray-300" />
                          <span className="text-sm text-gray-400">
                            Click to upload image
                          </span>
                        </>
                      )}
                    </button>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleUpload}
                  />
                </div>
                {form.image && (
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-[#1a5c14] hover:underline disabled:opacity-50"
                  >
                    <Upload className="h-3 w-3" />
                    Replace image
                  </button>
                )}
              </Field>

              {/* Eyebrow + Accent color */}
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <Field label="Eyebrow Text *">
                    <TextInput
                      value={form.eyebrow}
                      onChange={(v) => patch({ eyebrow: v })}
                      placeholder="Season Sale"
                    />
                  </Field>
                </div>
                <Field label="Accent Color">
                  <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5">
                    <input
                      type="color"
                      value={form.accentColor}
                      onChange={(e) => patch({ accentColor: e.target.value })}
                      className="h-5 w-5 cursor-pointer rounded border-0"
                    />
                    <span className="text-xs text-gray-500">{form.accentColor}</span>
                  </div>
                </Field>
              </div>

              {/* Headline */}
              <Field label="Headline *" hint="Press Enter for a new line (e.g. PREMIUM ↵ SUPPLEMENTS)">
                <textarea
                  value={form.headline}
                  onChange={(e) => patch({ headline: e.target.value })}
                  placeholder={"PREMIUM\nSUPPLEMENTS"}
                  rows={2}
                  className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#1a5c14] focus:ring-1 focus:ring-[#1a5c14]"
                />
              </Field>

              {/* Discount + BG color */}
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <Field label="Discount / Offer Text">
                    <TextInput
                      value={form.discount}
                      onChange={(v) => patch({ discount: v })}
                      placeholder="Min. 20–40% Off"
                    />
                  </Field>
                </div>
                <Field label="BG Color (no image)">
                  <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5">
                    <input
                      type="color"
                      value={form.bg}
                      onChange={(e) => patch({ bg: e.target.value })}
                      className="h-5 w-5 cursor-pointer rounded border-0"
                    />
                    <span className="text-xs text-gray-500">{form.bg}</span>
                  </div>
                </Field>
              </div>

              {/* Subtitle */}
              <Field label="Subtitle / Description">
                <textarea
                  value={form.sub}
                  onChange={(e) => patch({ sub: e.target.value })}
                  placeholder="Scientifically formulated for India's athletes…"
                  rows={2}
                  className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#1a5c14] focus:ring-1 focus:ring-[#1a5c14]"
                />
              </Field>

              {/* Primary CTA */}
              <div className="grid grid-cols-2 gap-4">
                <Field label="Primary Button Label">
                  <TextInput
                    value={form.ctaLabel}
                    onChange={(v) => patch({ ctaLabel: v })}
                    placeholder="SHOP NOW"
                  />
                </Field>
                <Field label="Primary Button Link">
                  <TextInput
                    value={form.ctaHref}
                    onChange={(v) => patch({ ctaHref: v })}
                    placeholder="/shop"
                  />
                </Field>
              </div>

              {/* Secondary CTA */}
              <div className="grid grid-cols-2 gap-4">
                <Field label="Secondary Button Label">
                  <TextInput
                    value={form.secondaryLabel}
                    onChange={(v) => patch({ secondaryLabel: v })}
                    placeholder="READ MORE"
                  />
                </Field>
                <Field label="Secondary Button Link">
                  <TextInput
                    value={form.secondaryHref}
                    onChange={(v) => patch({ secondaryHref: v })}
                    placeholder="/about"
                  />
                </Field>
              </div>

              {/* Order + Active toggle */}
              <div className="grid grid-cols-2 gap-4 items-end">
                <Field label="Display Order">
                  <input
                    type="number"
                    value={form.order}
                    onChange={(e) => patch({ order: parseInt(e.target.value) || 0 })}
                    min={0}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#1a5c14] focus:ring-1 focus:ring-[#1a5c14]"
                  />
                </Field>
                <div className="flex items-center gap-3 pb-1">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={form.isActive}
                    onClick={() => patch({ isActive: !form.isActive })}
                    className={cn(
                      "relative h-6 w-11 rounded-full transition-colors",
                      form.isActive ? "bg-[#1a5c14]" : "bg-gray-200"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                        form.isActive ? "translate-x-5" : "translate-x-0.5"
                      )}
                    />
                  </button>
                  <span className="text-sm font-medium text-gray-700">
                    {form.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-[#1a5c14] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#103a0c] disabled:opacity-60"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingId ? "Save Changes" : "Create Slide"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setDeleteId(null)}
          />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-black text-gray-900">Delete Slide?</h3>
            <p className="mt-2 text-sm text-gray-500">
              This slide will be permanently removed from the homepage slider.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
