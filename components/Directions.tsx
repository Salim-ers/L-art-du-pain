import Link from "next/link";
import { site } from "@/content/site";

/** Boutons d'accès : Google Maps, itinéraire, Waze, appel, commande, avis. */
export function Directions({ reviewUrl, tone = "dark", withOrder = true }: { reviewUrl?: string | null; tone?: "dark" | "light"; withOrder?: boolean }) {
  const { links, phone } = site;
  return (
    <div className={"dir dir--" + tone}>
      {withOrder && (
        <Link href="/commander" className="dir-btn dir-btn--main">
          Commander en ligne <span className="arrow" aria-hidden="true">→</span>
        </Link>
      )}
      <a href={links.directions} className="dir-btn" target="_blank" rel="noopener noreferrer">
        Itinéraire <span aria-hidden="true">↗</span>
      </a>
      <a href={links.waze} className="dir-btn" target="_blank" rel="noopener noreferrer">
        Venir avec Waze <span aria-hidden="true">↗</span>
      </a>
      {phone && (
        <a href={"tel:" + phone.tel} className="dir-btn">
          Appeler — {phone.display}
        </a>
      )}
      <a href={links.maps} className="dir-btn" target="_blank" rel="noopener noreferrer">
        Voir sur Google Maps <span aria-hidden="true">↗</span>
      </a>
      <a href={reviewUrl || links.review} className="dir-btn" target="_blank" rel="noopener noreferrer">
        Laisser un avis <span aria-hidden="true">↗</span>
      </a>
    </div>
  );
}
