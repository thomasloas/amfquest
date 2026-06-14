import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import api, { formatApiErrorDetail } from "@/lib/api";
import { toast } from "sonner";
import { RotateCcw } from "lucide-react";

export default function Historique() {
  const [sessions, setSessions] = useState([]);
  const [cats, setCats] = useState([]);
  const [filter, setFilter] = useState("");

  const load = () => api.get("/sessions").then((r) => setSessions(r.data));
  useEffect(() => { load(); api.get("/categories").then((r) => setCats(r.data)); }, []);

  const filtered = useMemo(() => (filter ? sessions.filter((s) => s.category === filter) : sessions), [sessions, filter]);

  const resetTheme = async () => {
    if (!filter) return;
    const cat = cats.find((c) => c.key === filter);
    if (!window.confirm(`Effacer l'historique pour « ${cat?.title || filter} » ?`)) return;
    try {
      const { data } = await api.post("/sessions/reset", { theme: filter });
      toast.success(`${data.deleted} session(s) supprimée(s)`);
      load();
    } catch (err) { toast.error(formatApiErrorDetail(err.response?.data?.detail)); }
  };

  const resetAll = async () => {
    if (!window.confirm("Effacer tout l'historique ?")) return;
    try {
      const { data } = await api.post("/sessions/reset", {});
      toast.success(`${data.deleted} session(s) supprimée(s)`);
      load();
    } catch (err) { toast.error(formatApiErrorDetail(err.response?.data?.detail)); }
  };

  return (
    <div data-testid="history-page" className="max-w-5xl mx-auto px-6 lg:px-10 py-14">
      <div className="overline mb-3">HISTORIQUE</div>
      <h1 className="font-heading text-4xl tracking-tighter font-black">Toutes vos sessions.</h1>

      <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <label className="overline text-zinc-500">FILTRER PAR THÈME</label>
          <select data-testid="filter-theme" value={filter} onChange={(e) => setFilter(e.target.value)} className="border border-zinc-300 px-3 py-2 text-sm bg-white">
            <option value="">Tous</option>
            {cats.map((c) => <option key={c.key} value={c.key}>{c.title}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          {filter && (
            <button data-testid="reset-theme" onClick={resetTheme} className="btn-secondary !py-2 !px-4 text-sm">
              <RotateCcw size={14} /> Réinitialiser ce thème
            </button>
          )}
          <button data-testid="reset-all" onClick={resetAll} className="btn-secondary !py-2 !px-4 text-sm">
            <RotateCcw size={14} /> Tout réinitialiser
          </button>
        </div>
      </div>

      <div className="mt-6 border border-zinc-200 bg-white">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-zinc-500">
            Aucune session.<br />
            <Link to="/entrainement" className="text-[#002FA7] font-semibold">Commencer maintenant →</Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-zinc-500 text-left">
              <tr>
                <th className="p-3 font-semibold">DÉBUT</th>
                <th className="p-3 font-semibold">MODE</th>
                <th className="p-3 font-semibold">THÈME</th>
                <th className="p-3 font-semibold">SCORE</th>
                <th className="p-3 font-semibold">STATUT</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const cat = cats.find((c) => c.key === s.category);
                return (
                  <tr key={s.id} className="border-t border-zinc-200">
                    <td className="p-3">{new Date(s.started_at).toLocaleString("fr-FR")}</td>
                    <td className="p-3">
                      <span className={`inline-block px-2 py-0.5 text-xs font-bold ${s.mode === "exam" ? "bg-[#002FA7] text-white" : "bg-zinc-100 text-zinc-700"}`}>
                        {s.mode === "exam" ? "EXAMEN" : "ENTRAÎNEMENT"}
                      </span>
                    </td>
                    <td className="p-3 text-zinc-600 text-xs">{cat?.title || (s.category ? s.category : "Mix")}</td>
                    <td className="p-3 font-mono-ibm font-bold">
                      {s.finished_at ? `${s.score}/${s.total} · ${s.percent}%` : "—"}
                    </td>
                    <td className="p-3">
                      {!s.finished_at ? <span className="text-amber-600 font-semibold">En cours</span> :
                        s.passed === true ? <span className="text-green-600 font-semibold">Réussi</span> :
                        s.passed === false ? <span className="text-red-600 font-semibold">Échoué</span> :
                        <span className="text-zinc-500">Terminé</span>}
                    </td>
                    <td className="p-3 text-right">
                      {s.finished_at ?
                        <Link to={`/resultats/${s.id}`} className="text-[#002FA7] font-semibold">Détails</Link> :
                        <Link to={`/quiz/${s.id}`} className="text-[#002FA7] font-semibold">Reprendre</Link>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
