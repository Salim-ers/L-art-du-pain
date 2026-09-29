import type { ReactNode } from "react";
import { Line } from "./Reveal";

type Props = {
  lines: ReactNode[];
  as?: "h1" | "h2" | "h3";
  accentLast?: boolean;
  className?: string;
};

/** XXL serif heading, revealed line by line behind masks. */
export function EditorialHeading({ lines, as: Tag = "h2", accentLast, className = "" }: Props) {
  return (
    <Tag className={"h-xl " + className}>
      {lines.map((l, i) => (
        <Line key={i} delay={i * 0.08} className={accentLast && i === lines.length - 1 ? "it accent" : undefined}>
          {l}
        </Line>
      ))}
    </Tag>
  );
}
