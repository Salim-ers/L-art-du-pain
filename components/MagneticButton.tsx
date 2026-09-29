"use client";

import { useRef, type PointerEvent, type ReactNode } from "react";
import { canHover, prefersReducedMotion } from "@/lib/scroll";

type Props = {
  href: string;
  children: ReactNode;
  variant?: "dark" | "light" | "solid";
  external?: boolean;
  className?: string;
  ariaLabel?: string;
};

/** Outline button: very subtle magnetic pull, label rolls to a second copy on hover. */
export function MagneticButton({ href, children, variant = "dark", external, className = "", ariaLabel }: Props) {
  const ref = useRef<HTMLAnchorElement>(null);

  const onMove = (e: PointerEvent<HTMLAnchorElement>) => {
    const el = ref.current;
    if (!el || !canHover() || prefersReducedMotion()) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left - r.width / 2) / r.width;
    const y = (e.clientY - r.top - r.height / 2) / r.height;
    el.style.transform = "translate3d(" + (x * 8).toFixed(1) + "px," + (y * 6).toFixed(1) + "px,0)";
  };
  const onLeave = () => {
    if (ref.current) ref.current.style.transform = "";
  };

  return (
    <a
      ref={ref}
      href={href}
      aria-label={ariaLabel}
      className={"btn btn--" + variant + " " + className}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      <span className="roll">
        <span>{children}</span>
        <span aria-hidden="true">{children}</span>
      </span>
    </a>
  );
}
