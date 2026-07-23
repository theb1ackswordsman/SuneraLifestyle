"use client";

import { useState } from "react";
import {
  Settings,
  Info,
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
  ExternalLink,
  Building2,
  Server,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TabId = "general" | "contact" | "shipping" | "policies" | "business" | "environment";

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Static data
// ---------------------------------------------------------------------------

const TABS: Tab[] = [
  { id: "general",     label: "General",        icon: <Settings className="h-4 w-4" /> },
  { id: "contact",     label: "Contact & Social", icon: <Mail className="h-4 w-4" /> },
  { id: "shipping",    label: "Shipping",        icon: <Truck className="h-4 w-4" /> },
  { id: "policies",    label: "Policies",        icon: <FileText className="h-4 w-4" /> },
  { id: "business",    label: "Business",        icon: <Building2 className="h-4 w-4" /> },
  { id: "environment", label: "Environment",     icon: <Server className="h-4 w-4" /> },
];

const ENV_VARS: { name: string; description: string }[] = [
  { name: "MONGODB_URI",              description: "MongoDB connection string for the main database" },
  { name: "CLOUDINARY_CLOUD_NAME",    description: "Cloudinary cloud name for image storage" },
  { name: "CLOUDINARY_API_KEY",       description: "Cloudinary API key for upload authentication" },
  { name: "CLOUDINARY_API_SECRET",    description: "Cloudinary API secret (keep private)" },
  { name: "RAZORPAY_KEY_ID",          description: "Razorpay public key ID for payment gateway" },
  { name: "RAZORPAY_KEY_SECRET",      description: "Razorpay secret key (keep private)" },
  { name: "NEXT_PUBLIC_APP_URL",      description: "Public base URL of the storefront (e.g. https://sunera.in)" },
  { name: "NEXTAUTH_SECRET",          description: "Secret used to sign NextAuth session tokens" },
  { name: "NEXTAUTH_URL",             description: "Canonical URL for NextAuth callbacks" },
  { name: "GOOGLE_CLIENT_ID",         description: "Google OAuth client ID for social sign-in" },
  { name: "GOOGLE_CLIENT_SECRET",     description: "Google OAuth client secret (keep private)" },
  { name: "SMTP_HOST",                description: "SMTP server hostname for transactional email" },
  { name: "SMTP_PORT",                description: "SMTP server port (typically 465 or 587)" },
  { name: "SMTP_USER",                description: "SMTP authentication username / email address" },
  { name: "SMTP_PASS",                description: "SMTP authentication password (keep private)" },
  { name: "ATLAS_SEARCH_ENABLED",     description: "Set to 'true' to enable MongoDB Atlas Search" },
];

const POLICY_LINKS: { label: string; href: string }[] = [
  { label: "Refund Policy",      href: "/refund-policy" },
  { label: "Shipping Policy",    href: "/shipping-policy" },
  { label: "Terms & Conditions", href: "/terms-and-conditions" },
];

// ---------------------------------------------------------------------------
// Small reusable primitives
// ---------------------------------------------------------------------------

function SectionHeader({ title }: { title: string }) {
  return (
    <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 border-b border-gray-100 pb-2 mb-4">
      {title}
    </h2>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide">
        {label}
      </label>
      <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700">
        {value}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab panels
// ---------------------------------------------------------------------------

function GeneralTab() {
  return (
    <div className="space-y-4">
      <SectionHeader title="Store Identity" />
      <div className="grid gap-4 sm:grid-cols-2">
        <ReadOnlyField label="Store Name"  value={siteConfig.name} />
        <ReadOnlyField label="Tagline"     value={siteConfig.tagline} />
      </div>
      <ReadOnlyField label="Description" value={siteConfig.description} />
      <ReadOnlyField label="Store URL"   value={siteConfig.url} />

      <SectionHeader title="Locale & Currency" />
      <div className="grid gap-4 sm:grid-cols-3">
        <ReadOnlyField label="Currency"  value={`${siteConfig.currency.code} / ${siteConfig.currency.symbol}`} />
        <ReadOnlyField label="Time Zone" value="IST (UTC+5:30)" />
        <ReadOnlyField label="Language"  value="English (India)" />
      </div>
    </div>
  );
}

function ContactTab() {
  const socialLinks: { label: string; url: string; icon: React.ReactNode; color: string }[] = [
    {
      label: "Instagram",
      url:   siteConfig.social.instagram,
      icon:  <Instagram className="h-4 w-4" />,
      color: "text-pink-600 bg-pink-50 border-pink-100",
    },
    {
      label: "Twitter / X",
      url:   siteConfig.social.twitter,
      icon:  <Twitter className="h-4 w-4" />,
      color: "text-sky-600 bg-sky-50 border-sky-100",
    },
    {
      label: "Facebook",
      url:   siteConfig.social.facebook,
      icon:  <Facebook className="h-4 w-4" />,
      color: "text-blue-700 bg-blue-50 border-blue-100",
    },
    {
      label: "YouTube",
      url:   siteConfig.social.youtube,
      icon:  <Youtube className="h-4 w-4" />,
      color: "text-red-600 bg-red-50 border-red-100",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <SectionHeader title="Contact Details" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
            <Mail className="h-4 w-4 text-[#1a5c14] mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Email</p>
              <a
                href={`mailto:${siteConfig.contact.email}`}
                className="text-sm text-gray-700 hover:text-[#1a5c14] transition-colors"
              >
                {siteConfig.contact.email}
              </a>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
            <Phone className="h-4 w-4 text-[#1a5c14] mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Phone</p>
              <p className="text-sm text-gray-700">{siteConfig.contact.phone}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
            <MapPin className="h-4 w-4 text-[#1a5c14] mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Address</p>
              <p className="text-sm text-gray-700">{siteConfig.contact.address}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
            <MessageCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">WhatsApp</p>
              <p className="text-sm text-gray-700">+91 91355 64607</p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <SectionHeader title="Social Profiles" />
        <div className="grid gap-3 sm:grid-cols-2">
          {socialLinks.map(({ label, url, icon, color }) => (
            <a
              key={label}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "flex items-center justify-between gap-3 rounded-xl border px-4 py-3 transition-opacity hover:opacity-80",
                color
              )}
            >
              <div className="flex items-center gap-2.5">
                {icon}
                <span className="text-sm font-medium">{label}</span>
              </div>
              <ExternalLink className="h-3.5 w-3.5 opacity-60 shrink-0" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function ShippingTab() {
  const rows: { label: string; value: string }[] = [
    { label: "Free Shipping Threshold", value: `₹${siteConfig.shipping.freeAbove.toLocaleString("en-IN")}` },
    { label: "Standard Shipping Fee",   value: `₹${siteConfig.shipping.standardFee}` },
    { label: "Express Shipping Fee",    value: `₹${siteConfig.shipping.expressFee}` },
    { label: "Standard Delivery Time",  value: `${siteConfig.shipping.estimatedDays.standard} business days` },
    { label: "Express Delivery Time",   value: `${siteConfig.shipping.estimatedDays.express} business days` },
  ];

  return (
    <div>
      <SectionHeader title="Shipping Configuration" />
      <div className="overflow-hidden rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <tbody className="divide-y divide-gray-100">
            {rows.map(({ label, value }, i) => (
              <tr key={i} className="hover:bg-gray-50/60 transition-colors">
                <td className="px-4 py-3.5 font-medium text-gray-600 w-1/2">{label}</td>
                <td className="px-4 py-3.5 font-semibold text-gray-900">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-gray-400">
        To update these values, edit <code className="font-mono bg-gray-100 px-1 py-0.5 rounded text-gray-600">src/config/site.ts</code>.
      </p>
    </div>
  );
}

function PoliciesTab() {
  return (
    <div className="space-y-6">
      <div>
        <SectionHeader title="Return & Exchange Windows" />
        <div className="grid gap-4 sm:grid-cols-2">
          <ReadOnlyField label="Return Window"   value={`${siteConfig.policies.returnDays} days from delivery`} />
          <ReadOnlyField label="Exchange Window" value={`${siteConfig.policies.exchangeDays} days from delivery`} />
        </div>
      </div>

      <div>
        <SectionHeader title="Policy Pages" />
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
              <div className="flex items-center gap-1.5 text-xs text-gray-400 group-hover:text-[#1a5c14]">
                <span className="font-mono">{href}</span>
                <ExternalLink className="h-3 w-3" />
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function BusinessTab() {
  const [showGst, setShowGst] = useState(false);
  const [showCin, setShowCin] = useState(false);

  function MaskedField({
    label,
    value,
    show,
    onToggle,
  }: {
    label: string;
    value: string;
    show: boolean;
    onToggle: () => void;
  }) {
    return (
      <div className="space-y-1">
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide">
          {label}
        </label>
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
          <span className="flex-1 text-sm font-mono text-gray-700 tracking-wider select-none">
            {show ? value : "•".repeat(value.length)}
          </span>
          <button
            type="button"
            onClick={onToggle}
            className="shrink-0 text-gray-400 hover:text-gray-700 transition-colors"
            aria-label={show ? `Hide ${label}` : `Reveal ${label}`}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SectionHeader title="Business Identifiers" />
      <div className="grid gap-4 sm:grid-cols-2">
        <MaskedField
          label="GST Number"
          value={siteConfig.business.gst}
          show={showGst}
          onToggle={() => setShowGst((v) => !v)}
        />
        <MaskedField
          label="CIN"
          value={siteConfig.business.cin}
          show={showCin}
          onToggle={() => setShowCin((v) => !v)}
        />
      </div>
      <p className="text-xs text-gray-400">
        Click the eye icon to reveal the value. These identifiers are read from{" "}
        <code className="font-mono bg-gray-100 px-1 py-0.5 rounded text-gray-600">src/config/site.ts</code>.
      </p>
    </div>
  );
}

function EnvironmentTab() {
  return (
    <div className="space-y-5">
      <div className="flex gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3.5">
        <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
        <p className="text-sm text-blue-700">
          Environment variables are configured server-side and cannot be read in the browser.
          Check your <code className="font-mono bg-blue-100 px-1 py-0.5 rounded text-blue-800">.env.local</code> file
          or your hosting provider&apos;s dashboard (e.g. Vercel Environment Variables) to review and manage them.
        </p>
      </div>

      <div>
        <SectionHeader title="Required Environment Variables" />
        <div className="overflow-hidden rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 w-2/5">
                  Variable
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ENV_VARS.map(({ name, description }) => (
                <tr key={name} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-medium text-[#1a5c14] align-top">
                    {name}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">{description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("general");

  function renderContent() {
    switch (activeTab) {
      case "general":     return <GeneralTab />;
      case "contact":     return <ContactTab />;
      case "shipping":    return <ShippingTab />;
      case "policies":    return <PoliciesTab />;
      case "business":    return <BusinessTab />;
      case "environment": return <EnvironmentTab />;
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 min-h-screen bg-gray-50">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1a5c14]/10 shrink-0">
          <Settings className="h-5 w-5 text-[#1a5c14]" />
        </div>
        <div>
          <h1 className="text-xl font-black text-gray-900">Settings</h1>
          <p className="text-xs text-gray-500">Store configuration overview</p>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3.5">
        <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
        <p className="text-sm text-blue-700">
          These settings reflect your current store configuration. To modify them, update{" "}
          <code className="font-mono bg-blue-100 px-1 py-0.5 rounded text-blue-800">src/config/site.ts</code>{" "}
          or your environment variables.
        </p>
      </div>

      {/* Main layout: sidebar + content */}
      <div className="flex flex-col sm:flex-row gap-4 lg:gap-6">
        {/* Sidebar tab navigation */}
        <nav className="sm:w-52 lg:w-56 shrink-0">
          {/* Mobile: horizontal scrollable pill tabs */}
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

          {/* Desktop: vertical sidebar */}
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

        {/* Content area */}
        <div className="flex-1 min-w-0 bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
