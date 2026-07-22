import Link from "next/link";
import { ShopLayout } from "@/components/layout/shop-layout";
import {
  Package, Heart, MapPin, Settings, ShieldCheck,
  MessageSquare, HeadphonesIcon, ChevronRight, User, RotateCcw,
} from "lucide-react";

const ACCOUNT_LINKS = [
  {
    icon: Package,
    label: "My Orders",
    desc: "Track and manage your orders",
    href: "/account/orders",
    color: "bg-amber-50 text-amber-600",
  },
  {
    icon: RotateCcw,
    label: "My Returns",
    desc: "Track return & refund requests",
    href: "/account/returns",
    color: "bg-orange-50 text-orange-500",
  },
  {
    icon: Heart,
    label: "Wishlist",
    desc: "Items you've saved for later",
    href: "/account/wishlist",
    color: "bg-rose-50 text-rose-500",
  },
  {
    icon: MapPin,
    label: "Addresses",
    desc: "Manage delivery addresses",
    href: "/account/addresses",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: MessageSquare,
    label: "My Reviews",
    desc: "Reviews you've written",
    href: "/account/reviews",
    color: "bg-purple-50 text-purple-600",
  },
  {
    icon: ShieldCheck,
    label: "Security",
    desc: "Password and account security",
    href: "/account/security",
    color: "bg-green-50 text-[#1a5c14]",
  },
  {
    icon: Settings,
    label: "Settings",
    desc: "Preferences and notifications",
    href: "/account/profile",
    color: "bg-gray-100 text-gray-600",
  },
  {
    icon: HeadphonesIcon,
    label: "Support",
    desc: "Get help with your orders",
    href: "/account/support",
    color: "bg-teal-50 text-teal-600",
  },
];

export default function AccountPage() {
  return (
    <ShopLayout>
      <div className="container-padded pt-32 pb-12">
        {/* Header */}
        <div className="mb-10 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1a5c14]/10">
            <User className="h-8 w-8 text-[#1a5c14]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground">My Account</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Manage your orders, addresses and preferences.
            </p>
          </div>
        </div>

        {/* Links grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ACCOUNT_LINKS.map(({ icon: Icon, label, desc, href, color }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-medium hover:border-[#1a5c14]/30"
            >
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground group-hover:text-[#1a5c14] transition-colors">
                  {label}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>

        {/* Sign out */}
        <div className="mt-10 border-t border-border pt-8">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-semibold text-red-500 hover:text-red-600 hover:underline"
          >
            Sign Out
          </Link>
        </div>
      </div>
    </ShopLayout>
  );
}
