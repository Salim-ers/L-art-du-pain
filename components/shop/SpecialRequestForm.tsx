"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState, type FormEvent } from "react";
import { submitSpecial } from "@/app/(site)/actions";
import { specialRequestTypes } from "@/content/special";
import { resizeImage } from "@/lib/resize-image";

const MAX_MB = 6;
const iso = (d: Date) => d.toISOString().slice(0, 10);

/** « Une commande particulière ? » — entreprise, grande quantité, buffet… Une demande, pas une commande. */
export function SpecialRequestForm() {
  const [type, setType] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [contact, setContact] = useState({ firstName: "", lastName: "", phone: "", email: "" });
  const tomorrow = iso(new Date(Date.now() + 86400000));

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("adp-contact") || "null");
      if (saved) setContact((c) => ({ ...c, ...saved }));
    } catch {}
  }, []);
  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  const pick = async (raw: File | undefined) => {
    setError(null);
    if (!raw) return;
    const f = await resizeImage(raw);
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) return setError("Format accepté : JPG, PNG ou WEBP.");
    if (f.size > MAX_MB * 1024 * 1024) return setError(`Image trop lourde (${MAX_MB} Mo maximum).`);
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!type) return setError("Choisissez le type de demande.");
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("type", type);
    if (file) fd.set("photo", file);
    try {
      localStorage.setItem("adp-contact", JSON.stringify(contact));
    } catch {}
    const r = await submitSpecial(fd);
    if (!r.ok) {
      setBusy(false);
      return setError(r.error);
    }
    window.location.href = r.redirect;
  };

  return (
    <form className="form special" onSubmit={submit}>
      <fieldset className="special-block">
        <legend className="h-md">Votre demande</legend>
        <div className="opts" role="radiogroup" aria-label="Type de demande">
          {specialRequestTypes.map((t) => (
            <button key={t} type="button" role="radio" aria-checked={type === t} className="opt" onClick={() => setType(t)}>
              <span className="opt-title">{t}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <div className="fields">
        <label className="field">
          <span>Date souhaitée</span>
          <input type="date" name="desiredDate" required min={tomorrow} />
        </label>
        <label className="field">
          <span>Nombre de personnes ou quantité</span>
          <input name="quantity" required maxLength={60} placeholder="ex. 30 personnes, 50 croissants" />
        </label>
      </div>
      <label className="field">
        <span>Précisions</span>
        <textarea name="comment" rows={5} required minLength={5} maxLength={1500} placeholder="Ce que vous imaginez, l’heure de retrait, les allergies à prendre en compte…" />
      </label>

      <div className="special-photo">
        <span className="field-label">Une photo pour nous aider ? (facultatif — JPG, PNG ou WEBP, {MAX_MB} Mo max., vue uniquement par l’équipe)</span>
        <label className="drop drop--sm" data-has={preview ? "" : undefined}>
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => pick(e.target.files?.[0])} />
          {preview ? <img src={preview} alt="Aperçu de la photo jointe" /> : <span>Joindre une photo</span>}
        </label>
        {file && (
          <button type="button" className="linkish" onClick={() => { setFile(null); setPreview(null); }}>
            Retirer la photo
          </button>
        )}
      </div>

      <fieldset className="special-block">
        <legend className="h-md">Vos coordonnées</legend>
        <div className="fields">
          {([["firstName", "Prénom", "given-name", "text"], ["lastName", "Nom", "family-name", "text"], ["phone", "Téléphone", "tel", "tel"], ["email", "Email", "email", "email"]] as const).map(([k, l, a, t]) => (
            <label key={k} className="field">
              <span>{l}</span>
              <input name={k} type={t} autoComplete={a} required value={contact[k]} onChange={(e) => setContact((c) => ({ ...c, [k]: e.target.value }))} />
            </label>
          ))}
        </div>
      </fieldset>
      <label className="hp" aria-hidden="true">Ne pas remplir<input name="website" tabIndex={-1} autoComplete="off" /></label>

      <p className="wiz-hint">Ce n’est pas encore une commande : nous étudions votre demande, puis nous vous confirmons la faisabilité et le tarif.</p>
      {error && <p className="notice notice--err" role="alert">{error}</p>}
      <button type="submit" className="btn btn--solid" disabled={busy}>{busy ? "Envoi…" : "Envoyer ma demande"}</button>
    </form>
  );
}
