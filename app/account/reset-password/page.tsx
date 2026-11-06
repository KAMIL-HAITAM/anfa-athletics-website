"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { sdk } from "../../../lib/medusa";
import SiteHeader from "../../../components/SiteHeader";
import SiteFooter from "../../../components/SiteFooter";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!token || !email) {
      setError(
        "Ce lien de réinitialisation est incomplet. Demandez un nouveau lien."
      );
      return;
    }

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setSubmitting(true);

    try {
      await sdk.auth.updateProvider(
        "customer",
        "emailpass",
        {
          email,
          password,
        },
        token
      );

      setCompleted(true);
    } catch (resetError) {
      console.error("[ANFA ID] Password reset failed:", resetError);
      setError(
        "Le lien a peut-être expiré ou a déjà été utilisé. Demandez un nouveau lien et réessayez."
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
        <h1 className="cart-heading">NOUVEAU MOT DE PASSE.</h1>

        <div className="anfa-password-card">
          {completed ? (
            <>
              <p className="eyebrow">PASSWORD RESET / COMPLETE</p>
              <h2>ACCÈS RÉTABLI.</h2>
              <p>
                Votre mot de passe a été modifié. Vous pouvez maintenant
                vous connecter à votre ANFA ID avec votre nouveau mot
                de passe.
              </p>
              <Link
                href="/account"
                className="button button-dark anfa-password-button"
              >
                RETOUR À LA CONNEXION ↗
              </Link>
            </>
          ) : !token || !email ? (
            <>
              <h2>LIEN INVALIDE.</h2>
              <p>
                Le lien ne contient pas les informations nécessaires
                pour réinitialiser votre mot de passe.
              </p>
              <Link
                href="/account/forgot-password"
                className="button button-dark anfa-password-button"
              >
                DEMANDER UN NOUVEAU LIEN ↗
              </Link>
            </>
          ) : (
            <>
              <p className="eyebrow">ACCOUNT ACCESS / 02</p>
              <h2>CHOISISSEZ UN NOUVEAU MOT DE PASSE.</h2>
              <p className="anfa-password-email">{email}</p>

              <form
                className="anfa-id-form"
                onSubmit={handleSubmit}
              >
                <label>
                  Nouveau mot de passe
                  <input
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                </label>

                <label>
                  Confirmer le nouveau mot de passe
                  <input
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(event.target.value)
                    }
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
                    ? "MISE À JOUR..."
                    : "MODIFIER LE MOT DE PASSE"}
                </button>
              </form>
            </>
          )}

          <Link href="/account" className="anfa-password-back">
            ← RETOUR À ANFA ID
          </Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="site-shell">
          <SiteHeader />
          <section className="section anfa-id-page anfa-password-page">
            <p className="eyebrow">ANFA ATHLETICS / ANFA ID</p>
            <h1 className="cart-heading">NOUVEAU MOT DE PASSE.</h1>
            <div className="anfa-password-card">
              <p>Vérification du lien...</p>
            </div>
          </section>
          <SiteFooter />
        </main>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}