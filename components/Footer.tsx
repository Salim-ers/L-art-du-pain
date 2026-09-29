import Image from "next/image";
import Link from "next/link";
import { site } from "@/content/site";

export function Footer() {
  const { address, phone, social } = site;
  return (
    <footer className="footer">
      <div className="wrap footer-inner">
        <div className="footer-cols">
          <div className="footer-col">
            <span className="footer-h">La boutique</span>
            <span>{address.street}</span>
            <span>{address.postalCode} {address.city}</span>
            <a href={site.links.directions} target="_blank" rel="noopener noreferrer">Itinéraire ↗</a>
          </div>
          <nav className="footer-col" aria-label="Navigation pied de page">
            <span className="footer-h">Navigation</span>
            {site.nav.map((l) => (
              <a key={l.href} href={l.href}>{l.label}</a>
            ))}
          </nav>
          <div className="footer-col">
            <span className="footer-h">Contact</span>
            {phone && <a href={"tel:" + phone.tel}>{phone.display}</a>}
            {social.instagram && <a href={social.instagram} target="_blank" rel="noopener noreferrer">Instagram ↗</a>}
            {social.facebook && <a href={social.facebook} target="_blank" rel="noopener noreferrer">Facebook ↗</a>}
          </div>
          <div className="footer-col">
            <span className="footer-h">Informations</span>
            <Link href="/mentions-legales">Mentions légales</Link>
            <Link href="/confidentialite">Politique de confidentialité</Link>
          </div>
        </div>
        <div className="footer-base">
          <span>© {site.name} — {new Date().getFullYear()}</span>
          <span>Boulangerie • Pâtisserie artisanale</span>
        </div>
        <Image className="footer-seal" src="/images/logo.png" alt={site.name} width={1100} height={1100} />
        <div className="footer-giant" aria-hidden="true">{site.name}</div>
      </div>
    </footer>
  );
}
