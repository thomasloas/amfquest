import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api, { formatApiErrorDetail } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Lock, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export default function Entrainement() {
  const [cats, setCats] = useState([]);
  const [params] = useSearchParams();
  const [theme, setTheme] = useState(params.get("theme") || "");
  const [count, setCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const isPremium = !!user?.subscription_active;
  const nav = useNavigate();

  useEffect(() => { api.get("/categories").then((r) => setCats(r.data)); }, []);

  const activeCat = cats.find((c) => c.key === theme);
  const lockedSelection = activeCat?.is_locked && !isPremium;
  const maxAvailable = activeCat ? (isPremium ? activeCat.question_count : activeCat.free_count) : 50;

  const start = async () => {
    if (lockedSelection) {
      toast.error("Ce thème est réservé aux abonnés Premium.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/sessions/start", {
        mode: "training",
        category: theme || null,
        count,
      });
      nav(`/quiz/${data.id}`);
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="entrainement-page" className="max-w-5xl mx-auto px-6 lg:px-10 py-16">
      <div className="overline mb-3">MODE ENTRAÎNEMENT</div>
      <h1 className="font-heading text-4xl tracking-tighter font-black">Configurez votre session.</h1>
      <p className="text-zinc-600 mt-2">Choisissez un thème (ou un mix), puis le nombre de questions.</p>

      {!isPremium && (
        <div className="mt-6 border border-[#002FA7] bg-[#EFF3FF] p-4 flex items-center justify-between gap-3 flex-wrap" data-testid="entrainement-paywall-banner">
          <p className="text-sm text-zinc-800">Formule gratuite · accès à 50 questions sur 2 thèmes. Débloquez les 2 389 questions et l'examen blanc.</p>
          <Link to="/abonnement" className="btn-primary !py-2 !px-4 text-sm"><Sparkles size={14} /> Passer Premium</Link>
        </div>
      )}

      <div className="mt-10 grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 border border-zinc-200 bg-white p-6">
          <div className="overline text-zinc-500 mb-3">THÈME</div>
          <div className="grid sm:grid-cols-2 gap-2 max-h-[480px] overflow-y-auto pr-1">
            <button
              data-testid="theme-all"
              onClick={() => setTheme("")}
              className={`text-left p-3 border ${theme === "" ? "border-[#002FA7] border-2 bg-[#EFF3FF]" : "border-zinc-200 hover:border-[#002FA7]"}`}
            >
              <div className="font-bold">{isPremium ? "Tous les thèmes" : "Mix gratuit (2 thèmes)"}</div>
              <div className="text-xs text-zinc-500">{isPremium ? "Mélange aléatoire" : "Sélection libre dans les 50 questions"}</div>
            </button>
            {cats.map((c) => {
              const locked = c.is_locked && !isPremium;
              const selected = theme === c.key;
              return (
                <button
                  key={c.key}
                  data-testid={`pick-theme-${c.key}`}
                  onClick={() => setTheme(c.key)}
                  className={`text-left p-3 border relative ${selected ? "border-[#002FA7] border-2 bg-[#EFF3FF]" : "border-zinc-200 hover:border-[#002FA7]"} ${locked ? "opacity-70" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-bold text-sm">{c.title}</div>
                    {locked && <Lock size={14} className="text-zinc-500 flex-shrink-0 mt-0.5" />}
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">
                    {isPremium ? `${c.question_count} questions` : (c.is_free_theme ? `${c.free_count} questions gratuites` : "Réservé Premium")}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-4 border border-zinc-200 bg-white p-6 self-start">
          <div className="overline text-zinc-500 mb-3">NOMBRE DE QUESTIONS</div>
          <div className="flex gap-2 flex-wrap">
            {[5, 10, 20, 30].map((n) => (
              <button
                key={n}
                data-testid={`count-${n}`}
                onClick={() => setCount(n)}
                disabled={!isPremium && n > maxAvailable}
                className={`px-4 py-2 border font-bold ${count === n ? "bg-[#002FA7] text-white border-[#002FA7]" : "border-zinc-300 hover:border-[#002FA7]"} disabled:opacity-30 disabled:cursor-not-allowed`}
              >
                {n}
              </button>
            ))}
          </div>
          {!isPremium && (
            <p className="text-xs text-zinc-500 mt-3">Plafond gratuit : {maxAvailable} questions disponibles.</p>
          )}
          {lockedSelection && (
            <div className="mt-4 border border-zinc-300 p-3 bg-zinc-50 text-xs text-zinc-700">
              Ce thème est réservé aux abonnés Premium. <Link to="/abonnement" className="text-[#002FA7] font-semibold">S'abonner →</Link>
            </div>
          )}
          <button
            data-testid="start-training"
            onClick={start}
            disabled={loading || lockedSelection}
            className="btn-primary w-full justify-center mt-8"
          >
            {loading ? "Préparation…" : "Démarrer la session"}
          </button>
        </div>
      </div>
    </div>
  );
}
