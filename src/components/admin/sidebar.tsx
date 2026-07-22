"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard, Package, ShoppingBag, Users, Tag, Ticket,
  Star, FileText, BarChart2, Warehouse, Settings, LogOut, ChevronRight, RotateCcw, X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Dashboard",    href: "/admin",                icon: LayoutDashboard },
  { label: "Products",     href: "/admin/products",       icon: Package },
  { label: "Orders",       href: "/admin/orders",         icon: ShoppingBag },
  { label: "Customers",    href: "/admin/customers",      icon: Users },
  { label: "Categories",   href: "/admin/categories",     icon: Tag },
  { label: "Returns",      href: "/admin/returns",        icon: RotateCcw },
  { label: "Coupons",      href: "/admin/coupons",        icon: Ticket },
  { label: "Reviews",      href: "/admin/reviews",        icon: Star },
  { label: "Blogs",        href: "/admin/blogs",          icon: FileText },
  { label: "Analytics",    href: "/admin/analytics",      icon: BarChart2 },
  { label: "Inventory",    href: "/admin/inventory",      icon: Warehouse },
  { label: "Settings",     href: "/admin/settings",       icon: Settings },
];

interface AdminSidebarProps {
  onClose?: () => void;
}

export function AdminSidebar({ onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const router   = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  }

  return (
    <aside className="flex h-full w-64 lg:w-60 shrink-0 flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f0f4f0]">
            <Image src="/sunera.jpeg" alt="SunEra" width={32} height={32} className="object-contain" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-gray-900">SunEra</p>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#1a5c14]">Admin Panel</p>
          </div>
        </div>
        {/* Mobile close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="ml-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg hover:bg-gray-100 lg:hidden transition-colors"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {NAV.map(({ label, href, icon: Icon }) => {
          const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-[#1a5c14] text-white"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", active ? "text-white" : "text-gray-400 group-hover:text-gray-600")} />
              {label}
              {active && <ChevronRight className="ml-auto h-3.5 w-3.5 text-white/60" />}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-gray-100 p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Logout
        </button>
      </div>
    </aside>
  );
}
