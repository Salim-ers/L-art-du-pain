import { site } from "@/content/site";
import { EditorialHeading } from "./EditorialHeading";

export function Breath() {
  return (
    <section className="section breath" aria-label="Respiration">
      <EditorialHeading lines={site.breath} accentLast className="breath-title" />
    </section>
  );
}
