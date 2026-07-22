"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, ChevronRight, ToggleLeft, ToggleRight, X, Check, Loader2 } from "lucide-react";

interface Category {
  _id: string;
  name: string;
  slug: string;
  isActive: boolean;
  order: number;
  parentId?: { _id: string; name: string; slug: string } | null;
  productCount: number;
}

interface FormState {
  name: string;
  slug: string;
  parentId: string;
  order: string;
}

const EMPTY_FORM: FormState = { name: "", slug: "", parentId: "", order: "0" };

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export default function AdminCategoriesPage() {
  const [categories, setCategories]   = useState<Category[]>([]);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState("");

  const [showForm, setShowForm]       = useState(false);
  const [editId, setEditId]           = useState<string | null>(null);
  const [form, setForm]               = useState<FormState>(EMPTY_FORM);
  const [deleteId, setDeleteId]       = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/admin/categories");
      const json = await res.json();
      setCategories(json.data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openAdd() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setError("");
    setShowForm(true);
  }

  function openEdit(cat: Category) {
    setEditId(cat._id);
    setForm({
      name:     cat.name,
      slug:     cat.slug,
      parentId: cat.parentId?._id ?? "",
      order:    String(cat.order),
    });
    setError("");
    setShowForm(true);
  }

  function handleNameChange(name: string) {
    setForm((f) => ({
      ...f,
      name,
      ...(editId ? {} : { slug: slugify(name) }),
    }));
  }

  async function handleSave() {
    if (!form.name.trim()) { setError("Name is required."); return; }
    if (!form.slug.trim()) { setError("Slug is required."); return; }
    setSaving(true); setError("");
    try {
      const url    = editId ? `/api/admin/categories/${editId}` : "/api/admin/categories";
      const method = editId ? "PATCH" : "POST";
      const res    = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:     form.name.trim(),
          slug:     form.slug.trim(),
          parentId: form.parentId || null,
          order:    parseInt(form.order) || 0,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Something went wrong."); return; }
      setShowForm(false);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setSaving(true);
    try {
      await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
      setDeleteId(null);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(cat: Category) {
    await fetch(`/api/admin/categories/${cat._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !cat.isActive }),
    });
    await load();
  }

  const topLevel    = categories.filter((c) => !c.parentId);
  const subOf       = (id: string) => categories.filter((c) => c.parentId?._id === id);
  const parentOptions = topLevel;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-black text-gray-900">Categories</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Manage top-level categories and their subcategories.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 rounded-xl bg-[#1a5c14] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#103a0c] transition-colors self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" /> Add Category
        </button>
      </div>

      {/* Add/Edit form panel */}
      {showForm && (
        <div className="mb-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900">
              {editId ? "Edit Category" : "New Category"}
            </h2>
            <button onClick={() => setShowForm(false)} className="rounded-lg p-1 hover:bg-gray-100">
              <X className="h-4 w-4 text-gray-500" />
            </button>
          </div>

          {error && (
            <p className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Ayurvedic Products"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#1a5c14] focus:outline-none focus:ring-1 focus:ring-[#1a5c14]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Slug *</label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
                placeholder="e.g. ayurvedic-products"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-mono focus:border-[#1a5c14] focus:outline-none focus:ring-1 focus:ring-[#1a5c14]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Parent Category</label>
              <select
                value={form.parentId}
                onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#1a5c14] focus:outline-none focus:ring-1 focus:ring-[#1a5c14] bg-white"
              >
                <option value="">— None (top-level) —</option>
                {parentOptions.map((p) => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-400">Leave blank to make this a top-level category.</p>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Display Order</label>
              <input
                type="number"
                min="0"
                value={form.order}
                onChange={(e) => setForm((f) => ({ ...f, order: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#1a5c14] focus:outline-none focus:ring-1 focus:ring-[#1a5c14]"
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap justify-end gap-3">
            <button
              onClick={() => setShowForm(false)}
              className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-[#1a5c14] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#103a0c] transition-colors disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {editId ? "Save Changes" : "Create"}
            </button>
          </div>
        </div>
      )}

      {/* Category list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : categories.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
          <p className="text-gray-500 font-medium">No categories yet.</p>
          <p className="mt-1 text-sm text-gray-400">Click &quot;Add Category&quot; to create your first one.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {topLevel.map((parent) => (
            <div key={parent._id} className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
              {/* Parent row */}
              <div className="flex items-center gap-3 px-4 py-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-gray-900">{parent.name}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${parent.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {parent.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs font-mono text-gray-400">/{parent.slug}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => toggleActive(parent)} title={parent.isActive ? "Deactivate" : "Activate"}
                    className="rounded-lg p-2 hover:bg-gray-100 transition-colors">
                    {parent.isActive
                      ? <ToggleRight className="h-5 w-5 text-[#1a5c14]" />
                      : <ToggleLeft className="h-5 w-5 text-gray-400" />}
                  </button>
                  <button onClick={() => openEdit(parent)} className="rounded-lg p-2 hover:bg-gray-100 transition-colors">
                    <Pencil className="h-4 w-4 text-gray-500" />
                  </button>
                  <button onClick={() => setDeleteId(parent._id)} className="rounded-lg p-2 hover:bg-red-50 transition-colors">
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </button>
                </div>
              </div>

              {/* Subcategory rows */}
              {subOf(parent._id).map((sub) => (
                <div key={sub._id} className="flex items-center gap-3 border-t border-gray-100 bg-gray-50/60 px-4 py-3">
                  <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">{sub.name}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${sub.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {sub.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-gray-400">/{sub.slug}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => toggleActive(sub)} className="rounded-lg p-1.5 hover:bg-gray-100 transition-colors">
                      {sub.isActive ? <ToggleRight className="h-4 w-4 text-[#1a5c14]" /> : <ToggleLeft className="h-4 w-4 text-gray-400" />}
                    </button>
                    <button onClick={() => openEdit(sub)} className="rounded-lg p-1.5 hover:bg-gray-100 transition-colors">
                      <Pencil className="h-3.5 w-3.5 text-gray-500" />
                    </button>
                    <button onClick={() => setDeleteId(sub._id)} className="rounded-lg p-1.5 hover:bg-red-50 transition-colors">
                      <Trash2 className="h-3.5 w-3.5 text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}

          {/* Orphaned subcategories */}
          {categories.filter((c) => c.parentId && !topLevel.find((t) => t._id === c.parentId?._id)).map((orphan) => (
            <div key={orphan._id} className="flex items-center gap-4 rounded-2xl border border-dashed border-orange-200 bg-orange-50/40 px-4 py-4">
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-gray-700">{orphan.name}</span>
                <p className="text-xs text-orange-500">Subcategory — parent missing</p>
              </div>
              <button onClick={() => setDeleteId(orphan._id)} className="rounded-lg p-1.5 hover:bg-red-50">
                <Trash2 className="h-3.5 w-3.5 text-red-400" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirm dialog */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-gray-900">Delete Category?</h3>
            <p className="mt-2 text-sm text-gray-500">
              This will also delete all subcategories under it. This action cannot be undone.
            </p>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteId)} disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
