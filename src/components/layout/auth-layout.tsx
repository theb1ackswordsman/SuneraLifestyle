import Image from "next/image";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

const LOGIN_FEATURES    = ["SECURE AUTH", "GOOGLE SIGN-IN", "CURATED FOR YOU"];
const REGISTER_FEATURES = ["FREE DELIVERY", "AYURVEDIC CERTIFIED", "EASY RETURNS"];

const LEFT_W = "lg:w-[46%] xl:w-[42%]";

interface AuthLayoutProps {
  children: React.ReactNode;
  variant?: "login" | "register";
}

export function AuthLayout({ children, variant = "login" }: AuthLayoutProps) {
  const isLogin = variant === "login";
  const features = isLogin ? LOGIN_FEATURES : REGISTER_FEATURES;

  return (
    <div className="bg-background">
      <Header />

      {/* Split-colour spacer matching the fixed header height (~112 px = h-28).
          Cream on the left half, white on the right — no colour break under the navbar. */}
      <div className="h-28 flex shrink-0">
        <div className={`hidden lg:block bg-[#f5f3ee] ${LEFT_W}`} />
        <div className="flex-1 bg-background" />
      </div>

      {/* Single-page two-column layout — both sides are the same element,
          the whole page scrolls as one unit, no nested scroll containers. */}
      <div className="flex min-h-[calc(100vh-7rem)]">

        {/* Left — cream branding panel */}
        <aside
          className={`hidden relative overflow-hidden ${LEFT_W} lg:flex flex-col items-center justify-start shrink-0 bg-[#f5f3ee] px-12 xl:px-16 pt-10 pb-14`}
        >
          {/* Grain */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.025] [background-image:url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22200%22 height=%22200%22 filter=%22url(%23n)%22 opacity=%221%22/%3E%3C/svg%3E')]" />

          <div className="relative z-10 w-full max-w-sm">
            <div className="flex justify-center mb-7">
              <Image
                src="/sunera1.png"
                alt="SunEra Lifestyle"
                width={160}
                height={160}
                className="object-contain"
                priority
              />
            </div>

            <span className="inline-flex items-center rounded-full border border-brand-emerald/30 bg-brand-emerald/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-brand-emerald">
              {isLogin ? "Members area" : "New here"}
            </span>

            <div className="mt-5">
              <h1 className="text-[2.75rem] xl:text-[3.1rem] font-light leading-[1.1] tracking-tight text-foreground/40">
                {isLogin ? "Sign in to" : "Create your"}
              </h1>
              <h1 className="text-[2.75rem] xl:text-[3.1rem] font-black leading-[1.1] tracking-tight">
                <span className="text-brand-emerald">Sun</span>
                <span className="text-brand-orange">Era</span>
                <span className="text-brand-emerald"> Lifestyle.</span>
              </h1>
            </div>

            <div className="mt-5 h-0.5 w-12 rounded-full bg-brand-emerald/50" />

            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
              {isLogin
                ? "Your orders, wishlist, and wellness journey — all in one place. Sign in to pick up where you left off."
                : "Join thousands discovering the power of Ayurveda. Get exclusive deals, order tracking, and personalised product picks."}
            </p>

            <div className="mt-7 flex flex-wrap gap-2">
              {features.map((f) => (
                <span
                  key={f}
                  className="rounded-full border border-border bg-white/70 px-4 py-1.5 text-[9px] font-bold uppercase tracking-[0.13em] text-foreground/40"
                >
                  {f}
                </span>
              ))}
            </div>
          </div>
        </aside>

        {/* Right — form panel */}
        <div className="flex flex-1 justify-center">
          <div className="w-full max-w-lg px-5 py-12 sm:px-8 lg:px-12 xl:px-14">
            <div className="mb-5 lg:hidden">
              <span className="inline-flex items-center rounded-full border border-brand-emerald/30 bg-brand-emerald/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-brand-emerald">
                {isLogin ? "Members area" : "New here"}
              </span>
            </div>
            {children}
          </div>
        </div>

      </div>

      <Footer />
    </div>
  );
}
