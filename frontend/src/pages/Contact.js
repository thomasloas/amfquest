import { useState } from "react";
import api, { formatApiErrorDetail } from "@/lib/api";
import { toast } from "sonner";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/contact", form);
      toast.success("Votre message a bien été envoyé. Nous revenons vers vous très vite.");
      setSent(true);
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="contact-page" className="max-w-7xl mx-auto px-6 lg:px-10 py-20 grid lg:grid-cols-12 gap-12">
      <div className="lg:col-span-5">
        <div className="overline mb-4">NOUS ÉCRIRE</div>
        <h1 className="font-heading text-5xl tracking-tighter font-black text-zinc-900 leading-[1]">
          Une question ? Un projet entreprise ?
        </h1>
        <p className="text-zinc-600 mt-6">
          L'équipe AMFQUEST vous répond sous 24h ouvrées. Pour les demandes urgentes, privilégiez le téléphone.
        </p>
        <div className="mt-10 space-y-4 text-sm">
          <div>
            <div className="overline text-zinc-500">EMAIL</div>
            <div className="font-semibold text-zinc-900 mt-1">contact@amfquest.fr</div>
          </div>
          <div>
            <div className="overline text-zinc-500">ADRESSE</div>
            <div className="font-semibold text-zinc-900 mt-1">Paris, France</div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-7">
        <form onSubmit={onSubmit} data-testid="contact-form" className="border border-zinc-200 bg-white p-8 space-y-5">
          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="Nom complet" name="name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} testid="contact-name" required />
            <Field label="Email" name="email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} testid="contact-email" required />
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="Téléphone (optionnel)" name="phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} testid="contact-phone" />
            <Field label="Sujet" name="subject" value={form.subject} onChange={(v) => setForm({ ...form, subject: v })} testid="contact-subject" required />
          </div>
          <div>
            <label className="overline text-zinc-500 mb-2 block">MESSAGE</label>
            <textarea
              data-testid="contact-message"
              required
              rows={6}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="w-full border border-zinc-300 px-4 py-3 focus:outline-none focus:border-[#002FA7] focus:ring-2 focus:ring-[#002FA7]/20"
            />
          </div>
          <button data-testid="contact-submit" type="submit" disabled={loading} className="btn-primary">
            {loading ? "Envoi…" : (sent ? "Envoyer un autre message" : "Envoyer le message")}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, name, type = "text", value, onChange, testid, required }) {
  return (
    <div>
      <label className="overline text-zinc-500 mb-2 block">{label.toUpperCase()}</label>
      <input
        data-testid={testid}
        type={type}
        name={name}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-zinc-300 px-4 py-3 focus:outline-none focus:border-[#002FA7] focus:ring-2 focus:ring-[#002FA7]/20"
      />
    </div>
  );
}
