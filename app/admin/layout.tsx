import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./admin.css";

export const metadata: Metadata = {
  title: { default: "Gestion", template: "%s — Gestion L’Art du Pain" },
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminRoot({ children }: { children: ReactNode }) {
  return <div className="adm-root">{children}</div>;
}
