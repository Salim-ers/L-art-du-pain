import Link from "next/link";
import type { ReactNode } from "react";
import type { CustomStatus, OrderStatus, PaymentStatus } from "@/lib/db/schema";
import { customStatusLabel, orderStatusLabel, paymentStatusLabel } from "@/lib/labels";

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={"abadge abadge--" + status}>{orderStatusLabel[status]}</span>;
}

export function PayBadge({ status }: { status: PaymentStatus }) {
  return <span className={"abadge abadge--pay-" + status}>{paymentStatusLabel[status]}</span>;
}

export function CustomBadge({ status }: { status: CustomStatus }) {
  return <span className={"abadge abadge--c-" + status}>{customStatusLabel[status]}</span>;
}

export function PageTitle({ title, sub, children }: { title: string; sub?: ReactNode; children?: ReactNode }) {
  return (
    <header className="apage-head">
      <div>
        <h1 className="apage-title">{title}</h1>
        {sub && <p className="apage-sub">{sub}</p>}
      </div>
      {children && <div className="apage-actions">{children}</div>}
    </header>
  );
}

export function Card({ title, children, action, className = "" }: { title?: ReactNode; children: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <section className={"acard " + className}>
      {(title || action) && (
        <div className="acard-head">
          {title && <h2 className="acard-title">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Kpi({ label, value, href, tone }: { label: string; value: ReactNode; href?: string; tone?: "warn" | "ok" | "info" | "muted" }) {
  const body = (
    <>
      <span className="akpi-label">{label}</span>
      <span className="akpi-value">{value}</span>
    </>
  );
  return href ? (
    <Link href={href} className={"akpi" + (tone ? " akpi--" + tone : "")}>{body}</Link>
  ) : (
    <div className={"akpi" + (tone ? " akpi--" + tone : "")}>{body}</div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="aempty">{children}</p>;
}
