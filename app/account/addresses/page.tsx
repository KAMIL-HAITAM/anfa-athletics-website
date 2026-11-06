
"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { sdk } from "../../../lib/medusa";
import SiteHeader from "../../../components/SiteHeader";
import SiteFooter from "../../../components/SiteFooter";

type CustomerAddress = {
  id: string;
  address_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  address_1?: string | null;
  address_2?: string | null;
  city?: string | null;
  province?: string | null;
  postal_code?: string | null;
  country_code?: string | null;
};

type AddressForm = {
  address_name: string;
  first_name: string;
  last_name: string;
  phone: string;
  address_1: string;
  address_2: string;
  city: string;
  province: string;
  postal_code: string;
};

const emptyForm: AddressForm = {
  address_name: "",
  first_name: "",
  last_name: "",
  phone: "",
  address_1: "",
  address_2: "",
  city: "",
  province: "",
  postal_code: "",
};

export default function AccountAddressesPage() {
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [form, setForm] = useState<AddressForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
  let active = true;

  async function fetchAddresses() {
    try {
      const result = await sdk.store.customer.listAddress({
        limit: 50,
        offset: 0,
      });

      if (!active) return;

      setAddresses(result.addresses as CustomerAddress[]);
      setAuthenticated(true);
    } catch (error) {
      if (!active) return;

      console.error("[ANFA ID] Address loading failed:", error);
      setAuthenticated(false);
      setAddresses([]);
    } finally {
      if (active) {
        setLoading(false);
      }
    }
  }

  void fetchAddresses();

  return () => {
    active = false;
  };
}, []);

  function updateField(field: keyof AddressForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function startNewAddress() {
    setForm({ ...emptyForm });
    setEditingId(null);
    setFeedback("");
    setError("");
    setFormOpen(true);
  }

  function startEditing(address: CustomerAddress) {
    setForm({
      address_name: address.address_name ?? "",
      first_name: address.first_name ?? "",
      last_name: address.last_name ?? "",
      phone: address.phone ?? "",
      address_1: address.address_1 ?? "",
      address_2: address.address_2 ?? "",
      city: address.city ?? "",
      province: address.province ?? "",
      postal_code: address.postal_code ?? "",
    });

    setEditingId(address.id);
    setFeedback("");
    setError("");
    setFormOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setFeedback("");
    setError("");

    const payload = {
      address_name: form.address_name.trim(),
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      phone: form.phone.trim(),
      address_1: form.address_1.trim(),
      address_2: form.address_2.trim() || undefined,
      city: form.city.trim(),
      province: form.province.trim() || undefined,
      postal_code: form.postal_code.trim() || undefined,
      country_code: "ma",
    };

    try {
      if (editingId) {
        await sdk.store.customer.updateAddress(editingId, payload);
      } else {
        await sdk.store.customer.createAddress(payload);
      }

      const result = await sdk.store.customer.listAddress({
        limit: 50,
        offset: 0,
      });

      setAddresses(result.addresses as CustomerAddress[]);
      setForm({ ...emptyForm });
      setEditingId(null);
      setFormOpen(false);
      setFeedback(
        editingId
          ? "Adresse mise à jour."
          : "Adresse enregistrée dans votre ANFA ID."
      );
    } catch (err) {
      console.error("[ANFA ID] Address save failed:", err);
      setError(
        "Impossible d’enregistrer cette adresse. Vérifiez les informations et réessayez."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(addressId: string) {
    const confirmed = window.confirm(
      "Supprimer cette adresse enregistrée ?"
    );

    if (!confirmed) return;

    setDeletingId(addressId);
    setFeedback("");
    setError("");

    try {
      await sdk.store.customer.deleteAddress(addressId);

      setAddresses((current) =>
        current.filter((address) => address.id !== addressId)
      );

      if (editingId === addressId) {
        setForm({ ...emptyForm });
        setEditingId(null);
        setFormOpen(false);
      }

      setFeedback("Adresse supprimée.");
    } catch (err) {
      console.error("[ANFA ID] Address deletion failed:", err);
      setError("Impossible de supprimer cette adresse. Réessayez.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="site-shell">
      <SiteHeader />

      <section className="section anfa-addresses-section">
        <Link href="/account" className="anfa-addresses-back">
          ← RETOUR À ANFA ID
        </Link>

        <div className="anfa-addresses-heading">
          <p className="eyebrow">ANFA ID / YOUR DETAILS</p>
          <h1>MES ADRESSES<span>.</span></h1>
          <p>
            Vos coordonnées de livraison, réunies en un seul endroit.
          </p>
        </div>

        {loading ? (
          <p className="anfa-addresses-message">
            Chargement de vos adresses...
          </p>
        ) : !authenticated ? (
          <div className="anfa-addresses-empty">
            <span>ANFA ID / 01</span>
            <h2>Connectez-vous pour continuer.</h2>
            <p>
              Vos adresses enregistrées sont accessibles depuis votre compte.
            </p>
            <Link href="/account" className="button button-dark">
              SE CONNECTER ↗
            </Link>
          </div>
        ) : (
          <>
            <div className="anfa-addresses-toolbar">
              <div>
                <span className="anfa-addresses-count">
                  {String(addresses.length).padStart(2, "0")}
                </span>
                <span>ADRESSE(S) ENREGISTRÉE(S)</span>
              </div>

              {!formOpen && (
                <button
                  type="button"
                  className="anfa-addresses-add"
                  onClick={startNewAddress}
                >
                  + AJOUTER UNE ADRESSE
                </button>
              )}
            </div>

            {feedback && (
              <p className="anfa-addresses-feedback" role="status">
                {feedback}
              </p>
            )}

            {error && (
              <p className="anfa-addresses-error" role="alert">
                {error}
              </p>
            )}

            {formOpen && (
              <form
                className="anfa-addresses-form"
                onSubmit={handleSubmit}
              >
                <div className="anfa-addresses-form-heading">
                  <div>
                    <span>{editingId ? "EDIT / 01" : "NEW / 01"}</span>
                    <h2>
                      {editingId
                        ? "MODIFIER L’ADRESSE."
                        : "NOUVELLE ADRESSE."}
                    </h2>
                  </div>

                  <button
                    type="button"
                    className="anfa-addresses-cancel"
                    onClick={() => {
                      setFormOpen(false);
                      setEditingId(null);
                      setForm({ ...emptyForm });
                      setError("");
                    }}
                  >
                    ANNULER ×
                  </button>
                </div>

                <label className="anfa-addresses-field">
                  Nom de l’adresse
                  <input
                    value={form.address_name}
                    onChange={(event) =>
                      updateField("address_name", event.target.value)
                    }
                    placeholder="Maison, Travail..."
                    autoComplete="off"
                    required
                  />
                </label>

                <div className="anfa-addresses-fields">
                  <label className="anfa-addresses-field">
                    Prénom
                    <input
                      value={form.first_name}
                      onChange={(event) =>
                        updateField("first_name", event.target.value)
                      }
                      autoComplete="given-name"
                      required
                    />
                  </label>

                  <label className="anfa-addresses-field">
                    Nom
                    <input
                      value={form.last_name}
                      onChange={(event) =>
                        updateField("last_name", event.target.value)
                      }
                      autoComplete="family-name"
                      required
                    />
                  </label>
                </div>

                <label className="anfa-addresses-field">
                  Téléphone
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(event) =>
                      updateField("phone", event.target.value)
                    }
                    autoComplete="tel"
                    placeholder="+212..."
                    required
                  />
                </label>

                <label className="anfa-addresses-field">
                  Adresse
                  <input
                    value={form.address_1}
                    onChange={(event) =>
                      updateField("address_1", event.target.value)
                    }
                    autoComplete="address-line1"
                    placeholder="Rue, numéro, quartier..."
                    required
                  />
                </label>

                <label className="anfa-addresses-field">
                  Complément d’adresse <span>(facultatif)</span>
                  <input
                    value={form.address_2}
                    onChange={(event) =>
                      updateField("address_2", event.target.value)
                    }
                    autoComplete="address-line2"
                    placeholder="Appartement, étage..."
                  />
                </label>

                <div className="anfa-addresses-fields">
                  <label className="anfa-addresses-field">
                    Ville
                    <input
                      value={form.city}
                      onChange={(event) =>
                        updateField("city", event.target.value)
                      }
                      autoComplete="address-level2"
                      required
                    />
                  </label>

                  <label className="anfa-addresses-field">
                    Région <span>(facultatif)</span>
                    <input
                      value={form.province}
                      onChange={(event) =>
                        updateField("province", event.target.value)
                      }
                      autoComplete="address-level1"
                    />
                  </label>
                </div>

                <div className="anfa-addresses-fields">
                  <label className="anfa-addresses-field">
                    Code postal <span>(facultatif)</span>
                    <input
                      value={form.postal_code}
                      onChange={(event) =>
                        updateField("postal_code", event.target.value)
                      }
                      autoComplete="postal-code"
                    />
                  </label>

                  <label className="anfa-addresses-field">
                    Pays
                    <input value="Maroc" readOnly />
                  </label>
                </div>

                <button
                  type="submit"
                  className="button button-dark anfa-addresses-save"
                  disabled={submitting}
                >
                  {submitting
                    ? "ENREGISTREMENT..."
                    : editingId
                      ? "ENREGISTRER LES MODIFICATIONS"
                      : "ENREGISTRER L’ADRESSE"}
                </button>
              </form>
            )}

            {!formOpen && addresses.length === 0 && (
              <div className="anfa-addresses-empty">
                <span>YOUR DETAILS / 01</span>
                <h2>Aucune adresse enregistrée.</h2>
                <p>
                  Ajoutez une adresse pour retrouver vos coordonnées plus
                  facilement lors de vos prochains achats.
                </p>
                <button
                  type="button"
                  className="button button-dark"
                  onClick={startNewAddress}
                >
                  AJOUTER MA PREMIÈRE ADRESSE ↗
                </button>
              </div>
            )}

            {!formOpen && addresses.length > 0 && (
              <div className="anfa-addresses-grid">
                {addresses.map((address, index) => (
                  <article
                    className="anfa-address-card"
                    key={address.id}
                  >
                    <div className="anfa-address-card-top">
                      <span>
                        ADDRESS / {String(index + 1).padStart(2, "0")}
                      </span>
                      <span>MAROC</span>
                    </div>

                    <h2>{address.address_name || "Mon adresse"}</h2>

                    <p>
                      {[address.first_name, address.last_name]
                        .filter(Boolean)
                        .join(" ")}
                    </p>
                    <p>{address.address_1}</p>
                    {address.address_2 && <p>{address.address_2}</p>}
                    <p>
                      {[address.postal_code, address.city]
                        .filter(Boolean)
                        .join(" ")}
                    </p>
                    {address.province && <p>{address.province}</p>}
                    {address.phone && <p>{address.phone}</p>}

                    <div className="anfa-address-card-actions">
                      <button
                        type="button"
                        onClick={() => startEditing(address)}
                      >
                        MODIFIER ↗
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(address.id)}
                        disabled={deletingId === address.id}
                      >
                        {deletingId === address.id
                          ? "SUPPRESSION..."
                          : "SUPPRIMER"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      <SiteFooter />
    </main>
  );
}
