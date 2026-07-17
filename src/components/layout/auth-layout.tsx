import Link from "next/link";
import { ROUTES } from "@/constants";
import { Logo } from "@/components/shared/logo";

const BRAND_FEATURES = [
  { emoji: "💪", text: "Premium supplements for peak performance" },
  { emoji: "👕", text: "Industry-leading fitness clothing" },
  { emoji: "🔬", text: "Lab-certified, 100% authentic products" },
  { emoji: "🚀", text: "Free delivery on orders above ₹999" },
];

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen">
      {/* Brand Panel — desktop only */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[40%] flex-col justify-between bg-linear-to-br from-[#071f04] via-[#103a0c] to-[#1a5c14] p-12 relative overflow-hidden">
        {/* Grain */}
        <div className="absolute inset-0 opacity-[0.04] [background-image:url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22300%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.75%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22300%22 height=%22300%22 filter=%22url(%23n)%22 opacity=%221%22/%3E%3C/svg%3E')]" />
        {/* Blobs */}
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#2d8a22]/15 blur-3xl" />
        <div className="absolute -bottom-20 -left-10 h-60 w-60 rounded-full bg-[#e8940a]/10 blur-3xl" />

        <div className="relative z-10">
          <Link href={ROUTES.HOME} className="inline-block">
            <Logo height={56} darkBg />
          </Link>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-4xl font-black text-white leading-tight">
              Elevate Your
              <br />
              Performance
            </h2>
            <p className="mt-4 text-base text-white/70 leading-relaxed max-w-sm">
              India&apos;s premium fitness brand trusted by 50,000+ athletes and fitness enthusiasts.
            </p>
          </div>

          <ul className="space-y-4">
            {BRAND_FEATURES.map((f) => (
              <li key={f.text} className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xl">
                  {f.emoji}
                </span>
                <span className="text-sm text-white/80 font-medium">{f.text}</span>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-4 pt-2">
            <div className="text-center">
              <p className="text-2xl font-black text-white">50K+</p>
              <p className="text-xs text-white/60">Happy Customers</p>
            </div>
            <div className="h-10 w-px bg-white/20" />
            <div className="text-center">
              <p className="text-2xl font-black text-white">4.9★</p>
              <p className="text-xs text-white/60">Average Rating</p>
            </div>
            <div className="h-10 w-px bg-white/20" />
            <div className="text-center">
              <p className="text-2xl font-black text-white">200+</p>
              <p className="text-xs text-white/60">Products</p>
            </div>
          </div>
        </div>

        <p className="relative z-10 text-xs text-white/40">
          © {new Date().getFullYear()} SunEra Lifestyle. All rights reserved.
        </p>
      </div>

      {/* Form Panel */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-12">
        {/* Mobile logo */}
        <Link href={ROUTES.HOME} className="mb-8 lg:hidden">
          <Logo height={44} />
        </Link>

        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
