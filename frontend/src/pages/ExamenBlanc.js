import { useNavigate } from "react-router-dom";
import api, { formatApiErrorDetail } from "@/lib/api";
import { toast } from "sonner";
import { useState } from "react";
import { Clock, Target, Trophy } from "lucide-react";

export default function ExamenBlanc() {
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const start = async () => {
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
        120 questions tirées aléatoirement parmi l'ensemble des 12 thèmes. 90 minutes au compteur. Seuil officiel de réussite : 80%.
      </p>

      <div className="mt-12 grid sm:grid-cols-3 gap-4">
        <Stat icon={Target} label="QUESTIONS" value="120" />
        <Stat icon={Clock} label="DURÉE" value="90 min" />
        <Stat icon={Trophy} label="SEUIL" value="80%" />
      </div>

      <div className="mt-12 border border-zinc-200 bg-white p-8">
        <h2 className="font-heading text-2xl font-bold">À savoir avant de démarrer</h2>
        <ul className="mt-4 space-y-2 text-sm text-zinc-700">
          <li>· Vous ne pourrez pas mettre l'examen en pause.</li>
          <li>· Si vous fermez l'onglet, votre session reste consultable mais le temps continue à courir.</li>
          <li>· Toutes les questions doivent être traitées avant la fin du chronomètre.</li>
          <li>· À la fin, vous obtiendrez un diagnostic complet avec la correction de chaque question.</li>
        </ul>
        <button data-testid="start-exam" onClick={start} disabled={loading} className="btn-primary mt-8">
          {loading ? "Initialisation…" : "Démarrer l'examen blanc"}
        </button>
      </div>
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
