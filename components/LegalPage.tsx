import Link from "next/link";
import type { ReactNode } from "react";
import { site } from "@/content/site";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="legal" id="contenu">
      <Link href="/" className="label">← {site.name}</Link>
      <h1 className="h-lg">{title}</h1>
      <div className="legal-body">{children}</div>
    </main>
  );
}
