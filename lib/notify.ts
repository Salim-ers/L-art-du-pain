import "server-only";
/**
 * Notifications : email (Resend), SMS / WhatsApp (webhook fournisseur), tableau de bord.
 * Chaque envoi est tracé dans la table `notifications`. Sans fournisseur configuré, l'envoi est journalisé « skipped ».
 */
import { site } from "@/content/site";
import { getDb, schema as s } from "@/lib/db";
import type { CustomOrder, Order, OrderItem } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { formatDate, formatTime, money } from "@/lib/format";
import { logError } from "@/lib/security";
import { getSetting } from "@/lib/settings";

type Ref = { orderId?: string | null; customOrderId?: string | null };

async function record(v: typeof s.notifications.$inferInsert) {
  try {
    const db = await getDb();
    await db.insert(s.notifications).values(v);
  } catch (e) {
    logError("notify.record", e);
  }
}

export async function sendEmail(to: string, type: string, mail: { subject: string; html: string; text: string }, ref: Ref = {}, audience: "customer" | "staff" = "customer") {
  const base = { channel: "email" as const, audience, type, recipient: to, subject: mail.subject, body: mail.text, ...ref };
  if (!env.resendKey) {
    if (!env.isProd) console.info(`[email:${type}] → ${to} — ${mail.subject}`);
    return record({ ...base, status: "skipped", error: "RESEND_API_KEY non configurée" });
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: env.emailFrom, to: [to], subject: mail.subject, html: mail.html, text: mail.text }),
    });
    if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
    await record({ ...base, status: "sent" });
  } catch (e) {
    logError("notify.email", e);
    await record({ ...base, status: "failed", error: e instanceof Error ? e.message.slice(0, 500) : "erreur" });
  }
}

/** SMS ou WhatsApp via un webhook (Twilio, Brevo, WhatsApp Business Cloud… derrière une petite fonction). */
export async function sendMessage(channel: "sms" | "whatsapp", to: string, type: string, text: string, ref: Ref = {}) {
  const url = channel === "sms" ? env.smsWebhookUrl : env.whatsappWebhookUrl;
  const base = { channel, audience: "customer" as const, type, recipient: to, body: text, ...ref };
  if (!url) return record({ ...base, status: "skipped", error: "Fournisseur non configuré" });
  try {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ to, text, type }) });
    if (!res.ok) throw new Error("HTTP " + res.status);
    await record({ ...base, status: "sent" });
  } catch (e) {
    logError("notify." + channel, e);
    await record({ ...base, status: "failed", error: e instanceof Error ? e.message : "erreur" });
  }
}

/** Alerte visible dans le tableau de bord (et email à l'équipe si configuré). */
export async function notifyStaff(type: string, subject: string, body: string, ref: Ref = {}) {
  await record({ channel: "dashboard", audience: "staff", type, subject, body, status: "sent", ...ref });
  const cfg = await getSetting("notify");
  const to = cfg.staffEmail ?? env.staffEmail;
  if (to) {
    const link = env.siteUrl + (ref.customOrderId ? "/admin/sur-mesure/" + ref.customOrderId : ref.orderId ? "/admin/commandes/" + ref.orderId : "/admin");
    await sendEmail(to, "staff." + type, layout(subject, [p(body)], { label: "Ouvrir dans l’administration", href: link }), ref, "staff");
  }
}

/* ---------- Gabarits ---------- */
const esc = (v: string) => v.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const p = (t: string) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#3A2E24">${esc(t)}</p>`;

