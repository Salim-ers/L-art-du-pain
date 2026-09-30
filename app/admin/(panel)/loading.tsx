/** Affiché immédiatement au clic dans le menu, pendant que le serveur prépare la page. */
export default function Loading() {
  return (
    <div className="aload" role="status" aria-label="Chargement…">
      <div className="aload-bar" />
      <div className="aload-title" />
      <div className="aload-kpis">
        {Array.from({ length: 4 }, (_, i) => <div key={i} className="aload-block" />)}
      </div>
      <div className="aload-block aload-block--tall" />
    </div>
  );
}
