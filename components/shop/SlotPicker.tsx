"use client";

import { formatDate, formatTime } from "@/lib/format";
import type { PickupDay } from "@/lib/slots";

/** Choix du jour puis du créneau. Les jours fermés et les créneaux complets ne sont pas sélectionnables. */
export function SlotPicker({
  days,
  date,
  time,
  onDate,
  onTime,
  step = 15,
}: {
  days: PickupDay[];
  date: string | null;
  time: string | null;
  onDate: (d: string) => void;
  onTime: (t: string) => void;
  step?: number;
}) {
  const current = days.find((d) => d.date === date) ?? null;
  const usable = (d: PickupDay) => d.slots.some((s) => !s.full);
  const periods = current
    ? [
        { label: "Matin", slots: current.slots.filter((s) => s.time < "12:00") },
        { label: "Midi", slots: current.slots.filter((s) => s.time >= "12:00" && s.time < "15:00") },
        { label: "Après-midi & soir", slots: current.slots.filter((s) => s.time >= "15:00") },
      ].filter((p) => p.slots.length)
    : [];

  if (!days.length) return <p className="notice notice--err">Aucune date de retrait n’est disponible pour le moment.</p>;

  return (
    <div className="slots">
      <div className="days" role="radiogroup" aria-label="Jour de retrait">
        {days.map((d) => {
          const [wd, dn, ...m] = formatDate(d.date).split(" ");
          const ok = usable(d);
          return (
            <button
              key={d.date}
              type="button"
              role="radio"
              aria-checked={d.date === date}
              className="day"
              disabled={!ok}
              onClick={() => onDate(d.date)}
            >
              <span className="day-wd">{wd}</span>
              <span className="day-n">{dn}</span>
              <span className="day-m">{m.join(" ")}</span>
              <span className="day-state">{ok ? `${d.slots.filter((s) => !s.full).length} créneaux` : d.closed ? "Fermé" : "Complet"}</span>
            </button>
          );
        })}
      </div>
      {current && (
        <div className="times" role="radiogroup" aria-label="Heure de retrait">
          {periods.map((p) => (
            <div key={p.label} className="times-group">
              <span className="times-label">{p.label}</span>
              <div className="times-grid">
                {p.slots.map((s) => {
                  const [h, m] = s.time.split(":").map(Number);
                  const end = new Date(0, 0, 0, h, m + step);
                  const label = `${formatTime(s.time)} – ${String(end.getHours()).padStart(2, "0")}h${String(end.getMinutes()).padStart(2, "0")}`;
                  return (
                    <button
                      key={s.time}
                      type="button"
                      role="radio"
                      aria-checked={s.time === time}
                      className="time"
                      disabled={s.full}
                      onClick={() => onTime(s.time)}
                      title={s.full ? "Complet" : undefined}
                    >
                      {s.full ? <s>{label}</s> : label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
