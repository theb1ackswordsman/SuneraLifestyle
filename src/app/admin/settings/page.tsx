"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Settings,
  Mail,
  Phone,
  MapPin,
  Instagram,
  Twitter,
  Facebook,
  Youtube,
  MessageCircle,
  Truck,
  FileText,
  Building2,
  ShieldCheck,
  Loader2,
  CheckCircle,
  AlertCircle,
  KeyRound,
  AtSign,
  Lock,
  Eye,
  EyeOff,
  Store,
  ExternalLink,
  Save,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TabId = "general" | "contact" | "social" | "shipping" | "policies" | "business" | "admin-account";

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

interface StoreSettingsData {
  storeName: string;
  tagline: string;
  description: string;
  storeUrl: string;
  contact: { email: string; phone: string; address: string; whatsapp: string };
  social: { instagram: string; twitter: string; facebook: string; youtube: string };
  shipping: { freeAbove: number; standardFee: number; expressFee: number; standardDays: string; expressDays: string };
  policies: { returnDays: number; exchangeDays: number };
  business: { gst: string; cin: string };
}

type Status = { type: "success" | "error"; message: string } | null;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TABS: Tab[] = [
  { id: "general",       label: "Store Info",     icon: <Store className="h-4 w-4" /> },
  { id: "contact",       label: "Contact",        icon: <Phone className="h-4 w-4" /> },
  { id: "social",        label: "Social Media",   icon: <Instagram className="h-4 w-4" /> },
  { id: "shipping",      label: "Shipping",       icon: <Truck className="h-4 w-4" /> },
  { id: "policies",      label: "Policies",       icon: <FileText className="h-4 w-4" /> },
  { id: "business",      label: "Business",       icon: <Building2 className="h-4 w-4" /> },
  { id: "admin-account", label: "Admin Account",  icon: <ShieldCheck className="h-4 w-4" /> },
];

const POLICY_LINKS = [
  { label: "Refund Policy",      href: "/refund-policy" },
  { label: "Shipping Policy",    href: "/shipping-policy" },
  { label: "Terms & Conditions", href: "/terms-and-conditions" },
];

// ---------------------------------------------------------------------------
// Shared UI primitives
// ---------------------------------------------------------------------------

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4 pb-2 border-b border-gray-100">
      <h2 className="text-sm font-bold text-gray-700">{title}</h2>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  multiline,
  hint,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  multiline?: boolean;
  hint?: string;
}) {
  const base =
    "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 bg-white outline-none focus:border-[#1a5c14] focus:ring-1 focus:ring-[#1a5c14]/20 placeholder:text-gray-400 transition-colors";

  return (
    <div className="space-y-1">
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
      {multiline ? (
        <textarea
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className={cn(base, "resize-none")}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={base}
        />
      )}
      {hint && <p className="text-[11px] text-gray-400">{hint}</p>}
    </div>
  );
}

function StatusBanner({ status }: { status: Status }) {
  if (!status) return null;
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-sm",
        status.type === "success"
          ? "bg-green-50 border border-green-200 text-green-700"
          : "bg-red-50 border border-red-200 text-red-700"
      )}
    >
      {status.type === "success"
        ? <CheckCircle className="h-4 w-4 shrink-0" />
        : <AlertCircle className="h-4 w-4 shrink-0" />}
      {status.message}
    </div>
  );
}

function SaveButton({ loading, onClick }: { loading: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="flex items-center gap-2 rounded-lg bg-[#1a5c14] px-4 py-2 text-sm font-semibold text-white hover:bg-[#154a10] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      Save Changes
    </button>
  );
}

// ---------------------------------------------------------------------------
// Store save helper
// ---------------------------------------------------------------------------

async function saveSection(section: string, data: Record<string, unknown>): Promise<string> {
  const res = await fetch("/api/admin/settings/store", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ section, data }),
  });
  const json = await res.json() as { message?: string; error?: string };
  if (!res.ok) throw new Error(json.error ?? "Failed to save.");
  return json.message ?? "Saved.";
}

// ---------------------------------------------------------------------------
// Tab panels
// ---------------------------------------------------------------------------

