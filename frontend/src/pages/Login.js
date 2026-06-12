import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { formatApiErrorDetail } from "@/lib/api";
import { toast } from "sonner";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const nav = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success("Connexion réussie");
      nav("/tableau-de-bord");
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="login-page" className="max-w-md mx-auto px-6 py-20">
      <div className="overline mb-4">CONNEXION</div>
      <h1 className="font-heading text-4xl tracking-tighter font-black">Accédez à votre espace.</h1>
      <form onSubmit={onSubmit} className="mt-10 space-y-5 border border-zinc-200 bg-white p-8">
        <div>
          <label className="overline text-zinc-500 block mb-2">EMAIL</label>
          <input data-testid="login-email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border border-zinc-300 px-4 py-3 focus:outline-none focus:border-[#002FA7] focus:ring-2 focus:ring-[#002FA7]/20" />
        </div>
        <div>
          <label className="overline text-zinc-500 block mb-2">MOT DE PASSE</label>
          <input data-testid="login-password" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full border border-zinc-300 px-4 py-3 focus:outline-none focus:border-[#002FA7] focus:ring-2 focus:ring-[#002FA7]/20" />
        </div>
        <button data-testid="login-submit" type="submit" disabled={loading} className="btn-primary w-full justify-center">
          {loading ? "Connexion…" : "Se connecter"}
        </button>
      </form>
      <p className="text-sm text-zinc-600 mt-6">
        Pas encore de compte ? <Link to="/inscription" className="text-[#002FA7] font-semibold">Créer un compte</Link>
      </p>
    </div>
  );
}
