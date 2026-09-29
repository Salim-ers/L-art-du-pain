"use client";

import { useEffect, useRef } from "react";

type Sub = (y: number, vh: number) => void;

// One shared rAF loop for every scroll-driven component (no per-component listeners).
const subs = new Set<Sub>();
let raf = 0;
let lastY = -1;
let lastH = -1;

function loop() {
  const y = window.scrollY;
  const h = window.innerHeight;
  if (y !== lastY || h !== lastH) {
    lastY = y;
    lastH = h;
    subs.forEach((s) => s(y, h));
  }
  raf = requestAnimationFrame(loop);
}

export function useScrollFrame(cb: Sub) {
  const ref = useRef(cb);
  ref.current = cb;
  useEffect(() => {
    const s: Sub = (y, h) => ref.current(y, h);
    subs.add(s);
    s(window.scrollY, window.innerHeight);
    if (!raf) raf = requestAnimationFrame(loop);
    return () => {
      subs.delete(s);
      if (!subs.size) {
        cancelAnimationFrame(raf);
        raf = 0;
        lastY = -1;
      }
    };
  }, []);
}

export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function canHover() {
  return typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}
