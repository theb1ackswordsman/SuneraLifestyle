"use client";

import { useState, useEffect, useCallback, useRef, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2, Check, ArrowLeft, Sparkles, ImageIcon,
  Package, DollarSign, AlignLeft, BadgeCheck,
  Upload, X, AlertCircle, CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Category { _id: string; name: string; slug: string; parentId?: string | null }

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

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function ToastNotification({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-999 flex items-start gap-3 rounded-2xl px-5 py-4 shadow-2xl text-white text-sm font-medium max-w-sm",
        "animate-fade-up",
        toast.type === "error" ? "bg-red-600" : "bg-[#1a5c14]"
      )}
    >
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
function ImageUploader({
  images,
  onChange,
  onToast,
}: {
  images: string[];
  onChange: (imgs: string[]) => void;
  onToast: (msg: string, type: "error" | "success") => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress]   = useState({ done: 0, total: 0 });
  const [dragOver, setDragOver]   = useState(false);

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
        if (json.success) {
          results.push(json.data.url);
        } else {
          onToast(`Could not upload "${file.name}".`, "error");
        }
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

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
    if (files.length) uploadFiles(files);
  }

  function removeImage(idx: number) {
    onChange(images.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          "relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed py-10 transition-all",
          dragOver
            ? "border-[#1a5c14] bg-green-50"
            : "border-gray-200 bg-gray-50 hover:border-[#1a5c14] hover:bg-green-50/40",
          uploading && "pointer-events-none opacity-70"
        )}
      >
        {uploading ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-[#1a5c14]" />
            <p className="text-sm font-semibold text-gray-600">
              Uploading {progress.done + 1} of {progress.total}…
            </p>
          </>
        ) : (
          <>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <Upload className="h-5 w-5 text-[#1a5c14]" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-700">
                Click to upload <span className="text-[#1a5c14]">or drag &amp; drop</span>
              </p>
              <p className="mt-1 text-xs text-gray-400">PNG, JPG, WEBP — up to 10 MB each</p>
            </div>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleInputChange}
        />
      </div>

      {/* Preview grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
          {images.map((url, i) => (
            <div key={i} className="group relative aspect-square overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover" />
              {i === 0 && (
                <span className="absolute left-1 top-1 rounded-md bg-[#1a5c14] px-1.5 py-0.5 text-[10px] font-bold text-white">
                  Main
                </span>
              )}
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ icon: Icon, title, children }: {
  icon: React.ElementType; title: string; children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
      <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-500">
        <Icon className="h-4 w-4" /> {title}
      </h2>
      {children}
    </div>
  );
}

// ─── Main Form ────────────────────────────────────────────────────────────────
interface Props { productId?: string }

export default function ProductForm({ productId }: Props) {
  const router  = useRouter();
  const isEdit  = Boolean(productId);

  const [form, setForm]               = useState<FormData>(EMPTY);
  const [images, setImages]           = useState<string[]>([]);
  const [categories, setCategories]   = useState<Category[]>([]);
  const [saving, setSaving]           = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(isEdit);
  const [toast, setToast]             = useState<Toast | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(msg: string, type: "error" | "success" = "error") {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = setTimeout(() => setToast(null), 4500);
  }

  // Load categories
  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((json) => setCategories(json.data ?? []));
  }, []);

  // Load product for edit
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
    } finally {
      setLoadingProduct(false);
    }
  }, [productId]);

  useEffect(() => { loadProduct(); }, [loadProduct]);

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleNameChange(name: string) {
    setForm((f) => ({ ...f, name, ...(isEdit ? {} : { slug: slugify(name) }) }));
  }

  async function handleSave() {
    if (!form.name.trim())        { showToast("Product name is required.");        return; }
    if (!form.sku.trim())         { showToast("SKU is required.");                 return; }
    if (!form.basePrice.trim())   { showToast("Base price is required.");           return; }
    if (!form.stock.trim())       { showToast("Stock quantity is required.");       return; }
    if (!form.category)           { showToast("Please select a category.");         return; }
    if (!form.description.trim()) { showToast("Description is required.");          return; }
    if (images.length === 0)      { showToast("Please upload at least one image."); return; }

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
        stock:            parseInt(form.stock, 10),
        sku:              form.sku.trim(),
        brand:            form.brand.trim() || undefined,
        tags:             form.tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean),
        benefits:         form.benefits.split("\n").map((s) => s.trim()).filter(Boolean),
        ingredients:      form.ingredients.split("\n").map((s) => s.trim()).filter(Boolean),
        images,
        isActive:         form.isActive,
        isFeatured:       form.isFeatured,
        isBestSeller:     form.isBestSeller,
        isNewArrival:     form.isNewArrival,
      };

      const url    = isEdit ? `/api/admin/products/${productId}` : "/api/admin/products";
      const method = isEdit ? "PUT" : "POST";

      const res  = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
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
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const FLAGS = [
    { key: "isActive"     as const, label: "Active",      sub: "Visible to shoppers",    active: "border-green-500 bg-green-50"   },
    { key: "isFeatured"   as const, label: "Featured",    sub: "Shown on home page",     active: "border-amber-500 bg-amber-50"   },
    { key: "isBestSeller" as const, label: "Best Seller", sub: "Shows bestseller badge", active: "border-[#1a5c14] bg-green-50"   },
    { key: "isNewArrival" as const, label: "New Arrival", sub: "Shows 'New' badge",      active: "border-blue-500 bg-blue-50"     },
  ] as const;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl space-y-6">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/admin/products")}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-xl font-black text-gray-900">
            {isEdit ? "Edit Product" : "Add Product"}
          </h1>
          <p className="text-sm text-gray-500">
            {isEdit ? "Update product details." : "Fill in the details to create a new product."}
          </p>
        </div>
      </div>

      {/* ── Labels & Visibility ────────────────────────── */}
      <Section icon={BadgeCheck} title="Labels & Visibility">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {FLAGS.map(({ key, label, sub, active }) => (
            <button
              key={key}
              type="button"
              onClick={() => set(key, !form[key])}
              className={cn(
                "flex flex-col items-start gap-1 rounded-xl border-2 p-3 text-left transition-all",
                form[key] ? active : "border-gray-200 bg-white hover:border-gray-300"
              )}
            >
              <span className="text-sm font-bold text-gray-900">{label}</span>
              <span className="text-[11px] text-gray-500">{sub}</span>
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400">
          &quot;On Sale&quot; badge appears automatically when Compare At Price is higher than Base Price.
        </p>
      </Section>

      {/* ── Basic Info ─────────────────────────────────── */}
      <Section icon={Package} title="Basic Info">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Product Name *</Label>
            <Input
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Immunity Kadha 250ml"
            />
          </div>
          <div>
            <Label>Slug *</Label>
            <Input
              value={form.slug}
              onChange={(e) => set("slug", slugify(e.target.value))}
              placeholder="immunity-kadha-250ml"
              mono
            />
          </div>
          <div>
            <Label>SKU *</Label>
            <Input
              value={form.sku}
              onChange={(e) => set("sku", e.target.value)}
              placeholder="SK-001"
              mono
            />
          </div>
          <div>
            <Label>Brand</Label>
            <Input
              value={form.brand}
              onChange={(e) => set("brand", e.target.value)}
              placeholder="SunEra Naturals"
            />
          </div>
          <div>
            <Label>Category *</Label>
            <select
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-[#1a5c14] focus:outline-none focus:ring-1 focus:ring-[#1a5c14]"
            >
              <option value="">— Select category —</option>
              {parents.map((p) => (
                <optgroup key={p._id} label={p.name}>
                  {subsOf(p._id).length > 0
                    ? subsOf(p._id).map((sub) => (
                        <option key={sub._id} value={sub._id}>{sub.name}</option>
                      ))
                    : <option value={p._id}>{p.name}</option>}
                </optgroup>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <Label>Short Description</Label>
            <Input
              value={form.shortDescription}
              onChange={(e) => set("shortDescription", e.target.value)}
              placeholder="One-line summary shown in product cards"
              maxLength={200}
            />
          </div>
        </div>
      </Section>

      {/* ── Pricing & Stock ────────────────────────────── */}
      <Section icon={DollarSign} title="Pricing & Stock">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <Label>Base Price (₹) *</Label>
            <Input type="number" min="0" step="0.01" value={form.basePrice}
              onChange={(e) => set("basePrice", e.target.value)} placeholder="499" />
          </div>
          <div>
            <Label>Compare At Price (₹)</Label>
            <Input type="number" min="0" step="0.01" value={form.compareAtPrice}
              onChange={(e) => set("compareAtPrice", e.target.value)} placeholder="699" />
            <p className="mt-1 text-[11px] text-gray-400">Leave blank if not on sale.</p>
          </div>
          <div>
            <Label>Stock *</Label>
            <Input type="number" min="0" value={form.stock}
              onChange={(e) => set("stock", e.target.value)} placeholder="100" />
          </div>
        </div>
      </Section>

      {/* ── Images ─────────────────────────────────────── */}
      <Section icon={ImageIcon} title="Images">
        <ImageUploader images={images} onChange={setImages} onToast={showToast} />
      </Section>

      {/* ── Description ────────────────────────────────── */}
      <Section icon={AlignLeft} title="Description">
        <div>
          <Label>Full Description *</Label>
          <textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Detailed product description…"
            rows={5}
            className="w-full resize-y rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#1a5c14] focus:outline-none focus:ring-1 focus:ring-[#1a5c14]"
          />
        </div>
      </Section>

      {/* ── Product Details ────────────────────────────── */}
      <Section icon={Sparkles} title="Product Details (optional)">
        <div className="space-y-4">
          <div>
            <Label>Tags — comma separated</Label>
            <Input value={form.tags}
              onChange={(e) => set("tags", e.target.value)}
              placeholder="ayurveda, immunity, herbal" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Benefits — one per line</Label>
              <textarea value={form.benefits}
                onChange={(e) => set("benefits", e.target.value)}
                placeholder={"Boosts immunity\nImproves digestion"}
                rows={4}
                className="w-full resize-y rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#1a5c14] focus:outline-none focus:ring-1 focus:ring-[#1a5c14]"
              />
            </div>
            <div>
              <Label>Ingredients — one per line</Label>
              <textarea value={form.ingredients}
                onChange={(e) => set("ingredients", e.target.value)}
                placeholder={"Giloy\nTulsi\nAdaloda"}
                rows={4}
                className="w-full resize-y rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#1a5c14] focus:outline-none focus:ring-1 focus:ring-[#1a5c14]"
              />
            </div>
          </div>
        </div>
      </Section>

      {/* ── Save ───────────────────────────────────────── */}
      <div className="flex items-center gap-3 pb-8">
        <button
          onClick={() => router.push("/admin/products")}
          className="rounded-xl border border-gray-200 px-6 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-[#1a5c14] px-8 py-2.5 text-sm font-bold text-white hover:bg-[#103a0c] transition-colors disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {isEdit ? "Save Changes" : "Create Product"}
        </button>
      </div>

      {/* ── Toast ──────────────────────────────────────── */}
      {toast && <ToastNotification toast={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

// ─── Small field helpers ──────────────────────────────────────────────────────
function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">
      {children}
    </label>
  );
}

function Input({
  mono, className, ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { mono?: boolean }) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#1a5c14] focus:outline-none focus:ring-1 focus:ring-[#1a5c14]",
        mono && "font-mono text-xs",
        className
      )}
    />
  );
}
