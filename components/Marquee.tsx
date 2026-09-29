import { Fragment } from "react";
import { site } from "@/content/site";

export function Marquee() {
  const words = [...site.marquee, ...site.marquee];
  const run = (
    <span className="marquee-run">
      {words.map((w, i) => (
        <Fragment key={i}>
          {w} <span className="terra">•</span>{" "}
        </Fragment>
      ))}
    </span>
  );
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        {run}
        {run}
      </div>
    </div>
  );
}
