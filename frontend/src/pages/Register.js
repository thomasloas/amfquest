import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { formatApiErrorDetail } from "@/lib/api";
import { toast } from "sonner";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const nav = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success("Bienvenue sur AMFQUEST");
      nav("/tableau-de-bord");
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="register-page" className="max-w-md mx-auto px-6 py-20">
      <div className="overline mb-4">INSCRIPTION</div>
      <h1 className="font-heading text-4xl tracking-tighter font-black">Créez votre compte AMFQUEST.</h1>
      <div className="mt-4 border-2 border-amber-500 bg-amber-50 p-4 text-sm text-amber-900" data-testid="trial-pitch">
        <strong>Bonus inscription :</strong> 48h d'accès Premium illimité offert (2 389 questions + examen blanc). Aucune carte bancaire requise.
      </div>
      <form onSubmit={onSubmit} className="mt-8 space-y-5 border border-zinc-200 bg-white p-8">
        <div>
          <label className="overline text-zinc-500 block mb-2">NOM COMPLET</label>
          <input data-testid="register-name" type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-zinc-300 px-4 py-3 focus:outline-none focus:border-[#002FA7] focus:ring-2 focus:ring-[#002FA7]/20" />
        </div>
        <div>
          <label className="overline text-zinc-500 block mb-2">EMAIL</label>
          <input data-testid="register-email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border border-zinc-300 px-4 py-3 focus:outline-none focus:border-[#002FA7] focus:ring-2 focus:ring-[#002FA7]/20" />
        </div>
        <div>
          <label className="overline text-zinc-500 block mb-2">MOT DE PASSE</label>
          <input data-testid="register-password" type="password" minLength={6} required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full border border-zinc-300 px-4 py-3 focus:outline-none focus:border-[#002FA7] focus:ring-2 focus:ring-[#002FA7]/20" />
          <p className="text-xs text-zinc-500 mt-1">6 caractères minimum.</p>
        </div>
        <button data-testid="register-submit" type="submit" disabled={loading} className="btn-primary w-full justify-center">
          {loading ? "Création…" : "Créer mon compte"}
        </button>
      </form>
      <p className="text-sm text-zinc-600 mt-6">
        Déjà inscrit ? <Link to="/connexion" className="text-[#002FA7] font-semibold">Se connecter</Link>
      </p>
    </div>
  );
}
