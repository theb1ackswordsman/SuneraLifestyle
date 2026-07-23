import Link from "next/link";
import { connectDB } from "@/lib/db/connection";
import { Category } from "@/models/category.model";
import { siteConfig } from "@/config/site";
import { Separator } from "@/components/ui/separator";
import { Logo } from "@/components/shared/logo";
import { Mail } from "lucide-react";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

interface FooterSub { _id: string; name: string; href: string }
interface FooterCat { _id: string; name: string; href: string; subcategories: FooterSub[] }

async function getFooterCategories(): Promise<FooterCat[]> {
  try {
    await connectDB();
    const all = await Category.find({ isActive: true, deletedAt: null })
      .sort({ order: 1, name: 1 })
      .select("name slug parentId")
      .lean();
    const parents  = all.filter((c) => !c.parentId);
    const children = all.filter((c) => c.parentId);
    return parents.map((p) => ({
      _id:           String(p._id),
      name:          p.name,
      href:          `/shop?type=${p.slug}`,
      subcategories: children
        .filter((c) => String(c.parentId) === String(p._id))
        .map((c) => ({ _id: String(c._id), name: c.name, href: `/shop?category=${c.slug}` })),
    }));
  } catch {
    return [];
  }
}

const COMPANY_LINKS = [
  { label: "About Us",    href: "/about" },
  { label: "Blogs",       href: "/blogs" },
  { label: "Collections", href: "/collections" },
];

const SUPPORT_LINKS = [
  { label: "Contact Us",        href: "/contact" },
  { label: "Track Order",       href: "/track-order" },
  { label: "FAQs",              href: "/faqs" },
  { label: "Shipping Policy",   href: "/shipping-policy" },
  { label: "Refund Policy",     href: "/refund-policy" },
  { label: "Terms & Conditions", href: "/terms-and-conditions" },
];

export async function Footer() {
  const shopCategories = await getFooterCategories();

  return (
    <footer className="border-t border-border bg-background">
      <div className="container-padded py-14">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-5">
          {/* Brand Column */}
          <div className="col-span-2 lg:col-span-2 space-y-4">
            <Link href="/" className="inline-block">
              <Logo height={48} />
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              {siteConfig.description}
            </p>
            <div className="space-y-2.5 pt-1">
              <a
                href="https://wa.me/919135564607"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-[#25D366]"
              >
                <WhatsAppIcon className="h-4 w-4 shrink-0" />
                {siteConfig.contact.phone}
              </a>
              <a
                href={`mailto:${siteConfig.contact.email}`}
                className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-brand-emerald"
              >
                <Mail className="h-4 w-4 shrink-0" />
                {siteConfig.contact.email}
              </a>
            </div>
          </div>

          {/* Shop Column — dynamic from DB */}
          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-foreground">
              Shop
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/shop"
                  className="text-sm text-muted-foreground transition-colors hover:text-brand-emerald"
                >
                  All Products
                </Link>
              </li>
              {shopCategories.map((cat) => (
                <li key={cat._id} className="pt-1">
                  <Link
                    href={cat.href}
                    className="text-sm font-semibold text-foreground/80 transition-colors hover:text-brand-emerald"
                  >
                    {cat.name}
                  </Link>
                  {cat.subcategories.length > 0 && (
                    <ul className="mt-1.5 ml-3 space-y-1.5">
                      {cat.subcategories.map((sub) => (
                        <li key={sub._id}>
                          <Link
                            href={sub.href}
                            className="text-xs text-muted-foreground transition-colors hover:text-brand-emerald"
                          >
                            {sub.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-foreground">
              Company
            </h3>
            <ul className="space-y-2.5">
              {COMPANY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-brand-emerald"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Column */}
          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-foreground">
              Support
            </h3>
            <ul className="space-y-2.5">
              {SUPPORT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-brand-emerald"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <Separator />

      <div className="container-padded py-5">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
