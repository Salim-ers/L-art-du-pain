import Link from "next/link";

export default function NotFound() {
  return (
    <main className="legal">
      <p className="label">Erreur 404</p>
      <h1 className="h-xl">Cette page n’est pas sortie du four.</h1>
      <Link className="ulink legal-back" href="/">Retour à la Maison <span className="arrow">→</span></Link>
    </main>
  );
}
