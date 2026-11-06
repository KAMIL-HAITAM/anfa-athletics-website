
"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { sdk } from "../../../lib/medusa";
import SiteHeader from "../../../components/SiteHeader";
import SiteFooter from "../../../components/SiteFooter";

type CustomerProfile = {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
};

export default function AnfaProfilePage() {
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const result = await sdk.store.customer.retrieve();
        const profile = result.customer as CustomerProfile;

        if (!active) return;

        setCustomer(profile);
        setFirstName(profile.first_name ?? "");
        setLastName(profile.last_name ?? "");
        setPhone(profile.phone ?? "");
      } catch (error) {
        console.error("[ANFA ID] Could not load profile:", error);

        if (active) {
          setIsError(true);
          setFeedback(
            "Connectez-vous à votre ANFA ID pour accéder à votre profil."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadProfile();

    return () => {
      active = false;
    };
  }, []);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!customer) return;

    setSaving(true);
    setFeedback("");
    setIsError(false);

    try {
      const result = await sdk.store.customer.update({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim(),
      });

      const updatedCustomer = result.customer as CustomerProfile;

      setCustomer(updatedCustomer);
      setFirstName(updatedCustomer.first_name ?? "");
      setLastName(updatedCustomer.last_name ?? "");
      setPhone(updatedCustomer.phone ?? "");
      setFeedback("Votre profil ANFA ID a été mis à jour.");
    } catch (error) {
      console.error("[ANFA ID] Profile update failed:", error);
      setIsError(true);
      setFeedback(
        "Impossible d’enregistrer les modifications. Vérifiez votre connexion et réessayez."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="site-shell">
      <SiteHeader />

      <section className="section anfa-id-page anfa-profile-page">
        <p className="eyebrow">ANFA ATHLETICS / ANFA ID</p>
        <h1 className="cart-heading">MON PROFIL.</h1>

        <Link href="/account" className="anfa-profile-back">
          ← RETOUR À MON ANFA ID
        </Link>

        {loading ? (
          <p className="anfa-profile-message">Chargement de votre profil...</p>
        ) : !customer ? (
          <div className="anfa-profile-card">
            <p className="anfa-profile-message">{feedback}</p>
            <Link className="button button-dark" href="/account">
              ACCÉDER À ANFA ID ↗
            </Link>
          </div>
        ) : (
          <div className="anfa-profile-layout">
            <aside className="anfa-profile-intro">
              <p className="eyebrow">YOUR DETAILS / 01</p>
              <h2>Les informations qui vous suivent.</h2>
              <p>
                Gérez les informations de votre espace personnel.
                Vos modifications seront enregistrées sur votre compte ANFA ID.
              </p>
              <span className="anfa-profile-member">
                MEMBRE ANFA / {customer.id.slice(-6).toUpperCase()}
              </span>
            </aside>

            <div className="anfa-profile-card">
              <div className="anfa-profile-card-heading">
                <h2>Informations personnelles</h2>
                <span>01 — PROFILE</span>
              </div>

              <form className="anfa-id-form" onSubmit={handleSave}>
                <label>
                  Adresse e-mail
                  <input
                    type="email"
                    value={customer.email}
                    readOnly
                    aria-describedby="anfa-email-note"
                  />
                </label>

                <p id="anfa-email-note" className="anfa-profile-field-note">
                  L’adresse e-mail ne peut pas être modifiée ici.
                </p>

                <div className="anfa-id-name-fields">
                  <label>
                    Prénom
                    <input
                      name="first_name"
                      autoComplete="given-name"
                      value={firstName}
                      onChange={(event) => setFirstName(event.target.value)}
                      required
                    />
                  </label>

                  <label>
                    Nom
                    <input
                      name="last_name"
                      autoComplete="family-name"
                      value={lastName}
                      onChange={(event) => setLastName(event.target.value)}
                      required
                    />
                  </label>
                </div>

                <label>
                  Téléphone
                  <input
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="+212 ..."
                  />
                </label>

                {feedback && (
                  <p
                    className={
                      isError
                        ? "anfa-id-feedback"
                        : "anfa-profile-success"
                    }
                    role="status"
                    aria-live="polite"
                  >
                    {feedback}
                  </p>
                )}

                <button
                  type="submit"
                  className="button button-dark anfa-id-submit"
                  disabled={saving}
                >
                  {saving ? "ENREGISTREMENT..." : "ENREGISTRER LES MODIFICATIONS"}
                </button>
              </form>
            </div>
          </div>
        )}
      </section>

      <SiteFooter />
    </main>
  );
}
