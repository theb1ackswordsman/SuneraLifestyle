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
      {/* Mobile: horizontal scroll strip */}
      <div className="flex overflow-x-auto scrollbar-none divide-x divide-border sm:hidden">
        {BADGES.map(({ Icon, label, sub }) => (
          <div key={label} className="flex min-w-40 flex-col items-center gap-2 px-5 py-4 text-center">
            <Icon className="h-7 w-7 shrink-0 text-gray-400" strokeWidth={1.4} />
            <div>
              <p className="text-xs font-bold text-gray-800 whitespace-nowrap">{label}</p>
              <p className="text-[10px] text-gray-500 leading-snug">{sub}</p>
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
