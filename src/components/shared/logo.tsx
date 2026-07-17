import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  height?: number;
  className?: string;
  darkBg?: boolean;
}

export function Logo({ height = 40, className, darkBg = false }: LogoProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center flex-shrink-0",
        darkBg && "bg-white/95 rounded-xl px-2 py-1",
        className
      )}
    >
      <Image
        src="/sunera.jpeg"
        alt="SunEra Lifestyle"
        width={height}
        height={height}
        className="object-contain"
        priority
      />
    </span>
  );
}
