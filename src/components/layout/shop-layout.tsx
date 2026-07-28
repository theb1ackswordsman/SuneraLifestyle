import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

interface ShopLayoutProps {
  children: React.ReactNode;
}

export function ShopLayout({ children }: ShopLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <Header />
      <main className="flex-1 min-w-0">{children}</main>
      <Footer />
    </div>
  );
}
