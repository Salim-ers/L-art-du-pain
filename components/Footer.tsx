import Image from "next/image";
import Link from "next/link";
import { site } from "@/content/site";

export function Footer() {
  const { address, phone, social, links } = site;
  return (
    <footer className="footer">
      <div className="wrap footer-inner">
        <div className="footer-cta">
          <p className="footer-cta-title">Commandez en ligne,<br /><span className="it terra">retirez en boutique.</span></p>
          <div className="footer-cta-actions">
            <Link href="/commander" className="btn btn--light-solid">Commander</Link>
            <Link href="/gateaux-sur-mesure" className="btn btn--light">Commande personnalisée</Link>
          </div>
        </div>
        <div className="footer-cols">
          <div className="footer-col">
            <span className="footer-h">La boutique</span>
            <span>{site.name}</span>
            <span>{address.street}</span>
            <span>{address.postalCode} {address.city}</span>
            {site.hours && <span>{site.hours.display}</span>}
            <a href={links.directions} target="_blank" rel="noopener noreferrer">Itinéraire Google Maps ↗</a>
            <a href={links.waze} target="_blank" rel="noopener noreferrer">Venir avec Waze ↗</a>
          </div>
          <nav className="footer-col" aria-label="Navigation pied de page">
            <span className="footer-h">La Maison</span>
            {site.menu.slice(1).map((l) => (
              <Link key={l.href} href={l.href}>{l.label}</Link>
            ))}
          </nav>
          <div className="footer-col">
            <span className="footer-h">Contact</span>
            {phone && <a href={"tel:" + phone.tel}>{phone.display}</a>}
            <Link href="/nous-trouver#contact">Nous écrire</Link>
            <Link href="/compte">Suivre ma commande</Link>
            <a href={links.review} target="_blank" rel="noopener noreferrer">Laisser un avis Google ↗</a>
            {social.instagram && <a href={social.instagram} target="_blank" rel="noopener noreferrer">Instagram ↗</a>}
            {social.facebook && <a href={social.facebook} target="_blank" rel="noopener noreferrer">Facebook ↗</a>}
          </div>
          <div className="footer-col">
            <span className="footer-h">Informations</span>
            <Link href="/cgv">Conditions générales de vente</Link>
            <Link href="/mentions-legales">Mentions légales</Link>
            <Link href="/confidentialite">Politique de confidentialité</Link>
          </div>
        </div>
        <div className="footer-base">
          <span>© {site.name} — {new Date().getFullYear()}</span>
          <span>Boulangerie • Pâtisserie artisanale — {address.city}</span>
        </div>
        <Image className="footer-seal" src="/images/logo.png" alt={site.name} width={1100} height={1100} />
        <div className="footer-giant" aria-hidden="true">{site.name}</div>
      </div>
    </footer>
  );
}
