import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api, { formatApiErrorDetail } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Clock, Lock, Target, Trophy } from "lucide-react";

export default function ExamenBlanc() {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const isPremium = !!user?.subscription_active;
  const nav = useNavigate();

  const start = async () => {
    if (!isPremium) { nav("/abonnement"); return; }
    setLoading(true);
    try {
      const { data } = await api.post("/sessions/start", { mode: "exam" });
      nav(`/quiz/${data.id}`);
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="exam-page" className="max-w-4xl mx-auto px-6 lg:px-10 py-16">
      <div className="overline mb-3">EXAMEN BLANC</div>
      <h1 className="font-heading text-5xl tracking-tighter font-black">Conditions réelles d'examen.</h1>
      <p className="text-zinc-600 mt-4 max-w-2xl">
        120 questions tirées aléatoirement parmi l'ensemble des 15 thèmes. 90 minutes au compteur. Seuil officiel de réussite : 80%.
      </p>

      <div className="mt-12 grid sm:grid-cols-3 gap-4">
        <Stat icon={Target} label="QUESTIONS" value="120" />
        <Stat icon={Clock} label="DURÉE" value="90 min" />
        <Stat icon={Trophy} label="SEUIL" value="80%" />
      </div>

      {!isPremium ? (
        <div className="mt-12 border-2 border-[#002FA7] bg-[#EFF3FF] p-8">
          <div className="flex items-center gap-3 mb-3">
            <Lock className="text-[#002FA7]" />
            <h2 className="font-heading text-2xl font-bold">Réservé aux abonnés Premium</h2>
          </div>
          <p className="text-zinc-700 max-w-2xl">L'examen blanc puise dans la totalité des 2 389 questions. Il est inclus dans la formule Premium à 19,99€/mois.</p>
          <Link to="/abonnement" data-testid="exam-cta-upgrade" className="btn-primary mt-6 inline-flex">Passer Premium</Link>
        </div>
      ) : (
        <div className="mt-12 border border-zinc-200 bg-white p-8">
          <h2 className="font-heading text-2xl font-bold">À savoir avant de démarrer</h2>
          <ul className="mt-4 space-y-2 text-sm text-zinc-700">
            <li>· Vous ne pourrez pas mettre l'examen en pause.</li>
            <li>· Si vous fermez l'onglet, le temps continue à courir.</li>
            <li>· Toutes les questions doivent être traitées avant la fin du chronomètre.</li>
            <li>· Diagnostic complet en fin de session avec correction de chaque question.</li>
          </ul>
          <button data-testid="start-exam" onClick={start} disabled={loading} className="btn-primary mt-8">
            {loading ? "Initialisation…" : "Démarrer l'examen blanc"}
          </button>
        </div>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="border border-zinc-200 bg-white p-6">
      <Icon className="text-[#002FA7]" strokeWidth={1.5} />
      <div className="overline mt-4 text-zinc-500">{label}</div>
      <div className="font-heading text-4xl font-black tracking-tighter mt-1">{value}</div>
    </div>
  );
}
