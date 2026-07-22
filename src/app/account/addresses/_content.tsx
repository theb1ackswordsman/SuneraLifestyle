"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft, MapPin, Plus, Pencil, Trash2, Star,
  Loader2, X, CheckCircle2, AlertCircle,
} from "lucide-react";

interface Address {
  _id: string;
  label: "Home" | "Work" | "Other";
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

type FormData = Omit<Address, "_id">;

const EMPTY_FORM: FormData = {
  label: "Home", name: "", phone: "", line1: "",
  line2: "", city: "", state: "", pincode: "", isDefault: false,
};

const LABEL_COLORS: Record<string, string> = {
  Home:  "bg-blue-50 text-blue-700 border-blue-200",
  Work:  "bg-amber-50 text-amber-700 border-amber-200",
  Other: "bg-purple-50 text-purple-600 border-purple-200",
};

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
  "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
  "Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Andaman and Nicobar Islands","Chandigarh","Dadra and Nagar Haveli and Daman and Diu",
  "Delhi","Jammu and Kashmir","Ladakh","Lakshadweep","Puducherry",
];

export default function AddressesContent() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState("");

  const [showForm, setShowForm]     = useState(false);
  const [editId, setEditId]         = useState<string | null>(null);
  const [form, setForm]             = useState<FormData>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError]   = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchAddresses = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/user/addresses");
      const json = await res.json();
      if (res.ok) setAddresses(json.data ?? []);
      else setError("Could not load addresses.");
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAddresses(); }, [fetchAddresses]);

  function openAdd() {
    setForm(EMPTY_FORM);
    setEditId(null);
    setFormError("");
    setShowForm(true);
  }

  function openEdit(addr: Address) {
    setForm({
      label: addr.label, name: addr.name, phone: addr.phone,
      line1: addr.line1, line2: addr.line2 ?? "", city: addr.city,
      state: addr.state, pincode: addr.pincode, isDefault: addr.isDefault,
    });
    setEditId(addr._id);
    setFormError("");
    setShowForm(true);
  }

  function set(field: keyof FormData, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!form.name.trim())    { setFormError("Full name is required."); return; }
    if (!form.line1.trim())   { setFormError("Address Line 1 is required."); return; }
    if (!form.city.trim())    { setFormError("City is required."); return; }
    if (!form.state)          { setFormError("Please select a state."); return; }
    if (!/^\d{6}$/.test(form.pincode)) { setFormError("Pincode must be 6 digits."); return; }
    if (form.phone && !/^[6-9]\d{9}$/.test(form.phone)) {
      setFormError("Enter a valid 10-digit Indian mobile number."); return;
    }

    setSubmitting(true);
    try {
      const url    = editId ? `/api/user/addresses/${editId}` : "/api/user/addresses";
      const method = editId ? "PUT" : "POST";
      const res    = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) { setFormError(json.error ?? "Failed to save address."); return; }
      setAddresses(json.data);
      setShowForm(false);
      setSuccess(editId ? "Address updated." : "Address added.");
      setTimeout(() => setSuccess(""), 3500);
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Remove this address?")) return;
    setDeletingId(id);
    try {
      const res  = await fetch(`/api/user/addresses/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (res.ok) {
        setAddresses(json.data);
        setSuccess("Address removed.");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(json.error ?? "Failed to remove address.");
      }
    } catch {
      setError("Network error.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSetDefault(id: string) {
    try {
      const res  = await fetch(`/api/user/addresses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });
      const json = await res.json();
      if (res.ok) setAddresses(json.data);
    } catch { /* ignore */ }
  }

  return (
    <div className="container-padded pt-32 pb-16">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/account"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Account
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
              <MapPin className="h-5 w-5 text-blue-600" />
            </div>
            <h1 className="text-2xl font-black text-foreground">Addresses</h1>
          </div>
          {!showForm && (
            <button
              onClick={openAdd}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0f0f0f] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            >
              <Plus className="h-4 w-4" /> Add New
            </button>
          )}
        </div>

        {/* Global banners */}
        {success && (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-[#1a5c14]">
            <CheckCircle2 className="h-4 w-4 shrink-0" /> {success}
          </div>
        )}
        {error && (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        {/* Add / Edit form */}
        {showForm && (
          <div className="mb-8 rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-foreground">
                {editId ? "Edit Address" : "Add New Address"}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                <AlertCircle className="h-4 w-4 shrink-0" /> {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {/* Label */}
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.13em] text-foreground/55">
                  Label
                </p>
                <div className="flex gap-2">
                  {(["Home", "Work", "Other"] as const).map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => set("label", l)}
                      className={`flex-1 rounded-xl border py-2 text-sm font-semibold transition-all ${
                        form.label === l
                          ? LABEL_COLORS[l]
                          : "border-border bg-background text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.13em] text-foreground/55">
                    Full Name <span className="text-red-400">*</span>
                  </p>
                  <input
                    type="text" value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder="Recipient's full name" required
                    className="flex h-11 w-full rounded-xl border border-input bg-background px-4 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                {/* Phone */}
                <div>
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.13em] text-foreground/55">
                    Phone Number
                  </p>
                  <input
                    type="tel" value={form.phone} maxLength={10}
                    onChange={(e) => set("phone", e.target.value)}
                    placeholder="10-digit mobile number"
                    className="flex h-11 w-full rounded-xl border border-input bg-background px-4 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>

              {/* Line 1 */}
              <div>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.13em] text-foreground/55">
                  Address Line 1 <span className="text-red-400">*</span>
                </p>
                <input
                  type="text" value={form.line1}
                  onChange={(e) => set("line1", e.target.value)}
                  placeholder="House/Flat No., Street, Area" required
                  className="flex h-11 w-full rounded-xl border border-input bg-background px-4 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              {/* Line 2 */}
              <div>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.13em] text-foreground/55">
                  Address Line 2 <span className="text-muted-foreground/40 font-normal normal-case tracking-normal">(optional)</span>
                </p>
                <input
                  type="text" value={form.line2}
                  onChange={(e) => set("line2", e.target.value)}
                  placeholder="Landmark, Colony, etc."
                  className="flex h-11 w-full rounded-xl border border-input bg-background px-4 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* City */}
                <div>
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.13em] text-foreground/55">
                    City <span className="text-red-400">*</span>
                  </p>
                  <input
                    type="text" value={form.city}
                    onChange={(e) => set("city", e.target.value)}
                    placeholder="City" required
                    className="flex h-11 w-full rounded-xl border border-input bg-background px-4 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                {/* State */}
                <div>
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.13em] text-foreground/55">
                    State <span className="text-red-400">*</span>
                  </p>
                  <select
                    value={form.state}
                    onChange={(e) => set("state", e.target.value)}
                    required
                    className="flex h-11 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">Select state</option>
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                {/* Pincode */}
                <div>
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.13em] text-foreground/55">
                    Pincode <span className="text-red-400">*</span>
                  </p>
                  <input
                    type="text" value={form.pincode} maxLength={6}
                    onChange={(e) => set("pincode", e.target.value.replace(/\D/g, ""))}
                    placeholder="6-digit pincode" required
                    className="flex h-11 w-full rounded-xl border border-input bg-background px-4 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>

              {/* Default checkbox */}
              <label className="flex cursor-pointer items-center gap-2.5 pt-1 select-none">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(e) => set("isDefault", e.target.checked)}
                  className="h-4 w-4 rounded border-border accent-[#1a5c14] cursor-pointer"
                />
                <span className="text-sm text-muted-foreground">Set as default delivery address</span>
              </label>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 rounded-xl border border-border py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#0f0f0f] py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : (editId ? "Save Changes" : "Add Address")}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Address list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : addresses.length === 0 && !showForm ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-16 flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 mb-5">
              <MapPin className="h-8 w-8 text-blue-300" />
            </div>
            <h3 className="text-base font-bold text-foreground mb-2">No saved addresses</h3>
            <p className="text-sm text-muted-foreground max-w-xs mb-6 leading-relaxed">
              Add a delivery address to make checkout faster.
            </p>
            <button
              onClick={openAdd}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0f0f0f] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            >
              <Plus className="h-4 w-4" /> Add Address
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {addresses.map((addr, i) => (
              <div
                key={addr._id || `addr-${i}`}
                className={`rounded-2xl border bg-card p-5 transition-all ${
                  addr.isDefault ? "border-[#1a5c14]/30 bg-[#1a5c14]/3" : "border-border"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${LABEL_COLORS[addr.label]}`}>
                      {addr.label}
                    </span>
                    {addr.isDefault && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#1a5c14]/10 px-2.5 py-0.5 text-xs font-semibold text-[#1a5c14]">
                        <Star className="h-3 w-3 fill-current" /> Default
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEdit(addr)}
                      className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(addr._id)}
                      disabled={deletingId === addr._id}
                      className="rounded-lg p-2 text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      {deletingId === addr._id
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <Trash2 className="h-4 w-4" />
                      }
                    </button>
                  </div>
                </div>

                <div className="mt-3">
                  <p className="font-semibold text-foreground">{addr.name}</p>
                  {addr.phone && <p className="text-sm text-muted-foreground">{addr.phone}</p>}
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                    {addr.line1}{addr.line2 ? `, ${addr.line2}` : ""},<br />
                    {addr.city}, {addr.state} – {addr.pincode}
                  </p>
                </div>

                {!addr.isDefault && (
                  <button
                    onClick={() => handleSetDefault(addr._id)}
                    className="mt-3 text-xs font-semibold text-[#1a5c14] hover:underline"
                  >
                    Set as default
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
