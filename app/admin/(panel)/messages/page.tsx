import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { Card, Empty, PageTitle } from "@/components/admin/bits";
import { Submit } from "@/components/admin/ui";
import { getDb, schema as s } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { markMessage } from "../../actions";

export const metadata = { title: "Messages" };

export default async function MessagesPage() {
  const db = await getDb();
  const [msgs, sent] = await Promise.all([
    db.select().from(s.messages).orderBy(desc(s.messages.createdAt)).limit(100),
    db.select().from(s.notifications).where(eq(s.notifications.audience, "customer")).orderBy(desc(s.notifications.createdAt)).limit(40),
  ]);
  return (
    <>
      <PageTitle title="Messages" sub="Formulaire de contact du site et historique des emails / SMS envoyés aux clients." />
      <div className="agrid">
        <Card title="Messages reçus" className="agrid-wide">
          {msgs.length ? (
            <ul className="amsgs">
              {msgs.map((m) => (
                <li key={m.id} data-unread={m.read ? undefined : ""}>
                  <div className="amsg-head">
                    <strong>{m.name}</strong>
                    <a href={"mailto:" + m.email + (m.subject ? "?subject=" + encodeURIComponent("Re: " + m.subject) : "")} className="alink">{m.email}</a>
                    {m.phone && <a href={"tel:" + m.phone} className="alink">{m.phone}</a>}
                    <small>{formatDateTime(m.createdAt)}</small>
                  </div>
                  {m.subject && <p className="strong">{m.subject}</p>}
                  <p className="amsg-body">{m.body}</p>
                  <form action={markMessage}>
                    <input type="hidden" name="id" value={m.id} />
                    <input type="hidden" name="read" value={m.read ? "false" : "true"} />
                    <input type="hidden" name="back" value="/admin/messages" />
                    <Submit className="alink">{m.read ? "Marquer non lu" : "Marquer comme lu"}</Submit>
                  </form>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>Aucun message.</Empty>
          )}
        </Card>
        <Card title="Envois aux clients">
          {sent.length ? (
            <ul className="alist">
              {sent.map((n) => (
                <li key={n.id}>
                  {formatDateTime(n.createdAt)} — {n.channel} — {n.recipient} — {n.subject ?? n.type} — <span className={"astatus-" + n.status}>{n.status}</span>
                  {n.orderId && <> · <Link href={"/admin/commandes/" + n.orderId} className="alink">commande</Link></>}
                </li>
              ))}
            </ul>
          ) : (
            <Empty>Aucun envoi.</Empty>
          )}
          <p className="amuted">« skipped » : aucun fournisseur configuré (RESEND_API_KEY, SMS_WEBHOOK_URL).</p>
        </Card>
      </div>
    </>
  );
}
