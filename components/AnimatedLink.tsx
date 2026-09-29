import type { ReactNode } from "react";

type Props = { href: string; children: ReactNode; arrow?: string; external?: boolean; className?: string };

/** Text link with drawn underline and a travelling arrow. */
export function AnimatedLink({ href, children, arrow = "→", external, className = "" }: Props) {
  return (
    <a
      href={href}
      className={"ulink " + className}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      <span>{children}</span>
      <span className="arrow" aria-hidden="true">{arrow}</span>
    </a>
  );
}
