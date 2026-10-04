import { site } from "@/content/site";
import { SectionLabel } from "./SectionLabel";
import { Line, Reveal } from "./Reveal";
import { MagneticButton } from "./MagneticButton";

/** Carte OpenStreetMap centrée sur la boutique (épingle exacte si les coordonnées sont renseignées). */
export function mapSrc() {
  if (site.geo) {
    const { lat, lng } = site.geo;
    const d = 0.008;
    return (
      "https://www.openstreetmap.org/export/embed.html?bbox=" +
      (lng - d) + "%2C" + (lat - d * 0.6) + "%2C" + (lng + d) + "%2C" + (lat + d * 0.6) +
      "&layer=mapnik&marker=" + lat + "%2C" + lng
    );
  }
  return "https://www.openstreetmap.org/export/embed.html?bbox=2.4380%2C49.2560%2C2.4900%2C49.2800&layer=mapnik";
}

export function Location() {
  const { address, phone, hours, social, links } = site;
  return (
    <section id="boutique" className="section location">
      <div className="wrap location-grid">
        <div className="location-text">
          <SectionLabel>Nous trouver</SectionLabel>
          <h2 className="h-xl"><Line>Venez nous voir.</Line></h2>
          <Reveal as="address" className="location-address">
            <strong>{site.name}</strong>
            <span>{address.street}</span>
            <span>{address.postalCode} {address.city}</span>
          </Reveal>

          <dl className="facts">
            {hours && (
              <div>
                <dt>Horaires</dt>
                <dd>{hours.display}</dd>
              </div>
            )}
            {phone && (
              <div>
                <dt>Téléphone</dt>
                <dd><a className="fact-link" href={"tel:" + phone.tel}>{phone.display}</a></dd>
              </div>
            )}
            {social.instagram && (
              <div>
                <dt>Instagram</dt>
                <dd><a className="fact-link" href={social.instagram} target="_blank" rel="noopener noreferrer">Suivre sur Instagram ↗</a></dd>
              </div>
            )}
          </dl>

          <div className="location-actions">
            <MagneticButton href={links.directions} external variant="solid">Ouvrir l’itinéraire ↗</MagneticButton>
            <MagneticButton href={links.waze} external>Venir avec Waze ↗</MagneticButton>
            {phone && <MagneticButton href={"tel:" + phone.tel}>Appeler</MagneticButton>}
          </div>
        </div>

        <Reveal kind="mask" className="map">
          <iframe title={"Carte — " + site.name + ", " + address.city} src={mapSrc()} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          <a className="map-pin" href={links.maps} target="_blank" rel="noopener noreferrer">
            {site.name} — {address.city} ↗
          </a>
        </Reveal>
      </div>
    </section>
  );
}
