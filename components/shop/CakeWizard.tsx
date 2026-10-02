"use client";

/* eslint-disable @next/next/no-img-element */
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { customPickupDays, submitCustom } from "@/app/(site)/actions";
import { formatDate, formatTime, money } from "@/lib/format";
import type { CakeSettings } from "@/lib/settings-shared";
import type { PickupDay } from "@/lib/slots";
import { SlotPicker } from "./SlotPicker";
import { resizeImage } from "@/lib/resize-image";

type Props = { cake: CakeSettings; modes: ("quote" | "pay")[]; depositPercent: number; step: number };

const STEPS = ["Occasion", "Personnes", "Style", "Saveurs", "Message", "Inspiration", "Date", "Précisions", "Coordonnées", "Envoi"];
const MAX_MB = 6;

export function CakeWizard({ cake, modes, depositPercent, step: slotStep }: Props) {
  const [i, setI] = useState(0);
  const [occasion, setOccasion] = useState<string | null>(null);
  const [servings, setServings] = useState<string | null>(null);
  const [type, setType] = useState<string | null>(null);
  const [flavors, setFlavors] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [days, setDays] = useState<PickupDay[] | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [contact, setContact] = useState({ firstName: "", lastName: "", phone: "", email: "" });
  const [mode, setMode] = useState<"quote" | "pay">(modes[0]);
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const top = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Occasion choisie depuis l'accueil (?occasion=…) : on passe directement à l'étape suivante.
    const pre = new URLSearchParams(window.location.search).get("occasion");
    if (pre && cake.occasions.includes(pre)) {
      setOccasion(pre);
      setI(1);
    }
    customPickupDays().then((r) => r.ok && setDays(r.days));
    try {
      const saved = JSON.parse(localStorage.getItem("adp-contact") || "null");
      if (saved) setContact((c) => ({ ...c, ...saved }));
    } catch {}
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  // Garde l’étape courante visible dans la liste défilante.
  useEffect(() => {
    top.current?.querySelector(".wiz-steps [aria-current]")?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [i]);

  const cakeType = cake.types.find((t) => t.id === type) ?? null;
  // Aucune estimation tant que la boutique n'a pas validé ses tarifs : le prix définitif est confirmé après étude.
  const estimate = cake.showEstimate && cakeType && servings ? cakeType.pricePerServingCents * (parseInt(servings, 10) || 1) : null;
  const deposit = estimate ? Math.round((estimate * depositPercent) / 100) : 0;

  const valid = [
    !!occasion,
    !!servings,
    !!type,
    flavors.length > 0,
    true,
    true,
    !!date && !!time,
    true,
    !!contact.firstName.trim() && !!contact.lastName.trim() && /\S+@\S+\.\S+/.test(contact.email) && contact.phone.replace(/\D/g, "").length >= 9,
    terms,
  ];

  const go = (n: number) => {
    setError(null);
    setI(Math.max(0, Math.min(STEPS.length - 1, n)));
    top.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const pick = async (raw: File | undefined) => {
    setError(null);
    if (!raw) return;
    const f = await resizeImage(raw);
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) return setError("Format accepté : JPG, PNG ou WEBP.");
    if (f.size > MAX_MB * 1024 * 1024) return setError(`Image trop lourde (${MAX_MB} Mo maximum).`);
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const submit = async () => {
    if (!valid.every(Boolean)) return setError("Certaines étapes sont incomplètes.");
    setBusy(true);
    setError(null);
    const fd = new FormData();
    fd.set("occasion", occasion!);
    fd.set("servings", servings!);
    fd.set("cakeType", type!);
    flavors.forEach((f) => fd.append("flavors", f));
    fd.set("message", message);
    fd.set("desiredDate", date!);
    fd.set("desiredTime", time!);
    fd.set("comment", comment);
    Object.entries(contact).forEach(([k, v]) => fd.set(k, v));
    fd.set("mode", mode);
    fd.set("acceptTerms", "on");
    if (file) fd.set("inspiration", file);
    try {
      localStorage.setItem("adp-contact", JSON.stringify(contact));
    } catch {}
    const r = await submitCustom(fd);
    if (!r.ok) {
      setBusy(false);
      return setError(r.error);
    }
    window.location.href = r.redirect;
  };

  const choice = (value: string, current: string | null, set: (v: string) => void, sub?: string) => (
    <button key={value} type="button" role="radio" aria-checked={current === value} className="opt" onClick={() => { set(value); setTimeout(() => go(i + 1), 220); }}>
      <span className="opt-title">{value}</span>
      {sub && <span className="opt-sub">{sub}</span>}
    </button>
  );

  return (
    <div className="wiz" ref={top}>
      <div className="wiz-progress" aria-hidden="true"><span style={{ width: ((i + 1) / STEPS.length) * 100 + "%" }} /></div>
      <ol className="wiz-steps" aria-label="Étapes">
        {STEPS.map((s, n) => (
          <li key={s}>
            <button type="button" onClick={() => n <= i || valid.slice(0, n).every(Boolean) ? go(n) : undefined} aria-current={n === i ? "step" : undefined} data-done={n < i && valid[n] ? "" : undefined}>
              <span>{String(n + 1).padStart(2, "0")}</span> {s}
            </button>
          </li>
        ))}
      </ol>

      <div className="wiz-body">
        <div className="wiz-panel" key={i}>
          <p className="label">Étape {i + 1} sur {STEPS.length}</p>

          {i === 0 && (
            <>
              <h2 className="h-md">Pour quelle occasion ?</h2>
              <div className="opts" role="radiogroup">{cake.occasions.map((o) => choice(o, occasion, setOccasion))}</div>
            </>
          )}

          {i === 1 && (
            <>
              <h2 className="h-md">Pour combien de personnes ?</h2>
              <div className="opts opts--num" role="radiogroup">{cake.servings.map((s) => choice(s, servings, setServings, "pers."))}</div>
              {servings === "50+" && <p className="notice">Pour plus de 50 personnes, précisez le nombre exact en commentaire : nous adapterons le devis.</p>}
            </>
          )}

          {i === 2 && (
            <>
              <h2 className="h-md">Quel style de gâteau ?</h2>
              <div className="types" role="radiogroup">
                {cake.types.map((t) => (
                  <button key={t.id} type="button" role="radio" aria-checked={type === t.id} className="type" onClick={() => { setType(t.id); setTimeout(() => go(i + 1), 220); }}>
                    <span className="type-media">{t.image ? <Image src={t.image} alt="" width={480} height={360} sizes="(min-width: 900px) 240px, 45vw" /> : null}</span>
                    <span className="type-name">{t.name}</span>
                    <span className="type-desc">{t.description}</span>
                    {cake.showEstimate && t.pricePerServingCents > 0 && <span className="type-price">env. {money(t.pricePerServingCents)} / pers.</span>}
                  </button>
                ))}
              </div>
            </>
          )}

          {i === 3 && (
            <>
              <h2 className="h-md">Quelle{cake.maxFlavors > 1 ? "s" : ""} saveur{cake.maxFlavors > 1 ? "s" : ""} ?</h2>
              <p className="wiz-hint">{cake.maxFlavors > 1 ? `Jusqu’à ${cake.maxFlavors} saveurs.` : "Une saveur."}</p>
              <div className="opts" role="group">
                {cake.flavors.map((f) => {
                  const on = flavors.includes(f);
                  return (
                    <button
                      key={f}
                      type="button"
                      aria-pressed={on}
                      className="opt"
                      disabled={!on && flavors.length >= cake.maxFlavors}
                      onClick={() => setFlavors((cur) => (on ? cur.filter((x) => x !== f) : [...cur, f]))}
                    >
                      <span className="opt-title">{f}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {i === 4 && (
            <>
              <h2 className="h-md">Un message à inscrire ?</h2>
              <label className="field">
                <span>Message sur le gâteau (facultatif, 120 caractères max.)</span>
                <input value={message} maxLength={120} onChange={(e) => setMessage(e.target.value)} placeholder="Joyeux anniversaire Sarah" />
              </label>
              {message && <p className="wiz-script" aria-hidden="true">{message}</p>}
            </>
          )}

          {i === 5 && (
            <>
              <h2 className="h-md">Une photo d’inspiration ?</h2>
              <p className="wiz-hint">Facultatif — JPG, PNG ou WEBP, {MAX_MB} Mo maximum. Visible uniquement par l’équipe.</p>
              <label className="drop" data-has={preview ? "" : undefined}>
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => pick(e.target.files?.[0])} />
                {preview ? <img src={preview} alt="Aperçu de votre photo d’inspiration" /> : <span>Choisir une photo<br /><small>ou la déposer ici</small></span>}
              </label>
              {file && (
                <button type="button" className="linkish" onClick={() => { setFile(null); setPreview(null); }}>
                  Retirer la photo
                </button>
              )}
            </>
          )}

          {i === 6 && (
            <>
              <h2 className="h-md">Pour quelle date ?</h2>
              <p className="wiz-hint">Les dates proposées tiennent compte d’un délai de {cake.minDaysNotice} jours minimum et des créneaux encore libres.</p>
              {days === null ? <div className="cart-skel cart-skel--sm" aria-busy="true" /> : (
                <SlotPicker days={days} date={date} time={time} step={slotStep} onDate={(d) => { setDate(d); setTime(null); }} onTime={setTime} />
              )}
            </>
          )}

          {i === 7 && (
            <>
              <h2 className="h-md">Des précisions ?</h2>
              <label className="field">
                <span>Décor, couleurs, allergies, nombre exact de convives… (facultatif)</span>
                <textarea rows={6} maxLength={1500} value={comment} onChange={(e) => setComment(e.target.value)} />
              </label>
            </>
          )}

          {i === 8 && (
            <>
              <h2 className="h-md">Vos coordonnées</h2>
              <div className="fields">
                {([["firstName", "Prénom", "given-name", "text"], ["lastName", "Nom", "family-name", "text"], ["phone", "Téléphone", "tel", "tel"], ["email", "Email", "email", "email"]] as const).map(([k, l, a, t]) => (
                  <label key={k} className="field">
                    <span>{l}</span>
                    <input type={t} autoComplete={a} required value={contact[k]} onChange={(e) => setContact((c) => ({ ...c, [k]: e.target.value }))} />
                  </label>
                ))}
              </div>
            </>
          )}

          {i === 9 && (
            <>
              <h2 className="h-md">Votre demande</h2>
              <p className="wiz-hint">Ce n’est pas encore une commande : nous étudions votre demande, puis nous vous confirmons la faisabilité et le tarif définitif.</p>
              <dl className="recap">
                <div><dt>Occasion</dt><dd>{occasion}</dd></div>
                <div><dt>Personnes</dt><dd>{servings}</dd></div>
                <div><dt>Gâteau</dt><dd>{cakeType?.name}</dd></div>
                <div><dt>Saveurs</dt><dd>{flavors.join(" / ")}</dd></div>
                {message && <div><dt>Message</dt><dd>« {message} »</dd></div>}
                <div><dt>Photo</dt><dd>{file ? file.name : "—"}</dd></div>
                <div><dt>Retrait</dt><dd>{date && time ? `${formatDate(date)}, ${formatTime(time)}` : "—"}</dd></div>
                {comment && <div><dt>Commentaire</dt><dd>{comment}</dd></div>}
                <div><dt>Contact</dt><dd>{contact.firstName} {contact.lastName} — {contact.phone} — {contact.email}</dd></div>
                {estimate !== null && <div className="recap-total"><dt>Estimation</dt><dd>{money(estimate)}</dd></div>}
              </dl>
              <div className="pay-options" role="radiogroup" aria-label="Mode de commande">
                {modes.includes("pay") && (
                  <label className="pay" data-on={mode === "pay" ? "" : undefined}>
                    <input type="radio" checked={mode === "pay"} onChange={() => setMode("pay")} />
                    <span className="pay-title">Payer maintenant{depositPercent < 100 ? ` un acompte de ${depositPercent} %` : ""}</span>
                    <span className="pay-sub">{estimate ? `${money(deposit)} en ligne, le solde en boutique. ` : ""}Nous vérifions ensuite la faisabilité.</span>
                  </label>
                )}
                {modes.includes("quote") && (
                  <label className="pay" data-on={mode === "quote" ? "" : undefined}>
                    <input type="radio" checked={mode === "quote"} onChange={() => setMode("quote")} />
                    <span className="pay-title">Envoyer ma demande</span>
                    <span className="pay-sub">Sans engagement : nous vous répondons par email ou par téléphone avec le tarif.</span>
                  </label>
                )}
              </div>
              <label className="check">
                <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
                <span>J’accepte les <Link href="/cgv" target="_blank" className="ulink"><span>conditions générales de vente</span></Link>.</span>
              </label>
            </>
          )}

          {error && <p className="notice notice--err" role="alert">{error}</p>}

          <div className="wiz-nav">
            {i > 0 && <button type="button" className="btn btn--dark" onClick={() => go(i - 1)}>← Retour</button>}
            {i < STEPS.length - 1 ? (
              <button type="button" className="btn btn--solid" disabled={!valid[i]} onClick={() => go(i + 1)}>
                {[4, 5, 7].includes(i) && !(i === 4 ? message : i === 5 ? file : comment) ? "Passer" : "Continuer"} →
              </button>
            ) : (
              <button type="button" className="btn btn--solid" disabled={busy || !valid.every(Boolean)} onClick={submit}>
                {busy ? "Envoi…" : mode === "pay" ? `Payer ${money(deposit)}` : "Envoyer ma demande"}
              </button>
            )}
          </div>
        </div>

        <aside className="wiz-aside" aria-label="Votre gâteau">
          <p className="label">Votre gâteau</p>
          <p className="wiz-aside-title">{cakeType?.name ?? "À composer"}</p>
          <ul>
            <li><span>Occasion</span>{occasion ?? "—"}</li>
            <li><span>Personnes</span>{servings ?? "—"}</li>
            <li><span>Saveurs</span>{flavors.length ? flavors.join(" / ") : "—"}</li>
            <li><span>Date</span>{date ? formatDate(date, "short") + (time ? " · " + formatTime(time) : "") : "—"}</li>
          </ul>
          <p className="wiz-estimate">
            {estimate !== null ? <>Estimation <strong>{money(estimate)}</strong></> : cake.showEstimate ? "L’estimation s’affiche au fil de vos choix." : "Le tarif vous est confirmé après étude de votre demande."}
          </p>
        </aside>
      </div>
    </div>
  );
}
