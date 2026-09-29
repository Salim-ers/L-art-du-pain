/** Calendrier en heure de Paris : les retraits sont exprimés en date locale "YYYY-MM-DD" + "HH:MM". */
const parts = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Paris",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function paris(at: Date = new Date()) {
  const p = Object.fromEntries(parts.formatToParts(at).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, minutes: Number(p.hour) * 60 + Number(p.minute) };
}

export const today = () => paris().date;

export function addDays(d: string, n: number) {
  const t = new Date(d + "T12:00:00Z");
  t.setUTCDate(t.getUTCDate() + n);
  return t.toISOString().slice(0, 10);
}

/** 0 = dimanche … 6 = samedi */
export const weekday = (d: string) => new Date(d + "T12:00:00Z").getUTCDay();

export const toMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
export const fromMinutes = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

/** Horodatage local comparable (minutes depuis l'époque, heure murale de Paris). */
export const stamp = (d: string, t: string | number) =>
  Math.round(Date.parse(d + "T00:00:00Z") / 60000) + (typeof t === "number" ? t : toMinutes(t));

export const nowStamp = () => {
  const p = paris();
  return stamp(p.date, p.minutes);
};

export function dateRange(from: string, to: string) {
  const out: string[] = [];
  for (let d = from; d <= to && out.length < 400; d = addDays(d, 1)) out.push(d);
  return out;
}

export const isIsoDate = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(Date.parse(d));

/** Bornes UTC d'une journée de Paris (pour filtrer created_at). */
export function parisDayBounds(d: string) {
  // Décalage réel de Paris ce jour-là (UTC+1 ou UTC+2).
  const probe = new Date(d + "T12:00:00Z");
  const local = paris(probe);
  const offset = local.minutes - 12 * 60;
  const start = new Date(Date.parse(d + "T00:00:00Z") - offset * 60000);
  return { start, end: new Date(start.getTime() + 24 * 3600 * 1000) };
}
