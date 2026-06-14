import { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import api, { formatApiErrorDetail } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Lock, Sparkles } from "lucide-react";

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
  const totalAvailable = theme ? (activeCat?.question_count ?? 0) : (cats.reduce((s, c) => s + (c.question_count || 0), 0));
  const presets = useMemo(() => {
    const base = [5, 10, 20, 30, 50];
    if (totalAvailable >= 100) base.push(100);
    if (totalAvailable >= 200) base.push(200);
    base.push(totalAvailable);
    return Array.from(new Set(base.filter((n) => n >= 5 && n <= totalAvailable)));
  }, [totalAvailable]);

  const start = async () => {
    if (!isPremium) { nav("/abonnement"); return; }
    setLoading(true);
    try {
      const safe = Math.max(5, Math.min(parseInt(count) || 10, totalAvailable || 5000));
      const { data } = await api.post("/sessions/start", {
        mode: "training",
        category: theme || null,
        count: safe,
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
      <p className="text-zinc-600 mt-2">Choisissez un thème (ou laissez vide pour un mix), puis le nombre de questions — jusqu'à tout le thème.</p>

      {!isPremium && (
        <div className="mt-6 border-2 border-[#002FA7] bg-[#EFF3FF] p-5 flex items-center justify-between gap-3 flex-wrap" data-testid="entrainement-paywall-banner">
          <p className="text-sm text-zinc-800">Votre essai 48h est expiré. Passez Premium pour reprendre les entraînements.</p>
          <Link to="/abonnement" className="btn-primary !py-2 !px-4 text-sm"><Sparkles size={14} /> Passer Premium</Link>
        </div>
      )}

      <div className="mt-10 grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 border border-zinc-200 bg-white p-6">
          <div className="overline text-zinc-500 mb-3">THÈME</div>
          <div className="grid sm:grid-cols-2 gap-2 max-h-[480px] overflow-y-auto pr-1">
            <button data-testid="theme-all" onClick={() => setTheme("")} className={`text-left p-3 border ${theme === "" ? "border-[#002FA7] border-2 bg-[#EFF3FF]" : "border-zinc-200 hover:border-[#002FA7]"}`}>
              <div className="font-bold">Tous les thèmes</div>
              <div className="text-xs text-zinc-500">Mélange aléatoire · {cats.reduce((s,c)=>s+c.question_count,0)} questions</div>
            </button>
            {cats.map((c) => (
              <button key={c.key} data-testid={`pick-theme-${c.key}`} onClick={() => setTheme(c.key)}
                className={`text-left p-3 border ${theme === c.key ? "border-[#002FA7] border-2 bg-[#EFF3FF]" : "border-zinc-200 hover:border-[#002FA7]"}`}>
                <div className="font-bold text-sm">{c.title}</div>
                <div className="text-xs text-zinc-500 mt-1">{c.question_count} questions disponibles</div>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 border border-zinc-200 bg-white p-6 self-start">
          <div className="overline text-zinc-500 mb-3">NOMBRE DE QUESTIONS</div>
          <div className="flex gap-2 flex-wrap">
            {presets.map((n) => (
              <button key={n} data-testid={`count-${n}`} onClick={() => setCount(n)}
                className={`px-3 py-2 border font-bold text-sm ${count === n ? "bg-[#002FA7] text-white border-[#002FA7]" : "border-zinc-300 hover:border-[#002FA7]"}`}>
                {n === totalAvailable ? `Tout (${n})` : n}
              </button>
            ))}
          </div>
          <div className="mt-4">
            <label className="overline text-zinc-500 block mb-2">OU VALEUR PERSONNALISÉE</label>
            <input
              data-testid="count-custom"
              type="number"
              min="5"
              max={totalAvailable || 5000}
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value) || 5)}
              className="w-full border border-zinc-300 px-3 py-2"
            />
            <p className="text-xs text-zinc-500 mt-1">Min 5 · Max {totalAvailable || "—"} questions disponibles.</p>
          </div>
          <button data-testid="start-training" onClick={start} disabled={loading || !isPremium} className="btn-primary w-full justify-center mt-8">
            {loading ? "Préparation…" : "Démarrer la session"}
          </button>
        </div>
      </div>
    </div>
  );
}
