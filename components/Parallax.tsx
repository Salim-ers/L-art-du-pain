"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { prefersReducedMotion, useScrollFrame } from "@/lib/scroll";

export function Parallax({ speed = 0.05, children }: { speed?: number; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const off = useRef(false);
  useEffect(() => {
    off.current = prefersReducedMotion();
  }, []);

  useScrollFrame((_, vh) => {
    const el = ref.current;
    if (!el || off.current) return;
    const r = el.parentElement ? el.parentElement.getBoundingClientRect() : el.getBoundingClientRect();
    if (r.bottom < -200 || r.top > vh + 200) return;
    const y = (r.top + r.height / 2 - vh / 2) * -speed;
    el.style.transform = "translate3d(0," + y.toFixed(1) + "px,0) scale(1.08)";
  });

  return (
    <div ref={ref} className="par">
      {children}
    </div>
  );
}
