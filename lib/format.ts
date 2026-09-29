/** Formatage partagé client / serveur (fr-FR, Europe/Paris). */
const eur = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
export const money = (cents: number) => eur.format(cents / 100);

export const slugify = (v: string) =>
  v
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

/** "YYYY-MM-DD" → objet Date à midi UTC (évite tout décalage de jour). */
const noon = (d: string) => new Date(d + "T12:00:00Z");

export function formatDate(d: string, style: "long" | "short" | "day" = "long") {
  const opts: Intl.DateTimeFormatOptions =
    style === "long"
      ? { weekday: "long", day: "numeric", month: "long" }
      : style === "short"
        ? { day: "numeric", month: "short" }
        : { weekday: "short", day: "numeric" };
  return new Intl.DateTimeFormat("fr-FR", { ...opts, timeZone: "UTC" }).format(noon(d));
}

export const formatTime = (t: string) => t.replace(":", "h");
export const formatDateTime = (d: Date | string) =>
  new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Paris" }).format(new Date(d));

export const pad = (n: number, l = 2) => String(n).padStart(l, "0");

/** Valeur pour <input type="datetime-local"> exprimée en heure de Paris. */
export function toParisInput(d: Date | null) {
  if (!d) return "";
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      .formatToParts(d)
      .map((x) => [x.type, x.value])
  );
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}