function GeneralTab({ settings, onChange, onSave }: {
  settings: StoreSettingsData;
  onChange: (key: keyof StoreSettingsData, value: unknown) => void;
  onSave: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  async function handleSave() {
    setLoading(true); setStatus(null);
    try {
      const msg = await saveSection("general", {
        storeName: settings.storeName,
        tagline: settings.tagline,
        description: settings.description,
        storeUrl: settings.storeUrl,
      });
      setStatus({ type: "success", message: msg });
      onSave();
    } catch (e) {
      setStatus({ type: "error", message: e instanceof Error ? e.message : "Failed to save." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <SectionHeader title="Store Identity" subtitle="Basic information shown across your website" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Store Name"
          value={settings.storeName}
          onChange={(v) => onChange("storeName", v)}
          placeholder="SunEra Lifestyle"
        />
        <Field
          label="Tagline"
          value={settings.tagline}
          onChange={(v) => onChange("tagline", v)}
          placeholder="Way to Wellness"
        />
      </div>
      <Field
        label="Description"
        value={settings.description}
        onChange={(v) => onChange("description", v)}
        placeholder="Describe your store..."
        multiline
      />
      <Field
        label="Store Website URL"
        value={settings.storeUrl}
        onChange={(v) => onChange("storeUrl", v)}
        placeholder="https://sunera.in"
        type="url"
      />
      <StatusBanner status={status} />
      <SaveButton loading={loading} onClick={handleSave} />
    </div>
  );
}

function ContactTab({ settings, onChange, onSave }: {
  settings: StoreSettingsData;
  onChange: (key: keyof StoreSettingsData, value: unknown) => void;
  onSave: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  async function handleSave() {
    setLoading(true); setStatus(null);
    try {
      const msg = await saveSection("contact", settings.contact);
      setStatus({ type: "success", message: msg });
      onSave();
    } catch (e) {
      setStatus({ type: "error", message: e instanceof Error ? e.message : "Failed to save." });
    } finally {
      setLoading(false);
    }
  }

  function setContact(key: keyof typeof settings.contact, value: string) {
    onChange("contact", { ...settings.contact, [key]: value });
  }

  return (
    <div className="space-y-5">
      <SectionHeader title="Contact Details" subtitle="How customers can reach you" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Email Address"
          value={settings.contact.email}
          onChange={(v) => setContact("email", v)}
          type="email"
          placeholder="suneralifestyle@gmail.com"
        />
        <Field
          label="Phone Number"
          value={settings.contact.phone}
          onChange={(v) => setContact("phone", v)}
          placeholder="+91 91355 64607"
        />
        <Field
          label="WhatsApp Number"
          value={settings.contact.whatsapp}
          onChange={(v) => setContact("whatsapp", v)}
          placeholder="+91 91355 64607"
          hint="Shown on the contact and support pages"
        />
        <Field
          label="Business Address"
          value={settings.contact.address}
          onChange={(v) => setContact("address", v)}
          placeholder="Surat, Gujarat, India"
        />
      </div>
      <StatusBanner status={status} />
      <SaveButton loading={loading} onClick={handleSave} />
    </div>
  );
}

function SocialTab({ settings, onChange, onSave }: {
  settings: StoreSettingsData;
  onChange: (key: keyof StoreSettingsData, value: unknown) => void;
  onSave: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  async function handleSave() {
    setLoading(true); setStatus(null);
    try {
      const msg = await saveSection("social", settings.social);
      setStatus({ type: "success", message: msg });
      onSave();
    } catch (e) {
      setStatus({ type: "error", message: e instanceof Error ? e.message : "Failed to save." });
    } finally {
      setLoading(false);
    }
  }

  function setSocial(key: keyof typeof settings.social, value: string) {
    onChange("social", { ...settings.social, [key]: value });
  }

  const profiles: { key: keyof typeof settings.social; label: string; icon: React.ReactNode; color: string; placeholder: string }[] = [
    { key: "instagram", label: "Instagram", icon: <Instagram className="h-4 w-4" />, color: "text-pink-500", placeholder: "https://instagram.com/yourpage" },
    { key: "twitter",   label: "Twitter / X", icon: <Twitter className="h-4 w-4" />, color: "text-sky-500", placeholder: "https://twitter.com/yourpage" },
    { key: "facebook",  label: "Facebook",  icon: <Facebook className="h-4 w-4" />, color: "text-blue-600", placeholder: "https://facebook.com/yourpage" },
    { key: "youtube",   label: "YouTube",   icon: <Youtube className="h-4 w-4" />, color: "text-red-500", placeholder: "https://youtube.com/@yourchannel" },
  ];

  return (
    <div className="space-y-5">
      <SectionHeader title="Social Media Profiles" subtitle="Links shown in your website footer and contact page" />
      <div className="space-y-4">
        {profiles.map(({ key, label, icon, color, placeholder }) => (
          <div key={key} className="space-y-1">
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <span className={color}>{icon}</span>
              {label}
            </label>
            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-white focus-within:border-[#1a5c14] focus-within:ring-1 focus-within:ring-[#1a5c14]/20 transition-colors">
              <input
                type="url"
                value={settings.social[key]}
                onChange={(e) => setSocial(key, e.target.value)}
                placeholder={placeholder}
                className="flex-1 text-sm text-gray-800 bg-transparent outline-none placeholder:text-gray-400"
              />
              {settings.social[key] && (
                <a
                  href={settings.social[key]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-gray-400 hover:text-[#1a5c14]"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
      <StatusBanner status={status} />
      <SaveButton loading={loading} onClick={handleSave} />
    </div>
  );
}

function ShippingTab({ settings, onChange, onSave }: {
  settings: StoreSettingsData;
  onChange: (key: keyof StoreSettingsData, value: unknown) => void;
  onSave: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  async function handleSave() {
    setLoading(true); setStatus(null);
    try {
      const msg = await saveSection("shipping", settings.shipping);
      setStatus({ type: "success", message: msg });
      onSave();
    } catch (e) {
      setStatus({ type: "error", message: e instanceof Error ? e.message : "Failed to save." });
    } finally {
      setLoading(false);
    }
  }

  function setShipping(key: keyof typeof settings.shipping, value: string | number) {
    onChange("shipping", { ...settings.shipping, [key]: value });
  }

  return (
    <div className="space-y-5">
      <SectionHeader title="Shipping Fees" subtitle="Charges applied at checkout" />
      <div className="grid gap-4 sm:grid-cols-3">
        <Field
          label="Free Shipping Above (₹)"
          value={settings.shipping.freeAbove}
          onChange={(v) => setShipping("freeAbove", Number(v))}
          type="number"
          placeholder="999"
          hint="Orders above this amount get free shipping"
        />
        <Field
          label="Standard Delivery Fee (₹)"
          value={settings.shipping.standardFee}
          onChange={(v) => setShipping("standardFee", Number(v))}
          type="number"
          placeholder="99"
        />
        <Field
          label="Express Delivery Fee (₹)"
          value={settings.shipping.expressFee}
          onChange={(v) => setShipping("expressFee", Number(v))}
          type="number"
          placeholder="199"
        />
      </div>

      <SectionHeader title="Delivery Time Estimates" subtitle="Shown to customers at checkout" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Standard Delivery Time"
          value={settings.shipping.standardDays}
          onChange={(v) => setShipping("standardDays", v)}
          placeholder="5-7"
          hint='E.g. "5-7" for 5–7 business days'
        />
        <Field
          label="Express Delivery Time"
          value={settings.shipping.expressDays}
          onChange={(v) => setShipping("expressDays", v)}
          placeholder="2-3"
          hint='E.g. "2-3" for 2–3 business days'
        />
      </div>
      <StatusBanner status={status} />
      <SaveButton loading={loading} onClick={handleSave} />
    </div>
  );
}

function PoliciesTab({ settings, onChange, onSave }: {
  settings: StoreSettingsData;
  onChange: (key: keyof StoreSettingsData, value: unknown) => void;
  onSave: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  async function handleSave() {
    setLoading(true); setStatus(null);
    try {
      const msg = await saveSection("policies", settings.policies);
      setStatus({ type: "success", message: msg });
      onSave();
    } catch (e) {
      setStatus({ type: "error", message: e instanceof Error ? e.message : "Failed to save." });
    } finally {
      setLoading(false);
    }
  }

  function setPolicies(key: keyof typeof settings.policies, value: number) {
    onChange("policies", { ...settings.policies, [key]: value });
  }

  return (
    <div className="space-y-6">
      <div>
        <SectionHeader title="Return & Exchange Windows" subtitle="Number of days customers can request a return or exchange after delivery" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Return Window (days)"
            value={settings.policies.returnDays}
            onChange={(v) => setPolicies("returnDays", Number(v))}
            type="number"
            placeholder="7"
          />
          <Field
            label="Exchange Window (days)"
            value={settings.policies.exchangeDays}
            onChange={(v) => setPolicies("exchangeDays", Number(v))}
            type="number"
            placeholder="15"
          />
        </div>
        <StatusBanner status={status} />
        <div className="mt-4">
          <SaveButton loading={loading} onClick={handleSave} />
        </div>
      </div>

      <div>
        <SectionHeader title="Policy Pages" subtitle="These pages are already live on your website" />
        <div className="space-y-2">
          {POLICY_LINKS.map(({ label, href }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 hover:border-[#1a5c14]/40 hover:bg-[#1a5c14]/5 hover:text-[#1a5c14] transition-colors group"
            >
              <span>{label}</span>
              <ExternalLink className="h-3.5 w-3.5 text-gray-400 group-hover:text-[#1a5c14]" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function BusinessTab({ settings, onChange, onSave }: {
  settings: StoreSettingsData;
  onChange: (key: keyof StoreSettingsData, value: unknown) => void;
  onSave: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const [showGst, setShowGst] = useState(false);
  const [showCin, setShowCin] = useState(false);

  async function handleSave() {
    setLoading(true); setStatus(null);
    try {
      const msg = await saveSection("business", settings.business);
      setStatus({ type: "success", message: msg });
      onSave();
    } catch (e) {
      setStatus({ type: "error", message: e instanceof Error ? e.message : "Failed to save." });
    } finally {
      setLoading(false);
    }
  }

  function setBusiness(key: keyof typeof settings.business, value: string) {
    onChange("business", { ...settings.business, [key]: value });
  }

  function MaskedInput({ label, field, show, onToggle }: {
    label: string;
    field: keyof typeof settings.business;
    show: boolean;
    onToggle: () => void;
  }) {
    return (
      <div className="space-y-1">
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
        <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-white focus-within:border-[#1a5c14] focus-within:ring-1 focus-within:ring-[#1a5c14]/20 transition-colors">
          <input
            type={show ? "text" : "password"}
            value={settings.business[field]}
            onChange={(e) => setBusiness(field, e.target.value)}
            className="flex-1 text-sm font-mono text-gray-800 bg-transparent outline-none placeholder:text-gray-400"
            placeholder={field === "gst" ? "27AXXXX1234X1ZX" : "U52100MH2024PTC000001"}
          />
          <button type="button" onClick={onToggle} className="shrink-0 text-gray-400 hover:text-gray-700" tabIndex={-1}>
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SectionHeader title="Business Registration Details" subtitle="Your official government registration numbers" />
      <div className="grid gap-4 sm:grid-cols-2">
        <MaskedInput label="GST Number" field="gst" show={showGst} onToggle={() => setShowGst((v) => !v)} />
        <MaskedInput label="CIN" field="cin" show={showCin} onToggle={() => setShowCin((v) => !v)} />
      </div>
      <StatusBanner status={status} />
      <SaveButton loading={loading} onClick={handleSave} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Admin Account tab (credentials management)
// ---------------------------------------------------------------------------

function PasswordInput({
  label, value, onChange, placeholder, autoComplete,
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; autoComplete?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1">
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
      <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-white focus-within:border-[#1a5c14] focus-within:ring-1 focus-within:ring-[#1a5c14]/20">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="flex-1 text-sm text-gray-800 bg-transparent outline-none placeholder:text-gray-400"
        />
        <button type="button" onClick={() => setShow((v) => !v)} className="shrink-0 text-gray-400 hover:text-gray-700" tabIndex={-1}>
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

function TextInput({
  label, value, onChange, placeholder, type = "text", autoComplete,
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; autoComplete?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 bg-white outline-none focus:border-[#1a5c14] focus:ring-1 focus:ring-[#1a5c14]/20 placeholder:text-gray-400"
      />
    </div>
  );
}

function CredSubmitButton({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="flex items-center gap-2 rounded-lg bg-[#1a5c14] px-4 py-2 text-sm font-semibold text-white hover:bg-[#154a10] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {label}
    </button>
  );
}

async function credentialsPut(body: Record<string, string>): Promise<string> {
  const res = await fetch("/api/admin/settings/credentials", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json() as { message?: string; error?: string };
  if (!res.ok) throw new Error(json.error ?? "Something went wrong.");
  return json.message ?? "Done.";
}

function AdminAccountTab() {
  const [currentEmail, setCurrentEmail] = useState("");
  const [emailForm, setEmailForm] = useState({ currentPassword: "", newEmail: "" });
  const [emailStatus, setEmailStatus] = useState<Status>(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwStatus, setPwStatus] = useState<Status>(null);
  const [pwLoading, setPwLoading] = useState(false);
  const [codeForm, setCodeForm] = useState({ currentPassword: "", newCode: "", confirmCode: "" });
  const [codeStatus, setCodeStatus] = useState<Status>(null);
  const [codeLoading, setCodeLoading] = useState(false);

  const fetchEmail = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/settings/credentials");
      const json = await res.json() as { data?: { email: string } };
      if (json.data?.email) setCurrentEmail(json.data.email);
    } catch { /* non-fatal */ }
  }, []);

  useEffect(() => { fetchEmail(); }, [fetchEmail]);

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEmailLoading(true); setEmailStatus(null);
    try {
      const msg = await credentialsPut({ action: "email", currentPassword: emailForm.currentPassword, newEmail: emailForm.newEmail });
      setEmailStatus({ type: "success", message: msg });
      setEmailForm({ currentPassword: "", newEmail: "" });
      fetchEmail();
    } catch (err) {
      setEmailStatus({ type: "error", message: err instanceof Error ? err.message : "Failed to update email." });
    } finally { setEmailLoading(false); }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPwLoading(true); setPwStatus(null);
    try {
      const msg = await credentialsPut({ action: "password", currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword, confirmPassword: pwForm.confirmPassword });
      setPwStatus({ type: "success", message: msg });
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setPwStatus({ type: "error", message: err instanceof Error ? err.message : "Failed to update password." });
    } finally { setPwLoading(false); }
  }

  async function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCodeLoading(true); setCodeStatus(null);
    try {
      const msg = await credentialsPut({ action: "portal-code", currentPassword: codeForm.currentPassword, newCode: codeForm.newCode, confirmCode: codeForm.confirmCode });
      setCodeStatus({ type: "success", message: msg });
      setCodeForm({ currentPassword: "", newCode: "", confirmCode: "" });
    } catch (err) {
      setCodeStatus({ type: "error", message: err instanceof Error ? err.message : "Failed to update portal code." });
    } finally { setCodeLoading(false); }
  }

  return (
    <div className="space-y-8">
      <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5">
        <ShieldCheck className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          All credentials are stored securely and encrypted. Changes take effect immediately — old credentials stop working as soon as you save.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <AtSign className="h-4 w-4 text-[#1a5c14]" />
          <h3 className="text-sm font-bold text-gray-800">Change Login Email</h3>
        </div>
        {currentEmail && (
          <p className="text-xs text-gray-500">Current email: <span className="font-semibold text-gray-700">{currentEmail}</span></p>
        )}
        <form onSubmit={handleEmailSubmit} className="space-y-3">
          <TextInput label="New Email" type="email" value={emailForm.newEmail} onChange={(v) => setEmailForm((f) => ({ ...f, newEmail: v }))} placeholder="newadmin@example.com" autoComplete="email" />
          <PasswordInput label="Current Password (to confirm)" value={emailForm.currentPassword} onChange={(v) => setEmailForm((f) => ({ ...f, currentPassword: v }))} placeholder="Enter your current password" autoComplete="current-password" />
          <StatusBanner status={emailStatus} />
          <CredSubmitButton loading={emailLoading} label="Update Email" />
        </form>
      </div>

      <div className="rounded-xl border border-gray-200 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-[#1a5c14]" />
          <h3 className="text-sm font-bold text-gray-800">Change Password</h3>
        </div>
        <form onSubmit={handlePasswordSubmit} className="space-y-3">
          <PasswordInput label="Current Password" value={pwForm.currentPassword} onChange={(v) => setPwForm((f) => ({ ...f, currentPassword: v }))} placeholder="Enter your current password" autoComplete="current-password" />
          <PasswordInput label="New Password" value={pwForm.newPassword} onChange={(v) => setPwForm((f) => ({ ...f, newPassword: v }))} placeholder="At least 8 characters" autoComplete="new-password" />
          <PasswordInput label="Confirm New Password" value={pwForm.confirmPassword} onChange={(v) => setPwForm((f) => ({ ...f, confirmPassword: v }))} placeholder="Re-enter new password" autoComplete="new-password" />
          <StatusBanner status={pwStatus} />
          <CredSubmitButton loading={pwLoading} label="Update Password" />
        </form>
      </div>

      <div className="rounded-xl border border-gray-200 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-[#1a5c14]" />
          <h3 className="text-sm font-bold text-gray-800">Change Admin Portal Code</h3>
        </div>
        <p className="text-xs text-gray-500">
          The portal code is the second step when you log in to the admin panel. Keep it private.
        </p>
        <form onSubmit={handleCodeSubmit} className="space-y-3">
          <PasswordInput label="Current Password (to confirm)" value={codeForm.currentPassword} onChange={(v) => setCodeForm((f) => ({ ...f, currentPassword: v }))} placeholder="Enter your current password" autoComplete="current-password" />
          <PasswordInput label="New Portal Code" value={codeForm.newCode} onChange={(v) => setCodeForm((f) => ({ ...f, newCode: v }))} placeholder="At least 4 characters" />
          <PasswordInput label="Confirm New Portal Code" value={codeForm.confirmCode} onChange={(v) => setCodeForm((f) => ({ ...f, confirmCode: v }))} placeholder="Re-enter new portal code" />
          <StatusBanner status={codeStatus} />
          <CredSubmitButton loading={codeLoading} label="Update Portal Code" />
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton loader
// ---------------------------------------------------------------------------

function SettingsSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-12 rounded-lg bg-gray-100" />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const EMPTY: StoreSettingsData = {
  storeName: "", tagline: "", description: "", storeUrl: "",
  contact: { email: "", phone: "", address: "", whatsapp: "" },
  social: { instagram: "", twitter: "", facebook: "", youtube: "" },
  shipping: { freeAbove: 0, standardFee: 0, expressFee: 0, standardDays: "", expressDays: "" },
  policies: { returnDays: 0, exchangeDays: 0 },
  business: { gst: "", cin: "" },
};

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("general");
  const [settings, setSettings] = useState<StoreSettingsData>(EMPTY);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/settings/store");
      const json = await res.json() as { data?: StoreSettingsData };
      if (json.data) setSettings(json.data);
    } catch { /* non-fatal */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  function updateSettings(key: keyof StoreSettingsData, value: unknown) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  function renderContent() {
    if (loading) return <SettingsSkeleton />;

    const props = { settings, onChange: updateSettings, onSave: fetchSettings };

    switch (activeTab) {
      case "general":       return <GeneralTab  {...props} />;
      case "contact":       return <ContactTab  {...props} />;
      case "social":        return <SocialTab   {...props} />;
      case "shipping":      return <ShippingTab {...props} />;
      case "policies":      return <PoliciesTab {...props} />;
      case "business":      return <BusinessTab {...props} />;
      case "admin-account": return <AdminAccountTab />;
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 min-h-screen bg-gray-50">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1a5c14]/10 shrink-0">
          <Settings className="h-5 w-5 text-[#1a5c14]" />
        </div>
        <div>
          <h1 className="text-xl font-black text-gray-900">Settings</h1>
          <p className="text-xs text-gray-500">Manage your store information</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 lg:gap-6">
        {/* Sidebar */}
        <nav className="sm:w-52 lg:w-56 shrink-0">
          <div className="sm:hidden flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition-colors shrink-0",
                  activeTab === tab.id
                    ? "bg-[#1a5c14]/10 text-[#1a5c14]"
                    : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          <div className="hidden sm:flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2.5 px-4 py-3 text-sm font-medium transition-colors text-left border-r-2",
                  activeTab === tab.id
                    ? "bg-[#1a5c14]/10 text-[#1a5c14] font-semibold border-[#1a5c14]"
                    : "border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0 bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
