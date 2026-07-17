import Link from "next/link";
import { ROUTES } from "@/constants";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 text-center px-4">
      <div className="space-y-2">
        <p className="text-8xl font-bold text-muted-foreground/30">404</p>
        <h1 className="text-3xl font-bold">Page Not Found</h1>
        <p className="text-muted-foreground max-w-md">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
      </div>
      <Link
        href={ROUTES.HOME}
        className="inline-flex items-center gap-2 rounded-full bg-brand-black text-brand-white px-8 py-3 text-sm font-semibold transition hover:opacity-80"
      >
        Back to Home
      </Link>
    </div>
  );
}
