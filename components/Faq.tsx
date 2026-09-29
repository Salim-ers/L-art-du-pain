import { faqJsonLd } from "@/lib/schema";
import { JsonLd } from "./JsonLd";
import { Reveal } from "./Reveal";

export type FaqItem = { q: string; a: string };

/** Questions fréquentes, visibles sur la page et balisées FAQPage. */
export function Faq({ title = "Questions fréquentes", items }: { title?: string; items: FaqItem[] }) {
  if (!items.length) return null;
  return (
    <section className="section faq" aria-labelledby="faq-title">
      <JsonLd data={faqJsonLd(items)} />
      <div className="wrap faq-inner">
        <Reveal as="h2" className="h-md" id="faq-title">{title}</Reveal>
        <div className="faq-list">
          {items.map((f) => (
            <details key={f.q} className="faq-item">
              <summary>
                <span>{f.q}</span>
                <span className="faq-plus" aria-hidden="true" />
              </summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
