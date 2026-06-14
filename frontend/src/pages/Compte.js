import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import api, { formatApiErrorDetail } from "@/lib/api";
import { toast } from "sonner";
import { AlertTriangle, KeyRound, Mail, Trash2, XCircle } from "lucide-react";

export default function Compte() {
  const { user, refresh, logout } = useAuth();
  const nav = useNavigate();

  // Email
  const [emailForm, setEmailForm] = useState({ email: "", password: "" });
  const [emailLoading, setEmailLoading] = useState(false);
  const changeEmail = async (e) => {
    e.preventDefault();
    setEmailLoading(true);
    try {
      await api.put("/auth/email", emailForm);
      toast.success("Email mis à jour");
      setEmailForm({ email: "", password: "" });
      refresh();
    } catch (err) { toast.error(formatApiErrorDetail(err.response?.data?.detail)); }
    finally { setEmailLoading(false); }
  };

  // Password
  const [pwForm, setPwForm] = useState({ current_password: "", new_password: "" });
  const [pwLoading, setPwLoading] = useState(false);
  const changePw = async (e) => {
    e.preventDefault();
    setPwLoading(true);
    try {
      await api.put("/auth/password", pwForm);
      toast.success("Mot de passe mis à jour");
      setPwForm({ current_password: "", new_password: "" });
    } catch (err) { toast.error(formatApiErrorDetail(err.response?.data?.detail)); }
    finally { setPwLoading(false); }
  };

  // Cancel subscription
  const [cancelLoading, setCancelLoading] = useState(false);
  const cancelSub = async () => {
    if (!window.confirm("Suspendre/résilier votre accès Premium ? Vous perdrez l'accès aux entraînements.")) return;
    setCancelLoading(true);
    try {
      await api.post("/subscription/cancel");
      toast.success("Abonnement résilié");
      refresh();
    } catch (err) { toast.error(formatApiErrorDetail(err.response?.data?.detail)); }
    finally { setCancelLoading(false); }
  };

  // Reset all history
  const [resetLoading, setResetLoading] = useState(false);
  const resetAll = async () => {
    if (!window.confirm("Effacer tout l'historique de vos sessions et statistiques ? Cette action est irréversible.")) return;
    setResetLoading(true);
    try {
      const { data } = await api.post("/sessions/reset", {});
      toast.success(`${data.deleted} session(s) supprimée(s)`);
    } catch (err) { toast.error(formatApiErrorDetail(err.response?.data?.detail)); }
    finally { setResetLoading(false); }
  };

  // Delete account
  const [delForm, setDelForm] = useState({ password: "", confirm: "" });
  const [delLoading, setDelLoading] = useState(false);
  const deleteAcc = async (e) => {
    e.preventDefault();
    if (delForm.confirm !== "SUPPRIMER") { toast.error('Tapez "SUPPRIMER" pour confirmer.'); return; }
    if (!window.confirm("Cette suppression est définitive. Continuer ?")) return;
    setDelLoading(true);
    try {
      await api({ method: "DELETE", url: "/auth/me", data: { password: delForm.password } });
      toast.success("Compte supprimé");
      await logout();
      nav("/");
    } catch (err) { toast.error(formatApiErrorDetail(err.response?.data?.detail)); }
    finally { setDelLoading(false); }
  };

  return (
    <div data-testid="compte-page" className="max-w-3xl mx-auto px-6 lg:px-10 py-14 space-y-10">
      <div>
        <div className="overline mb-3">MON COMPTE</div>
        <h1 className="font-heading text-4xl tracking-tighter font-black">Paramètres et sécurité.</h1>
        <p className="text-zinc-600 mt-2 text-sm">
          Connecté en tant que <strong>{user?.email}</strong> · {user?.subscription_active ? (user?.trial_active ? "Essai 48h actif" : "Premium actif") : "Sans abonnement"}
        </p>
      </div>

      {/* Email */}
      <section className="border border-zinc-200 bg-white p-6" data-testid="section-email">
        <div className="flex items-center gap-3 mb-1"><Mail size={18} className="text-[#002FA7]" /><h2 className="font-heading text-xl font-bold">Changer mon email</h2></div>
        <p className="text-sm text-zinc-500">Une confirmation par mot de passe est requise.</p>
        <form onSubmit={changeEmail} className="mt-4 grid sm:grid-cols-2 gap-3">
          <input data-testid="new-email" type="email" required placeholder="Nouvel email" value={emailForm.email} onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })} className="border border-zinc-300 px-3 py-2" />
          <input data-testid="email-password" type="password" required placeholder="Mot de passe actuel" value={emailForm.password} onChange={(e) => setEmailForm({ ...emailForm, password: e.target.value })} className="border border-zinc-300 px-3 py-2" />
          <div className="sm:col-span-2"><button data-testid="submit-email" disabled={emailLoading} className="btn-primary !py-2 !px-4 text-sm">{emailLoading ? "…" : "Mettre à jour l'email"}</button></div>
        </form>
      </section>

      {/* Password */}
      <section className="border border-zinc-200 bg-white p-6" data-testid="section-password">
        <div className="flex items-center gap-3 mb-1"><KeyRound size={18} className="text-[#002FA7]" /><h2 className="font-heading text-xl font-bold">Changer mon mot de passe</h2></div>
        <form onSubmit={changePw} className="mt-4 grid sm:grid-cols-2 gap-3">
          <input data-testid="current-password" type="password" required placeholder="Mot de passe actuel" value={pwForm.current_password} onChange={(e) => setPwForm({ ...pwForm, current_password: e.target.value })} className="border border-zinc-300 px-3 py-2" />
          <input data-testid="new-password" type="password" required minLength={6} placeholder="Nouveau (6+ caractères)" value={pwForm.new_password} onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })} className="border border-zinc-300 px-3 py-2" />
          <div className="sm:col-span-2"><button data-testid="submit-password" disabled={pwLoading} className="btn-primary !py-2 !px-4 text-sm">{pwLoading ? "…" : "Mettre à jour le mot de passe"}</button></div>
        </form>
      </section>

      {/* Reset history */}
      <section className="border border-zinc-200 bg-white p-6" data-testid="section-reset">
        <h2 className="font-heading text-xl font-bold">Réinitialiser l'historique global</h2>
        <p className="text-sm text-zinc-600 mt-2">Supprime toutes vos sessions, scores et statistiques. La réinitialisation par thème est disponible depuis la page Historique.</p>
        <button data-testid="reset-history" onClick={resetAll} disabled={resetLoading} className="btn-secondary !py-2 !px-4 text-sm mt-4">{resetLoading ? "…" : "Effacer tout l'historique"}</button>
      </section>

      {/* Cancel subscription */}
      {user?.subscription_active && (
        <section className="border border-zinc-200 bg-white p-6" data-testid="section-cancel">
          <div className="flex items-center gap-3"><XCircle size={18} className="text-amber-600" /><h2 className="font-heading text-xl font-bold">Résilier / suspendre mon accès Premium</h2></div>
          <p className="text-sm text-zinc-600 mt-2">Votre accès se terminera immédiatement. Aucun remboursement automatique : contactez le support pour toute demande commerciale.</p>
          <button data-testid="cancel-subscription" onClick={cancelSub} disabled={cancelLoading} className="btn-secondary !py-2 !px-4 text-sm mt-4">{cancelLoading ? "…" : "Résilier"}</button>
        </section>
      )}

      {/* Delete account */}
      <section className="border-2 border-red-500 bg-red-50 p-6" data-testid="section-delete">
        <div className="flex items-center gap-3"><AlertTriangle size={18} className="text-red-600" /><h2 className="font-heading text-xl font-bold text-red-700">Supprimer mon compte</h2></div>
        <p className="text-sm text-red-700 mt-2">Action irréversible : compte, sessions, transactions seront effacés.</p>
        <form onSubmit={deleteAcc} className="mt-4 grid sm:grid-cols-2 gap-3">
          <input data-testid="delete-password" type="password" required placeholder="Mot de passe" value={delForm.password} onChange={(e) => setDelForm({ ...delForm, password: e.target.value })} className="border border-zinc-300 px-3 py-2" />
          <input data-testid="delete-confirm" type="text" required placeholder='Tapez "SUPPRIMER" pour confirmer' value={delForm.confirm} onChange={(e) => setDelForm({ ...delForm, confirm: e.target.value })} className="border border-zinc-300 px-3 py-2" />
          <div className="sm:col-span-2">
            <button data-testid="submit-delete" disabled={delLoading} className="!py-2 !px-4 text-sm bg-red-600 text-white font-bold disabled:opacity-50 flex items-center gap-2">
              <Trash2 size={14} /> {delLoading ? "Suppression…" : "Supprimer définitivement"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
