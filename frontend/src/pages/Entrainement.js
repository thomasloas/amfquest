import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api, { formatApiErrorDetail } from "@/lib/api";
import { toast } from "sonner";

export default function Entrainement() {
  const [cats, setCats] = useState([]);
  const [params] = useSearchParams();
  const [theme, setTheme] = useState(params.get("theme") || "");
  const [count, setCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  useEffect(() => { api.get("/categories").then((r) => setCats(r.data)); }, []);

  const start = async () => {
    setLoading(true);
    try {
      const { data } = await api.post("/sessions/start", { mode: "training", category: theme || null, count });
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
      <p className="text-zinc-600 mt-2">Choisissez un thème (ou laissez vide pour un mix), puis le nombre de questions.</p>

      <div className="mt-10 grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 border border-zinc-200 bg-white p-6">
          <div className="overline text-zinc-500 mb-3">THÈME</div>
          <div className="grid sm:grid-cols-2 gap-2 max-h-[420px] overflow-y-auto pr-1">
            <button
              data-testid="theme-all"
              onClick={() => setTheme("")}
              className={`text-left p-3 border ${theme === "" ? "border-[#002FA7] border-2 bg-[#EFF3FF]" : "border-zinc-200 hover:border-[#002FA7]"}`}
            >
              <div className="font-bold">Tous les thèmes</div>
              <div className="text-xs text-zinc-500">Mix aléatoire</div>
            </button>
            {cats.map((c) => (
              <button
                key={c.key}
                data-testid={`pick-theme-${c.key}`}
                onClick={() => setTheme(c.key)}
                className={`text-left p-3 border ${theme === c.key ? "border-[#002FA7] border-2 bg-[#EFF3FF]" : "border-zinc-200 hover:border-[#002FA7]"}`}
              >
                <div className="font-bold text-sm">{c.title}</div>
                <div className="text-xs text-zinc-500">{c.question_count} questions disponibles</div>
              </button>
            ))}
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
                className={`px-4 py-2 border font-bold ${count === n ? "bg-[#002FA7] text-white border-[#002FA7]" : "border-zinc-300 hover:border-[#002FA7]"}`}
              >
                {n}
              </button>
            ))}
          </div>
          <button data-testid="start-training" onClick={start} disabled={loading} className="btn-primary w-full justify-center mt-8">
            {loading ? "Préparation…" : "Démarrer la session"}
          </button>
        </div>
      </div>
    </div>
  );
}
