"use client";

import { useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { lookupOrder, submitContact } from "@/app/(site)/actions";

function Submit({ children }: { children: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn--solid" disabled={pending}>
      {pending ? "Un instant…" : children}
    </button>
  );
}

export function LookupForm() {
  const [state, action] = useFormState(lookupOrder, null);
  useEffect(() => {
    if (state?.ok) window.location.href = state.redirect;
  }, [state]);
  return (
    <form action={action} className="form">
      <label className="field">
        <span>Numéro de commande</span>
        <input name="number" required placeholder="2026-00145" autoComplete="off" />
      </label>
      <label className="field">
        <span>Email utilisé pour la commande</span>
        <input name="email" type="email" required autoComplete="email" />
      </label>
      {state && !state.ok && <p className="notice notice--err" role="alert">{state.error}</p>}
      <Submit>Retrouver ma commande</Submit>
    </form>
  );
}

export function ContactForm() {
  const [state, action] = useFormState(submitContact, null);
  if (state?.ok) return <p className="notice notice--ok" role="status">Merci, votre message est bien arrivé. Nous vous répondons rapidement.</p>;
  return (
    <form action={action} className="form">
      <div className="fields">
        <label className="field"><span>Nom</span><input name="name" required autoComplete="name" maxLength={120} /></label>
        <label className="field"><span>Email</span><input name="email" type="email" required autoComplete="email" /></label>
        <label className="field"><span>Téléphone (facultatif)</span><input name="phone" type="tel" autoComplete="tel" /></label>
        <label className="field"><span>Objet</span><input name="subject" maxLength={120} /></label>
      </div>
      <label className="field"><span>Message</span><textarea name="body" rows={5} required maxLength={3000} /></label>
      <label className="hp" aria-hidden="true">Ne pas remplir<input name="website" tabIndex={-1} autoComplete="off" /></label>
      {state && !state.ok && <p className="notice notice--err" role="alert">{state.error}</p>}
      <Submit>Envoyer</Submit>
    </form>
  );
}
