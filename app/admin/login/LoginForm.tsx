"use client";

import { useFormState, useFormStatus } from "react-dom";
import { login } from "../actions";

function Btn() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="abtn abtn--lg" disabled={pending}>
      {pending ? "Connexion…" : "Se connecter"}
    </button>
  );
}

export function LoginForm() {
  const [state, action] = useFormState(login, null);
  return (
    <form action={action} className="aform">
      <label className="afield">
        <span>Email</span>
        <input name="email" type="email" autoComplete="username" required autoFocus />
      </label>
      <label className="afield">
        <span>Mot de passe</span>
        <input name="password" type="password" autoComplete="current-password" required />
      </label>
      {state?.error && <p className="aerr" role="alert">{state.error}</p>}
      <Btn />
    </form>
  );
}