function layout(title: string, blocks: string[], cta?: { label: string; href: string }) {
  const address = `${site.address.street}, ${site.address.postalCode} ${site.address.city}`;
  const html = `<!doctype html><html lang="fr"><body style="margin:0;background:#F2EDE4;font-family:Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F2EDE4;padding:32px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff">
<tr><td style="background:#16120E;color:#F2EDE4;padding:28px 32px;font-family:Georgia,serif;font-size:22px;letter-spacing:.14em;text-transform:uppercase">${esc(site.name)}</td></tr>
<tr><td style="padding:32px">
<h1 style="margin:0 0 20px;font-family:Georgia,serif;font-weight:400;font-size:26px;color:#16120E">${esc(title)}</h1>
${blocks.join("")}
${cta ? `<p style="margin:26px 0 0"><a href="${esc(cta.href)}" style="display:inline-block;background:#16120E;color:#F2EDE4;padding:14px 22px;font-size:12px;letter-spacing:.18em;text-transform:uppercase;text-decoration:none">${esc(cta.label)}</a></p>` : ""}
</td></tr>
<tr><td style="padding:20px 32px;border-top:1px solid #E6DFD2;font-size:12px;line-height:1.6;color:#8A7A68">${esc(site.name)} — ${esc(address)}${site.phone ? " — " + esc(site.phone.display) : ""}</td></tr>
</table></td></tr></table></body></html>`;
  const text = [title, "", ...blocks.map((b) => b.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()), cta ? `${cta.label} : ${cta.href}` : "", "", `${site.name} — ${address}`].join("\n");
  return { subject: title + " — " + site.name, html, text };
}

