import { site } from "@/content/site";
import { SectionLabel } from "./SectionLabel";
import { EditorialHeading } from "./EditorialHeading";
import { Reveal } from "./Reveal";

export function Manifesto() {
  const m = site.manifesto;
  return (
    <section id="maison" className="section manifesto">
      <div className="wrap manifesto-grid">
        <SectionLabel>{m.label}</SectionLabel>
        <EditorialHeading lines={m.title} accentLast className="manifesto-title" />
        <div className="manifesto-body">
          {m.paragraphs.map((p, i) => (
            <Reveal as="p" key={i} className="body" delay={i * 0.1}>
              {p}
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
