import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api, { formatApiErrorDetail } from "@/lib/api";
import { toast } from "sonner";
import { Check, Sparkles } from "lucide-react";

export default function Abonnement() {
  const { user, refresh } = useAuth();
  const [loading, setLoading] = useState(false);

  const isPremium = !!user?.subscription_active;
  const subUntil = user?.subscription_until ? new Date(user.subscription_until) : null;

  const subscribe = async () => {
    setLoading(true);
    try {
      const { data } = await api.post("/subscription/checkout", {
        origin_url: window.location.origin,
      });
      window.location.href = data.url;
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail));
      setLoading(false);
    }
  };

  return (
    <div data-testid="abonnement-page" className="max-w-5xl mx-auto px-6 lg:px-10 py-16">
      <div className="overline mb-3">ABONNEMENT</div>
      <h1 className="font-heading text-5xl tracking-tighter font-black">Passez en illimité.</h1>
      <p className="text-zinc-600 mt-4 max-w-2xl">
        Débloquez l'intégralité de la banque de 2 389 questions, tous les thèmes, et l'examen blanc chronométré.
      </p>

      {isPremium && (
        <div className="mt-8 border-2 border-[#059669] bg-green-50 p-5 flex items-center justify-between gap-4 flex-wrap" data-testid="premium-active-banner">
          <div>
            <div className="overline text-[#059669]">PREMIUM ACTIF</div>
            <p className="text-sm text-zinc-800 mt-1">Votre accès illimité est actif {subUntil ? `jusqu'au ${subUntil.toLocaleDateString("fr-FR")}` : ""}.</p>
          </div>
          <button onClick={refresh} className="btn-secondary !py-2 !px-4 text-sm">Rafraîchir</button>
        </div>
      )}

      <div className="mt-12 grid lg:grid-cols-2 gap-6">
        <div className="border border-zinc-200 bg-white p-8">
          <div className="overline text-zinc-500">GRATUIT</div>
          <div className="font-heading text-5xl font-black tracking-tighter mt-4">0€</div>
          <p className="text-zinc-600 text-sm mt-3">Pour démarrer, sans engagement.</p>
          <ul className="mt-8 space-y-3 text-sm">
            {[
              "Inscription gratuite",
              "50 questions sur 2 thèmes",
              "Correction et explications après chaque question",
              "Tableau de bord et historique",
            ].map((f) => (
              <li key={f} className="flex items-start gap-3"><Check size={16} className="text-zinc-500 mt-0.5" /><span>{f}</span></li>
            ))}
          </ul>
        </div>

        <div className="border-2 border-[#002FA7] bg-white p-8 relative">
          <div className="absolute -top-3 left-8 bg-[#002FA7] text-white text-xs font-bold tracking-wider px-3 py-1">RECOMMANDÉ</div>
          <div className="overline text-[#002FA7]">PREMIUM · ACCÈS ILLIMITÉ</div>
          <div className="font-heading text-5xl font-black tracking-tighter mt-4 flex items-baseline gap-2">
            19,99€<span className="text-base text-zinc-500 font-mono-ibm font-normal">/ 30 jours</span>
          </div>
          <p className="text-zinc-600 text-sm mt-3">Réservez votre réussite à l'examen AMF.</p>
          <ul className="mt-8 space-y-3 text-sm">
            {[
              "2 389 questions, 15 thèmes officiels",
              "Examen blanc chronométré (120 questions · 90 min · seuil 80%)",
              "Explications détaillées + sources réglementaires",
              "Statistiques de progression complètes",
              "Renouvellement libre, paiement sécurisé Stripe",
            ].map((f) => (
              <li key={f} className="flex items-start gap-3"><Check size={16} className="text-[#002FA7] mt-0.5" /><span>{f}</span></li>
            ))}
          </ul>
          <button
            data-testid="subscribe-btn"
            onClick={subscribe}
            disabled={loading}
            className="btn-primary w-full justify-center mt-8"
          >
            <Sparkles size={16} /> {loading ? "Redirection…" : (isPremium ? "Renouveler 30 jours" : "S'abonner · 19,99€")}
          </button>
          <p className="text-xs text-zinc-500 mt-3 text-center">Paiement sécurisé. Aucune reconduction automatique.</p>
        </div>
      </div>
    </div>
  );
}