function itemsTable(items: OrderItem[]) {
  const rows = items
    .map(
      (i) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid #EFE9DF;font-size:14px;color:#3A2E24">${i.quantity} × ${esc(i.name)}${i.variantLabel ? " — " + esc(i.variantLabel) : ""}${i.note ? `<br><span style="color:#8A7A68">${esc(i.note)}</span>` : ""}</td><td align="right" style="padding:8px 0;border-bottom:1px solid #EFE9DF;font-size:14px;white-space:nowrap">${money(i.unitPriceCents * i.quantity)}</td></tr>`
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 18px">${rows}</table>`;
}

/** Récapitulatif complet d'une demande (gâteau sur mesure ou commande particulière), pour les emails. */
function customRecap(c: CustomOrder) {
  const special = c.kind === "special";
  const all: [string | null, string | null][] = [
    ["Référence", c.number],
    [special ? "Demande" : "Occasion", c.occasion],
    [special ? "Quantité" : "Personnes", c.servings],
    [special ? null : "Gâteau", special ? null : c.cakeType],
    ["Saveurs", c.flavors.length ? c.flavors.join(" / ") : null],
    ["Inscription", c.message ? `« ${c.message} »` : null],
    ["Retrait", `${formatDate(c.desiredDate)}${c.desiredTime ? " à " + formatTime(c.desiredTime) : ""} — ${site.address.street}, ${site.address.city}`],
    ["Précisions", c.comment],
  ];
  const rows = all.filter((r): r is [string, string] => !!r[0] && !!r[1]);
  const html = rows
    .map(([k, v]) => `<tr><td style="padding:8px 12px 8px 0;border-bottom:1px solid #EFE9DF;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#8A7A68;white-space:nowrap;vertical-align:top">${esc(k)}</td><td style="padding:8px 0;border-bottom:1px solid #EFE9DF;font-size:14px;color:#3A2E24">${esc(v)}</td></tr>`)
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 20px">${html}</table>`;
}

const what = (c: Pick<CustomOrder, "kind">) => (c.kind === "special" ? "commande particulière" : "gâteau sur mesure");

const pickupLine = (o: Pick<Order, "pickupDate" | "pickupTime">) =>
  `Retrait le ${formatDate(o.pickupDate)} à ${formatTime(o.pickupTime)} — ${site.address.street}, ${site.address.postalCode} ${site.address.city}.`;

const trackUrl = (o: Pick<Order, "number" | "accessToken">) => `${env.siteUrl}/commande/suivi?n=${encodeURIComponent(o.number)}&t=${o.accessToken}`;

const paymentLine = (o: Order) =>
  o.paymentMethod === "on_site"
    ? `Total : ${money(o.totalCents)} — règlement en boutique au retrait.`
    : o.amountPaidCents >= o.totalCents
      ? `Total : ${money(o.totalCents)} — payé en ligne.`
      : `Total : ${money(o.totalCents)} — acompte réglé : ${money(o.amountPaidCents)}, reste à régler en boutique : ${money(o.totalCents - o.amountPaidCents)}.`;

export const mails = {
  orderReceived: (o: Order, items: OrderItem[]) =>
    layout(
      `Commande reçue n° ${o.number}`,
      [p(`Bonjour ${o.firstName}, merci pour votre commande. Nous l’avons bien reçue et la préparons avec soin.`), itemsTable(items), p(paymentLine(o)), p(pickupLine(o))],
      { label: "Suivre ma commande", href: trackUrl(o) }
    ),
  orderConfirmed: (o: Order) =>
    layout(`Commande confirmée n° ${o.number}`, [p(`Bonjour ${o.firstName}, votre commande est confirmée.`), p(pickupLine(o))], { label: "Suivre ma commande", href: trackUrl(o) }),
  orderReady: (o: Order) =>
    layout(`Votre commande est prête`, [p(`Bonjour ${o.firstName}, votre commande n° ${o.number} est prête. Elle vous attend en boutique.`), p(pickupLine(o)), p(paymentLine(o))], { label: "Voir ma commande", href: trackUrl(o) }),
  orderCancelled: (o: Order) =>
    layout(`Commande annulée n° ${o.number}`, [p(`Bonjour ${o.firstName}, votre commande a été annulée. Pour toute question, appelez-nous${site.phone ? " au " + site.phone.display : ""}.`)]),
  customReceived: (c: CustomOrder) =>
    layout(`Demande reçue — ${what(c)}`, [
      p(`Bonjour ${c.firstName}, merci pour votre demande (${c.occasion.toLowerCase()}, ${c.servings}${c.kind === "special" ? "" : " personnes"}) pour le ${formatDate(c.desiredDate)}.`),
      p(
        c.mode === "pay"
          ? "Votre acompte est enregistré. Nous vérifions la faisabilité et revenons vers vous rapidement."
          : "Votre demande n’est pas encore une commande : nous l’étudions, puis nous vous confirmons la faisabilité et le tarif définitif."
      ),
      p(`Référence : ${c.number}`),
    ]),
  customQuote: (c: CustomOrder, link: string) => {
    const deposit = c.depositPercent ? Math.round(((c.quoteCents ?? 0) * c.depositPercent) / 100) : 0;
    return layout(
      `Votre demande est validée`,
      [
        p(`Bonjour ${c.firstName}, bonne nouvelle : nous pouvons réaliser votre ${c.kind === "special" ? "commande" : "gâteau"}. Voici le récapitulatif.`),
        customRecap(c),
        c.adminMessage ? p(c.adminMessage) : "",
        p(`Prix total : ${money(c.quoteCents ?? 0)}.`),
        p(
          deposit > 0
            ? `Pour lancer la préparation, merci de régler un acompte de ${money(deposit)} (${c.depositPercent} %). Le solde de ${money((c.quoteCents ?? 0) - deposit)} se règle au retrait.`
            : "Confirmez votre commande en ligne pour lancer la préparation. Le règlement se fait au retrait."
        ),
        p("Votre commande est confirmée dès réception de l’acompte ; vous recevez alors un email de confirmation."),
      ],
      { label: deposit > 0 ? `Régler l’acompte de ${money(deposit)}` : "Confirmer ma commande", href: link + "#payer" }
    );
  },
  customChanges: (c: CustomOrder) =>
    layout(`Votre demande — précisions`, [p(`Bonjour ${c.firstName}, nous avons besoin de quelques précisions sur votre demande ${c.number}.`), c.adminMessage ? p(c.adminMessage) : "", p(site.phone ? `Vous pouvez nous répondre par téléphone au ${site.phone.display}.` : "")]),
  customRefused: (c: CustomOrder) =>
    layout(`Votre demande`, [p(`Bonjour ${c.firstName}, nous ne pouvons malheureusement pas réaliser votre demande ${c.number} pour le ${formatDate(c.desiredDate)}.`), c.adminMessage ? p(c.adminMessage) : ""]),
  customAccepted: (c: CustomOrder, o: Order) =>
    layout(c.kind === "special" ? "Commande particulière confirmée" : "Gâteau sur mesure confirmé", [
      p(`Bonjour ${c.firstName}, votre ${c.kind === "special" ? "commande est confirmée" : "gâteau est confirmé"} : la préparation est lancée.`),
      customRecap(c),
      p(paymentLine(o)),
      p(pickupLine(o)),
    ], { label: "Suivre ma commande", href: trackUrl(o) }),
};
