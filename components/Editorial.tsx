import { site } from "@/content/site";
import { ImageReveal } from "./ImageReveal";
import { Reveal } from "./Reveal";

export function Editorial() {
  const e = site.editorial;
  return (
    <section className="section editorial" aria-label="Éditorial">
      <div className="wrap edito-grid">
        <ImageReveal image={e.main} ratio="3 / 4" speed={0.06} sizes="(min-width: 860px) 58vw, 100vw" />
        <div className="edito-side">
          <ImageReveal image={e.detail} ratio="4 / 3" delay={0.12} sizes="(min-width: 860px) 40vw, 100vw" />
          <div className="edito-text">
            <Reveal as="p" className="label">{e.label}</Reveal>
            <Reveal as="h3" className="h-md" delay={0.06}>
              {e.title[0]}<br />{e.title[1]}
            </Reveal>
            <Reveal as="p" className="body body--sm" delay={0.12}>{e.text}</Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
