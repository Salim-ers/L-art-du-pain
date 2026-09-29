import { site } from "@/content/site";
import { SectionLabel } from "./SectionLabel";
import { Line, Reveal } from "./Reveal";
import { Media } from "./Media";

export function CraftSection() {
  const c = site.craft;
  return (
    <section id="geste" className="section craft">
      <div className="wrap craft-inner">
        <div className="stack">
          <SectionLabel light>{c.label}</SectionLabel>
          <h2 className="h-xl">
            <Line>{c.title[0]}</Line>
            <Line delay={0.08}>
              {c.title[1]}
              <span className="it terra">un geste.</span>
            </Line>
          </h2>
        </div>
        <ol className="craft-grid">
          {c.steps.map((s, i) => (
            <Reveal as="li" key={s.title} className="craft-item" delay={(i % 5) * 0.07}>
              <div className="frame" style={{ aspectRatio: "3 / 4" }}>
                <Media src={s.image.src} alt={s.image.alt} placeholder={s.image.placeholder} dark sizes="(min-width: 900px) 20vw, 72vw" />
              </div>
              <span className="craft-num">{String(i + 1).padStart(2, "0")}</span>
              <span className="craft-title">{s.title}</span>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
