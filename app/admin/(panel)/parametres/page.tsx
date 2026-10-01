import { asc } from "drizzle-orm";
import { Card, PageTitle } from "@/components/admin/bits";
import { CakeTypesEditor, ReassuranceEditor, ReviewsEditor } from "@/components/admin/editors";
import { Submit } from "@/components/admin/ui";
import { hasRole, requirePage } from "@/lib/auth/session";
import { getDb, schema as s } from "@/lib/db";
import { env } from "@/lib/env";
import { formatDateTime } from "@/lib/format";
import { getSetting } from "@/lib/settings";
import { stripe } from "@/lib/stripe";
import {
  changeOwnPassword,
  createUser,
  saveCakeSettings,
  saveCatalogSettings,
  saveNotifySettings,
  saveReassuranceSettings,
  savePaymentSettings,
  saveReviewSettings,
  saveShopSettings,
  updateUser,
} from "../../actions";

export const metadata = { title: "Paramètres" };

const DAYS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const ORDER = [1, 2, 3, 4, 5, 6, 0];
const roleLabel = { SUPER_ADMIN: "Super admin", ADMIN: "Admin", STAFF: "Équipe" };
const B = "/admin/parametres";

export default async function SettingsPage() {
  const user = await requirePage("STAFF");
  const admin = hasRole(user, "ADMIN");
  const [shop, payments, cake, reviews, notify, catalog, reassurance] = await Promise.all([
    getSetting("shop"),
    getSetting("payments"),
    getSetting("cake"),
    getSetting("reviews"),
    getSetting("notify"),
    getSetting("catalog"),
    getSetting("reassurance"),
  ]);
  const db = await getDb();
  const users = admin ? await db.select().from(s.users).orderBy(asc(s.users.createdAt)) : [];

  return (
    <>
      <PageTitle title="Paramètres" />
      <div className="astack">
        {admin && (
          <>
            <Card title="Données d’exemple">
              <form action={saveCatalogSettings} className="aform">
                <input type="hidden" name="back" value={B} />
                <p className="amuted">
                  Les produits et campagnes marqués « exemple » (prix, compositions, délais non validés) servent à présenter le site.
                  Désactivez le mode démonstration au passage en production : seules les données saisies par la boutique resteront visibles.
                </p>
                <label className="acheck"><input type="checkbox" name="demo" defaultChecked={catalog.demo} /> Afficher les données d’exemple sur le site (avec la mention « Exemple »)</label>
                <Submit>Enregistrer</Submit>
              </form>
            </Card>

            <Card title="Horaires et créneaux de retrait">
              <form action={saveShopSettings} className="aform">
                <input type="hidden" name="back" value={B} />
                <table className="atable atable--plain ahours">
                  <thead><tr><th>Jour</th><th>Ouvert</th><th>Ouverture</th><th>Fermeture</th><th>Réouverture (facultatif)</th><th>Fermeture</th></tr></thead>
                  <tbody>
                    {ORDER.map((d) => {
                      const r = shop.hours[d] ?? [];
                      return (
                        <tr key={d}>
                          <td className="strong">{DAYS[d]}</td>
                          <td><input type="checkbox" name={`open-${d}`} defaultChecked={r.length > 0} aria-label={"Ouvert le " + DAYS[d]} /></td>
                          <td><input type="time" name={`o1-${d}`} defaultValue={r[0]?.open ?? "06:00"} aria-label="Ouverture" /></td>
                          <td><input type="time" name={`c1-${d}`} defaultValue={r[0]?.close ?? "21:00"} aria-label="Fermeture" /></td>
                          <td><input type="time" name={`o2-${d}`} defaultValue={r[1]?.open ?? ""} aria-label="Réouverture" /></td>
                          <td><input type="time" name={`c2-${d}`} defaultValue={r[1]?.close ?? ""} aria-label="Seconde fermeture" /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="aform aform--grid">
                  <label className="afield"><span>Durée d’un créneau (min)</span><input type="number" name="slotMinutes" min={5} max={120} defaultValue={shop.slotMinutes} /></label>
                  <label className="afield"><span>Commandes max. par créneau</span><input type="number" name="slotCapacity" min={1} max={200} defaultValue={shop.slotCapacity} /></label>
                  <label className="afield"><span>Délai minimum avant retrait (min)</span><input type="number" name="minLeadMinutes" min={0} defaultValue={shop.minLeadMinutes} /></label>
                  <label className="afield"><span>Réservation jusqu’à (jours)</span><input type="number" name="maxDaysAhead" min={1} max={120} defaultValue={shop.maxDaysAhead} /></label>
                  <label className="afield"><span>Dernier retrait avant fermeture (min)</span><input type="number" name="lastPickupBeforeCloseMinutes" min={0} max={240} defaultValue={shop.lastPickupBeforeCloseMinutes} /></label>
                </div>
                <p className="amuted">Les fermetures exceptionnelles se gèrent dans Planning. Pensez à garder les horaires identiques à la fiche Google.</p>
                <Submit>Enregistrer les horaires</Submit>
              </form>
            </Card>

            <Card title="Paiements">
              <form action={savePaymentSettings} className="aform">
                <input type="hidden" name="back" value={B} />
                <p className={stripe() ? "amuted" : "aerr"}>
                  Stripe : {stripe() ? "configuré" : "non configuré (STRIPE_SECRET_KEY) — le paiement en ligne est masqué"}{stripe() && !env.stripeWebhookSecret ? " — webhook non configuré (STRIPE_WEBHOOK_SECRET)" : ""}
                </p>
                <label className="acheck"><input type="checkbox" name="card" defaultChecked={payments.card} /> Paiement en ligne par carte (Stripe)</label>
                <label className="acheck"><input type="checkbox" name="onSite" defaultChecked={payments.onSite} /> Paiement sur place au retrait</label>
                <div className="aform aform--grid">
                  <label className="afield"><span>Gâteaux sur mesure</span>
                    <select name="customCakeMode" defaultValue={payments.customCakeMode}>
                      <option value="both">Payer maintenant ou demander un devis</option>
                      <option value="pay">Payer maintenant uniquement</option>
                      <option value="quote">Devis uniquement</option>
                    </select>
                  </label>
                  <label className="afield"><span>Acompte par défaut</span>
                    <select name="depositPercent" defaultValue={String(payments.depositPercent)}>
                      {[30, 50, 100].map((v) => <option key={v} value={v}>{v} %</option>)}
                    </select>
                  </label>
                </div>
                <Submit>Enregistrer</Submit>
              </form>
            </Card>

            <Card title="Gâteaux sur mesure — options du configurateur">
              <form action={saveCakeSettings} className="aform">
                <input type="hidden" name="back" value={B} />
                <div className="aform aform--grid">
                  <label className="afield"><span>Occasions (une par ligne)</span><textarea name="occasions" rows={7} defaultValue={cake.occasions.join("\n")} /></label>
                  <label className="afield"><span>Nombre de personnes (un par ligne)</span><textarea name="servings" rows={7} defaultValue={cake.servings.join("\n")} /></label>
                  <label className="afield"><span>Saveurs (une par ligne)</span><textarea name="flavors" rows={7} defaultValue={cake.flavors.join("\n")} /></label>
                  <div className="aform">
                    <label className="afield"><span>Saveurs max. par gâteau</span><input type="number" name="maxFlavors" min={1} max={5} defaultValue={cake.maxFlavors} /></label>
                    <label className="afield"><span>Délai minimum (jours)</span><input type="number" name="minDaysNotice" min={0} max={60} defaultValue={cake.minDaysNotice} /></label>
                  </div>
                </div>
                <label className="acheck"><input type="checkbox" name="showEstimate" defaultChecked={cake.showEstimate} /> Afficher une estimation de prix au client (uniquement si les tarifs ci-dessous sont validés)</label>
                <p className="amuted">Sans estimation, le client envoie une demande : vous confirmez la faisabilité et le tarif (devis) depuis « Commandes personnalisées ».</p>
                <span className="afield-label">Styles de gâteaux (prix estimatif par personne)</span>
                <CakeTypesEditor initial={cake.types.map((t) => ({ ...t, price: (t.pricePerServingCents / 100).toFixed(2).replace(".", ",") }))} />
                <Submit>Enregistrer les options</Submit>
              </form>
            </Card>

            <Card title="Avis clients (Google)">
              <form action={saveReviewSettings} className="aform">
                <input type="hidden" name="back" value={B} />
                <label className="afield"><span>Lien « Laisser un avis » de la fiche Google Business Profile</span><input name="googleReviewUrl" type="url" defaultValue={reviews.googleReviewUrl ?? ""} placeholder="https://g.page/r/…/review" /></label>
                <p className="amuted">Ne publiez que de vrais avis, recopiés à l’identique depuis Google.</p>
                <ReviewsEditor initial={reviews.items} />
                <Submit>Enregistrer les avis</Submit>
              </form>
            </Card>

            <Card title="Engagements (réassurance)">
              <form action={saveReassuranceSettings} className="aform">
                <input type="hidden" name="back" value={B} />
                <p className="amuted">Affichés sur l’accueil avant les avis. N’indiquez que des engagements réellement tenus (ex. « Fait sur place » uniquement si c’est le cas).</p>
                <ReassuranceEditor initial={reassurance.items} />
                <Submit>Enregistrer les engagements</Submit>
              </form>
            </Card>

            <Card title="Notifications">
              <form action={saveNotifySettings} className="aform">
                <input type="hidden" name="back" value={B} />
                <label className="afield"><span>Email de l’équipe (alerte à chaque commande)</span><input type="email" name="staffEmail" defaultValue={notify.staffEmail ?? ""} /></label>
                <label className="acheck"><input type="checkbox" name="sendConfirmedEmail" defaultChecked={notify.sendConfirmedEmail} /> Email automatique « Commande confirmée »</label>
                <label className="acheck"><input type="checkbox" name="sendReadyEmail" defaultChecked={notify.sendReadyEmail} /> Email automatique « Votre commande est prête »</label>
                <p className="amuted">Emails : {env.resendKey ? "Resend configuré" : "RESEND_API_KEY absente — envois journalisés sans être expédiés"}. SMS : {env.smsWebhookUrl ? "configuré" : "non configuré"}. WhatsApp : {env.whatsappWebhookUrl ? "configuré" : "non configuré"}.</p>
                <Submit>Enregistrer</Submit>
              </form>
            </Card>

            <Card title="Équipe">
              <table className="atable atable--plain">
                <thead><tr><th>Nom</th><th>Email</th><th>Rôle</th><th>Dernière connexion</th><th /></tr></thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className={u.active ? "" : "aoff"}>
                      <td className="strong">{u.name}</td>
                      <td>{u.email}</td>
                      <td>{roleLabel[u.role]}</td>
                      <td>{u.lastLoginAt ? formatDateTime(u.lastLoginAt) : "—"}</td>
                      <td>
                        {u.id !== user.id && (u.role === "STAFF" || hasRole(user, "SUPER_ADMIN")) && (
                          <div className="arow-actions">
                            <form action={updateUser}>
                              <input type="hidden" name="id" value={u.id} /><input type="hidden" name="op" value="toggle" /><input type="hidden" name="back" value={B} />
                              <Submit className="abtn abtn--ghost abtn--sm">{u.active ? "Désactiver" : "Réactiver"}</Submit>
                            </form>
                            <form action={updateUser}>
                              <input type="hidden" name="id" value={u.id} /><input type="hidden" name="op" value="revoke" /><input type="hidden" name="back" value={B} />
                              <Submit className="abtn abtn--ghost abtn--sm">Déconnecter</Submit>
                            </form>
                            <form action={updateUser} className="arow-actions">
                              <input type="hidden" name="id" value={u.id} /><input type="hidden" name="op" value="password" /><input type="hidden" name="back" value={B} />
                              <input type="password" name="password" placeholder="Nouveau mot de passe" minLength={10} required aria-label="Nouveau mot de passe" autoComplete="new-password" />
                              <Submit className="abtn abtn--ghost abtn--sm">Changer</Submit>
                            </form>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <form action={createUser} className="aform aform--inline">
                <input type="hidden" name="back" value={B} />
                <label className="afield"><span>Nom</span><input name="name" required /></label>
                <label className="afield"><span>Email</span><input name="email" type="email" required autoComplete="off" /></label>
                <label className="afield"><span>Mot de passe (10 car. min.)</span><input name="password" type="password" minLength={10} required autoComplete="new-password" /></label>
                <label className="afield"><span>Rôle</span>
                  <select name="role">
                    <option value="STAFF">Équipe — commandes, planning, stock</option>
                    {hasRole(user, "SUPER_ADMIN") && <option value="ADMIN">Admin — prix, produits, paramètres</option>}
                    {hasRole(user, "SUPER_ADMIN") && <option value="SUPER_ADMIN">Super admin</option>}
                  </select>
                </label>
                <Submit>Créer le compte</Submit>
              </form>
            </Card>
          </>
        )}

        <Card title="Mon mot de passe">
          <form action={changeOwnPassword} className="aform aform--inline">
            <input type="hidden" name="back" value={B} />
            <label className="afield"><span>Actuel</span><input type="password" name="current" required autoComplete="current-password" /></label>
            <label className="afield"><span>Nouveau (10 car. min.)</span><input type="password" name="password" minLength={10} required autoComplete="new-password" /></label>
            <Submit>Modifier</Submit>
          </form>
        </Card>
      </div>
    </>
  );
}
