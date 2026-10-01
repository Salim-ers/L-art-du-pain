"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const WORDS = [
  { t: "L’ART", it: false },
  { t: "du", it: true },
  { t: "PAIN", it: false },
];

// Pre-compute staggered delays for each letter.
let n = 0;
const LETTERS = WORDS.map((w) => ({
  ...w,
  chars: Array.from(w.t).map((ch) => ({ ch, d: (0.1 + n++ * 0.085).toFixed(2) + "s" })),
}));

/** First-visit intro: letters rise one by one, rule draws, seal appears, then a vertical mask lifts. */
export function Intro() {
  const [gone, setGone] = useState(false);

  useEffect(() => {
    if (document.documentElement.dataset.intro === "seen") {
      setGone(true);
      return;
    }
    try {
      sessionStorage.setItem("adp-intro", "1");
    } catch {}
    const t = window.setTimeout(() => setGone(true), 3600);
    return () => window.clearTimeout(t);
  }, []);

  if (gone) return null;

  return (
    <div className="intro" aria-hidden="true">
      <div className="intro-inner">
        <Image className="intro-logo" src="/images/logo.png" alt="" width={1100} height={1100} priority />
        <div className="intro-row">
          {LETTERS.map((w, i) => (
            <span key={i} className={"intro-word" + (w.it ? " intro-word--it" : "")}>
              {w.chars.map((c, j) => (
                <span key={j} className="intro-letter" style={{ animationDelay: c.d }}>
                  {c.ch}
                </span>
              ))}
            </span>
          ))}
        </div>
        <span className="intro-rule" />
        <span className="intro-kicker">Boulangerie • Pâtisserie — Nogent-sur-Oise</span>
      </div>
    </div>
  );
}
