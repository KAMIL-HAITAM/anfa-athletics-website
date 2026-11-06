
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { sdk } from "../../../lib/medusa";
import SiteHeader from "../../../components/SiteHeader";
import SiteFooter from "../../../components/SiteFooter";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  function startAnotherRequest() {
  setSent(false);
  setEmail("");
  setError("");
  setSubmitting(false);
}
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await sdk.auth.resetPassword("customer", "emailpass", {
        identifier: email.trim().toLowerCase(),
      });

      // Medusa intentionally responds successfully even if the email
      // doesn't match an account, to avoid exposing registered emails.
      setSent(true);
    } catch (requestError) {
      console.error("[ANFA ID] Password reset request failed:", requestError);
      setError(
        "Impossible de lancer la demande pour le moment. Réessayez dans quelques instants."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="site-shell">
      <SiteHeader />

      <section className="section anfa-id-page anfa-password-page">
        <p className="eyebrow">ANFA ATHLETICS / ANFA ID</p>
        <h1 className="cart-heading">RÉINITIALISATION.</h1>

        <div className="anfa-password-card">
          {sent ? (
            <>
              <p className="eyebrow">PASSWORD RESET / REQUESTED</p>
              <h2>VÉRIFIEZ LA SUITE.</h2>
              <p>
                Si une demande peut être associée à cette adresse,
                les instructions de réinitialisation sont en cours de
                préparation.
              </p>
              <p className="anfa-password-dev-note">
                Mode développement : vérifiez le terminal de votre
                backend Medusa pour retrouver le lien de réinitialisation.
                Aucun e-mail réel n’est envoyé à ce stade.
              </p>
              
<div className="anfa-password-actions">
  <Link
    className="button button-dark anfa-password-button"
    href="/account"
  >
    RETOUR À LA CONNEXION <span>↗</span>
  </Link>

  <button
    type="button"
    className="anfa-password-new-request"
    onClick={startAnotherRequest}
  >
    <span>FAIRE UNE AUTRE DEMANDE</span>
    <span aria-hidden="true">↻</span>
  </button>
</div>
 
            </>
          ) : (
            <>
              <p className="eyebrow">ACCOUNT ACCESS / 01</p>
              <h2>MOT DE PASSE OUBLIÉ ?</h2>
              <p>
                Entrez l’adresse e-mail associée à votre ANFA ID pour
                lancer la réinitialisation de votre mot de passe.
              </p>

              <form
                className="anfa-id-form"
                onSubmit={handleSubmit}
              >
                <label>
                  Adresse e-mail
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder="vous@exemple.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </label>

                {error && (
                  <p className="anfa-password-error" role="alert">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  className="button button-dark anfa-id-submit"
                  disabled={submitting}
                >
                  {submitting
                    ? "DEMANDE EN COURS..."
                    : "DEMANDER UN LIEN DE RÉINITIALISATION"}
                </button>
              </form>
            </>
          )}

          <Link
            href="/account"
            className="anfa-password-back"
            onClick={startAnotherRequest}
        >
            ← RETOUR À ANFA ID
          </Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
