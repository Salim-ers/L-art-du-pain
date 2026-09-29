import { Reveal } from "./Reveal";

export function SectionLabel({ children, light }: { children: React.ReactNode; light?: boolean }) {
  return (
    <Reveal as="p" className={"label" + (light ? " label--light" : "")}>
      {children}
    </Reveal>
  );
}
