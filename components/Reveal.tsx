"use client";

import { useEffect, useRef, type CSSProperties, type ElementType, type ReactNode } from "react";

type RevealProps = {
  as?: ElementType;
  kind?: "up" | "line" | "mask";
  delay?: number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  id?: string;
  "aria-label"?: string;
};

/** Directional reveal on scroll: "up" (lift), "line" (masked line), "mask" (photographic clip). */
export function Reveal({ as: Tag = "div", kind = "up", delay = 0, className = "", style, children, ...rest }: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      el.setAttribute("data-shown", "");
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.setAttribute("data-shown", "");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const s = { ...style, "--d": delay + "s" } as CSSProperties;
  return (
    <Tag ref={ref} className={("rv rv-" + kind + " " + className).trim()} style={s} {...rest}>
      {children}
    </Tag>
  );
}

/** One masked line of a large editorial title. */
export function Line({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <span className="line">
      <Reveal as="span" kind="line" delay={delay} className={className}>
        {children}
      </Reveal>
    </span>
  );
}
