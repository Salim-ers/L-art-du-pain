import type { ReactNode } from "react";
import "../shop.css";
import "../shop-pages.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CartProvider } from "@/components/shop/CartProvider";
import { TabBar } from "@/components/shop/TabBar";
import { organizationJsonLd } from "@/lib/schema";
import { JsonLd } from "@/components/JsonLd";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      <JsonLd data={organizationJsonLd()} />
      <Header />
      {children}
      <Footer />
      <TabBar />
    </CartProvider>
  );
}
