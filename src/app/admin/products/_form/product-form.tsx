"use client";

import { useState, useEffect, useCallback, useRef, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2, Check, ArrowLeft, Sparkles, ImageIcon,
  Package, DollarSign, AlignLeft, BadgeCheck,
  Upload, X, AlertCircle, CheckCircle2, Layers, Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Category { _id: string; name: string; slug: string; parentId?: string | null }

interface VariantRow { size: string; color?: string; colorHex?: string; stock: string; price: string; images?: string[] }

interface FormData {
  name: string; slug: string; description: string; shortDescription: string;
  category: string; basePrice: string; compareAtPrice: string;
  stock: string; sku: string; brand: string; tags: string;
  benefits: string; ingredients: string;
  isActive: boolean; isFeatured: boolean; isBestSeller: boolean; isNewArrival: boolean;
}

interface Toast { msg: string; type: "error" | "success" }

// ─── Helpers ──────────────────────────────────────────────────────────────────
const EMPTY: FormData = {
  name: "", slug: "", description: "", shortDescription: "",
  category: "", basePrice: "", compareAtPrice: "", stock: "", sku: "",
  brand: "", tags: "", benefits: "", ingredients: "",
  isActive: true, isFeatured: false, isBestSeller: false, isNewArrival: true,
};

const CLOTHING_PRESETS  = ["XS", "S", "M", "L", "XL", "XXL", "2XL", "3XL", "28", "30", "32", "34", "36", "38", "40", "42", "44"];
const AYURVEDIC_PRESETS = ["30ml", "50ml", "100ml", "200ml", "250ml", "500ml", "1L", "30g", "50g", "100g", "200g", "250g", "500g", "1kg"];

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function ToastNotification({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  return (
    <div className={cn(
      "fixed bottom-6 right-6 z-999 flex items-start gap-3 rounded-2xl px-5 py-4 shadow-2xl text-white text-sm font-medium max-w-sm animate-fade-up",
      toast.type === "error" ? "bg-red-600" : "bg-[#1a5c14]"
    )}>
      {toast.type === "error"
        ? <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
        : <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />}
      <span className="flex-1 leading-snug">{toast.msg}</span>
      <button onClick={onClose} className="ml-1 shrink-0 opacity-70 hover:opacity-100">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── Image Uploader ───────────────────────────────────────────────────────────
function ImageUploader({ images, onChange, onToast }: {
  images: string[];
  onChange: (imgs: string[]) => void;
  onToast: (msg: string, type: "error" | "success") => void;
}) {
  const inputRef                        = useRef<HTMLInputElement>(null);
  const [uploading, setUploading]       = useState(false);
  const [progress, setProgress]         = useState({ done: 0, total: 0 });
  const [dropZoneOver, setDropZoneOver] = useState(false);
  // For drag-to-reorder
  const [dragIdx, setDragIdx]           = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx]   = useState<number | null>(null);

  async function uploadFiles(files: File[]) {
    if (!files.length) return;
    setUploading(true);
    setProgress({ done: 0, total: files.length });
    const results: string[] = [];
    for (const file of files) {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "sunera/products");
      try {
        const res  = await fetch("/api/admin/upload", { method: "POST", body: fd });
        const json = await res.json();
        if (json.success) results.push(json.data.url);
        else onToast(`Could not upload "${file.name}".`, "error");
      } catch {
        onToast(`Upload failed for "${file.name}".`, "error");
      }
      setProgress((p) => ({ ...p, done: p.done + 1 }));
    }
    if (results.length) onChange([...images, ...results]);
    setUploading(false);
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    uploadFiles(files);
  }

  function handleDropZone(e: React.DragEvent) {
    e.preventDefault(); setDropZoneOver(false);
    // Ignore if it's an image tile being reordered (no files in dataTransfer)
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
    if (files.length) uploadFiles(files);
  }

  function removeImage(idx: number) { onChange(images.filter((_, i) => i !== idx)); }

  // ── Drag-to-reorder handlers ──
  function onImgDragStart(e: React.DragEvent, idx: number) {
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = "move";
    // Prevent drop zone from firing while reordering
    e.dataTransfer.setData("reorder", "1");
  }

  function onImgDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverIdx !== idx) setDragOverIdx(idx);
  }

  function onImgDrop(e: React.DragEvent, idx: number) {
    e.preventDefault();
    e.stopPropagation();
    if (dragIdx === null || dragIdx === idx) { resetDrag(); return; }
    const next = [...images];
    const [item] = next.splice(dragIdx, 1);
    next.splice(idx, 0, item);
    onChange(next);
    resetDrag();
  }

  function resetDrag() { setDragIdx(null); setDragOverIdx(null); }

  return (
    <div className="space-y-4">
      {/* Upload drop zone */}
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!e.dataTransfer.types.includes("reorder")) setDropZoneOver(true);
        }}
        onDragLeave={() => setDropZoneOver(false)}
        onDrop={handleDropZone}
        className={cn(
          "relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed py-10 transition-all",
          dropZoneOver ? "border-[#1a5c14] bg-green-50" : "border-gray-200 bg-gray-50 hover:border-[#1a5c14] hover:bg-green-50/40",
          uploading && "pointer-events-none opacity-70"
        )}
      >
        {uploading ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-[#1a5c14]" />
            <p className="text-sm font-semibold text-gray-600">Uploading {progress.done + 1} of {progress.total}…</p>
          </>
        ) : (
          <>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <Upload className="h-5 w-5 text-[#1a5c14]" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-700">Click to upload <span className="text-[#1a5c14]">or drag &amp; drop</span></p>
              <p className="mt-1 text-xs text-gray-400">PNG, JPG, WEBP — multiple images supported</p>
            </div>
          </>
        )}
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleInputChange} />
      </div>

      {images.length > 0 && (
        <>
          <p className="text-xs text-gray-400">Drag images to reorder — the first image is shown as the main photo.</p>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
            {images.map((url, i) => (
              <div
                key={url + i}
                draggable
                onDragStart={(e) => onImgDragStart(e, i)}
                onDragOver={(e) => onImgDragOver(e, i)}
                onDrop={(e) => onImgDrop(e, i)}
                onDragEnd={resetDrag}
                className={cn(
                  "group relative aspect-square overflow-hidden rounded-xl border-2 bg-gray-100 cursor-grab active:cursor-grabbing transition-all select-none",
                  dragOverIdx === i && dragIdx !== i
                    ? "border-[#1a5c14] scale-105 shadow-lg"
                    : "border-gray-200",
                  dragIdx === i && "opacity-40 scale-95"
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-full w-full object-cover pointer-events-none" />
                {i === 0 && (
                  <span className="absolute left-1 top-1 rounded-md bg-[#1a5c14] px-1.5 py-0.5 text-[10px] font-bold text-white">Main</span>
                )}
                <div className="absolute inset-0 flex items-end justify-end p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button type="button" onClick={() => removeImage(i)}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-white shadow-md">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const COLOR_PRESETS = [
  { name: "Black",  hex: "#000000" },
  { name: "White",  hex: "#ffffff" },
  { name: "Red",    hex: "#ef4444" },
  { name: "Navy",   hex: "#1e3a8a" },
  { name: "Blue",   hex: "#3b82f6" },
  { name: "Green",  hex: "#10b981" },
  { name: "Beige",  hex: "#f5f5dc" },
  { name: "Pink",   hex: "#ec4899" },
  { name: "Yellow", hex: "#eab308" },
];

// ─── Variants Section ─────────────────────────────────────────────────────────
function VariantsSection({
  categoryType, variants, onChange, variantErrors, onClearVariantError, uploadedImages,
}: {
  categoryType: "clothing" | "ayurvedic" | null;
  variants: VariantRow[];
  onChange: (v: VariantRow[]) => void;
  variantErrors?: Set<string>;
  onClearVariantError?: (size: string) => void;
  uploadedImages?: string[];
}) {
  const [custom, setCustom] = useState("");
  const [customColor, setCustomColor] = useState("");
  const [customPriceSizes, setCustomPriceSizes] = useState<Set<string>>(new Set());

  const presets = categoryType === "clothing" ? CLOTHING_PRESETS : categoryType === "ayurvedic" ? AYURVEDIC_PRESETS : [];
  const label   = categoryType === "clothing" ? "Size" : "Pack Size";

  if (!categoryType) return (
    <p className="text-sm text-gray-400 italic">Select a Clothing or Ayurvedic category above to enable size/pack variants.</p>
  );

  function toggle(size: string) {
    const exists = variants.find((v) => v.size === size);
    if (exists) {
      onChange(variants.filter((v) => v.size !== size));
      setCustomPriceSizes((prev) => { const next = new Set(prev); next.delete(size); return next; });
    } else {
      onChange([...variants, { size, stock: "", price: "" }]);
    }
  }

  function addCustom() {
    const s = custom.trim();
    if (!s || variants.find((v) => v.size === s)) return;
    onChange([...variants, { size: s, stock: "", price: "" }]);
    setCustom("");
  }

  function update(idx: number, field: keyof VariantRow, value: unknown) {
    onChange(variants.map((v, i) => (i === idx ? { ...v, [field]: value } : v)));
  }

  function enableCustomPrice(size: string) {
    setCustomPriceSizes((prev) => new Set(prev).add(size));
  }

  function clearCustomPrice(idx: number, size: string) {
    setCustomPriceSizes((prev) => { const next = new Set(prev); next.delete(size); return next; });
    update(idx, "price", "");
  }

  function toggleColorImage(idx: number, imgUrl: string) {
    const v = variants[idx];
    const currentImgs = v.images ?? [];
    const exists = currentImgs.includes(imgUrl);
    const nextImgs = exists ? currentImgs.filter((url) => url !== imgUrl) : [...currentImgs, imgUrl];
    update(idx, "images", nextImgs);
  }

  return (
    <div className="space-y-5">
      {/* Preset toggles */}
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">Quick Add {label}s</p>
        <div className="flex flex-wrap gap-2">
          {presets.map((s) => {
            const active = Boolean(variants.find((v) => v.size === s));
            return (
              <button key={s} type="button" onClick={() => toggle(s)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all",
                  active ? "border-[#1a5c14] bg-[#1a5c14] text-white" : "border-gray-200 bg-white text-gray-600 hover:border-[#1a5c14] hover:text-[#1a5c14]"
                )}>
                {active ? <><Check className="inline h-3 w-3 mr-1" />{s}</> : s}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom size */}
      <div className="flex gap-2">
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustom())}
          placeholder={categoryType === "clothing" ? "e.g. 46, 4XL…" : "e.g. 750ml, 2kg…"}
          className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#1a5c14] focus:outline-none focus:ring-1 focus:ring-[#1a5c14]"
        />
        <button type="button" onClick={addCustom}
          className="flex items-center gap-1.5 rounded-xl bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200 transition-colors">
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>

      {/* Variant rows */}
      {variants.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Set Color, Stock &amp; Price per {label}</p>
          <div className="space-y-3">
            {variants.map((v, idx) => {
              const isCustom = customPriceSizes.has(v.size) || v.price !== "";
              const hasStockErr = variantErrors?.has(v.size);
              return (
                <div id={`variant-row-${v.size}`} key={idx} className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3 shadow-2xs">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
                    <span className={cn("text-sm font-black uppercase tracking-wide", hasStockErr ? "text-red-600" : "text-gray-900")}>
                      {label}: {v.size}
                    </span>

                    <button type="button" onClick={() => {
                      onChange(variants.filter((_, i) => i !== idx));
                      setCustomPriceSizes((prev) => { const next = new Set(prev); next.delete(v.size); return next; });
                    }}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
                    {/* Color Input */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-gray-400 mb-1">Color Name (Optional)</label>
                      <div className="flex items-center gap-1.5">
                        {v.colorHex && (
                          <span className="h-4 w-4 rounded-full border border-gray-300 shrink-0" style={{ backgroundColor: v.colorHex }} />
                        )}
                        <input
                          type="text"
                          value={v.color ?? ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            const matched = COLOR_PRESETS.find((c) => c.name.toLowerCase() === val.trim().toLowerCase());
                            update(idx, "color", val);
                            if (matched) update(idx, "colorHex", matched.hex);
                          }}
                          placeholder="e.g. Black, Red, Navy"
                          className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold focus:border-[#1a5c14] focus:outline-none"
                        />
                      </div>
                      {/* Color preset quick pick */}
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {COLOR_PRESETS.map((c) => (
                          <button
                            key={c.name}
                            type="button"
                            onClick={() => { update(idx, "color", c.name); update(idx, "colorHex", c.hex); }}
                            className={cn(
                              "flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-bold transition-colors",
                              v.color?.toLowerCase() === c.name.toLowerCase() ? "border-[#1a5c14] bg-green-50 text-[#1a5c14]" : "border-gray-200 text-gray-500 hover:border-gray-300"
                            )}
                          >
                            <span className="h-2.5 w-2.5 rounded-full border border-black/10" style={{ backgroundColor: c.hex }} />
                            {c.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Stock Input */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-gray-400 mb-1">Stock *</label>
                      <input
                        type="number" min="0" value={v.stock}
                        onChange={(e) => { update(idx, "stock", e.target.value); onClearVariantError?.(v.size); }}
                        placeholder="0"
                        className={cn(
                          "w-full rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1",
                          hasStockErr
                            ? "border border-red-400 focus:border-red-500 focus:ring-red-400"
                            : "border border-gray-200 focus:border-[#1a5c14] focus:ring-[#1a5c14]"
                        )}
                      />
                      {hasStockErr && <p className="mt-0.5 text-[10px] font-medium text-red-500">Stock is required</p>}
                    </div>

                    {/* Price Override */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-gray-400 mb-1">Price ₹</label>
                      {isCustom ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number" min="0" step="0.01" value={v.price}
                            onChange={(e) => update(idx, "price", e.target.value)}
                            placeholder="Enter price"
                            className="w-full rounded-lg border border-[#1a5c14] px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#1a5c14]"
                          />
                          <button type="button" onClick={() => clearCustomPrice(idx, v.size)} title="Reset to selling price"
                            className="shrink-0 rounded-lg p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button type="button" onClick={() => enableCustomPrice(v.size)}
                          className="flex w-full items-center justify-between rounded-lg border border-dashed border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:border-[#1a5c14] hover:text-[#1a5c14] transition-all">
                          <span className="truncate">Same as base price</span>
                          <span className="underline font-bold shrink-0">Set</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Color Specific Images Selector */}
                  {uploadedImages && uploadedImages.length > 0 && (
                    <div className="border-t border-gray-100 pt-3">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                        Map Images for {v.color ? `"${v.color}"` : "this variant"} <span className="font-normal text-gray-400">(Click to attach photos)</span>
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {uploadedImages.map((imgUrl, imgIdx) => {
                          const attached = (v.images ?? []).includes(imgUrl);
                          return (
                            <button
                              key={imgIdx}
                              type="button"
                              onClick={() => toggleColorImage(idx, imgUrl)}
                              className={cn(
                                "relative aspect-square h-12 w-12 overflow-hidden rounded-lg border-2 transition-all",
                                attached ? "border-[#1a5c14] ring-2 ring-[#1a5c14]/30" : "border-gray-200 opacity-60 hover:opacity-100"
                              )}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={imgUrl} alt="" className="h-full w-full object-cover" />
                              {attached && (
                                <div className="absolute inset-0 bg-[#1a5c14]/20 flex items-center justify-center">
                                  <Check className="h-4 w-4 text-white drop-shadow-md" strokeWidth={3} />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-3.5 sm:p-6 space-y-4 shadow-2xs overflow-hidden">
      <h2 className="flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-500">
        <Icon className="h-4 w-4 shrink-0" /> {title}
      </h2>
      {children}
    </div>
  );
}

// ─── Main Form ────────────────────────────────────────────────────────────────
interface Props { productId?: string }

export default function ProductForm({ productId }: Props) {
  const router = useRouter();
  const isEdit = Boolean(productId);

  const [form, setForm]             = useState<FormData>(EMPTY);
  const [images, setImages]         = useState<string[]>([]);
  const [variants, setVariants]     = useState<VariantRow[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving]         = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(isEdit);
  const [toast, setToast]           = useState<Toast | null>(null);
  const [errors, setErrors]         = useState<Record<string, string>>({});
  const [variantErrors, setVariantErrors] = useState<Set<string>>(new Set());
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(msg: string, type: "error" | "success" = "error") {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = setTimeout(() => setToast(null), 4500);
  }

  function scrollToField(id: string) {
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  }

  function clearError(key: string) {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((json) => setCategories(json.data ?? []));
  }, []);

  const loadProduct = useCallback(async () => {
    if (!productId) return;
    setLoadingProduct(true);
    try {
      const res  = await fetch(`/api/admin/products/${productId}`);
      const json = await res.json();
      if (!json.success) { showToast("Product not found.", "error"); return; }
      const p = json.data.product;
      setForm({
        name:             p.name ?? "",
        slug:             p.slug ?? "",
        description:      p.description ?? "",
        shortDescription: p.shortDescription ?? "",
        category:         p.category?._id ?? p.category ?? "",
        basePrice:        String(p.basePrice ?? ""),
        compareAtPrice:   String(p.compareAtPrice ?? ""),
        stock:            String(p.stock ?? ""),
        sku:              p.sku ?? "",
        brand:            p.brand ?? "",
        tags:             (p.tags ?? []).join(", "),
        benefits:         (p.benefits ?? []).join("\n"),
        ingredients:      (p.ingredients ?? []).join("\n"),
        isActive:         p.isActive ?? true,
        isFeatured:       p.isFeatured ?? false,
        isBestSeller:     p.isBestSeller ?? false,
        isNewArrival:     p.isNewArrival ?? false,
      });
      setImages(p.images ?? []);
      setVariants((p.variants ?? [])
        .map((v: { size?: string; color?: string; colorHex?: string; stock: number; price?: number; images?: string[] }) => ({
          size:     v.size ?? "",
          color:    v.color ?? "",
          colorHex: v.colorHex ?? "",
          stock:    String(v.stock ?? 0),
          price:    v.price ? String(v.price) : "",
          images:   v.images ?? [],
        })));
    } finally {
      setLoadingProduct(false);
    }
  }, [productId]);

  useEffect(() => { loadProduct(); }, [loadProduct]);

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    clearError(key as string);
  }

  function handleNameChange(name: string) {
    setForm((f) => ({ ...f, name, ...(isEdit ? {} : { slug: slugify(name) }) }));
    clearError("name");
  }

  // Detect category type
  const selectedCat = categories.find((c) => c._id === form.category);
  const parentCat   = selectedCat?.parentId
    ? categories.find((c) => c._id === selectedCat.parentId)
    : selectedCat;
  const categoryType: "clothing" | "ayurvedic" | null =
    parentCat?.slug === "clothes" ? "clothing" :
    parentCat?.slug === "ayurvedic-products" ? "ayurvedic" : null;

  async function handleSave() {
    const errs: Record<string, string> = {};
    if (!form.name.trim())      errs.name        = "Product name is required.";
    if (!form.sku.trim())       errs.sku         = "Product code is required.";
    if (!form.basePrice.trim()) errs.basePrice   = "Selling price is required.";
    else if (form.compareAtPrice && parseFloat(form.basePrice) > parseFloat(form.compareAtPrice))
                                errs.basePrice   = "Selling price cannot be higher than MRP.";
    if (variants.length === 0 && !form.stock.trim()) errs.stock = "Stock quantity is required.";
    if (!form.category)         errs.category    = "Please select a category.";
    if (!form.description.trim()) errs.description = "Description is required.";
    if (images.length === 0)    errs.images      = "Please upload at least one image.";

    const vErrs = new Set<string>(variants.filter((v) => !v.stock.trim()).map((v) => v.size));

    if (Object.keys(errs).length > 0 || vErrs.size > 0) {
      setErrors(errs);
      setVariantErrors(vErrs);
      const firstKey = Object.keys(errs)[0];
      if (firstKey)        scrollToField(`field-${firstKey}`);
      else if (vErrs.size) scrollToField(`variant-row-${[...vErrs][0]}`);
      return;
    }
    setErrors({});
    setVariantErrors(new Set());

    setSaving(true);
    try {
      const payload = {
        name:             form.name.trim(),
        slug:             form.slug.trim() || slugify(form.name),
        description:      form.description.trim(),
        shortDescription: form.shortDescription.trim() || undefined,
        category:         form.category,
        basePrice:        parseFloat(form.basePrice),
        compareAtPrice:   form.compareAtPrice ? parseFloat(form.compareAtPrice) : undefined,
        stock: variants.length > 0
          ? variants.reduce((sum, v) => sum + (parseInt(v.stock, 10) || 0), 0)
          : parseInt(form.stock, 10),
        sku:              form.sku.trim(),
        brand:            form.brand.trim() || undefined,
        tags:             form.tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean),
        benefits:         form.benefits.split("\n").map((s) => s.trim()).filter(Boolean),
        ingredients:      form.ingredients.split("\n").map((s) => s.trim()).filter(Boolean),
        images,
        variants:         variants.map((v) => ({
          sku:      `${form.sku.trim()}-${(v.color ? v.color + "-" : "") + v.size}`.replace(/\s/g, ""),
          size:     v.size || undefined,
          color:    v.color || undefined,
          colorHex: v.colorHex || undefined,
          stock:    parseInt(v.stock, 10) || 0,
          price:    v.price ? parseFloat(v.price) : undefined,
          images:   v.images && v.images.length > 0 ? v.images : undefined,
        })),
        isActive:   form.isActive,
        isFeatured: form.isFeatured,
        isBestSeller: form.isBestSeller,
        isNewArrival: form.isNewArrival,
      };

      const url    = isEdit ? `/api/admin/products/${productId}` : "/api/admin/products";
      const method = isEdit ? "PUT" : "POST";
      const res    = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const json   = await res.json();
      if (!res.ok) { showToast(json.error ?? "Something went wrong.", "error"); return; }
      showToast(isEdit ? "Product updated!" : "Product created!", "success");
      setTimeout(() => router.push("/admin/products"), 1200);
    } finally {
      setSaving(false);
    }
  }

  const parents = categories.filter((c) => !c.parentId);
  const subsOf  = (id: string) => categories.filter((c) => c.parentId === id);

  if (loadingProduct) {
    return <div className="flex items-center justify-center py-32"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>;
  }

  const FLAGS = [
    { key: "isActive"     as const, label: "Active",      sub: "Visible to shoppers",    active: "border-green-500 bg-green-50"  },
    { key: "isFeatured"   as const, label: "Featured",    sub: "Shown on home page",     active: "border-amber-500 bg-amber-50"  },
    { key: "isBestSeller" as const, label: "Best Seller", sub: "Shows bestseller badge", active: "border-[#1a5c14] bg-green-50"  },
    { key: "isNewArrival" as const, label: "New Arrival", sub: "Shows 'New' badge",      active: "border-blue-500 bg-blue-50"    },
  ] as const;

  return (
    <div className="p-3 sm:p-6 lg:p-8 max-w-3xl space-y-4 sm:space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.push("/admin/products")}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-xl font-black text-gray-900">{isEdit ? "Edit Product" : "Add Product"}</h1>
          <p className="text-sm text-gray-500">{isEdit ? "Update product details." : "Fill in the details to create a new product."}</p>
        </div>
      </div>

      {/* Labels & Visibility */}
      <Section icon={BadgeCheck} title="Labels & Visibility">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {FLAGS.map(({ key, label, sub, active }) => (
            <button key={key} type="button" onClick={() => set(key, !form[key])}
              className={cn("flex flex-col items-start gap-1 rounded-xl border-2 p-3 text-left transition-all",
                form[key] ? active : "border-gray-200 bg-white hover:border-gray-300")}>
              <span className="text-sm font-bold text-gray-900">{label}</span>
              <span className="text-[11px] text-gray-500">{sub}</span>
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400">&quot;Sale&quot; badge appears automatically when MRP is higher than Selling Price.</p>
      </Section>

      {/* Basic Info */}
      <Section icon={Package} title="Basic Info">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Product Name *</Label>
            <Input id="field-name" value={form.name} onChange={(e) => handleNameChange(e.target.value)} placeholder="e.g. Immunity Kadha 250ml"
              className={errors.name ? "border-red-400 focus:border-red-500 focus:ring-red-400" : ""} />
            {errors.name && <FieldError msg={errors.name} />}
          </div>
          <div>
            <Label>Page URL *</Label>
            <Input value={form.slug} onChange={(e) => set("slug", slugify(e.target.value))} placeholder="immunity-kadha-250ml" mono />
          </div>
          <div>
            <Label>Product Code *</Label>
            <Input id="field-sku" value={form.sku} onChange={(e) => set("sku", e.target.value)} placeholder="SK-001" mono
              className={errors.sku ? "border-red-400 focus:border-red-500 focus:ring-red-400" : ""} />
            {errors.sku && <FieldError msg={errors.sku} />}
          </div>
          <div>
            <Label>Brand</Label>
            <Input value={form.brand} onChange={(e) => set("brand", e.target.value)} placeholder="SunEra Naturals" />
          </div>
          <div>
            <Label>Category *</Label>
            <select id="field-category" value={form.category} onChange={(e) => set("category", e.target.value)}
              className={cn(
                "w-full rounded-xl border bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-1",
                errors.category
                  ? "border-red-400 focus:border-red-500 focus:ring-red-400"
                  : "border-gray-200 focus:border-[#1a5c14] focus:ring-[#1a5c14]"
              )}>
              <option value="">— Select category —</option>
              {parents.map((p) => (
                <optgroup key={p._id} label={p.name}>
                  {subsOf(p._id).length > 0
                    ? subsOf(p._id).map((sub) => <option key={sub._id} value={sub._id}>{sub.name}</option>)
                    : <option value={p._id}>{p.name}</option>}
                </optgroup>
              ))}
            </select>
            {errors.category && <FieldError msg={errors.category} />}
          </div>
          <div className="sm:col-span-2">
            <Label>Short Description</Label>
            <Input value={form.shortDescription} onChange={(e) => set("shortDescription", e.target.value)}
              placeholder="One-line summary shown in product cards" maxLength={200} />
          </div>
        </div>
      </Section>

      {/* Pricing & Stock */}
      <Section icon={DollarSign} title="Pricing & Stock">
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
          <div>
            <Label>Selling Price (₹) *</Label>
            <Input
              id="field-basePrice"
              type="number" min="0" step="0.01" value={form.basePrice}
              onChange={(e) => set("basePrice", e.target.value)} placeholder="499"
              className={cn(
                (errors.basePrice || (form.compareAtPrice && form.basePrice && parseFloat(form.basePrice) > parseFloat(form.compareAtPrice)))
                  ? "border-red-400 focus:border-red-500 focus:ring-red-400"
                  : ""
              )}
            />
            {errors.basePrice
              ? <FieldError msg={errors.basePrice} />
              : form.compareAtPrice && form.basePrice && parseFloat(form.basePrice) > parseFloat(form.compareAtPrice) && (
                <p className="mt-1 text-[11px] text-red-500 font-medium flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  Selling price cannot be higher than MRP
                </p>
              )}
          </div>
          <div>
            <Label>MRP / Original Price (₹)</Label>
            <Input type="number" min="0" step="0.01" value={form.compareAtPrice}
              onChange={(e) => set("compareAtPrice", e.target.value)} placeholder="699" />
            <p className="mt-1 text-[11px] text-gray-400">Leave blank if there is no discount.</p>
          </div>
          {variants.length === 0 ? (
            <div>
              <Label>Total Stock *</Label>
              <Input id="field-stock" type="number" min="0" value={form.stock}
                onChange={(e) => set("stock", e.target.value)} placeholder="100"
                className={errors.stock ? "border-red-400 focus:border-red-500 focus:ring-red-400" : ""} />
              {errors.stock ? <FieldError msg={errors.stock} /> : <p className="mt-1 text-[11px] text-gray-400">How many units you have available.</p>}
            </div>
          ) : (
            <div className="flex items-center gap-2.5 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-[#1a5c14]" />
              <div>
                <p className="text-xs font-bold text-[#1a5c14]">Stock is counted per size/pack</p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Total: {variants.reduce((s, v) => s + (parseInt(v.stock, 10) || 0), 0)} units
                </p>
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* Images */}
      <Section icon={ImageIcon} title="Product Images">
        <p className="text-xs text-gray-400">Upload multiple images. Hover any image to set it as main or remove it.</p>
        <div id="field-images">
          <ImageUploader images={images} onChange={(imgs) => { setImages(imgs); clearError("images"); }} onToast={showToast} />
          {errors.images && <FieldError msg={errors.images} />}
        </div>
      </Section>

      {/* Sizes / Variants */}
      <Section icon={Layers} title="Sizes & Color Variants">
        <VariantsSection
          categoryType={categoryType}
          variants={variants}
          onChange={setVariants}
          variantErrors={variantErrors}
          onClearVariantError={(size) =>
            setVariantErrors((prev) => { const next = new Set(prev); next.delete(size); return next; })
          }
          uploadedImages={images}
        />
      </Section>

      {/* Description */}
      <Section icon={AlignLeft} title="Description">
        <div>
          <Label>Full Description *</Label>
          <textarea id="field-description" value={form.description} onChange={(e) => set("description", e.target.value)}
            placeholder="Detailed product description…" rows={5}
            className={cn(
              "w-full resize-y rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-1",
              errors.description
                ? "border-red-400 focus:border-red-500 focus:ring-red-400"
                : "border-gray-200 focus:border-[#1a5c14] focus:ring-[#1a5c14]"
            )} />
          {errors.description && <FieldError msg={errors.description} />}
        </div>
      </Section>

      {/* Product Details */}
      <Section icon={Sparkles} title="Product Details (optional)">
        <div className="space-y-4">
          <div>
            <Label>Tags — comma separated</Label>
            <Input value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="ayurveda, immunity, herbal" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Benefits — one per line</Label>
              <textarea value={form.benefits} onChange={(e) => set("benefits", e.target.value)}
                placeholder={"Boosts immunity\nImproves digestion"} rows={4}
                className="w-full resize-y rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#1a5c14] focus:outline-none focus:ring-1 focus:ring-[#1a5c14]" />
            </div>
            <div>
              <Label>Ingredients — one per line</Label>
              <textarea value={form.ingredients} onChange={(e) => set("ingredients", e.target.value)}
                placeholder={"Giloy\nTulsi\nAdaloda"} rows={4}
                className="w-full resize-y rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#1a5c14] focus:outline-none focus:ring-1 focus:ring-[#1a5c14]" />
            </div>
          </div>
        </div>
      </Section>

      {/* Save */}
      <div className="flex items-center gap-3 pb-8">
        <button onClick={() => router.push("/admin/products")}
          className="rounded-xl border border-gray-200 px-6 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
          Cancel
        </button>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-[#1a5c14] px-8 py-2.5 text-sm font-bold text-white hover:bg-[#103a0c] transition-colors disabled:opacity-60">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {isEdit ? "Save Changes" : "Create Product"}
        </button>
      </div>

      {toast && <ToastNotification toast={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

// ─── Small field helpers ──────────────────────────────────────────────────────
function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">{children}</label>;
}

function Input({ mono, className, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { mono?: boolean }) {
  return (
    <input {...props} className={cn(
      "w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#1a5c14] focus:outline-none focus:ring-1 focus:ring-[#1a5c14]",
      mono && "font-mono text-xs", className
    )} />
  );
}

function FieldError({ msg }: { msg: string }) {
  return (
    <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-red-500">
      <AlertCircle className="h-3 w-3 shrink-0" />
      {msg}
    </p>
  );
}
