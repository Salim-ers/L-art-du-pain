import type { CampaignView } from "@/lib/catalog";
import { formatDate } from "@/lib/format";

/** Halo de lumières chaudes (bokeh CSS, uniquement transform/opacity). */
export function WarmLights({ count = 14 }: { count?: number }) {
  return (
    <div className="lights" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <span key={i} style={{ ["--x" as string]: ((i * 37) % 100) + "%", ["--y" as string]: ((i * 53) % 90) + "%", ["--s" as string]: 40 + ((i * 29) % 110) + "px", ["--d" as string]: (i % 7) * 0.9 + "s" }} />
      ))}
    </div>
  );
}

export function pickupWindow(c: Pick<CampaignView, "dates">) {
  if (!c.dates.length) return null;
  const first = c.dates[0];
  const last = c.dates[c.dates.length - 1];
  return first === last ? `Retrait le ${formatDate(first)}` : `Disponible en retrait du ${formatDate(first, "short")} au ${formatDate(last, "short")}`;
}
