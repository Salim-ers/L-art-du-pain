import { Card, Empty, Kpi, PageTitle } from "@/components/admin/bits";
import { stats } from "@/lib/admin";
import { requirePage } from "@/lib/auth/session";
import { addDays, today } from "@/lib/dates";
import { formatDate, money } from "@/lib/format";

export const metadata = { title: "Statistiques" };

/** Colonnes (une seule série) : barres fines ancrées à la base, valeur au survol, table disponible. */
function Columns({ data, label, format }: { data: { key: string; label: string; value: number }[]; label: string; format: (v: number) => string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const peak = data.reduce((a, d) => (d.value > a.value ? d : a), data[0]);
  return (
    <figure className="achart" aria-label={label}>
      <div className="achart-plot" role="list">
        {data.map((d) => (
          <div key={d.key} className="achart-col" role="listitem" tabIndex={0} data-tip={`${d.label} : ${format(d.value)}`} aria-label={`${d.label} : ${format(d.value)}`}>
            <span className="achart-bar" style={{ height: (d.value / max) * 100 + "%" }} />
          </div>
        ))}
      </div>
      <div className="achart-axis" aria-hidden="true">
        <span>{data[0]?.label}</span>
        {peak && peak.value > 0 && <span>Pic : {peak.label} — {format(peak.value)}</span>}
        <span>{data[data.length - 1]?.label}</span>
      </div>
      <details className="achart-table">
        <summary>Voir les données</summary>
        <table className="atable atable--plain"><tbody>{data.map((d) => <tr key={d.key}><td>{d.label}</td><td className="num">{format(d.value)}</td></tr>)}</tbody></table>
      </details>
    </figure>
  );
}

export default async function StatsPage() {
  await requirePage("ADMIN");
  const st = await stats();
  const d = today();
  const days = Array.from({ length: 30 }, (_, i) => addDays(d, i - 29));
  const daily = days.map((k) => ({ key: k, label: formatDate(k, "short"), value: st.daily.find((x) => x.d === k)?.ca ?? 0 }));
  const hours = Array.from({ length: 16 }, (_, i) => String(i + 6).padStart(2, "0")).map((h) => ({ key: h, label: h + "h", value: st.hours.find((x) => x.h === h)?.n ?? 0 }));
  const topMax = Math.max(1, ...st.top.map((t) => t.qty));

  return (
    <>
      <PageTitle title="Statistiques" sub="Chiffre d’affaires des commandes en ligne (hors paiements non aboutis et annulations)." />
      <div className="akpis">
        <Kpi label="CA aujourd’hui" value={money(st.day.ca)} />
        <Kpi label="CA 7 jours" value={money(st.week.ca)} />
        <Kpi label="CA 30 jours" value={money(st.month.ca)} />
        <Kpi label="Commandes 30 jours" value={st.month.n} />
        <Kpi label="Panier moyen (30 j)" value={money(st.avg)} />
        <Kpi label="Clients récurrents" value={`${st.recurring} / ${st.customers}`} />
      </div>
      <div className="agrid">
        <Card title="Chiffre d’affaires — 30 derniers jours" className="agrid-wide">
          {st.month.n ? <Columns data={daily} label="Chiffre d’affaires par jour" format={money} /> : <Empty>Pas encore de commandes sur la période.</Empty>}
        </Card>
        <Card title="Heures de retrait les plus chargées (90 j)">
          {st.hours.length ? <Columns data={hours} label="Commandes par heure de retrait" format={(v) => `${v} commande${v > 1 ? "s" : ""}`} /> : <Empty>Pas encore de données.</Empty>}
        </Card>
        <Card title="Produits les plus vendus (90 j)" className="agrid-wide">
          {st.top.length ? (
            <table className="atable atable--plain atop">
              <thead><tr><th>Produit</th><th>Quantité</th><th className="num">CA</th></tr></thead>
              <tbody>
                {st.top.map((t) => (
                  <tr key={t.name}>
                    <td>{t.name}</td>
                    <td className="atop-bar-cell">
                      <span className="atop-bar" style={{ width: (t.qty / topMax) * 80 + "%" }} />
                      <span className="atop-val">{t.qty}</span>
                    </td>
                    <td className="num">{money(t.ca)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <Empty>Pas encore de ventes.</Empty>
          )}
        </Card>
        <Card title="Commandes saisonnières">
          <table className="atable atable--plain">
            <thead><tr><th>Campagne</th><th className="num">Commandes</th><th className="num">CA</th></tr></thead>
            <tbody>{st.seasonal.map((e) => <tr key={e.name}><td>{e.name}</td><td className="num">{e.n}</td><td className="num">{money(e.ca)}</td></tr>)}</tbody>
          </table>
          <p className="amuted">CA 12 mois : {money(st.year.ca)} · {st.year.n} commandes</p>
        </Card>
      </div>
    </>
  );
}
