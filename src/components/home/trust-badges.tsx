import { Truck, ShieldCheck, RotateCcw, Headphones } from "lucide-react";

const BADGES = [
  { Icon: Truck,       label: "Free Shipping",    sub: "On all orders above ₹999"    },
  { Icon: ShieldCheck, label: "Secure Payment",    sub: "SSL encrypted checkout"       },
  { Icon: RotateCcw,   label: "Easy Returns",      sub: "7-day hassle-free returns"    },
  { Icon: Headphones,  label: "Online Support",    sub: "Mon–Sat, 9am to 6pm"         },
];

export function TrustBadges() {
  return (
    <section className="border-y border-border bg-[#f9f9f9]">
      {/* Mobile: 2×2 grid — fits screen, no overflow */}
      <div className="grid grid-cols-2 divide-x divide-y divide-border sm:hidden">
        {BADGES.map(({ Icon, label, sub }) => (
          <div key={label} className="flex flex-col items-center gap-2 px-3 py-4 text-center">
            <Icon className="h-6 w-6 shrink-0 text-gray-400" strokeWidth={1.4} />
            <div>
              <p className="text-[11px] font-bold text-gray-800 leading-tight">{label}</p>
              <p className="text-[10px] text-gray-500 leading-snug mt-0.5">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* sm+: 4-column grid */}
      <div className="container-padded hidden sm:block">
        <div className="grid grid-cols-2 divide-x divide-y divide-border lg:grid-cols-4 lg:divide-y-0">
          {BADGES.map(({ Icon, label, sub }) => (
            <div key={label} className="flex items-center gap-4 px-6 py-5 sm:px-8">
              <Icon className="h-9 w-9 shrink-0 text-gray-400" strokeWidth={1.4} />
              <div>
                <p className="text-sm font-bold text-gray-800">{label}</p>
                <p className="text-xs text-gray-500">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
