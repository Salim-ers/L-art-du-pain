import { site } from "@/content/site";
import { ImageReveal } from "./ImageReveal";
import { Reveal } from "./Reveal";

export function SignatureProduct() {
  const s = site.signature;
  if (!s) return null;
  return (
    <section className="section signature" aria-label={s.label}>
      <div className="wrap sig-grid">
        <ImageReveal image={s.image} ratio="4 / 5" speed={0.05} sizes="(min-width: 860px) 58vw, 100vw" />
        <div className="sig-text">
          <Reveal as="p" className="label">{s.label}</Reveal>
          <Reveal as="h2" className="h-lg" delay={0.06}>{s.name}</Reveal>
          <Reveal as="p" className="body body--sm" delay={0.12}>{s.description}</Reveal>
          {s.note && <p className="note">{s.note}</p>}
        </div>
      </div>
    </section>
  );
}
