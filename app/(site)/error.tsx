"use client";

import { useEffect } from "react";
import { site } from "@/content/site";

/** Page affichée si une page échoue (ex. base de données injoignable) : jamais d'écran blanc. */
export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main id="contenu" className="legal">
      <p className="label">{site.name} — {site.address.city}</p>
      <h1 className="h-xl">Le four chauffe encore.</h1>
      <p className="body">
        Cette page est momentanément indisponible. Réessayez dans un instant, ou retrouvez-nous au {site.address.street}, {site.address.postalCode} {site.address.city}
        {site.phone ? <> — <a className="ulink" href={"tel:" + site.phone.tel}><span>{site.phone.display}</span></a></> : null}.
      </p>
      <button type="button" className="btn btn--solid legal-back" onClick={reset}>Réessayer</button>
    </main>
  );
}
